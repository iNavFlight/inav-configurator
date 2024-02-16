'use strict';

/*global $,TABS,GUI*/

TABS.landing = {};
TABS.landing.initialize = function (callback) {

    if (GUI.active_tab != 'landing') {
        GUI.active_tab = 'landing';
    }
    GUI.load(path.join(__dirname, "tabs/landing.html"), function () {
        localization.localize();

        $('.tab-landing a').click(function () {
           // googleAnalytics.sendEvent('ExternalUrls', 'Click', $(this).prop('href'));
        });

        GUI.content_ready(callback);
    });

};

TABS.landing.cleanup = function (callback) {
    if (callback) callback();
};
