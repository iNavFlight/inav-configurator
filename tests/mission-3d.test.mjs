import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import MWNP from '../js/mwnp.js';
import {
    getMission3DFlightLegs,
    getMission3DFlightSegments,
    getMission3DJumpLabel,
    getMission3DPlannedHeight,
    getMission3DPointLabel,
    getMission3DPoints,
    getMission3DRouteRuns,
    getMission3DSamplingSpacing
} from '../js/mission_3d.js';

function waypoint({
    number = 0,
    layerNumber = 'undefined',
    action = MWNP.WPTYPE.WAYPOINT,
    lat = 47,
    lon = 8,
    altitude = 5000,
    p1 = 0,
    p2 = 0,
    p3 = 0,
    attached = false,
    endMission = 0
} = {}) {
    return {
        getNumber: () => number,
        getLayerNumber: () => layerNumber,
        getAction: () => action,
        getLatMap: () => lat,
        getLonMap: () => lon,
        getAlt: () => altitude,
        getP1: () => p1,
        getP2: () => p2,
        getP3: () => p3,
        isAttached: () => attached,
        getEndMission: () => endMission
    };
}

function home({ lat = 47, lon = 8, altitude = 450 } = {}) {
    return {
        getLat: () => lat * 10000000,
        getLon: () => lon * 10000000,
        getLatMap: () => lat,
        getLonMap: () => lon,
        getAlt: () => altitude
    };
}

const legPairs = (legs) => legs.map((leg) => [leg.from, leg.to]);
const legKeys = (legs) => new Set(legs.map((leg) => `${leg.from}->${leg.to}`));
const segmentNumbers = (segments) => segments.map((segment) => segment.points.map((point) => point.waypointNumber));

describe('Mission Planner 3D points', () => {
    test('keeps positional markers while excluding POIs and attached actions from the route', () => {
        const points = getMission3DPoints([
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.SET_POI}),
            waypoint({number: 2, action: MWNP.WPTYPE.SET_HEAD, attached: true}),
            waypoint({number: 3, action: MWNP.WPTYPE.LAND})
        ], null);

        assert.equal(points.length, 3);
        assert.deepEqual(points.map((point) => point.isRoutePoint), [true, false, true]);
    });

    test('drops a waypoint without usable coordinates', () => {
        const points = getMission3DPoints([
            waypoint({number: 0}),
            waypoint({number: 1, lat: 'n/a'})
        ], null);

        assert.deepEqual(points.map((point) => point.waypointNumber), [0]);
    });

    test('accepts a home on the equator or prime meridian but rejects an unset 0,0 home', () => {
        const equatorPoints = getMission3DPoints([waypoint()], home({lat: 0, lon: 8}));
        const unsetPoints = getMission3DPoints([waypoint()], home({lat: 0, lon: 0}));

        assert.equal(equatorPoints[0].isHome, true);
        assert.equal(unsetPoints.some((point) => point.isHome), false);
    });

    test('reads absolute altitude from the waypoint P3 flag', () => {
        const points = getMission3DPoints([
            waypoint({number: 0, p3: 0}),
            waypoint({number: 1, p3: 1 << MWNP.P3.ALT_TYPE})
        ], null);

        assert.equal(points[0].absoluteAltitude, false);
        assert.equal(points[1].absoluteAltitude, true);
    });
});

