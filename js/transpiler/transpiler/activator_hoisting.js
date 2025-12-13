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
   * Check if an LC index has a hoisted variable
   * @param {number} lcIndex - LC index to check
   * @returns {string|null} Variable name or null
   */
  getHoistedVarName(lcIndex) {
    return this.hoistedActivatorVars.get(lcIndex) || null;
  }
}
