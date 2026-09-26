#!/usr/bin/env node
/**
 * MSP-over-MAVLink TUNNEL codec: request chunking, reply filtering and reassembly into the
 * real MSP decoder (js/msp.js, loaded with only its import specifiers rewritten).
 *
 * Hex vectors come from the firmware's own MAVLink C library (lib/main/MAVLink,
 * mavlink_msg_tunnel_pack / mavlink_msg_heartbeat_pack + mavlink_msg_to_send_buffer).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MavlinkParser } from '../js/mavlink/mavlinkParser.js';
import { MavlinkLink } from '../js/mavlink/mavlinkLink.js';
import { MAVLINK_MSG_ID, encodeFrameV2, concatFrames } from '../js/mavlink/mavlinkProtocol.js';
import {
    MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP,
    buildTunnelPayload,
    encodeMspTunnelFrames,
    decodeMspTunnelChunk,
} from '../js/mavlink/mavlinkTunnel.js';
import { loadMspCore, mspV2Reply } from './helpers/mspCore.mjs';

const { MSP } = await loadMspCore(import.meta.url, 'mavlink-tunnel.test.mjs', 'mavlink-tunnel-');

// msp.js touches the status bar on a checksum error; keep that from throwing under Node.
globalThis.$ = () => ({ html() {} });

const hex = (s) => Uint8Array.from(s.match(/../g).map((b) => parseInt(b, 16)));

// 253/25 -> FC 1/1, MSP v2 MSP_API_VERSION request in one chunk, seq 3
const GCS_TUNNEL_API_VERSION = hex('fd0e000003fd19810100018001010924583c0001000000450ac4');
const GCS_HEARTBEAT_V2 = hex('fd09000000fd190000000000000006080004038f8b');
const FC_TUNNEL_ZERO_PADDED = hex('fd1300002b01018101000180fd1914101112131415161718191a1b1c1d39b0');

const FC = { sysid: 1, compid: 1 };

/** TUNNEL frames as the FC sends a reply: 128-byte chunks, zero-padded, from (sysid, 1). */
function fcReplyFrames(mspFrame, { sysid = 1, compid = 1, target = [253, 25], payloadType = MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP } = {}) {
    const frames = [];
    let seq = 100;
    for (let offset = 0; offset < mspFrame.length; offset += 128) {
        const chunk = mspFrame.subarray(offset, offset + 128);
        const payload = buildTunnelPayload(chunk, target[0], target[1]);
        payload[0] = payloadType & 0xFF;
        payload[1] = payloadType >> 8;
        frames.push(encodeFrameV2(MAVLINK_MSG_ID.TUNNEL, payload, sysid, compid, seq++));
    }
    return frames;
}

const decodeOne = (bytes) => new MavlinkParser().ingest(bytes)[0];

test('the request encoder matches the firmware MAVLink library byte for byte', () => {
    const request = GCS_TUNNEL_API_VERSION.subarray(15, 24);
    const [frame] = encodeMspTunnelFrames(request, FC, () => 3);
    assert.deepEqual([...frame], [...GCS_TUNNEL_API_VERSION]);
});

test('the GCS heartbeat matches the firmware MAVLink library byte for byte', () => {
    assert.deepEqual([...new MavlinkLink().heartbeatFrame()], [...GCS_HEARTBEAT_V2]);
});

for (const size of [1, 128, 129, 192]) {
    test(`a ${size}-byte MSP frame is cut into 128-byte TUNNEL chunks`, () => {
        const msp = Uint8Array.from({ length: size }, (_, i) => 0x30 + (i % 50));
        const link = new MavlinkLink();
        link.lockTarget(7, 1);

        const wire = link.wrapMsp(msp);
        const expectedChunks = Math.ceil(size / 128);
        assert.equal(wire.length, expectedChunks);

        const frames = new MavlinkParser().ingest(concatFrames(wire));
        assert.equal(frames.length, expectedChunks, 'every chunk must be a CRC-valid frame');

        const rebuilt = [];
        frames.forEach((frame, index) => {
            const chunkLength = Math.min(128, size - index * 128);
            assert.equal(frame.version, 2);
            assert.equal(frame.msgid, MAVLINK_MSG_ID.TUNNEL);
            assert.equal(frame.sysid, 253);
            assert.equal(frame.compid, 25);
            assert.equal(frame.seq, index, 'running sequence');
            assert.equal(frame.payload[0] | (frame.payload[1] << 8), 0x8001, 'payload_type');
            assert.equal(frame.payload[2], 7, 'target_system = locked FC sysid');
            assert.equal(frame.payload[3], 1, 'target_component = locked FC compid');
            assert.equal(frame.payload[4], chunkLength, 'payload_length');
            assert.equal(wire[index][1], 5 + chunkLength, 'zero padding is trimmed on the wire');
            rebuilt.push(...frame.payload.subarray(5, 5 + chunkLength));
        });
        assert.deepEqual(rebuilt, [...msp]);
    });
}

