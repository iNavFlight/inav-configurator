'use strict';

const mspHelper = require('./msp/MSPHelper');
const serialPortHelper = require('./serialPortHelper');
const FC = require('./fc');

var wizardSaveFramework = (function () {

    let self = {};

    self.saveSetting = function (config, callback) {
        /*
        serialrx_provider to 2
        serialrx_provider to 6
        */
       
        switch (config.name) {
            case 'receiverPort':
                serialPortHelper.set(config.value, 'RX_SERIAL', null);
                mspHelper.saveSerialPorts(callback);
                break;
            case 'receiverProtocol':
                mspHelper.setSetting('serialrx_provider', config.value, callback);
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