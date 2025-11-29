#!/usr/bin/env node
/**
 * Generate inav_constants.js from INAV firmware header files
 * 
 * This script parses logic_condition.h to extract enum values and generates
 * a JavaScript constants file that matches the actual firmware.
 * 
 * Usage: node generate-constants.js <path-to-logic_condition.h> <output-path>
 */

'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse C enum from header file
 * Handles both formats:
 *   typedef enum name { ... }
 *   typedef enum { ... } name;
 * @param {string} content - File content
 * @param {string} enumName - Name of enum to extract (the _e suffix name)
 * @returns {Object} Map of constant names to values
 */
function parseEnum(content, enumName) {
    // Try format: typedef enum { ... } name_e;
    let enumPattern = new RegExp(`typedef\\s+enum\\s*\\{([^}]+)\\}\\s*${enumName}\\s*;`, 's');
    let match = content.match(enumPattern);
    
    if (!match) {
        // Try format: typedef enum name { ... }
        enumPattern = new RegExp(`typedef\\s+enum\\s+${enumName}\\s*\\{([^}]+)\\}`, 's');
        match = content.match(enumPattern);
    }
    
    if (!match) {
        console.warn(`Warning: Could not find enum ${enumName}`);
        return {};
    }
    
    const enumBody = match[1];
    const constants = {};
    let currentValue = 0;
    
    // Parse each line of the enum
    const lines = enumBody.split('\n');
    
    for (const line of lines) {
        // Remove comments
        const cleaned = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '').trim();
        if (!cleaned || cleaned.startsWith('//')) continue;
        
        // Match: CONSTANT_NAME = value, or just CONSTANT_NAME,
        const constantMatch = cleaned.match(/^([A-Z_][A-Z0-9_]*)\s*(?:=\s*(\d+|0x[0-9A-Fa-f]+))?\s*,?/);
        
        if (constantMatch) {
            const name = constantMatch[1];
            
            if (constantMatch[2]) {
                // Explicit value
                currentValue = constantMatch[2].startsWith('0x') 
                    ? parseInt(constantMatch[2], 16)
                    : parseInt(constantMatch[2], 10);
            }
            
            constants[name] = currentValue;
            currentValue++;
        }
    }
    
    return constants;
}

/**
 * Convert C enum constant names to JavaScript style
 * LOGIC_CONDITION_TRUE -> TRUE
 * LOGIC_CONDITION_OPERAND_FLIGHT_ARM_TIMER -> ARM_TIMER
 * Also handles identifiers starting with numbers: 3D_SPEED -> SPEED_3D
 * And fixes typos from firmware headers
 */
function convertConstantName(cName, prefix) {
    let jsName = cName.replace(new RegExp(`^${prefix}_?`), '');
    
    // Fix identifiers that start with numbers (invalid in JS)
    // 3D_SPEED -> SPEED_3D
    // 3D_HOME_DISTANCE -> HOME_DISTANCE_3D
    if (/^\d/.test(jsName)) {
        const match = jsName.match(/^(\d+)D?_(.+)$/);
        if (match) {
            jsName = `${match[2]}_${match[1]}D`;
        }
    }
    
    // Fix firmware typos and inconsistencies
    const fixes = {
        // Typos in firmware header
        'GROUD_SPEED': 'GROUND_SPEED',
        'TROTTLE_POS': 'THROTTLE_POS',
        
        // Simplify ATTITUDE_ prefix (keep consistency with old file)
        'ATTITUDE_ROLL': 'ROLL',
        'ATTITUDE_PITCH': 'PITCH', 
        'ATTITUDE_YAW': 'YAW',
        
        // Fix CRSF naming for consistency
        'LQ_UPLINK': 'CRSF_LQ_UPLINK',
        'LQ_DOWNLINK': 'CRSF_LQ_DOWNLINK',
        'SNR': 'CRSF_SNR',
        'UPLINK_RSSI_DBM': 'CRSF_RSSI_DBM',
        
        // Fix waypoint typo
        'LOGIC_CONDTIION_OPERAND_WAYPOINTS_DISTANCE_FROM_WAYPOINT': 'DISTANCE_FROM_WAYPOINT'
    };
    
    if (fixes[jsName]) {
        jsName = fixes[jsName];
    }
    
    return jsName;
}

/**
 * Generate JavaScript constants object
 */
function generateJSConstants(constants, jsName, cPrefix) {
    const entries = Object.entries(constants)
        .filter(([name]) => !name.includes('_LAST')) // Exclude _LAST sentinel values
        .map(([cName, value]) => {
            const jsConstName = convertConstantName(cName, cPrefix);
            const comment = `  ${jsConstName}: ${value},`;
            return comment;
        });
    
    return `const ${jsName} = {\n${entries.join('\n')}\n};`;
}

/**
 * Generate human-readable names mapping
 */
function generateNamesMapping(constants, cPrefix, transform = null) {
    const entries = Object.entries(constants)
        .filter(([name]) => !name.includes('_LAST'))
        .map(([cName, value]) => {
            const jsConstName = convertConstantName(cName, cPrefix);
            let displayName = jsConstName.toLowerCase()
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            
            if (transform) {
                displayName = transform(jsConstName, displayName);
            }
            
            return `  [${value}]: '${displayName}',`;
        });
    
    return entries.join('\n');
}

/**
 * Main generation function
 */