describe('Mission Planner 3D flight legs', () => {
    test('connects consecutive route waypoints and skips POIs and attached actions', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.SET_POI}),
            waypoint({number: 2, action: MWNP.WPTYPE.SET_HEAD, attached: true}),
            waypoint({number: 3, action: MWNP.WPTYPE.LAND})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 3]]);
        assert.deepEqual(legs.map((leg) => leg.jump), [null]);
    });

    test('closes the chain at an attached end-of-mission marker', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.SET_HEAD, attached: true, endMission: 0xA5}),
            waypoint({number: 3}),
            waypoint({number: 4})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [3, 4]]);
    });

    test('splits the route at a mid-mission RTH so points after it terrain-check as a separate leg', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.RTH, attached: true}),
            waypoint({number: 3}),
            waypoint({number: 4})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [3, 4]]);
    });

    test('ends the route at an unattached LAND even without an end-of-mission marker', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.LAND}),
            waypoint({number: 2}),
            waypoint({number: 3})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [2, 3]]);
    });

    test('adds the return leg of a backward JUMP once, however often it repeats', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 2})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 2], [2, 0]]);
        assert.deepEqual(legs.map((leg) => leg.jump), [null, null, {repeat: 2}]);
    });

    test('walks an infinite JUMP once and terminates', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: -1})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 0]]);
        assert.deepEqual(legs[1].jump, {repeat: -1});
    });

    test('ends a sub-mission in an infinite loop but still walks the next one', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: -1}),
            waypoint({number: 3, endMission: 0xA5}),
            waypoint({number: 4}),
            waypoint({number: 5})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 0], [4, 5]]);
    });

    test('walks past a JUMP whose repeat count exceeds the editor limit', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 100}),
            waypoint({number: 4})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 2], [2, 0], [2, 4]]);
    });

    test('leaves out the waypoints a forward JUMP skips', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.JUMP, attached: true, p1: 5, p2: 1}),
            waypoint({number: 3}),
            waypoint({number: 4}),
            waypoint({number: 5}),
            waypoint({number: 6})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 5], [5, 6]]);
        assert.deepEqual(legs[1].jump, {repeat: 1});
    });

    test('flies the waypoints after a backward JUMP once its repeats are used up', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 1}),
            waypoint({number: 3})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 0], [1, 3]]);
    });

    test('ignores a JUMP with zero repeats, since it is never taken', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 0})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 2]]);
    });

    test('resolves the JUMP target relative to the start of its own sub-mission', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1, endMission: 0xA5}),
            waypoint({number: 2}),
            waypoint({number: 3}),
            waypoint({number: 4, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 1})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [2, 3], [3, 2]]);
    });

    test('ignores a JUMP whose target is missing, itself, or not a route point', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.SET_POI}),
            waypoint({number: 2}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 1, p2: 1}),
            waypoint({number: 4, action: MWNP.WPTYPE.JUMP, attached: true, p1: 2, p2: 1}),
            waypoint({number: 5, action: MWNP.WPTYPE.JUMP, attached: true, p1: 9, p2: 1})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 2]]);
    });

    test('drops a JUMP that follows an RTH, since the route already ended there', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.RTH, attached: true}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 1})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1]]);
    });

    test('stops at the step limit and reports the walk as truncated', () => {
        const result = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 1}),
            waypoint({number: 4})
        ], 3);

        assert.deepEqual(legPairs(result.legs), [[0, 1], [1, 2]]);
        assert.equal(result.truncated, true);
    });

    test('reloads a JUMP counter after it falls through, so an outer loop takes it again', () => {
        const mission = missionFromItems([
            {}, {}, {jump: 6, repeat: 1}, {}, {jump: 10, repeat: 10}, {}, {}, {jump: 10, repeat: 1},
            {}, {}, {}, {jump: 0, repeat: 3}, {}
        ]);
        const {legs, truncated} = getMission3DFlightLegs(mission);

        assert.equal(truncated, false);
        for (const leg of [[6, 8], [8, 9], [9, 10]]) assert.ok(legKeys(legs).has(leg.join('->')), leg.join('->'));
        assert.deepEqual(legKeys(legs), flownEdges(mission));
    });

    test('keeps walking after an inner infinite JUMP when an outer finite JUMP leads past it', () => {
        const mission = missionFromItems([{}, {}, {jump: 5, repeat: -1}, {}, {}, {}, {jump: 0, repeat: 2}, {}]);
        const {legs} = getMission3DFlightLegs(mission);

        assert.ok(legKeys(legs).has('5->7'));
        assert.deepEqual(legKeys(legs), flownEdges(mission));
    });

    test('collects the legs an infinite loop flies only every third pass', () => {
        const mission = missionFromItems([{}, {}, {jump: 4, repeat: 2}, {}, {}, {jump: 0, repeat: -1}]);
        const {legs} = getMission3DFlightLegs(mission);

        assert.ok(legKeys(legs).has('1->3') && legKeys(legs).has('3->4'));
        assert.deepEqual(legKeys(legs), flownEdges(mission));
    });

    test('never takes a JUMP the firmware refuses to arm with', () => {
        const {legs} = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.POSHOLD_UNLIM}),
            waypoint({number: 3}),
            waypoint({number: 4, action: MWNP.WPTYPE.JUMP, attached: true, p1: 2, p2: 1}),
            waypoint({number: 5, action: MWNP.WPTYPE.JUMP, attached: true, p1: 3, p2: 1}),
            waypoint({number: 6, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: -2}),
            waypoint({number: 7})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 2], [2, 3], [3, 7]]);
    });

    test('folds twenty chained x10 loops instead of flying 11^20 passes', () => {
        const items = [{}, {}];
        const expected = new Set(['0->1']);
        for (let level = 0; level < 20; level++) {
            const first = items.length;
            items.push({}, {}, {jump: 0, repeat: 10});
            expected.add(`${first - (items[first - 1].jump === undefined ? 1 : 2)}->${first}`);
            expected.add(`${first}->${first + 1}`).add(`${first + 1}->0`);
        }
        const result = getMission3DFlightLegs(missionFromItems(items));

        assert.equal(result.truncated, false);
        assert.deepEqual(legKeys(result.legs), expected);
    });

    test('ends an infinite loop whose own JUMP is only passed inside replayed passes', () => {
        const mission = missionFromItems([
            {}, {jump: 5, repeat: 3}, {}, {}, {}, {}, {jump: 0, repeat: 2}, {head: true}, {jump: 3, repeat: -1}, {type: 'poi'}
        ]);
        const {legs, truncated} = getMission3DFlightLegs(mission);

        assert.equal(truncated, false);
        assert.deepEqual(legKeys(legs), flownEdges(mission));
    });

    test('walks the points after a mid-mission RTH or LAND as a plain chain without JUMPs', () => {
        const afterRth = getMission3DFlightLegs(missionFromItems([{}, {}, {type: 'rth'}, {}, {}, {jump: 0, repeat: 1}, {}]));
        const afterLand = getMission3DFlightLegs(missionFromItems([{}, {type: 'land'}, {}, {jump: 0, repeat: 1}, {}]));

        assert.deepEqual(legPairs(afterRth.legs), [[0, 1], [3, 4], [4, 6]]);
        assert.deepEqual(afterRth.legs.map((leg) => leg.jump), [null, null, null]);
        assert.deepEqual(legPairs(afterLand.legs), [[0, 1], [2, 4]]);
    });

    test('reports a JUMP the firmware refuses to arm with', () => {
        assert.equal(getMission3DFlightLegs(missionFromItems([{}, {}, {jump: 0, repeat: -2}, {}])).invalidJumps, true);
        assert.equal(getMission3DFlightLegs(missionFromItems([{}, {}, {jump: 1, repeat: 1}, {}])).invalidJumps, true);
        assert.equal(getMission3DFlightLegs(missionFromItems([{}, {}, {jump: 0, repeat: 1}, {}])).invalidJumps, false);
    });

    test('matches a port of the firmware JUMP handling on random valid missions', () => {
        const random = mulberry32(2742);
        let compared = 0;
        let exact = 0;
        while (compared < 3000) {
            const items = randomMissionItems(random);
            if (!items) continue;
            const mission = missionFromItems(items);
            const {legs, truncated, invalidJumps} = getMission3DFlightLegs(mission);
            const walked = legKeys(legs);
            const flown = flownEdges(mission);
            assert.equal(truncated, false, JSON.stringify(items));
            assert.equal(invalidJumps, false, JSON.stringify(items));
            assert.deepEqual([...flown].filter((leg) => !walked.has(leg)), [], JSON.stringify(items));
            // Points after a mid-mission RTH or LAND are walked on purpose; everything else must match.
            if (!endsEarly(items)) {
                assert.deepEqual(walked, flown, JSON.stringify(items));
                exact++;
            }
            compared++;
        }
        assert.ok(exact > 1000, `only ${exact} exact comparisons`);
    });
});

