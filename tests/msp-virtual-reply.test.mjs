#!/usr/bin/env node
/**
 * Telemetry-covered MSP reads in a MAVLink tunnel session: answered from FC state while the
 * source messages are fresh and their interval was acknowledged, otherwise sent through the
 * tunnel as in phase 1. Runs the real js/msp.js + js/serial_queue.js (import specifiers
 * rewritten only) with the real feed, link and stream control, on Node's mock timers.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MavlinkLink } from '../js/mavlink/mavlinkLink.js';
import { MavlinkParser } from '../js/mavlink/mavlinkParser.js';
import { MAVLINK_MSG_ID, encodeFrameV2, getMessageInfo, concatFrames } from '../js/mavlink/mavlinkProtocol.js';
import {
    MavlinkTelemetryFeed,
    TELEMETRY_COVERED,
    BASE_INTERVALS_US,
    BOOST_INTERVAL_US,
    RE_REQUEST_MS,
    NEVER_SEEN_RE_REQUESTS,
    MAX_RE_REQUESTS,
    REDUCED_INTERVALS_US,
    UNBOOST_IDLE_MS,
    MIN_FRESH_WINDOW_MS,
    STATS_PERIOD_MS,
    WIRE_REFRESH_MS,
    RESTORE_SPACING_MS,
    RESTORE_DEADLINE_MS,
    RESTORE_FRAME_ALLOWANCE_MS,
    isTelemetryFeedEnabled,
    mspCodeOfFrame,
} from '../js/mavlink/mavlinkTelemetryFeed.js';
import { COMMAND_SPACING_MS } from '../js/mavlink/mavlinkStreamControl.js';
import { loadMspCore, resetMspCore } from './helpers/mspCore.mjs';

const { MSP, mspQueue, MSPCodes, CONFIGURATOR, mspDeduplicationQueue } =
    await loadMspCore(import.meta.url, 'msp-virtual-reply.test.mjs', 'msp-virtual-reply-');

globalThis.$ = () => ({ html() {} });
MSP.init();

// Stand-in for MSPHelper.completeRequest: fire and remove the first pending callback of the code.
MSP.setProcessData((handler) => {
    for (let i = handler.callbacks.length - 1; i >= 0; i--) {
        const pending = handler.callbacks[i];
        if (pending.code == handler.code) {
            mspDeduplicationQueue.remove(handler.code);
            handler.callbacks.splice(i, 1);
            if (pending.onFinish) {
                pending.onFinish({ command: handler.code });
            }
            break;
        }
    }
});

const wire = [];
CONFIGURATOR.connection = {
    bitrate: 115200,
    getTimeout: () => 3000,
    send(data, callback) {
        wire.push(new Uint8Array(data));
        if (callback) {
            callback({ bytesSent: data.byteLength });
        }
    },
};

let feed = null;
const link = new MavlinkLink({
    onTunnelChunk: (bytes) => {
        mspQueue.notifyTunnelProgress();
        MSP.read({ data: bytes });
    },
    onMessage: frame => feed && feed.handleFrame(frame),
});
link.lockTarget(1, 1);

const logs = [];
let fc = null;

function makeFc() {
    return {
        CONFIG: { cpuload: 0 },
        SENSOR_DATA: { kinematics: [0, 0, 0], altitude: 0, barometer: 0, air_speed: 0 },
        SENSOR_STATUS: {},
        GPS_DATA: {},
        ANALOG: {},
        RC: { active_channels: 0, channels: new Array(32).fill(0) },
    };
}

function startSession(t, { withFeed = true, serialBaud = 0, roundTripMs = 0 } = {}) {
    // The previous feed's timers were mock timers and ended with its test.
    feed = null;
    MSP.virtualReplies = null;
    resetMspCore({ MSP, mspQueue, mspDeduplicationQueue, CONFIGURATOR });
    wire.length = 0;
    logs.length = 0;

    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 1000000 });
    mspQueue.setTunnelMode(true, serialBaud);
    mspQueue.setTransportTransform(
        (body) => {
            if (feed) {
                feed.noteWire(mspCodeOfFrame(body));
            }
            return concatFrames(link.wrapMsp(body)).buffer;
        },
        () => link.resetReassembly()
    );
    fc = makeFc();
    feed = withFeed ? new MavlinkTelemetryFeed({
        link,
        send: (data, callback) => CONFIGURATOR.connection.send(data, callback),
        fc,
        msp: MSP,
        log: line => logs.push(line),
        roundTripMs: () => roundTripMs,
        // as js/serial_backend.js
        slowSerialLink: mspQueue.hasSlowSerialPrior(),
    }) : null;
    MSP.virtualReplies = feed;
    if (feed) {
        feed.start();
    }
}

// Every frame written so far, split into MSP requests (by code) and SET_MESSAGE_INTERVAL commands.
function wireTraffic() {
    const msp = [];
    const commands = [];
    for (const write of wire) {
        const tunnelBytes = [];
        for (const frame of new MavlinkParser().ingest(write)) {
            if (frame.msgid === MAVLINK_MSG_ID.TUNNEL) {
                tunnelBytes.push(...frame.payload.subarray(5, 5 + frame.payload[4]));
            } else if (frame.msgid === MAVLINK_MSG_ID.COMMAND_LONG) {
                const view = new DataView(frame.payload.buffer);
                commands.push([view.getFloat32(0, true), view.getFloat32(4, true)]);
            }
        }
        if (tunnelBytes.length) {
            msp.push(tunnelBytes[4] | (tunnelBytes[5] << 8));
        }
    }
    return { msp, commands };
}

function fcFrame(msgid, payload = null) {
    return encodeFrameV2(msgid, payload || new Uint8Array(getMessageInfo(msgid).length), 1, 1, 0);
}

function ack(result = 0) {
    const payload = Uint8Array.from([0xFF, 0x01, result, 0, 0, 0, 0, 0, 253, 25]);
    link.ingest(fcFrame(MAVLINK_MSG_ID.COMMAND_ACK, payload));
}

// Answers every queued interval command; `results` maps message id -> MAV_RESULT (default accepted).
function answerCommands(t, results = new Map()) {
    for (let guard = 0; guard < 20 && !feed.streams.isIdle(); guard++) {
        const { commands } = wireTraffic();
        const [msgid] = commands[commands.length - 1];
        ack(results.get(msgid) || 0);
        t.mock.timers.tick(COMMAND_SPACING_MS);
    }
}

function streamAll(except = []) {
    for (const msgid of BASE_INTERVALS_US.keys()) {
        if (!except.includes(msgid)) {
            link.ingest(fcFrame(msgid));
        }
    }
}

function mspReply(code) {
    const reply = [0x24, 0x58, 0x3E, 0, code & 0xFF, code >> 8, 0, 0];
    let crc = 0;
    for (const byte of reply.slice(3)) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc & 0x80) ? ((crc << 1) ^ 0xD5) & 0xFF : (crc << 1) & 0xFF;
        }
    }
    MSP.read({ data: [...reply, crc] });
}

// Sends one read through the queue and answers it on the wire.
function wireRoundTrip(t, code) {
    let result;
    MSP.send_message(code, false, false, response => { result = response; });
    mspQueue.executor();
    mspReply(code);
    t.mock.timers.tick(10);
    return result;
}

function seedAll(t) {
    for (const code of TELEMETRY_COVERED.keys()) {
        wireRoundTrip(t, code);
    }
}

function readyForVirtual(t) {
    answerCommands(t);
    streamAll();
    seedAll(t);
}

test('the base set is requested one command at a time and every id is acknowledged', (t) => {
    startSession(t);
    let ready = null;
    feed._onStreamsReady = (accepted, total) => { ready = [accepted, total]; };
    assert.deepEqual(wireTraffic().commands, [[MAVLINK_MSG_ID.SYS_STATUS, 500000]]);
    answerCommands(t);
    const expected = Array.from(BASE_INTERVALS_US, ([msgid, us]) => [msgid, us]);
    assert.deepEqual(wireTraffic().commands, expected);
    assert.deepEqual(ready, [6, 6]);
});

test('a covered read with fresh telemetry is answered without the wire, callbacks on the next tick', (t) => {
    startSession(t);
    readyForVirtual(t);
    const before = wire.length;
    const events = [];
    const result = MSP.send_message(MSPCodes.MSP_ATTITUDE, false, () => events.push('sent'), response => events.push(response));
    assert.equal(result, true);
    assert.deepEqual(events, [], 'asynchronous like a real reply');
    assert.equal(mspQueue.getLength(), 0);
    t.mock.timers.tick(0);
    assert.deepEqual(events, ['sent', true]);
    mspQueue.executor();
    assert.equal(wire.length, before, 'nothing went on the wire');
    assert.equal(feed.counts.virtual.get(MSPCodes.MSP_ATTITUDE), 1);

    for (const code of TELEMETRY_COVERED.keys()) {
        assert.equal(feed.serve(code, false, null, null), true, MSP.getCodeName(code));
    }
});

test('the first read of each covered code goes on the wire, so fields MAVLink lacks hold an MSP value', (t) => {
    startSession(t);
    answerCommands(t);
    streamAll();
    MSP.send_message(MSPCodes.MSP_ALTITUDE, false, false, null);
    mspQueue.executor();
    assert.deepEqual(wireTraffic().msp, [MSPCodes.MSP_ALTITUDE]);
    assert.equal(feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null), false, 'sent but not answered yet');
    mspReply(MSPCodes.MSP_ALTITUDE);
    t.mock.timers.tick(10);
    assert.equal(feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null), true);

    // A lost or unparsable seed read counts as not read.
    MSP.lostReplies.set(MSPCodes.MSP_ALTITUDE, new Set(['']));
    assert.equal(feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null), false);
    MSP.lostReplies.clear();
    MSP.parseFailures.add(MSPCodes.MSP_ALTITUDE);
    assert.equal(feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null), false);
    MSP.parseFailures.clear();
});

test('a wire request that times out does not enable virtual replies', (t) => {
    startSession(t);
    answerCommands(t);
    streamAll();
    MSP.send_message(MSPCodes.MSP_RC, false, false, null);
    mspQueue.executor();
    t.mock.timers.tick(500);
    mspQueue.executor();
    t.mock.timers.tick(500);
    assert.equal(wireTraffic().msp.filter(code => code === MSPCodes.MSP_RC).length, 2, 'attempt and retry, both unanswered');
    streamAll();
    assert.equal(feed.serve(MSPCodes.MSP_RC, false, null, null), false);
});

test('falls back to the wire when a source message never arrived', (t) => {
    startSession(t);
    answerCommands(t);
    streamAll([MAVLINK_MSG_ID.RC_CHANNELS]);
    seedAll(t);
    assert.equal(feed.serve(MSPCodes.MSP_RC, false, null, null), false);
    assert.equal(feed.serve(MSPCodes.MSPV2_INAV_ANALOG, false, null, null), false, 'ANALOG needs RC_CHANNELS for rssi');
    assert.equal(feed.serve(MSPCodes.MSP_ATTITUDE, false, null, null), true);

    wireRoundTrip(t, MSPCodes.MSP_RC);
    assert.equal(wireTraffic().msp.filter(code => code === MSPCodes.MSP_RC).length, 2);
    assert.equal(logs.filter(line => line.includes('MSP_RC goes over the tunnel')).length, 1, 'logged once per code');
});

test('falls back to the wire when the source is stale: max(3 x interval, 3 s)', (t) => {
    startSession(t);
    readyForVirtual(t);
    link.ingest(fcFrame(MAVLINK_MSG_ID.ATTITUDE));
    t.mock.timers.tick(MIN_FRESH_WINDOW_MS);
    assert.equal(feed.serve(MSPCodes.MSP_ATTITUDE, false, null, null), true, 'exactly at the window edge still fresh');
    t.mock.timers.tick(1);
    assert.equal(feed.serve(MSPCodes.MSP_ATTITUDE, false, null, null), false);
    link.ingest(fcFrame(MAVLINK_MSG_ID.ATTITUDE));
    assert.equal(feed.serve(MSPCodes.MSP_ATTITUDE, false, null, null), true, 'recovers with the next message');
});

test('falls back to the wire when the interval request was not acknowledged', (t) => {
    startSession(t);
    answerCommands(t, new Map([[MAVLINK_MSG_ID.VFR_HUD, 3]]));
    streamAll();
    seedAll(t);
    assert.equal(feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null), false);
    assert.equal(feed.serve(MSPCodes.MSP_ATTITUDE, false, null, null), true);
});

test('more than 18 RC channels keep MSP_RC on the wire', (t) => {
    startSession(t);
    readyForVirtual(t);
    const rc = new Uint8Array(getMessageInfo(MAVLINK_MSG_ID.RC_CHANNELS).length);
    rc[40] = 24;
    link.ingest(fcFrame(MAVLINK_MSG_ID.RC_CHANNELS, rc));
    assert.equal(feed.serve(MSPCodes.MSP_RC, false, null, null), false);
    assert.equal(feed.serve(MSPCodes.MSPV2_INAV_ANALOG, false, null, null), true);
});

test('MSP_SENSOR_STATUS is never answered virtually: the FC must see it (isMspConfigActive)', (t) => {
    startSession(t);
    readyForVirtual(t);
    assert.equal(TELEMETRY_COVERED.has(MSPCodes.MSP_SENSOR_STATUS), false);
    for (let i = 0; i < 3; i++) {
        link.ingest(fcFrame(MAVLINK_MSG_ID.SYS_STATUS));
        wireRoundTrip(t, MSPCodes.MSP_SENSOR_STATUS);
        assert.equal(feed.serve(MSPCodes.MSP_SENSOR_STATUS, false, null, null), false);
    }
    assert.equal(wireTraffic().msp.filter(code => code === MSPCodes.MSP_SENSOR_STATUS).length, 3);
    assert.equal(feed.counts.virtual.has(MSPCodes.MSP_SENSOR_STATUS), false);
});

test('a covered code goes back on the wire once its last wire read is 10 s old, then virtual again', (t) => {
    startSession(t);
    answerCommands(t);
    streamAll();
    wireRoundTrip(t, MSPCodes.MSPV2_INAV_ANALOG);
    const keepFresh = () => streamAll();
    t.mock.timers.tick(WIRE_REFRESH_MS - 1000);
    keepFresh();
    t.mock.timers.tick(989);
    assert.equal(feed.serve(MSPCodes.MSPV2_INAV_ANALOG, false, null, null), true, '9.99 s after the wire read');
    t.mock.timers.tick(1);
    assert.equal(feed.serve(MSPCodes.MSPV2_INAV_ANALOG, false, null, null), false, '10 s after the wire read');

    const before = wireTraffic().msp.filter(code => code === MSPCodes.MSPV2_INAV_ANALOG).length;
    wireRoundTrip(t, MSPCodes.MSPV2_INAV_ANALOG);
    assert.equal(wireTraffic().msp.filter(code => code === MSPCodes.MSPV2_INAV_ANALOG).length, before + 1);
    assert.equal(feed.serve(MSPCodes.MSPV2_INAV_ANALOG, false, null, null), true, 'refreshed');
    assert.equal(logs.some(line => line.includes('MSPV2_INAV_ANALOG goes over the tunnel')), false, 'a refresh is not a fallback');
});

test('boost after 3 requests within 1 s, one command per change, unboost after 2 s idle', (t) => {
    startSession(t);
    readyForVirtual(t);
    const commandsBefore = wireTraffic().commands.length;

    for (let i = 0; i < 2; i++) {
        MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, null);
        t.mock.timers.tick(50);
    }
    assert.equal(wireTraffic().commands.length, commandsBefore, 'two requests do not boost');
    MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, null);
    assert.deepEqual(wireTraffic().commands.slice(commandsBefore), [[MAVLINK_MSG_ID.ATTITUDE, BOOST_INTERVAL_US]]);
    ack();
    link.ingest(fcFrame(MAVLINK_MSG_ID.ATTITUDE));

    // A 20 Hz poller for 1.5 s: no further command.
    for (let i = 0; i < 30; i++) {
        t.mock.timers.tick(50);
        streamAll();
        MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, null);
    }
    assert.equal(wireTraffic().commands.length, commandsBefore + 1);
    assert.equal(feed.isBoosted(MAVLINK_MSG_ID.ATTITUDE), true);

    // The idle check runs every 250 ms: the unboost lands 2.00..2.25 s after the last request.
    t.mock.timers.tick(UNBOOST_IDLE_MS - 250);
    assert.equal(wireTraffic().commands.length, commandsBefore + 1, 'still within 2 s of the last request');
    t.mock.timers.tick(500);
    assert.deepEqual(wireTraffic().commands.slice(commandsBefore), [
        [MAVLINK_MSG_ID.ATTITUDE, BOOST_INTERVAL_US],
        [MAVLINK_MSG_ID.ATTITUDE, BASE_INTERVALS_US.get(MAVLINK_MSG_ID.ATTITUDE)],
    ]);
    assert.equal(feed.isBoosted(MAVLINK_MSG_ID.ATTITUDE), false);
    ack();
    for (let i = 0; i < 16; i++) {
        t.mock.timers.tick(UNBOOST_IDLE_MS / 8);
        streamAll();
    }
    assert.equal(wireTraffic().commands.length, commandsBefore + 2);
});

test('RC boosts too; altitude and analog never boost', (t) => {
    startSession(t);
    readyForVirtual(t);
    const commandsBefore = wireTraffic().commands.length;
    for (let i = 0; i < 5; i++) {
        feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null);
        feed.serve(MSPCodes.MSPV2_INAV_ANALOG, false, null, null);
    }
    assert.equal(wireTraffic().commands.length, commandsBefore);
    for (let i = 0; i < 3; i++) {
        feed.serve(MSPCodes.MSP_RC, false, null, null);
    }
    assert.deepEqual(wireTraffic().commands.slice(commandsBefore), [[MAVLINK_MSG_ID.RC_CHANNELS, BOOST_INTERVAL_US]]);
});

test('writes and reads with a payload are never virtual', (t) => {
    startSession(t);
    readyForVirtual(t);
    const before = wireTraffic().msp.length;
    MSP.send_message(MSPCodes.MSP_SET_RAW_RC, [0xDC, 0x05], false, null);
    mspQueue.executor();
    assert.deepEqual(wireTraffic().msp.slice(before), [MSPCodes.MSP_SET_RAW_RC]);
    assert.equal(feed.serve(MSPCodes.MSP_RC, [1], null, null), false);
    for (const code of TELEMETRY_COVERED.keys()) {
        assert.ok(!/SET|WRITE|SAVE|ERASE|RESET_|SELECT_/.test(MSP.getCodeName(code)), 'table holds reads only');
    }
});

test('a tab switch cancels virtual callbacks that have not fired yet', (t) => {
    startSession(t);
    readyForVirtual(t);
    let fired = false;
    MSP.send_message(MSPCodes.MSP_ATTITUDE, false, false, () => { fired = true; });
    MSP.callbacks_cleanup();
    t.mock.timers.tick(10);
    assert.equal(fired, false);
});

test('without the feed (switched off) everything goes on the wire and no interval is requested', (t) => {
    const storeWith = value => ({ get: (key, fallback) => (key === 'mavlink_telemetry_feed' && value !== undefined ? value : fallback) });
    assert.equal(isTelemetryFeedEnabled(storeWith(undefined)), true);
    assert.equal(isTelemetryFeedEnabled(storeWith(true)), true);
    assert.equal(isTelemetryFeedEnabled(storeWith(false)), false);

    startSession(t, { withFeed: false });
    streamAll();
    for (let i = 0; i < 3; i++) {
        wireRoundTrip(t, MSPCodes.MSP_ATTITUDE);
    }
    const traffic = wireTraffic();
    assert.deepEqual(traffic.msp, [MSPCodes.MSP_ATTITUDE, MSPCodes.MSP_ATTITUDE, MSPCodes.MSP_ATTITUDE]);
    assert.deepEqual(traffic.commands, []);
    assert.equal(fc.SENSOR_DATA.kinematics[0], 0, 'no decoder writes');
});

test('a stream that goes quiet while accepted is requested again, at most once per 10 s', (t) => {
    startSession(t);
    readyForVirtual(t);
    const attitudeCommands = () => wireTraffic().commands.filter(([msgid]) => msgid === MAVLINK_MSG_ID.ATTITUDE);
    // The FC answers each command at once but never sends ATTITUDE.
    const run = (steps) => {
        for (let i = 0; i < steps; i++) {
            t.mock.timers.tick(250);
            streamAll([MAVLINK_MSG_ID.ATTITUDE]);
            if (!feed.streams.isIdle()) {
                ack();
            }
        }
    };
    assert.equal(attitudeCommands().length, 1);
    run(16);
    assert.equal(attitudeCommands().length, 2, 'asked again once ATTITUDE was older than 3 s');
    run(32);
    assert.equal(attitudeCommands().length, 2, 'not again within 10 s');
    run(12);
    assert.equal(attitudeCommands().length, 3);
    assert.equal(wireTraffic().commands.length, BASE_INTERVALS_US.size + 2, 'streaming ids are left alone');
});

test('counters log per 10 s; stop(true) restores every interval one frame at a time, then closes', (t) => {
    startSession(t);
    readyForVirtual(t);
    feed.serve(MSPCodes.MSP_ATTITUDE, false, null, null);
    t.mock.timers.tick(STATS_PERIOD_MS);
    const line = logs.find(entry => entry.startsWith('MAVLink telemetry, last'));
    assert.match(line, /wire 5 \(.*\), virtual 1 \(MSP_ATTITUDE 1\)/);

    const writes = wire.length;
    let closed = 0;
    feed.stop(true, () => closed++);
    assert.equal(wire.length, writes + 1, 'the first frame at once');
    for (let i = 1; i < BASE_INTERVALS_US.size; i++) {
        t.mock.timers.tick(RESTORE_SPACING_MS);
    }
    assert.equal(wire.length, writes + BASE_INTERVALS_US.size, 'one write per frame, 20 ms apart');
    assert.equal(closed, 1, 'closes right after the last frame');
    assert.deepEqual(wireTraffic().commands.slice(-BASE_INTERVALS_US.size), Array.from(BASE_INTERVALS_US.keys(), msgid => [msgid, 0]));
    t.mock.timers.tick(RESTORE_DEADLINE_MS);
    assert.equal(closed, 1, 'once');
    feed = null;
    MSP.virtualReplies = null;
});

// A mock-timer tick does not run timers set during it, so time advances in steps.
function advance(t, ms, stepMs = 10) {
    for (let elapsed = 0; elapsed < ms; elapsed += stepMs) {
        t.mock.timers.tick(stepMs);
    }
}

// Replaces the connection's write with one that reports completion after writeMs; returns the restore.
function slowWire(writeMs) {
    const fastSend = CONFIGURATOR.connection.send;
    CONFIGURATOR.connection.send = (data, callback) => {
        wire.push(new Uint8Array(data));
        setTimeout(() => callback({ bytesSent: data.byteLength }), writeMs);
    };
    return () => {
        CONFIGURATOR.connection.send = fastSend;
        feed = null;
        MSP.virtualReplies = null;
    };
}

test('restore on a slow wire: every frame goes out before done', (t) => {
    startSession(t);
    readyForVirtual(t);
    const writeMs = 150;
    const restoreWire = slowWire(writeMs);
    try {
        const writes = wire.length;
        let closed = 0;
        feed.stop(true, () => closed++);
        advance(t, RESTORE_DEADLINE_MS);
        assert.equal(closed, 0, 'not done while frames are still being written');
        advance(t, BASE_INTERVALS_US.size * (writeMs + RESTORE_SPACING_MS));
        assert.equal(wire.length, writes + BASE_INTERVALS_US.size, 'every restore frame went out');
        assert.equal(closed, 1);
        assert.equal(logs.some(line => line.includes('restore cut short')), false);
    } finally {
        restoreWire();
    }
});

test('restore on a wire too slow for the deadline: done once, no frame after it', (t) => {
    startSession(t);
    readyForVirtual(t);
    const writeMs = 500;
    const restoreWire = slowWire(writeMs);
    try {
        const writes = wire.length;
        let closed = 0;
        feed.stop(true, () => closed++);
        advance(t, RESTORE_DEADLINE_MS + BASE_INTERVALS_US.size * RESTORE_FRAME_ALLOWANCE_MS);
        assert.equal(closed, 1, 'the deadline still bounds the restore');
        const atDone = wire.length;
        assert.ok(atDone - writes < BASE_INTERVALS_US.size, 'the deadline ran before the last frame');
        assert.equal(logs.filter(line => line.includes('restore cut short')).length, 1, 'one console line');
        advance(t, BASE_INTERVALS_US.size * (writeMs + RESTORE_SPACING_MS));
        assert.equal(wire.length, atDone, 'no frame after done()');
        assert.equal(closed, 1);
    } finally {
        restoreWire();
    }
});

test('restore gives up after its deadline when the connection never reports a write', (t) => {
    startSession(t);
    readyForVirtual(t);
    const stuck = new MavlinkTelemetryFeed({ link, send: () => {}, fc, msp: MSP, log: () => {} });
    stuck.streams.setInterval(MAVLINK_MSG_ID.ATTITUDE, 500000);
    let closed = 0;
    stuck.stop(true, () => closed++);
    t.mock.timers.tick(RESTORE_DEADLINE_MS + RESTORE_FRAME_ALLOWANCE_MS - 1);
    assert.equal(closed, 0);
    t.mock.timers.tick(1);
    assert.equal(closed, 1);

    const idle = new MavlinkTelemetryFeed({ link, send: () => {}, fc, msp: MSP, log: () => {} });
    idle.stop(false, () => closed++);
    assert.equal(closed, 2, 'no restore: done at once');
});

test('a failed restore write is logged once with the count left on the FC', (t) => {
    startSession(t);
    const lines = [];
    const failing = new MavlinkTelemetryFeed({ link, send: (data, callback) => callback && callback({ bytesSent: 0, resultCode: 1 }),
        fc, msp: MSP, log: line => lines.push(line) });
    failing.streams.setInterval(MAVLINK_MSG_ID.ATTITUDE, 500000);
    let closed = 0;
    failing.stop(true, () => closed++);
    assert.equal(closed, 1);
    assert.deepEqual(lines.filter(line => line.includes('restore cut short')),
        ['MAVLink telemetry: restore cut short, 1 of 1 restore frames not confirmed, the FC may keep those intervals until it reboots']);
});

// --- bandwidth guard -------------------------------------------------------------------------------

const STEP_MS = 50;
const BASE_PERIODS_MS = new Map(Array.from(BASE_INTERVALS_US, ([msgid, us]) => [msgid, us / 1000]));

function periodsWith(changes) {
    const periods = new Map(BASE_PERIODS_MS);
    changes.forEach((periodMs, msgid) => periods.set(msgid, periodMs));
    return periods;
}

function mspCodesOf(write) {
    const bytes = [];
    for (const frame of new MavlinkParser().ingest(write)) {
        if (frame.msgid === MAVLINK_MSG_ID.TUNNEL) {
            bytes.push(...frame.payload.subarray(5, 5 + frame.payload[4]));
        }
    }
    return bytes.length ? [bytes[4] | (bytes[5] << 8)] : [];
}

/*
 * The FC side of a link for durationMs, in 50 ms steps: each message at its period (0 = silent),
 * every interval command acknowledged (unless `acks` is false), every wire request answered.
 * `poll` is read every step, `alive` sends a status read every 500 ms (tunnel replies arriving).
 * During `fade` ([from, to) ms into the run) nothing reaches the Configurator.
 */
