/**
'use strict';

 * INAV Code Generator
 * 
 * Location: tabs/programming/transpiler/transpiler/codegen.js
 * 
 * Generic code generator that reads from API definitions.
 * This file rarely needs changes - new features are added to definitions only!
 */

const { getDefinition, getINAVOperand, getINAVOperation  } = require('../api/definitions/index.js');

/**
 * INAV Code Generator
 * Converts analyzed AST to INAV CLI commands
 */
class INAVCodeGenerator {
  constructor() {
    this.logicConditions = [];
    this.lcIndex = 0;
    this.lcMap = new Map(); // Track variable names to LC indices
  }
  
  /**
   * Generate INAV CLI commands from analyzed code
   * @param {Object} analyzed - Analyzed AST
   * @returns {string[]} Array of CLI command strings
   */
  generate(analyzed) {
    this.logicConditions = [];
    this.lcIndex = 0;
    this.lcMap.clear();
    
    // Process each top-level statement
    for (const statement of analyzed.statements) {
      this.processStatement(statement);
    }
    
    return this.logicConditions;
  }
  
  /**
   * Process a single statement
   */
  processStatement(statement) {
    switch (statement.type) {
      case 'EventHandler':
        return this.processEventHandler(statement);
      case 'Assignment':
        return this.processAssignment(statement);
      default:
        console.warn(`Unknown statement type: ${statement.type}`);
    }
  }
  
  /**
   * Process event handler (on.arm, when, etc.)
   */
  processEventHandler(statement) {
    const { handler, config, body } = statement;
    
    let activatorLC = -1; // -1 means always active
    
    // Create activator condition
    if (handler === 'on.arm') {
      const delay = config.delay || 1;
      activatorLC = this.createArmTimerCondition(delay);
    } else if (handler === 'when') {
      activatorLC = this.createCondition(statement.condition);
    }
    
    // Process body statements with this activator
    for (const bodyStatement of body) {
      this.processBodyStatement(bodyStatement, activatorLC);
    }
  }
  
  /**
   * Process statement inside event handler body
   */
  processBodyStatement(statement, activator) {
    if (statement.type === 'Assignment') {
      return this.processAssignment(statement, activator);
    } else if (statement.type === 'Expression') {
      return this.processExpression(statement.expression, activator);
    }
  }
  
  /**
   * Process assignment (gvar[0] = value, override.vtx.power = 3, etc.)
   */
  processAssignment(statement, activator = -1) {
    const { target, value } = statement;
    
    // Handle GVAR assignment
    if (target.startsWith('gvar[')) {
      const index = this.extractArrayIndex(target);
      const valueLC = this.resolveValue(value, activator);
      
      // Operation 18 = GVAR_SET
      this.addLogicCondition(
        activator,
        18, // GVAR_SET
        0, index, // Operand A: value (GVAR index)
        4, valueLC // Operand B: LC result
      );
      return;
    }
    
    // Handle override assignment
    if (target.startsWith('override.')) {
      const path = target.replace('override.', '');
      const def = getDefinition(`override.${path}`);
      
      if (!def) {
        throw new Error(`Unknown override: ${target}`);
      }
      
      // Use custom codegen if available
      if (def.codegen) {
        const code = def.codegen(value, activator, this.lcIndex);
        this.logicConditions.push(code);
        this.logicConditions.push(`# ${target} = ${value}`);
        this.lcIndex++;
        return;
      }
      
      // Use standard template
      if (def.inavOperation) {
        this.addLogicCondition(
          activator,
          def.inavOperation,
          0, value, // Operand A: value
          0, 0      // Operand B: unused
        );
        this.logicConditions.push(`# ${target} = ${value}`);
        return;
      }
      
      throw new Error(`No code generation strategy for ${target}`);
    }
    
    // Handle variable assignment (arithmetic)
    if (statement.operation) {
      const resultLC = this.processArithmetic(statement, activator);
      this.lcMap.set(target, resultLC);
      return resultLC;
    }
  }
  
  /**
   * Process arithmetic expression
   */
  processArithmetic(statement, activator) {
    const { operation, left, right } = statement;
    
    const leftValue = this.resolveValue(left, activator);
    const rightValue = this.resolveValue(right, activator);
    
    const operationMap = {
      '+': 14, // ADD
      '-': 15, // SUB
      '*': 16, // MUL
      '/': 17, // DIV
      '%': 40  // MODULUS
    };
    
    const opCode = operationMap[operation];
    if (!opCode) {
      throw new Error(`Unsupported operation: ${operation}`);
    }
    
    const resultLC = this.lcIndex;
    this.addLogicCondition(
      activator,
      opCode,
      this.getOperandType(left), leftValue,
      this.getOperandType(right), rightValue
    );
    this.logicConditions.push(`# Arithmetic: ${left} ${operation} ${right}`);
    
    return resultLC;
  }
  
