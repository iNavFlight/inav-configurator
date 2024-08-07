'use strict';

const CONFIGURATOR = require('./data_storage');
const MSPCodes = require('./msp/MSPCodes');
const SimpleSmoothFilter = require('./simple_smooth_filter');
const eventFrequencyAnalyzer = require('./eventFrequencyAnalyzer');
const mspDeduplicationQueue = require('./msp/mspDeduplicationQueue');

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
        privateScope.lockMethod = method;
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

            request.timer = setTimeout(function () {
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

            }, privateScope.getTimeout(request.code));

            if (request.sentOn === null) {
                request.sentOn = new Date().getTime();
            }

            /*
             * Set receive callback here
             */
            privateScope.putCallback(request);

            eventFrequencyAnalyzer.put('message sent');

            /*
             * Send data to serial port
             */
            CONFIGURATOR.connection.send(request.messageBody, function (sendInfo) {
                if (sendInfo.bytesSent == request.messageBody.byteLength) {
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

    privateScope.get = function () {
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
        if (privateScope.hardLock !== false && currentTimestamp - privateScope.hardLock > threshold) {
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

    setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency));
    setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency));

    return publicScope;
}();

module.exports = mspQueue;