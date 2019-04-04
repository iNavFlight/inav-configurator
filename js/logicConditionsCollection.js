'use strict';

let LogicConditionsCollection = function () {

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

        if (semver.lt(CONFIG.flightControllerVersion, "2.2.0")) {
            return;
        }

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

        if (semver.lt(CONFIG.flightControllerVersion, "2.2.0")) {
            return;
        }

        $container = $element;

        $container.find('.logic__save').click(self.onSave);
        $container.find('.logic__close').click(self.onClose);

    };

    return self;
};