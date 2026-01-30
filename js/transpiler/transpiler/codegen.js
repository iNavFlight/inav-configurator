/**
 * INAV Code Generator
 *
 * Location: tabs/programming/transpiler/transpiler/codegen.js
 *
 * Generates INAV logic condition CLI commands from AST.
 * Supports if statements, edge(), sticky(), delay(), and on.* handlers.
 */

'use strict';

import { ArrowFunctionHelper } from './arrow_function_helper.js';
import { ErrorHandler } from './error_handler.js';
import { ConditionGenerator } from './condition_generator.js';
import { ExpressionGenerator } from './expression_generator.js';
import { ActionGenerator } from './action_generator.js';
import { buildForwardMapping } from './api_mapping_utility.js';

import {
  OPERAND_TYPE,
  OPERATION,
  getOperationName
} from './inav_constants.js';
import apiDefinitions from './../api/definitions/index.js';

/**
 * Declarative configuration for indexed operand types (gvar[], rc[], pid[])
 * Each entry defines: regex pattern, OPERAND_TYPE, index bounds, and error messages
 */
const INDEXED_OPERAND_DEFS = {
  'gvar[': {
    regex: /^gvar\[(\d+)\]$/,
    type: OPERAND_TYPE.GVAR,
    min: 0,
    max: 7,
    syntaxError: (v) => `Invalid gvar syntax '${v}'. Expected gvar[0-7].`,
    syntaxCode: 'invalid_gvar',
    boundsError: (i) => `Invalid gvar index ${i}. Must be 0-7.`,
    boundsCode: 'invalid_gvar_index'
  },
  'rc[': {
    regex: /^rc\[(\d+)\](?:\.value)?$/,
    type: OPERAND_TYPE.RC_CHANNEL,
    min: 1,
    max: 18,
    syntaxError: (v) => `Invalid rc syntax '${v}'. Expected rc[1-18] or rc[1-18].value`,
    syntaxCode: 'invalid_rc',
    boundsError: (i) => `Invalid rc channel ${i}. Must be 1-18.`,
    boundsCode: 'invalid_rc_index'
  },
  'pid[': {
    regex: /^pid\[(\d+)\](?:\.output)?$/,
    type: OPERAND_TYPE.PID,
    min: 0,
    max: 3,
    syntaxError: (v) => `Invalid pid syntax '${v}'. Expected pid[0-3] or pid[0-3].output`,
    syntaxCode: 'invalid_pid',
    boundsError: (i) => `Invalid pid controller ${i}. Must be 0-3.`,
    boundsCode: 'invalid_pid_index'
  }
};

/**
 * INAV Code Generator
 * Converts AST to INAV logic condition commands
 */
class INAVCodeGenerator {
  constructor(variableHandler = null) {
    this.lcIndex = 0; // Current logic condition index
    this.commands = [];
    this.errorHandler = new ErrorHandler(); // Error and warning collection
    this.operandMapping = buildForwardMapping(apiDefinitions);
    this.arrowHelper = new ArrowFunctionHelper(this);
    this.variableHandler = variableHandler;
    this.latchVariables = new Map(); // Map variable name -> LC index for sticky assignments
    this.constOperandCache = new Map(); // Cache operands for const variables (varName, activatorId) -> operand

    // Initialize helper generators
    // Note: variableHandler uses a getter because it's set after construction
    const self = this;
    const context = {
      pushLogicCommand: this.pushLogicCommand.bind(this),
      getOperand: this.getOperand.bind(this),
      validateFunctionArgs: this.validateFunctionArgs.bind(this),
      getArithmeticOperation: this.getArithmeticOperation.bind(this),
      getOverrideOperation: this.getOverrideOperation.bind(this),
      errorHandler: this.errorHandler,
      arrowHelper: this.arrowHelper,
      get variableHandler() { return self.variableHandler; },
      getLcIndex: () => this.lcIndex,
      latchVariables: this.latchVariables  // Share latch map with condition generator
    };

    this.conditionGenerator = new ConditionGenerator(context);

    // ExpressionGenerator needs conditionGenerator for ternary expressions
    const exprContext = {
      ...context,
      conditionGenerator: this.conditionGenerator
    };
    this.expressionGenerator = new ExpressionGenerator(exprContext);

    // ActionGenerator needs conditionGenerator for CSE cache invalidation on mutation
    const actionContext = {
      ...context,
      conditionGenerator: this.conditionGenerator
    };
    this.actionGenerator = new ActionGenerator(actionContext);
  }

