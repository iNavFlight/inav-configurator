'use strict';

/*
 * Kinematic model of how a fixed wing flies a waypoint mission.
 *
 * This is deliberately NOT a flight dynamics simulation: no aerodynamics, no PID
 * loops, no inertia. It models the one thing a straight line between waypoints
 * cannot show — that the aircraft steers towards its target at a limited turn
 * rate, so it rounds every corner and overshoots the ones it cannot make. Where
 * nav_fw_wp_turn_mode plans a corner, the planned arcs are approximated too.
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
import { ROUTE_ACTIONS, routeTerminatesAt } from './mission_3d.js';

const EARTH_RADIUS_M = 6371000;
const GRAVITY_MSS = 9.81;

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
        // RTH is always attached (js/waypointCollection.js), so it never
        // satisfies the push condition below regardless of where this check
        // runs relative to it.
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

        // RTH, an unattached LAND, or the multi-mission end marker all end the
        // mission wherever they occur — shared with js/mission_3d.js so the 3D
        // terrain view can't drift out of sync on what ends a route.
        if (routeTerminatesAt(waypoint)) break;
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
const positiveOrZero = (value) => (isPositive(value) ? value : 0);
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

// Radius of a level coordinated turn: r = v^2 / (g * tan(bank)).
export function turnRadius(speedMs, bankAngleDeg) {
    if (!isPositive(speedMs) || !isPositive(bankAngleDeg) || bankAngleDeg >= 90) return Infinity;
    return (speedMs * speedMs) / (GRAVITY_MSS * Math.tan(toRadians(bankAngleDeg)));
}

export const TurnMode = Object.freeze({
    DIRECT: 'DIRECT',
    COORD_FLYBY: 'COORD_FLYBY',
    COORD_FLYOVER: 'COORD_FLYOVER',
    COORD_FLYINTO: 'COORD_FLYINTO'
});

// Every turn mode flies the bank-limited radius; nav_fw_wp_turn_mode only moves where turns start and end.
export function commandedTurnRadius(speedMs, bankAngleDeg) {
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

// Planning limits of the firmware's turn predictor (NAV_FW_TURN_* / NAV_FW_ARC_* in navigation_fixedwing.c).
const TURN_RADIUS_MIN_M = 10;
const TURN_RADIUS_MAX_M = 300;
const TURN_LEAD_TAN_MAX = 3.7;
const ARC_MIN_TURN_DEG = 30;
const FLYBY_MAX_TURN_DEG = 160;
// Sharper than this, the new leg is captured without an inscribed arc (NAV_FW_ARC_SHARP_TURN_CD).
const ARC_SHARP_TURN_DEG = 150;
// Fly-over S intercept: half the heading error to the new leg, bounded (fwArcPlanFlyOverTrackingS).
const FLYOVER_S_ERROR_FRACTION = 0.5;
const FLYOVER_S_MIN_DEG = 20;
const FLYOVER_S_MAX_DEG = 45;
// One second of flight stands in for the firmware's roll-in ramp, which it sizes from roll rate and control settings.
const TRANSITION_LEAD_S = 1.0;
// The fly-into S keeps two roll-in leads of straight between its arcs, like the firmware's Ls.
const FLYINTO_GAP_LEADS = 2;
// An S started this far beside its inbound line passes the waypoint that far off, which still counts as through it.
const FLYINTO_LINE_TOLERANCE_M = 5;
// An S started this far off the inbound course swings past the waypoint instead of through it.
const FLYINTO_HEADING_TOLERANCE_DEG = 10;
// A planned arc this close to its exit heading is done; steering takes the last fraction of a degree.
const ARC_ALIGNED_DEG = 0.5;
// A turn running at a switch carries on only if it already rolls out on the new leg (fwArcRetargetOnLegChange).
const RETARGET_TOLERANCE_DEG = 5;
// Rejoin intercepts: at least a degree, and short of square to the leg, where the along-track run diverges.
const INTERCEPT_ANGLE_MIN_DEG = 1;
const INTERCEPT_ANGLE_MAX_DEG = 89;
// The narrowest band counted as on the leg line; the firmware's own tracking deadband is not modelled.
const TRACKING_BAND_MIN_M = 2;

// The radius the firmware plans corners with: the bank-limited one, clamped to 10..300 m.
export function planningTurnRadius(speedMs, bankAngleDeg) {
    return clamp(turnRadius(speedMs, bankAngleDeg), TURN_RADIUS_MIN_M, TURN_RADIUS_MAX_M);
}

// The radius planned arcs are flown at: the planning radius, but never tighter than the bank allows.
export function arcTurnRadius(speedMs, bankAngleDeg) {
    return Math.max(planningTurnRadius(speedMs, bankAngleDeg), turnRadius(speedMs, bankAngleDeg));
}

// Fly-by turn start: roll-in lead + R * tan(turn / 2), capped at nav_fw_wp_turn_max_lead_time of flight.
export function flyByLeadDistance(radiusM, turnAngleDeg, speedMs, maxLeadTimeMs) {
    const tangentM = radiusM * Math.min(Math.tan(toRadians(Math.abs(turnAngleDeg)) / 2), TURN_LEAD_TAN_MAX);
    const wantedM = speedMs * TRANSITION_LEAD_S + tangentM;
    const capM = isPositive(maxLeadTimeMs) ? speedMs * maxLeadTimeMs / 1000 : Infinity;
    return {distanceM: Math.min(wantedM, capM), capped: wantedM > capM};
}

// Internal-tangent S ahead of a fly-into waypoint (fwArcPlanFlyInto), in a north/east frame centred on it.
export function flyIntoSTurn(radiusM, inboundDeg, outboundDeg, gapM) {
    const dir = Math.sign(headingDifference(inboundDeg, outboundDeg)) || 1;
    const unit = (bearingDeg) => [Math.cos(toRadians(bearingDeg)), Math.sin(toRadians(bearingDeg))];
    const u = unit(inboundDeg);
    const o2 = unit(outboundDeg + dir * 90).map((c) => c * radiusM);
    const a = unit(inboundDeg - dir * 90).map((c) => c * radiusM);
    const w = [o2[0] - a[0], o2[1] - a[1]];
    const wu = w[0] * u[0] + w[1] * u[1];
    const disc = wu * wu - (w[0] * w[0] + w[1] * w[1]) + 4 * radiusM * radiusM + gapM * gapM;
    if (!(disc > 0)) return null;

    const s = wu - Math.sqrt(disc);
    if (!(s < 0)) return null;

    const o1 = [a[0] + s * u[0], a[1] + s * u[1]];
    const centreDistanceM = Math.hypot(o2[0] - o1[0], o2[1] - o1[1]);
    const centreLineDeg = toDegrees(Math.atan2(o2[1] - o1[1], o2[0] - o1[0]));
    const tangentAngleDeg = toDegrees(Math.asin(Math.min(1, 2 * radiusM / centreDistanceM)));

    return {
        turnDirection: dir,
        startBeforeM: -s,
        tangentHeadingDeg: normalizeHeading(centreLineDeg - dir * tangentAngleDeg),
        tangentLengthM: Math.sqrt(Math.max(0, centreDistanceM ** 2 - 4 * radiusM * radiusM))
    };
}

// Steepest intercept in [min, max] whose two arcs fit beside the leg line; headings relative to the leg, + towards it.
export function rejoinIntercept(offsetM, towardDeg, radiusM, maxAngleDeg, minAngleDeg = INTERCEPT_ANGLE_MIN_DEG) {
    for (let angleDeg = maxAngleDeg; angleDeg >= minAngleDeg; angleDeg--) {
        // The first arc turns the short way round to the intercept heading.
        const fromDeg = angleDeg - towardDeg > 180 ? towardDeg + 360 : towardDeg;
        const sense = Math.sign(angleDeg - fromDeg);
        const [from, to] = [toRadians(fromDeg), toRadians(angleDeg)];
        // Arc a -> b: sign(b - a) * R * (cos a - cos b) towards the line, sign(b - a) * R * (sin b - sin a) along it.
        const firstArcM = sense * radiusM * (Math.cos(from) - Math.cos(to));
        const rollOutM = radiusM * (1 - Math.cos(to));
        const straightM = offsetM - firstArcM - rollOutM;
        if (straightM >= 0) {
            const firstAlongM = sense * radiusM * (Math.sin(to) - Math.sin(from));
            const alongM = firstAlongM + straightM / Math.tan(to) + radiusM * Math.sin(to);
            return {angleDeg, sense, rollOutM, alongM};
        }
    }
    return null;
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
    waypointRadiusCm: 100,
    turnMode: TurnMode.COORD_FLYBY,
    turnMaxLeadTimeMs: 6000,
    trackingEnabled: false,
    trackingMaxAngleDeg: 60
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
/*
 * How the approach's figures convert. aglCm feeds the firmware's one-third rule
 * — height above home when home is known, above the landing altitude otherwise;
 * frameCm places a value in the frame the track is drawn in.
 */
