#!/usr/bin/env node
/**
 * Regression tests for the "surface a refused OSD write instead of reporting
 * success" fix in tabs/osd.js.
 *
 * Background: OSD.saveItem() wrapped MSP.promise(...).then(callback) in a
 * .catch(() => {}) that swallowed a rejected write and resolved anyway. The
 * paste/clear layout handlers `await` each OSD.saveItem() call in a loop and
 * then unconditionally logged a success message - so a write the flight
 * controller refused was silently treated as applied, and the loop kept
 * going instead of stopping.
 *
 * Fix under test: OSD.saveItem() now resolves `true` on success and `false`
 * both on a rejected write and on a write the MSP queue resolved with `false`
 * after exhausting its retries (never rejects for either case, so
 * fire-and-forget callers like OSD.GUI.saveItem still don't produce an
 * unhandled rejection there). The paste/clear loops check that return value,
 * stop on the first failure, and log a failure message instead of the
 * success one. An exception thrown by the success callback is a separate
 * failure mode and is no longer swallowed as if it were a refused write.
 *
 * This file does not drive the real MSP transport or DOM (see
 * tests/magnetometer-slider.test.mjs for the established pattern), so
 * OSD.saveItem()'s own item lookup and MSP payload encoding aren't
 * exercised here. Its write-outcome handling is: it imports the real,
 * production `resolveMspWrite()` from js/mspWriteOutcome.js - the same
 * function tabs/osd.js itself calls - so a regression in that shared logic
 * fails here too, rather than only in a hand-copied mirror of it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveMspWrite } from '../js/mspWriteOutcome.js';

// Stands in for tabs/osd.js's `OSD.saveItem(item, callback)`, parameterized
// on a mock MSP.promise() so tests can control which writes the "FC"
// refuses or drops, while using the real resolveMspWrite() production code.
function createSaveItem(mspPromise) {
    return function saveItem(item, callback) {
        return resolveMspWrite(mspPromise(item), callback);
    };
}

// Mirrors the fixed `paste`/`clear` click-handler loop shape: await each
// saveItem() call, stop on the first failure, and pick success vs. failure
// message based on whether every item saved.
async function runSaveLoop(saveItem, ids) {
    var allSaved = true;
    for (const id of ids) {
        if (!(await saveItem({ id }))) {
            allSaved = false;
            break;
        }
    }
    return allSaved ? 'success-message' : 'failure-message';
}

test('OSD.saveItem resolves true and runs the callback when the write succeeds', async () => {
    let callbackRan = false;
    const saveItem = createSaveItem(() => Promise.resolve());

    const result = await saveItem({ id: 0 }, () => { callbackRan = true; });

    assert.equal(result, true);
    assert.equal(callbackRan, true);
});

test('OSD.saveItem resolves false (not rejected) and skips the callback when the FC refuses the write', async () => {
    const saveItem = createSaveItem(() => Promise.reject(new Error('refused')));

    // Must not throw/reject - a fire-and-forget caller with no .catch must
    // never see an unhandled rejection.
    const result = await saveItem({ id: 0 }, () => {
        throw new Error('callback must not run on a refused write');
    });

    assert.equal(result, false);
});

test('OSD.saveItem resolves false (not true) when the queue drops the write after exhausting retries', async () => {
    // The MSP queue resolves (rather than rejects) with `false` when it gives
    // up retrying - a congestion drop, not a rejected write.
    let callbackRan = false;
    const saveItem = createSaveItem(() => Promise.resolve(false));

    const result = await saveItem({ id: 0 }, () => { callbackRan = true; });

    assert.equal(result, false, 'a dropped write must not be reported as saved');
    assert.equal(callbackRan, false, 'the success callback must not run for a write that never landed');
});

test('OSD.saveItem propagates an exception thrown by the success callback instead of reporting a refused write', async () => {
    const saveItem = createSaveItem(() => Promise.resolve());

    await assert.rejects(
        saveItem({ id: 0 }, () => { throw new Error('preview render bug'); }),
        /preview render bug/,
        'a bug in the callback must surface, not look identical to a refused write'
    );
});

test('paste/clear loop stops at the first refused write and reports failure', async () => {
    const refusedId = 2;
    const attempted = [];
    const saveItem = createSaveItem((item) => {
        attempted.push(item.id);
        return item.id === refusedId ? Promise.reject(new Error('refused')) : Promise.resolve();
    });

    const message = await runSaveLoop(saveItem, [0, 1, 2, 3, 4]);

    assert.equal(message, 'failure-message');
    // Items after the refused one must never be attempted.
    assert.deepEqual(attempted, [0, 1, 2]);
});

test('paste/clear loop reports success only when every write succeeds', async () => {
    const attempted = [];
    const saveItem = createSaveItem((item) => {
        attempted.push(item.id);
        return Promise.resolve();
    });

    const message = await runSaveLoop(saveItem, [0, 1, 2]);

    assert.equal(message, 'success-message');
    assert.deepEqual(attempted, [0, 1, 2]);
});
