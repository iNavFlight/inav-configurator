/**
 * INAV Transpiler Constants
 * 
 * Location: tabs/programming/transpiler/transpiler/constants.js
 * 
 * Centralized configuration and constants for the transpiler.
 */

'use strict';

const INAV_CONSTANTS = {
  // Logic conditions limit
  MAX_LOGIC_CONDITIONS: 64,
  WARNING_THRESHOLD: 50,
  
  // Global variables
  MAX_GVAR_INDEX: 7,
  GVAR_COUNT: 8,
  GVAR_RANGE: { min: -1000000, max: 1000000 },
  
  // Value ranges
  HEADING_RANGE: { min: 0, max: 359 },
  ALTITUDE_RANGE: { min: -1000, max: 10000 }, // meters
  SPEED_RANGE: { min: 0, max: 500 }, // cm/s
  
  // Valid event handlers
  VALID_HANDLERS: ['on.arm', 'on.always', 'ifthen'],
  
  // RC channels
  RC_CHANNEL_COUNT: 18,
  
  // Error messages
  ERROR_MESSAGES: {
    INVALID_GVAR: (index, max) => 
      `Invalid gvar index ${index}. INAV only has gvar[0] through gvar[${max}].`,
    INVALID_GVAR_SYNTAX: (gvar) => 
      `Invalid gvar syntax: ${gvar}. Expected format: gvar[0-${INAV_CONSTANTS.MAX_GVAR_INDEX}]`,
    TOO_MANY_LC: (count, max) => 
      `Too many logic conditions (${count}/${max}). INAV supports maximum ${max} logic conditions.`,
    UNKNOWN_PROPERTY: (prop, available) => 
      `Unknown property '${prop}'. Available: ${available.join(', ')}`,
    UNKNOWN_API: (api, available) => 
      `Unknown API object '${api}'. Available: ${available.join(', ')}`,
    NOT_WRITABLE: (target) => 
      `Cannot assign to '${target}'. Not a valid INAV writable property.`,
    INVALID_HANDLER: (handler, valid) => 
      `Unknown event handler: ${handler}. Valid handlers: ${valid.join(', ')}`,
    PARSE_ERROR: (line, col, msg) => 
      `Parse error at line ${line}, column ${col}: ${msg}`,
    INVALID_AST: () => 
      'Parser produced invalid AST structure',
    EMPTY_INPUT: () => 
      'Input code is empty',
    INVALID_INPUT_TYPE: () => 
      'Input must be a non-empty string'
  },
  
  // Warning messages
  WARNING_MESSAGES: {
    HIGH_LC_USAGE: (count, max) => 
      `High logic condition usage (${count}/${max}). Consider optimizing.`,
    VALUE_RANGE: (value, min, max, field) => 
      `${field} value ${value} outside valid range (${min}-${max})`,
    UNINITIALIZED: (gvar) => 
      `${gvar} is used but never initialized. Will default to 0.`,
    DEAD_CODE: () => 
      'Unreachable code: condition is always false',
    ALWAYS_TRUE: () => 
      'Condition is always true, consider using on.always instead',
    RACE_CONDITION: (target) => 
      `Multiple on.always handlers write to '${target}'. Execution order is undefined.`,
    MULTIPLE_ASSIGNMENTS: (target, handler, lines) => 
      `Multiple assignments to '${target}' in ${handler} (lines: ${lines}). Last assignment wins.`,
    INCOMPLETE_ACCESS: (path) => 
      `'${path}' needs a property. Did you mean to access a specific property?`,
    ARG_COUNT_MISMATCH: (handler, expected, got) => 
      `${handler} expects ${expected} arguments, got ${got}`,
    INVALID_FUNCTION_TYPE: (handler, expected) => 
      `${handler} ${expected} must be an arrow function`
  }
};

export { INAV_CONSTANTS };
