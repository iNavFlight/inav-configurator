/**
 * INAV Logic Condition Optimizer
 *
 * Location: tabs/programming/transpiler/transpiler/optimizer.js
 *
 * Optimizes the AST to reduce the number of logic conditions needed.
 * Key optimizations:
 * 1. Common Subexpression Elimination (CSE)
 * 2. Dead Code Elimination
 * 3. Constant Folding
 * 4. GVAR Inlining
 * 5. Boolean Simplification
 */

'use strict';

class Optimizer {
  constructor() {
    this.stats = {
      cseEliminated: 0,
      deadCodeRemoved: 0,
      constantsFolded: 0,
      gvarsInlined: 0,
      booleansSimplified: 0
    };
  }

  /**
   * Optimize analyzed AST
   * @param {Object} ast - Analyzed AST
   * @returns {Object} Optimized AST
   */
  optimize(ast) {
    this.stats = {
      cseEliminated: 0,
      deadCodeRemoved: 0,
      constantsFolded: 0,
      gvarsInlined: 0,
      booleansSimplified: 0
    };

    // Multiple optimization passes
    let changed = true;
    let passes = 0;
    const maxPasses = 5;

    while (changed && passes < maxPasses) {
      const before = JSON.stringify(ast);

      // Phase 1: Simplifications
      ast = this.foldConstants(ast);
      ast = this.simplifyBooleans(ast);
      ast = this.eliminateDeadCode(ast);

      // Phase 2: Inlining
      // Needs a local decorator
      // ast = this.inlineSimpleGVARs(ast);

      const after = JSON.stringify(ast);
      changed = (before !== after);
      passes++;
    }

    // Phase 3: CSE (MUST run last to avoid broken references)
    // CSE adds metadata that points to statement objects,
    // so it must run after all optimizations that create new statement objects
    ast = this.eliminateCommonSubexpressions(ast);

    return ast;
  }

  /**
   * Common Subexpression Elimination
   * Find duplicate conditions and reuse them
   * Also detects inverted conditions (condition vs !condition)
   *
   * IMPORTANT: CSE must be invalidated when variables used in conditions are mutated.
   * For example, if `gvar[1] < 2` is cached and then `gvar[1]++` is executed,
   * subsequent `gvar[1] < 2` checks must NOT reuse the cached condition.
   *
   * The order matters:
   * 1. Process the statement's condition (potentially reuse from cache)
   * 2. Add to statements list
   * 3. AFTER processing the statement, invalidate cache for any variables
   *    that were mutated in the statement's body
   *
   * This ensures the first `if (gvar[1] < 2)` can be cached, but after its
   * body executes `gvar[1]++`, the cache is invalidated so subsequent
   * `if (gvar[1] < 2)` checks get a fresh evaluation.
   */
  eliminateCommonSubexpressions(ast) {
    const conditionMap = new Map(); // condition string -> first statement
    const invertedMap = new Map(); // base condition string -> inverted statement
    const statements = [];

    for (const statement of ast.statements) {
      // Step 1: Process condition (may reuse from cache or add to cache)
      if (statement.type === 'EventHandler' && statement.condition) {
        const condition = statement.condition;

        // Check if this is an inverted condition
        const isInverted = condition.type === 'UnaryExpression' && condition.operator === '!';
        const baseCondition = isInverted ? condition.argument : condition;
        const baseKey = this.getConditionKey(baseCondition);
        const fullKey = this.getConditionKey(condition);

        // Check if we've seen the exact same condition before
        if (conditionMap.has(fullKey)) {
          const existingStatement = conditionMap.get(fullKey);
          statement.reuseCondition = existingStatement;
          this.stats.cseEliminated++;
        }
        // Check if we've seen the base condition (for inverted conditions)
        else if (isInverted && conditionMap.has(baseKey)) {
          const existingStatement = conditionMap.get(baseKey);
          statement.reuseCondition = existingStatement;
          statement.invertReuse = true; // Mark that we're inverting the reused condition
          this.stats.cseEliminated++;
        }
        // Check if we've seen the inverted version (for non-inverted conditions)
        else if (!isInverted && invertedMap.has(baseKey)) {
          const existingStatement = invertedMap.get(baseKey);
          statement.reuseCondition = existingStatement;
          statement.invertReuse = true; // Mark that we need to invert the reused condition
          this.stats.cseEliminated++;
        }
        else {
          // First time seeing this condition
          conditionMap.set(fullKey, statement);

          // Also track base condition for inverted matching
          if (isInverted) {
            invertedMap.set(baseKey, statement);
          }
        }
      }

      // Step 2: Add statement to output list
      statements.push(statement);

      // Step 3: AFTER processing this statement, check if its body mutates
      // any variables and invalidate cached conditions that reference them.
      // This ensures subsequent statements don't incorrectly reuse conditions
      // that depend on values that have been modified.
      if (statement.type === 'EventHandler' && statement.body) {
        const mutatedVars = this.findMutatedVariables(statement.body);
        for (const varName of mutatedVars) {
          this.invalidateCacheForVariable(conditionMap, invertedMap, varName);
        }
      }
    }

    return { ...ast, statements };
  }

