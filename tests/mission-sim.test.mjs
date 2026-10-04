import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import MWNP from '../js/mwnp.js';
import {
    SimEvent,
    TurnMode,
    altitudeAlongLeg,
    bankForTurnRate,
    buildLandingApproach,
    landingHeading,
    resolveRouteAltitudes,
    withLandingApproaches,
    bearingBetween,
    commandedTurnRadius,
    destination,
    distanceBetween,
    arcTurnRadius,
    flyByLeadDistance,
    flyIntoSTurn,
    getSimulationRoute,
    headingDifference,
    phaseRuns,
    planningTurnRadius,
    rejoinIntercept,
    simulateGroundTrack,
    turnRadius,
    turnRateDegPerSecond
} from '../js/mission_sim.js';

function waypoint({
    action = MWNP.WPTYPE.WAYPOINT, lat = 47, lon = 8, number = 0,
    endMission = 0, attached = false, altCm = 5000, p3 = 0
} = {}) {
    return {
        getAction: () => action,
        getLatMap: () => lat,
        getLonMap: () => lon,
        getNumber: () => number,
        getEndMission: () => endMission,
        isAttached: () => attached,
        getAlt: () => altCm,
        getP3: () => p3,
        getMultiMissionIdx: () => 0
    };
}

// Fixture values, taken from an INAV 9.0.1 SITL demo profile only so that the
// numbers here have realistic magnitudes and units. They are NOT a reference
// configuration and nothing outside these tests may assume them — the simulator
// reads every one of these from the connected flight controller.
// Deliberately different from DEFAULT_PARAMS in mission_sim.js: if the simulator
// ignored the parameters it is handed, these tests have to notice.
const FC = {
    bankAngleDeg: 25,
    waypointRadiusM: 12,
    speedMs: 22,
    turnMaxLeadTimeMs: 7000
};

const HOME = {lat: 47.5716018, lon: 9.3338224};

function legLengths(samples) {
    const lengths = [];
    for (let index = 1; index < samples.length; index++) {
        lengths.push(distanceBetween(samples[index - 1], samples[index]));
    }
    return lengths;
}

// Signed distance from the great-circle line through `from`->`to`.
function crossTrackDistance(from, to, point) {
    const R = 6371000;
    const d13 = distanceBetween(from, point) / R;
    const theta13 = bearingBetween(from, point) * Math.PI / 180;
    const theta12 = bearingBetween(from, to) * Math.PI / 180;
    return Math.asin(Math.sin(d13) * Math.sin(theta13 - theta12)) * R;
}

// Radius implied by how sharply the track bends between two samples.
function flownRadius(previous, current, stepM) {
    const turned = Math.abs(headingDifference(previous.heading, current.heading));
    if (turned < 1e-9) return Infinity;
    return stepM / (turned * Math.PI / 180);
}

describe('geodesy helpers', () => {
    test('destination and distance are inverse of each other', () => {
        const target = destination(HOME, 90, 1000);
        assert.ok(Math.abs(distanceBetween(HOME, target) - 1000) < 0.5);
    });

    test('bearing round trips through destination', () => {
        for (const bearing of [0, 45, 90, 180, 270, 359]) {
            const target = destination(HOME, bearing, 500);
            const measured = bearingBetween(HOME, target);
            assert.ok(
                Math.abs(headingDifference(bearing, measured)) < 0.1,
                `bearing ${bearing} came back as ${measured}`
            );
        }
    });

    test('heading difference is signed and wraps', () => {
        assert.equal(headingDifference(350, 10), 20);
        assert.equal(headingDifference(10, 350), -20);
        // A course reversal has no natural side; it resolves to the same one every time.
        assert.equal(headingDifference(0, 180), -180);
    });
});

describe('route extraction', () => {
    test('keeps the waypoints that are actually flown through', () => {
        const route = getSimulationRoute([
            waypoint({number: 0, action: MWNP.WPTYPE.WAYPOINT}),
            waypoint({number: 1, action: MWNP.WPTYPE.SET_POI}),
            waypoint({number: 2, action: MWNP.WPTYPE.SET_HEAD}),
            waypoint({number: 3, action: MWNP.WPTYPE.POSHOLD_TIME}),
            waypoint({number: 4, action: MWNP.WPTYPE.LAND})
        ]);

        assert.deepEqual(route.map((point) => point.number), [0, 3, 4]);
    });

    test('skips attached waypoints', () => {
        const route = getSimulationRoute([
            waypoint({number: 0}),
            waypoint({number: 1, attached: true}),
            waypoint({number: 2})
        ]);

        assert.deepEqual(route.map((point) => point.number), [0, 2]);
    });

    test('stops at the end of the first mission', () => {
        // A multi-mission file holds several missions back to back; the flight
        // controller flies one at a time, so the simulation does too.
        const route = getSimulationRoute([
            waypoint({number: 0}),
            waypoint({number: 1, endMission: 0xA5}),
            waypoint({number: 2}),
            waypoint({number: 3, endMission: 0xA5})
        ]);

        assert.deepEqual(route.map((point) => point.number), [0, 1]);
    });

    test('an RTH ends the route — the firmware leaves waypoint mode there', () => {
        const route = getSimulationRoute([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.RTH, attached: true}),
            waypoint({number: 3})
        ]);
        assert.deepEqual(route.map((p) => p.number), [0, 1]);
    });

    test('a landing ends the route wherever it sits', () => {
        const route = getSimulationRoute([
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.LAND}),
            waypoint({number: 2})
        ]);
        assert.deepEqual(route.map((p) => p.number), [0, 1]);
    });

    test('the altitude-reference bit of P3 is decoded, not ignored', () => {
        const route = getSimulationRoute([
            waypoint({number: 0, p3: 1 << MWNP.P3.ALT_TYPE}),
            waypoint({number: 1})
        ]);
        assert.equal(route[0].absoluteAltitude, true);
        assert.equal(route[1].absoluteAltitude, false);
    });

    test('drops waypoints without usable coordinates', () => {
        const route = getSimulationRoute([
            waypoint({number: 0}),
            waypoint({number: 1, lat: NaN}),
            waypoint({number: 2})
        ]);

        assert.deepEqual(route.map((point) => point.number), [0, 2]);
    });
});

describe('altitude along a leg', () => {
    test('reaches the target at 90 percent of the leg and holds it', () => {
        // navigation.c ramps on remaining distance and arrives once the aircraft is
        // within a tenth of the leg's initial length.
        assert.equal(altitudeAlongLeg(0, 100, 1000, 1000), 0);
        assert.ok(Math.abs(altitudeAlongLeg(0, 100, 1000, 550) - 50) < 1e-9);
        assert.equal(altitudeAlongLeg(0, 100, 1000, 100), 100);
        assert.equal(altitudeAlongLeg(0, 100, 1000, 0), 100);
    });

    test('a leg of no length is already at its target', () => {
        assert.equal(altitudeAlongLeg(0, 100, 0, 0), 100);
    });

    test('descends as readily as it climbs', () => {
        assert.ok(Math.abs(altitudeAlongLeg(100, 0, 1000, 550) - 50) < 1e-9);
    });
});

