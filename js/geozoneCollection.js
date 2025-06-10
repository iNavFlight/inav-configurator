'use strict';

const BitHelper = require('./bitHelper');
const { GeozoneShapes } = require('./geozone');

let GeozoneCollection = function() {
    let self = {},
        data = [],
        maxVertices = 126,
        maxZones = 63;

    self.getMaxVertices = () => {
        return maxVertices;
    }

    self.getMaxZones = () => {
        return maxZones;
    }

    self.put = (element) => {
        element.setNumber(data.length);
        data.push(element);
    };

    self.get = () => {
        return data;
    };

    self.at = (idx) => {
        return data[idx];
    }

    self.isEmpty = () => {
        return data.length == 0;
    };

    self.flush = () => {
        data = [];
    };

    self.first = () => {
        return !self.isEmpty() ? data[0] : null;
    }

    self.last = () => {
        return !self.isEmpty() ? data[data.length - 1] : null;
    }

    self.updateGeozone = (newGeozone) => {
        data[newGeozone.getNumber()] = newGeozone;
    }

    self.geozoneCount = () => {
        return data.length;
    }

    self.getUsedVerticesCount = () => {
        let count = 0;

        data.forEach(zone => {
            if (zone.getShape() == GeozoneShapes.POLYGON) {
                count += zone.getVerticesCount();
            } else {
                count += 2;
            }
        });

        return count;
    }

    self.drop = (idx) => {
        data.forEach(zone => {
            if (zone.getNumber() >= idx) {
                zone.setNumber(zone.getNumber() - 1);
            }
        });   
        data.splice(idx, 1);
    }

    self.insert = (geoZone, idx) => {
        data.forEach(zone => {
            if (zone.getNumber() >= idx) {
                zone.setNumber(zone.getNumber() + 1);
            }
        });
        data.splice(idx, 0, geoZone);
    }

    self.extractBufferVertices = (zoneId, vertexId) => {
        let buffer = [];
        if (zoneId < self.geozoneCount()) {
            let zone = data[zoneId];
            if (vertexId < zone.getVerticesCount()) {            
                buffer.push(zoneId); 
                let vertex = zone.getVertex(vertexId);
                buffer.push(vertex.getNumber());
                buffer.push(BitHelper.specificByte(vertex.getLat(), 0));
                buffer.push(BitHelper.specificByte(vertex.getLat(), 1));
                buffer.push(BitHelper.specificByte(vertex.getLat(), 2));
                buffer.push(BitHelper.specificByte(vertex.getLat(), 3));
                buffer.push(BitHelper.specificByte(vertex.getLon(), 0));
                buffer.push(BitHelper.specificByte(vertex.getLon(), 1));
                buffer.push(BitHelper.specificByte(vertex.getLon(), 2));
                buffer.push(BitHelper.specificByte(vertex.getLon(), 3));
                if (zone.getShape() == GeozoneShapes.CIRCULAR) {
                    buffer.push(BitHelper.specificByte(zone.getRadius(), 0));
                    buffer.push(BitHelper.specificByte(zone.getRadius(), 1));
                    buffer.push(BitHelper.specificByte(zone.getRadius(), 2));
                    buffer.push(BitHelper.specificByte(zone.getRadius(), 3));
                }          
                    
            }
        }
        if (buffer.length == 0) {
            buffer = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }        
        return buffer;
    }

    self.extractBufferZone = (id) => {
        let buffer = [];
        if (id < self.geozoneCount()) {
            let zone = data[id];
            buffer.push(zone.getNumber());
            buffer.push(zone.getType());
            buffer.push(zone.getShape());
            buffer.push(BitHelper.specificByte(zone.getMinAltitude(), 0));
            buffer.push(BitHelper.specificByte(zone.getMinAltitude(), 1));
            buffer.push(BitHelper.specificByte(zone.getMinAltitude(), 2));
            buffer.push(BitHelper.specificByte(zone.getMinAltitude(), 3));
            buffer.push(BitHelper.specificByte(zone.getMaxAltitude(), 0));
            buffer.push(BitHelper.specificByte(zone.getMaxAltitude(), 1));
            buffer.push(BitHelper.specificByte(zone.getMaxAltitude(), 2));
            buffer.push(BitHelper.specificByte(zone.getMaxAltitude(), 3));
            buffer.push(zone.getSealevelRef());
            buffer.push(zone.getFenceAction());
            if (zone.getShape() == GeozoneShapes.CIRCULAR) { 
                buffer.push(2);
            } else {
                buffer.push(zone.getVerticesCount());
            }
        } else {
            buffer = [id, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        }

        return buffer;
    }

    return self;
};

module.exports = GeozoneCollection;