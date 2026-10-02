'use strict';

import MWNP from './mwnp.js';

export const ROUTE_ACTIONS = new Set([
    MWNP.WPTYPE.WAYPOINT,
    MWNP.WPTYPE.POSHOLD_UNLIM,
    MWNP.WPTYPE.POSHOLD_TIME,
    MWNP.WPTYPE.LAND
]);

export const END_OF_MISSION_MARKER = 0xA5;

// The single source of truth for "the flown route stops here", shared with
// js/mission_sim.js's getSimulationRoute() so the 3D terrain view and the
// kinematic simulator can't drift apart on what ends a mission.
export function routeTerminatesAt(waypoint) {
    const action = waypoint.getAction();
    return action === MWNP.WPTYPE.RTH
        || (action === MWNP.WPTYPE.LAND && !waypoint.isAttached())
        || waypoint.getEndMission() === END_OF_MISSION_MARKER;
}

function hasValidHomePosition(home) {
    if (!home?.getLat || !home?.getLon) return false;

    const lat = Number(home.getLat());
    const lon = Number(home.getLon());
    return Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0);
}

function isRouteWaypoint(waypoint) {
    return !waypoint.isAttached() && ROUTE_ACTIONS.has(waypoint.getAction());
}

function isJumpWaypoint(waypoint) {
    return waypoint.isAttached() && waypoint.getAction() === MWNP.WPTYPE.JUMP;
}

function buildMission3DPoint(waypoint) {
    const layerNumber = waypoint.getLayerNumber();
    const lat = Number(waypoint.getLatMap());
    const lon = Number(waypoint.getLonMap());
    const altitude = Number(waypoint.getAlt()) / 100;
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(altitude)) return null;

    const action = waypoint.getAction();
    return {
        number: layerNumber === 'undefined' ? waypoint.getNumber() : layerNumber,
        waypointNumber: waypoint.getNumber(),
        lat,
        lon,
        altitude,
        absoluteAltitude: (waypoint.getP3() & (1 << MWNP.P3.ALT_TYPE)) !== 0,
        action,
        isHome: false,
        isRoutePoint: ROUTE_ACTIONS.has(action),
        endsMission: false
    };
}

function buildMission3DHomePoint(home) {
    return {
        number: 'H',
        waypointNumber: null,
        lat: home.getLatMap(),
        lon: home.getLonMap(),
        altitude: Number(home.getAlt()) || 0,
        absoluteAltitude: true,
        action: 0,
        isHome: true,
        isRoutePoint: false,
        endsMission: false
    };
}

// The markers of the mission: every positional waypoint plus HOME when it is set. Attached
// actions have no position of their own; JUMP shapes the route through getMission3DFlightLegs().
export function getMission3DPoints(waypoints, home) {
    const points = [];

    waypoints.forEach((waypoint) => {
        if (!waypoint.isAttached()) {
            const point = buildMission3DPoint(waypoint);
            if (point) {
                points.push(point);
            }
        }

        if (routeTerminatesAt(waypoint) && points.length) {
            points.at(-1).endsMission = true;
        }
    });

    if (hasValidHomePosition(home)) {
        points.unshift(buildMission3DHomePoint(home));
    }

    return points;
}

// Records the leg from the current point to `number` the first time it is flown, then moves on.
function addMission3DLeg(walk, number) {
    const key = `${walk.current}->${number}`;
    if (walk.current !== null && walk.current !== number && !walk.seen.has(key)) {
        walk.seen.add(key);
        walk.legs.push({from: walk.current, to: number, jump: walk.pendingJump});
    }
    walk.pendingJump = null;
    walk.current = number;
}

// navigation.c isGeoWaypointAction(): the only actions flown to, and the only valid JUMP targets.
const GEO_ACTIONS = new Set([MWNP.WPTYPE.WAYPOINT, MWNP.WPTYPE.POSHOLD_TIME, MWNP.WPTYPE.LAND]);

// Guards against jump nestings the pass memo cannot fold; the caller then warns.
const MISSION_3D_WALK_STEP_LIMIT = 200000;

function getMission3DMissionRanges(waypoints) {
    const ranges = [];
    let start = 0;
    waypoints.forEach((waypoint, index) => {
        if (waypoint.getEndMission() === END_OF_MISSION_MARKER || index === waypoints.length - 1) {
            ranges.push({start, end: index});
            start = index + 1;
        }
    });
    return ranges;
}

// navigation.c arming check. The FC only refuses to arm with such a JUMP (an upload in flight still
// runs it), so it is not walked but reported to the caller.
function isValidMission3DJump(waypoints, range, index) {
    const relativeIndex = index - range.start;
    const target = Number(waypoints[index].getP1());
    const repeat = Number(waypoints[index].getP2());
    if (relativeIndex === 0 || !Number.isInteger(target) || !Number.isInteger(repeat) || repeat < -1) return false;
    if (target < 0 || target > range.end - range.start || Math.abs(target - relativeIndex) < 2) return false;

    const targetWaypoint = waypoints[range.start + target];
    return !targetWaypoint.isAttached() && GEO_ACTIONS.has(targetWaypoint.getAction());
}

