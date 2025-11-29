/**
 * INAV Logic Conditions Decompiler
 *
 * Location: js/transpiler/transpiler/decompiler.js
 *
 * Converts INAV logic conditions back to JavaScript code.
 * Note: This is lossy - comments, variable names, and some structure is lost.
 */

'use strict';

import {
  OPERAND_TYPE,
  OPERATION,
  FLIGHT_MODE,
  getFlightParamName,
  getOperationName
} from './inav_constants.js';
import apiDefinitions from './../api/definitions/index.js';
import { ConditionDecompiler } from './condition_decompiler.js';
import { ActionDecompiler } from './action_decompiler.js';
import { buildReverseMapping } from './api_mapping_utility.js';

/**
 * Decompiler class
 */
class Decompiler {
  constructor() {
    this.warnings = [];
    this.variableMap = null;

    // Build reverse mapping from API definitions
    // Maps operand values back to property paths
    this.operandToProperty = buildReverseMapping(apiDefinitions);

    // Flight mode names mapping
    this.flightModeNames = {
      [FLIGHT_MODE.FAILSAFE]: 'failsafe',
      [FLIGHT_MODE.MANUAL]: 'manual',
      [FLIGHT_MODE.RTH]: 'rth',
      [FLIGHT_MODE.POSHOLD]: 'poshold',
      [FLIGHT_MODE.CRUISE]: 'cruise',
      [FLIGHT_MODE.ALTHOLD]: 'althold',
      [FLIGHT_MODE.ANGLE]: 'angle',
      [FLIGHT_MODE.HORIZON]: 'horizon',
      [FLIGHT_MODE.AIR]: 'air',
      [FLIGHT_MODE.USER1]: 'user1',
      [FLIGHT_MODE.USER2]: 'user2',
      [FLIGHT_MODE.COURSE_HOLD]: 'courseHold',
      [FLIGHT_MODE.USER3]: 'user3',
      [FLIGHT_MODE.USER4]: 'user4',
      [FLIGHT_MODE.ACRO]: 'acro',
      [FLIGHT_MODE.WAYPOINT_MISSION]: 'waypointMission',
      [FLIGHT_MODE.ANGLEHOLD]: 'anglehold'
    };

    // Initialize helper classes with dependency injection
    const context = {
      decompileOperand: this.decompileOperand.bind(this),
      getVarNameForGvar: this.getVarNameForGvar.bind(this),
      addWarning: this.addWarning.bind(this)
    };

    this.conditionDecompiler = new ConditionDecompiler(context);
    this.actionDecompiler = new ActionDecompiler(context);
  }

  /**
   * Add a warning to the warning list
   * @param {string} message - Warning message
   */
  addWarning(message) {
    this.warnings.push(message);
  }

  /**
   * Get property name from operand value
   * Uses centralized API definitions
   */
  getPropertyFromOperand(objectType, operandValue) {
    // Map operand types to object names
    const typeToObject = {
      [OPERAND_TYPE.FLIGHT]: 'flight',
      [OPERAND_TYPE.WAYPOINTS]: 'waypoint'
    };

    const objName = typeToObject[objectType];
    if (!objName) return null;

    // Look up in mapping
    if (this.operandToProperty[objName] && this.operandToProperty[objName][operandValue]) {
      return `${objName}.${this.operandToProperty[objName][operandValue]}`;
    }

    return null;
  }

