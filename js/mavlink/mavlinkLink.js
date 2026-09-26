'use strict';

import { MavlinkParser } from './mavlinkParser.js';
import {
    MAVLINK_MSG_ID,
    MAV_TYPE_GCS,
    encodeFrameV2,
    encodeGcsHeartbeatPayload,
    encodeCommandLongPayload,
    heartbeatType,
} from './mavlinkProtocol.js';
import {
    GCS_SYSTEM_ID,
    GCS_COMPONENT_ID,
    encodeMspTunnelFrames,
    decodeMspTunnelChunk,
} from './mavlinkTunnel.js';

export const FC_COMPONENT_ID = 1;
// Mirrors MAVLINK_TUNNEL_MSP_TIMEOUT_MS: the FC drops its partial frame after this gap too.
export const TUNNEL_REASSEMBLY_TIMEOUT_MS = 1000;

// Bytes in, callbacks out; no DOM or connection, so it works over any transport.
export class MavlinkLink {

    constructor(handlers = {}) {
        this.onHeartbeat = handlers.onHeartbeat || null;
        this.onTunnelChunk = handlers.onTunnelChunk || null;
        this.onMessage = handlers.onMessage || null;
        this.onReassemblyTimeout = handlers.onReassemblyTimeout || null;
        this._now = handlers.now || (() => Date.now());
        this._parser = new MavlinkParser();
        this.reset();
    }

    reset() {
        this._parser.reset();
        this._target = null;
        this._seq = 0;
        this.resetReassembly();
    }

    resetReassembly() {
        this._lastChunkAt = null;
    }

    lockTarget(sysid, compid) {
        this._target = { sysid, compid };
    }

    getTarget() {
        return this._target;
    }

    ingest(bytes) {
        for (const frame of this._parser.ingest(bytes)) {
            this._dispatch(frame);
        }
    }

    // The returned frames must be written back to back: the FC drops a partial MSP frame after 1 s.
    wrapMsp(mspFrame) {
        if (!this._target) {
            throw new Error('MAVLink tunnel target is not locked');
        }
        const bytes = mspFrame instanceof Uint8Array ? mspFrame : new Uint8Array(mspFrame);
        return encodeMspTunnelFrames(bytes, this._target, () => this._nextSeq());
    }

    heartbeatFrame() {
        return encodeFrameV2(MAVLINK_MSG_ID.HEARTBEAT, encodeGcsHeartbeatPayload(), GCS_SYSTEM_ID, GCS_COMPONENT_ID, this._nextSeq());
    }

    commandLongFrame(command, params) {
        if (!this._target) {
            throw new Error('MAVLink command target is not locked');
        }
        const payload = encodeCommandLongPayload(command, this._target, params);
        return encodeFrameV2(MAVLINK_MSG_ID.COMMAND_LONG, payload, GCS_SYSTEM_ID, GCS_COMPONENT_ID, this._nextSeq());
    }

    _nextSeq() {
        const seq = this._seq;
        this._seq = (this._seq + 1) & 0xFF;
        return seq;
    }

    _dispatch(frame) {
        if (this.onMessage) {
            this.onMessage(frame);
        }

        if (frame.msgid === MAVLINK_MSG_ID.HEARTBEAT) {
            this._handleHeartbeat(frame);
        } else if (frame.msgid === MAVLINK_MSG_ID.TUNNEL) {
            this._handleTunnel(frame);
        }
    }

    _handleHeartbeat(frame) {
        const isOwn = frame.sysid === GCS_SYSTEM_ID && frame.compid === GCS_COMPONENT_ID;
        if (isOwn || frame.compid !== FC_COMPONENT_ID || heartbeatType(frame.payload) === MAV_TYPE_GCS) {
            return;
        }
        if (this.onHeartbeat) {
            this.onHeartbeat(frame);
        }
    }

    _handleTunnel(frame) {
        const chunk = decodeMspTunnelChunk(frame, this._target);
        if (!chunk) {
            return;
        }

        const now = this._now();
        if (this._lastChunkAt !== null && now - this._lastChunkAt >= TUNNEL_REASSEMBLY_TIMEOUT_MS && this.onReassemblyTimeout) {
            this.onReassemblyTimeout();
        }
        this._lastChunkAt = now;

        if (this.onTunnelChunk) {
            this.onTunnelChunk(chunk);
        }
    }
}

export default MavlinkLink;