test('trailing zeros of the MSP data itself are trimmed and restored by payload_length', () => {
    const msp = new Uint8Array(10);
    msp[0] = 0x24;
    const link = new MavlinkLink();
    link.lockTarget(1, 1);

    const [wire] = link.wrapMsp(msp);
    assert.equal(wire[1], 6, 'the tunnel header plus the one non-zero byte stay on the wire');

    const parsed = decodeOne(wire);
    assert.equal(parsed.payload[4], 10, 'payload_length still covers the zeros');
    assert.deepEqual([...parsed.payload.subarray(5, 15)], [...msp]);
});

test('decodes a firmware-style zero-padded reply to exactly payload_length bytes', () => {
    const chunk = decodeMspTunnelChunk(decodeOne(FC_TUNNEL_ZERO_PADDED), FC);

    assert.equal(chunk.length, 20);
    assert.deepEqual([...chunk.subarray(0, 14)], Array.from({ length: 14 }, (_, i) => 0x10 + i));
    assert.deepEqual([...chunk.subarray(14)], [0, 0, 0, 0, 0, 0]);
});

test('the reply filter rejects other sources, other payload types and other addressees', () => {
    const reply = mspV2Reply(1, [0, 2, 6]);
    const accept = (frames) => decodeMspTunnelChunk(decodeOne(frames[0]), FC);

    assert.notEqual(accept(fcReplyFrames(reply)), null, 'positive control');
    assert.notEqual(accept(fcReplyFrames(reply, { target: [0, 0] })), null, 'broadcast 0/0 is accepted');

    assert.equal(accept(fcReplyFrames(reply, { sysid: 2 })), null, 'wrong sysid');
    assert.equal(accept(fcReplyFrames(reply, { compid: 2 })), null, 'wrong compid');
    assert.equal(accept(fcReplyFrames(reply, { payloadType: 0x8002 })), null, 'wrong payload_type');
    assert.equal(accept(fcReplyFrames(reply, { target: [255, 190] })), null, 'addressed to another GCS');
    assert.equal(decodeMspTunnelChunk(decodeOne(fcReplyFrames(reply)[0]), null), null, 'no target locked yet');
});

function captureMspFrames() {
    const received = [];
    MSP.resetDecoder();
    MSP.setProcessData((handler) => {
        received.push({ code: handler.code, payload: new Uint8Array(handler.message_buffer.slice(0)) });
    });
    return received;
}

function tunnelLinkIntoMsp(extra = {}) {
    const link = new MavlinkLink({
        onTunnelChunk: (bytes) => MSP.read({ data: bytes }),
        onReassemblyTimeout: () => MSP.resetDecoder(),
        ...extra,
    });
    link.lockTarget(FC.sysid, FC.compid);
    return link;
}

test('a dense 5-chunk reply (MSP_BOXNAMES-like) is reassembled into MSP.read', () => {
    const received = captureMspFrames();
    const names = new TextEncoder().encode('ARM;ANGLE;HORIZON;NAV ALTHOLD;HEADING HOLD;'.repeat(14)).subarray(0, 600);
    const reply = mspV2Reply(116, names);
    const frames = fcReplyFrames(reply);
    assert.equal(frames.length, 5, 'sanity: 609 framed bytes need five chunks');
    assert.ok(frames.slice(0, 4).every((f) => f.length === 145), 'sanity: dense chunks are not trimmed');

    // Other MAVLink traffic between the chunks, delivered in odd slices.
    const stream = concatFrames([frames[0], GCS_HEARTBEAT_V2, frames[1], frames[2], frames[3], frames[4]]);
    const link = tunnelLinkIntoMsp();
    for (let offset = 0; offset < stream.length; offset += 37) {
        link.ingest(stream.subarray(offset, offset + 37));
    }

    assert.equal(received.length, 1);
    assert.equal(received[0].code, 116);
    assert.deepEqual([...received[0].payload], [...names]);
});

test('a chunk after a gap of more than 1000 ms drops the partial MSP frame first', () => {
    const received = captureMspFrames();
    let now = 0;
    const link = tunnelLinkIntoMsp({ now: () => now });

    const lost = fcReplyFrames(mspV2Reply(116, new Uint8Array(300).fill(0x41)));
    link.ingest(lost[0]);
    link.ingest(lost[1]);
    assert.notEqual(MSP.state, MSP.decoder_states.IDLE, 'sanity: the decoder is mid-frame');

    now += 1001;
    const next = mspV2Reply(1, [0, 2, 6]);
    for (const frame of fcReplyFrames(next)) {
        link.ingest(frame);
    }

    assert.deepEqual(received.map((r) => r.code), [1], 'the next reply must not be eaten as payload of the lost one');
});
