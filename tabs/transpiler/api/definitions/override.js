/**
 * INAV Override API Definition
 * 
 * Location: tabs/transpiler/api/definitions/override.js
 * 
 * Writable override operations for flight control.
 * Source: src/main/programming/logic_condition.c (OPERATION_OVERRIDE_*)
 */

'use strict';

module.exports = {
  // Throttle Control
  throttleScale: {
    type: 'number',
    unit: '%',
    desc: 'Scale throttle output (0-100%)',
    readonly: false,
    range: [0, 100],
    inavOperation: 25 // OVERRIDE_THROTTLE_SCALE
  },
  
  throttle: {
    type: 'number',
    unit: 'us',
    desc: 'Direct throttle override in microseconds',
    readonly: false,
    range: [1000, 2000],
    inavOperation: 26 // OVERRIDE_THROTTLE
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
        inavOperation: 27 // OVERRIDE_VTX_POWER
      },
      
      band: {
        type: 'number',
        desc: 'VTX frequency band (0-5)',
        readonly: false,
        range: [0, 5],
        inavOperation: 28 // OVERRIDE_VTX_BAND
      },
      
      channel: {
        type: 'number',
        desc: 'VTX channel (1-8)',
        readonly: false,
        range: [1, 8],
        inavOperation: 29 // OVERRIDE_VTX_CHANNEL
      }
    }
  },
  
  // Attitude Control
  roll: {
    type: 'object',
    desc: 'Roll axis override',
    properties: {
      angle: {
        type: 'number',
        unit: '°',
        desc: 'Roll angle target in degrees',
        readonly: false,
        range: [-180, 180],
        inavOperation: 40 // OVERRIDE_ROLL_ANGLE (hypothetical)
      },
      
      rate: {
        type: 'number',
        unit: '°/s',
        desc: 'Roll rate target in degrees/second',
        readonly: false,
        range: [-360, 360],
        inavOperation: 41 // OVERRIDE_ROLL_RATE (hypothetical)
      }
    }
  },
  
  pitch: {
    type: 'object',
    desc: 'Pitch axis override',
    properties: {
      angle: {
        type: 'number',
        unit: '°',
        desc: 'Pitch angle target in degrees',
        readonly: false,
        range: [-180, 180],
        inavOperation: 42 // OVERRIDE_PITCH_ANGLE (hypothetical)
      },
      
      rate: {
        type: 'number',
        unit: '°/s',
        desc: 'Pitch rate target in degrees/second',
        readonly: false,
        range: [-360, 360],
        inavOperation: 43 // OVERRIDE_PITCH_RATE (hypothetical)
      }
    }
  },
  
  yaw: {
    type: 'object',
    desc: 'Yaw axis override',
    properties: {
      angle: {
        type: 'number',
        unit: '°',
        desc: 'Yaw/heading target in degrees (0-359)',
        readonly: false,
        range: [0, 359],
        inavOperation: 44 // OVERRIDE_YAW_ANGLE (hypothetical)
      },
      
      rate: {
        type: 'number',
        unit: '°/s',
        desc: 'Yaw rate target in degrees/second',
        readonly: false,
        range: [-360, 360],
        inavOperation: 45 // OVERRIDE_YAW_RATE (hypothetical)
      }
    }
  },
  
  heading: {
    type: 'number',
    unit: '°',
    desc: 'Heading override in degrees (0-359)',
    readonly: false,
    range: [0, 359],
    inavOperation: 46 // OVERRIDE_HEADING (hypothetical)
  },
  
  // RC Channel Override
  rcChannel: {
    type: 'array',
    desc: 'RC channel value overrides (array of 18 channels)',
    readonly: false,
    elementType: 'number',
    range: [1000, 2000],
    inavOperation: 33 // OVERRIDE_RC_CHANNEL
  },
  
  // Arming Control
  armSafety: {
    type: 'boolean',
    desc: 'Override arm safety switch',
    readonly: false,
    inavOperation: 23 // OVERRIDE_ARM_SAFETY
  },
  
  armingDisabled: {
    type: 'boolean',
    desc: 'Disable arming',
    readonly: false,
    inavOperation: 24 // OVERRIDE_ARMING_DISABLED
  },
  
  // OSD Override
  osdElement: {
    type: 'object',
    desc: 'Override OSD element visibility',
    properties: {
      // This would need to be expanded based on actual OSD elements
      // For now, keep it generic
      element: {
        type: 'number',
        desc: 'OSD element ID',
        readonly: false,
        inavOperation: 34 // OVERRIDE_OSD_ELEMENT
      }
    }
  }
};