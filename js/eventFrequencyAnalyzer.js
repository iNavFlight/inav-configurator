'use strict';


/**
 * Simple analyzer that returns frequency of events using 5s buffer
 * Usage: register periodic events with 'put', then call 'get' to get results
 */
var eventFrequencyAnalyzer = (function () {

    var privateScope = {},
        publicScope = {},
        bufferPeriod = 5000;

    privateScope.data = {};
    privateScope.output = {};
    privateScope.intervalHandler;

    /**
     * Periodically executed aggregation task
     * @returns {{}|*}
     */
    publicScope.analyze = function () {
        privateScope.output = {};

        for (var i in privateScope.data) {
            if (privateScope.data.hasOwnProperty(i)) {
                privateScope.output[i] = privateScope.data[i] / bufferPeriod * 1000;
            }
        }

        privateScope.data = {};
        return privateScope.output;
    };

    /**
     * Return event list with frequencies
     * @returns {{}|*}
     */
    publicScope.get = function () {
        return privateScope.output;
    };

    /**
     * Returns raw data
     * @returns {{}|*}
     */
    publicScope.getRaw = function () {
        return privateScope.data;
    };

    /**
     * Put event into analyzer
     * @param {object} event
     */
    publicScope.put = function (event) {
        if (privateScope.data[event]) {
            privateScope.data[event]++;
        } else {
            privateScope.data[event] = 1;
        }
    };

    /**
     *
     * @param {number} buffer buffer length in milliseconds
     */
    publicScope.setBufferPeriod = function (buffer) {
        bufferPeriod = buffer;
        clearInterval(privateScope.intervalHandler);
        privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod);
    };

    privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod);

    return publicScope;
})();

module.exports = eventFrequencyAnalyzer;