describe('altitude reference', () => {
    test('relative altitudes are already above home', () => {
        const {route} = resolveRouteAltitudes([{altCm: 5000, absoluteAltitude: false}], 400);
        assert.equal(route[0].altM, 50);
    });

    test('absolute altitudes are converted once home elevation is known', () => {
        const {route, homeKnown} = resolveRouteAltitudes([{altCm: 45000, absoluteAltitude: true}], 400);
        assert.equal(homeKnown, true);
        assert.equal(route[0].altM, 50);
    });

    test('without home elevation an absolute altitude is flagged, not guessed', () => {
        const {homeKnown, absolute, route} = resolveRouteAltitudes(
            [{altCm: 45000, absoluteAltitude: true}], undefined
        );
        assert.equal(homeKnown, false);
        // The figure stays as it is, and the frame it is in has to be reported:
        // treating an AMSL height as a height above ground counts the site twice.
        assert.equal(absolute, true);
        assert.equal(route[0].altM, 450);
    });

    test('relative altitudes are never reported as absolute', () => {
        const {absolute} = resolveRouteAltitudes([{altCm: 5000, absoluteAltitude: false}], undefined);
        assert.equal(absolute, false);
    });

    test('a known home elevation resolves absolute altitudes, so the frame is not absolute', () => {
        const {absolute, route} = resolveRouteAltitudes([{altCm: 49800, absoluteAltitude: true}], 448);
        assert.equal(absolute, false);
        assert.ok(Math.abs(route[0].altM - 50) < 1e-9);
    });
});

describe('landing approach', () => {
    const LAND = {lat: 47.5716018, lon: 9.3338224};
    const APPROACH = {
        approachAltCm: 6000, landAltCm: 500,
        approachDirection: 0, landHeading1: 90, landHeading2: 0, isSeaLevelRef: 0
    };
    const PARAMS = {approachLengthCm: 35000, loiterRadiusCm: 7500, homeAltM: 0};

    test('builds the three waypoints the firmware builds', () => {
        const built = buildLandingApproach(LAND, APPROACH, PARAMS);
        const [turn, final, land] = built.points;

        assert.equal(built.heading, 90);
        // Final sits one approach length before the touchdown point, at 2/3 of the
        // approach altitude; land sits one beyond it, below ground on purpose.
        assert.ok(Math.abs(distanceBetween(LAND, final) - 350) < 1);
        assert.ok(Math.abs(headingDifference(270, bearingBetween(LAND, final))) < 0.5);
        assert.ok(Math.abs(final.altM - 40) < 0.01);

        assert.ok(Math.abs(distanceBetween(LAND, land) - 350) < 1);
        assert.ok(Math.abs(headingDifference(90, bearingBetween(LAND, land))) < 0.5);
        assert.ok(Math.abs(land.altM - (5 - 40)) < 0.01);

        // Turn point offset from final by max(loiter radius * 4, approach length / 2)
        assert.ok(Math.abs(distanceBetween(final, turn) - 300) < 1);
        assert.ok(Math.abs(turn.altM - 60) < 0.01);
    });

    test('the direction flips even when it arrives as the editor string', () => {
        // MSP delivers 0/1 as numbers, the editor dropdown as "0"/"1"; both must
        // steer the circuit, or flipping the dropdown silently changes nothing.
        const left = buildLandingApproach(LAND, {...APPROACH, approachDirection: '0'}, PARAMS);
        const right = buildLandingApproach(LAND, {...APPROACH, approachDirection: '1'}, PARAMS);
        const bearingLeft = bearingBetween(left.points[1], left.points[0]);
        const bearingRight = bearingBetween(right.points[1], right.points[0]);
        assert.ok(Math.abs(Math.abs(headingDifference(bearingLeft, bearingRight)) - 180) < 1,
            `string direction did not flip the circuit (${bearingLeft.toFixed(0)} vs ${bearingRight.toFixed(0)})`);
    });

    test('the approach turns the other way when configured right', () => {
        const left = buildLandingApproach(LAND, APPROACH, PARAMS);
        const right = buildLandingApproach(LAND, {...APPROACH, approachDirection: 1}, PARAMS);
        const bearingLeft = bearingBetween(left.points[1], left.points[0]);
        const bearingRight = bearingBetween(right.points[1], right.points[0]);

        assert.ok(Math.abs(Math.abs(headingDifference(bearingLeft, bearingRight)) - 180) < 1);
    });

    test('no landing heading means no approach — as in the firmware', () => {
        assert.equal(landingHeading({landHeading1: 0, landHeading2: 0}), null);
        assert.equal(buildLandingApproach(LAND, {...APPROACH, landHeading1: 0, landHeading2: 0}, PARAMS), null);
    });

    test('a negative heading is exclusive, and its magnitude is used', () => {
        assert.equal(landingHeading({landHeading1: -270, landHeading2: 0}), 270);
    });

    test('the second heading is used when only it is set', () => {
        assert.equal(landingHeading({landHeading1: 0, landHeading2: 180}), 180);
    });

    test('a sea-level approach without home elevation is refused, not misplaced', () => {
        // Running the one-third rule on a raw AMSL figure puts the final below the
        // ground and hands over to the glide hundreds of metres early — altitudes
        // wrong in every frame. Refusing is the only honest answer.
        const seaLevel = {...APPROACH, isSeaLevelRef: 1, approachAltCm: 55000, landAltCm: 50000};
        assert.equal(buildLandingApproach(LAND, seaLevel, {...PARAMS, homeAltM: undefined}), null);

        // With the home elevation known it converts into the above-home frame.
        const built = buildLandingApproach(LAND, seaLevel, {...PARAMS, homeAltM: 500});
        assert.ok(built);
        assert.ok(Math.abs(built.points[0].altM - 50) < 0.01);

        // And the refusal names the actual problem, not a missing heading.
        const route = [
            {lat: 47.57, lon: 9.33, number: 0, action: MWNP.WPTYPE.WAYPOINT, altM: 50},
            {...LAND, number: 1, action: MWNP.WPTYPE.LAND, altM: 50}
        ];
        const {landingsWithoutApproach} = withLandingApproaches(
            route, () => seaLevel, {...PARAMS, homeAltM: undefined}
        );
        assert.deepEqual(landingsWithoutApproach, [{number: 1, reason: 'no-home-elevation'}]);
    });

    test('an AMSL approach on an AMSL route draws without home, anchored at its landing altitude', () => {
        // Both figures share the AMSL frame, so no home elevation is needed: the
        // one-third rule anchors at the landing altitude, which sits on the ground
        // where the aircraft touches down. 550 m over 500 m gives 50 m of height;
        // the final sits two thirds of that above the landing altitude.
        const seaLevel = {...APPROACH, isSeaLevelRef: 1, approachAltCm: 55000, landAltCm: 50000};
        const built = buildLandingApproach(LAND, seaLevel, {...PARAMS, homeAltM: undefined, routeFrameAbsolute: true});

        assert.ok(built, 'matching frames must build');
        const [turn, final, land] = built.points;
        assert.ok(Math.abs(turn.altM - 550) < 0.01);
        assert.ok(Math.abs(final.altM - 533.32) < 0.01);
        assert.ok(Math.abs(land.stopAtAltM - 500) < 0.01);
        // The glide slope still aims through the touchdown point, below it.
        assert.ok(land.altM < 500);
    });

    test('an approach landing far from its waypoint is flagged as corrupt data', () => {
        // The known editor bug inflates approach altitudes by one site elevation
        // per touch; the drawing then towers a kilometre up. The plan has to say
        // that the data is broken instead of silently drawing it.
        const route = [
            {lat: 47.57, lon: 9.33, number: 0, action: MWNP.WPTYPE.WAYPOINT, altM: 490},
            {...LAND, number: 2, action: MWNP.WPTYPE.LAND, altM: 490}
        ];
        const inflated = {...APPROACH, isSeaLevelRef: 1, approachAltCm: 184300, landAltCm: 178800};
        const {suspectLandings} = withLandingApproaches(
            route, () => inflated, {...PARAMS, homeAltM: undefined, routeFrameAbsolute: true}
        );
        assert.equal(suspectLandings.length, 1);
        assert.equal(suspectLandings[0].number, 2);
        assert.ok(suspectLandings[0].gapM > 1000, `gap was ${suspectLandings[0].gapM} m`);

        // A sane approach near the waypoint raises nothing.
        const sane = {...APPROACH, isSeaLevelRef: 1, approachAltCm: 55000, landAltCm: 50000};
        const ok = withLandingApproaches(
            [{...route[0]}, {...LAND, number: 2, action: MWNP.WPTYPE.LAND, altM: 500}],
            () => sane, {...PARAMS, homeAltM: undefined, routeFrameAbsolute: true}
        );
        assert.deepEqual(ok.suspectLandings, []);
    });

    test('landings are expanded into the route, and bare ones are reported', () => {
        const route = [
            {lat: 47.57, lon: 9.33, number: 0, action: MWNP.WPTYPE.WAYPOINT, altM: 50},
            {...LAND, number: 1, action: MWNP.WPTYPE.LAND, altM: 50}
        ];
        const withApproach = withLandingApproaches(route, () => APPROACH, PARAMS);
        assert.equal(withApproach.route.length, 4);
        assert.deepEqual(withApproach.route.slice(1).map((p) => p.name), ['turn', 'final', 'land']);
        assert.equal(withApproach.landingsWithoutApproach.length, 0);

        const bare = withLandingApproaches(route, () => ({}), PARAMS);
        assert.equal(bare.route.length, 2);
        assert.deepEqual(bare.landingsWithoutApproach, [{number: 1, reason: 'no-heading'}]);

        // A configured heading with no approach length is a different problem and
        // must not be reported as a missing heading.
        const noLength = withLandingApproaches(route, () => APPROACH, {...PARAMS, approachLengthCm: 0});
        assert.deepEqual(noLength.landingsWithoutApproach, [{number: 1, reason: 'no-approach-length'}]);

        // ...and so is an approach altitude that is not above the landing altitude.
        const upsideDown = withLandingApproaches(
            route, () => ({...APPROACH, approachAltCm: 400}), PARAMS
        );
        assert.deepEqual(upsideDown.landingsWithoutApproach, [{number: 1, reason: 'altitudes-implausible'}]);
    });

    test('the flight ends at landing altitude, not underground', () => {
        const built = buildLandingApproach(LAND, APPROACH, PARAMS);
        const route = [
            {...destination(built.points[0], 180, 400), altM: 60, action: MWNP.WPTYPE.WAYPOINT},
            ...built.points
        ];
        const result = simulateGroundTrack(route, FC);

        assert.ok(result.events.some((event) => event.type === SimEvent.GLIDE), 'expected a glide handover');
        const lowest = Math.min(...result.samples.map((point) => point.altM));
        assert.ok(lowest >= 5 - 0.5, `descended to ${lowest.toFixed(1)} m, below the landing altitude`);
    });
});