function approachFrames(approach, params) {
    const identity = (centimetres) => centimetres;
    if (!approach.isSeaLevelRef) return {aglCm: identity, frameCm: identity};

    if (Number.isFinite(params.homeAltM)) {
        const aboveHome = (centimetres) => centimetres - params.homeAltM * 100;
        return {aglCm: aboveHome, frameCm: aboveHome};
    }

    return {aglCm: (centimetres) => centimetres - approach.landAltCm, frameCm: identity};
}

export function buildLandingApproach(landPoint, approach, params) {
    const heading = landingHeading(approach);
    if (heading === null) return null;

    const approachLengthM = (params.approachLengthCm ?? 0) / 100;
    // The loiter radius only widens the turn point's offset; an unusable value
    // must not poison the geometry with NaN coordinates.
    const loiterRadiusM = positiveOrZero((params.loiterRadiusCm ?? 0) / 100);
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
    if (!Number.isFinite(params.homeAltM)
        && Boolean(approach.isSeaLevelRef) !== Boolean(params.routeFrameAbsolute)) {
        return null;
    }
    if (!exceeds(approach.approachAltCm, approach.landAltCm)) return null;

    const {aglCm, frameCm} = approachFrames(approach, params);
    const approachAglCm = aglCm(approach.approachAltCm);
    const landAglCm = aglCm(approach.landAltCm);
    // Whole-centimetre integer division, as in the firmware.
    const finalAglCm = Math.trunc(approachAglCm / 3) * 2;
    const baseCm = frameCm(approach.landAltCm) - landAglCm;

    const approachAltM = (baseCm + approachAglCm) / 100;
    const finalApproachAltM = (baseCm + finalAglCm) / 100;
    const landAltM = (baseCm + landAglCm) / 100;

    // The editor's dropdown delivers the direction as a string, MSP as a number;
    // comparing strictly against the number made every edited approach fly the
    // right-hand circuit no matter what was chosen.
    const sideBearing = Number(approach.approachDirection) === ApproachDirectionLeft
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
// An approach whose landing altitude sits this far from the waypoint it lands on
// is not a plan, it is damaged data — the known editor bug inflates the approach
// altitudes by one site elevation per touch.
const APPROACH_WAYPOINT_GAP_M = 100;

export function withLandingApproaches(route, approachFor, params) {
    const expanded = [];
    const landingsWithoutApproach = [];
    const suspectLandings = [];

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

        // The approach's landing altitude and the waypoint it lands on describe
        // the same spot; when they are far apart, the data is corrupt and the
        // drawing would tower or bury itself without this saying why.
        const builtLandingAltM = built.points.at(-1).stopAtAltM;
        if (Number.isFinite(point.altM) && Number.isFinite(builtLandingAltM)
            && Math.abs(builtLandingAltM - point.altM) > APPROACH_WAYPOINT_GAP_M) {
            suspectLandings.push({
                number: point.number,
                gapM: Math.round(Math.abs(builtLandingAltM - point.altM))
            });
        }

        expanded.push(...built.points.map((approachPoint) => ({
            ...approachPoint,
            number: point.number,
            landingHeading: built.heading
        })));
    }

    return {route: expanded, landingsWithoutApproach, suspectLandings};
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
    turnMode: FirmwareDefaults.turnMode,
    turnMaxLeadTimeMs: FirmwareDefaults.turnMaxLeadTimeMs,
    trackingEnabled: FirmwareDefaults.trackingEnabled,
    trackingMaxAngleDeg: FirmwareDefaults.trackingMaxAngleDeg,
    waypointRadiusM: 8,
    timeStepS: 0.1,
    maxDurationS: 3600
};

