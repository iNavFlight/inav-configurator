/**
 * INAV Override API Definition
 *
 * Location: js/transpiler/api/definitions/override.js
 *
 * Writable override operations for flight control.
 * Source: src/main/programming/logic_condition.h
 */

'use strict';

import { OPERATION } from '../../transpiler/inav_constants.js';

export default {
  // Throttle Control
  throttleScale: {
    type: 'number',
    unit: '%',
    desc: 'Scale throttle output (0-100%)',
    readonly: false,
    range: [0, 100],
    inavOperation: OPERATION.OVERRIDE_THROTTLE_SCALE
  },
  
  throttle: {
    type: 'number',
    unit: 'us',
    desc: 'Direct throttle override in microseconds',
    readonly: false,
    range: [1000, 2000],
    inavOperation: OPERATION.OVERRIDE_THROTTLE
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
        inavOperation: OPERATION.SET_VTX_POWER_LEVEL
      },
      
      band: {
        type: 'number',
        desc: 'VTX frequency band (0-5)',
        readonly: false,
        range: [0, 5],
        inavOperation: OPERATION.SET_VTX_BAND
      },
      
      channel: {
        type: 'number',
        desc: 'VTX channel (1-8)',
        readonly: false,
        range: [1, 8],
        inavOperation: OPERATION.SET_VTX_CHANNEL
      }
    }
  },
  
  // Arming Control
  armSafety: {
    type: 'boolean',
    desc: 'Override arm safety switch',
    readonly: false,
    inavOperation: OPERATION.OVERRIDE_ARMING_SAFETY
  },
  
  // OSD Override
  osdLayout: {
    type: 'number',
    desc: 'Set OSD layout (0-3)',
    readonly: false,
    range: [0, 3],
    inavOperation: OPERATION.SET_OSD_LAYOUT
  },
  
  // RC Channel Override
  rcChannel: {
    type: 'function',
    desc: 'Override RC channel value. Usage: override.rcChannel(channel, value)',
    readonly: false,
    inavOperation: OPERATION.RC_CHANNEL_OVERRIDE
    // Note: This requires special handling in codegen as it takes channel number as operandA
  },
  
  // Loiter Override
  loiterRadius: {
    type: 'number',
    unit: 'cm',
    desc: 'Override loiter radius in centimeters',
    readonly: false,
    range: [0, 100000],
    inavOperation: OPERATION.LOITER_OVERRIDE
  },
  
  // Min Ground Speed Override
  minGroundSpeed: {
    type: 'number',
    unit: 'm/s',
    desc: 'Override minimum ground speed',
    readonly: false,
    range: [0, 150],
    inavOperation: OPERATION.OVERRIDE_MIN_GROUND_SPEED
  },

  // Axis Control Overrides
  swapRollYaw: {
    type: 'boolean',
    desc: 'Swap roll and yaw control axes',
    readonly: false,
    inavOperation: OPERATION.SWAP_ROLL_YAW
  },

  invertRoll: {
    type: 'boolean',
    desc: 'Invert roll axis control',
    readonly: false,
    inavOperation: OPERATION.INVERT_ROLL
  },

  invertPitch: {
    type: 'boolean',
    desc: 'Invert pitch axis control',
    readonly: false,
    inavOperation: OPERATION.INVERT_PITCH
  },

  invertYaw: {
    type: 'boolean',
    desc: 'Invert yaw axis control',
    readonly: false,
    inavOperation: OPERATION.INVERT_YAW
  },

  // Navigation Overrides
  headingTarget: {
    type: 'number',
    unit: 'deg',
    desc: 'Override heading target in degrees',
    readonly: false,
    range: [0, 359],
    inavOperation: OPERATION.SET_HEADING_TARGET
  },

  // Profile Override
  profile: {
    type: 'number',
    desc: 'Override active profile (0-2)',
    readonly: false,
    range: [0, 2],
    inavOperation: OPERATION.SET_PROFILE
  },

  // Gimbal Override
  gimbalSensitivity: {
    type: 'number',
    desc: 'Override gimbal sensitivity',
    readonly: false,
    range: [0, 100],
    inavOperation: OPERATION.SET_GIMBAL_SENSITIVITY
  },

  // GPS Overrides
  disableGpsFix: {
    type: 'boolean',
    desc: 'Disable GPS fix (force no-fix state)',
    readonly: false,
    inavOperation: OPERATION.DISABLE_GPS_FIX
  },

  // Calibration Overrides
  resetMagCalibration: {
    type: 'boolean',
    desc: 'Reset magnetometer calibration',
    readonly: false,
    inavOperation: OPERATION.RESET_MAG_CALIBRATION
  },

  // Flight Axis Overrides
  flightAxis: {
    type: 'object',
    desc: 'Flight axis angle and rate overrides',
    properties: {
      roll: {
        type: 'object',
        desc: 'Roll axis overrides',
        properties: {
          angle: {
            type: 'number',
            unit: '°',
            desc: 'Override roll angle target (degrees)',
            readonly: false,
            inavOperation: OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE
          },
          rate: {
            type: 'number',
            unit: '°/s',
            desc: 'Override roll rate target (degrees per second)',
            readonly: false,
            range: [-2000, 2000],
            inavOperation: OPERATION.FLIGHT_AXIS_RATE_OVERRIDE
          }
        }
      },
      pitch: {
        type: 'object',
        desc: 'Pitch axis overrides',
        properties: {
          angle: {
            type: 'number',
            unit: '°',
            desc: 'Override pitch angle target (degrees)',
            readonly: false,
            inavOperation: OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE
          },
          rate: {
            type: 'number',
            unit: '°/s',
            desc: 'Override pitch rate target (degrees per second)',
            readonly: false,
            range: [-2000, 2000],
            inavOperation: OPERATION.FLIGHT_AXIS_RATE_OVERRIDE
          }
        }
      },
      yaw: {
        type: 'object',
        desc: 'Yaw axis overrides',
        properties: {
          angle: {
            type: 'number',
            unit: '°',
            desc: 'Override yaw angle target (degrees)',
            readonly: false,
            inavOperation: OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE
          },
          rate: {
            type: 'number',
            unit: '°/s',
            desc: 'Override yaw rate target (degrees per second)',
            readonly: false,
            range: [-2000, 2000],
            inavOperation: OPERATION.FLIGHT_AXIS_RATE_OVERRIDE
          }
        }
      }
    }
  }

};
