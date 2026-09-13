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

// Takes the JUMP at `index` if it still has repeats left and a usable target, and returns the
// index to continue from; -1 when the jump is not taken. A JUMP is taken as often as its repeat
// count says, an infinite one once, which already covers all of its ground.
function takeMission3DJump(walk, waypoint, index) {
    const targetNumber = walk.missionStartNumber + Number(waypoint.getP1());
    const targetIndex = walk.indexByNumber.get(targetNumber);
    const target = walk.waypoints[targetIndex];
    if (!target || !isRouteWaypoint(target) || targetNumber === walk.current) return -1;

    const repeat = Number(waypoint.getP2());
    const remaining = walk.remainingJumps.get(index) ?? (repeat === -1 ? 1 : Math.max(0, repeat));
    if (remaining <= 0) return -1;

    walk.remainingJumps.set(index, remaining - 1);
    walk.pendingJump = {repeat};
    return targetIndex;
}

// Walks the mission the way the firmware flies it and returns every leg in the order it is first
// flown, as pairs of waypoint storage numbers. Waypoints a forward jump skips get no legs and a
// jump with zero repeats adds none. The leg a jump adds from the point it is attached to into its
// target carries the jump, so the caller can draw it apart. RTH, LAND and the sub-mission end
// marker close the current chain; points after them start a new one, like the 2D editor draws
// them. `maximumSteps` bounds the walk against malformed jump loops.
export function getMission3DFlightLegs(waypoints, maximumSteps = waypoints.length * 64) {
    const walk = {
        waypoints,
        indexByNumber: new Map(waypoints.map((waypoint, index) => [waypoint.getNumber(), index])),
        remainingJumps: new Map(),
        seen: new Set(),
        legs: [],
        current: null,
        pendingJump: null,
        missionStartNumber: 0
    };
    let index = 0;

    for (let steps = 0; index < waypoints.length && steps < maximumSteps; steps++) {
        const waypoint = waypoints[index];

        if (isRouteWaypoint(waypoint)) {
            addMission3DLeg(walk, waypoint.getNumber());
        } else if (isJumpWaypoint(waypoint) && walk.current !== null) {
            const targetIndex = takeMission3DJump(walk, waypoint, index);
            if (targetIndex >= 0) {
                index = targetIndex;
                continue;
            }
        }

        if (routeTerminatesAt(waypoint)) {
            walk.current = null;
            walk.pendingJump = null;
        }
        if (waypoint.getEndMission() === END_OF_MISSION_MARKER) walk.missionStartNumber = waypoint.getNumber() + 1;
        index++;
    }

    return walk.legs;
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
