/**
 * INAV Condition Decompiler Helper
 *
 * Location: js/transpiler/transpiler/condition_decompiler.js
 *
 * Handles decompilation of conditions from INAV logic conditions back to JavaScript.
 * Extracted from decompiler.js to improve modularity.
 */

'use strict';

import {
  OPERATION,
  OPERAND_TYPE,
  getOperationName
} from './inav_constants.js';

/**
 * Simple binary operations that can be expressed as template strings.
 * These don't need special logic - just format left and right operands.
 */
const SIMPLE_BINARY_OPS = {
  [OPERATION.EQUAL]: (l, r) => `${l} === ${r}`,
  [OPERATION.GREATER_THAN]: (l, r) => `${l} > ${r}`,
  [OPERATION.LOWER_THAN]: (l, r) => `${l} < ${r}`,
  [OPERATION.AND]: (l, r) => `${l} && ${r}`,
  // OR wrapped in parentheses to preserve precedence when nested inside AND
  // Without parens: "a && b || c" parses as "(a && b) || c" - wrong!
  // With parens: "a && (b || c)" preserves intended logic
  [OPERATION.OR]: (l, r) => `(${l} || ${r})`,
  [OPERATION.XOR]: (l, r) => `xor(${l}, ${r})`,
  [OPERATION.NAND]: (l, r) => `nand(${l}, ${r})`,
  [OPERATION.NOR]: (l, r) => `nor(${l}, ${r})`,
  [OPERATION.MODULUS]: (l, r) => `(${l} % ${r})`,
  [OPERATION.MIN]: (l, r) => `Math.min(${l}, ${r})`,
  [OPERATION.MAX]: (l, r) => `Math.max(${l}, ${r})`,
};

/**
 * Simple unary operations (only use left operand).
 */
const SIMPLE_UNARY_OPS = {
  [OPERATION.TRUE]: () => 'true',
  [OPERATION.LOW]: (l) => `${l}.low`,
  [OPERATION.MID]: (l) => `${l}.mid`,
  [OPERATION.HIGH]: (l) => `${l}.high`,
};

/**
 * Helper class for decompiling condition logic
 */
class ConditionDecompiler {
  /**
   * @param {Object} context - Context object containing dependencies
   * @param {Function} context.decompileOperand - Function to decompile operands
   * @param {Function} context.addWarning - Function to add warnings
   */
  constructor(context) {
    this.decompileOperand = context.decompileOperand;
    this.addWarning = context.addWarning;
  }

  /**
   * Decompile a condition to JavaScript expression
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for recursive resolution
   * @param {Set} visited - Set of visited LC indices to prevent infinite recursion
   * @returns {string} JavaScript expression
   */
  decompile(lc, allConditions = null, visited = new Set()) {
    const left = this.decompileOperand(lc.operandAType, lc.operandAValue, allConditions, visited);
    const right = this.decompileOperand(lc.operandBType, lc.operandBValue, allConditions, visited);

    // Check simple unary operations (only use left operand)
    const unaryHandler = SIMPLE_UNARY_OPS[lc.operation];
    if (unaryHandler) {
      return unaryHandler(left);
    }

    // Check simple binary operations (template string with left and right)
    const binaryHandler = SIMPLE_BINARY_OPS[lc.operation];
    if (binaryHandler) {
      return binaryHandler(left, right);
    }

    // Complex operations that need special handling
    switch (lc.operation) {
      case OPERATION.NOT:
        return this.handleNot(lc, allConditions, visited);

      // Arithmetic with simplification (x + 0 = x, etc.)
      case OPERATION.ADD:
        return this.handleAdd(left, right);
      case OPERATION.SUB:
        return this.handleSub(left, right);
      case OPERATION.MUL:
        return this.handleMul(left, right);
      case OPERATION.DIV:
        return this.handleDiv(left, right);

      // Trig functions with special case for right === '0'
      case OPERATION.SIN:
        return this.handleSin(left, right);
      case OPERATION.COS:
        return this.handleCos(left, right);
      case OPERATION.TAN:
        return this.handleTan(left, right);

      // Special patterns (usually handled by detectSpecialPattern)
      case OPERATION.APPROX_EQUAL:
        return this.handleApproxEqual(left, right, lc.flags);
      case OPERATION.EDGE:
        return this.handleEdge(left, right);
      case OPERATION.STICKY:
        return this.handleSticky(left, right);
      case OPERATION.DELAY:
        return this.handleDelay(left, right);
      case OPERATION.TIMER:
        return this.handleTimer(left, right);
      case OPERATION.DELTA:
        return this.handleDelta(left, right);

      // Map operations (complex formulas)
      case OPERATION.MAP_INPUT:
        return this.handleMapInput(left, right);
      case OPERATION.MAP_OUTPUT:
        return this.handleMapOutput(left, right);

      default:
        this.addWarning(`Unknown operation ${lc.operation} (${getOperationName(lc.operation)}) in condition`);
        return 'true';
    }
  }

