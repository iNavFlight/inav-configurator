#!/usr/bin/env node
/**
 * MSP_SET_REBOOT over a MAVLink tunnel that survives the reboot: the real js/msp.js +
 * js/serial_queue.js (import specifiers rewritten only), the real MavlinkLink and the real
 * TunnelRebootMonitor against a fake FC on Node's mock timers. The FC replies before it
 * reboots, so a missing reply is a lost request or a lost reply, and a blind resend would
 * reboot a freshly started FC twice. Silence marks a candidate, the FC's uptime
 * (MSP2_INAV_MISC2) decides; a resend needs a positive uptime reading.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MavlinkParser } from '../js/mavlink/mavlinkParser.js';
import { MavlinkLink } from '../js/mavlink/mavlinkLink.js';
import { MAVLINK_MSG_ID, encodeFrameV2, getMessageInfo, concatFrames } from '../js/mavlink/mavlinkProtocol.js';
import { buildTunnelPayload } from '../js/mavlink/mavlinkTunnel.js';
import {
    TunnelRebootMonitor,
    readOnTimeSeconds,
    REBOOT_BACK_TIMEOUT_MS,
    REBOOT_REPLY_WATCHDOG_MS,
    REBOOT_UPTIME_WATCHDOG_MS,
} from '../js/mavlink/tunnelRebootMonitor.js';
import { loadMspCore, mspV2Reply, resetMspCore } from './helpers/mspCore.mjs';

const { MSP, mspQueue, MSPCodes, CONFIGURATOR, mspDeduplicationQueue } =
    await loadMspCore(import.meta.url, 'msp-tunnel-reboot.test.mjs', 'msp-tunnel-reboot-');

globalThis.$ = () => ({ html() {} });
MSP.init();

// Stand-in for MSPHelper.completeRequest: fire and remove the first pending callback of the code.
MSP.setProcessData((handler) => {
    for (let i = handler.callbacks.length - 1; i >= 0; i--) {
        const pending = handler.callbacks[i];
        if (pending.code == handler.code) {
            clearTimeout(pending.timer);
            mspDeduplicationQueue.remove(handler.code);
            handler.callbacks.splice(i, 1);
            if (pending.onFinish) {
                pending.onFinish({ command: handler.code, data: new DataView(handler.message_buffer, 0) });
            }
            break;
        }
    }
});

const REPLY_DELAY_MS = 3;
const REBOOT_REPLY_WINDOW_MS = 5000;
// Long enough that "not rebooted" can never be mistaken for a fresh boot.
const FC_UPTIME_AT_START_MS = 600000;

let monitor = null;
let fc = null;
const link = new MavlinkLink({
    onTunnelChunk: (bytes) => {
        mspQueue.notifyTunnelProgress();
        MSP.read({ data: bytes });
    },
    onMessage: (frame) => {
        if (frame.sysid === 1 && frame.compid === 1) {
            monitor.noteFcActivity();
        }
    },
});
link.lockTarget(1, 1);

CONFIGURATOR.connection = {
    bitrate: 115200,
    getTimeout: () => 3000,
    send(data, callback) {
        if (callback) {
            callback({ bytesSent: data.byteLength });
        }
        fc.receive(new Uint8Array(data));
    },
};

function u32(value) {
    return [value & 0xFF, (value >>> 8) & 0xFF, (value >>> 16) & 0xFF, value >>> 24];
}

/**
 * Answers every MSP request while reachable; MSP2_INAV_MISC2 carries its uptime in seconds.
 * MSP_SET_REBOOT: reply first, then down for rebootMs (unless armed). fadeOnRequestMs: the first
 * reboot request (delivered or not) is followed by a link fade of that length, FC still running.
 * dropMisc2: that many MSP2_INAV_MISC2 requests go unanswered (Infinity: all).
 * Streams a heartbeat (and optionally SYS_STATUS) while reachable.
 */
