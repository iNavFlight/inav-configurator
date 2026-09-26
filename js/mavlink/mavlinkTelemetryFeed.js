'use strict';

import MSPCodes from '../msp/MSPCodes.js';
import { MAVLINK_MSG_ID, MAV_CMD_SET_MESSAGE_INTERVAL } from './mavlinkProtocol.js';
import { GCS_SYSTEM_ID, GCS_COMPONENT_ID } from './mavlinkTunnel.js';
import { MavlinkTelemetry } from './mavlinkTelemetry.js';
import { MavlinkStreamControl } from './mavlinkStreamControl.js';

// Reads answered from telemetry; MSP_SENSOR_STATUS stays on the wire because it feeds the FC's isMspConfigActive().
export const TELEMETRY_COVERED = new Map([
    [MSPCodes.MSP_ATTITUDE, [MAVLINK_MSG_ID.ATTITUDE]],
    [MSPCodes.MSP_RAW_GPS, [MAVLINK_MSG_ID.GPS_RAW_INT]],
    [MSPCodes.MSP_ALTITUDE, [MAVLINK_MSG_ID.VFR_HUD]],
    [MSPCodes.MSPV2_INAV_ANALOG, [MAVLINK_MSG_ID.BATTERY_STATUS, MAVLINK_MSG_ID.SYS_STATUS, MAVLINK_MSG_ID.RC_CHANNELS]],
    [MSPCodes.MSP_RC, [MAVLINK_MSG_ID.RC_CHANNELS]],
]);

const TWO_HZ_US = 500000;
const ONE_HZ_US = 1000000;
// Requested explicitly: a MAVLink port with index > 0 streams only HEARTBEAT by default.
export const BASE_INTERVALS_US = new Map([
    [MAVLINK_MSG_ID.SYS_STATUS, TWO_HZ_US],
    [MAVLINK_MSG_ID.ATTITUDE, TWO_HZ_US],
    [MAVLINK_MSG_ID.VFR_HUD, TWO_HZ_US],
    [MAVLINK_MSG_ID.GPS_RAW_INT, TWO_HZ_US],
    [MAVLINK_MSG_ID.BATTERY_STATUS, ONE_HZ_US],
    [MAVLINK_MSG_ID.RC_CHANNELS, ONE_HZ_US],
]);

export const BOOST_INTERVAL_US = 100000;
const BOOSTABLE = new Map([
    [MSPCodes.MSP_ATTITUDE, MAVLINK_MSG_ID.ATTITUDE],
    [MSPCodes.MSP_RC, MAVLINK_MSG_ID.RC_CHANNELS],
]);
export const BOOST_REQUESTS = 3;
export const BOOST_WINDOW_MS = 1000;
export const UNBOOST_IDLE_MS = 2000;
const IDLE_CHECK_MS = 250;
const FRESH_INTERVALS = 3;
export const MIN_FRESH_WINDOW_MS = 3000;
export const STATS_PERIOD_MS = 10000;
// Fields MAVLink does not carry (battery state, remaining capacity, mWh, barometer, hdop) come from this wire read.
export const WIRE_REFRESH_MS = 10000;
// An FC reboot drops every interval override; a stream gone quiet is asked for again, but not more often than this.
export const RE_REQUEST_MS = 10000;
// The FC reads one MAVLink message per cycle out of a 64 byte budget: restore commands go out one by one.
export const RESTORE_SPACING_MS = 20;
export const RESTORE_DEADLINE_MS = 300;

// phase-2 A/B: 'mavlink_telemetry_feed' = false in the store keeps a tunnel session on pure MSP polling.
export function isTelemetryFeedEnabled(store) {
    return store.get('mavlink_telemetry_feed', true) !== false;
}

export function mspCodeOfFrame(body) {
    const bytes = new Uint8Array(body);
    return bytes[1] === 0x58 ? bytes[4] | (bytes[5] << 8) : bytes[4];
}

function freshWindowMs(intervalUs) {
    return Math.max(FRESH_INTERVALS * intervalUs / 1000, MIN_FRESH_WINDOW_MS);
}

function countInto(map, code) {
    map.set(code, (map.get(code) || 0) + 1);
}

// Covered reads are answered from telemetry-fed FC state; anything stale or unacknowledged goes on the wire.
export class MavlinkTelemetryFeed {

