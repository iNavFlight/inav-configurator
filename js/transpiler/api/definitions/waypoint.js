/**
 * INAV Waypoint Navigation API Definition
 * 
 * Location: js/transpiler/api/definitions/waypoint.js
 * 
 * Waypoint mission parameters and state.
 * Source: src/main/navigation/navigation_pos_estimator.c
 */

'use strict';

export default {
  // Current waypoint info
  number: {
    type: 'number',
    desc: 'Current waypoint number',
    readonly: true,
    inavOperand: { type: 5, value: 0 }
  },
  
  action: {
    type: 'number',
    desc: 'Current waypoint action code',
    readonly: true,
    inavOperand: { type: 5, value: 1 }
  },
  
  // Waypoint position
  latitude: {
    type: 'number',
    unit: '°',
    desc: 'Waypoint latitude in degrees',
    readonly: true,
    inavOperand: { type: 5, value: 2 }
  },
  
  longitude: {
    type: 'number',
    unit: '°',
    desc: 'Waypoint longitude in degrees',
    readonly: true,
    inavOperand: { type: 5, value: 3 }
  },
  
  altitude: {
    type: 'number',
    unit: 'cm',
    desc: 'Waypoint altitude in centimeters',
    readonly: true,
    inavOperand: { type: 5, value: 4 }
  },
  
  // Distance to waypoint
  distance: {
    type: 'number',
    unit: 'm',
    desc: 'Distance to current waypoint in meters',
    readonly: true,
    inavOperand: { type: 5, value: 5 }
  },
  
  bearing: {
    type: 'number',
    unit: '°',
    desc: 'Bearing to current waypoint in degrees',
    readonly: true,
    range: [0, 359],
    inavOperand: { type: 5, value: 6 }
  },
  
  // Mission status
  missionReached: {
    type: 'boolean',
    desc: 'Current waypoint has been reached',
    readonly: true,
    inavOperand: { type: 5, value: 7 }
  },
  
  missionValid: {
    type: 'boolean',
    desc: 'Mission is valid and loaded',
    readonly: true,
    inavOperand: { type: 5, value: 8 }
  }
};
