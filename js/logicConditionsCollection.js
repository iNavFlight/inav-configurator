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

    self.render = function ($container) {

        for (let k in self.get()) {
            if (self.get().hasOwnProperty(k)) {
                self.get()[k].render(k, $container);
            }
        }

    }

    return self;
};