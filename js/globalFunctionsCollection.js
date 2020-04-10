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

    self.init = function ($element) {

        if (semver.lt(CONFIG.flightControllerVersion, "2.4.0")) {
            return;
        }

        $container = $element;
    };

    self.render = function () {
        let $table = $container.find(".function__table")
        $table.find("tbody tr").remove();

        for (let k in self.get()) {
            if (self.get().hasOwnProperty(k)) {
                self.get()[k].render(k, $table);
            }
        }

        GUI.switchery();
    }

    return self;
}