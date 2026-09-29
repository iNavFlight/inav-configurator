'use strict';

import MSPCodes from '../msp/MSPCodes.js';

export const REBOOT_PROBE_INTERVAL_MS = 500;
export const REBOOT_SILENCE_MS = 1000;
// Without probes only MAVLink frames show the FC is alive; a heartbeat-only port sends one per second.
export const REBOOT_FRAME_SILENCE_MS = 1500;
// Reply received but the FC never went silent: it refused the reboot (armed).
export const REBOOT_NO_SILENCE_MS = 3000;
export const REBOOT_BACK_TIMEOUT_MS = 15000;
// The queue drops the callback of an abandoned request; the reboot must not wait for it forever.
export const REBOOT_REPLY_WATCHDOG_MS = 10000;
// Queue time on top of the tunnel silence windows a monitor read may wait (2000 / 3000 ms at the 500 ms window).
export const REBOOT_WATCHDOG_MARGIN_MS = 1500;
// A probe has one attempt. The uptime read: a probe still pending ahead of it, then two MSP2_INAV_MISC2 attempts.
const PROBE_WATCHDOG_WINDOWS = 1;
const UPTIME_WATCHDOG_WINDOWS = 3;

const PHASE_IDLE = 'idle';
const PHASE_AWAIT_REPLY = 'awaitReply';
const PHASE_PROBING = 'probing';
const PHASE_VERIFY = 'verify';

/**
 * MSP_SET_REBOOT over a link that survives the reboot (MAVLink tunnel): the FC flushes the
 * reply before rebooting, so a missing reply means a lost request or a lost reply chunk.
 * Silence then an answer marks a candidate; the FC's uptime decides, since a link fade looks
 * the same and a fast reboot can hide between two heartbeats. Never a blind resend.
 */
export class TunnelRebootMonitor {

    constructor(deps) {
        this.deps = deps;
        this.silenceWindowMs = deps.silenceWindowMs;
        this.phase = PHASE_IDLE;
        this.timer = null;
        this.token = 0;
        this.verifyToken = 0;
    }

    get active() {
        return this.phase !== PHASE_IDLE;
    }

    // Wraps the caller's callback of an MSP_SET_REBOOT about to be queued; null = do not send it.
    track(callback) {
        const now = Date.now();
        if (this.phase === PHASE_IDLE) {
            this.callerCallback = callback || null;
            this.startFlow(now);
        } else if (this.resendPending) {
            this.resendPending = false;
        } else {
            this.deps.log('mavlinkTunnelRebootAlreadyRunning');
            return null;
        }
        this.phase = PHASE_AWAIT_REPLY;
        this.requestedAt = now;
        const token = ++this.token;
        return (response) => {
            if (this.phase !== PHASE_AWAIT_REPLY || this.token !== token) {
                return;
            }
            if (response === false) {
                this.onReplyLost();
                return;
            }
            try {
                this.notifyCaller(response);
            } finally {
                this.onReplyReceived();
            }
        };
    }

    notifyCaller(response) {
        const callback = this.callerCallback;
        this.callerCallback = null;
        if (callback) {
            callback(response);
        }
    }

    // Any MAVLink frame from the FC, heartbeats included.
    noteFcActivity() {
        if (this.active) {
            this.onActivity(Date.now());
        }
    }

    cancel() {
        this.stop();
    }

    startFlow(now) {
        this.resent = false;
        this.resendPending = false;
        this.lastHeardAt = now;
        this.silenceSeen = false;
        this.backSeen = false;
        this.deps.onStart();
        this.timer = setInterval(() => this.tick(), REBOOT_PROBE_INTERVAL_MS);
    }

    onReplyReceived() {
        this.deps.log('mavlinkTunnelRebootWaiting');
        // Only silence after the reply counts: a link fade before it proves nothing.
        this.silenceSeen = false;
        this.backSeen = false;
        this.lastHeardAt = Date.now();
        this.startProbing('afterReply');
    }

    onReplyLost() {
        this.deps.log('mavlinkTunnelRebootReplyLost');
        this.startProbing('afterLoss');
    }

    startProbing(mode) {
        this.phase = PHASE_PROBING;
        this.mode = mode;
        this.probingSince = Date.now();
        this.probeAnswered = false;
        this.probe = null;
        // The FC may have rebooted and come back inside the reply window already.
        if (this.backSeen) {
            this.verify(true);
            return;
        }
        this.sendProbe();
    }

    onActivity(now) {
        this.checkSilence(now);
        this.lastHeardAt = now;
        if (!this.silenceSeen) {
            return;
        }
        this.backSeen = true;
        if (this.phase === PHASE_PROBING) {
            this.verify(true);
        }
    }

    checkSilence(now) {
        const threshold = this.phase === PHASE_PROBING ? REBOOT_SILENCE_MS : REBOOT_FRAME_SILENCE_MS;
        if (!this.silenceSeen && now - this.lastHeardAt >= threshold) {
            this.silenceSeen = true;
            this.deps.log('mavlinkTunnelRebootSilent');
        }
    }