// A line-by-line port of navigation.c (maintenance-10.x): setupJumpCounters(), NAV_WP_ACTION_JUMP
// with startWpIndex, and the geo / RTH / LAND / last-waypoint handling of the waypoint states. It
// flies every sub-mission from its first item and returns the union of the legs flown.
function flownEdges(mission, maximumSteps = 200000) {
    const list = mission.map((item) => ({
        action: item.getAction(), p1: item.getP1(), p2: item.getP2(), p3: 0, flag: item.getEndMission()
    }));
    const isGeo = (action) => [MWNP.WPTYPE.WAYPOINT, MWNP.WPTYPE.POSHOLD_TIME, MWNP.WPTYPE.LAND].includes(action);
    const edges = new Set();
    let startWpIndex = 0;

    while (startWpIndex < list.length) {
        let lastIndex = startWpIndex;
        while (lastIndex < list.length - 1 && list[lastIndex].flag !== 0xA5) lastIndex++;
        const isLast = (index) => index >= lastIndex || list[index].flag === 0xA5;
        for (let index = startWpIndex; index <= lastIndex; index++) {
            if (list[index].action === MWNP.WPTYPE.JUMP) list[index].p3 = list[index].p2;
        }

        let active = startWpIndex;
        let previous = null;
        for (let step = 0; step < maximumSteps; step++) {
            const item = list[active];
            if (isGeo(item.action)) {
                if (previous !== null && previous !== active) edges.add(`${previous}->${active}`);
                previous = active;
                if (item.action === MWNP.WPTYPE.LAND || isLast(active)) break;
                active++;
            } else if (item.action === MWNP.WPTYPE.RTH) {
                break;
            } else if (item.action === MWNP.WPTYPE.JUMP && item.p3 !== 0) {
                if (item.p3 !== -1) item.p3--;
                active = item.p1 + startWpIndex;
            } else {
                if (item.action === MWNP.WPTYPE.JUMP) item.p3 = item.p2;
                if (isLast(active)) break;
                active++;
            }
        }
        startWpIndex = lastIndex + 1;
    }
    return edges;
}

