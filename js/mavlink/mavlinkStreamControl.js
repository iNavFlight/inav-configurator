'use strict';

import { MAV_CMD_SET_MESSAGE_INTERVAL, MAV_RESULT_ACCEPTED } from './mavlinkProtocol.js';

// The FC parses one MAVLink message per telemetry cycle; spaced commands never pile up in its RX buffer.
export const COMMAND_SPACING_MS = 50;
export const COMMAND_ACK_TIMEOUT_MS = 500;
// The ack shares the link with tunnel replies; on a slow radio it can take longer than a fixed 500 ms.
const ACK_TIMEOUT_ROUND_TRIPS = 3;
// A lost command or ack is resent once; SET_MESSAGE_INTERVAL is idempotent.
const COMMAND_ATTEMPTS = 2;
// A message arriving at the requested rate proves the command took effect even if its ack was lost.
export const IMPLICIT_ACK_WINDOW_MS = 2000;
// The FC reschedules one interval after each send, so streams run slightly slow (SITL: 9.3-9.7 Hz at 10 Hz).
const IMPLICIT_ACK_RATE_TOLERANCE = 0.8;

// One command in flight: COMMAND_ACK names the command but not the message id it answers.
export class MavlinkStreamControl {

    constructor(options) {
        this._sendCommand = options.sendCommand;
        this._log = options.log || (() => {});
        this._now = options.now || (() => Date.now());
        this._roundTripMs = options.roundTripMs || (() => 0);
        this._requested = new Map();
        this._arrivals = new Map();
        this._queue = [];
        this._inFlight = null;
        this._ackTimer = null;
        this._spacingTimer = null;
        this._accepted = new Map();
        this._touched = new Set();
        this._basePending = null;
        this._onBaseDone = null;
        this._baseAccepted = 0;
        this._baseTotal = 0;
        this._stopped = false;
        this._graceTimers = new Set();
    }

    requestBase(intervals, onDone) {
        this._basePending = new Set(intervals.keys());
        this._onBaseDone = onDone;
        this._baseAccepted = 0;
        this._baseTotal = intervals.size;
        intervals.forEach((intervalUs, msgid) => this.setInterval(msgid, intervalUs));
    }

    // Never more than one command per id and change: a queued command is updated, not queued twice.
    setInterval(msgid, intervalUs) {
        if (this._stopped) {
            return;
        }
        if (this._requested.get(msgid)?.intervalUs !== intervalUs) {
            this._requested.set(msgid, { intervalUs, at: this._now() });
            this._arrivals.delete(msgid);
        }
        const queued = this._queue.find(command => command.msgid === msgid);
        if (queued) {
            queued.intervalUs = intervalUs;
            if (intervalUs === this._effectiveTarget(msgid)) {
                this._queue.splice(this._queue.indexOf(queued), 1);
            }
            return;
        }
        if (intervalUs === this._effectiveTarget(msgid)) {
            return;
        }
        this._queue.push({ msgid, intervalUs, attempts: 0 });
        this._pump();
    }

    acceptedIntervalUs(msgid) {
        return this._accepted.get(msgid);
    }

    // Sends the current interval again, e.g. after an FC reboot dropped it; ignored while one is pending.
    reRequest(msgid) {
        const requested = this._requested.get(msgid);
        const pending = this._queue.some(command => command.msgid === msgid) || this._inFlight?.msgid === msgid;
        if (this._stopped || !requested || pending) {
            return false;
        }
        this._queue.push({ msgid, intervalUs: requested.intervalUs, attempts: 0 });
        this._pump();
        return true;
    }

    // Called for every telemetry message from the FC.
    noteMessage(msgid) {
        const requested = this._requested.get(msgid);
        if (!requested || requested.intervalUs <= 0 || this._accepted.get(msgid) === requested.intervalUs) {
            return;
        }
        const now = this._now();
        const arrivals = (this._arrivals.get(msgid) || []).filter(at => now - at < IMPLICIT_ACK_WINDOW_MS);
        arrivals.push(now);
        this._arrivals.set(msgid, arrivals);
        const expected = Math.max(2, Math.round(IMPLICIT_ACK_RATE_TOLERANCE * IMPLICIT_ACK_WINDOW_MS * 1000 / requested.intervalUs));
        if (now - requested.at >= IMPLICIT_ACK_WINDOW_MS && arrivals.length >= expected) {
            this._acceptImplicitly(msgid, requested.intervalUs);
        }
    }

