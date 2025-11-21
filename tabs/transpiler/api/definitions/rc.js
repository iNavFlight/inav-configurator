/**
 * INAV RC Channels API Definition
 * 
 * Location: tabs/transpiler/api/definitions/rc.js
 * 
 * RC receiver channel values and states.
 * INAV supports up to 18 RC channels.
 */

'use strict';

// Generate RC channel definitions
// RC channels are accessed as rc[0] through rc[17] (or rc[1] through rc[18] in 1-indexed)
// Each channel has: value, low, mid, high properties

const rcChannels = {};

// Generate 18 RC channels
for (let i = 0; i < 18; i++) {
  rcChannels[i] = {
    type: 'object',
    desc: `RC channel ${i + 1}`,
    readonly: true,
    properties: {
      value: {
        type: 'number',
        unit: 'us',
        desc: `Channel ${i + 1} value in microseconds (1000-2000)`,
        readonly: true,
        range: [1000, 2000],
        inavOperand: { type: 4, value: i } // OPERAND_RC_CHANNEL
      },
      
      low: {
        type: 'boolean',
        desc: `Channel ${i + 1} is in low position (< 1333us)`,
        readonly: true,
        inavOperand: { type: 4, value: i }
      },
      
      mid: {
        type: 'boolean',
        desc: `Channel ${i + 1} is in middle position (1333-1666us)`,
        readonly: true,
        inavOperand: { type: 4, value: i }
      },
      
      high: {
        type: 'boolean',
        desc: `Channel ${i + 1} is in high position (> 1666us)`,
        readonly: true,
        inavOperand: { type: 4, value: i }
      }
    }
  };
}

module.exports = rcChannels;