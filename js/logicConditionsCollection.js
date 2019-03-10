'use strict';

let LogicConditionsCollection = function () {

    let self = {},
        data = [];

    self.put = function (element) {
        data.push(element);
    };

    self.get = function () {
        return data;
    };

    self.flush = function () {
        data = [];
    };

    self.getCount = function () {
        return data.length
    }

    return self;
};