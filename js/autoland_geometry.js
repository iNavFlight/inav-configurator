'use strict';

/*
 * Fixed-wing autoland geometry, as the firmware plans it (navigation.c, FW_LANDING_LOITER exit): the wind circle,
 * the turn, final-approach and land waypoints for each landing direction, the corner cuts the aircraft flies
 * through them and the altitude it is asked for along the way. Pure functions in metres, degrees and m/s, local
 * north/east frame with the landing site at the origin, so the tab can redraw on every edit and tests can check it.
 */

const GRAVITY = 9.80665;
const TURN_RADIUS_MIN_M = 10;
const TURN_RADIUS_MAX_M = 300;
const SMOOTH_TCONST_PER_STEP_MS = 100;
const SMOOTH_TCONST_MAX_MS = 900;
const STEEP_SLOPE_DEG = 8;
const MIN_CIRCLE_GAP_M = 10;
const ARC_STEP_DEG = 5;
const STRAIGHT_STEP_M = 5;
const CIRCLE_EXIT_STRAIGHT_S = 1.5;
const FLARE_TIME_S = 2;
const LOW_HEIGHT_M = 2;

const ApproachSide = Object.freeze({ LEFT: 0, RIGHT: 1 });
const LoiterDirection = Object.freeze({ RIGHT: 1, LEFT: -1 });

const AutolandWarning = Object.freeze({
    NO_HEADING: 'noHeading',
    FINAL_STEEP: 'finalSteep',
    LEGS_STEEP: 'legsSteep',
    CIRCLE_CLOSE: 'circleClose',
    CIRCLE_WIDER: 'circleWider',
    BASE_SHORT: 'baseShort',
    FINAL_ABOVE_APPROACH: 'finalAboveApproach',
    GLIDE_BELOW_FLARE: 'glideBelowFlare',
    LOW_BEFORE_RUNWAY: 'lowBeforeRunway'
});

const Phase = Object.freeze({
    DOWNWIND: 'downwind',
    BASE: 'base',
    TURN_FINAL: 'turnFinal',
    FINAL: 'final',
    GLIDE: 'glide',
    FLARE: 'flare'
});

function wrap360(deg) {
    return ((deg % 360) + 360) % 360;
}

function wrap180(deg) {
    return wrap360(deg + 180) - 180;
}

function rad(deg) {
    return deg * Math.PI / 180;
}

function unit(bearingDeg) {
    return { n: Math.cos(rad(bearingDeg)), e: Math.sin(rad(bearingDeg)) };
}

function move(p, bearingDeg, dist) {
    const u = unit(bearingDeg);
    return { n: p.n + u.n * dist, e: p.e + u.e * dist };
}

function distance(a, b) {
    return Math.hypot(a.n - b.n, a.e - b.e);
}

function bearing(a, b) {
    return wrap360(Math.atan2(b.e - a.e, b.n - a.n) * 180 / Math.PI);
}

/* Coordinated turn radius v^2 / (g tan bank), clamped as the firmware does */
function coordinatedTurnRadius(speed, bankDeg) {
    const radius = speed * speed / (GRAVITY * Math.tan(rad(Math.max(bankDeg, 1))));
    return Math.min(Math.max(radius, TURN_RADIUS_MIN_M), TURN_RADIUS_MAX_M);
}

/* Roll-in time the corner cut plans for (fwTurnEaseTimeMs) */
function turnEaseTimeMs(p) {
    const rollMs = p.rollRateDps > 1 ? 1.5 * p.bankDeg / p.rollRateDps * 1000 : 0;
    const smoothMs = Math.min(p.controlSmoothness * SMOOTH_TCONST_PER_STEP_MS, SMOOTH_TCONST_MAX_MS);
    return rollMs + smoothMs + p.wpTurnControlEaseMs;
}

