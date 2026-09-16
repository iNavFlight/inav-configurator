#!/usr/bin/env node
/**
 * Tests for parseDronecanAsyncRequestResponse() (PR #2671 Qodo review
 * Finding 5).
 *
 * The old MSPHelper.js parser only updated FC.DRONECAN_ASYNC_REQUEST when
 * byteLength >= 2, leaving a *previous* request's status/seq in place on a
 * short/status-only/zero-length response. dronecanAsyncPoll() reads these
 * immediately to decide whether to keep polling and what seq to expect, so
 * a stale seq here could match against the wrong request.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDronecanAsyncRequestResponse } from '../js/dronecanAsyncRequestParse.js';

function dataViewOf(bytes) {
    return new DataView(new Uint8Array(bytes).buffer);
}

test('parses status and seq from a full 2-byte response', () => {
    const result = parseDronecanAsyncRequestResponse(dataViewOf([0, 7]));
    assert.deepEqual(result, { status: 0, seq: 7 });
});

test('parses only status from a 1-byte response, seq stays undefined', () => {
    const result = parseDronecanAsyncRequestResponse(dataViewOf([1]));
    assert.deepEqual(result, { status: 1, seq: undefined });
});

test('returns both fields undefined for a zero-length response', () => {
    const result = parseDronecanAsyncRequestResponse(dataViewOf([]));
    assert.deepEqual(result, { status: undefined, seq: undefined });
});

test('never carries over a value from a previous call (fresh object every time)', () => {
    const first = parseDronecanAsyncRequestResponse(dataViewOf([0, 42]));
    assert.deepEqual(first, { status: 0, seq: 42 });

    const second = parseDronecanAsyncRequestResponse(dataViewOf([]));
    assert.deepEqual(second, { status: undefined, seq: undefined });
    // Confirms the two results are independent objects, not one mutated in place.
    assert.equal(first.seq, 42);
});
