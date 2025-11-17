/**
 * INAV Waypoint Definitions
 * 
 * Location: tabs/programming/transpiler/api/definitions/waypoint.js
 * 
 * Waypoint mission parameters (all read-only)
 */

export const waypointDefinitions = {
  
  isActive: {
    type: 'boolean',
    desc: 'Waypoint mission is currently active',
    inavOperand: { type: 7, value: 0 },
    readonly: true,
    example: 'if (waypoint.isActive) { ... }',
    category: 'status'
  },
  
  currentIndex: {
    type: 'number',
    desc: 'Current waypoint index (1-based)',
    inavOperand: { type: 7, value: 1 },
    readonly: true,
    example: 'const wpNum = waypoint.currentIndex;',
    note: 'Returns 0 when no mission active',
    category: 'status'
  },
  
  currentAction: {
    type: 'number',
    desc: 'Current waypoint action type',
    inavOperand: { type: 7, value: 2 },
    readonly: true,
    example: 'if (waypoint.currentAction === 4) { /* RTH */ }',
    note: '1=WAYPOINT, 3=HOLD_TIME, 4=RTH, 5=SET_POI, 6=JUMP, 7=SET_HEAD, 8=LAND',
    category: 'status'
  },
  
  nextAction: {
    type: 'number',
    desc: 'Next waypoint action type',
    inavOperand: { type: 7, value: 3 },
    readonly: true,
    example: 'if (waypoint.nextAction === 8) { /* Next WP is landing */ }',
    category: 'status'
  },
  
  distanceToNext: {
    type: 'number',
    unit: 'm',
    desc: 'Distance to next waypoint in meters',
    inavOperand: { type: 7, value: 4 },
    readonly: true,
    example: 'if (waypoint.distanceToNext < 50) { /* Close to WP */ }',
    category: 'distance'
  },
  
  distanceFromLast: {
    type: 'number',
    unit: 'm',
    desc: 'Distance from previous waypoint in meters',
    inavOperand: { type: 7, value: 5 },
    readonly: true,
    example: 'const traveled = waypoint.distanceFromLast;',
    category: 'distance'
  },
  
  userAction: {
    type: 'array',
    desc: 'User action flags for current waypoint (0-3)',
    readonly: true,
    category: 'actions',
    
    // Array-like access: waypoint.userAction[0]
    0: {
      type: 'boolean',
      desc: 'User Action 1 active on current waypoint',
      inavOperand: { type: 7, value: 6 },
      readonly: true,
      example: 'if (waypoint.userAction[0]) { /* UA1 active */ }'
    },
    
    1: {
      type: 'boolean',
      desc: 'User Action 2 active on current waypoint',
      inavOperand: { type: 7, value: 7 },
      readonly: true,
      example: 'if (waypoint.userAction[1]) { /* UA2 active */ }'
    },
    
    2: {
      type: 'boolean',
      desc: 'User Action 3 active on current waypoint',
      inavOperand: { type: 7, value: 8 },
      readonly: true,
      example: 'if (waypoint.userAction[2]) { /* UA3 active */ }'
    },
    
    3: {
      type: 'boolean',
      desc: 'User Action 4 active on current waypoint',
      inavOperand: { type: 7, value: 9 },
      readonly: true,
      example: 'if (waypoint.userAction[3]) { /* UA4 active */ }'
    }
  },
  
  nextUserAction: {
    type: 'array',
    desc: 'User action flags for next waypoint (0-3)',
    readonly: true,
    category: 'actions',
    
    0: {
      type: 'boolean',
      desc: 'User Action 1 active on next waypoint',
      inavOperand: { type: 7, value: 10 },
      readonly: true,
      example: 'if (waypoint.nextUserAction[0]) { /* Prepare for UA1 */ }'
    },
    
    1: {
      type: 'boolean',
      desc: 'User Action 2 active on next waypoint',
      inavOperand: { type: 7, value: 11 },
      readonly: true,
      example: 'if (waypoint.nextUserAction[1]) { /* Prepare for UA2 */ }'
    },
    
    2: {
      type: 'boolean',
      desc: 'User Action 3 active on next waypoint',
      inavOperand: { type: 7, value: 12 },
      readonly: true,
      example: 'if (waypoint.nextUserAction[2]) { /* Prepare for UA3 */ }'
    },
    
    3: {
      type: 'boolean',
      desc: 'User Action 4 active on next waypoint',
      inavOperand: { type: 7, value: 13 },
      readonly: true,
      example: 'if (waypoint.nextUserAction[3]) { /* Prepare for UA4 */ }'
    }
  }
};