/* Landing directions the site allows: a positive heading lands both ways, a negative one only that way */
function landingDirections(approach) {
    const directions = [];
    // aimIndex: the direction's aim offset in the approach (heading 1, its reverse, heading 2, its reverse)
    [approach.heading1, approach.heading2].forEach((heading, slot) => {
        if (!heading) {
            return;
        }
        directions.push({ landing: wrap360(Math.abs(heading)), configured: heading, aimIndex: slot * 2 });
        if (heading > 0) {
            directions.push({ landing: wrap360(heading + 180), configured: heading, aimIndex: slot * 2 + 1 });
        }
    });
    return directions;
}

/*
 * Side of the runway the approach is flown on (fwLandCircuitSide): the circuit always uses heading 1, so it stays on
 * the same physical side whatever the landing direction; the classic approach uses the heading the direction came from
 */
function approachSide(approach, configuredHeading, circuit) {
    const heading = circuit ? (approach.heading1 || approach.heading2) : configuredHeading;
    return wrap360(Math.abs(heading) + (approach.side === ApproachSide.LEFT ? -90 : 90));
}

/* Corner cut of radius r between the legs a->corner and corner->b, as points along the arc */
function fillet(a, corner, b, r) {
    const inBearing = bearing(a, corner);
    const outBearing = bearing(corner, b);
    const turn = wrap180(outBearing - inBearing);
    const tangent = r * Math.tan(rad(Math.abs(turn) / 2));
    const start = move(corner, inBearing + 180, tangent);
    const end = move(corner, outBearing, tangent);
    const dir = turn >= 0 ? 1 : -1;
    const center = move(start, inBearing + 90 * dir, r);
    const points = [];
    const steps = Math.max(2, Math.ceil(Math.abs(turn) / ARC_STEP_DEG));
    const startAngle = bearing(center, start);
    for (let i = 0; i <= steps; i++) {
        points.push(move(center, startAngle + dir * Math.abs(turn) * i / steps, r));
    }
    return { start, end, points, tangent, inBearing };
}

/*
 * A corner cut that would start before the previous one ends, on a leg shorter than the two turns: the aircraft comes
 * out of the first turn past where this one starts and turns again at once (FLY_BY), until it points at the next
 * waypoint, so the leg after it starts tangent
 */
function after(prevEnd, corner, target, r) {
    const u = unit(corner.inBearing);
    const gap = (corner.start.n - prevEnd.n) * u.n + (corner.start.e - prevEnd.e) * u.e;
    if (gap >= 0) {
        return corner;
    }
    const arc = turnTowards(prevEnd, corner.inBearing, target, r);
    if (!arc.length) {
        return corner;
    }
    return { start: prevEnd, end: arc[arc.length - 1], points: [prevEnd, ...arc], inBearing: corner.inBearing, moved: true };
}

/* Arc of radius r from a heading until the aircraft points at the target, as the navigation turns after the circle */
function turnTowards(start, heading, target, r) {
    const points = [];
    const off = wrap180(bearing(start, target) - heading);
    if (Math.abs(off) < ARC_STEP_DEG) {
        return points;
    }
    const dir = off > 0 ? 1 : -1;
    const center = move(start, heading + 90 * dir, r);
    if (distance(center, target) <= r) {
        return points;    // the target is inside the turn: no arc reaches it
    }
    const startAngle = bearing(center, start);
    for (let turned = ARC_STEP_DEG; turned < 360; turned += ARC_STEP_DEG) {
        const pt = move(center, startAngle + dir * turned, r);
        points.push(pt);
        if (Math.abs(wrap180(bearing(pt, target) - (heading + dir * turned))) <= ARC_STEP_DEG) {
            break;
        }
    }
    return points;
}

function straight(a, b) {
    const points = [];
    const len = distance(a, b);
    const steps = Math.max(1, Math.ceil(len / STRAIGHT_STEP_M));
    for (let i = 1; i <= steps; i++) {
        points.push({ n: a.n + (b.n - a.n) * i / steps, e: a.e + (b.e - a.e) * i / steps });
    }
    return points;
}

