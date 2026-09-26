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
    UNBOOST_IDLE_MS,
    MIN_FRESH_WINDOW_MS,
    STATS_PERIOD_MS,
    WIRE_REFRESH_MS,
    RESTORE_SPACING_MS,
    RESTORE_DEADLINE_MS,
    isTelemetryFeedEnabled,
    mspCodeOfFrame,
} from '../js/mavlink/mavlinkTelemetryFeed.js';
import { COMMAND_SPACING_MS } from '../js/mavlink/mavlinkStreamControl.js';
import { loadMspCore } from './helpers/mspCore.mjs';

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

function startSession(t, { withFeed = true } = {}) {
    // The previous feed's timers were mock timers and ended with its test.
    feed = null;
    MSP.virtualReplies = null;
    mspQueue.setTunnelMode(false);
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    MSP.callbacks_cleanup();
    MSP.resetDecoder();
    mspQueue.freeHardLock();
    mspQueue.freeSoftLock();
    MSP.lostReplies.clear();
    CONFIGURATOR.cliActive = false;
    wire.length = 0;
    logs.length = 0;

    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 1000000 });
    mspQueue.setTunnelMode(true);
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
    feed = withFeed ? new MavlinkTelemetryFeed({ link, send: (data, callback) => CONFIGURATOR.connection.send(data, callback), fc, msp: MSP, log: line => logs.push(line) }) : null;
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

test('without the feed (A/B flag off) everything goes on the wire and no interval is requested', (t) => {
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
    const keepOthers = () => streamAll([MAVLINK_MSG_ID.ATTITUDE]);
    assert.equal(attitudeCommands().length, 1);
    for (let i = 0; i < 16; i++) {
        t.mock.timers.tick(250);
        keepOthers();
    }
    assert.equal(attitudeCommands().length, 2, 'asked again once ATTITUDE was older than 3 s');
    ack();
    for (let i = 0; i < 32; i++) {
        t.mock.timers.tick(250);
        keepOthers();
    }
    assert.equal(attitudeCommands().length, 2, 'not again within 10 s');
    for (let i = 0; i < 12; i++) {
        t.mock.timers.tick(250);
        keepOthers();
    }
    assert.equal(attitudeCommands().length, 3);
    assert.equal(wireTraffic().commands.length, BASE_INTERVALS_US.size + 2, 'streaming ids are left alone');
});

test('counters log per 10 s; stop(true) restores every interval one frame at a time, then closes', (t) => {
    startSession(t);
    readyForVirtual(t);
    feed.serve(MSPCodes.MSP_ATTITUDE, false, null, null);
    t.mock.timers.tick(STATS_PERIOD_MS);
    const line = logs.find(entry => entry.startsWith('MAVLink telemetry A/B'));
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

test('restore gives up after 300 ms when the connection never reports a write', (t) => {
    startSession(t);
    readyForVirtual(t);
    const stuck = new MavlinkTelemetryFeed({ link, send: () => {}, fc, msp: MSP, log: () => {} });
    stuck.streams.setInterval(MAVLINK_MSG_ID.ATTITUDE, 500000);
    let closed = 0;
    stuck.stop(true, () => closed++);
    t.mock.timers.tick(RESTORE_DEADLINE_MS - 1);
    assert.equal(closed, 0);
    t.mock.timers.tick(1);
    assert.equal(closed, 1);

    const idle = new MavlinkTelemetryFeed({ link, send: () => {}, fc, msp: MSP, log: () => {} });
    idle.stop(false, () => closed++);
    assert.equal(closed, 2, 'no restore: done at once');
});
