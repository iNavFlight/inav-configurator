'use strict';

let WaypointCollection = function () {

    let self = {},
        data = [],
        maxWaypoints = 0,
        isValidMission = 0,
        countBusyPoints = 0
        
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

    self.put = function (element) {
        data.push(element);
    };

    self.get = function () {
        return data;
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

    return self;
};