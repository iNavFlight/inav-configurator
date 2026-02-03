'use strict';

import FC from './fc';
import store from './store';

var settingsCache = (function() {

    let publicScope = {};
    let privateScope = {};

    const SETTINGS_KEY = 'settings';

    privateScope.getSetingKey = function(settingName) {
        return FC.CONFIG.target + '_' + FC.CONFIG.flightControllerVersion + '_' + FC.CONFIG.buildInfo + '_' + settingName;
    }

    publicScope.flush = async function() {
        await store.delete(SETTINGS_KEY);
        console.log('Settings cache flushed');
    };

    publicScope.get = async function(settingName) {
        let settings = await store.get(SETTINGS_KEY, null);

        if (settings === null) {
            return undefined;
        }
        let setting = settings[privateScope.getSetingKey(settingName)];
        return setting;
    };

    publicScope.set = async function(settingName, value) {
        let settings = await store.get(SETTINGS_KEY, null);

        if (settings === null) {
            settings = {};
        }

        settings[privateScope.getSetingKey(settingName)] = value;
        await store.set(SETTINGS_KEY, settings);
    };

    return publicScope;
}());

export default settingsCache;
