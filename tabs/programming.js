'use strict';

import MSPChainerClass from './../js/msp/MSPchainer';
import mspHelper from './../js/msp/MSPHelper';
import { GUI, TABS } from './../js/gui';
import FC from './../js/fc';
import tabs from './../js/tabs';
import i18n from './../js/localization';
import interval from './../js/intervals';

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
        import('./programming.html?raw').then(({default: html}) => GUI.load(html, processHtml));
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