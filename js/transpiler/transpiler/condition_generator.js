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
   */
  generateBinary(condition, activatorId) {
    const left = this.getOperand(condition.left);
    const right = this.getOperand(condition.right);
    const op = this.getOperation(condition.operator);

    return this.pushLogicCommand(op, left, right, activatorId);
  }

  /**
   * Generate logical expression condition (&&, ||)
   * @private
   */
  generateLogical(condition, activatorId) {
    // Generate left condition
    const leftId = this.generate(condition.left, activatorId);

    // Generate right condition
    const rightId = this.generate(condition.right, activatorId);

    // Combine with logical operator
    const op = condition.operator === '&&' ? OPERATION.AND : OPERATION.OR;
    return this.pushLogicCommand(op,
      { type: OPERAND_TYPE.LC, value: leftId },
      { type: OPERAND_TYPE.LC, value: rightId },
      activatorId
    );
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
    // e.g., rc[0].low, rc[1].mid, rc[2].high
    if (typeof condition.value === 'string' && condition.value.startsWith('rc[')) {
      const match = condition.value.match(/^rc\[(\d+)\]\.(low|mid|high)$/);
      if (match) {
        const channelIndex = parseInt(match[1]);
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
   * Get operation from comparison operator
   * @private
   */
  getOperation(operator) {
    const ops = {
      '===': OPERATION.EQUAL,
      '==': OPERATION.EQUAL,
      '>': OPERATION.GREATER_THAN,
      '<': OPERATION.LOWER_THAN,
      '>=': OPERATION.GREATER_THAN, // Note: INAV doesn't have >=, use >
      '<=': OPERATION.LOWER_THAN,   // Note: INAV doesn't have <=, use <
      '!==': OPERATION.NOT,
      '!=': OPERATION.NOT
    };

    return ops[operator] || OPERATION.EQUAL;
  }
}

export { ConditionGenerator };
