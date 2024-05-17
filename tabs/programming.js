'use strict';

const path = require('path');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const tabs = require('./../js/tabs');
const i18n = require('./../js/localization');
const interval = require('./../js/intervals');

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
        GUI.load(path.join(__dirname, "programming.html"), processHtml);
    }

    function processHtml() {
        FC.LOGIC_CONDITIONS.init($('#subtab-lc'));
        FC.LOGIC_CONDITIONS.render();
        GUI.switchery();

        FC.PROGRAMMING_PID.init($('#subtab-pid'));
        FC.PROGRAMMING_PID.render();
        GUI.switchery();

        FC.GLOBAL_VARIABLES_STATUS.init($(".gvar__container"));

        tabs.init($('.tab-programming'));

        i18n.localize();;

        $('#save-button').on('click', function () {
            saveChainer.execute();
            GUI.log(i18n.getMessage('programmingEepromSaved'));
        });

        interval.add('logic_conditions_pull', function () {
            statusChainer.execute();
        }, 100);

        GUI.content_ready(callback);
    }

    function onStatusPullDone() {
        FC.LOGIC_CONDITIONS.update(FC.LOGIC_CONDITIONS_STATUS);
        FC.GLOBAL_VARIABLES_STATUS.update($('.tab-programming'));
        FC.PROGRAMMING_PID.update(FC.PROGRAMMING_PID_STATUS);
    }
}

TABS.programming.cleanup = function (callback) {
    if (callback) callback();
};