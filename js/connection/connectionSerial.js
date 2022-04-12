'use strict'

class ConnectionSerial extends Connection {
    
    constructor() {
        super();

        this._failed = 0;
    }

    connectImplementation(path, options, callback) {               
        chrome.serial.connect(path, options, (connectionInfo) => {                 
            this.checkChromeLastError();
            if (connectionInfo && !this._openCanceled) {           
                this.addOnReceiveErrorListener(info => {
                    console.error(info);
                        googleAnalytics.sendException('Serial: ' + info.error, false);

                        switch (info.error) {
                            case 'system_error': // we might be able to recover from this one
                                if (!this._failed++) {
                                    chrome.serial.setPaused(this._connectionId, false, function () {
                                        SerialCom.getInfo((info) => {
                                            if (info) {
                                                if (!info.paused) {
                                                    console.log('SERIAL: Connection recovered from last onReceiveError');
                                                    googleAnalytics.sendException('Serial: onReceiveError - recovered', false);

                                                    this._failed = 0;
                                                } else {
                                                    console.log('SERIAL: Connection did not recover from last onReceiveError, disconnecting');
                                                    GUI.log(chrome.i18n.getMessage('serialPortUnrecoverable'));
                                                    googleAnalytics.sendException('Serial: onReceiveError - unrecoverable', false);

                                                    this.abort();
                                                }
                                            } else {
                                                this.checkChromeLastError();
                                            }
                                        });
                                    });
                                }
                                break;

                            case 'break': // This occurs on F1 boards with old firmware during reboot
                            case 'overrun':
                            case 'frame_error': //Got disconnected
                                // wait 50 ms and attempt recovery
                                var error = info.error;
                                setTimeout(() => {
                                    chrome.serial.setPaused(info.connectionId, false, function() {
                                        SerialCom.getInfo(function (info) {
                                            if (info) {
                                                if (info.paused) {
                                                    // assume unrecoverable, disconnect
                                                    console.log('SERIAL: Connection did not recover from ' + error + ' condition, disconnecting');
                                                    GUI.log(chrome.i18n.getMessage('serialPortUnrecoverable'));;
                                                    googleAnalytics.sendException('Serial: ' + error + ' - unrecoverable', false);

                                                    this.abort();    
                                                } else {
                                                    console.log('SERIAL: Connection recovered from ' + error + ' condition');
                                                    googleAnalytics.sendException('Serial: ' + error + ' - recovered', false);
                                                }
                                            }
                                        });
                                    });
                                }, 50);
                                break;
                                
                            case 'timeout':
                                // TODO
                                break;
                                
                            case 'device_lost':
                            case 'disconnected':
                            default:
                                this.abort();
                        }
                });
                GUI.log(chrome.i18n.getMessage('connectionConnected', [path]));
            }

            if (callback) {
                callback(connectionInfo);
            }
        });
    }

    disconnectImplementation(callback) {        
        chrome.serial.disconnect(this._connectionId, (result) => {
            if (callback) {
                callback(result);
            }
        });
    }
    
    sendImplementation(data, callback) {
        chrome.serial.send(this._connectionId, data, callback);
    }

    addOnReceiveCallback(callback){
        chrome.serial.onReceive.addListener(callback);
    }

    removeOnReceiveCallback(callback){
        chrome.serial.onReceive.removeListener(callback);
    }

    addOnReceiveErrorCallback(callback) {
        chrome.serial.onReceiveError.addListener(callback);
    }

    removeOnReceiveErrorCallback(callback) {
        chrome.serial.onReceiveError.removeListener(callback);
    }

    static getDevices(callback) {
        chrome.serial.getDevices((devices_array) => {
            var devices = [];
            devices_array.forEach((device) => {
                devices.push(device.path);
            });
            callback(devices);
        });
    }

    static getInfo(connectionId, callback) {
        chrome.serial.getInfo(connectionId, callback);
    }

    static getControlSignals(connectionId, callback) {
        chrome.serial.getControlSignals(connectionId, callback);
    }

    static setControlSignals(connectionId, signals, callback) {
        chrome.serial.setControlSignals(connectionId, signals, callback);
    }
}
