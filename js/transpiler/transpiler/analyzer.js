/**
 * INAV Semantic Analyzer
 * 
 * Location: tabs/programming/transpiler/transpiler/analyzer.js
 * 
 * Performs semantic analysis including:
 * - Variable scope checking
 * - Property validation
 * - Dead code detection
 * - Conflict detection
 * - Range validation
 * - Uninitialized variable detection
 */

'use strict';

import { OPERAND_TYPE, OPERATION } from './inav_constants.js';
import apiDefinitions from './../api/definitions/index.js';
import { VariableHandler } from './variable_handler.js';
import { PropertyAccessChecker } from './property_access_checker.js';
import { buildAPIStructure } from './api_mapping_utility.js';

/**
 * Semantic Analyzer for INAV JavaScript subset
 */
class SemanticAnalyzer {
  constructor() {
    // Build API structure from centralized definitions
    this.inavAPI = buildAPIStructure(apiDefinitions);

    this.gvarCount = 8;
    this.gvarRanges = { min: -1000000, max: 1000000 };
    this.headingRange = { min: 0, max: 359 };

    this.errors = [];
    this.warnings = [];
    this.variableHandler = new VariableHandler();

    // Initialize property access checker with getter for variableHandler
    // (variableHandler is recreated during analyze())
    this.propertyAccessChecker = new PropertyAccessChecker({
      inavAPI: this.inavAPI,
      getVariableHandler: () => this.variableHandler,
      addError: this.addError.bind(this),
      addWarning: this.addWarning.bind(this),
      gvarCount: this.gvarCount
    });
  }

  /**
   * Add an error to the error list
   * @param {string} message - Error message
   * @param {number} line - Line number
   */
  addError(message, line) {
    this.errors.push({ message, line });
  }

  /**
   * Add a warning to the warning list
   * @param {string} type - Warning type
   * @param {string} message - Warning message
   * @param {number} line - Line number
   */
  addWarning(type, message, line) {
    this.warnings.push({ type, message, line });
  }

  /**
   * Analyze AST and return results
   */
  analyze(ast) {
    this.errors = [];
    this.warnings = [];

    if (!ast || !ast.statements || !Array.isArray(ast.statements)) {
      throw new Error('Invalid AST structure');
    }

    // Use parser's variableHandler if provided, otherwise create fresh one
    if (ast.variableHandler) {
      this.variableHandler = ast.variableHandler;
    } else {
      this.variableHandler = new VariableHandler();
    }
    
    // Perform all analysis passes
    for (const stmt of ast.statements) {
      this.analyzeStatement(stmt);
    }

    // Process variables: detect used gvars and allocate slots
    this.variableHandler.detectUsedGvars(ast);
    this.variableHandler.allocateGvarSlots();
    this.errors.push(...this.variableHandler.getErrors());

    // Additional analysis passes
    this.checkUnsupportedFeatures(ast);
    this.detectDeadCode(ast);
    this.detectConflicts(ast);
    this.detectUninitializedGvars(ast);
    
    // Throw if there are errors
    if (this.errors.length > 0) {
      const errorMsg = 'Semantic errors:\n' + 
        this.errors.map(e => `  - ${e.message}${e.line ? ` (line ${e.line})` : ''}`).join('\n');
      throw new Error(errorMsg);
    }
    
    return {
      ast,
      warnings: this.warnings
    };
  }
  
  /**
   * Analyze a single statement
   */
  analyzeStatement(stmt) {
    if (!stmt) return;

    switch (stmt.type) {
      case 'LetDeclaration':
        this.handleLetDeclaration(stmt);
        break;
      case 'VarDeclaration':
        this.handleVarDeclaration(stmt);
        break;
      case 'StickyAssignment':
        this.handleStickyAssignment(stmt);
        break;
      case 'Assignment':
        this.checkAssignment(stmt);
        break;
      case 'EventHandler':
        this.checkEventHandler(stmt);
        break;
    }
  }

