'use strict';

import CONFIGURATOR from './data_storage';
import MSPCodes from './msp/MSPCodes';
import SimpleSmoothFilter from './simple_smooth_filter';
import eventFrequencyAnalyzer from './eventFrequencyAnalyzer';
import mspDeduplicationQueue from './msp/mspDeduplicationQueue';

// Tunnel replies arrive in chunks; silence this long since the last one means a chunk was lost.
const TUNNEL_SILENCE_MIN_MS = 500;
const TUNNEL_SILENCE_MAX_MS = 3000;
// A wire this slow cannot carry the telemetry feed's base set (measured at 4800 baud).
const TUNNEL_SLOW_SERIAL_MAX_BAUD = 9600;
// A reply may queue behind a full FC TX ring (255 B), then its own chunk (145 B) after our request (60 B).
const TUNNEL_SERIAL_WORST_CASE_BYTES = 460;
const TUNNEL_SERIAL_MARGIN_MS = 200;
// Headroom over the slowest reply seen; a decaying maximum, since an average sags between bursts.
const TUNNEL_LEARNED_HEADROOM = 1.5;
const TUNNEL_LEARNED_DECAY = 0.9;
const TUNNEL_LEARNED_DECAY_PERIOD_MS = 60000;
// Flash erase blocks the FC for well over a second before the first reply byte.
const TUNNEL_SLOW_REQUEST_TIMEOUT_MS = 5000;
// NAND has no chip erase: W25N02KV / MX35LF2G have 2048 blocks and the driver waits up to 15 ms per block (~31 s).
const TUNNEL_ERASE_TIMEOUT_MS = 40000;
// Handlers that block before replying (fc_msp.c, maintenance-10.x).
const TUNNEL_SLOW_REQUEST_CODES = new Set([
    MSPCodes.MSP_EEPROM_WRITE,
    MSPCodes.MSP_SET_REBOOT,
    MSPCodes.MSP_SELECT_SETTING,
    MSPCodes.MSP_RESET_CONF,
    MSPCodes.MSP_WP_MISSION_SAVE,
    MSPCodes.MSP2_INAV_SELECT_BATTERY_PROFILE,
    MSPCodes.MSP2_INAV_SELECT_MIXER_PROFILE,
    MSPCodes.MSP_DATAFLASH_ERASE,
]);
const TUNNEL_DEFAULT_RETRIES = 1;
// After a retry was answered, the other attempt's reply may still be on its way.
const TUNNEL_DUPLICATE_WATCH_MAX_MS = 2000;

