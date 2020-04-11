'use strict';

let GlobalVariablesStatus = function () {

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
        for (let i in self.getAll()) {
            if (self.getAll().hasOwnProperty(i)) {
                $container.find("[data-gvar-index=" + i + "]").html(self.get(i));
            }
        }
    }

    return self;
};