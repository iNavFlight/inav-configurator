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
   */
  constructor(context) {
    this.pushLogicCommand = context.pushLogicCommand;
    this.getOperand = context.getOperand;
    this.getArithmeticOperation = context.getArithmeticOperation;
    this.getOverrideOperation = context.getOverrideOperation;
    this.errorHandler = context.errorHandler;
    this.variableHandler = context.variableHandler;
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

    // Handle gvar assignment
    if (target.startsWith('gvar[')) {
      this.generateGvarAssignment(action, activatorId);
      return;
    }

    // Handle RC channel assignment: rc[5] = 1500
    if (target.startsWith('rc[')) {
      this.generateRcAssignment(target, value, activatorId);
      return;
    }

    // Handle override operations
    if (target.startsWith('override.')) {
      this.generateOverride(target, value, activatorId);
      return;
    }

    // Handle variable assignment (var variables resolve to gvar[N])
    if (this.variableHandler && this.variableHandler.isVariable(target)) {
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
    const target = action.target;
    const value = action.value;
    const index = parseInt(target.match(/\d+/)[0]);

    if (action.operation) {
      // Arithmetic: gvar[0] = gvar[0] + 10
      const left = this.getOperand(action.left);
      const right = this.getOperand(action.right);

      // Optimize gvar[n] = gvar[n] +/- value to use GVAR_INC/GVAR_DEC
      const isLeftSameGvar = left.type === OPERAND_TYPE.GVAR && left.value === index;
      const isRightSameGvar = right.type === OPERAND_TYPE.GVAR && right.value === index;

      if (action.operation === '+' && isLeftSameGvar) {
        // gvar[n] = gvar[n] + value → GVAR_INC
        this.pushLogicCommand(OPERATION.GVAR_INC,
          { type: OPERAND_TYPE.VALUE, value: index },
          right,
          activatorId
        );
        return;
      }

      if (action.operation === '-' && isLeftSameGvar) {
        // gvar[n] = gvar[n] - value → GVAR_DEC
        this.pushLogicCommand(OPERATION.GVAR_DEC,
          { type: OPERAND_TYPE.VALUE, value: index },
          right,
          activatorId
        );
        return;
      }

      if (action.operation === '+' && isRightSameGvar) {
        // gvar[n] = value + gvar[n] → GVAR_INC (addition is commutative)
        this.pushLogicCommand(OPERATION.GVAR_INC,
          { type: OPERAND_TYPE.VALUE, value: index },
          left,
          activatorId
        );
        return;
      }

      // Fall back to compute + set for other operations
      const op = this.getArithmeticOperation(action.operation);

      // First compute the result
      const resultId = this.pushLogicCommand(op, left, right, activatorId);

      // Then assign to gvar
      this.pushLogicCommand(OPERATION.GVAR_SET,
        { type: OPERAND_TYPE.VALUE, value: index },
        { type: OPERAND_TYPE.LC, value: resultId },
        activatorId
      );
    } else {
      // Simple assignment: gvar[0] = 100
      const valueOperand = this.getOperand(value);
      this.pushLogicCommand(OPERATION.GVAR_SET,
        { type: OPERAND_TYPE.VALUE, value: index },
        valueOperand,
        activatorId
      );
    }
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

    this.pushLogicCommand(operation,
      valueOperand,
      { type: 0, value: 0 },
      activatorId
    );
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
