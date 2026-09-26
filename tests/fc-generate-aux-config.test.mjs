#!/usr/bin/env node
/**
 * Regression tests for FC.generateAuxConfig() array desync.
 *
 * Bug: js/fc.js's generateAuxConfig() builds two parallel arrays describing
 * the flight controller's available aux/box modes: FC.AUX_CONFIG (display
 * names) and FC.AUX_CONFIG_IDS (permanentIds). The FC can report a
 * permanentId the local FLIGHT_MODES table (js/flightModes.js) doesn't
 * recognize (e.g. it's stale/out of date vs. the connected firmware). The
 * buggy version only pushed to AUX_CONFIG when the id was recognized, but
 * left AUX_CONFIG_IDS unfiltered - desyncing the two arrays' length/alignment
 * from that point onward. Downstream, tabs/auxiliary.js pairs AUX_CONFIG[i]
 * (name) with AUX_CONFIG_IDS[i] (id) by shared index i, assuming they stay
 * aligned. The desync meant every mode-select row after the first
 * unrecognized id displayed the WRONG name for the id it actually wrote to
 * MSP_SET_MODE_RANGE on save - a safety bug.
 *
 * Fix under test: generateAuxConfig() now filters BOTH AUX_CONFIG and
 * AUX_CONFIG_IDS identically - only pushes to AUX_CONFIG_IDS when a matching
 * entry is also pushed to AUX_CONFIG - so both arrays end up the same
 * length, index-aligned, and containing only recognized ids/names in
 * original relative order.
 *
 * The test below executes the REAL production js/fc.js and the REAL
 * js/flightModes.js. Like tests/connection-send-queue.test.mjs and
 * tests/cli-tab-msp-polling.test.mjs, plain Node's ESM resolver refuses to
 * load this codebase's Vite-style extensionless relative imports, so fc.js
 * is read fresh off disk and only its *import specifiers* are rewritten:
 * the heavy collection/model classes that generateAuxConfig() never touches
 * are pointed at trivial no-arg-constructible stubs (still exercised,
 * because FC.resetState() instantiates them, just not asserted on), and
 * './flightModes' is pointed directly at the real js/flightModes.js file on
 * disk (unmodified - it has no imports of its own). No statement,
 * expression or ordering inside generateAuxConfig() itself is touched.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRewriteAndWrite } from './helpers/rewriteAndWrite.mjs';
import { buildCommonFcImportRules, mockBitHelperUrl } from './helpers/fcModuleLoader.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tmpDir = mkdtempSync(join(tmpdir(), 'fc-generate-aux-config-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

const rewriteAndWrite = makeRewriteAndWrite(repoRoot, tmpDir, 'fc-generate-aux-config.test.mjs');

// BitHelper is stubbed here (rather than the real js/bitHelper.js) because
// these tests never assert on CONFIG.mode bit arithmetic - only on
// AUX_CONFIG/AUX_CONFIG_IDS array shape and alignment.
const { realFlightModesUrl, commonImportRules } = buildCommonFcImportRules(repoRoot, { bitHelperUrl: mockBitHelperUrl });

const realFcUrl = rewriteAndWrite('js/fc.js', commonImportRules, 'fc-generated');

const { default: FC } = await import(realFcUrl);

// Also import the real FLIGHT_MODES table directly so the test can compute
// its own expectations without duplicating box-name data.
const { FLIGHT_MODES } = await import(realFlightModesUrl);

function permanentIdToBoxName(id) {
    const entry = FLIGHT_MODES.find((mode) => mode.permanentId === id);
    return entry ? entry.boxName : undefined;
}

test('generateAuxConfig() keeps AUX_CONFIG and AUX_CONFIG_IDS the same length when the FC reports unrecognized permanentIds', () => {
    FC.resetState();

    // Simulate a stale local FLIGHT_MODES table: the FC (real firmware)
    // reports two permanentIds in a row (9990, 9991) that this build of the
    // configurator doesn't know about, sandwiched between ids it does
    // recognize. permanentIds 0/1/2/3 (ARM/ANGLE/HORIZON/NAV ALTHOLD) all
    // exist in js/flightModes.js; 9990/9991 deliberately do not.
    FC.AUX_CONFIG_IDS = [0, 9990, 9991, 1, 2, 9992, 3];

    FC.generateAuxConfig();

    assert.equal(
        FC.AUX_CONFIG.length,
        FC.AUX_CONFIG_IDS.length,
        'AUX_CONFIG and AUX_CONFIG_IDS must stay the same length - this is the invariant tabs/auxiliary.js relies on when pairing them by index'
    );

    // Only the recognized ids should have survived, in original relative order.
    assert.deepEqual(FC.AUX_CONFIG_IDS, [0, 1, 2, 3]);
    assert.deepEqual(FC.AUX_CONFIG, ['ARM', 'ANGLE', 'HORIZON', 'NAV ALTHOLD']);

    // The core correctness property: not just equal length, but that each
    // index's id and name actually still refer to the SAME flight mode.
    for (let i = 0; i < FC.AUX_CONFIG_IDS.length; i++) {
        const expectedName = permanentIdToBoxName(FC.AUX_CONFIG_IDS[i]);
        assert.notEqual(expectedName, undefined, `test setup error: id ${FC.AUX_CONFIG_IDS[i]} not found in FLIGHT_MODES`);
        assert.equal(
            FC.AUX_CONFIG[i],
            expectedName,
            `AUX_CONFIG[${i}] ("${FC.AUX_CONFIG[i]}") must be the boxName for AUX_CONFIG_IDS[${i}] (${FC.AUX_CONFIG_IDS[i]}), which is "${expectedName}"`
        );
    }
});

test('generateAuxConfig() positive control: an all-recognized id list passes through unchanged', () => {
    FC.resetState();
    FC.AUX_CONFIG_IDS = [0, 1, 2];

    FC.generateAuxConfig();

    assert.equal(FC.AUX_CONFIG.length, FC.AUX_CONFIG_IDS.length);
    assert.deepEqual(FC.AUX_CONFIG_IDS, [0, 1, 2]);
    assert.deepEqual(FC.AUX_CONFIG, ['ARM', 'ANGLE', 'HORIZON']);
});

test('generateAuxConfig() negative control: an all-unrecognized id list empties both arrays', () => {
    FC.resetState();
    FC.AUX_CONFIG_IDS = [9990, 9991, 9992];

    FC.generateAuxConfig();

    assert.equal(FC.AUX_CONFIG.length, 0);
    assert.equal(FC.AUX_CONFIG_IDS.length, 0);
});
