'use strict';

var ProgrammingPidCollection = function () {

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

    self.init = function ($element) {
        $container = $element;
    };

    self.render = function () {
        let $table = $container.find(".pid__table")
        $table.find("tbody tr").remove();

        for (let k in self.get()) {
            if (self.get().hasOwnProperty(k)) {
                self.get()[k].render(k, $table);
            }
        }
    };

    self.update = function(statuses) {
        let $table = $container.find(".pid__table")

        for (let k in self.get()) {
            if (self.get().hasOwnProperty(k)) {
                self.get()[k].update(k, statuses.get(k), $table);
            }
        }
    }

    return self;
};

module.exports = ProgrammingPidCollection;
