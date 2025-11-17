/**
 * INAV API Definitions Aggregator
 * 
 * Location: tabs/programming/transpiler/api/definitions/index.js
 * 
 * Imports and exports all API definitions from a single location.
 * This file uses relative imports from the same directory.
 */

// Import all definition modules (same directory, relative paths)
import { flightDefinitions } from './flight.js';
import { overrideDefinitions } from './override.js';
import { waypointDefinitions } from './waypoint.js';
import { rcDefinitions } from './rc.js';

/**
 * Complete INAV API definitions
 * Single source of truth for all INAV JavaScript API
 */
export const apiDefinitions = {
  flight: flightDefinitions,
  override: overrideDefinitions,
  waypoint: waypointDefinitions,
  rc: rcDefinitions,
  
  // Global variables (array-like)
  gvar: {
    type: 'array',
    desc: 'Global variables (0-7)',
    inavOperand: { type: 5, value: 0 }
  },
  
  // Programming PID controllers
  pid: {
    configure: {
      type: 'function',
      desc: 'Configure PID controller parameters'
    },
    output: {
      type: 'number',
      desc: 'PID controller output value',
      inavOperand: { type: 6, value: 0 }
    }
  },
  
  // Event handlers
  on: {
    arm: {
      type: 'function',
      desc: 'Execute callback after arming with optional delay'
    },
    always: {
      type: 'function',
      desc: 'Execute callback continuously'
    }
  },
  
  // Conditional execution
  when: {
    type: 'function',
    desc: 'Execute callback when condition is true'
  },
  
  sticky: {
    type: 'function',
    desc: 'Sticky condition - latches on until off condition'
  },
  
  edge: {
    type: 'function',
    desc: 'Edge detection - momentary trigger'
  },
  
  delay: {
    type: 'function',
    desc: 'Delay execution until condition stays true'
  },
  
  timer: {
    type: 'function',
    desc: 'Timer - on/off cycles'
  },
  
  whenChanged: {
    type: 'function',
    desc: 'Trigger when value changes by threshold'
  }
};

/**
 * Get definition for a specific property path
 * @param {string} path - Dot-separated path (e.g., "flight.altitude")
 * @returns {Object|null} Definition object or null if not found
 */
export function getDefinition(path) {
  const parts = path.split('.');
  let current = apiDefinitions;
  
  for (const part of parts) {
    if (current && current[part]) {
      current = current[part];
    } else {
      return null;
    }
  }
  
  return current;
}

/**
 * Get all property names for a path
 * @param {string} path - Dot-separated path (e.g., "flight")
 * @returns {string[]} Array of property names
 */
export function getProperties(path) {
  const def = path ? getDefinition(path) : apiDefinitions;
  if (!def || typeof def !== 'object') {
    return [];
  }
  return Object.keys(def);
}

/**
 * Check if a path represents a writable property
 * @param {string} path - Dot-separated path
 * @returns {boolean} True if writable
 */
export function isWritable(path) {
  // Only override, gvar, and pid properties are writable
  return path.startsWith('override.') || 
         path.startsWith('gvar') || 
         path === 'ioPort';
}

/**
 * Get INAV operand type and value for a property
 * @param {string} path - Dot-separated path
 * @returns {Object|null} {type, value} or null
 */
export function getINAVOperand(path) {
  const def = getDefinition(path);
  return def?.inavOperand || null;
}

/**
 * Get INAV operation ID for an override
 * @param {string} path - Dot-separated path
 * @returns {number|null} Operation ID or null
 */
export function getINAVOperation(path) {
  const def = getDefinition(path);
  return def?.inavOperation || null;
}