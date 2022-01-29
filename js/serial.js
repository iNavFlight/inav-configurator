'use strict';

const serialType = {
    COM: 0,
    BLE: 1
}

var serial = {
    serialType:      serialType.COM,
    connectionId:    false,
    openRequested:   false,
    openCanceled:    false,
    bitrate:         0,
    bytesReceived:   0,
    bytesSent:       0,
    failed:          0,

    transmitting:   false,
    outputBuffer:  [],

    connect: function (path, options, callback) {
        var self = this;
        self.openRequested = true;

        function connectPost(connectionInfo) {
            if (connectionInfo && callback) { 
                callback(connectionInfo);
            } else if (connectionInfo && self.openCanceled) {
                // connection opened, but this connect sequence was canceled
                // we will disconnect without triggering any callbacks
                self.connectionId = connectionInfo.connectionId;
                console.log('SERIAL: Connection opened with ID: ' + connectionInfo.connectionId + ', but request was canceled, disconnecting');

                // some bluetooth dongles/dongle drivers really doesn't like to be closed instantly, adding a small delay
                setTimeout(function initialization() {
                    self.openRequested = false;
                    self.openCanceled = false;
                    self.disconnect(function resetUI() {
                        if (callback) callback(false);
                    });
                }, 150);
            } else if (self.openCanceled) {
                // connection didn't open and sequence was canceled, so we will do nothing
                console.log('SERIAL: Connection didn\'t open and request was canceled');
                self.openRequested = false;
                self.openCanceled = false;
                if (callback) callback(false);
            } else {
                self.openRequested = false;
                console.log('SERIAL: Failed to open serial port');
                googleAnalytics.sendException('Serial: FailedToOpen', false);
                if (callback) callback(false);
            }
        }

        switch (this.serialType) {
            case serialType.COM: 
                serialCom.connect(path, options, connectPost);
                serialCom.registerOnRecieveCallback();
                break;
            case serialType.BLE:
                serialBle.connect(connectPost);
                break;
            default:
                break;
        }
    },
    disconnect: function (callback) {
        var self = this;
        if (self.connectionId) {
            self.emptyOutputBuffer();

            // remove listeners
            for (var i = (self.onReceive.listeners.length - 1); i >= 0; i--) {
                self.onReceive.removeListener(self.onReceive.listeners[i]);
            }

            for (var i = (self.onReceiveError.listeners.length - 1); i >= 0; i--) {
                self.onReceiveError.removeListener(self.onReceiveError.listeners[i]);
            }
            
            var func = false;
            if (this.serialType == serialType.COM) {
                func = serialCom.disconnect;
            } else if (this.serialType == serialType.BLE) {
                func = serialBle.disconnect;
            }

            if (func) {
                func(function(result) {
                    if (callback) callback(result);
                });
            }
            
            self.connectionId = false;
            self.bitrate = 0
            
            
        } else {
            // connection wasn't opened, so we won't try to close anything
            // instead we will rise canceled flag which will prevent connect from continueing further after being canceled
            self.openCanceled = true;
        }
    },
    
    getDevices: function (callback) {
        serialCom.getDevices(callback);
    },

    getInfo: function (callback) {
        serialCom.getInfo(this.connectionId, callback);
    },

    getControlSignals: function (callback) {
        serialCom.getControlSignals(this.connectionId, callback);
    },

    setControlSignals: function (signals, callback) {
        serialCom.setControlSignals(this.connectionId, signals, callback);
    },

    send: function (data, callback) {
        var self = this;
        this.outputBuffer.push({'data': data, 'callback': callback});

        function send() {
            // store inside separate variables in case array gets destroyed
            var data = self.outputBuffer[0].data,
                callback = self.outputBuffer[0].callback;

            var sendFunc;
            switch (self.serialType) {
                case serialType.COM: 
                    sendFunc = serialCom.send;
                    break;
                case serialType.BLE:
                    sendFunc = serialBle.send;
                    break;
                default:
                    return;
            }

            sendFunc(self.connectionId, data, function (sendInfo) {
                // track sent bytes for statistics
                self.bytesSent += sendInfo.bytesSent;

                // fire callback
                if (callback) callback(sendInfo);

                // remove data for current transmission form the buffer
                self.outputBuffer.shift();

                // if there is any data in the queue fire send immediately, otherwise stop trasmitting
                if (self.outputBuffer.length) {
                    // keep the buffer withing reasonable limits
                    if (self.outputBuffer.length > 100) {
                        var counter = 0;

                        while (self.outputBuffer.length > 100) {
                            self.outputBuffer.pop();
                            counter++;
                        }

                        console.log('SERIAL: Send buffer overflowing, dropped: ' + counter + ' entries');
                    }

                    send();
                } else {
                    self.transmitting = false;
                }
            });
        }

        if (!this.transmitting) {
            this.transmitting = true;
            send();
        }
    },
    onReceive: {
        listeners: [],

        register: function(registerFunction) {
            registerFunction(this.mainListener);
        },
        
        mainListener: function(info) {
            for (var i = (serial.onReceive.listeners.length - 1); i >= 0; i--) {
                serial.onReceive.listeners[i](info);
            }
        },

        addListener: function (function_reference) {         
            this.listeners.push(function_reference);
        },

        removeListener: function (function_reference) {
            for (var i = (this.listeners.length - 1); i >= 0; i--) {
                if (this.listeners[i] == function_reference) {
                    this.listeners.splice(i, 1);
                    break;
                }
            }
        }
    },
    onReceiveError: {
        listeners: [],

        addListener: function (function_reference) {
            serialCom.addReceiveErrorListener(function_reference);
            this.listeners.push(function_reference);
        },
        removeListener: function (function_reference) {
            for (var i = (this.listeners.length - 1); i >= 0; i--) {
                if (this.listeners[i] == function_reference) {
                    serialCom.removeReceiveErrorListener(function_reference);

                    this.listeners.splice(i, 1);
                    break;
                }
            }
        }
    },

    emptyOutputBuffer: function () {
        this.outputBuffer = [];
        this.transmitting = false;
    },

    /**
     * Default timeout value for serial messages
     * @returns {number} [ms]
     */
    getTimeout: function () {
        if (serial.bitrate >= 57600) {
            return 3000;
        } else {
            return 6000;
        }
    }

};