    constructor(options) {
        this._link = options.link;
        this._send = options.send;
        this._msp = options.msp;
        this._now = options.now || (() => Date.now());
        this._log = options.log || (line => console.log(line));
        this._onStreamsReady = options.onStreamsReady || null;
        this._onFirstVirtual = options.onFirstVirtual || null;
        this.telemetry = new MavlinkTelemetry({
            fc: options.fc,
            msp: options.msp,
            onSensorStatus: options.onSensorStatus,
            onCommandAck: ack => this._onCommandAck(ack),
            now: this._now,
        });
        this.streams = new MavlinkStreamControl({
            sendCommand: (msgid, intervalUs) => this._send(this._intervalFrame(msgid, intervalUs).buffer, null),
            log: this._log,
            now: this._now,
            roundTripMs: options.roundTripMs,
        });
        this._lastReRequest = new Map();
        this._recentRequests = new Map();
        this._boosted = new Set();
        this._lastWireAt = new Map();
        this._fallbackLogged = new Set();
        this._pendingCallbacks = new Set();
        this._streamsReady = false;
        this._servedVirtually = false;
        this._timers = [];
        // phase-2 A/B: counts.
        this.resetCounts();
    }

    start() {
        this.streams.requestBase(BASE_INTERVALS_US, (accepted, total) => this._streamsDone(accepted, total));
        this._timers.push(setInterval(() => this._checkStreams(), IDLE_CHECK_MS));
        // phase-2 A/B: wire vs virtual counter on the console.
        this._timers.push(setInterval(() => this._logCounts(), STATS_PERIOD_MS));
    }

    // restore only while the port is open: the FC keeps our intervals until reboot otherwise. done() runs once.
    stop(restore, done = null) {
        this._timers.forEach(timer => clearInterval(timer));
        this._timers = [];
        this.cancelPending();
        const changed = this.streams.stop();
        const frames = restore ? changed.map(msgid => this._intervalFrame(msgid, 0)) : [];
        this._sendRestore(frames, done || (() => {}));
    }

    handleFrame(frame) {
        const target = this._link.getTarget();
        if (target && frame.sysid === target.sysid && frame.compid === target.compid && this.telemetry.handleFrame(frame)) {
            this.streams.noteMessage(frame.msgid);
        }
    }

    serve(code, data, onSent, onFinish) {
        const sources = TELEMETRY_COVERED.get(code);
        if (!sources || (data && data.length)) {
            return false;
        }
        const reason = this._fallbackReason(code, sources);
        if (reason) {
            this._logFallback(code, reason);
            return false;
        }
        // phase-2 A/B: counts.
        countInto(this.counts.virtual, code);
        this._noteBoostRequest(code);
        this._scheduleCallbacks(onSent, onFinish);
        if (!this._servedVirtually) {
            this._servedVirtually = true;
            if (this._onFirstVirtual) {
                this._onFirstVirtual();
            }
        }
        return true;
    }

    // phase-2 A/B: counts tunnel attempts on the wire.
    noteWire(code) {
        countInto(this.counts.wire, code);
    }

    // A wire reply that answered its request; only then do the fields MAVLink lacks hold a fresh MSP value.
    noteWireReply(code) {
        if (TELEMETRY_COVERED.has(code)) {
            this._lastWireAt.set(code, this._now());
        }
    }

    // A tab switch drops its callbacks; virtual ones must not fire into the next tab either.
    cancelPending() {
        this._pendingCallbacks.forEach(timer => clearTimeout(timer));
        this._pendingCallbacks.clear();
    }

    // phase-2 A/B: wire vs virtual counter.
    resetCounts() {
        this.counts = { wire: new Map(), virtual: new Map(), since: this._now() };
    }

    isBoosted(msgid) {
        return this._boosted.has(msgid);
    }

    _intervalFrame(msgid, intervalUs) {
        return this._link.commandLongFrame(MAV_CMD_SET_MESSAGE_INTERVAL, [msgid, intervalUs]);
    }

    _onCommandAck(ack) {
        const toUs = ack.targetSystem === GCS_SYSTEM_ID && ack.targetComponent === GCS_COMPONENT_ID;
        const broadcast = ack.targetSystem === 0 && ack.targetComponent === 0;
        if (toUs || broadcast) {
            this.streams.handleAck(ack);
        }
    }

    _streamsDone(accepted, total) {
        this._streamsReady = true;
        if (this._onStreamsReady) {
            this._onStreamsReady(accepted, total);
        }
    }

