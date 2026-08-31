'use strict';

import MWNP from './mwnp.js';

export const ROUTE_ACTIONS = new Set([
    MWNP.WPTYPE.WAYPOINT,
    MWNP.WPTYPE.POSHOLD_UNLIM,
    MWNP.WPTYPE.POSHOLD_TIME,
    MWNP.WPTYPE.LAND
]);

function hasValidHomePosition(home) {
    if (!home?.getLat || !home?.getLon) return false;

    const lat = Number(home.getLat());
    const lon = Number(home.getLon());
    return Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0);
}

export function getMission3DPoints(waypoints, home) {
    const points = [];

    waypoints.forEach((waypoint) => {
        if (!waypoint.isAttached()) {
            const layerNumber = waypoint.getLayerNumber();
            const lat = Number(waypoint.getLatMap());
            const lon = Number(waypoint.getLonMap());
            const altitude = Number(waypoint.getAlt()) / 100;
            const action = waypoint.getAction();

            if (Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(altitude)) {
                points.push({
                    number: layerNumber === 'undefined' ? waypoint.getNumber() : layerNumber,
                    lat,
                    lon,
                    altitude,
                    absoluteAltitude: (waypoint.getP3() & (1 << MWNP.P3.ALT_TYPE)) !== 0,
                    action,
                    isHome: false,
                    isRoutePoint: ROUTE_ACTIONS.has(action),
                    endsMission: false
                });
            }
        }

        if (waypoint.getEndMission() === 0xA5 && points.length) {
            points.at(-1).endsMission = true;
        }
    });

    if (hasValidHomePosition(home)) {
        points.unshift({
            number: 'H',
            lat: home.getLatMap(),
            lon: home.getLonMap(),
            altitude: Number(home.getAlt()) || 0,
            absoluteAltitude: true,
            action: 0,
            isHome: true,
            isRoutePoint: false,
            endsMission: false
        });
    }

    return points;
}

export function getMission3DPlannedHeight(point, groundHeight, homeGroundHeight) {
    if (point.isHome) return groundHeight;
    if (point.absoluteAltitude) return point.altitude;
    if (!Number.isFinite(homeGroundHeight)) return groundHeight + point.altitude;
    return homeGroundHeight + point.altitude;
}

export function getMission3DRouteSegments(points) {
    const segments = [];
    let segment = [];

    points.forEach((point) => {
        if (point.isRoutePoint) segment.push(point);
        if (point.endsMission && segment.length) {
            segments.push(segment);
            segment = [];
        }
    });

    if (segment.length) segments.push(segment);
    return segments;
}

export function getMission3DSamplingSpacing(edgeDistances, minimumSpacing = 30, maximumSamples = 4096) {
    const distances = edgeDistances.filter((distance) => Number.isFinite(distance) && distance > 0);
    if (!distances.length) return minimumSpacing;

    const totalDistance = distances.reduce((sum, distance) => sum + distance, 0);
    const availableSteps = Math.max(1, maximumSamples - distances.length);
    return Math.max(minimumSpacing, totalDistance / availableSteps);
}

export function getMission3DRouteRuns(samples) {
    const runs = [];

    for (let index = 1; index < samples.length; index++) {
        const previousSample = samples[index - 1];
        const sample = samples[index];
        const terrainClearanceAvailable = previousSample.terrainClearanceAvailable !== false
            && sample.terrainClearanceAvailable !== false;
        const collidesWithTerrain = terrainClearanceAvailable
            && (previousSample.clearance <= 0 || sample.clearance <= 0);
        const currentRun = runs.at(-1);

        if (currentRun?.collidesWithTerrain !== collidesWithTerrain) {
            runs.push({
                collidesWithTerrain,
                samples: [previousSample, sample]
            });
        } else {
            currentRun.samples.push(sample);
        }
    }

    return runs;
}

export function getMission3DPointLabel(point) {
    if (point.isHome) return 'H';

    const number = Number(point.number);
    return String(Number.isFinite(number) ? number + 1 : point.number);
}
