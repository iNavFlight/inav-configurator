/*global $*/
'use strict';

var ServoMixRule = function (target, input, rate, speed) {

    var self = {};

    self.getTarget = function () {
        return target;
    };

    self.setTarget = function (data) {
        target = data;
    };

    self.getInput = function () {
        return input;
    };

    self.setInput = function (data) {
        input = data;
    };

    self.getRate = function () {
        return rate;
    };

    self.setRate = function (data) {
        rate = data;
    };

    self.getSpeed = function () {
        return speed;
    };

    self.setSpeed = function (data) {
        speed = data;
    };

    self.isUsed = function () {
        return rate !== 0;
    };

    return self;
};