  /**
   * Generate INAV CLI commands from AST
   * @param {Object} ast - Abstract syntax tree
   * @returns {string[]} Array of CLI commands
   */
  generate(ast) {
    this.lcIndex = 0;
    this.commands = [];
    this.lastStatementEndLine = 0;  // Track for blank line gap detection
    this.errorHandler.reset(); // Clear any previous errors
    this.conditionGenerator.reset(); // Clear condition cache for CSE
    this.latchVariables.clear(); // Clear latch variable mappings

    if (!ast || !ast.statements) {
      throw new Error('Invalid AST');
    }

    // Generate var initializations at program start
    if (this.variableHandler) {
      const varInits = this.variableHandler.getVarInitializations();
      for (const init of varInits) {
        this.generateVarInitialization(init);
      }
    }

    for (const stmt of ast.statements) {
      this.maybeInsertGapLC(stmt);
      this.generateStatement(stmt);
      this.updateLastStatementLine(stmt);
    }

    // Throw if any errors were collected during generation
    this.errorHandler.throwIfErrors();

    return this.commands;
  }

  /**
   * Generate logic condition for a statement
   */
  generateStatement(stmt) {
    if (!stmt) return;
    switch (stmt.type) {
      case 'EventHandler':
        this.generateEventHandler(stmt);
        break;
      case 'Assignment':
        // Top-level assignment (e.g., gvar[0] = value) - runs unconditionally
        this.generateTopLevelAssignment(stmt);
        break;
      case 'StickyAssignment':
        // latch1 = sticky({on: ..., off: ...})
        this.generateStickyAssignment(stmt);
        break;
      case 'LetDeclaration':
      case 'VarDeclaration':
        // Skip - declarations handled separately
        break;
      default:
        this.errorHandler.addError(
          `Unsupported statement type: ${stmt.type}. Only assignments and event handlers are supported`,
          stmt,
          'unsupported_statement'
        );
    }
  }

  /**
   * Generate initialization for var variable
   */
  generateVarInitialization(init) {
    // Generate gvar initialization at program start
    const valueOperand = this.getOperand(init.initExpr, -1);

    // Use GVAR_SET to initialize the variable
    this.commands.push(
      `logic ${this.lcIndex} 1 -1 ${OPERATION.GVAR_SET} ${OPERAND_TYPE.VALUE} ${init.gvarIndex} ${valueOperand.type} ${valueOperand.value} 0`
    );
    this.lcIndex++;
  }

  /**
   * Generate top-level assignment statement (runs unconditionally)
   * Examples: gvar[0] = 100, gvar[1] = flight.altitude
   */
  generateTopLevelAssignment(stmt) {
    // Top-level assignments run with activator -1 (always active)
    this.generateAction(stmt, -1);
  }

  /**
   * Validate function arguments
   * @param {string} fnName - Function name for error message
   * @param {Array} args - Arguments array to validate
   * @param {number|Object} expected - Expected count or {min, max} range
   * @param {Object} stmt - Statement for error reporting
   * @returns {boolean} True if valid, false otherwise
   */
  validateFunctionArgs(fnName, args, expected, stmt) {
    const actualCount = args?.length || 0;
    let isValid = false;
    let expectedMsg = '';

    if (typeof expected === 'number') {
      isValid = actualCount === expected;
      expectedMsg = `exactly ${expected}`;
    } else if (expected.min !== undefined && expected.max !== undefined) {
      isValid = actualCount >= expected.min && actualCount <= expected.max;
      expectedMsg = `${expected.min}-${expected.max}`;
    } else if (expected.min !== undefined) {
      isValid = actualCount >= expected.min;
      expectedMsg = `at least ${expected.min}`;
    }

    if (!isValid) {
      this.errorHandler.addError(
        `${fnName}() requires ${expectedMsg} argument${expected === 1 ? '' : 's'}. Got ${actualCount}`,
        stmt,
        'invalid_args'
      );
      return false;
    }

    return true;
  }

  /**
   * Push a logic command and increment index
   * @param {number} operation - Operation code
   * @param {Object} operandA - {type, value}
   * @param {Object} operandB - {type, value}
   * @param {number} activatorId - Activator LC index (default -1)
   * @param {number} flags - Flags (default 0)
   * @returns {number} The LC index of the pushed command
   */
  pushLogicCommand(operation, operandA, operandB, activatorId = -1, flags = 0) {
    const lcIndex = this.lcIndex;
    this.commands.push(
      `logic ${lcIndex} 1 ${activatorId} ${operation} ${operandA.type} ${operandA.value} ${operandB.type} ${operandB.value} ${flags}`
    );
    this.lcIndex++;
    return lcIndex;
  }

