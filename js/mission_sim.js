'use strict';

/*
 * Kinematic model of how a fixed wing flies a waypoint mission.
 *
 * This is deliberately NOT a flight dynamics simulation: no aerodynamics, no PID
 * loops, no inertia. It models the one thing a straight line between waypoints
 * cannot show — that the aircraft steers towards its target at a limited turn
 * rate, so it rounds every corner and overshoots the ones it cannot make.
 *
 * The standing assumption is perfect path following: bank goes straight to
 * whatever the commanded radius needs and is capped at nav_fw_bank_angle. In the
 * firmware that angle is the saturation limit of a PID loop
 * (navigation_fixedwing.c:545-553), not a commanded value, and the loop steers at
 * a virtual point ahead of the aircraft rather than at the waypoint itself. Real
 * turns therefore enter and leave more slowly than the ones modelled here. That
 * is the accuracy ceiling of this module and it belongs in any UI built on it.
 *
 * The module is pure: no DOM, no OpenLayers, no Cesium. That keeps it testable
 * under `node --test`, the same way js/mission_3d.js is.
 */

import MWNP from './mwnp.js';
import { ROUTE_ACTIONS } from './mission_3d.js';

const EARTH_RADIUS_M = 6371000;
const GRAVITY_MSS = 9.81;

const END_MISSION_MARKER = 0xA5;

/*
 * The waypoints an aircraft actually flies through, as plain coordinates.
 *
 * Same route definition the 3D view uses, so both show the same mission. Only
 * the first mission is returned: a multi-mission file ends each one with the
 * end-of-mission marker, and the flight controller flies one at a time.
 */
export function getSimulationRoute(waypoints) {
    const route = [];

    for (const waypoint of waypoints) {
        // RTH ends the mission: the firmware leaves waypoint mode there and flies
        // home, so anything after it is never flown as part of the route.
        if (waypoint.getAction() === MWNP.WPTYPE.RTH) break;

        if (!waypoint.isAttached() && ROUTE_ACTIONS.has(waypoint.getAction())) {
            const lat = Number(waypoint.getLatMap());
            const lon = Number(waypoint.getLonMap());

            if (Number.isFinite(lat) && Number.isFinite(lon)) {
                route.push({
                    lat,
                    lon,
                    number: waypoint.getNumber(),
                    action: waypoint.getAction(),
                    altCm: Number(waypoint.getAlt()) || 0,
                    multiMissionIdx: Number(waypoint.getMultiMissionIdx?.()) || 0,
                    // P3 bit 0: altitude is above mean sea level rather than above home.
                    absoluteAltitude: (Number(waypoint.getP3()) & (1 << MWNP.P3.ALT_TYPE)) !== 0
                });
            }
        }

        // A landing ends the mission wherever it sits, not just at the end.
        if (waypoint.getAction() === MWNP.WPTYPE.LAND && !waypoint.isAttached()) break;
        if (waypoint.getEndMission() === END_MISSION_MARKER) break;
    }

    return route;
}

/*
 * Altitudes the simulation can work with: metres above home.
 *
 * That is the frame INAV navigates in — posControl positions are centimetres
 * above the home point. A waypoint marked absolute carries an AMSL figure and
 * only becomes usable once the home elevation is known; without it the point
 * keeps its own number rather than silently landing in the wrong frame, and the
 * caller is told through the returned flag.
 */
export function resolveRouteAltitudes(route, homeAltM) {
    const homeKnown = Number.isFinite(homeAltM);
    // An absolute waypoint carries an AMSL figure. With the home elevation known it
    // converts to the above-home frame; without it the figure has to stay as it is,
    // and the caller must be told, because the two frames are hundreds of metres
    // apart and adding a ground reference to an AMSL height counts it twice.
    const absolute = !homeKnown && route.some((point) => point.absoluteAltitude);

    return {
        homeKnown,
        absolute,
        route: route.map((point) => ({
            ...point,
            altM: point.absoluteAltitude && homeKnown
                ? point.altCm / 100 - homeAltM
                : point.altCm / 100
        }))
    };
}

const toRadians = (degrees) => degrees * Math.PI / 180;
const toDegrees = (radians) => radians * 180 / Math.PI;

