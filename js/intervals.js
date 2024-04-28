'use strict';

var interval = function () {

    var privateScope = {},
        publicScope = {};

    privateScope.intervals = [];

    /**
     *
     * @param {String} name
     * @param {Function} code function reference (code to be executed)
     * @param {int} interval time interval in milliseconds
     * @param {boolean=} first true/false if code should be ran initially before next timer interval hits
     * @returns {{name: *, timer: null, code: *, interval: *, fired: number, paused: boolean}}
     */
    publicScope.add = function (name, code, interval, first) {

        /*
         * Kill existing interval with this name if exists
         */
        publicScope.remove(name);

        var data = {
            'name': name,
            'timer': null,
            'code': code,
            'interval': interval,
            'fired': 0,
            'paused': false
        };

        if (first == true) {
            code(); // execute code
            data.fired++; // increment counter
        }

        data.timer = setInterval(function() {
            code();
            data.fired++;
        }, interval);

        privateScope.intervals.push(data);

        return data;
    };

    /**
     * Method removes and stop execution of interval callback
     * @param {string} name
     * @returns {boolean}
     */
    publicScope.remove = function (name) {
        for (var i = 0; i < privateScope.intervals.length; i++) {
            if (privateScope.intervals[i].name == name) {
                clearInterval(privateScope.intervals[i].timer); // stop timer
                privateScope.intervals.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    /**
     *
     * @param {string} name
     * @returns {boolean}
     */
    publicScope.pause = function (name) {
        for (var i = 0; i < privateScope.intervals.length; i++) {
            if (privateScope.intervals[i].name == name) {
                clearInterval(privateScope.intervals[i].timer);
                privateScope.intervals[i].paused = true;

                return true;
            }
        }

        return false;
    };

    /**
     *
     * @param {string} name
     * @returns {boolean}
     */
    publicScope.resume = function (name) {
        for (var i = 0; i < privateScope.intervals.length; i++) {
            if (privateScope.intervals[i].name == name && privateScope.intervals[i].paused) {
                var obj = privateScope.intervals[i];

                obj.timer = setInterval(function() {
                    obj.code(); // execute code
                    obj.fired++; // increment counter
                }, obj.interval);

                obj.paused = false;
                return true;
            }
        }

        return false;
    };

    /**
     *
     * @param {=} keep_array
     * @returns {number}
     */
    publicScope.killAll = function (keep_array) {
        var timers_killed = 0;

        console.log('Killing all intervals except: ' + keep_array);

        for (var i = (privateScope.intervals.length - 1); i >= 0; i--) { // reverse iteration
            var keep = false;
            if (keep_array) { // only run through the array if it exists
                keep_array.forEach(function (name) {
                    if (privateScope.intervals[i].name == name) {
                        keep = true;
                    }
                });
            }

            if (!keep) {
                clearInterval(privateScope.intervals[i].timer); // stop timer
                privateScope.intervals.splice(i, 1); // remove element/object from array
                timers_killed++;
            }
        }

        return timers_killed;
    };

    publicScope.list = function () {
        return privateScope.intervals;
    };

    return publicScope;
}();

module.exports = interval;