  /**
   * Find all variables that are mutated (assigned to) in a statement body
   * @param {Array} body - Array of body statements
   * @returns {Set<string>} Set of mutated variable names (e.g., 'gvar[1]')
   */
  findMutatedVariables(body) {
    const mutated = new Set();

    for (const stmt of body) {
      if (stmt.type === 'Assignment' && stmt.target) {
        // Direct gvar assignment: gvar[0] = ... or gvar[0]++
        if (stmt.target.startsWith('gvar[')) {
          mutated.add(stmt.target);
        }
        // Variable assignment that might resolve to gvar
        // For now, we're conservative and track the target
        mutated.add(stmt.target);
      }

      // Recursively check nested event handlers
      if (stmt.type === 'EventHandler' && stmt.body) {
        for (const varName of this.findMutatedVariables(stmt.body)) {
          mutated.add(varName);
        }
      }
    }

    return mutated;
  }

  /**
   * Invalidate cache entries that reference a specific variable
   * @param {Map} conditionMap - Map of condition keys to statements
   * @param {Map} invertedMap - Map of inverted condition keys to statements
   * @param {string} varName - Variable name to invalidate (e.g., 'gvar[1]')
   */
  invalidateCacheForVariable(conditionMap, invertedMap, varName) {
    // Find keys that reference this variable and delete them
    for (const [key, _] of conditionMap.entries()) {
      if (this.conditionKeyReferencesVariable(key, varName)) {
        conditionMap.delete(key);
      }
    }

    for (const [key, _] of invertedMap.entries()) {
      if (this.conditionKeyReferencesVariable(key, varName)) {
        invertedMap.delete(key);
      }
    }
  }

  /**
   * Check if a condition key references a specific variable
   * @param {string} key - Condition key (from getConditionKey)
   * @param {string} varName - Variable name (e.g., 'gvar[1]')
   * @returns {boolean} True if the key references the variable
   */
  conditionKeyReferencesVariable(key, varName) {
    // For gvar[N], the key contains "mem:gvar[N]" for MemberExpression nodes
    if (key.includes(`mem:${varName}`)) {
      return true;
    }

    // Also check for direct string inclusion (handles various key formats)
    if (key.includes(varName)) {
      return true;
    }

    return false;
  }

  /**
   * Generate a unique key for a condition
   * Uses prefixed format to prevent key collisions between different node types
   */
  getConditionKey(condition) {
    // Handle primitives and null
    if (condition === null || condition === undefined) {
      return 'null';
    }
    if (typeof condition === 'number' || typeof condition === 'boolean') {
      return `lit:${JSON.stringify(condition)}`;
    }
    if (typeof condition === 'string') {
      return `str:${condition}`;
    }

    // Handle AST nodes with type-prefixed keys
    switch (condition.type) {
      case 'BinaryExpression': {
        const left = this.getConditionKey(condition.left);
        const right = this.getConditionKey(condition.right);
        return `bin:${condition.operator}(${left},${right})`;
      }
      case 'LogicalExpression': {
        const left = this.getConditionKey(condition.left);
        const right = this.getConditionKey(condition.right);
        return `log:${condition.operator}(${left},${right})`;
      }
      case 'UnaryExpression': {
        const arg = this.getConditionKey(condition.argument);
        return `un:${condition.operator}(${arg})`;
      }
      case 'MemberExpression':
        return `mem:${condition.value}`;
      case 'Identifier':
        return `id:${condition.name || condition.value}`;
      case 'Literal':
        return `lit:${JSON.stringify(condition.value)}`;
      case 'CallExpression': {
        const callee = condition.callee?.name || 'unknown';
        const args = (condition.arguments || []).map(a => this.getConditionKey(a)).join(',');
        return `call:${callee}(${args})`;
      }
      default:
        return `other:${JSON.stringify(condition)}`;
    }
  }

