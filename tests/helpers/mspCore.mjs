import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { makeHarness } from './harness.mjs';
import { dataModule } from './dataModule.mjs';

/**
 * Loads the real js/serial_queue.js and js/msp.js with only their extensionless import
 * specifiers rewritten, plus the real leaf modules they share. The queue's two intervals
 * are un-refed so `node --test` can exit; nothing else in the sources is touched.
 */
export async function loadMspCore(importMetaUrl, testFileName, tmpPrefix) {
    const { repoRoot, rewriteAndWrite } = makeHarness(importMetaUrl, testFileName, tmpPrefix);
    const realUrl = (relPath) => pathToFileURL(join(repoRoot, relPath)).href;

    const mspCodesUrl = realUrl('js/msp/MSPCodes.js');
    const timeoutsUrl = realUrl('js/timeouts.js');
    const configuratorUrl = realUrl('js/data_storage.js');
    const dedupUrl = realUrl('js/msp/mspDeduplicationQueue.js');
    const smoothFilterUrl = realUrl('js/simple_smooth_filter.js');

    const eventFrequencyAnalyzerUrl = rewriteAndWrite('js/eventFrequencyAnalyzer.js', [
        [/privateScope\.intervalHandler = setInterval\(publicScope\.analyze, bufferPeriod\);/g, 'privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod).unref();', 'analyze setInterval'],
    ], 'eventFrequencyAnalyzer-generated');

    const mspQueueUrl = rewriteAndWrite('js/serial_queue.js', [
        [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${configuratorUrl}';`, 'import CONFIGURATOR'],
        [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${mspCodesUrl}';`, 'import MSPCodes'],
        [/^import SimpleSmoothFilter from '\.\/simple_smooth_filter';$/m, `import SimpleSmoothFilter from '${smoothFilterUrl}';`, 'import SimpleSmoothFilter'],
        [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${eventFrequencyAnalyzerUrl}';`, 'import eventFrequencyAnalyzer'],
        [/^import mspDeduplicationQueue from '\.\/msp\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${dedupUrl}';`, 'import mspDeduplicationQueue'],
        [/setInterval\(publicScope\.executor, Math\.round\(1000 \/ privateScope\.handlerFrequency\)\);/, 'setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency)).unref();', 'executor setInterval'],
        [/setInterval\(publicScope\.balancer, Math\.round\(1000 \/ privateScope\.balancerFrequency\)\);/, 'setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency)).unref();', 'balancer setInterval'],
    ], 'serial_queue-generated');

    const mspUrl = rewriteAndWrite('js/msp.js', [
        [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${mspCodesUrl}';`, 'import MSPCodes'],
        [/^import mspQueue from '\.\/serial_queue';$/m, `import mspQueue from '${mspQueueUrl}';`, 'import mspQueue'],
        [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${eventFrequencyAnalyzerUrl}';`, 'import eventFrequencyAnalyzer'],
        [/^import timeout from '\.\/timeouts';$/m, `import timeout from '${timeoutsUrl}';`, 'import timeout'],
        [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${configuratorUrl}';`, 'import CONFIGURATOR'],
    ], 'msp-generated');

    return {
        MSP: (await import(mspUrl)).default,
        mspQueue: (await import(mspQueueUrl)).default,
        MSPCodes: (await import(mspCodesUrl)).default,
        CONFIGURATOR: (await import(configuratorUrl)).default,
        mspDeduplicationQueue: (await import(dedupUrl)).default,
        urls: { msp: mspUrl, mspQueue: mspQueueUrl, mspCodes: mspCodesUrl, dedup: dedupUrl },
        rewriteAndWrite,
        realUrl,
        repoRoot,
    };
}

/**
 * Loads the real js/msp/MSPHelper.js on top of loadMspCore(): MSP, MSPCodes, the queue and the
 * dedup queue are the real ones, FC / GUI / i18n are the caller's stubs (data: module sources
 * exporting a default), every other import is an inert stub that only has to resolve.
 */
export async function loadMspHelper(importMetaUrl, testFileName, tmpPrefix, { fc, gui, i18n }) {
    const core = await loadMspCore(importMetaUrl, testFileName, tmpPrefix);
    const wired = {
        './../msp': core.urls.msp,
        './MSPCodes': core.urls.mspCodes,
        './../serial_queue': core.urls.mspQueue,
        './mspDeduplicationQueue': core.urls.dedup,
        './mspStatistics': core.realUrl('js/msp/mspStatistics.js'),
        './../fc': fc,
        './../gui': gui,
        './../localization': i18n,
    };
    const source = readFileSync(join(core.repoRoot, 'js/msp/MSPHelper.js'), 'utf8');
    const rules = [];
    for (const [statement, clause, specifier] of source.matchAll(/^import (?:(.+) from )?'([^']+)';$/gm)) {
        const url = wired[specifier] || inertModule(clause);
        const replacement = clause ? `import ${clause} from '${url}';` : `import '${url}';`;
        rules.push([new RegExp('^' + escapeRegExp(statement) + '$', 'm'), replacement, statement]);
    }
    const helperUrl = core.rewriteAndWrite('js/msp/MSPHelper.js', rules, 'MSPHelper-generated');
    return { ...core, mspHelper: (await import(helperUrl)).default };
}

function inertModule(clause) {
    const named = /\{([^}]*)\}/.exec(clause || '');
    const exports = named ? named[1].split(',').map(name => `export const ${name.trim()} = function () {};`) : [];
    return dataModule(['export default {};', ...exports].join('\n'));
}

function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

/**
 * Leaves the previous test's queue, callbacks, decoder and loss records behind; tunnel mode ends
 * up off. Run it before enabling the next test's mock timers: clearing the previous test's
 * timers through a new mock corrupts its queue.
 */
export function resetMspCore({ MSP, mspQueue, mspDeduplicationQueue, CONFIGURATOR }) {
    mspQueue.setTunnelMode(false);
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    MSP.callbacks_cleanup();
    MSP.resetDecoder();
    mspQueue.freeHardLock();
    mspQueue.freeSoftLock();
    mspQueue.unlock();
    MSP.parseFailures.clear();
    MSP.lostReplies.clear();
    CONFIGURATOR.cliActive = false;
}

/** Framed MSP v2 reply ($X>) as the FC's msp_serial.c builds it. */
export function mspV2Reply(code, payload) {
    const frame = new Uint8Array(9 + payload.length);
    frame.set([0x24, 0x58, 0x3E, 0, code & 0xFF, code >> 8, payload.length & 0xFF, payload.length >> 8]);
    frame.set(payload, 8);
    let crc = 0;
    for (let i = 3; i < frame.length - 1; i++) {
        crc ^= frame[i];
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc & 0x80) ? ((crc << 1) ^ 0xD5) & 0xFF : (crc << 1) & 0xFF;
        }
    }
    frame[frame.length - 1] = crc;
    return frame;
}