  /**
   * Check if there's a significant gap (2+ blank lines) before a statement
   * and insert a disabled placeholder LC to preserve visual grouping.
   * @param {Object} stmt - Statement with loc info
   */
  maybeInsertGapLC(stmt) {
    if (!stmt.loc || this.lastStatementEndLine === 0) return;

    const stmtStartLine = stmt.loc.start.line;
    const blankLines = stmtStartLine - this.lastStatementEndLine - 1;

    // 2+ blank lines = visual separator, insert disabled LC
    if (blankLines >= 2) {
      this.commands.push(
        `logic ${this.lcIndex} 0 -1 0 0 0 0 0 0`  // Disabled, no-op LC
      );
      this.lcIndex++;
    }
  }

  /**
   * Update tracking of last statement's end line.
   * @param {Object} stmt - Statement with loc info
   */
  updateLastStatementLine(stmt) {
    if (stmt.loc) {
      this.lastStatementEndLine = stmt.loc.end.line;
    }
  }

  /**
   * Generate event handler (if statement, edge, sticky, delay, on.*)
   * Uses dispatch table for clean handler routing
   */
  generateEventHandler(stmt) {
    const handler = stmt.handler;

    // Dispatch table for handler types
    const handlerMethods = {
      'on.arm': 'generateOnArm',
      'on.always': 'generateOnAlways',
      'edge': 'generateEdge',
      'sticky': 'generateSticky',
      'delay': 'generateDelay',
      'timer': 'generateTimer',
      'whenChanged': 'generateWhenChanged'
    };

    // Special case: if starts with 'if'
    if (handler.startsWith('if')) {
      this.generateConditional(stmt);
      return;
    }

    // Lookup in dispatch table and call method
    const methodName = handlerMethods[handler];
    if (methodName) {
      this[methodName](stmt);
    } else {
      // Default: treat as conditional
      this.generateConditional(stmt);
    }
  }

  /**
   * Generate on.arm handler
   * Uses EDGE to trigger once when armed
   */
  generateOnArm(stmt) {
    const delay = stmt.config.delay || 0;

    // Create condition: armTimer > 0 (or flight.isArmed if available)
    const conditionId = this.pushLogicCommand(OPERATION.GREATER_THAN,
      { type: OPERAND_TYPE.FLIGHT, value: 0 },
      { type: OPERAND_TYPE.VALUE, value: 0 }
    );

    // Create EDGE operation (triggers once)
    const edgeId = this.pushLogicCommand(OPERATION.EDGE,
      { type: OPERAND_TYPE.LC, value: conditionId },
      { type: OPERAND_TYPE.VALUE, value: delay }
    );

    // Generate body actions with EDGE as activator
    for (const action of stmt.body) {
      this.generateAction(action, edgeId);
    }
  }


  /**
   * Generate on.always handler
   */
  generateOnAlways(stmt) {
    // Create activator: always true
    const activatorId = this.pushLogicCommand(OPERATION.TRUE,
      { type: OPERAND_TYPE.VALUE, value: 0 },
      { type: OPERAND_TYPE.VALUE, value: 0 }
    );

    // Generate body actions
    for (const action of stmt.body) {
      this.generateAction(action, activatorId);
    }
  }

  /**
   * Generate conditional (if statement)
   */
  generateConditional(stmt) {
    if (!stmt.condition) return;

    let conditionId;

    // Check if we should reuse an existing condition (CSE optimization)
    if (stmt.reuseCondition) {
      // Find the LC index of the reused condition
      conditionId = stmt.reuseCondition.conditionLcIndex;

      if (conditionId === undefined) {
        // Fallback: generate new condition if reuse fails
        conditionId = this.generateCondition(stmt.condition, -1);
        stmt.conditionLcIndex = conditionId;
      } else {
        // If we need to invert the condition, generate a NOT operation
        if (stmt.invertReuse) {
          conditionId = this.pushLogicCommand(OPERATION.NOT,
            { type: OPERAND_TYPE.LC, value: conditionId },
            { type: OPERAND_TYPE.VALUE, value: 0 }
          );
        }
      }
    } else {
      // Generate new condition logic condition
      conditionId = this.generateCondition(stmt.condition, -1);

      // Store the LC index for potential reuse by other statements
      stmt.conditionLcIndex = conditionId;
    }

    // Generate body actions
    for (const action of stmt.body) {
      if (action.type === 'EventHandler') {
        // Nested if statement - recursively generate with current condition as parent
        this.generateNestedConditional(action, conditionId);
      } else {
        this.generateAction(action, conditionId);
      }
    }
  }

