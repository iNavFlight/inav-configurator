#!/usr/bin/env node
/**
 * COMMAND_LONG / SET_MESSAGE_INTERVAL: frames byte-identical to the firmware's MAVLink library
 * (mavlink_msg_command_long_pack, GCS 253/25 -> FC 1/1), and the one-in-flight ack bookkeeping.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MavlinkLink } from '../js/mavlink/mavlinkLink.js';
import { MavlinkParser } from '../js/mavlink/mavlinkParser.js';
import {
    MAVLINK_MSG_ID,
    MAV_CMD_SET_MESSAGE_INTERVAL,
    encodeFrameV2,
    encodeCommandLongPayload,
    decodeCommandAck,
} from '../js/mavlink/mavlinkProtocol.js';
import { MavlinkStreamControl, COMMAND_SPACING_MS, COMMAND_ACK_TIMEOUT_MS, IMPLICIT_ACK_WINDOW_MS } from '../js/mavlink/mavlinkStreamControl.js';

const GOLDEN = {
    cmd_attitude_10hz_seq5: 'fd20000005fd194c00000000f0410050c3470000000000000000000000000000000000000000ff0101017227',
    cmd_rc_off_seq6: 'fd20000006fd194c000000008242000080bf0000000000000000000000000000000000000000ff0101013e1c',
    cmd_battery_default_seq7: 'fd20000007fd194c000000001343000000000000000000000000000000000000000000000000ff010101460a',
    ack_accepted: 'fd0a00000901014d0000ff01000000000000fd1991a7',
    ack_unsupported: 'fd0a00000a01014d0000ff01030000000000fd198741',
};

const hex = bytes => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const unhex = text => Uint8Array.from(text.match(/../g).map(pair => parseInt(pair, 16)));

test('SET_MESSAGE_INTERVAL frames match the firmware library byte for byte', () => {
    const link = new MavlinkLink();
    link.lockTarget(1, 1);
    for (let i = 0; i < 5; i++) {
        link.heartbeatFrame();
    }
    assert.equal(hex(link.commandLongFrame(MAV_CMD_SET_MESSAGE_INTERVAL, [MAVLINK_MSG_ID.ATTITUDE, 100000])), GOLDEN.cmd_attitude_10hz_seq5);
    assert.equal(hex(link.commandLongFrame(MAV_CMD_SET_MESSAGE_INTERVAL, [MAVLINK_MSG_ID.RC_CHANNELS, -1])), GOLDEN.cmd_rc_off_seq6);
    assert.equal(hex(link.commandLongFrame(MAV_CMD_SET_MESSAGE_INTERVAL, [MAVLINK_MSG_ID.BATTERY_STATUS, 0])), GOLDEN.cmd_battery_default_seq7);

    const payload = encodeCommandLongPayload(MAV_CMD_SET_MESSAGE_INTERVAL, { sysid: 1, compid: 1 }, [MAVLINK_MSG_ID.ATTITUDE, 100000]);
    assert.equal(hex(encodeFrameV2(MAVLINK_MSG_ID.COMMAND_LONG, payload, 253, 25, 5)), GOLDEN.cmd_attitude_10hz_seq5);
});

test('command frames need a locked target', () => {
    assert.throws(() => new MavlinkLink().commandLongFrame(MAV_CMD_SET_MESSAGE_INTERVAL, [30, 0]), /not locked/);
});

test('COMMAND_ACK from the firmware library decodes', () => {
    const [accepted] = new MavlinkParser().ingest(unhex(GOLDEN.ack_accepted));
    assert.deepEqual(decodeCommandAck(accepted.payload), { command: 511, result: 0, targetSystem: 253, targetComponent: 25 });
    const [unsupported] = new MavlinkParser().ingest(unhex(GOLDEN.ack_unsupported));
    assert.equal(decodeCommandAck(unsupported.payload).result, 3);
});

function makeControl() {
    const sent = [];
    const logs = [];
    const control = new MavlinkStreamControl({
        sendCommand: (msgid, intervalUs) => sent.push([msgid, intervalUs]),
        log: line => logs.push(line),
    });
    return { control, sent, logs };
}

const ACK = { command: MAV_CMD_SET_MESSAGE_INTERVAL, result: 0 };
const NACK = { command: MAV_CMD_SET_MESSAGE_INTERVAL, result: 3 };

test('base set: one command in flight, next one >= 50 ms after the ack, result reported once', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { control, sent } = makeControl();
    let done = null;
    control.requestBase(new Map([[1, 500000], [30, 500000], [65, 1000000]]), (accepted, total) => { done = [accepted, total]; });

    assert.deepEqual(sent, [[1, 500000]]);
    assert.equal(control.handleAck(ACK), true);
    t.mock.timers.tick(COMMAND_SPACING_MS - 1);
    assert.equal(sent.length, 1);
    t.mock.timers.tick(1);
    assert.deepEqual(sent[1], [30, 500000]);
    control.handleAck(NACK);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.deepEqual(sent[2], [65, 1000000]);
    control.handleAck(ACK);

    assert.deepEqual(done, [2, 3]);
    assert.equal(control.acceptedIntervalUs(1), 500000);
    assert.equal(control.acceptedIntervalUs(30), undefined);
    assert.equal(control.acceptedIntervalUs(65), 1000000);
    assert.equal(control.handleAck(ACK), false, 'an unsolicited ack is ignored');
});

test('no ack: resent once, then given up and reported as not accepted', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { control, sent, logs } = makeControl();
    let done = null;
    control.requestBase(new Map([[30, 500000]]), (accepted, total) => { done = [accepted, total]; });
    t.mock.timers.tick(COMMAND_ACK_TIMEOUT_MS);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.equal(sent.length, 2);
    t.mock.timers.tick(COMMAND_ACK_TIMEOUT_MS);
    assert.equal(done, null, 'the result waits one implicit-ack window');
    t.mock.timers.tick(IMPLICIT_ACK_WINDOW_MS);
    assert.deepEqual(done, [0, 1]);
    assert.equal(control.acceptedIntervalUs(30), undefined);
    assert.match(logs.at(-1), /no ack/);
    t.mock.timers.tick(10 * COMMAND_ACK_TIMEOUT_MS);
    assert.equal(sent.length, 2);
});

test('an unchanged interval is not sent again; queued changes for one id collapse', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { control, sent } = makeControl();
    control.setInterval(30, 500000);
    control.handleAck(ACK);
    control.setInterval(30, 500000);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.equal(sent.length, 1);

    control.setInterval(65, 1000000);          // in flight
    control.setInterval(30, 100000);           // queued behind it
    control.setInterval(30, 500000);           // back to the accepted value: dropped from the queue
    control.handleAck(ACK);
    t.mock.timers.tick(COMMAND_SPACING_MS * 4);
    assert.deepEqual(sent, [[30, 500000], [65, 1000000]]);
    assert.equal(control.isIdle(), true);
});

test('stop() ends everything and names the ids to restore', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { control, sent } = makeControl();
    control.requestBase(new Map([[1, 500000], [30, 500000]]), () => {});
    control.handleAck(ACK);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.deepEqual(control.stop(), [1, 30]);
    t.mock.timers.tick(COMMAND_ACK_TIMEOUT_MS * 4);
    control.setInterval(65, 100000);
    assert.equal(sent.length, 2);
});

test('a message arriving at the requested rate for 2 s counts as acknowledged when the ack is lost', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
    const { control, logs } = makeControl();
    let done = null;
    control.requestBase(new Map([[30, 500000]]), (accepted, total) => { done = [accepted, total]; });
    for (let i = 0; i < 3; i++) {
        t.mock.timers.tick(500);
        control.noteMessage(30);
    }
    assert.equal(control.acceptedIntervalUs(30), undefined, 'not yet 2 s of observation');
    t.mock.timers.tick(500);
    control.noteMessage(30);
    assert.equal(control.acceptedIntervalUs(30), 500000);
    assert.deepEqual(done, [1, 1]);
    assert.match(logs.at(-1), /implicitly acknowledged/);
});

test('a slower stream is not taken as acknowledged; 10 Hz at the FC\'s real ~9.5 Hz is', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
    const { control } = makeControl();
    control.setInterval(30, 500000);
    control.handleAck(ACK);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    control.setInterval(65, 100000);
    for (let i = 0; i < 25; i++) {
        t.mock.timers.tick(1000);
        control.noteMessage(65);
    }
    assert.equal(control.acceptedIntervalUs(65), undefined, '1 Hz is not 10 Hz');

    control.setInterval(30, 100000);
    for (let i = 0; i < 25; i++) {
        t.mock.timers.tick(105);
        control.noteMessage(30);
    }
    assert.equal(control.acceptedIntervalUs(30), 100000);
});

test('ack timeout scales with the tunnel round trip, 500 ms minimum', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
    const sent = [];
    let roundTrip = 400;
    const control = new MavlinkStreamControl({ sendCommand: (msgid, us) => sent.push([msgid, us]), roundTripMs: () => roundTrip });
    control.setInterval(30, 500000);
    t.mock.timers.tick(1199);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.equal(sent.length, 1, 'still waiting at 3 x 400 ms - 1');
    t.mock.timers.tick(1);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.equal(sent.length, 2, 'resent after 1200 ms');
    control.handleAck(ACK);
    roundTrip = 10;
    control.setInterval(65, 1000000);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    t.mock.timers.tick(COMMAND_ACK_TIMEOUT_MS);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.equal(sent.length, 4, 'fast link: 500 ms floor');
});

test('a timed-out command is dropped, not duplicated, when a newer one for its id is queued', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
    const { control, sent } = makeControl();
    let done = null;
    control.requestBase(new Map([[30, 500000]]), (accepted, total) => { done = [accepted, total]; });
    control.setInterval(30, 100000);            // queued behind the one in flight
    t.mock.timers.tick(COMMAND_ACK_TIMEOUT_MS);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.deepEqual(sent, [[30, 500000], [30, 100000]]);
    control.handleAck(ACK);
    t.mock.timers.tick(COMMAND_SPACING_MS * 20);
    assert.equal(sent.length, 2);
    assert.equal(control.acceptedIntervalUs(30), 100000);
    assert.deepEqual(done, [1, 1], 'the base entry is resolved by the command that replaced it');
});

test('reRequest sends the current interval again, but not while one is pending', (t) => {
    t.mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 1000 });
    const { control, sent } = makeControl();
    control.setInterval(30, 500000);
    assert.equal(control.reRequest(30), false, 'in flight');
    control.handleAck(ACK);
    t.mock.timers.tick(COMMAND_SPACING_MS);
    assert.equal(control.reRequest(30), true);
    assert.deepEqual(sent, [[30, 500000], [30, 500000]]);
    assert.equal(control.reRequest(65), false, 'never requested');
});
