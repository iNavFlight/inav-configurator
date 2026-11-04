import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    ApproachSide,
    AutolandWarning,
    LoiterDirection,
    Phase,
    coordinatedTurnRadius,
    landingDirections,
    planAutoland
} from '../js/autoland_geometry.js';

// A small field: runway heading 323, circuit on the right, 10 m from the runway
const circuit = {
    approach: { side: ApproachSide.RIGHT, heading1: 323, heading2: 0 },
    approachAlt: 35,
    finalAlt: 7,
    approachLength: 70,
    downwindOffset: 10,
    landLoiterRadius: 30,
    loiterRadius: 75,
    aimOffset: 40,
    glideAlt: 2,
    flareAlt: 1.5,
    speed: 19,
    bankDeg: 35,
    rollRateDps: 180,
    controlSmoothness: 2,
    wpTurnControlEaseMs: 100,
    loiterDirection: LoiterDirection.RIGHT
};

const near = (actual, expected, tolerance, what) =>
    assert.ok(Math.abs(actual - expected) <= tolerance, `${what}: ${actual} instead of ${expected} +- ${tolerance}`);

test('coordinated turn radius is v^2 / (g tan bank)', () => {
    near(coordinatedTurnRadius(19, 35), 52.6, 0.1, 'radius');
    assert.equal(coordinatedTurnRadius(2, 35), 10);
});

test('a positive heading lands both ways, a negative one only that way', () => {
    assert.deepEqual(landingDirections({ heading1: 323, heading2: 0 }).map((d) => d.landing), [323, 143]);
    assert.deepEqual(landingDirections({ heading1: -323, heading2: 90 }).map((d) => d.landing), [323, 90, 270]);
});

test('circuit: wind circle on the free side, widened to the turn the aircraft can fly', () => {
    const plan = planAutoland(circuit).directions[0];
    near(plan.circle.radius, 52.6, 0.1, 'circle radius');
    near(Math.hypot(plan.circle.center.n, plan.circle.center.e), 10 + 52.6, 0.1, 'centre distance');
    assert.ok(plan.warnings.some((w) => w.id === AutolandWarning.CIRCLE_WIDER));
    // right of heading 323 is bearing 53
    near(Math.atan2(plan.circle.center.e, plan.circle.center.n) * 180 / Math.PI, 53, 0.5, 'centre bearing');
});

test('circuit: right turns on the right side fly the downwind two radii further out', () => {
    const plan = planAutoland(circuit).directions[0];
    const fa = plan.waypoints.finalStart;
    const turn = plan.waypoints.turn;
    near(Math.hypot(turn.n - fa.n, turn.e - fa.e), 10 + 2 * 52.6, 0.2, 'base length');
    // final straight = approach length + the space a 90 degree turn takes (arc plus roll-in)
    const aim = plan.waypoints.aim;
    near(Math.hypot(aim.n - fa.n, aim.e - fa.e), 70 + 52.6 + 19 * 0.592 * 1.5, 0.5, 'final length');
});

test('circuit: altitude falls to the final altitude before the straight final and to the ground at the aim', () => {
    const plan = planAutoland(circuit).directions[0];
    near(plan.track[0].alt, 35, 0.5, 'exit altitude');
    const onFinal = plan.track.filter((p) => p.toGo <= 70.5 && p.toGo >= 69.5 && p.phase === Phase.FINAL);
    onFinal.forEach((p) => near(p.alt, 7, 0.2, 'final start'));
    const atAim = plan.track.reduce((a, b) => (Math.abs(b.toGo) < Math.abs(a.toGo) ? b : a));
    near(atAim.alt, 0, 0.2, 'aim');
    near(plan.glide.alt, 2, 1e-6, 'glide');
    assert.ok(plan.flare.flown > plan.glide.flown);
    for (let i = 1; i < plan.track.length; i++) {
        assert.ok(plan.track[i].alt <= plan.track[i - 1].alt + 1e-6, 'the circuit never climbs');
    }
});

