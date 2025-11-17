/**
 * INAV API Type Definitions
 * JSDoc type definitions for IDE support
 * 
 * Location: tabs/programming/transpiler/api/types.js
 */

/**
 * @typedef {Object} APIDefinition
 * @property {string} type - Value type (number, boolean, object, array, function)
 * @property {string} [unit] - Unit of measurement (m, cm, s, %, °, etc)
 * @property {string} desc - Human-readable description
 * @property {Object} [inavOperand] - INAV operand mapping
 * @property {number} [inavOperand.type] - INAV operand type ID
 * @property {number} [inavOperand.value] - INAV operand value
 * @property {number} [inavOperation] - INAV operation ID
 * @property {[number, number]} [range] - Valid value range [min, max]
 */

/**
 * @typedef {Object.<string, APIDefinition|Object>} APICategory
 */

/**
 * Generate TypeScript-style type definitions from API definitions
 * @param {Object} apiDefinitions - Complete API definitions object
 * @returns {string} TypeScript definition string for Monaco
 */
export function generateTypeDefinitions(apiDefinitions) {
  let dts = `
/**
 * INAV JavaScript API
 * Auto-generated type definitions
 */

declare namespace inav {
`;

  // Generate flight interface
  dts += generateInterfaceFromDefinition('flight', apiDefinitions.flight);
  dts += generateInterfaceFromDefinition('rc', apiDefinitions.rc);
  dts += generateInterfaceFromDefinition('override', apiDefinitions.override);
  dts += generateInterfaceFromDefinition('waypoint', apiDefinitions.waypoint);
  
  // Add special types
  dts += `
  /** Global variables (read-write) */
  const gvar: number[];
  
  /** Programming PID controllers */
  interface PIDController {
    configure(config: {
      setpoint: number,
      measurement: number,
      p: number,
      i: number,
      d: number,
      ff: number
    }): void;
    readonly output: number;
  }
  const pid: PIDController[];
  
  /** Event handlers */
  namespace on {
    function arm(config: { delay: number }, callback: () => void): void;
    function always(callback: () => void): void;
  }
  
  function when(condition: () => boolean, action: () => void): void;
  function sticky(onCondition: () => boolean, offCondition: () => boolean, action: () => void): void;
  function edge(condition: () => boolean, durationMs: number, action: () => void): void;
  function delay(condition: () => boolean, delayMs: number, action: () => void): void;
  function timer(onMs: number, offMs: number, action: () => void): void;
  function whenChanged(value: number, threshold: number, action: () => void): void;
  
  /** Math utilities */
  function min(a: number, b: number): number;
  function max(a: number, b: number): number;
  function abs(value: number): number;
  function sin(degrees: number): number;
  function cos(degrees: number): number;
  function tan(degrees: number): number;
  function mapInput(value: number, maxInput: number): number;
  function mapOutput(value: number, maxOutput: number): number;
}
`;

  dts += '\n}'; // Close namespace
  
  return dts;
}

/**
 * Generate TypeScript interface from API definition object
 * @param {string} name - Interface name
 * @param {Object} definitions - Definition object
 * @returns {string} TypeScript interface string
 */
function generateInterfaceFromDefinition(name, definitions) {
  let result = `\n  /** ${capitalize(name)} parameters */\n  interface ${capitalize(name)} {\n`;
  
  for (const [key, def] of Object.entries(definitions)) {
    if (typeof def.type !== 'undefined') {
      // Simple property
      const readonly = (name === 'flight' || name === 'waypoint') ? 'readonly ' : '';
      const tsType = mapJSTypeToTS(def.type);
      const comment = def.desc + (def.unit ? ` (${def.unit})` : '');
      result += `    /** ${comment} */\n`;
      result += `    ${readonly}${key}: ${tsType};\n`;
    } else {
      // Nested object
      result += `    ${key}: {\n`;
      for (const [subKey, subDef] of Object.entries(def)) {
        const tsType = mapJSTypeToTS(subDef.type);
        const comment = subDef.desc + (subDef.unit ? ` (${subDef.unit})` : '');
        result += `      /** ${comment} */\n`;
        result += `      ${subKey}: ${tsType};\n`;
      }
      result += `    };\n`;
    }
  }
  
  result += `  }\n  const ${name}: ${capitalize(name)};\n`;
  return result;
}

/**
 * Map JavaScript types to TypeScript types
 * @param {string} jsType - JavaScript type string
 * @returns {string} TypeScript type string
 */
function mapJSTypeToTS(jsType) {
  const typeMap = {
    'number': 'number',
    'boolean': 'boolean',
    'string': 'string',
    'array': 'any[]',
    'object': 'object',
    'function': 'Function'
  };
  return typeMap[jsType] || 'any';
}

/**
 * Capitalize first letter
 * @param {string} str - Input string
 * @returns {string} Capitalized string
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}