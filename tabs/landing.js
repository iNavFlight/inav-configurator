'use strict';

import { GUI, TABS } from './../js/gui';
import i18n from './../js/localization';

const landing = {};
landing.initialize = function (callback) {

    if (GUI.active_tab != 'landing') {
        GUI.active_tab = 'landing';
    }
    import('./landing.html?raw').then(({default: html}) => {
        GUI.load(html, () => {
            i18n.localize();
            GUI.content_ready(callback);
        });
    });
};

landing.cleanup = function (callback) {
    if (callback) callback();
};

TABS.landing = landing;