test('reciprocal direction keeps the circuit on the same physical side', () => {
    const [a, b] = planAutoland(circuit).directions;
    assert.equal(a.side, b.side);
    near(a.circle.center.n, b.circle.center.n, 1e-6, 'same circle');
});

test('reciprocal direction: the circle turns towards the runway, so it is left heading out, straight to a square turn', () => {
    const plan = planAutoland(circuit).directions[1];
    assert.equal(plan.landing, 143);
    // right turns: heading 53 (out of the runway) is flown at bearing 323 from the centre, towards the final start
    const exit = plan.waypoints.exit;
    near(Math.atan2(exit.e - plan.circle.center.e, exit.n - plan.circle.center.n) * 180 / Math.PI, -37, 0.5, 'exit bearing');
    // straight out for the turn space plus 1.5 s, then a 90 degree turn onto the downwind
    const turnSpace = 52.6 + 19 * 0.592 * 1.5;
    const corner = plan.waypoints.downwind;
    near(Math.hypot(corner.n - exit.n, corner.e - exit.e), turnSpace + 19 * 1.5, 0.5, 'straight out');
    near(Math.atan2(corner.e - exit.e, corner.n - exit.n) * 180 / Math.PI, 53, 0.5, 'straight heading');
    const fa = plan.waypoints.finalStart;
    const turn = plan.waypoints.turn;
    near(Math.hypot(turn.n - fa.n, turn.e - fa.e), 10 + 52.6 + turnSpace + 19 * 1.5, 0.5, 'base');
    assert.ok(!plan.warnings.some((w) => w.id === AutolandWarning.BASE_SHORT));
    const out = (pt) => pt.n * Math.cos(53 * Math.PI / 180) + pt.e * Math.sin(53 * Math.PI / 180);
    plan.track.forEach((pt) => assert.ok(out(pt) > -1e-6, 'never past the runway axis'));
    for (let i = 1; i < plan.track.length; i++) {
        assert.ok(plan.track[i].alt <= plan.track[i - 1].alt + 1e-6, 'the circuit never climbs');
        assert.ok(plan.track[i].toGo <= plan.track[i - 1].toGo + 1, 'the distance to go never grows');
    }
});

// The track as a polyline never turns back on itself: two corner cuts closer than their tangents join without a spike
const noTurnBack = (track, what) => {
    for (let i = 2; i < track.length; i++) {
        const a = { n: track[i - 1].n - track[i - 2].n, e: track[i - 1].e - track[i - 2].e };
        const b = { n: track[i].n - track[i - 1].n, e: track[i].e - track[i - 1].e };
        const la = Math.hypot(a.n, a.e);
        const lb = Math.hypot(b.n, b.e);
        if (la < 0.01 || lb < 0.01) {
            continue;
        }
        const turn = Math.acos(Math.max(-1, Math.min(1, (a.n * b.n + a.e * b.e) / (la * lb)))) * 180 / Math.PI;
        assert.ok(turn < 8, `${what}: the track turns ${turn.toFixed(0)} degrees at point ${i}`);
    }
};

test('the circuit joins its corner cuts without turning back, a short downwind included', () => {
    // 13 m/s, a 35 m circle 10 m off a runway on heading 90 that starts 20 m before the site: landing towards 270
    // leaves the circle heading out, and the downwind between the square turn and the base turn is shorter than the
    // two turns
    const small = {
        ...circuit,
        approach: { side: ApproachSide.RIGHT, heading1: 90, heading2: 0, runwayStarts: [20, 20, 0, 0], runwayHeights: [2, 2, 0, 0] },
        runwayLength: 100,
        flareSink: 0.15,
        flareTime: 2,
        approachAlt: 20,
        finalAlt: 6,
        approachLength: 60,
        downwindOffset: 10,
        landLoiterRadius: 35,
        aimOffset: 60,
        speed: 13
    };
    for (const p of [circuit, small]) {
        planAutoland(p).directions.forEach((dir, i) => noTurnBack(dir.track, `heading ${p.approach.heading1} direction ${i}`));
    }
});

