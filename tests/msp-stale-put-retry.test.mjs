#!/usr/bin/env node
/**
 * Regression tests for MSP requests from an interrupted tab leaking into the
 * next one.
 *
 * Bug 1: MSP._enqueue() retries a rejected mspQueue.put() (dedup collision or
 * locked queue) every 150 ms. A retry timer created before a tab switch
 * survived GUI.tab_switch_cleanup() - which flushes the queue and drops the
 * pending callbacks - and later re-queued the previous tab's request together
 * with its callback, into the next tab's load or the next session.
 * Fix: callbacks_cleanup() starts a new generation and _enqueue() silently
 * drops a message from an older one, the same way callbacks_cleanup() already
 * drops in-flight requests. Same-generation retries are unchanged.
 *
 * Bug 2: replies are matched to requests by MSP code only. A
 * MSP2_COMMON_SETTING_INFO reply still on the wire from the interrupted tab
 * was handed to the next tab's request for another setting, and _getSetting()
 * cached the wrong index and type under that name for good.
 * Fix: the setting name in the reply is checked; a mismatch is not cached and
 * the request is sent once more.
 *
 * Runs the real js/msp.js, serial queue, dedup queue and MSPHelper with only
 * their import specifiers rewritten (tests/helpers/mspModules.mjs). Responses
 * are fed as real MSPv2 frames through MSP.read(). setTimeout is replaced by
 * node:test's mock timers where retries are involved, so 25 x 150 ms run
 * instantly.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { dataModule } from './helpers/dataModule.mjs';
import { makeHarness } from './helpers/harness.mjs';
import { rewriteMspStack, rewriteMspHelper } from './helpers/mspModules.mjs';

const { repoRoot, rewriteAndWrite } = makeHarness(import.meta.url, 'msp-stale-put-retry.test.mjs', 'msp-stale-put-retry-');

const mspUrls = rewriteMspStack(repoRoot, rewriteAndWrite);

const SETTINGS_CACHE_ID = '__mspStalePutRetrySettingsCache';
globalThis[SETTINGS_CACHE_ID] = new Map();

const realMspHelperUrl = rewriteMspHelper(rewriteAndWrite, mspUrls, {
    fc: dataModule('export default {};'),
    gui: dataModule('export default { log() {} };'),
    i18n: dataModule('export default { getMessage(key) { return key; } };'),
    settingsCache: dataModule(`export default globalThis['${SETTINGS_CACHE_ID}'];`),
});

const { default: mspHelper } = await import(realMspHelperUrl);
const { default: MSP } = await import(mspUrls.msp);
const { default: MSPCodes } = await import(mspUrls.mspCodes);
const { default: mspQueue } = await import(mspUrls.mspQueue);
const { default: mspDeduplicationQueue } = await import(mspUrls.dedup);
const { default: CONFIGURATOR } = await import(mspUrls.configurator);

const settingsCache = globalThis[SETTINGS_CACHE_ID];

// The wiring SerialBackend and configurator_main.js do at startup.
MSP.init();
mspHelper.init();

// A read whose MSPHelper parser case accepts an empty payload.
const CODE = MSPCodes.MSPV2_SETTING;
const SETTING_INFO = MSPCodes.MSP2_COMMON_SETTING_INFO;
const RETRY_MS = 150;
const PUT_RETRIES = 25;

const REJECTIONS = {
    'a dedup collision': {
        reject() { mspDeduplicationQueue.put(CODE); },
        release() { mspDeduplicationQueue.remove(CODE); },
    },
    'a locked queue': {
        reject() { mspQueue.lock(); },
        release() { mspQueue.unlock(); },
    },
};

/** An idle queue; connection === false keeps the real executor interval from dequeuing. */
function resetQueue() {
    CONFIGURATOR.connection = false;
    CONFIGURATOR.cliActive = false;
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    mspQueue.freeHardLock();
    mspQueue.freeSoftLock();
    mspQueue.unlock();
    MSP.callbacks = [];
}

