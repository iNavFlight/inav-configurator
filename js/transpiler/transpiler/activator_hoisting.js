/**
 * INAV Activator Hoisting Module
 *
 * Location: js/transpiler/transpiler/activator_hoisting.js
 *
 * Identifies LCs with activators that should be hoisted to variables.
 * LCs with activators that are referenced as operands are extracted to const declarations
 * so the activator relationship is preserved and the code is more readable.
 */

'use strict';

import { OPERATION } from './inav_constants.js';

/**
 * Manages hoisted variable identification for the decompiler
 */
export class ActivatorHoistingManager {
  /**
   * @param {Object} context - Decompiler context
   * @param {Function} context.isActionOperation - Function to check if operation is an action
   */
  constructor(context) {
    this.isActionOperation = context.isActionOperation;

    // Maps LC index -> variable name for hoisted vars
    this.hoistedActivatorVars = new Map();
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
   * @param {Map} referenceCount - Map of LC index -> reference count
   * @param {Object} variableMap - Optional variable map with custom names
   * @param {Object} decompiler - Decompiler instance for generating expressions
   * @returns {Map} Map of LC index -> variable name
   */
  identifyHoistedVars(conditions, referencedAsOperand, referenceCount, variableMap = null, decompiler = null) {
    this.hoistedActivatorVars.clear();
    let condVarCount = 1;

    for (const lc of conditions) {
      if (lc._gap) continue;

      // Skip actions, sticky, and timer operations
      if (this.isActionOperation(lc.operation) ||
          lc.operation === OPERATION.STICKY ||
          lc.operation === OPERATION.TIMER) {
        continue;
      }

      // Hoist if:
      // 1. Referenced multiple times (worth deduplicating), OR
      // 2. Complex operation (worth naming for clarity)
      // Don't hoist simple single-use values - they're clearer inline
      const refCount = referenceCount.get(lc.index) || 0;
      const isReferenced = referencedAsOperand.has(lc.index);
      const isMultiplyReferenced = refCount > 1;
      const isComplex = this.isComplexOperation(lc.operation);

      if (isReferenced && (isMultiplyReferenced || isComplex)) {
        // Determine scope: find first STICKY/TIMER in activator chain
        // If found, variable should be hoisted to that sticky's if-block
        // If not found, hoist to global scope
        const scopeLcIndex = this.findStickyInActivatorChain(lc.index, conditions);

        // Always generate cond1, cond2, etc.
        // Custom names from variable map will be applied later via rename pass
        const varName = `cond${condVarCount++}`;
        this.hoistedActivatorVars.set(lc.index, { varName, scopeLcIndex });
      }
    }

    return this.hoistedActivatorVars;
  }

  /**
   * Check if an operation is complex enough to warrant hoisting
   * Simple operations (direct value access, simple comparisons) don't benefit from hoisting
   * Complex operations (math, multi-step calculations) should be hoisted for readability
   * @param {number} operation - INAV operation code
   * @returns {boolean} True if complex operation worth hoisting
   */
  isComplexOperation(operation) {
    // Complex operations worth hoisting for readability:
    // - Arithmetic: ADD, SUB, MUL, DIV, MOD
    // - Math functions: MIN, MAX, ABS
    // - Logic: AND, OR, XOR, NAND, NOR, NOT
    // - Stateful: EDGE (transitions), STICKY/TIMER (if referenced as operands)
    const complexOps = [
      OPERATION.ADD,         // 14
      OPERATION.SUB,         // 15
      OPERATION.MUL,         // 16
      OPERATION.DIV,         // 17
      OPERATION.MIN,         // 43
      OPERATION.MAX,         // 44
      OPERATION.ABS,         // 46
      OPERATION.AND,         // 7
      OPERATION.OR,          // 8
      OPERATION.XOR,         // 9
      OPERATION.NAND,        // 10
      OPERATION.NOR,         // 11
      OPERATION.NOT,         // 12
      OPERATION.MOD,         // 19
      OPERATION.EDGE,        // 47 - stateful, activator relationship important
    ];

    return complexOps.includes(operation);
  }

  /**
   * Find the first STICKY/TIMER in an LC's activator chain
   * This determines the scope where the variable should be hoisted
   * @param {number} lcIndex - LC index to check
   * @param {Array} conditions - All conditions
   * @returns {number} LC index of the STICKY/TIMER scope, or -1 for global scope
   */
  findStickyInActivatorChain(lcIndex, conditions, visited = new Set()) {
    if (visited.has(lcIndex)) return -1;
    visited.add(lcIndex);

    const lc = conditions.find(c => c.index === lcIndex);
    if (!lc || lc.activatorId === -1) return -1;

    const activator = conditions.find(c => c.index === lc.activatorId);
    if (!activator) return -1;

    // If activator is STICKY/TIMER, that's our scope
    if (activator.operation === OPERATION.STICKY || activator.operation === OPERATION.TIMER) {
      return activator.index;
    }

    // Otherwise, recurse up the chain
    return this.findStickyInActivatorChain(activator.index, conditions, visited);
  }

  /**
   * Check if an LC index has a hoisted variable
   * @param {number} lcIndex - LC index to check
   * @returns {string|null} Variable name or null
   */
  getHoistedVarName(lcIndex) {
    const entry = this.hoistedActivatorVars.get(lcIndex);
    return entry ? entry.varName : null;
  }

  /**
   * Get hoisted variables that belong to a specific scope
   * @param {number} scopeLcIndex - Scope LC index (-1 for global)
   * @returns {Array} Array of {lcIndex, varName} for variables in this scope
   */
  getHoistedVarsInScope(scopeLcIndex) {
    const result = [];
    for (const [lcIndex, entry] of this.hoistedActivatorVars.entries()) {
      if (entry.scopeLcIndex === scopeLcIndex) {
        result.push({ lcIndex, varName: entry.varName });
      }
    }
    // Sort by LC index to maintain dependencies
    return result.sort((a, b) => a.lcIndex - b.lcIndex);
  }
}
