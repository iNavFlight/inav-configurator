'use strict';

import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import GUI from './../js/gui';
import FC from './../js/fc';
import Settings from './../js/settings';
import i18n from './../js/localization';

const advancedTuningTab = {};

advancedTuningTab.initialize = function (callback) {

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
    }

    import('./advanced_tuning.html?raw').then(({default: html}) => GUI.load(html, Settings.processHtml(processHtml)));

    function save_to_eeprom() {
        console.log('save_to_eeprom');
        MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
            GUI.log(i18n.getMessage('eepromSaved'));

            GUI.tab_switch_cleanup(function () {
                MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                    GUI.log(i18n.getMessage('deviceRebooting'));
                    GUI.handleReconnect(true);
                });
            });
        });
    }

    function processHtml() {
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

        if (!FC.isFeatureEnabled('GEOZONE')) {
            $('#geozoneSettings').hide();
        }

        GUI.simpleBind();

        i18n.localize();;
        
        // Set up required field warnings
        $('#launchIdleThr').on('keyup', () => {
            advancedTuningTab.checkRequirements_IdleThrottle();
        });

        $('#launchIdleDelay').on('keyup', () => {
            advancedTuningTab.checkRequirements_IdleThrottle();
        });

        $('#wiggleWakeIdle').on('change', function () {
            advancedTuningTab.checkRequirements_IdleThrottle();
        });

        $('#rthHomeAltitude').on('keyup', () => {
            advancedTuningTab.checkRequirements_LinearDescent();
        });

        $('#rthUseLinearDescent').on('change', function () {
            advancedTuningTab.checkRequirements_LinearDescent();
        });

        // Preload required field warnings
        advancedTuningTab.checkRequirements_IdleThrottle();
        advancedTuningTab.checkRequirements_LinearDescent();

        $('a.save').on('click', function () {
            Settings.saveInputs(save_to_eeprom);
        });
        GUI.content_ready(callback);
    }
};


advancedTuningTab.checkRequirements_IdleThrottle = function() {
    let idleThrottle = $('#launchIdleThr');
    if (($('#launchIdleDelay').val() > 0 || $('#wiggleWakeIdle').find(":selected").val() > 0) && (idleThrottle.val() == "" || idleThrottle.val() < "1150")) {
        idleThrottle.addClass('inputRequiredWarning');
    } else {
        idleThrottle.removeClass('inputRequiredWarning');
    }
};

advancedTuningTab.checkRequirements_LinearDescent = function() {
    let rthHomeAlt = $('#rthHomeAltitude');
    let minRthHomeAlt = 1000.0 / rthHomeAlt.data('setting-multiplier'); // 10 metres minimum recommended for safety.
    
    if ($('#rthUseLinearDescent').is(":checked") && (rthHomeAlt.val() == "" || parseFloat(rthHomeAlt.val()) < minRthHomeAlt)) {
        rthHomeAlt.addClass('inputRequiredWarning');
    } else {
        rthHomeAlt.removeClass('inputRequiredWarning');
    }
};

advancedTuningTab.cleanup = function (callback) {
    if (callback) callback();
};

export default advancedTuningTab;