// Passed once across the waypoint's square line (isWaypointReached, WP mode); the approach keeps the 100 degree test.
const PASS_ANGLE_DEG = 90;
const APPROACH_PASS_ANGLE_DEG = 100;

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
 * active waypoint, limited by the turn rate. Around a corner the turn mode may
 * replace it for a while with a planned turn: straight stretches and arcs at the
 * turn radius, after which the aircraft steers for its waypoint again.
 *
 * A waypoint is done once the aircraft is inside the acceptance radius, once a
 * fly-by turn starts, or once it has crossed the line through the waypoint square
 * to the LEG — the line from the previous waypoint to this one, fixed when the
 * waypoint became active (navigation.c:4224-4229, isWaypointReached). Measuring
 * from the aircraft's own position instead would move every switch point after the
 * first corner, which is exactly where anyone looks.
 */
export function simulateGroundTrack(points, params = {}) {
    const config = {...DEFAULT_PARAMS, ...params};
    const {speedMs, waypointRadiusM, timeStepS, maxDurationS} = config;

    const radiusM = commandedTurnRadius(speedMs, config.bankAngleDeg);
    const turnRate = turnRateDegPerSecond(speedMs, radiusM);
    const stepM = speedMs * timeStepS;
    const plan = turnPlanState(config, radiusM);

    const samples = [];
    const events = [];
    const warnings = [];

    if (!canSimulate(points, speedMs, timeStepS)) {
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
        const leg = {
            targetIndex, target, next: points[targetIndex + 1], legFrom: points[targetIndex - 1],
            legBearing, position, heading, distanceM, bearingToTarget
        };

        const done = waypointOutcome({
            distanceM, relativeBearing, legTravelledM, waypointRadiusM, legBudgetM,
            passAngleDeg: target.isApproach ? APPROACH_PASS_ANGLE_DEG : PASS_ANGLE_DEG,
            // Right after a fly-into S the pickup tolerance applies, whichever test fires first.
            passToleranceM: plan.pickupIndex === targetIndex ? FLYINTO_LINE_TOLERANCE_M : stepM,
            // A fly-into S crosses its own waypoint's square line by design; its pickup decides instead.
            flyingInto: plan.maneuver?.pickupIndex === targetIndex
        }) ?? anticipate(plan, leg);

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
                plan.maneuver = maneuverForNewLeg(plan, {
                    target: points[targetIndex],
                    legFrom: points[targetIndex - 1],
                    legBearing,
                    position,
                    heading,
                    bearingToTarget: bearingBetween(position, points[targetIndex])
                });
            }
            plan.cappedCorner = false;
            continue;
        }

        const planned = plannedStep(plan, leg);
        const turnThisStep = planned ?? clamp(offCourse, -turnRate * timeStepS, turnRate * timeStepS);
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

        if (reachedGlideAltitude(target, altitudeM)) {
            events.push({
                t: elapsedS,
                type: SimEvent.GLIDE,
                waypointIndex: targetIndex,
                distanceM: distanceBetween(position, target)
            });
            samples.push(sample(elapsedS, position, heading, bank, altitudeM, SimPhase.APPROACH, targetIndex));
            break;
        }

        const turning = Math.abs(bank) >= TURN_BANK_THRESHOLD_DEG || Boolean(planned);
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

