/**
 * API Mapping Utility
 *
 * Location: js/transpiler/transpiler/api_mapping_utility.js
 *
 * Shared utility for building API mappings from centralized definitions.
 * Used by codegen, analyzer, and decompiler to avoid code duplication.
 */

'use strict';

/**
 * Build forward mapping: property path → operand
 * Used by codegen.js for translating JavaScript properties to INAV operands
 *
 * @param {Object} definitions - API definitions from api/definitions/index.js
 * @returns {Object} Mapping of property paths to operand objects
 *
 * Example output:
 * {
 *   "inav.flight.altitude": { type: 3, value: 1 },
 *   "inav.override.throttle": { operation: 24 }
 * }
 */
export function buildForwardMapping(definitions) {
  const mapping = {};

  for (const [objName, objDef] of Object.entries(definitions)) {
    if (!objDef || typeof objDef !== 'object') continue;

    for (const [propName, propDef] of Object.entries(objDef)) {
      if (!propDef || typeof propDef !== 'object') continue;

      // Direct property with operand mapping
      if (propDef.inavOperand) {
        const path = `inav.${objName}.${propName}`;
        mapping[path] = propDef.inavOperand;
      }

      // Nested object (e.g., inav.flight.mode, inav.override.vtx)
      if (propDef.type === 'object' && propDef.properties) {
        for (const [nestedName, nestedDef] of Object.entries(propDef.properties)) {
          if (!nestedDef || typeof nestedDef !== 'object') continue;

          const path2 = `inav.${objName}.${propName}.${nestedName}`;

          // Extract inavOperand (for read operands)
          if (nestedDef.inavOperand) {
            mapping[path2] = nestedDef.inavOperand;
          }

          // Extract inavOperation (for write operations)
          if (nestedDef.inavOperation) {
            if (!mapping[path2]) mapping[path2] = {};
            mapping[path2].operation = nestedDef.inavOperation;
          }

          // Handle 3rd level nesting (e.g., override.flightAxis.roll.angle)
          if (nestedDef.type === 'object' && nestedDef.properties) {
            for (const [deepName, deepDef] of Object.entries(nestedDef.properties)) {
              if (!deepDef || typeof deepDef !== 'object') continue;

              const path3 = `${path2}.${deepName}`;

              if (deepDef.inavOperand) {
                mapping[path3] = deepDef.inavOperand;
              }

              if (deepDef.inavOperation) {
                if (!mapping[path3]) mapping[path3] = {};
                mapping[path3].operation = deepDef.inavOperation;
              }
            }
          }
        }
      }

      // Operation mapping for writable properties (top-level)
      if (propDef.inavOperation) {
        const path = `inav.${objName}.${propName}`;
        if (!mapping[path]) mapping[path] = {};
        mapping[path].operation = propDef.inavOperation;
      }
    }
  }

  return mapping;
}

/**
 * Build reverse mapping: operand → property path
 * Used by decompiler.js for translating INAV operands back to JavaScript properties
 *
 * @param {Object} definitions - API definitions from api/definitions/index.js
 * @returns {Object} Mapping of operand values to property names, grouped by object type
 *
 * Example output:
 * {
 *   flight: { 1: "inav.flight.altitude", 2: "inav.flight.speed" },
 *   waypoint: { 0: "inav.waypoint.distance", 1: "inav.waypoint.bearing" }
 * }
 */
export function buildReverseMapping(definitions) {
  const mapping = {};

  // Initialize top-level objects
  for (const objName of Object.keys(definitions)) {
    mapping[objName] = {};
  }

  // Process each API object
  for (const [objName, objDef] of Object.entries(definitions)) {
    if (!objDef || typeof objDef !== 'object') continue;

    // Process properties
    for (const [propName, propDef] of Object.entries(objDef)) {
      if (!propDef || typeof propDef !== 'object') continue;

      // Direct property with operand mapping
      if (propDef.inavOperand) {
        const { type, value } = propDef.inavOperand;

        if (typeof value !== 'undefined' && !mapping[objName][value]) {
          mapping[objName][value] = `inav.${objName}.${propName}`;
        }
      }

      // Nested object (e.g., inav.flight.mode, inav.override.vtx)
      if (propDef.type === 'object' && propDef.properties) {
        for (const [nestedName, nestedDef] of Object.entries(propDef.properties)) {
          if (nestedDef && nestedDef.inavOperand) {
            const { type, value } = nestedDef.inavOperand;

            if (typeof value !== 'undefined' && !mapping[objName][value]) {
              mapping[objName][value] = `inav.${objName}.${propName}.${nestedName}`;
            }
          }
        }
      }
    }
  }

  return mapping;
}

/**
 * Build API structure for validation
 * Used by analyzer.js for validating property access and assignments
 *
 * @param {Object} definitions - API definitions from api/definitions/index.js
 * @returns {Object} Validation structure with properties, nested objects, methods, and targets
 *
 * Example output:
 * {
 *   flight: {
 *     properties: ["altitude", "speed"],
 *     nested: { mode: ["failsafe", "manual"] },
 *     methods: [],
 *     targets: []
 *   }
 * }
 */
export function buildAPIStructure(definitions) {
  const api = {};

  // Process each top-level API object (flight, override, rc, etc.)
  for (const [key, def] of Object.entries(definitions)) {
    if (!def || typeof def !== 'object') continue;

    api[key] = {
      properties: [],
      nested: {},
      methods: [],
      targets: []
    };

    // Extract properties and nested objects
    for (const [propKey, propDef] of Object.entries(def)) {
      if (!propDef || typeof propDef !== 'object') continue;

      // Check if this is a nested object (has its own properties)
      if (propDef.type === 'object' && propDef.properties) {
        // It's a nested object like flight.mode or override.vtx
        api[key].nested[propKey] = [];

        for (const [nestedKey, nestedDef] of Object.entries(propDef.properties)) {
          if (nestedDef && typeof nestedDef === 'object') {
            api[key].nested[propKey].push(nestedKey);
          }
        }
      } else if (propDef.type) {
        // It's a direct property
        api[key].properties.push(propKey);

        // Track writable properties for override
        if (key === 'override' && !propDef.readonly) {
          api[key].targets.push(propKey);
        }
      }

      // Track methods
      if (propDef.type === 'function') {
        api[key].methods.push(propKey);
      }
    }
  }

  return api;
}