describe('turn geometry', () => {
    test('radius follows v^2 / (g tan bank)', () => {
        // 15 m/s at 35 degrees of bank
        assert.ok(Math.abs(turnRadius(15, 35) - 32.8) < 0.2);
        // Doubling the speed quadruples the radius
        assert.ok(Math.abs(turnRadius(30, 35) / turnRadius(15, 35) - 4) < 1e-9);
    });

    test('bank follows the rate of turn, not the configured maximum', () => {
        // Turning at the rate a 35 degree bank produces must report 35 degrees...
        const fullRate = turnRateDegPerSecond(15, turnRadius(15, 35));
        assert.ok(Math.abs(bankForTurnRate(fullRate, 15) - 35) < 0.01);
        // ...and holding a course must report nothing.
        assert.equal(bankForTurnRate(0, 15), 0);
        // A gentle correction is a small bank, not a full one.
        assert.ok(bankForTurnRate(fullRate / 10, 15) < 5);
    });

    test('a straight leg is not reported as one long turn', () => {
        const target = destination(HOME, 90, 1500);
        const result = simulateGroundTrack([HOME, target], FC);
        const turning = result.samples.filter((point) => point.phase === 'turn');

        assert.equal(turning.length, 0, `${turning.length} samples marked as turning on a straight leg`);
        assert.ok(result.samples.every((point) => Math.abs(point.bankDeg) < 5));
    });

    test('an impossible bank angle gives no turn', () => {
        assert.equal(turnRadius(15, 0), Infinity);
        assert.equal(turnRadius(0, 35), Infinity);
        assert.equal(turnRateDegPerSecond(15, Infinity), 0);
    });

    test('unusable numbers are refused, not passed on', () => {
        // A setting that arrives as NaN or Infinity must stop at the guard. Letting
        // either through produces a whole mission of unusable samples with no error.
        for (const bad of [NaN, Infinity, -Infinity, undefined]) {
            assert.equal(turnRadius(bad, 35), Infinity, `speed ${bad}`);
            assert.equal(turnRadius(15, bad), Infinity, `bank ${bad}`);
            assert.equal(turnRateDegPerSecond(bad, 50), 0, `speed ${bad}`);
        }
    });

    test('an unusable speed produces no track at all', () => {
        for (const bad of [NaN, Infinity, 0, -5]) {
            const result = simulateGroundTrack([HOME, destination(HOME, 90, 500)], {...FC, speedMs: bad});
            assert.equal(result.samples.length, 0, `speed ${bad} produced ${result.samples.length} samples`);
        }
    });

    test('the flown corner radius is the bank-limited one, not loiter sized', () => {
        // The turn mode moves where a turn starts and ends, never how tight it is.
        assert.ok(Math.abs(commandedTurnRadius(15, 35) - turnRadius(15, 35)) < 1e-9);
    });

    test('corners are planned with the firmware clamp of 10 to 300 m', () => {
        assert.ok(Math.abs(planningTurnRadius(22, 25) - turnRadius(22, 25)) < 1e-9);
        assert.equal(planningTurnRadius(60, 10), 300);
        assert.equal(planningTurnRadius(5, 60), 10);
    });

    test('the turn mode reaches the simulator', () => {
        const corner = destination(HOME, 0, 900);
        const exit = destination(corner, 90, 900);
        const lengths = Object.values(TurnMode).map(
            (turnMode) => simulateGroundTrack([HOME, corner, exit], {...FC, turnMode}).summary.totalDistanceM
        );

        assert.equal(new Set(lengths).size, lengths.length, `track lengths ${lengths.join(', ')}`);
    });
});

describe('phase runs', () => {
    const sample = (phase) => ({phase});

    test('splits by phase and shares the boundary sample', () => {
        const runs = phaseRuns([
            sample('cruise'), sample('cruise'), sample('turn'), sample('turn'), sample('cruise')
        ]);

        assert.deepEqual(runs, [
            {phase: 'cruise', from: 0, to: 2},
            {phase: 'turn', from: 2, to: 4},
            {phase: 'cruise', from: 4, to: 4}
        ]);
        // Shared boundaries are what keep the drawn stretches joined up.
        for (let index = 1; index < runs.length; index++) {
            assert.equal(runs[index].from, runs[index - 1].to);
        }
    });

    test('a single-phase track is one run covering everything', () => {
        const runs = phaseRuns([sample('cruise'), sample('cruise'), sample('cruise')]);
        assert.deepEqual(runs, [{phase: 'cruise', from: 0, to: 2}]);
    });

    test('no samples means no runs', () => {
        assert.deepEqual(phaseRuns([]), []);
        assert.deepEqual(phaseRuns(undefined), []);
    });

    test('the flown track yields runs that cover every sample', () => {
        const corner = destination(HOME, 0, 900);
        const exit = destination(corner, 90, 900);
        const result = simulateGroundTrack([HOME, corner, exit], FC);
        const runs = phaseRuns(result.samples);

        assert.equal(runs[0].from, 0);
        assert.equal(runs.at(-1).to, result.samples.length - 1);
        assert.ok(runs.some((run) => run.phase === 'turn'), 'a cornered track must contain a turn run');
    });
});