  /**
   * Create ARM timer condition
   */
  createArmTimerCondition(delay) {
    const lcIndex = this.lcIndex;
    
    // Operation 1 = EQUAL
    // Operand A: flight.armTimer (type 2, value 0)
    // Operand B: delay value (type 0, value delay)
    this.addLogicCondition(
      -1, // Always active
      1,  // EQUAL
      2, 0,   // Operand A: armTimer
      0, delay // Operand B: delay value
    );
    this.logicConditions.push(`# Trigger ${delay}s after arming`);
    
    return lcIndex;
  }
  
  /**
   * Create condition from expression
   */
  createCondition(condition) {
    const lcIndex = this.lcIndex;
    
    // Simple comparison: flight.homeDistance > 100
    if (condition.type === 'BinaryExpression') {
      const { operator, left, right } = condition;
      
      const operatorMap = {
        '>': 2,  // GREATER_THAN
        '<': 3,  // LOWER_THAN
        '===': 1, // EQUAL
        '==': 1   // EQUAL
      };
      
      const opCode = operatorMap[operator];
      if (!opCode) {
        throw new Error(`Unsupported operator: ${operator}`);
      }
      
      const leftValue = this.resolveValue(left);
      const rightValue = this.resolveValue(right);
      
      this.addLogicCondition(
        -1, // Always active
        opCode,
        this.getOperandType(left), leftValue,
        this.getOperandType(right), rightValue
      );
      this.logicConditions.push(`# Condition: ${left} ${operator} ${right}`);
    }
    
    // Logical OR: a || b
    else if (condition.type === 'LogicalExpression' && condition.operator === '||') {
      const leftLC = this.createCondition(condition.left);
      const rightLC = this.createCondition(condition.right);
      
      // Create OR operation
      this.addLogicCondition(
        -1, // Always active
        8,  // OR
        4, leftLC,  // Operand A: left condition result
        4, rightLC  // Operand B: right condition result
      );
      this.logicConditions.push(`# OR condition`);
    }
    
    // Logical AND: a && b
    else if (condition.type === 'LogicalExpression' && condition.operator === '&&') {
      const leftLC = this.createCondition(condition.left);
      const rightLC = this.createCondition(condition.right);
      
      // Create AND operation
      this.addLogicCondition(
        -1, // Always active
        7,  // AND
        4, leftLC,  // Operand A: left condition result
        4, rightLC  // Operand B: right condition result
      );
      this.logicConditions.push(`# AND condition`);
    }
    
    return lcIndex;
  }
  
  /**
   * Resolve a value to its operand representation
   */
  resolveValue(value, activator = -1) {
    // Literal number
    if (typeof value === 'number') {
      return value;
    }
    
    // Variable reference
    if (this.lcMap.has(value)) {
      return this.lcMap.get(value);
    }
    
    // Flight parameter: flight.homeDistance
    if (value.startsWith('flight.')) {
      const path = value.replace('flight.', '');
      const def = getDefinition(`flight.${path}`);
      if (def && def.inavOperand) {
        return def.inavOperand.value;
      }
    }
    
    // RC channel: rc[5].high (already resolved in parser)
    if (typeof value === 'object' && value.channel) {
      return value.channel;
    }
    
    return value;
  }
  
  /**
   * Get operand type for a value
   */
  getOperandType(value) {
    // Literal number
    if (typeof value === 'number') {
      return 0; // VALUE
    }
    
    // Variable reference (logic condition result)
    if (this.lcMap.has(value)) {
      return 4; // LC
    }
    
    // Flight parameter
    if (typeof value === 'string' && value.startsWith('flight.')) {
      return 2; // FLIGHT
    }
    
    // RC channel
    if (typeof value === 'string' && value.startsWith('rc[')) {
      return 1; // RC_CHANNEL
    }
    
    // Default to value
    return 0;
  }
  
  /**
   * Extract array index from string like "gvar[0]"
   */
  extractArrayIndex(str) {
    const match = str.match(/\[(\d+)\]/);
    return match ? parseInt(match[1]) : 0;
  }
  
  /**
   * Add logic condition in INAV CLI format
   */
  addLogicCondition(activator, operation, operandAType, operandAValue, operandBType = 0, operandBValue = 0) {
    const enabled = 1;
    const flags = 0;
    
    const cmd = `logic ${this.lcIndex} ${enabled} ${activator} ${operation} ${operandAType} ${operandAValue} ${operandBType} ${operandBValue} ${flags}`;
    
    this.logicConditions.push(cmd);
    this.lcIndex++;
  }
  
  /**
   * Process expression (function call, etc.)
   */
  processExpression(expression, activator) {
    // Handle function calls like override methods
    if (expression.type === 'CallExpression') {
      // Could handle pid[0].configure() here
    }
  }
}

module.exports = { INAVCodeGenerator };