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
 * The test below executes the REAL production js/fc.js (both the current,
 * fixed copy, and a second copy with just getModeId's body rewritten back to
 * its exact pre-fix text, taken verbatim from the fix commit's diff) plus the
 * REAL js/flightModes.js and REAL js/bitHelper.js (bitHelper has no imports
 * of its own and its actual bit_check() logic - not a stub - is required
 * here, since the assertions depend on real bit arithmetic against
 * CONFIG.mode). This mirrors the approach in
 * tests/fc-generate-aux-config.test.mjs and tests/cli-tab-msp-polling.test.mjs:
 * plain Node's ESM resolver can't load this codebase's Vite-style
 * extensionless relative imports, so each file is read fresh off disk and
 * only its *import specifiers* are rewritten. No js/fc.js source file on
 * disk is modified by this test.
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

const tmpDir = mkdtempSync(join(tmpdir(), 'fc-getmodeid-raw-box-order-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

function dataModule(code) {
    // encodeURIComponent leaves ' ( ) ! * unescaped; the generated specifiers are
    // embedded in single-quoted string literals, so escape those too.
    const encoded = encodeURIComponent(code).replace(/['()!*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:text/javascript,' + encoded;
}

// Trivial no-arg-constructible stand-ins for the collection/model classes
// FC.resetState() instantiates. Neither generateAuxConfig() nor getModeId()
// reads from these, so their internal behavior is irrelevant - they only
// need to exist and be `new`-able so resetState() can run.
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
// bitHelper.js's REAL bit_check() (not a stub) is required here: the whole
// point of this test is verifying actual CONFIG.mode bit arithmetic.
const realFlightModesUrl = pathToFileURL(join(repoRoot, 'js/flightModes.js')).href;
const realBitHelperUrl = pathToFileURL(join(repoRoot, 'js/bitHelper.js')).href;

const rewriteAndWrite = makeRewriteAndWrite(repoRoot, tmpDir, 'fc-getmodeid-raw-box-order.test.mjs');

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

// --- Copy 2: same file, but with getModeId's body additionally rewritten
// back to its exact pre-fix implementation (taken verbatim from the fix
// commit 13fb3f61cd's diff of js/fc.js), so this test can demonstrate the
// bug reproduces against the old logic without ever touching the real
// source file on disk. This is the "revert and check it fails" approach
// requested, done as an in-test textual revert of a temp copy rather than a
// manual git revert of the tracked file.
const oldGetModeId =
`    getModeId: function (name) {

        for (var i = 0; i < FC.AUX_CONFIG.length; i++) {
            if (FC.AUX_CONFIG[i] == name)
                return i;
        }
        return -1;
    },`;

const buggyFcUrl = rewriteAndWrite('js/fc.js', [
    ...commonImportRules,
    [
        /    getModeId: function \(name\) \{\n[\s\S]*?\n    \},/,
        oldGetModeId,
        "getModeId body (reverting to pre-fix implementation)",
    ],
], 'fc-buggy');
const { default: FC_buggy } = await import(buggyFcUrl);

// Also import the real FLIGHT_MODES table directly to look up permanentIds
// for building the scenario below without hand-duplicating box data.
const { FLIGHT_MODES } = await import(realFlightModesUrl);

const ARM_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'ARM').permanentId;
const FAILSAFE_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'FAILSAFE').permanentId;
const ANGLE_PERMANENT_ID = FLIGHT_MODES.find((m) => m.boxName === 'ANGLE').permanentId;
assert.equal(ARM_PERMANENT_ID, 0, 'test assumption: ARM permanentId is 0');
assert.equal(FAILSAFE_PERMANENT_ID, 27, 'test assumption: FAILSAFE permanentId is 27');

// Raw MSP_BOXIDS delivery order (as generateAuxConfig()/AUX_CONFIG_IDS_RAW
// would receive it): two permanentIds (9998, 9999) that this configurator
// build's FLIGHT_MODES table does NOT recognize are placed so that one
// unrecognized id precedes ARM and two unrecognized ids precede FAILSAFE -
// exactly the "unrecognized mode ahead of ARM/FAILSAFE in raw order"
// scenario that broke the old filtered-index-based lookup.
const RAW_BOX_IDS = [9999, ARM_PERMANENT_ID, 9998, FAILSAFE_PERMANENT_ID, ANGLE_PERMANENT_ID];
const RAW_ARM_INDEX = RAW_BOX_IDS.indexOf(ARM_PERMANENT_ID);           // 1
const RAW_FAILSAFE_INDEX = RAW_BOX_IDS.indexOf(FAILSAFE_PERMANENT_ID); // 3
assert.equal(RAW_ARM_INDEX, 1);
assert.equal(RAW_FAILSAFE_INDEX, 3);

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

test('PRE-FIX getModeId(): reproduces the bug - reports wrong armed/failsafe state via filtered-list index', () => {
    setUpScenario(FC_buggy);

    // Filtered display list is ['ARM', 'FAILSAFE', 'ANGLE'] (see above), so
    // the old code (indexOf into FC.AUX_CONFIG) returns 0 for ARM and 1 for
    // FAILSAFE - both wrong relative to their true raw bit positions (1, 3).
    assert.equal(FC_buggy.getModeId('ARM'), 0, 'pre-fix code resolves ARM to its FILTERED display-list index (0), not its true raw bit position (1)');
    assert.equal(FC_buggy.getModeId('FAILSAFE'), 1, 'pre-fix code resolves FAILSAFE to its FILTERED display-list index (1), not its true raw bit position (3)');

    // This is the actual user-visible safety bug: with the firmware really
    // reporting "armed, not failsafe" (bit set only at raw index 1), the
    // pre-fix lookup reads the WRONG bits and gets it backwards.
    assert.equal(FC_buggy.isModeEnabled('ARM'), false, 'demonstrates the bug: pre-fix code reports ARM as NOT enabled even though the firmware is armed');
    assert.equal(FC_buggy.isModeEnabled('FAILSAFE'), true, 'demonstrates the bug: pre-fix code reports FAILSAFE as enabled even though the firmware is not in failsafe');
});

test('positive control: with no unrecognized ids ahead of ARM/FAILSAFE, fixed and pre-fix code agree', () => {
    const rawIds = [ARM_PERMANENT_ID, FAILSAFE_PERMANENT_ID, ANGLE_PERMANENT_ID];

    for (const FC of [FC_fixed, FC_buggy]) {
        FC.resetState();
        FC.AUX_CONFIG_IDS = rawIds.slice();
        FC.generateAuxConfig();
        FC.CONFIG.mode = [ (1 << 0) ]; // ARM (index 0 in both raw and filtered order here)

        assert.equal(FC.isModeEnabled('ARM'), true);
        assert.equal(FC.isModeEnabled('FAILSAFE'), false);
    }
});
