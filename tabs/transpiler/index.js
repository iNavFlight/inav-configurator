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

// Core transpiler - require instead of import
const { Transpiler } = require('./transpiler/index.js');
const { JavaScriptParser } = require('./transpiler/parser.js');
const { INAVCodeGenerator } = require('./transpiler/codegen.js');

// API definitions
const apiDefinitions = require('./api/definitions/index.js');
const flightDefinitions = require('./api/definitions/flight.js');
const overrideDefinitions = require('./api/definitions/override.js');
const waypointDefinitions = require('./api/definitions/waypoint.js');
const rcDefinitions = require('./api/definitions/rc.js');

// Type generation
const { generateTypeDefinitions } = require('./api/types.js');

// Examples
const examples = require('./examples/index.js');

// Export everything using CommonJS
module.exports = Transpiler;
module.exports.Transpiler = Transpiler;
module.exports.JavaScriptParser = JavaScriptParser;
module.exports.INAVCodeGenerator = INAVCodeGenerator;
module.exports.apiDefinitions = apiDefinitions;
module.exports.flightDefinitions = flightDefinitions;
module.exports.overrideDefinitions = overrideDefinitions;
module.exports.waypointDefinitions = waypointDefinitions;
module.exports.rcDefinitions = rcDefinitions;
module.exports.generateTypeDefinitions = generateTypeDefinitions;
module.exports.examples = examples;