function runLink(t, durationMs, { periods, poll = null, alive = true, acks = true, fade = null, extra = () => [] }) {
    let parsed = wire.length;
    for (let elapsed = 0; elapsed < durationMs; elapsed += STEP_MS) {
        t.mock.timers.tick(STEP_MS);
        const now = Date.now();
        const faded = fade !== null && elapsed >= fade[0] && elapsed < fade[1];
        const frames = faded ? [] : [...periods].filter(([, periodMs]) => periodMs > 0 && now % periodMs === 0).map(([msgid]) => msgid);
        [...frames, ...(faded ? [] : extra(now))].forEach(msgid => link.ingest(fcFrame(msgid)));
        if (acks && !faded && !feed.streams.isIdle()) {
            ack();
        }
        if (poll !== null) {
            MSP.send_message(poll, false, false, null);
        }
        if (alive && now % 500 === 0) {
            MSP.send_message(MSPCodes.MSP_SENSOR_STATUS, false, false, null);
        }
        mspQueue.executor();
        for (; parsed < wire.length; parsed++) {
            if (!faded) {
                mspCodesOf(wire[parsed]).forEach(code => mspReply(code));
            }
        }
    }
}

const commandsSince = before => wireTraffic().commands.slice(before);
const reducedCommands = () => Array.from(REDUCED_INTERVALS_US, ([msgid, us]) => [msgid, us]);
const attitudeAt = periodMs => periodsWith(new Map([[MAVLINK_MSG_ID.ATTITUDE, periodMs]]));
const boostCommands = before => commandsSince(before).filter(([msgid, us]) => msgid === MAVLINK_MSG_ID.ATTITUDE && us === BOOST_INTERVAL_US);
const ATTITUDE_BASE = [MAVLINK_MSG_ID.ATTITUDE, BASE_INTERVALS_US.get(MAVLINK_MSG_ID.ATTITUDE)];

