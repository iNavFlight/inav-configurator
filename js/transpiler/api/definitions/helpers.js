/**
 * INAV Helper Functions API Definition
 * 
 * Location: js/transpiler/api/definitions/helpers.js
 * 
 * Math and utility functions available in INAV programming.
 * Source: src/main/programming/logic_condition.c (OPERATION_*)
 */

'use strict';

export default {
  // Math functions
  min: {
    type: 'function',
    desc: 'Return minimum of two values',
    params: ['a', 'b'],
    returns: 'number',
    inavOperation: 30 // OPERATION.MIN
  },
  
  max: {
    type: 'function',
    desc: 'Return maximum of two values',
    params: ['a', 'b'],
    returns: 'number',
    inavOperation: 31 // OPERATION.MAX
  },
  
  abs: {
    type: 'function',
    desc: 'Return absolute value',
    params: ['value'],
    returns: 'number',
    inavOperation: 32 // OPERATION.ABS
  },
  
  sin: {
    type: 'function',
    desc: 'Sine function (input in degrees)',
    params: ['degrees'],
    returns: 'number',
    unit: '°',
    inavOperation: 35 // OPERATION.SIN
  },
  
  cos: {
    type: 'function',
    desc: 'Cosine function (input in degrees)',
    params: ['degrees'],
    returns: 'number',
    unit: '°',
    inavOperation: 36 // OPERATION.COS
  },
  
  tan: {
    type: 'function',
    desc: 'Tangent function (input in degrees)',
    params: ['degrees'],
    returns: 'number',
    unit: '°',
    inavOperation: 37 // OPERATION.TAN
  },
  
  // Logical functions
  xor: {
    type: 'function',
    desc: 'Exclusive OR - true when exactly one argument is true',
    params: ['a', 'b'],
    returns: 'boolean',
    inavOperation: 9 // OPERATION.XOR
  },

  nand: {
    type: 'function',
    desc: 'NOT AND - false when both arguments are true',
    params: ['a', 'b'],
    returns: 'boolean',
    inavOperation: 10 // OPERATION.NAND
  },

  nor: {
    type: 'function',
    desc: 'NOT OR - true when both arguments are false',
    params: ['a', 'b'],
    returns: 'boolean',
    inavOperation: 11 // OPERATION.NOR
  },

  approxEqual: {
    type: 'function',
    desc: 'Approximate equality with tolerance',
    params: ['a', 'b', 'tolerance'],
    returns: 'boolean',
    inavOperation: 2 // OPERATION.APPROX_EQUAL
  },

  // Mapping functions
  mapInput: {
    type: 'function',
    desc: 'Map input value to normalized range',
    params: ['value', 'maxInput'],
    returns: 'number',
    inavOperation: 38 // OPERATION.MAP_INPUT
  },

  mapOutput: {
    type: 'function',
    desc: 'Map normalized value to output range',
    params: ['value', 'maxOutput'],
    returns: 'number',
    inavOperation: 39 // OPERATION.MAP_OUTPUT
  },
  
  // Arithmetic operations (built-in JavaScript, but documented for reference)
  add: {
    type: 'operator',
    desc: 'Addition',
    operator: '+',
    inavOperation: 14 // OPERATION.ADD
  },
  
  sub: {
    type: 'operator',
    desc: 'Subtraction',
    operator: '-',
    inavOperation: 15 // OPERATION.SUB
  },
  
  mul: {
    type: 'operator',
    desc: 'Multiplication',
    operator: '*',
    inavOperation: 16 // OPERATION.MUL
  },
  
  div: {
    type: 'operator',
    desc: 'Division',
    operator: '/',
    inavOperation: 17 // OPERATION.DIV
  },
  
  mod: {
    type: 'operator',
    desc: 'Modulo (remainder)',
    operator: '%',
    inavOperation: 18 // OPERATION.MOD
  }
};
