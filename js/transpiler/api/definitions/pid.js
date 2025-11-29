/**
 * INAV Programming PID API Definition
 * 
 * Location: js/transpiler/api/definitions/pid.js
 * 
 * Programming PID controllers for custom control loops.
 * INAV has 4 programming PID controllers (pid[0] through pid[3]).
 * Source: src/main/programming/pid.c
 */

'use strict';

// Generate PID controller definitions
const pidControllers = {};

for (let i = 0; i < 4; i++) {
  pidControllers[i] = {
    type: 'object',
    desc: `Programming PID controller ${i}`,
    methods: {
      configure: {
        type: 'function',
        desc: 'Configure PID controller parameters',
        params: {
          setpoint: {
            type: 'number',
            desc: 'Target setpoint value',
            inavOperand: { type: 6, value: i * 10 + 0 }
          },
          measurement: {
            type: 'number',
            desc: 'Current measurement/process variable',
            inavOperand: { type: 6, value: i * 10 + 1 }
          },
          p: {
            type: 'number',
            desc: 'Proportional gain',
            inavOperand: { type: 6, value: i * 10 + 2 }
          },
          i: {
            type: 'number',
            desc: 'Integral gain',
            inavOperand: { type: 6, value: i * 10 + 3 }
          },
          d: {
            type: 'number',
            desc: 'Derivative gain',
            inavOperand: { type: 6, value: i * 10 + 4 }
          },
          ff: {
            type: 'number',
            desc: 'Feedforward gain',
            inavOperand: { type: 6, value: i * 10 + 5 }
          }
        }
      }
    },
    properties: {
      output: {
        type: 'number',
        desc: `PID ${i} controller output`,
        readonly: true,
        inavOperand: { type: 6, value: i * 10 + 6 }
      },
      
      enabled: {
        type: 'boolean',
        desc: `PID ${i} controller enabled`,
        readonly: false,
        inavOperand: { type: 6, value: i * 10 + 7 }
      }
    }
  };
}

export default pidControllers;