/** One retry period at a time: a single large tick() does not run timers scheduled during it. */
function advanceRetries(t, count) {
    for (let i = 0; i < count; i++) {
        t.mock.timers.tick(RETRY_MS);
    }
}

function sendRecording(results) {
    MSP.send_message(CODE, false, false, (response) => results.push(response));
}

/** Runs one real executor pass against a connection that sends everything at once. */
function transmitNext() {
    const sent = [];
    // The previous reply frees the port on a 10 ms timeout.
    mspQueue.freeHardLock();
    CONFIGURATOR.connection = {
        send(buffer, callback) {
            sent.push(buffer);
            callback({ bytesSent: buffer.byteLength });
        },
        getTimeout() { return 1000; },
    };
    try {
        mspQueue.executor();
    } finally {
        CONFIGURATOR.connection = false;
    }
    return sent;
}

/** Feeds an MSPv2 frame through the real decoder into MSPHelper.handleResponse(). */
function receiveResponse(code, payload = [], direction = '>') {
    const body = [0, code & 0xFF, (code >> 8) & 0xFF, payload.length & 0xFF, (payload.length >> 8) & 0xFF, ...payload];
    const crc = body.reduce((acc, byte) => MSP._crc8_dvb_s2(acc, byte), 0);
    const frame = new Uint8Array([0x24, 0x58, direction.charCodeAt(0), ...body, crc]); // "$X" + direction
    MSP.read({ data: frame.buffer });
}

const u16 = (value) => [value & 0xFF, (value >> 8) & 0xFF];
const u32 = (value) => [...u16(value & 0xFFFF), ...u16((value >>> 16) & 0xFFFF)];

/** A uint16 MASTER_VALUE setting, laid out as fc_msp.c mspSettingInfoCommand() writes it. */
function settingInfoPayload(name, index) {
    return [
        ...Array.from(name, (c) => c.charCodeAt(0)), 0,
        ...u16(1),          // PG id
        2, 0, 0,            // type uint16_t, section MASTER_VALUE, mode VALUE
        ...u32(0),          // min
        ...u32(1000),       // max
        ...u16(index),
        0, 0,               // profile, profile count
    ];
}

/** The setting name a sent MSPv2 SETTING_INFO request asks for. */
function requestedSettingName(buffer) {
    const bytes = new Uint8Array(buffer);
    const payload = bytes.slice(8, bytes.length - 2); // header, then name, NUL and CRC
    return String.fromCharCode(...payload);
}

const settle = () => new Promise((resolve) => setImmediate(resolve));

for (const [reason, rejection] of Object.entries(REJECTIONS)) {
    test(`a put-retry pending across callbacks_cleanup() is dropped (${reason})`, (t) => {
        t.mock.timers.enable({ apis: ['setTimeout'] });
        resetQueue();

        const results = [];
        rejection.reject();
        sendRecording(results);
        assert.equal(mspQueue.getLength(), 0, 'sanity: the first put must have been rejected');

        MSP.callbacks_cleanup(); // the tab switch
        rejection.release();
        advanceRetries(t, PUT_RETRIES + 1);

        assert.equal(mspQueue.getLength(), 0, 'the old request must not be re-queued once the slot frees');
        assert.equal(mspDeduplicationQueue.check(CODE), false, 'the old request must not re-reserve its code');
        assert.deepEqual(results, [], 'the old callback must never fire, not even with false');

        resetQueue();
    });
}

test('without a cleanup the retry still lands once the slot frees and gets its response', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueue();

    const results = [];
    mspDeduplicationQueue.put(CODE);
    sendRecording(results);
    assert.equal(mspQueue.getLength(), 0, 'sanity: the first put must have been rejected');

    mspDeduplicationQueue.remove(CODE);
    advanceRetries(t, 1);
    assert.equal(mspQueue.getLength(), 1, 'the retry must queue the request');

    assert.equal(transmitNext().length, 1, 'the queued request must go out');
    receiveResponse(CODE);

    assert.equal(results.length, 1, 'the callback must fire exactly once');
    assert.equal(results[0].command, CODE, 'the callback must receive the response');

    resetQueue();
});

