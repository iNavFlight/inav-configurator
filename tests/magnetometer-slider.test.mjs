#!/usr/bin/env node
/**
 * Regression tests for magnetometer alignment tool slider synchronisation.
 * Tests the core noUiSlider ↔ value-field sync logic and re-entrancy guard
 * without requiring the full Electron/DOM environment.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Minimal noUiSlider mock
// ---------------------------------------------------------------------------

function createMockNoUiSlider(initial) {
    let _value = initial;
    const listeners = {};
    return {
        noUiSlider: {
            set(v) {
                _value = Number(v);
                if (listeners['update']) listeners['update']([[String(_value)], 0]);
            },
            get()         { return String(_value); },
            on(ev, cb)    { listeners[ev] = (args) => cb(...args); },
            _get()        { return _value; },
        }
    };
}

function createMockField(initial) {
    let _v = initial;
    return { val(v) { if (v !== undefined) { _v = v; return this; } return _v; } };
}

// Mirrors the fixed magnetometer.js axis control logic
function createAxisControl(sliderInit, fieldInit) {
    const sliderEl = createMockNoUiSlider(sliderInit);
    const fieldEl  = createMockField(fieldInit);
    const config   = { value: sliderInit };
    let _guard = false;

    function update(value) {
        config.value = Number(value);
        if (!_guard) {
            _guard = true;
            sliderEl.noUiSlider.set(config.value);
            _guard = false;
        }
        fieldEl.val(config.value);
    }

    sliderEl.noUiSlider.on('update', (values, handle) => {
        if (!_guard) { _guard = true; update(values[handle]); _guard = false; }
    });

    return {
        moveSlider(v)    { sliderEl.noUiSlider.set(v); },
        changeField(v)   { update(Number(v)); },
        sliderValue()    { return sliderEl.noUiSlider._get(); },
        fieldValue()     { return Number(fieldEl.val()); },
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('magnetometer slider synchronisation', () => {
    test('moving slider updates value field', () => {
        const axis = createAxisControl(0, 0);
        axis.moveSlider(45);
        assert.equal(axis.sliderValue(), 45);
        assert.equal(axis.fieldValue(),  45);
    });

    test('changing value field moves slider', () => {
        const axis = createAxisControl(0, 0);
        axis.changeField(90);
        assert.equal(axis.sliderValue(), 90);
        assert.equal(axis.fieldValue(),  90);
    });

    test('re-entrancy guard prevents infinite loop', () => {
        let callCount = 0;
        const sliderEl = createMockNoUiSlider(0);
        const fieldEl  = createMockField(0);
        let _guard = false;

        function update(value) {
            callCount++;
            if (callCount > 20) return;
            if (!_guard) { _guard = true; sliderEl.noUiSlider.set(value); _guard = false; }
            fieldEl.val(value);
        }

        sliderEl.noUiSlider.on('update', (values, handle) => {
            if (!_guard) { _guard = true; update(values[handle]); _guard = false; }
        });

        update(30);
        assert.ok(callCount <= 2, `expected ≤2 calls, got ${callCount}`);
    });

    test('all three axes round-trip values across [-180..360]', () => {
        const axes   = ['roll', 'pitch', 'yaw'];
        const values = [-180, -90, 0, 45, 90, 180, 270, 360];
        for (const axis of axes) {
            const ctrl = createAxisControl(0, 0);
            for (const v of values) {
                ctrl.changeField(v);
                assert.equal(ctrl.sliderValue(), v, `${axis}: slider should equal ${v}`);
                assert.equal(ctrl.fieldValue(),  v, `${axis}: field should equal ${v}`);
            }
        }
    });

    test('regression baseline: jQuery .val() on slider element does not move handle', () => {
        const sliderEl = createMockNoUiSlider(0);
        const fieldEl  = createMockField(0);
        // Simulate the old broken pattern: update field but never call .set()
        fieldEl.val(90);
        assert.equal(sliderEl.noUiSlider._get(), 0,  'slider stays at 0 with old .val() pattern');
        assert.equal(Number(fieldEl.val()),       90, 'field shows 90');
    });

    test('noUiSlider.get() returns value set via .set()', () => {
        const sliderEl = createMockNoUiSlider(0);
        sliderEl.noUiSlider.set(135);
        assert.equal(Number(sliderEl.noUiSlider.get()), 135);
    });
});