/*
 * Guards for values arriving from settings, files and input fields.
 *
 * They state what the code needs — a real, usable number — instead of leaning on
 * how NaN compares. A bare `value <= 0` would wave NaN through, and `!(value > 0)`
 * catches NaN but still admits Infinity; both then travel into the geometry and
 * come back out as a mission of unusable samples.
 */
const isPositive = (value) => Number.isFinite(value) && value > 0;
const exceeds = (value, floor) => Number.isFinite(value) && Number.isFinite(floor) && value > floor;

// Signed difference between two headings, in [-180, 180). An exact course
// reversal comes back as -180, so the aircraft always picks the same side
// rather than depending on rounding.
export function headingDifference(fromDeg, toDeg) {
    return ((toDeg - fromDeg + 540) % 360) - 180;
}

export function normalizeHeading(degrees) {
    return ((degrees % 360) + 360) % 360;
}

export function distanceBetween(from, to) {
    const fromLat = toRadians(from.lat);
    const toLat = toRadians(to.lat);
    const deltaLat = toRadians(to.lat - from.lat);
    const deltaLon = toRadians(to.lon - from.lon);

    const a = Math.sin(deltaLat / 2) ** 2
        + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) ** 2;

    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function bearingBetween(from, to) {
    const fromLat = toRadians(from.lat);
    const toLat = toRadians(to.lat);
    const deltaLon = toRadians(to.lon - from.lon);

    const y = Math.sin(deltaLon) * Math.cos(toLat);
    const x = Math.cos(fromLat) * Math.sin(toLat)
        - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLon);

    return normalizeHeading(toDegrees(Math.atan2(y, x)));
}

export function destination(from, bearingDeg, distanceM) {
    const lat = toRadians(from.lat);
    const lon = toRadians(from.lon);
    const bearing = toRadians(bearingDeg);
    const delta = distanceM / EARTH_RADIUS_M;

    const latNew = Math.asin(
        Math.sin(lat) * Math.cos(delta) + Math.cos(lat) * Math.sin(delta) * Math.cos(bearing)
    );
    const lonNew = lon + Math.atan2(
        Math.sin(bearing) * Math.sin(delta) * Math.cos(lat),
        Math.cos(delta) - Math.sin(lat) * Math.sin(latNew)
    );

    return {lat: toDegrees(latNew), lon: toDegrees(lonNew)};
}

/*
 * Radius of a level coordinated turn: r = v^2 / (g * tan(bank)).
 *
 * INAV also holds nav_fw_loiter_radius. Either one can be the wider of the two
 * depending on the setup, and the wider one is what the aircraft actually
 * flies; see effectiveTurnRadius().
 */
export function turnRadius(speedMs, bankAngleDeg) {
    if (!isPositive(speedMs) || !isPositive(bankAngleDeg) || bankAngleDeg >= 90) return Infinity;
    return (speedMs * speedMs) / (GRAVITY_MSS * Math.tan(toRadians(bankAngleDeg)));
}

export const TurnSmoothing = Object.freeze({
    OFF: 'off',
    ON: 'on',
    CUT: 'cut'
});

/*
 * The radius flown through a corner: always the bank-limited one.
 *
 * With nav_fw_wp_turn_smoothing OFF — the firmware default — that is exactly
 * right: the smoothing block never runs (navigation.c only computes the turn
 * angle when the setting is not OFF) and nav_fw_loiter_radius plays no part.
 *
 * With ON or ON-CUT the firmware ANTICIPATES the corner — it starts the turn
 * roughly a loiter radius before the waypoint and curves through or inside it
 * (navigation_fixedwing.c:341-375). Simply widening the radius here would do the
 * opposite: turn late and swing wide, putting the track further outside the
 * corner than the aircraft ever goes. Modelling anticipation properly is a piece
 * of work in its own right, so until then the bank-limited turn stands for every
 * mode and the difference is stated in the UI rather than drawn wrongly.
 */
export function commandedTurnRadius(speedMs, bankAngleDeg, loiterRadiusM, smoothing = TurnSmoothing.OFF) {
    return turnRadius(speedMs, bankAngleDeg);
}