  /**
   * Generate nested conditional (nested if inside if body)
   * The parent condition becomes the activator for the nested condition
   */
  generateNestedConditional(stmt, parentActivatorId) {
    if (!stmt.condition) return;

    // Generate the nested condition with parent as activator
    const conditionId = this.generateCondition(stmt.condition, parentActivatorId);

    // Store the LC index for potential reuse
    stmt.conditionLcIndex = conditionId;

    // Generate body actions with nested condition as activator
    for (const action of stmt.body) {
      if (action.type === 'EventHandler') {
        // Further nesting - recurse
        this.generateNestedConditional(action, conditionId);
      } else {
        this.generateAction(action, conditionId);
      }
    }
  }




  /**
   * Generate edge handler
   * edge(() => condition, { duration: ms }, () => { actions })
   */
  generateEdge(stmt) {
    if (!this.validateFunctionArgs('edge', stmt.args, 3, stmt)) return;

    // Extract parts using helper
    const condition = this.arrowHelper.extractExpression(stmt.args[0]);
    const duration = this.arrowHelper.extractDuration(stmt.args[1]);
    const actions = this.arrowHelper.extractBody(stmt.args[2]);

    if (!condition) {
      this.errorHandler.addError(
        'edge() argument 1 must be an arrow function',
        stmt,
        'invalid_args'
      );
      return;
    }

    // Generate condition LC
    const conditionId = this.generateCondition(condition, -1);

    // Generate EDGE operation (47)
    const edgeId = this.pushLogicCommand(OPERATION.EDGE,
      { type: OPERAND_TYPE.LC, value: conditionId },
      { type: OPERAND_TYPE.VALUE, value: duration }
    );

    // Generate actions
    for (const action of actions) {
      this.generateAction(action, edgeId);
    }
  }

  /**
   * Generate sticky handler
   * sticky(() => onCondition, () => offCondition, () => { actions })
   */
  generateSticky(stmt) {
    if (!this.validateFunctionArgs('sticky', stmt.args, 3, stmt)) return;

    // Extract parts using helper
    const onCondition = this.arrowHelper.extractExpression(stmt.args[0]);
    const offCondition = this.arrowHelper.extractExpression(stmt.args[1]);
    const actions = this.arrowHelper.extractBody(stmt.args[2]);

    if (!onCondition || !offCondition) {
      this.errorHandler.addError(
        'sticky() arguments 1 and 2 must be arrow functions',
        stmt,
        'invalid_args'
      );
      return;
    }

    // Generate ON condition LC
    const onConditionId = this.generateCondition(onCondition, -1);

    // Generate OFF condition LC
    const offConditionId = this.generateCondition(offCondition, -1);

    // Generate STICKY operation (13)
    const stickyId = this.pushLogicCommand(OPERATION.STICKY,
      { type: OPERAND_TYPE.LC, value: onConditionId },
      { type: OPERAND_TYPE.LC, value: offConditionId }
    );

    // Generate actions
    for (const action of actions) {
      this.generateAction(action, stickyId);
    }
  }

  /**
   * Generate sticky assignment: latch1 = sticky({on: () => cond1, off: () => cond2})
   * Creates the sticky LC and tracks the variable name -> LC index mapping
   */
  generateStickyAssignment(stmt, activatorId = -1) {
    const { target, args } = stmt;

    if (!args || args.length < 1) {
      this.errorHandler.addError(
        'sticky() requires at least 1 argument',
        stmt,
        'invalid_args'
      );
      return;
    }

    // Extract on/off conditions from named parameters: {on: () => ..., off: () => ...}
    const configArg = args[0];
    let onCondition = null;
    let offCondition = null;

    if (configArg.type === 'ObjectExpression') {
      for (const prop of configArg.properties) {
        const propName = prop.key.name || prop.key.value;
        if (propName === 'on') {
          onCondition = this.arrowHelper.extractExpression(prop.value);
        } else if (propName === 'off') {
          offCondition = this.arrowHelper.extractExpression(prop.value);
        }
      }
    }

    if (!onCondition || !offCondition) {
      this.errorHandler.addError(
        'sticky() requires {on: () => condition, off: () => condition} argument',
        stmt,
        'invalid_args'
      );
      return;
    }

    // Generate ON condition LC (inherits activator from parent)
    const onConditionId = this.generateCondition(onCondition, activatorId);

    // Generate OFF condition LC (runs unconditionally - uses -1)
    const offConditionId = this.generateCondition(offCondition, -1);

    // Generate STICKY operation (13) - inherits activator from parent
    const stickyId = this.pushLogicCommand(OPERATION.STICKY,
      { type: OPERAND_TYPE.LC, value: onConditionId },
      { type: OPERAND_TYPE.LC, value: offConditionId },
      activatorId
    );

    // Track the variable name -> LC index mapping for use in conditions
    this.latchVariables.set(target, stickyId);
  }

