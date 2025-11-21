/**
 * INAV JavaScript Parser (Production Version - Fixed)
 * 
 * Location: tabs/programming/transpiler/transpiler/parser.js
 * 
 * Uses Acorn for robust parsing with proper error handling.
 */

'use strict';

const acorn = require('acorn');

/**
 * Production JavaScript Parser for INAV subset
 * Uses Acorn for robust parsing, transforms to simplified AST
 */
class JavaScriptParser {
  constructor() {
    this.warnings = [];
  }
  
  /**
   * Parse JavaScript code
   * @param {string} code - JavaScript source code
   * @returns {Object} Simple AST with statements and warnings
   */
  parse(code) {
    this.warnings = [];
    
    try {
      // Parse with Acorn
      const acornAST = acorn.parse(code, {
        ecmaVersion: 2020,
        sourceType: 'module',
        locations: true,
        ranges: true
      });
      
      // Transform to our simplified format
      const result = this.transformAST(acornAST);
      result.warnings = this.warnings;
      return result;
    } catch (error) {
      // Enhance error message with location info
      if (error.loc) {
        throw new Error(
          `Parse error at line ${error.loc.line}, column ${error.loc.column}: ${error.message}`
        );
      }
      throw new Error(`Parse error: ${error.message}`);
    }
  }
  
  /**
   * Transform Acorn AST to simplified format
   */
  transformAST(acornAST) {
    const statements = [];
    
    for (const node of acornAST.body) {
      const stmt = this.transformNode(node);
      if (stmt) {
        statements.push(stmt);
      }
    }
    
    return { statements };
  }
  
  /**
   * Transform individual AST node
   */
  transformNode(node) {
    if (!node) return null;
    
    switch (node.type) {
      case 'VariableDeclaration':
        return this.transformVariableDeclaration(node);
      case 'ExpressionStatement':
        return this.transformExpressionStatement(node);
      default:
        return null;
    }
  }
  
  /**
   * Transform variable declaration (const { flight } = inav)
   */
  transformVariableDeclaration(node) {
    // Look for: const { ... } = inav
    if (node.declarations.length === 1) {
      const decl = node.declarations[0];
      if (decl.id && decl.id.type === 'ObjectPattern' && 
          decl.init && 
          decl.init.type === 'Identifier' && 
          decl.init.name === 'inav') {
        return { 
          type: 'Destructuring',
          loc: node.loc,
          range: node.range
        };
      }
    }
    return null;
  }
  
  /**
   * Transform expression statement
   */
  transformExpressionStatement(node) {
    const expr = node.expression;
    if (!expr) return null;
    
    // Look for function calls: on.arm(...), when(...)
    if (expr.type === 'CallExpression') {
      return this.transformCallExpression(expr, node.loc, node.range);
    }
    
    // Look for assignments
    if (expr.type === 'AssignmentExpression') {
      return this.transformAssignment(expr, node.loc, node.range);
    }
    
    return null;
  }
  
  /**
   * Transform call expression (event handlers)
   */
  transformCallExpression(expr, loc, range) {
    if (!expr.callee) return null;
    
    // on.arm(...), on.always(...)
    if (expr.callee.type === 'MemberExpression' &&
        expr.callee.object && expr.callee.object.name === 'on' &&
        expr.callee.property) {
      const handler = `on.${expr.callee.property.name}`;
      return this.transformEventHandler(handler, expr.arguments, loc, range);
    }
    
    // when(...)
    if (expr.callee.type === 'Identifier' && expr.callee.name === 'when') {
      return this.transformWhenStatement(expr.arguments, loc, range);
    }
    
    return null;
  }
  
