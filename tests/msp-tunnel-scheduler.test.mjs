#!/usr/bin/env node
/**
 * MSP queue tunnel mode: one request in flight, a silence timeout (500 ms unless the link or
 * late replies widen it) restarted by every received TUNNEL chunk, one whole-request retry (none
 * for reboot), onFinish(false) at the end, stale-reply watch and decoder reset. Runs the real js/serial_queue.js and js/msp.js (import
 * specifiers rewritten only) with Node's mock timers; the FC side is the real MAVLink codec.
 *
 * processData below stands in for MSPHelper's completeRequest(): it fires and removes the
 * first pending callback for the code, exactly like the production one.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MavlinkParser } from '../js/mavlink/mavlinkParser.js';
import { MavlinkLink } from '../js/mavlink/mavlinkLink.js';
import { MAVLINK_MSG_ID, encodeFrameV2, concatFrames } from '../js/mavlink/mavlinkProtocol.js';
import { buildTunnelPayload } from '../js/mavlink/mavlinkTunnel.js';
import { loadMspCore, mspV2Reply, resetMspCore } from './helpers/mspCore.mjs';

const { MSP, mspQueue, MSPCodes, CONFIGURATOR, mspDeduplicationQueue } =
    await loadMspCore(import.meta.url, 'msp-tunnel-scheduler.test.mjs', 'msp-tunnel-scheduler-');

globalThis.$ = () => ({ html() {} });
MSP.init();

const SILENCE_MS = 500;
const QUEUE_TICK_MS = 10;
const SLOW_INITIAL_MS = 5000;
// Not in MSPCodes; used here as the dense large-reply case.
const MSP_BOXNAMES = 116;

const processed = [];
function defaultProcessData(handler) {
    processed.push(handler.code);
    for (let i = handler.callbacks.length - 1; i >= 0; i--) {
        const pending = handler.callbacks[i];
        if (pending.code == handler.code) {
            clearTimeout(pending.timer);
            const sample = mspQueue.roundtripSample(pending);
            if (sample) {
                mspQueue.putRoundtrip(sample.total);
                mspQueue.putHardwareRoundtrip(sample.hardware);
            }
            mspDeduplicationQueue.remove(handler.code);
            handler.callbacks.splice(i, 1);
            if (pending.onFinish) {
                pending.onFinish({ command: handler.code });
            }
            break;
        }
    }
}
MSP.setProcessData(defaultProcessData);

const sent = [];
// Optional simulated FC: called with the index of every written request.
let fcResponder = null;
CONFIGURATOR.connection = {
    bitrate: 115200,
    getTimeout: () => 3000,
    send(data, callback) {
        sent.push(new Uint8Array(data));
        if (callback) {
            callback({ bytesSent: data.byteLength });
        }
        if (fcResponder) {
            fcResponder(sent.length - 1);
        }
    },
};

let linkResets = 0;
const link = new MavlinkLink({
    onTunnelChunk: (bytes) => {
        mspQueue.notifyTunnelProgress();
        MSP.read({ data: bytes });
    },
    // Same wiring as js/serial_backend.js.
    onReassemblyTimeout: () => {
        MSP.resetDecoder();
        mspQueue.discardTunnelChunks();
    },
});
link.lockTarget(1, 1);

function startTunnelSession(t) {
    resetMspCore({ MSP, mspQueue, mspDeduplicationQueue, CONFIGURATOR });
    CONFIGURATOR.connectionValid = false;
    sent.length = 0;
    processed.length = 0;
    fcResponder = null;
    linkResets = 0;

    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000000 });
    mspQueue.setTunnelMode(true);
    mspQueue.setTransportTransform(
        (body) => concatFrames(link.wrapMsp(body)).buffer,
        () => {
            linkResets++;
            link.resetReassembly();
        }
    );
}

/** MSP codes of every request written so far, one entry per send() call. */
function sentCodes() {
    return sent.map((wire) => {
        const msp = [];
        for (const frame of new MavlinkParser().ingest(wire)) {
            msp.push(...frame.payload.subarray(5, 5 + frame.payload[4]));
        }
        return msp[4] | (msp[5] << 8);
    });
}

function sentSeqs(index) {
    return new MavlinkParser().ingest(sent[index]).map((frame) => frame.seq);
}

function fcReplyFrames(code, payload = [1, 2, 3]) {
    const reply = mspV2Reply(code, Uint8Array.from(payload));
    const frames = [];
    for (let offset = 0; offset < reply.length; offset += 128) {
        const tunnel = buildTunnelPayload(reply.subarray(offset, offset + 128), 253, 25);
        frames.push(encodeFrameV2(MAVLINK_MSG_ID.TUNNEL, tunnel, 1, 1, 0));
    }
    return frames;
}

function reply(code, payload) {
    for (const frame of fcReplyFrames(code, payload)) {
        link.ingest(frame);
    }
}

function send(code, onFinish = null) {
    assert.equal(MSP.send_message(code, false, false, onFinish), true);
}

test('one request in flight: no force-free by the balancer, no release by an unrelated frame', (t) => {
    startTunnelSession(t);
    send(MSPCodes.MSP_API_VERSION);
    send(MSPCodes.MSP_FC_VARIANT);

    mspQueue.executor();
    mspQueue.executor();
    assert.deepEqual(sentCodes(), [MSPCodes.MSP_API_VERSION]);

    // Keep the reply "progressing" past the balancer's 1 s force-free threshold.
    for (let i = 0; i < 3; i++) {
        t.mock.timers.tick(400);
        mspQueue.notifyTunnelProgress();
    }
    mspQueue.balancer();
    reply(MSPCodes.MSP_STATUS);
    t.mock.timers.tick(10);
    mspQueue.executor();
    assert.deepEqual(sentCodes(), [MSPCodes.MSP_API_VERSION], 'nothing may overtake the pending request');

    reply(MSPCodes.MSP_API_VERSION);
    mspQueue.executor();
    assert.equal(sent.length, 1, 'the slot is released 10 ms after the matching reply, not at once');
    t.mock.timers.tick(10);
    mspQueue.executor();
    assert.deepEqual(sentCodes(), [MSPCodes.MSP_API_VERSION, MSPCodes.MSP_FC_VARIANT]);

    // Tab switches force-free the hard lock; the pending request must still hold the slot.
    send(MSPCodes.MSP_FC_VERSION);
    mspQueue.freeHardLock();
    mspQueue.executor();
    assert.equal(sent.length, 2);
});

