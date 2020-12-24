'use strict';

let ProgrammingPidCollection = function () {

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

    self.open = function () {
        self.render();
        $container.show();
    };

    

    return self;
};