  /**
   * Generate delay handler
   * delay(() => condition, duration_ms, () => { actions })
   * Also supports: delay(() => condition, { duration: ms }, () => { actions })
   */
  generateDelay(stmt) {
    if (!this.validateFunctionArgs('delay', stmt.args, 3, stmt)) return;

    // Extract parts using helper
    const condition = this.arrowHelper.extractExpression(stmt.args[0]);

    // Duration can be a plain number or {duration: ms} object
    let duration;
    const durationArg = stmt.args[1];
    if (durationArg && durationArg.type === 'Literal' && typeof durationArg.value === 'number') {
      duration = durationArg.value;
    } else {
      duration = this.arrowHelper.extractDuration(durationArg);
    }

    const actions = this.arrowHelper.extractBody(stmt.args[2]);

    if (!condition) {
      this.errorHandler.addError(
        'delay() argument 1 must be an arrow function',
        stmt,
        'invalid_args'
      );
      return;
    }

    // Generate condition LC
    const conditionId = this.generateCondition(condition, -1);

    // Generate DELAY operation (48)
    const delayId = this.pushLogicCommand(OPERATION.DELAY,
      { type: OPERAND_TYPE.LC, value: conditionId },
      { type: OPERAND_TYPE.VALUE, value: duration }
    );

    // Generate actions (can include if statements)
    for (const action of actions) {
      if (action.type === 'IfStatement') {
        // Convert IfStatement to EventHandlers and generate each
        const handlers = this.convertIfToEventHandlers(action, delayId);
        for (const handler of handlers) {
          this.generateEventHandler(handler);
        }
      } else {
        this.generateAction(action, delayId);
      }
    }
  }

  /**
   * Convert IfStatement from arrow helper to EventHandler format
   * Returns array of EventHandlers (one for if, one for else if present)
   */
  convertIfToEventHandlers(ifStmt, activatorId) {
    const handlers = [];

    // Create EventHandler for if block
    handlers.push({
      type: 'EventHandler',
      handler: 'ifthen',
      condition: ifStmt.condition,
      body: ifStmt.consequent,
      activatorId  // Parent activator (delay LC)
    });

    // Create EventHandler for else block if present
    if (ifStmt.alternate && ifStmt.alternate.length > 0) {
      // Invert the condition for else block
      const invertedCondition = {
        type: 'UnaryExpression',
        operator: '!',
        argument: ifStmt.condition
      };

      handlers.push({
        type: 'EventHandler',
        handler: 'ifthen',
        condition: invertedCondition,
        body: ifStmt.alternate,
        activatorId
      });
    }

    return handlers;
  }

  /**
   * Generate timer handler
   * timer(onMs, offMs, () => { actions })
   *
   * Creates a timer that cycles: ON for onMs, OFF for offMs, repeat
   * TIMER operation (49): Operand A = ON duration (ms), Operand B = OFF duration (ms)
   */
  generateTimer(stmt) {
    if (!this.validateFunctionArgs('timer', stmt.args, 3, stmt)) return;

    // Extract durations (should be literals)
    const onMs = this.arrowHelper.extractValue(stmt.args[0]);
    const offMs = this.arrowHelper.extractValue(stmt.args[1]);
    const actions = this.arrowHelper.extractBody(stmt.args[2]);

    if (typeof onMs !== 'number' || typeof offMs !== 'number') {
      this.errorHandler.addError(
        `timer() durations must be numeric literals. Got: ${typeof onMs}, ${typeof offMs}`,
        stmt,
        'invalid_args'
      );
      return;
    }

    if (onMs <= 0 || offMs <= 0) {
      this.errorHandler.addError(
        `timer() durations must be positive. Got: onMs=${onMs}ms, offMs=${offMs}ms`,
        stmt,
        'invalid_args'
      );
      return;
    }

    // Generate TIMER operation (49)
    // This is the activator - no condition needed, timer auto-toggles
    const timerId = this.pushLogicCommand(OPERATION.TIMER,
      { type: OPERAND_TYPE.VALUE, value: onMs },
      { type: OPERAND_TYPE.VALUE, value: offMs }
    );

    // Generate actions
    for (const action of actions) {
      this.generateAction(action, timerId);
    }
  }

