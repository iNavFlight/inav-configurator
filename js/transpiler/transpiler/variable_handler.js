/**
 * Variable Handler for INAV Transpiler
 * Manages let/var declarations, symbol table, and gvar allocation
 *
 * Location: js/transpiler/transpiler/variable_handler.js
 */

'use strict';

/**
 * Handles JavaScript variable declarations (let/var) for INAV transpiler
 *
 * Responsibilities:
 * - Track variable declarations in symbol table
 * - Detect explicitly used gvar slots
 * - Allocate gvar slots for 'var' variables
 * - Resolve variable references during codegen
 * - Validate variable usage (reassignment, redeclaration)
 */
class VariableHandler {
  constructor() {
    this.symbols = new Map();           // varName -> SymbolInfo
    this.usedGvars = new Set();         // Explicitly used gvar slots (0-7)
    this.gvarAllocations = new Map();   // varName -> gvar index
    this.letVariableLCIndices = new Map(); // varName -> LC index (for let/const variables)
    this.errors = [];                   // Collected errors
  }

  // ========================================
  // PARSER SUPPORT
  // ========================================

  /**
   * Extract variable declaration from AST node
   * Returns transformed node for simplified AST
   *
   * @param {Object} node - Acorn VariableDeclaration node
   * @returns {Object|null} Simplified declaration node or null
   */
  extractVariableDeclaration(node) {
    if (node.type !== 'VariableDeclaration') return null;

    const kind = node.kind;  // 'let', 'const', or 'var'
    const decl = node.declarations[0];

    if (!decl || !decl.id || decl.id.type !== 'Identifier') {
      return null;
    }

    const name = decl.id.name;
    const initExpr = decl.init;  // Can be null for 'var x;'

    // Treat 'const' as 'let' (both are immutable/substituted)
    const declType = (kind === 'let' || kind === 'const') ? 'LetDeclaration' : 'VarDeclaration';

    return {
      type: declType,
      name,
      initExpr,      // Store the full expression AST (not just value!)
      loc: node.loc,
      range: node.range
    };
  }

  // ========================================
  // ANALYZER SUPPORT
  // ========================================

  /**
   * Add 'let' variable to symbol table
   * Stores the expression AST for substitution
   *
   * @param {string} name - Variable name
   * @param {Object} initExpr - Expression AST
   * @param {Object} loc - Source location
   */
  addLetVariable(name, initExpr, loc) {
    // Check for redeclaration
    if (this.symbols.has(name)) {
      this.errors.push({
        message: `Variable '${name}' is already declared`,
        line: loc ? loc.start.line : 0,
        code: 'redeclaration'
      });
      return;
    }

    // Store expression AST (not evaluated value!)
    this.symbols.set(name, {
      name,
      kind: 'let',
      expressionAST: initExpr,  // Full AST: BinaryExpression, MemberExpression, etc.
      gvarIndex: null,          // Not used for 'let'
      loc
    });
  }

  /**
   * Track LC index for a let/const variable (called during code generation)
   * This allows the decompiler to preserve custom variable names
   *
   * @param {string} name - Variable name
   * @param {number} lcIndex - The LC index generated for this variable
   */
  setLetVariableLCIndex(name, lcIndex) {
    if (this.symbols.has(name) && this.symbols.get(name).kind === 'let') {
      this.letVariableLCIndices.set(name, lcIndex);
    }
  }

  /**
   * Add 'var' variable to symbol table (placeholder for now)
   * Gvar allocation happens later after detecting used slots
   *
   * @param {string} name - Variable name
   * @param {Object} initExpr - Initial value expression AST (can be null)
   * @param {Object} loc - Source location
   */
  addVarVariable(name, initExpr, loc) {
    // Check for redeclaration
    if (this.symbols.has(name)) {
      this.errors.push({
        message: `Variable '${name}' is already declared`,
        line: loc ? loc.start.line : 0,
        code: 'redeclaration'
      });
      return;
    }

    // Store placeholder - gvar allocation happens in allocateGvarSlots()
    this.symbols.set(name, {
      name,
      kind: 'var',
      expressionAST: initExpr,  // Initial value (can be expression)
      gvarIndex: null,          // Allocated later
      loc
    });
  }