    _fallbackReason(code, sources) {
        // Fields MAVLink does not carry keep their last MSP value, so there must be a recent one.
        const lastWireAt = this._lastWireAt.get(code);
        const unusable = this._msp.lostReplies.has(code) || this._msp.parseFailures.has(code);
        if (lastWireAt === undefined || unusable || this._now() - lastWireAt >= WIRE_REFRESH_MS) {
            return 'wire refresh';
        }
        if (code === MSPCodes.MSP_RC && this.telemetry.rcChannelsTruncated) {
            return 'more than 18 RC channels';
        }
        for (const msgid of sources) {
            const intervalUs = this.streams.acceptedIntervalUs(msgid);
            if (!(intervalUs > 0)) {
                return 'interval for message ' + msgid + ' not acknowledged';
            }
            if (!this.telemetry.seenWithin(msgid, freshWindowMs(intervalUs))) {
                return 'message ' + msgid + (this.telemetry.lastSeen.has(msgid) ? ' is stale' : ' never received');
            }
        }
        return null;
    }

    _logFallback(code, reason) {
        if (reason === 'wire refresh' || !this._streamsReady || this._fallbackLogged.has(code)) {
            return;
        }
        this._fallbackLogged.add(code);
        this._log('MAVLink telemetry: ' + this._codeName(code) + ' goes over the tunnel (' + reason + ')');
    }

    _scheduleCallbacks(onSent, onFinish) {
        const timer = setTimeout(() => {
            this._pendingCallbacks.delete(timer);
            if (onSent) {
                onSent();
            }
            if (onFinish) {
                onFinish(true);
            }
        }, 0);
        this._pendingCallbacks.add(timer);
    }

    _noteBoostRequest(code) {
        const msgid = BOOSTABLE.get(code);
        if (msgid === undefined) {
            return;
        }
        const now = this._now();
        const recent = (this._recentRequests.get(msgid) || []).filter(at => now - at < BOOST_WINDOW_MS);
        recent.push(now);
        this._recentRequests.set(msgid, recent);
        if (recent.length >= BOOST_REQUESTS && !this._boosted.has(msgid)) {
            this._boosted.add(msgid);
            this.streams.setInterval(msgid, BOOST_INTERVAL_US);
        }
    }

    _checkStreams() {
        this._unboostIdle();
        this._reRequestStale();
    }

    _reRequestStale() {
        const now = this._now();
        for (const msgid of BASE_INTERVALS_US.keys()) {
            const intervalUs = this.streams.acceptedIntervalUs(msgid);
            const quiet = intervalUs > 0 && this.telemetry.lastSeen.has(msgid) &&
                !this.telemetry.seenWithin(msgid, freshWindowMs(intervalUs));
            const recentlyAsked = now - (this._lastReRequest.get(msgid) ?? -Infinity) < RE_REQUEST_MS;
            if (quiet && !recentlyAsked && this.streams.reRequest(msgid)) {
                this._lastReRequest.set(msgid, now);
                this._log('MAVLink telemetry: message ' + msgid + ' went quiet, interval requested again');
            }
        }
    }

    _sendRestore(frames, done) {
        let finished = false;
        const finish = () => {
            if (!finished) {
                finished = true;
                clearTimeout(deadline);
                done();
            }
        };
        const deadline = setTimeout(finish, RESTORE_DEADLINE_MS);
        const sendFrom = index => {
            if (index >= frames.length) {
                finish();
                return;
            }
            this._send(frames[index].buffer, () => {
                if (index + 1 < frames.length) {
                    setTimeout(() => sendFrom(index + 1), RESTORE_SPACING_MS);
                } else {
                    finish();
                }
            });
        };
        sendFrom(0);
    }

    _unboostIdle() {
        const now = this._now();
        this._boosted.forEach(msgid => {
            const recent = this._recentRequests.get(msgid) || [];
            const last = recent.length > 0 ? recent[recent.length - 1] : -Infinity;
            if (now - last >= UNBOOST_IDLE_MS) {
                this._boosted.delete(msgid);
                this.streams.setInterval(msgid, BASE_INTERVALS_US.get(msgid));
            }
        });
    }

    _codeName(code) {
        return this._msp.getCodeName ? this._msp.getCodeName(code) : String(code);
    }

    // phase-2 A/B: formatting and logging of the wire vs virtual counter.
    _formatCounts(map) {
        let total = 0;
        const parts = [];
        map.forEach((count, code) => {
            total += count;
            parts.push(this._codeName(code) + ' ' + count);
        });
        return total + (parts.length ? ' (' + parts.join(', ') + ')' : '');
    }

    _logCounts() {
        const seconds = Math.round((this._now() - this.counts.since) / 1000);
        this._log('MAVLink telemetry A/B, last ' + seconds + ' s: wire ' + this._formatCounts(this.counts.wire) +
            ', virtual ' + this._formatCounts(this.counts.virtual));
        this.resetCounts();
    }
}

export default MavlinkTelemetryFeed;
