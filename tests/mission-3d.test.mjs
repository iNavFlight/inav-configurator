import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import MWNP from '../js/mwnp.js';
import {
    getMission3DPlannedHeight,
    getMission3DPointLabel,
    getMission3DPoints,
    getMission3DRouteRuns,
    getMission3DRouteSegments,
    getMission3DSamplingSpacing
} from '../js/mission_3d.js';

function waypoint({
    number = 0,
    layerNumber = 'undefined',
    action = MWNP.WPTYPE.WAYPOINT,
    lat = 47,
    lon = 8,
    altitude = 5000,
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

    test('propagates an attached end-of-mission marker to the preceding positional point', () => {
        const points = getMission3DPoints([
            waypoint({number: 0}),
            waypoint({number: 1, action: MWNP.WPTYPE.SET_HEAD, attached: true, endMission: 0xA5}),
            waypoint({number: 2})
        ], null);

        assert.equal(points[0].endsMission, true);
        assert.equal(points[1].endsMission, false);
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
});

describe('Mission Planner 3D route terrain checks', () => {
    test('keeps separate missions isolated and excludes non-route markers', () => {
        const segments = getMission3DRouteSegments([
            {number: 1, isRoutePoint: true, endsMission: false},
            {number: 'POI', isRoutePoint: false, endsMission: false},
            {number: 2, isRoutePoint: true, endsMission: true},
            {number: 3, isRoutePoint: true, endsMission: false},
            {number: 4, isRoutePoint: true, endsMission: false}
        ]);

        assert.deepEqual(segments.map((segment) => segment.map((point) => point.number)), [[1, 2], [3, 4]]);
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