describe('ground track', () => {
    test('a straight leg keeps its heading and arrives', () => {
        const target = destination(HOME, 90, 800);
        const result = simulateGroundTrack([HOME, target], FC);

        assert.equal(result.events.length, 1);
        assert.equal(result.events[0].type, SimEvent.REACHED);
        assert.ok(result.warnings.length === 0);

        for (const point of result.samples) {
            assert.ok(Math.abs(headingDifference(90, point.heading)) < 0.5);
        }

        // 800 m at 22 m/s, minus the acceptance radius
        assert.ok(
            Math.abs(result.summary.totalTimeS - (800 - FC.waypointRadiusM) / FC.speedMs) < 1,
            `took ${result.summary.totalTimeS.toFixed(1)} s`
        );
    });

    test('a corner is rounded, never tighter than the commanded radius', () => {
        const corner = destination(HOME, 0, 1000);
        const exit = destination(corner, 90, 1000);
        const result = simulateGroundTrack([HOME, corner, exit], FC);

        const expected = commandedTurnRadius(FC.speedMs, FC.bankAngleDeg);
        const stepM = FC.speedMs * 0.1;

        const turningRadii = [];
        for (let index = 1; index < result.samples.length; index++) {
            const radius = flownRadius(result.samples[index - 1], result.samples[index], stepM);
            assert.ok(
                radius > expected - 1,
                `turned at ${radius.toFixed(1)} m, tighter than the ${expected.toFixed(1)} m radius`
            );
            if (Number.isFinite(radius)) turningRadii.push(radius);
        }

        // ...and the turn must actually be flown at that radius, not at a lazier one.
        assert.ok(turningRadii.length > 0, 'no turning samples at all');
        assert.ok(
            Math.min(...turningRadii) < expected + 1,
            `slackest turn was ${Math.min(...turningRadii).toFixed(1)} m, never reaching ${expected.toFixed(1)} m`
        );
    });

    test('in DIRECT mode the aircraft flies past the corner', () => {
        // The corner waypoint is reached first, and only then does the turn
        // begin, so the track has to swing clear of the ideal corner.
        const corner = destination(HOME, 0, 1000);
        const exit = destination(corner, 90, 1000);
        const result = simulateGroundTrack([HOME, corner, exit], {...FC, turnMode: TurnMode.DIRECT});

        const expected = commandedTurnRadius(FC.speedMs, FC.bankAngleDeg);

        // How far the track strays from the leg it is supposed to join. Turning at
        // the waypoint rather than before it has to cost roughly one radius.
        const strayFromExitLeg = Math.max(...result.samples
            .filter((point) => point.waypointIndex === 2)
            .map((point) => Math.abs(crossTrackDistance(corner, exit, point))));

        assert.ok(
            strayFromExitLeg > expected * 0.5 && strayFromExitLeg < expected * 2,
            `strayed ${strayFromExitLeg.toFixed(1)} m from the exit leg, expected about ${expected.toFixed(0)} m`
        );
        assert.equal(result.events[0].type, SimEvent.REACHED);
    });

    test('a waypoint is given up on relative to the leg, not to the aircraft', () => {
        // INAV fixes the reference bearing at the moment the waypoint becomes
        // active — previous waypoint to active waypoint — and calls the waypoint
        // passed once the aircraft crosses the line through it square to that leg,
        // i.e. the bearing to it has swung 90 degrees off the leg (navigation.c
        // isWaypointReached). Taking the reference from the aircraft's own
        // position instead would move every switch after a corner.
        // A near reversal onto a 40 m leg: too tight to curl back onto, so the
        // aircraft has to give the waypoint up and the rule actually fires.
        const corner = destination(HOME, 0, 1000);
        const exit = destination(corner, 170, 40);
        const points = [HOME, corner, exit];
        const result = simulateGroundTrack(points, FC);

        const overshot = result.events.find((event) => event.type === SimEvent.OVERSHOT);
        assert.ok(overshot, 'expected this geometry to force the waypoint to be given up');

        const atEvent = result.samples.find((point) => point.t >= overshot.t);
        const legBearing = bearingBetween(points[overshot.waypointIndex - 1], points[overshot.waypointIndex]);
        const offLeg = Math.abs(headingDifference(
            legBearing,
            bearingBetween(atEvent, points[overshot.waypointIndex])
        ));

        assert.ok(
            offLeg > 89 && offLeg < 105,
            `gave up at ${offLeg.toFixed(1)} degrees off the leg, expected about 90`
        );
    });

    test('every step covers the same ground', () => {
        const target = destination(HOME, 210, 600);
        const result = simulateGroundTrack([HOME, target], FC);
        const stepM = FC.speedMs * 0.1;

        for (const length of legLengths(result.samples)) {
            assert.ok(Math.abs(length - stepM) < 0.01);
        }
    });

    test('a waypoint too tight to reach is reported, not circled forever', () => {
        // Two waypoints 40 m apart with a 75 m turn radius: the aircraft cannot
        // curl back onto the second one.
        const first = destination(HOME, 0, 600);
        const second = destination(first, 170, 40);
        const result = simulateGroundTrack([HOME, first, second], FC);

        assert.ok(result.samples.length > 0);
        assert.ok(
            result.events.some((event) => event.type !== SimEvent.REACHED),
            'expected the unreachable waypoint to be given up on'
        );
        // The whole point is that it gives up rather than orbiting: two legs at
        // this speed cannot take anywhere near a minute and a half.
        assert.ok(result.summary.totalTimeS < 90, `took ${result.summary.totalTimeS.toFixed(0)} s`);
    });

    test('coincident opening waypoints do not send it off due north', () => {
        const target = destination(HOME, 180, 900);
        const result = simulateGroundTrack([HOME, {...HOME}, target], FC);

        // Heading due north here would mean a phantom loop before the mission even
        // starts; the track must set off towards the point that is actually there.
        assert.ok(Math.abs(headingDifference(180, result.samples[0].heading)) < 1);
        const strayed = Math.max(...result.samples.map((p) => Math.abs(crossTrackDistance(HOME, target, p))));
        assert.ok(strayed < 5, `wandered ${strayed.toFixed(1)} m off a straight run`);
    });

    test('a missed waypoint is reported, not just recorded', () => {
        const corner = destination(HOME, 0, 900);
        const exit = destination(corner, 170, 40);
        const result = simulateGroundTrack([HOME, corner, exit], FC);

        assert.ok(result.events.some((e) => e.type === SimEvent.OVERSHOT));
        assert.ok(
            result.warnings.some((w) => w.code === 'waypoint-missed'),
            'a waypoint the aircraft cannot reach must produce a warning'
        );
    });

    test('warnings carry the map waypoint number, not the route index', () => {
        // The displayed number must match the marker on the map even when the
        // route index has drifted past filtered actions or injected points.
        const corner = destination(HOME, 0, 900);
        const exit = destination(corner, 170, 40);
        const result = simulateGroundTrack(
            [{...HOME, number: 4}, {...corner, number: 5}, {...exit, number: 6}], FC
        );

        const missed = result.warnings.find((warning) => warning.code === 'waypoint-missed');
        assert.ok(missed, 'expected the unreachable waypoint to be reported');
        assert.equal(missed.waypointNumber, 7);
    });

    test('a mission with fewer than two points produces nothing', () => {
        const result = simulateGroundTrack([HOME], FC);
        assert.equal(result.samples.length, 0);
        assert.equal(result.summary.totalDistanceM, 0);
    });
});

