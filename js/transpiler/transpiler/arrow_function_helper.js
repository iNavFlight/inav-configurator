/**
 * Arrow Function Helper Module
 *
 * Location: js/transpiler/transpiler/arrow_function_helper.js
 *
 * Extracts conditions and actions from arrow functions in edge(), sticky(), delay().
 * Works with raw Acorn AST nodes since the parser stores them untransformed.
 */

'use strict';

import { extractValue as sharedExtractValue, extractIdentifier as sharedExtractIdentifier } from './expression_utils.js';

class ArrowFunctionHelper {
  constructor(codegen) {
    this.codegen = codegen; // Reference to code generator for condition transformation
  }

  /**
   * Extract expression from arrow function
   * Handles: () => expression
   * Returns the expression in simplified AST format
   */
  extractExpression(arrowFunc) {
    if (!arrowFunc || arrowFunc.type !== 'ArrowFunctionExpression') {
      return null;
    }

    const body = arrowFunc.body;

    if (!body) {
      return null;
    }

    // If body is an expression (no braces), transform it directly
    // Example: () => flight.altitude > 100
    if (body.type !== 'BlockStatement') {
      return this.transformCondition(body);
    }

    // If body is a block with single return statement
    // Example: () => { return flight.altitude > 100; }
    if (body.body && body.body.length === 1 &&
        body.body[0].type === 'ReturnStatement') {
      return this.transformCondition(body.body[0].argument);
    }

    return null;
  }

  /**
   * Extract action statements from arrow function body
   * Handles: () => { statement; statement; }
   * Returns array of action objects
   */
  extractBody(arrowFunc) {
    if (!arrowFunc || arrowFunc.type !== 'ArrowFunctionExpression') {
      return [];
    }

    const body = arrowFunc.body;

    // Body must be a block statement to contain actions
    if (!body || body.type !== 'BlockStatement') {
      return [];
    }

    // Body.body might be undefined in some edge cases
    if (!body.body || !Array.isArray(body.body)) {
      return [];
    }

    const actions = [];

    // Process each statement in the block
    for (const stmt of body.body) {
      // Handle assignment expressions
      if (stmt.type === 'ExpressionStatement' &&
          stmt.expression &&
          stmt.expression.type === 'AssignmentExpression') {
        const action = this.transformAssignment(
          stmt.expression,
          stmt.loc,
          stmt.range
        );
        if (action) actions.push(action);
      }
      // Handle if statements
      else if (stmt.type === 'IfStatement') {
        const ifAction = this.transformIfStatement(stmt);
        if (ifAction) actions.push(ifAction);
      }
    }

    return actions;
  }

  /**
   * Transform if statement from Acorn AST node
   */
  transformIfStatement(stmt) {
    if (!stmt.test || !stmt.consequent) return null;

    return {
      type: 'IfStatement',
      condition: this.transformCondition(stmt.test),
      consequent: stmt.consequent.type === 'BlockStatement'
        ? this.extractBlockActions(stmt.consequent)
        : [],
      alternate: stmt.alternate
        ? (stmt.alternate.type === 'BlockStatement'
            ? this.extractBlockActions(stmt.alternate)
            : (stmt.alternate.type === 'IfStatement'
                ? [this.transformIfStatement(stmt.alternate)]
                : []))
        : [],
      loc: stmt.loc,
      range: stmt.range
    };
  }

  /**
   * Extract actions from a block statement
   */
  extractBlockActions(block) {
    if (!block || !block.body || !Array.isArray(block.body)) {
      return [];
    }

    const actions = [];
    for (const stmt of block.body) {
      if (stmt.type === 'ExpressionStatement' &&
          stmt.expression &&
          stmt.expression.type === 'AssignmentExpression') {
        const action = this.transformAssignment(
          stmt.expression,
          stmt.loc,
          stmt.range
        );
        if (action) actions.push(action);
      } else if (stmt.type === 'IfStatement') {
        const ifAction = this.transformIfStatement(stmt);
        if (ifAction) actions.push(ifAction);
      }
    }
    return actions;
  }

