#!/usr/bin/env node
/**
 * Direct unit tests for js/mspWriteOutcome.js - the shared write-outcome
 * handling used by mspHelper.setSetting(), OSD.saveItem(), and the LED
 * strip send chain (sendLedStripConfig/sendLedStripColors/
 * sendLedStripModeColors). No stubbing needed: the module has no imports
 * of its own, so it's imported directly rather than mirrored.
 *
 * Background: the MSP send queue resolves/calls back with the literal
 * false when it gives up retrying a write (congestion drop), rather than
 * rejecting or erroring - callers that don't check for that treat a write
 * that never reached the flight controller the same as one that did.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMspWrite, guardMspCallback } from '../js/mspWriteOutcome.js';

test('resolveMspWrite resolves true and runs the callback when the write lands', async () => {
    let ran = false;
    const landed = await resolveMspWrite(Promise.resolve({ data: 'ack' }), () => { ran = true; });

    assert.equal(landed, true);
    assert.equal(ran, true);
});

test('resolveMspWrite resolves false and skips the callback on a rejected write', async () => {
    let ran = false;
    const landed = await resolveMspWrite(Promise.reject(new Error('refused')), () => { ran = true; });

    assert.equal(landed, false);
    assert.equal(ran, false);
});

test('resolveMspWrite resolves false and skips the callback when the queue drops the write', async () => {
    let ran = false;
    const landed = await resolveMspWrite(Promise.resolve(false), () => { ran = true; });

    assert.equal(landed, false, 'a dropped write must not be reported as landed');
    assert.equal(ran, false, 'the success callback must not run for a write that never landed');
});

test('resolveMspWrite propagates an exception thrown by the callback', async () => {
    await assert.rejects(
        resolveMspWrite(Promise.resolve({}), () => { throw new Error('chain bug'); }),
        /chain bug/
    );
});

test('guardMspCallback invokes the wrapped callback for a real response', () => {
    let received;
    const wrapped = guardMspCallback((result) => { received = result; });

    wrapped({ some: 'response' });

    assert.deepEqual(received, { some: 'response' });
});

test('guardMspCallback skips the wrapped callback when the queue drops the write', () => {
    let ran = false;
    const wrapped = guardMspCallback(() => { ran = true; });

    wrapped(false);

    assert.equal(ran, false, 'a dropped write must not advance a chained send');
});

test('guardMspCallback tolerates a missing onFinish', () => {
    assert.doesNotThrow(() => guardMspCallback(undefined)(false));
    assert.doesNotThrow(() => guardMspCallback(undefined)({}));
});
