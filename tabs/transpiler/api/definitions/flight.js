/**
'use strict';

 * INAV Flight Parameter Definitions
 * 
 * Location: tabs/programming/transpiler/api/definitions/flight.js
 * 
 * All flight telemetry, states, and mode information.
 * Maps JavaScript property names to INAV operand types/values.
 */

const flightDefinitions = {
  // === Telemetry Parameters ===
  
  armTimer: {
    type: 'number',
    unit: 's',
    desc: 'Time since armed in seconds',
    inavOperand: { type: 2, value: 0 }
  },
  
  homeDistance: {
    type: 'number',
    unit: 'm',
    desc: 'Distance from home in meters',
    inavOperand: { type: 2, value: 1 }
  },
  
  tripDistance: {
    type: 'number',
    unit: 'm',
    desc: 'Total distance traveled in meters',
    inavOperand: { type: 2, value: 2 }
  },
  
  rssi: {
    type: 'number',
    unit: '%',
    desc: 'Radio signal strength 0-99',
    inavOperand: { type: 2, value: 3 }
  },
  
  vbat: {
    type: 'number',
    unit: 'cV',
    desc: 'Battery voltage in centivolts (1260 = 12.6V)',
    inavOperand: { type: 2, value: 4 }
  },
  
  cellVoltage: {
    type: 'number',
    unit: 'cV',
    desc: 'Average cell voltage in centivolts',
    inavOperand: { type: 2, value: 5 }
  },
  
  current: {
    type: 'number',
    unit: 'cA',
    desc: 'Current draw in centiamps (100 = 1A)',
    inavOperand: { type: 2, value: 6 }
  },
  
  mahDrawn: {
    type: 'number',
    unit: 'mAh',
    desc: 'Capacity used in mAh',
    inavOperand: { type: 2, value: 7 }
  },
  
  gpsSats: {
    type: 'number',
    desc: 'Number of GPS satellites',
    inavOperand: { type: 2, value: 8 }
  },
  
  gpsValid: {
    type: 'boolean',
    desc: 'GPS has valid 3D fix',
    inavOperand: { type: 2, value: 31 }
  },
  
  groundSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Ground speed in cm/s',
    inavOperand: { type: 2, value: 9 }
  },
  
  speed3d: {
    type: 'number',
    unit: 'cm/s',
    desc: '3D speed in cm/s',
    inavOperand: { type: 2, value: 10 }
  },
  
  airSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Airspeed from pitot in cm/s',
    inavOperand: { type: 2, value: 11 }
  },
  
  altitude: {
    type: 'number',
    unit: 'cm',
    desc: 'Altitude above home in cm',
    inavOperand: { type: 2, value: 12 }
  },
  
  verticalSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Vertical speed (climb/descent) in cm/s',
    inavOperand: { type: 2, value: 13 }
  },
  
  throttlePos: {
    type: 'number',
    unit: '%',
    desc: 'Throttle position in %',
    inavOperand: { type: 2, value: 14 }
  },
  
  roll: {
    type: 'number',
    unit: '°',
    desc: 'Roll angle in degrees',
    inavOperand: { type: 2, value: 15 }
  },
  
  pitch: {
    type: 'number',
    unit: '°',
    desc: 'Pitch angle in degrees',
    inavOperand: { type: 2, value: 16 }
  },
  
  yaw: {
    type: 'number',
    unit: '°',
    desc: 'Yaw heading in degrees (0-360)',
    inavOperand: { type: 2, value: 40 }
  },
  
  // === State Flags ===
  
  isArmed: {
    type: 'boolean',
    desc: 'Is aircraft armed',
    inavOperand: { type: 2, value: 17 }
  },
  
  isAutolaunch: {
    type: 'boolean',
    desc: 'Auto launch mode active',
    inavOperand: { type: 2, value: 18 }
  },
  
  isAltitudeControl: {
    type: 'boolean',
    desc: 'Altitude hold active',
    inavOperand: { type: 2, value: 19 }
  },
  
  isPositionControl: {
    type: 'boolean',
    desc: 'Position hold active',
    inavOperand: { type: 2, value: 20 }
  },
  
  isEmergencyLanding: {
    type: 'boolean',
    desc: 'Emergency landing active',
    inavOperand: { type: 2, value: 21 }
  },
  
  isRTH: {
    type: 'boolean',
    desc: 'Return to home active',
    inavOperand: { type: 2, value: 22 }
  },
  
  isLanding: {
    type: 'boolean',
    desc: 'Landing mode active',
    inavOperand: { type: 2, value: 23 }
  },
  
  isFailsafe: {
    type: 'boolean',
    desc: 'Failsafe triggered',
    inavOperand: { type: 2, value: 24 }
  },
  
  // === PID Outputs ===
  
  stabilizedRoll: {
    type: 'number',
    desc: 'Roll PID controller output',
    inavOperand: { type: 2, value: 25 }
  },
  
  stabilizedPitch: {
    type: 'number',
    desc: 'Pitch PID controller output',
    inavOperand: { type: 2, value: 26 }
  },
  
  stabilizedYaw: {
    type: 'number',
    desc: 'Yaw PID controller output',
    inavOperand: { type: 2, value: 27 }
  },
  
  // === Advanced Telemetry ===
  
  homeDistance3d: {
    type: 'number',
    unit: 'm',
    desc: '3D distance to home in meters',
    inavOperand: { type: 2, value: 28 }
  },
  
  loiterRadius: {
    type: 'number',
    unit: 'cm',
    desc: 'Current loiter radius in cm',
    inavOperand: { type: 2, value: 32 }
  },
  
  flownLoiterRadius: {
    type: 'number',
    unit: 'm',
    desc: 'Actual flown loiter radius in meters',
    inavOperand: { type: 2, value: 43 }
  },
  
  activeProfile: {
    type: 'number',
    desc: 'Active PID profile (1-3)',
    inavOperand: { type: 2, value: 33 }
  },
  
  batteryProfile: {
    type: 'number',
    desc: 'Active battery profile',
    inavOperand: { type: 2, value: 42 }
  },
  
  batteryCells: {
    type: 'number',
    desc: 'Battery cell count',
    inavOperand: { type: 2, value: 34 }
  },
  
  aglStatus: {
    type: 'boolean',
    desc: 'AGL estimate is valid',
    inavOperand: { type: 2, value: 35 }
  },
  
  agl: {
    type: 'number',
    unit: 'cm',
    desc: 'Altitude above ground in cm',
    inavOperand: { type: 2, value: 36 }
  },
  
  rangefinderRaw: {
    type: 'number',
    unit: 'cm',
    desc: 'Rangefinder distance in cm',
    inavOperand: { type: 2, value: 37 }
  },
  
  mixerProfile: {
    type: 'number',
    desc: 'Active mixer profile',
    inavOperand: { type: 2, value: 38 }
  },
  
  mixerTransitionActive: {
    type: 'boolean',
    desc: 'VTOL transition active',
    inavOperand: { type: 2, value: 39 }
  },
  
  fwLandState: {
    type: 'number',
    desc: 'Fixed wing landing state (0-5)',
    inavOperand: { type: 2, value: 41 }
  },
  
  minGroundSpeed: {
    type: 'number',
    unit: 'm/s',
    desc: 'Minimum ground speed setting',
    inavOperand: { type: 2, value: 46 }
  },
  
  // === Link Quality ===
  
  linkQualityUplink: {
    type: 'number',
    unit: '%',
    desc: 'Uplink link quality',
    inavOperand: { type: 2, value: 29 }
  },
  
  linkQualityDownlink: {
    type: 'number',
    unit: '%',
    desc: 'Downlink link quality',
    inavOperand: { type: 2, value: 44 }
  },
  
  uplinkRssiDbm: {
    type: 'number',
    unit: 'dBm',
    desc: 'Uplink RSSI in dBm',
    inavOperand: { type: 2, value: 45 }
  },
  
  snr: {
    type: 'number',
    unit: 'dB',
    desc: 'Signal to noise ratio',
    inavOperand: { type: 2, value: 30 }
  },
  
  // === Wind Estimation ===
  
  windSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Estimated wind speed in cm/s',
    inavOperand: { type: 2, value: 47 }
  },
  
  windDirection: {
    type: 'number',
    unit: '°',
    desc: 'Wind direction in degrees (0-360)',
    inavOperand: { type: 2, value: 48 }
  },
  
  windOffset: {
    type: 'number',
    unit: '°',
    desc: 'Wind offset from heading (-180 to 180)',
    inavOperand: { type: 2, value: 49 }
  },
  
  // === Flight Modes (nested object) ===
  
  mode: {
    failsafe: {
      type: 'boolean',
      desc: 'Failsafe mode active',
      inavOperand: { type: 3, value: 0 }
    },
    
    manual: {
      type: 'boolean',
      desc: 'Manual mode active',
      inavOperand: { type: 3, value: 1 }
    },
    
    rth: {
      type: 'boolean',
      desc: 'RTH mode active',
      inavOperand: { type: 3, value: 2 }
    },
    
    poshold: {
      type: 'boolean',
      desc: 'Position hold active',
      inavOperand: { type: 3, value: 3 }
    },
    
    cruise: {
      type: 'boolean',
      desc: 'Cruise mode active',
      inavOperand: { type: 3, value: 4 }
    },
    
    althold: {
      type: 'boolean',
      desc: 'Altitude hold active',
      inavOperand: { type: 3, value: 5 }
    },
    
    angle: {
      type: 'boolean',
      desc: 'Angle mode active',
      inavOperand: { type: 3, value: 6 }
    },
    
    horizon: {
      type: 'boolean',
      desc: 'Horizon mode active',
      inavOperand: { type: 3, value: 7 }
    },
    
    anglehold: {
      type: 'boolean',
      desc: 'Angle hold active',
      inavOperand: { type: 3, value: 16 }
    },
    
    airmode: {
      type: 'boolean',
      desc: 'Airmode active',
      inavOperand: { type: 3, value: 8 }
    },
    
    courseHold: {
      type: 'boolean',
      desc: 'Course hold active',
      inavOperand: { type: 3, value: 11 }
    },
    
    acro: {
      type: 'boolean',
      desc: 'Acro mode active',
      inavOperand: { type: 3, value: 14 }
    },
    
    waypointMission: {
      type: 'boolean',
      desc: 'Waypoint mission active',
      inavOperand: { type: 3, value: 15 }
    },
    
    user1: {
      type: 'boolean',
      desc: 'User mode 1',
      inavOperand: { type: 3, value: 9 }
    },
    
    user2: {
      type: 'boolean',
      desc: 'User mode 2',
      inavOperand: { type: 3, value: 10 }
    },
    
    user3: {
      type: 'boolean',
      desc: 'User mode 3',
      inavOperand: { type: 3, value: 12 }
    },
    
    user4: {
      type: 'boolean',
      desc: 'User mode 4',
      inavOperand: { type: 3, value: 13 }
    }
  }
};

module.exports = { flightDefinitions };