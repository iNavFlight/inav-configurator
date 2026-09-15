import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getUnitHint, hasUnitHint } from '../js/unitHint.js';

describe('hasUnitHint', () => {
    test('knows the raw firmware units that have a readable counterpart', () => {
        for (const unit of ['cm', 'cms', 'v-cms', 'msec', 'dsec', 'decideg', 'decidegc', 'cw', 'm-lrg', 'mins']) {
            assert.equal(hasUnitHint(unit), true, unit);
        }
    });

    test('ignores units that are already readable or have no sensible conversion', () => {
        for (const unit of ['m', 'deg', 'us', 'percent', 'sec', 'ms', 'kmh', undefined, '', 'toString']) {
            assert.equal(hasUnitHint(unit), false, String(unit));
        }
    });
});

describe('getUnitHint', () => {
    test('centimetres become metres', () => {
        assert.deepEqual(getUnitHint('cm', 500), { text: '= 5 m', title: 'Metres' });
        assert.equal(getUnitHint('cm', 12345).text, '= 123.45 m');
        assert.equal(getUnitHint('cm', 50).text, '= 0.5 m');
        assert.equal(getUnitHint('cm', 0).text, '= 0 m');
        assert.equal(getUnitHint('cm', -250).text, '= -2.5 m');
    });

    test('long distances in centimetres switch to kilometres', () => {
        assert.equal(getUnitHint('cm', 99999).text, '= 999.99 m');
        assert.deepEqual(getUnitHint('cm', 100000), { text: '= 1 km', title: 'Kilometres' });
        assert.equal(getUnitHint('cm', 1000000).text, '= 10 km');
        assert.equal(getUnitHint('cm', 123456).text, '≈ 1.235 km');
    });

    test('accepts the string value of an input', () => {
        assert.equal(getUnitHint('cm', '1500').text, '= 15 m');
        assert.equal(getUnitHint('cm', ' 200 ').text, '= 2 m');
    });

    test('horizontal speed becomes km/h, vertical speed m/s', () => {
        assert.deepEqual(getUnitHint('cms', 1500), { text: '= 54 km/h', title: 'Kilometres per hour' });
        assert.equal(getUnitHint('cms', 1000).text, '= 36 km/h');
        assert.equal(getUnitHint('cms', 1234).text, '≈ 44.4 km/h');
        assert.deepEqual(getUnitHint('v-cms', 300), { text: '= 3 m/s', title: 'Metres per second' });
        assert.equal(getUnitHint('v-cms', 250).text, '= 2.5 m/s');
    });

    test('floating point noise does not turn an exact value into an approximation', () => {
        assert.equal(getUnitHint('cms', 100).text, '= 3.6 km/h');
        assert.equal(getUnitHint('cms', 300).text, '= 10.8 km/h');
        assert.equal(getUnitHint('cm', 110).text, '= 1.1 m');
    });

    test('time units become seconds or hours', () => {
        assert.deepEqual(getUnitHint('msec', 1500), { text: '= 1.5 s', title: 'Seconds' });
        assert.equal(getUnitHint('msec', 5).text, '= 0.005 s');
        assert.equal(getUnitHint('msec', 60000).text, '= 60 s');
        assert.equal(getUnitHint('dsec', 15).text, '= 1.5 s');
        assert.equal(getUnitHint('dsec', 200).text, '= 20 s');
        assert.deepEqual(getUnitHint('mins', 90), { text: '= 1.5 h', title: 'Hours' });
    });

    test('angles and temperatures', () => {
        assert.deepEqual(getUnitHint('decideg', -25), { text: '= -2.5°', title: 'Degrees' });
        assert.equal(getUnitHint('decideg', 0).text, '= 0°');
        assert.deepEqual(getUnitHint('decidegc', 600), { text: '= 60 °C', title: 'Degrees Celsius' });
        assert.equal(getUnitHint('decidegc', -105).text, '= -10.5 °C');
    });

    test('power and OSD distance', () => {
        assert.deepEqual(getUnitHint('cw', 1500), { text: '= 15 W', title: 'Watts' });
        assert.equal(getUnitHint('cw', 5).text, '= 0.05 W');
        assert.deepEqual(getUnitHint('m-lrg', 1500), { text: '= 1.5 km', title: 'Kilometres' });
    });

    test('returns null when there is nothing sensible to show', () => {
        assert.equal(getUnitHint('cm', ''), null);
        assert.equal(getUnitHint('cm', 'abc'), null);
        assert.equal(getUnitHint('cm', NaN), null);
        assert.equal(getUnitHint('cm', Infinity), null);
        assert.equal(getUnitHint('cm', undefined), null);
        assert.equal(getUnitHint('m', 500), null);
        assert.equal(getUnitHint('us', 1500), null);
        assert.equal(getUnitHint(undefined, 500), null);
    });

    test('never prints a negative zero', () => {
        assert.equal(getUnitHint('cm', -0.001).text, '≈ 0 m');
    });
});
