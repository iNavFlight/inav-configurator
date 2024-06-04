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
                console.log(config);
                
                let gpsBit = FC.getFeatures().find( feature => feature.name === 'GPS' ).bit;

                if (config.value == '-1') {
                    features.unset(gpsBit);

                    console.log('Unset GPS');
                    
                } else {
                    features.set(gpsBit);
                    console.log('Set GPS');
                }
                break;
            case 'gpsBaud':
                console.log(config);
                break;
            case 'gpsProtocol':
                console.log(config);
                break;
            default:
                callback();
                break;
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