    handleAck(ack) {
        const command = this._inFlight;
        if (!command || ack.command !== MAV_CMD_SET_MESSAGE_INTERVAL) {
            return false;
        }
        this._clearAckTimer();
        this._inFlight = null;
        const accepted = ack.result === MAV_RESULT_ACCEPTED;
        if (accepted) {
            this._accepted.set(command.msgid, command.intervalUs);
        }
        this._log('MAVLink SET_MESSAGE_INTERVAL ' + command.msgid + ' -> ' + command.intervalUs + ' us: ' +
            (accepted ? 'accepted' : 'result ' + ack.result));
        this._finish(command, accepted);
        return true;
    }

    stop() {
        this._stopped = true;
        this._clearAckTimer();
        this._graceTimers.forEach(timer => clearTimeout(timer));
        this._graceTimers.clear();
        clearTimeout(this._spacingTimer);
        this._spacingTimer = null;
        this._queue = [];
        this._inFlight = null;
        return Array.from(this._touched);
    }

    isIdle() {
        return this._inFlight === null && this._queue.length === 0;
    }

    _acceptImplicitly(msgid, intervalUs) {
        this._accepted.set(msgid, intervalUs);
        this._arrivals.delete(msgid);
        this._log('MAVLink SET_MESSAGE_INTERVAL ' + msgid + ' -> ' + intervalUs + ' us: implicitly acknowledged by its rate');
        this._queue = this._queue.filter(command => command.msgid !== msgid || command.intervalUs !== intervalUs);
        this._resolveBase(msgid, true);
    }

    _effectiveTarget(msgid) {
        if (this._inFlight && this._inFlight.msgid === msgid) {
            return this._inFlight.intervalUs;
        }
        return this._accepted.get(msgid);
    }

    _pump() {
        if (this._stopped || this._inFlight || this._spacingTimer || this._queue.length === 0) {
            return;
        }
        this._transmit(this._queue.shift());
    }

    _transmit(command) {
        command.attempts++;
        this._inFlight = command;
        this._touched.add(command.msgid);
        const timeoutMs = Math.max(COMMAND_ACK_TIMEOUT_MS, ACK_TIMEOUT_ROUND_TRIPS * this._roundTripMs());
        this._ackTimer = setTimeout(() => this._onAckTimeout(command), timeoutMs);
        this._sendCommand(command.msgid, command.intervalUs);
    }

    _onAckTimeout(command) {
        this._ackTimer = null;
        if (this._inFlight !== command) {
            return;
        }
        this._inFlight = null;
        const alreadyInEffect = this._accepted.get(command.msgid) === command.intervalUs;
        const superseded = this._queue.some(queued => queued.msgid === command.msgid);
        if (!alreadyInEffect && !superseded && command.attempts < COMMAND_ATTEMPTS) {
            this._queue.unshift(command);
            this._scheduleNext();
            return;
        }
        if (superseded || alreadyInEffect) {
            this._finish(command, alreadyInEffect);
            return;
        }
        this._log('MAVLink SET_MESSAGE_INTERVAL ' + command.msgid + ' -> ' + command.intervalUs + ' us: no ack');
        this._scheduleNext();
        // The base result waits one implicit-ack window: the stream may prove the command arrived.
        const grace = setTimeout(() => {
            this._graceTimers.delete(grace);
            this._resolveBase(command.msgid, this._accepted.get(command.msgid) === command.intervalUs);
        }, IMPLICIT_ACK_WINDOW_MS);
        this._graceTimers.add(grace);
    }

    _finish(command, accepted) {
        // A superseded base command is resolved by the command that replaced it.
        if (!this._queue.some(queued => queued.msgid === command.msgid)) {
            this._resolveBase(command.msgid, accepted);
        }
        this._scheduleNext();
    }

    _resolveBase(msgid, accepted) {
        if (!this._basePending?.delete(msgid)) {
            return;
        }
        this._baseAccepted += accepted ? 1 : 0;
        if (this._basePending.size === 0) {
            this._basePending = null;
            if (this._onBaseDone) {
                this._onBaseDone(this._baseAccepted, this._baseTotal);
            }
        }
    }

    _scheduleNext() {
        clearTimeout(this._spacingTimer);
        this._spacingTimer = setTimeout(() => {
            this._spacingTimer = null;
            this._pump();
        }, COMMAND_SPACING_MS);
    }

    _clearAckTimer() {
        clearTimeout(this._ackTimer);
        this._ackTimer = null;
    }
}

export default MavlinkStreamControl;
