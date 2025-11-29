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

    // Initialize helper generators
    const context = {
      pushLogicCommand: this.pushLogicCommand.bind(this),
      getOperand: this.getOperand.bind(this),
      validateFunctionArgs: this.validateFunctionArgs.bind(this),
      getArithmeticOperation: this.getArithmeticOperation.bind(this),
      getOverrideOperation: this.getOverrideOperation.bind(this),
      errorHandler: this.errorHandler,
      arrowHelper: this.arrowHelper,
      variableHandler: this.variableHandler,
      getLcIndex: () => this.lcIndex
    };

    this.conditionGenerator = new ConditionGenerator(context);
    this.expressionGenerator = new ExpressionGenerator(context);
    this.actionGenerator = new ActionGenerator(context);
  }

  /**
   * Generate INAV CLI commands from AST
   * @param {Object} ast - Abstract syntax tree
   * @returns {string[]} Array of CLI commands
   */
  generate(ast) {
    this.lcIndex = 0;
    this.commands = [];
    this.errorHandler.reset(); // Clear any previous errors

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
      this.generateStatement(stmt);
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
      case 'Destructuring':
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
   * Generate event handler (if statement, edge, sticky, delay, on.*)
   */
  generateEventHandler(stmt) {
    const handler = stmt.handler;

    if (handler === 'on.arm') {
      this.generateOnArm(stmt);
    } else if (handler === 'on.always') {
      this.generateOnAlways(stmt);
    } else if (handler.startsWith('if')) {
      // If statement - generates conditional logic
      this.generateConditional(stmt);
    } else if (handler === 'edge') {
      this.generateEdge(stmt);
    } else if (handler === 'sticky') {
      this.generateSticky(stmt);
    } else if (handler === 'delay') {
      this.generateDelay(stmt);
    } else if (handler === 'timer') {
      this.generateTimer(stmt);
    } else if (handler === 'whenChanged') {
      this.generateWhenChanged(stmt);
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
   * Generate delay handler
   * delay(() => condition, { duration: ms }, () => { actions })
   */
  generateDelay(stmt) {
    if (!this.validateFunctionArgs('delay', stmt.args, 3, stmt)) return;

    // Extract parts using helper
    const condition = this.arrowHelper.extractExpression(stmt.args[0]);
    const duration = this.arrowHelper.extractDuration(stmt.args[1]);
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

    // Generate actions
    for (const action of actions) {
      this.generateAction(action, delayId);
    }
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

    if (typeof value === 'string') {
      // Check if it's a variable reference
      if (this.variableHandler && this.variableHandler.isVariable(value)) {
        const resolution = this.variableHandler.resolveVariable(value);

        if (resolution.type === 'let_expression') {
          // Inline substitute the expression AST
          return this.getOperand(resolution.ast, activatorId);
        } else if (resolution.type === 'var_gvar') {
          // Replace with gvar reference and continue
          value = resolution.gvarRef;
        }
      }

      // Check for gvar
      if (value.startsWith('gvar[')) {
        const index = parseInt(value.match(/\d+/)[0]);
        return { type: OPERAND_TYPE.GVAR, value: index };
      }

      // Check for rc channel
      if (value.startsWith('rc[')) {
        const index = parseInt(value.match(/\d+/)[0]);
        return { type: OPERAND_TYPE.RC_CHANNEL, value: index };
      }

      // Check in operand mapping
      if (this.operandMapping[value]) {
        return this.operandMapping[value];
      }

      this.errorHandler.addError(
        `Unknown operand '${value}'. Available: flight.*, rc.*, gvar[0-7], waypoint.*, pid.*`,
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
   * Get operation from operator
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
      const operations = {
        'override.throttleScale': OPERATION.OVERRIDE_THROTTLE_SCALE,
        'override.throttle': OPERATION.OVERRIDE_THROTTLE,
        'override.vtx.power': OPERATION.SET_VTX_POWER_LEVEL,
        'override.vtx.band': OPERATION.SET_VTX_BAND,
        'override.vtx.channel': OPERATION.SET_VTX_CHANNEL,
        'override.armSafety': OPERATION.OVERRIDE_ARMING_SAFETY
      };

      const operation = operations[target];
      if (!operation) {
        throw new Error(`Unknown override target: ${target}`);
      }

      return operation;
    }

  /**
   * Build variable map from VariableHandler for storage and decompilation
   * This allows variable names to be preserved between sessions
   * @returns {Object} Variable map with let_variables and var_variables
   */
  buildVariableMap() {
    const map = {
      let_variables: {},
      var_variables: {}
    };

    if (!this.variableHandler || !this.variableHandler.symbols) {
      return map;
    }

    for (const [name, symbol] of this.variableHandler.symbols.entries()) {
      if (symbol.kind === 'let') {
        map.let_variables[name] = {
          expression: this.astToExpressionString(symbol.expressionAST),
          type: 'let'
        };
      } else if (symbol.kind === 'var') {
        map.var_variables[name] = {
          gvar: symbol.gvarIndex,
          expression: this.astToExpressionString(symbol.expressionAST)
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