  /**
   * Check if an operation is an action (not a condition)
   * Action operations modify state rather than evaluate to true/false
   * @param {number} operation - Operation code
   * @returns {boolean} True if this is an action operation
   */
  isActionOperation(operation) {
    const actionOperations = [
      OPERATION.GVAR_SET,
      OPERATION.GVAR_INC,
      OPERATION.GVAR_DEC,
      OPERATION.PORT_SET,
      OPERATION.OVERRIDE_ARMING_SAFETY,
      OPERATION.OVERRIDE_THROTTLE_SCALE,
      OPERATION.SWAP_ROLL_YAW,
      OPERATION.SET_VTX_POWER_LEVEL,
      OPERATION.INVERT_ROLL,
      OPERATION.INVERT_PITCH,
      OPERATION.INVERT_YAW,
      OPERATION.OVERRIDE_THROTTLE,
      OPERATION.SET_VTX_BAND,
      OPERATION.SET_VTX_CHANNEL,
      OPERATION.SET_OSD_LAYOUT,
      OPERATION.RC_CHANNEL_OVERRIDE,
      OPERATION.SET_HEADING_TARGET,
      OPERATION.LOITER_OVERRIDE,
      OPERATION.SET_PROFILE,
      OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE,
      OPERATION.FLIGHT_AXIS_RATE_OVERRIDE,
      OPERATION.LED_PIN_PWM,
      OPERATION.DISABLE_GPS_FIX,
      OPERATION.RESET_MAG_CALIBRATION,
      OPERATION.SET_GIMBAL_SENSITIVITY
    ];
    return actionOperations.includes(operation);
  }

  /**
   * Check if a GVAR_SET logic condition is a var initialization from the variable map
   * These are already shown in the declarations section, so we skip them
   * @param {Object} lc - Logic condition
   * @returns {boolean} True if this is a var initialization
   */
  isVarInitialization(lc) {
    if (!this.variableMap || !this.variableMap.var_variables) {
      return false;
    }

    const gvarIndex = lc.operandAValue;

    for (const [name, info] of Object.entries(this.variableMap.var_variables)) {
      if (info.gvar === gvarIndex) {
        return true;
      }
    }

    return false;
  }

  /**
   * Main decompilation function
   * @param {Array} logicConditions - Array of logic condition objects from FC
   * @param {Object} variableMap - Optional variable map for name preservation
   * @returns {Object} Decompilation result with code and metadata
   */
  decompile(logicConditions, variableMap = null) {
    this.warnings = [];
    this.variableMap = variableMap;

    if (!logicConditions || !Array.isArray(logicConditions)) {
      return {
        success: false,
        error: 'Invalid logic conditions array',
        code: '',
        warnings: []
      };
    }

    // Filter enabled conditions, tracking gaps for formatting
    const enabled = [];
    let consecutiveGaps = 0;
    for (const lc of logicConditions) {
        // Track unused slots - consecutive gaps become line breaks for readability
        if (lc.enabled === 0 && lc.operation === 0 && lc.activatorId === -1) {
            consecutiveGaps++;
            continue;
        }
        // Insert a gap marker if we had unused slots before this condition
        if (consecutiveGaps > 0 && enabled.length > 0) {
            enabled.push({ _gap: true });
            consecutiveGaps = 0;
        }
        if (lc.enabled) {
            enabled.push(lc);
            consecutiveGaps = 0;
        }
    }

    if (enabled.length === 0) {
      this.addWarning('No enabled logic conditions found');
      return {
        success: true,
        code: this.generateBoilerplate('// No logic conditions found'),
        warnings: this.warnings,
        stats: { total: logicConditions.length, enabled: 0, groups: 0 }
      };
    }

    // Group conditions by their structure
    const groups = this.groupConditions(enabled);

    // Generate code for each group (pass enabled conditions for pattern detection)
    const codeBlocks = [];
    for (const group of groups) {
      // Gap markers become empty strings (extra blank line when joined)
      if (group._gap) {
        codeBlocks.push('');
        continue;
      }
      const code = this.decompileGroup(group, enabled);
      if (code) {
        codeBlocks.push(code);
      }
    }

    const code = this.generateBoilerplate(codeBlocks.join('\n\n'));

    return {
      success: true,
      code,
      warnings: this.warnings,
      stats: {
        total: logicConditions.length,
        enabled: enabled.length,
        groups: groups.length
      }
    };
  }