test('the silence timer restarts with every received chunk of the pending reply', (t) => {
    startTunnelSession(t);
    let result = null;
    send(MSP_BOXNAMES, (response) => { result = response; });
    mspQueue.executor();

    const frames = fcReplyFrames(MSP_BOXNAMES, new Uint8Array(600).fill(0x41));
    assert.equal(frames.length, 5);
    for (const frame of frames) {
        t.mock.timers.tick(SILENCE_MS - 100);
        link.ingest(frame);
    }

    assert.notEqual(result, null, 'a reply that keeps progressing must not time out');
    assert.notEqual(result, false);
    assert.equal(sent.length, 1, 'and must not be retried');
});

test('exactly one retry with fresh MAVLink framing, then onFinish(false)', (t) => {
    startTunnelSession(t);
    const results = [];
    send(MSPCodes.MSP_FC_VERSION, (response) => results.push(response));
    mspQueue.executor();

    t.mock.timers.tick(SILENCE_MS);
    mspQueue.executor();
    assert.deepEqual(sentCodes(), [MSPCodes.MSP_FC_VERSION, MSPCodes.MSP_FC_VERSION]);
    assert.notDeepEqual(sentSeqs(1), sentSeqs(0), 'the retry is wrapped again at send time');

    t.mock.timers.tick(SILENCE_MS);
    mspQueue.executor();
    t.mock.timers.tick(SILENCE_MS);
    mspQueue.executor();

    assert.deepEqual(results, [false], 'the caller hears back exactly once, with false');
    assert.equal(sent.length, 2);
    assert.equal(MSP.callbacks.some((c) => c.code == MSPCodes.MSP_FC_VERSION), false, 'no callback left behind');
    assert.equal(mspDeduplicationQueue.check(MSPCodes.MSP_FC_VERSION), false, 'the code is free for the next request');
    assert.equal(mspQueue.isLocked(), false);
});

test('a per-request retry budget gives the probe three attempts', (t) => {
    startTunnelSession(t);
    const results = [];
    MSP.sendWithTunnelRetries(MSPCodes.MSP_API_VERSION, false, (response) => results.push(response), 2);

    for (let attempt = 0; attempt < 4; attempt++) {
        mspQueue.executor();
        t.mock.timers.tick(SILENCE_MS);
    }

    assert.equal(sent.length, 3);
    assert.deepEqual(results, [false]);
});

test('a window floor holds for every attempt of the probe and does not leak into the next request', (t) => {
    startTunnelSession(t);
    const FLOOR_MS = 3000;
    const results = [];
    MSP.sendWithTunnelRetries(MSPCodes.MSP_API_VERSION, false, (response) => results.push(response), 2, FLOOR_MS);
    for (let attempt = 1; attempt <= 3; attempt++) {
        mspQueue.executor();
        t.mock.timers.tick(FLOOR_MS - 10);
        mspQueue.executor();
        assert.equal(sent.length, attempt, `attempt ${attempt} is still inside the floor`);
        t.mock.timers.tick(10);
    }
    assert.deepEqual(results, [false]);

    t.mock.timers.tick(SILENCE_MS); // the last attempt's stale watch would hold the next probe back
    MSP.sendWithTunnelRetries(MSPCodes.MSP_API_VERSION, false, (response) => results.push(response), 2, FLOOR_MS);
    mspQueue.executor();
    t.mock.timers.tick(1400);
    reply(MSPCodes.MSP_API_VERSION);
    assert.equal(results.length, 2);
    assert.notEqual(results[1], false);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 2100, 'the first real reply sets the window');

    t.mock.timers.tick(QUEUE_TICK_MS);
    send(MSPCodes.MSP_FC_VARIANT);
    mspQueue.executor();
    t.mock.timers.tick(2100);
    mspQueue.executor();
    assert.equal(sentCodes().at(-1), MSPCodes.MSP_FC_VARIANT);
    assert.equal(sent.length, 6, 'the next request waits the learned window, not the floor');
});

test('reboot is never retried, EEPROM write is retried once', (t) => {
    startTunnelSession(t);
    const results = [];
    MSP.sendWithTunnelRetries(MSPCodes.MSP_SET_REBOOT, false, (response) => results.push(response), 2);
    mspQueue.executor();
    t.mock.timers.tick(SLOW_INITIAL_MS);
    mspQueue.executor();

    assert.deepEqual(sentCodes(), [MSPCodes.MSP_SET_REBOOT], 'a resend would reboot the freshly started FC again');
    assert.deepEqual(results, [], 'a lost write never reports back, like a refused one');

    send(MSPCodes.MSP_EEPROM_WRITE);
    for (let attempt = 0; attempt < 3; attempt++) {
        mspQueue.executor();
        t.mock.timers.tick(SLOW_INITIAL_MS);
    }
    assert.deepEqual(sentCodes(), [MSPCodes.MSP_SET_REBOOT, MSPCodes.MSP_EEPROM_WRITE, MSPCodes.MSP_EEPROM_WRITE]);
});

test('a dataflash erase waits 40 s for its reply and is never resent', (t) => {
    startTunnelSession(t);
    const results = [];
    const lostWrites = [];
    MSP.onWriteLost = (code) => lostWrites.push(code);
    try {
        send(MSPCodes.MSP_DATAFLASH_ERASE, (response) => results.push(response));
        mspQueue.executor();
        t.mock.timers.tick(40000 - 10);
        mspQueue.executor();
        assert.equal(sent.length, 1, 'a NAND erase keeps the FC silent for seconds');
        t.mock.timers.tick(10);
        for (let tick = 0; tick < 3; tick++) {
            mspQueue.executor();
            t.mock.timers.tick(SLOW_INITIAL_MS);
        }
        assert.deepEqual(sentCodes(), [MSPCodes.MSP_DATAFLASH_ERASE], 'a resend would erase the flash again');
        assert.deepEqual(results, []);
        assert.deepEqual(lostWrites, [MSPCodes.MSP_DATAFLASH_ERASE]);
        assert.equal(mspQueue.isLocked(), false);
    } finally {
        MSP.onWriteLost = null;
    }
});

