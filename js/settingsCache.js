'use strict';

import FC from './fc';
import bridge from './bridge';

var settingsCache = (function() {

    let publicScope = {};
    let privateScope = {};

    const SETTINGS_KEY = 'settings';

    privateScope.getSetingKey = function(settingName) {
        return FC.CONFIG.target + '_' + FC.CONFIG.flightControllerVersion + '_' + FC.CONFIG.buildInfo + '_' + settingName;
    }

    publicScope.flush = function() {
        bridge.storeDelete(SETTINGS_KEY);
        console.log('Settings cache flushed');
    };

    publicScope.get = function(settingName) {
        let settings = bridge.storeGet(SETTINGS_KEY, null);

        if (settings === null) {
            return undefined;
        }
        let setting = settings[privateScope.getSetingKey(settingName)];
        return setting;
    };

    publicScope.set = function(settingName, value) {
        let settings = bridge.storeGet(SETTINGS_KEY, null);

        if (settings === null) {
            settings = {};
        }

        settings[privateScope.getSetingKey(settingName)] = value;
        bridge.storeSet(SETTINGS_KEY, settings);
    };

    return publicScope;
}());

export default settingsCache;