class FakeFc {
    constructor({ rebootMs = 2000, armed = false, dropRequests = 0, dropReplies = 0, statusHz = 2,
        heartbeatJitterMs = 0, fadeOnRequestMs = 0, dropMisc2 = 0 } = {}) {
        Object.assign(this, { rebootMs, armed, dropRequests, dropReplies, heartbeatJitterMs, fadeOnRequestMs, dropMisc2 });
        this.up = true;
        this.bootAt = Date.now() - FC_UPTIME_AT_START_MS;
        this.fadeUntil = 0;
        this.rebootRequests = 0;
        this.reboots = 0;
        this.uptimeReads = 0;
        this.seq = 0;
        this.timers = [];
        this.scheduleHeartbeat();
        if (statusHz > 0) {
            this.timers.push(setInterval(() => this.emit(MAVLINK_MSG_ID.SYS_STATUS), 1000 / statusHz));
        }
    }

    reachable() {
        return this.up && Date.now() >= this.fadeUntil;
    }

    scheduleHeartbeat(odd = false) {
        const jitter = odd ? this.heartbeatJitterMs : -this.heartbeatJitterMs;
        this.heartbeatTimer = setTimeout(() => {
            this.emit(MAVLINK_MSG_ID.HEARTBEAT);
            this.scheduleHeartbeat(!odd);
        }, 1000 + jitter);
    }

    emit(msgid) {
        if (!this.reachable()) {
            return;
        }
        const payload = new Uint8Array(getMessageInfo(msgid).length);
        if (msgid === MAVLINK_MSG_ID.HEARTBEAT) {
            payload[4] = 1;
        }
        link.ingest(encodeFrameV2(msgid, payload, 1, 1, this.seq++ & 0xFF));
    }

    receive(wire) {
        const bytes = [];
        for (const frame of new MavlinkParser().ingest(wire)) {
            if (frame.msgid === MAVLINK_MSG_ID.TUNNEL) {
                bytes.push(...frame.payload.subarray(5, 5 + frame.payload[4]));
            }
        }
        if (!this.reachable() || bytes.length < 6) {
            return;
        }
        const code = bytes[4] | (bytes[5] << 8);
        if (code === MSPCodes.MSP2_INAV_MISC2) {
            this.uptimeReads++;
            if (this.dropMisc2 > 0) {
                this.dropMisc2--;
            } else {
                // fc_msp.c:998-1004: u32 on-time s, u32 flight time s, u8 throttle %, u8 auto throttle.
                this.reply(code, [...u32(Math.floor((Date.now() - this.bootAt) / 1000)), 0, 0, 0, 0, 0, 0]);
            }
            return;
        }
        if (code !== MSPCodes.MSP_SET_REBOOT) {
            this.reply(code, [1, 2, 3]);
            return;
        }
        this.onRebootRequest();
    }

    onRebootRequest() {
        this.rebootRequests++;
        if (this.fadeOnRequestMs > 0) {
            const fadeMs = this.fadeOnRequestMs;
            this.fadeOnRequestMs = 0;
            setTimeout(() => {
                this.fadeUntil = Date.now() + fadeMs;
            }, REPLY_DELAY_MS + 1);
        }
        if (this.dropRequests > 0) {
            this.dropRequests--;
            return;
        }
        if (this.dropReplies > 0) {
            this.dropReplies--;
        } else {
            this.reply(MSPCodes.MSP_SET_REBOOT, []);
        }
        if (!this.armed) {
            setTimeout(() => this.reboot(), REPLY_DELAY_MS + 1);
        }
    }

    reply(code, payload) {
        const reply = mspV2Reply(code, Uint8Array.from(payload));
        const frame = encodeFrameV2(MAVLINK_MSG_ID.TUNNEL, buildTunnelPayload(reply, 253, 25), 1, 1, this.seq++ & 0xFF);
        setTimeout(() => {
            if (this.reachable()) {
                link.ingest(frame);
            }
        }, REPLY_DELAY_MS);
    }