test('EEPROM write and reboot wait 5 s for the first chunk, then 500 ms between chunks', (t) => {
    startTunnelSession(t);
    const results = [];
    send(MSPCodes.MSP_EEPROM_WRITE, (response) => results.push(response));
    mspQueue.executor();

    t.mock.timers.tick(SLOW_INITIAL_MS - 10);
    mspQueue.executor();
    assert.equal(sent.length, 1, 'a flash erase keeps the FC silent for more than 500 ms');
    assert.deepEqual(results, []);

    reply(MSPCodes.MSP_EEPROM_WRITE, []);
    assert.equal(results.length, 1);
    assert.notEqual(results[0], false);

    send(MSPCodes.MSP_SET_REBOOT, (response) => results.push(response));
    t.mock.timers.tick(10);
    mspQueue.executor();
    const frames = fcReplyFrames(MSPCodes.MSP_SET_REBOOT, new Uint8Array(200).fill(0x41));
    t.mock.timers.tick(SLOW_INITIAL_MS - 10);
    link.ingest(frames[0]); // the rest is lost: from here on the normal silence window applies
    t.mock.timers.tick(SILENCE_MS);
    assert.deepEqual(results.slice(1), [], 'lost write: no callback');
    mspQueue.executor();
    assert.equal(sent.length, 2, 'reboot is not resent');
});

test('the hold-back is one silence window, however slow the link measured', (t) => {
    startTunnelSession(t);
    for (let i = 0; i < 200; i++) {
        mspQueue.putHardwareRoundtrip(5000);
    }
    try {
        send(MSPCodes.MSP_FC_VARIANT);
        mspQueue.executor();
        t.mock.timers.tick(SILENCE_MS);
        mspQueue.executor();
        t.mock.timers.tick(SILENCE_MS); // the retry lapses too: the watch starts here

        send(MSPCodes.MSP_FC_VARIANT);
        t.mock.timers.tick(SILENCE_MS - 10);
        mspQueue.executor();
        assert.equal(sent.length, 2, 'still held');
        t.mock.timers.tick(10);
        mspQueue.executor();
        assert.equal(sent.length, 3);
        assert.equal(mspQueue.isStaleWatched(MSPCodes.MSP_FC_VARIANT), false, 'the watch ends with the hold-back');
    } finally {
        for (let i = 0; i < 200; i++) {
            mspQueue.putHardwareRoundtrip(10);
        }
    }
});

const LINK_DELAY_MS = 700; // slow link: every reply arrives 700 ms after its request

/** Attempt 1 lapses at 500, the retry goes out; attempt 1's reply lands at 700 and answers the retry. */
function retryAnsweredByLateFirstReply(t, code, payload, onFinish) {
    assert.equal(MSP.send_message(code, payload, false, onFinish), true);
    mspQueue.executor();                 // t = 0
    t.mock.timers.tick(SILENCE_MS);      // t = 500: lapse
    mspQueue.executor();                 // retry sent at 500
    t.mock.timers.tick(LINK_DELAY_MS - SILENCE_MS);
    reply(code, [0x11]);                 // t = 700: attempt 1's reply
    t.mock.timers.tick(10);              // slot released
}

/** Lets time pass with the queue executor running as its 10 ms interval does. */
function runQueueFor(t, ms) {
    for (let elapsed = 0; elapsed < ms; elapsed += QUEUE_TICK_MS) {
        t.mock.timers.tick(QUEUE_TICK_MS);
        mspQueue.executor();
    }
}

function sendWp(index, onFinish = null) {
    assert.equal(MSP.send_message(MSPCodes.MSP_WP, [index], false, onFinish), true);
}

test('the retry\'s own late reply is dropped as stale when nothing waits for it', (t) => {
    startTunnelSession(t);
    const results = [];
    retryAnsweredByLateFirstReply(t, MSPCodes.MSP_FC_VARIANT, false, (response) => results.push(response));
    assert.equal(results.length, 1);

    t.mock.timers.tick(SILENCE_MS - 10); // t = 1200: the retry's own reply
    reply(MSPCodes.MSP_FC_VARIANT, [0x11]);

    assert.equal(results.length, 1);
    assert.deepEqual(processed, [MSPCodes.MSP_FC_VARIANT], 'the stale copy must not reach processData');
    assert.equal(mspQueue.getStaleReplyCount(), 1);
});

test('the watch is one-shot: the first stale reply clears it', (t) => {
    startTunnelSession(t);
    retryAnsweredByLateFirstReply(t, MSPCodes.MSP_WP, [1], null);
    t.mock.timers.tick(SILENCE_MS - 10); // t = 1200
    reply(MSPCodes.MSP_WP, [0x11]);

    assert.equal(mspQueue.getStaleReplyCount(), 1);
    assert.equal(mspQueue.isStaleWatched(MSPCodes.MSP_WP), false);
    sendWp(2);
    mspQueue.executor();
    assert.equal(sent.length, 3, 'nothing is held back once the duplicate is gone');
});

test('after a slow retried read, a same-code read for another item gets its own reply', (t) => {
    startTunnelSession(t);
    const answers = [];
    MSP.setProcessData((handler) => {
        const pending = handler.callbacks.find((c) => c.code == handler.code);
        processed.push(handler.code);
        if (!pending) {
            return;
        }
        handler.callbacks.splice(handler.callbacks.indexOf(pending), 1);
        mspDeduplicationQueue.remove(handler.code);
        pending.onFinish({ command: handler.code, data: new DataView(handler.message_buffer) });
    });
    try {
        retryAnsweredByLateFirstReply(t, MSPCodes.MSP_WP, [1], (r) => answers.push(['wp1', r.data.getUint8(0)]));
        sendWp(2, (r) => answers.push(['wp2', r.data.getUint8(0)]));
        runQueueFor(t, SILENCE_MS - 10);     // t = 1200, past the lapse watch
        assert.equal(sent.length, 2, 'WP 2 is held while WP 1\'s duplicate may still come');

        reply(MSPCodes.MSP_WP, [0x11]);      // the retry's own reply for WP 1
        mspQueue.executor();
        assert.equal(sent.length, 3, 'the duplicate was dropped, WP 2 goes out');

        t.mock.timers.tick(100);
        reply(MSPCodes.MSP_WP, [0x22]);

        assert.deepEqual(answers, [['wp1', 0x11], ['wp2', 0x22]]);
    } finally {
        MSP.setProcessData(defaultProcessData);
    }
});

