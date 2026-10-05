#!/usr/bin/env node
/**
 * Tests for shouldRetryBusyRequest(), the DroneCAN async request retry
 * predicate (PR #2671 Qodo review Finding 2).
 *
 * The FC's async request slot is a single shared resource; BUSY is a
 * normal, expected outcome when something else (e.g. background node-name
 * fetching) is using it, not a terminal error. dronecanAsyncPoll() in
 * tabs/dronecan.js imports and calls this exact function to decide whether
 * to retry an initial request instead of failing immediately.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    DRONECAN_ASYNC_REQUEST_STATUS_OK,
    DRONECAN_ASYNC_REQUEST_STATUS_BUSY,
    shouldRetryBusyRequest,
} from '../js/dronecanAsyncRetry.js';

test('retries when status is BUSY and attempts remain', () => {
    assert.equal(shouldRetryBusyRequest(DRONECAN_ASYNC_REQUEST_STATUS_BUSY, 0, 34), true);
    assert.equal(shouldRetryBusyRequest(DRONECAN_ASYNC_REQUEST_STATUS_BUSY, 33, 34), true);
});

test('stops retrying once attempts are exhausted', () => {
    assert.equal(shouldRetryBusyRequest(DRONECAN_ASYNC_REQUEST_STATUS_BUSY, 34, 34), false);
    assert.equal(shouldRetryBusyRequest(DRONECAN_ASYNC_REQUEST_STATUS_BUSY, 35, 34), false);
});

test('does not retry a non-BUSY status, regardless of attempts', () => {
    assert.equal(shouldRetryBusyRequest(DRONECAN_ASYNC_REQUEST_STATUS_OK, 0, 34), false);
    assert.equal(shouldRetryBusyRequest(undefined, 0, 34), false);
    assert.equal(shouldRetryBusyRequest(3 /* not_ready sentinel */, 0, 34), false);
});
