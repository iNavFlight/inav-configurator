'use strict';

TABS.advanced_tuning = {};

TABS.advanced_tuning.initialize = function (callback) {

    if (GUI.active_tab != 'advanced_tuning') {
        GUI.active_tab = 'advanced_tuning';
        googleAnalytics.sendAppView('AdvancedTuning');
    }

    loadHtml();

    function loadHtml() {
        GUI.load("./tabs/advanced_tuning.html", Settings.processHtml(function () {

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

        localize();
        
        $('a.save').click(function () {
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
        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));
        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_advanced_tuning a'));
    }


};

TABS.advanced_tuning.cleanup = function (callback) {
    if (callback) callback();
};