// Only the counters of the JUMPs reachable inside a loop can change what one pass of it flies.
function getMission3DLoopJumps(simulation, jumpIndex) {
    const {range, targets} = simulation;
    const loopJumps = new Set();
    const visited = new Set();
    const pending = [targets.get(jumpIndex)];
    while (pending.length) {
        const index = pending.pop();
        if (index === jumpIndex || index > range.end || visited.has(index)) continue;
        visited.add(index);
        if (targets.has(index)) {
            loopJumps.add(index);
            pending.push(targets.get(index));
        }
        if (index < range.end) pending.push(index + 1);
    }
    return [...loopJumps].sort((a, b) => a - b);
}

function createMission3DSimulation(waypoints, range) {
    const targets = new Map();
    const counters = new Map();
    let hasInvalidJump = false;
    for (let index = range.start; index <= range.end; index++) {
        if (!isJumpWaypoint(waypoints[index])) continue;
        if (isValidMission3DJump(waypoints, range, index)) {
            targets.set(index, range.start + Number(waypoints[index].getP1()));
            counters.set(index, Number(waypoints[index].getP2()));
        } else {
            hasInvalidJump = true;
        }
    }
    const simulation = {
        range,
        hasInvalidJump,
        loopsForever: [...counters.values()].includes(-1),
        targets,
        counters,
        jumps: [...targets.keys()],
        loopJumps: new Map(),
        passes: new Map(),
        passStart: new Map(),
        loopStates: new Set(),
        restartedFrom: new Set()
    };
    simulation.jumps.forEach((index) => simulation.loopJumps.set(index, getMission3DLoopJumps(simulation, index)));
    return simulation;
}

function getMission3DCounterKey(simulation, counters) {
    return `${simulation.restartedFrom.size}|${counters.join(',')}`;
}

// A pass is decided by its loop's counters alone, so one walked before need not be flown again.
function recordMission3DPass(simulation, index, key, counters) {
    const start = simulation.passStart.get(index);
    simulation.passStart.delete(index);
    if (start === undefined || start.restarts !== simulation.restartedFrom.size) return;

    const passes = simulation.passes.get(index) ?? new Map();
    passes.set(start.key, {key, counters});
    simulation.passes.set(index, passes);
}

// Replays known passes without flying them; a cycle among them is cut short by whole periods.
function skipKnownMission3DPasses(simulation, index, counter, key) {
    const passes = simulation.passes.get(index);
    const seen = new Map();
    let remaining = counter;
    let current = key;
    let pass = null;

    while (remaining > 0 && passes?.has(current)) {
        const earlier = seen.get(current);
        if (earlier === undefined) {
            seen.set(current, remaining);
            pass = passes.get(current);
            current = pass.key;
            remaining--;
        } else {
            remaining %= earlier - remaining;
            seen.clear();
        }
    }

    if (pass) {
        simulation.loopJumps.get(index).forEach((jump, position) => {
            simulation.counters.set(jump, pass.counters[position]);
            // A pass of an inner loop that was cut short by the replay must not be recorded.
            simulation.passStart.delete(jump);
        });
    }
    return {remaining, key: current};
}

// navigation.c NAV_WP_ACTION_JUMP: -1 always jumps, 0 reloads the count and falls through, else it
// counts down and jumps. null: the mission is back in an earlier state, nothing new follows.
function decideMission3DJump(walk, simulation, index) {
    const repeat = Number(walk.waypoints[index].getP2());

    // Only an infinite JUMP lets a state come back. A replayed pass can hide that JUMP's own
    // decisions, so every decision is checked.
    if (simulation.loopsForever) {
        const state = `${index}|${getMission3DCounterKey(simulation, simulation.jumps.map((jump) => simulation.counters.get(jump)))}`;
        if (simulation.loopStates.has(state)) return null;
        simulation.loopStates.add(state);
    }

    if (simulation.counters.get(index) !== -1) {
        const counters = simulation.loopJumps.get(index).map((jump) => simulation.counters.get(jump));
        const key = getMission3DCounterKey(simulation, counters);
        recordMission3DPass(simulation, index, key, counters);
        const next = skipKnownMission3DPasses(simulation, index, simulation.counters.get(index), key);
        if (next.remaining === 0) {
            simulation.counters.set(index, repeat);
            return undefined;
        }
        simulation.counters.set(index, next.remaining - 1);
        simulation.passStart.set(index, {key: next.key, restarts: simulation.restartedFrom.size});
    }

    walk.pendingJump = {repeat};
    return simulation.targets.get(index);
}

