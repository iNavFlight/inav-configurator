/**
 * INAV Action Decompiler Helper
 *
 * Location: js/transpiler/transpiler/action_decompiler.js
 *
 * Handles decompilation of actions from INAV logic conditions back to JavaScript.
 * Extracted from decompiler.js to improve modularity.
 */

'use strict';

import {
  OPERATION,
  OPERAND_TYPE,
  getOperationName
} from './inav_constants.js';

/**
 * Helper class for decompiling action logic
 */
class ActionDecompiler {
  /**
   * @param {Object} context - Context object containing dependencies
   * @param {Function} context.decompileOperand - Function to decompile operands
   * @param {Function} context.getVarNameForGvar - Function to get variable name for gvar
   * @param {Function} context.addWarning - Function to add warnings
   * @param {Function} context.getHoistedVarCounters - Function to get shared hoisted var counters
   */
  constructor(context) {
    this.decompileOperand = context.decompileOperand;
    this.getVarNameForGvar = context.getVarNameForGvar;
    this.addWarning = context.addWarning;
    this.getHoistedVarCounters = context.getHoistedVarCounters;
  }

  /**
   * Decompile an action to JavaScript statement
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for recursive resolution
   * @returns {string} JavaScript statement
   */
  decompile(lc, allConditions = null) {
    // For operations that may have deep LC chains, check depth BEFORE stringifying
    // to enable structural hoisting (avoiding string parsing)
    switch (lc.operation) {
      case OPERATION.GVAR_SET:
        return this.handleGvarSet(lc, allConditions);
      case OPERATION.OVERRIDE_THROTTLE_SCALE:
        return this.handleOverrideThrottleScale(lc, allConditions);
      case OPERATION.OVERRIDE_THROTTLE:
        return this.handleOverrideThrottle(lc, allConditions);
    }

    // INAV operand pattern (confirmed by logic_condition.c):
    // - Most overrides: operandA = value, operandB = 0
    // - GVAR_INC/DEC: operandA = gvar index, operandB = increment/decrement
    // - FLIGHT_AXIS: operandA = axis index, operandB = angle/rate
    // - RC_CHANNEL: operandA = channel, operandB = value
    // - PORT_SET: operandA = pin, operandB = value
    const valueA = this.decompileOperand(lc.operandAType, lc.operandAValue, allConditions);
    const valueB = this.decompileOperand(lc.operandBType, lc.operandBValue, allConditions);

    switch (lc.operation) {
      // GVAR operations: operandA = index, operandB = value
      case OPERATION.GVAR_INC:
        return this.handleGvarInc(lc, valueB);

      case OPERATION.GVAR_DEC:
        return this.handleGvarDec(lc, valueB);

      // OVERRIDE_THROTTLE_SCALE and OVERRIDE_THROTTLE handled in first switch (structural hoisting)

      // Override operations: operandA = value, operandB = 0
      case OPERATION.SET_VTX_POWER_LEVEL:
        return this.handleSetVtxPowerLevel(valueA);

      case OPERATION.SET_VTX_BAND:
        return this.handleSetVtxBand(valueA);

      case OPERATION.SET_VTX_CHANNEL:
        return this.handleSetVtxChannel(valueA);

      case OPERATION.OVERRIDE_ARMING_SAFETY:
        return this.handleOverrideArmingSafety();

      case OPERATION.SET_OSD_LAYOUT:
        return this.handleSetOsdLayout(valueA);

      // RC_CHANNEL_OVERRIDE: operandA = channel, operandB = value
      case OPERATION.RC_CHANNEL_OVERRIDE:
        return this.handleRcChannelOverride(lc, valueB);

      case OPERATION.LOITER_OVERRIDE:
        return this.handleLoiterOverride(valueA);

      case OPERATION.OVERRIDE_MIN_GROUND_SPEED:
        return this.handleOverrideMinGroundSpeed(valueA);

      case OPERATION.SWAP_ROLL_YAW:
        return this.handleSwapRollYaw();

      case OPERATION.INVERT_ROLL:
        return this.handleInvertRoll();

      case OPERATION.INVERT_PITCH:
        return this.handleInvertPitch();

      case OPERATION.INVERT_YAW:
        return this.handleInvertYaw();

      case OPERATION.SET_HEADING_TARGET:
        return this.handleSetHeadingTarget(valueA);

      case OPERATION.SET_PROFILE:
        return this.handleSetProfile(valueA);

      // FLIGHT_AXIS: operandA = axis, operandB = angle/rate
      case OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE:
        return this.handleFlightAxisAngleOverride(lc, valueB);

      case OPERATION.FLIGHT_AXIS_RATE_OVERRIDE:
        return this.handleFlightAxisRateOverride(lc, valueB);

      case OPERATION.SET_GIMBAL_SENSITIVITY:
        return this.handleSetGimbalSensitivity(valueA);

      case OPERATION.LED_PIN_PWM:
        return this.handleLedPinPwm(lc, valueA);

      // PORT_SET: operandA = pin, operandB = value
      case OPERATION.PORT_SET:
        return this.handlePortSet(lc, valueB);

      case OPERATION.DISABLE_GPS_FIX:
        return this.handleDisableGpsFix();

      case OPERATION.RESET_MAG_CALIBRATION:
        return this.handleResetMagCalibration();

      case OPERATION.ADD:
      case OPERATION.SUB:
      case OPERATION.MUL:
      case OPERATION.DIV:
        return this.handleArithmeticOperation(lc, value, allConditions);

      default:
        this.addWarning(`Unknown operation ${lc.operation} (${getOperationName(lc.operation)}) in action`);
        return `// Unknown operation: ${getOperationName(lc.operation)}`;
    }
  }

