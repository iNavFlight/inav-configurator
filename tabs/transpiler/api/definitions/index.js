/**
 * INAV API Definitions - Main Export
 * 
 * Location: tabs/transpiler/api/definitions/index.js
 * 
 * Exports all API definitions as a single object.
 * This is the SINGLE SOURCE OF TRUTH for INAV JavaScript API.
 */

'use strict';

module.exports = {
  // Read-only telemetry and state
  flight: require('./flight.js'),
  
  // Writable overrides
  override: require('./override.js'),
  
  // RC receiver channels
  rc: require('./rc.js'),
  
  // Global variables (read/write)
  gvar: require('./gvar.js'),
  
  // Waypoint navigation
  waypoint: require('./waypoint.js'),
  
  // Programming PID controllers
  pid: require('./pid.js'),
  
  // Helper functions (min, max, abs, sin, cos, etc.)
  helpers: require('./helpers.js'),
  
  // Event handlers (on, when, sticky, etc.)
  events: require('./events.js')
};