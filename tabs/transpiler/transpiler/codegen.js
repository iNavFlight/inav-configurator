/**
 * INAV Code Generator
 * 
 * Location: tabs/programming/transpiler/transpiler/codegen.js
 * 
 * Generates INAV logic condition CLI commands from AST.
 * Supports if statements, edge(), sticky(), delay(), and on.* handlers.
 */

'use strict';

const {
  OPERAND_TYPE,
  OPERATION,
  getOperationName
} = require('./inav_constants.js');
const apiDefinitions = require('./../api/definitions/index.js');

/**
 * INAV Code Generator
 * Converts AST to INAV logic condition commands
 */
class INAVCodeGenerator {
  constructor() {
    this.lcIndex = 0; // Current logic condition index
    this.commands = [];
    this.operandMapping = this.buildOperandMapping(apiDefinitions);
  }
  
  /**
   * Build operand mapping from API definitions
   */
  buildOperandMapping(definitions) {
    const mapping = {};
    
    for (const [objName, objDef] of Object.entries(definitions)) {
      if (!objDef || typeof objDef !== 'object') continue;
      
      for (const [propName, propDef] of Object.entries(objDef)) {
        if (!propDef || typeof propDef !== 'object') continue;
        
        // Direct property
        if (propDef.inavOperand) {
          const path = `${objName}.${propName}`;
          mapping[path] = propDef.inavOperand;
        }
        
        // Nested object
        if (propDef.type === 'object' && propDef.properties) {
          for (const [nestedName, nestedDef] of Object.entries(propDef.properties)) {
            if (nestedDef && nestedDef.inavOperand) {
              const path = `${objName}.${propName}.${nestedName}`;
              mapping[path] = nestedDef.inavOperand;
            }
          }
        }
        
        // Operation mapping for writable properties
        if (propDef.inavOperation) {
          const path = `${objName}.${propName}`;
          if (!mapping[path]) mapping[path] = {};
          mapping[path].operation = propDef.inavOperation;
        }
      }
    }
    
    return mapping;
  }
  