// the sharpest turn between two segments of the track [deg]
const sharpest = (track) => {
    let worst = 0;
    for (let i = 2; i < track.length; i++) {
        const a = Math.atan2(track[i - 1].e - track[i - 2].e, track[i - 1].n - track[i - 2].n);
        const b = Math.atan2(track[i].e - track[i - 1].e, track[i].n - track[i - 1].n);
        if (Math.hypot(track[i].e - track[i - 1].e, track[i].n - track[i - 1].n) > 0.01) {
            worst = Math.max(worst, Math.abs(((b - a) * 180 / Math.PI + 540) % 360 - 180));
        }
    }
    return worst;
};

test('a corner the firmware does not cut: a 180 degree one is planned, and turned at the waypoint', () => {
    // a reversal at a waypoint had an infinite lead: the plan never ended
    const reversed = {
        ...circuit,
        approach: { side: ApproachSide.RIGHT, heading1: 180, heading2: -270, runwayStarts: [0, 0, 0, 0], runwayHeights: [0, 0, 0, 0] },
        approachAlt: 35,
        finalAlt: 6,
        approachLength: 60,
        downwindOffset: 10,
        landLoiterRadius: 35,
        aimOffset: 60,
        runwayLength: 100,
        loiterDirection: LoiterDirection.RIGHT
    };
    planAutoland(reversed).directions.forEach((dir, i) => assert.ok(sharpest(dir.track) < 20, `direction ${i}: the track folds`));
});

test('classic approach with a short final: the turn onto the base starts at the turn point, as the firmware flies it', () => {
    // 60 m of final: the turn at the turn point is about 170 degrees, past the firmware's corner cut (160)
    const classic = { ...circuit, downwindOffset: 0, finalAlt: 0, approachLength: 60, landLoiterRadius: 0 };
    for (const dir of planAutoland(classic).directions) {
        const base = dir.track.find((pt) => pt.phase === Phase.BASE);
        const fromTurn = Math.hypot(base.n - dir.waypoints.turn.n, base.e - dir.waypoints.turn.e);
        assert.ok(fromTurn < 6, `the base turn starts ${fromTurn.toFixed(1)} m from the turn point`);
        assert.ok(sharpest(dir.track) < 8, 'the track folds');
    }
});

test('sink-rate flare: it starts where its law asks the sink of the final and the wheels touch at the aim point', () => {
    const plan = planAutoland({ ...circuit, flareSink: 0.15, flareTime: 2 }).directions[0];
    assert.ok(plan.sinkFlare);
    // the line's 1.9 m/s sink is h / 2 at 3.8 m, 38 m before the line meets the ground; the flare touches
    // 19 m/s x 2 s x (ln(3.8 / 0.3) + 1) after its start, so the line is aimed short by the rest
    const run = 38 * (Math.log(3.8 / 0.3) + 1) - 38;
    const aim = plan.waypoints.aim;
    const fa = plan.waypoints.finalStart;
    const turnSpace = 52.6 + 19 * 0.592 * 1.5;
    near(Math.hypot(aim.n - fa.n, aim.e - fa.e), 70 + turnSpace + run, 0.5, 'final start');
    near(Math.hypot(plan.touchdown.n - aim.n, plan.touchdown.e - aim.e), 0, 2, 'touchdown at the aim point');
    // sink = height / 2 s in the flare: 0.5 m/s at 1 m, 19 m/s over the ground
    const final = plan.track.filter((pt) => pt.phase !== Phase.DOWNWIND && pt.phase !== Phase.BASE);
    const k = final.findIndex((pt) => pt.alt < 1);
    const sink = (final[k - 1].alt - final[k].alt) / (final[k].flown - final[k - 1].flown) * 19;
    near(sink, 0.5, 0.05, 'sink at 1 m');
    for (let i = 1; i < plan.track.length; i++) {
        assert.ok(plan.track[i].alt <= plan.track[i - 1].alt + 1e-6, 'the circuit never climbs');
    }
});