test('a boost runs at whatever the link delivers while polled, and nothing else changes', (t) => {
    startSession(t);
    readyForVirtual(t);
    const before = wireTraffic().commands.length;
    runLink(t, 20000, { periods: attitudeAt(150), poll: MSPCodes.MSP_ATTITUDE });
    assert.deepEqual(commandsSince(before), [[MAVLINK_MSG_ID.ATTITUDE, BOOST_INTERVAL_US]], '6.7 Hz of 10, acknowledged: no further command');
    assert.equal(feed.isBoosted(MAVLINK_MSG_ID.ATTITUDE), true);
});

test('a boost whose acks are all lost is sent again after 10 s, and its unboost still goes out', (t) => {
    startSession(t);
    readyForVirtual(t);
    const before = wireTraffic().commands.length;
    // 7 Hz: below the implicit-ack band, so the boost stays unconfirmed.
    runLink(t, RE_REQUEST_MS + 2000, { periods: attitudeAt(150), poll: MSPCodes.MSP_ATTITUDE, acks: false });
    assert.equal(boostCommands(before).length, 4, 'sent, resent, and asked again after 10 s');
    assert.ok(logs.some(line => line.includes('interval for message 30 not confirmed, requested again')));
    assert.equal(feed.streams.acceptedIntervalUs(MAVLINK_MSG_ID.ATTITUDE), ATTITUDE_BASE[1], 'sanity: still the base interval on record');

    const polled = wireTraffic().commands.length;
    runLink(t, 3000, { periods: attitudeAt(150), acks: false });
    assert.deepEqual(commandsSince(polled).slice(0, 1), [ATTITUDE_BASE], 'the unboost is sent, although base is the accepted interval');

    // Its acks are lost too: accepted equals requested again, but it is still unconfirmed.
    runLink(t, 12000, { periods: attitudeAt(150), acks: false });
    const unboosts = commandsSince(polled).filter(([msgid, us]) => msgid === ATTITUDE_BASE[0] && us === ATTITUDE_BASE[1]);
    assert.equal(unboosts.length, 4, 'sent, resent, and asked again after 10 s');
});