    tick() {
        const now = Date.now();
        this.checkSilence(now);
        if (this.phase === PHASE_AWAIT_REPLY) {
            if (now - this.requestedAt >= REBOOT_REPLY_WATCHDOG_MS) {
                this.onReplyLost();
            }
            return;
        }
        // After a received reply the uptime check always ends in finish(), bounded by its own watchdog.
        if (this.phase === PHASE_VERIFY && (this.mode === 'afterReply' || now - this.probingSince < REBOOT_BACK_TIMEOUT_MS)) {
            if (now - this.verifyStartedAt >= this.uptimeWatchdogMs()) {
                this.onUptime(null);
            }
            return;
        }
        if (this.phase !== PHASE_PROBING && this.phase !== PHASE_VERIFY) {
            return;
        }
        const outcome = this.probingOutcome(now);
        if (outcome === 'verify') {
            this.verify(false);
            return;
        }
        if (outcome) {
            this.finish(outcome);
            return;
        }
        this.sendProbe();
    }

    probingOutcome(now) {
        const elapsed = now - this.probingSince;
        if (elapsed >= REBOOT_BACK_TIMEOUT_MS) {
            // Alive without a readable uptime: whether it rebooted is unknown, so no resend.
            // After a lost reply, back after a silence is no verdict either: a link fade looks the same.
            const alive = this.silenceSeen ? this.mode === 'afterLoss' && this.backSeen : this.probeAnswered;
            return alive ? 'onNotRebooted' : 'onGone';
        }
        // Never silent after the reply: refused (armed), unless the reboot was shorter than a probe gap.
        if (!this.silenceSeen && this.mode === 'afterReply' && elapsed >= REBOOT_NO_SILENCE_MS) {
            return 'verify';
        }
        return null;
    }

    // silent: the silence rule already says "rebooted"; after a received reply it stands if the uptime cannot be read.
    verify(silent) {
        this.phase = PHASE_VERIFY;
        this.verifySilent = silent;
        this.verifyStartedAt = Date.now();
        const token = ++this.verifyToken;
        this.deps.readUptime((seconds) => {
            if (this.phase === PHASE_VERIFY && this.verifyToken === token) {
                this.onUptime(seconds);
            }
        });
    }

    onUptime(seconds) {
        this.verifyToken++;
        if (seconds === null) {
            this.onUptimeUnavailable();
            return;
        }
        const sinceRequestS = (Date.now() - this.requestedAt) / 1000;
        this.deps.log('mavlinkTunnelRebootUptime', [seconds, sinceRequestS.toFixed(1)]);
        if (seconds < sinceRequestS) {
            this.finish('onBack');
        } else if (this.mode === 'afterLoss' && !this.resent) {
            this.resendReboot();
        } else {
            this.finish('onNotRebooted');
        }
    }

    onUptimeUnavailable() {
        this.deps.log('mavlinkTunnelRebootUptimeUnavailable');
        if (this.mode === 'afterReply') {
            this.finish(this.verifySilent ? 'onBack' : 'onNotRebooted');
        } else {
            // The request may never have arrived and a fade looks like a reboot: only an uptime reading
            // decides, so the next sign of life tries again.
            this.phase = PHASE_PROBING;
        }
    }

    // The FC is up and has not rebooted since the request: the request itself was lost. One more try.
    resendReboot() {
        this.resent = true;
        this.resendPending = true;
        this.phase = PHASE_AWAIT_REPLY;
        this.requestedAt = Date.now();
        this.silenceSeen = false;
        this.backSeen = false;
        this.lastHeardAt = this.requestedAt;
        this.deps.log('mavlinkTunnelRebootResend');
        this.deps.resendReboot();
        this.resendPending = false;
    }

    sendProbe() {
        const now = Date.now();
        if (this.probe && now - this.probe.sentAt < this.probeWatchdogMs()) {
            return;
        }
        const probe = { sentAt: now };
        this.probe = probe;
        this.deps.sendProbe((answered) => {
            if (this.probe !== probe || this.phase !== PHASE_PROBING) {
                return;
            }
            this.probe = null;
            if (!answered) {
                return;
            }
            this.probeAnswered = true;
            this.onActivity(Date.now());
            // Answering at once after a lost reply: rebooted fast, or the request was lost.
            if (this.phase === PHASE_PROBING && this.mode === 'afterLoss') {
                this.verify(false);
            }
        });
    }

    finish(outcome) {
        this.stop();
        if (outcome === 'onGone') {
            this.deps.log('mavlinkTunnelRebootNotBack');
        } else if (outcome === 'onNotRebooted') {
            this.deps.log('mavlinkTunnelRebootNotRebooted');
        } else {
            this.deps.log('mavlinkTunnelRebootBack');
        }
        try {
            // A reboot confirmed without its reply still completes the caller (e.g. closes its saving dialog).
            if (outcome === 'onBack') {
                this.notifyCaller({ command: MSPCodes.MSP_SET_REBOOT });
            }
        } finally {
            this.callerCallback = null;
            this.deps[outcome]();
        }
    }

    probeWatchdogMs() {
        return PROBE_WATCHDOG_WINDOWS * this.silenceWindowMs() + REBOOT_WATCHDOG_MARGIN_MS;
    }

    uptimeWatchdogMs() {
        return UPTIME_WATCHDOG_WINDOWS * this.silenceWindowMs() + REBOOT_WATCHDOG_MARGIN_MS;
    }

    stop() {
        clearInterval(this.timer);
        this.timer = null;
        this.phase = PHASE_IDLE;
        this.probe = null;
        this.token++;
    }
}

export default TunnelRebootMonitor;
