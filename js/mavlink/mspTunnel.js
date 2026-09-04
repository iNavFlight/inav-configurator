'use strict';

const MAVLINK_V1_MAGIC = 0xFE;
const MAVLINK_V2_MAGIC = 0xFD;
const MAVLINK_V2_INCOMPAT_FLAG_SIGNED = 0x01;
const MAVLINK_V2_HEADER_LENGTH = 10;
const MAVLINK_V1_HEADER_LENGTH = 6;
const MAVLINK_CHECKSUM_LENGTH = 2;
const MAVLINK_SIGNATURE_LENGTH = 13;
const MAVLINK_MSG_ID_HEARTBEAT = 0;
const MAVLINK_MSG_ID_TUNNEL = 385;
const MAVLINK_MSG_HEARTBEAT_CRC_EXTRA = 50;
const MAVLINK_MSG_TUNNEL_CRC_EXTRA = 147;
const MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP = 0x8001;
const MAVLINK_AUTOPILOT_INVALID = 8;
const MAVLINK_CONFIGURATOR_SYSTEM_ID = 253;
const MAVLINK_CONFIGURATOR_COMPONENT_ID = 25;
const MAVLINK_TUNNEL_CHUNK_SIZE = 128;

class MavlinkMspTunnel {
    constructor() {
        this.reset();
    }

    reset() {
        this._buffer = new Uint8Array(0);
        this._sequence = 0;
        this._requestedSystemId = 0;
        this._targetSystemId = 0;
    }

    configure(requestedSystemId) {
        this.reset();
        this._requestedSystemId = requestedSystemId;
    }

    isTargetReady() {
        return this._targetSystemId !== 0;
    }

    getTargetSystemId() {
        return this._targetSystemId;
    }

    wrapMspFrame(frameBuffer) {
        if (!this._targetSystemId) {
            throw new Error('MAVLink tunnel target is not ready');
        }

        const frameBytes = new Uint8Array(frameBuffer);
        const packets = [];

        for (let offset = 0; offset < frameBytes.length; offset += MAVLINK_TUNNEL_CHUNK_SIZE) {
            const chunk = frameBytes.slice(offset, offset + MAVLINK_TUNNEL_CHUNK_SIZE);
            packets.push(this._encodeTunnelFrame(chunk));
        }

        return this._concatArrays(packets).buffer;
    }

    ingest(rawBuffer) {
        this._append(rawBuffer);

        const mspFrames = [];
        let targetDiscovered = false;

        while (this._buffer.length > 0) {
            const frameStart = this._findFrameStart();
            if (frameStart < 0) {
                this._buffer = new Uint8Array(0);
                break;
            }

            if (frameStart > 0) {
                this._buffer = this._buffer.slice(frameStart);
            }

            if (this._buffer.length < 2) {
                break;
            }

            const magic = this._buffer[0];
            const payloadLength = this._buffer[1];
            let frameLength;
            let msgId;
            let systemId;
            let componentId;
            let payloadOffset;
            let checksumOffset;
            let crcExtra = null;

            if (magic === MAVLINK_V2_MAGIC) {
                if (this._buffer.length < MAVLINK_V2_HEADER_LENGTH) {
                    break;
                }

                const signed = (this._buffer[2] & MAVLINK_V2_INCOMPAT_FLAG_SIGNED) !== 0;
                frameLength = MAVLINK_V2_HEADER_LENGTH + payloadLength + MAVLINK_CHECKSUM_LENGTH + (signed ? MAVLINK_SIGNATURE_LENGTH : 0);
                if (this._buffer.length < frameLength) {
                    break;
                }

                msgId = this._buffer[7] | (this._buffer[8] << 8) | (this._buffer[9] << 16);
                systemId = this._buffer[5];
                componentId = this._buffer[6];
                payloadOffset = MAVLINK_V2_HEADER_LENGTH;
                checksumOffset = MAVLINK_V2_HEADER_LENGTH + payloadLength;
            } else {
                if (this._buffer.length < MAVLINK_V1_HEADER_LENGTH) {
                    break;
                }

                frameLength = MAVLINK_V1_HEADER_LENGTH + payloadLength + MAVLINK_CHECKSUM_LENGTH;
                if (this._buffer.length < frameLength) {
                    break;
                }

                msgId = this._buffer[5];
                systemId = this._buffer[3];
                componentId = this._buffer[4];
                payloadOffset = MAVLINK_V1_HEADER_LENGTH;
                checksumOffset = MAVLINK_V1_HEADER_LENGTH + payloadLength;
            }

            if (msgId === MAVLINK_MSG_ID_HEARTBEAT) {
                crcExtra = MAVLINK_MSG_HEARTBEAT_CRC_EXTRA;
            } else if (msgId === MAVLINK_MSG_ID_TUNNEL) {
                crcExtra = MAVLINK_MSG_TUNNEL_CRC_EXTRA;
            }

            const frame = this._buffer.slice(0, frameLength);
            this._buffer = this._buffer.slice(frameLength);

            if (crcExtra === null) {
                continue;
            }

            if (!this._crcMatches(frame, magic, payloadLength, checksumOffset, crcExtra)) {
                continue;
            }

            if (msgId === MAVLINK_MSG_ID_HEARTBEAT) {
                if (this._acceptHeartbeat(systemId, frame.slice(payloadOffset, payloadOffset + payloadLength))) {
                    targetDiscovered = true;
                }
                continue;
            }

            if (msgId === MAVLINK_MSG_ID_TUNNEL) {
                const payload = frame.slice(payloadOffset, payloadOffset + payloadLength);
                if (this._isConfiguratorTunnel(payload, systemId, componentId)) {
                    const tunnelLength = payload[4];
                    const expectedPayloadLength = 5 + tunnelLength;
                    const paddedPayload = new Uint8Array(expectedPayloadLength);
                    paddedPayload.set(payload.slice(0, Math.min(payload.length, expectedPayloadLength)));
                    mspFrames.push(paddedPayload.slice(5).buffer);
                }
            }
        }

        return {
            targetDiscovered: targetDiscovered,
            mspFrames: mspFrames,
        };
    }

