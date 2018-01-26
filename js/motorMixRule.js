/*global $*/
'use strict';

var MotorMixRule = function (throttle, roll, pitch, yaw) {

    var self = {};

    self.fromMsp = function (mspThrottle, mspRoll, mspPitch, mspYaw) {
        throttle = mspThrottle / 1000;
        roll = (mspRoll / 1000) - 1;
        pitch = (mspPitch / 1000) - 1;
        yaw = (mspYaw / 1000) - 1;
    };

    self.isUsed = function () {
        return throttle !== 0;
    };

    self.getThrottle = function () {
        return throttle;
    };

    self.setThrottle = function (data) {
        throttle = data;
    };

    self.getRoll = function () {
        return roll;
    };

    self.setRoll = function (data) {
        roll = data;
    };

    self.getPitch = function () {
        return pitch;
    };

    self.setPitch = function (data) {
        pitch = data;
    };

    self.getYaw = function () {
        return yaw;
    };

    self.setYaw = function (data) {
        yaw = data;
    };

    return self;
};