  /**
   * Add 'latch' variable to symbol table (for sticky/timer state)
   * These don't use gvar slots - they reference LC indices
   *
   * @param {string} name - Variable name (e.g., 'latch1')
   * @param {Object} loc - Source location
   */
  addLatchVariable(name, loc) {
    // Check for redeclaration
    if (this.symbols.has(name)) {
      this.errors.push({
        message: `Variable '${name}' is already declared`,
        line: loc ? loc.start.line : 0,
        code: 'redeclaration'
      });
      return;
    }

    // Store as latch type - LC index assigned by codegen
    this.symbols.set(name, {
      name,
      kind: 'latch',
      lcIndex: null,  // Assigned by codegen when sticky LC is generated
      loc
    });
  }

  /**
   * Detect which gvar slots are explicitly used by user code
   * Scans AST for gvar[N] references
   *
   * @param {Object} ast - Simplified AST from parser
   */
  detectUsedGvars(ast) {
    this.usedGvars.clear();

    // Recursive walker
    const walk = (node) => {
      if (!node) return;

      // Check for gvar[N] or inav.gvar[N] in assignment targets
      if (node.type === 'Assignment' && node.target) {
        const match = node.target.match(/^(?:inav\.)?gvar\[(\d+)\]$/);
        if (match) {
          this.usedGvars.add(parseInt(match[1]));
        }

        // Check value side too
        if (typeof node.value === 'string') {
          const valueMatch = node.value.match(/^(?:inav\.)?gvar\[(\d+)\]$/);
          if (valueMatch) {
            this.usedGvars.add(parseInt(valueMatch[1]));
          }
        }

        // Check arithmetic operands
        if (node.left && typeof node.left === 'string') {
          const leftMatch = node.left.match(/^(?:inav\.)?gvar\[(\d+)\]$/);
          if (leftMatch) {
            this.usedGvars.add(parseInt(leftMatch[1]));
          }
        }

        if (node.right && typeof node.right === 'string') {
          const rightMatch = node.right.match(/^(?:inav\.)?gvar\[(\d+)\]$/);
          if (rightMatch) {
            this.usedGvars.add(parseInt(rightMatch[1]));
          }
        }
      }

      // Check conditions
      if (node.condition) {
        this.findGvarInExpression(node.condition);
      }

      // Walk arrays
      if (Array.isArray(node)) {
        node.forEach(walk);
      }
      // Walk object properties
      else if (typeof node === 'object') {
        // Walk body
        if (node.body) {
          walk(node.body);
        }
        // Walk statements
        if (node.statements) {
          walk(node.statements);
        }
      }
    };

    walk(ast);
  }

  /**
   * Find gvar references in expressions recursively
   * Helper for detectUsedGvars
   *
   * @param {Object} expr - Expression AST node
   */
  findGvarInExpression(expr) {
    if (!expr) return;

    // String check
    if (typeof expr === 'string') {
      const match = expr.match(/^(?:inav\.)?gvar\[(\d+)\]$/);
      if (match) {
        this.usedGvars.add(parseInt(match[1]));
      }
      return;
    }

    // Object check
    if (typeof expr === 'object') {
      // Binary/logical expressions
      if (expr.left) this.findGvarInExpression(expr.left);
      if (expr.right) this.findGvarInExpression(expr.right);

      // Unary expressions
      if (expr.argument) this.findGvarInExpression(expr.argument);

      // Member expressions
      if (expr.value) this.findGvarInExpression(expr.value);
    }
  }

  /**
   * Allocate gvar slots for 'var' declarations
   * Strategy: High-to-low (gvar[7] down to gvar[0])
   */
  allocateGvarSlots() {
    // Find available slots (not explicitly used)
    const availableSlots = [];
    for (let i = 7; i >= 0; i--) {
      if (!this.usedGvars.has(i)) {
        availableSlots.push(i);
      }
    }

    // Allocate slots for each 'var' variable
    for (const [name, symbol] of this.symbols) {
      if (symbol.kind === 'var') {
        if (availableSlots.length === 0) {
          const explicitCount = this.usedGvars.size;
          const varCount = Array.from(this.symbols.values())
            .filter(s => s.kind === 'var').length;

          this.errors.push({
            message: `Cannot allocate gvar for variable '${name}'. ` +
                     `All 8 gvar slots in use (${explicitCount} explicit + ${varCount} variables). ` +
                     `Suggestion: Use 'let' for constants to avoid gvar allocation.`,
            line: symbol.loc ? symbol.loc.start.line : 0,
            code: 'gvar_exhaustion'
          });
          return;
        }

        const slot = availableSlots.shift();
        symbol.gvarIndex = slot;
        this.gvarAllocations.set(name, slot);
        this.usedGvars.add(slot);  // Mark as used
      }
    }
  }

