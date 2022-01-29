'use strict'

var serialCom = {
    connect: function(path, options, callback) {
        ret = false;
        chrome.serial.connect(path, options, function (connectionInfo) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }          
            
            if (connectionInfo && !serial.openCanceled) {
                
                serial.connectionId = connectionInfo.connectionId;
                serial.bitrate = connectionInfo.bitrate;
                serial.bytesReceived = 0;
                serial.bytesSent = 0;
                serial.failed = 0;
                serial.openRequested = false;

                serial.onReceive.addListener(function log_bytesReceived(info) {
                    serial.bytesReceived += info.data.byteLength;
                });

                serial.onReceiveError.addListener(function watch_for_on_receive_errors(info) {
                    console.error(info);
                    googleAnalytics.sendException('Serial: ' + info.error, false);

                    switch (info.error) {
                        case 'system_error': // we might be able to recover from this one
                            if (!serial.failed++) {
                                chrome.serial.setPaused(serial.connectionId, false, function () {
                                    serial.getInfo(function (info) {
                                        if (info) {
                                            if (!info.paused) {
                                                console.log('SERIAL: Connection recovered from last onReceiveError');
                                                googleAnalytics.sendException('Serial: onReceiveError - recovered', false);

                                                serial.failed = 0;
                                            } else {
                                                console.log('SERIAL: Connection did not recover from last onReceiveError, disconnecting');
                                                GUI.log('Unrecoverable <span style="color: red">failure</span> of serial connection, disconnecting...');
                                                googleAnalytics.sendException('Serial: onReceiveError - unrecoverable', false);

                                                if (GUI.connected_to || GUI.connecting_to) {
                                                    $('a.connect').click();
                                                } else {
                                                    serial.disconnect();
                                                }
                                            }
                                        } else {
                                            if (chrome.runtime.lastError) {
                                                console.error(chrome.runtime.lastError.message);
                                            }
                                        }
                                    });
                                });
                            }
                            break;

                        case 'break': // This occurs on F1 boards with old firmware during reboot
                        case 'overrun':
                        case 'frame_error': //Got disconnected
                            // wait 50 ms and attempt recovery
                            serial.error = info.error;
                            setTimeout(function() {
                                chrome.serial.setPaused(info.connectionId, false, function() {
                                    serial.getInfo(function (info) {
                                        if (info) {
                                            if (info.paused) {
                                                // assume unrecoverable, disconnect
                                                console.log('SERIAL: Connection did not recover from ' + serial.error + ' condition, disconnecting');
                                                GUI.log('Unrecoverable <span style="color: red">failure</span> of serial connection, disconnecting...');
                                                googleAnalytics.sendException('Serial: ' + serial.error + ' - unrecoverable', false);
    
                                                if (GUI.connected_to || GUI.connecting_to) {
                                                    $('a.connect').click();
                                                } else {
                                                    serial.disconnect();
                                                }
                                            }
                                            else {
                                                console.log('SERIAL: Connection recovered from ' + serial.error + ' condition');
                                                googleAnalytics.sendException('Serial: ' + serial.error + ' - recovered', false);
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
                            if (GUI.connected_to || GUI.connecting_to) {
                                $('a.connect').click();
                            } else {
                                serial.disconnect();
                            }
                            break;
                            
                        case 'disconnected':
                            // TODO
                            break;
                    }
                });
                console.log('SERIAL: Connection opened with ID: ' + connectionInfo.connectionId + ', Baud: ' + connectionInfo.bitrate);
                ret = connectionInfo;                
            };
            callback(ret);
        });
    },

    disconnect: function(funcRef) {
        chrome.serial.disconnect(serial.connectionId, function (result) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError.message);
            }

            if (result) {
                console.log('SERIAL: Connection with ID: ' + serial.connectionId + ' closed, Sent: ' + serial.bytesSent + ' bytes, Received: ' + serial.bytesReceived + ' bytes');
            } else {
                console.log('SERIAL: Failed to close connection with ID: ' + serial.connectionId + ' closed, Sent: ' + serial.bytesSent + ' bytes, Received: ' + serial.bytesReceived + ' bytes');
                googleAnalytics.sendException('Serial: FailedToClose', false);
            }
            funcRef(result);
        });
    },
    
    getDevices: function (callback) {
        chrome.serial.getDevices(function (devices_array) {
            var devices = [];
            devices_array.forEach(function (device) {
                devices.push(device.path);
            });

            callback(devices);
        });
    },
    
    getInfo: function (connectionId, callback) {
        chrome.serial.getInfo(connectionId, callback);
    },

    getControlSignals: function (connectionId, callback) {
        chrome.serial.getControlSignals(connectionId, callback);
    },

    setControlSignals: function (connectionId, signals, callback) {
        chrome.serial.setControlSignals(connectionId, signals, callback);
    },

    send: function(id, data, callback) {;
        chrome.serial.send(id, data, function (sendInfo) {
           callback(sendInfo);
        });
    },

    registerOnRecieveCallback: function() {
            serial.onReceive.register(function(listener){
                chrome.serial.onReceive.addListener(listener)
            });
        },

    addReceiveErrorListener: function(funcRef) {
        chrome.serial.onReceiveError.addListener(funcRef);   
    },

    removeReceiveErrorListener: function(funcRef) {
        chrome.serial.onReceiveError.removeListener(funcRef);  
    }
}
