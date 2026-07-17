/**
 * INAV Logic Condition Hoisting Manager
 *
 * Extracts complex or multiply-referenced expressions into named const variables
 * to improve readability and avoid redundancy in decompiled JavaScript.
 *
 * Hoisting Criteria (all must be true):
 * - Referenced as operand by other LCs
 * - Complex (arithmetic, math, logic) OR multiply-referenced (used >1 times)
 * - Not a stateful operation (STICKY, TIMER, DELAY, EDGE)
 * - Not an action (GVAR_SET, overrides, etc.)
 * - Not reading from GVARs that are written elsewhere
 *
 * GVAR Dependency Tracking:
 * Prevents hoisting expressions that read from GVARs before those GVARs are written,
 * which would cause the hoisted expression to use OLD values instead of NEW values.
 * If a GVAR is only read (never written), hoisting is safe.
 *
 * Execution Order Preservation:
 * - Hoisted variables emitted in LC index order (matches firmware evaluation order)
 * - Activator scoping: variables hoisted to global or inside stateful operation blocks
 * - LC operands always resolve correctly due to index-ordered declaration
 *
 * Example:
 *   const cond1 = Math.min(1000, gvar[5] * 100);  // Complex, referenced 2x
 *   if (trigger) { doA(cond1); }
 *   if (other) { doB(cond1); }
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
   * Find which GVARs are being written by ANY enabled LC
   * These are GVARs that could cause read-after-write dependencies if hoisted
   * @param {Array} conditions - All logic conditions
   * @returns {Set} Set of GVAR indices that are written
   */
  findWrittenGvars(conditions) {
    const writtenGvars = new Set();
    const OPERATION_GVAR_SET = 18;  // From inav_constants.js

    for (const lc of conditions) {
      if (lc._gap) continue;
      if (!lc.enabled) continue;  // Skip disabled LCs

      // Check if this is a GVAR_SET operation (regardless of activatorId)
      // Even if the write is conditional (has activator), we still need to track it
      // because hoisting a read BEFORE a conditional write breaks execution order
      if (lc.operation === OPERATION_GVAR_SET) {
        // operandAValue is the GVAR index being written
        writtenGvars.add(lc.operandAValue);
      }
    }

    return writtenGvars;
  }

  /**
   * Check if an LC reads from any GVAR that is written at root level
   * Only prevent hoisting if reading from a GVAR that is actually being set
   * @param {Object} lc - Logic condition to check
   * @param {Array} conditions - All conditions (for recursive LC operand checks)
   * @param {Set} writtenGvars - Set of GVAR indices that are written at root level
   * @param {Set} visited - Set of visited LC indices to prevent infinite recursion
   * @returns {boolean} True if this LC reads from a GVAR that is written
   */
  readsFromWrittenGvar(lc, conditions, writtenGvars, visited = new Set()) {
    if (!lc) return false;

    // Prevent infinite recursion on circular LC references
    if (visited.has(lc.index)) return false;
    visited.add(lc.index);

    const OPERAND_TYPE_GVAR = 5;  // From inav_constants.js
    const OPERAND_TYPE_LC = 4;

    // Direct GVAR read - check if it's a GVAR that's being written
    if (lc.operandAType === OPERAND_TYPE_GVAR && writtenGvars.has(lc.operandAValue)) {
      return true;
    }
    if (lc.operandBType === OPERAND_TYPE_GVAR && writtenGvars.has(lc.operandBValue)) {
      return true;
    }

    // Recursive check: if operand is another LC, check if that LC reads from written GVAR
    // This handles cases like: LC_A uses LC_B as operand, and LC_B reads from a written GVAR
    if (lc.operandAType === OPERAND_TYPE_LC) {
      const refLc = conditions.find(c => c.index === lc.operandAValue);
      if (refLc && this.readsFromWrittenGvar(refLc, conditions, writtenGvars, visited)) {
        return true;
      }
    }
    if (lc.operandBType === OPERAND_TYPE_LC) {
      const refLc = conditions.find(c => c.index === lc.operandBValue);
      if (refLc && this.readsFromWrittenGvar(refLc, conditions, writtenGvars, visited)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if an LC's activator chain contains stateful operations (STICKY/TIMER/DELAY/EDGE)
   * These need late binding and shouldn't be hoisted
   */
  activatorChainHasSticky(lcIndex, conditions, visited = new Set()) {
    if (visited.has(lcIndex)) return false;
    visited.add(lcIndex);

    const lc = conditions.find(c => c.index === lcIndex);
    if (!lc || lc.activatorId === -1) return false;

    const activator = conditions.find(c => c.index === lc.activatorId);
    if (!activator) return false;

    if (activator.operation === OPERATION.STICKY ||
        activator.operation === OPERATION.TIMER ||
        activator.operation === OPERATION.DELAY ||
        activator.operation === OPERATION.EDGE) {
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

    // First pass: identify which GVARs are being written by root-level LCs
    const writtenGvars = this.findWrittenGvars(conditions);

    for (const lc of conditions) {
      if (lc._gap) continue;

      // Skip actions and stateful operations (STICKY, TIMER, DELAY, EDGE)
      // These operations maintain state across loop iterations and should not be hoisted
      if (this.isActionOperation(lc.operation) ||
          lc.operation === OPERATION.STICKY ||
          lc.operation === OPERATION.TIMER ||
          lc.operation === OPERATION.DELAY ||
          lc.operation === OPERATION.EDGE) {
        continue;
      }

      // Skip LCs that read from GVARs that are written by root-level LCs
      // Hoisting these would cause them to use OLD GVAR values instead of NEW values.
      // But if a GVAR is only READ (never written), hoisting is safe.
      if (this.readsFromWrittenGvar(lc, conditions, writtenGvars)) {
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
    // Note: EDGE, STICKY, TIMER, DELAY are stateful and excluded separately in identifyHoistedVars()
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
    ];

    return complexOps.includes(operation);
  }

  /**
   * Find the first stateful operation (STICKY/TIMER/DELAY/EDGE) in an LC's activator chain
   * This determines the scope where the variable should be hoisted
   * @param {number} lcIndex - LC index to check
   * @param {Array} conditions - All conditions
   * @returns {number} LC index of the stateful operation scope, or -1 for global scope
   */
  findStickyInActivatorChain(lcIndex, conditions, visited = new Set()) {
    if (visited.has(lcIndex)) return -1;
    visited.add(lcIndex);

    const lc = conditions.find(c => c.index === lcIndex);
    if (!lc || lc.activatorId === -1) return -1;

    const activator = conditions.find(c => c.index === lc.activatorId);
    if (!activator) return -1;

    // If activator is stateful (STICKY/TIMER/DELAY/EDGE), that's our scope
    if (activator.operation === OPERATION.STICKY ||
        activator.operation === OPERATION.TIMER ||
        activator.operation === OPERATION.DELAY ||
        activator.operation === OPERATION.EDGE) {
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
