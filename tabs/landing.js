'use strict';

const path = require('path');
const { GUI, TABS } = require('./../js/gui');
const i18n = require('./../js/localization');

const landing = {};
landing.initialize = function (callback) {

    if (GUI.active_tab != 'landing') {
        GUI.active_tab = 'landing';
    }
    GUI.load(path.join(__dirname, "landing.html"), function () {
        i18n.localize();
        GUI.content_ready(callback);
    });

};

landing.cleanup = function (callback) {
    if (callback) callback();
};

TABS.landing = landing;