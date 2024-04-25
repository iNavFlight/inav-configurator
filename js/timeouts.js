'use strict';

var timeout = (function () {

    var privateScope = {},
        publicScope = {};

    privateScope.timeouts = [];

    /**
     *
     * @param {string} name
     * @param {function } code
     * @param {number} timeout
     * @returns {{name: *, timer: null, timeout: *}}
     */
    publicScope.add = function (name, code, timeout) {
        var data = {'name': name, 'timer': null, 'timeout': timeout};

        // start timer with "cleaning" callback
        data.timer = setTimeout(function() {
            code(); // execute code

            // remove object from array
            var index = privateScope.timeouts.indexOf(data);
            if (index > -1) privateScope.timeouts.splice(index, 1);
        }, timeout);

        privateScope.timeouts.push(data); // push to primary timeout array

        return data;
    };

    publicScope.remove = function (name) {
        for (var i = 0; i < privateScope.timeouts.length; i++) {
            if (privateScope.timeouts[i].name == name) {
                clearTimeout(privateScope.timeouts[i].timer); // stop timer
                privateScope.timeouts.splice(i, 1); // remove element/object from array
                return true;
            }
        }

        return false;
    };

    /**
     *
     * @returns {number} number of killed timeouts
     */
    publicScope.killAll = function () {
        var timers_killed = 0;

        for (var i = 0; i < privateScope.timeouts.length; i++) {
            clearTimeout(privateScope.timeouts[i].timer); // stop timer
            timers_killed++;
        }

        privateScope.timeouts = []; // drop objects

        return timers_killed;
    };

    return publicScope;
})();

module.exports = timeout;