'use strict';

import { MAVLINK_MSG_ID, encodeFrameV2, getMessageInfo } from './mavlinkProtocol.js';

export const MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP = 0x8001;
export const MAVLINK_TUNNEL_CHUNK_SIZE = 128;
export const MAVLINK_TUNNEL_HEADER_LENGTH = 5;
export const GCS_SYSTEM_ID = 253;
export const GCS_COMPONENT_ID = 25;

// Full 133-byte payload; the frame encoder trims the zero padding again.
export function buildTunnelPayload(chunk, targetSystem, targetComponent) {
    const payload = new Uint8Array(getMessageInfo(MAVLINK_MSG_ID.TUNNEL).length);
    payload[0] = MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP & 0xFF;
    payload[1] = MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP >> 8;
    payload[2] = targetSystem;
    payload[3] = targetComponent;
    payload[4] = chunk.length;
    payload.set(chunk, MAVLINK_TUNNEL_HEADER_LENGTH);
    return payload;
}

export function encodeMspTunnelFrames(mspFrame, target, nextSeq) {
    const frames = [];
    for (let offset = 0; offset < mspFrame.length; offset += MAVLINK_TUNNEL_CHUNK_SIZE) {
        const chunk = mspFrame.subarray(offset, offset + MAVLINK_TUNNEL_CHUNK_SIZE);
        const payload = buildTunnelPayload(chunk, target.sysid, target.compid);
        frames.push(encodeFrameV2(MAVLINK_MSG_ID.TUNNEL, payload, GCS_SYSTEM_ID, GCS_COMPONENT_ID, nextSeq()));
    }
    return frames;
}

function isAddressedToGcs(targetSystem, targetComponent) {
    return (targetSystem === GCS_SYSTEM_ID && targetComponent === GCS_COMPONENT_ID) ||
        (targetSystem === 0 && targetComponent === 0);
}

// Returns the MSP byte slice, or null when the frame is not a reply from the locked FC to us.
export function decodeMspTunnelChunk(frame, target) {
    if (!target || frame.msgid !== MAVLINK_MSG_ID.TUNNEL || frame.version !== 2) {
        return null;
    }
    if (frame.sysid !== target.sysid || frame.compid !== target.compid) {
        return null;
    }

    const payload = frame.payload;
    const payloadType = payload[0] | (payload[1] << 8);
    const chunkLength = payload[4];
    if (payloadType !== MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP || !isAddressedToGcs(payload[2], payload[3]) ||
        chunkLength > MAVLINK_TUNNEL_CHUNK_SIZE) {
        return null;
    }

    return payload.slice(MAVLINK_TUNNEL_HEADER_LENGTH, MAVLINK_TUNNEL_HEADER_LENGTH + chunkLength);
}