// Whether there is a track to integrate at all: a leg needs two points, and a
// speed or time step that is not a real positive number would advance the
// aircraft by NaN and fill the track with unusable samples.
function canSimulate(points, speedMs, timeStepS) {
    return points.length >= 2 && isPositive(speedMs) && isPositive(timeStepS);
}

// The commanded descent has reached the altitude where the firmware hands over
// to its pitch-held glide phase, so the modelled track stops here.
function reachedGlideAltitude(target, altitudeM) {
    return Number.isFinite(target.stopAtAltM) && altitudeM <= target.stopAtAltM;
}

// Whether the active waypoint is done with, and why; a pass just outside the radius is a reach the step skipped.
function waypointOutcome({
    distanceM, relativeBearing, legTravelledM, waypointRadiusM, passAngleDeg, legBudgetM, passToleranceM, flyingInto
}) {
    if (distanceM <= waypointRadiusM) return SimEvent.REACHED;
    if (!flyingInto && Math.abs(relativeBearing) > passAngleDeg) {
        return distanceM <= waypointRadiusM + passToleranceM ? SimEvent.REACHED : SimEvent.OVERSHOT;
    }
    if (legTravelledM > legBudgetM) return SimEvent.ABANDONED;
    return null;
}

// Planned-turn state carried through the run; turn is null when the aircraft cannot turn at all.
function turnPlanState(config, radiusM) {
    return {
        turn: turnPlanning(config, radiusM),
        turnMode: config.turnMode,
        waypointRadiusM: config.waypointRadiusM,
        maneuver: null,
        // The waypoint a turn was last planned ahead of, a fly-into waiting for its pickup, and a capped fly-by.
        anticipatedIndex: -1,
        pickupIndex: -1,
        cappedCorner: false
    };
}