test('after a retried read, an identical re-read is only held when a write went out since', (t) => {
    startTunnelSession(t);
    retryAnsweredByLateFirstReply(t, MSPCodes.MSP2_PID, false, null);
    send(MSPCodes.MSP2_PID);
    mspQueue.executor();
    assert.equal(sent.length, 3, 'same query, no write since: the duplicate is as good as a fresh reply');
    reply(MSPCodes.MSP2_PID, [0x11]); // the duplicate answers it
    t.mock.timers.tick(10);

    assert.equal(MSP.send_message(MSPCodes.MSP2_SET_PID, [1, 2, 3], false, null), true);
    mspQueue.executor();
    reply(MSPCodes.MSP2_SET_PID, []);
    t.mock.timers.tick(10);
    send(MSPCodes.MSP2_PID);
    mspQueue.executor();
    assert.equal(sent.length, 4, 'post-SET re-read waits until the outstanding pre-SET reply is gone');

    t.mock.timers.tick(LINK_DELAY_MS);
    reply(MSPCodes.MSP2_PID, [0x11]); // the re-read's reply from before the SET: dropped
    mspQueue.executor();
    assert.equal(sent.length, 5);
    assert.equal(mspQueue.getStaleReplyCount(), 1);
});

test('a code whose retry also lapsed is held for one silence window, and nothing overtakes it', (t) => {
    startTunnelSession(t);
    send(MSPCodes.MSP_FC_VARIANT);
    for (let attempt = 0; attempt < 2; attempt++) {
        mspQueue.executor();
        t.mock.timers.tick(SILENCE_MS);
    }                                    // t = 1000: final lapse

    send(MSPCodes.MSP_FC_VARIANT);
    send(MSPCodes.MSP_FC_VERSION);
    mspQueue.executor();
    assert.equal(sent.length, 2, 'held back right after the lapse');

    t.mock.timers.tick(SILENCE_MS - 10);
    mspQueue.executor();
    assert.equal(sent.length, 2);

    t.mock.timers.tick(10);
    mspQueue.executor();
    assert.deepEqual(sentCodes().slice(2), [MSPCodes.MSP_FC_VARIANT], 'FIFO order is kept');
});

/*
 * A lost reply holds the queue for one silence window, so recovery scales with the window:
 * nothing created after the burst waits longer than one window, and two windows after it
 * the poller is back to its round trip.
 */
function lossBurstRecovery(t, serialBaud) {
    startTunnelSession(t);
    mspQueue.setTunnelMode(true, serialBaud);
    const windowMs = mspQueue.getTunnelSilenceWindow();
    const FC_REPLY_MS = 2;
    const BURST_START = 1000;
    const BURST_END = 1300;
    let dropping = false;
    fcResponder = (index) => {
        const code = sentCodes()[index];
        if (!dropping) {
            setTimeout(() => reply(code, [1, 2, 3, 4, 5, 6]), FC_REPLY_MS);
        }
    };

    // Earlier tests leave slow samples in the shared averages; start from this link's baseline.
    for (let i = 0; i < 300; i++) {
        mspQueue.putRoundtrip(FC_REPLY_MS);
        mspQueue.putHardwareRoundtrip(FC_REPLY_MS);
    }

    const start = Date.now();
    const done = [];
    const roundtrips = [];
    const recovered = BURST_END + 2 * windowMs;
    for (let now = 0; now < recovered + 1200; now += QUEUE_TICK_MS) {
        dropping = now >= BURST_START && now < BURST_END;
        if (now % 50 === 0) {
            const createdAt = Date.now() - start;
            MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, (response) => {
                done.push({ createdAt, queuedToDone: Date.now() - start - createdAt, ok: response !== false });
            });
        }
        mspQueue.executor();
        t.mock.timers.tick(QUEUE_TICK_MS);
        roundtrips.push({ at: now, rt: mspQueue.getRoundtrip(), hw: mspQueue.getHardwareRoundtrip() });
    }

    const afterBurst = done.filter((d) => d.createdAt >= BURST_END);
    const slowest = Math.max(...afterBurst.map((d) => d.queuedToDone));
    assert.ok(slowest <= windowMs + QUEUE_TICK_MS + FC_REPLY_MS, `queued->done after the burst ${slowest} ms, window ${windowMs} ms`);
    assert.ok(afterBurst.every((d) => d.ok), 'the lost request was answered by its retry');

    const late = done.filter((d) => d.createdAt >= recovered);
    assert.ok(late.length >= 20, `sanity: the poller kept running (${late.length})`);
    const worst = Math.max(...late.map((d) => d.queuedToDone));
    assert.ok(worst <= QUEUE_TICK_MS + FC_REPLY_MS, `queued->done after recovery ${worst} ms`);
    // The poller is not held by it, but the watch lives while identical polls keep completing:
    // one of them may have taken the duplicate, making its own reply the outstanding one.
    t.mock.timers.tick(Math.max(2000, 2 * windowMs));
    assert.equal(mspQueue.isStaleWatched(MSPCodes.MSP_ATTITUDE), false, 'the watch ends once polling stops');

    const peak = Math.max(...roundtrips.map((r) => Math.max(r.rt, r.hw)));
    assert.ok(peak < 25, `no lost or held request feeds the round-trip average (peak ${peak.toFixed(1)} ms)`);
    const settled = roundtrips.filter((r) => r.at >= recovered);
    assert.ok(settled.every((r) => r.rt <= QUEUE_TICK_MS + FC_REPLY_MS + 5), 'round trip back at baseline');
    assert.equal(mspQueue.getTunnelSilenceWindow(), windowMs, 'real losses do not widen the window');
}

