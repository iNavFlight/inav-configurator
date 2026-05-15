/**
 * INAV Programming PID API Definition
 *
 * Location: js/transpiler/api/definitions/pid.js
 *
 * Programming PID controllers for custom control loops.
 * INAV has 4 programming PID controllers (pid[0] through pid[3]).
 *
 * IMPORTANT: The firmware ONLY exposes PID OUTPUT, not setpoint/gains/enabled!
 *
 * Source: src/main/programming/pid.h (MAX_PROGRAMMING_PID_COUNT = 4)
 *         src/main/programming/logic_condition.c (lines 1078-1082)
 *
 * Firmware implementation:
 *   case LOGIC_CONDITION_OPERAND_TYPE_PID:
 *     if (operand >= 0 && operand < MAX_PROGRAMMING_PID_COUNT) {
 *       retVal = programmingPidGetOutput(operand);  // ONLY OUTPUT!
 *     }
 *
 * This means:
 *   - Operand 0 = PID 0 output
 *   - Operand 1 = PID 1 output
 *   - Operand 2 = PID 2 output
 *   - Operand 3 = PID 3 output
 *
 * Properties like setpoint, measurement, P/I/D/FF gains, and enabled are
 * configured via CLI/configurator but NOT exposed through logic conditions!
 */

'use strict';

import { OPERAND_TYPE } from '../../transpiler/inav_constants.js';

// Generate PID controller definitions
const pidControllers = {};

for (let i = 0; i < 4; i++) {
  pidControllers[i] = {
    type: 'object',
    desc: `Programming PID controller ${i}`,
    properties: {
      output: {
        type: 'number',
        desc: `PID ${i} controller output value`,
        readonly: true,
        inavOperand: { type: OPERAND_TYPE.PID, value: i }
      }
    }
  };
}

export default pidControllers;
