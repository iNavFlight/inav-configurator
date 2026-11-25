/**
 * INAV Action Generator Helper
 *
 * Location: js/transpiler/transpiler/action_generator.js
 *
 * Handles generation of action logic (assignments to gvar, rc channels, overrides).
 * Extracted from codegen.js to improve modularity.
 */

'use strict';

import { OPERATION, OPERAND_TYPE } from './inav_constants.js';

/**
 * Helper class for generating action logic
 */
class ActionGenerator {
  /**
   * @param {Object} context - Context object containing dependencies
   * @param {Function} context.pushLogicCommand - Function to push logic commands
   * @param {Function} context.getOperand - Function to get operand from value
   * @param {Function} context.getArithmeticOperation - Function to get arithmetic operation
   * @param {Function} context.getOverrideOperation - Function to get override operation
   * @param {Object} context.errorHandler - Error handler instance
   * @param {Object} context.variableHandler - Variable handler instance
   * @param {Object} context.conditionGenerator - Condition generator for CSE cache invalidation
   */
  constructor(context) {
    this.pushLogicCommand = context.pushLogicCommand;
    this.getOperand = context.getOperand;
    this.getArithmeticOperation = context.getArithmeticOperation;
    this.getOverrideOperation = context.getOverrideOperation;
    this.errorHandler = context.errorHandler;
    this.variableHandler = context.variableHandler;
    this.conditionGenerator = context.conditionGenerator;
  }

  /**
   * Generate action logic condition
   * @param {Object} action - Action AST node
   * @param {number} activatorId - Activator LC index
   */
  generate(action, activatorId) {
    if (!action || action.type !== 'Assignment') return;

    const target = action.target;
    const value = action.value;

    // Normalize target (strip 'inav.' prefix if present for internal checks)
    const normalizedTarget = target.startsWith('inav.') ? target.substring(5) : target;

    // Handle gvar assignment (with or without inav. prefix)
    if (normalizedTarget.startsWith('gvar[')) {
      this.generateGvarAssignment(action, activatorId);
      return;
    }

    // Handle RC channel assignment: rc[5] = 1500 (with or without inav. prefix)
    if (normalizedTarget.startsWith('rc[')) {
      this.generateRcAssignment(target, value, activatorId);
      return;
    }

    // Handle override operations (expects inav.override. prefix)
    if (target.startsWith('inav.override.') || normalizedTarget.startsWith('override.')) {
      this.generateOverride(target, value, activatorId);
      return;
    }

    // Handle variable assignment (var variables resolve to gvar[N])
    if (this.variableHandler && this.variableHandler.isVariable(normalizedTarget)) {
      this.generateVariableAssignment(action, activatorId);
      return;
    }

    this.errorHandler.addError(
      `Cannot assign to '${target}'. Only gvar[0-7], rc[1-18], and override.* are writable`,
      null,
      'invalid_assignment_target'
    );
  }

  /**
   * Generate gvar assignment (direct gvar[N] = value)
   * @private
   */
  generateGvarAssignment(action, activatorId) {
    const gvar = this.resolveGvarTarget(action.target);
    if (!gvar) return;

    // Invalidate CSE cache for expressions referencing this gvar.
    // After gvar[N] is mutated, a cached condition like "gvar[N] < 2" must be re-evaluated.
    // A dynamic index may hit any gvar, so invalidate them all.
    if (this.conditionGenerator) {
      const keys = gvar.isLiteral ? [gvar.key] : Array.from({ length: 8 }, (_, i) => `gvar[${i}]`);
      keys.forEach(key => this.conditionGenerator.invalidateCacheForVariable(key));
    }

    if (action.operation) {
      this.generateGvarArithmetic(action, gvar, activatorId);
    } else {
      // Simple assignment: gvar[0] = 100
      this.pushLogicCommand(OPERATION.GVAR_SET, gvar.indexOperand, this.getOperand(action.value), activatorId);
    }
  }

  /**
   * Resolve the index of a gvar assignment target. A write may index with any operand
   * (firmware evaluates operandA of GVAR_SET), e.g. gvar[rc[1]] = 0. Reads (gvar[N] as an
   * operand) only take a literal index.
   * @returns {{isLiteral: boolean, index: number|null, indexOperand: Object, key: string}|null}
   * @private
   */
  resolveGvarTarget(target) {
    const match = target.match(/^(?:inav\.)?gvar\[(.+)\]$/);
    if (!match) {
      this.errorHandler.addError(`Invalid gvar assignment target '${target}'`, null, 'invalid_gvar');
      return null;
    }
    const isLiteral = /^\d+$/.test(match[1]);
    const indexOperand = isLiteral
      ? { type: OPERAND_TYPE.VALUE, value: parseInt(match[1], 10) }
      : this.getOperand(match[1]);
    return { isLiteral, index: isLiteral ? indexOperand.value : null, indexOperand, key: `gvar[${match[1]}]` };
  }