test('recovers after a loss burst: a 20 Hz same-code poller is back to normal within two windows', (t) => {
    lossBurstRecovery(t, 0);
});

test('recovers after a loss burst on a 4800 baud link within two of its wider windows', (t) => {
    lossBurstRecovery(t, 4800);
});

/** A probe without retries lapses after one window; its reply lands latenessMs after it was sent. */
function lateReplyAfterLapse(t, code, latenessMs) {
    const windowMs = mspQueue.getTunnelSilenceWindow();
    assert.ok(latenessMs > windowMs && latenessMs < 2 * windowMs, 'sanity: late, but inside the stale watch');
    MSP.sendLinkProbe(code, () => {}, 0);
    mspQueue.executor();
    t.mock.timers.tick(latenessMs);
    reply(code, [0x11]);
    t.mock.timers.tick(QUEUE_TICK_MS);
}

test('the silence window starts from the drain time of a serial link', (t) => {
    startTunnelSession(t);
    const windowAt = (baud) => {
        mspQueue.setTunnelMode(true, baud);
        return mspQueue.getTunnelSilenceWindow();
    };
    assert.equal(windowAt(4800), 1158, '460 bytes at 480 B/s plus 200 ms');
    assert.equal(windowAt(9600), 679);
    assert.equal(windowAt(19200), 500, '440 ms, raised to the floor');
    assert.equal(windowAt(115200), 500);
    assert.equal(windowAt(0), 500, 'TCP, UDP and BLE: the link rate is unknown');
    assert.equal(windowAt(1200), 3000, 'capped');
    const slowPrior = (baud) => {
        mspQueue.setTunnelMode(true, baud);
        return [mspQueue.getTunnelSilencePrior(), mspQueue.hasSlowSerialPrior()];
    };
    assert.deepEqual(slowPrior(4800), [1158, true]);
    assert.deepEqual(slowPrior(9600), [679, true]);
    assert.deepEqual(slowPrior(14400), [519, false], 'a prior above the floor, but not a slow wire');
    assert.deepEqual(slowPrior(19200), [500, false]);
    assert.deepEqual(slowPrior(0), [500, false]);

    mspQueue.setTunnelMode(true, 4800);
    send(MSPCodes.MSP_FC_VARIANT);
    mspQueue.executor();
    t.mock.timers.tick(1157);
    mspQueue.executor();
    assert.equal(sent.length, 1, 'no retry inside the window');
    t.mock.timers.tick(1);
    mspQueue.executor();
    assert.equal(sent.length, 2);
});

test('a reply 700 ms late widens the window, and the next same-code request is not retried early', (t) => {
    startTunnelSession(t);
    assert.equal(mspQueue.hasSlowSerialPrior(), false);
    const results = [];
    retryAnsweredByLateFirstReply(t, MSPCodes.MSP_FC_VARIANT, false, (response) => results.push(response));
    assert.equal(sent.length, 2, 'sanity: the 500 ms window retried it');
    t.mock.timers.tick(390); // t = 1100: the retry's own reply, 600 ms after the retry
    reply(MSPCodes.MSP_FC_VARIANT, [0x11]);
    assert.equal(mspQueue.getStaleReplyCount(), 1);
    assert.equal(mspQueue.getTunnelSilenceWindow(), LINK_DELAY_MS * 1.5, 'the answer at 700 was attempt 1\'s: 1050, not 900');
    assert.equal(mspQueue.hasSlowSerialPrior(), false, 'a learned window is no serial prior');

    t.mock.timers.tick(QUEUE_TICK_MS);
    send(MSPCodes.MSP_FC_VARIANT, (response) => results.push(response));
    mspQueue.executor();
    t.mock.timers.tick(LINK_DELAY_MS);
    mspQueue.executor();
    reply(MSPCodes.MSP_FC_VARIANT, [0x22]);
    assert.equal(sent.length, 3, 'answered by its own reply, no retry');
    assert.equal(results.length, 2);
    assert.notEqual(results[1], false);
});

test('slow replies widen the window before anything lapses', (t) => {
    startTunnelSession(t);
    send(MSP_BOXNAMES);
    mspQueue.executor();
    const frames = fcReplyFrames(MSP_BOXNAMES, new Uint8Array(300).fill(0x41));
    t.mock.timers.tick(300);
    link.ingest(frames[0]);
    t.mock.timers.tick(450);
    link.ingest(frames[1]);
    t.mock.timers.tick(100);
    link.ingest(frames[2]);

    assert.equal(sent.length, 1);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 675, '1.5 x the widest gap between chunks');
});

test('the learned window decays by 10 % per minute, and a real loss does not hold it', (t) => {
    startTunnelSession(t);
    lateReplyAfterLapse(t, MSPCodes.MSP_FC_VARIANT, 800); // t = 810, learned at 800
    assert.equal(mspQueue.getTunnelSilenceWindow(), 1200);
    t.mock.timers.tick(59989);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 1200);
    t.mock.timers.tick(1);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 1080);
    t.mock.timers.tick(60000);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 972);

    t.mock.timers.tick(30000); // t = 150800
    MSP.sendLinkProbe(MSPCodes.MSP_FC_VERSION, () => {}, 0);
    mspQueue.executor();
    t.mock.timers.tick(972); // lost: no reply ever, which says nothing about lateness
    t.mock.timers.tick(29027);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 972);
    t.mock.timers.tick(1); // t = 180800: the third minute since the late reply
    assert.equal(mspQueue.getTunnelSilenceWindow(), 875);
});

