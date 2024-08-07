'use strict';

const FC = require('./fc');
const { GUI } = require('./gui');
const { OPERAND_TYPES } = require('./logicConditionOperantTypes');

let ProgrammingPid = function (enabled, setpointType, setpointValue, measurementType, measurementValue, gainP, gainI, gainD, gainFF) {
    let self = {};
    let $row;

    self.getEnabled = function () {
        return !!enabled;
    };

    self.setEnabled = function (data) {
        enabled = !!data;
    };

    self.getSetpointType = function () {
        return setpointType;
    };

    self.setSetpointType = function (data) {
        setpointType = data;
    };

    self.getSetpointValue = function () {
        return setpointValue;
    };

    self.setSetpointValue = function (data) {
        setpointValue = data;
    };

    self.getMeasurementType = function () {
        return measurementType;
    };

    self.setMeasurementType = function (data) {
        measurementType = data;
    };

    self.getMeasurementValue = function () {
        return measurementValue;
    };

    self.setMeasurementValue = function (data) {
        measurementValue = data;
    };

    self.getGainP = function () {
        return gainP;
    };

    self.setGainP = function (data) {
        gainP = data;
    };

    self.getGainI = function () {
        return gainI;
    };

    self.setGainI = function (data) {
        gainI = data;
    };

    self.getGainD = function () {
        return gainD;
    };

    self.setGainD = function (data) {
        gainD = data;
    };

    self.getGainFF = function () {
        return gainFF;
    };

    self.setGainFF = function (data) {
        gainFF = data;
    };

    self.onEnabledChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setEnabled(!!$cT.prop('checked'));
    };

    self.onGainPChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setGainP($cT.val());
    };

    self.onGainIChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setGainI($cT.val());
    };

    self.onGainDChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setGainD($cT.val());
    };

    self.onGainFFChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setGainFF($cT.val());
    };

    self.onOperatorValueChange = function (event) {
        let $cT = $(event.currentTarget),
            operand = $cT.data("operand");

        if (operand == 0) {
            self.setSetpointValue($cT.val());
        } else {
            self.setMeasurementValue($cT.val());
        }
    };

    self.render = function (index, $container) {

        $container.find('tbody').append('<tr>\
                <td class="pid_cell__index"></td>\
                <td class="pid_cell__enabled"></td>\
                <td class="pid_cell__setpoint"></td>\
                <td class="pid_cell__measurement"></td>\
                <td class="pid_cell__p"></td>\
                <td class="pid_cell__i"></td>\
                <td class="pid_cell__d"></td>\
                <td class="pid_cell__ff"></td>\
                <td class="pid_cell__output"></td>\
            </tr>\
        ');

        $row = $container.find('tr:last');

        $row.find('.pid_cell__index').html(index);
        $row.find('.pid_cell__enabled').html("<input type='checkbox' class='toggle logic_element__enabled' />");
        $row.find('.logic_element__enabled').
            prop('checked', self.getEnabled()).
            change(self.onEnabledChange);

        self.renderOperand(0);
        self.renderOperand(1);

        $row.find(".pid_cell__p").html('<input type="number" class="pid_cell__p-gain" step="1" min="0" max="32767" value="0">');
        $row.find(".pid_cell__p-gain").val(self.getGainP()).on('change', self.onGainPChange);

        $row.find(".pid_cell__i").html('<input type="number" class="pid_cell__i-gain" step="1" min="0" max="32767" value="0">');
        $row.find(".pid_cell__i-gain").val(self.getGainI()).on('change', self.onGainIChange);

        $row.find(".pid_cell__d").html('<input type="number" class="pid_cell__d-gain" step="1" min="0" max="32767" value="0">');
        $row.find(".pid_cell__d-gain").val(self.getGainD()).on('change', self.onGainDChange);

        $row.find(".pid_cell__ff").html('<input type="number" class="pid_cell__ff-gain" step="1" min="0" max="32767" value="0">');
        $row.find(".pid_cell__ff-gain").val(self.getGainFF()).on('change', self.onGainFFChange);

    }

    self.onOperatorTypeChange = function (event) {
        let $cT = $(event.currentTarget),
            operand = $cT.data("operand"),
            $container = $cT.parent(),
            operandMetadata = OPERAND_TYPES[$cT.val()];

        if (operand == 0) {
            self.setSetpointType($cT.val());
            self.setSetpointValue(operandMetadata.default);
        } else {
            self.setMeasurementType($cT.val());
            self.setMeasurementValue(operandMetadata.default);
        }

        GUI.renderOperandValue($container, operandMetadata, operand, operandMetadata.default, self.onOperatorValueChange);
    };

    self.renderOperand = function (operand) {
        let type, value, $container;
        if (operand == 0) {
            type = setpointType;
            value = setpointValue;
            $container = $row.find('.pid_cell__setpoint');
        } else {
            type = measurementType;
            value = measurementValue;
            $container = $row.find('.pid_cell__measurement');
        }

        $container.html('');
            
        $container.append('<select class="logic_element__operand--type" data-operand="' + operand + '"></select>');
        let $t = $container.find('.logic_element__operand--type');

        for (let k in OPERAND_TYPES) {
            if (OPERAND_TYPES.hasOwnProperty(k)) {
                let op = OPERAND_TYPES[k];
                
                if (type == k) {
                    $t.append('<option value="' + k + '" selected>' + op.name + '</option>');

                    /* 
                    * Render value element depending on type
                    */
                    GUI.renderOperandValue($container, op, operand, value, self.onOperatorValueChange);

                } else {
                    $t.append('<option value="' + k + '">' + op.name + '</option>');
                }
            }
        }

        /*
        * Bind events
        */
        $t.on('change', self.onOperatorTypeChange);

    }

    self.update = function (index, value, $container) {
        if (typeof $row === 'undefined') {
            return;
        }

        $row.find('.pid_cell__output').html(value);
    }

    return self;
};

module.exports = ProgrammingPid;
