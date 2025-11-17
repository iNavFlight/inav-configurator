/**
 * INAV RC Channel Definitions
 * 
 * Location: tabs/programming/transpiler/api/definitions/rc.js
 * 
 * RC channel access (all read-only)
 * Accessed as: rc[1].value, rc[5].high, etc.
 */

export const rcDefinitions = {
  // RC channels are accessed as array: rc[1], rc[2], etc.
  // Each channel has these properties:
  
  value: {
    type: 'number',
    desc: 'Raw RC channel value (1000-2000μs)',
    inavOperand: { type: 1, value: 0 }, // value is channel index
    readonly: true,
    example: 'const throttle = rc[3].value; // Raw throttle value',
    note: 'Channel index is 1-based (rc[1] = first channel)',
    category: 'raw'
  },
  
  low: {
    type: 'boolean',
    desc: 'RC channel is LOW (< 1333μs)',
    inavOperand: { type: 1, value: 0 },
    readonly: true,
    codegen: (channel, activator, lcIndex) => {
      // Operation 4 = LOW check
      return `logic ${lcIndex} 1 ${activator} 4 1 ${channel} 0 0 0`;
    },
    example: 'if (rc[5].low) { /* Switch is down */ }',
    category: 'position'
  },
  
  mid: {
    type: 'boolean',
    desc: 'RC channel is MID (1333-1666μs)',
    inavOperand: { type: 1, value: 0 },
    readonly: true,
    codegen: (channel, activator, lcIndex) => {
      // Operation 5 = MID check
      return `logic ${lcIndex} 1 ${activator} 5 1 ${channel} 0 0 0`;
    },
    example: 'if (rc[5].mid) { /* Switch is middle */ }',
    category: 'position'
  },
  
  high: {
    type: 'boolean',
    desc: 'RC channel is HIGH (> 1666μs)',
    inavOperand: { type: 1, value: 0 },
    readonly: true,
    codegen: (channel, activator, lcIndex) => {
      // Operation 6 = HIGH check
      return `logic ${lcIndex} 1 ${activator} 6 1 ${channel} 0 0 0`;
    },
    example: 'if (rc[5].high) { /* Switch is up */ }',
    category: 'position'
  }
};