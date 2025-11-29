/**
 * INAV Override API Definition
 * 
 * Location: js/transpiler/api/definitions/override.js
 * 
 * Writable override operations for flight control.
 * Source: src/main/programming/logic_condition.h
 */

'use strict';

export default {
  // Throttle Control
  throttleScale: {
    type: 'number',
    unit: '%',
    desc: 'Scale throttle output (0-100%)',
    readonly: false,
    range: [0, 100],
    inavOperation: 23 // LOGIC_CONDITION_OVERRIDE_THROTTLE_SCALE
  },
  
  throttle: {
    type: 'number',
    unit: 'us',
    desc: 'Direct throttle override in microseconds',
    readonly: false,
    range: [1000, 2000],
    inavOperation: 29 // LOGIC_CONDITION_OVERRIDE_THROTTLE
  },
  
  // VTX Control (nested object)
  vtx: {
    type: 'object',
    desc: 'Video transmitter control',
    properties: {
      power: {
        type: 'number',
        desc: 'VTX power level (0-4)',
        readonly: false,
        range: [0, 4],
        inavOperation: 25 // LOGIC_CONDITION_SET_VTX_POWER_LEVEL
      },
      
      band: {
        type: 'number',
        desc: 'VTX frequency band (0-5)',
        readonly: false,
        range: [0, 5],
        inavOperation: 30 // LOGIC_CONDITION_SET_VTX_BAND
      },
      
      channel: {
        type: 'number',
        desc: 'VTX channel (1-8)',
        readonly: false,
        range: [1, 8],
        inavOperation: 31 // LOGIC_CONDITION_SET_VTX_CHANNEL
      }
    }
  },
  
  // Arming Control
  armSafety: {
    type: 'boolean',
    desc: 'Override arm safety switch',
    readonly: false,
    inavOperation: 22 // LOGIC_CONDITION_OVERRIDE_ARMING_SAFETY
  },
  
  // OSD Override
  osdLayout: {
    type: 'number',
    desc: 'Set OSD layout (0-3)',
    readonly: false,
    range: [0, 3],
    inavOperation: 32 // LOGIC_CONDITION_SET_OSD_LAYOUT
  },
  
  // RC Channel Override
  rcChannel: {
    type: 'function',
    desc: 'Override RC channel value. Usage: override.rcChannel(channel, value)',
    readonly: false,
    inavOperation: 38 // LOGIC_CONDITION_RC_CHANNEL_OVERRIDE
    // Note: This requires special handling in codegen as it takes channel number as operandA
  },
  
  // Loiter Override
  loiterRadius: {
    type: 'number',
    unit: 'cm',
    desc: 'Override loiter radius in centimeters',
    readonly: false,
    range: [0, 100000],
    inavOperation: 41 // LOGIC_CONDITION_LOITER_OVERRIDE
  },
  
  // Min Ground Speed Override
  minGroundSpeed: {
    type: 'number',
    unit: 'm/s',
    desc: 'Override minimum ground speed',
    readonly: false,
    range: [0, 150],
    inavOperation: 56 // LOGIC_CONDITION_OVERRIDE_MIN_GROUND_SPEED
  }
  
  // Note: Flight axis angle/rate overrides (operations 45, 46) would need
  // special syntax since they require specifying the axis (0=roll, 1=pitch, 2=yaw)
  // These should probably be exposed as:
  // override.flightAxis.angle(axis, degrees)
  // override.flightAxis.rate(axis, degreesPerSecond)
};
