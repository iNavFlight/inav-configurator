/**
 * INAV Logic Condition Constants
 * 
 * AUTO-GENERATED from firmware header files
 * DO NOT EDIT MANUALLY - run generate-constants.js instead
 * 
 * Source: logic_condition.h
 * Generated: 2025-11-23T15:28:03.503Z
 */

'use strict';

/**
 * Logic condition operand types
 */
const OPERAND_TYPE = {
  VALUE: 0,
  RC_CHANNEL: 1,
  FLIGHT: 2,
  FLIGHT_MODE: 3,
  LC: 4,
  GVAR: 5,
  PID: 6,
  WAYPOINTS: 7,
};

/**
 * Logic condition operations
 */
const OPERATION = {
  TRUE: 0,
  EQUAL: 1,
  GREATER_THAN: 2,
  LOWER_THAN: 3,
  LOW: 4,
  MID: 5,
  HIGH: 6,
  AND: 7,
  OR: 8,
  XOR: 9,
  NAND: 10,
  NOR: 11,
  NOT: 12,
  STICKY: 13,
  ADD: 14,
  SUB: 15,
  MUL: 16,
  DIV: 17,
  GVAR_SET: 18,
  GVAR_INC: 19,
  GVAR_DEC: 20,
  PORT_SET: 21,
  OVERRIDE_ARMING_SAFETY: 22,
  OVERRIDE_THROTTLE_SCALE: 23,
  SWAP_ROLL_YAW: 24,
  SET_VTX_POWER_LEVEL: 25,
  INVERT_ROLL: 26,
  INVERT_PITCH: 27,
  INVERT_YAW: 28,
  OVERRIDE_THROTTLE: 29,
  SET_VTX_BAND: 30,
  SET_VTX_CHANNEL: 31,
  SET_OSD_LAYOUT: 32,
  SIN: 33,
  COS: 34,
  TAN: 35,
  MAP_INPUT: 36,
  MAP_OUTPUT: 37,
  RC_CHANNEL_OVERRIDE: 38,
  SET_HEADING_TARGET: 39,
  MODULUS: 40,
  LOITER_OVERRIDE: 41,
  SET_PROFILE: 42,
  MIN: 43,
  MAX: 44,
  FLIGHT_AXIS_ANGLE_OVERRIDE: 45,
  FLIGHT_AXIS_RATE_OVERRIDE: 46,
  EDGE: 47,
  DELAY: 48,
  TIMER: 49,
  DELTA: 50,
  APPROX_EQUAL: 51,
  LED_PIN_PWM: 52,
  DISABLE_GPS_FIX: 53,
  RESET_MAG_CALIBRATION: 54,
  SET_GIMBAL_SENSITIVITY: 55,
  OVERRIDE_MIN_GROUND_SPEED: 56,
};

/**
 * Flight parameters (operand value for OPERAND_TYPE.FLIGHT)
 */
const FLIGHT_PARAM = {
  ARM_TIMER: 0,
  HOME_DISTANCE: 1,
  TRIP_DISTANCE: 2,
  RSSI: 3,
  VBAT: 4,
  CELL_VOLTAGE: 5,
  CURRENT: 6,
  MAH_DRAWN: 7,
  GPS_SATS: 8,
  GROUND_SPEED: 9,
  SPEED_3D: 10,
  AIR_SPEED: 11,
  ALTITUDE: 12,
  VERTICAL_SPEED: 13,
  THROTTLE_POS: 14,
  ROLL: 15,
  PITCH: 16,
  IS_ARMED: 17,
  IS_AUTOLAUNCH: 18,
  IS_ALTITUDE_CONTROL: 19,
  IS_POSITION_CONTROL: 20,
  IS_EMERGENCY_LANDING: 21,
  IS_RTH: 22,
  IS_LANDING: 23,
  IS_FAILSAFE: 24,
  STABILIZED_ROLL: 25,
  STABILIZED_PITCH: 26,
  STABILIZED_YAW: 27,
  HOME_DISTANCE_3D: 28,
  CRSF_LQ_UPLINK: 29,
  CRSF_SNR: 30,
  GPS_VALID: 31,
  LOITER_RADIUS: 32,
  ACTIVE_PROFILE: 33,
  BATT_CELLS: 34,
  AGL_STATUS: 35,
  AGL: 36,
  RANGEFINDER_RAW: 37,
  ACTIVE_MIXER_PROFILE: 38,
  MIXER_TRANSITION_ACTIVE: 39,
  YAW: 40,
  FW_LAND_STATE: 41,
  BATT_PROFILE: 42,
  FLOWN_LOITER_RADIUS: 43,
  CRSF_LQ_DOWNLINK: 44,
  CRSF_RSSI_DBM: 45,
  MIN_GROUND_SPEED: 46,
  HORIZONTAL_WIND_SPEED: 47,
  WIND_DIRECTION: 48,
  RELATIVE_WIND_OFFSET: 49,
};

