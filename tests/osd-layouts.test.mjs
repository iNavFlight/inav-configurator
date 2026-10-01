#!/usr/bin/env node
/**
 * The OSD tab's layout helpers: copying the element positions of one layout to the others.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyPositions } from '../js/osdLayouts.js';

test('copying positions moves the other layouts, keeps what they show, and lists the changes', () => {
    const at = (x, y, isVisible) => ({ x: x, y: y, position: y * 30 + x, isVisible: isVisible });
    const layouts = [
        [at(1, 1, true), at(5, 2, true)],
        [at(1, 4, false), at(9, 9, false)],
        [at(3, 3, true), at(5, 2, true)]
    ];
    const changed = copyPositions(layouts, 0);
    assert.deepEqual(changed, [{ layout: 1, id: 0 }, { layout: 1, id: 1 }, { layout: 2, id: 0 }]);
    assert.deepEqual(layouts[1][0], at(1, 1, false));
    assert.deepEqual(layouts[1][1], at(5, 2, false));
    assert.deepEqual(layouts[2][0], at(1, 1, true));
    assert.deepEqual(layouts[0], [at(1, 1, true), at(5, 2, true)]);
});

test('an element hidden in the source layout keeps its position everywhere else', () => {
    const at = (x, y, isVisible) => ({ x: x, y: y, position: y * 30 + x, isVisible: isVisible });
    const layouts = [
        [at(0, 0, false)],
        [at(7, 3, true)]
    ];
    assert.deepEqual(copyPositions(layouts, 0), []);
    assert.deepEqual(layouts[1][0], at(7, 3, true));
});
