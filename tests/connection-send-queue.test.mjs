#!/usr/bin/env node
/**
 * Regression tests for the permanently stalled output queue.
 *
 * Bug: js/connection/connection.js's send() drives its output buffer purely
 * from the callback handed to sendImplementation() - that callback is what
 * shifts the sent entry off the buffer and resets _transmitting. In
 * js/connection/connectionSerial.js the callback was only reachable inside
 * `if (this._connectionId)`, and none of the three electronAPI promises
 * (serialConnect / serialSend / serialClose) had a .catch(). When the port
 * disappears (FC rebooting into DFU, cable pulled, port busy during USB
 * re-enumeration) the callback is lost, _transmitting stays true forever and
 * every later send() only pushes into the buffer and returns.
 *
 * Because CONFIGURATOR.connection is a session-wide singleton
 * (connectionFactory hands back the same instance per type), the object stays
 * wedged for the rest of the app's lifetime. disconnect() could not heal it
 * either: emptyOutputBuffer() - the only place resetting _transmitting - sat
 * inside the very `if (this._connectionId)` branch that is false in exactly
 * this situation.
 *
 * Fix under test:
 *   - sendImplementation()/disconnectImplementation() fire their callback on
 *     every path, including when there is no port
 *   - .catch() on all three electronAPI promises
 *   - Connection.disconnect()'s else branch performs the same cleanup
 *
 * The tests below execute the REAL production files. Both use this codebase's
 * Vite-style extensionless relative imports, which plain Node's ESM resolver
 * refuses to load, so - like tests/cli-tab-msp-polling.test.mjs - the sources
 * are read fresh off disk and only their *import specifiers* are rewritten
 * (GUI and i18n to inert stubs, './connection' to the rewritten base class).
 * No statement, expression or ordering inside the code under test is touched.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tmpDir = mkdtempSync(join(tmpdir(), 'connection-send-queue-'));
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
                `connection-send-queue.test.mjs: expected to find and replace "${label}" in ${relSrcPath} ` +
                `but the pattern ${regex} did not match. Update the test's substitution rules.`
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
 * Minimal window.electronAPI stand-in. `behavior` decides what serialSend does,
 * so each test can model a healthy port, a rejected IPC promise or a port that
 * vanished mid-session.
 */
function installElectronApiStub(behavior) {
    const calls = { send: 0, close: 0 };
    global.window = {
        electronAPI: {
            serialConnect: () => Promise.resolve({ error: false, id: 1 }),
            serialSend: (data) => {
                calls.send++;
                return behavior.send(data);
            },
            serialClose: () => {
                calls.close++;
                return behavior.close ? behavior.close() : Promise.resolve({ error: false });
            },
            onSerialData: (handler) => handler,
            onSerialClose: (handler) => handler,
            onSerialError: (handler) => handler,
            offSerialData: () => {},
            offSerialClose: () => {},
            offSerialError: () => {},
        }
    };
    return calls;
}

const payload = new Uint8Array([1, 2, 3]).buffer;

/** Let the promise chains inside sendImplementation settle. */
const settle = () => new Promise((r) => setTimeout(r, 0));

test('send() completes instead of wedging the queue when there is no port', async () => {
    installElectronApiStub({ send: () => Promise.resolve({ error: false, bytesWritten: 3 }) });

    const connection = new ConnectionSerial();
    // _connectionId is null out of the constructor: the port vanished (or was
    // never opened) while the app still holds this singleton.
    let sendInfo = null;
    connection.send(payload, (info) => { sendInfo = info; });
    await settle();

    assert.notEqual(sendInfo, null, 'send() callback must fire even without a port');
    assert.equal(sendInfo.resultCode, 1, 'a portless send must report failure');
    assert.equal(sendInfo.bytesSent, 0);
    assert.equal(connection._transmitting, false, '_transmitting must not stay stuck after a portless send');
    assert.equal(connection._outputBuffer.length, 0, 'the failed entry must be shifted off the buffer');
});

test('a rejected serialSend promise must not stall the queue', async () => {
    installElectronApiStub({ send: () => Promise.reject(new Error('port closed')) });

    const connection = new ConnectionSerial();
    connection._connectionId = 1;

    let sendInfo = null;
    connection.send(payload, (info) => { sendInfo = info; });
    await settle();

    assert.notEqual(sendInfo, null, 'send() callback must fire when the IPC promise rejects');
    assert.equal(sendInfo.resultCode, 1);
    assert.equal(connection._transmitting, false, '_transmitting must not stay stuck after a rejected send');
    assert.equal(connection._outputBuffer.length, 0);
});