  /**
   * gvar[i] = a op b. gvar[i] = gvar[i] +/- v becomes GVAR_INC/GVAR_DEC. With a dynamic index
   * the self-read cannot be compiled as an operand (reads need a literal index), so it is
   * recognised textually and is only valid in that INC/DEC form.
   * @private
   */
  generateGvarArithmetic(action, gvar, activatorId) {
    const isDynamicSelfRead = (v) => !gvar.isLiteral && typeof v === 'string' && v.replace(/^inav\./, '') === gvar.key;
    const left = isDynamicSelfRead(action.left) ? null : this.getOperand(action.left);
    const right = isDynamicSelfRead(action.right) ? null : this.getOperand(action.right);
    const isSelf = (operand, node) => gvar.isLiteral
      ? operand.type === OPERAND_TYPE.GVAR && operand.value === gvar.index
      : isDynamicSelfRead(node);
    const leftIsSelf = isSelf(left, action.left);
    const rightIsSelf = isSelf(right, action.right);
    const op = action.operation;

    if (op === '+' && leftIsSelf && right) return this.pushGvarIncDec(OPERATION.GVAR_INC, gvar, right, activatorId);
    if (op === '-' && leftIsSelf && right) return this.pushGvarIncDec(OPERATION.GVAR_DEC, gvar, right, activatorId);
    if (op === '+' && rightIsSelf && left) return this.pushGvarIncDec(OPERATION.GVAR_INC, gvar, left, activatorId);

    if (!left || !right) {
      this.errorHandler.addError(
        `Cannot read '${action.target}' here: a gvar read needs a literal index. Only gvar[i] = gvar[i] + x or - x is supported with a dynamic index.`,
        null,
        'invalid_gvar'
      );
      return;
    }

    // Fall back to compute + set for other operations
    const resultId = this.pushLogicCommand(this.getArithmeticOperation(op), left, right, activatorId);
    this.pushLogicCommand(OPERATION.GVAR_SET, gvar.indexOperand, { type: OPERAND_TYPE.LC, value: resultId }, activatorId);
  }

  /** @private */
  pushGvarIncDec(operation, gvar, amount, activatorId) {
    this.pushLogicCommand(operation, gvar.indexOperand, amount, activatorId);
  }

  /**
   * Generate RC channel assignment (rc[N] = value)
   * Uses 1-based indexing to match INAV firmware (rc[1] through rc[18])
   * @private
   */
  generateRcAssignment(target, value, activatorId) {
    // Match rc[N] or rc[N].value
    const channelMatch = target.match(/rc\[(\d+)\](?:\.value)?/);
    if (!channelMatch) {
      this.errorHandler.addError(
        `Invalid RC channel syntax: '${target}'. Expected format: rc[1] through rc[18]`,
        null,
        'invalid_rc_syntax'
      );
      return;
    }

    const channel = parseInt(channelMatch[1]);

    // Validate channel range (1-based: 1-18)
    if (channel < 1 || channel > 18) {
      this.errorHandler.addError(
        `RC channel ${channel} out of range. INAV supports rc[1] through rc[18]`,
        null,
        'rc_out_of_range'
      );
      return;
    }

    const valueOperand = this.getOperand(value);

    // Generate RC_CHANNEL_OVERRIDE operation (38)
    // operandA = channel number (1-based), operandB = value
    this.pushLogicCommand(OPERATION.RC_CHANNEL_OVERRIDE,
      { type: OPERAND_TYPE.VALUE, value: channel },
      valueOperand,
      activatorId
    );
  }

  /**
   * Generate override operation (override.throttle, override.vtx.power, etc.)
   * @private
   */
  generateOverride(target, value, activatorId) {
    const operation = this.getOverrideOperation(target);
    const valueOperand = this.getOperand(value);

    // Normalize target (strip 'inav.' prefix if present for consistent matching)
    const normalizedTarget = target.startsWith('inav.') ? target.substring(5) : target;

    // Check for flight axis overrides which need axis in operandA
    const flightAxisMatch = normalizedTarget.match(/^override\.flightAxis\.(roll|pitch|yaw)\.(angle|rate)$/);
    if (flightAxisMatch) {
      const axisMap = { 'roll': 0, 'pitch': 1, 'yaw': 2 };
      const axisIndex = axisMap[flightAxisMatch[1]];

      this.pushLogicCommand(operation,
        { type: 0, value: axisIndex },  // operandA = axis index
        valueOperand,                    // operandB = angle/rate value
        activatorId
      );
    } else {
      // Standard INAV pattern: operandA = value, operandB = 0 (matches firmware)
      this.pushLogicCommand(operation,
        valueOperand,
        { type: 0, value: 0 },
        activatorId
      );
    }
  }

  /**
   * Generate variable assignment (var variable resolves to gvar[N])
   * @private
   */
  generateVariableAssignment(action, activatorId) {
    const target = action.target;
    const value = action.value;
    const resolution = this.variableHandler.resolveVariable(target);

    if (resolution && resolution.type === 'var_gvar') {
      // Resolve to gvar[N] and generate gvar assignment
      const gvarRef = resolution.gvarRef;
      const index = parseInt(gvarRef.match(/\d+/)[0]);

      // Invalidate CSE cache for expressions referencing this gvar
      if (this.conditionGenerator) {
        this.conditionGenerator.invalidateCacheForVariable(gvarRef);
      }

      if (action.operation) {
        // Arithmetic operation
        const left = this.getOperand(action.left);
        const right = this.getOperand(action.right);

        const op = action.operation === '+' ? OPERATION.ADD :
                   action.operation === '-' ? OPERATION.SUB :
                   action.operation === '*' ? OPERATION.MUL :
                   action.operation === '/' ? OPERATION.DIV : null;

        if (!op) {
          this.errorHandler.addError(`Unsupported operation: ${action.operation}`, null, 'unsupported_operation');
          return;
        }

        const resultId = this.pushLogicCommand(op, left, right, activatorId);

        this.pushLogicCommand(OPERATION.GVAR_SET,
          { type: OPERAND_TYPE.VALUE, value: index },
          { type: OPERAND_TYPE.LC, value: resultId },
          activatorId
        );
      } else {
        // Simple assignment
        const valueOperand = this.getOperand(value);
        this.pushLogicCommand(OPERATION.GVAR_SET,
          { type: OPERAND_TYPE.VALUE, value: index },
          valueOperand,
          activatorId
        );
      }
    }
  }
}

export { ActionGenerator };
