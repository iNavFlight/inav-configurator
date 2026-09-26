'use strict';

export const MAVLINK_V1_MAGIC = 0xFE;
export const MAVLINK_V2_MAGIC = 0xFD;
export const MAVLINK_V1_HEADER_LENGTH = 6;
export const MAVLINK_V2_HEADER_LENGTH = 10;
export const MAVLINK_CHECKSUM_LENGTH = 2;
export const MAVLINK_SIGNATURE_LENGTH = 13;
export const MAVLINK_IFLAG_SIGNED = 0x01;

export const MAVLINK_MSG_ID = Object.freeze({
    HEARTBEAT: 0,
    SYS_STATUS: 1,
    SYSTEM_TIME: 2,
    GPS_RAW_INT: 24,
    SCALED_PRESSURE: 29,
    ATTITUDE: 30,
    GLOBAL_POSITION_INT: 33,
    RC_CHANNELS: 65,
    VFR_HUD: 74,
    COMMAND_ACK: 77,
    BATTERY_STATUS: 147,
    AUTOPILOT_VERSION: 148,
    EXTENDED_SYS_STATE: 245,
    STATUSTEXT: 253,
    TUNNEL: 385,
});

// crcExtra, full payload length (with extensions) and base length (MAVLink 1 wire length), as generated for INAV.
const MESSAGE_INFO = new Map([
    [MAVLINK_MSG_ID.HEARTBEAT, { crcExtra: 50, length: 9, minLength: 9 }],
    [MAVLINK_MSG_ID.SYS_STATUS, { crcExtra: 124, length: 43, minLength: 31 }],
    [MAVLINK_MSG_ID.SYSTEM_TIME, { crcExtra: 137, length: 12, minLength: 12 }],
    [MAVLINK_MSG_ID.GPS_RAW_INT, { crcExtra: 24, length: 52, minLength: 30 }],
    [MAVLINK_MSG_ID.SCALED_PRESSURE, { crcExtra: 115, length: 16, minLength: 14 }],
    [MAVLINK_MSG_ID.ATTITUDE, { crcExtra: 39, length: 28, minLength: 28 }],
    [MAVLINK_MSG_ID.GLOBAL_POSITION_INT, { crcExtra: 104, length: 28, minLength: 28 }],
    [MAVLINK_MSG_ID.RC_CHANNELS, { crcExtra: 118, length: 42, minLength: 42 }],
    [MAVLINK_MSG_ID.VFR_HUD, { crcExtra: 20, length: 20, minLength: 20 }],
    [MAVLINK_MSG_ID.COMMAND_ACK, { crcExtra: 143, length: 10, minLength: 3 }],
    [MAVLINK_MSG_ID.BATTERY_STATUS, { crcExtra: 154, length: 54, minLength: 36 }],
    [MAVLINK_MSG_ID.AUTOPILOT_VERSION, { crcExtra: 178, length: 78, minLength: 60 }],
    [MAVLINK_MSG_ID.EXTENDED_SYS_STATE, { crcExtra: 130, length: 2, minLength: 2 }],
    [MAVLINK_MSG_ID.STATUSTEXT, { crcExtra: 83, length: 54, minLength: 51 }],
    [MAVLINK_MSG_ID.TUNNEL, { crcExtra: 147, length: 133, minLength: 133 }],
]);

export const MAV_TYPE_GCS = 6;
export const MAV_AUTOPILOT_INVALID = 8;
export const MAV_STATE_ACTIVE = 4;
export const MAVLINK_PROTOCOL_VERSION = 3;

export function getMessageInfo(msgid) {
    return MESSAGE_INFO.get(msgid);
}

// CRC-16/MCRF4XX (X.25 accumulate), seeded 0xFFFF.
export function crcAccumulate(byte, crc) {
    let tmp = (byte ^ (crc & 0xFF)) & 0xFF;
    tmp = (tmp ^ (tmp << 4)) & 0xFF;
    return ((crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4)) & 0xFFFF;
}

export function crcCalculate(bytes, start, end, crcExtra) {
    let crc = 0xFFFF;
    for (let i = start; i < end; i++) {
        crc = crcAccumulate(bytes[i], crc);
    }
    return crcAccumulate(crcExtra, crc);
}

// MAVLink 2 drops trailing zero bytes on the wire but always keeps one.
export function trimmedPayloadLength(payload) {
    let length = payload.length;
    while (length > 1 && payload[length - 1] === 0) {
        length--;
    }
    return length;
}

export function encodeFrameV2(msgid, payload, sysid, compid, seq) {
    const info = getMessageInfo(msgid);
    if (!info) {
        throw new Error('MAVLink message ' + msgid + ' has no CRC_EXTRA entry');
    }

    const length = trimmedPayloadLength(payload);
    const frame = new Uint8Array(MAVLINK_V2_HEADER_LENGTH + length + MAVLINK_CHECKSUM_LENGTH);
    frame[0] = MAVLINK_V2_MAGIC;
    frame[1] = length;
    frame[2] = 0;
    frame[3] = 0;
    frame[4] = seq & 0xFF;
    frame[5] = sysid;
    frame[6] = compid;
    frame[7] = msgid & 0xFF;
    frame[8] = (msgid >> 8) & 0xFF;
    frame[9] = (msgid >> 16) & 0xFF;
    frame.set(payload.subarray(0, length), MAVLINK_V2_HEADER_LENGTH);

    const crcOffset = MAVLINK_V2_HEADER_LENGTH + length;
    const crc = crcCalculate(frame, 1, crcOffset, info.crcExtra);
    frame[crcOffset] = crc & 0xFF;
    frame[crcOffset + 1] = crc >> 8;
    return frame;
}

export function encodeGcsHeartbeatPayload() {
    const payload = new Uint8Array(getMessageInfo(MAVLINK_MSG_ID.HEARTBEAT).length);
    payload[4] = MAV_TYPE_GCS;
    payload[5] = MAV_AUTOPILOT_INVALID;
    payload[6] = 0;
    payload[7] = MAV_STATE_ACTIVE;
    payload[8] = MAVLINK_PROTOCOL_VERSION;
    return payload;
}

export function heartbeatType(payload) {
    return payload[4];
}

export function concatFrames(frames) {
    const total = frames.reduce((sum, frame) => sum + frame.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const frame of frames) {
        out.set(frame, offset);
        offset += frame.length;
    }
    return out;
}