export function turnRateDegPerSecond(speedMs, radiusM) {
    if (!isPositive(radiusM) || !isPositive(speedMs)) return 0;
    return toDegrees(speedMs / radiusM);
}

/*
 * The bank a given rate of turn asks for: tan(bank) = omega * v / g.
 *
 * Steering towards a target means turning a little all the time, so this is what
 * separates a real turn from a course correction. Reporting the configured bank
 * angle for every heading change instead would mark the whole mission as one long
 * turn and put the aircraft at full bank on a straight leg.
 */
export function bankForTurnRate(rateDegPerSecond, speedMs) {
    if (!isPositive(speedMs) || !rateDegPerSecond) return 0;
    return toDegrees(Math.atan2(toRadians(rateDegPerSecond) * speedMs, GRAVITY_MSS));
}

export const ApproachDirectionLeft = 0;

/*
 * Firmware defaults from src/main/fc/settings.yaml, used when planning offline.
 * A planner with no flight controller attached still has to draw something, and
 * silently using zero would make the approach disappear without saying why.
 */
export const FirmwareDefaults = Object.freeze({
    approachLengthCm: 35000,
    loiterRadiusCm: 7500,
    bankAngleDeg: 35,
    waypointRadiusCm: 100
});

export const LandingApproachProblem = Object.freeze({
    NO_HEADING: 'no-heading',
    NO_APPROACH_LENGTH: 'no-approach-length',
    NO_HOME_ELEVATION: 'no-home-elevation',
    ALTITUDES_IMPLAUSIBLE: 'altitudes-implausible'
});

/*
 * The three waypoints INAV builds for a fixed wing landing, straight from
 * navigation.c:2428-2453. All of it is plain geometry, so this reproduces the
 * commanded approach exactly rather than approximating it.
 *
 *   finalApproachAlt = approach altitude / 3 * 2
 *   LAND    one approach length BEYOND the touchdown point, at
 *           landAlt - finalApproachAlt — deliberately below ground, so the glide
 *           path runs through the touchdown point instead of levelling off short
 *   FINAL   one approach length BEFORE it, at finalApproachAlt
 *   TURN    offset sideways from FINAL by max(loiter radius * 4, approach length / 2),
 *           at the full approach altitude
 *
 * Flown in the order TURN, FINAL, LAND. Returns null when no landing heading is
 * configured: the firmware then sets up no approach at all (navigation.c:1848)
 * and simply circles down onto the point.
 */
