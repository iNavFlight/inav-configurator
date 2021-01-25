'use strict';

var helper = helper || {};

helper.mspQueue = (function (serial, MSP) {

    var publicScope = {},
        privateScope = {};

    privateScope.handlerFrequency = 100;
    privateScope.balancerFrequency = 20;

    privateScope.loadFilter = new classes.SimpleSmoothFilter(1, 0.85);
    privateScope.roundtripFilter = new classes.SimpleSmoothFilter(20, 0.95);
    privateScope.hardwareRoundtripFilter = new classes.SimpleSmoothFilter(10, 0.95);

    /**
     * Target load for MSP queue. When load is above target, throttling might start to appear
     * @type {number}
     */
    privateScope.targetLoad = 2;
    privateScope.statusDropFactor = 0.75;

    privateScope.currentLoad = 0;

    /**
     * PID controller used to perform throttling
     * @type {classes.PidController}
     */
    privateScope.loadPidController = new classes.PidController();
    privateScope.loadPidController.setTarget(privateScope.targetLoad);
    privateScope.loadPidController.setOutput(0, 99, 0);
    privateScope.loadPidController.setGains(5, 6, 3);
    privateScope.loadPidController.setItermLimit(0, 90);

    privateScope.dropRatio = 0;

    publicScope.computeDropRatio = function () {
        privateScope.dropRatio = privateScope.loadPidController.run(publicScope.getLoad());
    };

    publicScope.getDropRatio = function () {
        return privateScope.dropRatio;
    };

    privateScope.queue = [];

    privateScope.softLock = false;
    privateScope.hardLock = false;

    privateScope.lockMethod = 'soft';

    privateScope.queueLocked = false;

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
            return serial.getTimeout();
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
        helper.eventFrequencyAnalyzer.put("execute");

        privateScope.loadFilter.apply(privateScope.queue.length);

        /*
         * if port is blocked or there is no connection, do not process the queue
         */
        if (publicScope.isLocked() || serial.connectionId === false) {
            helper.eventFrequencyAnalyzer.put("port in use");
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
                /*
                 * Remove current callback
                 */
                MSP.removeCallback(request.code);

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
            MSP.putCallback(request);

            helper.eventFrequencyAnalyzer.put('message sent');

            /*
             * Send data to serial port
             */
            serial.send(request.messageBody, function (sendInfo) {
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

        if (privateScope.queueLocked === true) {
            return false;
        }

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
        helper.mspQueue.computeDropRatio();

        /*
         * Also, check if port lock if hanging. Free is so
         */
        var currentTimestamp = new Date().getTime(),
            threshold = publicScope.getHardwareRoundtrip() * 3;

        if (threshold > 1000) {
            threshold = 1000;
        }

        if (privateScope.softLock !== false && currentTimestamp - privateScope.softLock > threshold) {
            privateScope.softLock = false;
            helper.eventFrequencyAnalyzer.put('force free soft lock');
        }
        if (privateScope.hardLock !== false && currentTimestamp - privateScope.hardLock > threshold) {
            privateScope.hardLock = false;
            helper.eventFrequencyAnalyzer.put('force free hard lock');
        }

    };

    publicScope.shouldDrop = function () {
        return (Math.round(Math.random()*100) < privateScope.dropRatio);
    };

    publicScope.shouldDropStatus = function () {
        return (Math.round(Math.random()*100) < (privateScope.dropRatio * privateScope.statusDropFactor));
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

    setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency));
    setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency));

    return publicScope;
})(serial, MSP);