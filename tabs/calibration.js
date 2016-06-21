'use strict';

TABS.calibration = {};

TABS.calibration.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'calibration') {
        GUI.active_tab = 'calibration';
        googleAnalytics.sendAppView('Calibration');
    }

    /*
    function load_ident() {
        MSP.send_message(MSP_codes.MSP_IDENT, false, false, load_config);
    }

    function load_config() {
        MSP.send_message(MSP_codes.MSP_BF_CONFIG, false, false, load_misc_data);
    }

    function load_misc_data() {
        MSP.send_message(MSP_codes.MSP_MISC, false, false, load_html);
    }
    */

    function load_html() {
        $('#content').load("./tabs/calibration.html", process_html);
    }

    MSP.send_message(MSP_codes.MSP_STATUS, false, false, load_html);

    function process_html() {
        // translate to user-selected language
        localize();

        // status data pulled via separate timer with static speed
        GUI.interval_add('status_pull', function status_pull() {
            MSP.send_message(MSP_codes.MSP_STATUS);
        }, 250, true);

        GUI.content_ready(callback);
    }
};

TABS.calibration.cleanup = function (callback) {
    if (callback) callback();
};
