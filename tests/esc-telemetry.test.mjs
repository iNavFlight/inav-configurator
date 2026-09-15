#!/usr/bin/env node
/**
 * Tests for parseEscTelemetry() (js/escTelemetry.js), the decoder for the
 * MSP2_INAV_ESC_TELEM reply shown in the Outputs tab.
 *
 * The firmware serialises escSensorData_t verbatim, padding included, so the
 * decoder has to cope with the 16-byte padded layout that every current
 * target produces. The packed 13-byte variant is covered too so a firmware
 * that ever drops the padding keeps working.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEscTelemetry, ESC_DATA_MAX_AGE, ESC_DATA_INVALID } from '../js/escTelemetry.js';

function buildPayload(motors, packed) {
    const entrySize = packed ? 13 : 16;
    const offsets = packed
        ? { temperature: 1, voltage: 3, current: 5, rpm: 9 }
        : { temperature: 2, voltage: 4, current: 8, rpm: 12 };
    const view = new DataView(new ArrayBuffer(1 + motors.length * entrySize));

    view.setUint8(0, motors.length);
    motors.forEach((motor, index) => {
        const base = 1 + index * entrySize;
        view.setUint8(base, motor.dataAge);
        view.setInt16(base + offsets.temperature, motor.temperature, true);
        view.setInt16(base + offsets.voltage, motor.voltage, true);
        view.setInt32(base + offsets.current, motor.current, true);
        view.setUint32(base + offsets.rpm, motor.rpm, true);
    });

    return view;
}

test('decodes the padded escSensorData_t layout and scales the units', () => {
    const view = buildPayload([
        { dataAge: 0, temperature: 42, voltage: 2380, current: 1250, rpm: 8100 },
        { dataAge: 3, temperature: -5, voltage: 2379, current: 0, rpm: 0 },
    ], false);

    const motors = parseEscTelemetry(view);

    assert.equal(motors.length, 2);
    assert.deepEqual(motors[0], { dataAge: 0, valid: true, temperature: 42, voltage: 23.8, current: 12.5, rpm: 8100 });
    assert.deepEqual(motors[1], { dataAge: 3, valid: true, temperature: -5, voltage: 23.79, current: 0, rpm: 0 });
});

test('decodes a packed 13-byte layout identically', () => {
    const sample = [{ dataAge: 1, temperature: 30, voltage: 1650, current: 420, rpm: 12345 }];

    assert.deepEqual(parseEscTelemetry(buildPayload(sample, true)), parseEscTelemetry(buildPayload(sample, false)));
});

test('flags motors whose frames are too old, matching the firmware threshold', () => {
    const motors = parseEscTelemetry(buildPayload([
        { dataAge: ESC_DATA_MAX_AGE, temperature: 1, voltage: 1, current: 1, rpm: 1 },
        { dataAge: ESC_DATA_MAX_AGE + 1, temperature: 1, voltage: 1, current: 1, rpm: 1 },
        { dataAge: ESC_DATA_INVALID, temperature: 0, voltage: 0, current: 0, rpm: 0 },
    ], false));

    assert.equal(motors[0].valid, true);
    assert.equal(motors[1].valid, false);
    assert.equal(motors[2].valid, false);
});

test('returns an empty list for zero motors and null for payloads it cannot interpret', () => {
    assert.deepEqual(parseEscTelemetry(buildPayload([], false)), []);
    assert.equal(parseEscTelemetry(null), null);
    assert.equal(parseEscTelemetry(new DataView(new ArrayBuffer(0))), null);

    // motor count says 2 but only one padded entry follows
    const truncated = buildPayload([{ dataAge: 0, temperature: 0, voltage: 0, current: 0, rpm: 0 }], false);
    truncated.setUint8(0, 2);
    assert.equal(parseEscTelemetry(truncated), null);

    // an entry size that is neither padded nor packed
    const odd = new DataView(new ArrayBuffer(1 + 10));
    odd.setUint8(0, 1);
    assert.equal(parseEscTelemetry(odd), null);
});