  /**
   * Detect if a group uses edge/sticky/delay pattern
   * Returns { type: 'edge'|'sticky'|'delay', params } or null
   * @param {Object} group - Group with activator and actions
   * @param {Array} allConditions - All enabled conditions for lookups
   * @returns {Object|null} Pattern detection result
   */
  detectSpecialPattern(group, allConditions) {
    if (!group.activator) return null;

    const activator = group.activator;

    // Check for EDGE pattern
    if (activator.operation === OPERATION.EDGE) {
      // operandA points to the condition LC
      // operandB is the duration
      const conditionId = activator.operandAValue;
      const duration = activator.operandBValue;

      // Find the condition LC
      const conditionLC = allConditions.find(lc => lc.index === conditionId);
      if (conditionLC) {
        return {
          type: 'edge',
          condition: this.decompileCondition(conditionLC, allConditions),
          duration: duration
        };
      }
    }

    // Check for STICKY pattern
    if (activator.operation === OPERATION.STICKY) {
      // operandA points to ON condition LC
      // operandB points to OFF condition LC
      const onConditionId = activator.operandAValue;
      const offConditionId = activator.operandBValue;

      const onLC = allConditions.find(lc => lc.index === onConditionId);
      const offLC = allConditions.find(lc => lc.index === offConditionId);

      if (onLC && offLC) {
        return {
          type: 'sticky',
          onCondition: this.decompileCondition(onLC, allConditions),
          offCondition: this.decompileCondition(offLC, allConditions)
        };
      }
    }

    // Check for DELAY pattern
    if (activator.operation === OPERATION.DELAY) {
      // operandA points to the condition LC
      // operandB is the duration
      const conditionId = activator.operandAValue;
      const duration = activator.operandBValue;

      const conditionLC = allConditions.find(lc => lc.index === conditionId);
      if (conditionLC) {
        return {
          type: 'delay',
          condition: this.decompileCondition(conditionLC, allConditions),
          duration: duration
        };
      }
    }

    // Check for TIMER pattern
    if (activator.operation === OPERATION.TIMER) {
      // operandA is ON duration (ms)
      // operandB is OFF duration (ms)
      // No condition - timer auto-toggles
      const onMs = activator.operandAValue;
      const offMs = activator.operandBValue;

      return {
        type: 'timer',
        onMs: onMs,
        offMs: offMs
      };
    }

    // Check for DELTA (whenChanged) pattern
    if (activator.operation === OPERATION.DELTA) {
      // operandA is the value to monitor
      // operandB is the threshold
      const valueOperand = this.decompileOperand(activator.operandAType, activator.operandAValue, allConditions);
      const threshold = activator.operandBValue;

      return {
        type: 'whenChanged',
        value: valueOperand,
        threshold: threshold
      };
    }

    return null;
  }

  /**
   * Recursively collect all descendants of a logic condition
   * @param {number} parentIndex - Index of parent LC
   * @param {Array} conditions - All conditions
   * @param {Set} collected - Set of already collected indices
   * @returns {Array} All descendant LCs
   */
  collectDescendants(parentIndex, conditions, collected) {
    const descendants = [];
    for (const lc of conditions) {
      if (lc.activatorId === parentIndex && !collected.has(lc.index)) {
        collected.add(lc.index);
        descendants.push(lc);
        // Recursively collect children of this LC
        const children = this.collectDescendants(lc.index, conditions, collected);
        descendants.push(...children);
      }
    }
    return descendants;
  }

