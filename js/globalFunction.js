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

    self.onOperatorValueChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setOperandValue($cT.val());
    };

    self.onOperatorTypeChange = function (event) {
        let $cT = $(event.currentTarget),
            operand = $cT.data("operand"),
            $container = $cT.parent(),
            operandMetadata = FC.getOperandTypes()[$cT.val()];

        self.setOperandType($cT.val());
        self.setOperandValue(operandMetadata.default);

        GUI.renderOperandValue($container, operandMetadata, operand, operandMetadata.default, self.onOperatorValueChange);
    };

    self.onEnabledChange = function (event) {
        let $cT = $(event.currentTarget),
            $parent = $cT.closest('tr');
        self.setEnabled(!!$cT.prop('checked'));

        self.renderAction($parent);
        self.renderOperand($parent);
        self.renderLogicId($parent);
    };

    self.onLogicIdChange = function(event) {
        let $cT = $(event.currentTarget);
        self.setConditionId($cT.val());
    };

    self.onActionChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setAction($cT.val());
        self.renderOperand($cT.closest('tr'));
    };

    self.hasOperand = function () {

        let actions = FC.getFunctionActions();

        if (!self.getEnabled()) {
            return false;
        }

        return actions[self.getAction()].hasOperand;
    };

    self.renderOperand = function ($row) {
        let $container;
        
        $container = $row.find('.function_cell__operand');

        $container.html('');
        if (self.hasOperand()) {
            
            $container.append('<select class="logic_element__operand--type" data-operand="0"></select>');
            let $t = $container.find('.logic_element__operand--type');

            for (let k in FC.getOperandTypes()) {
                if (FC.getOperandTypes().hasOwnProperty(k)) {
                    let op = FC.getOperandTypes()[k];
                    
                    if (operandType == k) {
                        $t.append('<option value="' + k + '" selected>' + op.name + '</option>');

                        /* 
                         * Render value element depending on type
                         */
                        GUI.renderOperandValue($container, op, 0, operandValue, self.onOperatorValueChange);

                    } else {
                        $t.append('<option value="' + k + '">' + op.name + '</option>');
                    }
                }
            }

            /*
             * Bind events
             */
            $t.change(self.onOperatorTypeChange);

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
                <td class="function_cell__operand"></td>\
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
        self.renderOperand($row);
    }

    
    return self;
}