test('the learned window never decays below the link prior and never exceeds 3 s', (t) => {
    startTunnelSession(t);
    mspQueue.setTunnelMode(true, 4800);
    lateReplyAfterLapse(t, MSPCodes.MSP_FC_VARIANT, 1400);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 2100);
    t.mock.timers.tick(10 * 60000);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 1158);

    mspQueue.setTunnelMode(true, 0);
    lateReplyAfterLapse(t, MSPCodes.MSP_FC_VARIANT, 900);
    lateReplyAfterLapse(t, MSPCodes.MSP_FC_VARIANT, 2400);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 3000);
    t.mock.timers.tick(60000);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 2700, 'stored at the cap: 3600 would still read 3000 here');
});

test('resetting the tunnel requests keeps the learned window but drops pending request and stale watch', (t) => {
    startTunnelSession(t);
    lateReplyAfterLapse(t, MSPCodes.MSP_FC_VARIANT, 800);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 1200);

    MSP.sendLinkProbe(MSPCodes.MSP_FC_VERSION, () => {}, 0);
    mspQueue.executor();
    t.mock.timers.tick(1200);
    assert.equal(mspQueue.isStaleWatched(MSPCodes.MSP_FC_VERSION), true, 'sanity: the lapsed probe is watched');
    MSP.sendLinkProbe(MSPCodes.MSP_FC_VARIANT, () => {}, 1);
    mspQueue.executor();
    const sentBefore = sent.length;

    MSP.callbacks_cleanup();
    mspQueue.resetTunnelRequests();
    mspQueue.freeHardLock();
    mspQueue.freeSoftLock();
    assert.equal(mspQueue.getTunnelSilenceWindow(), 1200, 'same link: the learned window still holds');
    assert.equal(mspQueue.isStaleWatched(MSPCodes.MSP_FC_VERSION), false);
    assert.equal(mspQueue.getStaleReplyCount(), 0);
    assert.equal(mspQueue.isLocked(), false, 'nothing pending');
    t.mock.timers.tick(1200);
    mspQueue.executor();
    assert.equal(sent.length, sentBefore, 'the dropped request neither times out nor retries');
});

test('slow codes keep their 5 s first window, and their flash wait does not widen the window', (t) => {
    startTunnelSession(t);
    send(MSPCodes.MSP_EEPROM_WRITE);
    mspQueue.executor();
    t.mock.timers.tick(4000);
    reply(MSPCodes.MSP_EEPROM_WRITE, []);
    t.mock.timers.tick(QUEUE_TICK_MS);
    assert.equal(mspQueue.getTunnelSilenceWindow(), SILENCE_MS, 'a 4 s flash erase is not link latency');

    lateReplyAfterLapse(t, MSPCodes.MSP_FC_VARIANT, 900);
    assert.equal(mspQueue.getTunnelSilenceWindow(), 1350);
    send(MSPCodes.MSP_EEPROM_WRITE);
    mspQueue.executor();
    t.mock.timers.tick(SLOW_INITIAL_MS - 10);
    mspQueue.executor();
    assert.equal(sent.length, 3, 'still inside the 5 s window');
    t.mock.timers.tick(10);
    mspQueue.executor();
    assert.equal(sent.length, 4, 'retried at 5 s, as before');
});

test('a dataflash erase that answers after 8 s does not widen the window', (t) => {
    startTunnelSession(t);
    // The round-trip filters are module-global: an 8 s sample would leak into the balancer tests below.
    MSP.setProcessData((handler) => {
        const pending = handler.callbacks.find((c) => c.code == handler.code);
        MSP.setProcessData(defaultProcessData);
        pending.lastSentOn = null;
        defaultProcessData(handler);
    });
    const results = [];
    send(MSPCodes.MSP_DATAFLASH_ERASE, (response) => results.push(response));
    mspQueue.executor();
    t.mock.timers.tick(8000);
    reply(MSPCodes.MSP_DATAFLASH_ERASE, []);
    t.mock.timers.tick(QUEUE_TICK_MS);
    assert.equal(results.length, 1);
    assert.notEqual(results[0], false);
    assert.equal(sent.length, 1);
    assert.equal(mspQueue.getTunnelSilenceWindow(), SILENCE_MS, 'the erase wait is not link latency');
});

test('an abandoned EEPROM write that lapses at 5 s and then replies does not widen the window', (t) => {
    startTunnelSession(t);
    send(MSPCodes.MSP_EEPROM_WRITE);
    mspQueue.executor();
    MSP.callbacks_cleanup(); // tab switch: no retry
    t.mock.timers.tick(SLOW_INITIAL_MS);
    t.mock.timers.tick(300);
    reply(MSPCodes.MSP_EEPROM_WRITE, []);
    assert.equal(mspQueue.getStaleReplyCount(), 1, 'dropped as the lapsed write\'s late reply');
    assert.equal(mspQueue.getTunnelSilenceWindow(), SILENCE_MS, '5.3 s of flash wait is not link latency');
});

test('a stray chunk before a flash write does not count the flash wait as a gap', (t) => {
    startTunnelSession(t);
    const results = [];
    send(MSPCodes.MSP_EEPROM_WRITE, (response) => results.push(response));
    mspQueue.executor();
    t.mock.timers.tick(100);
    link.ingest(fcReplyFrames(MSP_BOXNAMES, new Uint8Array(300).fill(0x41))[0]); // a partial foreign reply
    t.mock.timers.tick(3900);
    reply(MSPCodes.MSP_EEPROM_WRITE, []);

    assert.equal(results.length, 1);
    assert.notEqual(results[0], false);
    assert.equal(mspQueue.getTunnelSilenceWindow(), SILENCE_MS);
});