test('a stream never confirmed is asked for again at most 6 times, 10 s apart, with one log line', (t) => {
    startSession(t);
    readyForVirtual(t);
    const before = wireTraffic().commands.length;
    runLink(t, 3000, { periods: attitudeAt(150), poll: MSPCodes.MSP_ATTITUDE, acks: false });
    runLink(t, 120000, { periods: attitudeAt(150), poll: MSPCodes.MSP_ATTITUDE, acks: false, alive: false });
    // Each re-request is one command with its own resend.
    assert.equal(boostCommands(before).length, 2 * (1 + MAX_RE_REQUESTS));
    assert.equal(logs.filter(line => line.includes('message 30 requested again ' + MAX_RE_REQUESTS + ' times')).length, 1);
});

test('an unboost whose acks are lost does not swallow the next boost', (t) => {
    startSession(t);
    readyForVirtual(t);
    runLink(t, 1000, { periods: attitudeAt(100), poll: MSPCodes.MSP_ATTITUDE });
    assert.equal(feed.streams.acceptedIntervalUs(MAVLINK_MSG_ID.ATTITUDE), BOOST_INTERVAL_US, 'sanity: boost acknowledged');
    const before = wireTraffic().commands.length;
    runLink(t, 4000, { periods: attitudeAt(500), acks: false });
    assert.deepEqual(commandsSince(before).slice(0, 1), [ATTITUDE_BASE], 'sanity: unboosted');
    const reboost = wireTraffic().commands.length;
    runLink(t, 1000, { periods: attitudeAt(500), poll: MSPCodes.MSP_ATTITUDE });
    assert.deepEqual(commandsSince(reboost).slice(0, 1), [[MAVLINK_MSG_ID.ATTITUDE, BOOST_INTERVAL_US]], 'the boost goes out, although it is the accepted interval');
});

