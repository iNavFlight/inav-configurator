#!/usr/bin/env node
/**
 * Regression test for the receive chain being killed by one throwing listener.
 *
 * Bug: every transport dispatched incoming data with a bare
 * `this._onReceiveListeners.forEach(listener => listener(info))`. A listener
 * that throws aborts the whole forEach, so every listener registered after it
 * never sees that chunk - or any later one - and the exception escapes uncaught
 * into the IPC handler.
 *
 * Observed as: opening the firmware flasher right after startup and running a
 * pre-flash backup died on `Cannot set properties of null (setting
 * 'flightControllerVersion')` (FC.CONFIG is null until the first normal connect
 * calls FC.resetState()). That throw happened inside the dispatch loop, so
 * MSP.read() never processed the response, the flasher waited forever for an
 * answer and GUI.connect_lock stayed true - the app soft-locked.
 *
 * Fix under test: Connection.notifyReceiveListeners() /
 * notifyReceiveErrorListeners() wrap each listener call in try/catch, and all
 * four transports dispatch through them. (The FC.CONFIG null itself is fixed
 * separately in tabs/firmware_flasher.js - see tests/firmware-flasher.test.mjs.)
 *
 * The test executes the REAL production files. This codebase uses Vite-style
 * extensionless relative imports which plain Node's ESM resolver refuses to
 * load, so - like tests/cli-tab-msp-polling.test.mjs - the sources are read
 * fresh off disk and only their *import specifiers* are rewritten (GUI and i18n
 * to inert stubs, './connection' to the rewritten base class). No statement,
 * expression or ordering inside the code under test is touched.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tmpDir = mkdtempSync(join(tmpdir(), 'connection-receive-listener-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

function dataModule(code) {
    // encodeURIComponent leaves ' ( ) ! * unescaped; the generated specifiers are
    // embedded in single-quoted string literals, so escape those too.
    const encoded = encodeURIComponent(code).replace(/['()!*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:text/javascript,' + encoded;
}

const mockGuiUrl = dataModule(`
    const GUI = { connected_to: false, connecting_to: false, log() {} };
    export default GUI;
`);

const mockI18nUrl = dataModule(`
    const i18n = { getMessage(key) { return key; } };
    export default i18n;
`);

/**
 * Rewrite the listed import specifiers in a real source file and write the
 * result to a temp module. Throws loudly if a pattern stops matching, so a
 * future reshuffle of those imports fails the test instead of passing
 * vacuously.
 */
function rewriteAndWrite(relSrcPath, rules, outNamePrefix) {
    let source = readFileSync(join(repoRoot, relSrcPath), 'utf8');
    for (const [regex, replacement, label] of rules) {
        if (!regex.test(source)) {
            throw new Error(
                `connection-receive-listener-isolation.test.mjs: expected to find and replace "${label}" in ` +
                `${relSrcPath} but the pattern ${regex} did not match. Update the test's substitution rules.`
            );
        }
        source = source.replace(regex, replacement);
    }
    const outPath = join(tmpDir, `${outNamePrefix}.mjs`);
    writeFileSync(outPath, source, 'utf8');
    return pathToFileURL(outPath).href;
}

const realConnectionUrl = rewriteAndWrite('js/connection/connection.js', [
    [/^import GUI from '\.\/\.\.\/gui';$/m, `import GUI from '${mockGuiUrl}';`, "import GUI"],
], 'connection-generated');

const realConnectionSerialUrl = rewriteAndWrite('js/connection/connectionSerial.js', [
    [/^import GUI from '\.\/\.\.\/gui';$/m, `import GUI from '${mockGuiUrl}';`, "import GUI"],
    [/^import \{ ConnectionType, Connection \} from '\.\/connection';$/m, `import { ConnectionType, Connection } from '${realConnectionUrl}';`, "import Connection"],
    [/^import i18n from '\.\/\.\.\/localization';$/m, `import i18n from '${mockI18nUrl}';`, "import i18n"],
], 'connectionSerial-generated');

const { default: ConnectionSerial } = await import(realConnectionSerialUrl);

/**
 * Minimal window.electronAPI stand-in. The on* hooks hand the registered
 * handler straight back, so registerIpcListeners() parks the real dispatch
 * closure in _ipcDataHandler / _ipcErrorHandler and the tests can fire it the
 * way the IPC bridge would.
 */
function installElectronApiStub() {
    global.window = {
        electronAPI: {
            onSerialData: (handler) => handler,
            onSerialClose: (handler) => handler,
            onSerialError: (handler) => handler,
            offSerialData: () => {},
            offSerialClose: () => {},
            offSerialError: () => {},
        }
    };
}

/** console.error is noise here - the fix logs every swallowed listener error. */
function silenceConsoleError(t) {
    const original = console.error;
    console.error = () => {};
    t.after(() => { console.error = original; });
}

test('a throwing receive listener must not cut off the listeners behind it', (t) => {
    installElectronApiStub();
    silenceConsoleError(t);

    const connection = new ConnectionSerial();
    connection.registerIpcListeners();

    const seen = { before: 0, after: 0 };
    connection.addOnReceiveListener(() => { seen.before++; });
    connection.addOnReceiveListener(() => {
        // Exactly what the flasher hit: FC.CONFIG was null.
        throw new TypeError("Cannot set properties of null (setting 'flightControllerVersion')");
    });
    connection.addOnReceiveListener(() => { seen.after++; });

    assert.doesNotThrow(
        () => connection._ipcDataHandler(new Uint8Array([1, 2, 3]).buffer),
        'the exception must not escape into the IPC handler'
    );

    assert.equal(seen.before, 1);
    assert.equal(seen.after, 1, 'listeners registered after the throwing one must still receive the chunk');

    // The chain has to survive for every following chunk too, not just this one.
    connection._ipcDataHandler(new Uint8Array([4, 5, 6]).buffer);
    assert.equal(seen.before, 2);
    assert.equal(seen.after, 2, 'the chain must stay intact for later chunks');
});

test('a throwing receive-error listener must not cut off the listeners behind it', (t) => {
    installElectronApiStub();
    silenceConsoleError(t);

    const connection = new ConnectionSerial();
    connection.registerIpcListeners();

    const seen = { before: 0, after: 0 };
    connection.addOnReceiveErrorListener(() => { seen.before++; });
    connection.addOnReceiveErrorListener(() => { throw new Error('bad error handler'); });
    connection.addOnReceiveErrorListener(() => { seen.after++; });

    assert.doesNotThrow(
        () => connection._ipcErrorHandler('port disappeared'),
        'the exception must not escape into the IPC error handler'
    );

    assert.equal(seen.before, 1);
    assert.equal(seen.after, 1, 'error listeners registered after the throwing one must still be notified');
});

test('positive control: data reaches every listener in registration order', () => {
    installElectronApiStub();

    const connection = new ConnectionSerial();
    connection._connectionId = 7;
    connection.registerIpcListeners();

    const order = [];
    connection.addOnReceiveListener((info) => order.push(['first', info]));
    connection.addOnReceiveListener((info) => order.push(['second', info]));

    const buffer = new Uint8Array([9]).buffer;
    connection._ipcDataHandler(buffer);

    assert.deepEqual(order.map(([name]) => name), ['first', 'second']);
    assert.equal(order[0][1].data, buffer, 'the received buffer must be passed through unchanged');
    assert.equal(order[0][1].connectionId, 7, 'the connection id must still be reported');
});
