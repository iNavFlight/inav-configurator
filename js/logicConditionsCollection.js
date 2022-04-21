'use strict';

let LogicConditionsCollection = function () {

    let self = {},
        data = [],
        $container;

    let max_logicConditions = 32;

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

        GUI.switchery();
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

        $container.find('.logic__save').click(self.onSave);
        $container.find('.logic__close').click(self.onClose);

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