test('an accepted stream never received is requested again twice, 10 s apart, then left alone', (t) => {
    startSession(t);
    answerCommands(t);
    streamAll([MAVLINK_MSG_ID.GPS_RAW_INT]);
    seedAll(t);
    const before = wireTraffic().commands.length;
    // No GPS: the FC accepts GPS_RAW_INT but never sends it.
    runLink(t, 40000, { periods: periodsWith(new Map([[MAVLINK_MSG_ID.GPS_RAW_INT, 0]])) });
    const gps = commandsSince(before).filter(([msgid]) => msgid === MAVLINK_MSG_ID.GPS_RAW_INT);
    assert.equal(gps.length, NEVER_SEEN_RE_REQUESTS);
    assert.equal(logs.filter(line => line.includes('message 24 never received, interval requested again')).length, NEVER_SEEN_RE_REQUESTS);
});

test('a link outage does not spend the re-request budget, and an FC back after it gets every stream again', (t) => {
    startSession(t);
    readyForVirtual(t);
    runLink(t, 3000, { periods: BASE_PERIODS_MS, fade: [0, 3000], alive: false });
    const silent = wireTraffic().commands.length;
    runLink(t, 67000, { periods: BASE_PERIODS_MS, fade: [0, 67000], alive: false });
    assert.equal(wireTraffic().commands.length, silent, 'no command while the FC has been silent for 3 s');

    // It rebooted meanwhile: every override is gone, only heartbeats come back.
    const back = wireTraffic().commands.length;
    const heartbeatsOnly = { periods: new Map(), alive: false, extra: () => [MAVLINK_MSG_ID.HEARTBEAT] };
    runLink(t, MIN_FRESH_WINDOW_MS, heartbeatsOnly);
    assert.deepEqual(commandsSince(back), [], 'nothing before one fresh window since the FC came back');
    runLink(t, 30000 - MIN_FRESH_WINDOW_MS, heartbeatsOnly);
    const asked = new Set(commandsSince(back).map(([msgid]) => msgid));
    for (const msgid of BASE_INTERVALS_US.keys()) {
        assert.ok(asked.has(msgid), `message ${msgid} requested again after the outage`);
    }
});