    reboot() {
        this.up = false;
        this.reboots++;
        if (Number.isFinite(this.rebootMs)) {
            setTimeout(() => {
                this.up = true;
                this.bootAt = Date.now();
            }, this.rebootMs);
        }
    }

    stop() {
        clearTimeout(this.heartbeatTimer);
        this.timers.forEach(clearInterval);
    }
}

function startSession(t, fcOptions) {
    resetMspCore({ MSP, mspQueue, mspDeduplicationQueue, CONFIGURATOR });

    t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 1000000 });
    mspQueue.setTunnelMode(true);
    mspQueue.setTransportTransform((body) => concatFrames(link.wrapMsp(body)).buffer, () => link.resetReassembly());

    const session = { outcomes: [], logs: [], uptimes: [], started: 0, callerReplies: 0 };
    monitor = new TunnelRebootMonitor({
        // Same wiring as js/serial_backend.js.
        sendProbe: done => MSP.sendLinkProbe(MSPCodes.MSP_API_VERSION, response => done(response !== false), 0),
        resendReboot: () => MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false),
        readUptime: done => MSP.sendLinkProbe(MSPCodes.MSP2_INAV_MISC2, response => done(readOnTimeSeconds(response)), 1),
        onStart: () => session.started++,
        onBack: () => session.outcomes.push('back'),
        onNotRebooted: () => session.outcomes.push('notRebooted'),
        onGone: () => session.outcomes.push('gone'),
        log: (key, args) => {
            session.logs.push(key);
            if (args) {
                session.uptimes.push(args);
            }
        },
    });
    MSP.rebootTracker = monitor;
    fc = new FakeFc(fcOptions);
    t.after(() => {
        monitor.cancel();
        fc.stop();
        MSP.rebootTracker = null;
    });
    return session;
}

// The queue's executor is a real interval; drive it on the mock clock.
function advance(t, ms) {
    for (let elapsed = 0; elapsed < ms; elapsed += 10) {
        t.mock.timers.tick(10);
        mspQueue.executor();
    }
}

function sendReboot(session) {
    MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, () => session.callerReplies++);
}

const UPTIME = 'mavlinkTunnelRebootUptime';

// --- silence yes / uptime small: the normal reboot ---------------------------------------------

test('reply received, silent, then back with a small uptime: rebooted, reconnect once', (t) => {
    const session = startSession(t, { rebootMs: 2000 });
    sendReboot(session);
    advance(t, 1500);
    assert.equal(session.started, 1);
    assert.equal(session.callerReplies, 1, 'the caller sees the reply before the confirmation starts');
    assert.deepEqual(session.outcomes, []);

    advance(t, 2500);
    assert.deepEqual(session.outcomes, ['back']);
    assert.deepEqual(session.logs, ['mavlinkTunnelRebootWaiting', 'mavlinkTunnelRebootSilent', UPTIME, 'mavlinkTunnelRebootBack']);
    const [uptime, since] = session.uptimes[0];
    assert.ok(uptime < Number(since), `uptime ${uptime} s must be below ${since} s`);
    assert.equal(fc.rebootRequests, 1);
    assert.equal(fc.reboots, 1);
    assert.equal(monitor.active, false);
});

test('reply lost, FC already back inside the reply window: uptime confirms, no resend', (t) => {
    const session = startSession(t, { rebootMs: 2000, dropReplies: 1 });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + 200);
    assert.deepEqual(session.outcomes, ['back']);
    assert.deepEqual(session.logs, ['mavlinkTunnelRebootSilent', 'mavlinkTunnelRebootReplyLost', UPTIME, 'mavlinkTunnelRebootBack']);
    assert.equal(session.callerReplies, 1, 'the confirmed reboot completes the caller once, as its reply would have');

    advance(t, 5000);
    assert.equal(fc.rebootRequests, 1, 'a resend would reboot the freshly started FC a second time');
    assert.equal(fc.reboots, 1);
});

