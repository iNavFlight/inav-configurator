#!/usr/bin/env node
/**
 * The OSD tab's layout helpers: which switch or logic condition can show each layout in flight,
 * and copying the element positions of one layout to the others.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutReach, positionsToCopy } from '../js/osdLayouts.js';

function modeRange(id, aux, start, end) {
    return { id: id, auxChannelIndex: aux, range: { start: start, end: end } };
}

function condition(enabled, operation, operandAType, operandAValue) {
    return { enabled: enabled, operation: operation, operandAType: operandAType, operandAValue: operandAValue };
}

test('only the default layout shows without OSD ALT ranges or logic conditions', () => {
    const reach = layoutReach([modeRange(0, 0, 1700, 2100)], [], 4);
    assert.deepEqual(reach.reached, [true, false, false, false]);
    assert.deepEqual(reach.picks, []);
});

test('an OSD ALT range reaches its layout; an empty range does not', () => {
    const reach = layoutReach([
        modeRange(42, 1, 1700, 2100),
        modeRange(43, 2, 900, 900),
        modeRange(44, 2, 1300, 1700)
    ], [], 4);
    assert.deepEqual(reach.reached, [true, true, false, true]);
    assert.equal(reach.ranges[1].length, 1);
    assert.equal(reach.ranges[2].length, 0);
});

test('a logic condition setting a fixed layout reaches only that one', () => {
    const reach = layoutReach([], [
        condition(true, 0, 0, 0),
        condition(true, 32, 0, 2),
        condition(false, 32, 0, 3)
    ], 4);
    assert.deepEqual(reach.reached, [true, false, true, false]);
    assert.deepEqual(reach.picks, [{ index: 1, layout: 2 }]);
});

test('a fixed layout beyond the last one reaches the last, as the firmware clamps it', () => {
    const reach = layoutReach([], [condition(true, 32, 0, 7)], 4);
    assert.deepEqual(reach.reached, [true, false, false, true]);
    assert.deepEqual(reach.picks, [{ index: 0, layout: 3 }]);
});

test('a logic condition taking the layout from a value may reach any', () => {
    const reach = layoutReach([], [condition(true, 32, 5, 1)], 4);
    assert.deepEqual(reach.reached, [true, true, true, true]);
    assert.deepEqual(reach.picks, [{ index: 0, layout: null }]);
});

const at = (x, y, isVisible) => ({ x: x, y: y, position: y * 30 + x, isVisible: isVisible });
const to = (layout, id, x, y) => ({ layout: layout, id: id, x: x, y: y, position: y * 30 + x });

test('copying positions lists every element of the other layouts that is elsewhere', () => {
    const layouts = [
        [at(1, 1, true), at(5, 2, true)],
        [at(1, 4, false), at(9, 9, false)],
        [at(3, 3, true), at(5, 2, true)]
    ];
    assert.deepEqual(positionsToCopy(layouts, 0), [to(1, 0, 1, 1), to(1, 1, 5, 2), to(2, 0, 1, 1)]);
});

test('the layouts stay as they are, so a failed write can be tried again', () => {
    const layouts = [
        [at(1, 1, true)],
        [at(6, 6, true)]
    ];
    const first = positionsToCopy(layouts, 0);
    assert.deepEqual(layouts[1][0], at(6, 6, true));
    assert.deepEqual(positionsToCopy(layouts, 0), first);
});

test('an element hidden in the source layout keeps its position everywhere else', () => {
    const layouts = [
        [at(0, 0, false)],
        [at(7, 3, true)]
    ];
    assert.deepEqual(positionsToCopy(layouts, 0), []);
});