export function buildLandingApproach(landPoint, approach, params) {
    const heading = landingHeading(approach);
    if (heading === null) return null;

    const approachLengthM = (params.approachLengthCm ?? 0) / 100;
    // The loiter radius only widens the turn point's offset; an unusable value
    // must not poison the geometry with NaN coordinates.
    const loiterRadiusM = isPositive((params.loiterRadiusCm ?? 0) / 100)
        ? (params.loiterRadiusCm ?? 0) / 100
        : 0;
    if (!isPositive(approachLengthM)) return null;

    /*
     * Altitude frames. The approach's figures are AMSL when isSeaLevelRef is set,
     * otherwise above home. The track flies above home when the home elevation is
     * known, in the route's own frame otherwise (params.routeFrameAbsolute).
     *
     * With the home elevation known everything converts exactly, and the firmware's
     * one-third rule runs on centimetres above home as it does on the aircraft.
     * Without it, the approach can still be placed when it shares the route's
     * frame — an AMSL approach on an AMSL route is anchored at its own landing
     * altitude, which sits on the ground where the aircraft touches down, so the
     * shape is right and only the one-third split can differ from the
     * home-anchored firmware rule. What cannot be done honestly is bridging two
     * DIFFERENT frames with no home elevation: the one-third rule on a raw AMSL
     * figure yields a final below the ground and a glide handover hundreds of
     * metres early. That case is refused.
     */
    const homeKnown = Number.isFinite(params.homeAltM);
    const approachIsAmsl = Boolean(approach.isSeaLevelRef);
    if (!homeKnown && approachIsAmsl !== Boolean(params.routeFrameAbsolute)) return null;
    if (!exceeds(approach.approachAltCm, approach.landAltCm)) return null;

    // aglCm: height used by the firmware's one-third rule. frameCm: value in the
    // frame the track is drawn in. baseCm re-anchors AGL heights into that frame.
    const aglCm = approachIsAmsl
        ? (homeKnown
            ? (centimetres) => centimetres - params.homeAltM * 100
            : (centimetres) => centimetres - approach.landAltCm)
        : (centimetres) => centimetres;
    const frameCm = approachIsAmsl && homeKnown
        ? (centimetres) => centimetres - params.homeAltM * 100
        : (centimetres) => centimetres;

    const approachAglCm = aglCm(approach.approachAltCm);
    const landAglCm = aglCm(approach.landAltCm);
    // Whole-centimetre integer division, as in the firmware.
    const finalAglCm = Math.trunc(approachAglCm / 3) * 2;
    const baseCm = frameCm(approach.landAltCm) - landAglCm;

    const approachAltM = (baseCm + approachAglCm) / 100;
    const finalApproachAltM = (baseCm + finalAglCm) / 100;
    const landAltM = (baseCm + landAglCm) / 100;

    const sideBearing = approach.approachDirection === ApproachDirectionLeft
        ? normalizeHeading(heading - 90)
        : normalizeHeading(heading + 90);

    const final = destination(landPoint, normalizeHeading(heading + 180), approachLengthM);
    const turn = destination(final, sideBearing, Math.max(loiterRadiusM * 4, approachLengthM / 2));
    const land = destination(landPoint, heading, approachLengthM);

    return {
        heading,
        points: [
            {...turn, altM: approachAltM, name: 'turn', action: MWNP.WPTYPE.LAND, isApproach: true},
            {...final, altM: finalApproachAltM, name: 'final', action: MWNP.WPTYPE.LAND, isApproach: true},
            {
                ...land,
                altM: (baseCm + landAglCm - finalAglCm) / 100,
                name: 'land',
                action: MWNP.WPTYPE.LAND,
                isApproach: true,
                // The commanded slope aims below ground on purpose, so it keeps
                // descending through the touchdown point instead of levelling off
                // short. The firmware hands over to its pitch-held glide phase on
                // the way down; the simulation stops there rather than pretending
                // to know what happens in the last couple of metres.
                stopAtAltM: landAltM
            }
        ]
    };
}

/*
 * Which way the aircraft lands. A heading of zero means "not set"; a negative one
 * means the reciprocal is excluded, and the firmware takes its magnitude either
 * way. With both headings set the firmware picks by wind, which the planner
 * cannot know, so the first configured one is used and the caller says so.
 */
export function landingHeading(approach) {
    const first = Math.abs(Number(approach?.landHeading1) || 0);
    const second = Math.abs(Number(approach?.landHeading2) || 0);

    if (first) return normalizeHeading(first);
    if (second) return normalizeHeading(second);
    return null;
}

/*
 * Replace every landing waypoint with the approach the flight controller will
 * actually fly. A landing whose approach carries no heading is left as a plain
 * point — that is what the firmware does too — and reported so the planner can
 * say why nothing changed rather than leaving the pilot to wonder.
 */
export function withLandingApproaches(route, approachFor, params) {
    const expanded = [];
    const landingsWithoutApproach = [];

    for (const point of route) {
        if (point.action !== MWNP.WPTYPE.LAND) {
            expanded.push(point);
            continue;
        }

        const approach = approachFor(point) ?? {};
        const built = buildLandingApproach(point, approach, params);
        if (!built) {
            landingsWithoutApproach.push({
                number: point.number,
                reason: landingApproachProblem(approach, params)
            });
            expanded.push(point);
            continue;
        }

        expanded.push(...built.points.map((approachPoint) => ({
            ...approachPoint,
            number: point.number,
            landingHeading: built.heading
        })));
    }

    return {route: expanded, landingsWithoutApproach};
}

/*
 * Why no approach could be built. Saying "no landing heading" when the approach
 * length is what is missing sends the pilot to the wrong setting.
 */