test('reply lost, FC still rebooting when the window closes: waits for it, then confirms', (t) => {
    const session = startSession(t, { rebootMs: 8000, dropReplies: 1 });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + 1000);
    assert.deepEqual(session.outcomes, []);
    advance(t, 3500);
    assert.deepEqual(session.outcomes, ['back']);
    assert.equal(fc.rebootRequests, 1);
});

// --- silence yes / uptime large: a link fade, not a reboot ---------------------------------------

test('reply received, then a link fade: silence and answers again, but the uptime says no reboot', (t) => {
    const session = startSession(t, { armed: true, fadeOnRequestMs: 2000 });
    sendReboot(session);
    advance(t, 3500);
    assert.deepEqual(session.outcomes, ['notRebooted']);
    assert.deepEqual(session.logs, ['mavlinkTunnelRebootWaiting', 'mavlinkTunnelRebootSilent', UPTIME, 'mavlinkTunnelRebootNotRebooted']);
    assert.equal(fc.reboots, 0);
});

test('request lost during a link fade: the silence is not a reboot, the request is sent once more', (t) => {
    const session = startSession(t, { dropRequests: 1, fadeOnRequestMs: 2000 });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + 1000);
    assert.equal(fc.rebootRequests, 2, 'uptime large: the first request never arrived');
    assert.deepEqual(session.logs.slice(0, 4), ['mavlinkTunnelRebootSilent', 'mavlinkTunnelRebootReplyLost', UPTIME, 'mavlinkTunnelRebootResend']);
    advance(t, 4000);
    assert.deepEqual(session.outcomes, ['back']);
    assert.equal(fc.reboots, 1);
    assert.equal(session.started, 1, 'the resend continues the same confirmation');
    assert.equal(session.callerReplies, 1, 'the resend reply completes the original caller');
});

// --- silence no / uptime small: a reboot too short to be seen ------------------------------------

test('reply lost, short reboot on a heartbeat-only port: no silence seen, the uptime shows the reboot', (t) => {
    const session = startSession(t, { rebootMs: 800, dropReplies: 1, statusHz: 0 });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + 500);
    assert.equal(session.logs.includes('mavlinkTunnelRebootSilent'), false, 'the reboot hides between two heartbeats');
    assert.deepEqual(session.outcomes, ['back']);
    advance(t, 5000);
    assert.equal(fc.rebootRequests, 1, 'no second reboot');
    assert.equal(fc.reboots, 1);
});

test('reply received, reboot shorter than a probe gap: the uptime catches it at the 3 s check', (t) => {
    const session = startSession(t, { rebootMs: 300 });
    sendReboot(session);
    advance(t, 4000);
    assert.equal(session.logs.includes('mavlinkTunnelRebootSilent'), false);
    assert.deepEqual(session.outcomes, ['back']);
    assert.equal(fc.reboots, 1);
});

// --- silence no / uptime large: the request was lost, or the FC refused -------------------------

test('request lost: the FC answers at once with a large uptime, so the reboot is sent once more', (t) => {
    const session = startSession(t, { rebootMs: 2000, dropRequests: 1 });
    sendReboot(session);
    // The resend waits out the lapsed request's 500 ms stale watch: a late reply must not answer it.
    advance(t, REBOOT_REPLY_WINDOW_MS + 1000);
    assert.deepEqual(session.logs, ['mavlinkTunnelRebootReplyLost', UPTIME, 'mavlinkTunnelRebootResend', 'mavlinkTunnelRebootWaiting']);
    assert.equal(fc.rebootRequests, 2);

    advance(t, 4000);
    assert.deepEqual(session.outcomes, ['back']);
    assert.equal(fc.reboots, 1);
});

