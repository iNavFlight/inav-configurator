/*global mspHelper,$,GUI,MSP,BF_CONFIG,chrome*/
'use strict';
var miniquad_3_7_preset = require('./default_presets/miniquad_3-7');
var airplane_tail = require('./default_presets/airplane_tail');
var airplane_wing = require('./default_presets/airplane_wing');
var rover_boats = require('./default_presets/rover_boats');

var helper = helper || {};

helper.defaultsDialog = (function () {

    let publicScope = {},
        privateScope = {};

    let $container;

    let data = [
        miniquad_3_7_preset,
        airplane_tail,
        airplane_wing,
        rover_boats,
        {
            "title": 'Custom UAV - INAV legacy defaults (Not recommended)',
            "notRecommended": true,
            "reboot": false,
            "settings": [
                {
                    key: "motor_pwm_protocol",
                    value: "STANDARD"
                },
                {
                    key: "applied_defaults",
                    value: 1
                }
            ]
        },
        {
            "title": 'Keep current settings (Not recommended)',
            "notRecommended": true,
            "reboot": false,
            "settings": [
                {
                    key: "applied_defaults",
                    value: 1
                }
            ]
        }
    ]

    publicScope.init = function () {
        mspHelper.getSetting("applied_defaults").then(privateScope.onInitSettingReturned);
        $container = $("#defaults-wrapper");
    };

    privateScope.setFeaturesBits = function (selectedDefaultPreset) {

        if (selectedDefaultPreset.features && selectedDefaultPreset.features.length > 0) {
            helper.features.reset();

            for (const feature of selectedDefaultPreset.features) {
                if (feature.state) {
                    helper.features.set(feature.bit);
                } else {
                    helper.features.unset(feature.bit);
                }
            }

            helper.features.execute(function () {
                privateScope.setSettings(selectedDefaultPreset);
            });
        } else {
            privateScope.setSettings(selectedDefaultPreset);
        }
    };

    privateScope.setSettings = function (selectedDefaultPreset) {
        //Save analytics
        googleAnalytics.sendEvent('Setting', 'Defaults', selectedDefaultPreset.title);
        Promise.mapSeries(selectedDefaultPreset.settings, function (input, ii) {
            return mspHelper.getSetting(input.key);
        }).then(function () {
            Promise.mapSeries(selectedDefaultPreset.settings, function (input, ii) {
                return mspHelper.setSetting(input.key, input.value);
            }).then(function () {
                mspHelper.saveToEeprom(function () {
                    //noinspection JSUnresolvedVariable
                    GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

                    if (selectedDefaultPreset.reboot) {
                        GUI.tab_switch_cleanup(function () {
                            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                                //noinspection JSUnresolvedVariable
                                GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                                GUI.handleReconnect();
                            });
                        });
                    }
                });
            })
        });
    };

    privateScope.onPresetClick = function (event) {
        $container.hide();
        let selectedDefaultPreset = data[$(event.currentTarget).data("index")];
        if (selectedDefaultPreset && selectedDefaultPreset.settings) {

            mspHelper.loadBfConfig(function () {
                privateScope.setFeaturesBits(selectedDefaultPreset)
            });
        }
    };

    privateScope.render = function () {
        let $place = $container.find('.defaults-dialog__options');
        $place.html("");
        for (let i in data) {
            if (data.hasOwnProperty(i)) {
                let preset = data[i];
                let $element = $("<div class='default_btn defaults_btn'>\
                        <a class='confirm' href='#'></a>\
                    </div>")

                if (preset.notRecommended) {
                    $element.addClass("defaults_btn--not-recommended");
                }

                $element.find("a").html(preset.title);
                $element.data("index", i).click(privateScope.onPresetClick)
                $element.appendTo($place);
            }
        }
    }

    privateScope.onInitSettingReturned = function (promise) {
        if (promise.value > 0) {
            return; //Defaults were applied, we can just ignore
        }

        privateScope.render();
        $container.show();
    }

    return publicScope;
})();
