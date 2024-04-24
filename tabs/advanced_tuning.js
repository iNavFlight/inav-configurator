'use strict';

const path = require('path');

const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const Settings = require('./../js/settings');
const i18n = require('./../js/localization');

TABS.advanced_tuning = {};

TABS.advanced_tuning.initialize = function (callback) {

    if (GUI.active_tab != 'advanced_tuning') {
        GUI.active_tab = 'advanced_tuning';
    }

    loadHtml();

    function loadHtml() {
        GUI.load(path.join(__dirname, "advanced_tuning.html"), Settings.processHtml(function () {

        if (FC.isAirplane()) {
            $('.airplaneTuning').show();
            $('.airplaneTuningTitle').show();
            $('.multirotorTuning').hide();
            $('.multirotorTuningTitle').hide();
            $('.notFixedWingTuning').hide();
        } else if (FC.isMultirotor()) {
            $('.airplaneTuning').hide();
            $('.airplaneTuningTitle').hide();
            $('.multirotorTuning').show();
            $('.multirotorTuningTitle').show();
            $('.notFixedWingTuning').show();
        } else {
            $('.airplaneTuning').show();
            $('.airplaneTuningTitle').hide();
            $('.multirotorTuning').show();
            $('.multirotorTuningTitle').hide();
            $('.notFixedWingTuning').show();
        }

        GUI.simpleBind();

        i18n.localize();;
        
        // Set up required field warnings
        $('#launchIdleThr').on('keyup', () => {
            TABS.advanced_tuning.checkRequirements_IdleThrottle();
        });

        $('#launchIdleDelay').on('keyup', () => {
            TABS.advanced_tuning.checkRequirements_IdleThrottle();
        });

        $('#rthHomeAltitude').on('keyup', () => {
            TABS.advanced_tuning.checkRequirements_LinearDescent();
        });

        $('#rthUseLinearDescent').on('change', function () {
            TABS.advanced_tuning.checkRequirements_LinearDescent();
        });

        // Preload required field warnings
        TABS.advanced_tuning.checkRequirements_IdleThrottle();
        TABS.advanced_tuning.checkRequirements_LinearDescent();

        $('a.save').on('click', function () {
            Settings.saveInputs().then(function () {
                var self = this;
                MSP.promise(MSPCodes.MSP_EEPROM_WRITE);
                var oldText = $(this).text();
                $(this).html("Saved");
                setTimeout(function () {
                    $(self).html(oldText);
                }, 2000);
                reboot();
            });
        });
        GUI.content_ready(callback);

        }));
    }

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('configurationEepromSaved'));
        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_advanced_tuning a'));
    }
};


TABS.advanced_tuning.checkRequirements_IdleThrottle = function() {
    let idleThrottle = $('#launchIdleThr');
    if ($('#launchIdleDelay').val() > 0 && (idleThrottle.val() == "" || idleThrottle.val() < "1150")) {
        idleThrottle.addClass('inputRequiredWarning');
    } else {
        idleThrottle.removeClass('inputRequiredWarning');
    }
};

TABS.advanced_tuning.checkRequirements_LinearDescent = function() {
    let rthHomeAlt = $('#rthHomeAltitude');
    let minRthHomeAlt = 1000.0 / rthHomeAlt.data('setting-multiplier'); // 10 metres minimum recommended for safety.
    
    if ($('#rthUseLinearDescent').is(":checked") && (rthHomeAlt.val() == "" || parseFloat(rthHomeAlt.val()) < minRthHomeAlt)) {
        rthHomeAlt.addClass('inputRequiredWarning');
    } else {
        rthHomeAlt.removeClass('inputRequiredWarning');
    }
};

TABS.advanced_tuning.cleanup = function (callback) {
    if (callback) callback();
};
