'use strict';

var helper = helper || {};

//FIXME extract it to separate file
var walkingAverageClass = function (maxLength) {

    var table = [],
        self = {};

    /**
     *
     * @param {number} data
     */
    self.put = function (data) {
        table.push(data);
        if (table.length > maxLength) {
            table.shift();
        }
    };

    self.getAverage = function () {
        var sum = table.reduce(function(a, b) { return a + b; });
        return sum / table.length;
    };

    return self;
};

helper.mspQueue = (function (serial, MSP) {

    var publicScope = {},
        privateScope = {};

    privateScope.handlerFrequency = 200;

    privateScope.loadAverage = new walkingAverageClass(privateScope.handlerFrequency);

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

        privateScope.loadAverage.put(privateScope.queue.length);

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

            /*
             * Set receive callback here
             */
            MSP.putCallback(request);

            /*
             * Send data to serial port
             */
            serial.send(request.requestBuffer, function (sendInfo) {
                if (sendInfo.bytesSent == request.requestBuffer.byteLength) {
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
     * @returns {string}
     */
    publicScope.getLoad = function () {
        return privateScope.loadAverage.getAverage();
    };

    setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency));

    return publicScope;
})(serial, MSP);