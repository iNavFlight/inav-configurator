/*global $,FC*/
'use strict';

let ProgrammingPid = function (enabled, setpointType, setpointValue, measurementType, measurementValue, gainP, gainI, gainD, gainFF) {
    let self = {};

    self.getEnabled = function () {
        return !!enabled;
    };

    self.setEnabled = function (data) {
        enabled = !!data;
    };

    self.getSetpointType = function () {
        return setpointType;
    };

    self.setSetpointType = function (data) {
        setpointType = data;
    };

    self.getSetpointValue = function () {
        return setpointValue;
    };

    self.setSetpointValue = function (data) {
        setpointValue = data;
    };

    self.getMeasurementType = function () {
        return measurementType;
    };

    self.setMeasurementType = function (data) {
        measurementType = data;
    };

    self.getMeasurementValue = function () {
        return measurementValue;
    };

    self.setMeasurementValue = function (data) {
        measurementValue = data;
    };

    self.getGainP = function () {
        return gainP;
    };

    self.setGainP = function (data) {
        gainP = data;
    };

    self.getGainI = function () {
        return gainI;
    };

    self.setGainI = function (data) {
        gainI = data;
    };

    self.getGainD = function () {
        return gainD;
    };

    self.setGainD = function (data) {
        gainD = data;
    };

    self.getGainFF = function () {
        return gainFF;
    };

    self.setGainFF = function (data) {
        gainFF = data;
    };

    return self;
};