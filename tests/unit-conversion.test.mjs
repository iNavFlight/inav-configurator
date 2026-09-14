/**
 * Tests for the unit presentation helpers the mission planner uses
 * (iNavFlight/inav-configurator#2108).
 *
 * Mission Control keeps storing and sending firmware units, so the important
 * property is that a value the user types survives being converted for
 * display and converted back again.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { globalSettings, UnitType } from '../js/globalSettings.js';
import { fromDisplayUnits, getUnitMultiplier, smartRound, toDisplayUnits } from '../js/unitConversion.js';

function withUnits(unitType, osdUnits, body) {
    const previousType = globalSettings.unitType;
    const previousOsdUnits = globalSettings.osdUnits;

    globalSettings.unitType = unitType;
    globalSettings.osdUnits = osdUnits;
    try {
        body();
    } finally {
        globalSettings.unitType = previousType;
        globalSettings.osdUnits = previousOsdUnits;
    }
}

test('without a unit system the firmware units are shown unchanged', () => {
    withUnits(UnitType.none, null, () => {
        const altitude = toDisplayUnits(3000, 'cm');
        assert.equal(altitude.multiplier, 1);
        assert.equal(altitude.text, '3000');
        assert.equal(altitude.displayName, 'cm');

        const speed = toDisplayUnits(500, 'cms');
        assert.equal(speed.multiplier, 1);
        assert.equal(speed.text, '500');
        assert.equal(speed.displayName, 'cm/s');

        assert.equal(fromDisplayUnits(3000, 'cm'), 3000);
        assert.equal(fromDisplayUnits(500, 'cms'), 500);
    });
});

test('imperial shows altitudes in feet and speeds in mph', () => {
    withUnits(UnitType.imperial, null, () => {
        assert.equal(getUnitMultiplier('cm').unitName, 'ft');
        assert.equal(getUnitMultiplier('cms').unitName, 'mph');

        assert.equal(toDisplayUnits(15240, 'cm').text, '500');
        assert.equal(toDisplayUnits(500, 'cms').text, '11.18');
    });
});

test('metric shows altitudes in metres and speeds in km/h', () => {
    withUnits(UnitType.metric, null, () => {
        assert.equal(toDisplayUnits(3000, 'cm').text, '30.0');
        assert.equal(toDisplayUnits(3000, 'cm').displayName, 'm');
        assert.equal(toDisplayUnits(500, 'cms').text, '18');
        assert.equal(toDisplayUnits(500, 'cms').displayName, 'Km/h');
    });
});

test('the OSD unit type follows the unit preference read from the FC', () => {
    withUnits(UnitType.OSD, 0, () => {
        assert.equal(getUnitMultiplier('cm').unitName, 'ft');
    });
    withUnits(UnitType.OSD, 1, () => {
        assert.equal(getUnitMultiplier('cm').unitName, 'm');
    });
    withUnits(UnitType.OSD, 4, () => {
        assert.equal(getUnitMultiplier('cm').unitName, 'ft');
        assert.equal(getUnitMultiplier('cms').unitName, 'kt');
    });
});

test('a typed altitude survives storing and reloading in imperial', () => {
    withUnits(UnitType.imperial, null, () => {
        for (const typed of [25, 100, 328, 500, 1640, 3280]) {
            const stored = fromDisplayUnits(typed, 'cm');

            assert.equal(Number.isInteger(stored), true, typed + ' ft did not give whole centimetres');
            assert.equal(toDisplayUnits(stored, 'cm').text, String(typed),
                typed + ' ft did not come back unchanged');
            assert.equal(fromDisplayUnits(toDisplayUnits(stored, 'cm').text, 'cm'), stored,
                typed + ' ft drifted on a second round trip');
        }
    });
});

test('a typed speed survives storing and reloading in imperial', () => {
    withUnits(UnitType.imperial, null, () => {
        for (const typed of [5, 11.18, 22.37, 50]) {
            const stored = fromDisplayUnits(typed, 'cms');

            assert.equal(Number.isInteger(stored), true, typed + ' mph did not give whole cm/s');
            assert.equal(fromDisplayUnits(toDisplayUnits(stored, 'cms').text, 'cms'), stored,
                typed + ' mph drifted on a round trip');
        }
    });
});

test('metre based planner defaults keep two decimals of precision', () => {
    withUnits(UnitType.imperial, null, () => {
        // Approach and landing altitude are held in whole metres by the
        // planner settings, so they are converted with a finer precision.
        const stored = fromDisplayUnits('16.40', 'm', 2);
        assert.equal(stored, 5);
        assert.equal(toDisplayUnits(stored, 'm').text, '16.40');
    });
});

test('mission length is converted from metres', () => {
    withUnits(UnitType.metric, null, () => {
        assert.equal(toDisplayUnits(1234, 'm').multiplier, 1);
        assert.equal(toDisplayUnits(1234, 'm').displayName, 'm');
    });
    withUnits(UnitType.imperial, null, () => {
        assert.equal(toDisplayUnits(1234, 'm').displayName, 'ft');
        assert.equal(toDisplayUnits(1234, 'm').text, '4050');
    });
});

test('values that cannot be converted are passed through', () => {
    withUnits(UnitType.imperial, null, () => {
        assert.equal(toDisplayUnits('N/A', 'cm').text, 'N/A');
        assert.equal(Number.isNaN(fromDisplayUnits('N/A', 'cm')), true);
    });
});

test('display rounding hides conversion noise and snaps to round numbers', () => {
    // 100 m is 328.08 ft, and the decimals move the value by well under 1%.
    assert.equal(smartRound(328.08, 2), '328');
    assert.equal(smartRound(9842.52, 2), '9843');

    // Within 1 of a 10/100/1000 boundary the value snaps onto it, negative
    // values included.
    assert.equal(smartRound(999.4, 2), '1000');
    assert.equal(smartRound(-999.4, 2), '-1000');

    // Below two decimal places the value is left to toFixed().
    assert.equal(smartRound(12.34, 1), '12.3');
});
