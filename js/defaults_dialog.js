'use strict';

var helper = helper || {};

helper.defaultsDialog = (function() {

    let publicScope = {},
        privateScope = {};

    let $container;

    let data = [{
            "title": 'Mini Quad with 3"-7" propellers',
            "id": 2,
            "settings": {
                "gyro_lpf": "256HZ",
                "looptime": 500
            }
        },
        {
            "title": 'Airplane',
            "id": 3
        },
        {
            "title": 'Custom UAV - INAV legacy defaults',
            "id": 1
        }
    ]

    publicScope.init = function() {
        mspHelper.getSetting("applied_defaults").then(privateScope.onInitSettingReturned);
        $container = $("#defaults-wrapper");
    };

    privateScope.onPresetClick = function(event) {
        let preset = data[$(event.currentTarget).data("index")];
        if (preset) {

            let promises = {};
            Object.keys(presets.settings).forEach(function(key, ii) {
                let value = presets.settings[key];
                promises[key] = mspHelper.setSetting(name, value);
            });

            console.log(promises);
            // Promise.props(promises).then(function() {
            //     saveChainer.execute();
            // });

        }
    };

    privateScope.render = function() {
        let $place = $container.find('.defaults-dialog__options');
        for (let i in data) {
            if (data.hasOwnProperty(i)) {
                let preset = data[i];
                let $element = $("<div class='default_btn defaults_btn'>\
                        <a class='confirm' href='#'></a>\
                    </div>")

                $element.find("a").html(preset.title);
                $element.data("index", i).click(privateScope.onPresetClick)
                $element.appendTo($place);
            }
        }
    }

    privateScope.onInitSettingReturned = function(promise) {
        if (promise.value > 0) {
            return; //Defaults were applied, we can just ignore
        }

        privateScope.render();
        $container.show();
    }

    return publicScope;
})();