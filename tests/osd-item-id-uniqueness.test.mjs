#!/usr/bin/env node
/**
 * Regression test for two OSD elements sharing the same wire-protocol id.
 *
 * tabs/osd.js's ALL_DISPLAY_GROUPS table's `id` field is the element's
 * osd_items_e ordinal from the firmware, per the table's own comment ("do not
 * remove elements, only add!"). OSD_TERRAIN_AGL and MZTC_STATUS were both
 * hand-assigned id 171 because each was written against a firmware branch
 * where it was the last element defined - neither branch had the other's
 * addition yet. Once both landed on the same firmware branch (maintenance-10.x
 * gained BOXMZTCCALIBRATE/OSD_MZTC_STATUS after OSD_TERRAIN_AGL was already
 * there), the firmware enum put them at 171 and 172, but this file still had
 * both at 171: OSD_TERRAIN_AGL rendered correctly and MZTC_STATUS silently
 * displayed whatever OSD_TERRAIN_AGL's payload happened to be (or vice versa,
 * depending on layout item lookup order).
 *
 * This does not drive the real tabs/osd.js (see tests/msp-parse-failure-
 * recovery.test.mjs for why: Vite-style extensionless imports and a full
 * Electron/jQuery environment the plain Node test runner doesn't have). It
 * reads the source text and extracts every `id: N` inside the
 * ALL_DISPLAY_GROUPS table, the same way a reviewer would, and asserts none
 * repeat.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const osdSource = readFileSync(path.join(__dirname, '../tabs/osd.js'), 'utf8');

function extractAllDisplayGroupIds(source) {
    const start = source.indexOf('ALL_DISPLAY_GROUPS: [');
    assert.notEqual(start, -1, 'ALL_DISPLAY_GROUPS table not found - has it been renamed?');

    // Find the matching closing bracket for the array that opens right after
    // the colon, by bracket depth, so we don't need to know the table's length.
    const arrayStart = source.indexOf('[', start);
    let depth = 0;
    let end = -1;
    for (let i = arrayStart; i < source.length; i++) {
        if (source[i] === '[') depth++;
        else if (source[i] === ']') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    assert.notEqual(end, -1, 'Could not find the end of ALL_DISPLAY_GROUPS - unbalanced brackets?');

    const block = source.slice(arrayStart, end);
    const ids = [];
    for (const m of block.matchAll(/\bid:\s*(\d+)/g)) {
        ids.push(Number(m[1]));
    }
    return ids;
}

test('every OSD element in ALL_DISPLAY_GROUPS has a unique id', () => {
    const ids = extractAllDisplayGroupIds(osdSource);

    // Sanity check the extractor itself isn't silently matching nothing.
    assert.ok(ids.length > 100, `expected a large OSD item table, only found ${ids.length} ids`);

    const seen = new Map();
    const duplicates = [];
    for (const id of ids) {
        seen.set(id, (seen.get(id) || 0) + 1);
    }
    for (const [id, count] of seen) {
        if (count > 1) duplicates.push(`id ${id} used ${count} times`);
    }

    assert.deepEqual(duplicates, [], `duplicate OSD element ids found: ${duplicates.join(', ')}`);
});
