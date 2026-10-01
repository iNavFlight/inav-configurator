#!/usr/bin/env node
/**
 * The OSD tab's layout helpers: copying the element positions of one layout to the others.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { positionsToCopy } from '../js/osdLayouts.js';

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
