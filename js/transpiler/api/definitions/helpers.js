/**
 * INAV Helper Functions API Definition
 * 
 * Location: js/transpiler/api/definitions/helpers.js
 * 
 * Math and utility functions available in INAV programming.
 * Source: src/main/programming/logic_condition.c (OPERATION_*)
 */

'use strict';

import { OPERATION } from '../../transpiler/inav_constants.js';

export default {
  // Math functions
  min: {
    type: 'function',
    desc: 'Return minimum of two values',
    params: ['a', 'b'],
    returns: 'number',
    inavOperation: OPERATION.MIN
  },
  
  max: {
    type: 'function',
    desc: 'Return maximum of two values',
    params: ['a', 'b'],
    returns: 'number',
    inavOperation: OPERATION.MAX
  },
  
  abs: {
    type: 'function',
    desc: 'Return absolute value',
    params: ['value'],
    returns: 'number'
  },
  
  sin: {
    type: 'function',
    desc: 'Sine function (input in degrees)',
    params: ['degrees'],
    returns: 'number',
    unit: '°',
    inavOperation: OPERATION.SIN
  },
  
  cos: {
    type: 'function',
    desc: 'Cosine function (input in degrees)',
    params: ['degrees'],
    returns: 'number',
    unit: '°',
    inavOperation: OPERATION.COS
  },
  
  tan: {
    type: 'function',
    desc: 'Tangent function (input in degrees)',
    params: ['degrees'],
    returns: 'number',
    unit: '°',
    inavOperation: OPERATION.TAN
  },

  acos: {
    type: 'function',
    desc: 'Arc cosine (returns degrees)',
    params: ['ratio'],
    returns: 'number',
    unit: '°',
    inavOperation: OPERATION.ACOS
  },

  asin: {
    type: 'function',
    desc: 'Arc sine (returns degrees)',
    params: ['ratio'],
    returns: 'number',
    unit: '°',
    inavOperation: OPERATION.ASIN
  },

  atan2: {
    type: 'function',
    desc: 'Arc tangent of y/x (returns degrees)',
    params: ['y', 'x'],
    returns: 'number',
    unit: '°',
    inavOperation: OPERATION.ATAN2
  },
  
  // Mapping functions
  mapInput: {
    type: 'function',
    desc: 'Map input value to normalized range',
    params: ['value', 'maxInput'],
    returns: 'number',
    inavOperation: OPERATION.MAP_INPUT
  },
  
  mapOutput: {
    type: 'function',
    desc: 'Map normalized value to output range',
    params: ['value', 'maxOutput'],
    returns: 'number',
    inavOperation: OPERATION.MAP_OUTPUT
  },
  
  // Arithmetic operations (built-in JavaScript, but documented for reference)
  add: {
    type: 'operator',
    desc: 'Addition',
    operator: '+',
    inavOperation: OPERATION.ADD
  },
  
  sub: {
    type: 'operator',
    desc: 'Subtraction',
    operator: '-',
    inavOperation: OPERATION.SUB
  },
  
  mul: {
    type: 'operator',
    desc: 'Multiplication',
    operator: '*',
    inavOperation: OPERATION.MUL
  },
  
  div: {
    type: 'operator',
    desc: 'Division',
    operator: '/',
    inavOperation: OPERATION.DIV
  },
  
  mod: {
    type: 'operator',
    desc: 'Modulo (remainder)',
    operator: '%',
    inavOperation: OPERATION.MODULUS
  }
};
