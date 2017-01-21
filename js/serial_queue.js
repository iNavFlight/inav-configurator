'use strict';

var helper = helper || {};

helper.mspQueue = (function (serial, MSP) {

    var publicScope = {},
        privateScope = {};

    privateScope.handlerFrequency = 100;
    privateScope.balancerFrequency = 10;

    privateScope.loadFilter = new classes.SimpleSmoothFilter(0.5, 0.996);
    privateScope.roundtripFilter = new classes.SimpleSmoothFilter(20, 0.996);
    privateScope.hardwareRoundtripFilter = new classes.SimpleSmoothFilter(5, 0.996);

    privateScope.targetLoad = 1.5;
    privateScope.statusDropFactor = 0.75;

    privateScope.currentLoad = 0;

    privateScope.loadPid = {
        gains: {
            P: 10,
            I: 4,
            D: 2
        },
        Iterm: 0,
        ItermLimit: 85,
        previousError: 0,
        output: {
            min: 0,
            max: 97,
            minThreshold: 0
        }
    };

    privateScope.dropRatio = 0;

    publicScope.computeDropRatio = function () {
        var error = privateScope.currentLoad - privateScope.targetLoad;

        var Pterm = error * privateScope.loadPid.gains.P,
            Dterm = (error - privateScope.loadPid.previousError) * privateScope.loadPid.gains.D;

        privateScope.loadPid.previousError = error;

        privateScope.loadPid.Iterm += error * privateScope.loadPid.gains.I;
        if (privateScope.loadPid.Iterm > privateScope.loadPid.ItermLimit) {
            privateScope.loadPid.Iterm = privateScope.loadPid.ItermLimit;
        } else if (privateScope.loadPid.Iterm < -privateScope.loadPid.ItermLimit) {
            privateScope.loadPid.Iterm = -privateScope.loadPid.ItermLimit;
        }

        privateScope.dropRatio = Pterm + privateScope.loadPid.Iterm + Dterm;
        if (privateScope.dropRatio < privateScope.loadPid.output.minThreshold) {
            privateScope.dropRatio = privateScope.loadPid.output.min;
        }
        if (privateScope.dropRatio > privateScope.loadPid.output.max) {
            privateScope.dropRatio = privateScope.loadPid.output.max;
        }
    };

    publicScope.getDropRatio = function () {
        return privateScope.dropRatio;
    };

    privateScope.queue = [];

    privateScope.portInUse = false;

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

        privateScope.loadFilter.apply(privateScope.queue.length);

        /*
         * if port is blocked or there is no connection, do not process the queue
         */
        if (privateScope.portInUse || serial.connectionId === false) {
            return false;
        }

        var request = privateScope.get();

        if (request !== undefined) {

            /*
             * Lock serial port as being in use right now
             */
            privateScope.portInUse = true;

            request.timer = setTimeout(function () {
                console.log('MSP data request timed-out: ' + request.code);
                /*
                 * Remove current callback
                 */
                MSP.removeCallback(request.code);

                /*
                 * Create new entry in the queue
                 */
                publicScope.put(request);
            }, serial.getTimeout());

            if (request.sentOn === null) {
                request.sentOn = new Date().getTime();
            }

            /*
             * Set receive callback here
             */
            MSP.putCallback(request);

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
                    privateScope.portInUse = false;
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

    publicScope.freeSerialPort = function () {
        privateScope.portInUse = false;
    };

    publicScope.put = function (mspRequest) {
        privateScope.queue.push(mspRequest);
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
    };

    publicScope.shouldDrop = function () {
        return (Math.round(Math.random()*100) < privateScope.dropRatio);
    };

    publicScope.shouldDropStatus = function () {
        return (Math.round(Math.random()*100) < (privateScope.dropRatio * privateScope.statusDropFactor));
    };

    setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency));
    setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency));

    return publicScope;
})(serial, MSP);