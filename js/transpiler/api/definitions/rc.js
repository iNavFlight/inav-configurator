/**
 * INAV RC Channels API Definition
 * 
 * Location: js/transpiler/api/definitions/rc.js
 * 
 * RC receiver channel values and states.
 * INAV supports up to 18 RC channels.
 */

'use strict';

// Generate RC channel definitions
// RC channels are accessed as rc[1] through rc[18] (1-based, matching INAV firmware)
// Each channel has: value, low, mid, high properties

const rcChannels = {};

// Generate 18 RC channels (1-based indexing: rc[1] through rc[18])
for (let i = 1; i <= 18; i++) {
  rcChannels[i] = {
    type: 'object',
    desc: `RC channel ${i}`,
    readonly: true,
    properties: {
      value: {
        type: 'number',
        unit: 'us',
        desc: `Channel ${i} value in microseconds (1000-2000)`,
        readonly: true,
        range: [1000, 2000],
        inavOperand: { type: 4, value: i } // OPERAND_RC_CHANNEL (1-based)
      },

      low: {
        type: 'boolean',
        desc: `Channel ${i} is in low position (< 1333us)`,
        readonly: true,
        inavOperand: { type: 4, value: i }
      },

      mid: {
        type: 'boolean',
        desc: `Channel ${i} is in middle position (1333-1666us)`,
        readonly: true,
        inavOperand: { type: 4, value: i }
      },

      high: {
        type: 'boolean',
        desc: `Channel ${i} is in high position (> 1666us)`,
        readonly: true,
        inavOperand: { type: 4, value: i }
      }
    }
  };
}

export default rcChannels;