test('request lost on a heartbeat-only link with jitter: 1 s heartbeat gaps are not a reboot', (t) => {
    const session = startSession(t, { rebootMs: 2000, dropRequests: 1, statusHz: 0, heartbeatJitterMs: 60 });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + 1000);
    assert.equal(fc.rebootRequests, 2);
    advance(t, 4000);
    assert.deepEqual(session.outcomes, ['back']);
    assert.equal(fc.reboots, 1);
});

test('reply received but the FC never goes silent (armed): the uptime confirms, stays connected', (t) => {
    const session = startSession(t, { armed: true });
    sendReboot(session);
    advance(t, 4000);
    assert.deepEqual(session.outcomes, ['notRebooted']);
    assert.deepEqual(session.logs, ['mavlinkTunnelRebootWaiting', UPTIME, 'mavlinkTunnelRebootNotRebooted']);
    assert.equal(fc.rebootRequests, 1);
});

test('request lost twice: one resend only, then not rebooted', (t) => {
    const session = startSession(t, { dropRequests: 2 });
    sendReboot(session);
    advance(t, 2 * (REBOOT_REPLY_WINDOW_MS + 1000));
    assert.equal(fc.rebootRequests, 2);
    assert.deepEqual(session.outcomes, ['notRebooted']);
    assert.equal(session.callerReplies, 0);
});

// --- uptime unavailable: never a resend without a positive reading --------------------------------

test('MSP2_INAV_MISC2 lost twice after a silent reboot: the silence verdict stands', (t) => {
    const session = startSession(t, { rebootMs: 2000, dropMisc2: Infinity });
    sendReboot(session);
    advance(t, 6000);
    assert.deepEqual(session.outcomes, ['back']);
    assert.equal(fc.uptimeReads, 2, 'one retry, no more');
    assert.ok(session.logs.includes('mavlinkTunnelRebootUptimeUnavailable'));
    assert.equal(session.logs.includes(UPTIME), false);
});

test('reply lost, sub-1.5 s reboot, MISC2 lost twice then answered: rebooted, no resend', (t) => {
    const session = startSession(t, { rebootMs: 800, dropReplies: 1, statusHz: 0, dropMisc2: 2 });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + 4000);
    assert.equal(session.logs.includes('mavlinkTunnelRebootSilent'), false);
    assert.ok(session.logs.indexOf('mavlinkTunnelRebootUptimeUnavailable') < session.logs.indexOf(UPTIME));
    assert.deepEqual(session.outcomes, ['back']);
    advance(t, 5000);
    assert.equal(fc.rebootRequests, 1, 'the silence rule alone would have resent here');
    assert.equal(fc.reboots, 1);
});

test('request lost and the uptime never readable: no resend, not rebooted after 15 s', (t) => {
    const session = startSession(t, { rebootMs: 2000, dropRequests: 1, dropMisc2: Infinity });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + REBOOT_BACK_TIMEOUT_MS - 500);
    assert.deepEqual(session.outcomes, []);
    advance(t, 1000);
    assert.deepEqual(session.outcomes, ['notRebooted']);
    assert.equal(fc.rebootRequests, 1);
    assert.ok(fc.uptimeReads > 2, 'the uptime is retried within the 15 s budget');
});

// --- watchdogs, cancel, a second request ---------------------------------------------------------

test('an abandoned reboot request (no callback ever) is treated as lost after 10 s', (t) => {
    const session = startSession(t, { rebootMs: 2000, dropRequests: 1 });
    sendReboot(session);
    advance(t, 50);
    // What GUI.tab_switch_cleanup() does to a pending request.
    MSP.callbacks_cleanup();
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    advance(t, REBOOT_REPLY_WATCHDOG_MS - 600);
    assert.equal(session.logs.includes('mavlinkTunnelRebootReplyLost'), false);
    advance(t, 1000);
    assert.equal(session.logs[0], 'mavlinkTunnelRebootReplyLost');
    advance(t, 5000);
    assert.equal(fc.rebootRequests, 2, 'uptime large: resent once');
    assert.deepEqual(session.outcomes, ['back']);
});

