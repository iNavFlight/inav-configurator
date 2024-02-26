'use strict';


var SimpleSmoothFilter = function (initialValue, smoothingFactor) {

    var self = {};

    self.value = initialValue;
    self.smoothFactor = smoothingFactor;

    if (self.smoothFactor >= 1) {
        self.smoothFactor = 0.99;
    }

    if (self.smoothFactor <= 0) {
        self.smoothFactor = 0;
    }

    self.apply = function (newValue) {
        self.value = (newValue * (1 - self.smoothFactor)) + (self.value  *  self.smoothFactor);

        return self;
    };

    self.get = function () {
        return self.value;
    };

    return self;
};

module.exports = SimpleSmoothFilter;