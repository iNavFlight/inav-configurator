'use strict';

const  { constrain } = require('./helpers')

var MotorMixRule = function (throttle, roll, pitch, yaw) {

    var self = {};

    self.fromMsp = function (mspThrottle, mspRoll, mspPitch, mspYaw) {
        throttle = Math.round(((mspThrottle / 1000) - 2) * 1000) / 1000;
        roll = Math.round(((mspRoll / 1000) - 2) * 1000) / 1000;
        pitch = Math.round(((mspPitch / 1000) - 2) * 1000) / 1000;
        yaw = Math.round(((mspYaw / 1000) - 2) * 1000) / 1000;
    };

    self.isUsed = function () {
        return throttle !== 0;
    };

    self.getThrottle = function () {
        return constrain(parseFloat(throttle, 10), -2, 2);
    };

    self.getThrottleForMsp = function () {
        return (self.getThrottle()+2) * 1000;
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

module.exports = MotorMixRule;