test(`without a cleanup a slot that never frees ends in onFinish(false) after ${PUT_RETRIES} retries`, (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueue();

    const results = [];
    mspDeduplicationQueue.put(CODE);
    sendRecording(results);

    advanceRetries(t, PUT_RETRIES - 1);
    assert.deepEqual(results, [], 'must still be retrying before the last attempt');

    advanceRetries(t, 1);
    assert.deepEqual(results, [false], 'must give up with false after the last retry');

    advanceRetries(t, 10);
    assert.deepEqual(results, [false], 'must give up only once');
    assert.equal(mspQueue.getLength(), 0);

    resetQueue();
});

test('a request sent after callbacks_cleanup() is unaffected by the older one', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    resetQueue();

    const stale = [];
    const fresh = [];
    mspDeduplicationQueue.put(CODE);
    sendRecording(stale);

    MSP.callbacks_cleanup();
    sendRecording(fresh); // same code, still colliding: retries in the new generation

    mspDeduplicationQueue.remove(CODE);
    advanceRetries(t, 1);
    assert.equal(mspQueue.getLength(), 1, 'exactly the new request must be queued');

    assert.equal(transmitNext().length, 1);
    receiveResponse(CODE);

    assert.equal(fresh.length, 1, 'the new callback must fire');
    assert.equal(fresh[0].command, CODE);
    assert.deepEqual(stale, [], 'the old callback must not fire');

    advanceRetries(t, PUT_RETRIES + 1);
    assert.deepEqual(stale, [], 'the old callback must not fire later either');
    assert.equal(fresh.length, 1);

    resetQueue();
});

test('a SETTING_INFO reply for another setting is not cached and the request is sent again', async () => {
    resetQueue();
    settingsCache.clear();

    const pending = mspHelper._getSetting('nav_wp_radius');
    assert.equal(transmitNext().length, 1);

    // The interrupted tab's request for another setting is answered first.
    receiveResponse(SETTING_INFO, settingInfoPayload('safehome_max_distance', 11));
    await settle();

    assert.equal(settingsCache.size, 0, 'a reply for another setting must not be cached');
    const resent = transmitNext();
    assert.equal(resent.length, 1, 'the request must be sent once more');
    assert.equal(requestedSettingName(resent[0]), 'nav_wp_radius');

    receiveResponse(SETTING_INFO, settingInfoPayload('nav_wp_radius', 22));
    const setting = await pending;

    assert.equal(setting.index, 22, 'the matching reply must resolve the request');
    assert.equal(settingsCache.get('nav_wp_radius').index, 22);
    assert.equal(settingsCache.size, 1, 'only the requested setting may be cached');
    assert.equal(mspQueue.getLength(), 0, 'no third request');

    resetQueue();
});

test('a second SETTING_INFO mismatch rejects naming both settings', async () => {
    resetQueue();
    settingsCache.clear();

    const pending = mspHelper._getSetting('nav_wp_radius');
    transmitNext();
    receiveResponse(SETTING_INFO, settingInfoPayload('safehome_max_distance', 11));
    await settle();
    assert.equal(transmitNext().length, 1, 'sanity: the request was sent once more');
    receiveResponse(SETTING_INFO, settingInfoPayload('nav_fw_loiter_radius', 33));

    await assert.rejects(pending, /nav_wp_radius.*nav_fw_loiter_radius/);
    assert.equal(settingsCache.size, 0, 'nothing may be cached');
    assert.equal(mspQueue.getLength(), 0, 'no third request');

    resetQueue();
});

test('a setting the FC does not know still resolves null without a retry', async () => {
    resetQueue();
    settingsCache.clear();

    const pending = mspHelper._getSetting('no_such_setting');
    transmitNext();
    receiveResponse(SETTING_INFO, [], '!'); // the FC's error reply carries no name

    assert.equal(await pending, null);
    assert.equal(mspQueue.getLength(), 0, 'an empty reply is not a mismatch');
    assert.equal(settingsCache.size, 0);

    resetQueue();
});
