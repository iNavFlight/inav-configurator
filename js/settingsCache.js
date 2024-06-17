'use strict';

const Store = require('electron-store');
const store = new Store();
const FC = require('./fc');

var settingsCache = (function() {

    let publicScope = {};
    let privateScope = {};

    const SETTINGS_KEY = 'settings';

    privateScope.getSetingKey = function(settingName) {
        return FC.CONFIG.target + '_' + FC.CONFIG.flightControllerVersion + '_' + FC.CONFIG.buildInfo + '_' + settingName;
    }

    publicScope.flush = function() {
        store.delete(SETTINGS_KEY);
        console.log('Settings cache flushed');
    };

    publicScope.get = function(settingName) {
        let settings = store.get(SETTINGS_KEY, null);

        if (settings === null) {
            return undefined;
        }
        let setting = settings[privateScope.getSetingKey(settingName)];
        return setting;
    };

    publicScope.set = function(settingName, value) {
        let settings = store.get(SETTINGS_KEY, null);

        if (settings === null) {
            settings = {};
        }

        settings[privateScope.getSetingKey(settingName)] = value;
        store.set(SETTINGS_KEY, settings);
    };

    return publicScope;
}());

module.exports = settingsCache;