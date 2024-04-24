'use strict';

let LogicConditionsStatus = function () {

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

    return self;
};

module.exports = LogicConditionsStatus;