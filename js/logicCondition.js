'use strict';

const FC = require('./fc');
const { GUI } = require('./../js/gui');
const { LOGIC_OPERATORS } = require('./logicConditionOperators');
const { OPERAND_TYPES } = require('./logicConditionOperantTypes');

let LogicCondition = function (enabled, activatorId, operation, operandAType, operandAValue, operandBType, operandBValue, flags) {
    let self = {};
    let $row;

    self.getEnabled = function () {
        return !!enabled;
    };

    self.setEnabled = function (data) {
        enabled = !!data;
    };

    self.getActivatorId = function () {
        return activatorId;
    };

    self.setActivatorId = function (data) {
        activatorId = data;
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
        self.renderStatus();
        self.renderActivator();
    };

    self.getOperatorMetadata = function () {
        return LOGIC_OPERATORS[self.getOperation()];
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
        self.renderStatus();
    };

    self.onOperatorTypeChange = function (event) {
        let $cT = $(event.currentTarget),
            operand = $cT.data("operand"),
            $container = $cT.parent(),
            operandMetadata = OPERAND_TYPES[$cT.val()];

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
    }

    self.renderStatus = function () {
        let $e = $row.find('.logic_cell__status'),
            displayType = LOGIC_OPERATORS[self.getOperation()].output;
        
        if (self.getEnabled() && displayType == "boolean") {
            $e.html('<div class="logic_cell__active_marker"></div>');
        } else if (self.getEnabled() && displayType == "raw") {
            $e.html('<div class="logic_cell__raw_value"></div>');
        } else {
            $e.html('');
        }
    }

    self.update = function (index, value, $container) {
        if (typeof $row === 'undefined') {
            return;
        }

        let displayType = LOGIC_OPERATORS[self.getOperation()].output,
            $marker;
        
        if (self.getEnabled() && displayType == "boolean") {
            $marker = $row.find('.logic_cell__active_marker');

            if (!!value) {
                $marker.addClass("logic_cell__active_marker--active");
                $marker.removeClass("logic_cell__active_marker--inactive");
            } else {
                $marker.removeClass("logic_cell__active_marker--active");
                $marker.addClass("logic_cell__active_marker--inactive");
            }
        } else if (self.getEnabled() && displayType == "raw") {
            $marker = $row.find('.logic_cell__raw_value');
            $marker.html(value);
        }
    }

    self.onActivatorChange = function (event) {
        let $cT = $(event.currentTarget);

        self.setActivatorId($cT.val());
    }

    self.renderActivator = function () {
        let $e = $row.find(".logic_cell__activator");

        if (self.getEnabled()) {
            GUI.renderLogicConditionSelect(
                $e, 
                FC.LOGIC_CONDITIONS,
                self.getActivatorId, 
                self.onActivatorChange,
                true,
                true
            );
        } else {
            $e.html("");
        }
    }

    self.render = function (index, $container) {

        $container.find('tbody').append('<tr>\
                <td class="logic_cell__index"></td>\
                <td class="logic_cell__enabled"></td>\
                <td class="logic_cell__operation"></td>\
                <td class="logic_cell__operandA"></td>\
                <td class="logic_cell__operandB"></td>\
                <td class="logic_cell__activator"></div></td>\
                <td class="logic_cell__flags"></div></td>\
                <td class="logic_cell__status"></td>\
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
        
        let lcOperators = [];

        for (let lcID in LOGIC_OPERATORS) {
            if (LOGIC_OPERATORS.hasOwnProperty(lcID)) {
                let op = LOGIC_OPERATORS[lcID];
                lcOperators[parseInt(lcID, 10)] = {
                    id: parseInt(lcID, 10),
                    name: op.name,
                    operandType: op.operandType,
                    hasOperand: op.hasOperand,
                    output: op.output
                };
            }
        }

        lcOperators.sort((a, b) => {
            let lcAT = a.operandType.toLowerCase(),
                lcBT = b.operandType.toLowerCase(), 
                lcAN = a.name.toLowerCase(),
                lcBN = b.name.toLowerCase();
            
            if (lcAT == lcBT) {
                return (lcAN < lcBN) ? -1 : (lcAN > lcBN) ? 1 : 0;
            } else  {
                return (lcAT < lcBT) ? -1 : 1;
            }
        });

        let section = "";

        lcOperators.forEach( val => {
            if (section != val.operandType) {
                if (section != "") {
                    $t.append('</optgroup>');
                }

                section = val.operandType;
                $t.append('<optgroup label="** ' + val.operandType + ' **">');
            }

            if (self.getOperation() == val.id) {
                $t.append('<option value="' + val.id + '" selected>' + val.name + '</option>');
            } else {
                $t.append('<option value="' + val.id + '">' + val.name + '</option>');
            }
        });

        $t.append('</optgroup>');

        $t.on('change', self.onOperatorChange);

        self.renderOperand(0);
        self.renderOperand(1);
        self.renderStatus();
        self.renderActivator();
    }

    return self;
};

module.exports = LogicCondition;