/**
 * Flight modes (operand value for OPERAND_TYPE.FLIGHT_MODE)
 */
const FLIGHT_MODE = {
  FAILSAFE: 0,
  MANUAL: 1,
  RTH: 2,
  POSHOLD: 3,
  CRUISE: 4,
  ALTHOLD: 5,
  ANGLE: 6,
  HORIZON: 7,
  AIR: 8,
  USER1: 9,
  USER2: 10,
  COURSE_HOLD: 11,
  USER3: 12,
  USER4: 13,
  ACRO: 14,
  WAYPOINT_MISSION: 15,
  ANGLEHOLD: 16,
};

/**
 * Waypoint parameters (operand value for OPERAND_TYPE.WAYPOINTS)
 */
const WAYPOINT_PARAM = {
  IS_WP: 0,
  WAYPOINT_INDEX: 1,
  WAYPOINT_ACTION: 2,
  NEXT_WAYPOINT_ACTION: 3,
  WAYPOINT_DISTANCE: 4,
  DISTANCE_FROM_WAYPOINT: 5,
  USER1_ACTION: 6,
  USER2_ACTION: 7,
  USER3_ACTION: 8,
  USER4_ACTION: 9,
  USER1_ACTION_NEXT_WP: 10,
  USER2_ACTION_NEXT_WP: 11,
  USER3_ACTION_NEXT_WP: 12,
  USER4_ACTION_NEXT_WP: 13,
};

/**
 * RC channel configuration
 */
const RC_CHANNEL = {
  MIN_CHANNEL: 1,
  MAX_CHANNEL: 18
};

/**
 * Global variable configuration
 */
const GVAR_CONFIG = {
  COUNT: 8,
  MIN_VALUE: -1000000,
  MAX_VALUE: 1000000
};

/**
 * VTX configuration
 */
const VTX = {
  POWER: { MIN: 0, MAX: 4 },
  BAND: { MIN: 0, MAX: 5 },
  CHANNEL: { MIN: 0, MAX: 8 }
};

/**
 * Human-readable operation names
 */
const OPERATION_NAMES = {
  [0]: 'True',
  [1]: 'Equal',
  [2]: 'Greater Than',
  [3]: 'Lower Than',
  [4]: 'Low',
  [5]: 'Mid',
  [6]: 'High',
  [7]: 'And',
  [8]: 'Or',
  [9]: 'Xor',
  [10]: 'Nand',
  [11]: 'Nor',
  [12]: 'Not',
  [13]: 'Sticky',
  [14]: 'Add',
  [15]: 'Sub',
  [16]: 'Mul',
  [17]: 'Div',
  [18]: 'Gvar Set',
  [19]: 'Gvar Inc',
  [20]: 'Gvar Dec',
  [21]: 'Port Set',
  [22]: 'Override Arming Safety',
  [23]: 'Override Throttle Scale',
  [24]: 'Swap Roll Yaw',
  [25]: 'Set Vtx Power Level',
  [26]: 'Invert Roll',
  [27]: 'Invert Pitch',
  [28]: 'Invert Yaw',
  [29]: 'Override Throttle',
  [30]: 'Set Vtx Band',
  [31]: 'Set Vtx Channel',
  [32]: 'Set Osd Layout',
  [33]: 'Sin',
  [34]: 'Cos',
  [35]: 'Tan',
  [36]: 'Map Input',
  [37]: 'Map Output',
  [38]: 'Rc Channel Override',
  [39]: 'Set Heading Target',
  [40]: 'Modulus',
  [41]: 'Loiter Override',
  [42]: 'Set Profile',
  [43]: 'Min',
  [44]: 'Max',
  [45]: 'Flight Axis Angle Override',
  [46]: 'Flight Axis Rate Override',
  [47]: 'Edge',
  [48]: 'Delay',
  [49]: 'Timer',
  [50]: 'Delta',
  [51]: 'Approx Equal',
  [52]: 'Led Pin Pwm',
  [53]: 'Disable Gps Fix',
  [54]: 'Reset Mag Calibration',
  [55]: 'Set Gimbal Sensitivity',
};

