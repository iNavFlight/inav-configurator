'use strict';

import GUI from './../js/gui';
import i18n from './../js/localization';

const landing = {};
landing.initialize = function (callback) {

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
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

const landingTab = landing;

export default landingTab;
