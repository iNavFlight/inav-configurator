/**
 * INAV Condition Generator Helper
 *
 * Location: js/transpiler/transpiler/condition_generator.js
 *
 * Handles generation of condition logic for the transpiler.
 * Extracted from codegen.js to improve modularity.
 */

'use strict';

import { OPERATION, OPERAND_TYPE } from './inav_constants.js';

/**
 * Helper class for generating condition logic
 */
class ConditionGenerator {
  /**
   * @param {Object} context - Context object containing dependencies
   * @param {Function} context.pushLogicCommand - Function to push logic commands
   * @param {Function} context.getOperand - Function to get operand from value
   * @param {Function} context.validateFunctionArgs - Function to validate function arguments
   * @param {Object} context.errorHandler - Error handler instance
   * @param {Function} context.getLcIndex - Function to get current LC index
   */
  constructor(context) {
    this.pushLogicCommand = context.pushLogicCommand;
    this.getOperand = context.getOperand;
    this.validateFunctionArgs = context.validateFunctionArgs;
    this.errorHandler = context.errorHandler;
    this.getLcIndex = context.getLcIndex;

    // Cache for generated conditions (CSE - Common Subexpression Elimination)
    // Maps condition key -> LC index
    this.conditionCache = new Map();
  }

  /**
   * Reset the condition cache
   * Should be called at the start of each transpilation
   */
  reset() {
    this.conditionCache.clear();
  }

  /**
   * Generate a unique key for a condition for caching purposes
   * @param {string} type - Condition type (binary, logical, etc.)
   * @param {*} params - Parameters that uniquely identify the condition
   * @returns {string} Cache key
   */
  getCacheKey(type, ...params) {
    return `${type}:${params.map(p => JSON.stringify(p)).join(':')}`;
  }

  /**
   * Generate condition logic condition
   * @param {Object} condition - Condition AST node
   * @param {number} activatorId - Activator LC index
   * @returns {number} The LC index of the final condition result
   */
  generate(condition, activatorId) {
    if (!condition) return this.getLcIndex();

    switch (condition.type) {
      case 'BinaryExpression':
        return this.generateBinary(condition, activatorId);
      case 'LogicalExpression':
        return this.generateLogical(condition, activatorId);
      case 'UnaryExpression':
        return this.generateUnary(condition, activatorId);
      case 'MemberExpression':
        return this.generateMember(condition, activatorId);
      case 'Literal':
        return this.generateLiteral(condition, activatorId);
      case 'CallExpression':
        return this.generateCall(condition, activatorId);
      default:
        this.errorHandler.addError(
          `Unsupported condition type: ${condition.type}. Use comparison operators (>, <, ===, etc.) and logical operators (&&, ||, !)`,
          condition,
          'unsupported_condition'
        );
        return this.getLcIndex();
    }
  }

  /**
   * Generate binary expression condition (>, <, ===, etc.)
   * @private
   *
   * Note: INAV Logic Conditions don't have native >=, <=, or != operations.
   * These are synthesized using NOT:
   *   a >= b  →  NOT(a < b)
   *   a <= b  →  NOT(a > b)
   *   a != b  →  NOT(a == b)
   */
  generateBinary(condition, activatorId) {
    const left = this.getOperand(condition.left);
    const right = this.getOperand(condition.right);
    const operator = condition.operator;

    // Handle operators that need synthesis via NOT
    if (operator === '>=' || operator === '<=' || operator === '!=' || operator === '!==') {
      // Get the inverse operation
      const inverseOp = this.getInverseOperation(operator);

      // Check cache for the synthesized condition (operator + operands)
      const cacheKey = this.getCacheKey('binary_synth', operator, left, right, activatorId);
      if (this.conditionCache.has(cacheKey)) {
        return this.conditionCache.get(cacheKey);
      }

      // Check if the inverse comparison already exists in the cache
      // This handles cases like:
      //   if (x < 6) { ... }  // Creates cache entry for "binary:<:x:6:activator"
      //   if (x >= 6) { ... } // Should reuse the existing "x < 6" condition
      const inverseCacheKey = this.getCacheKey('binary', inverseOp, left, right, activatorId);
      let comparisonId;

      if (this.conditionCache.has(inverseCacheKey)) {
        // Reuse existing inverse comparison
        comparisonId = this.conditionCache.get(inverseCacheKey);
      } else {
        // Generate the inverse comparison and cache it
        comparisonId = this.pushLogicCommand(inverseOp, left, right, activatorId);
        this.conditionCache.set(inverseCacheKey, comparisonId);
      }

      // Then negate it with NOT
      const resultId = this.pushLogicCommand(OPERATION.NOT,
        { type: OPERAND_TYPE.LC, value: comparisonId },
        { type: OPERAND_TYPE.VALUE, value: 0 },
        activatorId
      );

      this.conditionCache.set(cacheKey, resultId);
      return resultId;
    }

    // Direct operations: >, <, ==, ===
    const op = this.getOperation(operator);

    // Check cache for this exact condition
    const cacheKey = this.getCacheKey('binary', op, left, right, activatorId);
    if (this.conditionCache.has(cacheKey)) {
      return this.conditionCache.get(cacheKey);
    }

    const resultId = this.pushLogicCommand(op, left, right, activatorId);
    this.conditionCache.set(cacheKey, resultId);
    return resultId;
  }

