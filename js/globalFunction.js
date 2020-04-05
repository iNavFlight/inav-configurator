/*global $,FC*/
'use strict';

let GlobalFunction = function (enabled, conditionId, action, operandType, operandValue, flags) {
    let self = {};
    let $row;

    self.getEnabled = function () {
        return !!enabled;
    }

    self.setEnabled = function (data) {
        enabled = !!data;
    }

    self.getConditionId = function () {
        return conditionId;
    }

    self.setConditionId = function (data) {
        conditionId = data;
    }

    self.getAction = function () {
        return action;
    }

    self.setAction = function (data) {
        action = data;
    }

    self.getOperandType = function () {
        return operandType;
    }

    self.setOperandType = function (data) {
        operandType = data;
    }

    self.getOperandValue = function () {
        return operandValue;
    }

    self.setOperandValue = function (data) {
        operandValue = data;
    }

    self.getFlags = function () {
        return flags;
    };

    self.setFlags = function (data) {
        flags = data;
    };

    return self;
}