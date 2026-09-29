#!/usr/bin/env node
/**
 * A write whose tunnel reply is lost (both attempts) still gets no callback - a save chain must
 * not go on to the EEPROM write and reboot - but the user is told once, and the recovery hook
 * runs. Runs the real js/msp/MSPHelper.js, js/msp.js and js/serial_queue.js on mock timers.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { dataModule } from './helpers/dataModule.mjs';
import { loadMspHelper, resetMspCore } from './helpers/mspCore.mjs';

globalThis.__writeLostGui = { logged: [] };
const { mspHelper, MSP, mspQueue, MSPCodes, CONFIGURATOR, mspDeduplicationQueue } =
    await loadMspHelper(import.meta.url, 'msp-tunnel-write-lost.test.mjs', 'msp-tunnel-write-lost-', {
        fc: dataModule('export default {};'),
        gui: dataModule('const GUI = globalThis.__writeLostGui; GUI.log = message => GUI.logged.push(message); export default GUI;'),
        i18n: dataModule('export default { getMessage: (key, args) => key + (args ? ":" + args.join(",") : "") };'),
    });
const logged = globalThis.__writeLostGui.logged;

globalThis.$ = () => ({ html() {} });
MSP.init();
mspHelper.init();

const sent = [];
CONFIGURATOR.connection = {
    bitrate: 115200,
    getTimeout: () => 3000,
    send(data, callback) {
        sent.push(data);
        if (callback) {
            callback({ bytesSent: data.byteLength });
        }
    },
};

let recoveries = 0;
mspHelper.onWriteLostRecovery = () => recoveries++;

function startSession(t) {
    resetMspCore({ MSP, mspQueue, mspDeduplicationQueue, CONFIGURATOR });
    CONFIGURATOR.connectionValid = true;
    logged.length = 0;
    sent.length = 0;
    recoveries = 0;
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000000 });
    mspQueue.setTunnelMode(true);
}

function advance(t, ms) {
    for (let elapsed = 0; elapsed < ms; elapsed += 10) {
        t.mock.timers.tick(10);
        mspQueue.executor();
    }
}

test('a lost save write is reported once, gets no callback and triggers the recovery hook', (t) => {
    startSession(t);
    let called = 0;
    MSP.send_message(MSPCodes.MSP_SET_RC_TUNING, [1, 2, 3], false, () => called++);
    advance(t, 1500);

    assert.equal(sent.length, 2, 'one retry, as for every tunnel request');
    assert.equal(called, 0, 'the save chain must not continue');
    assert.deepEqual(logged, ['mspTunnelWriteLost:MSP_SET_RC_TUNING']);
    assert.equal(recoveries, 1);
});

test('each lost write gets its own message', (t) => {
    startSession(t);
    MSP.send_message(MSPCodes.MSP_SET_RC_TUNING, [1], false, () => {});
    MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, () => {});
    advance(t, 12000);
    assert.deepEqual(logged, ['mspTunnelWriteLost:MSP_SET_RC_TUNING', 'mspTunnelWriteLost:MSP_EEPROM_WRITE']);
});

test('live control writes and lost reads do not claim that nothing was saved', (t) => {
    startSession(t);
    MSP.send_message(MSPCodes.MSP_SET_RAW_RC, [0, 0], false, () => {});
    MSP.send_message(MSPCodes.MSP_SET_MOTOR, [0, 0], false, () => {});
    let readResult = null;
    MSP.send_message(MSPCodes.MSP_STATUS, false, false, response => { readResult = response; });
    advance(t, 4000);
    assert.equal(readResult, false);
    assert.deepEqual(logged.filter(line => line.startsWith('mspTunnelWriteLost')), []);
    assert.equal(recoveries, 0);
});