  /**
   * Get the inverse operation for synthesis via NOT
   * @private
   */
  getInverseOperation(operator) {
    switch (operator) {
      case '>=': return OPERATION.LOWER_THAN;   // NOT(a < b) = a >= b
      case '<=': return OPERATION.GREATER_THAN; // NOT(a > b) = a <= b
      case '!=':
      case '!==': return OPERATION.EQUAL;       // NOT(a == b) = a != b
      default: return OPERATION.EQUAL;
    }
  }

  /**
   * Generate logical expression condition (&&, ||)
   * @private
   *
   * For AND (&&): Uses chained activators for efficiency.
   *   a && b && c becomes:
   *   - LC0: a (activator: parent)
   *   - LC1: b (activator: LC0) - only evaluates when a is true
   *   - LC2: c (activator: LC1) - only evaluates when a && b is true
   *   Result: LC2 represents the full AND chain
   *
   * For OR (||): Uses explicit OR operation (chaining doesn't work for OR).
   */
  generateLogical(condition, activatorId) {
    if (condition.operator === '&&') {
      // AND: Use chained activators
      // Generate left condition with current activator
      const leftId = this.generate(condition.left, activatorId);

      // Generate right condition with LEFT as its activator (chaining)
      // This means the right condition only evaluates when left is true
      const rightId = this.generate(condition.right, leftId);

      // The rightmost condition in the chain represents the full AND result
      return rightId;
    } else {
      // OR: Use explicit OR operation
      const leftId = this.generate(condition.left, activatorId);
      const rightId = this.generate(condition.right, activatorId);

      return this.pushLogicCommand(OPERATION.OR,
        { type: OPERAND_TYPE.LC, value: leftId },
        { type: OPERAND_TYPE.LC, value: rightId },
        activatorId
      );
    }
  }

  /**
   * Generate unary expression condition (!)
   * @private
   */
  generateUnary(condition, activatorId) {
    // Generate argument
    const argId = this.generate(condition.argument, activatorId);

    // Apply NOT
    return this.pushLogicCommand(OPERATION.NOT,
      { type: OPERAND_TYPE.LC, value: argId },
      { type: OPERAND_TYPE.VALUE, value: 0 },
      activatorId
    );
  }

  /**
   * Generate member expression condition (property access, RC channel states)
   * @private
   */
  generateMember(condition, activatorId) {
    // Check for RC channel LOW/MID/HIGH state detection
    // e.g., rc[1].low, rc[2].mid, rc[3].high (1-based, matching INAV firmware)
    if (typeof condition.value === 'string' && condition.value.startsWith('rc[')) {
      const match = condition.value.match(/^rc\[(\d+)\]\.(low|mid|high)$/);
      if (match) {
        const channelIndex = parseInt(match[1]); // Already 1-based from user input
        const state = match[2]; // 'low', 'mid', or 'high'

        // Map state to operation
        const stateOp = state === 'low' ? OPERATION.LOW :
                       state === 'mid' ? OPERATION.MID :
                       OPERATION.HIGH;

        return this.pushLogicCommand(stateOp,
          { type: OPERAND_TYPE.RC_CHANNEL, value: channelIndex },
          { type: OPERAND_TYPE.VALUE, value: 0 },
          activatorId
        );
      }
    }

    // Boolean property access (e.g., flight.mode.failsafe)
    const operand = this.getOperand(condition.value);

    // Check if true
    return this.pushLogicCommand(OPERATION.EQUAL,
      operand,
      { type: OPERAND_TYPE.VALUE, value: 1 },
      activatorId
    );
  }

