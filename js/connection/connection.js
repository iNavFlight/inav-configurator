'use strict';

import GUI from './../gui';

const ConnectionType = {
    Serial: 0,
    TCP:    1,
    UDP:    2,
    BLE:    3
}

class Connection {

    constructor() {
        this._connectionId   = null;
        this._openRequested  = false;
        this._openCanceled   = false;
        this._bitrate        = 0;
        this._bytesReceived  = 0;
        this._bytesSent      = 0;
        this._transmitting   = false;
        this._outputBuffer   = [];
        this._onReceiveListeners      = [];
        this._onReceiveErrorListeners = [];
        this._type = null;
        
        if (this.constructor === Connection) {
            throw new TypeError("Abstract class, cannot be instanced.");
        }

        if (this.connectImplementation === Connection.prototype.connectImplementation) {
            throw new TypeError("connectImplementation is an abstract member and not implemented.")
        }

        if (this.disconnectImplementation === Connection.prototype.disconnectImplementation) {
            throw new TypeError("disconnectImplementation is an abstract member and not implemented.")
        }

        if (this.addOnReceiveCallback === Connection.prototype.addOnReceiveCallback) {
            throw new TypeError("addOnReceiveCallback is an abstract member and not implemented.")
        }

        if (this.removeOnReceiveCallback === Connection.prototype.removeOnReceiveCallback) {
            throw new TypeError("removeOnReceiveCallback is an abstract member and not implemented.")
        }

        if (this.addOnReceiveErrorCallback === Connection.prototype.addOnReceiveErrorCallback) {
            throw new TypeError("addOnReceiveErrorCallback is an abstract member and not implemented.")
        }

        if (this.removeOnReceiveErrorCallback === Connection.prototype.removeOnReceiveErrorCallback) {
            throw new TypeError("removeOnReceiveErrorCallback is an abstract member and not implemented.")
        }
    }

    get connectionId() {
        return this._connectionId;
    }

    get bitrate() {
        return this._bitrate;
    }

    get type() {
        return this._type;
    }

    connectImplementation(path, options, callback) {
        throw new TypeError("Abstract method");
    }

    connect(path, options, callback) {
        this._openRequested = true;
        this._openCanceled = false;
        this._failed = 0;
        this.connectImplementation(path, options, connectionInfo => {                   
            if (connectionInfo && !this._openCanceled) { 
                this._connectionId = connectionInfo.connectionId;
                this._bitrate = connectionInfo.bitrate;
                this._bytesReceived = 0;
                this._bytesSent = 0;    
                this._openRequested = false;
            
                this.addOnReceiveListener((info) => {
                    this._bytesReceived += info.data.byteLength;
                });

                console.log('Connection opened with ID: ' + connectionInfo.connectionId + ', Baud: ' + connectionInfo.bitrate); 

                if (callback) { 
                    callback(connectionInfo);
                }
            } else if (connectionInfo && this._openCanceled) {
                // connection opened, but this connect sequence was canceled
                // we will disconnect without triggering any callbacks
                this._connectionId = connectionInfo.connectionId;
                console.log('Connection opened with ID: ' + connectionInfo.connectionId + ', but request was canceled, disconnecting');

                // some bluetooth dongles/dongle drivers really doesn't like to be closed instantly, adding a small delay
                setTimeout(() => {
                    this._openRequested = false;
                    this._openCanceled = false;
                    this.disconnect(() => {
                        if (callback) {
                            callback(false);
                        }
                    });
                }, 150);
            } else if (this._openCanceled) {
                // connection didn't open and sequence was canceled, so we will do nothing
                console.log('Connection didn\'t open and request was canceled');
                this._openRequested = false;
                this._openCanceled = false;
                if (callback) {
                    callback(false);
                }
            } else {
                this._openRequested = false;
                console.log('Failed to open');
                if (callback) {
                    callback(false);
                }
            }
        });
    }
    
    disconnectImplementation(callback) {
        throw new TypeError("Abstract method");
    }

    // _connectionId can legitimately be 0 for some transports, so callers must
    // not test it for truthiness - only null/false mean "not connected".
    hasConnectionId() {
        return this._connectionId !== null && this._connectionId !== false;
    }

    disconnect(callback) {
        if (this.hasConnectionId()) {
            this.emptyOutputBuffer();
            this.removeAllListeners();

            // Clean up IPC listeners if the subclass implements this method
            if (typeof this.removeIpcListeners === 'function') {
                this.removeIpcListeners();
            }

            this.disconnectImplementation(result => {

                if (result) {
                    console.log('Connection with ID: ' + this._connectionId + ' closed, Sent: ' + this._bytesSent + ' bytes, Received: ' + this._bytesReceived + ' bytes');
                } else {
                    console.log('Failed to close connection with ID: ' + this._connectionId + ' closed, Sent: ' + this._bytesSent + ' bytes, Received: ' + this._bytesReceived + ' bytes');
                }

                this._connectionId = false;
                if (callback) {
                    callback(result);
                }
            });
        } else {
            this._openCanceled = true;

            // Port already gone: without this the singleton stays stuck with _transmitting
            // true. No listener teardown here - transports notify them after abort().
            this.emptyOutputBuffer();

            if (callback) {
                callback(false);
            }
        }
    }
    
