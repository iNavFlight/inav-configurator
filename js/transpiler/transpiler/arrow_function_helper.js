/**
 * Arrow Function Helper Module
 *
 * Location: js/transpiler/transpiler/arrow_function_helper.js
 *
 * Extracts conditions and actions from arrow functions in edge(), sticky(), delay().
 * Works with raw Acorn AST nodes since the parser stores them untransformed.
 */

'use strict';

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
   */
  extractIdentifier(expr) {
    if (!expr) return '';

    if (expr.type === 'Identifier') {
      return expr.name;
    }

    if (expr.type === 'MemberExpression') {
      const object = this.extractIdentifier(expr.object);

      if (expr.computed) {
        // Computed access: gvar[0] or rc[5]
        const property = this.extractValue(expr.property);
        return `${object}[${property}]`;
      } else {
        // Dot access: flight.altitude or override.vtx.power
        const property = expr.property && expr.property.name ?
          expr.property.name : '';
        return property ? `${object}.${property}` : object;
      }
    }

    return '';
  }

  /**
   * Extract value from Acorn AST node
   */
  extractValue(expr) {
    if (!expr) return null;

    if (expr.type === 'Literal') {
      return expr.value;
    }

    if (expr.type === 'Identifier') {
      return expr.name;
    }

    if (expr.type === 'MemberExpression') {
      return this.extractIdentifier(expr);
    }

    if (expr.type === 'UnaryExpression' && expr.operator === '-') {
      // Handle negative numbers
      const val = this.extractValue(expr.argument);
      return typeof val === 'number' ? -val : val;
    }

    return null;
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