test('after a fade the streams that resume are left alone; one that stays quiet is asked for after a fresh window', (t) => {
    startSession(t);
    readyForVirtual(t);
    runLink(t, 8000, { periods: BASE_PERIODS_MS, fade: [0, 8000], alive: false });
    const back = wireTraffic().commands.length;
    const withoutAttitude = periodsWith(new Map([[MAVLINK_MSG_ID.ATTITUDE, 0]]));
    runLink(t, MIN_FRESH_WINDOW_MS, { periods: withoutAttitude, alive: false });
    assert.deepEqual(commandsSince(back), [], 'nothing before one fresh window since the FC came back');
    runLink(t, 10000 - MIN_FRESH_WINDOW_MS, { periods: withoutAttitude, alive: false });
    assert.deepEqual(new Set(commandsSince(back).map(([msgid]) => msgid)), new Set([MAVLINK_MSG_ID.ATTITUDE]));
});

test('a slow serial start: freshness uses the reduced intervals, MSP_RC goes on the wire, analog does without RC_CHANNELS', (t) => {
    startSession(t, { serialBaud: 4800 });
    answerCommands(t);
    assert.equal(feed.streams.isIdle(), true, 'sanity: the reduced set is acknowledged');

    link.ingest(fcFrame(MAVLINK_MSG_ID.VFR_HUD));
    feed.noteWireReply(MSPCodes.MSP_ALTITUDE);
    t.mock.timers.tick(6000);
    assert.equal(feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null), true, 'VFR_HUD at 0.5 Hz: fresh for 3 x 2 s');
    t.mock.timers.tick(1);
    assert.equal(feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null), false);

    link.ingest(fcFrame(MAVLINK_MSG_ID.SYS_STATUS));
    link.ingest(fcFrame(MAVLINK_MSG_ID.BATTERY_STATUS));
    feed.noteWireReply(MSPCodes.MSPV2_INAV_ANALOG);
    feed.noteWireReply(MSPCodes.MSP_RC);
    assert.equal(feed.serve(MSPCodes.MSPV2_INAV_ANALOG, false, null, null), true, 'RC_CHANNELS is off: rssi from the wire refresh');
    assert.equal(feed.serve(MSPCodes.MSP_RC, false, null, null), false);
    assert.ok(logs.some(line => line.includes('MSP_RC goes over the tunnel (message 65 switched off)')));

    // The FC may still stream RC_CHANNELS at the port's own rate; MSP_RC stays on the wire anyway.
    link.ingest(fcFrame(MAVLINK_MSG_ID.RC_CHANNELS));
    const rcBefore = wireTraffic().msp.filter(code => code === MSPCodes.MSP_RC).length;
    assert.notEqual(wireRoundTrip(t, MSPCodes.MSP_RC), undefined);
    assert.equal(wireTraffic().msp.filter(code => code === MSPCodes.MSP_RC).length, rcBefore + 1);
    assert.equal(wireTraffic().commands.some(([msgid]) => msgid === MAVLINK_MSG_ID.RC_CHANNELS), false,
        'no RC_CHANNELS override the FC would keep until reboot');
});