function generateConstants(headerPath, outputPath) {
    console.log('Reading firmware header:', headerPath);
    const content = fs.readFileSync(headerPath, 'utf8');
    
    console.log('Parsing enums...');
    
    // Parse all relevant enums
    const operations = parseEnum(content, 'logicOperation_e');
    const operandTypes = parseEnum(content, 'logicOperandType_s');
    const flightParams = parseEnum(content, 'logicFlightOperands_e');
    const flightModes = parseEnum(content, 'logicFlightModeOperands_e');
    const waypointParams = parseEnum(content, 'logicWaypointOperands_e');
    
    console.log(`Found ${Object.keys(operations).length} operations`);
    console.log(`Found ${Object.keys(operandTypes).length} operand types`);
    console.log(`Found ${Object.keys(flightParams).length} flight parameters`);
    console.log(`Found ${Object.keys(flightModes).length} flight modes`);
    console.log(`Found ${Object.keys(waypointParams).length} waypoint parameters`);
    
    // Generate JavaScript file
    const output = `/**
 * INAV Logic Condition Constants
 * 
 * AUTO-GENERATED from firmware header files
 * DO NOT EDIT MANUALLY - run generate-constants.js instead
 * 
 * Source: logic_condition.h
 * Generated: ${new Date().toISOString()}
 */

'use strict';

/**
 * Logic condition operand types
 */
${generateJSConstants(operandTypes, 'OPERAND_TYPE', 'LOGIC_CONDITION_OPERAND_TYPE')}

/**
 * Logic condition operations
 */
${generateJSConstants(operations, 'OPERATION', 'LOGIC_CONDITION')}

/**
 * Flight parameters (operand value for OPERAND_TYPE.FLIGHT)
 */
${generateJSConstants(flightParams, 'FLIGHT_PARAM', 'LOGIC_CONDITION_OPERAND_FLIGHT')}

/**
 * Flight modes (operand value for OPERAND_TYPE.FLIGHT_MODE)
 */
${generateJSConstants(flightModes, 'FLIGHT_MODE', 'LOGIC_CONDITION_OPERAND_FLIGHT_MODE')}

/**
 * Waypoint parameters (operand value for OPERAND_TYPE.WAYPOINTS)
 */
${generateJSConstants(waypointParams, 'WAYPOINT_PARAM', 'LOGIC_CONDITION_OPERAND_WAYPOINTS')}

/**
 * RC channel configuration
 */
const RC_CHANNEL = {
  MIN_CHANNEL: 1,
  MAX_CHANNEL: 18
};

/**
 * Global variable configuration
 */
const GVAR_CONFIG = {
  COUNT: 8,
  MIN_VALUE: -1000000,
  MAX_VALUE: 1000000
};

/**
 * VTX configuration
 */
const VTX = {
  POWER: { MIN: 0, MAX: 4 },
  BAND: { MIN: 0, MAX: 5 },
  CHANNEL: { MIN: 0, MAX: 8 }
};

/**
 * Human-readable operation names
 */
const OPERATION_NAMES = {
${generateNamesMapping(operations, 'LOGIC_CONDITION')}
};

/**
 * Human-readable flight parameter names
 */
const FLIGHT_PARAM_NAMES = {
${generateNamesMapping(flightParams, 'LOGIC_CONDITION_OPERAND_FLIGHT', (jsName, displayName) => {
    // Convert to camelCase for property names
    return jsName.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
})}
};

/**
 * Helper functions
 */
function getFlightParamName(paramId) {
  return FLIGHT_PARAM_NAMES[paramId] || \`unknown_param_\${paramId}\`;
}

function getOperationName(operationId) {
  return OPERATION_NAMES[operationId] || \`unknown_operation_\${operationId}\`;
}

function isValidGvarIndex(index) {
  return index >= 0 && index < GVAR_CONFIG.COUNT;
}

function isValidRCChannel(channel) {
  return channel >= RC_CHANNEL.MIN_CHANNEL && channel <= RC_CHANNEL.MAX_CHANNEL;
}

module.exports = {
  OPERAND_TYPE,
  OPERATION,
  FLIGHT_PARAM,
  FLIGHT_MODE,
  WAYPOINT_PARAM,
  FLIGHT_PARAM_NAMES,
  OPERATION_NAMES,
  RC_CHANNEL,
  GVAR_CONFIG,
  VTX,
  
  // Helper functions
  getFlightParamName,
  getOperationName,
  isValidGvarIndex,
  isValidRCChannel
};
`;
    
    console.log('Writing output to:', outputPath);
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log('✓ Successfully generated inav_constants.js');
    console.log(`  Operations: ${Object.keys(operations).length - 1}`); // -1 for _LAST
    console.log(`  Flight params: ${Object.keys(flightParams).length - 1}`);
    console.log(`  Flight modes: ${Object.keys(flightModes).length}`);
    console.log(`  Waypoint params: ${Object.keys(waypointParams).length}`);
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.error('Usage: node generate-constants.js <path-to-logic_condition.h> [output-path]');
        console.error('Example: node generate-constants.js ../firmware/logic_condition.h ../js/transpiler/transpiler/inav_constants.js');
        process.exit(1);
    }
    
    const headerPath = args[0];
    const outputPath = args[1] || path.join(__dirname, '../js/transpiler/transpiler/inav_constants.js');
    
    if (!fs.existsSync(headerPath)) {
        console.error('Error: Header file not found:', headerPath);
        process.exit(1);
    }
    
    try {
        generateConstants(headerPath, outputPath);
    } catch (error) {
        console.error('Error generating constants:', error);
        process.exit(1);
    }
}

module.exports = { generateConstants, parseEnum };
