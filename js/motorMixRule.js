/*global $,constrain*/
'use strict';

var MotorMixRule = function (throttle, roll, pitch, yaw) {

    var self = {};

    self.fromMsp = function (mspThrottle, mspRoll, mspPitch, mspYaw) {
        throttle = mspThrottle / 1000;
        roll = (mspRoll / 1000) - 2;
        pitch = (mspPitch / 1000) - 2;
        yaw = (mspYaw / 1000) - 2;
    };

    self.isUsed = function () {
        return throttle !== 0;
    };

    self.getThrottle = function () {
        return constrain(parseFloat(throttle, 10), 0, 1);
    };

    self.getThrottleForMsp = function () {
        return self.getThrottle() * 1000;
    };

    self.setThrottle = function (data) {
        throttle = data;
    };

    self.getRoll = function () {
        return constrain(parseFloat(roll, 10), -2, 2);
    };

    self.getRollForMsp = function () {
        return (self.getRoll() + 2) * 1000;
    };

    self.setRoll = function (data) {
        roll = data;
    };

    self.getPitch = function () {
        return constrain(parseFloat(pitch, 10), -2, 2);
    };

    self.getPitchForMsp = function () {
        return (self.getPitch() + 2) * 1000;
    };

    self.setPitch = function (data) {
        pitch = data;
    };

    self.getYaw = function () {
        return constrain(parseFloat(yaw, 10), -2, 2);
    };

    self.getYawForMsp = function () {
        return (self.getYaw() + 2) * 1000;
    };

    self.setYaw = function (data) {
        yaw = data;
    };

    return self;
};