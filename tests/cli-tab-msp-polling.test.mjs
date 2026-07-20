#!/usr/bin/env node
/**
 * Regression test for the CLI-tab flush-then-flag race.
 *
 * Bug: tabs/cli.js's cliTab.initialize() synchronously flushes the MSP
 * queue (mspQueue.flush()), then only sets CONFIGURATOR.cliActive = true
 * *inside* the async `import('./cli.html?raw').then(...)` callback. Between
 * the synchronous flush and that later microtask/macrotask, any other code
 * that reads CONFIGURATOR.cliActive still sees `false`. In the running app,
 * js/periodicStatusUpdater.js's run() fires every 300ms via a
 * setInterval that is deliberately kept alive across tab switches, and it
 * only skips sending its 4 MSP status-poll requests
 * `if (!stoppped && !CONFIGURATOR.cliActive)`. A tick landing in that gap
 * queues 4 MSP sends that were never meant to go out while the CLI session
 * is active, corrupting the FC's CLI stream.
 *
 * Fix under test: move `CONFIGURATOR.cliActive = true;` to the very first
 * line of cliTab.initialize(), before mspQueue.flush() and before the async
 * import() call, closing the race (JS is single-threaded, so no interleaving
 * tick can land between "queue flushed" and "further sends suppressed").
 *
 * --- Why this test executes the REAL production files, with minimal,
 *     mechanical, non-logic substitutions -----------------------------
 *
 * tabs/cli.js and js/periodicStatusUpdater.js cannot be imported as-is in
 * plain Node:
 *   - cli.js uses a Vite-only dynamic import `import('./cli.html?raw')`.
 *     Node's ESM loader hard-fails on the `.html` extension during format
 *     detection *before* any mocking hook gets a chance to intervene (this
 *     was verified directly against Node's internal
 *     `test_runner/mock/loader` source: its `load()` hook unconditionally
 *     calls `nextLoad()` first to compute `original.format`, and only
 *     checks whether a mock is registered afterwards - so
 *     `.html` extensions can never be mocked via `t.mock.module`,
 *     experimental or not).
 *   - Both files also pull in jQuery's global `$`, i18n, CliAutoComplete,
 *     dialog, jBox, and (transitively, via fc.js) the `ol` mapping package,
 *     which itself uses extensionless internal imports incompatible with
 *     strict Node ESM resolution - none of which are relevant to the race
 *     being tested.
 *
 * Rather than hand-write a "mirrored reimplementation" of the fixed logic
 * (which would NOT catch a future regression if someone reorders the real
 * file again), this test reads the REAL source of both files fresh off disk
 * at run time and performs only mechanical, whitespace-insensitive
 * substitutions of *import specifiers* (redirecting unrelated
 * UI/i18n/dialog/etc. dependencies to inert stub modules, expressed as
 * `data:` URL ES modules) and of the one Vite-only asset import (redirected
 * to an inert `data:` URL module standing in for the loaded HTML). The
 * substitutions never touch any statement, expression, or ordering in the
 * function bodies under test. MSP.send_message, mspQueue, CONFIGURATOR, and
 * MSPCodes are left wired to the REAL modules (loaded once and shared via
 * Node's module cache, exactly the singletons the app itself uses) so the
 * assertions below observe genuine MSP-queue state, not a mock's stand-in.
 *
 * If a future change to cli.js or periodicStatusUpdater.js alters the
 * exact import lines being substituted, the substitution step below throws
 * loudly (rather than silently matching nothing), forcing this test to be
 * updated rather than passing vacuously.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

// Real, unmocked production modules - these ARE the code under test's
// dependencies for MSP queuing; we want genuine behavior here.
//
// This whole codebase uses Vite-style extensionless relative imports
// (e.g. `import MSPCodes from './msp/MSPCodes'`), which plain Node's
// ESM resolver refuses to load (ERR_MODULE_NOT_FOUND). The leaf modules
// below (data_storage.js, mspDeduplicationQueue.js, timeouts.js,
// MSPCodes.js, eventFrequencyAnalyzer.js, simple_smooth_filter.js) have no
// imports of their own, so they can be loaded directly by absolute
// file:// URL. js/msp.js and js/serial_queue.js each import a few of those
// siblings extensionlessly, so - exactly like tabs/cli.js and
// periodicStatusUpdater.js below - we load their REAL source text fresh
// off disk and mechanically rewrite only those import specifiers to
// absolute file:// URLs, changing no statement, expression or ordering.
const sharedRealModuleTmpDir = mkdtempSync(join(tmpdir(), 'cli-tab-msp-polling-realmods-'));

// Every mkdtempSync'd directory in this file (the shared one above plus one
// per test) is tracked here and removed on process exit, rather than left
// behind in the OS temp dir on every run.
const tmpDirsToCleanup = [sharedRealModuleTmpDir];
process.on('exit', () => {
    for (const dir of tmpDirsToCleanup) {
        rmSync(dir, { recursive: true, force: true });
    }
});

const realConfiguratorUrl = pathToFileURL(join(repoRoot, 'js/data_storage.js')).href;
const realMspDedupUrl = pathToFileURL(join(repoRoot, 'js/msp/mspDeduplicationQueue.js')).href;
const realTimeoutUrl = pathToFileURL(join(repoRoot, 'js/timeouts.js')).href;
const realMspCodesUrl = pathToFileURL(join(repoRoot, 'js/msp/MSPCodes.js')).href;
const realSimpleSmoothFilterUrl = pathToFileURL(join(repoRoot, 'js/simple_smooth_filter.js')).href;

function rewriteAndWrite(relSrcPath, rules, outNamePrefix) {
    let source = readFileSync(join(repoRoot, relSrcPath), 'utf8');
    for (const [regex, replacement, label] of rules) {
        if (!regex.test(source)) {
            throw new Error(
                `cli-tab-msp-polling.test.mjs: expected to find and replace "${label}" in ${relSrcPath} ` +
                `but the pattern ${regex} did not match. Update the test's substitution rules.`
            );
        }
        source = source.replace(regex, replacement);
    }
    const outPath = join(sharedRealModuleTmpDir, `${outNamePrefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
    writeFileSync(outPath, source, 'utf8');
    return pathToFileURL(outPath).href;
}

// eventFrequencyAnalyzer.js has no imports of its own to rewrite, but its
// IIFE unconditionally starts a 5000ms setInterval() (never un-refed) to
// aggregate debug event counts - irrelevant to this test and, being ref'd,
// would keep the Node process alive forever. `.unref()` again changes
// nothing about whether/how it runs, only whether Node waits on it to exit.
const realEventFrequencyAnalyzerUrl = rewriteAndWrite('js/eventFrequencyAnalyzer.js', [
    [/privateScope\.intervalHandler = setInterval\(publicScope\.analyze, bufferPeriod\);/g, 'privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod).unref();', "analyze setInterval (both call sites)"],
], 'eventFrequencyAnalyzer-generated');

// serial_queue.js first (msp.js depends on it), so msp.js's rewritten copy
// can point at this exact same generated singleton.
const realMspQueueUrl = rewriteAndWrite('js/serial_queue.js', [
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    [/^import SimpleSmoothFilter from '\.\/simple_smooth_filter';$/m, `import SimpleSmoothFilter from '${realSimpleSmoothFilterUrl}';`, "import SimpleSmoothFilter"],
    [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${realEventFrequencyAnalyzerUrl}';`, "import eventFrequencyAnalyzer"],
    [/^import mspDeduplicationQueue from '\.\/msp\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realMspDedupUrl}';`, "import mspDeduplicationQueue"],
    // serial_queue.js's IIFE unconditionally starts two setInterval timers
    // (a 10ms queue executor and a 50ms lock-balancer) meant to drain
    // requests to a live serial port. They are harmless in this test
    // (CONFIGURATOR.connection is a mock with a no-op send(), and
    // executor() explicitly no-ops whenever `CONFIGURATOR.connection ===
    // false` or the queue is locked), but being un-refed timers they would
    // otherwise keep the Node process alive forever, hanging `node --test`.
    // `.unref()` changes nothing about *whether* or *how* these timers run
    // (real behavior/timing preserved) - it only tells Node not to wait on
    // them to decide when the process may exit.
    [/setInterval\(publicScope\.executor, Math\.round\(1000 \/ privateScope\.handlerFrequency\)\);/, 'setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency)).unref();', "executor setInterval"],
    [/setInterval\(publicScope\.balancer, Math\.round\(1000 \/ privateScope\.balancerFrequency\)\);/, 'setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency)).unref();', "balancer setInterval"],
], 'serial_queue-generated');

const realMspUrl = rewriteAndWrite('js/msp.js', [
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    [/^import mspQueue from '\.\/serial_queue';$/m, `import mspQueue from '${realMspQueueUrl}';`, "import mspQueue"],
    [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${realEventFrequencyAnalyzerUrl}';`, "import eventFrequencyAnalyzer"],
    [/^import timeout from '\.\/timeouts';$/m, `import timeout from '${realTimeoutUrl}';`, "import timeout"],
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
], 'msp-generated');

function dataModule(code) {
    // encodeURIComponent deliberately leaves ' ( ) ! * unescaped (they're
    // "unreserved marks" per RFC 3986). Since the generated import
    // specifiers are embedded in single-quoted JS string literals, a literal
    // apostrophe surviving in the URL (e.g. from `typeof x === 'function'`)
    // would prematurely terminate that string literal and corrupt the
    // generated file. Percent-encode those characters too; Node's data: URL
    // handling still decodes them correctly.
    const encoded = encodeURIComponent(code).replace(/['()!*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:text/javascript,' + encoded;
}

// Inert stand-ins for dependencies that are irrelevant to the race being
// tested (UI wiring, i18n, dialogs, jBox modal, connection-type constants,
// FC state, filename helper). Each is a tiny, self-contained ES module
// expressed as a data: URL so no extra fixture files or module-mocking
// APIs are required.
const mockGuiUrl = dataModule(`
    const GUI = {
        active_tab: null,
        load(html, cb) { if (typeof cb === 'function') cb(); },
        content_ready(cb) { if (typeof cb === 'function') cb(); },
        log() {},
    };
    export default GUI;
`);

const mockI18nUrl = dataModule(`
    const i18n = { localize() {}, getMessage(key) { return key; } };
    export default i18n;
`);

const mockGlobalSettingsUrl = dataModule(`
    export const globalSettings = { docsTreeLocation: '' };
`);

const mockCliAutoCompleteUrl = dataModule(`
    const CliAutoComplete = {
        initialize() {},
        isOpen() { return false; },
        isEnabled() { return false; },
        isBuilding() { return false; },
        openLater() {},
    };
    export default CliAutoComplete;
`);

const mockConnectionUrl = dataModule(`
    export const ConnectionType = { UDP: 'mock-udp', BLE: 'mock-ble' };
`);

const mockJboxUrl = dataModule(`
    export default function jBox() { return { open() {}, close() {} }; }
`);

const mockFcUrl = dataModule(`
    const FC = { CONFIG: {}, ANALOG: undefined, MISC: undefined, isModeEnabled() { return false; } };
    export default FC;
`);

const mockHelpersUrl = dataModule(`
    export function generateFilename() { return 'mock.txt'; }
`);

const mockDialogUrl = dataModule(`
    const dialog = {
        showSaveDialog() { return Promise.resolve({ canceled: true }); },
        showOpenDialog() { return Promise.resolve({ canceled: true }); },
    };
    export default dialog;
`);

/**
 * Replace the first line matching `regex` with `replacement`. Throws if no
 * line matches, so a future edit to the import lines we depend on fails the
 * test loudly instead of silently doing nothing.
 */
