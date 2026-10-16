import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dataModule } from './dataModule.mjs';
import { makeRewriteAndWrite } from './rewriteAndWrite.mjs';

// Trivial no-arg-constructible stand-ins for the collection/model classes
// FC.resetState() instantiates. Shared across the js/fc.js-loading regression
// tests (tests/fc-generate-aux-config.test.mjs,
// tests/fc-getmodeid-raw-box-order.test.mjs,
// tests/fc-resetstate-clears-stale-aux-config.test.mjs) - none of those tests
// read from these, so their internal behavior is irrelevant; they only need
// to exist and be `new`-able so resetState() can run.
export const mockClassUrl = dataModule(`
    class MockCollection {}
    export default MockCollection;
`);

export const mockModelUrl = dataModule(`
    export const PLATFORM = { AIRPLANE: 0, MULTIROTOR: 1, TRICOPTER: 2 };
`);

export const mockVtxUrl = dataModule(`
    const VTX = { DEV_UNKNOWN: 0xFF };
    export default VTX;
`);

// A stub BitHelper for tests that don't exercise real CONFIG.mode bit
// arithmetic (unlike the mock class/model/vtx stand-ins above, this one is
// only appropriate when a test's assertions never depend on real bit_check()
// behavior - pass it as `bitHelperUrl` to buildCommonFcImportRules() below).
export const mockBitHelperUrl = dataModule(`
    const BitHelper = { bit_check: () => false };
    export default BitHelper;
`);

/**
 * Builds the shared set of import-rewrite rules needed to load the real
 * js/fc.js off disk under plain Node's ESM resolver: js/fc.js's various
 * Vite-style extensionless imports of collection/model classes are pointed at
 * the trivial mock stand-ins above, and its import of './flightModes' is
 * pointed at the real js/flightModes.js file on disk (unmodified - it has no
 * imports of its own). Its import of './bitHelper' is, by default, pointed at
 * the real js/bitHelper.js file on disk too (its actual bit_check() logic is
 * required by tests that assert on real CONFIG.mode bit arithmetic); pass
 * `bitHelperUrl` to point it at a stub instead (e.g. mockBitHelperUrl above)
 * for tests that don't care about real bit arithmetic.
 *
 * Returns { realFlightModesUrl, realBitHelperUrl, commonImportRules } -
 * callers combine commonImportRules with rewriteAndWrite() to load fc.js, and
 * separately import realFlightModesUrl directly to read FLIGHT_MODES data for
 * building test scenarios.
 */
export function buildCommonFcImportRules(repoRoot, { bitHelperUrl } = {}) {
    const realFlightModesUrl = pathToFileURL(join(repoRoot, 'js/flightModes.js')).href;
    const realBitHelperUrl = pathToFileURL(join(repoRoot, 'js/bitHelper.js')).href;

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
        [/^import BitHelper from '\.\/bitHelper';$/m, `import BitHelper from '${bitHelperUrl ?? realBitHelperUrl}';`, "import BitHelper"],
        [/^import \{ FLIGHT_MODES \} from '\.\/flightModes';$/m, `import { FLIGHT_MODES } from '${realFlightModesUrl}';`, "import FLIGHT_MODES"],
    ];

    return { realFlightModesUrl, realBitHelperUrl, commonImportRules };
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Loads the real, current js/fc.js (imports rewritten only) together with the
 * real FLIGHT_MODES table, for tests that look up permanentIds to build their
 * scenarios without hand-duplicating box data. The rewritten copy lives in a
 * temp dir that is removed when the process exits.
 *
 * Returns { FC, FLIGHT_MODES }.
 */
export async function loadRealFc(testFileName) {
    const tmpDir = mkdtempSync(join(tmpdir(), testFileName.replace(/\.test\.mjs$/, '-')));
    process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

    const rewriteAndWrite = makeRewriteAndWrite(repoRoot, tmpDir, testFileName);
    const { realFlightModesUrl, commonImportRules } = buildCommonFcImportRules(repoRoot);

    const { default: FC } = await import(rewriteAndWrite('js/fc.js', commonImportRules, 'fc-fixed'));
    const { FLIGHT_MODES } = await import(realFlightModesUrl);
    return { FC, FLIGHT_MODES };
}
