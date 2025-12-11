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
   */
  constructor(context) {
    this.decompileOperand = context.decompileOperand;
    this.getVarNameForGvar = context.getVarNameForGvar;
    this.addWarning = context.addWarning;
  }

  /**
   * Decompile an action to JavaScript statement
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for recursive resolution
   * @returns {string} JavaScript statement
   */
  decompile(lc, allConditions = null) {
    const value = this.decompileOperand(lc.operandBType, lc.operandBValue, allConditions);

    switch (lc.operation) {
      case OPERATION.GVAR_SET:
        return this.handleGvarSet(lc, value);

      case OPERATION.GVAR_INC:
        return this.handleGvarInc(lc, value);

      case OPERATION.GVAR_DEC:
        return this.handleGvarDec(lc, value);

      case OPERATION.OVERRIDE_THROTTLE_SCALE:
        return this.handleOverrideThrottleScale(value);

      case OPERATION.OVERRIDE_THROTTLE:
        // OVERRIDE_THROTTLE uses operandA for the throttle value, not operandB
        const throttleValue = this.decompileOperand(lc.operandAType, lc.operandAValue, allConditions);
        return this.handleOverrideThrottle(throttleValue);

      case OPERATION.SET_VTX_POWER_LEVEL:
        return this.handleSetVtxPowerLevel(value);

      case OPERATION.SET_VTX_BAND:
        return this.handleSetVtxBand(value);

      case OPERATION.SET_VTX_CHANNEL:
        return this.handleSetVtxChannel(value);

      case OPERATION.OVERRIDE_ARMING_SAFETY:
        return this.handleOverrideArmingSafety();

      case OPERATION.SET_OSD_LAYOUT:
        return this.handleSetOsdLayout(value);

      case OPERATION.RC_CHANNEL_OVERRIDE:
        return this.handleRcChannelOverride(lc, value);

      case OPERATION.LOITER_OVERRIDE:
        return this.handleLoiterOverride(value);

      case OPERATION.OVERRIDE_MIN_GROUND_SPEED:
        return this.handleOverrideMinGroundSpeed(value);

      case OPERATION.SWAP_ROLL_YAW:
        return this.handleSwapRollYaw();

      case OPERATION.INVERT_ROLL:
        return this.handleInvertRoll();

      case OPERATION.INVERT_PITCH:
        return this.handleInvertPitch();

      case OPERATION.INVERT_YAW:
        return this.handleInvertYaw();

      case OPERATION.SET_HEADING_TARGET:
        return this.handleSetHeadingTarget(value);

      case OPERATION.SET_PROFILE:
        return this.handleSetProfile(value);

      case OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE:
        return this.handleFlightAxisAngleOverride(lc, value);

      case OPERATION.FLIGHT_AXIS_RATE_OVERRIDE:
        return this.handleFlightAxisRateOverride(lc, value);

      case OPERATION.SET_GIMBAL_SENSITIVITY:
        return this.handleSetGimbalSensitivity(value);

      case OPERATION.LED_PIN_PWM:
        return this.handleLedPinPwm(lc, value);

      case OPERATION.PORT_SET:
        return this.handlePortSet(lc, value);

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

  handleGvarSet(lc, value) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `gvar[${lc.operandAValue}]`;
    const cleanValue = this.stripOuterParens(value);

    // Check if expression is deeply nested and should be simplified
    const { statements, expr } = this.simplifyNestedExpr(cleanValue);
    if (statements.length > 0) {
      return statements.join('\n') + `\n${targetName} = ${expr};`;
    }

    return `${targetName} = ${cleanValue};`;
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

  /**
   * Count the maximum nesting depth of function calls in an expression
   * @param {string} expr - Expression to analyze
   * @returns {number} Maximum nesting depth
   */
  countNestingDepth(expr) {
    let maxDepth = 0;
    let currentDepth = 0;
    for (const char of expr) {
      if (char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === ')') {
        currentDepth--;
      }
    }
    return maxDepth;
  }

  /**
   * Find the innermost function call (Math.min, Math.max, etc.) and its argument
   * @param {string} expr - Expression to search
   * @returns {Object|null} {func, arg, start, end} or null if not found
   */
  findInnermostFunctionCall(expr) {
    // Look for patterns like Math.min(...), Math.max(...), Math.abs(...)
    // Note: Math.round/floor/ceil are not supported by INAV logic conditions
    const funcPattern = /Math\.(min|max|abs)\(/g;
    let match;
    let innermost = null;
    let innermostDepth = -1;

    while ((match = funcPattern.exec(expr)) !== null) {
      const funcStart = match.index;
      const funcName = match[0].slice(0, -1); // Remove trailing '('
      const argStart = funcStart + match[0].length;

      // Find the matching closing paren
      let depth = 1;
      let argEnd = argStart;
      while (argEnd < expr.length && depth > 0) {
        if (expr[argEnd] === '(') depth++;
        else if (expr[argEnd] === ')') depth--;
        argEnd++;
      }
      argEnd--; // Back up to the closing paren

      const arg = expr.slice(argStart, argEnd);
      const argDepth = this.countNestingDepth(arg);

      // We want the function whose argument has the LEAST nesting (i.e., innermost)
      if (innermost === null || argDepth < innermostDepth) {
        innermost = {
          func: funcName,
          arg: arg,
          fullMatch: expr.slice(funcStart, argEnd + 1),
          start: funcStart,
          end: argEnd + 1
        };
        innermostDepth = argDepth;
      }
    }

    return innermost;
  }

  /**
   * Simplify a deeply nested expression by hoisting inner parts to variables
   * @param {string} expr - Expression to simplify
   * @param {number} maxDepth - Maximum allowed nesting depth (default 3)
   * @returns {Object} {statements: string[], expr: string}
   */
  simplifyNestedExpr(expr, maxDepth = 3) {
    const statements = [];
    let simplified = expr;
    let varCounter = 1;
    const hoistedExprs = new Map(); // Map expression -> variable name (for deduplication)

    while (this.countNestingDepth(simplified) > maxDepth) {
      const innermost = this.findInnermostFunctionCall(simplified);
      if (!innermost) break;

      // Check if we've already hoisted this exact expression
      let varName = hoistedExprs.get(innermost.fullMatch);
      if (!varName) {
        // Generate a descriptive variable name based on the function
        varName = this.generateVarName(innermost.func, varCounter++);
        hoistedExprs.set(innermost.fullMatch, varName);

        // Create the hoisted statement
        statements.push(`let ${varName} = ${innermost.fullMatch};`);
      }

      // Replace the function call with the variable
      simplified = simplified.slice(0, innermost.start) + varName + simplified.slice(innermost.end);
    }

    return { statements, expr: simplified };
  }

  /**
   * Generate a readable variable name for a hoisted expression
   * @param {string} funcName - The function being hoisted (e.g., "Math.min")
   * @param {number} counter - Counter for uniqueness
   * @returns {string} Variable name
   */
  generateVarName(funcName, counter) {
    // Note: Math.round/floor/ceil are not supported by INAV logic conditions
    const nameMap = {
      'Math.min': 'clamped',
      'Math.max': 'bounded',
      'Math.abs': 'absolute'
    };
    const baseName = nameMap[funcName] || 'temp';
    return counter === 1 ? baseName : `${baseName}${counter}`;
  }

  handleGvarInc(lc, value) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `gvar[${lc.operandAValue}]`;
    return `${targetName} = ${targetName} + ${value};`;
  }

  handleGvarDec(lc, value) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `gvar[${lc.operandAValue}]`;
    return `${targetName} = ${targetName} - ${value};`;
  }

  handleOverrideThrottleScale(value) {
    const cleanValue = this.stripOuterParens(value);
    const { statements, expr } = this.simplifyNestedExpr(cleanValue);
    if (statements.length > 0) {
      return statements.join('\n') + `\noverride.throttleScale = ${expr};`;
    }
    return `override.throttleScale = ${cleanValue};`;
  }

  handleOverrideThrottle(value) {
    const cleanValue = this.stripOuterParens(value);
    const { statements, expr } = this.simplifyNestedExpr(cleanValue);
    if (statements.length > 0) {
      return statements.join('\n') + `\noverride.throttle = ${expr};`;
    }
    return `override.throttle = ${cleanValue};`;
  }

  handleSetVtxPowerLevel(value) {
    return `override.vtx.power = ${value};`;
  }

  handleSetVtxBand(value) {
    return `override.vtx.band = ${value};`;
  }

  handleSetVtxChannel(value) {
    return `override.vtx.channel = ${value};`;
  }

  handleOverrideArmingSafety() {
    return `override.armSafety = true;`;
  }

  handleSetOsdLayout(value) {
    return `override.osdLayout = ${value};`;
  }

  handleRcChannelOverride(lc, value) {
    // operandA contains channel number (1-based: 1-18)
    // Use cleaner array syntax instead of override.rcChannel()
    return `rc[${lc.operandAValue}] = ${value};`;
  }

  handleLoiterOverride(value) {
    return `override.loiterRadius = ${value};`;
  }

  handleOverrideMinGroundSpeed(value) {
    return `override.minGroundSpeed = ${value};`;
  }

  handleSwapRollYaw() {
    return `override.swapRollYaw = true;`;
  }

  handleInvertRoll() {
    return `override.invertRoll = true;`;
  }

  handleInvertPitch() {
    return `override.invertPitch = true;`;
  }

  handleInvertYaw() {
    return `override.invertYaw = true;`;
  }

  handleSetHeadingTarget(value) {
    // Value is in centidegrees
    return `override.headingTarget = ${value};`;
  }

  handleSetProfile(value) {
    return `override.profile = ${value};`;
  }

  handleFlightAxisAngleOverride(lc, value) {
    // operandA is axis (0=roll, 1=pitch, 2=yaw), operandB is angle in degrees
    const axisNames = ['roll', 'pitch', 'yaw'];
    const axisIndex = lc.operandAValue;
    const axisName = axisNames[axisIndex] || axisIndex;
    return `override.flightAxis.${axisName}.angle = ${value};`;
  }

  handleFlightAxisRateOverride(lc, value) {
    // operandA is axis (0=roll, 1=pitch, 2=yaw), operandB is rate in deg/s
    const axisNames = ['roll', 'pitch', 'yaw'];
    const axisIndex = lc.operandAValue;
    const axisName = axisNames[axisIndex] || axisIndex;
    return `override.flightAxis.${axisName}.rate = ${value};`;
  }

  handleSetGimbalSensitivity(value) {
    return `override.gimbalSensitivity = ${value};`;
  }

  handleLedPinPwm(lc, value) {
    // operandA is pin (0-7), operandB is PWM value
    this.addWarning(`LED_PIN_PWM may need verification - check API syntax`);
    return `override.ledPin(${lc.operandAValue}, ${value});`;
  }

  handlePortSet(lc, value) {
    // operandA is port (0-7), operandB is value (0 or 1)
    this.addWarning(`PORT_SET may not be available in JavaScript API`);
    return `/* override.port(${lc.operandAValue}, ${value}); */ // PORT_SET - may not be supported`;
  }

  handleDisableGpsFix() {
    return `override.disableGpsFix = true;`;
  }

  handleResetMagCalibration() {
    return `override.resetMagCalibration = true;`;
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
