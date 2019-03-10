'use strict';

let LogicCondition = function (enabled, operation, operandAType, operandAValue, operandBType, operandBValue, flags) {
    let self = {};

    self.getEnabled = function () {
        return !!enabled;
    };

    self.setEnabled = function (data) {
        enabled = !!data;
    };

    self.getOperation = function () {
        return operation;
    };

    self.setOperation = function (data) {
        operation = data;
    };

    self.getOperandAType = function () {
        return operandAType;
    };

    self.setOperandAType = function (data) {
        operandAType = data;
    };

    self.getOperandAValue = function () {
        return operandAValue;
    };

    self.setOperandAValue = function (data) {
        operandAValue = data;
    };

    self.getOperandBType = function () {
        return operandBType;
    };

    self.setOperandBType = function (data) {
        operandBType = data;
    };

    self.getOperandBValue = function () {
        return operandBValue;
    };

    self.setOperandBValue = function (data) {
        operandBValue = data;
    };

    self.getFlags = function () {
        return flags;
    };

    self.setFlags = function (data) {
        flags = data;
    };


    self.render = function ($container) {

        $container.find('tbody').append('<tr>\
                <td class="logic_cell__index"></td>\
                <td class="logic_cell__enabled"></td>\
                <td class="logic_cell__operation"></td>\
                <td class="logic_cell__operandA"></td>\
                <td class="logic_cell__operandB"></td>\
                <td class="logic_cell__flags"></td>\
            </tr>\
        ');

    }

    return self;
};