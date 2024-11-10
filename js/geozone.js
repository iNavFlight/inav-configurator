'use strict'

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
        minAltitude = data;
    }

    self.getMinAltitude = () => {
        return minAltitude;
    }

    self.setMaxAltitude = (data) => {
        maxAltitude = data;
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