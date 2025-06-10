'use strict';

const mspHelper = require('./msp/MSPHelper');
const serialPortHelper = require('./serialPortHelper');
const FC = require('./fc');
const features = require('./feature_framework');

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
                    features.execute(self.enableVirtulaPitot(config, callback));
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

    self.enableVirtulaPitot = function (config, callback) {
        if (config.value.port != '-1') {
            mspHelper.setSetting('pitot_hardware', "VIRTUAL", callback);
        } else {
            callback();
        }
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

module.exports = wizardSaveFramework;