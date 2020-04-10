'use strict';

TABS.programming = {};

TABS.programming.initialize = function (callback, scrollPosition) {
    let loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass();

    if (GUI.active_tab != 'programming') {
        GUI.active_tab = 'programming';
        googleAnalytics.sendAppView('Programming');
    }

    loadChainer.setChain([
        mspHelper.loadLogicConditions,
        mspHelper.loadGlobalFunctions
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.sendLogicConditions,
        mspHelper.sendGlobalFunctions,
        mspHelper.saveToEeprom
    ]);
    
    function loadHtml() {
        GUI.load("./tabs/programming.html", processHtml);
    }

    function processHtml() {

        LOGIC_CONDITIONS.init($('#logic-wrapper'));
        LOGIC_CONDITIONS.render();

        GLOBAL_FUNCTIONS.init($('#functions-wrapper'));
        GLOBAL_FUNCTIONS.render();

        helper.tabs.init($('.tab-programming'));

        localize();

        $('#save-button').click(function () {
            saveChainer.execute();
        });

        GUI.content_ready(callback);
    }
}

TABS.programming.cleanup = function (callback) {
    if (callback) callback();
};