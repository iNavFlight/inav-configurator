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
// the firmware's corner cut (navigation_fixedwing.c): FLY_BY below 160 degrees, its lead capped at tan(half angle) 3.7
const FLY_BY_MAX_DEG = 160;
const TURN_LEAD_TAN_MAX = 3.7;
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

// the landing site: the frame's origin
const SITE = Object.freeze({ n: 0, e: 0 });

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

/*
 * Corner cut of radius r between the legs a->corner and corner->b, as points along the arc. As the firmware: a turn
 * whose lead would pass the cap starts at the capped lead and is flown direct, turning until it points at the next
 * waypoint; a turn of 160 degrees or more is not cut, the aircraft turns at the waypoint itself
 */
function fillet(a, corner, b, r) {
    const inBearing = bearing(a, corner);
    const outBearing = bearing(corner, b);
    const turn = wrap180(outBearing - inBearing);
    const halfTan = Math.tan(rad(Math.abs(turn) / 2));
    if (Math.abs(turn) >= FLY_BY_MAX_DEG || halfTan > TURN_LEAD_TAN_MAX) {
        const lead = Math.abs(turn) >= FLY_BY_MAX_DEG ? 0 : r * TURN_LEAD_TAN_MAX;
        const start = move(corner, inBearing + 180, lead);
        const points = [start, ...turnTowards(start, inBearing, b, r)];
        return { start, end: points.at(-1), points, tangent: lead, inBearing, moved: true };
    }
    const tangent = r * halfTan;
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
    return { start: prevEnd, end: arc.at(-1), points: [prevEnd, ...arc], inBearing: corner.inBearing, moved: true };
}

