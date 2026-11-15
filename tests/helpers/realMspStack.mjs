import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { dataModule } from './dataModule.mjs';
import { makeHarness } from './harness.mjs';

/**
 * Loads the REAL MSP stack - decoder (js/msp.js), queue (js/serial_queue.js),
 * deduplication queue, statistics and MSPHelper's response path - for tests
 * that push frames through it.
 *
 * This codebase uses Vite-style extensionless relative imports which plain
 * Node's ESM resolver refuses to load, so the sources are read fresh off disk
 * and only their *import specifiers* are rewritten. Everything the MSP path
 * actually touches stays wired to the real modules; the remaining imports,
 * which no executed path reaches, become inert stubs. No statement,
 * expression or ordering in the code under test is touched.
 *
 * GUI and i18n are recording stubs (GUI.logged, i18n.calls), so a test can
 * check what the user is told. FC is the caller's `fcState` object.
 *
 * Nothing is initialised here: each test does the startup wiring it needs
 * (MSP.init(), mspHelper.init()).
 */
export async function loadRealMspStack(importMetaUrl, testFileName, tmpPrefix, fcState) {
    const { repoRoot, tmpDir, rewriteAndWrite } = makeHarness(importMetaUrl, testFileName, tmpPrefix);
    const realModuleUrl = (relPath) => pathToFileURL(join(repoRoot, relPath)).href;

    // --- real, import-free leaf modules, loadable straight by absolute URL ---
    const realMspCodesUrl = realModuleUrl('js/msp/MSPCodes.js');
    const realTimeoutsUrl = realModuleUrl('js/timeouts.js');
    const realConfiguratorUrl = realModuleUrl('js/data_storage.js');
    const realDedupUrl = realModuleUrl('js/msp/mspDeduplicationQueue.js');
    const realStatisticsUrl = realModuleUrl('js/msp/mspStatistics.js');
    const realSmoothFilterUrl = realModuleUrl('js/simple_smooth_filter.js');
    const realInjectedMethodsUrl = realModuleUrl('js/injected_methods.js');
    const realMspWriteOutcomeUrl = realModuleUrl('js/mspWriteOutcome.js');
    const realBitHelperUrl = realModuleUrl('js/bitHelper.js');

    // eventFrequencyAnalyzer and serial_queue start un-refed intervals in their
    // IIFEs. `.unref()` changes nothing about whether or how they run - it only
    // stops Node from waiting on them to decide when the process may exit, which
    // would otherwise hang `node --test` forever.
    const realEventFrequencyAnalyzerUrl = rewriteAndWrite('js/eventFrequencyAnalyzer.js', [
        [/privateScope\.intervalHandler = setInterval\(publicScope\.analyze, bufferPeriod\);/g, 'privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod).unref();', "analyze setInterval"],
    ], 'eventFrequencyAnalyzer-generated');

    const realMspQueueUrl = rewriteAndWrite('js/serial_queue.js', [
        [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
        [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
        [/^import SimpleSmoothFilter from '\.\/simple_smooth_filter';$/m, `import SimpleSmoothFilter from '${realSmoothFilterUrl}';`, "import SimpleSmoothFilter"],
        [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${realEventFrequencyAnalyzerUrl}';`, "import eventFrequencyAnalyzer"],
        [/^import mspDeduplicationQueue from '\.\/msp\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realDedupUrl}';`, "import mspDeduplicationQueue"],
        [/setInterval\(publicScope\.executor, Math\.round\(1000 \/ privateScope\.handlerFrequency\)\);/, 'setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency)).unref();', "executor setInterval"],
        [/setInterval\(publicScope\.balancer, Math\.round\(1000 \/ privateScope\.balancerFrequency\)\);/, 'setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency)).unref();', "balancer setInterval"],
    ], 'serial_queue-generated');

    const realMspUrl = rewriteAndWrite('js/msp.js', [
        [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
        [/^import mspQueue from '\.\/serial_queue';$/m, `import mspQueue from '${realMspQueueUrl}';`, "import mspQueue"],
        [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${realEventFrequencyAnalyzerUrl}';`, "import eventFrequencyAnalyzer"],
        [/^import timeout from '\.\/timeouts';$/m, `import timeout from '${realTimeoutsUrl}';`, "import timeout"],
        [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
    ], 'msp-generated');

    // The FC stub hands out the caller's object; a per-prefix global keeps two
    // stacks in one process apart.
    const fcStateId = '__realMspStackFc_' + tmpPrefix;
    globalThis[fcStateId] = fcState;
    const fcStubUrl = dataModule(`
        const FC = globalThis['${fcStateId}'];
        export default FC;
    `);
    const inertDefaultUrl = dataModule('export default {};');
    const guiStubUrl = dataModule(`
        const GUI = { logged: [], log(message) { GUI.logged.push(message); } };
        export default GUI;
    `);
    const i18nStubUrl = dataModule(`
        const i18n = { calls: [], getMessage(key, subs) { i18n.calls.push({ key, subs }); return key; } };
        export default i18n;
    `);
    const inertFwApproachUrl = dataModule('export const FwApproach = class {};');
    const inertDronecanAsyncRequestParseUrl = dataModule('export const parseDronecanAsyncRequestResponse = () => null;');
    const inertGeozoneUrl = dataModule(`
        export const Geozone = class {};
        export const GeozoneVertex = class {};
        export const GeozoneShapes = {};
    `);

    const realMspHelperUrl = rewriteAndWrite('js/msp/MSPHelper.js', [
        [/^import semver from 'semver';$/m, `import semver from '${inertDefaultUrl}';`, "import semver"],
        [/^import '\.\/\.\.\/injected_methods';$/m, `import '${realInjectedMethodsUrl}';`, "import injected_methods"],
        [/^import GUI from '\.\/\.\.\/gui';$/m, `import GUI from '${guiStubUrl}';`, "import GUI"],
        [/^import i18n from '\.\/\.\.\/localization';$/m, `import i18n from '${i18nStubUrl}';`, "import i18n"],
        [/^import MSP from '\.\/\.\.\/msp';$/m, `import MSP from '${realMspUrl}';`, "import MSP"],
        [/^import MSPCodes from '\.\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
        [/^import FC from '\.\/\.\.\/fc';$/m, `import FC from '${fcStubUrl}';`, "import FC"],
        [/^import VTX from '\.\/\.\.\/vtx';$/m, `import VTX from '${inertDefaultUrl}';`, "import VTX"],
        [/^import mspQueue from '\.\/\.\.\/serial_queue';$/m, `import mspQueue from '${realMspQueueUrl}';`, "import mspQueue"],
        [/^import ServoMixRule from '\.\/\.\.\/servoMixRule';$/m, `import ServoMixRule from '${inertDefaultUrl}';`, "import ServoMixRule"],
        [/^import MotorMixRule from '\.\/\.\.\/motorMixRule';$/m, `import MotorMixRule from '${inertDefaultUrl}';`, "import MotorMixRule"],
        [/^import LogicCondition from '\.\/\.\.\/logicCondition';$/m, `import LogicCondition from '${inertDefaultUrl}';`, "import LogicCondition"],
        [/^import BitHelper from '\.\.\/bitHelper';$/m, `import BitHelper from '${realBitHelperUrl}';`, "import BitHelper"],
        [/^import serialPortHelper from '\.\/\.\.\/serialPortHelper';$/m, `import serialPortHelper from '${inertDefaultUrl}';`, "import serialPortHelper"],
        [/^import ProgrammingPid from '\.\/\.\.\/programmingPid';$/m, `import ProgrammingPid from '${inertDefaultUrl}';`, "import ProgrammingPid"],
        [/^import Safehome from '\.\/\.\.\/safehome';$/m, `import Safehome from '${inertDefaultUrl}';`, "import Safehome"],
        [/^import \{ FwApproach \} from '\.\/\.\.\/fwApproach';$/m, `import { FwApproach } from '${inertFwApproachUrl}';`, "import FwApproach"],
        [/^import \{ parseDronecanAsyncRequestResponse \} from '\.\/\.\.\/dronecanAsyncRequestParse';$/m, `import { parseDronecanAsyncRequestResponse } from '${inertDronecanAsyncRequestParseUrl}';`, "import parseDronecanAsyncRequestResponse"],
        [/^import Waypoint from '\.\/\.\.\/waypoint';$/m, `import Waypoint from '${inertDefaultUrl}';`, "import Waypoint"],
        [/^import mspDeduplicationQueue from '\.\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realDedupUrl}';`, "import mspDeduplicationQueue"],
        [/^import mspStatistics from '\.\/mspStatistics';$/m, `import mspStatistics from '${realStatisticsUrl}';`, "import mspStatistics"],
        [/^import \{ resolveMspWrite, guardMspCallback \} from '\.\/\.\.\/mspWriteOutcome';$/m, `import { resolveMspWrite, guardMspCallback } from '${realMspWriteOutcomeUrl}';`, "import resolveMspWrite, guardMspCallback"],
        [/^import settingsCache from '\.\/\.\.\/settingsCache';$/m, `import settingsCache from '${inertDefaultUrl}';`, "import settingsCache"],
        [/^import \{Geozone, GeozoneVertex, GeozoneShapes \} from '\.\/\.\.\/geozone';$/m, `import { Geozone, GeozoneVertex, GeozoneShapes } from '${inertGeozoneUrl}';`, "import Geozone"],
    ], 'MSPHelper-generated');

    return {
        repoRoot,
        tmpDir,
        FC: fcState,
        mspHelper: (await import(realMspHelperUrl)).default,
        MSPCodes: (await import(realMspCodesUrl)).default,
        MSP: (await import(realMspUrl)).default,
        mspQueue: (await import(realMspQueueUrl)).default,
        mspDeduplicationQueue: (await import(realDedupUrl)).default,
        CONFIGURATOR: (await import(realConfiguratorUrl)).default,
        GUI: (await import(guiStubUrl)).default,
        i18n: (await import(i18nStubUrl)).default,
        mspWriteOutcome: await import(realMspWriteOutcomeUrl),
    };
}
