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
import { fromDisplayUnits, getUnitMultiplier, smartRound, toDisplayUnits, toFieldText } from '../js/unitConversion.js';

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
        // Approach and landing altitude are held in metres with two decimals
        // by the planner settings, so they are converted with that precision.
        const stored = fromDisplayUnits('16.40', 'm', 2);
        assert.equal(stored, 5);
        assert.equal(toFieldText(stored, 'm', 2), '16.4');
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

const fieldSystems = [[UnitType.none, null], [UnitType.imperial, null], [UnitType.metric, null],
    [UnitType.OSD, 2], [UnitType.OSD, 3], [UnitType.OSD, 4]];

test('a typed whole number comes back unchanged in every field unit', () => {
    for (const [unitType, osdUnits] of fieldSystems) {
        withUnits(unitType, osdUnits, () => {
            for (const [unit, precision] of [['cm', 0], ['cms', 0], ['m', 2]]) {
                for (let typed = 1; typed <= 3000; typed++) {
                    const stored = fromDisplayUnits(typed, unit, precision);
                    assert.equal(toFieldText(stored, unit, precision), String(typed),
                        unitType + '/' + osdUnits + ' ' + unit + ': ' + typed + ' came back changed');
                }
            }
        });
    }
});

test('an untouched field reads back the stored firmware value', () => {
    for (const [unitType, osdUnits] of fieldSystems) {
        withUnits(unitType, osdUnits, () => {
            for (let stored = -2000; stored <= 20000; stored += 7) {
                for (const unit of ['cm', 'cms']) {
                    assert.equal(fromDisplayUnits(toFieldText(stored, unit), unit), stored,
                        unitType + '/' + osdUnits + ' ' + unit + ': ' + stored + ' drifted');
                }
            }
            for (const stored of [5, 5.5, 60, 60.05, 123.45]) {
                assert.equal(fromDisplayUnits(toFieldText(stored, 'm', 2), 'm', 2), stored,
                    unitType + '/' + osdUnits + ' m: ' + stored + ' drifted');
            }
        });
    }
});

test('a value finer than the firmware unit is shown as its rounded firmware value', () => {
    withUnits(UnitType.imperial, null, () => {
        // terrain elevation * 100 is not a whole centimetre
        const text = toFieldText(49271.4, 'cm');
        assert.equal(fromDisplayUnits(text, 'cm'), 49271);
        assert.ok(text.length <= 8, text);
    });
});
