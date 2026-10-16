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
 * on a rejected write (never rejects, so fire-and-forget callers like
 * OSD.GUI.saveItem still don't produce an unhandled rejection). The paste/
 * clear loops check that return value, stop on the first failure, and log a
 * failure message instead of the success one.
 *
 * This file does not drive the real MSP transport or DOM. It imports the
 * production bulk-save helpers from js/osdBulkSave.js, the same functions the
 * paste/clear handlers in tabs/osd.js call. OSD.saveItem is stood in for by a
 * mock built the same way as the real one.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { changedItemIds, visibleItemIds, saveLayoutItems } from '../js/osdBulkSave.js';

// Mirrors the fixed tabs/osd.js `OSD.saveItem` body, parameterized on a mock
// MSP.promise() so tests can control which writes the "FC" refuses.
function createSaveItem(mspPromise) {
    return function saveItem(item, callback) {
        return mspPromise(item).then(function () {
            if (callback) {
                callback();
            }
            return true;
        }).catch(() => false);
    };
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

const item = (x, y, isVisible) => ({ x, y, position: y * 30 + x, isVisible });
const clone = (v) => JSON.parse(JSON.stringify(v));

test('changedItemIds skips entries hidden before and after, and unmoved ones', () => {
    const oldLayout = [item(1, 1, true), item(2, 2, false), item(3, 3, true), item(4, 4, false)];
    const newLayout = [item(1, 1, true), item(9, 9, false), item(5, 3, true), item(4, 4, true)];

    assert.deepEqual(changedItemIds(oldLayout, newLayout), ['2', '3']);
});

test('visibleItemIds lists only visible entries', () => {
    assert.deepEqual(visibleItemIds([item(0, 0, true), item(1, 1, false), item(2, 2, true)]), ['0', '2']);
});

test('saveLayoutItems writes every id and keeps the layout when all writes land', async () => {
    const oldLayout = [item(0, 0, true), item(1, 1, true), item(2, 2, true)];
    const layout = oldLayout.map((i) => ({ ...i, isVisible: false }));
    const attempted = [];
    const saveItem = async ({ id }) => { attempted.push(id); return true; };

    assert.equal(await saveLayoutItems(layout, oldLayout, ['0', '1', '2'], saveItem), true);
    assert.deepEqual(attempted, ['0', '1', '2']);
    assert.ok(layout.every((i) => i.isVisible === false));
});

test('saveLayoutItems stops at a refused write and restores it and the unattempted entries', async () => {
    const oldLayout = [item(0, 0, true), item(1, 1, true), item(2, 2, true), item(3, 3, true)];
    const layout = oldLayout.map((i) => ({ ...i, isVisible: false }));
    const attempted = [];
    const saveItem = async ({ id }) => { attempted.push(id); return id !== '1'; };

    assert.equal(await saveLayoutItems(layout, oldLayout, ['0', '1', '2', '3'], saveItem), false);
    assert.deepEqual(attempted, ['0', '1']);
    assert.equal(layout[0].isVisible, false, 'the entry that landed stays applied');
    assert.deepEqual(layout.slice(1), oldLayout.slice(1), 'refused and unattempted entries are put back');
});

test('saveLayoutItems restores copies so the layout never aliases oldLayout', async () => {
    const oldLayout = [item(0, 0, true)];
    const layout = [item(5, 5, true)];

    await saveLayoutItems(layout, oldLayout, ['0'], async () => false);
    layout[0].x = 99;

    assert.equal(oldLayout[0].x, 0);
});

test('a retry after a failed save writes the entries that were not persisted', async () => {
    const oldLayout = [item(0, 0, true), item(1, 1, true)];
    const requested = oldLayout.map((i) => ({ ...i, isVisible: false }));
    const layout = clone(requested);

    await saveLayoutItems(layout, oldLayout, visibleItemIds(oldLayout), async ({ id }) => id !== '1');
    assert.deepEqual(changedItemIds(layout, requested), ['1']);
});
