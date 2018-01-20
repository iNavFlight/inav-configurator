/*global $*/
'use strict';

var ServoMixRule = function (target, input, rate, speed) {

    var self = {};

    // self.target = target;
    // self.input = input;
    // self.rate = rate;
    // self.speed = speed;


    self.getTarget = function () {
        return target;
    };

    self.getInput = function () {
        return input;
    };

    self.getRate = function () {
        return rate;
    };

    self.getSpeed = function () {
        return speed;
    };

    return self;
};