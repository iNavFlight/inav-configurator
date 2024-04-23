'use strict';

const ApproachDirection = Object.freeze({
    LEFT: 0,
    RIGHT: 1,
})

let FwApproach = function (number, approachAltAsl = 0, landAltAsl = 0, approachDirection = 0, landHeading1 = 0, landHeading2 = 0, isSeaLevelRef = 0, elevation = 0) {

    var self = {};

    self.getNumber = function () {
        return number;
    };

    self.setNumber = function (data) {
        number = data;
    };

    self.getApproachAltAsl = function () {
        return approachAltAsl;
    }

    self.setApproachAltAsl = function (data) {
        approachAltAsl = data;
    }

    self.getLandAltAsl = function () {
        return landAltAsl;
    }

    self.setLandAltAsl = function (data) {
        landAltAsl = data;
    }

    self.getApproachDirection = function () {
        return approachDirection;
    }

    self.setApproachDirection = function (data) {
        approachDirection = data;
    }

    self.getLandHeading1 = function () {
        return landHeading1;
    }

    self.setLandHeading1 = function (data) {
        landHeading1 = data;
    }

    self.getLandHeading2 = function () {
        return landHeading2;
    }

    self.setLandHeading2 = function (data) {
        landHeading2 = data;
    }

    self.getIsSeaLevelRef = function () {
        return isSeaLevelRef;
    }

    self.setIsSeaLevelRef = function (data) {
        isSeaLevelRef = data;
    }

    self.getElevation = function() {
        return elevation;
    }

    self.setElevation = function (data) {
        elevation = data;
    }

    self.cleanup = function () {
        approachAltAsl = 0;
        landAltAsl = 0;
        approachDirection = 0;
        landHeading1 = 0;
        landHeading2 = 0;
        isSeaLevelRef = 0;
        elevation = 0
    };

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
};

module.exports = { ApproachDirection, FwApproach };
