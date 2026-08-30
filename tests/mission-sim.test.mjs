import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import MWNP from '../js/mwnp.js';
import {
    SimEvent,
    TurnSmoothing,
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
    getSimulationRoute,
    headingDifference,
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
    loiterRadiusM: 90,
    waypointRadiusM: 12,
    speedMs: 22
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
        const {homeKnown} = resolveRouteAltitudes([{altCm: 45000, absoluteAltitude: true}], undefined);
        assert.equal(homeKnown, false);
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

    test('with turn smoothing off the corner is bank limited, not loiter sized', () => {
        // nav_fw_wp_turn_smoothing defaults to OFF, and the firmware then never
        // enters the smoothing block at all — the loiter radius stays out of it.
        assert.ok(Math.abs(
            commandedTurnRadius(15, 35, 75, TurnSmoothing.OFF) - turnRadius(15, 35)
        ) < 1e-9);
    });

    test('turn smoothing never widens the flown radius', () => {
        // The firmware anticipates the corner instead of turning wider. Widening
        // here would push the track further outside the corner than the aircraft
        // ever goes, so every mode flies the bank-limited radius.
        for (const mode of [TurnSmoothing.OFF, TurnSmoothing.ON, TurnSmoothing.CUT]) {
            assert.ok(Math.abs(commandedTurnRadius(15, 35, 75, mode) - turnRadius(15, 35)) < 1e-9, mode);
        }
    });

    test('every smoothing mode reaches the simulator and flies the same track', () => {
        const corner = destination(HOME, 0, 900);
        const exit = destination(corner, 90, 900);
        const tracks = [TurnSmoothing.OFF, TurnSmoothing.ON, TurnSmoothing.CUT].map(
            (turnSmoothing) => simulateGroundTrack([HOME, corner, exit], {...FC, turnSmoothing})
        );

        for (const track of tracks) {
            assert.equal(track.samples.length, tracks[0].samples.length);
            assert.ok(Math.abs(track.summary.turnRadiusM - turnRadius(FC.speedMs, FC.bankAngleDeg)) < 1e-9);
        }
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

        const expected = commandedTurnRadius(
            FC.speedMs, FC.bankAngleDeg, FC.loiterRadiusM, TurnSmoothing.OFF
        );
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

    test('with turn smoothing off the aircraft flies past the corner', () => {
        // The corner waypoint is reached first, and only then does the turn
        // begin, so the track has to swing clear of the ideal corner.
        const corner = destination(HOME, 0, 1000);
        const exit = destination(corner, 90, 1000);
        const result = simulateGroundTrack([HOME, corner, exit], FC);

        const expected = commandedTurnRadius(
            FC.speedMs, FC.bankAngleDeg, FC.loiterRadiusM, TurnSmoothing.OFF
        );

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
        // passed once the bearing to it has swung 100 degrees off that line
        // (navigation.c:4224-4229 and 3062-3064). Taking the reference from the
        // aircraft's own position instead would move every switch after a corner.
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
            offLeg > 99 && offLeg < 115,
            `gave up at ${offLeg.toFixed(1)} degrees off the leg, expected about 100`
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

    test('a mission with fewer than two points produces nothing', () => {
        const result = simulateGroundTrack([HOME], FC);
        assert.equal(result.samples.length, 0);
        assert.equal(result.summary.totalDistanceM, 0);
    });
});