  /**
   * Group logic conditions by activator relationships
   * @param {Array} conditions - Enabled logic conditions
   * @returns {Array} Array of condition groups
   */
  groupConditions(conditions) {
    const groups = [];
    const processed = new Set();
    const referencedBySpecialOps = new Set();

    // First pass: find conditions referenced by EDGE/STICKY/DELAY or as LC operands
    const referencedAsOperand = new Set();
    for (const lc of conditions) {
        // Skip gap markers in first pass
        if (lc._gap) continue;

        if (lc.operation === OPERATION.EDGE ||
            lc.operation === OPERATION.DELAY) {
            referencedBySpecialOps.add(lc.operandAValue); // operandA points to condition
        } else if (lc.operation === OPERATION.STICKY) {
            referencedBySpecialOps.add(lc.operandAValue); // ON condition
            referencedBySpecialOps.add(lc.operandBValue); // OFF condition
        }

        // Track LCs referenced as operands (operandType 4 = LC result)
        if (lc.operandAType === OPERAND_TYPE.LC) {
            referencedAsOperand.add(lc.operandAValue);
        }
        if (lc.operandBType === OPERAND_TYPE.LC) {
            referencedAsOperand.add(lc.operandBValue);
        }
    }


    for (const lc of conditions) {
      // Handle gap markers - insert blank line group
      if (lc._gap) {
        groups.push({ _gap: true });
        continue;
      }

      if (processed.has(lc.index)) continue;

      // Skip conditions only used by special operations
      if (referencedBySpecialOps.has(lc.index) && lc.activatorId === -1) {
          processed.add(lc.index);
          continue;
      }

      // Skip intermediate calculations (LCs only referenced as operands by other LCs)
      if (referencedAsOperand.has(lc.index) && lc.activatorId === -1 && !this.isActionOperation(lc.operation)) {
          processed.add(lc.index);
          continue;
      }

      // Root condition (activatorId === -1)
      if (lc.activatorId === -1) {
        // Check if this is an unconditional action (e.g., var initialization, top-level assignment)
        if (this.isActionOperation(lc.operation)) {
          // Skip var initializations - they're already shown in the declarations section
          if (lc.operation === OPERATION.GVAR_SET && this.isVarInitialization(lc)) {
            processed.add(lc.index);
            continue;
          }

          // Treat as unconditional action - no activator, just the action itself
          groups.push({
            activator: null,
            actions: [lc],
            isUnconditional: true
          });
          processed.add(lc.index);
          continue;
        }

        const group = {
          activator: lc,
          actions: []
        };

        processed.add(lc.index);

        // Recursively find ALL descendants (not just direct children)
        // This handles chains like: LC0 → LC1 → LC2 → LC3
        const descendants = this.collectDescendants(lc.index, conditions, processed);
        group.actions = descendants;

        groups.push(group);
      }
    }

    // Handle orphaned actions (actions without root conditions)
    for (const lc of conditions) {
      if (!processed.has(lc.index)) {
        this.addWarning(`Logic condition ${lc.index} has no valid activator`);
        groups.push({
          activator: null,
          actions: [lc]
        });
        processed.add(lc.index);
      }
    }

    return groups;
  }

  /**
   * Decompile a single logic condition that appears in an action context.
   * If it's an action operation, decompile as action. Otherwise, it's a
   * condition used for intermediate computation - decompile as a comment.
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for recursive resolution
   * @returns {string|null} JavaScript statement or null to skip
   */
  decompileActionOrCondition(lc, allConditions) {
    if (this.isActionOperation(lc.operation)) {
      return this.decompileAction(lc, allConditions);
    }
    // This is a condition operation with an activator - it computes an
    // intermediate value that other LCs can reference. Skip it silently
    // since it will be inlined when referenced.
    return null;
  }