export function landingApproachProblem(approach, params) {
    if (landingHeading(approach) === null) return LandingApproachProblem.NO_HEADING;
    if (!isPositive(params.approachLengthCm ?? 0)) return LandingApproachProblem.NO_APPROACH_LENGTH;
    if (!Number.isFinite(params.homeAltM)
        && Boolean(approach.isSeaLevelRef) !== Boolean(params.routeFrameAbsolute)) {
        return LandingApproachProblem.NO_HOME_ELEVATION;
    }
    return LandingApproachProblem.ALTITUDES_IMPLAUSIBLE;
}

export const SimPhase = Object.freeze({
    CRUISE: 'cruise',
    TURN: 'turn',
    APPROACH: 'approach'
});

/*
 * The track split into stretches of one phase, as index ranges into `samples`.
 * Consecutive runs share their boundary sample so the drawn lines join without
 * gaps. Both map views colour the track by phase, so they share this split.
 */
export function phaseRuns(samples) {
    const runs = [];
    if (!samples?.length) return runs;

    let start = 0;
    for (let index = 1; index <= samples.length; index++) {
        if (index === samples.length || samples[index].phase !== samples[start].phase) {
            runs.push({phase: samples[start].phase, from: start, to: Math.min(index, samples.length - 1)});
            start = index;
        }
    }
    return runs;
}

export const SimEvent = Object.freeze({
    REACHED: 'reached',      // came within the acceptance radius
    OVERSHOT: 'overshot',    // flew past it and gave up on reaching it
    ABANDONED: 'abandoned',  // circled without getting closer — leg is not flyable
    GLIDE: 'glide'           // reached landing altitude; the glide phase takes over
});

const DEFAULT_PARAMS = {
    // Cruise speed is an ESTIMATE, never a value read from the flight controller.
    // INAV's getActiveSpeed() is multicopter-only (navigation.c:4285-4287) and a
    // fixed wing flies open-loop cruise throttle, so nav_auto_speed,
    // nav_max_auto_speed and the per-waypoint p1 speed have no effect on it.
    // nav_fw_cruise_speed exists but is documented as a value for flight-time and
    // distance estimation, not as a command. Radius goes with the square of this
    // number, so it is the most sensitive input in the whole model.
    speedMs: 15,
    bankAngleDeg: 35,
    loiterRadiusM: 0,
    turnSmoothing: TurnSmoothing.OFF,
    waypointRadiusM: 8,
    timeStepS: 0.1,
    maxDurationS: 3600
};

// A waypoint counts as passed once the bearing to it has swung this far away
// from the leg's own bearing (navigation.c:3062-3064).
const PASS_ANGLE_DEG = 100;

// Below this bank the aircraft is holding a course, not turning.
const TURN_BANK_THRESHOLD_DEG = 5;

// The leg's target altitude is reached once 90% of its initial length is behind
// the aircraft, and held for the rest (navigation.c:2044 and 2511).
const ALTITUDE_RAMP_FRACTION = 0.9;

/*
 * Commanded altitude part-way along a leg.
 *
 * The firmware ramps linearly on REMAINING distance, so a leg that starts far out
 * arrives at its altitude with a tenth of the distance still to run. Interpolating
 * evenly over the whole leg instead would show the aircraft arriving level when it
 * is in fact still climbing.
 */
export function altitudeAlongLeg(startAltM, targetAltM, initialDistanceM, remainingDistanceM) {
    if (!isPositive(initialDistanceM)) return targetAltM;

    const travelled = initialDistanceM - Math.max(0, remainingDistanceM);
    const progress = Math.min(1, Math.max(0, travelled / (initialDistanceM * ALTITUDE_RAMP_FRACTION)));
    return startAltM + (targetAltM - startAltM) * progress;
}

/*
 * Fly a list of {lat, lon} points and return the ground track.
 *
 * The guidance rule is the one INAV uses in its simplest form: steer towards the
 * active waypoint, limited by the turn rate.
 *
 * A waypoint is done once the aircraft is inside the acceptance radius, or once
 * the bearing to it has swung more than 100 degrees away from the LEG's bearing —
 * the line from the previous waypoint to this one, fixed when the waypoint became
 * active (navigation.c:4224-4229, 3062-3064). Measuring that angle from the
 * aircraft's own position instead would move every switch point after the first
 * corner, which is exactly where anyone looks.
 */