test('the queue keeps draining after the port disappears mid-session', async () => {
    // First write succeeds, then the port is gone - the exact flash sequence that
    // used to leave the singleton unusable until the app was restarted.
    const calls = installElectronApiStub({
        send: () => Promise.resolve({ error: false, bytesWritten: 3 })
    });

    const connection = new ConnectionSerial();
    connection._connectionId = 1;

    let firstInfo = null;
    connection.send(payload, (info) => { firstInfo = info; });
    await settle();
    assert.equal(firstInfo.resultCode, 0, 'sanity: the first write goes out normally');

    // false, not 0 - 0 is a legitimate connection id (e.g. ConnectionExt's SITL WASM
    // port), so hasConnectionId() only treats null/false as "no port".
    connection._connectionId = false;

    const results = [];
    connection.send(payload, (info) => results.push(info));
    connection.send(payload, (info) => results.push(info));
    await settle();

    assert.equal(results.length, 2, 'every queued write must resolve, not pile up behind a stuck flag');
    assert.equal(connection._transmitting, false);
    assert.equal(connection._outputBuffer.length, 0);
    assert.equal(calls.send, 1, 'no write should be attempted once the port is gone');
});

test('disconnect() without a port clears the stuck state and fires its callback', async () => {
    installElectronApiStub({ send: () => Promise.resolve({ error: false, bytesWritten: 3 }) });

    const connection = new ConnectionSerial();
    connection.registerIpcListeners();

    // Reproduce the wedged singleton the old code left behind.
    connection._connectionId = false;
    connection._transmitting = true;
    connection._outputBuffer = [{ data: payload, callback: null }];
    connection.addOnReceiveListener(() => {});

    let result = 'not called';
    connection.disconnect((res) => { result = res; });

    assert.notEqual(result, 'not called', 'disconnect() must fire its callback when there is no port');
    assert.equal(connection._transmitting, false, 'disconnect() must reset _transmitting');
    assert.equal(connection._outputBuffer.length, 0, 'disconnect() must drop queued output');
    // The transports call abort() - which lands here - before notifying their error
    // listeners, so this path must not tear the listener lists down.
    assert.equal(connection._onReceiveListeners.length, 1, 'a portless disconnect must leave listener registration alone');

    // ... and the healed object is usable again.
    connection._connectionId = 1;
    let sendInfo = null;
    connection.send(payload, (info) => { sendInfo = info; });
    await settle();
    assert.equal(sendInfo.resultCode, 0, 'the connection must be reusable after a portless disconnect');
});

test('positive control: a healthy port still reports its written bytes', async () => {
    const calls = installElectronApiStub({ send: () => Promise.resolve({ error: false, bytesWritten: 3 }) });

    const connection = new ConnectionSerial();
    connection._connectionId = 1;

    let sendInfo = null;
    connection.send(payload, (info) => { sendInfo = info; });
    await settle();

    assert.equal(calls.send, 1);
    assert.equal(sendInfo.resultCode, 0);
    assert.equal(sendInfo.bytesSent, 3);
    assert.equal(connection._bytesSent, 3, 'byte statistics must still be tracked');
    assert.equal(connection._transmitting, false);
});

test('disconnect() with a live port still reports the close result', async () => {
    installElectronApiStub({
        send: () => Promise.resolve({ error: false, bytesWritten: 3 }),
        close: () => Promise.resolve({ error: false }),
    });

    const connection = new ConnectionSerial();
    connection._connectionId = 1;

    const result = await new Promise((r) => connection.disconnect(r));
    assert.equal(result, true, 'a successful close must still report true');
    assert.equal(connection._connectionId, false);
});

test('a rejected serialClose promise must still fire the disconnect callback', async () => {
    installElectronApiStub({
        send: () => Promise.resolve({ error: false, bytesWritten: 3 }),
        close: () => Promise.reject(new Error('port already gone')),
    });

    const connection = new ConnectionSerial();
    connection._connectionId = 1;

    const result = await new Promise((r) => connection.disconnect(r));
    assert.equal(result, false, 'a failed close must report false rather than hang');
    assert.equal(connection._connectionId, false);
});
