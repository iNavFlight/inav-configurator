/**
 * INAV Expression Generator Helper
 *
 * Location: js/transpiler/transpiler/expression_generator.js
 *
 * Handles generation of expression logic (Math functions, mapInput/Output, arithmetic).
 * Extracted from codegen.js to improve modularity.
 */

'use strict';

import { OPERATION, OPERAND_TYPE } from './inav_constants.js';

/**
 * Helper class for generating expression logic
 */
class ExpressionGenerator {
  /**
   * @param {Object} context - Context object containing dependencies
   * @param {Function} context.pushLogicCommand - Function to push logic commands
   * @param {Function} context.getOperand - Function to get operand from value
   * @param {Function} context.validateFunctionArgs - Function to validate function arguments
   * @param {Function} context.getArithmeticOperation - Function to get arithmetic operation
   * @param {Object} context.errorHandler - Error handler instance
   * @param {Object} context.arrowHelper - Arrow helper instance for identifier extraction
   * @param {Object} context.conditionGenerator - Condition generator for ternary expressions
   */
  constructor(context) {
    this.pushLogicCommand = context.pushLogicCommand;
    this.getOperand = context.getOperand;
    this.validateFunctionArgs = context.validateFunctionArgs;
    this.getArithmeticOperation = context.getArithmeticOperation;
    this.errorHandler = context.errorHandler;
    this.arrowHelper = context.arrowHelper;
    this.conditionGenerator = context.conditionGenerator;
  }

  /**
   * Generate expression logic
   * @param {Object} expr - Expression AST node
   * @param {number} activatorId - Activator LC index
   * @returns {Object} Operand object {type, value}
   */
  generate(expr, activatorId) {
    if (!expr || !expr.type) {
      return { type: OPERAND_TYPE.VALUE, value: 0 };
    }

    switch (expr.type) {
      case 'CallExpression':
        return this.generateCall(expr, activatorId);
      case 'BinaryExpression':
        return this.generateBinary(expr, activatorId);
      case 'Literal':
        // Direct literal value (number, boolean, etc.)
        return { type: OPERAND_TYPE.VALUE, value: expr.value };
      case 'Identifier':
      case 'MemberExpression':
        // Variable reference - delegate to getOperand
        return this.getOperand(expr, activatorId);
      case 'ConditionalExpression':
        return this.generateConditional(expr, activatorId);
      default:
        this.errorHandler.addError(
          `Unsupported expression type: ${expr.type}. Use arithmetic operators (+, -, *, /) or supported functions`,
          expr,
          'unsupported_expression'
        );
        return { type: OPERAND_TYPE.VALUE, value: 0 };
    }
  }

  /**
   * Generate conditional (ternary) expression as value
   * Patterns:
   *   cond ? val : 0   → val with cond as activator
   *   a ? b : c        → general ternary using ADD to combine
   * @private
   */
  generateConditional(expr, activatorId) {
    const { test, consequent, alternate } = expr;

    // Pattern: cond ? val : 0 → val with cond as activator
    if (alternate === 0 || (alternate.type === 'Literal' && alternate.value === 0)) {
      // Generate the condition using conditionGenerator
      const condLcIndex = this.conditionGenerator.generate(test, activatorId);

      // Generate the value with the condition as activator
      return this.generate(consequent, condLcIndex);
    }

    // General ternary: a ? b : c
    // Implemented as:
    //   LC_COND: test condition
    //   LC_CONS: consequent value with LC_COND as activator (value when true, 0 when false)
    //   LC_NOT:  NOT(LC_COND)
    //   LC_ALT:  alternate value with LC_NOT as activator (value when false, 0 when true)
    //   LC_RES:  ADD(LC_CONS, LC_ALT) - combines (one is always 0)
    const condLcIndex = this.conditionGenerator.generate(test, activatorId);

    // Generate consequent value with condition as activator
    const consequentOperand = this.generate(consequent, condLcIndex);
    const consequentLcIndex = consequentOperand.type === OPERAND_TYPE.LC
      ? consequentOperand.value
      : this.pushLogicCommand(OPERATION.SET,
          { type: OPERAND_TYPE.VALUE, value: 0 },
          consequentOperand,
          condLcIndex
        );

    // Generate NOT(condition)
    const notCondLcIndex = this.pushLogicCommand(OPERATION.NOT,
      { type: OPERAND_TYPE.LC, value: condLcIndex },
      { type: OPERAND_TYPE.VALUE, value: 0 },
      activatorId
    );

    // Generate alternate value with NOT(condition) as activator
    const alternateOperand = this.generate(alternate, notCondLcIndex);
    const alternateLcIndex = alternateOperand.type === OPERAND_TYPE.LC
      ? alternateOperand.value
      : this.pushLogicCommand(OPERATION.SET,
          { type: OPERAND_TYPE.VALUE, value: 0 },
          alternateOperand,
          notCondLcIndex
        );

    // Combine with ADD - exactly one will be non-zero
    const resultLcIndex = this.pushLogicCommand(OPERATION.ADD,
      { type: OPERAND_TYPE.LC, value: consequentLcIndex },
      { type: OPERAND_TYPE.LC, value: alternateLcIndex },
      activatorId
    );

    return { type: OPERAND_TYPE.LC, value: resultLcIndex };
  }