  /**
   * Dead Code Elimination
   * Remove unreachable or always-false conditions
   */
  eliminateDeadCode(ast) {
    const statements = [];

    for (const statement of ast.statements) {
      // Remove handlers with always-false conditions
      if (statement.type === 'EventHandler' && statement.condition) {
        if (this.isAlwaysFalse(statement.condition)) {
          this.stats.deadCodeRemoved++;
          continue; // Skip this statement
        }

        // Simplify always-true conditions
        if (this.isAlwaysTrue(statement.condition)) {
          statement.condition = null; // Remove condition (always executes)
          this.stats.deadCodeRemoved++;
        }
      }

      // Remove empty event handlers ONLY if they have no useful condition
      // Handlers with args (edge/sticky/delay/timer/whenChanged) are not removed here
      // Handlers with a condition but empty body are "readable" conditions that
      // other logic can reference - these must be preserved for round-trip capability
      if (statement.type === 'EventHandler' && statement.body && statement.body.length === 0) {
        // Only remove if there's no condition (truly dead code)
        // Keep if there's a condition (readable logic condition)
        if (!statement.condition) {
          this.stats.deadCodeRemoved++;
          continue;
        }
        // Has condition but empty body - this is a readable condition, keep it
      }

      statements.push(statement);
    }

    return { ...ast, statements };
  }

  /**
   * Check if condition is always true
   */
  isAlwaysTrue(condition) {
    if (condition.type === 'BinaryExpression') {
      // Check for things like: 1 === 1, 100 > 50
      if (typeof condition.left === 'number' && typeof condition.right === 'number') {
        switch (condition.operator) {
          case '>': return condition.left > condition.right;
          case '<': return condition.left < condition.right;
          case '===': return condition.left === condition.right;
          case '==': return condition.left == condition.right;
          case '>=': return condition.left >= condition.right;
          case '<=': return condition.left <= condition.right;
        }
      }
    }

    if (condition.value === 'true' || condition.value === true) {
      return true;
    }

    // Handle numeric truthiness (non-zero numbers are truthy)
    if (condition.type === 'Literal' && typeof condition.value === 'number') {
      return condition.value !== 0;
    }

    return false;
  }

  /**
   * Check if condition is always false
   */
  isAlwaysFalse(condition) {
    if (condition.type === 'BinaryExpression') {
      if (typeof condition.left === 'number' && typeof condition.right === 'number') {
        switch (condition.operator) {
          case '>': return !(condition.left > condition.right);
          case '<': return !(condition.left < condition.right);
          case '===': return !(condition.left === condition.right);
          case '==': return !(condition.left == condition.right);
          case '>=': return !(condition.left >= condition.right);
          case '<=': return !(condition.left <= condition.right);
        }
      }
    }

    if (condition.value === 'false' || condition.value === false) {
      return true;
    }

    // Handle numeric falsiness (0 is falsy)
    if (condition.type === 'Literal' && typeof condition.value === 'number') {
      return condition.value === 0;
    }

    return false;
  }

  /**
   * Constant Folding
   * Evaluate constant expressions at compile time
   */
  foldConstants(ast) {
    const statements = ast.statements.map(statement => {
      if (statement.type === 'Assignment' && statement.operation) {
        // Check if both operands are constants
        if (typeof statement.left === 'number' && typeof statement.right === 'number') {
          const result = this.evaluateOperation(
            statement.operation,
            statement.left,
            statement.right
          );

          if (result !== null) {
            this.stats.constantsFolded++;
            return {
              ...statement,
              value: result,
              operation: null // Mark as constant
            };
          }
        }
      }

      return statement;
    });

    return { ...ast, statements };
  }

