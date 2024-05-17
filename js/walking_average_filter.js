'use strict';

var WalkingAverageFilter = function (maxLength) {

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
        if (table.length > 0) {
            var sum = table.reduce(function (a, b) {
                return a + b;
            });
            return sum / table.length;
        } else {
            return 0;
        }
    };

    return self;
};
module.exports = WalkingAverageFilter;