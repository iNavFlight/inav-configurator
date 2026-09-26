#!/usr/bin/env node
/**
 * MSP queue tunnel mode: one request in flight, a 500 ms silence timeout restarted by every
 * received TUNNEL chunk, one whole-request retry (none for reboot), onFinish(false) at the end,
 * stale-reply watch and decoder reset. Runs the real js/serial_queue.js and js/msp.js (import
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
import { loadMspCore, mspV2Reply } from './helpers/mspCore.mjs';

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
    onReassemblyTimeout: () => MSP.resetDecoder(),
});
link.lockTarget(1, 1);

function startTunnelSession(t) {
    // Clean up before mocking: clearing the previous test's mock timers through a new mock corrupts its queue.
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
    CONFIGURATOR.connectionValid = false;
    CONFIGURATOR.cliActive = false;
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

test('recovers after a loss burst: a 20 Hz same-code poller is back to normal within 1 s', (t) => {
    startTunnelSession(t);
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
    for (let now = 0; now < 3500; now += QUEUE_TICK_MS) {
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

    const recovered = BURST_END + 1000;
    const late = done.filter((d) => d.createdAt >= recovered);
    assert.ok(late.length >= 20, `sanity: the poller kept running (${late.length})`);
    const worst = Math.max(...late.map((d) => d.queuedToDone));
    assert.ok(worst <= QUEUE_TICK_MS + FC_REPLY_MS, `queued->done after recovery ${worst} ms`);
    // The poller is not held by it, but the watch lives while identical polls keep completing:
    // one of them may have taken the duplicate, making its own reply the outstanding one.
    t.mock.timers.tick(2000);
    assert.equal(mspQueue.isStaleWatched(MSPCodes.MSP_ATTITUDE), false, 'the watch ends once polling stops');

    const peak = Math.max(...roundtrips.map((r) => Math.max(r.rt, r.hw)));
    assert.ok(peak < 25, `no lost or held request feeds the round-trip average (peak ${peak.toFixed(1)} ms)`);
    const settled = roundtrips.filter((r) => r.at >= recovered);
    assert.ok(settled.every((r) => r.rt <= QUEUE_TICK_MS + FC_REPLY_MS + 5), 'round trip back at baseline');
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

test('a lost write never calls back, so a save chain cannot go on to EEPROM write and reboot', (t) => {
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