export function simulateGroundTrack(points, params = {}) {
    const config = {...DEFAULT_PARAMS, ...params};
    const {speedMs, waypointRadiusM, timeStepS, maxDurationS} = config;

    // The reduced 60 degree limit only applies while the firmware is actually in a
    // smoothing turn, which this model never enters, so the plain limit stands.
    const passAngleDeg = PASS_ANGLE_DEG;
    const radiusM = commandedTurnRadius(
        speedMs, config.bankAngleDeg, config.loiterRadiusM, config.turnSmoothing
    );
    const turnRate = turnRateDegPerSecond(speedMs, radiusM);
    const stepM = speedMs * timeStepS;

    const samples = [];
    const events = [];
    const warnings = [];

    if (points.length < 2 || !isPositive(speedMs) || !isPositive(timeStepS)) {
        return {samples, events, warnings, summary: emptySummary(radiusM)};
    }

    let position = {lat: points[0].lat, lon: points[0].lon};
    // Two coincident points give atan2(0, 0) — due north — and the aircraft would
    // set off on a heading nobody asked for. Take the first point that is somewhere
    // else instead.
    const firstDistinct = points.find((point) => distanceBetween(points[0], point) > 0) ?? points[1];
    let heading = bearingBetween(points[0], firstDistinct);
    let targetIndex = 1;
    let elapsedS = 0;
    let travelledM = 0;
    let maxTurnSeen = 0;

    // A leg that needs more room than one full circle plus its own length is one
    // the aircraft cannot fly; without this the integrator would orbit forever.
    let legBudgetM = legBudget(points[0], points[1], radiusM);
    let legTravelledM = 0;
    // Fixed when the waypoint becomes active, and held until the next switch.
    let legBearing = bearingBetween(points[0], firstDistinct);
    // The altitude ramp runs on the leg's initial length, so both are held too.
    let legInitialDistanceM = distanceBetween(points[0], points[1]);
    let legStartAltM = altitudeOf(points[0], points[1]);
    let altitudeM = legStartAltM;

    samples.push(sample(0, position, heading, 0, altitudeM, SimPhase.CRUISE, targetIndex));

    while (targetIndex < points.length && elapsedS < maxDurationS) {
        const target = points[targetIndex];
        const distanceM = distanceBetween(position, target);
        const bearingToTarget = bearingBetween(position, target);
        const offCourse = headingDifference(heading, bearingToTarget);
        const relativeBearing = headingDifference(legBearing, bearingToTarget);

        const done = waypointOutcome({
            distanceM, relativeBearing, legTravelledM, waypointRadiusM, passAngleDeg, legBudgetM
        });

        if (done) {
            events.push({t: elapsedS, type: done, waypointIndex: targetIndex, distanceM});
            const warning = waypointWarning(done, target, targetIndex, distanceM, radiusM, elapsedS);
            if (warning) warnings.push(warning);

            targetIndex += 1;
            if (targetIndex < points.length) {
                legBearing = bearingBetween(points[targetIndex - 1], points[targetIndex]);
                legBudgetM = legBudget(position, points[targetIndex], radiusM);
                legTravelledM = 0;
                legInitialDistanceM = distanceBetween(position, points[targetIndex]);
                legStartAltM = altitudeM;
            }
            continue;
        }

        const turnThisStep = clamp(offCourse, -turnRate * timeStepS, turnRate * timeStepS);
        heading = normalizeHeading(heading + turnThisStep);
        position = destination(position, heading, stepM);

        elapsedS += timeStepS;
        travelledM += stepM;
        legTravelledM += stepM;

        const rateDegS = turnThisStep / timeStepS;
        const bank = bankForTurnRate(rateDegS, speedMs);
        maxTurnSeen = Math.max(maxTurnSeen, Math.abs(rateDegS));

        altitudeM = altitudeAlongLeg(
            legStartAltM,
            altitudeOf(target, target),
            legInitialDistanceM,
            distanceBetween(position, target)
        );

        if (Number.isFinite(target.stopAtAltM) && altitudeM <= target.stopAtAltM) {
            events.push({
                t: elapsedS,
                type: SimEvent.GLIDE,
                waypointIndex: targetIndex,
                distanceM: distanceBetween(position, target)
            });
            samples.push(sample(elapsedS, position, heading, bank, altitudeM, SimPhase.APPROACH, targetIndex));
            break;
        }

        const turning = Math.abs(bank) >= TURN_BANK_THRESHOLD_DEG;
        samples.push(sample(
            elapsedS,
            position,
            heading,
            bank,
            altitudeM,
            phaseOf(target, turning),
            targetIndex
        ));
    }

    if (elapsedS >= maxDurationS) {
        warnings.push({
            t: elapsedS,
            waypointIndex: targetIndex,
            code: 'simulation-truncated',
            text: `Stopped after ${maxDurationS} s before the mission ended.`
        });
    }

    return {
        samples,
        events,
        warnings,
        summary: {
            turnRadiusM: radiusM,
            turnRateDegS: turnRate,
            totalTimeS: elapsedS,
            totalDistanceM: travelledM,
            maxTurnRateDegS: maxTurnSeen,
            waypointsReached: events.filter((event) => event.type === SimEvent.REACHED).length
        }
    };
}