function mustReplace(source, regex, replacement, label) {
    if (!regex.test(source)) {
        throw new Error(
            `cli-tab-msp-polling.test.mjs: expected to find and replace "${label}" ` +
            `but the pattern ${regex} did not match. The source file this test ` +
            `depends on may have changed shape; update the test's substitution rules.`
        );
    }
    return source.replace(regex, replacement);
}

/**
 * Load the real tabs/cli.js source, redirect its import specifiers so it can
 * run under plain Node, and write the result to a fresh temp file for
 * dynamic import. Only import specifiers are touched - every statement,
 * expression and ordering from the real file is preserved verbatim.
 */
function buildExecutableCliTabModule(tmpDir) {
    let source = readFileSync(join(repoRoot, 'tabs/cli.js'), 'utf8');

    const rules = [
        [/^import MSP from '\.\/\.\.\/js\/msp';$/m, `import MSP from '${realMspUrl}';`, "import MSP"],
        [/^import mspQueue from '\.\/\.\.\/js\/serial_queue';$/m, `import mspQueue from '${realMspQueueUrl}';`, "import mspQueue"],
        [/^import GUI from '\.\/\.\.\/js\/gui';$/m, `import GUI from '${mockGuiUrl}';`, "import GUI"],
        [/^import CONFIGURATOR from '\.\/\.\.\/js\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
        [/^import timeout from '\.\/\.\.\/js\/timeouts';$/m, `import timeout from '${realTimeoutUrl}';`, "import timeout"],
        [/^import i18n from '\.\/\.\.\/js\/localization';$/m, `import i18n from '${mockI18nUrl}';`, "import i18n"],
        [/^import \{ globalSettings \} from '\.\/\.\.\/js\/globalSettings';$/m, `import { globalSettings } from '${mockGlobalSettingsUrl}';`, "import globalSettings"],
        [/^import CliAutoComplete from '\.\/\.\.\/js\/CliAutoComplete';$/m, `import CliAutoComplete from '${mockCliAutoCompleteUrl}';`, "import CliAutoComplete"],
        [/^import \{ ConnectionType \} from '\.\/\.\.\/js\/connection\/connection';$/m, `import { ConnectionType } from '${mockConnectionUrl}';`, "import ConnectionType"],
        [/^import jBox from 'jbox';$/m, `import jBox from '${mockJboxUrl}';`, "import jBox"],
        [/^import mspDeduplicationQueue from '\.\/\.\.\/js\/msp\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realMspDedupUrl}';`, "import mspDeduplicationQueue"],
        [/^import FC from '\.\/\.\.\/js\/fc';$/m, `import FC from '${mockFcUrl}';`, "import FC"],
        [/^import \{ generateFilename \} from '\.\/\.\.\/js\/helpers';$/m, `import { generateFilename } from '${mockHelpersUrl}';`, "import generateFilename"],
        [/^import dialog from '\.\.\/js\/dialog';$/m, `import dialog from '${mockDialogUrl}';`, "import dialog"],
        // The one Vite-only asset import: Node cannot resolve `.html` specifiers
        // (verified: even node:test's experimental module mocking cannot
        // intercept this, since format detection on the real .html extension
        // runs before any mock lookup). Stand in an inert HTML string via a
        // data: URL module - this does not change cliTab.initialize()'s
        // control flow or statement order at all, only what markup would have
        // been rendered.
        [/import\('\.\/cli\.html\?raw'\)/, `import('${dataModule('export default "<div></div>";')}')`, "dynamic import of cli.html"],
    ];

    for (const [regex, replacement, label] of rules) {
        source = mustReplace(source, regex, replacement, label);
    }

    const outPath = join(tmpDir, `cli-generated-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
    writeFileSync(outPath, source, 'utf8');
    return outPath;
}

/**
 * Load the real js/periodicStatusUpdater.js source, redirecting only its GUI
 * and FC imports (GUI is unused by run()'s gate; FC is only touched inside
 * updateView(), reached exclusively down the "leak" branch we are testing
 * for). MSP, CONFIGURATOR and MSPCodes stay wired to the real modules.
 */
function buildExecutablePeriodicStatusUpdaterModule(tmpDir) {
    let source = readFileSync(join(repoRoot, 'js/periodicStatusUpdater.js'), 'utf8');

    const rules = [
        [/^import GUI from '\.\/gui';$/m, `import GUI from '${mockGuiUrl}';`, "import GUI"],
        [/^import FC from '\.\/fc';$/m, `import FC from '${mockFcUrl}';`, "import FC"],
        [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
        [/^import MSP from '\.\/msp';$/m, `import MSP from '${realMspUrl}';`, "import MSP"],
        [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    ];

    for (const [regex, replacement, label] of rules) {
        source = mustReplace(source, regex, replacement, label);
    }

    const outPath = join(tmpDir, `psu-generated-${Date.now()}-${Math.random().toString(36).slice(2)}.mjs`);
    writeFileSync(outPath, source, 'utf8');
    return outPath;
}

// A permissive, chainable jQuery stand-in. Both cli.js and
// periodicStatusUpdater.js call the bare global `$` (provided by the real
// app's bundler); we only need it to never throw.
function installGlobalJQueryStub() {
    function makeChain() {
        const chain = new Proxy(function chain() {}, {
            get(_target, prop) {
                if (prop === 'val') return (v) => (v === undefined ? '' : chain);
                if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
                if (prop === Symbol.toPrimitive) return () => '';
                return (..._args) => chain;
            },
            apply() { return makeChain(); },
        });
        return chain;
    }
    global.$ = function jQueryStub() { return makeChain(); };
    // cli.js's initialize() reads `document.queryCommandSupported?.('copy')`
    // as a feature-detect fallback for clipboard support; plain Node has no
    // `document` global at all. Node's built-in `navigator` global already
    // exists (and has no `.clipboard`), so `navigator.clipboard?.writeText`
    // safely evaluates to undefined via optional chaining without needing a
    // stub.
    if (typeof global.document === 'undefined') {
        global.document = {};
    }
}

test('CLI tab: periodicStatusUpdater must not queue MSP polls during cliTab.initialize()\'s async window', async (t) => {
    installGlobalJQueryStub();

    const tmpDir = mkdtempSync(join(tmpdir(), 'cli-tab-msp-polling-'));
    tmpDirsToCleanup.push(tmpDir);

    const cliModulePath = buildExecutableCliTabModule(tmpDir);
    const psuModulePath = buildExecutablePeriodicStatusUpdaterModule(tmpDir);

    const { default: cliTab } = await import(pathToFileURL(cliModulePath).href);
    const { default: periodicStatusUpdater } = await import(pathToFileURL(psuModulePath).href);

    // Real singletons, imported the same way the generated modules resolved
    // them, so they are the exact same module-cache instances.
    const { default: mspQueue } = await import(realMspQueueUrl);
    const { default: CONFIGURATOR } = await import(realConfiguratorUrl);
    const { default: mspDeduplicationQueue } = await import(realMspDedupUrl);
    const { default: realTimeoutModule } = await import(realTimeoutUrl);

    try {
    // --- Arrange: a connected session about to open the CLI tab ---------
    // CONFIGURATOR.connection is deliberately left `false` (its real default,
    // see js/data_storage.js) through the synchronous assertion below: real
    // mspQueue.executor() explicitly no-ops whenever `CONFIGURATOR.connection
    // === false`, which keeps its background 10ms-interval from dequeuing
    // and "sending" (and then endlessly retry-timing-out) whatever this test
    // deliberately leaks into the queue. It's switched to a connected mock
    // further down, once the leak assertion has already been made and the
    // queue has been drained, purely so the real cli.js code's later
    // `CONFIGURATOR.connection.type` checks (unrelated to the race under
    // test) don't throw.
    CONFIGURATOR.connection = false;
    CONFIGURATOR.connectionValid = true;
    CONFIGURATOR.cliActive = false;
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    assert.equal(mspQueue.getLength(), 0, 'sanity: queue starts empty');

    // --- Act: open the CLI tab -------------------------------------------
    // cliTab.initialize() runs synchronously up to (and including) its
    // mspQueue.flush() call, then continues asynchronously inside the
    // dynamic import().then(...) chain.
    cliTab.initialize(() => {});

    // Simulate periodicStatusUpdater's global_data_refresh interval firing
    // *immediately* after initialize() returns, i.e. squarely inside the gap
    // between the synchronous flush and the (still-pending) async
    // .then(...) callback that either does or does not set cliActive.
    periodicStatusUpdater.run();

    // On the buggy code (cliActive set only inside the async callback),
    // CONFIGURATOR.cliActive is still false at this point, so run() enqueues
    // its 4 MSP_SENSOR_STATUS/MSPV2_INAV_STATUS/MSP_ACTIVEBOXES/
    // MSPV2_INAV_ANALOG requests. On the fixed code (cliActive set as the
    // very first line of initialize(), before the flush), cliActive is
    // already true here, so run() takes the early-exit branch and nothing
    // is queued. Captured now rather than asserted immediately, so the rest
    // of this test - including giving the real async import().then(...)
    // chain time to finish (and register/settle its own real timers) - still
    // runs even when this indicates a leak; the assertion happens at the
    // end, once cleanup no longer depends on it.
    const leakedDuringAsyncWindow = mspQueue.getLength();

    // --- Let the real async chain actually finish, then confirm it did ---
    // Drain the queue AND its deduplication tracking *before* connection
    // becomes truthy, so the real (still `false`-gated-until-now) executor
    // interval finds nothing to dequeue/retry once it starts actually being
    // allowed to run.
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    // Now provide a connected-looking `connection` so the rest of the real
    // initialize() body (unrelated to the race under test, e.g. its
    // `CONFIGURATOR.connection.type == ConnectionType.UDP` check) can finish
    // running without throwing.
    CONFIGURATOR.connection = { type: 'mock', send() {}, isCli: false, getTimeout() { return 5000; } };
    await new Promise((r) => setTimeout(r, 50));
    assert.equal(CONFIGURATOR.cliActive, true, 'cliTab.initialize() should eventually set CONFIGURATOR.cliActive = true');

    mspQueue.flush();
    mspDeduplicationQueue.flush();
    periodicStatusUpdater.run();
    assert.equal(mspQueue.getLength(), 0, 'no MSP requests should be queued once CLI is confirmed active');

    // --- The actual regression assertion ---------------------------------
    assert.equal(
        leakedDuringAsyncWindow,
        0,
        `expected no MSP requests queued while CLI tab is initializing, but found ${leakedDuringAsyncWindow}. ` +
        `This means CONFIGURATOR.cliActive was still false when periodicStatusUpdater.run() ticked during ` +
        `cliTab.initialize()'s async window - the flush-then-flag race is present.`
    );

    } finally {
        // cli.js's real initialize() body scheduled a real
        // `timeout.add('enter_cli', ..., 250)` callback via the real
        // js/timeouts.js module (unrelated to the race under test - it just
        // sends the '#' byte to "enter" the CLI once opened). Left pending,
        // it would fire ~250ms from now, after this test has returned, and
        // could race the next test's mutation of the shared CONFIGURATOR
        // singleton. Cancel it the same way the real app would on
        // tab-away/cleanup. This runs in `finally` so it happens even when
        // the leak assertion above throws (i.e. on the current, unfixed
        // code) - otherwise the pending timeout would only ever get
        // cancelled on the passing/fixed-code run.
        realTimeoutModule.remove('enter_cli');
        mspQueue.flush();
        mspDeduplicationQueue.flush();
    }
});

test('periodicStatusUpdater.run() sanity check: sends MSP polls when CLI is not active (positive control)', async () => {
    installGlobalJQueryStub();

    const tmpDir = mkdtempSync(join(tmpdir(), 'cli-tab-msp-polling-'));
    tmpDirsToCleanup.push(tmpDir);
    const psuModulePath = buildExecutablePeriodicStatusUpdaterModule(tmpDir);

    const { default: periodicStatusUpdater } = await import(pathToFileURL(psuModulePath).href);
    const { default: mspQueue } = await import(realMspQueueUrl);
    const { default: CONFIGURATOR } = await import(realConfiguratorUrl);
    const { default: mspDeduplicationQueue } = await import(realMspDedupUrl);

    // Left `false` (see the comment in the test above) so the real
    // mspQueue.executor() background interval no-ops instead of dequeuing
    // and endlessly retry-timing-out these deliberately-queued messages.
    CONFIGURATOR.connection = false;
    CONFIGURATOR.connectionValid = true;
    CONFIGURATOR.cliActive = false;
    mspQueue.flush();
    mspDeduplicationQueue.flush();

    periodicStatusUpdater.run();

    // This is the "happy path" this whole mechanism exists for: when the CLI
    // tab is NOT active, the periodic status poll SHOULD queue its 4
    // requests. If this test fails, the negative-case test above would be
    // meaningless (it could be "passing" only because run() never sends
    // anything at all).
    assert.equal(mspQueue.getLength(), 4, 'periodicStatusUpdater.run() should queue its 4 status-poll MSP requests when CLI is not active');

    mspQueue.flush();
    mspDeduplicationQueue.flush();
});

test('MSP._enqueue retry must not land a message once CLI becomes active mid-retry', async () => {
    const { default: MSP } = await import(realMspUrl);
    const { default: mspQueue } = await import(realMspQueueUrl);
    const { default: CONFIGURATOR } = await import(realConfiguratorUrl);
    const { default: mspDeduplicationQueue } = await import(realMspDedupUrl);
    const { default: MSPCodes } = await import(realMspCodesUrl);

    CONFIGURATOR.connection = false;
    CONFIGURATOR.connectionValid = true;
    CONFIGURATOR.cliActive = false;
    mspQueue.flush();
    mspDeduplicationQueue.flush();

    const code = MSPCodes.MSP_SENSOR_STATUS;

    // Simulate a still-pending earlier request with the same MSP code (e.g.
    // periodicStatusUpdater's previous tick, whose response hasn't arrived
    // yet because round-trip time exceeds the poll interval - a real
    // condition on a slow/loaded serial link). mspQueue.put() rejects this
    // as a duplicate, so MSP.send_message()'s _enqueue() falls back to its
    // retry-in-150ms path instead of queuing immediately.
    mspDeduplicationQueue.put(code);

    let finishedWith;
    MSP.send_message(code, false, false, (result) => { finishedWith = result; });

    assert.equal(mspQueue.getLength(), 0, 'sanity: the duplicate must not have been queued on the first attempt');

    // CLI becomes active in the gap before the retry fires - exactly what
    // happens in the running app when the user switches to the CLI tab
    // while an earlier status poll of the same code is still in flight.
    CONFIGURATOR.cliActive = true;
    // The original still-pending request now finishes/expires, so if the
    // retry doesn't check cliActive, it would succeed in queuing this
    // instance the moment the dedup collision clears.
    mspDeduplicationQueue.remove(code);

    await new Promise((r) => setTimeout(r, 200)); // > the 150ms retry delay

    assert.equal(
        mspQueue.getLength(),
        0,
        'MSP._enqueue must not land a retried message once CONFIGURATOR.cliActive became true in the meantime'
    );
    assert.equal(finishedWith, false, 'the abandoned message should still resolve its callback with false, not hang forever');

    mspQueue.flush();
    mspDeduplicationQueue.flush();
});

test('MSP._enqueue retry sanity check: succeeds once the duplicate clears while CLI stays inactive (positive control)', async () => {
    const { default: MSP } = await import(realMspUrl);
    const { default: mspQueue } = await import(realMspQueueUrl);
    const { default: CONFIGURATOR } = await import(realConfiguratorUrl);
    const { default: mspDeduplicationQueue } = await import(realMspDedupUrl);
    const { default: MSPCodes } = await import(realMspCodesUrl);

    CONFIGURATOR.connection = false;
    CONFIGURATOR.connectionValid = true;
    CONFIGURATOR.cliActive = false;
    mspQueue.flush();
    mspDeduplicationQueue.flush();

    const code = MSPCodes.MSP_SENSOR_STATUS;
    mspDeduplicationQueue.put(code);

    let finishedWith;
    MSP.send_message(code, false, false, (result) => { finishedWith = result; });
    assert.equal(mspQueue.getLength(), 0, 'sanity: the duplicate must not have been queued on the first attempt');

    mspDeduplicationQueue.remove(code);
    await new Promise((r) => setTimeout(r, 200));

    // This is the behavior the retry mechanism exists for: once the
    // duplicate clears and CLI never became active, the retry SHOULD
    // eventually land the message. If this fails, the negative-case test
    // above would be meaningless (it could be "passing" only because
    // retries never queue anything at all).
    assert.equal(mspQueue.getLength(), 1, 'the retried message should be queued once the duplicate clears and CLI stayed inactive');
    assert.equal(finishedWith, undefined, 'onFinish should not fire for a message that was successfully queued');

    mspQueue.flush();
    mspDeduplicationQueue.flush();
});