/**
 * Human-readable flight parameter names
 */
const FLIGHT_PARAM_NAMES = {
  [0]: 'armTimer',
  [1]: 'homeDistance',
  [2]: 'tripDistance',
  [3]: 'rssi',
  [4]: 'vbat',
  [5]: 'cellVoltage',
  [6]: 'current',
  [7]: 'mahDrawn',
  [8]: 'gpsSats',
  [9]: 'groundSpeed',
  [10]: 'speed_3d',
  [11]: 'airSpeed',
  [12]: 'altitude',
  [13]: 'verticalSpeed',
  [14]: 'throttlePos',
  [15]: 'roll',
  [16]: 'pitch',
  [17]: 'isArmed',
  [18]: 'isAutolaunch',
  [19]: 'isAltitudeControl',
  [20]: 'isPositionControl',
  [21]: 'isEmergencyLanding',
  [22]: 'isRth',
  [23]: 'isLanding',
  [24]: 'isFailsafe',
  [25]: 'stabilizedRoll',
  [26]: 'stabilizedPitch',
  [27]: 'stabilizedYaw',
  [28]: 'homeDistance_3d',
  [29]: 'crsfLqUplink',
  [30]: 'crsfSnr',
  [31]: 'gpsValid',
  [32]: 'loiterRadius',
  [33]: 'activeProfile',
  [34]: 'battCells',
  [35]: 'aglStatus',
  [36]: 'agl',
  [37]: 'rangefinderRaw',
  [38]: 'activeMixerProfile',
  [39]: 'mixerTransitionActive',
  [40]: 'yaw',
  [41]: 'fwLandState',
  [42]: 'battProfile',
  [43]: 'flownLoiterRadius',
  [44]: 'crsfLqDownlink',
  [45]: 'crsfRssiDbm',
  [46]: 'minGroundSpeed',
  [47]: 'horizontalWindSpeed',
  [48]: 'windDirection',
  [49]: 'relativeWindOffset',
};

/**
 * Helper functions
 */
function getFlightParamName(paramId) {
  return FLIGHT_PARAM_NAMES[paramId] || `unknown_param_${paramId}`;
}

function getOperationName(operationId) {
  return OPERATION_NAMES[operationId] || `unknown_operation_${operationId}`;
}

function isValidGvarIndex(index) {
  return index >= 0 && index < GVAR_CONFIG.COUNT;
}

function isValidRCChannel(channel) {
  return channel >= RC_CHANNEL.MIN_CHANNEL && channel <= RC_CHANNEL.MAX_CHANNEL;
}

export {
  OPERAND_TYPE,
  OPERATION,
  FLIGHT_PARAM,
  FLIGHT_MODE,
  WAYPOINT_PARAM,
  FLIGHT_PARAM_NAMES,
  OPERATION_NAMES,
  RC_CHANNEL,
  GVAR_CONFIG,
  VTX,

  // Helper functions
  getFlightParamName,
  getOperationName,
  isValidGvarIndex,
  isValidRCChannel
};
