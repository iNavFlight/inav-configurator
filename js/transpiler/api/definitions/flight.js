/**
 * INAV Flight Parameters API Definition
 *
 * Location: js/transpiler/api/definitions/flight.js
 *
 * Read-only flight controller telemetry and state information.
 * Source: src/main/programming/logic_condition.h (logicFlightOperands_e)
 *
 * IMPORTANT: All operand values are imported from inav_constants.js which is
 * auto-generated from INAV firmware. This ensures the transpiler stays in sync
 * with firmware changes. DO NOT hardcode operand values here.
 */

'use strict';

import { OPERAND_TYPE, FLIGHT_PARAM } from '../../transpiler/inav_constants.js';

export default {
  // Timing
  armTimer: {
    type: 'number',
    unit: 's',
    desc: 'Time since arming in seconds',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.ARM_TIMER }
  },

  // Distance & Position
  homeDistance: {
    type: 'number',
    unit: 'm',
    desc: 'Distance to home position in meters',
    readonly: true,
    range: [0, 65535],
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.HOME_DISTANCE }
  },

  homeDistance3d: {
    type: 'number',
    unit: 'm',
    desc: '3D distance to home position in meters',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.HOME_DISTANCE_3D }
  },

  tripDistance: {
    type: 'number',
    unit: 'm',
    desc: 'Total distance traveled in current flight',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.TRIP_DISTANCE }
  },

  distanceTraveled: {
    type: 'number',
    unit: 'm',
    desc: 'Alias for tripDistance',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.TRIP_DISTANCE }
  },

  // Communication
  rssi: {
    type: 'number',
    unit: '%',
    desc: 'Radio signal strength (0-99)',
    readonly: true,
    range: [0, 99],
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.RSSI }
  },

  // Battery
  vbat: {
    type: 'number',
    unit: 'cV',
    desc: 'Battery voltage in centivolts (e.g., 1260 = 12.60V)',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.VBAT }
  },

  cellVoltage: {
    type: 'number',
    unit: 'cV',
    desc: 'Average cell voltage in centivolts',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.CELL_VOLTAGE }
  },

  current: {
    type: 'number',
    unit: 'cA',
    desc: 'Current draw in centi-amps',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.CURRENT }
  },

  mahDrawn: {
    type: 'number',
    unit: 'mAh',
    desc: 'Battery capacity consumed in mAh',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.MAH_DRAWN }
  },

  batteryCells: {
    type: 'number',
    desc: 'Number of battery cells detected',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.BATT_CELLS }
  },

  batteryProfile: {
    type: 'number',
    desc: 'Active battery profile number',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.BATT_PROFILE }
  },

  // GPS
  gpsSats: {
    type: 'number',
    desc: 'Number of GPS satellites',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.GPS_SATS }
  },

  gpsValid: {
    type: 'boolean',
    desc: 'GPS fix is valid',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.GPS_VALID }
  },

  // Speed & Altitude
  groundSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Ground speed in cm/s',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.GROUND_SPEED }
  },

  speed3d: {
    type: 'number',
    unit: 'cm/s',
    desc: '3D speed in cm/s',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.SPEED_3D }
  },

  airSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Air speed in cm/s',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.AIR_SPEED }
  },

  altitude: {
    type: 'number',
    unit: 'cm',
    desc: 'Altitude above home in centimeters',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.ALTITUDE }
  },

  verticalSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Vertical speed (climb rate) in cm/s',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.VERTICAL_SPEED }
  },

  // Above Ground Level
  agl: {
    type: 'number',
    unit: 'cm',
    desc: 'Above ground level altitude in cm',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.AGL }
  },

  aglStatus: {
    type: 'number',
    desc: 'AGL sensor status (0=invalid, 1=valid, 2=trusted)',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.AGL_STATUS }
  },

  rangefinder: {
    type: 'number',
    unit: 'cm',
    desc: 'Raw rangefinder reading in cm',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.RANGEFINDER_RAW }
  },

  // Throttle & Attitude
  throttlePos: {
    type: 'number',
    unit: '%',
    desc: 'Throttle position percentage (0-100)',
    readonly: true,
    range: [0, 100],
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.THROTTLE_POS }
  },

  roll: {
    type: 'number',
    unit: 'decideg',
    desc: 'Roll angle in decidegrees',
    readonly: true,
    range: [-1800, 1800],
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.ROLL }
  },

  pitch: {
    type: 'number',
    unit: 'decideg',
    desc: 'Pitch angle in decidegrees',
    readonly: true,
    range: [-1800, 1800],
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.PITCH }
  },

  yaw: {
    type: 'number',
    unit: 'decideg',
    desc: 'Yaw/heading in decidegrees (0-3599)',
    readonly: true,
    range: [0, 3599],
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.YAW }
  },

  heading: {
    type: 'number',
    unit: 'decideg',
    desc: 'Heading in decidegrees (alias for yaw)',
    readonly: true,
    range: [0, 3599],
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.YAW }
  },

  // Stabilized values
  stabilizedRoll: {
    type: 'number',
    unit: 'decideg',
    desc: 'Stabilized roll setpoint in decidegrees',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.STABILIZED_ROLL }
  },

  stabilizedPitch: {
    type: 'number',
    unit: 'decideg',
    desc: 'Stabilized pitch setpoint in decidegrees',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.STABILIZED_PITCH }
  },

  stabilizedYaw: {
    type: 'number',
    unit: 'decideg',
    desc: 'Stabilized yaw setpoint in decidegrees',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.STABILIZED_YAW }
  },

  // State
  isArmed: {
    type: 'boolean',
    desc: 'Aircraft is armed',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.IS_ARMED }
  },

  isAutoLaunch: {
    type: 'boolean',
    desc: 'Auto-launch is active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.IS_AUTOLAUNCH }
  },

  isAltitudeControl: {
    type: 'boolean',
    desc: 'Altitude control is active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.IS_ALTITUDE_CONTROL }
  },

  isPositionControl: {
    type: 'boolean',
    desc: 'Position control is active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.IS_POSITION_CONTROL }
  },

  isEmergencyLanding: {
    type: 'boolean',
    desc: 'Emergency landing is active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.IS_EMERGENCY_LANDING }
  },

  isRth: {
    type: 'boolean',
    desc: 'Return to home is active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.IS_RTH }
  },

  isLanding: {
    type: 'boolean',
    desc: 'Landing mode is active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.IS_LANDING }
  },

  isFailsafe: {
    type: 'boolean',
    desc: 'Failsafe mode is active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.IS_FAILSAFE }
  },

  // Profile
  activeProfile: {
    type: 'number',
    desc: 'Active control profile number',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.ACTIVE_PROFILE }
  },

  activeMixerProfile: {
    type: 'number',
    desc: 'Active mixer profile number',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.ACTIVE_MIXER_PROFILE }
  },

  mixerTransitionActive: {
    type: 'boolean',
    desc: 'Mixer transition is active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.MIXER_TRANSITION_ACTIVE }
  },

  // Navigation
  loiterRadius: {
    type: 'number',
    unit: 'cm',
    desc: 'Current loiter radius in cm',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.LOITER_RADIUS }
  },

  flownLoiterRadius: {
    type: 'number',
    unit: 'm',
    desc: 'Actual flown loiter radius in meters',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.FLOWN_LOITER_RADIUS }
  },

  fwLandState: {
    type: 'number',
    desc: 'Fixed-wing landing state',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.FW_LAND_STATE }
  },

  // CRSF Telemetry
  crsfLqUplink: {
    type: 'number',
    unit: '%',
    desc: 'CRSF uplink link quality percentage',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.CRSF_LQ_UPLINK }
  },

  crsfLqDownlink: {
    type: 'number',
    unit: '%',
    desc: 'CRSF downlink link quality percentage',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.CRSF_LQ_DOWNLINK }
  },

  crsfSnr: {
    type: 'number',
    unit: 'dB',
    desc: 'CRSF signal-to-noise ratio in dB',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.CRSF_SNR }
  },

  crsfRssiDbm: {
    type: 'number',
    unit: 'dBm',
    desc: 'CRSF RSSI in dBm',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.FLIGHT, value: FLIGHT_PARAM.CRSF_RSSI_DBM }
  }
};