test('a stream slowed down is judged at its new interval before the FC acknowledged it', (t) => {
    startSession(t);
    readyForVirtual(t);
    feed.streams.setInterval(MAVLINK_MSG_ID.VFR_HUD, REDUCED_INTERVALS_US.get(MAVLINK_MSG_ID.VFR_HUD));
    assert.equal(feed.streams.acceptedIntervalUs(MAVLINK_MSG_ID.VFR_HUD), BASE_INTERVALS_US.get(MAVLINK_MSG_ID.VFR_HUD), 'sanity: no ack yet');
    link.ingest(fcFrame(MAVLINK_MSG_ID.VFR_HUD));
    feed.noteWireReply(MSPCodes.MSP_ALTITUDE);
    t.mock.timers.tick(5000);
    assert.equal(feed.serve(MSPCodes.MSP_ALTITUDE, false, null, null), true, '3 x 2 s, not 3 x 0.5 s');
});

test('a slowdown whose acks are lost is not confirmed by the old rate and is requested again every 10 s', (t) => {
    startSession(t);
    readyForVirtual(t);
    const before = wireTraffic().commands.length;
    // 2 Hz -> 1 Hz and 1 Hz -> 0.5 Hz; the FC never applies them and keeps the old rates.
    const slowdowns = [[MAVLINK_MSG_ID.SYS_STATUS, 1000000], [MAVLINK_MSG_ID.BATTERY_STATUS, 2000000]];
    slowdowns.forEach(([msgid, us]) => feed.streams.setInterval(msgid, us));
    runLink(t, 25000, { periods: BASE_PERIODS_MS, acks: false });
    for (const [msgid, us] of slowdowns) {
        assert.equal(feed.streams.acceptedIntervalUs(msgid), BASE_INTERVALS_US.get(msgid), `message ${msgid}: the old rate is no ack`);
        const sent = commandsSince(before).filter(([id, interval]) => id === msgid && interval === us).length;
        assert.ok(sent >= 4, `message ${msgid}: sent, resent, and asked again (${sent})`);
        assert.ok(logs.some(line => line.includes('interval for message ' + msgid + ' not confirmed, requested again')));
    }
});

