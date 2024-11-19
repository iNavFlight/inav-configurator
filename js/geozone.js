'use strict'

const { Shape } = require("three");

const GeozoneType = Object.freeze({
    EXCULSIVE: 0,
    INCLUSIVE: 1,
});

const GeozoneShapes = Object.freeze({
    CIRCULAR: 0,
    POLYGON: 1,
});

const GeozoneFenceAction = Object.freeze({
    NONE: 0,
    AVOID: 1,
    POSHOLD: 2,
    RTH: 3,
});

let GeozoneVertex = function (number, lat, lon) {
    self = {};

    self.setNumber = (data) => {
        number = data;
    }

    self.getNumber = () => {
        return number;
    }

    self.setLat = (data) => {
        lat = data;
    }

    self.getLat = () => {
        return lat;
    }

    self.setLon = (data) => {
        lon = data;
    } 

    self.getLon = () => {
        return lon;
    }

    self.getLatMap = () => {
        return lat / 1e7;
    }

    self.getLonMap = () => {
        return lon / 1e7;
    }

    return self;
}

let Geozone = function (type, shape, minAltitude, maxAltitude, sealevelRef, radius, fenceAction, vertices, number = 0) {
    var self = {};

    self.setNumber = (data) => {
        number = data;
    }

    self.getNumber = () => {
        return number;
    }

    self.setType = (data) => {
        type = data;
    }

    self.getType = () => {
        return type;
    }

    self.setShape = (data) => {
        shape = data;
    }

    self.getShape = () => {
        return shape;
    }

    self.setMinAltitude = (data) => {
        if (!isNaN(data)){
            minAltitude = parseInt(data);
        } else {
            minAltitude = data;
        }
    }

    self.getMinAltitude = () => {
        return minAltitude;
    }

    self.setMaxAltitude = (data) => {
        if (!isNaN(data)){
            maxAltitude = parseInt(data);
        } else {
            maxAltitude = data;
        }
    }

    self.getMaxAltitude = () => {
        return maxAltitude;
    }

    self.setSealevelRef = (data) => {
        sealevelRef = data;
    }

    self.getSealevelRef = () => {
        return sealevelRef;
    }

    self.setRadius = (data) => {
        radius = data;
    }

    self.getRadius = () => {
        return radius;
    }

    self.setFenceAction = (data) => {
        fenceAction = data;
    }

    self.getFenceAction = () => {
        return fenceAction;
    }
    
    self.getFirstVertex = () => {
        return vertices[0];
    }

    self.getLastVertex = () => {
        return vertices[vertices.length - 1];
    }

    self.getVerticesCount = () => {
        return vertices.length;
    }

    self.getVertex = (idx) => {
        return vertices[idx];
    }

    self.setVertex = (idx, vertex) => {
        vertices[idx] = vertex;
    }

    self.getVertices = () => {
        return vertices;
    }

    self.setVertices = (data) => {
        vertices = data;
    }

    self.getVerticesCount = () => {
        return vertices.length;
    }

    self.insertVertex = (idx, newVertex) => {
        vertices.forEach(vertex => {
            if (vertex.getNumber() >= idx) {
                vertex.setNumber(vertex.getNumber() + 1);
            }
        });
        vertices.splice(idx, 0, newVertex);
    }

    self.dropVertex = (idx) => {
        vertices.forEach(vertex => {
            if (vertex.getNumber() >= idx) {
                vertex.setNumber(vertex.getNumber() - 1);
            }
        });   
        vertices.splice(idx, 1);
    }

    self.resetVertices = () => {
        vertices = [];
    }

    self.isCounterClockwise = () => {
        
        if (shape == GeozoneShapes.CIRCULAR) {
            return true;
        }
        
        let area = 0;
        for (let i = 0; i < vertices.length; i++) {
            const x1 =  vertices[i].getLat();
            const y1 = vertices[i].getLon();
            const next = vertices[(i + 1) % vertices.length];
            const x2 = next.getLat();
            const  y2 = next.getLon();
            area += x1 * y2 - y1 * x2;
        }
        return area < 0;
    }

    self.isComplex = () => {
        if (shape == GeozoneShapes.CIRCULAR) {
            return false;
        }

        // Intersection of two lines https://en.wikipedia.org/wiki/Line-line_intersection
        function doLinesIntersect(line1Start, line1End, line2Start, line2End)
        {
            const s1 = line1End.x - line1Start.x;
            const t1 = -(line2End.x - line2Start.x);
            const r1 = line2Start.x - line1Start.x;

            const s2 = line1End.y - line1Start.y;
            const t2 = -(line2End.y - line2Start.y);
            const r2 = line2Start.y - line1Start.y;

            // Use Cramer's rule for the solution of the system of linear equations
            const determ = s1 * t2 - t1 * s2;
            if (determ == 0) { // No solution
                return false;
            }

            const s0 = (r1 * t2 - t1 * r2) / determ;
            const t0 = (s1 * r2 - r1 * s2) / determ;

            if (s0 == 0 && t0 == 0) {
                return false;
            }
            return !(s0 <= 0 || s0 >= 1 || t0 <= 0 || t0 >= 1)	
        }
        
        for (var i = 0; i < vertices.length; i++) {
            const a = {x: vertices[i].getLat(), y: vertices[i].getLon()};
            const next = vertices[(i + 1) % vertices.length];
            const b = {x: next.getLat(), y: next.getLon()};
            for (var j = i + 2; j < vertices.length; j++) {
                const c = {x: vertices[j].getLat(), y: vertices[j].getLon()};;
                const next2 = vertices[(j + 1) % vertices.length];
                const d = {x: next2.getLat(), y: next2.getLon()};
                if (doLinesIntersect(a, b, c, d)) {
                    return true;
                }
            }
        }
        return false;
    }

    self.getElevationFromServer = async function (lon, lat, globalSettings) {
        let elevation = "N/A";
        if (globalSettings.mapProviderType == 'bing') {
            let elevationEarthModel = $('#elevationEarthModel').prop("checked") ? "ellipsoid" : "sealevel";

            const response = await fetch('http://dev.virtualearth.net/REST/v1/Elevation/List?points='+lat+','+lon+'&heights='+elevationEarthModel+'&key='+globalSettings.mapApiKey);
            const myJson = await response.json();
            elevation = myJson.resourceSets[0].resources[0].elevations[0];
        }
        else {
            const response = await fetch('https://api.opentopodata.org/v1/aster30m?locations='+lat+','+lon);
            const myJson = await response.json();
            if (myJson.status == "OK" && myJson.results[0].elevation != null) {
                elevation = myJson.results[0].elevation;
            }
        }
        return elevation;
    }

    return self;

    return self;
}

module.exports = { Geozone, GeozoneVertex, GeozoneType, GeozoneShapes, GeozoneFenceAction };