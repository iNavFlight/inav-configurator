#!/usr/bin/env node
/**
 * Regression tests for a single unparseable MSP response locking up the GUI.
 *
 * Bug: MSPHelper's processData() is one big switch over the MSP code, and the
 * code that *completes* the request - clearing the response timeout, removing
 * the code from the deduplication queue, recording the round-trip and firing
 * the registered onFinish callback - sat after that switch in the same
 * function. Any parser case that threw skipped all of it, so:
 *   - the tab waiting on that response never got its callback and never
 *     finished loading, leaving the GUI stuck mid tab-switch (no tab changes,
 *     only a disconnect gets you out),
 *   - the request timed out and kept retrying,
 *   - the MSP code stayed flagged in-flight, so retries were rejected as
 *     duplicates,
 *   - and back in msp.js the queue's hard lock was never released either,
 *     because that also sat after the processData() call.
 *
 * Hit in practice with an FC built from a branch whose PID_ITEM_COUNT had
 * grown by one: MSP2_PID walked one bank past FC.PIDs (fixed at 11 entries in
 * serial_backend.js) and threw "Cannot set properties of undefined".
 *
 * Fix under test:
 *   - MSP2_PID grows FC.PIDs to the bank count the FC actually reports
 *   - processData() wraps the parse and completes the request regardless
 *   - msp.js releases the hard lock in a finally
 *
 * The tests execute the REAL production files. This codebase uses Vite-style
 * extensionless relative imports which plain Node's ESM resolver refuses to
 * load, so - like tests/cli-tab-msp-polling.test.mjs - the sources are read
 * fresh off disk and only their *import specifiers* are rewritten. Everything
 * the code under test actually touches (MSPCodes, the MSP queue, the
 * deduplication queue, statistics) stays wired to the real modules; the
 * remaining imports, which no executed path reaches, become inert stubs. No
 * statement, expression or ordering in the code under test is touched.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tmpDir = mkdtempSync(join(tmpdir(), 'msp-parse-failure-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

function dataModule(code) {
    // encodeURIComponent leaves ' ( ) ! * unescaped; the generated specifiers are
    // embedded in single-quoted string literals, so escape those too.
    const encoded = encodeURIComponent(code).replace(/['()!*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:text/javascript,' + encoded;
}

function realModuleUrl(relPath) {
    return pathToFileURL(join(repoRoot, relPath)).href;
}

/**
 * Rewrite the listed import specifiers in a real source file and write the
 * result to a temp module. Throws loudly if a pattern stops matching, so a
 * future reshuffle of those imports fails the test instead of passing
 * vacuously.
 */
function rewriteAndWrite(relSrcPath, rules, outName) {
    let source = readFileSync(join(repoRoot, relSrcPath), 'utf8');
    for (const [regex, replacement, label] of rules) {
        if (!regex.test(source)) {
            throw new Error(
                `msp-parse-failure-recovery.test.mjs: expected to find and replace "${label}" in ${relSrcPath} ` +
                `but the pattern ${regex} did not match. Update the test's substitution rules.`
            );
        }
        source = source.replace(regex, replacement);
    }
    const outPath = join(tmpDir, outName);
    writeFileSync(outPath, source, 'utf8');
    return pathToFileURL(outPath).href;
}

// --- real, import-free leaf modules, loadable straight by absolute URL -------
const realMspCodesUrl = realModuleUrl('js/msp/MSPCodes.js');
const realTimeoutsUrl = realModuleUrl('js/timeouts.js');
const realConfiguratorUrl = realModuleUrl('js/data_storage.js');
const realDedupUrl = realModuleUrl('js/msp/mspDeduplicationQueue.js');
const realStatisticsUrl = realModuleUrl('js/msp/mspStatistics.js');
const realSmoothFilterUrl = realModuleUrl('js/simple_smooth_filter.js');
const realInjectedMethodsUrl = realModuleUrl('js/injected_methods.js');

// eventFrequencyAnalyzer and serial_queue start un-refed intervals in their
// IIFEs. `.unref()` changes nothing about whether or how they run - it only
// stops Node from waiting on them to decide when the process may exit, which
// would otherwise hang `node --test` forever.
const realEventFrequencyAnalyzerUrl = rewriteAndWrite('js/eventFrequencyAnalyzer.js', [
    [/privateScope\.intervalHandler = setInterval\(publicScope\.analyze, bufferPeriod\);/g, 'privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod).unref();', "analyze setInterval"],
], 'eventFrequencyAnalyzer-generated.mjs');