const ITEM_TYPES = {
    wp: {action: MWNP.WPTYPE.WAYPOINT, attached: false},
    hold: {action: MWNP.WPTYPE.POSHOLD_TIME, attached: false},
    land: {action: MWNP.WPTYPE.LAND, attached: false},
    poi: {action: MWNP.WPTYPE.SET_POI, attached: false},
    head: {action: MWNP.WPTYPE.SET_HEAD, attached: true},
    rth: {action: MWNP.WPTYPE.RTH, attached: true},
    jump: {action: MWNP.WPTYPE.JUMP, attached: true}
};

const itemType = (item) => {
    if (item.jump !== undefined) return 'jump';
    return item.head ? 'head' : (item.type ?? 'wp');
};

// Items: {} is a waypoint, {type} one of ITEM_TYPES, {head} a SET_HEAD, {jump, repeat} a JUMP whose
// target is relative to its sub-mission; {end} closes a sub-mission, the last item always does.
function missionFromItems(items) {
    return items.map((item, number) => waypoint({
        number,
        ...ITEM_TYPES[itemType(item)],
        p1: item.jump ?? 0,
        p2: item.repeat ?? 0,
        endMission: item.end || number === items.length - 1 ? 0xA5 : 0
    }));
}

function subMissions(items) {
    const missions = [];
    let start = 0;
    items.forEach((item, index) => {
        if (item.end || index === items.length - 1) {
            missions.push(items.slice(start, index + 1));
            start = index + 1;
        }
    });
    return missions;
}

function endsEarly(items) {
    return subMissions(items).some((mission) => mission.slice(0, -1).some((item) => ['rth', 'land'].includes(itemType(item))));
}

function isArmableJump(mission, item, index) {
    const target = mission[item.jump];
    return index > 0 && item.jump >= 0 && item.jump < mission.length && Math.abs(item.jump - index) >= 2
        && item.repeat >= -1 && ['wp', 'hold', 'land'].includes(itemType(target));
}

function randomSubMission(random) {
    const items = [{type: random() < 0.8 ? 'wp' : 'hold'}];
    const length = 2 + Math.floor(random() * 9);
    const others = ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'hold', 'poi', 'head', 'land', 'rth'];
    while (items.length < length) {
        if (random() < 0.4) {
            items.push({jump: Math.floor(random() * length), repeat: Math.floor(random() * 5) - 1});
        } else {
            items.push({type: others[Math.floor(random() * others.length)]});
        }
    }
    items[items.length - 1].end = true;
    return items;
}

// One to three sub-missions that all pass the firmware arming check, or null.
function randomMissionItems(random) {
    const missions = Array.from({length: 1 + Math.floor(random() * 3)}, () => randomSubMission(random));
    const armable = missions.every((mission) => mission.every((item, index) => item.jump === undefined
        || isArmableJump(mission, item, index)));
    const items = missions.flat();
    return armable && items.some((item) => item.jump !== undefined) ? items : null;
}