function turnPlanning(config, radiusM) {
    if (!Number.isFinite(radiusM) || !isPositive(config.speedMs)) return null;

    const arcRadiusM = arcTurnRadius(config.speedMs, config.bankAngleDeg);
    return {
        planRadiusM: planningTurnRadius(config.speedMs, config.bankAngleDeg),
        arcRadiusM,
        arcStepDeg: turnRateDegPerSecond(config.speedMs, arcRadiusM) * config.timeStepS,
        leadM: config.speedMs * TRANSITION_LEAD_S,
        stepM: config.speedMs * config.timeStepS,
        speedMs: config.speedMs,
        maxLeadTimeMs: config.turnMaxLeadTimeMs,
        tracking: Boolean(config.trackingEnabled),
        trackingMaxAngleDeg: clamp(Number(config.trackingMaxAngleDeg) || 0, 0, INTERCEPT_ANGLE_MAX_DEG),
        trackingBandM: Math.max(config.waypointRadiusM, TRACKING_BAND_MIN_M),
        flyIntoBandM: config.waypointRadiusM + FLYINTO_LINE_TOLERANCE_M
    };
}

// The landing approach always flies fly-by turns (fwEffectiveTurnMode in navigation_fixedwing.c).
function effectiveTurnMode(target, turnMode) {
    return target?.isApproach ? TurnMode.COORD_FLYBY : turnMode;
}

