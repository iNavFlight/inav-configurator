'use strict';

var LogicConditionsCollection = function () {

    let self = {},
        data = [],
        $container;

    let max_logicConditions = 64;

    self.getMaxLogicConditionCount = function () {
        return max_logicConditions;
    }

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

    self.isEnabled = function (lcID) {
        return data[lcID].getEnabled();
    }

    self.open = function () {
        self.render();
        $container.show();
    };

    self.render = function () {
        let $table = $container.find(".logic__table")
        $table.find("tbody tr").remove();

        for (let k in self.get()) {
            if (self.get().hasOwnProperty(k)) {
                self.get()[k].render(k, $table);
            }
        }
    };

    self.onSave = function () {
        let chain = new MSPChainerClass()

        chain.setChain([
            mspHelper.sendLogicConditions,
            mspHelper.saveToEeprom
        ]);

        chain.execute();
    };

    self.onClose = function() {
        $container.hide();
    };

    self.init = function ($element) {
        $container = $element;

        $container.find('.logic__save').on('click', self.onSave);
        $container.find('.logic__close').on('click', self.onClose);

    };

    self.update = function(statuses) {
        let $table = $container.find(".logic__table")

        for (let k in self.get()) {
            if (self.get().hasOwnProperty(k)) {
                self.get()[k].update(k, statuses.get(k), $table);
            }
        }
    }

    return self;
};

module.exports = LogicConditionsCollection;