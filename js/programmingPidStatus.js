'use strict';

var ProgrammingPidStatus = function () {

    let self = {},
        data = [];

    self.set = function (condition, value) {
        data[condition] = value;
    }

    self.get = function (condition) {
        if (typeof data[condition] !== 'undefined') {
            return data[condition];
        } else {
            return null;
        }
    }

    self.getAll = function() {
        return data;
    }

    self.update = function ($container) {
        
    }

    self.init = function ($container) {

    }

    return self;
};

module.exports = ProgrammingPidStatus;