  /**
   * Transform condition from Acorn AST node
   */
  transformCondition(expr) {
    if (!expr) return null;

    // Handle unary expressions: !condition
    if (expr.type === 'UnaryExpression') {
      return {
        type: 'UnaryExpression',
        operator: expr.operator,
        argument: this.transformCondition(expr.argument)
      };
    }

    // Handle logical expressions: a && b, a || b
    if (expr.type === 'LogicalExpression') {
      return {
        type: 'LogicalExpression',
        operator: expr.operator,
        left: this.transformCondition(expr.left),
        right: this.transformCondition(expr.right)
      };
    }

    // Handle binary expressions: a > b, a === b
    if (expr.type === 'BinaryExpression') {
      return {
        type: 'BinaryExpression',
        operator: expr.operator,
        left: this.extractIdentifier(expr.left),
        right: this.extractValue(expr.right)
      };
    }

    // Handle member expressions: flight.mode.failsafe
    if (expr.type === 'MemberExpression') {
      return {
        type: 'MemberExpression',
        value: this.extractIdentifier(expr)
      };
    }

    // Handle call expressions: edge(...), delta(...), xor(...), etc.
    if (expr.type === 'CallExpression') {
      return {
        type: 'CallExpression',
        callee: expr.callee,
        arguments: expr.arguments.map(arg => this.transformCondition(arg) || arg)
      };
    }

    // Handle ternary/conditional expressions: a ? b : c
    if (expr.type === 'ConditionalExpression') {
      return {
        type: 'ConditionalExpression',
        test: this.transformCondition(expr.test),
        consequent: this.transformCondition(expr.consequent),
        alternate: this.transformCondition(expr.alternate)
      };
    }

    // Handle parenthesized expressions (unwrap)
    if (expr.type === 'ParenthesizedExpression' || expr.extra?.parenthesized) {
      return this.transformCondition(expr.expression || expr);
    }

    // Handle identifiers and literals
    if (expr.type === 'Identifier') {
      return {
        type: 'Identifier',
        value: expr.name
      };
    }

    if (expr.type === 'Literal') {
      return {
        type: 'Literal',
        value: expr.value
      };
    }

    return null;
  }

  /**
   * Transform assignment from Acorn AST node
   */
  transformAssignment(expr, loc, range) {
    if (!expr.left || !expr.right) return null;

    const target = this.extractIdentifier(expr.left);
    const rightExpr = expr.right;

    // Check if right side is binary expression (arithmetic)
    if (rightExpr.type === 'BinaryExpression') {
      const operator = rightExpr.operator;
      const arithmeticOps = ['+', '-', '*', '/', '%'];

      if (arithmeticOps.includes(operator)) {
        return {
          type: 'Assignment',
          target,
          operation: operator,
          left: this.extractIdentifier(rightExpr.left),
          right: this.extractValue(rightExpr.right),
          loc,
          range
        };
      }
    }

    // Simple assignment
    return {
      type: 'Assignment',
      target,
      value: this.extractValue(rightExpr),
      loc,
      range
    };
  }

  /**
   * Extract identifier from Acorn AST node
   * Delegates to shared implementation in expression_utils.js
   */
  extractIdentifier(expr) {
    return sharedExtractIdentifier(expr, (e) => this.extractValue(e));
  }

  /**
   * Extract value from Acorn AST node
   * Delegates to shared implementation in expression_utils.js
   */
  extractValue(expr) {
    return sharedExtractValue(expr);
  }

  /**
   * Extract duration from config object
   * Handles: { duration: 1000 }
   */
  extractDuration(configObj) {
    if (!configObj || configObj.type !== 'ObjectExpression') {
      return 0;
    }

    // Properties might be undefined
    if (!configObj.properties || !Array.isArray(configObj.properties)) {
      return 0;
    }

    for (const prop of configObj.properties) {
      if (prop.key && prop.key.name === 'duration' &&
          prop.value && prop.value.type === 'Literal') {
        return prop.value.value;
      }
    }

    return 0;
  }
}

export { ArrowFunctionHelper };
