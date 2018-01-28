/*global $,constrain*/
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
        return constrain(throttle, 0, 1);
    };

    self.getThrottleForMsp = function () {
        return self.getThrottle() * 1000;
    }

    self.setThrottle = function (data) {
        throttle = data;
    };

    self.getRoll = function () {
        return constrain(roll, -1, 1);
    };

    self.getRollForMsp = function () {
        return (self.getRoll() + 1) * 1000;
    };

    self.setRoll = function (data) {
        roll = data;
    };

    self.getPitch = function () {
        return constrain(pitch, -1, 1);
    };

    self.getPitchForMsp = function () {
        return (self.getPitch() + 1) * 1000;
    };

    self.setPitch = function (data) {
        pitch = data;
    };

    self.getYaw = function () {
        return constrain(yaw, -1, 1);
    };

    self.getYawForMsp = function () {
        return (self.getYaw() + 1) * 1000;
    };

    self.setYaw = function (data) {
        yaw = data;
    };

    return self;
};