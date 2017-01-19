'use strict';

TABS.advanced_tuning = {};

TABS.advanced_tuning.initialize = function (callback, scrollPosition) {

    var loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass();

    if (GUI.active_tab != 'advanced_tuning') {
        GUI.active_tab = 'advanced_tuning';
        googleAnalytics.sendAppView('AdvancedTuning');
    }

    loadChainer.setChain([
        mspHelper.loadNavPosholdConfig
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveNavPosholdConfig,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(reboot);

    function loadHtml() {
        $('#content').load("./tabs/advanced_tuning.html", processHtml);
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
        GUI.handleReconnect($('.tab_setup a'));
    }

    function processHtml() {

        localize();



        GUI.content_ready(callback);
    }
};

TABS.advanced_tuning.cleanup = function (callback) {
    if (callback) callback();
};