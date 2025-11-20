/**
'use strict';

 * INAV Override Definitions (Enhanced)
 * 
 * Location: tabs/programming/transpiler/api/definitions/override.js
 * 
 * Single source of truth for all override operations.
 * Each definition includes:
 * - Property metadata (type, description, units)
 * - INAV operation mapping
 * - Validation rules
 * - Code generation logic
 * - Documentation and examples
 * 
 * This approach means adding a new override requires editing ONLY this file!
 */

/**
 * Helper function for generating standard logic condition
 */
function standardLogic(lcIndex, activator, operation, operandA, operandB = 0) {
  return `logic ${lcIndex} 1 ${activator} ${operation} 0 ${operandA} 0 ${operandB} 0`;
}

const overrideDefinitions = {
  
  // === Safety Overrides ===
  
  armingSafetyBypass: {
    type: 'boolean',
    desc: 'Bypass all arming safety checks (WARNING: USE WITH EXTREME CAUTION)',
    inavOperation: 22,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 22, 0, 0),
    validate: (value) => null, // Always valid
    example: 'override.armingSafetyBypass = true;',
    note: 'This bypasses ALL safety checks including throttle position. Ensure proper logic conditions check safety manually.',
    category: 'safety'
  },
  
  // === Throttle Control ===
  
  throttleScale: {
    type: 'number',
    unit: '%',
    desc: 'Scale throttle output (0-100%)',
    range: [0, 100],
    inavOperation: 23,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 23, value, 0),
    validate: (value) => {
      if (value < 0 || value > 100) {
        return 'Throttle scale must be 0-100%';
      }
      return null;
    },
    example: 'override.throttleScale = 50; // Limit to 50% throttle',
    category: 'throttle'
  },
  
  throttle: {
    type: 'number',
    unit: 'μs',
    desc: 'Direct throttle override (1000-2000μs)',
    range: [1000, 2000],
    inavOperation: 29,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 29, value, 0),
    validate: (value) => {
      if (value < 1000 || value > 2000) {
        return 'Throttle must be 1000-2000μs';
      }
      return null;
    },
    example: 'override.throttle = 1500; // Set to 50%',
    note: 'Bypasses RC input and directly controls motors',
    category: 'throttle'
  },
  
  // === Axis Control ===
  
  swapRollYaw: {
    type: 'boolean',
    desc: 'Swap roll and yaw stick inputs (for VTOL transitions)',
    inavOperation: 24,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 24, 0, 0),
    example: 'override.swapRollYaw = true;',
    note: 'Useful for tail-sitter VTOL during vertical-horizontal transition',
    category: 'axis'
  },
  
  invertRoll: {
    type: 'boolean',
    desc: 'Invert roll axis input',
    inavOperation: 26,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 26, 0, 0),
    example: 'override.invertRoll = true;',
    category: 'axis'
  },
  
  invertPitch: {
    type: 'boolean',
    desc: 'Invert pitch axis input',
    inavOperation: 27,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 27, 0, 0),
    example: 'override.invertPitch = true;',
    category: 'axis'
  },
  
  invertYaw: {
    type: 'boolean',
    desc: 'Invert yaw axis input',
    inavOperation: 28,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 28, 0, 0),
    example: 'override.invertYaw = true;',
    category: 'axis'
  },
  
  roll: {
    angle: {
      type: 'number',
      unit: '°',
      desc: 'Override roll angle target (-90 to 90°)',
      range: [-90, 90],
      inavOperation: 45,
      codegen: (value, activator, lcIndex) => 
        `logic ${lcIndex} 1 ${activator} 45 0 0 0 ${value} 0`,
      validate: (value) => {
        if (value < -90 || value > 90) {
          return 'Roll angle must be -90 to 90°';
        }
        return null;
      },
      example: 'override.roll.angle = 15; // Bank 15° right',
      note: 'Enforces angle mode on roll axis',
      category: 'axis'
    },
    
    rate: {
      type: 'number',
      unit: '°/s',
      desc: 'Override roll rate target (-2000 to 2000°/s)',
      range: [-2000, 2000],
      inavOperation: 46,
      codegen: (value, activator, lcIndex) => 
        `logic ${lcIndex} 1 ${activator} 46 0 0 0 ${value} 0`,
      validate: (value) => {
        if (value < -2000 || value > 2000) {
          return 'Roll rate must be -2000 to 2000°/s';
        }
        return null;
      },
      example: 'override.roll.rate = 500; // Roll at 500°/s',
      category: 'axis'
    }
  },
  
  pitch: {
    angle: {
      type: 'number',
      unit: '°',
      desc: 'Override pitch angle target (-90 to 90°)',
      range: [-90, 90],
      inavOperation: 45,
      codegen: (value, activator, lcIndex) => 
        `logic ${lcIndex} 1 ${activator} 45 0 1 0 ${value} 0`,
      validate: (value) => {
        if (value < -90 || value > 90) {
          return 'Pitch angle must be -90 to 90°';
        }
        return null;
      },
      example: 'override.pitch.angle = -10; // Nose down 10°',
      note: 'Enforces angle mode on pitch axis',
      category: 'axis'
    },
    
    rate: {
      type: 'number',
      unit: '°/s',
      desc: 'Override pitch rate target (-2000 to 2000°/s)',
      range: [-2000, 2000],
      inavOperation: 46,
      codegen: (value, activator, lcIndex) => 
        `logic ${lcIndex} 1 ${activator} 46 0 1 0 ${value} 0`,
      validate: (value) => {
        if (value < -2000 || value > 2000) {
          return 'Pitch rate must be -2000 to 2000°/s';
        }
        return null;
      },
      example: 'override.pitch.rate = -300; // Pitch down at 300°/s',
      category: 'axis'
    }
  },
  
  yaw: {
    angle: {
      type: 'number',
      unit: '°',
      desc: 'Override yaw angle target (0-360°)',
      range: [0, 360],
      inavOperation: 45,
      codegen: (value, activator, lcIndex) => 
        `logic ${lcIndex} 1 ${activator} 45 0 2 0 ${value} 0`,
      validate: (value) => {
        if (value < 0 || value > 360) {
          return 'Yaw angle must be 0-360°';
        }
        return null;
      },
      example: 'override.yaw.angle = 180; // Face south',
      note: 'Enforces heading hold on yaw axis',
      category: 'axis'
    },
    
    rate: {
      type: 'number',
      unit: '°/s',
      desc: 'Override yaw rate target (-2000 to 2000°/s)',
      range: [-2000, 2000],
      inavOperation: 46,
      codegen: (value, activator, lcIndex) => 
        `logic ${lcIndex} 1 ${activator} 46 0 2 0 ${value} 0`,
      validate: (value) => {
        if (value < -2000 || value > 2000) {
          return 'Yaw rate must be -2000 to 2000°/s';
        }
        return null;
      },
      example: 'override.yaw.rate = 100; // Slow rotation',
      category: 'axis'
    }
  },
  
  headingTarget: {
    type: 'number',
    unit: '°',
    desc: 'Set heading hold target (0-360°)',
    range: [0, 360],
    inavOperation: 39,
    codegen: (value, activator, lcIndex) => {
      // Convert degrees to centidegrees for INAV
      const centidegrees = Math.round(value * 100);
      return standardLogic(lcIndex, activator, 39, centidegrees, 0);
    },
    validate: (value) => {
      if (value < 0 || value > 360) {
        return 'Heading must be 0-360°';
      }
      return null;
    },
    example: 'override.headingTarget = 90; // Face east',
    category: 'axis'
  },
  
  // === VTX Control ===
  
  vtx: {
    power: {
      type: 'number',
      desc: 'VTX power level (0-4 for SmartAudio, 0-4 for Tramp)',
      range: [0, 4],
      inavOperation: 25,
      codegen: (value, activator, lcIndex) => 
        standardLogic(lcIndex, activator, 25, value, 0),
      validate: (value) => {
        if (value < 0 || value > 4) {
          return 'VTX power must be 0-4';
        }
        return null;
      },
      example: 'override.vtx.power = 3; // High power',
      category: 'vtx'
    },
    
    band: {
      type: 'number',
      desc: 'VTX band (1-5)',
      range: [1, 5],
      inavOperation: 30,
      codegen: (value, activator, lcIndex) => 
        standardLogic(lcIndex, activator, 30, value, 0),
      validate: (value) => {
        if (value < 1 || value > 5) {
          return 'VTX band must be 1-5';
        }
        return null;
      },
      example: 'override.vtx.band = 5; // RaceBand',
      category: 'vtx'
    },
    
    channel: {
      type: 'number',
      desc: 'VTX channel (1-8)',
      range: [1, 8],
      inavOperation: 31,
      codegen: (value, activator, lcIndex) => 
        standardLogic(lcIndex, activator, 31, value, 0),
      validate: (value) => {
        if (value < 1 || value > 8) {
          return 'VTX channel must be 1-8';
        }
        return null;
      },
      example: 'override.vtx.channel = 1; // Channel 1',
      category: 'vtx'
    }
  },
  
  // === Navigation Overrides ===
  
  loiterRadius: {
    type: 'number',
    unit: 'cm',
    desc: 'Override loiter radius (must be >= configured loiter radius)',
    range: [0, 100000],
    inavOperation: 41,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 41, value, 0),
    validate: (value) => {
      if (value < 0 || value > 100000) {
        return 'Loiter radius must be 0-100000cm';
      }
      return null;
    },
    example: 'override.loiterRadius = 10000; // 100m radius',
    note: 'Must be larger than configured loiter radius',
    category: 'navigation'
  },
  
  minGroundSpeed: {
    type: 'number',
    unit: 'm/s',
    desc: 'Override minimum ground speed (nav_min_ground_speed to 150 m/s)',
    range: [0, 150],
    inavOperation: 56,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 56, value, 0),
    validate: (value) => {
      if (value < 0 || value > 150) {
        return 'Min ground speed must be 0-150 m/s';
      }
      return null;
    },
    example: 'override.minGroundSpeed = 5; // 5 m/s minimum',
    category: 'navigation'
  },
  
  // === RC Channel Override ===
  
  rcChannel: {
    type: 'array',
    desc: 'Override RC channel values (1-indexed, 1000-2000μs)',
    inavOperation: 38,
    codegen: (channelNum, value, activator, lcIndex) => {
      // Operation 38 takes channel number as operandA, value as operandB
      return `logic ${lcIndex} 1 ${activator} 38 0 ${channelNum} 0 ${value} 0`;
    },
    validate: (channelNum, value) => {
      if (channelNum < 1 || channelNum > 18) {
        return 'RC channel must be 1-18';
      }
      if (value < 1000 || value > 2000) {
        return 'RC value must be 1000-2000μs';
      }
      return null;
    },
    example: 'override.rcChannel[8] = 2000; // Trigger RTH switch',
    note: 'Channel numbers are 1-indexed (1 = first channel)',
    category: 'rc'
  },
  
  // === System Overrides ===
  
  osdLayout: {
    type: 'number',
    desc: 'Switch OSD layout (0-3)',
    range: [0, 3],
    inavOperation: 32,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 32, value, 0),
    validate: (value) => {
      if (value < 0 || value > 3) {
        return 'OSD layout must be 0-3';
      }
      return null;
    },
    example: 'override.osdLayout = 1; // Switch to layout 1',
    category: 'system'
  },
  
  controlProfile: {
    type: 'number',
    desc: 'Switch PID/PIFF control profile (1-3)',
    range: [1, 3],
    inavOperation: 42,
    codegen: (value, activator, lcIndex) => {
      // INAV expects 0-2, but users think 1-3
      const inavProfile = value - 1;
      return standardLogic(lcIndex, activator, 42, inavProfile, 0);
    },
    validate: (value) => {
      if (value < 1 || value > 3) {
        return 'Control profile must be 1-3';
      }
      return null;
    },
    example: 'override.controlProfile = 2; // Switch to profile 2',
    category: 'system'
  },
  
  ledPwm: {
    type: 'number',
    unit: '%',
    desc: 'LED pin PWM output (0-100%, 0 stops PWM)',
    range: [0, 100],
    inavOperation: 52,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 52, value, 0),
    validate: (value) => {
      if (value < 0 || value > 100) {
        return 'LED PWM must be 0-100%';
      }
      return null;
    },
    example: 'override.ledPwm = 75; // 75% brightness',
    note: 'Set to 0 to stop PWM and allow WS2812 LEDs to update',
    category: 'system'
  },
  
  gimbalSensitivity: {
    type: 'number',
    desc: 'Gimbal sensitivity (-16 to 15)',
    range: [-16, 15],
    inavOperation: 55,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 55, value, 0),
    validate: (value) => {
      if (value < -16 || value > 15) {
        return 'Gimbal sensitivity must be -16 to 15';
      }
      return null;
    },
    example: 'override.gimbalSensitivity = 5;',
    category: 'system'
  },
  
  // === Testing/Debug ===
  
  disableGpsFix: {
    type: 'boolean',
    desc: 'Disable GPS fix (for testing GPS failure scenarios)',
    inavOperation: 53,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 53, 0, 0),
    example: 'override.disableGpsFix = true;',
    note: 'For testing only!',
    category: 'testing'
  },
  
  triggerMagCal: {
    type: 'boolean',
    desc: 'Trigger magnetometer calibration',
    inavOperation: 54,
    codegen: (value, activator, lcIndex) => 
      standardLogic(lcIndex, activator, 54, 0, 0),
    example: 'override.triggerMagCal = true;',
    category: 'testing'
  }
};

/**
 * Get all overrides in a category
 * @param {string} category - Category name
 * @returns {Object} Filtered overrides
 */
function getOverridesByCategory(category) {
  const result = {};
  
  function traverse(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      
      if (value.category === category) {
        result[fullPath] = value;
      } else if (typeof value === 'object' && !value.type) {
        traverse(value, fullPath);
      }
    }
  }
  
  traverse(overrideDefinitions);
  return result;
}

/**
 * Get all categories
 * @returns {string[]} List of unique categories
 */
function getCategories() {
  const categories = new Set();
  
  function traverse(obj) {
    for (const value of Object.values(obj)) {
      if (value.category) {
        categories.add(value.category);
      } else if (typeof value === 'object' && !value.type) {
        traverse(value);
      }
    }
  }
  
  traverse(overrideDefinitions);
  return Array.from(categories).sort();
}

module.exports = {
    overrideDefinitions,
    getOverridesByCategory,
    getCategories
};