const realMspQueueUrl = rewriteAndWrite('js/serial_queue.js', [
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    [/^import SimpleSmoothFilter from '\.\/simple_smooth_filter';$/m, `import SimpleSmoothFilter from '${realSmoothFilterUrl}';`, "import SimpleSmoothFilter"],
    [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${realEventFrequencyAnalyzerUrl}';`, "import eventFrequencyAnalyzer"],
    [/^import mspDeduplicationQueue from '\.\/msp\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realDedupUrl}';`, "import mspDeduplicationQueue"],
    [/setInterval\(publicScope\.executor, Math\.round\(1000 \/ privateScope\.handlerFrequency\)\);/, 'setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency)).unref();', "executor setInterval"],
    [/setInterval\(publicScope\.balancer, Math\.round\(1000 \/ privateScope\.balancerFrequency\)\);/, 'setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency)).unref();', "balancer setInterval"],
], 'serial_queue-generated.mjs');

const realMspUrl = rewriteAndWrite('js/msp.js', [
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    [/^import mspQueue from '\.\/serial_queue';$/m, `import mspQueue from '${realMspQueueUrl}';`, "import mspQueue"],
    [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${realEventFrequencyAnalyzerUrl}';`, "import eventFrequencyAnalyzer"],
    [/^import timeout from '\.\/timeouts';$/m, `import timeout from '${realTimeoutsUrl}';`, "import timeout"],
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
], 'msp-generated.mjs');

// FC has to be controllable (the tests set up PID banks); everything below it
// is only referenced from switch cases these tests never reach, so those
// imports just have to resolve.
const FC_STATE_ID = '__mspParseFailureFcState';
globalThis[FC_STATE_ID] = { PIDs: [], FC_CONFIG: undefined };

const fcStubUrl = dataModule(`
    const FC = globalThis['${FC_STATE_ID}'];
    export default FC;
`);
const inertDefaultUrl = dataModule('export default {};');
const inertFwApproachUrl = dataModule('export const FwApproach = class {};');
const inertGeozoneUrl = dataModule(`
    export const Geozone = class {};
    export const GeozoneVertex = class {};
    export const GeozoneShapes = {};
`);

const realMspHelperUrl = rewriteAndWrite('js/msp/MSPHelper.js', [
    [/^import semver from 'semver';$/m, `import semver from '${inertDefaultUrl}';`, "import semver"],
    [/^import '\.\/\.\.\/injected_methods';$/m, `import '${realInjectedMethodsUrl}';`, "import injected_methods"],
    [/^import GUI from '\.\/\.\.\/gui';$/m, `import GUI from '${inertDefaultUrl}';`, "import GUI"],
    [/^import MSP from '\.\/\.\.\/msp';$/m, `import MSP from '${realMspUrl}';`, "import MSP"],
    [/^import MSPCodes from '\.\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    [/^import FC from '\.\/\.\.\/fc';$/m, `import FC from '${fcStubUrl}';`, "import FC"],
    [/^import VTX from '\.\/\.\.\/vtx';$/m, `import VTX from '${inertDefaultUrl}';`, "import VTX"],
    [/^import mspQueue from '\.\/\.\.\/serial_queue';$/m, `import mspQueue from '${realMspQueueUrl}';`, "import mspQueue"],
    [/^import ServoMixRule from '\.\/\.\.\/servoMixRule';$/m, `import ServoMixRule from '${inertDefaultUrl}';`, "import ServoMixRule"],
    [/^import MotorMixRule from '\.\/\.\.\/motorMixRule';$/m, `import MotorMixRule from '${inertDefaultUrl}';`, "import MotorMixRule"],
    [/^import LogicCondition from '\.\/\.\.\/logicCondition';$/m, `import LogicCondition from '${inertDefaultUrl}';`, "import LogicCondition"],
    [/^import BitHelper from '\.\.\/bitHelper';$/m, `import BitHelper from '${inertDefaultUrl}';`, "import BitHelper"],
    [/^import serialPortHelper from '\.\/\.\.\/serialPortHelper';$/m, `import serialPortHelper from '${inertDefaultUrl}';`, "import serialPortHelper"],
    [/^import ProgrammingPid from '\.\/\.\.\/programmingPid';$/m, `import ProgrammingPid from '${inertDefaultUrl}';`, "import ProgrammingPid"],
    [/^import Safehome from '\.\/\.\.\/safehome';$/m, `import Safehome from '${inertDefaultUrl}';`, "import Safehome"],
    [/^import \{ FwApproach \} from '\.\/\.\.\/fwApproach';$/m, `import { FwApproach } from '${inertFwApproachUrl}';`, "import FwApproach"],
    [/^import Waypoint from '\.\/\.\.\/waypoint';$/m, `import Waypoint from '${inertDefaultUrl}';`, "import Waypoint"],
    [/^import mspDeduplicationQueue from '\.\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realDedupUrl}';`, "import mspDeduplicationQueue"],
    [/^import mspStatistics from '\.\/mspStatistics';$/m, `import mspStatistics from '${realStatisticsUrl}';`, "import mspStatistics"],
    [/^import settingsCache from '\.\/\.\.\/settingsCache';$/m, `import settingsCache from '${inertDefaultUrl}';`, "import settingsCache"],
    [/^import \{Geozone, GeozoneVertex, GeozoneShapes \} from '\.\/\.\.\/geozone';$/m, `import { Geozone, GeozoneVertex, GeozoneShapes } from '${inertGeozoneUrl}';`, "import Geozone"],
], 'MSPHelper-generated.mjs');

const { default: mspHelper } = await import(realMspHelperUrl);
const { default: MSPCodes } = await import(realMspCodesUrl);
const { default: MSP } = await import(realMspUrl);
const { default: mspQueue } = await import(realMspQueueUrl);
const { default: mspDeduplicationQueue } = await import(realDedupUrl);

const FC = globalThis[FC_STATE_ID];

/** Stand-in for the MSP decoder object processData() reads its message off. */
function makeDataHandler(code, payloadBytes, onFinish) {
    const buffer = new Uint8Array(payloadBytes).buffer;
    const entry = {
        code,
        onFinish,
        createdOn: Date.now(),
        sentOn: Date.now(),
        timerFired: false,
    };
    entry.timer = setTimeout(() => { entry.timerFired = true; }, 25);

    return {
        code,
        unsupported: false,
        message_buffer: buffer,
        message_length_expected: payloadBytes.length,
        callbacks: [entry],
        entry,
    };
}

function elevenEmptyBanks() {
    return Array.from({ length: 11 }, () => new Array(4));
}

/** message_length_expected / 4 banks of ascending, distinguishable bytes. */
function pidPayload(bankCount) {
    const bytes = [];
    for (let bank = 0; bank < bankCount; bank++) {
        bytes.push(bank * 4 + 1, bank * 4 + 2, bank * 4 + 3, bank * 4 + 4);
    }
    return bytes;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('MSP2_PID: an FC reporting more banks than we know must not throw', () => {
    FC.PIDs = elevenEmptyBanks();

    let response = null;
    // 12 banks: PID_ITEM_COUNT grew by one (PID_AUTO_SPEED) while
    // serial_backend.js still pre-sizes FC.PIDs to 11.
    const handler = makeDataHandler(MSPCodes.MSP2_PID, pidPayload(12), (resp) => { response = resp; });

    assert.doesNotThrow(() => mspHelper.processData(handler));

    assert.equal(FC.PIDs.length, 12, 'FC.PIDs must grow to the bank count the FC reported');
    assert.deepEqual(FC.PIDs[0], [1, 2, 3, 4], 'the first bank must still be parsed');
    assert.deepEqual(FC.PIDs[11], [45, 46, 47, 48], 'the extra bank must be kept, not dropped');
    assert.notEqual(response, null, 'the request must complete');
});

test('MSP2_PID positive control: a matching bank count parses unchanged', () => {
    FC.PIDs = elevenEmptyBanks();

    let response = null;
    const handler = makeDataHandler(MSPCodes.MSP2_PID, pidPayload(11), (resp) => { response = resp; });
    mspHelper.processData(handler);

    assert.equal(FC.PIDs.length, 11, 'a matching FC must not change the bank count');
    assert.deepEqual(FC.PIDs[10], [41, 42, 43, 44]);
    assert.notEqual(response, null);
});

test('a parser that throws must still complete the request', async () => {
    // MSP_LOOP_TIME's case does data.getInt16(0) and writes into FC.FC_CONFIG.
    // With an empty payload from a mismatched FC that throws mid-parse - which
    // is the shape of every "FC and Configurator disagree about a payload" bug.
    FC.FC_CONFIG = undefined;

    let response = null;
    const handler = makeDataHandler(MSPCodes.MSP_LOOP_TIME, [], (resp) => { response = resp; });
    mspDeduplicationQueue.put(MSPCodes.MSP_LOOP_TIME);

    assert.doesNotThrow(
        () => mspHelper.processData(handler),
        'a failed parse must not propagate out of processData()'
    );

    assert.notEqual(response, null, 'the waiting tab must still get its callback, or it hangs forever');
    assert.equal(response.command, MSPCodes.MSP_LOOP_TIME);
    assert.equal(handler.callbacks.length, 0, 'the request must be removed from the pending list');
    assert.equal(
        mspDeduplicationQueue.check(MSPCodes.MSP_LOOP_TIME),
        false,
        'the code must be released, or every retry is rejected as a duplicate'
    );

    await wait(60);
    assert.equal(handler.entry.timerFired, false, 'the response timeout must have been cleared');
});

test('a throwing processData must not leave the MSP queue hard-locked', async () => {
    const originalProcessData = MSP.processData;
    mspQueue.setLockMethod('hard');
    mspQueue.setHardLock();
    assert.equal(mspQueue.isLocked(), true, 'sanity: the queue starts locked');

    MSP.setProcessData(() => { throw new Error('parser blew up'); });
    MSP.message_checksum = 7;
    MSP.message_length_received = 12;
    MSP.state = MSP.decoder_states.PAYLOAD_V2;

    try {
        // The exception itself is expected to propagate - the connection's receive
        // dispatch catches it. What must not happen is the cleanup being skipped.
        assert.throws(() => MSP._dispatch_message(7), /parser blew up/);

        assert.equal(MSP.state, MSP.decoder_states.IDLE, 'the decoder state must be reset');
        assert.equal(MSP.message_length_received, 0);

        await wait(60); // the hard lock is released on a 10ms timeout
        assert.equal(mspQueue.isLocked(), false, 'the hard lock must be released even when the parser throws');
    } finally {
        MSP.setProcessData(originalProcessData);
        mspQueue.freeHardLock();
        mspQueue.setLockMethod('soft');
    }
});