  // NOTE: Simple operations (TRUE, EQUAL, GREATER_THAN, LOWER_THAN, LOW, MID, HIGH,
  // AND, OR, XOR, NAND, NOR, MODULUS, MIN, MAX) are handled by lookup tables above.

  /**
   * Handle NOT operation using structural pattern matching on LC data.
   *
   * Instead of parsing strings with regex, we inspect the referenced LC directly
   * to determine the best output form. This is more robust and handles all cases.
   *
   * @param {Object} lc - The NOT logic condition
   * @param {Array} allConditions - All conditions for resolving LC references
   * @param {Set} visited - Visited set for cycle detection
   * @returns {string} JavaScript expression
   */
  handleNot(lc, allConditions, visited) {
    // If operandA is an LC reference, we can inspect the referenced LC directly
    if (lc.operandAType === OPERAND_TYPE.LC && allConditions) {
      const innerLcIndex = lc.operandAValue;
      const innerLC = allConditions.find(c => c.index === innerLcIndex);

      // Only do structural optimizations if inner LC has no activator
      // If it has an activator, it may be hoisted and we should use decompileOperand
      // to get the hoisted variable name (which preserves the activator relationship)
      if (innerLC && innerLC.activatorId === -1) {
        // Double negation: NOT(NOT(x)) -> x
        if (innerLC.operation === OPERATION.NOT) {
          // Recursively decompile the inner NOT's operand
          return this.decompileOperand(innerLC.operandAType, innerLC.operandAValue, allConditions, visited);
        }

        // NOT(EQUAL(x, y)) -> x !== y
        if (innerLC.operation === OPERATION.EQUAL) {
          const left = this.decompileOperand(innerLC.operandAType, innerLC.operandAValue, allConditions, visited);
          const right = this.decompileOperand(innerLC.operandBType, innerLC.operandBValue, allConditions, visited);
          return `${left} !== ${right}`;
        }

        // NOT(GREATER_THAN(x, y)) -> x <= y
        if (innerLC.operation === OPERATION.GREATER_THAN) {
          const left = this.decompileOperand(innerLC.operandAType, innerLC.operandAValue, allConditions, visited);
          const right = this.decompileOperand(innerLC.operandBType, innerLC.operandBValue, allConditions, visited);
          return `${left} <= ${right}`;
        }

        // NOT(LOWER_THAN(x, y)) -> x >= y
        if (innerLC.operation === OPERATION.LOWER_THAN) {
          const left = this.decompileOperand(innerLC.operandAType, innerLC.operandAValue, allConditions, visited);
          const right = this.decompileOperand(innerLC.operandBType, innerLC.operandBValue, allConditions, visited);
          return `${left} >= ${right}`;
        }

        // NOT(AND(a, b)) -> !(a && b)
        if (innerLC.operation === OPERATION.AND) {
          const left = this.decompileOperand(innerLC.operandAType, innerLC.operandAValue, allConditions, visited);
          const right = this.decompileOperand(innerLC.operandBType, innerLC.operandBValue, allConditions, visited);
          return `!(${left} && ${right})`;
        }

        // NOT(OR(a, b)) -> !(a || b)
        if (innerLC.operation === OPERATION.OR) {
          const left = this.decompileOperand(innerLC.operandAType, innerLC.operandAValue, allConditions, visited);
          const right = this.decompileOperand(innerLC.operandBType, innerLC.operandBValue, allConditions, visited);
          return `!(${left} || ${right})`;
        }
      }
    }

    // Fallback: decompile operand and wrap with !
    const inner = this.decompileOperand(lc.operandAType, lc.operandAValue, allConditions, visited);

    // Simple identifier/subscript - no parens needed
    if (/^\w+(?:\[\d+\])?$/.test(inner)) {
      return `!${inner}`;
    }

    // Complex expression - wrap in parens for precedence
    return `!(${inner})`;
  }

