'use strict';

import {
    MAVLINK_V1_MAGIC,
    MAVLINK_V2_MAGIC,
    MAVLINK_V1_HEADER_LENGTH,
    MAVLINK_V2_HEADER_LENGTH,
    MAVLINK_CHECKSUM_LENGTH,
    MAVLINK_SIGNATURE_LENGTH,
    MAVLINK_IFLAG_SIGNED,
    getMessageInfo,
    crcCalculate,
} from './mavlinkProtocol.js';

const CANDIDATE_INVALID = -1;
const CANDIDATE_INCOMPLETE = 0;

// Validate, then consume: a stray magic byte must not swallow the real frame behind it.
export class MavlinkParser {

    constructor() {
        this.reset();
    }

    reset() {
        this._buffer = new Uint8Array(0);
        this.crcErrors = 0;
    }

    // Returns the complete frames; payloads are zero-extended to the message's full length.
    ingest(bytes) {
        this._append(bytes);

        const frames = [];
        let position = 0;
        while (position < this._buffer.length) {
            if (!this._isMagic(this._buffer[position])) {
                position++;
                continue;
            }

            const result = this._tryDecodeAt(position);
            if (result === CANDIDATE_INCOMPLETE) {
                break;
            }
            if (result === CANDIDATE_INVALID) {
                position++;
                continue;
            }

            frames.push(result.frame);
            position += result.length;
        }

        this._buffer = this._buffer.slice(position);
        return frames;
    }

    _append(bytes) {
        const incoming = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        const combined = new Uint8Array(this._buffer.length + incoming.length);
        combined.set(this._buffer, 0);
        combined.set(incoming, this._buffer.length);
        this._buffer = combined;
    }

    _isMagic(byte) {
        return byte === MAVLINK_V2_MAGIC || byte === MAVLINK_V1_MAGIC;
    }

    _tryDecodeAt(position) {
        const header = this._readHeader(position);
        if (header === CANDIDATE_INCOMPLETE || header === CANDIDATE_INVALID) {
            return header;
        }

        const frameLength = header.headerLength + header.payloadLength + MAVLINK_CHECKSUM_LENGTH + header.signatureLength;
        if (this._buffer.length - position < frameLength) {
            return CANDIDATE_INCOMPLETE;
        }

        const crcOffset = position + header.headerLength + header.payloadLength;
        const expected = crcCalculate(this._buffer, position + 1, crcOffset, header.info.crcExtra);
        const received = this._buffer[crcOffset] | (this._buffer[crcOffset + 1] << 8);
        if (expected !== received) {
            this.crcErrors++;
            return CANDIDATE_INVALID;
        }

        // Zero-extend: MAVLink 2 trims trailing zeros, MAVLink 1 carries only the base fields.
        const payload = new Uint8Array(header.info.length);
        const payloadStart = position + header.headerLength;
        payload.set(this._buffer.subarray(payloadStart, payloadStart + header.payloadLength));

        return {
            length: frameLength,
            frame: {
                version: header.version,
                sysid: header.sysid,
                compid: header.compid,
                msgid: header.msgid,
                seq: header.seq,
                signed: header.signatureLength > 0,
                payload,
            },
        };
    }

    _readHeader(position) {
        const buffer = this._buffer;
        const isV2 = buffer[position] === MAVLINK_V2_MAGIC;
        const headerLength = isV2 ? MAVLINK_V2_HEADER_LENGTH : MAVLINK_V1_HEADER_LENGTH;
        if (buffer.length - position < headerLength) {
            return CANDIDATE_INCOMPLETE;
        }

        const payloadLength = buffer[position + 1];
        const header = isV2 ? this._readV2Header(position) : this._readV1Header(position);
        if (header === CANDIDATE_INVALID) {
            return CANDIDATE_INVALID;
        }

        const info = getMessageInfo(header.msgid);
        if (!info || !this._lengthFits(isV2, payloadLength, info)) {
            return CANDIDATE_INVALID;
        }

        return Object.assign(header, { headerLength, payloadLength, info });
    }

    _readV2Header(position) {
        const buffer = this._buffer;
        const incompatFlags = buffer[position + 2];
        // Unknown incompatibility flags must not be parsed (MAVLink 2 spec).
        if ((incompatFlags & ~MAVLINK_IFLAG_SIGNED) !== 0) {
            return CANDIDATE_INVALID;
        }
        return {
            version: 2,
            seq: buffer[position + 4],
            sysid: buffer[position + 5],
            compid: buffer[position + 6],
            msgid: buffer[position + 7] | (buffer[position + 8] << 8) | (buffer[position + 9] << 16),
            signatureLength: (incompatFlags & MAVLINK_IFLAG_SIGNED) ? MAVLINK_SIGNATURE_LENGTH : 0,
        };
    }

    _readV1Header(position) {
        const buffer = this._buffer;
        return {
            version: 1,
            seq: buffer[position + 2],
            sysid: buffer[position + 3],
            compid: buffer[position + 4],
            msgid: buffer[position + 5],
            signatureLength: 0,
        };
    }

    _lengthFits(isV2, payloadLength, info) {
        if (isV2) {
            return payloadLength >= 1 && payloadLength <= info.length;
        }
        return payloadLength === info.minLength;
    }
}

export default MavlinkParser;
