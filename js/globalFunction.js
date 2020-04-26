/*global $,FC*/
'use strict';

let GlobalFunction = function (enabled, conditionId, action, operandAType, operandAValue, operandBType, operandBValue, flags) {
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

    self.getOperandAType = function () {
        return operandAType;
    }

    self.setOperandAType = function (data) {
        operandAType = data;
    }

    self.getOperandAValue = function () {
        return operandAValue;
    }

    self.setOperandAValue = function (data) {
        operandAValue = data;
    }

    self.getOperandBType = function () {
        return operandBType;
    }

    self.setOperandBType = function (data) {
        operandBType = data;
    }

    self.getOperandBValue = function () {
        return operandBValue;
    }

    self.setOperandBValue = function (data) {
        operandBValue = data;
    }

    self.getFlags = function () {
        return flags;
    };

    self.setFlags = function (data) {
        flags = data;
    };

    self.onOperatorValueChange = function (event) {
        let $cT = $(event.currentTarget),
            operand = $cT.data("operand");

        if (operand == 0) {
            self.setOperandAValue($cT.val());
        } else {
            self.setOperandBValue($cT.val());
        }
    };

    self.onOperatorTypeChange = function (event) {
        let $cT = $(event.currentTarget),
            operand = $cT.data("operand"),
            $container = $cT.parent(),
            operandMetadata = FC.getOperandTypes()[$cT.val()];

        if (operand == 0) {
            self.setOperandAType($cT.val());
            self.setOperandAValue(operandMetadata.default);
        } else {
            self.setOperandBType($cT.val());
            self.setOperandBValue(operandMetadata.default);
        }

        GUI.renderOperandValue($container, operandMetadata, operand, operandMetadata.default, self.onOperatorValueChange);
    };

    self.onEnabledChange = function (event) {
        let $cT = $(event.currentTarget),
            $parent = $cT.closest('tr');
        self.setEnabled(!!$cT.prop('checked'));

        self.renderAction($parent);
        self.renderOperand($parent, 0);
        self.renderOperand($parent, 0);
        self.renderLogicId($parent);
    };

    self.onLogicIdChange = function(event) {
        let $cT = $(event.currentTarget);
        self.setConditionId($cT.val());
    };

    self.onActionChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setAction($cT.val());
        self.renderOperand($cT.closest('tr'), 0);
        self.renderOperand($cT.closest('tr'), 1);
    };

    self.hasOperand = function (operand) {
        if (!self.getEnabled()) {
            return false;
        }
        return FC.getFunctionActions()[self.getAction()].hasOperand[operand];
    };

    self.renderOperand = function ($row, operand) {
        let type, value, $container;
        if (operand == 0) {
            type = operandAType;
            value = operandAValue;
            $container = $row.find('.function_cell__operandA');
        } else {
            type = operandBType;
            value = operandBValue;
            $container = $row.find('.function_cell__operandB');
        }

        $container.html('');
        if (self.hasOperand(operand)) {
            
            $container.append('<select class="logic_element__operand--type" data-operand="' + operand + '"></select>');
            let $t = $container.find('.logic_element__operand--type');

            for (let k in FC.getOperandTypes()) {
                if (FC.getOperandTypes().hasOwnProperty(k)) {
                    let op = FC.getOperandTypes()[k];
                    
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
            $t.change(self.onOperatorTypeChange);

        } else {
            if (operand == 0) {
                self.setOperandAType(0);
                self.setOperandAValue(FC.getOperandTypes()[0].default);
            } else {
                self.setOperandBType(0);
                self.setOperandBValue(FC.getOperandTypes()[0].default);
            }
        }
    }

    self.renderAction = function ($row) {

        if (self.getEnabled()) {

            $row.find('.function_cell__action').html("<select class='function__action' ></select>");
            let $t = $row.find(".function__action");

            for (let k in FC.getFunctionActions()) {
                if (FC.getFunctionActions().hasOwnProperty(k)) {
                    let o = FC.getFunctionActions()[k];
                    if (self.getAction() == parseInt(k, 10)) {
                        $t.append('<option value="' + k + '" selected>' + o.name + '</option>');
                    } else {
                        $t.append('<option value="' + k + '">' + o.name + '</option>');
                    }
                }
            }
            $t.change(self.onActionChange);
        } else {
            $row.find('.function_cell__action').html("");
        }
    };

    self.renderLogicId = function($row) {
        
        if (self.getEnabled()) {
            GUI.renderLogicConditionSelect(
                $row.find('.function_cell__logicId'), 
                LOGIC_CONDITIONS, 
                self.getConditionId(), 
                self.onLogicIdChange,
                true
            );
        } else {
            $row.find('.function_cell__logicId').html("");
        }
    }

    self.render = function (index, $container) {

        $container.find('tbody').append('<tr>\
                <td class="function_cell__index"></td>\
                <td class="function_cell__enabled"></td>\
                <td class="function_cell__logicId"></td>\
                <td class="function_cell__action"></td>\
                <td class="function_cell__operandA"></td>\
                <td class="function_cell__operandB"></td>\
                <td class="function_cell__flags"></td>\
                <td class="function_cell__status"><div class="logic_cell__active_marker"></div></td>\
            </tr>\
        ');

        $row = $container.find('tr:last');

        $row.find('.function_cell__index').html(index);
        $row.find('.function_cell__enabled').html("<input type='checkbox' class='toggle function_element__enabled' />");
        $row.find('.function_element__enabled').
            prop('checked', self.getEnabled()).
            change(self.onEnabledChange);
        self.renderLogicId($row);
        self.renderAction($row);
        self.renderOperand($row, 0);
        self.renderOperand($row, 1);
    }

    
    return self;
}