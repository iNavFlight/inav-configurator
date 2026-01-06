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
    this.latchVariables = context.latchVariables; // Map variable name -> LC index for sticky/timer
    this.context = context; // Store context for dynamic variableHandler access

    // Cache for generated conditions (CSE - Common Subexpression Elimination)
    // Maps condition key -> LC index
    this.conditionCache = new Map();
  }

  /**
   * Get variableHandler (accessed dynamically because it's set after codegen construction)
   */
  get variableHandler() {
    return this.context.variableHandler;
  }

  /**
   * Reset the condition cache
   * Should be called at the start of each transpilation
   */
  reset() {
    this.conditionCache.clear();
  }

  /**
   * Invalidate cache entries that reference a specific variable
   * Should be called when a variable is mutated (assigned, incremented, etc.)
   * @param {string} varName - Variable name, e.g., 'gvar[1]'
   */
  invalidateCacheForVariable(varName) {
    // Build a pattern that matches cache keys referencing this variable
    // Cache keys look like: "binary:3:{type:5,value:1}:{type:0,value:2}:-1"
    // For gvar[1], we need to match keys containing "type\":5,\"value\":1" (GVAR type=5)
    // or containing the string "gvar[1]"

    const keysToDelete = [];

    for (const key of this.conditionCache.keys()) {
      if (this.cacheKeyReferencesVariable(key, varName)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.conditionCache.delete(key);
    }
  }

  /**
   * Check if a cache key references a specific variable
   * @param {string} key - Cache key
   * @param {string} varName - Variable name, e.g., 'gvar[1]'
   * @returns {boolean} True if the key references the variable
   * @private
   */
  cacheKeyReferencesVariable(key, varName) {
    // Extract gvar index from varName like 'gvar[1]'
    const gvarMatch = varName.match(/^gvar\[(\d+)\]$/);
    if (gvarMatch) {
      const gvarIndex = parseInt(gvarMatch[1]);
      // GVAR operand type is 5, so look for {"type":5,"value":N} in the key
      // Cache keys are JSON stringified, so patterns like:
      // "type":5,"value":1  or  "type": 5, "value": 1
      const pattern1 = `"type":5,"value":${gvarIndex}`;
      const pattern2 = `"type": 5, "value": ${gvarIndex}`;

      if (key.includes(pattern1) || key.includes(pattern2)) {
        return true;
      }
    }

    // Also check for direct string reference (for future variable types)
    if (key.includes(varName)) {
      return true;
    }

    return false;
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
      case 'Identifier':
        return this.generateIdentifier(condition, activatorId);
      case 'ConditionalExpression':
        return this.generateConditional(condition, activatorId);
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
   * Generate identifier condition (variable reference)
   * Handles:
   *   - latch variables from sticky() assignments
   *   - let/const variables (inline substitution)
   * @private
   */
  generateIdentifier(condition, activatorId) {
    // Parser may produce {type: 'Identifier', name: 'x'} (Acorn style) or
    // {type: 'Identifier', value: 'x'} (simplified style)
    const varName = condition.name || condition.value;

    // Check if this is a latch variable (from sticky assignment)
    if (this.latchVariables && this.latchVariables.has(varName)) {
      // Return the LC index directly - the sticky LC is already a boolean condition
      return this.latchVariables.get(varName);
    }

    // Check if this is a let/const variable
    if (this.variableHandler && this.variableHandler.isVariable(varName)) {
      const resolution = this.variableHandler.resolveVariable(varName);
      if (resolution && resolution.type === 'let_expression' && resolution.ast) {
        // Determine the appropriate activator for this const variable:
        // - Pure expressions (no side effects) → root level (-1) for maximum reuse
        // - Expressions with side effects → preserve activator context
        const hasSideEffects = this.expressionHasSideEffects(resolution.ast);
        const targetActivator = hasSideEffects ? activatorId : -1;

        const cacheKey = this.getCacheKey('let_var', varName, targetActivator);
        if (this.conditionCache.has(cacheKey)) {
          return this.conditionCache.get(cacheKey);
        }

        // Generate with appropriate activator and cache the result
        const resultId = this.generate(resolution.ast, targetActivator);
        this.conditionCache.set(cacheKey, resultId);

        // Track LC index for this let variable (for variable map)
        if (this.variableHandler && this.variableHandler.setLetVariableLCIndex) {
          this.variableHandler.setLetVariableLCIndex(varName, resultId);
        }

        return resultId;
      }
    }

    // Unknown identifier in condition context
    this.errorHandler.addError(
      `Unknown identifier '${varName}' in condition. Expected a latch variable from sticky() assignment or a let/const variable.`,
      condition,
      'unknown_identifier'
    );
    return this.getLcIndex();
  }

  /**
   * Check if an expression AST has side effects
   *
   * Side effects include:
   * - Stateful operations: edge(), delay(), timer()
   * - Mutations: GVAR_SET, GVAR_INC, GVAR_DEC, RC_OVERRIDE
   *
   * Pure operations (no side effects):
   * - Arithmetic: +, -, *, /
   * - Comparisons: <, >, ===
   * - Boolean logic: &&, ||, !, xor, nand, nor
   * - Data access: rc[N].low, flight.altitude, etc.
   *
   * @param {Object} ast - Expression AST to check
   * @returns {boolean} True if expression has side effects
   */
  expressionHasSideEffects(ast) {
    if (!ast || typeof ast !== 'object') {
      return false;
    }

    // Check for stateful function calls
    if (ast.type === 'CallExpression' && ast.callee) {
      const funcName = ast.callee.name || ast.callee.value;
      // These functions maintain internal state
      if (funcName === 'edge' || funcName === 'delay' || funcName === 'timer') {
        return true;
      }
      // Recursive check of arguments
      if (ast.arguments) {
        for (const arg of ast.arguments) {
          if (this.expressionHasSideEffects(arg)) {
            return true;
          }
        }
      }
    }

    // Check for assignment operations (these would be rare in const expressions)
    if (ast.type === 'AssignmentExpression') {
      return true;
    }

    // Recursively check child expressions
    if (ast.type === 'BinaryExpression' || ast.type === 'LogicalExpression') {
      return this.expressionHasSideEffects(ast.left) || this.expressionHasSideEffects(ast.right);
    }

    if (ast.type === 'UnaryExpression') {
      return this.expressionHasSideEffects(ast.argument);
    }

    if (ast.type === 'ConditionalExpression') {
      return this.expressionHasSideEffects(ast.test) ||
             this.expressionHasSideEffects(ast.consequent) ||
             this.expressionHasSideEffects(ast.alternate);
    }

    // Literals, identifiers, member expressions are pure
    return false;
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
   *
   * Optimization: For constant comparisons, we normalize to avoid NOT synthesis:
   *   a >= 5  →  a > 4   (saves 1 LC slot)
   *   a <= 5  →  a < 6   (saves 1 LC slot)
   */
  generateBinary(condition, activatorId) {
    const operator = condition.operator;

    // Optimization: Normalize >= and <= with integer constants to > and <
    // This saves 1 LC slot by avoiding NOT synthesis
    // Only applies when RHS is a numeric literal (integer)
    if ((operator === '>=' || operator === '<=') && this.isIntegerLiteral(condition.right)) {
      const constValue = this.getIntegerValue(condition.right);
      if (operator === '>=') {
        // x >= 5 → x > 4
        return this.generateBinary({
          ...condition,
          operator: '>',
          right: { type: 'Literal', value: constValue - 1 }
        }, activatorId);
      } else {
        // x <= 5 → x < 6
        return this.generateBinary({
          ...condition,
          operator: '<',
          right: { type: 'Literal', value: constValue + 1 }
        }, activatorId);
      }
    }

    const left = this.getOperand(condition.left);
    const right = this.getOperand(condition.right);

    // Handle operators that need synthesis via NOT (for non-constant cases)
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
   * Check if an AST node/value is an integer literal
   * Handles both raw numbers and Literal AST nodes
   * @private
   */
  isIntegerLiteral(node) {
    // Handle raw number (from transformExpression)
    if (typeof node === 'number') {
      return Number.isInteger(node);
    }
    // Handle Literal AST node
    return node &&
           node.type === 'Literal' &&
           typeof node.value === 'number' &&
           Number.isInteger(node.value);
  }

  /**
   * Get the integer value from a literal node/value
   * @private
   */
  getIntegerValue(node) {
    if (typeof node === 'number') return node;
    return node.value;
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
   * Recognizes patterns:
   *   !(a && b) → NAND
   *   !(a || b) → NOR
   * @private
   */
  generateUnary(condition, activatorId) {
    const arg = condition.argument;

    // Pattern: !(a && b) → NAND
    if (arg.type === 'LogicalExpression' && arg.operator === '&&') {
      const leftId = this.generate(arg.left, activatorId);
      const rightId = this.generate(arg.right, activatorId);
      return this.pushLogicCommand(OPERATION.NAND,
        { type: OPERAND_TYPE.LC, value: leftId },
        { type: OPERAND_TYPE.LC, value: rightId },
        activatorId
      );
    }

    // Pattern: !(a || b) → NOR
    if (arg.type === 'LogicalExpression' && arg.operator === '||') {
      const leftId = this.generate(arg.left, activatorId);
      const rightId = this.generate(arg.right, activatorId);
      return this.pushLogicCommand(OPERATION.NOR,
        { type: OPERAND_TYPE.LC, value: leftId },
        { type: OPERAND_TYPE.LC, value: rightId },
        activatorId
      );
    }

    // Default: generate argument, then apply NOT
    const argId = this.generate(arg, activatorId);
    return this.pushLogicCommand(OPERATION.NOT,
      { type: OPERAND_TYPE.LC, value: argId },
      { type: OPERAND_TYPE.VALUE, value: 0 },
      activatorId
    );
  }

  /**
   * Generate conditional (ternary) expression
   * Recognizes patterns:
   *   (a) ? !(b) : (b) → XOR(a, b)
   *   cond ? val : 0   → val with cond as activator
   *   a ? b : c        → general ternary (5 LCs)
   * @private
   */
  generateConditional(condition, activatorId) {
    const { test, consequent, alternate } = condition;

    // Pattern: (a) ? !(b) : (b) → XOR
    // Check if consequent is NOT(x) and alternate equals x
    if (consequent.type === 'UnaryExpression' && consequent.operator === '!') {
      const notArg = consequent.argument;
      // Check if alternate matches the NOT argument
      if (this.conditionsEqual(notArg, alternate)) {
        // This is XOR pattern
        const leftId = this.generate(test, activatorId);
        const rightId = this.generate(alternate, activatorId);
        return this.pushLogicCommand(OPERATION.XOR,
          { type: OPERAND_TYPE.LC, value: leftId },
          { type: OPERAND_TYPE.LC, value: rightId },
          activatorId
        );
      }
    }

    // Pattern: cond ? val : 0 → val with cond as activator
    // The alternate must be 0 (literal)
    if (alternate.type === 'Literal' && alternate.value === 0) {
      const condId = this.generate(test, activatorId);
      // Generate consequent with the condition as its activator
      const valId = this.generate(consequent, condId);
      return valId;
    }

    // General ternary: a ? b : c
    // Implemented as:
    //   LC_COND: test condition
    //   LC_CONS: consequent with LC_COND as activator (outputs b when true, 0 when false)
    //   LC_NOT:  NOT(LC_COND)
    //   LC_ALT:  alternate with LC_NOT as activator (outputs c when false, 0 when true)
    //   LC_RES:  OR(LC_CONS, LC_ALT) - combines (one is always 0/false)
    const condId = this.generate(test, activatorId);
    const consequentId = this.generate(consequent, condId);

    const notCondId = this.pushLogicCommand(OPERATION.NOT,
      { type: OPERAND_TYPE.LC, value: condId },
      { type: OPERAND_TYPE.VALUE, value: 0 },
      activatorId
    );

    const alternateId = this.generate(alternate, notCondId);

    // Combine with OR - exactly one of consequentId or alternateId will be non-zero
    return this.pushLogicCommand(OPERATION.OR,
      { type: OPERAND_TYPE.LC, value: consequentId },
      { type: OPERAND_TYPE.LC, value: alternateId },
      activatorId
    );
  }

  /**
   * Check if a conditional expression is an XOR pattern: (a) ? !(b) : (b)
   * @private
   */
  isXorPattern(expr) {
    if (expr.type !== 'ConditionalExpression') return false;
    const { consequent, alternate } = expr;

    // Check if consequent is !(something) and alternate is that something
    if (consequent.type === 'UnaryExpression' && consequent.operator === '!') {
      return this.conditionsEqual(consequent.argument, alternate);
    }
    return false;
  }

  /**
   * Extract the right operand from an XOR pattern: (a) ? !(b) : (b) returns b
   * Assumes isXorPattern(expr) is true
   * @private
   */
  getXorRightOperand(expr) {
    return expr.alternate;
  }

  /**
   * Check if two condition ASTs are structurally equal
   * @private
   */
  conditionsEqual(a, b) {
    if (!a || !b) return false;
    if (a.type !== b.type) return false;

    switch (a.type) {
      case 'Identifier':
        return (a.name || a.value) === (b.name || b.value);
      case 'Literal':
        return a.value === b.value;
      case 'MemberExpression':
        return a.value === b.value;
      case 'BinaryExpression':
      case 'LogicalExpression':
        return a.operator === b.operator &&
               this.conditionsEqual(a.left, b.left) &&
               this.conditionsEqual(a.right, b.right);
      case 'UnaryExpression':
        return a.operator === b.operator &&
               this.conditionsEqual(a.argument, b.argument);
      case 'CallExpression':
        // For call expressions, compare callee name and arguments
        const aCallee = a.callee.name || (a.callee.property && a.callee.property.name);
        const bCallee = b.callee.name || (b.callee.property && b.callee.property.name);
        if (aCallee !== bCallee) return false;
        if (a.arguments.length !== b.arguments.length) return false;
        return a.arguments.every((arg, i) => this.conditionsEqual(arg, b.arguments[i]));
      case 'ConditionalExpression':
        // Recursively compare ternary expressions
        // Also recognize if both are semantically XOR patterns
        if (this.isXorPattern(a) && this.isXorPattern(b)) {
          // Both are XOR patterns - compare the operands
          return this.conditionsEqual(a.test, b.test) &&
                 this.conditionsEqual(this.getXorRightOperand(a), this.getXorRightOperand(b));
        }
        // Standard structural comparison
        return this.conditionsEqual(a.test, b.test) &&
               this.conditionsEqual(a.consequent, b.consequent) &&
               this.conditionsEqual(a.alternate, b.alternate);
      default:
        return JSON.stringify(a) === JSON.stringify(b);
    }
  }

  /**
   * Generate member expression condition (property access, RC channel states)
   * @private
   */
  generateMember(condition, activatorId) {
    // RC channel LOW/MID/HIGH state detection: rc[1].low, rc[2].mid, rc[3].high
    // Also handles namespaced version: inav.rc[1].low, inav.rc[2].mid, inav.rc[3].high
    if (typeof condition.value === 'string' && (condition.value.startsWith('rc[') || condition.value.startsWith('inav.rc['))) {
      const match = condition.value.match(/^(?:inav\.)?rc\[(\d+)\]\.(low|mid|high)$/);
      if (match) {
        const channelIndex = parseInt(match[1]);
        const state = match[2];

        const stateOp = state === 'low' ? OPERATION.LOW :
                       state === 'mid' ? OPERATION.MID :
                       OPERATION.HIGH;

        return this.generateCachedFunctionCall(
          `rc_${state}`,
          stateOp,
          { type: OPERAND_TYPE.RC_CHANNEL, value: channelIndex },
          { type: OPERAND_TYPE.VALUE, value: 0 },
          activatorId
        );
      }
    }

    const operand = this.getOperand(condition.value);
    const valueStr = typeof condition.value === 'string' ? condition.value : '';

    // gvar truthy: use != 0 to handle any non-zero value (compiled as NOT(gvar === 0))
    if (valueStr.startsWith('gvar[')) {
      const cacheKey = this.getCacheKey('gvar_truthy', operand, activatorId);
      if (this.conditionCache.has(cacheKey)) {
        return this.conditionCache.get(cacheKey);
      }

      const equalZeroId = this.pushLogicCommand(OPERATION.EQUAL,
        operand,
        { type: OPERAND_TYPE.VALUE, value: 0 },
        activatorId
      );
      const resultId = this.pushLogicCommand(OPERATION.NOT,
        { type: OPERAND_TYPE.LC, value: equalZeroId },
        { type: OPERAND_TYPE.VALUE, value: 0 },
        activatorId
      );

      this.conditionCache.set(cacheKey, resultId);
      return resultId;
    }

    // Boolean properties: flight.mode.*, etc. are 0 or 1, check === 1
    return this.generateCachedFunctionCall(
      'bool_check',
      OPERATION.EQUAL,
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
    // Check for helper functions - backward compat: xor()
    let funcName = null;
    if (condition.callee.type === 'Identifier') {
      funcName = condition.callee.name;
    }
    // Check for helper functions - new syntax: inav.helpers.xor()
    else if (condition.callee.object?.property?.name === 'helpers') {
      funcName = condition.callee.property?.name;
    }

    // If not a helper function call, unknown function
    if (!funcName) {
      this.errorHandler.addError('Unknown function call');
      return this.getLcIndex();
    }

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

    // Handle edge(condition, duration) - Edge detection
    if (funcName === 'edge') {
      if (!this.validateFunctionArgs('edge', condition.arguments, 2, condition)) {
        return this.getLcIndex();
      }

      // Generate the underlying condition
      const conditionId = this.generate(condition.arguments[0], activatorId);

      // Get duration value
      const duration = condition.arguments[1];
      const durationValue = duration?.type === 'Literal' ? duration.value : 0;

      // Generate EDGE operation with caching
      return this.generateCachedFunctionCall(
        'edge',
        OPERATION.EDGE,
        { type: OPERAND_TYPE.LC, value: conditionId },
        { type: OPERAND_TYPE.VALUE, value: durationValue },
        activatorId
      );
    }

    // Handle delay(condition, duration) - Delay pattern (condition must be true for duration ms)
    if (funcName === 'delay') {
      if (!this.validateFunctionArgs('delay', condition.arguments, 2, condition)) {
        return this.getLcIndex();
      }

      // Generate the underlying condition
      const conditionId = this.generate(condition.arguments[0], activatorId);

      // Get duration value
      const duration = condition.arguments[1];
      const durationValue = duration?.type === 'Literal' ? duration.value : 0;

      // Generate DELAY operation with caching
      return this.generateCachedFunctionCall(
        'delay',
        OPERATION.DELAY,
        { type: OPERAND_TYPE.LC, value: conditionId },
        { type: OPERAND_TYPE.VALUE, value: durationValue },
        activatorId
      );
    }

    // Handle delta(value, threshold) - Change detection
    if (funcName === 'delta') {
      if (!this.validateFunctionArgs('delta', condition.arguments, 2, condition)) {
        return this.getLcIndex();
      }

      // First argument can be MemberExpression with .value string, or raw AST
      const firstArg = condition.arguments[0];
      const valueToResolve = (firstArg.type === 'MemberExpression' && firstArg.value)
        ? firstArg.value  // Use the extracted string value
        : firstArg;
      const valueOperand = this.getOperand(valueToResolve, activatorId);

      const threshold = condition.arguments[1];
      const thresholdValue = threshold?.type === 'Literal' ? threshold.value : 0;

      // Generate DELTA operation with caching
      return this.generateCachedFunctionCall(
        'delta',
        OPERATION.DELTA,
        valueOperand,
        { type: OPERAND_TYPE.VALUE, value: thresholdValue },
        activatorId
      );
    }

    // Unsupported function in condition
    this.errorHandler.addError(
      `Unsupported function in condition: ${funcName}(). Supported: xor, nand, nor, approxEqual, edge, delay, delta`,
      condition,
      'unsupported_function'
    );
    return this.getLcIndex();
  }

  /**
   * Generate a cached function call operation (edge, delay, delta, etc.)
   *
   * This helper method implements the cache-check-generate-cache pattern
   * used for special function operations to avoid generating duplicate LCs
   * for semantically identical operations.
   *
   * Similar to how generateBinary() caches comparison operations, this ensures
   * that repeated function calls like edge(rc[5].high, 5000) generate only one LC
   * even if they appear multiple times in different branches.
   *
   * @param {string} funcName - Function name for cache key (e.g., 'edge', 'delay')
   * @param {number} operation - OPERATION constant (e.g., OPERATION.EDGE)
   * @param {Object} operandA - First operand {type, value}
   * @param {Object} operandB - Second operand {type, value}
   * @param {number} activatorId - Activator LC index
   * @param {*} extraParam - Optional extra parameter (e.g., tolerance for approxEqual)
   * @returns {number} The LC index of the cached or newly generated operation
   * @private
   */
  generateCachedFunctionCall(funcName, operation, operandA, operandB, activatorId, extraParam) {
    // Build cache key from function name, operation, and operands
    const cacheKey = this.getCacheKey(funcName, operation, operandA, operandB, activatorId);

    // Check if we've already generated this exact operation
    if (this.conditionCache.has(cacheKey)) {
      return this.conditionCache.get(cacheKey);
    }

    // Generate new LC
    const resultId = this.pushLogicCommand(operation, operandA, operandB, activatorId, extraParam);

    // Cache for future reuse
    this.conditionCache.set(cacheKey, resultId);

    return resultId;
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
