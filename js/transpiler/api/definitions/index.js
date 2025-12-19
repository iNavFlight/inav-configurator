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
import override from './override.js';
import rc from './rc.js';
import gvar from './gvar.js';
import waypoint from './waypoint.js';
import pid from './pid.js';
import helpers from './helpers.js';
import events from './events.js';

export default {
  // Read-only telemetry and state
  flight,

  // Writable overrides
  override,

  // RC receiver channels
  rc,

  // Global variables (read/write)
  gvar,

  // Waypoint navigation
  waypoint,

  // Programming PID controllers
  pid,

  // Helper functions (min, max, abs, sin, cos, etc.)
  helpers,

  // Event handlers (on, sticky, etc.)
  events
};