test('an uptime read that never calls back ends after 3 s like an unreadable one', (t) => {
    const session = startSession(t, { rebootMs: 2000 });
    const readUptime = monitor.deps.readUptime;
    let reads = 0;
    monitor.deps.readUptime = (done) => {
        reads++;
        if (reads > 1) {
            readUptime(done);
        }
    };
    sendReboot(session);
    advance(t, 3000);
    assert.equal(reads, 1);
    assert.deepEqual(session.outcomes, []);
    advance(t, REBOOT_UPTIME_WATCHDOG_MS);
    assert.ok(session.logs.includes('mavlinkTunnelRebootUptimeUnavailable'));
    assert.deepEqual(session.outcomes, ['back'], 'the silence verdict stands');
});

test('cancel() mid-flow: no outcome, no probes, late replies and frames ignored', (t) => {
    const session = startSession(t, { rebootMs: 2000 });
    sendReboot(session);
    advance(t, 1500);
    monitor.cancel();
    assert.equal(monitor.active, false);
    const logs = session.logs.length;
    advance(t, REBOOT_BACK_TIMEOUT_MS + 5000);
    monitor.noteFcActivity();
    assert.deepEqual(session.outcomes, []);
    assert.equal(session.logs.length, logs);
});

test('a second MSP_SET_REBOOT while a reboot is confirmed is not sent and changes nothing', (t) => {
    const session = startSession(t, { rebootMs: 2000 });
    sendReboot(session);
    advance(t, 500);
    const requestedAt = monitor.requestedAt;
    let secondCalled = false;
    assert.equal(MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, () => { secondCalled = true; }), false);
    assert.equal(monitor.requestedAt, requestedAt);
    assert.ok(session.logs.includes('mavlinkTunnelRebootAlreadyRunning'));
    advance(t, 4000);
    assert.equal(fc.rebootRequests, 1);
    assert.equal(secondCalled, false);
    assert.deepEqual(session.outcomes, ['back']);
    assert.equal(session.callerReplies, 1);
});

test('probe and uptime reads that go unanswered are not recorded as lost replies', (t) => {
    const session = startSession(t, { rebootMs: 2000, dropMisc2: Infinity });
    sendReboot(session);
    advance(t, 6000);
    assert.deepEqual(session.outcomes, ['back']);
    assert.equal(MSP.lostReplies.size, 0, 'a lost probe must not block unpaired writes');
});

// --- the FC never returns -----------------------------------------------------------------------

test('the FC never comes back: after 15 s the user is told to reconnect', (t) => {
    const session = startSession(t, { rebootMs: Infinity });
    sendReboot(session);
    advance(t, REBOOT_BACK_TIMEOUT_MS - 500);
    assert.deepEqual(session.outcomes, []);
    advance(t, 1000);
    assert.deepEqual(session.outcomes, ['gone']);
    assert.equal(session.logs.at(-1), 'mavlinkTunnelRebootNotBack');
    assert.equal(fc.rebootRequests, 1);
});

test('reply and FC both lost for good: after the reply window it waits 15 s, never resends', (t) => {
    const session = startSession(t, { rebootMs: Infinity, dropReplies: 1 });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + REBOOT_BACK_TIMEOUT_MS + 1000);
    assert.deepEqual(session.outcomes, ['gone']);
    assert.equal(fc.rebootRequests, 1);
});

test('a lost MSP_SET_REBOOT reply does not report a lost write', (t) => {
    const session = startSession(t, { rebootMs: 2000, dropReplies: 1 });
    const lostWrites = [];
    MSP.onWriteLost = code => lostWrites.push(code);
    t.after(() => {
        MSP.onWriteLost = null;
    });
    sendReboot(session);
    advance(t, REBOOT_REPLY_WINDOW_MS + 100);
    assert.deepEqual(lostWrites, []);
});
