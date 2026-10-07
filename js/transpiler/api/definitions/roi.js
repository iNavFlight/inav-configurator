/**
 * INAV ROI API Definition
 *
 * Location: js/transpiler/api/definitions/roi.js
 *
 * Region-of-interest state exposed by logic condition operands.
 * Source: src/main/programming/logic_condition.h (logicROIOperands_e)
 */

'use strict';

import { OPERAND_TYPE, ROI_PARAM } from '../../transpiler/inav_constants.js';

export default {
  active: {
    type: 'boolean',
    desc: 'ROI is currently active',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.ACTIVE }
  },

  distance: {
    type: 'number',
    unit: 'm',
    desc: '3D distance to ROI in meters',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.DISTANCE }
  },

  groundDistance: {
    type: 'number',
    unit: 'm',
    desc: 'Horizontal distance to ROI in meters',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.GROUND_DISTANCE }
  },

  altitude: {
    type: 'number',
    unit: 'cm',
    desc: 'ROI altitude',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.ALTITUDE }
  },

  bearing: {
    type: 'number',
    unit: 'cdeg',
    desc: 'Bearing to ROI in centidegrees (0-35999, 0 = North)',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.BEARING }
  },

  elevation: {
    type: 'number',
    unit: 'deg',
    desc: 'Elevation angle to ROI',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.ELEVATION }
  },

  param1: {
    type: 'number',
    desc: 'ROI parameter 1',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.PARAM1 }
  },

  param2: {
    type: 'number',
    desc: 'ROI parameter 2',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.PARAM2 }
  },

  altDatum: {
    type: 'number',
    desc: 'ROI altitude datum bitfield',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.ALT_DATUM }
  },

  action: {
    type: 'number',
    desc: 'ROI action',
    readonly: true,
    inavOperand: { type: OPERAND_TYPE.ROI, value: ROI_PARAM.ACTION }
  }
};
