'use strict';

var helper = helper || {};

helper.mspQueue = (function (serial, MSP) {

    var publicScope = {},
        privateScope = {};

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

            //TODO implement timeout scenario

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

    setInterval(publicScope.executor, 20);

    return publicScope;
})(serial, MSP);