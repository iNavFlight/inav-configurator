'use strict';

import elevationFetch from './elevationFetch';

const ApproachDirection = Object.freeze({
    LEFT: 0,
    RIGHT: 1,
})

let FwApproach = function (number, approachAltAsl = 0, landAltAsl = 0, approachDirection = 0, landHeading1 = 0, landHeading2 = 0, isSeaLevelRef = 0, elevation = 0) {

    var self = {};
    // landing along heading 1, its reverse, heading 2, its reverse: where the runway starts before the site [m]
    // (0: the common touchdown point) and the height the final crosses it at [dm]
    let runwayStarts = [0, 0, 0, 0];
    let runwayStartHeights = [0, 0, 0, 0];
    // the firmware sent them (INAV 11): an older one has no runway start
    let runwayKnown = false;

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

    self.getRunwayKnown = function () {
        return runwayKnown;
    }

    self.setRunwayKnown = function (data) {
        runwayKnown = data;
    }

    self.getRunwayStart = function (index) {
        return runwayStarts[index];
    }

    self.setRunwayStart = function (index, data) {
        runwayStarts[index] = data;
    }

    self.getRunwayStartHeight = function (index) {
        return runwayStartHeights[index];
    }

    self.setRunwayStartHeight = function (index, data) {
        runwayStartHeights[index] = data;
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
        runwayStarts = [0, 0, 0, 0];
        runwayStartHeights = [0, 0, 0, 0];
    };

    self.getElevationFromServer = async function (lon, lat, globalSettings) {
        let elevation = "N/A";
        try {
            const response = await elevationFetch('https://api.opentopodata.org/v1/aster30m?locations='+lat+','+lon);
            const myJson = await response.json();
            if (myJson.status == "OK" && myJson.results[0].elevation != null) {
                elevation = myJson.results[0].elevation;
            }
        } catch (error) {
            console.log('Elevation lookup failed: ' + error.message);
        }
        return elevation;
    }

    return self;
};

export { ApproachDirection, FwApproach };
