/**
 * INAV Action Decompiler Helper
 *
 * Location: js/transpiler/transpiler/action_decompiler.js
 *
 * Handles decompilation of actions from INAV logic conditions back to JavaScript.
 * Extracted from decompiler.js to improve modularity.
 */

'use strict';

import {
  OPERATION,
  getOperationName
} from './inav_constants.js';

/**
 * Helper class for decompiling action logic
 */
class ActionDecompiler {
  /**
   * @param {Object} context - Context object containing dependencies
   * @param {Function} context.decompileOperand - Function to decompile operands
   * @param {Function} context.getVarNameForGvar - Function to get variable name for gvar
   * @param {Function} context.addWarning - Function to add warnings
   */
  constructor(context) {
    this.decompileOperand = context.decompileOperand;
    this.getVarNameForGvar = context.getVarNameForGvar;
    this.addWarning = context.addWarning;
  }

  /**
   * Decompile an action to JavaScript statement
   * @param {Object} lc - Logic condition
   * @param {Array} allConditions - All conditions for recursive resolution
   * @returns {string} JavaScript statement
   */
  decompile(lc, allConditions = null) {
    const value = this.decompileOperand(lc.operandBType, lc.operandBValue, allConditions);

    switch (lc.operation) {
      case OPERATION.GVAR_SET:
        return this.handleGvarSet(lc, value);

      case OPERATION.GVAR_INC:
        return this.handleGvarInc(lc, value);

      case OPERATION.GVAR_DEC:
        return this.handleGvarDec(lc, value);

      case OPERATION.OVERRIDE_THROTTLE_SCALE:
        return this.handleOverrideThrottleScale(value);

      case OPERATION.OVERRIDE_THROTTLE:
        return this.handleOverrideThrottle(value);

      case OPERATION.SET_VTX_POWER_LEVEL:
        return this.handleSetVtxPowerLevel(value);

      case OPERATION.SET_VTX_BAND:
        return this.handleSetVtxBand(value);

      case OPERATION.SET_VTX_CHANNEL:
        return this.handleSetVtxChannel(value);

      case OPERATION.OVERRIDE_ARMING_SAFETY:
        return this.handleOverrideArmingSafety();

      case OPERATION.SET_OSD_LAYOUT:
        return this.handleSetOsdLayout(value);

      case OPERATION.RC_CHANNEL_OVERRIDE:
        return this.handleRcChannelOverride(lc, value);

      case OPERATION.LOITER_OVERRIDE:
        return this.handleLoiterOverride(value);

      case OPERATION.OVERRIDE_MIN_GROUND_SPEED:
        return this.handleOverrideMinGroundSpeed(value);

      case OPERATION.SWAP_ROLL_YAW:
        return this.handleSwapRollYaw();

      case OPERATION.INVERT_ROLL:
        return this.handleInvertRoll();

      case OPERATION.INVERT_PITCH:
        return this.handleInvertPitch();

      case OPERATION.INVERT_YAW:
        return this.handleInvertYaw();

      case OPERATION.SET_HEADING_TARGET:
        return this.handleSetHeadingTarget(value);

      case OPERATION.SET_PROFILE:
        return this.handleSetProfile(value);

      case OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE:
        return this.handleFlightAxisAngleOverride(lc, value);

      case OPERATION.FLIGHT_AXIS_RATE_OVERRIDE:
        return this.handleFlightAxisRateOverride(lc, value);

      case OPERATION.SET_GIMBAL_SENSITIVITY:
        return this.handleSetGimbalSensitivity(value);

      case OPERATION.LED_PIN_PWM:
        return this.handleLedPinPwm(lc, value);

      case OPERATION.PORT_SET:
        return this.handlePortSet(lc, value);

      case OPERATION.DISABLE_GPS_FIX:
        return this.handleDisableGpsFix();

      case OPERATION.RESET_MAG_CALIBRATION:
        return this.handleResetMagCalibration();

      case OPERATION.ADD:
      case OPERATION.SUB:
      case OPERATION.MUL:
      case OPERATION.DIV:
        return this.handleArithmeticOperation(lc, value, allConditions);

      default:
        this.addWarning(`Unknown operation ${lc.operation} (${getOperationName(lc.operation)}) in action`);
        return `// Unknown operation: ${getOperationName(lc.operation)}`;
    }
  }

