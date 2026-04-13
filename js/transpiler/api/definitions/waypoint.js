/**
 * INAV Waypoint Navigation API Definition
 *
 * Location: js/transpiler/api/definitions/waypoint.js
 *
 * Waypoint mission parameters and state.
 * Source: src/main/programming/logic_condition.h (logicWaypointOperands_e)
 *         src/main/programming/logic_condition.c (lines 575-669)
 *
 * IMPORTANT: These properties reflect what's actually exposed through the
 * logic condition operand system. Waypoints have lat/lon/alt internally,
 * but those values are NOT exposed as operands for security/simplicity.
 */

'use strict';

import { OPERAND_TYPE, WAYPOINT_PARAM } from '../../transpiler/inav_constants.js';

export default {
  // Waypoint mission state
  isWaypointMission: {
    type: 'boolean',
    desc: 'Currently executing waypoint mission',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.IS_WP }
  },

  // Current waypoint info
  number: {
    type: 'number',
    desc: 'Current waypoint index (number)',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.WAYPOINT_INDEX }
  },

  action: {
    type: 'number',
    desc: 'Current waypoint action code',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.WAYPOINT_ACTION }
  },

  nextAction: {
    type: 'number',
    desc: 'Next waypoint action code',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.NEXT_WAYPOINT_ACTION }
  },

  // Distance measurements
  distance: {
    type: 'number',
    unit: 'm',
    desc: 'Distance to current waypoint in meters',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.WAYPOINT_DISTANCE }
  },

  distanceFromPrevious: {
    type: 'number',
    unit: 'm',
    desc: 'Distance from previous waypoint in meters',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.DISTANCE_FROM_WAYPOINT }
  },

  // User action flags (for previous/current waypoint)
  user1Action: {
    type: 'boolean',
    desc: 'User1 action flag set on previous waypoint',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.USER1_ACTION }
  },

  user2Action: {
    type: 'boolean',
    desc: 'User2 action flag set on previous waypoint',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.USER2_ACTION }
  },

  user3Action: {
    type: 'boolean',
    desc: 'User3 action flag set on previous waypoint',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.USER3_ACTION }
  },

  user4Action: {
    type: 'boolean',
    desc: 'User4 action flag set on previous waypoint',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.USER4_ACTION }
  },

  // User action flags (for next waypoint)
  user1ActionNext: {
    type: 'boolean',
    desc: 'User1 action flag set on next waypoint',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.USER1_ACTION_NEXT_WP }
  },

  user2ActionNext: {
    type: 'boolean',
    desc: 'User2 action flag set on next waypoint',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.USER2_ACTION_NEXT_WP }
  },

  user3ActionNext: {
    type: 'boolean',
    desc: 'User3 action flag set on next waypoint',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.USER3_ACTION_NEXT_WP }
  },

  user4ActionNext: {
    type: 'boolean',
    desc: 'User4 action flag set on next waypoint',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.WAYPOINTS, value: WAYPOINT_PARAM.USER4_ACTION_NEXT_WP }
  }
};