  /**
   * Handle let variable declaration
   */
  handleLetDeclaration(stmt) {
    this.variableHandler.addLetVariable(stmt.name, stmt.initExpr, stmt.loc);
  }

  /**
   * Handle var variable declaration
   */
  handleVarDeclaration(stmt) {
    this.variableHandler.addVarVariable(stmt.name, stmt.initExpr, stmt.loc);
  }

  /**
   * Handle sticky assignment (var latch1 = sticky({...}) or latch1 = sticky({...}))
   * Registers the variable as a special "latch" type so it's recognized in conditions
   */
  handleStickyAssignment(stmt) {
    // Check if variable was pre-declared (e.g., var latch1;)
    // This pattern is used by the decompiler when sticky has an activator
    const existing = this.variableHandler.getVariable(stmt.target);
    if (existing && existing.kind === 'var') {
      // Convert from 'var' to 'latch' - update existing entry
      this.variableHandler.convertToLatch(stmt.target);
      return;
    }

    // Register as a special latch variable - doesn't use gvar slots
    // The codegen will map it to an LC index
    this.variableHandler.addLatchVariable(stmt.target, stmt.loc);
  }
  
  /**
   * Check assignment statement
   */
  checkAssignment(stmt) {
    const line = stmt.loc ? stmt.loc.start.line : 0;

    // Normalize target (strip 'inav.' prefix if present)
    let normalizedTarget = stmt.target.startsWith('inav.') ? stmt.target.substring(5) : stmt.target;

    // Check for let reassignment (error)
    if (this.variableHandler.checkLetReassignment(normalizedTarget, stmt.loc)) {
      return; // Error already added by variableHandler
    }

    // Check if target is valid
    if (normalizedTarget.startsWith('gvar[')) {
      const index = this.extractGvarIndex(normalizedTarget);
      if (index === -1) {
        this.addError(`Invalid gvar syntax: ${stmt.target}`, line);
      } else if (index >= this.gvarCount) {
        this.addError(`Invalid gvar index ${index}. INAV only has gvar[0] through gvar[${this.gvarCount - 1}]`, line);
      }
    } else if (this.variableHandler.isVariable(normalizedTarget)) {
      // Variable assignment - allowed for var variables
      // (let reassignment already caught above)
    } else if (!this.isValidWritableProperty(stmt.target)) {
      // Check if it's an intermediate object and provide helpful error
      const betterError = this.getImprovedWritabilityError(stmt.target, line);
      if (betterError) {
        this.addError(betterError, line);
      } else {
        // Use original target (with inav. prefix) for writability check
        this.addError(`Cannot assign to '${stmt.target}'. Not a valid INAV writable property.`, line);
      }
    }

    // Check if value references are valid
    if (typeof stmt.value === 'string') {
      this.checkPropertyAccess(stmt.value, line);
    }
    
    // Check arithmetic operands
    if (stmt.operation) {
      this.checkPropertyAccess(stmt.left, line);
      if (typeof stmt.right === 'string') {
        this.checkPropertyAccess(stmt.right, line);
      }
    }
    
    // Range validation
    this.checkValueRanges(stmt, line);
  }
  
  /**
   * Check value ranges for assignments
   */
  checkValueRanges(stmt, line) {
    // Get the property definition to check ranges
    const propDef = this.getPropertyDefinition(stmt.target);
    
    if (propDef && propDef.range && typeof stmt.value === 'number') {
      const [min, max] = propDef.range;
      if (stmt.value < min || stmt.value > max) {
        this.addWarning('range', `Value ${stmt.value} outside valid range (${min}-${max}) for '${stmt.target}'`, line);
      }
    }
    
    // Fallback checks for legacy code
    // Check heading range
    if (stmt.target === 'override.heading' || stmt.target.includes('heading')) {
      if (typeof stmt.value === 'number') {
        if (stmt.value < this.headingRange.min || stmt.value > this.headingRange.max) {
          this.addWarning('range', `Heading value ${stmt.value} outside valid range (${this.headingRange.min}-${this.headingRange.max})`, line);
        }
      }
    }
    
    // Check gvar value ranges
    if (stmt.target.startsWith('gvar[')) {
      if (typeof stmt.value === 'number') {
        if (stmt.value < this.gvarRanges.min || stmt.value > this.gvarRanges.max) {
          this.addWarning('range', `Value ${stmt.value} may overflow gvar storage (${this.gvarRanges.min} to ${this.gvarRanges.max})`, line);
        }
      }
    }
  }
  
