'use strict';

const ol = require('openlayers');

const MWNP = require('./mwnp');
const Waypoint = require('./waypoint');
const BitHelper = require('./bitHelper');

let WaypointCollection = function () {

    let self = {},
        data = [],
        maxWaypoints = 120,
        isValidMission = 0,
        countBusyPoints = 0,
        version = 0,
        center = {}

    self.getMaxWaypoints = function () {
        return maxWaypoints;
    };

    self.setMaxWaypoints = function (data) {
        maxWaypoints = data;
    };

    self.getValidMission = function () {
        return isValidMission;
    };

    self.setValidMission = function (data) {
        isValidMission = data;
    };

    self.getCountBusyPoints = function () {
        return countBusyPoints;
    };

    self.setCountBusyPoints = function (data) {
        countBusyPoints = data;
    };

    self.getVersion = function () {
        return version;
    };

    self.setVersion = function (data) {
        version = data;
    };

    self.getCenter = function () {
        return center;
    };

    self.setCenter = function (data) {
        center = data;
    };

    self.setCenterZoom = function (data) {
        center.zoom = data;
    };

    self.setCenterLon = function (data) {
        center.lon = data;
    };

    self.setCenterLat = function (data) {
        center.lat = data;
    };

    self.put = function (element) {
        data.push(element);
    };

    self.get = function () {
        return data;
    };

    self.isEmpty = function () {
        return data.length == 0;
    };

    self.flush = function () {
        data = [];
    };

    self.reinit = function () {
        data = [];
        maxWaypoints = 120;
        isValidMission = 0;
        countBusyPoints = 0;
        version = 0;
        center = {};
    };

    self.getWaypoint = function(waypointId) {
        for (let waypointIndex in data) {
            if (data.hasOwnProperty(waypointIndex)) {
                let waypoint = data[waypointIndex];

                if (waypoint.getNumber() == waypointId ) {
                    return waypoint;
                }
            }
        }
    };

    self.updateWaypoint = function(newWaypoint) {
        if (newWaypoint.isUsed()) {
            data[newWaypoint.getNumber()] = newWaypoint;
        }
    };

    self.dropWaypoint = function(newWaypoint) {
        self.getWaypoint(newWaypoint.getNumber()).setUsed(false);
        let indexId = newWaypoint.getNumber()
        data.forEach(function (wp) {
            if (wp.getNumber() >= indexId) {
                wp.setNumber(wp.getNumber()-1);
            }
            if (wp.getAction() == MWNP.WPTYPE.JUMP && wp.getP1()>=indexId) {
                wp.setP1(wp.getP1()-1);
            }
        });
        data.splice(indexId, 1);

    };

    self.insertWaypoint = function (newWaypoint, indexId) {
        data.forEach(function (wp) {
            if (wp.getNumber() >= indexId) {
                wp.setNumber(wp.getNumber()+1);
            }
            if (wp.getAction() == MWNP.WPTYPE.JUMP && wp.getP1()>=indexId) {
                wp.setP1(wp.getP1()+1);
            }
        });
        data.splice(indexId, 0, newWaypoint);
    };


    self.drop = function (waypointId) {
        self.getWaypoint(waypointId).setUsed(false);
        var tmpData = [];
        let idx = 0;
        data.forEach(function (element) {
            if (element.isUsed()) {
                element.setNumber(idx)
                tmpData.push(element);
                idx++;
            }
        });

        data = tmpData;
    };

    self.update = function (updateEndFlag = true, bMWPfile=false, bReverse=false) {
        let oldWPNumber = 0;
        let optionIdx = 0;
        let idx = 0;
        data.forEach(function (element) {
            if (element.isUsed()) {
                if (bMWPfile && !bReverse) {
                    element.setNumber(element.getNumber()-1);
                    if (element.getAction() == MWNP.WPTYPE.JUMP) {
                        element.setP1(element.getP1()-1);
                    }
                }
                else if (bMWPfile && bReverse) {
                    element.setNumber(element.getNumber()+1);
                    if (element.getAction() == MWNP.WPTYPE.JUMP) {
                        element.setP1(element.getP1()+1);
                    }
                }

                if ([MWNP.WPTYPE.JUMP,MWNP.WPTYPE.SET_HEAD,MWNP.WPTYPE.RTH].includes(element.getAction())) {
                    element.setAttachedId(oldWPNumber);
                    element.setAttachedNumber(optionIdx);
                    element.setAttached(true);
                    optionIdx++;
                }
                else {
                    oldWPNumber = element.getNumber();
                    element.setLayerNumber(idx);
                    optionIdx = 0;
                    idx++;
                }

                /* only update EndMission flag when required and only if single mission loaded on map */
                if (updateEndFlag) {
                    if (element.getNumber() == self.get().length - 1) {
                        element.setEndMission(0xA5);
                    }
                    else if ((element.getNumber() == self.get().length - 2) && element.getEndMission() == 0xA5) {
                        element.setEndMission(0);
                    }
                }
            }
        });
    };

    self.getNonAttachedList = function () {
        let tmpData = [];
        data.forEach(function (element) {
            if (!element.isAttached()) {
                tmpData.push(element);
            }
        });

        return tmpData;
    }

    self.getAttachedList = function () {
        let tmpData = [];
        data.forEach(function (element) {
            if (element.isAttached()) {
                tmpData.push(element);
            }
        });

        return tmpData;
    }

    self.getAttachedFromWaypoint = function (waypoint) {
        let tmpData = [];
        data.forEach(function (element) {
            if (element.isAttached() && element.getAttachedId() == waypoint.getNumber()) {
                tmpData.push(element);
            }
        });

        return tmpData;
    }

    self.addAttachedFromWaypoint = function (waypoint) {
        let tmpNumber = 0;
        let tmpData = self.getAttachedFromWaypoint(waypoint);
        if (tmpData != 'undefined' && tmpData.length !=0) {
            tmpNumber = tmpData.length;
        }
        let tempWp = new Waypoint(waypoint.getNumber()+tmpNumber+1, MWNP.WPTYPE.JUMP, 0, 0);
        tempWp.setAttached(true);
        tempWp.setAttachedId(waypoint.getNumber());
        self.insertWaypoint(tempWp, waypoint.getNumber()+tmpNumber+1);
        self.update();
    }

    self.dropAttachedFromWaypoint = function (waypoint, waypointAttachedNumber) {
        data.forEach(function (element) {
            if (element.isAttached() && element.getAttachedId() == waypoint.getNumber() && element.getAttachedNumber() == waypointAttachedNumber) {
                self.dropWaypoint(element);
                self.update();
            }
        });

    }

    self.extractBuffer = function(waypointId) {
        let buffer = [];
        let waypoint = self.getWaypoint(waypointId);
        buffer.push(waypoint.getNumber());    // sbufReadU8(src);    // number
        buffer.push(waypoint.getAction());    // sbufReadU8(src);    // action
        buffer.push(BitHelper.specificByte(waypoint.getLat(), 0));    // sbufReadU32(src);      // lat
        buffer.push(BitHelper.specificByte(waypoint.getLat(), 1));
        buffer.push(BitHelper.specificByte(waypoint.getLat(), 2));
        buffer.push(BitHelper.specificByte(waypoint.getLat(), 3));
        buffer.push(BitHelper.specificByte(waypoint.getLon(), 0));    // sbufReadU32(src);      // lon
        buffer.push(BitHelper.specificByte(waypoint.getLon(), 1));
        buffer.push(BitHelper.specificByte(waypoint.getLon(), 2));
        buffer.push(BitHelper.specificByte(waypoint.getLon(), 3));
        buffer.push(BitHelper.specificByte(waypoint.getAlt(), 0));    // sbufReadU32(src);      // to set altitude (cm)
        buffer.push(BitHelper.specificByte(waypoint.getAlt(), 1));
        buffer.push(BitHelper.specificByte(waypoint.getAlt(), 2));
        buffer.push(BitHelper.specificByte(waypoint.getAlt(), 3));
        buffer.push(BitHelper.lowByte(waypoint.getP1())); //sbufReadU16(src);       // P1 speed or landing
        buffer.push(BitHelper.highByte(waypoint.getP1()));
        buffer.push(BitHelper.lowByte(waypoint.getP2())); //sbufReadU16(src);       // P2
        buffer.push(BitHelper.highByte(waypoint.getP2()));
        buffer.push(BitHelper.lowByte(waypoint.getP3())); //sbufReadU16(src);       // P3
        buffer.push(BitHelper.highByte(waypoint.getP3()));
        buffer.push(waypoint.getEndMission()); //sbufReadU8(src);      // future: to set nav flag

        return buffer;
    }

    self.missionDisplayDebug = function() {
        if (data && data.length != 0) {
            data.forEach(function (element) {
                console.log("N° : ", element.getNumber(),
                            "Action : ", element.getAction(),
                            "Lon : ", element.getLon(),
                            "Lat : ", element.getLat(),
                            "Alt : ", element.getAlt(),
                            "P1 : ", element.getP1(),
                            "P2 : ", element.getP2(),
                            "P3 : ", element.getP3(),
                            "EndMission : ", element.getEndMission());
            });
        }
    }

    self.copy = function(mission){
        mission.get().forEach(function (element) {
            self.put(element);
        });
        self.setMaxWaypoints(mission.getMaxWaypoints());
        self.setValidMission(mission.getValidMission());
        self.setCountBusyPoints(mission.getCountBusyPoints());
        self.setVersion(mission.getVersion());
        self.setCenter(mission.getCenter());
    }

    self.convertJumpNumberToWaypoint = function(jumpId) {
        let outputNumber = 0;
        self.getNonAttachedList().forEach(function (element) {
            if (element.getLayerNumber() == jumpId) {
                outputNumber = element.getNumber();
            }
        });
        return outputNumber;
    }

    self.isJumpTargetAttached = function(waypoint) {
        let lJumptTargetAttached = [];
        data.forEach(function (element) {
            if (element.getAction() == MWNP.WPTYPE.JUMP && element.getP1() == waypoint.getNumber()) {
                lJumptTargetAttached.push(element.getNumber());
            }
        });
        return (lJumptTargetAttached.length != 0 && lJumptTargetAttached != 'undefined')
    }

    self.getPoiList = function() {
        let poiList = [];
        data.forEach(function (element) {
            if (element.getAction() == MWNP.WPTYPE.SET_POI) {
                poiList.push(element.getNumber());
            }
        });
        return poiList;
    }

    self.getPoint2Measure = function(reverse=false) {
        let point2measure = [];
        let altPoint2measure = [];
        let namePoint2measure = [];
        let refPoint2measure = [];
        let jumpDict = {};
        let nStart = 0;
        let nLoop = 0;
        let n = 0 ;
        let startCount = true;
        while (startCount) {
            if (nStart > data[data.length -1].getNumber() ) {
                startCount = false;
                break;
            }

            if ([MWNP.WPTYPE.WAYPOINT,MWNP.WPTYPE.POSHOLD_TIME,MWNP.WPTYPE.LAND].includes(self.getWaypoint(nStart).getAction())) {
                if (reverse) {
                    point2measure.push([self.getWaypoint(nStart).getLatMap(), self.getWaypoint(nStart).getLonMap()]);
                }
                else {
                    point2measure.push(ol.proj.fromLonLat([self.getWaypoint(nStart).getLonMap(), self.getWaypoint(nStart).getLatMap()]));
                }
                altPoint2measure.push(self.getWaypoint(nStart).getAlt());
                namePoint2measure.push(self.getWaypoint(nStart).getLayerNumber()+1);
                let useAbsoluteAlt = (self.getWaypoint(nStart).getP3() & (1 << 0));
                refPoint2measure.push(useAbsoluteAlt);
                nStart++;
            }
            else if (self.getWaypoint(nStart).getAction() == MWNP.WPTYPE.JUMP) {
                if (!Object.keys(jumpDict).includes(String(self.getWaypoint(nStart).getNumber())) ) {
                    jumpDict[self.getWaypoint(nStart).getNumber()] = {nStart: self.getWaypoint(nStart).getP1(), nLoop : self.getWaypoint(nStart).getP2(), n : 0};
                }
                if (Object.keys(jumpDict).includes(String(self.getWaypoint(nStart).getNumber())) ) {
                    if (jumpDict[self.getWaypoint(nStart).getNumber()]["nLoop"] == -1) {
                        jumpDict[self.getWaypoint(nStart).getNumber()]["nLoop"] = 1;
                        nLoop = -1;
                    }
                    if ( (jumpDict[self.getWaypoint(nStart).getNumber()]["n"]>=jumpDict[self.getWaypoint(nStart).getNumber()]["nLoop"]  || jumpDict[self.getWaypoint(nStart).getNumber()]["nLoop"] ==0) ) {
                        jumpDict[self.getWaypoint(nStart).getNumber()]["n"] = 0;
                        nStart++;
                    }
                    else {
                        jumpDict[self.getWaypoint(nStart).getNumber()]["n"] = jumpDict[self.getWaypoint(nStart).getNumber()]["n"]+1;
                        let nStartTemp = jumpDict[self.getWaypoint(nStart).getNumber()]["nStart"];
                        nStart = nStartTemp;
                    }
                }
            }
            else {
                nStart++;
            }
        }

        return [nLoop, point2measure, altPoint2measure, namePoint2measure, refPoint2measure];
    }

    self.getDistance = function(display) {
        let lengthLine = [];
        const [nLoop, point2measure, altPoint2measure, namePoint2measure, refPoint2measure] = self.getPoint2Measure();
        if (nLoop == -1 && display) {
            return [-1];
        }
        else {

            const cumulativeSum = (sum => value => sum += value)(0);

            let oldCoord = [];
            point2measure.forEach(function (coord) {
                if (oldCoord != 'undefined' && oldCoord != []) {
                    lengthLine.push(ol.Sphere.getLength(new ol.geom.LineString([oldCoord, coord])));
                }
                oldCoord = coord;
            });
            //console.log("lengthLine ", lengthLine);
            return lengthLine.map(cumulativeSum);
        }
    }

    self.getElevation = async function(globalSettings) {
        const [nLoop, point2measure, altPoint2measure, namePoint2measure, refPoint2measure] = self.getPoint2Measure(true);
        let lengthMission = self.getDistance(true);
        let totalMissionDistance = lengthMission.length >= 1 ? lengthMission[lengthMission.length -1].toFixed(1) : 0;
        let samples;
        let sampleMaxNum;
        let sampleDistance;

        if (globalSettings.mapProviderType == 'bing') {
            sampleMaxNum = 1024;
            sampleDistance = 30;
        } else {    // use opentopodata.org instead
            sampleMaxNum = 99;
            sampleDistance = 60;
        }

        if (point2measure.length <= 2){
            samples = 1;
        }
        else if (Math.trunc(totalMissionDistance / sampleDistance) <= sampleMaxNum && point2measure.length > 2){
            samples = Math.trunc(totalMissionDistance / sampleDistance);
        }
        else {
            samples = sampleMaxNum;
        }

        let elevation = "N/A";
        if (globalSettings.mapProviderType == 'bing') {
            let elevationEarthModel = $('#elevationEarthModel').prop("checked") ? "ellipsoid" : "sealevel";

            if (point2measure.length >1) {
                const response = await fetch('http://dev.virtualearth.net/REST/v1/Elevation/Polyline?points='+point2measure+'&heights='+elevationEarthModel+'&samples='+String(samples+1)+'&key='+globalSettings.mapApiKey);
                const myJson = await response.json();
                elevation = myJson.resourceSets[0].resources[0].elevations;
            }
            else {
                const response = await fetch('http://dev.virtualearth.net/REST/v1/Elevation/List?points='+point2measure+'&heights='+elevationEarthModel+'&key='+globalSettings.mapApiKey);
                const myJson = await response.json();
                elevation = myJson.resourceSets[0].resources[0].elevations;
            }
        }
        else {
            let coordList = "";
            point2measure.forEach(function (item) {
                coordList += item + '|';
            });
            const response = await fetch('https://api.opentopodata.org/v1/aster30m?locations='+coordList+'&samples='+String(samples+1));
            const myJson = await response.json();

            if (myJson.status == "OK") {
                elevation = [];
                for (var i = 0; i < myJson.results.length; i++){
                    if (myJson.results[i].elevation == null) {
                        elevation[i] = 0;
                    } else {
                        elevation[i] = myJson.results[i].elevation;
                    }
                }
            }
        }
        //console.log("elevation ", elevation);
        return [lengthMission, totalMissionDistance, samples, elevation, altPoint2measure, namePoint2measure, refPoint2measure];
    }

    return self;
};

module.exports = WaypointCollection;