  /**
   * Generate call expression (Math methods, mapInput, mapOutput)
   * @private
   */
  generateCall(expr, activatorId) {
    // Check if it's a Math method
    if (expr.callee && expr.callee.type === 'MemberExpression' &&
        expr.callee.object && expr.callee.object.name === 'Math') {
      return this.generateMathCall(expr, activatorId);
    }

    // Check for helper functions - backward compat: mapInput()
    let funcName = null;
    if (expr.callee.type === 'Identifier') {
      funcName = expr.callee.name;
    }
    // Check for helper functions - new syntax: inav.helpers.mapInput()
    else if (expr.callee.object?.property?.name === 'helpers') {
      funcName = expr.callee.property?.name;
    }

    // If not a helper function call, unknown function
    if (!funcName) {
      this.errorHandler.addError('Unknown function call');
      return { type: OPERAND_TYPE.VALUE, value: 0 };
    }

    // Handle mapInput(value, maxValue) - MAP_INPUT
    // Scales value from [0:maxValue] to [0:1000]
    if (funcName === 'mapInput') {
      if (!this.validateFunctionArgs('mapInput', expr.arguments, 2, expr)) {
        return { type: OPERAND_TYPE.VALUE, value: 0 };
      }

      const value = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[0]) || expr.arguments[0], activatorId);
      const maxValue = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[1]) || expr.arguments[1], activatorId);

      return { type: OPERAND_TYPE.LC, value: this.pushLogicCommand(OPERATION.MAP_INPUT, value, maxValue, activatorId) };
    }

    // Handle mapOutput(value, maxValue) - MAP_OUTPUT
    // Scales value from [0:1000] to [0:maxValue]
    if (funcName === 'mapOutput') {
      if (!this.validateFunctionArgs('mapOutput', expr.arguments, 2, expr)) {
        return { type: OPERAND_TYPE.VALUE, value: 0 };
      }

      const value = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[0]) || expr.arguments[0], activatorId);
      const maxValue = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[1]) || expr.arguments[1], activatorId);

      return { type: OPERAND_TYPE.LC, value: this.pushLogicCommand(OPERATION.MAP_OUTPUT, value, maxValue, activatorId) };
    }

    // Not a recognized function
    const methodName = expr.callee?.property?.name || funcName || 'unknown';
    this.errorHandler.addError(
      `Unsupported function: ${methodName}(). Supported: Math.abs/min/max/sin/cos/tan(), mapInput(), mapOutput()`,
      expr,
      'unsupported_function'
    );
    return { type: OPERAND_TYPE.VALUE, value: 0 };
  }

  /**
   * Generate Math method call (abs, min, max, sin, cos, tan)
   * @private
   */
  generateMathCall(expr, activatorId) {
    const mathMethod = expr.callee.property?.name;

    // Handle Math.abs(x)
    if (mathMethod === 'abs') {
      return this.generateMathAbs(expr, activatorId);
    }

    // Handle Math.min(a, b)
    if (mathMethod === 'min') {
      if (!this.validateFunctionArgs('Math.min', expr.arguments, 2, expr)) {
        return { type: OPERAND_TYPE.VALUE, value: 0 };
      }

      const left = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[0]) || expr.arguments[0], activatorId);
      const right = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[1]) || expr.arguments[1], activatorId);

      return { type: OPERAND_TYPE.LC, value: this.pushLogicCommand(OPERATION.MIN, left, right, activatorId) };
    }

    // Handle Math.max(a, b)
    if (mathMethod === 'max') {
      if (!this.validateFunctionArgs('Math.max', expr.arguments, 2, expr)) {
        return { type: OPERAND_TYPE.VALUE, value: 0 };
      }

      const left = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[0]) || expr.arguments[0], activatorId);
      const right = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[1]) || expr.arguments[1], activatorId);

      return { type: OPERAND_TYPE.LC, value: this.pushLogicCommand(OPERATION.MAX, left, right, activatorId) };
    }

    // Handle trigonometric functions
    if (mathMethod === 'sin' || mathMethod === 'cos' || mathMethod === 'tan') {
      return this.generateMathTrig(mathMethod, expr, activatorId);
    }

    // Unsupported Math method
    this.errorHandler.addError(
      `Unsupported Math method: Math.${mathMethod}(). Supported: abs, min, max, sin, cos, tan`,
      expr,
      'unsupported_function'
    );
    return { type: OPERAND_TYPE.VALUE, value: 0 };
  }

  /**
   * Generate Math.abs(x) using max(x, 0 - x)
   * @private
   */
  generateMathAbs(expr, activatorId) {
    if (!this.validateFunctionArgs('Math.abs', expr.arguments, 1, expr)) {
      return { type: OPERAND_TYPE.VALUE, value: 0 };
    }

    const arg = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[0]) || expr.arguments[0], activatorId);

    // Compute abs using: abs(x) = max(x, 0 - x)
    const negId = this.pushLogicCommand(OPERATION.SUB,
      { type: OPERAND_TYPE.VALUE, value: 0 },
      arg,
      activatorId
    );

    const absId = this.pushLogicCommand(OPERATION.MAX,
      arg,
      { type: OPERAND_TYPE.LC, value: negId },
      activatorId
    );

    return { type: OPERAND_TYPE.LC, value: absId };
  }

  /**
   * Generate trigonometric function (sin, cos, tan)
   * @private
   */
  generateMathTrig(funcName, expr, activatorId) {
    const fullName = `Math.${funcName}`;
    if (!this.validateFunctionArgs(fullName, expr.arguments, 1, expr)) {
      return { type: OPERAND_TYPE.VALUE, value: 0 };
    }

    const arg = this.getOperand(this.arrowHelper.extractIdentifier(expr.arguments[0]) || expr.arguments[0], activatorId);

    // Map function name to operation
    const operation = funcName === 'sin' ? OPERATION.SIN :
                     funcName === 'cos' ? OPERATION.COS :
                     OPERATION.TAN;

    // INAV trig operations take degrees
    return { type: OPERAND_TYPE.LC, value: this.pushLogicCommand(operation, arg, { type: OPERAND_TYPE.VALUE, value: 0 }, activatorId) };
  }

  /**
   * Generate binary expression (arithmetic)
   * @private
   */
  generateBinary(expr, activatorId) {
    // Handle arithmetic: a + b, a - b, etc.
    const left = this.getOperand(this.arrowHelper.extractIdentifier(expr.left) || expr.left, activatorId);
    const right = this.getOperand(this.arrowHelper.extractIdentifier(expr.right) || expr.right, activatorId);
    const op = this.getArithmeticOperation(expr.operator);

    return { type: OPERAND_TYPE.LC, value: this.pushLogicCommand(op, left, right, activatorId) };
  }
}

export { ExpressionGenerator };
