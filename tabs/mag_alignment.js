'use strict';

TABS.mag_alignment = {};
TABS.mag_alignment.initialize = function (callback) {

    if (GUI.active_tab != 'mag_alignment') {
        GUI.active_tab = 'mag_alignment';
        //googleAnalytics.sendAppView('mag_alignment');
    }

    GUI.load("./tabs/mag_alignment.html", function () {
        $('#magAlignIFrame').load(function () {
            $(this).height($(this).contents().height());
            GUI.content_ready(callback);
        });

    })

    TABS.mag_alignment.cleanup = function (callback) {
        if (callback) callback();
    };

}