  handleGvarSet(lc, value) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `gvar[${lc.operandAValue}]`;
    return `${targetName} = ${value};`;
  }

  handleGvarInc(lc, value) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `gvar[${lc.operandAValue}]`;
    return `${targetName} = ${targetName} + ${value};`;
  }

  handleGvarDec(lc, value) {
    const targetName = this.getVarNameForGvar(lc.operandAValue) || `gvar[${lc.operandAValue}]`;
    return `${targetName} = ${targetName} - ${value};`;
  }

  handleOverrideThrottleScale(value) {
    return `override.throttleScale = ${value};`;
  }

  handleOverrideThrottle(value) {
    return `override.throttle = ${value};`;
  }

  handleSetVtxPowerLevel(value) {
    return `override.vtx.power = ${value};`;
  }

  handleSetVtxBand(value) {
    return `override.vtx.band = ${value};`;
  }

  handleSetVtxChannel(value) {
    return `override.vtx.channel = ${value};`;
  }

  handleOverrideArmingSafety() {
    return `override.armSafety = true;`;
  }

  handleSetOsdLayout(value) {
    return `override.osdLayout = ${value};`;
  }

  handleRcChannelOverride(lc, value) {
    // operandA contains channel number (1-18)
    // Use cleaner array syntax instead of override.rcChannel()
    return `rc[${lc.operandAValue}] = ${value};`;
  }

  handleLoiterOverride(value) {
    return `override.loiterRadius = ${value};`;
  }

  handleOverrideMinGroundSpeed(value) {
    return `override.minGroundSpeed = ${value};`;
  }

  handleSwapRollYaw() {
    return `override.swapRollYaw = true;`;
  }

  handleInvertRoll() {
    return `override.invertRoll = true;`;
  }

  handleInvertPitch() {
    return `override.invertPitch = true;`;
  }

  handleInvertYaw() {
    return `override.invertYaw = true;`;
  }

  handleSetHeadingTarget(value) {
    // Value is in centidegrees
    return `override.headingTarget = ${value};`;
  }

  handleSetProfile(value) {
    return `override.profile = ${value};`;
  }

  handleFlightAxisAngleOverride(lc, value) {
    // operandA is axis (0=roll, 1=pitch, 2=yaw), operandB is angle in degrees
    const axisNames = ['roll', 'pitch', 'yaw'];
    const axisIndex = lc.operandAValue;
    const axisName = axisNames[axisIndex] || axisIndex;
    this.addWarning(`FLIGHT_AXIS_ANGLE_OVERRIDE may need verification - check API syntax`);
    return `override.flightAxis.${axisName}.angle = ${value};`;
  }

  handleFlightAxisRateOverride(lc, value) {
    // operandA is axis (0=roll, 1=pitch, 2=yaw), operandB is rate in deg/s
    const axisNames = ['roll', 'pitch', 'yaw'];
    const axisIndex = lc.operandAValue;
    const axisName = axisNames[axisIndex] || axisIndex;
    this.addWarning(`FLIGHT_AXIS_RATE_OVERRIDE may need verification - check API syntax`);
    return `override.flightAxis.${axisName}.rate = ${value};`;
  }

  handleSetGimbalSensitivity(value) {
    return `override.gimbalSensitivity = ${value};`;
  }

  handleLedPinPwm(lc, value) {
    // operandA is pin (0-7), operandB is PWM value
    this.addWarning(`LED_PIN_PWM may need verification - check API syntax`);
    return `override.ledPin(${lc.operandAValue}, ${value});`;
  }

  handlePortSet(lc, value) {
    // operandA is port (0-7), operandB is value (0 or 1)
    this.addWarning(`PORT_SET may not be available in JavaScript API`);
    return `/* override.port(${lc.operandAValue}, ${value}); */ // PORT_SET - may not be supported`;
  }

  handleDisableGpsFix() {
    return `override.disableGpsFix = true;`;
  }

  handleResetMagCalibration() {
    return `override.resetMagCalibration = true;`;
  }

  handleArithmeticOperation(lc, value, allConditions) {
    const target = this.decompileOperand(lc.operandAType, lc.operandAValue, allConditions);
    const ops = {
      [OPERATION.ADD]: '+',
      [OPERATION.SUB]: '-',
      [OPERATION.MUL]: '*',
      [OPERATION.DIV]: '/'
    };
    const op = ops[lc.operation];
    return `${target} = ${target} ${op} ${value};`;
  }
}

export { ActionDecompiler };
