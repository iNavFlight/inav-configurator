'use strict';
//import { MWNP.WPTYPE, MWNP.WPTYPE.REV } from '/js/mission_control_module.mjs';
//const { MWNP } = require('./js/mission_control_module.mjs')


let WaypointCollection = function () {

    let self = {},
        data = [],
        maxWaypoints = 0,
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
    
    self.isValidMission = function () {
        return maxWaypoints == 1;
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
        return data == [];
    };

    self.flush = function () {
        data = [];
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
    
    self.update = function (bMWPfile=false) {
        let oldWPNumber = 0;
        let optionIdx = 0;
        let idx = 0;
        data.forEach(function (element) {
            if (element.isUsed()) {
                if (bMWPfile) {
                    element.setNumber(element.getNumber()-1);
                    if (element.getAction() == MWNP.WPTYPE.JUMP) {
                        element.setP1(element.getP1()-1);
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
            }
        });
    };
    

    
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
        console.log("tmpNumber : ",tmpNumber);
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

    return self;
};