  /**
   * Get property definition from API definitions
   */
  getPropertyDefinition(propPath) {
    const parts = propPath.split('.');
    
    if (parts.length < 2) return null;
    
    const [obj, prop, ...rest] = parts;
    const apiDef = apiDefinitions[obj];
    
    if (!apiDef) return null;
    
    // Direct property
    if (apiDef[prop]) {
      if (rest.length === 0) {
        return apiDef[prop];
      }
      // Nested property
      if (apiDef[prop].properties && apiDef[prop].properties[rest[0]]) {
        return apiDef[prop].properties[rest[0]];
      }
    }
    
    return null;
  }
  
  /**
   * Check event handler
   */
  checkEventHandler(stmt) {
    const line = stmt.loc ? stmt.loc.start.line : 0;
    
    // Check if handler is supported (must match parser-supported helpers)
    const validHandlers = ['on.arm', 'on.always', 'ifthen', 'edge', 'sticky', 'delay', 'timer', 'whenChanged'];

    if (!validHandlers.includes(stmt.handler)) {
      this.addError(`Unknown event handler: ${stmt.handler}. Valid handlers: ${validHandlers.join(', ')}`, line);
    }
    
    // Check condition in 'ifthen' statements (if/else)
    if (stmt.condition) {
      this.checkCondition(stmt.condition, line);
    }
    
    // Check body statements
    if (stmt.body && Array.isArray(stmt.body)) {
      for (const bodyStmt of stmt.body) {
        this.analyzeStatement(bodyStmt);
      }
    }
  }
  
  /**
   * Check condition expression recursively
   */
  checkCondition(condition, line) {
    if (!condition) return;
    
    switch (condition.type) {
      case 'BinaryExpression':
        this.checkPropertyAccess(condition.left, line);
        if (typeof condition.right === 'string') {
          this.checkPropertyAccess(condition.right, line);
        }
        break;
        
      case 'MemberExpression':
        if (condition.value) {
          this.checkPropertyAccess(condition.value, line);
        }
        break;
        
      case 'LogicalExpression':
        this.checkCondition(condition.left, line);
        this.checkCondition(condition.right, line);
        break;
        
      case 'UnaryExpression':
        this.checkCondition(condition.argument, line);
        break;
        
      case 'Identifier':
        if (condition.value) {
          this.checkPropertyAccess(condition.value, line);
        }
        break;
    }
  }
  
  /**
   * Check if property access is valid
   */
  /**
   * Check property access validity
   * Delegates to PropertyAccessChecker helper class
   */
  checkPropertyAccess(propPath, line) {
    this.propertyAccessChecker.check(propPath, line);
  }
  
  /**
   * Check if property can be written to
   * Delegates to PropertyAccessChecker helper class
   */
  isValidWritableProperty(target) {
    return this.propertyAccessChecker.isValidWritableProperty(target);
  }
  
  /**
   * Extract gvar index from string
   * Delegates to PropertyAccessChecker helper class
   */
  extractGvarIndex(gvarStr) {
    return this.propertyAccessChecker.extractGvarIndex(gvarStr);
  }

