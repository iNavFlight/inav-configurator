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
  getOperationName
} from './inav_constants.js';

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

    // Operation constants for structural pattern matching
    this.OPERAND_TYPE_LC = 4;  // OPERAND_TYPE.LC
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

    switch (lc.operation) {
      case OPERATION.TRUE:
        return this.handleTrue();

      case OPERATION.EQUAL:
        return this.handleEqual(left, right);

      case OPERATION.GREATER_THAN:
        return this.handleGreaterThan(left, right);

      case OPERATION.LOWER_THAN:
        return this.handleLowerThan(left, right);

      case OPERATION.LOW:
        return this.handleLow(left);

      case OPERATION.MID:
        return this.handleMid(left);

      case OPERATION.HIGH:
        return this.handleHigh(left);

      case OPERATION.AND:
        return this.handleAnd(left, right);

      case OPERATION.OR:
        return this.handleOr(left, right);

      case OPERATION.NOT:
        return this.handleNot(lc, allConditions, visited);

      case OPERATION.XOR:
        return this.handleXor(left, right);

      case OPERATION.NAND:
        return this.handleNand(left, right);

      case OPERATION.NOR:
        return this.handleNor(left, right);

      case OPERATION.APPROX_EQUAL:
        return this.handleApproxEqual(left, right);

      case OPERATION.EDGE:
        return this.handleEdge(left, right);

      case OPERATION.STICKY:
        return this.handleSticky(left, right);

      case OPERATION.DELAY:
        return this.handleDelay(left, right);

      case OPERATION.ADD:
        return this.handleAdd(left, right);

      case OPERATION.SUB:
        return this.handleSub(left, right);

      case OPERATION.MUL:
        return this.handleMul(left, right);

      case OPERATION.DIV:
        return this.handleDiv(left, right);

      case OPERATION.MODULUS:
        return this.handleModulus(left, right);

      case OPERATION.MIN:
        return this.handleMin(left, right);

      case OPERATION.MAX:
        return this.handleMax(left, right);

      case OPERATION.SIN:
        return this.handleSin(left, right);

      case OPERATION.COS:
        return this.handleCos(left, right);

      case OPERATION.TAN:
        return this.handleTan(left, right);

      case OPERATION.MAP_INPUT:
        return this.handleMapInput(left, right);

      case OPERATION.MAP_OUTPUT:
        return this.handleMapOutput(left, right);

      case OPERATION.TIMER:
        return this.handleTimer(left, right);

      case OPERATION.DELTA:
        return this.handleDelta(left, right);

      default:
        this.addWarning(`Unknown operation ${lc.operation} (${getOperationName(lc.operation)}) in condition`);
        return 'true';
    }
  }

  handleTrue() {
    return 'true';
  }

  handleEqual(left, right) {
    return `${left} === ${right}`;
  }

  handleGreaterThan(left, right) {
    return `${left} > ${right}`;
  }

  handleLowerThan(left, right) {
    return `${left} < ${right}`;
  }

  handleLow(left) {
    return `${left}.low`;
  }

  handleMid(left) {
    return `${left}.mid`;
  }

  handleHigh(left) {
    return `${left}.high`;
  }

  handleAnd(left, right) {
    return `${left} && ${right}`;
  }

  handleOr(left, right) {
    return `${left} || ${right}`;
  }

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
    if (lc.operandAType === this.OPERAND_TYPE_LC && allConditions) {
      const innerLcIndex = lc.operandAValue;
      const innerLC = allConditions.find(c => c.index === innerLcIndex);

      if (innerLC) {
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

  handleXor(left, right) {
    // XOR: true if exactly one operand is true
    return `((${left}) ? !(${right}) : (${right}))`;
  }

  handleNand(left, right) {
    // NAND: NOT AND
    return `!(${left} && ${right})`;
  }

  handleNor(left, right) {
    // NOR: NOT OR
    return `!(${left} || ${right})`;
  }

  handleApproxEqual(left, right) {
    // APPROX_EQUAL: B is within 1% of A
    this.addWarning(`APPROX_EQUAL operation decompiled as === (1% tolerance not preserved)`);
    return `${left} === ${right}`;
  }

  handleEdge(left, right) {
    // Edge uses result of another LC as condition
    // This case shouldn't normally be hit because detectSpecialPattern handles it
    // But include for completeness
    return `${left} /* edge with duration ${right}ms */`;
  }

  handleSticky(left, right) {
    // Sticky uses two LC results as ON/OFF conditions
    return `${left} /* sticky (on: ${left}, off: ${right}) */`;
  }

  handleDelay(left, right) {
    // Delay uses result of another LC with timeout
    return `${left} /* delay ${right}ms */`;
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

  handleModulus(left, right) {
    return `(${left} % ${right})`;
  }

  handleMin(left, right) {
    return `Math.min(${left}, ${right})`;
  }

  handleMax(left, right) {
    return `Math.max(${left}, ${right})`;
  }

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