    sendImplementation(data, callback) {
        throw new TypeError("Abstract method");
    }

    send(data, callback) {
        this._outputBuffer.push({'data': data, 'callback': callback});

        var send = () => {
            // store inside separate variables in case array gets destroyed
            var data = this._outputBuffer[0].data,
                callback = this._outputBuffer[0].callback;

                this.sendImplementation(data, sendInfo => {
                    // track sent bytes for statistics
                    this._bytesSent += sendInfo.bytesSent;

                    // fire callback
                    if (callback) {
                         callback(sendInfo);
                    }

                    // remove data for current transmission form the buffer
                    this._outputBuffer.shift();

                    // if there is any data in the queue fire send immediately, otherwise stop trasmitting
                    if (this._outputBuffer.length) {
                        // keep the buffer withing reasonable limits
                        if (this._outputBuffer.length > 100) {
                            var counter = 0;

                            while (this._outputBuffer.length > 100) {
                                this._outputBuffer.pop();
                                counter++;
                            }

                            console.log('Send buffer overflowing, dropped: ' + counter + ' entries');
                        }
                        send();
                    } else {
                        this._transmitting = false;
                    }
                });
        }

        if (!this._transmitting) {
            this._transmitting = true;
            send();
        }
    }
    
    abort() {
        if (GUI.connected_to || GUI.connecting_to) {
            $('a.connect').trigger('click');
        } else {
            this.disconnect();
        }
    }

    addOnReceiveCallback(callback) {
        throw new TypeError("Abstract method");
    }

    removeOnReceiveCallback(callback) {
        throw new TypeError("Abstract method");
    }

    addOnReceiveListener(callback) {
        this._onReceiveListeners.push(callback);
        // Note: Don't call addOnReceiveCallback here - it would duplicate the push
    }

    addOnReceiveErrorCallback(callback) {
        throw new TypeError("Abstract method");
    }

    removeOnReceiveErrorCallback(callback) {
        throw new TypeError("Abstract method");
    }

    addOnReceiveErrorListener(callback) {
        this._onReceiveErrorListeners.push(callback);
        // Note: Don't call addOnReceiveErrorCallback here - it would duplicate the push
    }

    // A throwing listener must not abort the loop - the rest would never see this
    // or any later chunk, and the exception would escape into the IPC handler.
    notifyReceiveListeners(info) {
        this._onReceiveListeners.forEach(listener => {
            try {
                listener(info);
            } catch (error) {
                console.error('Receive listener threw:', error);
            }
        });
    }

    notifyReceiveErrorListeners(error) {
        this._onReceiveErrorListeners.forEach(listener => {
            try {
                listener(error);
            } catch (listenerError) {
                console.error('Receive error listener threw:', listenerError);
            }
        });
    }

    /*
     * Bridge a transport's write promise onto sendImplementation()'s callback.
     * send() advances its queue only from there, so every path has to report once.
     * A null promise means there is no port left to write to.
     */
    completeSend(label, promise, callback) {
        const report = (bytesSent, resultCode) => {
            if (callback) {
                callback({ bytesSent: bytesSent, resultCode: resultCode });
            }
        };

        if (!promise) {
            report(0, 1);
            return;
        }

        promise.then(response => {
            if (response.error) {
                console.log(label + ' write error: ' + response.msg);
                report(0, 1);
            } else {
                report(response.bytesWritten, 0);
            }
        }).catch(error => {
            console.log(label + ' write failed: ' + error);
            report(0, 1);
        });
    }

    // Same for a transport's close promise - disconnect() has to hear back either way.
    completeClose(label, promise, callback) {
        if (!promise) {
            if (callback) {
                callback(false);
            }
            return;
        }

        promise.then(response => {
            if (response.error) {
                console.log('Unable to close ' + label + ': ' + response.msg);
            }
            if (callback) {
                callback(!response.error);
            }
        }).catch(this.reportFailure('Unable to close ' + label, callback));
    }

    // Rejection handler that reports a failed transport call instead of losing its callback.
    reportFailure(message, callback) {
        return error => {
            console.log(message + ': ' + error);
            if (callback) {
                callback(false);
            }
        };
    }

    removeAllListeners() {
        this._onReceiveListeners.forEach(listener => this.removeOnReceiveCallback(listener));
        this._onReceiveListeners = [];

        this._onReceiveErrorListeners.forEach(listener => this.removeOnReceiveErrorCallback(listener));
        this._onReceiveErrorListeners = [];
    }

    emptyOutputBuffer() {
        this._outputBuffer = [];
        this._transmitting = false;
    }

    /**
     * Default timeout values
     * @returns {number} [ms]
     */
    getTimeout() {
        if (this._bitrate >= 57600) {
            return 3000;
        } if (this._bitrate >= 19200) {
            return 4000;
        } else {
            return 6000;
        }
    }
}

export  { ConnectionType, Connection};