  /**
   * Generate improved error message for invalid writable property assignments
   * Detects intermediate objects and suggests correct nested properties
   * @param {string} target - Property path (e.g., "inav.override.flightAxis.yaw")
   * @param {number} line - Line number for error reporting
   * @returns {string|null} Improved error message or null if no improvement available
   */
  getImprovedWritabilityError(target, line) {
    // Strip 'inav.' prefix if present
    const normalizedTarget = target.startsWith('inav.') ? target.substring(5) : target;
    const parts = normalizedTarget.split('.');

    // Only applies to override namespace for now
    if (parts[0] !== 'override') {
      return null;
    }

    // Check if trying to assign to a 3-level intermediate object
    // E.g., override.flightAxis.yaw (should be override.flightAxis.yaw.angle or .rate)
    if (parts.length === 3) {
      const overrideDef = this.getOverrideDefinition(parts[1], parts[2]);

      if (overrideDef && overrideDef.type === 'object' && overrideDef.properties) {
        const availableProps = Object.keys(overrideDef.properties);
        const suggestions = availableProps.map(p => `inav.override.${parts[1]}.${parts[2]}.${p}`).join(', ');
        return `Cannot assign to '${target}' - it's an object, not a property. Available properties: ${suggestions}`;
      }
    }

    // Check if trying to assign to a 2-level intermediate object
    // E.g., override.vtx (should be override.vtx.power, etc.)
    // or override.flightAxis (should be override.flightAxis.roll.angle, etc.)
    if (parts.length === 2) {
      const categoryDef = this.getOverrideCategoryDefinition(parts[1]);

      if (categoryDef && categoryDef.type === 'object' && categoryDef.properties) {
        const propKeys = Object.keys(categoryDef.properties);

        // Check if properties are simple (like vtx.power) or nested (like flightAxis.roll.angle)
        const firstProp = categoryDef.properties[propKeys[0]];

        if (firstProp && firstProp.type === 'object' && firstProp.properties) {
          // Deeply nested (like flightAxis.roll.angle)
          const nestedPropKeys = Object.keys(firstProp.properties);
          const suggestions = propKeys.slice(0, 2).flatMap(p => {
            const nested = categoryDef.properties[p];
            if (nested && nested.properties) {
              const nestedKeys = Object.keys(nested.properties);
              if (nestedKeys.length > 0) {
                const firstNestedProp = nestedKeys[0];
                return [`inav.override.${parts[1]}.${p}.${firstNestedProp}`];
              }
            }
            return [];
          }).join(', ');
          return `Cannot assign to '${target}' - it's an object, not a property. Examples: ${suggestions}, ...`;
        } else {
          // Simple properties (like vtx.power, vtx.band, vtx.channel)
          const suggestions = propKeys.map(p => `inav.override.${parts[1]}.${p}`).join(', ');
          return `Cannot assign to '${target}' - it's an object, not a property. Available properties: ${suggestions}`;
        }
      }
    }

    return null;
  }

