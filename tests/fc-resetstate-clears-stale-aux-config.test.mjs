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
 * Fix under test (both in js/fc.js, uncommitted at the time this test was
 * written):
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
 * production js/fc.js (both the current, fixed copy, and a second copy with
 * just these two hunks textually reverted to their exact pre-fix text, taken
 * verbatim from `git diff -- js/fc.js` in the working tree) plus the REAL
 * js/flightModes.js and REAL js/bitHelper.js (bitHelper's actual bit_check()
 * logic - not a stub - is required here, since the isModeBitSet(-1) landmine
 * is a real bit-arithmetic quirk, not a stand-in behavior). No js/fc.js
 * source file on disk is modified by this test.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { makeRewriteAndWrite } from './helpers/rewriteAndWrite.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tmpDir = mkdtempSync(join(tmpdir(), 'fc-resetstate-clears-stale-aux-config-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

function dataModule(code) {
    // encodeURIComponent leaves ' ( ) ! * unescaped; the generated specifiers are
    // embedded in single-quoted string literals, so escape those too.
    const encoded = encodeURIComponent(code).replace(/['()!*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:text/javascript,' + encoded;
}

// Trivial no-arg-constructible stand-ins for the collection/model classes
// FC.resetState() instantiates. Neither generateAuxConfig() nor
// getModeId()/isModeEnabled() reads from these, so their internal behavior
// is irrelevant - they only need to exist and be `new`-able so resetState()
// can run.
const mockClassUrl = dataModule(`
    class MockCollection {}
    export default MockCollection;
`);

const mockModelUrl = dataModule(`
    export const PLATFORM = { AIRPLANE: 0, MULTIROTOR: 1, TRICOPTER: 2 };
`);

const mockVtxUrl = dataModule(`
    const VTX = { DEV_UNKNOWN: 0xFF };
    export default VTX;
`);

// The real, unmodified flightModes.js and bitHelper.js - neither has imports
// of its own, so both can be loaded directly off disk with no rewriting.
// bitHelper.js's REAL bit_check() (not a stub) is required here: part of
// this test's whole point is the actual (buggy) bit arithmetic of
// isModeBitSet(-1).
const realFlightModesUrl = pathToFileURL(join(repoRoot, 'js/flightModes.js')).href;
const realBitHelperUrl = pathToFileURL(join(repoRoot, 'js/bitHelper.js')).href;

const rewriteAndWrite = makeRewriteAndWrite(repoRoot, tmpDir, 'fc-resetstate-clears-stale-aux-config.test.mjs');

const commonImportRules = [
    [/^import ServoMixerRuleCollection from '\.\/servoMixerRuleCollection';$/m, `import ServoMixerRuleCollection from '${mockClassUrl}';`, "import ServoMixerRuleCollection"],
    [/^import MotorMixerRuleCollection from '\.\/motorMixerRuleCollection';$/m, `import MotorMixerRuleCollection from '${mockClassUrl}';`, "import MotorMixerRuleCollection"],
    [/^import LogicConditionsCollection from '\.\/logicConditionsCollection';$/m, `import LogicConditionsCollection from '${mockClassUrl}';`, "import LogicConditionsCollection"],
    [/^import LogicConditionsStatus from '\.\/logicConditionsStatus';$/m, `import LogicConditionsStatus from '${mockClassUrl}';`, "import LogicConditionsStatus"],
    [/^import GlobalVariablesStatus from '\.\/globalVariablesStatus';$/m, `import GlobalVariablesStatus from '${mockClassUrl}';`, "import GlobalVariablesStatus"],
    [/^import ProgrammingPidCollection from '\.\/programmingPidCollection';$/m, `import ProgrammingPidCollection from '${mockClassUrl}';`, "import ProgrammingPidCollection"],
    [/^import ProgrammingPidStatus from '\.\/programmingPidStatus';$/m, `import ProgrammingPidStatus from '${mockClassUrl}';`, "import ProgrammingPidStatus"],
    [/^import WaypointCollection from '\.\/waypointCollection';$/m, `import WaypointCollection from '${mockClassUrl}';`, "import WaypointCollection"],
    [/^import OutputMappingCollection from '\.\/outputMapping';$/m, `import OutputMappingCollection from '${mockClassUrl}';`, "import OutputMappingCollection"],
    [/^import SafehomeCollection from '\.\/safehomeCollection';$/m, `import SafehomeCollection from '${mockClassUrl}';`, "import SafehomeCollection"],
    [/^import FwApproachCollection from '\.\/fwApproachCollection';$/m, `import FwApproachCollection from '${mockClassUrl}';`, "import FwApproachCollection"],
    [/^import GeozoneCollection from '\.\/geozoneCollection';$/m, `import GeozoneCollection from '${mockClassUrl}';`, "import GeozoneCollection"],
    [/^import \{ PLATFORM \} from '\.\/model';$/m, `import { PLATFORM } from '${mockModelUrl}';`, "import PLATFORM"],
    [/^import VTX from '\.\/vtx';$/m, `import VTX from '${mockVtxUrl}';`, "import VTX"],
    [/^import BitHelper from '\.\/bitHelper';$/m, `import BitHelper from '${realBitHelperUrl}';`, "import BitHelper"],
    [/^import \{ FLIGHT_MODES \} from '\.\/flightModes';$/m, `import { FLIGHT_MODES } from '${realFlightModesUrl}';`, "import FLIGHT_MODES"],
];

// --- Copy 1: the real, current (fixed) js/fc.js, imports rewritten only. ---
const fixedFcUrl = rewriteAndWrite('js/fc.js', commonImportRules, 'fc-fixed');
const { default: FC_fixed } = await import(fixedFcUrl);

// --- Copy 2: same file, but with the two fix hunks textually reverted back
// to their exact pre-fix text (taken verbatim from `git diff -- js/fc.js` in
// the working tree at the time this test was written), so this test can
// demonstrate both landmines reproduce against the old logic without ever
// touching the real source file on disk. This mirrors the "revert and check
// it fails" approach in tests/fc-getmodeid-raw-box-order.test.mjs.
const oldResetStatePrefix =
`    resetState: function () {
        this.SENSOR_STATUS = {`;

const oldIsModeEnabled =
`    isModeEnabled: function (name) {
        return this.isModeBitSet(this.getModeId(name));
    },`;

const buggyFcUrl = rewriteAndWrite('js/fc.js', [
    ...commonImportRules,
    [
        /    resetState: function \(\) \{\n(?:.*\n)*?        this\.SENSOR_STATUS = \{/,
        oldResetStatePrefix,
        "resetState() stale-AUX_CONFIG clearing block (reverting to pre-fix implementation)",
    ],
    [
        /    isModeEnabled: function \(name\) \{\n[\s\S]*?\n    \},/,
        oldIsModeEnabled,
        "isModeEnabled body (reverting to pre-fix implementation)",
    ],
], 'fc-buggy');
const { default: FC_buggy } = await import(buggyFcUrl);

// Also import the real FLIGHT_MODES table directly to look up permanentIds
// for building the scenario below without hand-duplicating box data.
const { FLIGHT_MODES } = await import(realFlightModesUrl);

const ARM_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'ARM').permanentId;
const ANGLE_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'ANGLE').permanentId;
assert.equal(ARM_PERMANENT_ID, 0, 'test assumption: ARM permanentId is 0');

// A raw MSP_BOXIDS delivery order for "the previous connection": ARM is at
// raw index 0.
const OLD_CONNECTION_RAW_BOX_IDS = [ARM_PERMANENT_ID, ANGLE_PERMANENT_ID];

function populateFromFirstConnection(FC) {
    FC.resetState();
    FC.AUX_CONFIG_IDS = OLD_CONNECTION_RAW_BOX_IDS.slice();
    FC.generateAuxConfig();
    // Firmware reports ARM (raw index 0) as armed.
    FC.CONFIG.mode = [1 << 0];
}

test('sanity: both fixed and buggy FC resolve ARM correctly on the first (successful) connection', () => {
    for (const FC of [FC_fixed, FC_buggy]) {
        populateFromFirstConnection(FC);
        assert.equal(FC.getModeId('ARM'), 0);
        assert.equal(FC.isModeEnabled('ARM'), true);
    }
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

test('PRE-FIX resetState(): reproduces the bug - a dropped MSP_BOXIDS on reconnect leaves getModeId()/isModeEnabled() resolving against the stale previous connection', () => {
    populateFromFirstConnection(FC_buggy);

    // Same reconnect scenario: resetState() runs, generateAuxConfig() does not.
    FC_buggy.resetState();

    // Pre-fix resetState() never cleared these - they still hold the FIRST
    // connection's raw box order.
    assert.deepEqual(FC_buggy.AUX_CONFIG_IDS_RAW, OLD_CONNECTION_RAW_BOX_IDS, 'demonstrates the bug: pre-fix resetState() leaves AUX_CONFIG_IDS_RAW stale instead of clearing it');

    // getModeId() is unaffected by this fix (it was fixed in a prior commit)
    // but because AUX_CONFIG_IDS_RAW was never cleared, it still resolves ARM
    // to its OLD connection's raw index (0) - a stale, non-negative index,
    // not -1.
    assert.equal(FC_buggy.getModeId('ARM'), 0, "demonstrates the bug: pre-fix code resolves ARM to the PREVIOUS connection's stale raw index (0) instead of failing with -1");

    // CONFIG.mode has moved on (freshly repopulated by status polling on the
    // new connection) but happens to have the same bit-0-set pattern as
    // before - the pre-fix code cannot distinguish "the new FC really does
    // report ARM as bit 0" from "we're still looking at leftover data from
    // the old FC", so it reports ARM enabled purely by stale coincidence.
    FC_buggy.CONFIG.mode = [1 << 0];

    assert.equal(FC_buggy.isModeEnabled('ARM'), true, "demonstrates the bug: pre-fix code reports ARM enabled based on the stale previous connection's box layout, not the (unknown) current one");
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

test('PRE-FIX isModeEnabled(): reproduces the isModeBitSet(-1) landmine - an unresolvable mode name spuriously reports enabled', () => {
    populateFromFirstConnection(FC_buggy);
    FC_buggy.CONFIG.mode = [-2147483648]; // 0x80000000, bit 31 set

    assert.equal(FC_buggy.getModeId('NOT_A_REAL_MODE'), -1, 'test assumption: an unrecognized name resolves to -1');
    // Pre-fix isModeEnabled() calls isModeBitSet(-1) unconditionally, which -
    // due to JS's `1 << bit` shift-amount masking (`1 << -1` === `1 << 31`)
    // and `Math.trunc(-1/32)` === -0 indexing the same as CONFIG.mode[0] -
    // actually tests bit 31 of CONFIG.mode[0], which this test deliberately set.
    assert.equal(FC_buggy.isModeEnabled('NOT_A_REAL_MODE'), true, 'demonstrates the bug: pre-fix isModeEnabled() spuriously reports an unresolvable mode name as enabled because isModeBitSet(-1) actually tests bit 31 of CONFIG.mode[0]');
});
