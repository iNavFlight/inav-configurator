'use strict';

let Waypoint = function (number, action, lat, lon, alt=0, p1=0, p2=0, p3=0, endMission=0, isUsed=true, isAttached=false, attachedId="", multiMissionIdx = 0) {

    var self = {};
    let layerNumber = "undefined";
    let attachedNumber = "undefined";
    let poiNumber = "undefined";

    self.getNumber = function () {
        return number;
    };

    self.setNumber = function (data) {
        number = data;
    };

    self.getLayerNumber = function () {
        return layerNumber;
    };

    self.setLayerNumber = function (data) {
        layerNumber = data;
    };

    self.getPoiNumber = function () {
        return poiNumber;
    };

    self.setPoiNumber = function (data) {
        poiNumber = data;
    };

    self.isUsed = function () {
        return isUsed;
    };

    self.setUsed = function (data) {
        isUsed = data;
    };

    self.isAttached = function () {
        return isAttached;
    };

    self.setAttached = function (data) {
        isAttached = data;
    };

    self.getLon = function () {
        return lon;
    };

    self.getLonMap = function () {
        return lon / 10000000;
    };

    self.setLon = function (data) {
        lon = data;
    };

    self.getLat = function () {
        return lat;
    };

    self.getLatMap = function () {
        return lat / 10000000;
    };

    self.setLat = function (data) {
        lat = data;
    };

    self.getAction = function () {
        return action;
    };

    self.setAction = function (data) {
        action = data;
    };

    self.getAlt = function () {
        return alt;
    };

    self.setAlt = function (data) {
        alt = data;
    };

    self.getP1 = function () {
        return p1;
    };

    self.setP1 = function (data) {
        p1 = data;
    };

    self.getP2 = function () {
        return p2;
    };

    self.setP2 = function (data) {
        p2 = data;
    };

    self.getP3 = function () {
        return p3;
    };

    self.setP3 = function (data) {
        p3 = data;
    };

    self.getEndMission = function () {
        return endMission;
    };

    self.setEndMission = function (data) {
        endMission = data;
    };

    self.getAttachedId = function () {
        return attachedId;
    };

    self.setAttachedId = function (data) {
        attachedId = data;
    };

    self.getAttachedNumber = function () {
        return attachedNumber;
    };

    self.setAttachedNumber = function (data) {
        attachedNumber = data;
    };

    self.setMultiMissionIdx = function(data) {
        multiMissionIdx = data;
    }

    self.getMultiMissionIdx = function() {
        return multiMissionIdx;
    }

    self.getElevation = async function (globalSettings) {
        let elevation = "N/A";
        if (globalSettings.mapProviderType == 'bing') {
            let elevationEarthModel = $('#elevationEarthModel').prop("checked") ? "ellipsoid" : "sealevel";

            const response = await fetch('http://dev.virtualearth.net/REST/v1/Elevation/List?points='+self.getLatMap()+','+self.getLonMap()+'&heights='+elevationEarthModel+'&key='+globalSettings.mapApiKey);
            const myJson = await response.json();
            elevation = myJson.resourceSets[0].resources[0].elevations[0];
        }
        else {
            const response = await fetch('https://api.opentopodata.org/v1/aster30m?locations='+self.getLatMap()+','+self.getLonMap());
            const myJson = await response.json();
            if (myJson.status == "OK" && myJson.results[0].elevation != null) {
                elevation = myJson.results[0].elevation;
            }
        }
        return elevation;
    }

    return self;
};

module.exports = Waypoint;
