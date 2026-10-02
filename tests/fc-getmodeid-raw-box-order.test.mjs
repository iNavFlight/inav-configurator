#!/usr/bin/env node
/**
 * Regression test for FC.getModeId() resolving the wrong CONFIG.mode bit
 * position when an unrecognized flight mode precedes ARM/FAILSAFE in the
 * firmware's raw MSP_BOXIDS delivery order.
 *
 * Bug: FC.getModeId(name) used to find `name` in FC.AUX_CONFIG - the
 * *filtered* display list built by generateAuxConfig(), which drops entries
 * for permanentIds the local js/flightModes.js table doesn't recognize (e.g.
 * a newer firmware feature the configurator build predates) - and returned
 * that array's index as if it were the bit position firmware would use for
 * that mode in CONFIG.mode. But firmware's packBoxModeFlags()
 * (inav src/main/fc/fc_msp_box.c) sets CONFIG.mode bit i for the i-th entry
 * of the RAW, UNFILTERED activeBoxIds[] list - the same order MSP_BOXIDS
 * delivers, before the configurator drops anything. So whenever an
 * unrecognized mode appeared before ARM or FAILSAFE in that raw order, the
 * filtered list's index for ARM/FAILSAFE was smaller than their true bit
 * position, and getModeId() returned the wrong bit index -
 * FC.isModeEnabled('ARM') / ('FAILSAFE') could then report the wrong
 * armed/failsafe state in the GUI (periodicStatusUpdater.js, tabs/outputs.js).
 *
 * Fix under test: getModeId() now looks up `name` in FLIGHT_MODES to get its
 * permanentId, then returns FC.AUX_CONFIG_IDS_RAW.indexOf(permanentId) -
 * FC.AUX_CONFIG_IDS_RAW being the raw, unfiltered id list captured by
 * generateAuxConfig() before filtering - so the returned index always
 * matches firmware's real bit position regardless of what gets filtered out
 * of the display list.
 *
 * The test below executes the REAL production js/fc.js plus the REAL
 * js/flightModes.js and REAL js/bitHelper.js (bitHelper has no imports of
 * its own and its actual bit_check() logic - not a stub - is required here,
 * since the assertions depend on real bit arithmetic against CONFIG.mode).
 * This mirrors the approach in tests/fc-generate-aux-config.test.mjs and
 * tests/cli-tab-msp-polling.test.mjs: plain Node's ESM resolver can't load
 * this codebase's Vite-style extensionless relative imports, so the file is
 * read fresh off disk and only its *import specifiers* are rewritten. No
 * js/fc.js source file on disk is modified by this test.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRewriteAndWrite } from './helpers/rewriteAndWrite.mjs';
import { buildCommonFcImportRules } from './helpers/fcModuleLoader.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tmpDir = mkdtempSync(join(tmpdir(), 'fc-getmodeid-raw-box-order-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

const rewriteAndWrite = makeRewriteAndWrite(repoRoot, tmpDir, 'fc-getmodeid-raw-box-order.test.mjs');

const { realFlightModesUrl, commonImportRules } = buildCommonFcImportRules(repoRoot);

// The real, current (fixed) js/fc.js, imports rewritten only.
const fixedFcUrl = rewriteAndWrite('js/fc.js', commonImportRules, 'fc-fixed');
const { default: FC_fixed } = await import(fixedFcUrl);

// Also import the real FLIGHT_MODES table directly to look up permanentIds
// for building the scenario below without hand-duplicating box data.
const { FLIGHT_MODES } = await import(realFlightModesUrl);

const ARM_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'ARM').permanentId;
const FAILSAFE_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'FAILSAFE').permanentId;
const ANGLE_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'ANGLE').permanentId;

// Raw MSP_BOXIDS delivery order (as generateAuxConfig()/AUX_CONFIG_IDS_RAW
// would receive it): two permanentIds (9998, 9999) that this configurator
// build's FLIGHT_MODES table does NOT recognize are placed so that one
// unrecognized id precedes ARM and two unrecognized ids precede FAILSAFE -
// exactly the "unrecognized mode ahead of ARM/FAILSAFE in raw order" scenario
// that broke the old filtered-index-based lookup.
const RAW_BOX_IDS = [9999, ARM_PERMANENT_ID, 9998, FAILSAFE_PERMANENT_ID, ANGLE_PERMANENT_ID];
const RAW_ARM_INDEX = RAW_BOX_IDS.indexOf(ARM_PERMANENT_ID);           // 1
const RAW_FAILSAFE_INDEX = RAW_BOX_IDS.indexOf(FAILSAFE_PERMANENT_ID); // 3

test('test assumptions: FLIGHT_MODES permanentIds and derived indices match what the scenario expects', () => {
    assert.equal(ARM_PERMANENT_ID, 0, 'test assumption: ARM permanentId is 0');
    assert.equal(FAILSAFE_PERMANENT_ID, 27, 'test assumption: FAILSAFE permanentId is 27');
    assert.equal(RAW_ARM_INDEX, 1);
    assert.equal(RAW_FAILSAFE_INDEX, 3);
});

function setUpScenario(FC) {
    FC.resetState();
    FC.AUX_CONFIG_IDS = RAW_BOX_IDS.slice();
    FC.generateAuxConfig();

    // Simulate firmware's packBoxModeFlags(): set CONFIG.mode's bit at ARM's
    // RAW index (1), and leave FAILSAFE's RAW index (3) bit clear - i.e. the
    // firmware is reporting "armed, not in failsafe".
    FC.CONFIG.mode = [ (1 << RAW_ARM_INDEX) ];
}

test('generateAuxConfig() captures the raw, unfiltered MSP_BOXIDS order into AUX_CONFIG_IDS_RAW', () => {
    setUpScenario(FC_fixed);
    assert.deepEqual(FC_fixed.AUX_CONFIG_IDS_RAW, RAW_BOX_IDS);
    // Sanity: the filtered display list dropped the unrecognized ids, so it
    // is shorter than, and index-shifted relative to, the raw list.
    assert.deepEqual(FC_fixed.AUX_CONFIG, ['ARM', 'FAILSAFE', 'ANGLE']);
    assert.deepEqual(FC_fixed.AUX_CONFIG_IDS, [ARM_PERMANENT_ID, FAILSAFE_PERMANENT_ID, ANGLE_PERMANENT_ID]);
});

test('FIXED getModeId(): resolves ARM/FAILSAFE via raw box order, reports correct armed/failsafe state', () => {
    setUpScenario(FC_fixed);

    assert.equal(FC_fixed.getModeId('ARM'), RAW_ARM_INDEX, "getModeId('ARM') must return ARM's index in the RAW box order, not the filtered display list");
    assert.equal(FC_fixed.getModeId('FAILSAFE'), RAW_FAILSAFE_INDEX, "getModeId('FAILSAFE') must return FAILSAFE's index in the RAW box order");

    assert.equal(FC_fixed.isModeEnabled('ARM'), true, 'firmware set the bit at ARM\'s raw index - FC.isModeEnabled(\'ARM\') must report true (armed)');
    assert.equal(FC_fixed.isModeEnabled('FAILSAFE'), false, 'firmware did NOT set the bit at FAILSAFE\'s raw index - FC.isModeEnabled(\'FAILSAFE\') must report false');
});

test('positive control: with no unrecognized ids ahead of ARM/FAILSAFE, getModeId() still resolves correctly', () => {
    const rawIds = [ARM_PERMANENT_ID, FAILSAFE_PERMANENT_ID, ANGLE_PERMANENT_ID];

    FC_fixed.resetState();
    FC_fixed.AUX_CONFIG_IDS = rawIds.slice();
    FC_fixed.generateAuxConfig();
    FC_fixed.CONFIG.mode = [ (1 << 0) ]; // ARM (index 0 in both raw and filtered order here)

    assert.equal(FC_fixed.isModeEnabled('ARM'), true);
    assert.equal(FC_fixed.isModeEnabled('FAILSAFE'), false);
});
