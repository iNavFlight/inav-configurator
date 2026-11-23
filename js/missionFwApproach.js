'use strict';

import { FwApproach } from './fwApproach';

// Mission n's approach lives in collection slot maxSafehomeCount + n; a mission file keeps n in "index" and the slot in "no".

function toInteger(value, fallback = 0) {
    const number = Number.parseInt(value, 10);

    return Number.isFinite(number) ? number : fallback;
}

function toFlag(value, trueValues) {
    return trueValues.test(String(value).trim()) ? 1 : 0;
}

// The firmware flies no autoland approach without a landing heading (navigation.c), so such entries carry nothing.
function hasLandingHeading(approach) {
    return !!approach && (approach.getLandHeading1() != 0 || approach.getLandHeading2() != 0);
}

// sourceMissionIndex set: only that mission is saved, as standalone mission 0.
export function buildFwApproachItems(approaches, maxSafehomeCount, maxFwApproachCount, sourceMissionIndex = null) {
    const items = [];

    for (let i = maxSafehomeCount; i < maxFwApproachCount; i++) {
        const approach = approaches[i];
        const missionIndex = i - maxSafehomeCount;
        if (!hasLandingHeading(approach) || (sourceMissionIndex !== null && missionIndex !== sourceMissionIndex)) {
            continue;
        }
        const fileMissionIndex = sourceMissionIndex === null ? missionIndex : 0;

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

// mwp writes the same attributes without dashes ("approachalt", "sealevelref").
function parseFwApproachAttributes(attributes) {
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

// Returns -1 when the element addresses no mission slot, so it can never land in a safehome slot.
function resolveFwApproachSlot(approach, maxSafehomeCount, maxFwApproachCount) {
    let slot = null;

    if (Number.isInteger(approach.index) && approach.index >= 0) {
        slot = maxSafehomeCount + approach.index;
    } else if (Number.isInteger(approach.number) && approach.number >= 0) {
        // Elements without a mission index only carry the collection slot.
        slot = approach.number;
    }

    return slot !== null && slot >= maxSafehomeCount && slot < maxFwApproachCount ? slot : -1;
}

// Returns the approach of a <fwapproach> element for its fixed collection slot, or null when it addresses none.
export function fwApproachFromElement(attributes, maxSafehomeCount, maxFwApproachCount) {
    const parsed = parseFwApproachAttributes(attributes);
    const slot = resolveFwApproachSlot(parsed, maxSafehomeCount, maxFwApproachCount);

    if (slot < 0) {
        return null;
    }

    return new FwApproach(slot,
                          parsed.approachAltAsl,
                          parsed.landAltAsl,
                          parsed.approachDirection,
                          parsed.landHeading1,
                          parsed.landHeading2,
                          parsed.isSeaLevelRef);
}