// A finished fly-into S hands the waypoint over at its pickup; otherwise the turn mode may anticipate the corner.
function anticipate(plan, leg) {
    if (plan.pickupIndex === leg.targetIndex) {
        plan.pickupIndex = -1;
        const throughM = plan.waypointRadiusM + FLYINTO_LINE_TOLERANCE_M;
        return leg.distanceM <= throughM ? SimEvent.REACHED : SimEvent.OVERSHOT;
    }
    if (!plan.turn || plan.maneuver || plan.anticipatedIndex === leg.targetIndex) return null;

    const anticipation = anticipateWaypoint({...leg, turnMode: plan.turnMode, turn: plan.turn});
    if (!anticipation) return null;

    plan.anticipatedIndex = leg.targetIndex;
    plan.maneuver = startManeuver(anticipation.phases);
    if (plan.maneuver && anticipation.flyInto) plan.maneuver.pickupIndex = leg.targetIndex;
    plan.cappedCorner = Boolean(anticipation.capped);
    return anticipation.reached ? SimEvent.REACHED : null;
}

// Before the waypoint a fly-by declares it reached at the turn start and a fly-into stages its S; both need a next leg.
function anticipateWaypoint(leg) {
    const {turnMode, target, next, legBearing, distanceM, turn} = leg;
    if (!next || !(distanceBetween(target, next) > 0)) return null;

    const outboundDeg = bearingBetween(target, next);
    const turnAngleDeg = Math.abs(headingDifference(legBearing, outboundDeg));
    const mode = effectiveTurnMode(target, turnMode);
    if (turnAngleDeg <= ARC_MIN_TURN_DEG) return null;
    if (mode === TurnMode.COORD_FLYINTO) return flyIntoAnticipation(leg, outboundDeg);
    if (mode !== TurnMode.COORD_FLYBY || turnAngleDeg >= FLYBY_MAX_TURN_DEG) return null;

    const lead = flyByLeadDistance(turn.planRadiusM, turnAngleDeg, turn.speedMs, turn.maxLeadTimeMs);
    return distanceM < lead.distanceM ? {reached: true, capped: lead.capped, phases: []} : null;
}

// The S only works from on the inbound line, before its start point and turning the short way; otherwise none is flown.
function flyIntoAnticipation({legFrom, legBearing, position, heading, distanceM, turn}, outboundDeg) {
    const sTurn = flyIntoSTurn(turn.arcRadiusM, legBearing, outboundDeg, FLYINTO_GAP_LEADS * turn.leadM);
    if (!sTurn || distanceM < sTurn.startBeforeM || distanceM >= sTurn.startBeforeM + turn.leadM) return null;
    if (!legFrom || Math.abs(crossTrackM(legFrom, legBearing, position)) > turn.flyIntoBandM) return null;
    if (Math.abs(headingDifference(legBearing, heading)) > FLYINTO_HEADING_TOLERANCE_DEG) return null;
    if (normalizeHeading(-sTurn.turnDirection * (sTurn.tangentHeadingDeg - heading)) > 180) return null;

    return {
        reached: false,
        flyInto: true,
        phases: [
            {turnDirection: 0, straightDistanceM: distanceM - sTurn.startBeforeM},
            {turnDirection: -sTurn.turnDirection, exitHeadingDeg: sTurn.tangentHeadingDeg},
            {turnDirection: 0, straightDistanceM: sTurn.tangentLengthM},
            {turnDirection: sTurn.turnDirection, exitHeadingDeg: outboundDeg}
        ]
    };
}

// A turn still running at a switch belongs to the old leg unless it already rolls out on the new one.
function maneuverForNewLeg(plan, leg) {
    const running = plan.maneuver;
    const exitDeg = running?.phases.at(-1)?.exitHeadingDeg;
    if (Number.isFinite(exitDeg) && Math.abs(headingDifference(exitDeg, leg.legBearing)) <= RETARGET_TOLERANCE_DEG) {
        return running;
    }
    if (!plan.turn) return null;
    return turnOntoLeg({...leg, turnMode: plan.turnMode, capped: plan.cappedCorner, turn: plan.turn});
}

