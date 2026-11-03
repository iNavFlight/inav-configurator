import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Extensionless imports do not resolve in plain Node: point them at stubs that forward to the current test's mocks
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = mkdtempSync(join(tmpdir(), 'wizard-virtual-pitot-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

function dataModule(code) {
    const encoded = encodeURIComponent(code).replace(/['()!*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:text/javascript,' + encoded;
}

const source = readFileSync(join(repoRoot, 'js/wizard_save_framework.js'), 'utf8');
const importNames = [...source.matchAll(/^import (\w+) from /gm)].map((m) => m[1]);
assert.deepEqual(importNames, ['mspHelper', 'serialPortHelper', 'FC', 'features'], 'wizard_save_framework.js imports changed, update the stubs');
assert.match(source, /^export default wizardSaveFramework;/m, 'wizard_save_framework.js no longer exports wizardSaveFramework');

const rewritten = source.replace(/^import (\w+) from '[^']+';/gm, (line, name) =>
    `import ${name} from '${dataModule(`export default new Proxy({}, { get: (_, key) => globalThis.__wizardDeps.${name}[key] });`)}';`);
const modulePath = join(tmpDir, 'wizard_save_framework.mjs');
writeFileSync(modulePath, rewritten, 'utf8');
const { default: wizardSaveFramework } = await import(pathToFileURL(modulePath).href);

const PITOT_VALUES = ['NONE', 'AUTO', 'MS4525', 'ADC', 'VIRTUAL', 'FAKE'];

// The wizard drops the promise of its pitot read, so a callback error would surface as an unhandled rejection
class QuietPromise extends Promise {
    then(onFulfilled, onRejected) {
        const derived = super.then(onFulfilled, onRejected);
        Promise.prototype.then.call(derived, undefined, () => {});
        return derived;
    }
}

async function saveGpsPort({ airplane, port, pitot = 'NONE', readFails = false, callbackThrowsOnce = false }) {
    const SettingPromise = callbackThrowsOnce ? QuietPromise : Promise;
    const log = [];
    globalThis.__wizardDeps = {
        FC: { getFeatures: () => [{ name: 'GPS', bit: 7 }], isAirplane: () => airplane },
        serialPortHelper: { set: () => {} },
        features: {
            set: () => {},
            unset: () => {},
            execute: (done) => {
                log.push('execute(' + typeof done + ')');
                setTimeout(() => { log.push('features saved'); if (typeof done === 'function') done(); }, 5);
            },
        },
        mspHelper: {
            saveSerialPorts: (done) => setTimeout(done, 1),
            getSetting: () => (readFails ? Promise.reject(new Error('read failed'))
                : SettingPromise.resolve({ setting: { table: { values: PITOT_VALUES } }, value: PITOT_VALUES.indexOf(pitot) })),
            setSetting: (name, value, done) => { log.push(name + '=' + value); return Promise.resolve().then(done); },
        },
    };
    let calls = 0;
    let timer;
    await new Promise((done, fail) => {
        timer = setTimeout(() => fail(new Error('callback never ran: ' + log.join(', '))), 500);
        wizardSaveFramework.saveSetting({ name: 'gpsPort', value: { port, baud: '115200' } }, () => {
            calls++;
            log.push('callback');
            done();
            if (callbackThrowsOnce && calls === 1) {
                throw new Error('callback threw');
            }
        });
    });
    clearTimeout(timer);
    await new Promise((done) => setTimeout(done, 20));
    return { log, calls };
}

test('multirotor with a GPS port keeps pitot_hardware untouched', async () => {
    const { log, calls } = await saveGpsPort({ airplane: false, port: '2' });
    assert.deepEqual(log, ['execute(function)', 'features saved', 'callback']);
    assert.equal(calls, 1);
});

test('airplane with a GPS port selects the virtual pitot after the features are saved', async () => {
    const { log, calls } = await saveGpsPort({ airplane: true, port: '2' });
    assert.deepEqual(log, ['execute(function)', 'features saved', 'pitot_hardware=VIRTUAL', 'callback']);
    assert.equal(calls, 1);
});

test('airplane keeps a pitot the user already selected', async () => {
    const { log } = await saveGpsPort({ airplane: true, port: '2', pitot: 'MS4525' });
    assert.ok(!log.includes('pitot_hardware=VIRTUAL'), log.join(', '));
});

test('airplane without a GPS port keeps pitot_hardware untouched', async () => {
    const { log } = await saveGpsPort({ airplane: true, port: '-1' });
    assert.ok(!log.includes('pitot_hardware=VIRTUAL'), log.join(', '));
});

test('a failed pitot_hardware read continues the wizard once without writing', async () => {
    const { log, calls } = await saveGpsPort({ airplane: true, port: '2', readFails: true });
    assert.ok(!log.includes('pitot_hardware=VIRTUAL'), log.join(', '));
    assert.equal(calls, 1);
});

test('a throwing wizard callback is not run a second time', async () => {
    const { calls } = await saveGpsPort({ airplane: true, port: '2', pitot: 'MS4525', callbackThrowsOnce: true });
    assert.equal(calls, 1);
});
