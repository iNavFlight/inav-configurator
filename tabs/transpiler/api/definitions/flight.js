/**
 * INAV Flight Parameters API Definition
 * 
 * Location: tabs/transpiler/api/definitions/flight.js
 * 
 * Read-only flight controller telemetry and state information.
 * Source: src/main/programming/logic_condition.c (OPERAND_FLIGHT)
 */

'use strict';

module.exports = {
  // Timing
  armTimer: {
    type: 'number',
    unit: 'ms',
    desc: 'Time since arming in milliseconds',
    readonly: true,
    inavOperand: { type: 2, value: 0 }
  },
  
  flightTime: {
    type: 'number',
    unit: 's',
    desc: 'Total flight time in seconds',
    readonly: true,
    inavOperand: { type: 2, value: 16 }
  },
  
  // Distance & Position
  homeDistance: {
    type: 'number',
    unit: 'm',
    desc: 'Distance to home position in meters',
    readonly: true,
    range: [0, 65535],
    inavOperand: { type: 2, value: 1 }
  },
  
  tripDistance: {
    type: 'number',
    unit: 'm',
    desc: 'Total distance traveled in current flight',
    readonly: true,
    inavOperand: { type: 2, value: 2 }
  },
  
  distanceTraveled: {
    type: 'number',
    unit: 'm',
    desc: 'Alias for tripDistance',
    readonly: true,
    inavOperand: { type: 2, value: 2 }
  },
  
  homeDirection: {
    type: 'number',
    unit: '°',
    desc: 'Direction to home in degrees (0-359)',
    readonly: true,
    range: [0, 359],
    inavOperand: { type: 2, value: 17 }
  },
  
  // Communication
  rssi: {
    type: 'number',
    unit: '%',
    desc: 'Radio signal strength (0-99)',
    readonly: true,
    range: [0, 99],
    inavOperand: { type: 2, value: 3 }
  },
  
  // Battery
  vbat: {
    type: 'number',
    unit: 'cV',
    desc: 'Battery voltage in centivolts (e.g., 1260 = 12.60V)',
    readonly: true,
    inavOperand: { type: 2, value: 4 }
  },
  
  cellVoltage: {
    type: 'number',
    unit: 'cV',
    desc: 'Average cell voltage in centivolts',
    readonly: true,
    inavOperand: { type: 2, value: 5 }
  },
  
  current: {
    type: 'number',
    unit: 'cA',
    desc: 'Current draw in centi-amps',
    readonly: true,
    inavOperand: { type: 2, value: 6 }
  },
  
  mahDrawn: {
    type: 'number',
    unit: 'mAh',
    desc: 'Battery capacity consumed in mAh',
    readonly: true,
    inavOperand: { type: 2, value: 7 }
  },
  
  mwhDrawn: {
    type: 'number',
    unit: 'mWh',
    desc: 'Energy consumed in mWh',
    readonly: true,
    inavOperand: { type: 2, value: 8 }
  },
  
  batteryRemainingCapacity: {
    type: 'number',
    unit: 'mAh',
    desc: 'Estimated remaining battery capacity',
    readonly: true,
    inavOperand: { type: 2, value: 18 }
  },
  
  batteryPercentage: {
    type: 'number',
    unit: '%',
    desc: 'Battery percentage remaining',
    readonly: true,
    range: [0, 100],
    inavOperand: { type: 2, value: 19 }
  },
  
  // GPS
  gpsSats: {
    type: 'number',
    desc: 'Number of GPS satellites',
    readonly: true,
    inavOperand: { type: 2, value: 9 }
  },
  
  gpsValid: {
    type: 'boolean',
    desc: 'GPS fix is valid',
    readonly: true,
    inavOperand: { type: 2, value: 10 }
  },
  
  // Speed & Altitude
  groundSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Ground speed in cm/s',
    readonly: true,
    inavOperand: { type: 2, value: 11 }
  },
  
  altitude: {
    type: 'number',
    unit: 'cm',
    desc: 'Altitude above home in centimeters',
    readonly: true,
    inavOperand: { type: 2, value: 12 }
  },
  
  verticalSpeed: {
    type: 'number',
    unit: 'cm/s',
    desc: 'Vertical speed (climb rate) in cm/s',
    readonly: true,
    inavOperand: { type: 2, value: 13 }
  },
  
  // Throttle & Attitude
  throttlePos: {
    type: 'number',
    unit: '%',
    desc: 'Throttle position percentage (0-100)',
    readonly: true,
    range: [0, 100],
    inavOperand: { type: 2, value: 14 }
  },
  
  roll: {
    type: 'number',
    unit: 'decideg',
    desc: 'Roll angle in decidegrees',
    readonly: true,
    range: [-1800, 1800],
    inavOperand: { type: 2, value: 15 }
  },
  
  pitch: {
    type: 'number',
    unit: 'decideg',
    desc: 'Pitch angle in decidegrees',
    readonly: true,
    range: [-1800, 1800],
    inavOperand: { type: 2, value: 16 }
  },
  
  yaw: {
    type: 'number',
    unit: 'decideg',
    desc: 'Yaw/heading in decidegrees (0-3599)',
    readonly: true,
    range: [0, 3599],
    inavOperand: { type: 2, value: 17 }
  },
  
  heading: {
    type: 'number',
    unit: '°',
    desc: 'Heading in degrees (0-359)',
    readonly: true,
    range: [0, 359],
    inavOperand: { type: 2, value: 17 }
  },
  
  // State
  isArmed: {
    type: 'boolean',
    desc: 'Aircraft is armed',
    readonly: true,
    inavOperand: { type: 2, value: 18 }
  },
  
  isAutoLaunch: {
    type: 'boolean',
    desc: 'Auto-launch is active',
    readonly: true,
    inavOperand: { type: 2, value: 19 }
  },
  
  isFailsafe: {
    type: 'boolean',
    desc: 'Failsafe mode is active',
    readonly: true,
    inavOperand: { type: 2, value: 20 }
  },
  
  // Profile
  mixerProfile: {
    type: 'number',
    desc: 'Current mixer profile (0-2)',
    readonly: true,
    range: [0, 2],
    inavOperand: { type: 2, value: 21 }
  },
  
  // Waypoint Navigation
  activeWpNumber: {
    type: 'number',
    desc: 'Active waypoint number',
    readonly: true,
    inavOperand: { type: 2, value: 31 }
  },
  
  activeWpAction: {
    type: 'number',
    desc: 'Active waypoint action code',
    readonly: true,
    inavOperand: { type: 2, value: 32 }
  },
  
  // Additional Navigation
  courseToHome: {
    type: 'number',
    unit: '°',
    desc: 'Course to home position in degrees',
    readonly: true,
    range: [0, 359],
    inavOperand: { type: 2, value: 35 }
  },
  
  gpsCourseOverGround: {
    type: 'number',
    unit: '°',
    desc: 'GPS course over ground in degrees',
    readonly: true,
    range: [0, 359],
    inavOperand: { type: 2, value: 36 }
  },
  
  // Flight Modes (nested object)
  mode: {
    type: 'object',
    desc: 'Flight mode states',
    properties: {
      failsafe: {
        type: 'boolean',
        desc: 'Failsafe mode active',
        readonly: true,
        inavOperand: { type: 2, value: 20 }
      },
      
      manual: {
        type: 'boolean',
        desc: 'Manual mode active',
        readonly: true,
        inavOperand: { type: 2, value: 21 }
      },
      
      rth: {
        type: 'boolean',
        desc: 'Return to home mode active',
        readonly: true,
        inavOperand: { type: 2, value: 22 }
      },
      
      poshold: {
        type: 'boolean',
        desc: 'Position hold mode active',
        readonly: true,
        inavOperand: { type: 2, value: 23 }
      },
      
      althold: {
        type: 'boolean',
        desc: 'Altitude hold mode active',
        readonly: true,
        inavOperand: { type: 2, value: 24 }
      },
      
      wp: {
        type: 'boolean',
        desc: 'Waypoint mode active',
        readonly: true,
        inavOperand: { type: 2, value: 25 }
      },
      
      gcs_nav: {
        type: 'boolean',
        desc: 'GCS navigation mode active',
        readonly: true,
        inavOperand: { type: 2, value: 26 }
      },
      
      airmode: {
        type: 'boolean',
        desc: 'Air mode active',
        readonly: true,
        inavOperand: { type: 2, value: 27 }
      },
      
      angle: {
        type: 'boolean',
        desc: 'Angle mode active',
        readonly: true,
        inavOperand: { type: 2, value: 28 }
      },
      
      horizon: {
        type: 'boolean',
        desc: 'Horizon mode active',
        readonly: true,
        inavOperand: { type: 2, value: 29 }
      },
      
      cruise: {
        type: 'boolean',
        desc: 'Cruise mode active',
        readonly: true,
        inavOperand: { type: 2, value: 30 }
      }
    }
  }
};