test('an unboost whose acks are lost while the stream stays fast is requested again every 10 s', (t) => {
    startSession(t);
    readyForVirtual(t);
    const before = wireTraffic().commands.length;
    for (let i = 0; i < 3; i++) {
        feed.serve(MSPCodes.MSP_ATTITUDE, false, null, null);
    }
    ack();
    const unboost = [MAVLINK_MSG_ID.ATTITUDE, BASE_INTERVALS_US.get(MAVLINK_MSG_ID.ATTITUDE)];
    // No more reads: unboost after 2 s, but the FC never gets it and keeps ATTITUDE at 10 Hz; no acks.
    const unboosts = () => commandsSince(before).filter(([msgid, us]) => msgid === unboost[0] && us === unboost[1]).length;
    runLink(t, 25000, { periods: new Map([[MAVLINK_MSG_ID.ATTITUDE, 100]]), alive: false, acks: false });
    assert.equal(feed.streams.acceptedIntervalUs(MAVLINK_MSG_ID.ATTITUDE), BOOST_INTERVAL_US, 'the fast stream is no ack for the unboost');
    assert.equal(unboosts(), 6, 'at about 2 s, 12 s and 22 s, each attempt resent once without an ack');
    assert.ok(logs.some(line => line.includes('interval for message 30 not confirmed, requested again')));
});

test('a serial link at 9600 baud or less starts in the reduced set and never boosts', (t) => {
    for (const [baud, reduced] of [[4800, true], [9600, true], [14400, false], [19200, false], [0, false]]) {
        t.mock.timers.reset();
        startSession(t, { serialBaud: baud });
        let ready = null;
        feed._onStreamsReady = (active, total) => { ready = [active, total]; };
        answerCommands(t);
        const expected = reduced ? reducedCommands() : Array.from(BASE_INTERVALS_US, ([msgid, us]) => [msgid, us]);
        assert.deepEqual(wireTraffic().commands, expected, `baud ${baud}`);
        assert.equal(expected.some(([msgid]) => msgid === MAVLINK_MSG_ID.RC_CHANNELS), !reduced, `baud ${baud}: RC_CHANNELS left alone`);
        assert.deepEqual(ready, reduced ? [5, 5] : [6, 6], `baud ${baud}: streams active`);
        assert.equal(feed.isReduced(), reduced, `baud ${baud}`);
        assert.equal(logs.filter(line => line.includes('slow serial link')).length, reduced ? 1 : 0, `baud ${baud}`);
    }

    // 4800 baud: 20 Hz attitude reads served virtually never raise ATTITUDE above its reduced 1 Hz.
    t.mock.timers.reset();
    startSession(t, { serialBaud: 4800 });
    answerCommands(t);
    streamAll();
    seedAll(t);
    const before = wireTraffic().commands.length;
    runLink(t, 15000, { periods: attitudeAt(1000), poll: MSPCodes.MSP_ATTITUDE });
    assert.ok(feed.counts.virtual.get(MSPCodes.MSP_ATTITUDE) > 3, 'sanity: served virtually');
    assert.equal(commandsSince(before).filter(([msgid]) => msgid === MAVLINK_MSG_ID.ATTITUDE).length, 0, 'no boost');
});