/* Arc of radius r from a heading until the aircraft points at the target, as the navigation turns after the circle */
function turnTowards(start, heading, target, r) {
    const points = [];
    const off = wrap180(bearing(start, target) - heading);
    if (Math.abs(off) < ARC_STEP_DEG) {
        return points;
    }
    let dir = off > 0 ? 1 : -1;
    let center = move(start, heading + 90 * dir, r);
    if (distance(center, target) <= r) {
        // the target is inside the turn on that side: the aircraft goes the other way round
        dir = -dir;
        center = move(start, heading + 90 * dir, r);
        if (distance(center, target) <= r) {
            return points;
        }
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

/* The turn radii a direction plans with: the coordinated turn at the approach speed, the wind circle widened to it */
function planRadii(ctx) {
    const p = ctx.p;
    const turnRadius = coordinatedTurnRadius(p.speed, p.bankDeg);
    const plannedLead = turnRadius + p.speed * turnEaseTimeMs(p) / 1000 * 1.5;
    const loiterRadius = p.landLoiterRadius > 0 ? p.landLoiterRadius : p.loiterRadius;
    const circleRadius = ctx.circuit ? Math.max(loiterRadius, turnRadius) : loiterRadius;
    if (ctx.circuit && p.landLoiterRadius > 0 && turnRadius > p.landLoiterRadius + 0.5) {
        ctx.warnings.push({ id: AutolandWarning.CIRCLE_WIDER, value: turnRadius, speed: p.speed, bank: p.bankDeg, setting: p.landLoiterRadius });
    }
    // Turn space before the straight final, and the radius the corners are flown at
    return {
        circleRadius,
        turnSpace: ctx.circuit ? Math.max(loiterRadius, plannedLead, circleRadius) : 0,
        cornerRadius: ctx.circuit ? circleRadius : turnRadius
    };
}

/*
 * Sink-rate flare (nav_fw_land_flare_sink): it asks height / flare time down to the flare sink, held below flare sink
 * x flare time, from where that equals the final's sink (between flare_alt and twice glide_alt). The final's line goes
 * on below the ground and is aimed short by the part of the flare's run past where it meets it, so the wheels touch at
 * the aim point
 */
function planFlare(ctx) {
    const p = ctx.p;
    const sinkFlare = ctx.circuit && p.flareSink > 0;
    const lineSlope = ctx.finalAlt / Math.max(p.approachLength, 1);
    const flareTime = p.flareTime > 0 ? p.flareTime : FLARE_TIME_S;
    const floorHeight = (p.flareSink || 0) * flareTime;
    const flareStart = sinkFlare ? Math.min(Math.max(lineSlope * p.speed * flareTime, p.flareAlt), 2 * p.glideAlt) : 0;
    const flareStartToGo = flareStart / Math.max(lineSlope, 0.001);
    const roundOutRun = flareStart > floorHeight ? p.speed * flareTime * Math.log(flareStart / floorHeight) : 0;
    const floorRun = Math.min(flareStart, floorHeight) / Math.max(p.flareSink || 0, 0.01) * p.speed;
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
    return { sinkFlare, lineSlope, flareStart, flareRun: sinkFlare ? roundOutRun + floorRun - flareStartToGo : 0, finalLine };
}

/* With the direction's runway start set the line crosses it at its height and the wheels touch where the flare ends;
   else nav_fw_land_aim_offset before the site */
function planFinal(ctx, direction, flare, turnSpace) {
    const p = ctx.p;
    const runwayStart = p.approach.runwayStarts ? p.approach.runwayStarts[direction.aimIndex] : 0;
    let lineGroundBefore = p.aimOffset + flare.flareRun;
    if (runwayStart > 0) {
        const height = Math.min(p.approach.runwayHeights ? p.approach.runwayHeights[direction.aimIndex] : 0, ctx.finalAlt);
        lineGroundBefore = runwayStart - height / Math.max(flare.lineSlope, 0.001);
    }
    const lineGround = move(SITE, ctx.L + 180, lineGroundBefore);
    const finalLength = p.approachLength + turnSpace;
    return {
        runwayStart,
        aimOffset: lineGroundBefore - flare.flareRun,
        lineGround,
        aim: move(lineGround, ctx.L, flare.flareRun),
        finalLength,
        finalStart: move(lineGround, ctx.L + 180, finalLength),
        landWp: move(lineGround, ctx.L, finalLength)
    };
}

/*
 * The wind circle, where it is left and the turn point before the base. The circuit's downwind leg is the circle's far
 * tangent, two radii further out. The circle is left heading down it; when the circle turns towards the runway that
 * heading comes on its near side, with no room for the base, so it is left heading out instead, on the side of the
 * final: a straight to roll level and a 90 degree turn onto the downwind, which then lies out by both
 */
function planCircle(ctx, radii, finalStart) {
    const p = ctx.p;
    if (!ctx.circuit) {
        // The classic approach heads for the turn point from the circle over the site
        const turnWp = move(finalStart, ctx.side, Math.max(p.loiterRadius * 4, p.approachLength / 2));
        const exitPoint = move(SITE, bearing(SITE, turnWp), radii.circleRadius);
        return { circleCenter: SITE, exitPoint, exitHeading: bearing(exitPoint, turnWp), downwindCorner: null, turnWp };
    }
    const circleCenter = move(SITE, ctx.side, p.downwindOffset + radii.circleRadius);
    const rightOfLanding = wrap180(ctx.side - ctx.L) > 0;
    const inner = rightOfLanding ? p.loiterDirection < 0 : p.loiterDirection > 0;
    const out = inner ? radii.circleRadius + radii.turnSpace + p.speed * CIRCLE_EXIT_STRAIGHT_S : 2 * radii.circleRadius;
    const downwindDistance = p.downwindOffset + out;
    const exitHeading = inner ? ctx.side : wrap360(ctx.L + 180);
    const exitPoint = move(circleCenter, exitHeading - 90 * p.loiterDirection, radii.circleRadius);
    let downwindCorner = null;
    if (inner) {
        const u = unit(ctx.side);
        const lateral = exitPoint.n * u.n + exitPoint.e * u.e;
        downwindCorner = move(exitPoint, ctx.side, Math.max(downwindDistance - lateral, 0));
    }
    if (p.downwindOffset < MIN_CIRCLE_GAP_M) {
        ctx.warnings.push({ id: AutolandWarning.CIRCLE_CLOSE, value: p.downwindOffset });
    }
    if (downwindDistance < 2 * radii.cornerRadius) {
        ctx.warnings.push({ id: AutolandWarning.BASE_SHORT, value: downwindDistance });
    }
    return { circleCenter, exitPoint, exitHeading, downwindCorner, turnWp: move(finalStart, ctx.side, downwindDistance) };
}

/*
 * Track: exit -> [straight out, corner onto the downwind | turn towards the turn point] -> downwind -> corner at the
 * turn point -> base -> corner at the final start -> final past the aim. The leg the firmware flies switches where the
 * corner cut starts turning (FLY_BY); each turn from where its leg really runs, so a turn that came late keeps the
 * next leg tangent
 */
function planTrack(ctx, c, fin, r) {
    const track = [];
    const push = (points, phase, leg) => points.forEach((pt) => track.push({ ...pt, phase, leg }));
    push([c.exitPoint], Phase.DOWNWIND, 0);
    let downwindStart = c.exitPoint;
    let downwindFrom;   // the point the downwind's line runs from, towards the turn point
    let leg = 0;
    if (c.downwindCorner) {
        const corner0 = after(c.exitPoint, fillet(c.exitPoint, c.downwindCorner, c.turnWp, r), c.turnWp, r);
        push(straight(c.exitPoint, corner0.start), Phase.DOWNWIND, leg++);
        push(corner0.points.slice(1), Phase.DOWNWIND, leg);
        downwindStart = corner0.end;
        downwindFrom = corner0.moved ? corner0.end : c.downwindCorner;
    } else {
        const leaving = turnTowards(c.exitPoint, c.exitHeading, c.turnWp, r);
        push(leaving, Phase.DOWNWIND, leg);
        if (leaving.length) {
            downwindStart = leaving.at(-1);
        }
        downwindFrom = downwindStart;
    }
    const corner1 = after(downwindStart, fillet(downwindFrom, c.turnWp, fin.finalStart, r), fin.finalStart, r);
    const corner2 = after(corner1.end, fillet(corner1.moved ? corner1.end : c.turnWp, fin.finalStart, fin.aim, r), fin.aim, r);
    push(straight(downwindStart, corner1.start), Phase.DOWNWIND, leg++);
    push(corner1.points.slice(1), Phase.BASE, leg);
    push(straight(corner1.end, corner2.start), Phase.BASE, leg++);
    push(corner2.points.slice(1), Phase.TURN_FINAL, leg);
    push(straight(corner2.end, move(fin.aim, ctx.L, Math.max(fin.aimOffset, 20))), Phase.FINAL, leg);
    return track;
}

/* Distance still to go (fwLandCircuitPathToGo): along the leg flown to its end, plus the distance from it, plus the
   legs after it */
function planToGo(ctx, c, fin) {
    const baseLength = distance(c.turnWp, fin.finalStart);
    const legs = [
        { end: c.turnWp, dir: wrap360(ctx.L + 180), after: baseLength + fin.finalLength },
        { end: fin.finalStart, dir: bearing(c.turnWp, fin.finalStart), after: fin.finalLength },
        { end: fin.lineGround, dir: ctx.L, after: 0 }
    ];
    if (c.downwindCorner) {
        // straight out to the corner, square to the final
        const u = unit(ctx.L);
        const out = { n: c.downwindCorner.n - fin.finalStart.n, e: c.downwindCorner.e - fin.finalStart.e };
        const onFinal = out.n * u.n + out.e * u.e;
        const outward = bearing(SITE, { n: out.n - onFinal * u.n, e: out.e - onFinal * u.e });
        legs.unshift({ end: c.downwindCorner, dir: outward, after: distance(c.downwindCorner, c.turnWp) + baseLength + fin.finalLength });
    }
    return (pt) => {
        const flownLeg = legs[pt.leg];
        const u = unit(flownLeg.dir);
        let along = (flownLeg.end.n - pt.n) * u.n + (flownLeg.end.e - pt.e) * u.e;
        if (pt.leg < legs.length - 1) {
            along = Math.max(along, 0);
        }
        return along + Math.abs((flownLeg.end.n - pt.n) * u.e - (flownLeg.end.e - pt.e) * u.n) + flownLeg.after;
    };
}

/* The altitude asked at a point: the circuit descends evenly to the final, the classic approach on its base */
function altitudeAt(ctx, pt, before, flare, c, fin) {
    const p = ctx.p;
    if (ctx.circuit) {
        const descent = ctx.finalAlt + (p.approachAlt - ctx.finalAlt) * Math.min(Math.max(1 - pt.flown / before, 0), 1);
        return Math.min(descent, flare.finalLine(pt.toGo));
    }
    if (pt.phase === Phase.DOWNWIND) {
        return p.approachAlt;
    }
    if (pt.phase === Phase.BASE) {
        const baseLen = Math.max(distance(c.turnWp, fin.finalStart), 1);
        const done = Math.min(distance(c.turnWp, pt) / (0.9 * baseLen), 1);
        return p.approachAlt + (ctx.finalAlt - p.approachAlt) * done;
    }
    return Math.min(ctx.finalAlt, flare.finalLine(pt.toGo));
}

/* Distance flown, to go and the altitude asked along the track; returns the distance the circuit's legs descend over */
function planAltitudes(ctx, track, flare, c, fin) {
    const toGoOf = planToGo(ctx, c, fin);
    const before = Math.max(toGoOf(track[0]) - ctx.p.approachLength, 1);
    let flown = 0;
    for (let i = 0; i < track.length; i++) {
        if (i > 0) {
            flown += distance(track[i - 1], track[i]);
        }
        const pt = track[i];
        pt.flown = flown;
        pt.toGo = toGoOf(pt);
        pt.alt = Math.max(altitudeAt(ctx, pt, before, flare, c, fin), 0);
    }
    return before;
}

/* Where the final crosses a height, between two track points */
function crossingOf(track, height) {
    for (let i = 1; i < track.length; i++) {
        const a = track[i - 1];
        const b = track[i];
        if (a.alt > height && b.alt <= height) {
            const k = (a.alt - height) / (a.alt - b.alt);
            return { n: a.n + (b.n - a.n) * k, e: a.e + (b.e - a.e) * k, flown: a.flown + (b.flown - a.flown) * k, alt: height };
        }
    }
    return null;
}

/* Throttle cut and flare where the final crosses their heights, the track's phases after them */
function planFlareMarks(ctx, track, flare) {
    const glide = crossingOf(track, flare.sinkFlare ? flare.flareStart - 0.01 : ctx.p.glideAlt);
    const flarePoint = ctx.p.flareAlt > 0 ? crossingOf(track, ctx.p.flareAlt) : null;
    for (const pt of track) {
        if (flarePoint && pt.flown >= flarePoint.flown) {
            pt.phase = Phase.FLARE;
        } else if (glide && pt.flown >= glide.flown) {
            pt.phase = Phase.GLIDE;
        }
    }
    return { glide, flare: flarePoint, touchdown: flare.sinkFlare ? crossingOf(track, 0.01) : null };
}

/* The slopes, and the height over the ground before the runway */
function planWarnings(ctx, track, before, runwayStart) {
    const p = ctx.p;
    const finalSlope = Math.atan(ctx.finalAlt / Math.max(p.approachLength, 1)) * 180 / Math.PI;
    if (finalSlope > STEEP_SLOPE_DEG) {
        ctx.warnings.push({ id: AutolandWarning.FINAL_STEEP, value: finalSlope });
    }
    // the runway starts where set for the direction, else where it is drawn (centred on the site): low before that is
    // low over the ground before the runway, which need not be level or clear
    const startBefore = runwayStart > 0 ? runwayStart : p.runwayLength / 2;
    const low = track.find((pt) => pt.phase !== Phase.DOWNWIND && pt.phase !== Phase.BASE && pt.alt < LOW_HEIGHT_M);
    if (startBefore > 0 && low) {
        const threshold = move(SITE, ctx.L + 180, startBefore);
        const u = unit(ctx.L);
        const shortOf = (threshold.n - low.n) * u.n + (threshold.e - low.e) * u.e;
        if (shortOf > 1) {
            ctx.warnings.push({ id: AutolandWarning.LOW_BEFORE_RUNWAY, value: shortOf, height: LOW_HEIGHT_M });
        }
    }
    const legsSlope = Math.atan((p.approachAlt - ctx.finalAlt) / before) * 180 / Math.PI;
    if (ctx.circuit && legsSlope > STEEP_SLOPE_DEG) {
        ctx.warnings.push({ id: AutolandWarning.LEGS_STEEP, value: legsSlope });
    }
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
    const ctx = {
        p,
        circuit,
        L: direction.landing,
        side: approachSide(p.approach, direction.configured, circuit),
        finalAlt: p.finalAlt > 0 ? p.finalAlt : p.approachAlt / 3 * 2,
        warnings: []
    };
    const radii = planRadii(ctx);
    const flare = planFlare(ctx);
    const fin = planFinal(ctx, direction, flare, radii.turnSpace);
    const c = planCircle(ctx, radii, fin.finalStart);
    const track = planTrack(ctx, c, fin, radii.cornerRadius);
    const before = planAltitudes(ctx, track, flare, c, fin);
    const marks = planFlareMarks(ctx, track, flare);
    planWarnings(ctx, track, before, fin.runwayStart);

    return {
        landing: ctx.L,
        side: ctx.side,
        circuit,
        circle: { center: c.circleCenter, radius: radii.circleRadius },
        aimIndex: direction.aimIndex,
        aimOffset: fin.aimOffset,
        waypoints: { exit: c.exitPoint, downwind: c.downwindCorner, turn: c.turnWp, finalStart: fin.finalStart, aim: fin.aim, land: fin.landWp },
        cornerRadius: radii.cornerRadius,
        finalAlt: ctx.finalAlt,
        track,
        glide: marks.glide,
        flare: marks.flare,
        sinkFlare: flare.sinkFlare,
        touchdown: marks.touchdown,
        warnings: ctx.warnings
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