  /**
   * Generate whenChanged handler (DELTA operation)
   * whenChanged(value, threshold, () => { actions })
   *
   * Triggers when value changes by >= threshold within 100ms
   * DELTA operation (50): Operand A = value to monitor, Operand B = threshold
   */
  generateWhenChanged(stmt) {
    if (!this.validateFunctionArgs('whenChanged', stmt.args, 3, stmt)) return;

    // Extract value to monitor (should be a flight parameter or gvar)
    const valueExpr = stmt.args[0];
    const threshold = this.arrowHelper.extractValue(stmt.args[1]);
    const actions = this.arrowHelper.extractBody(stmt.args[2]);

    if (typeof threshold !== 'number') {
      this.errorHandler.addError(
        `whenChanged() threshold must be a numeric literal. Got: ${typeof threshold}`,
        stmt,
        'invalid_args'
      );
      return;
    }

    if (threshold <= 0) {
      this.errorHandler.addError(
        `whenChanged() threshold must be positive. Got: ${threshold}`,
        stmt,
        'invalid_args'
      );
      return;
    }

    // Get the operand for the value to monitor
    // This could be flight.altitude, gvar[0], etc.
    const valueIdentifier = this.arrowHelper.extractIdentifier(valueExpr);
    const valueOperand = this.getOperand(valueIdentifier);

    if (!valueOperand) {
      this.errorHandler.addError(
        `whenChanged() invalid value: ${valueIdentifier}`,
        stmt,
        'invalid_args'
      );
      return;
    }

    // Generate DELTA operation (50)
    // This is the activator - returns true when value changes by >= threshold
    const deltaId = this.pushLogicCommand(OPERATION.DELTA,
      valueOperand,
      { type: OPERAND_TYPE.VALUE, value: threshold }
    );

    // Generate actions
    for (const action of actions) {
      this.generateAction(action, deltaId);
    }
  }

  /**
   * Generate condition logic condition
   * Delegates to ConditionGenerator helper class
   * @returns {number} The LC index of the final condition result
   */
  generateCondition(condition, activatorId) {
    return this.conditionGenerator.generate(condition, activatorId);
  }

  /**
   * Generate action logic condition
   * Delegates to ActionGenerator helper class
   */
  generateAction(action, activatorId) {
    // Handle StickyAssignment specially - it creates LCs and tracks latch variables
    if (action && action.type === 'StickyAssignment') {
      this.generateStickyAssignment(action, activatorId);
      return;
    }
    this.actionGenerator.generate(action, activatorId);
  }