  // NOTE: XOR, NAND, NOR are handled by SIMPLE_BINARY_OPS lookup table above.

  handleApproxEqual(left, right, flags = 0) {
    // APPROX_EQUAL: B is within 1% of A (default), or custom tolerance in flags
    // flags field stores custom tolerance percentage (0 = default 1%)
    if (flags > 0) {
      return `approxEqual(${left}, ${right}, ${flags})`;
    }
    return `approxEqual(${left}, ${right})`;
  }

  handleEdge(left, right) {
    // Edge returns true on rising edge of condition for duration ms
    // Note: usedFeatures tracking happens in main decompiler
    return `edge(${left}, ${right})`;
  }

  handleSticky(left, right) {
    // Sticky uses two LC results as ON/OFF conditions
    return `${left} /* sticky (on: ${left}, off: ${right}) */`;
  }

  handleDelay(left, right) {
    // Delay returns true after condition held for duration ms
    // Note: usedFeatures tracking happens in main decompiler
    return `delay(${left}, ${right})`;
  }

  handleAdd(left, right) {
    // Simplify x + 0 or 0 + x
    if (right === '0') {
      return left;
    }
    if (left === '0') {
      return right;
    }
    return `(${left} + ${right})`;
  }

  handleSub(left, right) {
    // Simplify x - 0
    if (right === '0') {
      return left;
    }
    return `(${left} - ${right})`;
  }

  handleMul(left, right) {
    // Simplify x * 1 or 1 * x, x * 0 or 0 * x
    if (right === '1') {
      return left;
    }
    if (left === '1') {
      return right;
    }
    if (right === '0' || left === '0') {
      return '0';
    }
    return `(${left} * ${right})`;
  }

  handleDiv(left, right) {
    // Simplify x / 1
    if (right === '1') {
      return left;
    }
    return `(${left} / ${right})`;
  }

  // NOTE: MODULUS, MIN, MAX are handled by SIMPLE_BINARY_OPS lookup table above.

  handleSin(left, right) {
    // SIN: sin(A degrees) * B, or * 500 if B is 0
    if (right === '0') {
      return `(Math.sin(${left} * Math.PI / 180) * 500)`;
    }
    return `(Math.sin(${left} * Math.PI / 180) * ${right})`;
  }

  handleCos(left, right) {
    // COS: cos(A degrees) * B, or * 500 if B is 0
    if (right === '0') {
      return `(Math.cos(${left} * Math.PI / 180) * 500)`;
    }
    return `(Math.cos(${left} * Math.PI / 180) * ${right})`;
  }

  handleTan(left, right) {
    // TAN: tan(A degrees) * B, or * 500 if B is 0
    if (right === '0') {
      return `(Math.tan(${left} * Math.PI / 180) * 500)`;
    }
    return `(Math.tan(${left} * Math.PI / 180) * ${right})`;
  }

  handleMapInput(left, right) {
    // MAP_INPUT: scales A from [0:B] to [0:1000]
    // Note: INAV integer division truncates (floors), no rounding needed
    return `Math.min(1000, Math.max(0, ${left} * 1000 / ${right}))`;
  }

  handleMapOutput(left, right) {
    // MAP_OUTPUT: scales A from [0:1000] to [0:B]
    // Note: INAV integer division truncates (floors), no rounding needed
    return `Math.min(${right}, Math.max(0, ${left} * ${right} / 1000))`;
  }

  handleTimer(left, right) {
    // TIMER: ON for A ms, OFF for B ms
    // This case shouldn't normally be hit because detectSpecialPattern handles it
    // But include for completeness
    return `/* timer(${left}ms ON, ${right}ms OFF) */ true`;
  }

  handleDelta(left, right) {
    // DELTA: true when A changes by B or more within 100ms
    return `delta(${left}, ${right})`;
  }
}

export { ConditionDecompiler };