    _acceptHeartbeat(systemId, payload) {
        if (payload.length < 9) {
            return false;
        }

        if (payload[5] === MAVLINK_AUTOPILOT_INVALID) {
            return false;
        }

        if (this._requestedSystemId !== 0 && systemId !== this._requestedSystemId) {
            return false;
        }

        if (!this._targetSystemId) {
            this._targetSystemId = systemId;
            return true;
        }

        return false;
    }

    _isConfiguratorTunnel(payload, systemId, componentId) {
        if (payload.length < 5) {
            return false;
        }

        const payloadType = payload[0] | (payload[1] << 8);
        const targetSystem = payload[2];
        const targetComponent = payload[3];

        return payloadType === MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP &&
            systemId === this._targetSystemId &&
            componentId !== 0 &&
            targetSystem === MAVLINK_CONFIGURATOR_SYSTEM_ID &&
            targetComponent === MAVLINK_CONFIGURATOR_COMPONENT_ID;
    }

    _encodeTunnelFrame(payload) {
        const payloadLength = 5 + payload.length;
        const frame = new Uint8Array(MAVLINK_V2_HEADER_LENGTH + payloadLength + MAVLINK_CHECKSUM_LENGTH);

        frame[0] = MAVLINK_V2_MAGIC;
        frame[1] = payloadLength;
        frame[2] = 0;
        frame[3] = 0;
        frame[4] = this._sequence;
        frame[5] = MAVLINK_CONFIGURATOR_SYSTEM_ID;
        frame[6] = MAVLINK_CONFIGURATOR_COMPONENT_ID;
        frame[7] = MAVLINK_MSG_ID_TUNNEL & 0xFF;
        frame[8] = (MAVLINK_MSG_ID_TUNNEL >> 8) & 0xFF;
        frame[9] = (MAVLINK_MSG_ID_TUNNEL >> 16) & 0xFF;
        frame[10] = MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP & 0xFF;
        frame[11] = (MAVLINK_TUNNEL_PAYLOAD_TYPE_INAV_MSP >> 8) & 0xFF;
        frame[12] = this._targetSystemId;
        frame[13] = 0;
        frame[14] = payload.length;
        frame.set(payload, 15);

        const crc = this._crcX25(frame.slice(1, MAVLINK_V2_HEADER_LENGTH + payloadLength), MAVLINK_MSG_TUNNEL_CRC_EXTRA);
        frame[MAVLINK_V2_HEADER_LENGTH + payloadLength] = crc & 0xFF;
        frame[MAVLINK_V2_HEADER_LENGTH + payloadLength + 1] = (crc >> 8) & 0xFF;

        this._sequence = (this._sequence + 1) & 0xFF;

        return frame;
    }

    _crcMatches(frame, magic, payloadLength, checksumOffset, crcExtra) {
        const headerWithoutMagic = magic === MAVLINK_V2_MAGIC ?
            frame.slice(1, MAVLINK_V2_HEADER_LENGTH + payloadLength) :
            frame.slice(1, MAVLINK_V1_HEADER_LENGTH + payloadLength);
        const crc = this._crcX25(headerWithoutMagic, crcExtra);
        const frameCrc = frame[checksumOffset] | (frame[checksumOffset + 1] << 8);

        return crc === frameCrc;
    }

    _crcX25(bytes, crcExtra) {
        let crc = 0xFFFF;

        for (let index = 0; index < bytes.length; index++) {
            crc = this._crcAccumulate(bytes[index], crc);
        }

        return this._crcAccumulate(crcExtra, crc);
    }

    _crcAccumulate(byte, crc) {
        let tmp = byte ^ (crc & 0xFF);
        tmp ^= (tmp << 4) & 0xFF;
        return ((crc >> 8) ^ (tmp << 8) ^ (tmp << 3) ^ (tmp >> 4)) & 0xFFFF;
    }

    _append(rawBuffer) {
        const bytes = new Uint8Array(rawBuffer);
        const combined = new Uint8Array(this._buffer.length + bytes.length);
        combined.set(this._buffer, 0);
        combined.set(bytes, this._buffer.length);
        this._buffer = combined;
    }

    _findFrameStart() {
        for (let index = 0; index < this._buffer.length; index++) {
            if (this._buffer[index] === MAVLINK_V1_MAGIC || this._buffer[index] === MAVLINK_V2_MAGIC) {
                return index;
            }
        }

        return -1;
    }

    _concatArrays(arrays) {
        let totalLength = 0;
        for (let index = 0; index < arrays.length; index++) {
            totalLength += arrays[index].length;
        }

        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (let index = 0; index < arrays.length; index++) {
            combined.set(arrays[index], offset);
            offset += arrays[index].length;
        }

        return combined;
    }
}

export default MavlinkMspTunnel;