  /**
   * Check if identifier is an assignment to 'let' variable (error)
   *
   * @param {string} target - Assignment target identifier
   * @param {Object} loc - Source location
   * @returns {boolean} True if error (is let reassignment)
   */
  checkLetReassignment(target, loc) {
    const symbol = this.symbols.get(target);
    if (symbol && symbol.kind === 'let') {
      this.errors.push({
        message: `Cannot reassign 'let' variable '${target}'. Use 'var' for mutable variables.`,
        line: loc ? loc.start.line : 0,
        code: 'let_reassignment'
      });
      return true;
    }
    return false;
  }

  /**
   * Get errors collected during analysis
   * @returns {Array} Array of error objects
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors = [];
  }

  // ========================================
  // CODEGEN SUPPORT
  // ========================================

  /**
   * Resolve variable reference for codegen
   * Returns: expression AST for 'let', "gvar[N]" string for 'var', null if not found
   *
   * @param {string} varName - Variable name to resolve
   * @returns {Object|null} Resolution result or null
   */
  resolveVariable(varName) {
    const symbol = this.symbols.get(varName);
    if (!symbol) return null;

    if (symbol.kind === 'let') {
      // Return the stored expression AST for inline substitution
      return {
        type: 'let_expression',
        ast: symbol.expressionAST
      };
    } else if (symbol.kind === 'var') {
      // Return gvar reference string
      if (symbol.gvarIndex === null) {
        throw new Error(`Internal error: 'var' variable '${varName}' has no gvar allocation`);
      }
      return {
        type: 'var_gvar',
        gvarRef: `gvar[${symbol.gvarIndex}]`
      };
    }

    return null;
  }

  /**
   * Get all 'var' declarations that need initialization
   * Returns array of { name, gvarIndex, initExpr }
   *
   * @returns {Array} Array of var initialization info
   */
  getVarInitializations() {
    const inits = [];

    for (const [name, symbol] of this.symbols) {
      if (symbol.kind === 'var' && symbol.expressionAST !== null) {
        inits.push({
          name,
          gvarIndex: symbol.gvarIndex,
          initExpr: symbol.expressionAST
        });
      }
    }

    return inits;
  }

  /**
   * Check if identifier is a variable (not API property)
   *
   * @param {string} identifier - Identifier to check
   * @returns {boolean} True if it's a variable
   */
  isVariable(identifier) {
    return this.symbols.has(identifier);
  }

  /**
   * Get symbol info for debugging/error messages
   *
   * @param {string} name - Variable name
   * @returns {Object|undefined} Symbol info or undefined
   */
  getSymbol(name) {
    return this.symbols.get(name);
  }

  /**
   * Alias for getSymbol (for clarity in analyzer)
   */
  getVariable(name) {
    return this.symbols.get(name);
  }

  /**
   * Convert a 'var' variable to 'latch' type
   * Used when a pre-declared var is later assigned via sticky()
   *
   * @param {string} name - Variable name
   */
  convertToLatch(name) {
    const symbol = this.symbols.get(name);
    if (symbol) {
      symbol.kind = 'latch';
      symbol.lcIndex = null;  // Will be assigned by codegen
    }
  }

  /**
   * Get allocation summary for debugging
   *
   * @returns {Object} Summary of variable allocations
   */
  getAllocationSummary() {
    return {
      letCount: Array.from(this.symbols.values()).filter(s => s.kind === 'let').length,
      varCount: Array.from(this.symbols.values()).filter(s => s.kind === 'var').length,
      usedGvars: Array.from(this.usedGvars).sort(),
      allocatedGvars: Array.from(this.gvarAllocations.entries())
    };
  }
}

export { VariableHandler };
