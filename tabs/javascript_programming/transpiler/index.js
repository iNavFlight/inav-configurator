/**
 * INAV JavaScript Transpiler - Module Entry Point
 * 
 * Location: tabs/programming/transpiler/index.js
 * 
 * Main entry point for the INAV JavaScript Transpiler module.
 * Can be imported from anywhere in the configurator.
 * 
 * Usage from tabs/programming/programming.js:
 *   import { Transpiler } from './transpiler/index.js';
 *   const transpiler = new Transpiler();
 *   const result = transpiler.transpile(code);
 */

// Core transpiler
export { Transpiler } from './transpiler/index.js';
export { JavaScriptParser } from './transpiler/parser.js';
export { INAVCodeGenerator } from './transpiler/codegen.js';

// API definitions
export { 
  apiDefinitions,
  getDefinition,
  getProperties,
  isWritable,
  getINAVOperand,
  getINAVOperation
} from './api/definitions/index.js';

export { flightDefinitions } from './api/definitions/flight.js';
export { overrideDefinitions } from './api/definitions/override.js';
export { waypointDefinitions } from './api/definitions/waypoint.js';
export { rcDefinitions } from './api/definitions/rc.js';

// Type generation
export { generateTypeDefinitions } from './api/types.js';

// Editor support (will be created when Monaco is integrated)
// export { setupMonaco } from './editor/monaco-setup.js';
// export { createDiagnosticsProvider } from './editor/diagnostics.js';

// Examples
export { examples, getExample, getExamplesByCategory } from './examples/index.js';

// Default export - main transpiler
import { Transpiler } from './transpiler/index.js';
export default Transpiler;