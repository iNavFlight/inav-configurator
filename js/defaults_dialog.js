/*global mspHelper,$,GUI,MSP,chrome*/
'use strict';

var helper = helper || {};
var savingDefaultsModal;

helper.defaultsDialog = (function (data) {

    let publicScope = {},
        privateScope = {};

    let $container;

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

    privateScope.saveWizardStep = function (selectedDefaultPreset, wizardStep) {
        //TODO add saving logic

        privateScope.wizard(selectedDefaultPreset, wizardStep + 1);
    };

    privateScope.handleTabLoadReceiver = function ($content) {
        console.log('ready to handle receiver');


    },

        privateScope.wizard = function (selectedDefaultPreset, wizardStep) {

            const steps = selectedDefaultPreset.wizardPages;
            const stepsCount = selectedDefaultPreset.wizardPages.length;
            const stepName = steps[wizardStep];

            console.log(steps[wizardStep], wizardStep, stepsCount);

            if (wizardStep >= stepsCount - 1) {
                //This is the last step, time to finalize
                $container.hide();
                privateScope.saveAndReboot();
            } else {
                const $content = $container.find('.defaults-dialog__wizard');

                $.get("./wizard/" + stepName + ".html", function (data) {
                    $(data).appendTo($content);

                    $.get("./wizard/buttons.html", function (data) {
                        $(data).appendTo($content);

                        $container.on('click', '#wizard-next', function () {
                            privateScope.saveWizardStep(selectedDefaultPreset, wizardStep);
                        });

                        $container.on('click', '#wizard-skip', function () {
                            privateScope.wizard(selectedDefaultPreset, wizardStep + 1);
                        });

                        if (stepName == "receiver") {
                            privateScope.handleTabLoadReceiver($container);
                        }

                        Settings.configureInputs().then(
                            function () {
                                console.log('configure done');
                                $container.find('.defaults-dialog__content').hide();
                                $container.find('.defaults-dialog__wizard').show();

                                savingDefaultsModal.close();
                                $container.show();
                            }
                        );
                    });
                });
            }

        };

    privateScope.saveAndReboot = function () {
        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                //noinspection JSUnresolvedVariable
                savingDefaultsModal.close();
                GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                GUI.handleReconnect();
            });
        });
    };

    privateScope.finalize = function (selectedDefaultPreset) {

        if (selectedDefaultPreset.wizardPages) {
            privateScope.wizard(selectedDefaultPreset, 0);
        }
        return;
        //FIXME enable real flow
        mspHelper.saveToEeprom(function () {
            //noinspection JSUnresolvedVariable
            GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

            if (selectedDefaultPreset.wizardPages) {
                privateScope.wizard(selectedDefaultPreset, 0);
            } else if (selectedDefaultPreset.reboot) {
                privateScope.saveAndReboot();
            }
        });
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

                // If default preset is associated to a mixer, apply the mixer as well
                if (selectedDefaultPreset.mixerToApply) {
                    let currentMixerPreset = helper.mixer.getById(selectedDefaultPreset.mixerToApply);

                    helper.mixer.loadServoRules(currentMixerPreset);
                    helper.mixer.loadMotorRules(currentMixerPreset);

                    SERVO_RULES.cleanup();
                    SERVO_RULES.inflate();
                    MOTOR_RULES.cleanup();
                    MOTOR_RULES.inflate();

                    mspHelper.sendServoMixer(function () {
                        mspHelper.sendMotorMixer(function () {
                            privateScope.finalize(selectedDefaultPreset);
                        })
                    });
                } else {
                    privateScope.finalize(selectedDefaultPreset);
                }

            })
        });
    };

    privateScope.onPresetClick = function (event) {
        savingDefaultsModal = new jBox('Modal', {
            width: 400,
            height: 100,
            animation: false,
            closeOnClick: false,
            closeOnEsc: false,
            content: $('#modal-saving-defaults')
        }).open();

        $container.hide();

        let selectedDefaultPreset = data[$(event.currentTarget).data("index")];
        if (selectedDefaultPreset && selectedDefaultPreset.settings) {

            if (selectedDefaultPreset.id == 0) {
                // Close applying preset dialog if keeping current settings.
                savingDefaultsModal.close();
            }

            mspHelper.loadFeatures(function () {
                privateScope.setFeaturesBits(selectedDefaultPreset)
            });
        } else {
            savingDefaultsModal.close();
        }
    };

    privateScope.render = function () {
        $container.find('.defaults-dialog__content').show();
        $container.find('.defaults-dialog__wizard').hide();
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
})(helper.defaultsDialogData);
