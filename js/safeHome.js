/*global $*/
'use strict';

let Safehome = function (number, enabled, lat, lon) {

    var self = {};

    self.getNumber = function () {
        return number;
    };

    self.setNumber = function (data) {
        number = data;
    };

    self.getLon = function () {
        return lon;
    };

    self.setLon = function (data) {
        lon = data;
    };
    
    self.getLonToMap = function () {
        return lon / 1e7;
    };

    self.setLonFromMap = function (data) {
        lon = data * 1e7;
    };

    self.getLat = function () {
        return lat;
    };

    self.setLat = function (data) {
        lat = data;
    };
    
     self.getLatToMap = function () {
        return lat / 1e7;
    };

    self.setLatFromMap = function (data) {
        lat = data * 1e7;
    };

    self.isUsed = function () {
        return enabled == 1;
    };
    
    self.getEnabled = function () {
        return enabled;
    };
    
    self.setEnabled = function (data) {
        enabled = data;
    };
    
    self.cleanup = function () {
        number = 0;
        enabled = 0;
        lon = 0;
        lat = 0;
    };

    return self;
};