  /**
   * Get override definition for a specific property
   * @private
   */
  getOverrideDefinition(category, property) {
    try {
      // Access raw API definitions, not processed structure
      const overrideDefs = apiDefinitions.override;
      if (!overrideDefs) return null;

      // For nested objects like flightAxis, check if the property itself has properties
      if (overrideDefs[category] && overrideDefs[category].properties) {
        return overrideDefs[category].properties[property];
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get override category definition
   * @private
   */
  getOverrideCategoryDefinition(category) {
    try {
      // Access raw API definitions, not processed structure
      const overrideDefs = apiDefinitions.override;
      if (!overrideDefs) return null;

      return overrideDefs[category];
    } catch (error) {
      return null;
    }
  }

  /**
   * Check for common unsupported JavaScript features
   */
  checkUnsupportedFeatures(ast) {
    for (const stmt of ast.statements) {
      this.checkStatementForUnsupported(stmt);
    }
  }

  /**
   * Recursively check statement for unsupported features
   */
  checkStatementForUnsupported(stmt) {
    if (!stmt) return;

    const line = stmt.loc ? stmt.loc.start.line : 0;

    // Check assignments for unsupported patterns
    if (stmt.type === 'Assignment') {
      // Check for template literals (crude check via backticks)
      if (typeof stmt.value === 'string' && stmt.value.includes('`')) {
        this.addWarning('unsupported', 'Template literals (backticks) are not supported. Use string concatenation with + instead.', line);
      }
    }

    // Check event handlers recursively
    if (stmt.type === 'EventHandler' && stmt.body) {
      for (const bodyStmt of stmt.body) {
        this.checkStatementForUnsupported(bodyStmt);
      }
    }
  }

  /**
   * Detect dead code (unreachable code)
   */
  detectDeadCode(ast) {
    for (const stmt of ast.statements) {
      if (stmt && stmt.type === 'EventHandler' && stmt.condition) {
        const line = stmt.loc ? stmt.loc.start.line : 0;
        
        // Check for always-false conditions
        const alwaysFalse = this.isAlwaysFalse(stmt.condition);
        if (alwaysFalse) {
          this.addWarning('dead-code', 'Unreachable code: condition is always false', line);
        }
        
        // Check for always-true conditions
        const alwaysTrue = this.isAlwaysTrue(stmt.condition);
        if (alwaysTrue) {
          this.addWarning('optimization', 'Condition is always true, consider using on.always instead', line);
        }
      }
    }
  }
  
  /**
   * Check if condition is always false
   */
  isAlwaysFalse(condition) {
    if (!condition) return false;
    
    if (condition.type === 'BinaryExpression') {
      const { operator, left, right } = condition;
      
      // Same identifier compared: x !== x
      if (operator === '!==' && left === right && typeof left === 'string') {
        return true;
      }
      
      // Literal comparisons that are always false
      if (typeof left === 'number' && typeof right === 'number') {
        switch (operator) {
          case '>': return left <= right;
          case '<': return left >= right;
          case '>=': return left < right;
          case '<=': return left > right;
          case '===': return left !== right;
          case '!==': return left === right;
        }
      }
    }
    
    if (condition.type === 'LogicalExpression') {
      if (condition.operator === '&&') {
        // Both must be true; if either is always false, result is false
        return this.isAlwaysFalse(condition.left) || this.isAlwaysFalse(condition.right);
      }
      if (condition.operator === '||') {
        // At least one must be true; if both always false, result is false
        return this.isAlwaysFalse(condition.left) && this.isAlwaysFalse(condition.right);
      }
    }
    
    if (condition.type === 'Literal') {
      return condition.value === false;
    }
    
    return false;
  }
  
  /**
   * Check if condition is always true
   */
  isAlwaysTrue(condition) {
    if (!condition) return false;
    
    if (condition.type === 'BinaryExpression') {
      const { operator, left, right } = condition;
      
      // Same identifier compared: x === x
      if (operator === '===' && left === right && typeof left === 'string') {
        return true;
      }
      
      // Literal comparisons that are always true
      if (typeof left === 'number' && typeof right === 'number') {
        switch (operator) {
          case '>': return left > right;
          case '<': return left < right;
          case '>=': return left >= right;
          case '<=': return left <= right;
          case '===': return left === right;
          case '!==': return left !== right;
        }
      }
    }
    
    if (condition.type === 'LogicalExpression') {
      if (condition.operator === '||') {
        // At least one must be true; if either is always true, result is true
        return this.isAlwaysTrue(condition.left) || this.isAlwaysTrue(condition.right);
      }
      if (condition.operator === '&&') {
        // Both must be true; if both always true, result is true
        return this.isAlwaysTrue(condition.left) && this.isAlwaysTrue(condition.right);
      }
    }
    
    if (condition.type === 'Literal') {
      return condition.value === true;
    }
    
    return false;
  }
  
  /**
   * Detect conflicting assignments
   */
  detectConflicts(ast) {
    // Track assignments by handler type and target
    const handlerAssignments = new Map();

    let stmtIndex = 0;
    for (const stmt of ast.statements) {
      if (stmt && stmt.type === 'EventHandler') {
        // Each handler gets a unique key - we want to detect multiple
        // assignments within the SAME handler, not across different handlers
        const handlerKey = `${stmt.handler}:${stmtIndex}`;

        if (!handlerAssignments.has(handlerKey)) {
          handlerAssignments.set(handlerKey, new Map());
        }

        if (stmt.body && Array.isArray(stmt.body)) {
          this.collectAssignments(stmt.body, handlerKey, handlerAssignments.get(handlerKey));
        }

        stmtIndex++;
      }
    }
    
    // Check for race conditions between on.always handlers
    const alwaysHandlers = [];
    for (const [handler, assignments] of handlerAssignments.entries()) {
      if (handler === 'on.always') {
        alwaysHandlers.push(assignments);
      }
    }
    
    if (alwaysHandlers.length > 1) {
      // Check if multiple on.always write to same variables
      const targetsSeen = new Set();
      for (const assignments of alwaysHandlers) {
        for (const target of assignments.keys()) {
          if (targetsSeen.has(target)) {
            this.addWarning('race-condition', `Multiple on.always handlers write to '${target}'. Execution order is undefined.`, 0);
          }
          targetsSeen.add(target);
        }
      }
    }
    
    // Check for multiple assignments within same handler
    for (const [handler, assignments] of handlerAssignments.entries()) {
      for (const [target, locations] of assignments.entries()) {
        if (locations.length > 1) {
          const lines = locations.map(loc => loc.line).join(', ');
          this.addWarning('conflict', `Multiple assignments to '${target}' in ${handler} (lines: ${lines}). Last assignment wins.`, locations[0].line);
        }
      }
    }
  }
  /**
   * Collect all assignments in body
   */
  collectAssignments(body, handler, assignments) {
    for (const stmt of body) {
      if (stmt && stmt.type === 'Assignment') {
        const target = stmt.target;
        const line = stmt.loc ? stmt.loc.start.line : 0;
        
        if (!assignments.has(target)) {
          assignments.set(target, []);
        }
        
        assignments.get(target).push({ handler, line });
      }
    }
  }
  
  /**
   * Detect uninitialized gvars
   */
  detectUninitializedGvars(ast) {
    const initialized = new Set();
    const used = new Set();
    
    for (const stmt of ast.statements) {
      if (stmt && stmt.type === 'EventHandler') {
        // Track which gvars are written
        if (stmt.body && Array.isArray(stmt.body)) {
          for (const bodyStmt of stmt.body) {
            if (bodyStmt && bodyStmt.type === 'Assignment') {
              if (bodyStmt.target.startsWith('gvar[')) {
                initialized.add(bodyStmt.target);
              }
              // Check if right side uses gvars
              if (typeof bodyStmt.value === 'string' && bodyStmt.value.startsWith('gvar[')) {
                used.add(bodyStmt.value);
              }
              if (bodyStmt.operation) {
                if (typeof bodyStmt.left === 'string' && bodyStmt.left.startsWith('gvar[')) {
                  used.add(bodyStmt.left);
                }
                if (typeof bodyStmt.right === 'string' && bodyStmt.right.startsWith('gvar[')) {
                  used.add(bodyStmt.right);
                }
              }
            }
          }
        }
        
        // Track which gvars are read in conditions
        if (stmt.condition) {
          this.findGvarReads(stmt.condition, used);
        }
      }
    }
    
    // Warn about gvars used but never initialized
    for (const gvar of used) {
      if (!initialized.has(gvar)) {
        this.addWarning('uninitialized', `${gvar} is used but never initialized. Will default to 0.`, 0);
      }
    }
  }
  
  /**
   * Find all gvar reads in a condition
   */
  findGvarReads(condition, used) {
    if (!condition) return;
    
    switch (condition.type) {
      case 'BinaryExpression':
        if (typeof condition.left === 'string' && condition.left.startsWith('gvar[')) {
          used.add(condition.left);
        }
        if (typeof condition.right === 'string' && condition.right.startsWith('gvar[')) {
          used.add(condition.right);
        }
        break;
        
      case 'MemberExpression':
        if (typeof condition.value === 'string' && condition.value.startsWith('gvar[')) {
          used.add(condition.value);
        }
        break;
        
      case 'LogicalExpression':
      case 'UnaryExpression':
        this.findGvarReads(condition.left, used);
        this.findGvarReads(condition.right, used);
        if (condition.argument) {
          this.findGvarReads(condition.argument, used);
        }
        break;
    }
  }
}

export { SemanticAnalyzer };
