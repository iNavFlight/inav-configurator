'use strict';

const LOGIC_OPERATORS = {
    0: {
        name: "True",
        operandType: "Active",
        hasOperand: [false, false],
        output: "boolean"
    },
    1: {
        name: "Equal (A = B)",
        operandType: "Comparison",
        hasOperand: [true, true],
        output: "boolean"
    },
    2: {
        name: "Greater Than (A > B)",
        operandType: "Comparison",
        hasOperand: [true, true],
        output: "boolean"
    },
    3: {
        name: "Lower Than (A < B)",
        operandType: "Comparison",
        hasOperand: [true, true],
        output: "boolean"
    },
    4: {
        name: "Low",
        operandType: "RC Switch Check",
        hasOperand: [true, false],
        output: "boolean"
    },
    5: {
        name: "Mid",
        operandType: "RC Switch Check",
        hasOperand: [true, false],
        output: "boolean"
    },
    6: {
        name: "High",
        operandType: "RC Switch Check",
        hasOperand: [true, false],
        output: "boolean"
    },
    7: {
        name: "AND",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    8: {
        name: "OR",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    9: {
        name: "XOR",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    10: {
        name: "NAND",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    11: {
        name: "NOR",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    12: {
        name: "NOT",
        operandType: "Logic Switches",
        hasOperand: [true, false],
        output: "boolean"
    },
    13: {
        name: "Sticky",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    14: {
        name: "Basic: Add",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    15: {
        name: "Basic: Subtract",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    16: {
        name: "Basic: Multiply",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    17: {
        name: "Basic: Divide",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    40: {
        name: "Modulo",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    18: {
        name: "Set GVAR",
        operandType: "Variables",
        hasOperand: [true, true],
        output: "none"
    },
    19: {
        name: "Increase GVAR",
        operandType: "Variables",
        hasOperand: [true, true],
        output: "none"
    },
    20: {
        name: "Decrease GVAR",
        operandType: "Variables",
        hasOperand: [true, true],
        output: "none"
    },
    21: {
        name: "Set IO Port",
        operandType: "Set Flight Parameter",
        hasOperand: [true, true],
        output: "none"
    },
    22: {
        name: "Override Arming Safety",
        operandType: "Set Flight Parameter",
        hasOperand: [false, false],
        output: "boolean"
    },
    23: {
        name: "Override Throttle Scale",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    29: {
        name: "Override Throttle",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    24: {
        name: "Swap Roll & Yaw",
        operandType: "Set Flight Parameter",
        hasOperand: [false, false],
        output: "boolean"
    },
    25: {
        name: "Set VTx Power Level",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    30: {
        name: "Set VTx Band",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    31: {
        name: "Set VTx Channel",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    26: {
        name: "Invert Roll",
        operandType: "Set Flight Parameter",
        hasOperand: [false, false],
        output: "boolean"
    },
    27: {
        name: "Invert Pitch",
        operandType: "Set Flight Parameter",
        hasOperand: [false, false],
        output: "boolean"
    },
    28: {
        name: "Invert Yaw",
        operandType: "Set Flight Parameter",
        hasOperand: [false, false],
        output: "boolean"
    },
    32: {
        name: "Set OSD Layout",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    33: {
        name: "Trigonometry: Sine",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    34: {
        name: "Trigonometry: Cosine",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    35: {
        name: "Trigonometry: Tangent",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    36: {
        name: "Map Input",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    37: {
        name: "Map Output",
        operandType: "Maths",
        hasOperand: [true, true],
        output: "raw"
    },
    38: {
        name: "Override RC Channel",
        operandType: "Set Flight Parameter",
        hasOperand: [true, true],
        output: "boolean"
    },

    39: {
        name: "Set Heading Target",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "raw"
    },

    41: {
        name: "Override Loiter Radius",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    42: {
        name: "Set Control Profile",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    43: {
        name: "Use Lowest Value",
        operandType: "Comparison",
        hasOperand: [true, true],
        output: "raw"
    },
    44: {
        name: "Use Highest Value",
        operandType: "Comparison",
        hasOperand: [true, true],
        output: "raw"
    },
    45: {
        name: "Flight Axis Angle Override",
        operandType: "Set Flight Parameter",
        hasOperand: [true, true],
        output: "boolean"
    },
    46: {
        name: "Flight Axis Rate Override",
        operandType: "Set Flight Parameter",
        hasOperand: [true, true],
        output: "boolean"
    },
    47: {
        name: "Edge",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    48: {
        name: "Delay",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    49: {
        name: "Timer",
        operandType: "Logic Switches",
        hasOperand: [true, true],
        output: "boolean"
    },
    50: {
        name: "Delta (|A| >= B)",
        operandType: "Comparison",
        hasOperand: [true, true],
        output: "boolean"
    },
    51: {
        name: "Approx Equals (A ~ B)",
        operandType: "Comparison",
        hasOperand: [true, true],
        output: "boolean"
    },
    52: {
        name: "LED Pin PWM",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "raw"
    },        
    53: {
        name: "Disable GPS Sensor Fix",
        operandType: "Set Flight Parameter",
        hasOperand: [true, false],
        output: "boolean"
    },
    54: {
        name: "Mag calibration",
        operandType: "Set Flight Parameter",
        hasOperand: [false, false],
        output: "boolean"
    }
};

module.exports = { LOGIC_OPERATORS };