  /**
   * Transform event handler: on.arm({ delay: 1 }, () => { ... })
   */
  transformEventHandler(handler, args, loc, range) {
    // Validate argument count
    if (!args || args.length < 1 || args.length > 2) {
      this.warnings.push({
        type: 'warning',
        message: `${handler} expects 1-2 arguments, got ${args ? args.length : 0}`,
        line: loc ? loc.start.line : 0
      });
      return null;
    }
    
    const config = {};
    let bodyFunc = null;
    
    // Parse arguments
    if (args.length === 2) {
      // First arg: config object
      if (args[0].type === 'ObjectExpression') {
        for (const prop of args[0].properties) {
          if (prop.key && prop.key.name === 'delay' && 
              prop.value && prop.value.type === 'Literal') {
            config.delay = prop.value.value;
          }
        }
      }
      bodyFunc = args[1];
    } else if (args.length === 1) {
      bodyFunc = args[0];
    }
    
    // Validate body function
    if (!bodyFunc || bodyFunc.type !== 'ArrowFunctionExpression') {
      this.warnings.push({
        type: 'warning',
        message: `${handler} body must be an arrow function`,
        line: loc ? loc.start.line : 0
      });
      return null;
    }
    
    // Extract body from arrow function
    const body = [];
    const bodyNode = bodyFunc.body;
    if (bodyNode && bodyNode.type === 'BlockStatement' && bodyNode.body) {
      for (const stmt of bodyNode.body) {
        const transformed = this.transformBodyStatement(stmt);
        if (transformed) body.push(transformed);
      }
    }
    
    return {
      type: 'EventHandler',
      handler,
      config,
      body,
      loc,
      range
    };
  }
  
  /**
   * Transform when statement: when(() => condition, () => { ... })
   */
  transformWhenStatement(args, loc, range) {
    if (!args || args.length !== 2) {
      this.warnings.push({
        type: 'warning',
        message: `when() expects exactly 2 arguments, got ${args ? args.length : 0}`,
        line: loc ? loc.start.line : 0
      });
      return null;
    }
    
    const conditionFunc = args[0];
    const bodyFunc = args[1];
    
    // Validate condition function
    if (!conditionFunc || conditionFunc.type !== 'ArrowFunctionExpression') {
      this.warnings.push({
        type: 'warning',
        message: 'when() condition must be an arrow function',
        line: loc ? loc.start.line : 0
      });
      return null;
    }
    
    // Extract condition
    const condition = this.transformCondition(conditionFunc.body);
    
    // Validate body function
    if (!bodyFunc || bodyFunc.type !== 'ArrowFunctionExpression') {
      this.warnings.push({
        type: 'warning',
        message: 'when() body must be an arrow function',
        line: loc ? loc.start.line : 0
      });
      return null;
    }
    
    // Extract body
    const body = [];
    const bodyNode = bodyFunc.body;
    if (bodyNode && bodyNode.type === 'BlockStatement' && bodyNode.body) {
      for (const stmt of bodyNode.body) {
        const transformed = this.transformBodyStatement(stmt);
        if (transformed) body.push(transformed);
      }
    }
    
    return {
      type: 'EventHandler',
      handler: 'when',
      condition,
      body,
      loc,
      range
    };
  }
  
  /**
   * Transform condition expression
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
   * Transform body statement
   */
  transformBodyStatement(stmt) {
    if (!stmt) return null;
    
    if (stmt.type === 'ExpressionStatement') {
      const expr = stmt.expression;
      if (expr && expr.type === 'AssignmentExpression') {
        return this.transformAssignment(expr, stmt.loc, stmt.range);
      }
    }
    return null;
  }
  
  /**
   * Transform assignment: gvar[0] = value
   */
  transformAssignment(expr, loc, range) {
    if (!expr.left || !expr.right) return null;
    
    const target = this.extractIdentifier(expr.left);
    const rightExpr = expr.right;
    
    // Check if right side is binary expression (could be arithmetic or comparison)
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
   * Extract identifier/property path from expression
   */
  extractIdentifier(expr) {
    if (!expr) return '';
    
    if (expr.type === 'Identifier') {
      return expr.name;
    }
    
    if (expr.type === 'MemberExpression') {
      const object = this.extractIdentifier(expr.object);
      
      if (expr.computed) {
        // Computed access: gvar[0] or obj[prop]
        const property = this.extractValue(expr.property);
        return `${object}[${property}]`;
      } else {
        // Dot access: flight.altitude
        const property = expr.property && expr.property.name ? 
          expr.property.name : '';
        return property ? `${object}.${property}` : object;
      }
    }
    
    return '';
  }
  
  /**
   * Extract value from expression
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
}

module.exports = { JavaScriptParser };