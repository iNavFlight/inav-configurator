/*global chrome,helper,mspHelper*/
'use strict';

TABS.ez_tune = {

};

TABS.ez_tune.initialize = function (callback) {

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadEzTune,
    ];

    loadChain.push(mspHelper.loadRateProfileData);

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    if (GUI.active_tab != 'ez_tune') {
        GUI.active_tab = 'ez_tune';
        googleAnalytics.sendAppView('Ez Tune');
    }

    function load_html() {
        GUI.load("./tabs/ez_tune.html", Settings.processHtml(process_html));
    }

    function process_html() {
        localize();

        helper.tabs.init($('.tab-ez_tune'));
        helper.features.updateUI($('.tab-ez_tune'), FEATURES);

        GUI.sliderize($('#ez_tune_filter_hz'), EZ_TUNE.filterHz, 10, 300);
        GUI.sliderize($('#ez_tune_axis_ratio'), EZ_TUNE.axisRatio, 25, 175);
        GUI.sliderize($('#ez_tune_response'), EZ_TUNE.response, 0, 200);
        GUI.sliderize($('#ez_tune_damping'), EZ_TUNE.damping, 0, 200);
        GUI.sliderize($('#ez_tune_stability'), EZ_TUNE.stability, 0, 200);
        GUI.sliderize($('#ez_tune_aggressiveness'), EZ_TUNE.aggressiveness, 0, 200);

        GUI.sliderize($('#ez_tune_rate'), EZ_TUNE.rate, 0, 200);
        GUI.sliderize($('#ez_tune_expo'), EZ_TUNE.expo, 0, 200);

        GUI.simpleBind();

        GUI.content_ready(callback);
    }
    
};

TABS.ez_tune.cleanup = function (callback) {
    if (callback) {
        callback();
    }
};