  /**
   * Handle GVAR_SET with structural hoisting.
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for LC chain traversal
   * @returns {string} JavaScript statement(s)
   */
  handleGvarSet(lc, allConditions) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `inav.gvar[${lc.operandAValue}]`;
    return this.handleAssignmentWithHoisting(
      targetName,
      lc.operandBType, lc.operandBValue,
      allConditions
    );
  }

  /**
   * Calculate the depth of an LC chain (how many LC→LC references deep).
   * @param {number} lcIndex - Starting LC index
   * @param {Array} allConditions - All conditions
   * @param {Set} visited - Visited set for cycle detection
   * @returns {number} Chain depth (0 for leaf operands, 1+ for LC chains)
   */
  getLCChainDepth(lcIndex, allConditions, visited = new Set()) {
    if (visited.has(lcIndex)) return 0; // Cycle detection
    visited.add(lcIndex);

    const lc = allConditions.find(c => c.index === lcIndex);
    if (!lc) return 0;

    let maxChildDepth = 0;
    if (lc.operandAType === OPERAND_TYPE.LC) {
      maxChildDepth = Math.max(maxChildDepth,
        this.getLCChainDepth(lc.operandAValue, allConditions, new Set(visited)));
    }
    if (lc.operandBType === OPERAND_TYPE.LC) {
      maxChildDepth = Math.max(maxChildDepth,
        this.getLCChainDepth(lc.operandBValue, allConditions, new Set(visited)));
    }

    return 1 + maxChildDepth;
  }

  /**
   * Decompile an operand, hoisting sub-expressions that exceed depth threshold.
   * @param {number} type - Operand type
   * @param {number} value - Operand value
   * @param {Array} allConditions - All conditions
   * @param {number} currentDepth - Current depth in the expression tree
   * @param {number} maxDepth - Maximum depth before hoisting
   * @param {Array} statements - Array to collect hoisted let statements
   * @param {Map} hoistedVars - Map of lcIndex -> varName for deduplication
   * @returns {string} Decompiled expression (possibly referencing hoisted vars)
   */
  decompileWithHoisting(type, value, allConditions, currentDepth, maxDepth, statements, hoistedVars) {
    // Non-LC operands are always leaf nodes - just stringify
    if (type !== OPERAND_TYPE.LC) {
      return this.decompileOperand(type, value, allConditions);
    }

    const lc = allConditions.find(c => c.index === value);
    if (!lc) {
      return this.decompileOperand(type, value, allConditions);
    }

    // Check if this LC should be hoisted (depth exceeds threshold)
    const subDepth = this.getLCChainDepth(value, allConditions);
    if (currentDepth > 0 && subDepth > 0 && currentDepth + subDepth > maxDepth) {
      // Check if already hoisted (deduplication)
      if (hoistedVars.has(value)) {
        return hoistedVars.get(value);
      }

      // Hoist this sub-expression: decompile it fully and assign to a variable
      const varName = this.generateHoistVarName(lc.operation);
      const fullExpr = this.decompileOperand(type, value, allConditions);
      statements.push(`let ${varName} = ${fullExpr};`);
      hoistedVars.set(value, varName);
      return varName;
    }

    // Not hoisting - recursively decompile operands with hoisting enabled
    const leftExpr = this.decompileWithHoisting(
      lc.operandAType, lc.operandAValue, allConditions,
      currentDepth + 1, maxDepth, statements, hoistedVars
    );
    const rightExpr = this.decompileWithHoisting(
      lc.operandBType, lc.operandBValue, allConditions,
      currentDepth + 1, maxDepth, statements, hoistedVars
    );

    // Build expression string for this LC operation
    return this.buildOperationExpr(lc.operation, leftExpr, rightExpr);
  }

  /**
   * Generate a descriptive variable name for a hoisted expression.
   * Uses shared counters from decompiler to ensure unique names across all assignments.
   * @param {number} operation - The LC operation type
   * @returns {string} Variable name
   */
  generateHoistVarName(operation) {
    const nameMap = {
      [OPERATION.MIN]: 'min',
      [OPERATION.MAX]: 'max',
      [OPERATION.ADD]: 'sum',
      [OPERATION.SUB]: 'diff',
      [OPERATION.MUL]: 'product',
      [OPERATION.DIV]: 'quotient',
      [OPERATION.MAP_INPUT]: 'mapped',
      [OPERATION.MAP_OUTPUT]: 'scaled'
    };
    const baseName = nameMap[operation] || 'temp';

    // Use shared counters from decompiler to ensure unique names across all hoisted expressions
    const counters = this.getHoistedVarCounters?.() || new Map();
    const currentCount = (counters.get(baseName) || 0) + 1;
    counters.set(baseName, currentCount);

    return currentCount === 1 ? baseName : `${baseName}${currentCount}`;
  }

  /**
   * Build expression string for an operation with given operand expressions.
   * @param {number} operation - The LC operation type
   * @param {string} left - Left operand expression string
   * @param {string} right - Right operand expression string
   * @returns {string} Combined expression string
   */
  buildOperationExpr(operation, left, right) {
    switch (operation) {
      case OPERATION.MIN:
        return `Math.min(${left}, ${right})`;
      case OPERATION.MAX:
        return `Math.max(${left}, ${right})`;
      case OPERATION.ADD:
        return `(${left} + ${right})`;
      case OPERATION.SUB:
        return `(${left} - ${right})`;
      case OPERATION.MUL:
        return `(${left} * ${right})`;
      case OPERATION.DIV:
        return `(${left} / ${right})`;
      case OPERATION.MODULUS:
        return `(${left} % ${right})`;
      case OPERATION.MAP_INPUT:
        // MAP_INPUT: scales A from [0:B] to [0:1000]
        return `Math.min(1000, Math.max(0, ${left} * 1000 / ${right}))`;
      case OPERATION.MAP_OUTPUT:
        // MAP_OUTPUT: scales A from [0:1000] to [0:B]
        return `Math.min(${right}, Math.max(0, ${left} * ${right} / 1000))`;
      default:
        // Fallback to decompileOperand for unsupported operations
        return `/* unsupported op ${operation} */ (${left}, ${right})`;
    }
  }

  /**
   * Remove unnecessary outer parentheses from an expression
   * @param {string} expr - Expression that may have outer parens
   * @returns {string} Expression without superfluous outer parens
   */
  stripOuterParens(expr) {
    // Only strip if entire expression is wrapped in matching parens
    if (expr.startsWith('(') && expr.endsWith(')')) {
      // Check if these parens actually match (not nested like "(a) + (b)")
      let depth = 0;
      for (let i = 0; i < expr.length - 1; i++) {
        if (expr[i] === '(') depth++;
        else if (expr[i] === ')') depth--;
        // If depth hits 0 before the end, the outer parens don't match
        if (depth === 0) return expr;
      }
      // The outer parens match - strip them
      return expr.slice(1, -1);
    }
    return expr;
  }

  // NOTE: Old string-parsing hoisting methods (countNestingDepth, findInnermostFunctionCall,
  // simplifyNestedExpr, generateVarName) have been removed. Hoisting is now done structurally
  // at the LC level in handleAssignmentWithHoisting/decompileWithHoisting.

  handleGvarInc(lc, value) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `inav.gvar[${lc.operandAValue}]`;
    return `${targetName} = ${targetName} + ${value};`;
  }

  handleGvarDec(lc, value) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `inav.gvar[${lc.operandAValue}]`;
    return `${targetName} = ${targetName} - ${value};`;
  }

  /**
   * Handle OVERRIDE_THROTTLE_SCALE with structural hoisting.
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for LC chain traversal
   * @returns {string} JavaScript statement(s)
   */
  handleOverrideThrottleScale(lc, allConditions) {
    return this.handleAssignmentWithHoisting(
      'inav.override.throttleScale',
      lc.operandAType, lc.operandAValue,  // Value is in operandA (per logic_condition.c)
      allConditions
    );
  }

  /**
   * Handle OVERRIDE_THROTTLE with structural hoisting.
   * Note: OVERRIDE_THROTTLE uses operandA for the value, not operandB.
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for LC chain traversal
   * @returns {string} JavaScript statement(s)
   */
  handleOverrideThrottle(lc, allConditions) {
    return this.handleAssignmentWithHoisting(
      'inav.override.throttle',
      lc.operandAType, lc.operandAValue,  // Note: uses operandA
      allConditions
    );
  }

  /**
   * Generic handler for assignments that may need structural hoisting.
   * @param {string} targetName - Assignment target (e.g., 'inav.override.throttle')
   * @param {number} valueType - Operand type for the value
   * @param {number} valueValue - Operand value
   * @param {Array} allConditions - All conditions for LC chain traversal
   * @returns {string} JavaScript statement(s)
   */
  handleAssignmentWithHoisting(targetName, valueType, valueValue, allConditions) {
    const maxDepth = 3;

    // Check if value operand is an LC reference with deep chain
    if (valueType === OPERAND_TYPE.LC && allConditions) {
      const depth = this.getLCChainDepth(valueValue, allConditions);
      if (depth > maxDepth) {
        // Hoist deep sub-expressions at LC level (structural, not string-based)
        const statements = [];
        const hoistedVars = new Map();
        const expr = this.decompileWithHoisting(
          valueType, valueValue, allConditions,
          0, maxDepth, statements, hoistedVars
        );
        if (statements.length > 0) {
          return statements.join('\n') + `\n${targetName} = ${expr};`;
        }
        return `${targetName} = ${expr};`;
      }
    }

    // Simple case - no deep nesting
    const value = this.decompileOperand(valueType, valueValue, allConditions);
    const cleanValue = this.stripOuterParens(value);
    return `${targetName} = ${cleanValue};`;
  }

  handleSetVtxPowerLevel(value) {
    return `inav.override.vtx.power = ${value};`;
  }

  handleSetVtxBand(value) {
    return `inav.override.vtx.band = ${value};`;
  }

  handleSetVtxChannel(value) {
    return `inav.override.vtx.channel = ${value};`;
  }

  handleOverrideArmingSafety() {
    return `inav.override.armSafety = true;`;
  }

  handleSetOsdLayout(value) {
    return `inav.override.osdLayout = ${value};`;
  }

  handleRcChannelOverride(lc, value) {
    // operandA contains channel number (1-based: 1-18)
    // Use cleaner array syntax instead of override.rcChannel()
    return `inav.rc[${lc.operandAValue}] = ${value};`;
  }

  handleLoiterOverride(value) {
    return `inav.override.loiterRadius = ${value};`;
  }

  handleOverrideMinGroundSpeed(value) {
    return `inav.override.minGroundSpeed = ${value};`;
  }

  handleSwapRollYaw() {
    return `inav.override.swapRollYaw = true;`;
  }

  handleInvertRoll() {
    return `inav.override.invertRoll = true;`;
  }

  handleInvertPitch() {
    return `inav.override.invertPitch = true;`;
  }

  handleInvertYaw() {
    return `inav.override.invertYaw = true;`;
  }

  handleSetHeadingTarget(value) {
    // Value is in centidegrees
    return `inav.override.headingTarget = ${value};`;
  }

  handleSetProfile(value) {
    return `inav.override.profile = ${value};`;
  }

  handleFlightAxisAngleOverride(lc, value) {
    // operandA is axis (0=roll, 1=pitch, 2=yaw), operandB is angle in degrees
    const axisNames = ['roll', 'pitch', 'yaw'];
    const axisIndex = lc.operandAValue;
    const axisName = axisNames[axisIndex] || axisIndex;
    return `inav.override.flightAxis.${axisName}.angle = ${value};`;
  }

  handleFlightAxisRateOverride(lc, value) {
    // operandA is axis (0=roll, 1=pitch, 2=yaw), operandB is rate in deg/s
    const axisNames = ['roll', 'pitch', 'yaw'];
    const axisIndex = lc.operandAValue;
    const axisName = axisNames[axisIndex] || axisIndex;
    return `inav.override.flightAxis.${axisName}.rate = ${value};`;
  }

  handleSetGimbalSensitivity(value) {
    return `inav.override.gimbalSensitivity = ${value};`;
  }

  handleLedPinPwm(lc, value) {
    // operandA is pin (0-7), operandB is PWM value
    this.addWarning(`LED_PIN_PWM may need verification - check API syntax`);
    return `inav.override.ledPin(${lc.operandAValue}, ${value});`;
  }

  handlePortSet(lc, value) {
    // operandA is port (0-7), operandB is value (0 or 1)
    this.addWarning(`PORT_SET may not be available in JavaScript API`);
    return `/* inav.override.port(${lc.operandAValue}, ${value}); */ // PORT_SET - may not be supported`;
  }

  handleDisableGpsFix() {
    return `inav.override.disableGpsFix = true;`;
  }

  handleResetMagCalibration() {
    return `inav.override.resetMagCalibration = true;`;
  }

  handleArithmeticOperation(lc, value, allConditions) {
    const target = this.decompileOperand(lc.operandAType, lc.operandAValue, allConditions);
    const ops = {
      [OPERATION.ADD]: '+',
      [OPERATION.SUB]: '-',
      [OPERATION.MUL]: '*',
      [OPERATION.DIV]: '/'
    };
    const op = ops[lc.operation];
    return `${target} = ${target} ${op} ${value};`;
  }
}

export { ActionDecompiler };