describe('turn modes', () => {
    const RADIUS = turnRadius(FC.speedMs, FC.bankAngleDeg);
    const LEAD = FC.speedMs * 1.0;
    const STEP = FC.speedMs * 0.1;

    function corner(turnDeg) {
        const vertex = destination(HOME, 0, 1000);
        return {vertex, exit: destination(vertex, turnDeg, 1000)};
    }

    function fly(turnDeg, turnMode, extra = {}) {
        const {vertex, exit} = corner(turnDeg);
        return {vertex, exit, result: simulateGroundTrack([HOME, vertex, exit], {...FC, turnMode, ...extra})};
    }

    // How far past the corner the track reaches, measured along the inbound leg.
    function pastCorner(samples, vertex) {
        return Math.max(...samples.map((point) => {
            const distance = distanceBetween(HOME, point);
            return distance * Math.cos((bearingBetween(HOME, point) - bearingBetween(HOME, vertex)) * Math.PI / 180);
        })) - distanceBetween(HOME, vertex);
    }

    // The first sample on the new leg that holds exactly the given course: where a planned arc rolled out.
    function rollOut(samples, headingDeg) {
        return samples.find((point) => point.waypointIndex === 2
            && Math.abs(headingDifference(headingDeg, point.heading)) < 0.01);
    }

    function nearestTo(samples, target) {
        return samples.reduce((best, point) =>
            (distanceBetween(point, target) < distanceBetween(best, target) ? point : best));
    }

    test('the fly-by lead is roll-in plus R tan(turn / 2), capped by the lead time', () => {
        const plain = flyByLeadDistance(100, 90, 20, 8000);
        assert.ok(Math.abs(plain.distanceM - 120) < 1e-6);
        assert.equal(plain.capped, false);
        // The side of the turn does not matter.
        assert.ok(Math.abs(flyByLeadDistance(100, -90, 20, 8000).distanceM - 120) < 1e-6);

        // 20 m + 100 m * tan(60) = 193 m wanted, but 6 s at 20 m/s allows only 120 m.
        const capped = flyByLeadDistance(100, 120, 20, 6000);
        assert.ok(Math.abs(capped.distanceM - 120) < 1e-6);
        assert.equal(capped.capped, true);

        // Near a reversal the tangent is clamped the way the firmware clamps it.
        assert.ok(Math.abs(flyByLeadDistance(100, 170, 20, 60000).distanceM - (20 + 370)) < 1e-6);
    });

    test('a fly-by cuts a 90 degree corner and rolls out on the next leg', () => {
        const {vertex, exit, result} = fly(90, TurnMode.COORD_FLYBY);

        assert.equal(result.events[0].type, SimEvent.REACHED);
        assert.ok(Math.abs(result.events[0].distanceM - (LEAD + RADIUS)) <= STEP,
            `turn started ${result.events[0].distanceM.toFixed(1)} m out`);
        assert.ok(pastCorner(result.samples, vertex) < 1, 'the track must stay inside the corner');

        // The arc inscribed in a right angle passes R * (sqrt(2) - 1) from the vertex.
        const closest = distanceBetween(nearestTo(result.samples, vertex), vertex);
        assert.ok(Math.abs(closest - RADIUS * (Math.SQRT2 - 1)) < 3, `closest ${closest.toFixed(1)} m`);

        const out = rollOut(result.samples, 90);
        assert.ok(out, 'the arc must roll out on the outbound course');
        assert.ok(Math.abs(crossTrackDistance(vertex, exit, out)) < 3,
            `rolled out ${crossTrackDistance(vertex, exit, out).toFixed(1)} m off the leg`);
    });

    test('a capped fly-by starts late and rolls out beside the next leg', () => {
        const {vertex, exit, result} = fly(120, TurnMode.COORD_FLYBY);
        const capM = FC.speedMs * FC.turnMaxLeadTimeMs / 1000;

        assert.ok(result.events[0].distanceM <= capM && result.events[0].distanceM > capM - STEP);

        // The arc starts one roll-in after the cap point; rolled out on 120 degrees
        // the aircraft sits p * sin(120) - R * (1 - cos(120)) right of the leg.
        const arcStartM = capM - LEAD;
        const expected = arcStartM * Math.sin(Math.PI * 2 / 3) - RADIUS * 1.5;
        const out = rollOut(result.samples, 120);
        assert.ok(out, 'the arc must roll out on the outbound course');
        const offLeg = crossTrackDistance(vertex, exit, out);
        assert.ok(Math.abs(offLeg - expected) < 4,
            `rolled out ${offLeg.toFixed(1)} m off the leg, expected ${expected.toFixed(1)}`);
        assert.equal(result.events.at(-1).type, SimEvent.REACHED);
    });

    test('a reversal is flown as a capture turn and rolls out two radii off the leg', () => {
        const {vertex, exit, result} = fly(180, TurnMode.COORD_FLYBY);

        // Too sharp to anticipate: the corner is reached first, then the turn begins.
        assert.ok(result.events[0].distanceM <= FC.waypointRadiusM);
        const out = rollOut(result.samples, 180);
        assert.ok(out, 'the capture must roll out on the outbound course');
        const offLeg = crossTrackDistance(vertex, exit, out);
        assert.ok(Math.abs(Math.abs(offLeg) - 2 * RADIUS) < 3,
            `rolled out ${offLeg.toFixed(1)} m off the leg, expected ${(2 * RADIUS).toFixed(1)}`);
    });

    test('a fly-over passes the waypoint, then turns towards the next one', () => {
        const {vertex, exit, result} = fly(90, TurnMode.COORD_FLYOVER);

        assert.ok(result.events[0].distanceM <= FC.waypointRadiusM, 'the waypoint itself must be reached');
        // Roll-in plus one radius beyond the point where the waypoint was reached.
        const past = pastCorner(result.samples, vertex);
        assert.ok(past > RADIUS && past < RADIUS + LEAD + STEP, `went ${past.toFixed(1)} m past the corner`);

        // The arc rolls out pointing at the next waypoint, not onto the leg's course.
        const turned = result.samples.filter((point) => point.waypointIndex === 2 && point.phase === 'turn').at(-1);
        assert.ok(Math.abs(headingDifference(turned.heading, bearingBetween(turned, exit))) < 2);
        assert.ok(Math.abs(headingDifference(90, turned.heading)) > 5, 'the exit is the tangent to the waypoint');
        assert.equal(result.events.at(-1).type, SimEvent.REACHED);
    });

    test('a fly-into flies its S before the waypoint and crosses it on the next leg', () => {
        // Beyond 90 degrees the S crosses the waypoint's square line on the way; that is the plan, not a miss.
        for (const turnDeg of [90, 135]) {
            const {vertex, exit, result} = fly(turnDeg, TurnMode.COORD_FLYINTO);
            const sTurn = flyIntoSTurn(planningTurnRadius(FC.speedMs, FC.bankAngleDeg), 0, turnDeg, 2 * LEAD);

            // The S starts well before the waypoint, turning away from the corner first.
            const leaves = result.samples.find((point) => Math.abs(headingDifference(0, point.heading)) > 0.1);
            const startedM = distanceBetween(leaves, vertex);
            assert.ok(Math.abs(startedM - sTurn.startBeforeM) < 2 * STEP,
                `turned ${startedM.toFixed(1)} m out, S starts ${sTurn.startBeforeM.toFixed(1)} m out`);
            assert.ok(headingDifference(0, leaves.heading) < 0, 'a right-hand corner opens to the left');
            const widest = Math.min(...result.samples.map((point) => crossTrackDistance(HOME, vertex, point)));
            assert.ok(widest < -RADIUS / 2, `swung out only ${widest.toFixed(1)} m`);

            const crossing = nearestTo(result.samples, vertex);
            const passedM = distanceBetween(crossing, vertex);
            assert.ok(passedM < 3, `${turnDeg}: passed ${passedM.toFixed(1)} m off`);
            assert.ok(Math.abs(headingDifference(turnDeg, crossing.heading)) < 2,
                `${turnDeg}: crossed on ${crossing.heading.toFixed(1)}`);
            assert.ok(Math.abs(crossTrackDistance(vertex, exit, crossing)) < 3);
            assert.deepEqual(result.warnings, [], `${turnDeg}: ${result.warnings.map((warning) => warning.code)}`);
        }
    });

    test('the fly-into tangent joins both arcs over the planned gap', () => {
        const sTurn = flyIntoSTurn(100, 0, 90, 40);
        assert.equal(sTurn.turnDirection, 1);
        assert.ok(Math.abs(sTurn.tangentLengthM - 40) < 1e-6);
        assert.ok(sTurn.startBeforeM > 200);
        // Counter-arc to the left first, so the tangent heads left of the inbound course.
        assert.ok(headingDifference(0, sTurn.tangentHeadingDeg) < 0);

        const mirrored = flyIntoSTurn(100, 0, 270, 40);
        assert.equal(mirrored.turnDirection, -1);
        assert.ok(Math.abs(mirrored.startBeforeM - sTurn.startBeforeM) < 1e-6);
        const mirroredSide = headingDifference(0, mirrored.tangentHeadingDeg);
        assert.ok(Math.abs(mirroredSide + headingDifference(0, sTurn.tangentHeadingDeg)) < 1e-6);
    });

    test('DIRECT steers at the waypoint and turns only once it is reached', () => {
        const {result} = fly(90, TurnMode.DIRECT);

        assert.ok(result.events[0].distanceM <= FC.waypointRadiusM);
        for (const point of result.samples.filter((sample) => sample.waypointIndex === 1)) {
            assert.ok(Math.abs(headingDifference(0, point.heading)) < 0.5);
        }
    });

    test('corners of 30 degrees or less fly the same track in every mode', () => {
        const tracks = Object.values(TurnMode).map((turnMode) => fly(20, turnMode).result.samples);
        for (const track of tracks.slice(1)) {
            assert.deepEqual(track, tracks[0]);
        }
    });

    test('the landing approach turns fly-by whatever the mode', () => {
        const LAND = {lat: 47.5716018, lon: 9.3338224};
        const approach = {
            approachAltCm: 6000, landAltCm: 500,
            approachDirection: 0, landHeading1: 90, landHeading2: 0, isSeaLevelRef: 0
        };
        const built = buildLandingApproach(
            LAND, approach, {approachLengthCm: 35000, loiterRadiusCm: 7500, homeAltM: 0}
        );
        // Inbound from the west onto the turn point, then south onto final: a 90 degree corner.
        const route = [
            {...destination(built.points[0], 270, 800), altM: 60, action: MWNP.WPTYPE.WAYPOINT},
            ...built.points
        ];
        const result = simulateGroundTrack(route, {...FC, turnMode: TurnMode.DIRECT});

        const turnPoint = result.events.find((event) => event.waypointIndex === 1);
        assert.ok(turnPoint.distanceM > RADIUS, `turn point switched ${turnPoint.distanceM.toFixed(1)} m out`);
    });

    // Where the track is back on the leg line and holding its course, well before the next waypoint.
    function rejoinPoint(samples, vertex, exit, turnDeg) {
        return samples.find((point) => point.waypointIndex === 2
            && distanceBetween(point, vertex) > 50
            && Math.abs(crossTrackDistance(vertex, exit, point)) < 3
            && Math.abs(headingDifference(turnDeg, point.heading)) < 1);
    }

    // The steepest course flown towards the leg line after the track's widest point, relative to the leg.
    function steepestIntercept(samples, vertex, exit, turnDeg, fromT = 0) {
        const leg = samples.filter((point) => point.waypointIndex === 2 && point.t >= fromT);
        const offsets = leg.map((point) => crossTrackDistance(vertex, exit, point));
        const widest = offsets.reduce(
            (best, offset, index) => (Math.abs(offset) > Math.abs(offsets[best]) ? index : best), 0
        );
        const side = Math.sign(offsets[widest]);
        return Math.max(...leg.slice(widest).map((point) => -side * headingDifference(turnDeg, point.heading)));
    }

    function settlesOnLeg(result, vertex, exit, turnDeg) {
        const back = rejoinPoint(result.samples, vertex, exit, turnDeg);
        assert.ok(back, 'the track never settled on the leg line');
        const backM = distanceBetween(back, exit);
        assert.ok(backM > 500, `back on the line only ${backM.toFixed(0)} m out`);
        const after = result.samples.filter((point) => point.t >= back.t && distanceBetween(point, exit) > 50);
        for (const point of after) {
            assert.ok(Math.abs(crossTrackDistance(vertex, exit, point)) < 3);
            assert.ok(Math.abs(headingDifference(turnDeg, point.heading)) < 1);
        }
        assert.deepEqual(result.warnings, []);
    }

    const TRACKING = {trackingEnabled: true, trackingMaxAngleDeg: 60};

    test('a fly-over with path tracking flies its S back onto the leg line', () => {
        const {vertex, exit, result} = fly(90, TurnMode.COORD_FLYOVER, TRACKING);
        settlesOnLeg(result, vertex, exit, 90);
    });

    test('the fly-over S intercepts at half the heading error, 20 to 45 degrees, whatever the max angle', () => {
        // fwArcPlanFlyOverTrackingS: nav_fw_wp_tracking_max_angle plays no part in the S.
        const steep = fly(90, TurnMode.COORD_FLYOVER, {...TRACKING, trackingMaxAngleDeg: 80});
        const shallow = fly(90, TurnMode.COORD_FLYOVER, {...TRACKING, trackingMaxAngleDeg: 30});
        assert.deepEqual(steep.result.samples, shallow.result.samples);

        for (const [turnDeg, expectedDeg] of [[90, 45], [60, 30]]) {
            const {vertex, exit, result} = fly(turnDeg, TurnMode.COORD_FLYOVER, {...TRACKING, trackingMaxAngleDeg: 80});
            const steepest = steepestIntercept(result.samples, vertex, exit, turnDeg);
            assert.ok(Math.abs(steepest - expectedDeg) < 0.5,
                `${turnDeg} degree corner intercepted at ${steepest.toFixed(1)}, expected ${expectedDeg}`);
        }
    });

    test('a fly-over S that does not fit before the next waypoint falls back to the tangent exit', () => {
        const flyOver = {...FC, turnMode: TurnMode.COORD_FLYOVER};
        const vertex = destination(HOME, 0, 1000);
        const short = [HOME, vertex, destination(vertex, 90, 250)];
        assert.deepEqual(
            simulateGroundTrack(short, {...flyOver, ...TRACKING}).samples,
            simulateGroundTrack(short, flyOver).samples
        );
        // Where it fits, tracking must make a difference, or the comparison above proves nothing.
        const long = [HOME, vertex, destination(vertex, 90, 1000)];
        assert.notDeepEqual(
            simulateGroundTrack(long, {...flyOver, ...TRACKING}).samples,
            simulateGroundTrack(long, flyOver).samples
        );
    });

    test('a fly-over without path tracking still heads straight for the next waypoint', () => {
        const plain = fly(90, TurnMode.COORD_FLYOVER).result;
        const off = fly(90, TurnMode.COORD_FLYOVER, {...TRACKING, trackingEnabled: false}).result;
        assert.deepEqual(off.samples, plain.samples);

        const {vertex, exit} = corner(90);
        assert.equal(rejoinPoint(off.samples, vertex, exit, 90), undefined, 'must not converge onto the leg line');
    });

    test('DIRECT with path tracking converges onto the leg at up to nav_fw_wp_tracking_max_angle', () => {
        for (const [offsetM, towardDeg] of [[5, 0], [60, 0], [200, -90], [300, 170], [40, -30], [-12, -90]]) {
            for (const maxAngleDeg of [30, 45, 60, 80]) {
                const intercept = rejoinIntercept(offsetM, towardDeg, RADIUS, maxAngleDeg);
                assert.ok(intercept, `no intercept for ${offsetM} m at ${towardDeg} degrees`);
                assert.ok(intercept.angleDeg <= maxAngleDeg, `${intercept.angleDeg} > ${maxAngleDeg}`);
            }
        }
        // A small offset needs a shallow S, not the full angle.
        assert.ok(rejoinIntercept(5, 0, RADIUS, 60).angleDeg < 15);

        for (const maxAngleDeg of [30, 60]) {
            const {vertex, exit, result} = fly(90, TurnMode.DIRECT, {...TRACKING, trackingMaxAngleDeg: maxAngleDeg});
            settlesOnLeg(result, vertex, exit, 90);
            const steepest = steepestIntercept(result.samples, vertex, exit, 90);
            assert.ok(steepest > 20 && steepest <= maxAngleDeg + 0.01,
                `intercepted at ${steepest.toFixed(1)} degrees with a ${maxAngleDeg} degree limit`);
        }

        const untracked = fly(90, TurnMode.DIRECT).result;
        const {vertex, exit} = corner(90);
        assert.equal(rejoinPoint(untracked.samples, vertex, exit, 90), undefined);
    });

    test('an uncapped fly-by and a fly-into S ignore path tracking', () => {
        // With the firmware's 1 m acceptance radius the tolerance band is 2 m, which a rolled-out arc can miss.
        for (const waypointRadiusM of [FC.waypointRadiusM, 1]) {
            for (const [turnDeg, turnMode] of [[90, TurnMode.COORD_FLYBY], [60, TurnMode.COORD_FLYBY],
                [90, TurnMode.COORD_FLYINTO], [135, TurnMode.COORD_FLYINTO]]) {
                const tracked = fly(turnDeg, turnMode, {...TRACKING, waypointRadiusM}).result;
                const untracked = fly(turnDeg, turnMode, {waypointRadiusM}).result;
                assert.deepEqual(tracked.samples, untracked.samples, `${turnMode} ${turnDeg} at ${waypointRadiusM} m`);
            }
        }
    });

    test('after a capped fly-by path tracking converges onto the leg at up to the max angle', () => {
        for (const maxAngleDeg of [30, 60]) {
            const tracking = {...TRACKING, trackingMaxAngleDeg: maxAngleDeg};
            const {vertex, exit, result} = fly(120, TurnMode.COORD_FLYBY, tracking);
            assert.notDeepEqual(result.samples, fly(120, TurnMode.COORD_FLYBY).result.samples);
            settlesOnLeg(result, vertex, exit, 120);
            // Measured from where the capped arc rolled out beside the leg.
            const steepest = steepestIntercept(result.samples, vertex, exit, 120, rollOut(result.samples, 120).t);
            assert.ok(steepest > 1 && steepest <= maxAngleDeg + 0.01,
                `intercepted at ${steepest.toFixed(1)} with a ${maxAngleDeg} limit`);
        }
    });

    test('after a reversal path tracking converges onto the leg', () => {
        const {vertex, exit, result} = fly(180, TurnMode.COORD_FLYBY, TRACKING);
        settlesOnLeg(result, vertex, exit, 180);
        const steepest = steepestIntercept(result.samples, vertex, exit, 180, rollOut(result.samples, 180).t);
        assert.ok(steepest > 1 && steepest <= TRACKING.trackingMaxAngleDeg + 0.01,
            `intercepted at ${steepest.toFixed(1)}`);
    });

    test('a fly-over whose S does not fit takes the tangent exit, then converges at up to the max angle', () => {
        // At 150 degrees the 45 degree S does not fit and no shallower one is tried.
        for (const maxAngleDeg of [30, 60]) {
            const tracking = {...TRACKING, trackingMaxAngleDeg: maxAngleDeg};
            const {vertex, exit, result} = fly(150, TurnMode.COORD_FLYOVER, tracking);
            settlesOnLeg(result, vertex, exit, 150);
            const steepest = steepestIntercept(result.samples, vertex, exit, 150);
            assert.ok(steepest > 1 && steepest <= maxAngleDeg + 0.01,
                `intercepted at ${steepest.toFixed(1)} with a ${maxAngleDeg} limit`);
        }
    });

    // Routes from the review fuzz, flown from a fixed origin.
    function reviewRoute(legs) {
        const points = [{lat: 47, lon: 8}];
        for (const [bearingDeg, lengthM] of legs) points.push(destination(points.at(-1), bearingDeg, lengthM));
        return points;
    }

    // The largest heading change flown in one direction without turning back.
    function longestSweep(samples) {
        let longest = 0;
        let sweep = 0;
        for (let index = 1; index < samples.length; index++) {
            const change = headingDifference(samples[index - 1].heading, samples[index].heading);
            if (change === 0) continue;
            sweep = Math.sign(change) === Math.sign(sweep) || sweep === 0 ? sweep + change : change;
            longest = Math.max(longest, Math.abs(sweep));
        }
        return longest;
    }

    test('a fly-into S is not staged when it would have to turn the long way round', () => {
        // The S window opens while the aircraft still turns onto a short leg; staging it then flew a full orbit.
        const points = reviewRoute([[0, 600], [330, 80], [269, 600]]);
        const params = {speedMs: 15, bankAngleDeg: 25, waypointRadiusM: 8};
        const into = simulateGroundTrack(points, {...params, turnMode: TurnMode.COORD_FLYINTO});
        const direct = simulateGroundTrack(points, {...params, turnMode: TurnMode.DIRECT});

        assert.ok(longestSweep(into.samples) < 180, `swept ${longestSweep(into.samples).toFixed(0)} degrees`);
        assert.ok(into.summary.totalTimeS < direct.summary.totalTimeS + 5);
        assert.deepEqual(into.warnings, []);
    });

    test('DIRECT with path tracking leaves legs too short to rejoin on plain steering', () => {
        // The review route: a rejoin planned here used to swing the aircraft off onto the old leg's course.
        const points = reviewRoute([[89.6, 301], [231.8, 229], [271.7, 415]]);
        const params = {speedMs: 26, bankAngleDeg: 31.5, turnMode: TurnMode.DIRECT};
        const tracked = simulateGroundTrack(points, {...params, trackingEnabled: true, trackingMaxAngleDeg: 79});
        const untracked = simulateGroundTrack(points, params);

        assert.deepEqual(tracked.warnings, [], tracked.warnings.map((warning) => warning.text).join(' '));
        const lastLeg = tracked.samples.filter((point) => point.waypointIndex === 3);
        const widest = Math.max(
            ...lastLeg.map((point) => Math.abs(crossTrackDistance(points[2], points[3], point)))
        );
        assert.ok(widest < 20, `strayed ${widest.toFixed(1)} m off the last leg`);
        assert.ok(tracked.summary.totalTimeS < untracked.summary.totalTimeS + 5);
    });

    test('the rejoin fit check counts the along-track run of its first arc', () => {
        // After a sharp corner the first arc alone runs about 1.6 R along the leg; ignoring it overshot the waypoint.
        const points = reviewRoute([[89.6, 301], [231.8, 229], [271.7, 415]]);
        const tracked = simulateGroundTrack(points, {
            speedMs: 26, bankAngleDeg: 31.5, turnMode: TurnMode.DIRECT, trackingEnabled: true, trackingMaxAngleDeg: 79
        });
        assert.ok(!tracked.events.some((event) => event.type === SimEvent.OVERSHOT), 'a waypoint was overshot');

        const intercept = rejoinIntercept(0, -142, 113, 79);
        assert.ok(intercept && intercept.alongM > 113 * 1.5, `along ${intercept?.alongM?.toFixed(0)} m`);
    });

    test('a fly-into waypoint the S cannot reach is not reported as reached', () => {
        // The leg is shorter than the S needs, so no S is staged and the corner is flown like any other.
        const points = reviewRoute([[0, 600], [90, 150], [210, 600]]);
        const result = simulateGroundTrack(points, {speedMs: 25, bankAngleDeg: 30, turnMode: TurnMode.COORD_FLYINTO});
        const second = result.events.find((event) => event.waypointIndex === 2);

        const missed = result.warnings.some(
            (warning) => warning.code === 'waypoint-missed' && warning.waypointIndex === 2
        );
        assert.ok(second.distanceM <= 8 + 5 || missed,
            `reached at ${second.distanceM.toFixed(0)} m without a warning`);
        // No orbit back onto the waypoint either: about as quick as DIRECT, which just misses it.
        const direct = simulateGroundTrack(points, {speedMs: 25, bankAngleDeg: 30, turnMode: TurnMode.DIRECT});
        assert.ok(result.summary.totalTimeS < direct.summary.totalTimeS + 10);
    });

    test('a turn planned for the old leg does not carry over into the new one', () => {
        // A capped fly-by arc still turning towards leg 2 when its short leg is passed must give way to leg 3.
        const points = reviewRoute([[115, 322], [354, 64], [222, 511]]);
        const params = {speedMs: 26, bankAngleDeg: 26, waypointRadiusM: 3};
        const flyBy = simulateGroundTrack(points, {...params, turnMode: TurnMode.COORD_FLYBY});
        const direct = simulateGroundTrack(points, {...params, turnMode: TurnMode.DIRECT});
        // Finishing the stale arc swung the aircraft round the wrong way for most of a circle.
        assert.ok(longestSweep(flyBy.samples) < 180, `swept ${longestSweep(flyBy.samples).toFixed(0)} degrees`);
        assert.ok(flyBy.summary.totalTimeS < direct.summary.totalTimeS,
            `fly-by took ${flyBy.summary.totalTimeS.toFixed(1)} s, DIRECT ${direct.summary.totalTimeS.toFixed(1)} s`);
    });

    test('a fly-into S is only staged from on the inbound leg line', () => {
        // Started beside the line, the S passes the waypoint just as far beside it.
        const points = reviewRoute([[241, 142], [158, 777], [98, 216]]);
        const result = simulateGroundTrack(points, {
            speedMs: 30, bankAngleDeg: 42, waypointRadiusM: 1, turnMode: TurnMode.COORD_FLYINTO
        });
        assert.deepEqual(result.warnings, []);
    });

    test('a fly-into S never reports its waypoint reached from far away', () => {
        // Crossing the square line mid-S is part of the S; only passing the waypoint itself counts.
        const points = reviewRoute([[12, 222], [44, 592], [138, 271], [267, 580]]);
        const result = simulateGroundTrack(points, {
            speedMs: 26, bankAngleDeg: 38, waypointRadiusM: 15, turnMode: TurnMode.COORD_FLYINTO
        });
        for (const event of result.events.filter((item) => item.type === SimEvent.REACHED)) {
            assert.ok(event.distanceM <= 15 + 5,
                `waypoint ${event.waypointIndex} reached ${event.distanceM.toFixed(0)} m off`);
        }
    });

    test('a finished fly-into S hands its waypoint over at the pickup', () => {
        // The S ends a few metres off a 1 m acceptance circle; steering on from there used to miss it.
        const points = reviewRoute([[247, 728], [292, 525], [37, 264]]);
        const result = simulateGroundTrack(points, {
            speedMs: 26, bankAngleDeg: 33, waypointRadiusM: 1, turnMode: TurnMode.COORD_FLYINTO
        });
        assert.deepEqual(result.warnings, []);
        const second = result.events.find((event) => event.waypointIndex === 2);
        assert.equal(second.type, SimEvent.REACHED);
        assert.ok(second.distanceM <= 1 + 5);
    });

    test('on the landing approach a point is given up at 100 degrees, not at its square line', () => {
        // The square-line test only runs in WP mode; the approach keeps the older bearing test.
        const corner = destination(HOME, 0, 1000);
        const exit = destination(corner, 170, 40);
        const points = [HOME, {...corner, isApproach: true}, {...exit, isApproach: true}];
        const result = simulateGroundTrack(points, FC);

        const overshot = result.events.find((event) => event.type === SimEvent.OVERSHOT);
        assert.ok(overshot, 'expected the approach point to be given up');
        const atEvent = result.samples.find((point) => point.t >= overshot.t);
        const offLeg = Math.abs(headingDifference(bearingBetween(corner, exit), bearingBetween(atEvent, exit)));
        assert.ok(offLeg > 99 && offLeg < 115, `gave up at ${offLeg.toFixed(1)} degrees off the leg`);
    });

    test('a fly-into S is not staged while the aircraft is still well off the inbound course', () => {
        // After a shallow corner the aircraft is on the line but 20-30 degrees off it; the S would miss the waypoint.
        const points = reviewRoute([[113.8, 87], [217.2, 737], [213.2, 431], [138.1, 637], [120.1, 114]]);
        const result = simulateGroundTrack(points, {
            speedMs: 24.66, bankAngleDeg: 20.06, turnMode: TurnMode.COORD_FLYINTO, trackingEnabled: true
        });
        assert.deepEqual(result.warnings, [], result.warnings.map((warning) => warning.text).join(' '));
    });

    test('a fly-into S is sized at the radius it is flown at, beyond the 300 m planning clamp', () => {
        const vertex = destination(HOME, 0, 2000);
        const points = [HOME, vertex, destination(vertex, 90, 2000)];
        const params = {speedMs: 30, bankAngleDeg: 15, turnMode: TurnMode.COORD_FLYINTO};
        assert.ok(turnRadius(params.speedMs, params.bankAngleDeg) > 300);

        const result = simulateGroundTrack(points, params);
        assert.deepEqual(result.warnings, []);
        // The module's default acceptance radius is 8 m.
        assert.ok(result.events[0].distanceM <= 8 + 5, `passed ${result.events[0].distanceM.toFixed(0)} m off`);
    });

    test('below the 10 m planning floor every mode steers, plans and budgets at the floor', () => {
        // 8 m/s at 45 degrees banks round 6.5 m, but the firmware never plans a corner tighter than 10 m.
        const params = {speedMs: 8, bankAngleDeg: 45, waypointRadiusM: 1};
        assert.ok(turnRadius(params.speedMs, params.bankAngleDeg) < 7);
        assert.equal(arcTurnRadius(params.speedMs, params.bankAngleDeg), 10);

        const corner = destination(HOME, 0, 600);
        const points = [HOME, corner, destination(corner, 180, 40)];
        const stepM = params.speedMs * 0.1;
        for (const turnMode of [TurnMode.COORD_FLYBY, TurnMode.DIRECT]) {
            const result = simulateGroundTrack(points, {...params, turnMode});
            assert.ok(!result.events.some((event) => event.type === SimEvent.ABANDONED), `${turnMode} abandoned a leg`);
            assert.ok(!result.warnings.some((warning) => warning.code === 'leg-not-flyable'), turnMode);

            const radii = [];
            for (let index = 1; index < result.samples.length; index++) {
                const radius = flownRadius(result.samples[index - 1], result.samples[index], stepM);
                if (Number.isFinite(radius)) radii.push(radius);
            }
            const tightest = Math.min(...radii);
            assert.ok(Math.abs(tightest - 10) < 0.1, `${turnMode} turned at ${tightest.toFixed(2)} m`);
        }
    });
});
