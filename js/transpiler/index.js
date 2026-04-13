/**
 * INAV JavaScript Transpiler - Module Entry Point
 * 
 * Location: tabs/programming/transpiler/index.js
 * 
 * Main entry point for the INAV JavaScript Transpiler module.
 * Can be imported from anywhere in the configurator.
 * 
 * Usage from tabs/programming/javascript_programming.js:
 *   const Transpiler = require('./transpiler/index.js');
 *   const transpiler = new Transpiler();
 *   const result = transpiler.transpile(code);
 */

// Core transpiler
import { Transpiler } from './transpiler/index.js';
import { JavaScriptParser } from './transpiler/parser.js';
import { INAVCodeGenerator } from './transpiler/codegen.js';

// API definitions
import apiDefinitions from './api/definitions/index.js';
import flightDefinitions from './api/definitions/flight.js';
import waypointDefinitions from './api/definitions/waypoint.js';
import rcDefinitions from './api/definitions/rc.js';

// Type generation
import { generateTypeDefinitions } from './api/types.js';

// Examples
import examples from './examples/index.js';

// Export everything using ESM
export {
  Transpiler,
  JavaScriptParser,
  INAVCodeGenerator,
  apiDefinitions,
  flightDefinitions,
  waypointDefinitions,
  rcDefinitions,
  generateTypeDefinitions,
  examples
};

