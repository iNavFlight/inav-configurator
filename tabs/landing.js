'use strict';
/*global $,TABS,GUI*/

TABS.landing = {};
TABS.landing.initialize = function (callback) {

    if (GUI.active_tab != 'landing') {
        GUI.active_tab = 'landing';
        googleAnalytics.sendAppView('Landing');
    }

    $('#content').load("./tabs/landing.html", function () {
        // translate to user-selected language
        localize();

        $('div.welcome a, div.sponsors a').click(function () {
            googleAnalytics.sendEvent('ExternalUrls', 'Click', $(this).prop('href'));
        });

        GUI.content_ready(callback);
    });

};

TABS.landing.cleanup = function (callback) {
    if (callback) callback();
};
