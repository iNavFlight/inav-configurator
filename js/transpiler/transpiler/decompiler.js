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
   * Check if an operation produces a boolean result (condition) vs a numeric value
   * Boolean operations can be chained in if() conditions with &&
   * Value operations (arithmetic, min/max, etc.) compute intermediate values
   * @param {number} operation - Operation code
   * @returns {boolean} True if this produces a boolean result
   */
  isBooleanOperation(operation) {
    const booleanOperations = [
      OPERATION.TRUE,
      OPERATION.EQUAL,
      OPERATION.GREATER_THAN,
      OPERATION.LOWER_THAN,
      OPERATION.LOW,
      OPERATION.MID,
      OPERATION.HIGH,
      OPERATION.AND,
      OPERATION.OR,
      OPERATION.XOR,
      OPERATION.NAND,
      OPERATION.NOR,
      OPERATION.NOT,
      OPERATION.STICKY,
      OPERATION.EDGE,
      OPERATION.DELAY,
      OPERATION.TIMER,
      OPERATION.DELTA,
      OPERATION.APPROX_EQUAL
    ];
    return booleanOperations.includes(operation);
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
    this.stickyVarNames = new Map(); // Map LC index -> generated variable name

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

    // Use tree-based decompilation for proper nesting
    const codeBlocks = this.decompileWithTrees(enabled);

    const code = this.generateBoilerplate(codeBlocks.join('\n\n'));

    return {
      success: true,
      code,
      warnings: this.warnings,
      stats: {
        total: logicConditions.length,
        enabled: enabled.length,
        groups: codeBlocks.length
      }
    };
  }

  /**
   * Decompile using tree-based approach for proper nesting
   * @param {Array} conditions - Enabled logic conditions
   * @returns {Array} Array of code blocks
   */
  decompileWithTrees(conditions) {
    const codeBlocks = [];
    const processed = new Set();

    // Find LCs that are referenced by special operations (EDGE, STICKY, DELAY)
    // These should not be rendered as standalone - they're part of the special op
    const referencedBySpecialOps = new Set();
    for (const lc of conditions) {
      if (lc._gap) continue;

      if (lc.operation === OPERATION.EDGE || lc.operation === OPERATION.DELAY) {
        if (lc.operandAType === OPERAND_TYPE.LC) {
          referencedBySpecialOps.add(lc.operandAValue);
        }
      } else if (lc.operation === OPERATION.STICKY) {
        if (lc.operandAType === OPERAND_TYPE.LC) {
          referencedBySpecialOps.add(lc.operandAValue);
        }
        if (lc.operandBType === OPERAND_TYPE.LC) {
          referencedBySpecialOps.add(lc.operandBValue);
        }
      }
    }

    // Find LCs that are referenced as operands by other LCs
    // These are helper/intermediate values that shouldn't be standalone blocks
    const referencedAsOperand = new Set();

    // Track LC references for referencedAsOperand
    // Also track which STICKY/TIMERs are referenced (need to show their definition)
    const referencedStickyLCs = new Set();
    for (const lc of conditions) {
      if (lc._gap) continue;
      if (lc.operandAType === OPERAND_TYPE.LC) {
        referencedAsOperand.add(lc.operandAValue);
        const refLC = conditions.find(c => c.index === lc.operandAValue);
        if (refLC && (refLC.operation === OPERATION.STICKY || refLC.operation === OPERATION.TIMER)) {
          referencedStickyLCs.add(lc.operandAValue);
        }
      }
      if (lc.operandBType === OPERAND_TYPE.LC) {
        referencedAsOperand.add(lc.operandBValue);
        const refLC = conditions.find(c => c.index === lc.operandBValue);
        if (refLC && (refLC.operation === OPERATION.STICKY || refLC.operation === OPERATION.TIMER)) {
          referencedStickyLCs.add(lc.operandBValue);
        }
      }
    }
    this.referencedStickyLCs = referencedStickyLCs;

    // Generate variable names for ALL STICKY/TIMER LCs (not just referenced ones)
    // This allows consistent rendering as variable + if block
    let stickyVarCount = 1;
    for (const lc of conditions) {
      if (lc._gap) continue;
      if (lc.operation === OPERATION.STICKY || lc.operation === OPERATION.TIMER) {
        const varName = `latch${stickyVarCount++}`;
        this.stickyVarNames.set(lc.index, varName);
      }
    }

    // Find root conditions (activatorId === -1) that should be rendered
    const roots = conditions.filter(lc => {
      if (lc._gap) return false;
      if (lc.activatorId !== -1) return false;

      // Skip if only referenced by special ops
      if (referencedBySpecialOps.has(lc.index)) return false;

      // Skip if only used as operand by other LCs (helper conditions)
      if (referencedAsOperand.has(lc.index) && !this.isActionOperation(lc.operation)) {
        const hasChildren = conditions.some(c => c.activatorId === lc.index);
        if (!hasChildren) return false;
      }

      // Skip pure value computations with no children that depend on them
      if (!this.isBooleanOperation(lc.operation) &&
          !this.isActionOperation(lc.operation)) {
        const hasChildren = conditions.some(c => c.activatorId === lc.index);
        if (!hasChildren) return false;
      }

      return true;
    });

    // Build and decompile tree for each root
    for (const rootLc of roots) {
      if (processed.has(rootLc.index)) continue;

      const tree = this.buildConditionTree(rootLc, conditions, processed);
      const code = this.decompileTree(tree, conditions, 0);
      if (code && code.trim()) {
        codeBlocks.push(code);
      }
    }

    // Handle any orphaned conditions (with non-root activators that weren't processed)
    for (const lc of conditions) {
      if (lc._gap) continue;
      if (processed.has(lc.index)) continue;
      if (referencedBySpecialOps.has(lc.index)) continue;
      if (referencedAsOperand.has(lc.index)) continue; // Skip helper conditions

      // This condition has an activator that doesn't exist or wasn't processed
      // Only warn if it's an action (helper conditions are expected to be unreferenced)
      if (this.isActionOperation(lc.operation)) {
        this.addWarning(`Logic condition ${lc.index} has unprocessed activator ${lc.activatorId}`);
        const action = this.decompileAction(lc, conditions);
        codeBlocks.push(`// Orphaned action (activator ${lc.activatorId} not found)\n${action}`);
      }
      processed.add(lc.index);
    }

    return codeBlocks;
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
   * Recursively collect all descendants of a logic condition (flat list)
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
   * Get direct children of a logic condition (not grandchildren)
   * @param {number} parentIndex - Index of parent LC
   * @param {Array} conditions - All conditions
   * @returns {Array} Direct child LCs
   */
  getDirectChildren(parentIndex, conditions) {
    return conditions.filter(lc => !lc._gap && lc.activatorId === parentIndex);
  }

  /**
   * Build a tree structure from logic conditions
   * @param {Object} rootLc - Root logic condition
   * @param {Array} allConditions - All conditions
   * @param {Set} processed - Set of processed indices
   * @returns {Object} Tree node with children
   */
  buildConditionTree(rootLc, allConditions, processed) {
    processed.add(rootLc.index);

    const node = {
      lc: rootLc,
      children: []
    };

    // Get direct children
    const directChildren = this.getDirectChildren(rootLc.index, allConditions);

    for (const childLc of directChildren) {
      if (processed.has(childLc.index)) continue;

      // Recursively build subtree
      const childNode = this.buildConditionTree(childLc, allConditions, processed);
      node.children.push(childNode);
    }

    return node;
  }

  /**
   * Decompile a condition tree to JavaScript with proper nesting
   * @param {Object} node - Tree node
   * @param {Array} allConditions - All conditions for resolution
   * @param {number} indent - Current indentation level
   * @returns {string} JavaScript code
   */
  decompileTree(node, allConditions, indent = 0) {
    const indentStr = '  '.repeat(indent);
    const lines = [];

    // Check for special patterns (edge, sticky, delay, timer)
    const pattern = this.detectSpecialPatternForNode(node, allConditions);

    if (pattern) {
      // Collect children code
      const childCodes = [];
      for (const child of node.children) {
        const childCode = this.decompileTree(child, allConditions, indent + 1);
        if (childCode && childCode.trim()) {
          childCodes.push(childCode);
        }
      }

      // Render pattern - stickys use variable + if style, others use callback style
      if (pattern.type === 'sticky') {
        const varName = this.stickyVarNames.get(node.lc.index);
        const isReferenced = this.referencedStickyLCs && this.referencedStickyLCs.has(node.lc.index);
        // Skip empty stickys unless they're referenced elsewhere
        if (childCodes.length === 0 && !isReferenced) {
          return '';
        }
        lines.push(...this.renderStickyWithLatch(pattern, childCodes, indent, varName));
      } else {
        // Skip empty patterns for non-sticky types
        if (childCodes.length === 0) {
          return '';
        }
        lines.push(...this.renderSpecialPatternWithCode(pattern, childCodes, indent));
      }
    } else if (this.isActionOperation(node.lc.operation)) {
      // This is an action - render it
      const action = this.decompileAction(node.lc, allConditions);
      // Handle multi-line actions (e.g., hoisted variables) - indent each line
      const actionLines = action.split('\n');
      for (const line of actionLines) {
        lines.push(indentStr + line);
      }

      // Actions can still have children (dependent actions)
      for (const child of node.children) {
        lines.push(this.decompileTree(child, allConditions, indent));
      }
    } else if (this.isBooleanOperation(node.lc.operation)) {
      // This is a boolean condition - create if block
      const condition = this.decompileCondition(node.lc, allConditions);

      if (node.children.length === 0) {
        // Condition with no children - skip it (it's a helper used elsewhere)
        return '';
      } else {
        // Separate children into: actions, boolean conditions (same level), nested conditions
        const actions = [];
        const nestedConditions = [];

        for (const child of node.children) {
          if (this.isActionOperation(child.lc.operation)) {
            actions.push(child);
          } else {
            nestedConditions.push(child);
          }
        }

        // Build if statement
        lines.push(indentStr + `if (${condition}) {`);

        // First, output any actions at this level
        for (const actionNode of actions) {
          lines.push(this.decompileTree(actionNode, allConditions, indent + 1));
        }

        // Then, output nested conditions
        for (const nestedNode of nestedConditions) {
          lines.push(this.decompileTree(nestedNode, allConditions, indent + 1));
        }

        lines.push(indentStr + '}');
      }
    } else {
      // Value computation - skip rendering but process children
      // (the value will be inlined when referenced)
      for (const child of node.children) {
        lines.push(this.decompileTree(child, allConditions, indent));
      }
    }

    return lines.filter(l => l).join('\n');
  }

  /**
   * Detect special pattern for a tree node
   * @param {Object} node - Tree node
   * @param {Array} allConditions - All conditions
   * @returns {Object|null} Pattern info or null
   */
  detectSpecialPatternForNode(node, allConditions) {
    const lc = node.lc;

    if (lc.operation === OPERATION.EDGE) {
      const conditionId = lc.operandAValue;
      const duration = lc.operandBValue;
      // Use decompileOperand to handle action LCs properly
      return {
        type: 'edge',
        condition: this.decompileOperand(OPERAND_TYPE.LC, conditionId, allConditions),
        duration: duration
      };
    }

    if (lc.operation === OPERATION.STICKY) {
      const onConditionId = lc.operandAValue;
      const offConditionId = lc.operandBValue;
      // Use decompileOperand to handle action LCs properly
      return {
        type: 'sticky',
        onCondition: this.decompileOperand(OPERAND_TYPE.LC, onConditionId, allConditions),
        offCondition: this.decompileOperand(OPERAND_TYPE.LC, offConditionId, allConditions)
      };
    }

    if (lc.operation === OPERATION.DELAY) {
      const conditionId = lc.operandAValue;
      const duration = lc.operandBValue;
      // Use decompileOperand to handle action LCs properly
      return {
        type: 'delay',
        condition: this.decompileOperand(OPERAND_TYPE.LC, conditionId, allConditions),
        duration: duration
      };
    }

    if (lc.operation === OPERATION.TIMER) {
      return {
        type: 'timer',
        onMs: lc.operandAValue,
        offMs: lc.operandBValue
      };
    }

    if (lc.operation === OPERATION.DELTA) {
      const valueOperand = this.decompileOperand(lc.operandAType, lc.operandAValue, allConditions);
      return {
        type: 'whenChanged',
        value: valueOperand,
        threshold: lc.operandBValue
      };
    }

    return null;
  }

  /**
   * Render a sticky that is referenced elsewhere as a latch variable
   * Shows assignment to the variable so readers understand what sets it
   * @param {Object} pattern - Pattern info (type: 'sticky')
   * @param {Array} childCodes - Pre-computed child code strings
   * @param {number} indent - Indentation level
   * @param {string} varName - The latch variable name
   * @returns {Array} Lines of code
   */
  renderStickyWithLatch(pattern, childCodes, indent, varName) {
    const indentStr = '  '.repeat(indent);
    const lines = [];

    // Show the sticky with assignment to the latch variable
    lines.push(indentStr + `${varName} = sticky({`);
    lines.push(indentStr + `  on: () => ${pattern.onCondition},`);
    lines.push(indentStr + `  off: () => ${pattern.offCondition}`);
    lines.push(indentStr + `});`);

    // If there are children, render them in an if block
    if (childCodes.length > 0) {
      lines.push(indentStr + `if (${varName}) {`);
      for (const code of childCodes) {
        lines.push(code);
      }
      lines.push(indentStr + `}`);
    }

    return lines;
  }

  /**
   * Render a special pattern (edge, sticky, etc.) with its children
   * @param {Object} pattern - Pattern info
   * @param {Object} node - Tree node
   * @param {Array} allConditions - All conditions
   * @param {number} indent - Indentation level
   * @returns {Array} Lines of code
   */
  renderSpecialPattern(pattern, node, allConditions, indent) {
    // Collect children code
    const childLines = [];
    for (const child of node.children) {
      const childCode = this.decompileTree(child, allConditions, indent + 1);
      if (childCode) childLines.push(childCode);
    }

    return this.renderSpecialPatternWithCode(pattern, childLines, indent);
  }

  /**
   * Render a special pattern with pre-computed child code
   * @param {Object} pattern - Pattern info
   * @param {Array} childCodes - Pre-computed child code strings
   * @param {number} indent - Indentation level
   * @returns {Array} Lines of code
   */
  renderSpecialPatternWithCode(pattern, childCodes, indent) {
    const indentStr = '  '.repeat(indent);
    const lines = [];

    const body = childCodes.join('\n');

    if (pattern.type === 'edge') {
      lines.push(indentStr + `edge(${pattern.condition}, ${pattern.duration}, () => {`);
      if (body) lines.push(body);
      lines.push(indentStr + '});');
    } else if (pattern.type === 'delay') {
      lines.push(indentStr + `delay(${pattern.condition}, ${pattern.duration}, () => {`);
      if (body) lines.push(body);
      lines.push(indentStr + '});');
    } else if (pattern.type === 'timer') {
      lines.push(indentStr + `timer(${pattern.onMs}, ${pattern.offMs}, () => {`);
      if (body) lines.push(body);
      lines.push(indentStr + '});');
    } else if (pattern.type === 'whenChanged') {
      lines.push(indentStr + `delta(${pattern.value}, ${pattern.threshold}, () => {`);
      if (body) lines.push(body);
      lines.push(indentStr + '});');
    }

    return lines;
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

        // Only record references when the operand type is LC
        if (lc.operation === OPERATION.EDGE ||
            lc.operation === OPERATION.DELAY) {
            if (lc.operandAType === OPERAND_TYPE.LC) {
                referencedBySpecialOps.add(lc.operandAValue); // operandA points to condition
            }
        } else if (lc.operation === OPERATION.STICKY) {
            if (lc.operandAType === OPERAND_TYPE.LC) {
                referencedBySpecialOps.add(lc.operandAValue); // ON condition
            }
            if (lc.operandBType === OPERAND_TYPE.LC) {
                referencedBySpecialOps.add(lc.operandBValue); // OFF condition
            }
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
      // Skip gap markers
      if (lc._gap) continue;

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
        return `edge(${pattern.condition}, ${pattern.duration}, () => {\n${body}\n});`;
      } else if (pattern.type === 'sticky') {
        return `sticky({\n  on: () => ${pattern.onCondition},\n  off: () => ${pattern.offCondition}\n}, () => {\n${body}\n});`;
      } else if (pattern.type === 'delay') {
        return `delay(${pattern.condition}, ${pattern.duration}, () => {\n${body}\n});`;
      } else if (pattern.type === 'timer') {
        return `timer(${pattern.onMs}, ${pattern.offMs}, () => {\n${body}\n});`;
      } else if (pattern.type === 'whenChanged') {
        return `delta(${pattern.value}, ${pattern.threshold}, () => {\n${body}\n});`;
      }
    }

    // Build combined condition from activator and any chained boolean conditions
    const conditionParts = [this.decompileCondition(group.activator, allConditions)];
    const actualActions = [];
    const chainedConditions = []; // Track chained condition LCs to find terminal index

    // Separate chained conditions from actions and value computations
    for (const lc of group.actions) {
      if (this.isActionOperation(lc.operation)) {
        actualActions.push(this.decompileAction(lc, allConditions));
      } else if (this.isBooleanOperation(lc.operation)) {
        // This is a boolean condition in the chain - add it to the compound condition
        conditionParts.push(this.decompileCondition(lc, allConditions));
        chainedConditions.push(lc);
      }
      // Value computations (ADD, SUB, MUL, etc.) are skipped - they're intermediate
      // values that will be inlined when referenced by actions or other conditions
    }

    const combinedCondition = conditionParts.join(' && ');

    // The terminal condition is the last in the chain (or the activator if no chain)
    // This is the index that holds the combined AND result
    const terminalIndex = chainedConditions.length > 0
      ? chainedConditions[chainedConditions.length - 1].index
      : group.activator.index;

    if (actualActions.length === 0) {
      // No actions, but condition chains are still valid (can be read externally)
      // Output as a condition assignment or just the condition check
      return `if (${combinedCondition}) {\n  // Condition can be read by logicCondition[${terminalIndex}]\n}`;
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
   * @param {Set} visited - Set of visited LC indices to prevent infinite recursion
   * @returns {string} JavaScript expression
   */
  decompileCondition(lc, allConditions = null, visited = new Set()) {
    return this.conditionDecompiler.decompile(lc, allConditions, visited);
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
   * @param {Set} visited - Set of visited LC indices to prevent infinite recursion
   * @returns {string} JavaScript expression
   */
  decompileOperand(type, value, allConditions = null, visited = new Set()) {
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
        // If we have access to all conditions, try to resolve
        if (allConditions) {
          // Detect cyclic references to prevent infinite recursion
          if (visited.has(value)) {
            this.addWarning(`Cyclic LC reference detected at logicCondition[${value}]`);
            return `logicCondition[${value}]`;
          }

          const referencedLC = allConditions.find(lc => lc.index === value);
          if (referencedLC) {
            // Don't inline action operations (they produce side effects, not boolean values)
            // Instead, describe what the action does for clarity
            if (this.isActionOperation(referencedLC.operation)) {
              const actionDesc = this.describeActionForCondition(referencedLC, allConditions);
              if (actionDesc) {
                return actionDesc;
              }
              return `logicCondition[${value}]`;
            }
            // Don't inline STICKY - its state is maintained internally
            // Use generated variable name if available
            if (referencedLC.operation === OPERATION.STICKY) {
              const varName = this.stickyVarNames.get(value);
              return varName || `logicCondition[${value}]`;
            }
            // Don't inline TIMER - it has no underlying condition to show
            // Use generated variable name if available
            if (referencedLC.operation === OPERATION.TIMER) {
              const varName = this.stickyVarNames.get(value);
              return varName || `logicCondition[${value}]`;
            }
            // EDGE: returns true on rising edge of condition for duration ms
            // Just show the underlying condition - edge timing is implementation detail
            if (referencedLC.operation === OPERATION.EDGE) {
              const underlyingCond = this.decompileOperand(OPERAND_TYPE.LC, referencedLC.operandAValue, allConditions, visited);
              return `edge(${underlyingCond}, ${referencedLC.operandBValue})`;
            }
            // DELAY: returns true after condition held for duration ms
            if (referencedLC.operation === OPERATION.DELAY) {
              const underlyingCond = this.decompileOperand(OPERAND_TYPE.LC, referencedLC.operandAValue, allConditions, visited);
              return `delay(${underlyingCond}, ${referencedLC.operandBValue})`;
            }
            // Recursively decompile the referenced condition with cycle detection
            // (even boolean conditions with activators - the activator controls when
            // the LC is evaluated, but its result can still be referenced)
            visited.add(value);
            const result = this.decompileCondition(referencedLC, allConditions, visited);
            visited.delete(value);
            return result;
          }
        }
        // Fallback to reference notation if we can't resolve
        return `logicCondition[${value}]`;

      case OPERAND_TYPE.PID:
        // PID operands 0-3 map to pid[0].output through pid[3].output
        if (value >= 0 && value < 4) {
          return `pid[${value}].output`;
        }
        this.addWarning(`Invalid PID operand value ${value}. Valid range is 0-3.`);
        return `pid[${value}].output /* invalid PID index */`;

      default:
        this.addWarning(`Unknown operand type ${type}`);
        return `/* unknown operand type ${type}, value ${value} */`;
    }
  }

  /**
   * Describe an action operation when used as a condition reference
   * In INAV, action LCs can be referenced as conditions (truthy when successful/non-zero)
   * @param {Object} lc - Logic condition with action operation
   * @param {Array} allConditions - All conditions for resolution
   * @returns {string|null} Description or null to use default logicCondition[N]
   */
  describeActionForCondition(lc, allConditions) {
    switch (lc.operation) {
      case OPERATION.GVAR_SET:
      case OPERATION.GVAR_INC:
      case OPERATION.GVAR_DEC: {
        // GVAR operations return the resulting value
        // Return just the variable - JS truthiness handles non-zero check
        const gvarIndex = lc.operandAValue;
        return this.getVarNameForGvar(gvarIndex) || `gvar[${gvarIndex}]`;
      }

      // Other action operations don't have meaningful boolean values
      // Return null to use default logicCondition[N] reference
      default:
        return null;
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
   * Generate variable declarations for referenced STICKY/TIMER LCs
   * @returns {string[]} Array of declaration strings
   */
  generateStickyVarDeclarations() {
    const declarations = [];

    if (!this.stickyVarNames || this.stickyVarNames.size === 0) {
      return declarations;
    }

    for (const [lcIndex, varName] of this.stickyVarNames) {
      // Generate a var declaration with a comment showing which LC it represents
      // Use 'var' because these are reassigned (let would cause compiler error)
      declarations.push(`var ${varName}; // logicCondition[${lcIndex}] - sticky/timer state`);
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

    // Add destructuring - include edge, sticky, delay, timer, whenChanged, pid, waypoint if used
    const needsEdge = body.includes('edge(');
    const needsSticky = body.includes('sticky(');
    const needsDelay = body.includes('delay(');
    const needsTimer = body.includes('timer(');
    const needsWhenChanged = body.includes('whenChanged(');
    const needsWaypoint = body.includes('waypoint.');
    const needsPid = /pid\[\d+\]/.test(body);

    const imports = ['flight', 'override', 'rc', 'gvar'];
    if (needsEdge) imports.push('edge');
    if (needsSticky) imports.push('sticky');
    if (needsDelay) imports.push('delay');
    if (needsTimer) imports.push('timer');
    if (needsWhenChanged) imports.push('whenChanged');
    if (needsWaypoint) imports.push('waypoint');
    if (needsPid) imports.push('pid');

    code += `const { ${imports.join(', ')} } = inav;\n\n`;

    // Add variable declarations from variable map
    const letDeclarations = this.reconstructLetVariables();
    const varDeclarations = this.reconstructVarVariables();
    const stickyDeclarations = this.generateStickyVarDeclarations();

    if (letDeclarations.length > 0 || varDeclarations.length > 0 || stickyDeclarations.length > 0) {
      code += '// Variable declarations\n';
      for (const decl of letDeclarations) {
        code += decl + '\n';
      }
      for (const decl of varDeclarations) {
        code += decl + '\n';
      }
      for (const decl of stickyDeclarations) {
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
