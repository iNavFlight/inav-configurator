'use strict';

let GlobalFunctionsCollection = function () {
    let self = {},
        data = [],
        $container;

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
    };

    return self;
}