// Whether the active waypoint is done with, and why.
function waypointOutcome({distanceM, relativeBearing, legTravelledM, waypointRadiusM, passAngleDeg, legBudgetM}) {
    if (distanceM <= waypointRadiusM) return SimEvent.REACHED;
    if (Math.abs(relativeBearing) > passAngleDeg) return SimEvent.OVERSHOT;
    if (legTravelledM > legBudgetM) return SimEvent.ABANDONED;
    return null;
}

// Only the outcomes the pilot needs to act on produce a warning.
function waypointWarning(outcome, target, waypointIndex, distanceM, radiusM, t) {
    // The number shown is the one on the map marker — the route point's own
    // waypoint number, not its position in the filtered route, which drifts as
    // soon as non-geographic actions or injected approach points sit in between.
    const waypointNumber = Number.isFinite(target?.number) ? target.number + 1 : waypointIndex + 1;

    if (outcome === SimEvent.OVERSHOT) {
        return {
            t,
            waypointIndex,
            waypointNumber,
            code: 'waypoint-missed',
            distanceM,
            text: `Waypoint ${waypointNumber} is passed at ${Math.round(distanceM)} m `
                + 'instead of being reached — the turn onto it is tighter than the aircraft flies.'
        };
    }

    if (outcome === SimEvent.ABANDONED) {
        return {
            t,
            waypointIndex,
            waypointNumber,
            code: 'leg-not-flyable',
            radiusM: Math.round(radiusM),
            text: `Waypoint ${waypointNumber} was never reached: at ${Math.round(radiusM)} m turn radius `
                + 'the aircraft circles it instead of closing in.'
        };
    }

    return null;
}

function phaseOf(target, turning) {
    if (target.isApproach) return SimPhase.APPROACH;
    return turning ? SimPhase.TURN : SimPhase.CRUISE;
}

function legBudget(from, to, radiusM) {
    const direct = distanceBetween(from, to);
    const circumference = Number.isFinite(radiusM) ? 2 * Math.PI * radiusM : 0;
    // One full orbit plus the leg itself, with a little slack for the entry turn.
    return direct + circumference + 4 * (Number.isFinite(radiusM) ? radiusM : 0);
}

function sample(t, position, heading, bankDeg, altM, phase, waypointIndex) {
    return {
        t,
        lat: position.lat,
        lon: position.lon,
        heading,
        bankDeg,
        altM,
        phase,
        waypointIndex
    };
}

// A route point may carry no altitude at all (a plain lat/lon list). The caller
// supplies what to fall back to; when both are missing the ramp targets zero,
// which only bare direct calls without resolveRouteAltitudes can reach.
function altitudeOf(point, fallback) {
    if (Number.isFinite(point?.altM)) return point.altM;
    if (Number.isFinite(fallback?.altM)) return fallback.altM;
    return 0;
}

function emptySummary(radiusM) {
    return {
        turnRadiusM: radiusM,
        turnRateDegS: 0,
        totalTimeS: 0,
        totalDistanceM: 0,
        maxTurnRateDegS: 0,
        waypointsReached: 0
    };
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