function mulberry32(seed) {
    let state = seed;
    return () => {
        state = (state + 0x6D2B79F5) | 0;
        let value = Math.imul(state ^ (state >>> 15), 1 | state);
        value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

describe('Mission Planner 3D altitude and labels', () => {
    test('converts relative and absolute waypoint altitudes to world heights', () => {
        assert.equal(getMission3DPlannedHeight({isHome: false, absoluteAltitude: false, altitude: 120}, 500, 450), 570);
        assert.equal(getMission3DPlannedHeight({isHome: false, absoluteAltitude: false, altitude: 120}, 500, null), 620);
        assert.equal(getMission3DPlannedHeight({isHome: false, absoluteAltitude: true, altitude: 620}, 500, 450), 620);
        assert.equal(getMission3DPlannedHeight({isHome: true, absoluteAltitude: true, altitude: 620}, 500, 450), 500);
    });

    test('formats home, numeric, and custom waypoint labels', () => {
        assert.equal(getMission3DPointLabel({isHome: true}), 'H');
        assert.equal(getMission3DPointLabel({isHome: false, number: 0}), '1');
        assert.equal(getMission3DPointLabel({isHome: false, number: 'POI'}), 'POI');
    });

    test('formats the repeat label like the 2D editor', () => {
        assert.equal(getMission3DJumpLabel(3), 'Repeat x3');
        assert.equal(getMission3DJumpLabel(-1), 'Repeat x infinite');
    });
});

describe('Mission Planner 3D route terrain checks', () => {
    test('chains consecutive legs into one segment and keeps separate missions apart', () => {
        const waypoints = [
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.SET_POI}),
            waypoint({number: 2}),
            waypoint({number: 3, endMission: 0xA5}),
            waypoint({number: 4}),
            waypoint({number: 5})
        ];
        const points = getMission3DPoints(waypoints, home());
        const segments = getMission3DFlightSegments(points, getMission3DFlightLegs(waypoints).legs);

        assert.deepEqual(segmentNumbers(segments), [[0, 2, 3], [4, 5]]);
        assert.deepEqual(segments.map((segment) => segment.jump), [null, null]);
    });

    test('gives a JUMP leg its own segment carrying the repeat count', () => {
        const waypoints = [
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 2}),
            waypoint({number: 4})
        ];
        const points = getMission3DPoints(waypoints, null);
        const segments = getMission3DFlightSegments(points, getMission3DFlightLegs(waypoints).legs);

        assert.deepEqual(segmentNumbers(segments), [[0, 1, 2], [2, 0], [2, 4]]);
        assert.deepEqual(segments.map((segment) => segment.jump), [null, {repeat: 2}, null]);
    });

    test('resolves legs on rendered copies of the points and skips legs whose point was dropped', () => {
        const waypoints = [
            waypoint({number: 0}),
            waypoint({number: 1, lat: 'n/a'}),
            waypoint({number: 2}),
            waypoint({number: 3})
        ];
        const rendered = getMission3DPoints(waypoints, null).map((point) => ({...point, plannedHeight: 500}));
        const segments = getMission3DFlightSegments(rendered, getMission3DFlightLegs(waypoints).legs);

        assert.deepEqual(segmentNumbers(segments), [[2, 3]]);
        assert.equal(segments[0].points[0], rendered[1]);
    });

    test('marks a route collision when only an interior terrain sample intersects the route', () => {
        const samples = [
            {id: 'start', clearance: 20},
            {id: 'ridge', clearance: -5},
            {id: 'end', clearance: 20}
        ];
        const runs = getMission3DRouteRuns(samples);

        assert.equal(runs.length, 1);
        assert.equal(runs[0].collidesWithTerrain, true);
        assert.deepEqual(runs[0].samples.map((sample) => sample.id), ['start', 'ridge', 'end']);
    });

    test('splits clear and colliding parts for separate route colors', () => {
        const runs = getMission3DRouteRuns([
            {id: 1, clearance: 20},
            {id: 2, clearance: 20},
            {id: 3, clearance: -1},
            {id: 4, clearance: -2},
            {id: 5, clearance: 20},
            {id: 6, clearance: 20}
        ]);

        assert.deepEqual(runs.map((run) => run.collidesWithTerrain), [false, true, false]);
        assert.deepEqual(runs.map((run) => run.samples.map((sample) => sample.id)), [[1, 2], [2, 3, 4, 5], [5, 6]]);
    });

    test('does not report terrain collisions across unchecked relative-altitude samples', () => {
        const runs = getMission3DRouteRuns([
            {id: 'unknown', clearance: Number.POSITIVE_INFINITY, terrainClearanceAvailable: false},
            {id: 'checked-start', clearance: -2, terrainClearanceAvailable: true},
            {id: 'checked-end', clearance: -3, terrainClearanceAvailable: true}
        ]);

        assert.deepEqual(runs.map((run) => run.collidesWithTerrain), [false, true]);
    });

    test('uses detailed sampling for normal routes and caps very long routes', () => {
        assert.equal(getMission3DSamplingSpacing([300, 600]), 30);
        assert.ok(getMission3DSamplingSpacing([100000, 100000]) > 30);
    });
});
