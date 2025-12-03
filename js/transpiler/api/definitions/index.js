/**
 * INAV API Definitions - Main Export
 * 
 * Location: js/transpiler/api/definitions/index.js
 * 
 * Exports all API definitions as a single object.
 * This is the SINGLE SOURCE OF TRUTH for INAV JavaScript API.
 */

'use strict';

import flight from './flight.js';
import rc from './rc.js';
import waypoint from './waypoint.js';
import pid from './pid.js';
import helpers from './helpers.js';
import events from './events.js';

export default {
  // Read-only telemetry and state
  flight,

  // RC receiver channels
  rc,

  // Waypoint navigation
  waypoint,

  // Programming PID controllers
  pid,

  // Helper functions (min, max, abs, sin, cos, etc.)
  helpers,

  // Event handlers (on, sticky, etc.)
  events
};