/*
 * One landing direction. p: approachAlt and finalAlt (m above the landing altitude), approachLength, downwindOffset,
 * landLoiterRadius, loiterRadius, aimOffset, glideAlt, flareAlt, runwayLength (m), flareSink, speed (m/s), flareTime (s),
 * bankDeg, rollRateDps,
 * controlSmoothness, wpTurnControlEaseMs, loiterDirection (+1 right, -1 left), approach {side, heading1, heading2,
 * runwayStarts [4] (m before the site, 0: aimOffset is the touchdown), runwayHeights [4] (m)}
 */
function planDirection(p, direction) {
    const circuit = p.downwindOffset > 0;
    const L = direction.landing;
    const side = approachSide(p.approach, direction.configured, circuit);
    const site = { n: 0, e: 0 };
    const finalAlt = p.finalAlt > 0 ? p.finalAlt : p.approachAlt / 3 * 2;
    const warnings = [];

    const turnRadius = coordinatedTurnRadius(p.speed, p.bankDeg);
    const plannedLead = turnRadius + p.speed * turnEaseTimeMs(p) / 1000 * 1.5;
    const loiterRadius = p.landLoiterRadius > 0 ? p.landLoiterRadius : p.loiterRadius;
    const circleRadius = circuit ? Math.max(loiterRadius, turnRadius) : loiterRadius;
    if (circuit && p.landLoiterRadius > 0 && turnRadius > p.landLoiterRadius + 0.5) {
        warnings.push({ id: AutolandWarning.CIRCLE_WIDER, value: turnRadius, speed: p.speed, bank: p.bankDeg, setting: p.landLoiterRadius });
    }
    // Turn space before the straight final, and the radius the corners are flown at
    const turnSpace = circuit ? Math.max(loiterRadius, plannedLead, circleRadius) : 0;
    const cornerRadius = circuit ? circleRadius : turnRadius;

    // Sink-rate flare (nav_fw_land_flare_sink): it asks height / flare time down to the flare sink, held below flare sink
    // x flare time, from where that equals the final's sink (between flare_alt and twice glide_alt). The final's line
    // goes on below the ground and is aimed short by the part of the flare's run past where it meets it, so the wheels
    // touch at the aim point
    const sinkFlare = circuit && p.flareSink > 0;
    const lineSlope = finalAlt / Math.max(p.approachLength, 1);
    const flareTime = p.flareTime > 0 ? p.flareTime : FLARE_TIME_S;
    const floorHeight = (p.flareSink || 0) * flareTime;
    const flareStart = sinkFlare ? Math.min(Math.max(lineSlope * p.speed * flareTime, p.flareAlt), 2 * p.glideAlt) : 0;
    const flareStartToGo = flareStart / Math.max(lineSlope, 0.001);
    const roundOutRun = flareStart > floorHeight ? p.speed * flareTime * Math.log(flareStart / floorHeight) : 0;
    const floorRun = Math.min(flareStart, floorHeight) / Math.max(p.flareSink || 0, 0.01) * p.speed;
    const flareRun = sinkFlare ? roundOutRun + floorRun - flareStartToGo : 0;
    // With the direction's runway start set the line crosses it at its height and the wheels touch where the flare
    // ends; else nav_fw_land_aim_offset before the site
    const runwayStart = p.approach.runwayStarts ? p.approach.runwayStarts[direction.aimIndex] : 0;
    let lineGroundBefore = p.aimOffset + flareRun;
    if (runwayStart > 0) {
        const height = Math.min(p.approach.runwayHeights ? p.approach.runwayHeights[direction.aimIndex] : 0, finalAlt);
        lineGroundBefore = runwayStart - height / Math.max(lineSlope, 0.001);
    }
    const aimOffset = lineGroundBefore - flareRun;
    const lineGround = move(site, L + 180, lineGroundBefore);
    const aim = move(lineGround, L, flareRun);
    const finalLength = p.approachLength + turnSpace;
    const finalStart = move(lineGround, L + 180, finalLength);
    const landWp = move(lineGround, L, finalLength);

    let circleCenter;
    let downwindDistance;
    let exitPoint;
    let exitHeading;
    let downwindCorner = null;
    if (circuit) {
        circleCenter = move(site, side, p.downwindOffset + circleRadius);
        const rightOfLanding = wrap180(side - L) > 0;
        const inner = rightOfLanding ? p.loiterDirection < 0 : p.loiterDirection > 0;
        // The downwind leg is the circle's far tangent, two radii further out. The circle is left heading down it;
        // when the circle turns towards the runway that heading comes on its near side, with no room for the base,
        // so it is left heading out instead, on the side of the final: a straight to roll level and a 90 degree
        // turn onto the downwind, which then lies out by both
        downwindDistance = p.downwindOffset + (inner
            ? circleRadius + turnSpace + p.speed * CIRCLE_EXIT_STRAIGHT_S
            : 2 * circleRadius);
        exitHeading = inner ? side : wrap360(L + 180);
        exitPoint = move(circleCenter, exitHeading - 90 * p.loiterDirection, circleRadius);
        if (inner) {
            const u = unit(side);
            const lateral = (exitPoint.n - site.n) * u.n + (exitPoint.e - site.e) * u.e;
            downwindCorner = move(exitPoint, side, Math.max(downwindDistance - lateral, 0));
        }
        if (p.downwindOffset < MIN_CIRCLE_GAP_M) {
            warnings.push({ id: AutolandWarning.CIRCLE_CLOSE, value: p.downwindOffset });
        }
    } else {
        circleCenter = site;
        downwindDistance = Math.max(p.loiterRadius * 4, p.approachLength / 2);
    }
    const turnWp = move(finalStart, side, downwindDistance);
    if (!circuit) {
        // The classic approach heads for the turn point from the circle over the site
        exitPoint = move(circleCenter, bearing(circleCenter, turnWp), circleRadius);
        exitHeading = bearing(exitPoint, turnWp);
    }
    if (circuit && downwindDistance < 2 * cornerRadius) {
        warnings.push({ id: AutolandWarning.BASE_SHORT, value: downwindDistance });
    }

    // Track: exit -> [straight out, corner onto the downwind | turn towards the turn point] -> downwind -> corner at
    // the turn point -> base -> corner at the final start -> final past the aim
    const track = [];
    const push = (points, phase, leg) => points.forEach((pt) => track.push({ ...pt, phase, leg }));
    push([exitPoint], Phase.DOWNWIND, 0);
    // The leg the firmware flies switches where the corner cut starts turning (FLY_BY)
    let downwindStart;
    let downwindFrom;   // the point the downwind's line runs from, towards the turn point
    let leg = 0;
    if (downwindCorner) {
        const corner0 = after(exitPoint, fillet(exitPoint, downwindCorner, turnWp, cornerRadius), turnWp, cornerRadius);
        push(straight(exitPoint, corner0.start), Phase.DOWNWIND, leg++);
        push(corner0.points.slice(1), Phase.DOWNWIND, leg);
        downwindStart = corner0.end;
        downwindFrom = corner0.moved ? corner0.end : downwindCorner;
    } else {
        const leaving = turnTowards(exitPoint, exitHeading, turnWp, cornerRadius);
        push(leaving, Phase.DOWNWIND, leg);
        downwindStart = leaving.length ? leaving[leaving.length - 1] : exitPoint;
        downwindFrom = downwindStart;
    }
    // each turn from where its leg really runs, so a turn that came late keeps the next leg tangent
    const corner1 = after(downwindStart, fillet(downwindFrom, turnWp, finalStart, cornerRadius), finalStart, cornerRadius);
    const corner2 = after(corner1.end, fillet(corner1.moved ? corner1.end : turnWp, finalStart, aim, cornerRadius), aim,
        cornerRadius);
    const touchdownEnd = move(aim, L, Math.max(aimOffset, 20));
    push(straight(downwindStart, corner1.start), Phase.DOWNWIND, leg++);
    push(corner1.points.slice(1), Phase.BASE, leg);
    push(straight(corner1.end, corner2.start), Phase.BASE, leg++);
    push(corner2.points.slice(1), Phase.TURN_FINAL, leg);
    push(straight(corner2.end, touchdownEnd), Phase.FINAL, leg);

    // Distance still to go (fwLandCircuitPathToGo): along the leg flown to its end, plus the distance from it, plus
    // the legs after it
    const baseLength = distance(turnWp, finalStart);
    const legs = [
        { end: turnWp, dir: wrap360(L + 180), after: baseLength + finalLength },
        { end: finalStart, dir: bearing(turnWp, finalStart), after: finalLength },
        { end: lineGround, dir: L, after: 0 }
    ];
    if (downwindCorner) {
        // straight out to the corner, square to the final
        const u = unit(L);
        const out = { n: downwindCorner.n - finalStart.n, e: downwindCorner.e - finalStart.e };
        const onFinal = out.n * u.n + out.e * u.e;
        const outward = bearing({ n: 0, e: 0 }, { n: out.n - onFinal * u.n, e: out.e - onFinal * u.e });
        legs.unshift({ end: downwindCorner, dir: outward, after: distance(downwindCorner, turnWp) + baseLength + finalLength });
    }
    const toGoOf = (pt) => {
        const flownLeg = legs[pt.leg];
        const u = unit(flownLeg.dir);
        let along = (flownLeg.end.n - pt.n) * u.n + (flownLeg.end.e - pt.e) * u.e;
        if (pt.leg < legs.length - 1) {
            along = Math.max(along, 0);
        }
        return along + Math.abs((flownLeg.end.n - pt.n) * u.e - (flownLeg.end.e - pt.e) * u.n) + flownLeg.after;
    };
    // the final's height over the distance to where its line meets the ground: the line, then the flare
    const finalLine = (toGo) => {
        if (!sinkFlare || toGo >= flareStartToGo) {
            return lineSlope * toGo;
        }
        const into = flareStartToGo - toGo;
        if (into < roundOutRun) {
            return flareStart * Math.exp(-into / (Math.max(p.speed, 1) * flareTime));
        }
        return Math.max(Math.min(flareStart, floorHeight) - (into - roundOutRun) * p.flareSink / Math.max(p.speed, 1), 0);
    };

    // Altitude asked along the track
    let flown = 0;
    const pathLength = toGoOf(track[0]);
    const before = Math.max(pathLength - p.approachLength, 1);
    for (let i = 0; i < track.length; i++) {
        if (i > 0) {
            flown += distance(track[i - 1], track[i]);
        }
        const pt = track[i];
        pt.flown = flown;
        pt.toGo = toGoOf(pt);
        if (circuit) {
            const descent = finalAlt + (p.approachAlt - finalAlt) * Math.min(Math.max(1 - flown / before, 0), 1);
            pt.alt = Math.min(descent, finalLine(pt.toGo));
        } else if (pt.phase === Phase.DOWNWIND) {
            pt.alt = p.approachAlt;
        } else if (pt.phase === Phase.BASE) {
            const baseLen = Math.max(distance(turnWp, finalStart), 1);
            const done = Math.min(distance(turnWp, pt) / (0.9 * baseLen), 1);
            pt.alt = p.approachAlt + (finalAlt - p.approachAlt) * done;
        } else {
            pt.alt = Math.min(finalAlt, finalLine(pt.toGo));
        }
        pt.alt = Math.max(pt.alt, 0);
    }

    // Throttle cut and flare where the final crosses their heights
    const crossing = (height) => {
        for (let i = 1; i < track.length; i++) {
            if (track[i - 1].alt > height && track[i].alt <= height) {
                const k = (track[i - 1].alt - height) / (track[i - 1].alt - track[i].alt);
                return {
                    n: track[i - 1].n + (track[i].n - track[i - 1].n) * k,
                    e: track[i - 1].e + (track[i].e - track[i - 1].e) * k,
                    flown: track[i - 1].flown + (track[i].flown - track[i - 1].flown) * k,
                    alt: height
                };
            }
        }
        return null;
    };
    const glide = crossing(sinkFlare ? flareStart - 0.01 : p.glideAlt);
    const flare = p.flareAlt > 0 ? crossing(p.flareAlt) : null;
    const touchdown = sinkFlare ? crossing(0.01) : null;
    for (const pt of track) {
        if (flare && pt.flown >= flare.flown) {
            pt.phase = Phase.FLARE;
        } else if (glide && pt.flown >= glide.flown) {
            pt.phase = Phase.GLIDE;
        }
    }

    const finalSlope = Math.atan(finalAlt / Math.max(p.approachLength, 1)) * 180 / Math.PI;
    if (finalSlope > STEEP_SLOPE_DEG) {
        warnings.push({ id: AutolandWarning.FINAL_STEEP, value: finalSlope });
    }
    // the runway starts where set for the direction, else where it is drawn (centred on the site): low before that is
    // low over the ground before the runway, which need not be level or clear
    const startBefore = runwayStart > 0 ? runwayStart : p.runwayLength / 2;
    if (startBefore > 0) {
        const threshold = move(site, L + 180, startBefore);
        const u = unit(L);
        const low = track.find((pt) => pt.phase !== Phase.DOWNWIND && pt.phase !== Phase.BASE && pt.alt < LOW_HEIGHT_M);
        const shortOf = low ? (threshold.n - low.n) * u.n + (threshold.e - low.e) * u.e : 0;
        if (shortOf > 1) {
            warnings.push({ id: AutolandWarning.LOW_BEFORE_RUNWAY, value: shortOf, height: LOW_HEIGHT_M });
        }
    }
    if (circuit) {
        const legsSlope = Math.atan((p.approachAlt - finalAlt) / before) * 180 / Math.PI;
        if (legsSlope > STEEP_SLOPE_DEG) {
            warnings.push({ id: AutolandWarning.LEGS_STEEP, value: legsSlope });
        }
    }

    return {
        landing: L,
        side,
        circuit,
        circle: { center: circleCenter, radius: circleRadius },
        aimIndex: direction.aimIndex,
        aimOffset,
        waypoints: { exit: exitPoint, downwind: downwindCorner, turn: turnWp, finalStart, aim, land: landWp },
        cornerRadius,
        finalAlt,
        track,
        glide,
        flare,
        sinkFlare,
        touchdown,
        warnings
    };
}

function planAutoland(p) {
    const warnings = [];
    const finalAlt = p.finalAlt > 0 ? p.finalAlt : p.approachAlt / 3 * 2;
    if (finalAlt > p.approachAlt) {
        warnings.push({ id: AutolandWarning.FINAL_ABOVE_APPROACH, value: finalAlt });
    }
    if (p.flareAlt > 0 && p.glideAlt <= p.flareAlt) {
        warnings.push({ id: AutolandWarning.GLIDE_BELOW_FLARE, value: p.glideAlt });
    }
    const directions = landingDirections(p.approach);
    if (directions.length === 0) {
        warnings.push({ id: AutolandWarning.NO_HEADING });
    }
    return { warnings, directions: directions.map((d) => planDirection(p, d)) };
}

export {
    ApproachSide,
    AutolandWarning,
    LoiterDirection,
    Phase,
    approachSide,
    coordinatedTurnRadius,
    landingDirections,
    planAutoland,
    turnEaseTimeMs
};