  /**
   * Get operand from value
   */
  getOperand(value, activatorId = -1) {
    if (typeof value === 'number') {
      return { type: OPERAND_TYPE.VALUE, value };
    }

    if (typeof value === 'boolean') {
      return { type: OPERAND_TYPE.VALUE, value: value ? 1 : 0 };
    }

    // Handle transformed AST nodes from parser
    // These have {type: 'MemberExpression', value: 'rc[11]'} or {type: 'Literal', value: 123}
    if (typeof value === 'object' && value !== null && value.type) {
      if (value.type === 'Literal') {
        return { type: OPERAND_TYPE.VALUE, value: value.value };
      }
      if (value.type === 'MemberExpression' && value.value) {
        // Recursively process the string value
        return this.getOperand(value.value, activatorId);
      }
      if (value.type === 'Identifier' && (value.name || value.value)) {
        // Recursively process the identifier name
        return this.getOperand(value.name || value.value, activatorId);
      }
    }

    if (typeof value === 'string') {
      // Strip 'inav.' prefix if present (normalize to internal representation)
      let normalizedValue = value.startsWith('inav.') ? value.substring(5) : value;

      // Check if it's a variable reference
      if (this.variableHandler && this.variableHandler.isVariable(normalizedValue)) {
        const resolution = this.variableHandler.resolveVariable(normalizedValue);

        if (resolution.type === 'let_expression') {
          // Determine the appropriate activator for this const variable:
          // - Pure expressions (no side effects) → root level (-1) for maximum reuse
          // - Expressions with side effects → preserve activator context
          const hasSideEffects = this.conditionGenerator.expressionHasSideEffects(resolution.ast);
          const targetActivator = hasSideEffects ? activatorId : -1;

          const cacheKey = `${normalizedValue}:${targetActivator}`;
          if (this.constOperandCache.has(cacheKey)) {
            return this.constOperandCache.get(cacheKey);
          }

          // Generate with appropriate activator and cache the operand
          const operand = this.getOperand(resolution.ast, targetActivator);
          this.constOperandCache.set(cacheKey, operand);

          // Track LC index for this let variable (for variable map)
          if (this.variableHandler && this.variableHandler.setLetVariableLCIndex && operand.type === 4) {
            this.variableHandler.setLetVariableLCIndex(normalizedValue, operand.value);
          }

          return operand;
        } else if (resolution.type === 'var_gvar') {
          // Replace with gvar reference and continue (use normalized version)
          normalizedValue = resolution.gvarRef;
        }
      }

      // Use normalized value for all lookups (gvar[0], rc[5], flight.altitude, etc.)
      const lookupValue = normalizedValue;

      // Check for indexed operands (gvar[], rc[], pid[]) using declarative config
      for (const [prefix, def] of Object.entries(INDEXED_OPERAND_DEFS)) {
        if (lookupValue.startsWith(prefix)) {
          const match = lookupValue.match(def.regex);
          if (!match) {
            this.errorHandler.addError(def.syntaxError(value), null, def.syntaxCode);
            return { type: OPERAND_TYPE.VALUE, value: 0 };
          }
          const index = parseInt(match[1], 10);
          if (index < def.min || index > def.max) {
            this.errorHandler.addError(def.boundsError(index), null, def.boundsCode);
            return { type: OPERAND_TYPE.VALUE, value: 0 };
          }
          return { type: def.type, value: index };
        }
      }

      // Check in operand mapping
      if (this.operandMapping[lookupValue]) {
        return this.operandMapping[lookupValue];
      }

      // Try with original value (for backward compat during transition)
      if (this.operandMapping[value]) {
        return this.operandMapping[value];
      }

      this.errorHandler.addError(
        `Unknown operand '${value}'. Available: inav.flight.*, inav.rc[1-18], inav.gvar[0-7], inav.waypoint.*, inav.pid[0-3]`,
        null,
        'unknown_operand'
      );
      return { type: OPERAND_TYPE.VALUE, value: 0 }; // Return dummy value to continue collecting errors
    }

    // Handle expression objects (CallExpression, BinaryExpression, etc.)
    if (typeof value === 'object' && value !== null && value.type) {
      return this.generateExpression(value, activatorId);
    }

    return { type: OPERAND_TYPE.VALUE, value: 0 };
  }

  /**
   * Generate an expression and return operand reference to result
   * Handles Math.abs(), arithmetic operations, etc.
   */
  /**
   * Generate expression logic
   * Delegates to ExpressionGenerator helper class
   * @returns {Object} Operand object {type, value}
   */
  generateExpression(expr, activatorId) {
    return this.expressionGenerator.generate(expr, activatorId);
  }

  /**
   * Get operation from operator (for direct operations only)
   * Note: >=, <=, !=, !== are handled by ConditionGenerator.generateBinary()
   * via NOT synthesis, so they never reach this function.
   */
  getOperation(operator) {
    const ops = {
      '===': OPERATION.EQUAL,
      '==': OPERATION.EQUAL,
      '>': OPERATION.GREATER_THAN,
      '<': OPERATION.LOWER_THAN
    };

    if (ops[operator] !== undefined) {
      return ops[operator];
    }

    // Fail explicitly rather than silently generating incorrect logic
    this.errorHandler.addError(
      `Unsupported comparison operator '${operator}'. Supported: ===, ==, >, <, >=, <=, !=, !==`,
      null,
      'unsupported_operator'
    );
    throw new Error(`Unsupported comparison operator '${operator}'`);
  }