  /**
   * Generate literal condition (true, false)
   * @private
   */
  generateLiteral(condition, activatorId) {
    // Literal true/false
    if (condition.value === true) {
      return this.pushLogicCommand(OPERATION.TRUE,
        { type: OPERAND_TYPE.VALUE, value: 0 },
        { type: OPERAND_TYPE.VALUE, value: 0 },
        activatorId
      );
    } else {
      return this.pushLogicCommand(OPERATION.NOT,
        { type: OPERAND_TYPE.VALUE, value: 1 },
        { type: OPERAND_TYPE.VALUE, value: 0 },
        activatorId
      );
    }
  }

  /**
   * Generate call expression condition (xor, nand, nor, approxEqual)
   * @private
   */
  generateCall(condition, activatorId) {
    const funcName = condition.callee?.name;

    // Handle xor(a, b) - Exclusive OR
    if (funcName === 'xor') {
      if (!this.validateFunctionArgs('xor', condition.arguments, 2, condition)) {
        return this.getLcIndex();
      }

      const leftId = this.generate(condition.arguments[0], activatorId);
      const rightId = this.generate(condition.arguments[1], activatorId);

      return this.pushLogicCommand(OPERATION.XOR,
        { type: OPERAND_TYPE.LC, value: leftId },
        { type: OPERAND_TYPE.LC, value: rightId },
        activatorId
      );
    }

    // Handle nand(a, b) - NOT AND
    if (funcName === 'nand') {
      if (!this.validateFunctionArgs('nand', condition.arguments, 2, condition)) {
        return this.getLcIndex();
      }

      const leftId = this.generate(condition.arguments[0], activatorId);
      const rightId = this.generate(condition.arguments[1], activatorId);

      return this.pushLogicCommand(OPERATION.NAND,
        { type: OPERAND_TYPE.LC, value: leftId },
        { type: OPERAND_TYPE.LC, value: rightId },
        activatorId
      );
    }

    // Handle nor(a, b) - NOT OR
    if (funcName === 'nor') {
      if (!this.validateFunctionArgs('nor', condition.arguments, 2, condition)) {
        return this.getLcIndex();
      }

      const leftId = this.generate(condition.arguments[0], activatorId);
      const rightId = this.generate(condition.arguments[1], activatorId);

      return this.pushLogicCommand(OPERATION.NOR,
        { type: OPERAND_TYPE.LC, value: leftId },
        { type: OPERAND_TYPE.LC, value: rightId },
        activatorId
      );
    }

    // Handle approxEqual(a, b, tolerance) - Approximate equality
    if (funcName === 'approxEqual') {
      if (!this.validateFunctionArgs('approxEqual', condition.arguments, {min: 2, max: 3}, condition)) {
        return this.getLcIndex();
      }

      const left = this.getOperand(condition.arguments[0], activatorId);
      const right = this.getOperand(condition.arguments[1], activatorId);

      // Get tolerance (default to 0 if not provided - exact equality)
      const tolerance = condition.arguments[2]
        ? this.getOperand(condition.arguments[2], activatorId)
        : { type: OPERAND_TYPE.VALUE, value: 0 };

      return this.pushLogicCommand(OPERATION.APPROX_EQUAL, left, right, activatorId, tolerance.value);
    }

    // Unsupported function in condition
    this.errorHandler.addError(
      `Unsupported function in condition: ${funcName}(). Supported: xor, nand, nor, approxEqual`,
      condition,
      'unsupported_function'
    );
    return this.getLcIndex();
  }

  /**
   * Get operation from comparison operator (for direct operations only)
   * @private
   *
   * Note: >=, <=, !=, !== are handled separately in generateBinary()
   * via synthesis using NOT.
   */
  getOperation(operator) {
    const ops = {
      '===': OPERATION.EQUAL,
      '==': OPERATION.EQUAL,
      '>': OPERATION.GREATER_THAN,
      '<': OPERATION.LOWER_THAN
    };

    return ops[operator] || OPERATION.EQUAL;
  }
}

export { ConditionGenerator };