// The firmware ends the mission here; like #2710, the points after it are still checked, as a plain
// chain in storage order without JUMPs.
function restartMission3DWalkAfter(walk, simulation, index) {
    walk.current = null;
    walk.pendingJump = null;
    if (simulation.restartedFrom.has(index)) return null;
    simulation.restartedFrom.add(index);
    return index + 1;
}

function stepMission3DWalk(walk, simulation, index) {
    const waypoint = walk.waypoints[index];
    const isLast = index === simulation.range.end;

    if (isRouteWaypoint(waypoint)) {
        addMission3DLeg(walk, waypoint.getNumber());
    } else if (simulation.targets.has(index) && !simulation.restartedFrom.size) {
        const target = decideMission3DJump(walk, simulation, index);
        if (target !== undefined) return target;
    }

    if (isLast) return null;
    return routeTerminatesAt(waypoint) ? restartMission3DWalkAfter(walk, simulation, index) : index + 1;
}

// Flies each sub-mission like navigation.c, JUMP counters included, and returns every leg once, as
// waypoint numbers; a jump leg carries its JUMP so it can be drawn apart. `truncated`: legs may be
// missing; `invalidJumps`: a JUMP the FC refuses to arm with was left out.
export function getMission3DFlightLegs(waypoints, stepLimit = MISSION_3D_WALK_STEP_LIMIT) {
    const walk = {waypoints, seen: new Set(), legs: [], current: null, pendingJump: null};
    let steps = 0;
    let invalidJumps = false;

    for (const range of getMission3DMissionRanges(waypoints)) {
        const simulation = createMission3DSimulation(waypoints, range);
        invalidJumps ||= simulation.hasInvalidJump;
        walk.current = null;
        walk.pendingJump = null;
        for (let index = range.start; index !== null; index = stepMission3DWalk(walk, simulation, index)) {
            if (++steps > stepLimit) return {legs: walk.legs, truncated: true, invalidJumps};
        }
    }

    return {legs: walk.legs, truncated: false, invalidJumps};
}

export function getMission3DPlannedHeight(point, groundHeight, homeGroundHeight) {
    if (point.isHome) return groundHeight;
    if (point.absoluteAltitude) return point.altitude;
    if (!Number.isFinite(homeGroundHeight)) return groundHeight + point.altitude;
    return homeGroundHeight + point.altitude;
}

// Turns the flown legs into polyline segments over the given points (which may be rendered
// copies, so they are matched by waypoint number). Consecutive legs chain into one segment; a
// jump leg is a segment of its own so it can be drawn in the jump colour with its repeat label.
export function getMission3DFlightSegments(points, legs) {
    const pointsByWaypointNumber = new Map(points.map((point) => [point.waypointNumber, point]));
    const segments = [];
    let segment = null;

    legs.forEach((leg) => {
        const start = pointsByWaypointNumber.get(leg.from);
        const end = pointsByWaypointNumber.get(leg.to);
        if (!start || !end) {
            segment = null;
            return;
        }
        if (leg.jump) {
            segments.push({points: [start, end], jump: leg.jump});
            segment = null;
            return;
        }
        if (segment && segment.points.at(-1) === start) {
            segment.points.push(end);
            return;
        }
        segment = {points: [start, end], jump: null};
        segments.push(segment);
    });

    return segments;
}

export function getMission3DJumpLabel(repeat) {
    return 'Repeat x' + (repeat === -1 ? ' infinite' : String(repeat));
}

export function getMission3DSamplingSpacing(edgeDistances, minimumSpacing = 30, maximumSamples = 4096) {
    const distances = edgeDistances.filter((distance) => Number.isFinite(distance) && distance > 0);
    if (!distances.length) return minimumSpacing;

    const totalDistance = distances.reduce((sum, distance) => sum + distance, 0);
    const availableSteps = Math.max(1, maximumSamples - distances.length);
    return Math.max(minimumSpacing, totalDistance / availableSteps);
}

export function getMission3DRouteRuns(samples) {
    const runs = [];

    for (let index = 1; index < samples.length; index++) {
        const previousSample = samples[index - 1];
        const sample = samples[index];
        const terrainClearanceAvailable = previousSample.terrainClearanceAvailable !== false
            && sample.terrainClearanceAvailable !== false;
        const collidesWithTerrain = terrainClearanceAvailable
            && (previousSample.clearance <= 0 || sample.clearance <= 0);
        const currentRun = runs.at(-1);

        if (currentRun?.collidesWithTerrain !== collidesWithTerrain) {
            runs.push({
                collidesWithTerrain,
                samples: [previousSample, sample]
            });
        } else {
            currentRun.samples.push(sample);
        }
    }

    return runs;
}

export function getMission3DPointLabel(point) {
    if (point.isHome) return 'H';

    const number = Number(point.number);
    return String(Number.isFinite(number) ? number + 1 : point.number);
}