// After a switch, a course more than 30 degrees off is flown as an arc first (fwArcPlanNewLeg, navigation_fixedwing.c).
function turnOntoLeg(leg) {
    const {turnMode, target, legBearing, heading, bearingToTarget, capped, turn} = leg;
    const mode = effectiveTurnMode(target, turnMode);
    // With path tracking DIRECT converges onto the leg line instead of steering at the waypoint.
    if (mode === TurnMode.DIRECT) {
        return turn.tracking ? planRejoin(leg, {maxAngleDeg: turn.trackingMaxAngleDeg}) : null;
    }

    const overfly = mode === TurnMode.COORD_FLYOVER;
    const errorDeg = headingDifference(heading, overfly ? bearingToTarget : legBearing);
    if (Math.abs(errorDeg) <= ARC_MIN_TURN_DEG) return null;

    const rollIn = {turnDirection: 0, straightDistanceM: turn.leadM};
    if (overfly && turn.tracking) {
        const halfErrorDeg = FLYOVER_S_ERROR_FRACTION * Math.abs(headingDifference(heading, legBearing));
        const interceptDeg = clamp(halfErrorDeg, FLYOVER_S_MIN_DEG, FLYOVER_S_MAX_DEG);
        return {...startManeuver([rollIn]), overflyS: {interceptDeg, turnDirection: Math.sign(errorDeg)}};
    }
    // A null exit heading means: until the nose points at the active waypoint.
    const arc = {turnDirection: Math.sign(errorDeg), exitHeadingDeg: overfly ? null : legBearing};
    // A capped or capture turn rolls out beside the leg, and path tracking takes over from there.
    const fallback = !overfly && (capped || Math.abs(errorDeg) > ARC_SHARP_TURN_DEG);
    return {...startManeuver([rollIn, arc]), rejoinAfter: fallback && turn.tracking};
}

function startManeuver(phases) {
    return phases.length ? {phases: phases.map((phase) => ({...phase})), index: 0} : null;
}

// Signed distance beside the leg line through legFrom, positive to the right of its bearing.
function crossTrackM(legFrom, legBearingDeg, point) {
    return distanceBetween(legFrom, point) * Math.sin(toRadians(bearingBetween(legFrom, point) - legBearingDeg));
}

// Heading change from the planned turn, or null to steer at the waypoint; a finished turn hands on to its follow-up.
function plannedStep(plan, leg) {
    const running = plan.maneuver;
    if (!running) return null;

    let step = maneuverStep(running, leg, plan.turn);
    if (step === null) {
        if (running.pickupIndex === leg.targetIndex) plan.pickupIndex = leg.targetIndex;
        plan.maneuver = followUpManeuver(running, {...leg, turn: plan.turn});
        step = plan.maneuver ? maneuverStep(plan.maneuver, leg, plan.turn) : null;
    }
    if (step === null) plan.maneuver = null;
    return step;
}

// What follows a finished turn with path tracking on: the fly-over S, or the rejoin after a fallback turn.
function followUpManeuver(finished, leg) {
    if (finished.overflyS) return overflyExit(finished.overflyS, leg);
    if (finished.rejoinAfter) return planRejoin(leg, {maxAngleDeg: leg.turn.trackingMaxAngleDeg});
    return null;
}

// After the fly-over roll-in: the tracking S back onto the leg, or the tangent exit when it does not fit.
function overflyExit(overflyS, leg) {
    // Exactly the planned intercept, and rolled out more than 2R before the next waypoint, as in the firmware.
    const sTurn = planRejoin(leg, {
        maxAngleDeg: overflyS.interceptDeg,
        minAngleDeg: overflyS.interceptDeg,
        marginM: 2 * leg.turn.arcRadiusM
    });
    const tangentExit = {turnDirection: overflyS.turnDirection, exitHeadingDeg: null};
    return sTurn ?? {...startManeuver([tangentExit]), rejoinAfter: true};
}