test('a landing direction with its runway start crosses it at its height, the others touch at the common point', () => {
    const p = { ...circuit, flareSink: 0.15, approach: { ...circuit.approach, runwayStarts: [50, 0, 0, 0], runwayHeights: [2, 0, 0, 0] } };
    const [first, second] = planAutoland(p).directions;
    // heading 323 from the site: the runway start is 50 m back along 143
    const u = { n: Math.cos(143 * Math.PI / 180), e: Math.sin(143 * Math.PI / 180) };
    const final = first.track.filter((pt) => pt.phase !== Phase.DOWNWIND && pt.phase !== Phase.BASE);
    const atStart = final.reduce((a, b) => (Math.abs(b.n * u.n + b.e * u.e - 50) < Math.abs(a.n * u.n + a.e * u.e - 50) ? b : a));
    // the line crosses it at 2 m; the flare, started at 3.8 m 18 m before, keeps the aircraft above: 3.8 x e^(-18/38)
    near(atStart.alt, 3.8 * Math.exp(-18 / 38), 0.2, 'height over the runway start');
    assert.ok(first.aimOffset < 50, 'touchdown past the runway start');
    near(Math.hypot(second.waypoints.aim.n, second.waypoints.aim.e), 40, 1e-6, 'its reverse, the common one');
});

test('warning: low over the ground before a runway drawn around the site', () => {
    const p = { ...circuit, flareSink: 0.15, runwayLength: 100 };
    const low = planAutoland(p).directions[0].warnings.find((w) => w.id === AutolandWarning.LOW_BEFORE_RUNWAY);
    assert.ok(low && low.value > 0, 'below 2 m before the threshold 50 m from the site');
    // crossing the runway start at 2 m
    const inside = planAutoland({ ...p, approach: { ...p.approach, runwayStarts: [50, 0, 0, 0], runwayHeights: [2, 0, 0, 0] } }).directions[0];
    assert.ok(!inside.warnings.some((w) => w.id === AutolandWarning.LOW_BEFORE_RUNWAY), 'over the runway start at 2 m');
});

test('classic approach: turn point 4 loiter radii beside the final start, level downwind', () => {
    const plan = planAutoland({ ...circuit, downwindOffset: 0, finalAlt: 0 }).directions[0];
    const fa = plan.waypoints.finalStart;
    const turn = plan.waypoints.turn;
    near(Math.hypot(turn.n - fa.n, turn.e - fa.e), 300, 0.1, 'turn point');
    near(Math.hypot(plan.waypoints.aim.n - fa.n, plan.waypoints.aim.e - fa.e), 70, 0.1, 'final length');
    plan.track.filter((p) => p.phase === Phase.DOWNWIND).forEach((p) => near(p.alt, 35, 1e-6, 'downwind'));
    near(plan.finalAlt, 35 / 3 * 2, 1e-6, 'default final altitude');
});

test('warnings: steep final, no heading, glide below flare', () => {
    const steep = planAutoland({ ...circuit, finalAlt: 15 });
    assert.ok(steep.directions[0].warnings.some((w) => w.id === AutolandWarning.FINAL_STEEP));
    assert.ok(planAutoland({ ...circuit, approach: { ...circuit.approach, heading1: 0 } }).warnings
        .some((w) => w.id === AutolandWarning.NO_HEADING));
    assert.ok(planAutoland({ ...circuit, glideAlt: 1 }).warnings.some((w) => w.id === AutolandWarning.GLIDE_BELOW_FLARE));
});
