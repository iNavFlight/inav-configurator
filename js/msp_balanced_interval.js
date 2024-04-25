'use strict';

const mspQueue = require('./serial_queue');
const interval = require('./intervals');

var mspBalancedInterval = (function (mspQueue, intervalHandler) {

    var publicScope = {},
        privateScope = {};

    /**
     * How often balancing should be executed [Hz]
     * @type {number}
     */
    privateScope.balancingFrequency = 0.5;

    privateScope.intervals = [];

    /**
     *
     * @param {string} name
     * @param {number} requestedInterval
     * @param {number} messagesInInterval
     * @param {function} code
     */
    publicScope.add = function (name, requestedInterval, messagesInInterval, code) {
        privateScope.intervals.push({
            name: name,
            requestedInterval: requestedInterval,
            messagesInInterval: messagesInInterval,
            code: code
        });

        intervalHandler.add(name, code, mspQueue.getIntervalPrediction(requestedInterval, messagesInInterval));
    };

    /**
     * Periodically executed balancing handler
     */
    publicScope.balancer = function () {

        var interval;

        for (var i in privateScope.intervals) {
            if (privateScope.intervals.hasOwnProperty(i)) {
                interval = privateScope.intervals[i];

                intervalHandler.remove(interval.name);
                intervalHandler.add(
                    interval.name,
                    interval.code,
                    mspQueue.getIntervalPrediction(
                        interval.requestedInterval,
                        interval.messagesInInterval
                    )
                );
            }
        }

    };

    /**
     * Real interval cleaning happens win interval.killAll method
     * both methods have to be executed
     */
    publicScope.flush = function () {
        privateScope.intervals = [];
    };

    setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancingFrequency));

    return publicScope;
})(mspQueue, interval);

module.exports = mspBalancedInterval;
