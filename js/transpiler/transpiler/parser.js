/**
 * INAV JavaScript Parser
 *
 * Location: tabs/programming/transpiler/transpiler/parser.js
 *
 * Parses standard JavaScript including if/else statements and converts to INAV logic conditions.
 */

'use strict';

import * as acorn from 'acorn';
import { VariableHandler } from './variable_handler.js';
import { extractValue as sharedExtractValue, extractIdentifier as sharedExtractIdentifier } from './expression_utils.js';

/**
 * JavaScript Parser for INAV subset
 */
class JavaScriptParser {
  constructor() {
    this.warnings = [];
  }

  /**
   * Add a warning to the warnings array
   * @param {string} type - Warning type ('warning', 'info', etc.)
   * @param {string} message - Warning message
   * @param {number} line - Line number
   */
  addWarning(type, message, line) {
    this.warnings.push({ type, message, line });
  }

  /**
   * Parse JavaScript code
   * @param {string} code - JavaScript source code
   * @returns {Object} Simple AST with statements and warnings
   */
  parse(code) {
    this.warnings = [];
    this.variableHandler = new VariableHandler();  // Fresh handler for each parse

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
      result.variableHandler = this.variableHandler;  // Pass handler to analyzer
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
        if (Array.isArray(stmt)) {
          statements.push(...stmt);
        } else {
          statements.push(stmt);
        }
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
      case 'IfStatement':
        return this.transformIfStatement(node);
      default:
        return null;
    }
  }

  /**
   * Transform if statement to INAV logic conditions
   * This allows users to write real JavaScript!
   */
  transformIfStatement(node) {
    const results = [];

    // Transform condition
    const condition = this.transformCondition(node.test);

    // Transform consequent (if block)
    const thenBody = [];
    if (node.consequent) {
      if (node.consequent.type === 'BlockStatement') {
        for (const stmt of node.consequent.body) {
          const transformed = this.transformBodyStatement(stmt);
          if (transformed) {
            // Handle arrays (from nested if statements)
            if (Array.isArray(transformed)) {
              thenBody.push(...transformed);
            } else {
              thenBody.push(transformed);
            }
          }
        }
      } else {
        // Single statement without braces
        const transformed = this.transformBodyStatement(node.consequent);
        if (transformed) {
          if (Array.isArray(transformed)) {
            thenBody.push(...transformed);
          } else {
            thenBody.push(transformed);
          }
        }
      }
    }

    // Create logic condition for if block
    // Even if body is empty (only comments), we still create the EventHandler
    // because the condition itself may be useful as a "readable" logic condition
    // that other logic conditions can reference. The decompiler generates:
    //   if (condition) { // Condition can be read by logicCondition[N] }
    // and we need to handle this round-trip correctly.
    if (condition) {
      results.push({
        type: 'EventHandler',
        handler: 'ifthen',
        condition,
        body: thenBody,  // May be empty, that's OK
        loc: node.loc,
        range: node.range,
        comment: 'Generated from if statement'
      });
    }

    // Handle else block
    if (node.alternate) {
      const elseBody = [];

      if (node.alternate.type === 'BlockStatement') {
        for (const stmt of node.alternate.body) {
          const transformed = this.transformBodyStatement(stmt);
          if (transformed) {
            if (Array.isArray(transformed)) {
              elseBody.push(...transformed);
            } else {
              elseBody.push(transformed);
            }
          }
        }
      } else if (node.alternate.type === 'IfStatement') {
        // else if - recursively transform
        const elseIfResult = this.transformIfStatement(node.alternate);
        return [...results, ...elseIfResult];
      } else {
        // Single statement
        const transformed = this.transformBodyStatement(node.alternate);
        if (transformed) {
          if (Array.isArray(transformed)) {
            elseBody.push(...transformed);
          } else {
            elseBody.push(transformed);
          }
        }
      }

      // Create logic condition for else block with inverted condition
      // Only create if there are actual body statements (else blocks with only
      // comments are less common, and an empty else is typically omitted)
      if (elseBody.length > 0) {
        results.push({
          type: 'EventHandler',
          handler: 'ifthen',
          condition: this.invertCondition(condition),
          body: elseBody,
          loc: node.alternate.loc,
          range: node.alternate.range,
          comment: 'Generated from else block'
        });
      }
    }

    return results;
  }

  /**
   * Invert a condition for else blocks
   * if (x > 5) {...} else {...}
   * generates two separate logic conditions with inverted conditions
   */
  invertCondition(condition) {
    if (!condition) return null;

    // If it's already a unary NOT, remove it
    if (condition.type === 'UnaryExpression' && condition.operator === '!') {
      return condition.argument;
    }

    // Otherwise, wrap in NOT
    return {
      type: 'UnaryExpression',
      operator: '!',
      argument: condition
    };
  }

  /**
   * Transform variable declaration (let x = ..., var y = sticky(...), etc.)
   */
  transformVariableDeclaration(node) {
    // Check for: var latch1 = sticky({on: ..., off: ...}) or var latch1 = inav.events.sticky({on: ..., off: ...})
    if (node.declarations.length === 1) {
      const decl = node.declarations[0];
      if (decl.id && decl.id.type === 'Identifier' &&
          decl.init &&
          decl.init.type === 'CallExpression' &&
          decl.init.callee) {

        // Check if callee is sticky() or inav.events.sticky()
        const isStickyCall =
          (decl.init.callee.type === 'Identifier' && decl.init.callee.name === 'sticky') ||
          (decl.init.callee.type === 'MemberExpression' &&
           decl.init.callee.object && decl.init.callee.object.type === 'MemberExpression' &&
           decl.init.callee.object.object && decl.init.callee.object.object.name === 'inav' &&
           decl.init.callee.object.property && decl.init.callee.object.property.name === 'events' &&
           decl.init.callee.property && decl.init.callee.property.name === 'sticky');

        if (isStickyCall) {
          return {
            type: 'StickyAssignment',
            target: decl.id.name,
            args: decl.init.arguments,
            loc: node.loc,
            range: node.range
          };
        }
      }
    }

    // Handle let/var declarations via VariableHandler
    const varDecl = this.variableHandler.extractVariableDeclaration(node);
    if (varDecl) {
      // Transform the initExpr from Acorn AST to our format
      // Use transformCondition() to preserve AST structure for condition generation
      // (transformExpression() returns strings for simple values, which breaks const variable resolution)
      if (varDecl.initExpr) {
        varDecl.initExpr = this.transformCondition(varDecl.initExpr);
      }
      return varDecl;
    }

    return null;
  }

  /**
   * Transform expression statement
   */
  transformExpressionStatement(node) {
    const expr = node.expression;
    if (!expr) return null;

    // Look for function calls: on.arm(...), etc
    if (expr.type === 'CallExpression') {
      return this.transformCallExpression(expr, node.loc, node.range);
    }

    // Look for assignments
    if (expr.type === 'AssignmentExpression') {
      return this.transformAssignment(expr, node.loc, node.range);
    }

    // Look for update expressions: gvar[0]++, gvar[0]--
    if (expr.type === 'UpdateExpression') {
      return this.transformUpdateExpression(expr, node.loc, node.range);
    }

    return null;
  }

  /**
   * Transform update expression (++ and --)
   * Converts gvar[0]++ to gvar[0] = gvar[0] + 1
   */
  transformUpdateExpression(expr, loc, range) {
    if (!expr.argument) return null;

    const target = this.extractIdentifier(expr.argument);

    // Convert ++ to +1, -- to -1
    const operation = expr.operator === '++' ? '+' : '-';

    return {
      type: 'Assignment',
      target,
      operation,
      left: target,
      right: 1,
      loc,
      range
    };
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

    // inav.events.edge(...), inav.events.sticky(...), etc.
    if (expr.callee.type === 'MemberExpression' &&
        expr.callee.object && expr.callee.object.type === 'MemberExpression' &&
        expr.callee.object.object && expr.callee.object.object.name === 'inav' &&
        expr.callee.object.property && expr.callee.object.property.name === 'events' &&
        expr.callee.property) {
      const fnName = expr.callee.property.name;
      if (fnName === 'edge' || fnName === 'sticky' || fnName === 'delay' ||
          fnName === 'timer' || fnName === 'whenChanged') {
        return this.transformHelperFunction(fnName, expr.arguments, loc, range);
      }
    }

    // edge(...), sticky(...), delay(...), timer(...), whenChanged(...)
    if (expr.callee.type === 'Identifier') {
      const fnName = expr.callee.name;
      if (fnName === 'edge' || fnName === 'sticky' || fnName === 'delay' ||
          fnName === 'timer' || fnName === 'whenChanged') {
        return this.transformHelperFunction(fnName, expr.arguments, loc, range);
      }
    }

    // Unrecognized function call - generate error instead of silently dropping
    const calleeName = this.extractCalleeNameForError(expr.callee);
    const line = loc ? loc.start.line : 0;
    this.addWarning('error', `Cannot call '${calleeName}' as a function. Not a valid INAV function.`, line);

    return null;
  }

  /**
   * Extract callee name for error messages
   * @private
   */
  extractCalleeNameForError(callee) {
    if (callee.type === 'Identifier') {
      return callee.name;
    }
    if (callee.type === 'MemberExpression') {
      // Try to reconstruct the full path
      const parts = [];
      let current = callee;

      while (current) {
        if (current.type === 'MemberExpression') {
          if (current.property) {
            parts.unshift(current.property.name || current.property.value);
          }
          current = current.object;
        } else if (current.type === 'Identifier') {
          parts.unshift(current.name);
          break;
        } else {
          break;
        }
      }

      return parts.join('.');
    }
    return '<unknown>';
  }

  /**
   * Transform helper functions (edge, sticky, delay, timer, whenChanged)
   */
  transformHelperFunction(fnName, args, loc, range) {
    // Parse based on function type
    // edge(condition, durationMs, action)
    // sticky(onCondition, offCondition, action)
    // delay(condition, durationMs, action)
    // timer(onMs, offMs, action)
    // whenChanged(value, threshold, action)

    if (!args || args.length < 2) {
      this.addWarning('warning', `${fnName}() requires at least 2 arguments`, loc ? loc.start.line : 0);
      return null;
    }

    return {
      type: 'EventHandler',
      handler: fnName,
      // Store raw arguments for codegen to handle
      args: args,
      loc,
      range
    };
  }

  /**
   * Transform event handler: on.arm({ delay: 1 }, () => { ... })
   */
  transformEventHandler(handler, args, loc, range) {
    // Validate argument count
    if (!args || args.length < 1 || args.length > 2) {
      this.addWarning('warning', `${handler} expects 1-2 arguments, got ${args ? args.length : 0}`, loc ? loc.start.line : 0);
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
      this.addWarning('warning', `${handler} body must be an arrow function`, loc ? loc.start.line : 0);
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
        left: this.transformExpression(expr.left),
        right: this.transformExpression(expr.right)
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

    // Handle call expressions: approxEqual(), xor(), nand(), nor(), edge(), delay(), delta()
    // Arguments need to be transformed as conditions (preserving AST structure)
    // so condition_generator.generate() can properly dispatch on their types
    if (expr.type === 'CallExpression') {
      return {
        type: 'CallExpression',
        callee: expr.callee,
        arguments: expr.arguments.map(arg => this.transformCondition(arg))
      };
    }

    // Handle ternary expressions in conditions: a ? b : c
    // Used for XOR pattern: (a) ? !(b) : (b)
    if (expr.type === 'ConditionalExpression') {
      return {
        type: 'ConditionalExpression',
        test: this.transformCondition(expr.test),
        consequent: this.transformCondition(expr.consequent),
        alternate: this.transformCondition(expr.alternate)
      };
    }

    return null;
  }

  /**
   * Transform expression (for use in conditions and assignments)
   * Handles CallExpression (Math.abs), BinaryExpression (arithmetic), etc.
   */
  transformExpression(expr) {
    if (!expr) return null;

    // Handle literals
    if (expr.type === 'Literal') {
      return expr.value;
    }

    // Handle identifiers
    if (expr.type === 'Identifier') {
      return expr.name;
    }

    // Handle member expressions: flight.yaw, gvar[0]
    if (expr.type === 'MemberExpression') {
      return this.extractIdentifier(expr);
    }

    // Handle call expressions: Math.abs(x)
    if (expr.type === 'CallExpression') {
      return {
        type: 'CallExpression',
        callee: expr.callee,
        arguments: expr.arguments
      };
    }

    // Handle binary expressions: a + b, a - b
    if (expr.type === 'BinaryExpression') {
      return {
        type: 'BinaryExpression',
        operator: expr.operator,
        left: this.transformExpression(expr.left),
        right: this.transformExpression(expr.right)
      };
    }

    // Handle unary expressions: -x, !x
    if (expr.type === 'UnaryExpression') {
      if (expr.operator === '-') {
        const val = this.transformExpression(expr.argument);
        return typeof val === 'number' ? -val : { type: 'UnaryExpression', operator: '-', argument: expr.argument };
      }
      if (expr.operator === '!') {
        return {
          type: 'UnaryExpression',
          operator: '!',
          argument: this.transformExpression(expr.argument)
        };
      }
    }

    // Handle logical expressions: a && b, a || b
    if (expr.type === 'LogicalExpression') {
      return {
        type: 'LogicalExpression',
        operator: expr.operator,
        left: this.transformExpression(expr.left),
        right: this.transformExpression(expr.right)
      };
    }

    // Handle ternary expressions: a ? b : c
    if (expr.type === 'ConditionalExpression') {
      return {
        type: 'ConditionalExpression',
        test: this.transformCondition(expr.test),
        consequent: this.transformExpression(expr.consequent),
        alternate: this.transformExpression(expr.alternate)
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
      // Handle update expressions (++, --) inside if bodies
      if (expr && expr.type === 'UpdateExpression') {
        return this.transformUpdateExpression(expr, stmt.loc, stmt.range);
      }
    }

    // Support variable declarations in bodies (var latch1 = sticky({...}), let x = ...)
    if (stmt.type === 'VariableDeclaration') {
      return this.transformVariableDeclaration(stmt);
    }

    // Support nested if statements in bodies - recursively transform them
    if (stmt.type === 'IfStatement') {
      // Recursively transform the nested if statement
      // This returns an array of EventHandlers which will be flattened by the caller
      return this.transformIfStatement(stmt);
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

    // Check if right side is sticky({on: ..., off: ...}) or inav.events.sticky({on: ..., off: ...}) call
    if (rightExpr.type === 'CallExpression' && rightExpr.callee) {
      const isStickyCall =
        (rightExpr.callee.type === 'Identifier' && rightExpr.callee.name === 'sticky') ||
        (rightExpr.callee.type === 'MemberExpression' &&
         rightExpr.callee.object && rightExpr.callee.object.type === 'MemberExpression' &&
         rightExpr.callee.object.object && rightExpr.callee.object.object.name === 'inav' &&
         rightExpr.callee.object.property && rightExpr.callee.object.property.name === 'events' &&
         rightExpr.callee.property && rightExpr.callee.property.name === 'sticky');

      if (isStickyCall) {
        return {
          type: 'StickyAssignment',
          target,
          args: rightExpr.arguments,
          loc,
          range
        };
      }
    }

    // Check if right side is binary expression (could be arithmetic or comparison)
    if (rightExpr.type === 'BinaryExpression') {
      const operator = rightExpr.operator;
      const arithmeticOps = ['+', '-', '*', '/', '%'];

      if (arithmeticOps.includes(operator)) {
        // For complex expressions (CallExpression, etc.), preserve the full AST node
        // rather than trying to extract just an identifier string
        const leftValue = rightExpr.left.type === 'CallExpression'
          ? rightExpr.left  // Preserve full AST for function calls
          : this.extractIdentifier(rightExpr.left);

        return {
          type: 'Assignment',
          target,
          operation: operator,
          left: leftValue,
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
   * Delegates to shared implementation in expression_utils.js
   */
  extractIdentifier(expr) {
    return sharedExtractIdentifier(expr, (e) => this.extractValue(e));
  }

  /**
   * Extract value from expression
   * Delegates to shared implementation in expression_utils.js
   * Adds CallExpression handling specific to parser
   */
  extractValue(expr) {
    return sharedExtractValue(expr, {
      onCallExpression: (e) => this.transformExpression(e)
    });
  }
}

export { JavaScriptParser };
