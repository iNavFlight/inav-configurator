'use strict';

import MSPCodes from '../msp/MSPCodes.js';
import { MAVLINK_MSG_ID, MAV_CMD_SET_MESSAGE_INTERVAL } from './mavlinkProtocol.js';
import { GCS_SYSTEM_ID, GCS_COMPONENT_ID } from './mavlinkTunnel.js';
import { MavlinkTelemetry, MIN_FRESH_WINDOW_MS } from './mavlinkTelemetry.js';
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
const HALF_HZ_US = 2000000;
// Requested explicitly: a MAVLink port with index > 0 streams only HEARTBEAT by default.
export const BASE_INTERVALS_US = new Map([
    [MAVLINK_MSG_ID.SYS_STATUS, TWO_HZ_US],
    [MAVLINK_MSG_ID.ATTITUDE, TWO_HZ_US],
    [MAVLINK_MSG_ID.VFR_HUD, TWO_HZ_US],
    [MAVLINK_MSG_ID.GPS_RAW_INT, TWO_HZ_US],
    [MAVLINK_MSG_ID.BATTERY_STATUS, ONE_HZ_US],
    [MAVLINK_MSG_ID.RC_CHANNELS, ONE_HZ_US],
]);

// For a serial wire at 9600 baud or less, from the start (measured at 4800: the base set crowded out MSP replies).
// RC_CHANNELS is left alone, not switched off: the FC would keep that override until reboot. MSP_RC goes on the wire.
// Cost: MAVLink port index 0 keeps its mavlink_port1_rc_chan_rate (default 1 Hz, ~54 B/s, ~11 % of 4800 baud).
export const REDUCED_INTERVALS_US = new Map([
    [MAVLINK_MSG_ID.SYS_STATUS, ONE_HZ_US],
    [MAVLINK_MSG_ID.ATTITUDE, ONE_HZ_US],
    [MAVLINK_MSG_ID.VFR_HUD, HALF_HZ_US],
    [MAVLINK_MSG_ID.GPS_RAW_INT, ONE_HZ_US],
    [MAVLINK_MSG_ID.BATTERY_STATUS, HALF_HZ_US],
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
export { MIN_FRESH_WINDOW_MS };
export const STATS_PERIOD_MS = 10000;
// Fields MAVLink does not carry (battery state, remaining capacity, mWh, barometer, hdop) come from this wire read.
export const WIRE_REFRESH_MS = 10000;
// An FC reboot drops every interval override; a stream gone quiet is asked for again, but not more often than this.
export const RE_REQUEST_MS = 10000;
// An accepted stream never received may be one the FC does not send (GPS_RAW_INT without a GPS): ask twice, then stop.
export const NEVER_SEEN_RE_REQUESTS = 2;
// A quiet or unconfirmed stream is asked for again once per 10 s for a minute, then left alone.
export const MAX_RE_REQUESTS = 6;
// No frame from the FC for this long: the link is down, or the FC rebooted and dropped every override.
export const FC_SILENCE_MS = 3000;
// The FC reads one MAVLink message per cycle out of a 64 byte budget: restore commands go out one by one.
export const RESTORE_SPACING_MS = 20;
export const RESTORE_DEADLINE_MS = 300;
// Per restore frame: the 44 B COMMAND_LONG takes ~92 ms on a 4800 baud wire, plus the spacing.
export const RESTORE_FRAME_ALLOWANCE_MS = 200;
export const RESTORE_DEADLINE_MAX_MS = 1500;

// 'mavlink_telemetry_feed' = false in the store keeps a tunnel session on pure MSP polling.
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
        // The periodic counter line is noise on the console; debug level keeps it available.
        this._statsLog = options.log || (line => console.debug(line));
        this._onStreamsReady = options.onStreamsReady || null;
        this._onFirstVirtual = options.onFirstVirtual || null;
        this._slowSerialLink = options.slowSerialLink === true;
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
        this._neverSeenReRequests = new Map();
        this._reRequestCount = new Map();
        this._lastFcFrameAt = null;
        this._silenceEndedAt = null;
        this._recentRequests = new Map();
        this._boosted = new Set();
        this._baseIntervals = BASE_INTERVALS_US;
        this._lastWireAt = new Map();
        this._fallbackLogged = new Set();
        this._pendingCallbacks = new Set();
        this._streamsReady = false;
        this._servedVirtually = false;
        this._timers = [];
        this.resetCounts();
    }

    start() {
        if (this._slowSerialLink) {
            this._baseIntervals = REDUCED_INTERVALS_US;
            this._log('MAVLink telemetry: slow serial link, reduced telemetry set without boost');
        }
        this.streams.requestBase(this._baseIntervals, (_accepted, total) => this._streamsDone(total));
        this._timers.push(
            setInterval(() => this._checkStreams(), IDLE_CHECK_MS),
            // Diagnostic: wire vs virtual counts on the console.
            setInterval(() => this._logCounts(), STATS_PERIOD_MS),
        );
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
        if (!target || frame.sysid !== target.sysid || frame.compid !== target.compid) {
            return;
        }
        this._noteFcFrame();
        if (this.telemetry.handleFrame(frame)) {
            this.streams.noteMessage(frame.msgid);
        }
    }

    // After a silence the FC may have rebooted, so every stream gets its full re-request budget back.
    _noteFcFrame() {
        const now = this._now();
        if (this._lastFcFrameAt !== null && now - this._lastFcFrameAt >= FC_SILENCE_MS) {
            this._reRequestCount.clear();
            this._neverSeenReRequests.clear();
            this._silenceEndedAt = now;
        }
        this._lastFcFrameAt = now;
    }

    serve(code, data, onSent, onFinish) {
        const sources = TELEMETRY_COVERED.get(code);
        if (!sources || data?.length) {
            return false;
        }
        const reason = this._fallbackReason(code, sources);
        if (reason) {
            this._logFallback(code, reason);
            return false;
        }
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

    // Counts tunnel attempts on the wire for the diagnostic line.
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

    resetCounts() {
        this.counts = { wire: new Map(), virtual: new Map(), since: this._now() };
    }

    isBoosted(msgid) {
        return this._boosted.has(msgid);
    }

    isReduced() {
        return this._baseIntervals === REDUCED_INTERVALS_US;
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

    // Counts streams the FC confirmed.
    _streamsDone(total) {
        this._streamsReady = true;
        const active = [...this._baseIntervals.keys()]
            .filter(msgid => this.streams.acceptedIntervalUs(msgid) > 0).length;
        if (this._onStreamsReady) {
            this._onStreamsReady(active, total);
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
        // A stream switched off is optional where the code has other sources (rssi of MSPV2_INAV_ANALOG).
        const active = sources.filter(msgid => !this._isOff(msgid));
        if (active.length === 0) {
            return 'message ' + sources.join('/') + ' switched off';
        }
        for (const msgid of active) {
            const reason = this._sourceReason(msgid);
            if (reason) {
                return reason;
            }
        }
        return null;
    }

    _sourceReason(msgid) {
        const accepted = this.streams.acceptedIntervalUs(msgid);
        if (accepted === undefined || accepted <= 0) {
            return 'interval for message ' + msgid + ' not acknowledged';
        }
        if (!this.telemetry.seenWithin(msgid, this._freshWindowFor(msgid))) {
            return 'message ' + msgid + (this.telemetry.lastSeen.has(msgid) ? ' is stale' : ' never received');
        }
        return null;
    }

    // Never requested counts as off: the FC may stream it at the port's rate or not at all.
    _isOff(msgid) {
        const intervalUs = this.streams.requestedIntervalUs(msgid);
        return intervalUs === undefined || intervalUs < 0;
    }

    // The slower of accepted and requested: a stream just slowed down is not stale at its new rate.
    _freshWindowFor(msgid) {
        const accepted = this.streams.acceptedIntervalUs(msgid) ?? 0;
        const requested = this.streams.requestedIntervalUs(msgid) ?? 0;
        return freshWindowMs(Math.max(accepted, requested));
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
        if (recent.length >= BOOST_REQUESTS && !this._boosted.has(msgid) && this._mayBoost(msgid)) {
            this._boosted.add(msgid);
            this.streams.setInterval(msgid, BOOST_INTERVAL_US);
        }
    }

    // A slow serial link never boosts; neither does a stream switched off in its base set.
    _mayBoost(msgid) {
        return !this._slowSerialLink && this._baseIntervals.get(msgid) > 0;
    }

    _checkStreams() {
        this._unboostIdle();
        // The re-request passes are skipped while the FC is silent: their commands could not reach it.
        if (this._lastFcFrameAt === null || this._now() - this._lastFcFrameAt >= FC_SILENCE_MS) {
            return;
        }
        this._reRequestStale();
        this._reRequestUnconfirmed();
    }

    // An FC reboot drops every override; an ack may also belong to another command (it names no message id).
    _reRequestStale() {
        const now = this._now();
        for (const msgid of this._baseIntervals.keys()) {
            const neverSeen = !this.telemetry.lastSeen.has(msgid);
            const exhausted = neverSeen && (this._neverSeenReRequests.get(msgid) || 0) >= NEVER_SEEN_RE_REQUESTS;
            if (exhausted || !this._isQuiet(msgid, now) || !this._reRequest(msgid, now)) {
                continue;
            }
            if (neverSeen) {
                this._neverSeenReRequests.set(msgid, (this._neverSeenReRequests.get(msgid) || 0) + 1);
            }
            this._log('MAVLink telemetry: message ' + msgid + (neverSeen ? ' never received' : ' went quiet') +
                ', interval requested again');
        }
    }

    // Accepted, but not seen within its fresh window: since then, or since the command went out.
    _isQuiet(msgid, now) {
        const accepted = this.streams.acceptedIntervalUs(msgid);
        if (accepted === undefined || accepted <= 0 || this._isOff(msgid)) {
            return false;
        }
        const windowMs = this._freshWindowFor(msgid);
        // A fade or a blocking erase keeps the overrides: a stream is quiet only after a full window since the silence.
        const sinceSilenceEnd = this._silenceEndedAt === null ? Infinity : now - this._silenceEndedAt;
        if (this.telemetry.lastSeen.has(msgid)) {
            return !this.telemetry.seenWithin(msgid, windowMs) && sinceSilenceEnd > windowMs;
        }
        const sentAt = this.streams.sentAt(msgid);
        return accepted === this.streams.requestedIntervalUs(msgid) && sentAt !== null &&
            now - sentAt >= windowMs && sinceSilenceEnd >= windowMs;
    }

    // The stream control gives up after two unanswered attempts, and a slowdown (unboost) is confirmed by
    // its ack only: an unboost that never arrived leaves the stream fast. A boost can be confirmed by its rate.
    _reRequestUnconfirmed() {
        const now = this._now();
        for (const msgid of this._baseIntervals.keys()) {
            const requested = this.streams.requestedIntervalUs(msgid);
            const sentAt = this.streams.sentAt(msgid);
            const unacknowledged = this.streams.acceptedIntervalUs(msgid) !== requested || this.streams.isUnconfirmed(msgid);
            const unconfirmed = requested !== undefined && sentAt !== null && now - sentAt >= RE_REQUEST_MS &&
                unacknowledged && !this.streams.isRefused(msgid);
            if (unconfirmed && this._reRequest(msgid, now)) {
                this._log('MAVLink telemetry: interval for message ' + msgid + ' not confirmed, requested again');
            }
        }
    }

    _reRequest(msgid, now) {
        const count = this._reRequestCount.get(msgid) || 0;
        if (count >= MAX_RE_REQUESTS) {
            return false;
        }
        if (now - (this._lastReRequest.get(msgid) ?? -Infinity) < RE_REQUEST_MS || !this.streams.reRequest(msgid)) {
            return false;
        }
        this._lastReRequest.set(msgid, now);
        this._reRequestCount.set(msgid, count + 1);
        if (count + 1 === MAX_RE_REQUESTS) {
            this._log('MAVLink telemetry: message ' + msgid + ' requested again ' + MAX_RE_REQUESTS +
                ' times, no more for this session');
        }
        return true;
    }

    _sendRestore(frames, done) {
        let finished = false;
        let written = 0;
        const finish = () => {
            if (!finished) {
                finished = true;
                clearTimeout(deadline);
                if (written < frames.length) {
                    this._log('MAVLink telemetry: restore cut short, ' + (frames.length - written) + ' of ' +
                        frames.length + ' restore frames not confirmed, the FC may keep those intervals until it reboots');
                }
                done();
            }
        };
        const deadlineMs = Math.min(RESTORE_DEADLINE_MS + frames.length * RESTORE_FRAME_ALLOWANCE_MS, RESTORE_DEADLINE_MAX_MS);
        const deadline = setTimeout(finish, deadlineMs);
        const sendFrom = index => {
            // The port may already be closing once done() ran.
            if (finished) {
                return;
            }
            if (index >= frames.length) {
                finish();
                return;
            }
            this._send(frames[index].buffer, sendInfo => {
                if (!sendInfo || !sendInfo.resultCode) {
                    written++;
                }
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
                this.streams.setInterval(msgid, this._baseIntervals.get(msgid));
            }
        });
    }

    _codeName(code) {
        return this._msp.getCodeName ? this._msp.getCodeName(code) : String(code);
    }

    // Diagnostic line: which covered reads went on the wire and which were answered from telemetry.
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
        this._statsLog('MAVLink telemetry, last ' + seconds + ' s: wire ' + this._formatCounts(this.counts.wire) +
            ', virtual ' + this._formatCounts(this.counts.virtual));
        this.resetCounts();
    }
}

export default MavlinkTelemetryFeed;
