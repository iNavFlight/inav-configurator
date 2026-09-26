#!/usr/bin/env node
/**
 * Regression tests for FC.resetState() failing to clear stale
 * AUX_CONFIG/AUX_CONFIG_IDS/AUX_CONFIG_IDS_RAW on reconnect, plus the related
 * isModeEnabled(-1) landmine in the old isModeEnabled() implementation.
 *
 * Bug (flagged by a Qodo Merge review of PR #2802): generateAuxConfig() only
 * runs from the MSP_BOXIDS response callback in js/serial_backend.js
 * (onConnect). If that MSP request ever times out or fails on reconnect
 * (e.g. connecting to a different physical FC, or a transient serial glitch
 * on just that one command), FC.AUX_CONFIG / AUX_CONFIG_IDS /
 * AUX_CONFIG_IDS_RAW kept whatever they held from the PREVIOUS connection,
 * because resetState() never cleared them - while FC.CONFIG.mode gets reset
 * and freshly repopulated by ongoing status polling regardless of whether
 * MSP_BOXIDS succeeded. So FC.getModeId()/FC.isModeEnabled() could resolve a
 * mode's bit position against a stale PRIOR connection's box layout instead
 * of the current one - e.g. misreporting ARM/FAILSAFE state after a
 * reconnect with a dropped BOXIDS response.
 *
 * A second, related landmine: the old isModeEnabled() called
 * this.isModeBitSet(this.getModeId(name)) unconditionally, even when
 * getModeId() returned -1 (mode not found / not resolvable). isModeBitSet(-1)
 * computes BitHelper.bit_check(CONFIG.mode[Math.trunc(-1/32)], -1 % 32).
 * JS's `%` preserves the sign of the dividend, so -1 % 32 is -1, not 31; and
 * `1 << bit` masks the shift amount to 5 bits, so `1 << -1` is `1 << 31`
 * (0x80000000). Math.trunc(-1/32) is -0, which array-indexes the same as 0.
 * The net effect: isModeBitSet(-1) actually tests bit 31 of CONFIG.mode[0]
 * instead of cleanly failing - so any unresolvable mode name spuriously
 * reported enabled/disabled based on whatever happened to occupy that
 * unrelated bit.
 *
 * Fix under test (both in js/fc.js):
 *   1. resetState() now clears AUX_CONFIG / AUX_CONFIG_IDS /
 *      AUX_CONFIG_IDS_RAW at the top of the function, so between a reset and
 *      the next successful generateAuxConfig() call these arrays are empty
 *      (getModeId() resolves to -1) rather than stale.
 *   2. isModeEnabled(name) now checks getModeId(name) for a negative result
 *      and returns false immediately in that case, instead of ever calling
 *      isModeBitSet(-1).
 *
 * Like tests/fc-getmodeid-raw-box-order.test.mjs and
 * tests/fc-generate-aux-config.test.mjs, this test executes the REAL
 * production js/fc.js plus the REAL js/flightModes.js and REAL
 * js/bitHelper.js (bitHelper's actual bit_check() logic - not a stub - is
 * required here, since the isModeBitSet(-1) landmine is a real bit-arithmetic
 * quirk, not a stand-in behavior). No js/fc.js source file on disk is
 * modified by this test.
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

const tmpDir = mkdtempSync(join(tmpdir(), 'fc-resetstate-clears-stale-aux-config-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

const rewriteAndWrite = makeRewriteAndWrite(repoRoot, tmpDir, 'fc-resetstate-clears-stale-aux-config.test.mjs');

const { realFlightModesUrl, commonImportRules } = buildCommonFcImportRules(repoRoot);

// The real, current (fixed) js/fc.js, imports rewritten only.
const fixedFcUrl = rewriteAndWrite('js/fc.js', commonImportRules, 'fc-fixed');
const { default: FC_fixed } = await import(fixedFcUrl);

// Also import the real FLIGHT_MODES table directly to look up permanentIds
// for building the scenario below without hand-duplicating box data.
const { FLIGHT_MODES } = await import(realFlightModesUrl);

const ARM_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'ARM').permanentId;
const ANGLE_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'ANGLE').permanentId;

// A raw MSP_BOXIDS delivery order for "the previous connection": ARM is at
// raw index 0.
const OLD_CONNECTION_RAW_BOX_IDS = [ARM_PERMANENT_ID, ANGLE_PERMANENT_ID];

test('test assumption: ARM permanentId matches what the scenario expects', () => {
    assert.equal(ARM_PERMANENT_ID, 0, 'test assumption: ARM permanentId is 0');
});

function populateFromFirstConnection(FC) {
    FC.resetState();
    FC.AUX_CONFIG_IDS = OLD_CONNECTION_RAW_BOX_IDS.slice();
    FC.generateAuxConfig();
    // Firmware reports ARM (raw index 0) as armed.
    FC.CONFIG.mode = [1 << 0];
}

test('sanity: FC resolves ARM correctly on the first (successful) connection', () => {
    populateFromFirstConnection(FC_fixed);
    assert.equal(FC_fixed.getModeId('ARM'), 0);
    assert.equal(FC_fixed.isModeEnabled('ARM'), true);
});

test('FIXED resetState(): a reconnect with a dropped MSP_BOXIDS (no generateAuxConfig() call) clears stale box data, getModeId()/isModeEnabled() fail safe', () => {
    populateFromFirstConnection(FC_fixed);

    // Simulate a reconnect to a possibly-different FC where MSP_BOXIDS timed
    // out / failed: resetState() runs, but generateAuxConfig() is NOT called
    // again afterward.
    FC_fixed.resetState();

    assert.deepEqual(FC_fixed.AUX_CONFIG, [], 'AUX_CONFIG must be cleared on reset, not left stale from the previous connection');
    assert.deepEqual(FC_fixed.AUX_CONFIG_IDS, [], 'AUX_CONFIG_IDS must be cleared on reset, not left stale from the previous connection');
    assert.deepEqual(FC_fixed.AUX_CONFIG_IDS_RAW, [], 'AUX_CONFIG_IDS_RAW must be cleared on reset, not left stale from the previous connection');

    assert.equal(FC_fixed.getModeId('ARM'), -1, "getModeId('ARM') must return -1 once box data has been cleared and not yet regenerated");

    // Status polling continues to refresh CONFIG.mode regardless of whether
    // MSP_BOXIDS succeeded. Reuse the OLD connection's bit pattern (bit 0 set)
    // - the exact value that would make isModeEnabled('ARM') wrongly report
    // true if stale raw box data were still being used to resolve ARM's index.
    FC_fixed.CONFIG.mode = [1 << 0];

    assert.equal(FC_fixed.isModeEnabled('ARM'), false, "isModeEnabled('ARM') must report false (fail safe), not resolve against the previous connection's stale box layout");
});

test('FIXED isModeEnabled(): an unresolvable mode name (getModeId() == -1) never falls through to isModeBitSet(-1)', () => {
    populateFromFirstConnection(FC_fixed);
    // Set CONFIG.mode[0]'s bit 31 - the exact bit isModeBitSet(-1) actually
    // tests, due to `1 << -1` masking to `1 << 31` and `Math.trunc(-1/32)`
    // being -0 (which indexes the same as 0).
    FC_fixed.CONFIG.mode = [-2147483648]; // 0x80000000, bit 31 set

    assert.equal(FC_fixed.getModeId('NOT_A_REAL_MODE'), -1, 'test assumption: an unrecognized name resolves to -1');
    assert.equal(FC_fixed.isModeEnabled('NOT_A_REAL_MODE'), false, 'isModeEnabled() must return false for an unresolvable mode name regardless of unrelated bits in CONFIG.mode');
});
