/**
 * Expression Utilities
 *
 * Shared utility functions for extracting values and identifiers from AST nodes.
 * Used by both JavaScriptParser and ArrowFunctionHelper.
 *
 * Location: js/transpiler/transpiler/expression_utils.js
 */

'use strict';

/**
 * Extract identifier/property path from expression
 *
 * Converts AST nodes to string identifiers like:
 * - Identifier "foo" -> "foo"
 * - MemberExpression flight.altitude -> "flight.altitude"
 * - Computed access gvar[0] -> "gvar[0]"
 *
 * @param {Object} expr - AST expression node
 * @param {Function} extractValueFn - Reference to extractValue for recursive calls
 * @returns {string} The identifier string, or empty string if not extractable
 */
function extractIdentifier(expr, extractValueFn) {
  if (!expr) return '';

  if (expr.type === 'Identifier') {
    return expr.name;
  }

  if (expr.type === 'MemberExpression') {
    const object = extractIdentifier(expr.object, extractValueFn);

    if (expr.computed) {
      // Computed access: gvar[0] or rc[5]
      const property = extractValueFn(expr.property);
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
 * Extract value from expression
 *
 * Handles:
 * - Literal values (numbers, strings)
 * - Identifiers (returns the name)
 * - MemberExpressions (returns identifier string like "flight.altitude")
 * - UnaryExpression with '-' (negation)
 * - BinaryExpression (constant folding for +, -, *, /, %)
 * - ParenthesizedExpression (unwraps to inner expression)
 *
 * @param {Object} expr - AST expression node
 * @param {Object} options - Optional callbacks for class-specific behavior
 * @param {Function} options.onCallExpression - Handler for CallExpression (used by parser)
 * @returns {*} The extracted value, or null if not extractable
 */
function extractValue(expr, options = {}) {
  if (!expr) return null;

  if (expr.type === 'Literal') {
    return expr.value;
  }

  if (expr.type === 'Identifier') {
    return expr.name;
  }

  if (expr.type === 'MemberExpression') {
    // Use a bound extractValue for the recursive call
    return extractIdentifier(expr, (e) => extractValue(e, options));
  }

  if (expr.type === 'UnaryExpression' && expr.operator === '-') {
    // Handle negative numbers
    const val = extractValue(expr.argument, options);
    return typeof val === 'number' ? -val : val;
  }

  // Handle binary expressions: (50 * 28), ((50 * 28) - flight.airSpeed)
  if (expr.type === 'BinaryExpression') {
    const left = extractValue(expr.left, options);
    const right = extractValue(expr.right, options);

    // If both are constants, compute the value at compile time
    if (typeof left === 'number' && typeof right === 'number') {
      switch (expr.operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return Math.floor(left / right); // INAV uses integer division
        case '%': return left % right;
      }
    }

    // Otherwise return a BinaryExpression node for codegen to process
    return {
      type: 'BinaryExpression',
      operator: expr.operator,
      left: left,
      right: right
    };
  }

  // Handle parenthesized expressions (they're just their inner expression)
  if (expr.type === 'ParenthesizedExpression') {
    if (!expr.expression) {
      // Malformed AST - parenthesized expression without inner expression
      return null;
    }
    return extractValue(expr.expression, options);
  }
  if (expr.extra?.parenthesized) {
    const newExpr = { ...expr };
    delete newExpr.extra;
    return extractValue(newExpr, options);
  }

  // Handle call expressions (e.g., Math.min, Math.max) - parser-specific
  if (expr.type === 'CallExpression' && options.onCallExpression) {
    return options.onCallExpression(expr);
  }

  // Handle ternary expressions: a ? b : c
  if (expr.type === 'ConditionalExpression') {
    return {
      type: 'ConditionalExpression',
      test: expr.test,   // Keep original AST for condition
      consequent: extractValue(expr.consequent, options),
      alternate: extractValue(expr.alternate, options)
    };
  }

  return null;
}

/**
 * Create bound extractValue and extractIdentifier functions for a class instance
 *
 * This allows the shared utilities to be used as if they were class methods,
 * preserving the ability to override behavior via options.
 *
 * @param {Object} options - Options to pass to extractValue
 * @returns {Object} Object with bound extractValue and extractIdentifier functions
 */
function createExtractionHelpers(options = {}) {
  const boundExtractValue = (expr) => extractValue(expr, options);
  const boundExtractIdentifier = (expr) => extractIdentifier(expr, boundExtractValue);

  return {
    extractValue: boundExtractValue,
    extractIdentifier: boundExtractIdentifier
  };
}

export { extractValue, extractIdentifier, createExtractionHelpers };
