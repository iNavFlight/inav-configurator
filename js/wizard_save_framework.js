'use strict';

import mspHelper from './msp/MSPHelper';
import serialPortHelper from './serialPortHelper';
import FC from './fc';
import features from './feature_framework';

var wizardSaveFramework = (function () {

    let self = {};

    self.saveSetting = function (config, callback) {
       
        switch (config.name) {
            case 'receiverPort':
                serialPortHelper.set(config.value, 'RX_SERIAL', null);
                mspHelper.saveSerialPorts(callback);
                break;
            case 'receiverProtocol':
                mspHelper.setSetting('serialrx_provider', config.value, callback);
                break;
            case 'gpsPort':
                
                let gpsBit = FC.getFeatures().find( feature => feature.name === 'GPS' ).bit;

                if (config.value.port == '-1') {
                    features.unset(gpsBit);
                } else {
                    features.set(gpsBit);
                }

                serialPortHelper.set(config.value.port, 'GPS', config.value.baud);
                mspHelper.saveSerialPorts(function () {
                    features.execute(function () {
                        self.enableVirtualPitot(config, callback);
                    });
                });
                break;
            case 'gpsProtocol':
                mspHelper.setSetting('gps_provider', config.value, callback);
                break;
            default:
                callback();
                break;
        }
    };

    /*
     * The virtual pitot derives airspeed from GPS and the wind estimator, which is
     * only of use on a fixed wing. Every other platform keeps the firmware default.
     * An airspeed sensor that is already selected is never replaced either, so
     * re-running the wizard does not take a pitot away from the user.
     */
    self.enableVirtualPitot = function (config, callback) {
        if (config.value.port == '-1' || !FC.isAirplane()) {
            callback();
            return;
        }

        mspHelper.getSetting('pitot_hardware').then(function (data) {
            if (data?.setting?.table?.values?.[data.value] == 'NONE') {
                mspHelper.setSetting('pitot_hardware', "VIRTUAL", callback);
            } else {
                callback();
            }
        }).catch(function () {
            callback();
        });
    };

    self.handleSetting = function (configs, finalCallback) {

        if (configs.length > 0) {
            let setting = configs.shift();
            self.saveSetting(setting, function () {
                self.handleSetting(configs, finalCallback);
            });
        } else {
            console.log('Nothing to save');
            finalCallback();
        }
    };

    self.persist = function (config, finalCallback) {
        if (config === null || config === undefined || config.length === 0) {
            finalCallback();
            return;
        }   

        let configCopy = Array.from(config);

        self.handleSetting(configCopy, finalCallback);
    }

    return self;
})();

export default wizardSaveFramework;