  /**
   * Decompile a group (activator + actions)
   * @param {Object} group - Group with activator and actions
   * @param {Array} allConditions - All enabled conditions for pattern detection
   * @returns {string} JavaScript code
   */
  decompileGroup(group, allConditions) {
    if (!group.activator) {
      // Unconditional actions or orphaned actions - just decompile them
      const actions = group.actions.map(a => this.decompileActionOrCondition(a, allConditions)).filter(Boolean);
      // Don't warn for unconditional actions (var init, top-level assignments)
      if (!group.isUnconditional && actions.length === 0) {
        this.addWarning(`Group has no valid actions`);
      }
      return actions.join('\n');
    }

    // Check for special patterns (edge, sticky, delay)
    const pattern = this.detectSpecialPattern(group, allConditions);

    if (pattern) {
      // Decompile actions (filter out conditions used as intermediate values)
      const actions = group.actions.map(a => this.decompileActionOrCondition(a, allConditions)).filter(Boolean);

      if (actions.length === 0) {
        this.addWarning(`${pattern.type}() at index ${group.activator.index} has no actions`);
        return '';
      }

      const indent = '  ';
      const body = actions.map(a => indent + a).join('\n');

      // Generate the appropriate syntax
      if (pattern.type === 'edge') {
        return `edge(() => ${pattern.condition}, { duration: ${pattern.duration} }, () => {\n${body}\n});`;
      } else if (pattern.type === 'sticky') {
        return `sticky(() => ${pattern.onCondition}, () => ${pattern.offCondition}, () => {\n${body}\n});`;
      } else if (pattern.type === 'delay') {
        return `delay(() => ${pattern.condition}, { duration: ${pattern.duration} }, () => {\n${body}\n});`;
      } else if (pattern.type === 'timer') {
        return `timer(${pattern.onMs}, ${pattern.offMs}, () => {\n${body}\n});`;
      } else if (pattern.type === 'whenChanged') {
        return `whenChanged(${pattern.value}, ${pattern.threshold}, () => {\n${body}\n});`;
      }
    }

    // Build combined condition from activator and any chained conditions
    const conditionParts = [this.decompileCondition(group.activator, allConditions)];
    const actualActions = [];

    // Separate chained conditions from actions
    for (const lc of group.actions) {
      if (this.isActionOperation(lc.operation)) {
        actualActions.push(this.decompileAction(lc, allConditions));
      } else {
        // This is a condition in the chain - add it to the compound condition
        conditionParts.push(this.decompileCondition(lc, allConditions));
      }
    }

    const combinedCondition = conditionParts.join(' && ');

    if (actualActions.length === 0) {
      // No actions, but condition chains are still valid (can be read externally)
      // Output as a condition assignment or just the condition check
      return `if (${combinedCondition}) {\n  // Condition can be read by logicCondition[${group.activator.index}]\n}`;
    }

    // Generate if statement with combined condition
    const indent = '  ';
    const body = actualActions.map(a => indent + a).join('\n');

    return `if (${combinedCondition}) {\n${body}\n}`;
  }

  /**
   * Decompile a condition to JavaScript expression
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for recursive resolution
   * @returns {string} JavaScript expression
   */
  decompileCondition(lc, allConditions = null) {
    return this.conditionDecompiler.decompile(lc, allConditions);
  }

  /**
   * Decompile an action to JavaScript statement
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for recursive resolution
   * @returns {string} JavaScript statement
   */
  decompileAction(lc, allConditions = null) {
    return this.actionDecompiler.decompile(lc, allConditions);
  }

  /**
   * Decompile an operand to JavaScript expression
   * Uses centralized API definitions for property names
   * @param {number} type - Operand type
   * @param {number} value - Operand value
   * @param {Array} allConditions - All conditions for recursive resolution
   * @returns {string} JavaScript expression
   */
  decompileOperand(type, value, allConditions = null) {
    switch (type) {
      case OPERAND_TYPE.VALUE:
        return value.toString();

      case OPERAND_TYPE.GVAR: {
        // Check if we have a variable name for this gvar index
        const varName = this.getVarNameForGvar(value);
        return varName || `gvar[${value}]`;
      }

      case OPERAND_TYPE.RC_CHANNEL:
        return `rc[${value}]`;

      case OPERAND_TYPE.FLIGHT:
      case OPERAND_TYPE.WAYPOINTS: {
        // Try to get property name from API definitions
        const prop = this.getPropertyFromOperand(type, value);
        if (prop) {
          return prop;
        }

        // Fallback to flight param name
        const name = getFlightParamName(value);
        const objName = type === OPERAND_TYPE.FLIGHT ? 'flight' : 'waypoint';
        return `${objName}.${name}`;
      }

      case OPERAND_TYPE.FLIGHT_MODE: {
        // Flight modes are boolean flags accessed as flight.mode.name
        const modeName = this.flightModeNames[value];
        if (modeName) {
          return `flight.mode.${modeName}`;
        }

        this.addWarning(`Unknown flight mode value ${value}`);
        return `flight.mode[${value}] /* unknown mode */`;
      }

      case OPERAND_TYPE.LC:
        // Reference to another logic condition result
        // If we have access to all conditions, recursively resolve
        if (allConditions) {
          const referencedLC = allConditions.find(lc => lc.index === value);
          if (referencedLC) {
            // Recursively decompile the referenced condition
            return this.decompileCondition(referencedLC, allConditions);
          }
        }
        // Fallback to reference notation if we can't resolve
        return `logicCondition[${value}]`;

      case OPERAND_TYPE.PID:
        this.addWarning(`PID operand (value ${value}) is not supported in JavaScript API`);
        return `/* PID[${value}] */`;

      default:
        this.addWarning(`Unknown operand type ${type}`);
        return `/* unknown operand type ${type}, value ${value} */`;
    }
  }