  /**
   * Generate INAV CLI commands from AST
   * @param {Object} ast - Abstract syntax tree
   * @returns {string[]} Array of CLI commands
   */
  generate(ast) {
    this.lcIndex = 0;
    this.commands = [];
    
    if (!ast || !ast.statements) {
      throw new Error('Invalid AST');
    }
    
    for (const stmt of ast.statements) {
      this.generateStatement(stmt);
    }
    
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
      case 'Destructuring':
        // Ignore - just used for parser
        break;
      default:
        console.warn(`Unknown statement type: ${stmt.type}`);
    }
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
    } else {
      // Default: treat as conditional
      this.generateConditional(stmt);
    }
  }
  
  /**
   * Generate on.arm handler
   */
  generateOnArm(stmt) {
    const delay = stmt.config.delay || 0;
    const delayMs = delay * 1000; // Convert to milliseconds
    
    // Create activator: armTimer > delayMs
    const activatorId = this.lcIndex;
    this.commands.push(
      `logic ${this.lcIndex} 1 -1 ${OPERATION.GREATER_THAN} ${OPERAND_TYPE.FLIGHT} 0 ${OPERAND_TYPE.VALUE} ${delayMs} 0`
    );
    this.lcIndex++;
    
    // Generate body actions
    for (const action of stmt.body) {
      this.generateAction(action, activatorId);
    }
  }
  
  /**
   * Generate on.always handler
   */
  generateOnAlways(stmt) {
    // Create activator: always true
    const activatorId = this.lcIndex;
    this.commands.push(
      `logic ${this.lcIndex} 1 -1 ${OPERATION.TRUE} ${OPERAND_TYPE.VALUE} 0 ${OPERAND_TYPE.VALUE} 0 0`
    );
    this.lcIndex++;
    
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
    
    // Generate condition logic condition
    const conditionId = this.lcIndex;
    this.generateCondition(stmt.condition, -1);
    
    // Generate body actions
    for (const action of stmt.body) {
      this.generateAction(action, conditionId);
    }
  }
  
  /**
   * Generate edge handler
   */
  generateEdge(stmt) {
    // Edge detection requires:
    // 1. Condition LC
    // 2. Timer check
    // 3. Action
    
    const conditionId = this.lcIndex;
    this.generateCondition(stmt.condition, -1);
    
    // TODO: Implement edge with duration
    // For now, simple edge without debounce
    for (const action of stmt.body) {
      this.generateAction(action, conditionId);
    }
  }
  
  /**
   * Generate sticky handler
   */
  generateSticky(stmt) {
    // Sticky requires:
    // 1. On condition LC
    // 2. Off condition LC
    // 3. State variable (gvar)
    // 4. Action
    
    // TODO: Implement sticky pattern
    // For now, treat as simple conditional
    const conditionId = this.lcIndex;
    this.generateCondition(stmt.onCondition, -1);
    
    for (const action of stmt.body) {
      this.generateAction(action, conditionId);
    }
  }
  
  /**
   * Generate delay handler
   */
  generateDelay(stmt) {
    // Delay requires:
    // 1. Condition LC
    // 2. Timer check
    // 3. Action
    
    // TODO: Implement delay pattern
    // For now, treat as simple conditional
    const conditionId = this.lcIndex;
    this.generateCondition(stmt.condition, -1);
    
    for (const action of stmt.body) {
      this.generateAction(action, conditionId);
    }
  }
  
  /**
   * Generate condition logic condition
   */
  generateCondition(condition, activatorId) {
    if (!condition) return this.lcIndex;
    
    const startIndex = this.lcIndex;
    
    switch (condition.type) {
      case 'BinaryExpression': {
        const left = this.getOperand(condition.left);
        const right = this.getOperand(condition.right);
        const op = this.getOperation(condition.operator);
        
        this.commands.push(
          `logic ${this.lcIndex} 1 ${activatorId} ${op} ${left.type} ${left.value} ${right.type} ${right.value} 0`
        );
        this.lcIndex++;
        break;
      }
      
      case 'LogicalExpression': {
        // Generate left condition
        const leftId = this.lcIndex;
        this.generateCondition(condition.left, activatorId);
        
        // Generate right condition
        const rightId = this.lcIndex;
        this.generateCondition(condition.right, activatorId);
        
        // Combine with logical operator
        const op = condition.operator === '&&' ? OPERATION.AND : OPERATION.OR;
        this.commands.push(
          `logic ${this.lcIndex} 1 ${activatorId} ${op} ${OPERAND_TYPE.GET_LC_VALUE} ${leftId} ${OPERAND_TYPE.GET_LC_VALUE} ${rightId} 0`
        );
        this.lcIndex++;
        break;
      }
      
      case 'UnaryExpression': {
        // Generate argument
        const argId = this.lcIndex;
        this.generateCondition(condition.argument, activatorId);
        
        // Apply NOT
        this.commands.push(
          `logic ${this.lcIndex} 1 ${activatorId} ${OPERATION.NOT} ${OPERAND_TYPE.GET_LC_VALUE} ${argId} ${OPERAND_TYPE.VALUE} 0 0`
        );
        this.lcIndex++;
        break;
      }
      
      case 'MemberExpression': {
        // Boolean property access (e.g., flight.mode.failsafe)
        const operand = this.getOperand(condition.value);
        
        // Check if true
        this.commands.push(
          `logic ${this.lcIndex} 1 ${activatorId} ${OPERATION.EQUAL} ${operand.type} ${operand.value} ${OPERAND_TYPE.VALUE} 1 0`
        );
        this.lcIndex++;
        break;
      }
      
      case 'Literal': {
        // Literal true/false
        if (condition.value === true) {
          this.commands.push(
            `logic ${this.lcIndex} 1 ${activatorId} ${OPERATION.TRUE} ${OPERAND_TYPE.VALUE} 0 ${OPERAND_TYPE.VALUE} 0 0`
          );
        } else {
          this.commands.push(
            `logic ${this.lcIndex} 1 ${activatorId} ${OPERATION.NOT} ${OPERAND_TYPE.VALUE} 1 ${OPERAND_TYPE.VALUE} 0 0`
          );
        }
        this.lcIndex++;
        break;
      }
      
      default:
        console.warn(`Unknown condition type: ${condition.type}`);
    }
    
    return startIndex;
  }
  
  /**
   * Generate action logic condition
   */
  generateAction(action, activatorId) {
    if (!action || action.type !== 'Assignment') return;
    
    const target = action.target;
    const value = action.value;
    
    // Handle gvar assignment
    if (target.startsWith('gvar[')) {
      const index = parseInt(target.match(/\d+/)[0]);
      
      if (action.operation) {
        // Arithmetic: gvar[0] = gvar[0] + 10
        const left = this.getOperand(action.left);
        const right = this.getOperand(action.right);
        const op = this.getArithmeticOperation(action.operation);
        
        // First compute the result
        const resultId = this.lcIndex;
        this.commands.push(
          `logic ${this.lcIndex} 1 ${activatorId} ${op} ${left.type} ${left.value} ${right.type} ${right.value} 0`
        );
        this.lcIndex++;
        
        // Then assign to gvar
        this.commands.push(
          `logic ${this.lcIndex} 1 ${activatorId} ${OPERATION.SET_GVAR} ${OPERAND_TYPE.GVAR} ${index} ${OPERAND_TYPE.GET_LC_VALUE} ${resultId} 0`
        );
        this.lcIndex++;
      } else {
        // Simple assignment: gvar[0] = 100
        const valueOperand = this.getOperand(value);
        this.commands.push(
          `logic ${this.lcIndex} 1 ${activatorId} ${OPERATION.SET_GVAR} ${OPERAND_TYPE.GVAR} ${index} ${valueOperand.type} ${valueOperand.value} 0`
        );
        this.lcIndex++;
      }
      return;
    }
    
    // Handle override operations
    if (target.startsWith('override.')) {
      const operation = this.getOverrideOperation(target);
      const valueOperand = this.getOperand(value);
      
      this.commands.push(
        `logic ${this.lcIndex} 1 ${activatorId} ${operation} ${OPERAND_TYPE.VALUE} 0 ${valueOperand.type} ${valueOperand.value} 0`
      );
      this.lcIndex++;
      return;
    }
    
    console.warn(`Unknown assignment target: ${target}`);
  }
  
  /**
   * Get operand from value
   */
  getOperand(value) {
    if (typeof value === 'number') {
      return { type: OPERAND_TYPE.VALUE, value };
    }
    
    if (typeof value === 'boolean') {
      return { type: OPERAND_TYPE.VALUE, value: value ? 1 : 0 };
    }
    
    if (typeof value === 'string') {
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
      
      console.warn(`Unknown operand: ${value}`);
      return { type: OPERAND_TYPE.VALUE, value: 0 };
    }
    
    return { type: OPERAND_TYPE.VALUE, value: 0 };
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
      '%': OPERATION.MOD
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
      'override.vtx.power': OPERATION.OVERRIDE_VTX_POWER,
      'override.vtx.band': OPERATION.OVERRIDE_VTX_BAND,
      'override.vtx.channel': OPERATION.OVERRIDE_VTX_CHANNEL,
      'override.armSafety': OPERATION.OVERRIDE_ARM_SAFETY,
      'override.armingDisabled': OPERATION.OVERRIDE_ARMING_DISABLED
    };
    
    return operations[target] || OPERATION.SET_OVERRIDE;
  }
}

module.exports = { INAVCodeGenerator };