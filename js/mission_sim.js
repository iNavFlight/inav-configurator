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

    return {
        homeKnown,
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
    if (!(speedMs > 0) || !(bankAngleDeg > 0) || bankAngleDeg >= 90) return Infinity;
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
    if (!(radiusM > 0) || !Number.isFinite(radiusM) || !(speedMs > 0)) return 0;
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
    if (!(speedMs > 0) || !rateDegPerSecond) return 0;
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
    const loiterRadiusM = (params.loiterRadiusCm ?? 0) / 100;
    if (!(approachLengthM > 0)) return null;
    if (!(approach.approachAltCm > approach.landAltCm)) return null;

    // Convert to centimetres above home FIRST — that is the frame the firmware
    // works in, and finalApproachAlt is derived from the converted value.
    const homeAltM = params.homeAltM;
    const seaLevelReferenced = Boolean(approach.isSeaLevelRef) && Number.isFinite(homeAltM);
    const aboveHomeCm = (centimetres) => seaLevelReferenced ? centimetres - homeAltM * 100 : centimetres;

    const approachAltCm = aboveHomeCm(approach.approachAltCm);
    const landAltCm = aboveHomeCm(approach.landAltCm);
    // Whole-centimetre integer division, as in the firmware.
    const finalApproachAltCm = Math.trunc(approachAltCm / 3) * 2;

    const approachAltM = approachAltCm / 100;
    const finalApproachAltM = finalApproachAltCm / 100;
    const landAltM = landAltCm / 100;

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
                altM: landAltM - finalApproachAltM,
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
    if (!((params.approachLengthCm ?? 0) > 0)) return LandingApproachProblem.NO_APPROACH_LENGTH;
    return LandingApproachProblem.ALTITUDES_IMPLAUSIBLE;
}

export const SimPhase = Object.freeze({
    CRUISE: 'cruise',
    TURN: 'turn',
    APPROACH: 'approach'
});

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
    if (!(initialDistanceM > 0)) return targetAltM;

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

    if (points.length < 2 || !(speedMs > 0) || !(timeStepS > 0)) {
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

        let done = null;
        if (distanceM <= waypointRadiusM) {
            done = SimEvent.REACHED;
        } else if (Math.abs(relativeBearing) > passAngleDeg) {
            done = SimEvent.OVERSHOT;
        } else if (legTravelledM > legBudgetM) {
            done = SimEvent.ABANDONED;
        }

        if (done) {
            events.push({t: elapsedS, type: done, waypointIndex: targetIndex, distanceM});
            if (done === SimEvent.OVERSHOT) {
                warnings.push({
                    t: elapsedS,
                    waypointIndex: targetIndex,
                    code: 'waypoint-missed',
                    distanceM,
                    text: `Waypoint ${targetIndex + 1} is passed at ${Math.round(distanceM)} m `
                        + 'instead of being reached — the turn onto it is tighter than the aircraft flies.'
                });
            }
            if (done === SimEvent.ABANDONED) {
                warnings.push({
                    t: elapsedS,
                    waypointIndex: targetIndex,
                    code: 'leg-not-flyable',
                    text: `Waypoint ${targetIndex} was never reached: at ${Math.round(radiusM)} m turn radius `
                        + 'the aircraft circles it instead of closing in.'
                });
            }

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
            target.isApproach ? SimPhase.APPROACH : (turning ? SimPhase.TURN : SimPhase.CRUISE),
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

// A route point may carry no altitude at all (a plain lat/lon list); fall back to
// the neighbour so the ramp stays flat rather than diving to zero.
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
