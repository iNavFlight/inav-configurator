import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dataModule } from './dataModule.mjs';

/**
 * Makes the real MSP stack (js/msp.js, the serial queue, the dedup queue and
 * their import-free leaf modules) loadable by plain Node. Only import
 * specifiers are rewritten; see rewriteAndWrite.mjs.
 *
 * eventFrequencyAnalyzer and serial_queue start un-refed intervals in their
 * IIFEs. `.unref()` changes nothing about whether or how they run - it only
 * stops Node from waiting on them to decide when the process may exit, which
 * would otherwise hang `node --test` forever.
 */
export function rewriteMspStack(repoRoot, rewriteAndWrite) {
    const real = (relPath) => pathToFileURL(join(repoRoot, relPath)).href;
    const urls = {
        mspCodes: real('js/msp/MSPCodes.js'),
        timeouts: real('js/timeouts.js'),
        configurator: real('js/data_storage.js'),
        dedup: real('js/msp/mspDeduplicationQueue.js'),
        statistics: real('js/msp/mspStatistics.js'),
        smoothFilter: real('js/simple_smooth_filter.js'),
        injectedMethods: real('js/injected_methods.js'),
    };

    urls.eventFrequencyAnalyzer = rewriteAndWrite('js/eventFrequencyAnalyzer.js', [
        [/privateScope\.intervalHandler = setInterval\(publicScope\.analyze, bufferPeriod\);/g, 'privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod).unref();', "analyze setInterval"],
    ], 'eventFrequencyAnalyzer-generated');

    urls.mspQueue = rewriteAndWrite('js/serial_queue.js', [
        [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${urls.configurator}';`, "import CONFIGURATOR"],
        [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${urls.mspCodes}';`, "import MSPCodes"],
        [/^import SimpleSmoothFilter from '\.\/simple_smooth_filter';$/m, `import SimpleSmoothFilter from '${urls.smoothFilter}';`, "import SimpleSmoothFilter"],
        [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${urls.eventFrequencyAnalyzer}';`, "import eventFrequencyAnalyzer"],
        [/^import mspDeduplicationQueue from '\.\/msp\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${urls.dedup}';`, "import mspDeduplicationQueue"],
        [/setInterval\(publicScope\.executor, Math\.round\(1000 \/ privateScope\.handlerFrequency\)\);/, 'setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency)).unref();', "executor setInterval"],
        [/setInterval\(publicScope\.balancer, Math\.round\(1000 \/ privateScope\.balancerFrequency\)\);/, 'setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency)).unref();', "balancer setInterval"],
    ], 'serial_queue-generated');

    urls.msp = rewriteAndWrite('js/msp.js', [
        [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${urls.mspCodes}';`, "import MSPCodes"],
        [/^import mspQueue from '\.\/serial_queue';$/m, `import mspQueue from '${urls.mspQueue}';`, "import mspQueue"],
        [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${urls.eventFrequencyAnalyzer}';`, "import eventFrequencyAnalyzer"],
        [/^import timeout from '\.\/timeouts';$/m, `import timeout from '${urls.timeouts}';`, "import timeout"],
        [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${urls.configurator}';`, "import CONFIGURATOR"],
    ], 'msp-generated');

    return urls;
}

/**
 * Makes the real js/msp/MSPHelper.js loadable on top of rewriteMspStack().
 * `stubs` supplies module URLs for fc, gui, i18n and settingsCache; every other
 * import is only referenced from code paths these tests never reach, so it
 * just has to resolve.
 */
export function rewriteMspHelper(rewriteAndWrite, urls, stubs) {
    const inertDefaultUrl = dataModule('export default {};');
    const inertFwApproachUrl = dataModule('export const FwApproach = class {};');
    const inertGeozoneUrl = dataModule(`
        export const Geozone = class {};
        export const GeozoneVertex = class {};
        export const GeozoneShapes = {};
    `);
    const settingsCacheUrl = stubs.settingsCache ?? inertDefaultUrl;

    return rewriteAndWrite('js/msp/MSPHelper.js', [
        [/^import semver from 'semver';$/m, `import semver from '${inertDefaultUrl}';`, "import semver"],
        [/^import '\.\/\.\.\/injected_methods';$/m, `import '${urls.injectedMethods}';`, "import injected_methods"],
        [/^import GUI from '\.\/\.\.\/gui';$/m, `import GUI from '${stubs.gui}';`, "import GUI"],
        [/^import i18n from '\.\/\.\.\/localization';$/m, `import i18n from '${stubs.i18n}';`, "import i18n"],
        [/^import MSP from '\.\/\.\.\/msp';$/m, `import MSP from '${urls.msp}';`, "import MSP"],
        [/^import MSPCodes from '\.\/MSPCodes';$/m, `import MSPCodes from '${urls.mspCodes}';`, "import MSPCodes"],
        [/^import FC from '\.\/\.\.\/fc';$/m, `import FC from '${stubs.fc}';`, "import FC"],
        [/^import VTX from '\.\/\.\.\/vtx';$/m, `import VTX from '${inertDefaultUrl}';`, "import VTX"],
        [/^import mspQueue from '\.\/\.\.\/serial_queue';$/m, `import mspQueue from '${urls.mspQueue}';`, "import mspQueue"],
        [/^import ServoMixRule from '\.\/\.\.\/servoMixRule';$/m, `import ServoMixRule from '${inertDefaultUrl}';`, "import ServoMixRule"],
        [/^import MotorMixRule from '\.\/\.\.\/motorMixRule';$/m, `import MotorMixRule from '${inertDefaultUrl}';`, "import MotorMixRule"],
        [/^import LogicCondition from '\.\/\.\.\/logicCondition';$/m, `import LogicCondition from '${inertDefaultUrl}';`, "import LogicCondition"],
        [/^import BitHelper from '\.\.\/bitHelper';$/m, `import BitHelper from '${inertDefaultUrl}';`, "import BitHelper"],
        [/^import serialPortHelper from '\.\/\.\.\/serialPortHelper';$/m, `import serialPortHelper from '${inertDefaultUrl}';`, "import serialPortHelper"],
        [/^import ProgrammingPid from '\.\/\.\.\/programmingPid';$/m, `import ProgrammingPid from '${inertDefaultUrl}';`, "import ProgrammingPid"],
        [/^import Safehome from '\.\/\.\.\/safehome';$/m, `import Safehome from '${inertDefaultUrl}';`, "import Safehome"],
        [/^import \{ FwApproach \} from '\.\/\.\.\/fwApproach';$/m, `import { FwApproach } from '${inertFwApproachUrl}';`, "import FwApproach"],
        [/^import Waypoint from '\.\/\.\.\/waypoint';$/m, `import Waypoint from '${inertDefaultUrl}';`, "import Waypoint"],
        [/^import mspDeduplicationQueue from '\.\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${urls.dedup}';`, "import mspDeduplicationQueue"],
        [/^import mspStatistics from '\.\/mspStatistics';$/m, `import mspStatistics from '${urls.statistics}';`, "import mspStatistics"],
        [/^import settingsCache from '\.\/\.\.\/settingsCache';$/m, `import settingsCache from '${settingsCacheUrl}';`, "import settingsCache"],
        [/^import \{Geozone, GeozoneVertex, GeozoneShapes \} from '\.\/\.\.\/geozone';$/m, `import { Geozone, GeozoneVertex, GeozoneShapes } from '${inertGeozoneUrl}';`, "import Geozone"],
    ], 'MSPHelper-generated');
}
