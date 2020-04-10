/*global $,FC*/
'use strict';

let LogicCondition = function (enabled, operation, operandAType, operandAValue, operandBType, operandBValue, flags) {
    let self = {};
    let $row;

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

    self.onEnabledChange = function (event) {
        let $cT = $(event.currentTarget);
        self.setEnabled(!!$cT.prop('checked'));
    };

    self.getOperatorMetadata = function () {
        return FC.getLogicOperators()[self.getOperation()];
    };

    self.hasOperand = function (val) {
        return self.getOperatorMetadata().hasOperand[val];
    };

    self.onOperatorChange = function (event) {
        let $cT = $(event.currentTarget);

        self.setOperation($cT.val());
        self.setOperandAType(0);
        self.setOperandBType(0);
        self.setOperandAValue(0);
        self.setOperandBValue(0);
        self.renderOperand(0);
        self.renderOperand(1);
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

    self.onOperatorValueChange = function (event) {
        let $cT = $(event.currentTarget),
            operand = $cT.data("operand");

        if (operand == 0) {
            self.setOperandAValue($cT.val());
        } else {
            self.setOperandBValue($cT.val());
        }
    };

    self.renderOperand = function (operand) {
        let type, value, $container;
        if (operand == 0) {
            type = operandAType;
            value = operandAValue;
            $container = $row.find('.logic_cell__operandA');
        } else {
            type = operandBType;
            value = operandBValue;
            $container = $row.find('.logic_cell__operandB');
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

        }
    }

    self.update = function (index, value, $container) {
        if (typeof $row === 'undefined') {
            return;
        }
        
        let $marker = $row.find('.logic_cell__active_marker');

        if (!!value) {
            $marker.addClass("logic_cell__active_marker--active");
            $marker.removeClass("logic_cell__active_marker--inactive");
        } else {
            $marker.removeClass("logic_cell__active_marker--active");
            $marker.addClass("logic_cell__active_marker--inactive");
        }
    }

    self.render = function (index, $container) {

        $container.find('tbody').append('<tr>\
                <td class="logic_cell__index"></td>\
                <td class="logic_cell__enabled"></td>\
                <td class="logic_cell__operation"></td>\
                <td class="logic_cell__operandA"></td>\
                <td class="logic_cell__operandB"></td>\
                <td class="logic_cell__flags"><div class="logic_cell__active_marker"></div></td>\
            </tr>\
        ');

        $row = $container.find('tr:last');

        $row.find('.logic_cell__index').html(index);
        $row.find('.logic_cell__enabled').html("<input type='checkbox' class='toggle logic_element__enabled' />");
        $row.find('.logic_element__enabled').
            prop('checked', self.getEnabled()).
            change(self.onEnabledChange);

        /*
         * Operator select
         */
        $row.find('.logic_cell__operation').html("<select class='logic_element__operation' ></select>");
        let $t = $row.find('.logic_element__operation');
        
        for (let k in FC.getLogicOperators()) {
            if (FC.getLogicOperators().hasOwnProperty(k)) {
                let o = FC.getLogicOperators()[k];
                if (self.getOperation() == parseInt(k, 10)) {
                    $t.append('<option value="' + k + '" selected>' + o.name + '</option>');
                } else {
                    $t.append('<option value="' + k + '">' + o.name + '</option>');
                }
            }
        }
        $t.change(self.onOperatorChange);

        self.renderOperand(0);
        self.renderOperand(1);
    }

    return self;
};