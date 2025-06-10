'use strict';

const { GUI } = require('./../js/gui');
const FC = require('./fc');
const MSP = require('./msp');
const MSPCodes = require('./../js/msp/MSPCodes');
const mspHelper = require('./msp/MSPHelper');
const MSPChainerClass = require('./msp/MSPchainer');
const features = require('./feature_framework');
const periodicStatusUpdater = require('./periodicStatusUpdater');
const { mixer } = require('./model');
const jBox = require('./libraries/jBox/jBox.min');
const i18n = require('./localization');
const defaultsDialogData = require('./defaults_dialog_entries.js');
const Settings = require('./settings.js');
const wizardUiBindings = require('./wizard_ui_bindings');
const wizardSaveFramework = require('./wizard_save_framework');

var savingDefaultsModal;

var defaultsDialog = (function () {

    let publicScope = {},
        privateScope = {};

    let $container;

    privateScope.wizardSettings = [];

    publicScope.init = function () {
        mspHelper.getSetting("applied_defaults").then(privateScope.onInitSettingReturned);
        $container = $("#defaults-wrapper");
    };

    privateScope.setFeaturesBits = function (selectedDefaultPreset) {

        if (selectedDefaultPreset.features && selectedDefaultPreset.features.length > 0) {
            features.reset();

            for (const feature of selectedDefaultPreset.features) {
                if (feature.state) {
                    features.set(feature.bit);
                } else {
                    features.unset(feature.bit);
                }
            }

            features.execute(function () {
                privateScope.setSettings(selectedDefaultPreset);
            });
        } else {
            privateScope.setSettings(selectedDefaultPreset);
        }
    };

    privateScope.saveWizardStep = function (selectedDefaultPreset, wizardStep) {
        const steps = selectedDefaultPreset.wizardPages;
        const stepName = steps[wizardStep];

        if (stepName == "receiver") {
            let $receiverPort = $container.find('#wizard-receiver-port');
            let receiverPort = $receiverPort.val();

            if (receiverPort != "-1") {
                privateScope.wizardSettings.push({
                    name: "receiverPort",
                    value: receiverPort
                });
            }

            privateScope.wizardSettings.push({
                name: "receiverProtocol",
                value: $container.find('#wizard-receiver-protocol option:selected').text()
            });
        } else if (stepName == "gps") {
            let port = $container.find('#wizard-gps-port').val();
            let baud = $container.find('#wizard-gps-baud').val();
            let protocol = $container.find('#wizard-gps-protocol option:selected').text();

            privateScope.wizardSettings.push({
                name: "gpsPort",
                value: {
                    port: port,
                    baud: baud
                }
            });

            privateScope.wizardSettings.push({
                name: "gpsProtocol",
                value: protocol
            });
        }

        privateScope.wizard(selectedDefaultPreset, wizardStep + 1);
    };

    privateScope.wizard = function (selectedDefaultPreset, wizardStep) {

        const steps = selectedDefaultPreset.wizardPages;
        const stepsCount = selectedDefaultPreset.wizardPages.length;
        const stepName = steps[wizardStep];

        if (wizardStep >= stepsCount) {
            //This is the last step, time to finalize
            $container.hide();

            wizardSaveFramework.persist(privateScope.wizardSettings, function () {
                mspHelper.saveToEeprom(function () {
                    //noinspection JSUnresolvedVariable
                    GUI.log(i18n.getMessage('configurationEepromSaved'));
                    if (selectedDefaultPreset.reboot) {
                        privateScope.reboot();
                    }
                });
            });
        } else {
            const $content = $container.find('.defaults-dialog__wizard');

            $content.unbind();

            $.get("./wizard/" + stepName + ".html", function (data) {
                $content.html("");
                $(data).appendTo($content);

                $.get("./wizard/buttons.html", function (data) {
                    $(data).appendTo($content);

                    $content.on('click', '#wizard-next', function () {
                        privateScope.saveWizardStep(selectedDefaultPreset, wizardStep);
                    });

                    $content.on('click', '#wizard-skip', function () {
                        privateScope.wizard(selectedDefaultPreset, wizardStep + 1);
                    });

                    if (stepName == "receiver") {
                        /**
                         * Bindings executed when the receiver wizard tab is loaded
                         */
                        wizardUiBindings.receiver($content);
                    } else if (stepName == "gps") {
                        /**
                         * Bindings executed when the GPS wizard tab is loaded
                         * 
                         */
                        wizardUiBindings.gps($content);
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

    privateScope.reboot = function () {
        periodicStatusUpdater.resume();

        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                //noinspection JSUnresolvedVariable
                if (typeof savingDefaultsModal !== 'undefined') {
                    savingDefaultsModal.close();
                }
                GUI.log(i18n.getMessage('deviceRebooting'));
                GUI.handleReconnect();
            });
        });
    };

    privateScope.finalize = function (selectedDefaultPreset) {
        if (selectedDefaultPreset.wizardPages) {
            privateScope.wizard(selectedDefaultPreset, 0);
        } else {
            mspHelper.saveToEeprom(function () {
                //noinspection JSUnresolvedVariable
                GUI.log(i18n.getMessage('configurationEepromSaved'));
                if (selectedDefaultPreset.reboot) {
                    privateScope.reboot();
                }
            });
        }
    };

    privateScope.setSettings = function (selectedDefaultPreset) {
        
        periodicStatusUpdater.stop();
        
        var currentControlProfile = parseInt($("#profilechange").val());
        var currentBatteryProfile = parseInt($("#batteryprofilechange").val());

        var controlProfileSettings = [];
        var batterySettings = [];
        var miscSettings = [];

        selectedDefaultPreset.settings.forEach(input => {
            if (FC.isControlProfileParameter(input.key)) {
                controlProfileSettings.push(input);
            } else if (FC.isBatteryProfileParameter(input.key)) {
                batterySettings.push(input);
            } else {
                miscSettings.push(input);
            }
        });
        
        var settingsChainer = MSPChainerClass();
        var chain = [];

        miscSettings.forEach(input => {
            chain.push(function (callback) {
                mspHelper.setSetting(input.key, input.value, callback);
            });
        });

        // Set control and battery parameters on all 3 profiles
        for (let profileIdx = 0; profileIdx < 3; profileIdx++){
            chain.push(function (callback) {
                MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [profileIdx], false, callback);
            });
            controlProfileSettings.forEach(input => {
                chain.push(function (callback) {
                    mspHelper.setSetting(input.key, input.value, callback);
                });
            });

            chain.push(function (callback) {
                MSP.send_message(MSPCodes.MSP2_INAV_SELECT_BATTERY_PROFILE, [profileIdx], false, callback);
            });
            batterySettings.forEach(input => {
                chain.push(function (callback) {
                    mspHelper.setSetting(input.key, input.value, callback);
                });
            });
        }
        
        // Set Mixers
        if (selectedDefaultPreset.mixerToApply) {
            let currentMixerPreset = mixer.getById(selectedDefaultPreset.mixerToApply);

            mixer.loadServoRules(FC, currentMixerPreset);
            mixer.loadMotorRules(FC, currentMixerPreset);
            
            FC.MIXER_CONFIG.platformType = currentMixerPreset.platform;
            FC.MIXER_CONFIG.appliedMixerPreset = selectedDefaultPreset.mixerToApply;
            FC.MIXER_CONFIG.motorStopOnLow = (currentMixerPreset.motorStopOnLow === true) ? true : false;
            FC.MIXER_CONFIG.hasFlaps = (currentMixerPreset.hasFlaps === true) ? true : false;

            FC.SERVO_RULES.cleanup();
            FC.SERVO_RULES.inflate();
            FC.MOTOR_RULES.cleanup();
            FC.MOTOR_RULES.inflate();
            
            chain = chain.concat([
                mspHelper.saveMixerConfig,
                mspHelper.sendServoMixer,
                mspHelper.sendMotorMixer
            ]);
        }
            
        chain.push(function (callback) {
            MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [currentControlProfile], false, callback);
        });
            
        chain.push(function (callback) {
            MSP.send_message(MSPCodes.MSP2_INAV_SELECT_BATTERY_PROFILE, [currentBatteryProfile], false, callback);
        });
        
        settingsChainer.setChain(chain);
        settingsChainer.setExitPoint(function () {
            privateScope.finalize(selectedDefaultPreset);
        });
        
        settingsChainer.execute();        
    }

    privateScope.onPresetClick = function (event) {
        savingDefaultsModal = new jBox('Modal', {
            width: 400,
            height: 120,
            animation: false,
            closeOnClick: false,
            closeOnEsc: false,
            content: $('#modal-saving-defaults')
        }).open();

        $container.hide();

        let selectedDefaultPreset = defaultsDialogData[$(event.currentTarget).data("index")];
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
        for (let i in defaultsDialogData) {
            if (defaultsDialogData.hasOwnProperty(i)) {
                let preset = defaultsDialogData[i];
                let $element = $("<div class='default_btn defaults_btn'>\
                        <a class='confirm' href='#'></a>\
                    </div>")

                if (preset.notRecommended) {
                    $element.addClass("defaults_btn--not-recommended");
                }

                $element.find("a").html(preset.title);
                $element.data("index", i).on('click', privateScope.onPresetClick)
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

module.exports = defaultsDialog;