  /**
   * Get variable name for a gvar index from the variable map
   * @param {number} gvarIndex - The gvar index to look up
   * @returns {string|null} Variable name or null if not found
   */
  getVarNameForGvar(gvarIndex) {
    if (!this.variableMap || !this.variableMap.var_variables) {
      return null;
    }

    for (const [name, info] of Object.entries(this.variableMap.var_variables)) {
      if (info.gvar === gvarIndex) {
        return name;
      }
    }

    return null;
  }

  /**
   * Reconstruct let variable declarations from variable map
   * @returns {string[]} Array of let variable declaration strings
   */
  reconstructLetVariables() {
    const declarations = [];

    if (!this.variableMap || !this.variableMap.let_variables) {
      return declarations;
    }

    for (const [name, info] of Object.entries(this.variableMap.let_variables)) {
      const type = info.type || 'let';
      declarations.push(`${type} ${name} = ${info.expression};`);
    }

    return declarations;
  }

  /**
   * Reconstruct var variable declarations from variable map
   * @returns {string[]} Array of var variable declaration strings
   */
  reconstructVarVariables() {
    const declarations = [];

    if (!this.variableMap || !this.variableMap.var_variables) {
      return declarations;
    }

    for (const [name, info] of Object.entries(this.variableMap.var_variables)) {
      declarations.push(`var ${name} = ${info.expression};`);
    }

    return declarations;
  }

  /**
   * Generate boilerplate code with proper formatting
   * @param {string} body - Main code body
   * @returns {string} Complete JavaScript code
   */
  generateBoilerplate(body) {
    let code = '';

    // Add header comment
    code += '// INAV JavaScript Programming\n';
    code += '// Decompiled from logic conditions\n\n';

    // Add destructuring - include edge, sticky, delay, timer, whenChanged if used
    const needsEdge = body.includes('edge(');
    const needsSticky = body.includes('sticky(');
    const needsDelay = body.includes('delay(');
    const needsTimer = body.includes('timer(');
    const needsWhenChanged = body.includes('whenChanged(');
    const needsWaypoint = body.includes('waypoint.');

    const imports = ['flight', 'override', 'rc', 'gvar'];
    if (needsEdge) imports.push('edge');
    if (needsSticky) imports.push('sticky');
    if (needsDelay) imports.push('delay');
    if (needsTimer) imports.push('timer');
    if (needsWhenChanged) imports.push('whenChanged');
    if (needsWaypoint) imports.push('waypoint');

    code += `const { ${imports.join(', ')} } = inav;\n\n`;

    // Add variable declarations from variable map
    const letDeclarations = this.reconstructLetVariables();
    const varDeclarations = this.reconstructVarVariables();

    if (letDeclarations.length > 0 || varDeclarations.length > 0) {
      code += '// Variable declarations\n';
      for (const decl of letDeclarations) {
        code += decl + '\n';
      }
      for (const decl of varDeclarations) {
        code += decl + '\n';
      }
      code += '\n';
    }

    // Add warnings if any
    if (this.warnings.length > 0) {
      code += '// Decompilation Warnings:\n';
      for (const warning of this.warnings) {
        code += `// - ${warning}\n`;
      }
      code += '\n';
    }

    // Add body
    code += body;

    return code;
  }
}

export { Decompiler };
