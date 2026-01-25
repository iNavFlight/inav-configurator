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
import { ActivatorHoistingManager } from './activator_hoisting.js';

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
      addWarning: this.addWarning.bind(this),
      getHoistedVarCounters: () => this.hoistedVarCounters  // Shared counter for unique hoisted var names
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

    // Look up in mapping (returns full path with inav. prefix)
    if (this.operandToProperty[objName] && this.operandToProperty[objName][operandValue]) {
      return this.operandToProperty[objName][operandValue];
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
      OPERATION.OVERRIDE_MIN_GROUND_SPEED,
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
   * Check if an operation returns a value that could be externally referenced.
   * External references include Global Functions that can source from LC results.
   * Action operations (overrides, sets) put values somewhere explicitly, so they
   * cannot be externally referenced - the value goes to a specific target.
   * @param {number} operation - Operation code
   * @returns {boolean} True if this operation's result could be read externally
   */
  couldBeExternallyReferenced(operation) {
    // Action operations explicitly put values somewhere (override, set, gvar assignment)
    // They cannot be externally referenced because the value goes to a target
    return !this.isActionOperation(operation);
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
   * Main decompilation function
   * @param {Array} logicConditions - Array of logic condition objects from FC
   * @param {Object} variableMap - Optional variable map for name preservation
   * @returns {Object} Decompilation result with code and metadata
   */
  decompile(logicConditions, variableMap = null) {
    this.warnings = [];
    this.variableMap = variableMap;
    this.stickyVarNames = new Map(); // Map LC index -> generated variable name
    this.predeclaredStickyVars = new Set(); // Track stickys with activators that need pre-declaration
    // Note: All INAV objects are always imported for user convenience
    this.inlineDeclaredVars = new Set(); // Track let variables declared inline in body
    this.hoistedVarCounters = new Map(); // Track counters for hoisted variable names (e.g., min, min2, min3)

    // Create hoisting manager for activator-wrapped LCs
    this.hoistingManager = new ActivatorHoistingManager({
      isActionOperation: this.isActionOperation.bind(this)
    });

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

    let code = this.generateBoilerplate(codeBlocks.join('\n\n'));

    // Apply custom variable names from variable map as a final rename pass
    code = this.applyCustomVariableNames(code, enabled);

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
   * Apply custom variable names from variable map as a final rename pass.
   * This renames cond1, cond2, etc. to user-defined names if available.
   * @param {string} code - The generated code with generic names
   * @param {Array} conditions - All logic conditions
   * @returns {string} Code with custom variable names applied
   */
  applyCustomVariableNames(code, conditions) {
    if (!this.variableMap || !this.variableMap.let_variables) {
      return code;
    }

    // Build mapping: LC index -> custom variable name
    const lcIndexToCustomName = new Map();
    for (const [customName, info] of Object.entries(this.variableMap.let_variables)) {
      if (info.lcIndex !== null && info.lcIndex !== undefined) {
        lcIndexToCustomName.set(info.lcIndex, customName);
      }
    }

    // Build mapping: LC index -> generated name (cond1, cond2, etc.)
    const lcIndexToGeneratedName = new Map();
    for (const [lcIndex, generatedName] of this.hoistingManager.hoistedActivatorVars.entries()) {
      lcIndexToGeneratedName.set(lcIndex, generatedName);
    }

    // For each LC that has both a custom name and a generated name, rename
    const renames = new Map(); // generatedName -> customName
    for (const [lcIndex, customName] of lcIndexToCustomName.entries()) {
      const generatedName = lcIndexToGeneratedName.get(lcIndex);
      if (generatedName) {
        renames.set(generatedName, customName);
      }
    }

    // Apply renames (use word boundaries to avoid partial matches)
    for (const [generatedName, customName] of renames.entries()) {
      const regex = new RegExp(`\\b${generatedName}\\b`, 'g');
      code = code.replace(regex, customName);
    }

    return code;
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

    // Count how many times each LC is referenced (for hoisting duplicates)
    const referenceCount = new Map();

    // Track LC references for referencedAsOperand
    // Also track which STICKY/TIMERs are referenced (need to show their definition)
    const referencedStickyLCs = new Set();
    for (const lc of conditions) {
      if (lc._gap) continue;
      if (lc.operandAType === OPERAND_TYPE.LC) {
        referencedAsOperand.add(lc.operandAValue);
        referenceCount.set(lc.operandAValue, (referenceCount.get(lc.operandAValue) || 0) + 1);
        const refLC = conditions.find(c => c.index === lc.operandAValue);
        if (refLC && (refLC.operation === OPERATION.STICKY || refLC.operation === OPERATION.TIMER)) {
          referencedStickyLCs.add(lc.operandAValue);
        }
      }
      if (lc.operandBType === OPERAND_TYPE.LC) {
        referencedAsOperand.add(lc.operandBValue);
        referenceCount.set(lc.operandBValue, (referenceCount.get(lc.operandBValue) || 0) + 1);
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
        // Track stickys with activators for pre-declaration
        // These are defined inside if blocks but may be referenced from outside
        if (lc.activatorId !== -1) {
          this.predeclaredStickyVars.add(lc.index);
        }
      }
    }

    // Identify which LCs should be hoisted to variables (via hoisting manager)
    // Pass variable map to preserve custom variable names (expression match first, LC index fallback)
    this.hoistingManager.identifyHoistedVars(conditions, referencedAsOperand, referenceCount, this.variableMap, this);

    // Emit global-scoped hoisted vars at top (scopeLcIndex === -1)
    // Scoped vars (scopeLcIndex !== -1) will be emitted inside their respective if-blocks
    const globalHoisted = this.hoistingManager.getHoistedVarsInScope(-1);
    for (const {lcIndex, varName} of globalHoisted) {
      const lc = conditions.find(c => c.index === lcIndex);
      if (!lc) continue;

      // Check if this LC has children (other LCs using it as activator)
      const hasChildren = conditions.some(c => !c._gap && c.activatorId === lcIndex);

      // Root LCs (no activator) vs LCs with activators are emitted differently
      if (lc.activatorId === -1) {
        // Root LC - just decompile the expression directly
        const expr = this.decompileCondition(lc, conditions, new Set());
        codeBlocks.push(`const ${varName} = ${expr};`);
        // If this root LC has children, DON'T mark as processed
        // It needs to be rendered as an if-block later
        if (!hasChildren) {
          processed.add(lcIndex);
        }
      } else {
        // LC with activator - wrap in ternary to preserve activator semantics
        // Pass activator context to prevent redundant wrapping
        const innerExpr = this.decompileConditionInActivatorContext(lc, conditions, lc.activatorId);
        const activatorExpr = this.decompileOperand(OPERAND_TYPE.LC, lc.activatorId, conditions, new Set());
        codeBlocks.push(`const ${varName} = ${activatorExpr} ? (${innerExpr}) : 0;`);
        // LCs with activators are always fully handled by hoisting
        processed.add(lcIndex);
      }
    }

    // Find root conditions (activatorId === -1) that should be rendered
    // Include gap markers to preserve visual grouping from original LC layout
    const roots = conditions.filter(lc => {
      if (lc._gap) return true;  // Keep gap markers for visual separation
      if (lc.activatorId !== -1) return false;

      // Check if this LC has children (other LCs using it as activator)
      const hasChildren = conditions.some(c => !c._gap && c.activatorId === lc.index);

      // Skip if only referenced by special ops (EDGE, STICKY, DELAY operands)
      // BUT keep if it has children that depend on it as activator
      if (referencedBySpecialOps.has(lc.index) && !hasChildren) return false;

      // Skip if only used as operand by other LCs (helper conditions)
      // These are intermediate computations used by other LCs
      if (referencedAsOperand.has(lc.index) && !this.isActionOperation(lc.operation)) {
        if (!hasChildren) return false;
      }

      return true;
    });

    // Pre-declare sticky variables that have activators
    // These are defined inside if-blocks but may be referenced from outside
    // Pre-declaration makes scope explicit: var latch1; ... if (cond) { latch1 = sticky({...}); }
    for (const lcIndex of this.predeclaredStickyVars) {
      const varName = this.stickyVarNames.get(lcIndex);
      if (varName) {
        codeBlocks.push(`var ${varName};`);
      }
    }

    // Build and decompile tree for each root
    for (const rootLc of roots) {
      // Gap markers insert extra blank line for visual separation
      if (rootLc._gap) {
        if (codeBlocks.length > 0) {
          codeBlocks.push('');  // Empty string becomes extra blank line when joined
        }
        continue;
      }
      if (processed.has(rootLc.index)) continue;

      const tree = this.buildConditionTree(rootLc, conditions, processed);
      const hasChildren = conditions.some(c => c.activatorId === rootLc.index);

      // Check if this is a standalone condition that could be externally referenced
      // (no children, not an action, could be read by Global Functions or other features)
      if (!hasChildren &&
          !this.isActionOperation(rootLc.operation) &&
          this.couldBeExternallyReferenced(rootLc.operation)) {
        const condStr = this.decompileCondition(rootLc, conditions);
        codeBlocks.push(`if (${condStr}) { /* LC ${rootLc.index}: for external reference */ }`);
        processed.add(rootLc.index);
        continue;
      }

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
      if (this.isActionOperation(lc.operation)) {
        // Action with missing activator - warn and output as orphaned
        this.addWarning(`Logic condition ${lc.index} has unprocessed activator ${lc.activatorId}`);
        const action = this.decompileAction(lc, conditions);
        codeBlocks.push(`// Orphaned action (activator ${lc.activatorId} not found)\n${action}`);
      } else if (this.couldBeExternallyReferenced(lc.operation)) {
        // Non-action with missing activator - could be externally referenced
        const condStr = this.decompileCondition(lc, conditions);
        codeBlocks.push(`if (${condStr}) { /* LC ${lc.index}: for external reference */ }`);
      }
      processed.add(lc.index);
    }

    return codeBlocks;
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
    // Defensive check: ensure node has required properties
    if (!node?.lc || !Array.isArray(node.children)) {
      return '';
    }

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
        lines.push(...this.renderStickyWithLatch(pattern, childCodes, indent, varName, node.lc.index, allConditions));
      } else {
        // For edge/delay with no children, still output for external reference
        // (e.g., Global Functions may read these values for OSD display)
        if (childCodes.length === 0) {
          lines.push(indentStr + `/* LC ${node.lc.index}: ${pattern.type}(${pattern.condition || pattern.value}, ${pattern.duration || pattern.onMs}) for external reference */`);
        } else {
          lines.push(...this.renderSpecialPatternWithCode(pattern, childCodes, indent));
        }
      }
    } else if (this.isActionOperation(node.lc.operation)) {
      // This is an action - render it
      const action = this.decompileAction(node.lc, allConditions);
      // Handle multi-line actions (e.g., hoisted variables) - indent each line
      const actionLines = action.split('\n');
      for (const line of actionLines) {
        lines.push(indentStr + line);
        // Track inline let declarations structurally (for deduplication in generateBoilerplate)
        const letMatch = line.match(/^let\s+(\w+)\s*=/);
        if (letMatch) {
          this.inlineDeclaredVars.add(letMatch[1]);
        }
      }

      // Actions can still have children (dependent actions)
      for (const child of node.children) {
        lines.push(this.decompileTree(child, allConditions, indent));
      }
    } else if (this.isBooleanOperation(node.lc.operation)) {
      // This is a boolean condition - create if block
      // Check if this LC was hoisted to a variable - if so, use the variable name
      const hoistedVarName = this.hoistingManager?.getHoistedVarName(node.lc.index);
      const condition = hoistedVarName || this.decompileCondition(node.lc, allConditions);

      if (node.children.length === 0) {
        // Only skip if this is a helper condition that can't be externally referenced
        // Conditions that could be externally referenced (e.g., via Global Functions, OSD)
        // should still be rendered even if they have no children
        if (!this.couldBeExternallyReferenced(node.lc.operation)) {
          return '';
        }
        // Render empty if block with comment for external reference
        lines.push(indentStr + `if (${condition}) {`);
        lines.push(indentStr + `  /* LC ${node.lc.index}: for external reference */`);
        lines.push(indentStr + '}');
      } else {
        // Separate children into: actions, boolean conditions (same level), nested conditions
        const actions = [];
        const nestedConditions = [];

        // Find LC indices consumed by STICKY/EDGE/DELAY siblings (their operands)
        const consumedBySpecial = new Set();
        for (const child of node.children) {
          const op = child.lc.operation;
          if (op === OPERATION.STICKY || op === OPERATION.EDGE || op === OPERATION.DELAY) {
            if (child.lc.operandAType === OPERAND_TYPE.LC) {
              consumedBySpecial.add(child.lc.operandAValue);
            }
            if (child.lc.operandBType === OPERAND_TYPE.LC) {
              consumedBySpecial.add(child.lc.operandBValue);
            }
          }
        }

        for (const child of node.children) {
          // Skip conditions that are consumed as operands by STICKY/EDGE/DELAY siblings
          if (consumedBySpecial.has(child.lc.index)) {
            continue;
          }
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

        // If body is empty, add comment with LC number for external reference
        if (actions.length === 0 && nestedConditions.length === 0) {
          lines.push(indentStr + `  /* LC ${node.lc.index}: for external reference */`);
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
      // Set activator context to the sticky LC itself when decompiling callbacks
      // This prevents redundant wrapping when on/off conditions have activator = this sticky
      const previousContext = this._currentActivatorContext;
      this._currentActivatorContext = lc.index;
      const onCondition = this.decompileOperand(OPERAND_TYPE.LC, onConditionId, allConditions);
      const offCondition = this.decompileOperand(OPERAND_TYPE.LC, offConditionId, allConditions);
      this._currentActivatorContext = previousContext;

      return {
        type: 'sticky',
        onCondition: onCondition,
        offCondition: offCondition
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
   * @param {number} lcIndex - The LC index (for checking pre-declaration)
   * @returns {Array} Lines of code
   */
  renderStickyWithLatch(pattern, childCodes, indent, varName, lcIndex, conditions) {
    const indentStr = '  '.repeat(indent);
    const lines = [];

    // Check if this sticky was pre-declared (has activator, defined inside if-block)
    // If pre-declared, use assignment only; otherwise use var declaration
    const isPredeclared = this.predeclaredStickyVars.has(lcIndex);
    const declaration = isPredeclared ? `${varName}` : `var ${varName}`;

    // Show the sticky with var declaration or assignment
    lines.push(indentStr + `${declaration} = sticky({`);
    lines.push(indentStr + `  on: () => ${pattern.onCondition},`);
    lines.push(indentStr + `  off: () => ${pattern.offCondition}`);
    lines.push(indentStr + `});`);

    // If there are children, render them in an if block
    if (childCodes.length > 0) {
      lines.push(indentStr + `if (${varName}) {`);

      // Emit scoped hoisted variables that belong to this sticky's scope
      const scopedHoisted = this.hoistingManager.getHoistedVarsInScope(lcIndex);
      if (scopedHoisted.length > 0) {
        const childIndentStr = '  '.repeat(indent + 1);
        for (const {lcIndex: hoistedLcIndex, varName: hoistedVarName} of scopedHoisted) {
          const lc = conditions.find(c => c.index === hoistedLcIndex);
          if (!lc) continue;

          // Decompile the hoisted variable within this activator context
          const innerExpr = this.decompileConditionInActivatorContext(lc, conditions, lcIndex);
          lines.push(childIndentStr + `const ${hoistedVarName} = ${innerExpr};`);

          // Mark this LC as processed so it doesn't get rendered elsewhere
          // Note: We need to store processed set in the decompiler instance
          if (this._currentlyProcessedLCs) {
            this._currentlyProcessedLCs.add(hoistedLcIndex);
          }
        }

        // Add blank line after hoisted vars for readability
        if (childCodes.length > 0) {
          lines.push('');
        }
      }

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
   * Uses dispatch table for pattern type rendering
   * @param {Object} pattern - Pattern info
   * @param {Array} childCodes - Pre-computed child code strings
   * @param {number} indent - Indentation level
   * @returns {Array} Lines of code
   */
  renderSpecialPatternWithCode(pattern, childCodes, indent) {
    const indentStr = '  '.repeat(indent);
    const lines = [];
    const body = childCodes.join('\n');

    // Dispatch table for pattern renderers
    const patternRenderers = {
      'edge': () => {
        lines.push(indentStr + `edge(() => ${pattern.condition}, ${pattern.duration}, () => {`);
        if (body) lines.push(body);
        lines.push(indentStr + '});');
      },
      'delay': () => {
        lines.push(indentStr + `delay(() => ${pattern.condition}, ${pattern.duration}, () => {`);
        if (body) lines.push(body);
        lines.push(indentStr + '});');
      },
      'timer': () => {
        lines.push(indentStr + `timer(${pattern.onMs}, ${pattern.offMs}, () => {`);
        if (body) lines.push(body);
        lines.push(indentStr + '});');
      },
      'whenChanged': () => {
        lines.push(indentStr + `whenChanged(${pattern.value}, ${pattern.threshold}, () => {`);
        if (body) lines.push(body);
        lines.push(indentStr + '});');
      }
    };

    // Lookup and execute pattern renderer
    const renderer = patternRenderers[pattern.type];
    if (renderer) {
      renderer();
    }

    return lines;
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
   * Decompile a condition within an activator context
   * When inside an activator, operands that reference LCs with the same activator
   * should not be re-wrapped with the activator check
   */
  decompileConditionInActivatorContext(lc, allConditions, activatorId) {
    const visited = new Set();
    // Decompile with activator context tracking
    return this.decompileConditionWithActivatorContext(lc, allConditions, visited, activatorId);
  }

  /**
   * Decompile condition with activator context to avoid redundant wrapping
   */
  decompileConditionWithActivatorContext(lc, allConditions, visited, currentActivator) {
    // Use condition decompiler but track current activator for operand resolution
    this._currentActivatorContext = currentActivator;
    const result = this.conditionDecompiler.decompile(lc, allConditions, visited);
    this._currentActivatorContext = null;
    return result;
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
        return varName || `inav.gvar[${value}]`;
      }

      case OPERAND_TYPE.RC_CHANNEL:
        return `inav.rc[${value}]`;

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
            // Check if this LC was hoisted to a variable (has activator, referenced as operand)
            const hoistedVarName = this.hoistingManager?.getHoistedVarName(value);
            if (hoistedVarName) {
              // If we're inside the same activator context, inline the expression
              // to avoid redundant wrapping (e.g., latch3 ? (latch3 ? ... : 0) : 0)
              if (this._currentActivatorContext !== null &&
                  referencedLC.activatorId === this._currentActivatorContext) {
                // Inline the expression while preserving activator context
                // Use conditionDecompiler directly to stay within current context
                return this.conditionDecompiler.decompile(referencedLC, allConditions, visited);
              }
              // Use the hoisted var name - the variable already includes the activator check
              return hoistedVarName;
            }

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
            if (referencedLC.operation === OPERATION.EDGE) {
              const underlyingCond = this.decompileOperand(OPERAND_TYPE.LC, referencedLC.operandAValue, allConditions, visited);
              const edgeExpr = `edge(${underlyingCond}, ${referencedLC.operandBValue})`;
              // Wrap with activator check if LC has one
              // UNLESS we're already inside the same activator context
              if (referencedLC.activatorId !== -1 && referencedLC.activatorId !== this._currentActivatorContext) {
                const activatorExpr = this.decompileOperand(OPERAND_TYPE.LC, referencedLC.activatorId, allConditions, new Set(visited));
                return `(${activatorExpr} ? ${edgeExpr} : 0)`;
              }
              return edgeExpr;
            }
            // DELAY: returns true after condition held for duration ms
            if (referencedLC.operation === OPERATION.DELAY) {
              const underlyingCond = this.decompileOperand(OPERAND_TYPE.LC, referencedLC.operandAValue, allConditions, visited);
              const delayExpr = `delay(${underlyingCond}, ${referencedLC.operandBValue})`;
              // Wrap with activator check if LC has one
              // UNLESS we're already inside the same activator context
              if (referencedLC.activatorId !== -1 && referencedLC.activatorId !== this._currentActivatorContext) {
                const activatorExpr = this.decompileOperand(OPERAND_TYPE.LC, referencedLC.activatorId, allConditions, new Set(visited));
                return `(${activatorExpr} ? ${delayExpr} : 0)`;
              }
              return delayExpr;
            }
            // Recursively decompile the referenced condition with cycle detection
            visited.add(value);
            const result = this.decompileCondition(referencedLC, allConditions, visited);
            visited.delete(value);

            // If the LC has an activator, wrap in conditional to preserve semantics
            // In INAV, when activator is false, the LC outputs 0
            // UNLESS we're already inside the same activator context (avoid redundant wrapping)
            if (referencedLC.activatorId !== -1 && referencedLC.activatorId !== this._currentActivatorContext) {
              const activatorExpr = this.decompileOperand(OPERAND_TYPE.LC, referencedLC.activatorId, allConditions, new Set(visited));
              return `(${activatorExpr} ? (${result}) : 0)`;
            }
            return result;
          }
        }
        // Fallback to reference notation if we can't resolve
        return `logicCondition[${value}]`;

      case OPERAND_TYPE.PID:
        // PID operands 0-3 map to pid[0].output through pid[3].output
        if (value >= 0 && value < 4) {
          return `inav.pid[${value}].output`;
        }
        this.addWarning(`Invalid PID operand value ${value}. Valid range is 0-3.`);
        return `inav.pid[${value}].output /* invalid PID index */`;

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
   * NOTE: The variable map is only used for NAMING variables, not CREATING them.
   * All variable declarations should come from the actual LCs being decompiled.
   * This method is kept for backwards compatibility but should return empty.
   * @returns {string[]} Array of let variable declaration strings (always empty)
   */
  reconstructLetVariables() {
    // Variable map is used only for naming hoisted variables.
    // We don't emit declarations from the variable map because they might be stale
    // (from old code that no longer exists in the current LCs).
    // All declarations come from the LCs we're actually decompiling.
    return [];
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

    // Get latch variable names to skip (they're declared inline with sticky())
    // This includes both:
    // 1. Names generated by this decompilation (from stickyVarNames)
    // 2. Names from variableMap.latch_variables (structural tracking from previous compilation)
    const latchNames = new Set();
    if (this.stickyVarNames) {
      for (const varName of this.stickyVarNames.values()) {
        latchNames.add(varName);
      }
    }
    if (this.variableMap.latch_variables) {
      for (const name of Object.keys(this.variableMap.latch_variables)) {
        latchNames.add(name);
      }
    }

    for (const [name, info] of Object.entries(this.variableMap.var_variables)) {
      // Skip latch variables - they're handled by sticky declarations
      // Uses structural data (latch_variables) instead of regex pattern matching
      if (latchNames.has(name)) {
        continue;
      }
      // Legacy fallback: skip latch* names from old variableMap formats
      // that don't have latch_variables tracking. This regex check is only
      // needed for backward compatibility with saved configs from older versions.
      if (!this.variableMap.latch_variables && /^latch\d+$/.test(name)) {
        continue;
      }
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

    // No destructuring - prevents autocomplete pollution in Monaco editor
    // Users access INAV API via namespaced paths: inav.flight.altitude, inav.override.vtx.power, etc.
    code += `// INAV JavaScript Programming\n// Access API via: inav.flight.*, inav.override.*, inav.rc[n].*, inav.gvar[n], etc.\n\n`;

    // Add variable declarations from variable map
    // Note: sticky/latch variables are declared inline with var latch = sticky({...})
    // Note: Skip let variables that are already declared inline in the body (tracked in inlineDeclaredVars)
    const letDeclarations = this.reconstructLetVariables().filter(decl => {
      // Extract variable name from "let varName = ..."
      const match = decl.match(/^let\s+(\w+)\s*=/);
      if (match) {
        const varName = match[1];
        // Use structural tracking instead of regex scanning the body
        return !this.inlineDeclaredVars.has(varName);
      }
      return true;
    });
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
