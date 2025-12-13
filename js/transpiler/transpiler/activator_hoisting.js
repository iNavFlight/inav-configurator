/**
 * INAV Activator Hoisting Module
 *
 * Location: js/transpiler/transpiler/activator_hoisting.js
 *
 * Handles hoisting of LCs with activators to variables for cleaner decompiler output.
 * LCs with activators that are referenced as operands are extracted to const declarations
 * so the activator relationship is preserved and the code is more readable.
 */

'use strict';

import { OPERATION, OPERAND_TYPE } from './inav_constants.js';

/**
 * Manages hoisted variable identification and emission for the decompiler
 */
export class ActivatorHoistingManager {
  /**
   * @param {Object} context - Decompiler context
   * @param {Function} context.decompileCondition - Function to decompile a condition
   * @param {Function} context.decompileOperand - Function to decompile an operand
   * @param {Function} context.isActionOperation - Function to check if operation is an action
   * @param {Set} context.usedFeatures - Set to track used features for imports
   */
  constructor(context) {
    this.decompileCondition = context.decompileCondition;
    this.decompileOperand = context.decompileOperand;
    this.isActionOperation = context.isActionOperation;
    this.usedFeatures = context.usedFeatures;

    // Maps LC index -> variable name for hoisted vars
    this.hoistedActivatorVars = new Map();
    // Tracks which hoisted vars have been emitted
    this.emittedHoistedVars = new Set();
    // Tracks which hoisted vars were referenced (for lazy emission)
    this.referencedHoistedVars = new Set();
    // Reference to conditions array (set during identification)
    this.conditions = null;
    // Tracks processed LC indices
    this.processed = null;
  }

  /**
   * Check if an LC's activator chain contains STICKY/TIMER operations
   * These need late binding and shouldn't be hoisted
   */
  activatorChainHasSticky(lcIndex, conditions, visited = new Set()) {
    if (visited.has(lcIndex)) return false;
    visited.add(lcIndex);

    const lc = conditions.find(c => c.index === lcIndex);
    if (!lc || lc.activatorId === -1) return false;

    const activator = conditions.find(c => c.index === lc.activatorId);
    if (!activator) return false;

    if (activator.operation === OPERATION.STICKY || activator.operation === OPERATION.TIMER) {
      return true;
    }

    return this.activatorChainHasSticky(activator.index, conditions, visited);
  }

  /**
   * Identify which LCs should be hoisted to variables
   * @param {Array} conditions - All logic conditions
   * @param {Set} referencedAsOperand - Set of LC indices referenced as operands
   * @returns {Map} Map of LC index -> variable name
   */
  identifyHoistedVars(conditions, referencedAsOperand) {
    this.hoistedActivatorVars.clear();
    let condVarCount = 1;

    for (const lc of conditions) {
      if (lc._gap) continue;

      // Only hoist if: has activator, referenced as operand, not an action, not sticky/timer
      if (lc.activatorId !== -1 &&
          referencedAsOperand.has(lc.index) &&
          !this.isActionOperation(lc.operation) &&
          lc.operation !== OPERATION.STICKY &&
          lc.operation !== OPERATION.TIMER) {
        // Don't hoist if activator chain contains STICKY/TIMER - those need late binding
        if (this.activatorChainHasSticky(lc.index, conditions)) {
          continue;
        }
        const varName = `cond${condVarCount++}`;
        this.hoistedActivatorVars.set(lc.index, varName);
      }
    }

    return this.hoistedActivatorVars;
  }

  /**
   * Initialize for lazy emission during tree processing
   * @param {Array} conditions - All logic conditions
   * @param {Set} processed - Set of processed LC indices
   */
  initLazyEmission(conditions, processed) {
    this.conditions = conditions;
    this.processed = processed;
    this.emittedHoistedVars.clear();
    this.referencedHoistedVars.clear();
  }

  /**
   * Track that a hoisted var was referenced (called from decompileOperand)
   * @param {string} varName - The variable name that was referenced
   */
  trackReference(varName) {
    this.referencedHoistedVars.add(varName);
  }

  /**
   * Clear referenced vars before processing a new tree
   */
  clearReferences() {
    this.referencedHoistedVars.clear();
  }

  /**
   * Check if an LC index has a hoisted variable
   * @param {number} lcIndex - LC index to check
   * @returns {string|null} Variable name or null
   */
  getHoistedVarName(lcIndex) {
    return this.hoistedActivatorVars.get(lcIndex) || null;
  }

  /**
   * Emit a single hoisted var and its dependencies (recursively)
   * @param {string} varName - Variable name to emit
   * @param {Array} pending - Array to push declarations to
   */
  emitHoistedVar(varName, pending) {
    if (this.emittedHoistedVars.has(varName)) return;

    // Find the LC index for this var name
    let lcIndex = null;
    for (const [idx, name] of this.hoistedActivatorVars) {
      if (name === varName) { lcIndex = idx; break; }
    }
    if (lcIndex === null) return;

    const lc = this.conditions.find(c => c.index === lcIndex);
    if (!lc) return;

    // Mark as emitted FIRST to prevent infinite recursion
    this.emittedHoistedVars.add(varName);

    // Track usedFeatures for edge/delay since ConditionDecompiler doesn't have access
    if (lc.operation === OPERATION.EDGE) this.usedFeatures.add('edge');
    if (lc.operation === OPERATION.DELAY) this.usedFeatures.add('delay');

    // Clear and track what this var's expression references
    const prevReferenced = new Set(this.referencedHoistedVars);
    this.referencedHoistedVars.clear();

    // Compute the underlying expression (this may reference other hoisted vars)
    const innerExpr = this.decompileCondition(lc, this.conditions);
    const activatorExpr = this.decompileOperand(OPERAND_TYPE.LC, lc.activatorId, this.conditions, new Set());

    // Emit any dependencies first (recursively)
    for (const depVarName of this.referencedHoistedVars) {
      this.emitHoistedVar(depVarName, pending);
    }

    // Now emit this var
    pending.push(`const ${varName} = ${activatorExpr} ? (${innerExpr}) : 0;`);
    this.processed.add(lcIndex);

    // Restore previous referenced set
    this.referencedHoistedVars = prevReferenced;
  }

  /**
   * Emit any pending hoisted vars that were referenced but not yet emitted
   * @returns {Array} Array of declaration strings
   */
  emitPendingHoistedVars() {
    const pending = [];
    // Copy the set since emitHoistedVar may modify it
    const toEmit = new Set(this.referencedHoistedVars);
    for (const varName of toEmit) {
      this.emitHoistedVar(varName, pending);
    }
    return pending;
  }
}