  /**
   * Get arithmetic operation
   */
  getArithmeticOperation(operator) {
    const ops = {
      '+': OPERATION.ADD,
      '-': OPERATION.SUB,
      '*': OPERATION.MUL,
      '/': OPERATION.DIV,
      '%': OPERATION.MODULUS
    };

    return ops[operator] || OPERATION.ADD;
  }
    /**
     * Get override operation for target
     */
    getOverrideOperation(target) {
      // Normalize target (add 'inav.' prefix if not present for backward compatibility)
      const normalizedTarget = target.startsWith('inav.') ? target : `inav.${target}`;

      // Use centralized API mapping instead of hardcoded values
      const entry = this.operandMapping[normalizedTarget];
      if (entry?.operation) {
        return entry.operation;
      }

      throw new Error(`Unknown override target: ${target}`);
    }

  /**
   * Build variable map from VariableHandler for storage and decompilation
   * This allows variable names to be preserved between sessions
   * @returns {Object} Variable map with let_variables, var_variables, and latch_variables
   */
  buildVariableMap() {
    const map = {
      let_variables: {},
      var_variables: {},
      latch_variables: {}  // Track latch variables structurally (for sticky/timer state)
    };

    if (!this.variableHandler || !this.variableHandler.symbols) {
      return map;
    }

    for (const [name, symbol] of this.variableHandler.symbols.entries()) {
      if (symbol.kind === 'let') {
        const lcIndex = this.variableHandler.letVariableLCIndices.get(name);

        // Only include variables that generated LCs (were actually used)
        // Variables that were fully inlined or unused won't have LC indices
        if (lcIndex === undefined) {
          continue;
        }

        const expression = this.astToExpressionString(symbol.expressionAST);

        // Skip expressions that contain invalid/unknown parts
        // These happen when AST references other variables that were also inlined
        if (expression.includes('undefined') || expression.includes('/* unknown expression */')) {
          // Still store the variable, but with a placeholder expression
          // The lcIndex is what matters for decompiler name matching
          map.let_variables[name] = {
            expression: '/* expression unavailable */',
            lcIndex: lcIndex,
            type: 'let'
          };
        } else {
          map.let_variables[name] = {
            expression: expression,
            lcIndex: lcIndex,
            type: 'let'
          };
        }
      } else if (symbol.kind === 'var') {
        map.var_variables[name] = {
          gvar: symbol.gvarIndex,
          expression: this.astToExpressionString(symbol.expressionAST)
        };
      } else if (symbol.kind === 'latch') {
        // Latch variables reference LC indices, not gvar slots
        map.latch_variables[name] = {
          lcIndex: symbol.lcIndex
        };
      }
    }

    return map;
  }

  /**
   * Convert AST expression to source string representation
   * Used for storing variable expressions for later reconstruction
   * @param {Object|string|number} ast - AST node or primitive value
   * @returns {string} Source code representation
   */
  astToExpressionString(ast) {
    if (ast === null || ast === undefined) {
      return '0';
    }

    if (typeof ast === 'string') {
      return ast;
    }

    if (typeof ast === 'number') {
      return ast.toString();
    }

    if (typeof ast === 'boolean') {
      return ast ? 'true' : 'false';
    }

    if (typeof ast !== 'object') {
      return String(ast);
    }

    switch (ast.type) {
      case 'Literal':
        if (typeof ast.value === 'string') {
          return `"${ast.value}"`;
        }
        return String(ast.value);

      case 'Identifier':
        return ast.name;

      case 'MemberExpression':
        if (ast.value) {
          return ast.value;
        }
        const obj = this.astToExpressionString(ast.object);
        const prop = ast.computed ?
          `[${this.astToExpressionString(ast.property)}]` :
          `.${this.astToExpressionString(ast.property)}`;
        return obj + prop;

      case 'BinaryExpression':
        return `(${this.astToExpressionString(ast.left)} ${ast.operator} ${this.astToExpressionString(ast.right)})`;

      case 'UnaryExpression':
        return `${ast.operator}${this.astToExpressionString(ast.argument)}`;

      case 'CallExpression': {
        const callee = this.astToExpressionString(ast.callee);
        const args = (ast.arguments || []).map(arg => this.astToExpressionString(arg)).join(', ');
        return `${callee}(${args})`;
      }

      case 'ConditionalExpression':
        return `${this.astToExpressionString(ast.test)} ? (${this.astToExpressionString(ast.consequent)}) : ${this.astToExpressionString(ast.alternate)}`;

      case 'LogicalExpression':
        return `(${this.astToExpressionString(ast.left)} ${ast.operator} ${this.astToExpressionString(ast.right)})`;

      default:
        // Fallback: try to extract value property if available
        if (ast.value !== undefined) {
          return String(ast.value);
        }
        return '/* unknown expression */';
    }
  }
}

export { INAVCodeGenerator };