// Arc onto an intercept course, straight until one roll-out short of the leg line, arc onto the leg.
function planRejoin({position, heading, legFrom, target, legBearing, turn}, {maxAngleDeg, minAngleDeg, marginM = 0}) {
    if (!legFrom) return null;

    const offsetM = crossTrackM(legFrom, legBearing, position);
    const driftDeg = headingDifference(legBearing, heading);
    const onLine = !(Math.abs(offsetM) > turn.trackingBandM);
    if (onLine && Math.abs(driftDeg) <= ARC_MIN_TURN_DEG) return null;

    // On the line but heading off it, the aircraft is about to be on the side it drifts to.
    const side = onLine ? Math.sign(driftDeg) : Math.sign(offsetM);
    const intercept = rejoinIntercept(side * offsetM, -side * driftDeg, turn.arcRadiusM, maxAngleDeg, minAngleDeg);
    if (!intercept) return null;

    const toTargetDeg = bearingBetween(position, target) - legBearing;
    const aheadM = distanceBetween(position, target) * Math.cos(toRadians(toTargetDeg));
    if (aheadM < intercept.alongM + marginM) return null;

    const phases = [
        {turnDirection: 0, untilOnLeg: true, legFrom, legBearingDeg: legBearing, side, rollOutM: intercept.rollOutM},
        {turnDirection: side, exitHeadingDeg: legBearing}
    ];
    if (intercept.sense !== 0) {
        phases.unshift({
            turnDirection: -side * intercept.sense,
            exitHeadingDeg: normalizeHeading(legBearing - side * intercept.angleDeg)
        });
    }
    return startManeuver(phases);
}

// Heading change for one step of a planned turn, or null once it is flown.
function maneuverStep(maneuver, {heading, bearingToTarget, position}, turn) {
    while (maneuver.index < maneuver.phases.length) {
        const phase = maneuver.phases[maneuver.index];
        const step = phase.turnDirection === 0
            ? straightStep(phase, turn.stepM, position)
            : arcStep(phase, heading, bearingToTarget, turn.arcStepDeg);
        if (step !== null) return step;
        maneuver.index += 1;
    }
    return null;
}

function straightStep(phase, stepM, position) {
    if (phase.untilOnLeg) {
        // Stop one roll-out short of the line, so the closing arc ends on it.
        const remainingM = phase.side * crossTrackM(phase.legFrom, phase.legBearingDeg, position);
        return remainingM > phase.rollOutM ? 0 : null;
    }
    phase.remainingM ??= phase.straightDistanceM;
    if (!(phase.remainingM >= stepM / 2)) return null;
    phase.remainingM -= stepM;
    return 0;
}

function arcStep(phase, heading, bearingToTarget, maxTurnDeg) {
    let remainingDeg;
    if (phase.exitHeadingDeg === null) {
        // Once it points at the waypoint the arc is done; the small corrections after that are steering.
        remainingDeg = phase.turnDirection * headingDifference(heading, bearingToTarget);
        if (remainingDeg <= ARC_ALIGNED_DEG) return null;
    } else {
        // Fixed on entry, in the arc's own direction, so a turn past 180 degrees is not read as a short one back.
        if (phase.remainingDeg === undefined) {
            const aheadDeg = normalizeHeading(phase.turnDirection * (phase.exitHeadingDeg - heading));
            phase.remainingDeg = aheadDeg > 360 - ARC_ALIGNED_DEG ? 0 : aheadDeg;
        }
        remainingDeg = phase.remainingDeg;
    }
    if (!(remainingDeg > 0) || !(maxTurnDeg > 0)) return null;

    const turnDeg = Math.min(remainingDeg, maxTurnDeg);
    if (phase.exitHeadingDeg !== null) phase.remainingDeg -= turnDeg;
    return phase.turnDirection * turnDeg;
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
