#!/usr/bin/env node
/**
 * Tests for js/escTelemetry.js: the MSP2_INAV_ESC_TELEM decoder and the
 * check that decides whether the Outputs tab polls it at all.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEscTelemetry, escTelemetryExpected, ESC_DATA_MAX_AGE, ESC_DATA_INVALID } from '../js/escTelemetry.js';

function buildPayload(motors) {
    const view = new DataView(new ArrayBuffer(1 + motors.length * 16));

    view.setUint8(0, motors.length);
    motors.forEach((motor, index) => {
        const base = 1 + index * 16;
        view.setUint8(base, motor.dataAge);
        view.setInt16(base + 2, motor.temperature, true);
        view.setInt16(base + 4, motor.voltage, true);
        view.setInt32(base + 8, motor.current, true);
        view.setUint32(base + 12, motor.rpm, true);
    });

    return view;
}

test('decodes a literal escSensorData_t with its padding bytes', () => {
    // count, then dataAge, pad, temperature, voltage, pad, pad, current, rpm (little endian)
    const bytes = Uint8Array.from([
        0x01,
        0x02, 0xAA, 0x2D, 0x00, 0x74, 0x06, 0xAA, 0xAA,
        0xD2, 0x04, 0x00, 0x00, 0x39, 0x30, 0x00, 0x00,
    ]);

    assert.deepEqual(parseEscTelemetry(new DataView(bytes.buffer)), [
        { dataAge: 2, valid: true, temperature: 45, voltage: 16.52, current: 12.34, rpm: 12345 },
    ]);
});

test('decodes several motors and scales the units', () => {
    const motors = parseEscTelemetry(buildPayload([
        { dataAge: 0, temperature: 42, voltage: 2380, current: 1250, rpm: 8100 },
        { dataAge: 3, temperature: -5, voltage: 2379, current: 0, rpm: 0 },
    ]));

    assert.equal(motors.length, 2);
    assert.deepEqual(motors[0], { dataAge: 0, valid: true, temperature: 42, voltage: 23.8, current: 12.5, rpm: 8100 });
    assert.deepEqual(motors[1], { dataAge: 3, valid: true, temperature: -5, voltage: 23.79, current: 0, rpm: 0 });
});

test('flags motors whose frames are too old, matching the firmware threshold', () => {
    const motors = parseEscTelemetry(buildPayload([
        { dataAge: ESC_DATA_MAX_AGE, temperature: 1, voltage: 1, current: 1, rpm: 1 },
        { dataAge: ESC_DATA_MAX_AGE + 1, temperature: 1, voltage: 1, current: 1, rpm: 1 },
        { dataAge: ESC_DATA_INVALID, temperature: 0, voltage: 0, current: 0, rpm: 0 },
    ]));

    assert.equal(motors[0].valid, true);
    assert.equal(motors[1].valid, false);
    assert.equal(motors[2].valid, false);
});

test('returns an empty list for zero motors and null for payloads it cannot interpret', () => {
    assert.deepEqual(parseEscTelemetry(buildPayload([])), []);
    assert.equal(parseEscTelemetry(null), null);
    assert.equal(parseEscTelemetry(new DataView(new ArrayBuffer(0))), null);

    // motor count says 2 but only one entry follows
    const truncated = buildPayload([{ dataAge: 0, temperature: 0, voltage: 0, current: 0, rpm: 0 }]);
    truncated.setUint8(0, 2);
    assert.equal(parseEscTelemetry(truncated), null);

    // an entry size other than sizeof(escSensorData_t)
    const odd = new DataView(new ArrayBuffer(1 + 13));
    odd.setUint8(0, 1);
    assert.equal(parseEscTelemetry(odd), null);
});

test('expects telemetry only with an ESC port, motor output enabled and no SRXL2 protocol', () => {
    const escPort = [{ functions: ['MSP'] }, { functions: ['ESC'] }];
    const DSHOT600 = 6, SRXL2 = 7;

    assert.equal(escTelemetryExpected(escPort, true, DSHOT600), true);
    // firmware leaves dataAge at 0 when motor output is off, which would read as live zeros
    assert.equal(escTelemetryExpected(escPort, false, DSHOT600), false);
    assert.equal(escTelemetryExpected([{ functions: ['MSP'] }], true, DSHOT600), false);
    assert.equal(escTelemetryExpected(undefined, true, DSHOT600), false);
    // Smart ESC telemetry is not shown yet
    assert.equal(escTelemetryExpected(escPort, true, SRXL2), false);
    assert.equal(escTelemetryExpected([{ functions: ['ESC_SRXL2'] }], true, String(SRXL2)), false);
});
