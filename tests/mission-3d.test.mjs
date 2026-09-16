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
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.SET_POI}),
            waypoint({number: 2, action: MWNP.WPTYPE.SET_HEAD, attached: true}),
            waypoint({number: 3, action: MWNP.WPTYPE.LAND})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 3]]);
        assert.deepEqual(legs.map((leg) => leg.jump), [null]);
    });

    test('closes the chain at an attached end-of-mission marker', () => {
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.SET_HEAD, attached: true, endMission: 0xA5}),
            waypoint({number: 3}),
            waypoint({number: 4})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [3, 4]]);
    });

    test('splits the route at a mid-mission RTH so points after it terrain-check as a separate leg', () => {
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.RTH, attached: true}),
            waypoint({number: 3}),
            waypoint({number: 4})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [3, 4]]);
    });

    test('ends the route at an unattached LAND even without an end-of-mission marker', () => {
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.LAND}),
            waypoint({number: 2}),
            waypoint({number: 3})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [2, 3]]);
    });

    test('adds the return leg of a backward JUMP once, however often it repeats', () => {
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 2})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 2], [2, 0]]);
        assert.deepEqual(legs.map((leg) => leg.jump), [null, null, {repeat: 2}]);
    });

    test('walks an infinite JUMP once and terminates', () => {
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: -1})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 0]]);
        assert.deepEqual(legs[1].jump, {repeat: -1});
    });

    test('leaves out the waypoints a forward JUMP skips', () => {
        const legs = getMission3DFlightLegs([
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
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 1}),
            waypoint({number: 3})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 0], [1, 3]]);
    });

    test('ignores a JUMP with zero repeats, since it is never taken', () => {
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 0})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 2]]);
    });

    test('resolves the JUMP target relative to the start of its own sub-mission', () => {
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1, endMission: 0xA5}),
            waypoint({number: 2}),
            waypoint({number: 3}),
            waypoint({number: 4, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 1})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1], [2, 3], [3, 2]]);
    });

    test('ignores a JUMP whose target is missing, itself, or not a route point', () => {
        const legs = getMission3DFlightLegs([
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
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.RTH, attached: true}),
            waypoint({number: 3, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 1})
        ]);

        assert.deepEqual(legPairs(legs), [[0, 1]]);
    });

    test('stops walking a malformed mission at the step limit', () => {
        const legs = getMission3DFlightLegs([
            waypoint({number: 0}),
            waypoint({number: 1}),
            waypoint({number: 2, action: MWNP.WPTYPE.JUMP, attached: true, p1: 0, p2: 1000000})
        ], 50);

        assert.deepEqual(legPairs(legs), [[0, 1], [1, 0]]);
    });
});

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
        const segments = getMission3DFlightSegments(points, getMission3DFlightLegs(waypoints));

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
        const segments = getMission3DFlightSegments(points, getMission3DFlightLegs(waypoints));

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
        const segments = getMission3DFlightSegments(rendered, getMission3DFlightLegs(waypoints));

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
