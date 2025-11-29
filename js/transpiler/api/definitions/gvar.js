/**
 * INAV Global Variables API Definition
 * 
 * Location: js/transpiler/api/definitions/gvar.js
 * 
 * Global variables for storing and sharing data between logic conditions.
 * INAV has 8 global variables (gvar[0] through gvar[7]).
 * Source: src/main/programming/global_variables.c
 */

'use strict';

// Generate global variable definitions
const gvars = {};

for (let i = 0; i < 8; i++) {
  gvars[i] = {
    type: 'number',
    desc: `Global variable ${i} (read/write)`,
    readonly: false,
    range: [-1000000, 1000000],
    inavOperand: {
      type: 3, // OPERAND_TYPE.GVAR
      value: i
    },
    inavOperation: 19 // OPERATION.SET_GVAR (for write operations)
  };
}

export default gvars;