test('a tab switch while a request is pending cannot lock the queue', (t) => {
    startTunnelSession(t);
    CONFIGURATOR.connectionValid = true;
    const results = [];
    const lost = [];
    MSP.onResponseLost = (code) => lost.push(code);
    try {
        send(MSPCodes.MSP2_PID, (response) => results.push(response));
        mspQueue.executor();

        // gui.js tab_switch_cleanup()
        MSP.callbacks_cleanup();
        mspQueue.flush();
        mspQueue.freeHardLock();
        mspQueue.freeSoftLock();
        mspDeduplicationQueue.flush();

        send(MSPCodes.MSP2_PID); // the new tab reads the same code
        mspQueue.executor();
        assert.equal(sent.length, 1, 'the abandoned request still owns the slot');

        t.mock.timers.tick(SILENCE_MS); // its reply is lost
        assert.equal(mspDeduplicationQueue.check(MSPCodes.MSP2_PID), true, 'the new tab\'s dedup entry survives');
        assert.deepEqual(lost, [], 'an abandoned request is not reported');
        assert.equal(MSP.lostReplies.size, 0);

        t.mock.timers.tick(SILENCE_MS); // the lapse hold ends
        mspQueue.executor();
        assert.deepEqual(sentCodes(), [MSPCodes.MSP2_PID, MSPCodes.MSP2_PID], 'no retry, the new tab\'s request goes out');
        assert.deepEqual(results, [], 'the old tab is not called back');
    } finally {
        MSP.onResponseLost = null;
    }
});

test('a read identical to the request abandoned by a tab switch is not attached to it', (t) => {
    startTunnelSession(t);
    CONFIGURATOR.connectionValid = true;
    const answers = [];
    const readSetting = (index) => {
        const sentOk = MSP.send_message(MSPCodes.MSPV2_SETTING, [0, index, 0], false, (response) => answers.push([index, response !== false]));
        assert.equal(sentOk, true);
    };
    readSetting(5);
    mspQueue.executor();

    // gui.js tab_switch_cleanup()
    MSP.callbacks_cleanup();
    mspQueue.flush();
    mspQueue.freeHardLock();
    mspQueue.freeSoftLock();
    mspDeduplicationQueue.flush();
    answers.length = 0;

    readSetting(9);
    readSetting(5); // dedup refuses the put: same code as setting 9, same body as the abandoned read
    reply(MSPCodes.MSPV2_SETTING, [42]); // the abandoned read's reply

    let answered = sent.length;
    for (let step = 0; step < 300 && answers.length < 2; step++) {
        t.mock.timers.tick(QUEUE_TICK_MS);
        mspQueue.executor();
        if (sent.length > answered) {
            answered = sent.length;
            reply(MSPCodes.MSPV2_SETTING, [7]);
        }
    }
    assert.deepEqual(answers, [[9, true], [5, true]], 'the new tab\'s second read is answered by its own request');
    assert.equal(sent.length, 3);
});

test('lost replies are keyed by request payload: WP 4 read back does not unblock a lost WP 3', (t) => {
    startTunnelSession(t);
    CONFIGURATOR.connectionValid = true;
    const lost = [];
    MSP.onResponseLost = (code) => lost.push(code);
    const loseTwice = () => {
        for (let attempt = 0; attempt < 2; attempt++) {
            mspQueue.executor();
            t.mock.timers.tick(SILENCE_MS);
        }
        t.mock.timers.tick(SILENCE_MS); // lapse hold
    };
    try {
        sendWp(3);
        loseTwice();
        assert.equal(MSP.blockedWriteSource(MSPCodes.MSP_SET_WP), MSPCodes.MSP_WP);

        sendWp(4);
        mspQueue.executor();
        reply(MSPCodes.MSP_WP, [4]);
        t.mock.timers.tick(10);
        assert.equal(MSP.blockedWriteSource(MSPCodes.MSP_SET_WP), MSPCodes.MSP_WP, 'WP 3 is still missing');

        sendWp(3);
        mspQueue.executor();
        reply(MSPCodes.MSP_WP, [3]);
        t.mock.timers.tick(10);
        assert.equal(MSP.blockedWriteSource(MSPCodes.MSP_SET_WP), false, 'WP 3 read again');

        send(MSPCodes.MSPV2_INAV_STATUS);
        loseTwice();
        assert.equal(MSP.lostReplies.has(MSPCodes.MSPV2_INAV_STATUS), true, 'every lost read is recorded');
        assert.deepEqual(lost, [MSPCodes.MSP_WP], 'but only reads that feed a save are reported');
    } finally {
        MSP.onResponseLost = null;
    }
});

test('a lost read blocks the write that hands it back until it has been read again', (t) => {
    startTunnelSession(t);
    CONFIGURATOR.connectionValid = true;
    const lost = [];
    MSP.onResponseLost = (code) => lost.push(code);
    try {
        const results = [];
        send(MSPCodes.MSP2_PID, (response) => results.push(response));
        for (let attempt = 0; attempt < 3; attempt++) {
            mspQueue.executor();
            t.mock.timers.tick(SILENCE_MS);
        }

        assert.deepEqual(lost, [MSPCodes.MSP2_PID], 'reported once');
        assert.deepEqual(results, [false], 'reads still hear back, with false');
        assert.equal(MSP.parseFailures.has(MSPCodes.MSP2_PID), false, 'parse failures stay session-wide and untouched');
        assert.equal(MSP.blockedWriteSource(MSPCodes.MSP2_SET_PID), MSPCodes.MSP2_PID);
        assert.equal(MSP.send_message(MSPCodes.MSP2_SET_PID, [1, 2, 3], false, () => {}), false, 'the save is refused');

        send(MSPCodes.MSP2_PID);
        mspQueue.executor();
        reply(MSPCodes.MSP2_PID, [1, 2, 3, 4]);

        assert.equal(MSP.blockedWriteSource(MSPCodes.MSP2_SET_PID), false, 'a good re-read unblocks it');
        assert.equal(MSP.lostReplies.size, 0);
    } finally {
        MSP.onResponseLost = null;
    }
});

test('a lost write gets no callback, so its save chain stops before EEPROM write and reboot (message: msp-tunnel-write-lost)', (t) => {
    startTunnelSession(t);
    const results = [];
    assert.equal(MSP.send_message(MSPCodes.MSP2_SET_PID, [1, 2, 3], false, (response) => results.push(response)), true);
    for (let attempt = 0; attempt < 3; attempt++) {
        mspQueue.executor();
        t.mock.timers.tick(SILENCE_MS);
    }

    assert.deepEqual(sentCodes(), [MSPCodes.MSP2_SET_PID, MSPCodes.MSP2_SET_PID]);
    assert.deepEqual(results, []);
    assert.equal(MSP.parseFailures.has(MSPCodes.MSP2_SET_PID), false);
    assert.equal(mspQueue.isLocked(), false, 'the slot is free for the next request');
});

