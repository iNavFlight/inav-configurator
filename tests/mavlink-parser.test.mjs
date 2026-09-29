#!/usr/bin/env node
/**
 * MAVLink byte-stream parser and the link controller's heartbeat filter.
 *
 * The hex vectors were produced by the MAVLink C library the INAV firmware compiles
 * (lib/main/MAVLink, storm32 dialect: mavlink_msg_*_pack + mavlink_msg_to_send_buffer),
 * so they pin CRC_EXTRA, field offsets and trailing-zero trimming to what the FC sends.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MavlinkParser } from '../js/mavlink/mavlinkParser.js';
import { MavlinkLink } from '../js/mavlink/mavlinkLink.js';
import { MAVLINK_MSG_ID, crcCalculate, getMessageInfo } from '../js/mavlink/mavlinkProtocol.js';

const hex = (s) => Uint8Array.from(s.match(/../g).map((b) => parseInt(b, 16)));
const concat = (...parts) => {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const part of parts) {
        out.set(part, offset);
        offset += part.length;
    }
    return out;
};

// FC (1/1) HEARTBEAT, MAV_TYPE_FIXED_WING, AUTOPILOT_GENERIC, base_mode 0x81, STANDBY, seq 7
const FC_HEARTBEAT_V2 = hex('fd09000007010100000000000000010081030368c9');
// Configurator identity 253/25, MAV_TYPE_GCS, AUTOPILOT_INVALID, ACTIVE, seq 0
const GCS_HEARTBEAT_V2 = hex('fd09000000fd190000000000000006080004038f8b');
// FC (1/1) HEARTBEAT in MAVLink 1 framing, MAV_TYPE_QUADROTOR, seq 9
const FC_HEARTBEAT_V1 = hex('fe09090101000000000002000003039014');
// FC TUNNEL to 253/25, payload_length 20 of which the last 6 are zero -> trimmed to 19 payload bytes on the wire
const FC_TUNNEL_ZERO_PADDED = hex('fd1300002b01018101000180fd1914101112131415161718191a1b1c1d39b0');
// FC TUNNEL to 253/25, 128 dense bytes -> full 145-byte frame
const FC_TUNNEL_DENSE = hex(
    'fd8500002a01018101000180fd1980' +
    '4142434445464748494a4b4c4d4e4f505152535455565758595a'.repeat(4) +
    '4142434445464748494a4b4c4d4e4f5051525354555657589857'
);

test('golden vectors have the lengths the firmware produced', () => {
    assert.equal(FC_HEARTBEAT_V2.length, 21);
    assert.equal(FC_TUNNEL_DENSE.length, 145);
    assert.equal(FC_TUNNEL_ZERO_PADDED.length, 31);
});

test('decodes a MAVLink 2 HEARTBEAT', () => {
    const frames = new MavlinkParser().ingest(FC_HEARTBEAT_V2);

    assert.equal(frames.length, 1);
    const [frame] = frames;
    assert.equal(frame.version, 2);
    assert.equal(frame.sysid, 1);
    assert.equal(frame.compid, 1);
    assert.equal(frame.msgid, MAVLINK_MSG_ID.HEARTBEAT);
    assert.equal(frame.seq, 7);
    assert.equal(frame.signed, false);
    assert.equal(frame.payload.length, 9);
    assert.equal(frame.payload[4], 1, 'type = MAV_TYPE_FIXED_WING');
    assert.equal(frame.payload[5], 0, 'autopilot = MAV_AUTOPILOT_GENERIC');
    assert.equal(frame.payload[6], 0x81, 'base_mode');
    assert.equal(frame.payload[7], 3, 'system_status = MAV_STATE_STANDBY');
});

test('a trimmed TUNNEL payload is zero-extended to the full 133 bytes', () => {
    const [frame] = new MavlinkParser().ingest(FC_TUNNEL_ZERO_PADDED);

    assert.equal(frame.msgid, MAVLINK_MSG_ID.TUNNEL);
    assert.equal(FC_TUNNEL_ZERO_PADDED[1], 19, 'sanity: the wire payload really is trimmed');
    assert.equal(frame.payload.length, 133);
    assert.equal(frame.payload[4], 20, 'payload_length');
    assert.deepEqual([...frame.payload.subarray(5, 19)], Array.from({ length: 14 }, (_, i) => 0x10 + i));
    assert.ok(frame.payload.subarray(19).every((b) => b === 0), 'trimmed bytes come back as zeros');
});

test('a stray 0xFD in front of a full TUNNEL reply does not swallow the reply', () => {
    const parser = new MavlinkParser();
    const frames = parser.ingest(concat([0xFD], FC_TUNNEL_DENSE));

    assert.equal(frames.length, 1, 'the reply chunk must be decoded in the same ingest');
    assert.equal(frames[0].msgid, MAVLINK_MSG_ID.TUNNEL);
    assert.equal(frames[0].seq, 42);
    assert.equal(frames[0].payload[4], 128);
});

test('a CRC failure resyncs by one byte, so a frame inside the bad candidate survives', () => {
    // The truncated TUNNEL header claims 133 payload bytes; the heartbeat and the next reply sit
    // inside that span. Consuming the candidate before the CRC check would lose both.
    const truncated = FC_TUNNEL_DENSE.slice(0, 20);
    const parser = new MavlinkParser();

    const first = parser.ingest(concat(truncated, FC_HEARTBEAT_V2));
    assert.equal(first.length, 0, 'the candidate is still incomplete, nothing is consumed yet');

    const frames = parser.ingest(FC_TUNNEL_DENSE);
    assert.deepEqual(frames.map((f) => f.msgid), [MAVLINK_MSG_ID.HEARTBEAT, MAVLINK_MSG_ID.TUNNEL]);
    assert.ok(parser.crcErrors >= 1, 'the truncated candidate failed its CRC');
});

test('a corrupted frame is dropped and the following one decoded', () => {
    const corrupted = FC_HEARTBEAT_V2.slice();
    corrupted[12] ^= 0xFF;
    const frames = new MavlinkParser().ingest(concat(corrupted, FC_HEARTBEAT_V2));

    assert.equal(frames.length, 1);
    assert.equal(frames[0].payload[6], 0x81);
});

test('a signed frame is 13 bytes longer and its signature is not part of the CRC', () => {
    const signed = new Uint8Array(FC_HEARTBEAT_V2.length + 13);
    signed.set(FC_HEARTBEAT_V2);
    signed[2] = 0x01; // MAVLINK_IFLAG_SIGNED
    const crcOffset = 10 + 9;
    const crc = crcCalculate(signed, 1, crcOffset, getMessageInfo(MAVLINK_MSG_ID.HEARTBEAT).crcExtra);
    signed[crcOffset] = crc & 0xFF;
    signed[crcOffset + 1] = crc >> 8;
    signed.fill(0xAA, crcOffset + 2);

    const frames = new MavlinkParser().ingest(concat(signed, FC_HEARTBEAT_V2));

    assert.equal(frames.length, 2, 'the frame after the signature must start where the signature ends');
    assert.equal(frames[0].signed, true);
    assert.equal(frames[1].signed, false);
});

test('decodes a MAVLink 1 frame', () => {
    const [frame] = new MavlinkParser().ingest(FC_HEARTBEAT_V1);

    assert.equal(frame.version, 1);
    assert.equal(frame.sysid, 1);
    assert.equal(frame.compid, 1);
    assert.equal(frame.seq, 9);
    assert.equal(frame.payload[4], 2, 'type = MAV_TYPE_QUADROTOR');
});

test('an id without a CRC_EXTRA entry advances one byte instead of skipping its length', () => {
    // msgid 999 claiming 33 payload bytes that happen to contain a real heartbeat
    const unknown = concat(hex('fd210000000101e70300'), FC_HEARTBEAT_V2, new Uint8Array(12 + 2));
    const frames = new MavlinkParser().ingest(unknown);

    assert.equal(frames.length, 1);
    assert.equal(frames[0].msgid, MAVLINK_MSG_ID.HEARTBEAT);
});

test('a frame split across three ingest() calls is decoded once complete', () => {
    const parser = new MavlinkParser();

    assert.equal(parser.ingest(FC_TUNNEL_DENSE.slice(0, 3)).length, 0);
    assert.equal(parser.ingest(FC_TUNNEL_DENSE.slice(3, 70)).length, 0);
    const frames = parser.ingest(FC_TUNNEL_DENSE.slice(70));

    assert.equal(frames.length, 1);
    assert.equal(frames[0].payload[4], 128);
});

test('the link reports FC heartbeats only: not our own 253/25, not a GCS, not compid != 1', () => {
    const seen = [];
    const link = new MavlinkLink({ onHeartbeat: (frame) => seen.push(frame) });

    link.ingest(GCS_HEARTBEAT_V2);
    assert.equal(seen.length, 0, 'our own echoed heartbeat must be ignored');

    const otherGcs = GCS_HEARTBEAT_V2.slice();
    otherGcs[5] = 255;
    otherGcs[6] = 1;
    const crc = crcCalculate(otherGcs, 1, 19, getMessageInfo(MAVLINK_MSG_ID.HEARTBEAT).crcExtra);
    otherGcs[19] = crc & 0xFF;
    otherGcs[20] = crc >> 8;
    link.ingest(otherGcs);
    assert.equal(seen.length, 0, 'a heartbeat of type GCS must be ignored');

    const camera = FC_HEARTBEAT_V2.slice();
    camera[6] = 100;
    const crc2 = crcCalculate(camera, 1, 19, getMessageInfo(MAVLINK_MSG_ID.HEARTBEAT).crcExtra);
    camera[19] = crc2 & 0xFF;
    camera[20] = crc2 >> 8;
    link.ingest(camera);
    assert.equal(seen.length, 0, 'a component other than the autopilot must be ignored');

    link.ingest(FC_HEARTBEAT_V2);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].sysid, 1);
    assert.equal(seen[0].version, 2);
});
