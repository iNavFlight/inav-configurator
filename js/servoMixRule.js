/*global $*/
'use strict';

var ServoMixRule = function (target, input, rate, speed, condition, operandA, operandB) {

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

    self.getCondition = function () {
        return (condition == undefined) ? 0 : condition;
    };

    self.setCondition = function (data) {
        condition = data;
    };

    self.getOperandA = function () {
        return (operandA == undefined) ? 0 : operandA;
    };

    self.setOperandA = function (data) {
        operandA = data;
    };

    self.getOperandB = function () {
        return (operandB == undefined) ? 0 : operandB;
    };

    self.setOperandB = function (data) {
        operandB = data;
    };

    return self;
};