var mspQueue = function () {

    var publicScope = {},
        privateScope = {};

    privateScope.handlerFrequency = 100;
    privateScope.balancerFrequency = 20;

    privateScope.loadFilter = new SimpleSmoothFilter(1, 0.85);
    privateScope.roundtripFilter = new SimpleSmoothFilter(20, 0.95);
    privateScope.hardwareRoundtripFilter = new SimpleSmoothFilter(10, 0.95);

    /**
     * Target load for MSP queue. When load is above target, throttling might start to appear
     * @type {number}
     */
    privateScope.targetLoad = 2;
    privateScope.statusDropFactor = 0.75;

    privateScope.currentLoad = 0;

    privateScope.removeCallback = null;
    privateScope.putCallback = null;

    privateScope.queue = [];

    privateScope.softLock = false;
    privateScope.hardLock = false;

    privateScope.lockMethod = 'soft';
    privateScope.requestedLockMethod = 'soft';

    privateScope.tunnelMode = false;
    privateScope.tunnelPending = null;
    // Kept off request.timer: MSP.callbacks_cleanup() clears that and would leave the slot locked forever.
    privateScope.tunnelTimer = null;
    privateScope.tunnelDeadline = 0;
    privateScope.tunnelFailureCallback = null;
    privateScope.isWriteCode = () => false;
    privateScope.lastAnswered = null;
    privateScope.transportTransform = null;
    privateScope.transportReset = null;
    privateScope.decoderResetCallback = null;
    // code -> one-shot stale window: after a lapse, or after a retry was answered (duplicate expected)
    privateScope.staleWatch = new Map();
    privateScope.staleReplyCount = 0;
    privateScope.silencePriorMs = TUNNEL_SILENCE_MIN_MS;
    privateScope.serialBaud = 0;
    privateScope.silenceLearnedMs = 0;
    privateScope.silenceDecayFrom = 0;
    privateScope.silenceLoggedMs = null;

    privateScope.queueLocked = false;

    publicScope.setremoveCallback = function(cb) {
        privateScope.removeCallback = cb;
    }

    publicScope.setPutCallback = function(cb) {
        privateScope.putCallback = cb;
    }

    /**
     * Method locks queue
     * All future put requests will be rejected
     */
    publicScope.lock = function () {
        privateScope.queueLocked = true;
    };

    /**
     * Method unlocks queue making it possible to put new requests in it
     */
    publicScope.unlock = function () {
        privateScope.queueLocked = false;
    };

    publicScope.setLockMethod = function (method) {
        privateScope.requestedLockMethod = method;
        privateScope.lockMethod = privateScope.tunnelMode ? 'hard' : method;
    };

    publicScope.getLockMethod = function () {   
        return privateScope.lockMethod;
    };

    publicScope.setSoftLock = function () {
        privateScope.softLock = new Date().getTime();
    };

    publicScope.setHardLock = function () {
        privateScope.hardLock = new Date().getTime();
    };

    publicScope.freeSoftLock = function () {
        privateScope.softLock = false;
    };

    publicScope.freeHardLock = function () {
        privateScope.hardLock = false;
    };

    publicScope.isLocked = function () {

        // A pending tunnel request keeps the slot even if someone force-frees the hard lock.
        if (privateScope.tunnelMode && privateScope.tunnelPending !== null) {
            return true;
        }

        if (privateScope.lockMethod === 'soft') {
            return privateScope.softLock !== false;
        } else {
            return privateScope.hardLock !== false;
        }

    };

    privateScope.getTimeout = function (code) {
        if (code == MSPCodes.MSP_SET_REBOOT || code == MSPCodes.MSP_EEPROM_WRITE) {
            return 5000;
        } else {
            return CONFIGURATOR.connection.getTimeout();
        }
    };

    /**
     * This method is periodically executed and moves MSP request
     * from a queue to serial port. This allows to throttle requests,
     * adjust rate of new frames being sent and prohibit situation in which
     * serial port is saturated, virtually overloaded, with outgoing data
     *
     * This also implements serial port sharing problem: only 1 frame can be transmitted
     * at once
     *
     * MSP class no longer implements blocking, it is queue responsibility
     */
    publicScope.executor = function () {

        /*
         * Debug
         */
        eventFrequencyAnalyzer.put("execute");

        privateScope.loadFilter.apply(privateScope.queue.length);

        /*
         * if port is blocked or there is no connection, do not process the queue
         */
        if (publicScope.isLocked() || CONFIGURATOR.connection === false) {
            eventFrequencyAnalyzer.put("port in use");
            return false;
        }

        var request = privateScope.get();

        if (request !== undefined) {

            /*
             * Lock serial port as being in use right now
             */
            publicScope.setSoftLock();
            publicScope.setHardLock();

            if (privateScope.tunnelMode) {
                privateScope.noteWriteForWatches(request);
                privateScope.startTunnelRequest(request);
            } else {
                request.timer = setTimeout(function () {
                    privateScope.onRequestTimeout(request);
                }, privateScope.getTimeout(request.code));
            }

            if (request.sentOn === null) {
                request.sentOn = new Date().getTime();
            }
            request.lastSentOn = Date.now();

            /*
             * Set receive callback here
             */
            privateScope.putCallback(request);

            eventFrequencyAnalyzer.put('message sent');

            /*
             * Send data to serial port
             */
            // Wrapped per attempt, so a retry goes out with fresh transport framing.
            const wireBody = privateScope.transportTransform ? privateScope.transportTransform(request.messageBody) : request.messageBody;

            CONFIGURATOR.connection.send(wireBody, function (sendInfo) {
                if (sendInfo.bytesSent == wireBody.byteLength) {
                    /*
                     * message has been sent, check callbacks and free resource
                     */
                    if (request.onSend) {
                        request.onSend();
                    }
                    publicScope.freeSoftLock();
                }
            });
        }
    };

    privateScope.onRequestTimeout = function (request) {
        console.log('MSP data request timed-out: ' + request.code);
        mspDeduplicationQueue.remove(request.code);
        /*
         * Remove current callback
         */

        privateScope.removeCallback(request.code);

        /*
         * To prevent infinite retry situation, allow retry only while counter is positive
         */
        if (request.retryCounter > 0) {
            request.retryCounter--;

            /*
             * Create new entry in the queue
             */
            publicScope.put(request);
        }
    };

    privateScope.get = function () {
        const head = privateScope.queue[0];
        if (privateScope.tunnelMode && privateScope.isHeldBack(head)) {
            if (!head.heldSince) {
                head.heldSince = Date.now();
            }
            return undefined;
        }
        if (head?.heldSince) {
            head.heldBackMs = Date.now() - head.heldSince;
        }
        return privateScope.queue.shift();
    };

    publicScope.flush = function () {
        privateScope.queue = [];
    };

    /**
     * Method puts new request into queue
     * @param {MspMessageClass} mspRequest
     * @returns {boolean} true on success, false when queue is locked
     */
    publicScope.put = function (mspRequest) {

        const isMessageInQueue = mspDeduplicationQueue.check(mspRequest.code);

        if (isMessageInQueue) {
            eventFrequencyAnalyzer.put('MSP Duplicate ' + mspRequest.code);
            return false;
        }

        if (privateScope.queueLocked === true) {
            return false;
        }

        mspDeduplicationQueue.put(mspRequest.code);

        privateScope.queue.push(mspRequest);
        return true;
    };

    publicScope.getLength = function () {
        return privateScope.queue.length;
    };

    /**
     * 1s MSP load computed as number of messages in a queue in given period
     * @returns {number}
     */
    publicScope.getLoad = function () {
        return privateScope.loadFilter.get();
    };

    publicScope.getRoundtrip = function () {
        return privateScope.roundtripFilter.get();
    };

    /**
     *
     * @param {number} number
     */
    publicScope.putRoundtrip = function (number) {
        privateScope.roundtripFilter.apply(number);
    };

    publicScope.getHardwareRoundtrip = function () {
        return privateScope.hardwareRoundtripFilter.get();
    };

    /**
     *
     * @param {number} number
     */
    publicScope.putHardwareRoundtrip = function (number) {
        privateScope.hardwareRoundtripFilter.apply(number);
    };

    publicScope.balancer = function () {
        privateScope.currentLoad = privateScope.loadFilter.get();

        /*
         * Also, check if port lock if hanging. Free is so
         */
        var currentTimestamp = new Date().getTime(),
            threshold = publicScope.getHardwareRoundtrip() * 3;

        if (threshold > 5000) {
            threshold = 5000;
        }
        if (threshold < 1000) {
            threshold = 1000;
        }

        if (privateScope.softLock !== false && currentTimestamp - privateScope.softLock > threshold) {
            publicScope.freeSoftLock();
            eventFrequencyAnalyzer.put('force free soft lock');
        }
        // While a tunnel request is pending only its reply or the silence timeout may release the slot.
        const tunnelRequestPending = privateScope.tunnelMode && privateScope.tunnelPending !== null;
        if (!tunnelRequestPending && privateScope.hardLock !== false && currentTimestamp - privateScope.hardLock > threshold) {
            console.log('Force free hard lock');
            publicScope.freeHardLock();
            eventFrequencyAnalyzer.put('force free hard lock');
        }

    };

    /**
     * This method return periodic for polling interval that should populate queue in 80% or less
     * @param {number} requestedInterval
     * @param {number} messagesInInterval
     * @returns {number}
     */
    publicScope.getIntervalPrediction = function (requestedInterval, messagesInInterval) {
        var requestedRate = (1000 / requestedInterval) * messagesInInterval,
            availableRate = (1000 / publicScope.getRoundtrip()) * 0.8;

        if (requestedRate < availableRate) {
            return requestedInterval;
        } else {
            return (1000 / availableRate) * messagesInInterval;
        }
    };

    publicScope.getQueue = function () {
        return privateScope.queue;
    };

    /**
     * The tunnel has one MSP parser per port on the FC and replies carry no request id: strictly one in flight.
     * @param {number} serialBaud baud rate of a serial port, 0 when the link behind the connection is unknown
     */
    publicScope.setTunnelMode = function (enabled, serialBaud = 0) {
        privateScope.tunnelMode = enabled;
        privateScope.lockMethod = enabled ? 'hard' : privateScope.requestedLockMethod;
        publicScope.resetTunnelRequests();
        privateScope.silencePriorMs = enabled ? privateScope.serialSilencePrior(serialBaud) : TUNNEL_SILENCE_MIN_MS;
        privateScope.serialBaud = enabled && serialBaud > 0 ? serialBaud : 0;
        privateScope.silenceLearnedMs = 0;
        privateScope.silenceDecayFrom = Date.now();
        privateScope.silenceLoggedMs = null;
    };

    // Drops pending and stale-watch state but keeps the link timing learned so far.
    publicScope.resetTunnelRequests = function () {
        privateScope.clearTunnelTimer();
        privateScope.tunnelPending = null;
        privateScope.staleWatch.clear();
        privateScope.staleReplyCount = 0;
    };

    privateScope.serialSilencePrior = function (baud) {
        if (!Number.isFinite(baud) || baud <= 0) {
            return TUNNEL_SILENCE_MIN_MS;
        }
        const drainMs = TUNNEL_SERIAL_WORST_CASE_BYTES * 10 / baud * 1000;
        return privateScope.clampSilence(drainMs + TUNNEL_SERIAL_MARGIN_MS);
    };

    privateScope.clampSilence = function (ms) {
        return Math.round(Math.min(TUNNEL_SILENCE_MAX_MS, Math.max(TUNNEL_SILENCE_MIN_MS, ms)));
    };

    publicScope.getTunnelSilencePrior = function () {
        return privateScope.silencePriorMs;
    };

    publicScope.hasSlowSerialPrior = function () {
        return privateScope.serialBaud > 0 && privateScope.serialBaud <= TUNNEL_SLOW_SERIAL_MAX_BAUD;
    };

    publicScope.getTunnelSilenceMax = function () {
        return TUNNEL_SILENCE_MAX_MS;
    };

    publicScope.getTunnelDefaultRetries = function () {
        return TUNNEL_DEFAULT_RETRIES;
    };

    publicScope.getTunnelSilenceWindow = function () {
        return privateScope.tunnelSilenceWindowMs();
    };

    privateScope.tunnelSilenceWindowMs = function () {
        privateScope.decayLearnedSilence();
        const wantedMs = Math.max(privateScope.silencePriorMs, privateScope.silenceLearnedMs);
        const windowMs = privateScope.clampSilence(wantedMs);
        if (windowMs !== privateScope.silenceLoggedMs) {
            privateScope.silenceLoggedMs = windowMs;
            console.log('MSP tunnel: silence window ' + windowMs + ' ms');
        }
        return windowMs;
    };

    // 10 % per full minute without a late reply.
    privateScope.decayLearnedSilence = function () {
        const periods = Math.floor((Date.now() - privateScope.silenceDecayFrom) / TUNNEL_LEARNED_DECAY_PERIOD_MS);
        if (periods > 0) {
            privateScope.silenceLearnedMs *= TUNNEL_LEARNED_DECAY ** periods;
            privateScope.silenceDecayFrom += periods * TUNNEL_LEARNED_DECAY_PERIOD_MS;
        }
    };

    // lateReply: a stale reply proves the link is this slow now, even when it sets no new maximum.
    privateScope.learnSilence = function (latencyMs, lateReply = false) {
        privateScope.decayLearnedSilence();
        const candidate = Math.min(TUNNEL_SILENCE_MAX_MS, latencyMs * TUNNEL_LEARNED_HEADROOM);
        const raised = candidate > privateScope.silenceLearnedMs;
        if (raised) {
            privateScope.silenceLearnedMs = candidate;
        }
        if (raised || lateReply) {
            privateScope.silenceDecayFrom = Date.now();
        }
        privateScope.tunnelSilenceWindowMs();
    };

    // First-chunk latency and inter-chunk gaps of the pending request's own reply.
    privateScope.noteTunnelChunk = function (request) {
        const now = Date.now();
        if (request.firstChunkAt === null) {
            request.firstChunkAt = now;
        } else {
            request.maxChunkGap = Math.max(request.maxChunkGap, now - request.lastChunkAt);
        }
        request.lastChunkAt = now;
    };

    privateScope.resetChunkTiming = function (request) {
        request.firstChunkAt = null;
        request.lastChunkAt = null;
        request.maxChunkGap = 0;
    };

    /*
     * A slow code's reply waits for a flash write, which says nothing about the link. A retry's first
     * chunk may be an earlier attempt's reply: measured from the retry it is a lower bound, never more.
     */
    privateScope.learnFromReply = function (request) {
        if (TUNNEL_SLOW_REQUEST_CODES.has(request.code)) {
            return;
        }
        let latency = request.maxChunkGap;
        if (request.firstChunkAt !== null) {
            latency = Math.max(latency, request.firstChunkAt - request.lastSentOn);
        }
        privateScope.learnSilence(latency);
    };

    // A partial reply was dropped (lapse, reassembly timeout): its chunks must not time the next one.
    publicScope.discardTunnelChunks = function () {
        if (privateScope.tunnelPending) {
            privateScope.resetChunkTiming(privateScope.tunnelPending);
        }
    };

    // wrapFn runs per attempt at send time; resetFn drops reassembly state after a lost reply.
    publicScope.setTransportTransform = function (wrapFn, resetFn = null) {
        privateScope.transportTransform = wrapFn;
        privateScope.transportReset = wrapFn ? resetFn : null;
    };

    publicScope.setDecoderResetCallback = function (cb) {
        privateScope.decoderResetCallback = cb;
    };

    // Chunk progress never shortens a longer initial window (flash write before the reply).
    publicScope.notifyTunnelProgress = function () {
        if (privateScope.tunnelMode && privateScope.tunnelPending) {
            privateScope.noteTunnelChunk(privateScope.tunnelPending);
            const remaining = privateScope.tunnelDeadline - Date.now();
            const timeoutMs = Math.max(remaining, privateScope.tunnelSilenceWindowMs());
            privateScope.armTunnelTimer(privateScope.tunnelPending, timeoutMs);
        }
    };

    publicScope.setTunnelFailureCallback = function (cb) {
        privateScope.tunnelFailureCallback = cb;
    };

    publicScope.setWriteCodePredicate = function (fn) {
        privateScope.isWriteCode = fn;
    };

    // The pending request the last admitted reply answered, or null for an unsolicited reply.
    publicScope.lastAnsweredRequest = function () {
        return privateScope.lastAnswered;
    };

    // The caller gave up (tab switch): its callback must not come back through a retry.
    publicScope.abandonPending = function () {
        const pending = privateScope.tunnelPending;
        if (pending) {
            pending.tunnelRetries = 0;
            pending.onFinish = null;
            pending.abandoned = true;
        }
    };

    /**
     * An identical read already queued or in flight answers this caller too, instead of a
     * retry chain per rejected poll that keeps the code busy long after a stall.
     * A read is only shared while no write waits behind it: a re-read after a SET needs post-SET data.
     * Never onto a request abandoned by a tab switch: its reply no longer fires any callback.
     * @returns {boolean} true when the message was attached to the existing request
     */
    publicScope.coalesce = function (message) {
        if (!privateScope.tunnelMode) {
            return false;
        }
        const queue = privateScope.queue;
        const writeBehind = index => queue.slice(index + 1).some(request => privateScope.isWriteCode(request.code));
        const matches = request => request.code == message.code && privateScope.sameBody(request, message);
        const index = queue.findIndex(matches);
        let target = index >= 0 && !writeBehind(index) ? queue[index] : null;
        const pending = privateScope.tunnelPending;
        if (index < 0 && pending && !pending.abandoned && matches(pending) && !writeBehind(-1)) {
            target = pending;
        }
        if (!target) {
            return false;
        }
        const first = target.onFinish;
        const second = message.onFinish;
        target.onFinish = function (response) {
            try {
                if (first) {
                    first(response);
                }
            } finally {
                if (second) {
                    second(privateScope.copyResponse(response));
                }
            }
        };
        return true;
    };

    // False for a late reply of a lapsed request: a same-code request would otherwise take its data.
    publicScope.admitReply = function (code) {
        privateScope.lastAnswered = null;
        if (!privateScope.tunnelMode) {
            return true;
        }

        const pending = privateScope.tunnelPending;
        if (pending && pending.code == code) {
            privateScope.clearTunnelTimer();
            privateScope.tunnelPending = null;
            privateScope.lastAnswered = pending;
            privateScope.learnFromReply(pending);
            privateScope.updateWatchOnAnswer(pending);
            return true;
        }
        // The chunks so far belonged to another reply.
        if (pending) {
            privateScope.resetChunkTiming(pending);
        }

        const watch = privateScope.activeWatch(code);
        if (watch) {
            privateScope.staleWatch.delete(code);
            privateScope.staleReplyCount++;
            console.log('MSP tunnel: dropped stale reply for ' + code + ' (' + privateScope.staleReplyCount + ' so far)');
            if (!watch.slow) {
                privateScope.learnSilence(Math.max(Date.now() - watch.sentAt, watch.answerLateness), true);
            }
            return false;
        }
        return true;
    };

    // In tunnel mode an unrelated frame must not release the slot of the pending request.
    publicScope.freeHardLockAfterFrame = function () {
        if (!privateScope.tunnelMode || privateScope.tunnelPending === null) {
            publicScope.freeHardLock();
        }
    };

    publicScope.getStaleReplyCount = function () {
        return privateScope.staleReplyCount;
    };

    privateScope.startTunnelRequest = function (request) {
        if (request.tunnelRetries === null || request.tunnelRetries === undefined) {
            request.tunnelRetries = TUNNEL_DEFAULT_RETRIES;
        }
        // A resend would reboot the freshly started FC again, or run the whole erase again.
        if (request.code == MSPCodes.MSP_SET_REBOOT || request.code == MSPCodes.MSP_DATAFLASH_ERASE) {
            request.tunnelRetries = 0;
        }
        // lastSentOn is set after this, so here it is still the previous attempt's.
        request.previousSentOn = request.lastSentOn ?? null;
        privateScope.resetChunkTiming(request);
        privateScope.tunnelPending = request;
        const silenceMs = privateScope.tunnelSilenceWindowMs();
        const slow = TUNNEL_SLOW_REQUEST_CODES.has(request.code);
        const slowMs = request.code == MSPCodes.MSP_DATAFLASH_ERASE ? TUNNEL_ERASE_TIMEOUT_MS : TUNNEL_SLOW_REQUEST_TIMEOUT_MS;
        const firstMs = slow ? Math.max(slowMs, silenceMs) : silenceMs;
        privateScope.armTunnelTimer(request, Math.max(request.tunnelMinWindowMs || 0, firstMs));
    };

    privateScope.armTunnelTimer = function (request, timeoutMs) {
        privateScope.clearTunnelTimer();
        privateScope.tunnelDeadline = Date.now() + timeoutMs;
        privateScope.tunnelTimer = setTimeout(function () {
            privateScope.onTunnelTimeout(request);
        }, timeoutMs);
    };

    privateScope.clearTunnelTimer = function () {
        if (privateScope.tunnelTimer !== null) {
            clearTimeout(privateScope.tunnelTimer);
            privateScope.tunnelTimer = null;
        }
    };

    privateScope.sameBody = function (a, b) {
        const left = new Uint8Array(a.messageBody);
        const right = new Uint8Array(b.messageBody);
        return left.length === right.length && left.every((value, index) => value === right[index]);
    };

    // Each caller gets its own DataView: readers keep their offset on it.
    privateScope.copyResponse = function (response) {
        if (!response?.data) {
            return response;
        }
        const data = new DataView(response.data.buffer, response.data.byteOffset, response.data.byteLength);
        return { ...response, data };
    };

    privateScope.onTunnelTimeout = function (request) {
        if (privateScope.tunnelPending !== request) {
            return;
        }
        console.log('MSP tunnel request timed-out: ' + request.code);

        privateScope.tunnelPending = null;
        privateScope.tunnelTimer = null;
        privateScope.removeCallback(request.code);
        // An abandoned request's code in the dedup queue belongs to the new tab's request by now.
        if (!request.abandoned) {
            mspDeduplicationQueue.remove(request.code);
        }
        privateScope.resetDecoders();
        privateScope.watchStale(request);
        publicScope.freeSoftLock();
        publicScope.freeHardLock();

        if (request.tunnelRetries > 0) {
            request.tunnelRetries--;
            request.isTunnelRetry = true;
            mspDeduplicationQueue.put(request.code);
            // Front of the queue: a later write must not overtake the one being retried.
            privateScope.queue.unshift(request);
            return;
        }

        privateScope.failTunnelRequest(request);
    };

    privateScope.failTunnelRequest = function (request) {
        if (request.abandoned) {
            return;
        }
        try {
            if (privateScope.tunnelFailureCallback) {
                privateScope.tunnelFailureCallback(request);
            } else if (request.onFinish) {
                request.onFinish(false);
            }
        } catch (error) {
            console.error('MSP tunnel: failure callback for ' + request.code + ' threw:', error);
        }
    };

    privateScope.resetDecoders = function () {
        publicScope.discardTunnelChunks();
        if (privateScope.decoderResetCallback) {
            privateScope.decoderResetCallback();
        }
        if (privateScope.transportReset) {
            privateScope.transportReset();
        }
    };

    // A late reply of the lapsed attempt arrives within one silence window or is treated as lost.
    privateScope.watchStale = function (request) {
        const until = Date.now() + privateScope.tunnelSilenceWindowMs();
        const slow = TUNNEL_SLOW_REQUEST_CODES.has(request.code);
        privateScope.staleWatch.set(request.code, {
            until, duplicate: false, sentAt: request.lastSentOn, answerLateness: 0, slow,
        });
    };

    /*
     * A retry was answered: the answer may have been the first attempt's late reply, so the
     * retry's own reply can follow, as late as the first one was. It must not answer a later
     * request of the same code that asks for something else (another setting, WP n+1).
     */
    privateScope.updateWatchOnAnswer = function (request) {
        const now = Date.now();
        if (request.isTunnelRetry) {
            const silenceMs = privateScope.tunnelSilenceWindowMs();
            const maxMs = Math.max(TUNNEL_DUPLICATE_WATCH_MAX_MS, silenceMs);
            const windowMs = Math.min(maxMs, (now - request.sentOn) + silenceMs);
            // A duplicate proves this answer came from an earlier attempt, sent at previousSentOn at the latest.
            privateScope.staleWatch.set(request.code, {
                until: now + windowMs,
                windowMs,
                request,
                writeSince: false,
                duplicate: true,
                sentAt: request.lastSentOn,
                answerLateness: now - request.previousSentOn,
                slow: TUNNEL_SLOW_REQUEST_CODES.has(request.code),
            });
            return;
        }
        // An identical request may have taken the duplicate as its answer; its own reply is the duplicate now.
        const watch = privateScope.activeWatch(request.code);
        if (watch?.duplicate && !privateScope.isHeldBack(request)) {
            watch.until = now + watch.windowMs;
            watch.sentAt = request.lastSentOn;
            watch.answerLateness = 0;
        }
    };

    privateScope.noteWriteForWatches = function (request) {
        if (!privateScope.isWriteCode(request.code)) {
            return;
        }
        privateScope.staleWatch.forEach(watch => {
            watch.writeSince = true;
        });
    };

    privateScope.activeWatch = function (code) {
        const watch = privateScope.staleWatch.get(code);
        if (!watch) {
            return null;
        }
        if (Date.now() >= watch.until) {
            privateScope.staleWatch.delete(code);
            return null;
        }
        return watch;
    };

    privateScope.isWatched = function (code) {
        return privateScope.activeWatch(code) !== null;
    };

    // Same query, no write since: the duplicate is as good an answer as a fresh reply.
    privateScope.isHeldBack = function (request) {
        if (!request || request.isTunnelRetry) {
            return false;
        }
        const watch = privateScope.activeWatch(request.code);
        if (!watch) {
            return false;
        }
        return !watch.duplicate || watch.writeSince || !privateScope.sameBody(watch.request, request);
    };

    publicScope.isStaleWatched = function (code) {
        return privateScope.isWatched(code);
    };

    /**
     * Round-trip sample for a completed request, or null when it must not be recorded.
     * In tunnel mode a retried or held-back request would feed the silence window into the average.
     */
    publicScope.roundtripSample = function (request) {
        const now = Date.now();
        if (!privateScope.tunnelMode) {
            return { total: now - request.createdOn, hardware: now - request.sentOn };
        }
        if (request.isTunnelRetry || request.heldBackMs || !request.lastSentOn) {
            return null;
        }
        const sample = now - request.lastSentOn;
        return { total: sample, hardware: sample };
    };

    setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency));
    setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency));

    return publicScope;
}();

export default mspQueue;