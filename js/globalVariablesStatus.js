'use strict';

var GlobalVariablesStatus = function () {

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

    self.init = function ($container) {

        let count = self.getAll().length;
        let template = $container.find(".gvar__wrapper:first").prop("outerHTML");
        
        $container.find(".gvar__wrapper").remove();

        for (let i = 0; i < count; i++) {
            $container.append(template);
            let $last = $container.find(".gvar__wrapper:last");

            $last.find("h2").html("GVAR " + i);
            $last.find("label").attr("data-gvar-index", i);
            $last.find("label").html("0");
        }

        $container.find(".gvar__wrapper").css("width", (100 / count) + "%");

    }

    return self;
};

module.exports = GlobalVariablesStatus;