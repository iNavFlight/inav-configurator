#!/usr/bin/env node
/**
 * Tests for buildLoggingRateOptions() (js/blackboxLoggingRates.js), which fills the
 * logging rate select of the Onboard Logging tab (issues #2581 and #1156).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLoggingRateOptions } from '../js/blackboxLoggingRates.js';

const PRESET_COUNT = 12;

function values(result) {
    return result.options.map((o) => o.value);
}

test('a preset rate is selected and not offered twice', () => {
    const r = buildLoggingRateOptions(1, 2);
    assert.equal(r.selected, '1/2');
    assert.equal(r.options.length, PRESET_COUNT);
    assert.equal(values(r).filter((v) => v === '1/2').length, 1);
});

test('an unreduced fraction is reduced to the matching preset', () => {
    const r = buildLoggingRateOptions(4, 8);
    assert.equal(r.selected, '1/2');
    assert.equal(r.options.length, PRESET_COUNT);
});

test('a rate below the presets is offered, selected and listed first', () => {
    const r = buildLoggingRateOptions(1, 256);
    assert.equal(r.selected, '1/256');
    assert.equal(r.options.length, PRESET_COUNT + 1);
    assert.deepEqual(r.options[0], {value: '1/256', percent: 0, label: '1/256 (0.39%)'});
});

test('a rate between two presets is sorted in by ratio', () => {
    const r = buildLoggingRateOptions(3, 10);
    const list = values(r);
    assert.equal(r.selected, '3/10');
    assert.ok(list.indexOf('1/4') < list.indexOf('3/10'));
    assert.ok(list.indexOf('3/10') < list.indexOf('1/3'));
});

test('options are in ascending ratio order', () => {
    const ratios = buildLoggingRateOptions(1, 384).options.map((o) => {
        const [num, denom] = o.value.split('/').map(Number);
        return num / denom;
    });
    assert.deepEqual(ratios, [...ratios].sort((a, b) => a - b));
});

test('rates below one percent keep two significant digits instead of 0%', () => {
    assert.equal(buildLoggingRateOptions(1, 384).options[0].label, '1/384 (0.26%)');
    assert.equal(buildLoggingRateOptions(1, 65535).options[0].label, '1/65535 (0.0015%)');
    assert.equal(buildLoggingRateOptions(1, 32).options[0].label, '1/32 (3%)');
});

test('a missing, zero, infinite or fractional rate falls back to 1/1 without throwing', () => {
    for (const [num, denom] of [[0, 0], [1, 0], [0, 5], [undefined, undefined], [NaN, 2], [1, NaN],
        [Infinity, 1], [1, Infinity], [0.5, 2], [1, 0.5]]) {
        const r = buildLoggingRateOptions(num, denom);
        assert.equal(r.selected, '1/1', `num=${num} denom=${denom}`);
        assert.equal(r.options.length, PRESET_COUNT);
    }
});
