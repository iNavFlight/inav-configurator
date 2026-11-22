'use strict';

let Roi = function (flag = 0, action = 0, lat = 0, lon = 0, alt = 0, p1 = 0, p2 = 0, alt_datum = 0) {

    var self = {};

    self.getFlag = function () {
        return flag;
    };

    self.setFlag = function (data) {
        flag = data;
    };

    self.getAction = function () {
        return action;
    };

    self.setAction = function (data) {
        action = data;
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

    self.getLon = function () {
        return lon;
    };

    self.getLonMap = function () {
        return lon / 10000000;
    };

    self.setLon = function (data) {
        lon = data;
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

    self.getAltDatum = function () {
        return alt_datum;
    };

    self.setAltDatum = function (data) {
        alt_datum = data;
    };

    self.cleanup = function () {
        flag = 0;
        action = 0;
        lat = 0;
        lon = 0;
        alt = 0;
        p1 = 0;
        p2 = 0;
        alt_datum = 0;
    };

    return self;
};

export default Roi;
