/*global TABS,MSPChainerClass,mspHelper,GUI,LOGIC_CONDITIONS,PROGRAMMING_PID,GLOBAL_VARIABLES_STATUS,helper,LOGIC_CONDITIONS_STATUS,PROGRAMMING_PID_STATUS*/
'use strict';

TABS.programming = {};

TABS.programming.initialize = function (callback, scrollPosition) {
    let loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass(),
        statusChainer = new MSPChainerClass();

    if (GUI.active_tab != 'programming') {
        GUI.active_tab = 'programming';
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
        GUI.load(path.join(__dirname, "tabs/programming.html"), processHtml);
    }

    function processHtml() {
        LOGIC_CONDITIONS.init($('#subtab-lc'));
        LOGIC_CONDITIONS.render();

        PROGRAMMING_PID.init($('#subtab-pid'));
        PROGRAMMING_PID.render();

        GLOBAL_VARIABLES_STATUS.init($(".gvar__container"));

        helper.tabs.init($('.tab-programming'));

       i18n.localize();;

        $('#save-button').on('click', function () {
            saveChainer.execute();
            GUI.log(i18n.getMessage('programmingEepromSaved'));
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