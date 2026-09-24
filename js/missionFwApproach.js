'use strict';

/*
 * Serialisation of the <fwapproach> elements of a mission file.
 *
 * The approach collection keeps the safehome approaches first, so the approach
 * of the mission with index n lives in slot maxSafehomeCount + n. The mission
 * file stores that mission index in "index" and the collection slot in "no".
 */

function toInteger(value, fallback = 0) {
    const number = Number.parseInt(value, 10);

    return Number.isFinite(number) ? number : fallback;
}

function toFlag(value, trueValues) {
    return trueValues.test(String(value).trim()) ? 1 : 0;
}

export function hasFwApproachData(approach) {
    if (!approach) return false;

    return approach.getApproachAltAsl() != 0 ||
        approach.getLandAltAsl() != 0 ||
        approach.getApproachDirection() != 0 ||
        approach.getLandHeading1() != 0 ||
        approach.getLandHeading2() != 0 ||
        approach.getIsSeaLevelRef() != 0;
}

/* An approach is written whenever it carries data or whenever its mission ends
 * with a landing point. Landing altitude, approach altitude, approach direction
 * and the sea level reference are lost otherwise, because they are useful
 * without a landing heading. */
export function buildFwApproachItems(approaches, maxSafehomeCount, maxFwApproachCount, landingMissionIndexes = [], sourceMissionIndex = null) {
    const landingMissions = new Set(landingMissionIndexes);
    const items = [];

    for (let i = maxSafehomeCount; i < maxFwApproachCount; i++) {
        const approach = approaches[i];
        const missionIndex = i - maxSafehomeCount;
        if (sourceMissionIndex !== null && missionIndex !== sourceMissionIndex) {
            continue;
        }
        const fileMissionIndex = sourceMissionIndex === null ? missionIndex : 0;

        if (!approach || !(landingMissions.has(missionIndex) || hasFwApproachData(approach))) {
            continue;
        }

        items.push({ $: {
            'index': fileMissionIndex,
            'no': maxSafehomeCount + fileMissionIndex,
            'approach-alt': approach.getApproachAltAsl(),
            'land-alt': approach.getLandAltAsl(),
            'approach-direction': approach.getApproachDirection() == 0 ? 'left' : 'right',
            'landheading1': approach.getLandHeading1(),
            'landheading2': approach.getLandHeading2(),
            'sealevel-ref': approach.getIsSeaLevelRef() ? 'true' : 'false'
        }});
    }

    return items;
}

/* Attribute names are matched loosely so that the dashless names of the first
 * mission planner approaches ("ApproachAlt", "SeaLevelRef") are read too. */
export function parseFwApproachAttributes(attributes) {
    const approach = {
        index: null,
        number: null,
        approachAltAsl: 0,
        landAltAsl: 0,
        approachDirection: 0,
        landHeading1: 0,
        landHeading2: 0,
        isSeaLevelRef: 0
    };

    for (const attribute in attributes) {
        const value = attributes[attribute];

        if (/^index$/i.test(attribute)) {
            approach.index = toInteger(value, null);
        } else if (/^no$/i.test(attribute)) {
            approach.number = toInteger(value, null);
        } else if (/approach-?alt/i.test(attribute)) {
            approach.approachAltAsl = toInteger(value);
        } else if (/land-?alt/i.test(attribute)) {
            approach.landAltAsl = toInteger(value);
        } else if (/approach-?direction/i.test(attribute)) {
            approach.approachDirection = toFlag(value, /^(right|1)$/i);
        } else if (/landheading1/i.test(attribute)) {
            approach.landHeading1 = toInteger(value);
        } else if (/landheading2/i.test(attribute)) {
            approach.landHeading2 = toInteger(value);
        } else if (/sealevel-?ref/i.test(attribute)) {
            approach.isSeaLevelRef = toFlag(value, /^(true|1)$/i);
        }
    }

    return approach;
}

/* Returns the collection slot of a parsed approach, or -1 when the element
 * addresses no usable mission slot. */
export function resolveFwApproachSlot(approach, maxSafehomeCount, maxFwApproachCount) {
    let slot = null;

    if (Number.isInteger(approach.index) && approach.index >= 0) {
        slot = maxSafehomeCount + approach.index;
    } else if (Number.isInteger(approach.number) && approach.number >= 0) {
        // Elements without a mission index only carry the collection slot.
        slot = approach.number;
    }

    return slot !== null && slot >= maxSafehomeCount && slot < maxFwApproachCount ? slot : -1;
}
