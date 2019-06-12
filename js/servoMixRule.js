/*global $*/
'use strict';

let ServoMixRule = function (target, input, rate, speed, fixedValue, condition) {

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

    self.getFixedValue = function () {
        return (fixedValue === undefined) ? 1500 : fixedValue;
    };

    self.setSpeed = function (data) {
        speed = data;
    };

    self.setFixedValue = function (data) {
        fixedValue = data;
    };

    self.isUsed = function () {
        return rate !== 0;
    };

    self.getConditionId = function () {
        return (condition == undefined) ? -1 : condition;
    };

    self.setConditionId = function (data) {
        condition = data;
    };

    return self;
};