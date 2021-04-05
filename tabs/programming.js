'use strict';

TABS.programming = {};

TABS.programming.initialize = function (callback, scrollPosition) {
    let loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass(),
        statusChainer = new MSPChainerClass();

    if (GUI.active_tab != 'programming') {
        GUI.active_tab = 'programming';
        googleAnalytics.sendAppView('Programming');
    }

    loadChainer.setChain([
        mspHelper.loadLogicConditions,
        mspHelper.loadGlobalVariablesStatus,
        mspHelper.loadProgrammingPidStatus,
        mspHelper.loadProgrammingPid
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.sendLogicConditions,
        mspHelper.sendProgrammingPid,
        mspHelper.saveToEeprom
    ]);
    
    statusChainer.setChain([
        mspHelper.loadLogicConditionsStatus,
        mspHelper.loadGlobalVariablesStatus,
        mspHelper.loadProgrammingPidStatus
    ]);
    statusChainer.setExitPoint(onStatusPullDone);

    function loadHtml() {
        GUI.load("./tabs/programming.html", processHtml);
    }

    function processHtml() {

        LOGIC_CONDITIONS.init($('#subtab-lc'));
        LOGIC_CONDITIONS.render();

        PROGRAMMING_PID.init($('#subtab-pid'));
        PROGRAMMING_PID.render();

        GLOBAL_VARIABLES_STATUS.init($(".gvar__container"));

        helper.tabs.init($('.tab-programming'));

        localize();

        $('#save-button').click(function () {
            saveChainer.execute();
        });

        helper.mspBalancedInterval.add('logic_conditions_pull', 100, 1, function () {
            statusChainer.execute();
        });

        GUI.content_ready(callback);
    }

    function onStatusPullDone() {
        LOGIC_CONDITIONS.update(LOGIC_CONDITIONS_STATUS);
        GLOBAL_VARIABLES_STATUS.update($('.tab-programming'));
        PROGRAMMING_PID.update(PROGRAMMING_PID_STATUS);
    }
}

TABS.programming.cleanup = function (callback) {
    if (callback) callback();
};