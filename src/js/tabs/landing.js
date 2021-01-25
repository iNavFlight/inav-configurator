'use strict';
/*global $,TABS,GUI,googleAnalytics*/

TABS.landing = {};
TABS.landing.initialize = function (callback) {

    if (GUI.active_tab != 'landing') {
        GUI.active_tab = 'landing';
        googleAnalytics.sendAppView('Landing');
    }

    GUI.load("./tabs/landing.html", function () {
        localize();

        $('.tab-landing a').click(function () {
            googleAnalytics.sendEvent('ExternalUrls', 'Click', $(this).prop('href'));
        });

        GUI.content_ready(callback);
    });

};

TABS.landing.cleanup = function (callback) {
    if (callback) callback();
};