test('handlers that write the config flash get the long first window too', (t) => {
    startTunnelSession(t);
    send(MSPCodes.MSP_SELECT_SETTING);
    mspQueue.executor();
    t.mock.timers.tick(SLOW_INITIAL_MS - 10);
    mspQueue.executor();
    assert.equal(sent.length, 1);
    t.mock.timers.tick(10);
    mspQueue.executor();
    assert.deepEqual(sentCodes(), [MSPCodes.MSP_SELECT_SETTING, MSPCodes.MSP_SELECT_SETTING], 'one retry, as for EEPROM write');
});

test('an early chunk does not shorten the long first window', (t) => {
    startTunnelSession(t);
    send(MSPCodes.MSP_EEPROM_WRITE);
    mspQueue.executor();
    t.mock.timers.tick(100);
    link.ingest(fcReplyFrames(MSPCodes.MSP_EEPROM_WRITE, new Uint8Array(200).fill(0x41))[0]);

    t.mock.timers.tick(SLOW_INITIAL_MS - 110);
    mspQueue.executor();
    assert.equal(sent.length, 1, 'still inside the 5 s window');
    t.mock.timers.tick(10);
    mspQueue.executor();
    assert.equal(sent.length, 2);
});

test('the balancer still frees a stuck hard lock when no tunnel request is pending', (t) => {
    startTunnelSession(t);
    mspQueue.setHardLock();
    t.mock.timers.tick(1100);
    mspQueue.balancer();
    assert.equal(mspQueue.isLocked(), false);
});

test('identical reads coalesce onto the pending request, each caller with its own DataView', (t) => {
    startTunnelSession(t);
    const answers = [];
    MSP.setProcessData((handler) => {
        const pending = handler.callbacks.find((c) => c.code == handler.code);
        handler.callbacks.splice(handler.callbacks.indexOf(pending), 1);
        mspDeduplicationQueue.remove(handler.code);
        pending.onFinish({ command: handler.code, data: new DataView(handler.message_buffer) });
    });
    try {
        send(MSPCodes.MSP_ATTITUDE, (response) => answers.push(response));
        mspQueue.executor();
        send(MSPCodes.MSP_ATTITUDE, (response) => answers.push(response));
        send(MSPCodes.MSP_ATTITUDE, (response) => answers.push(response));
        reply(MSPCodes.MSP_ATTITUDE, [1, 2, 3, 4, 5, 6]);

        assert.equal(sent.length, 1, 'one request on the wire');
        assert.equal(answers.length, 3);
        assert.notEqual(answers[0].data, answers[1].data);
        assert.equal(answers[2].data.getUint8(5), 6);
    } finally {
        MSP.setProcessData(defaultProcessData);
    }
});

test('a re-read queued behind a SET is not answered by the read in flight before it', (t) => {
    startTunnelSession(t);
    const answers = [];
    send(MSPCodes.MSP2_PID, () => answers.push('first read'));
    mspQueue.executor();
    assert.equal(MSP.send_message(MSPCodes.MSP2_SET_PID, [1, 2, 3], false, () => answers.push('set')), true);
    send(MSPCodes.MSP2_PID, () => answers.push('re-read'));

    reply(MSPCodes.MSP2_PID, [1]);
    assert.deepEqual(answers, ['first read'], 'the pre-SET reply must not answer the re-read');

    for (let step = 0; step < 30 && answers.length < 3; step++) {
        t.mock.timers.tick(10);
        mspQueue.executor();
        const last = sentCodes()[sent.length - 1];
        if (sent.length > 1 && !answers.includes(last === MSPCodes.MSP2_SET_PID ? 'set' : 're-read')) {
            reply(last, [2]);
        }
    }

    assert.deepEqual(sentCodes(), [MSPCodes.MSP2_PID, MSPCodes.MSP2_SET_PID, MSPCodes.MSP2_PID]);
    assert.deepEqual(answers, ['first read', 'set', 're-read']);
});

test('a timeout resets the MSP decoder and the tunnel reassembly', (t) => {
    startTunnelSession(t);
    send(MSP_BOXNAMES);
    mspQueue.executor();

    const frames = fcReplyFrames(MSP_BOXNAMES, new Uint8Array(300).fill(0x41));
    link.ingest(frames[0]); // the second chunk is lost
    assert.notEqual(MSP.state, MSP.decoder_states.IDLE, 'sanity: decoder is mid-frame');

    t.mock.timers.tick(SILENCE_MS);

    assert.equal(MSP.state, MSP.decoder_states.IDLE);
    assert.equal(linkResets, 1);
});

test('removeCallback removes when called unbound, as the queue calls it', (t) => {
    MSP.callbacks_cleanup();
    t.mock.timers.enable({ apis: ['setTimeout'] });
    let fired = 0;
    MSP.putCallback({ code: 5, timer: setTimeout(() => fired++, 100) });
    MSP.putCallback({ code: 6, timer: setTimeout(() => fired++, 100) });
    MSP.putCallback({ code: 5, timer: setTimeout(() => fired++, 100) });

    // serial_queue.js stores the function and calls it as privateScope.removeCallback(code).
    const queueSide = { removeCallback: MSP.removeCallback };
    queueSide.removeCallback(5);

    assert.deepEqual(MSP.callbacks.map((c) => c.code), [6]);
    t.mock.timers.tick(100);
    assert.equal(fired, 1, 'the removed entries\' timers are cleared');
    MSP.callbacks_cleanup();
});

test('leaving tunnel mode restores the lock method chosen meanwhile', (t) => {
    startTunnelSession(t);
    mspQueue.setLockMethod('soft');
    assert.equal(mspQueue.getLockMethod(), 'hard', 'tunnel mode always runs hard-locked');

    mspQueue.setTunnelMode(false);
    mspQueue.setTransportTransform(null);
    assert.equal(mspQueue.getLockMethod(), 'soft');
    assert.equal(mspQueue.admitReply(MSPCodes.MSP_FC_VARIANT), true, 'plain MSP never drops replies');
});