  /**
   * Evaluate arithmetic operation
   */
  evaluateOperation(op, left, right) {
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? Math.floor(left / right) : null;
      case '%': return right !== 0 ? left % right : null;
      default: return null;
    }
  }

  /**
   * Inline Simple GVARs
   * If a GVAR is set once and used once, inline it
   */
  inlineSimpleGVARs(ast) {
    // Track GVAR usage
    const gvarSets = new Map(); // gvar index -> value
    const gvarUses = new Map(); // gvar index -> count

    // First pass: count sets and uses
    for (const statement of ast.statements) {
      if (statement.type === 'EventHandler') {
        for (const bodyStmt of statement.body) {
          if (bodyStmt.type === 'Assignment') {
            // GVAR set
            if (bodyStmt.target.startsWith('gvar[')) {
              const index = this.extractGVARIndex(bodyStmt.target);
              if (!gvarSets.has(index)) {
                gvarSets.set(index, bodyStmt.value);
              } else {
                gvarSets.set(index, null); // Multiple sets, don't inline
              }
            }

            // GVAR use
            if (typeof bodyStmt.value === 'string' && bodyStmt.value.startsWith('gvar[')) {
              const index = this.extractGVARIndex(bodyStmt.value);
              gvarUses.set(index, (gvarUses.get(index) || 0) + 1);
            }
          }
        }
      }
    }

    // Second pass: inline if set once and used once
    const inlineMap = new Map();
    for (const [index, value] of gvarSets.entries()) {
      if (value !== null && gvarUses.get(index) === 1) {
        inlineMap.set(index, value);
        this.stats.gvarsInlined++;
      }
    }

    // Third pass: apply inlining
    const statements = ast.statements.map(statement => {
      if (statement.type === 'EventHandler') {
        const body = statement.body.filter(bodyStmt => {
          // Remove GVAR set if it's being inlined
          if (bodyStmt.type === 'Assignment' && bodyStmt.target.startsWith('gvar[')) {
            const index = this.extractGVARIndex(bodyStmt.target);
            if (inlineMap.has(index)) {
              return false; // Remove this statement
            }
          }
          return true;
        }).map(bodyStmt => {
          // Replace GVAR use with value
          if (bodyStmt.type === 'Assignment' &&
              typeof bodyStmt.value === 'string' &&
              bodyStmt.value.startsWith('gvar[')) {
            const index = this.extractGVARIndex(bodyStmt.value);
            if (inlineMap.has(index)) {
              return {
                ...bodyStmt,
                value: inlineMap.get(index)
              };
            }
          }
          return bodyStmt;
        });

        return { ...statement, body };
      }
      return statement;
    });

    return { ...ast, statements };
  }

  /**
   * Extract GVAR index from string like "gvar[0]"
   */
  extractGVARIndex(str) {
    const match = str.match(/gvar\[(\d+)\]/);
    return match ? parseInt(match[1]) : -1;
  }

  /**
   * Boolean Simplification
   * Simplify boolean expressions
   */
  simplifyBooleans(ast) {
    const statements = ast.statements.map(statement => {
      if (statement.type === 'EventHandler' && statement.condition) {
        const simplified = this.simplifyCondition(statement.condition);
        if (simplified !== statement.condition) {
          this.stats.booleansSimplified++;
          // Preserve CSE metadata when creating new statement object
          const newStmt = { ...statement, condition: simplified };
          if (statement.reuseCondition) {
            newStmt.reuseCondition = statement.reuseCondition;
          }
          if (statement.invertReuse) {
            newStmt.invertReuse = statement.invertReuse;
          }
          if (statement.conditionLcIndex !== undefined) {
            newStmt.conditionLcIndex = statement.conditionLcIndex;
          }
          return newStmt;
        }
      }
      return statement;
    });

    return { ...ast, statements };
  }

  /**
   * Simplify a condition
   */
  simplifyCondition(condition) {
    if (condition.type === 'LogicalExpression') {
      // Simplify: a && true -> a
      if (condition.operator === '&&') {
        if (this.isAlwaysTrue(condition.right)) {
          return condition.left;
        }
        if (this.isAlwaysTrue(condition.left)) {
          return condition.right;
        }
        // a && false -> false
        if (this.isAlwaysFalse(condition.right) || this.isAlwaysFalse(condition.left)) {
          return { type: 'MemberExpression', value: 'false' };
        }
      }

      // Simplify: a || true -> true
      if (condition.operator === '||') {
        if (this.isAlwaysTrue(condition.right) || this.isAlwaysTrue(condition.left)) {
          return { type: 'MemberExpression', value: 'true' };
        }
        // a || false -> a
        if (this.isAlwaysFalse(condition.right)) {
          return condition.left;
        }
        if (this.isAlwaysFalse(condition.left)) {
          return condition.right;
        }
      }
    }

    return condition;
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    const total = Object.values(this.stats).reduce((sum, val) => sum + val, 0);

    return {
      ...this.stats,
      total,
      report: this.generateReport()
    };
  }

  /**
   * Generate optimization report
   */
  generateReport() {
    const lines = [];

    if (this.stats.cseEliminated > 0) {
      lines.push(`  - Common subexpression elimination: ${this.stats.cseEliminated} LC(s) saved`);
    }

    if (this.stats.deadCodeRemoved > 0) {
      lines.push(`  - Dead code elimination: ${this.stats.deadCodeRemoved} LC(s) saved`);
    }

    if (this.stats.constantsFolded > 0) {
      lines.push(`  - Constant folding: ${this.stats.constantsFolded} operation(s) simplified`);
    }

    if (this.stats.gvarsInlined > 0) {
      lines.push(`  - GVAR inlining: ${this.stats.gvarsInlined} LC(s) saved`);
    }

    if (this.stats.booleansSimplified > 0) {
      lines.push(`  - Boolean simplification: ${this.stats.booleansSimplified} condition(s) simplified`);
    }

    if (lines.length === 0) {
      return '  - No optimizations applied (code already optimal)';
    }

    return lines.join('\n');
  }
}

export { Optimizer };
