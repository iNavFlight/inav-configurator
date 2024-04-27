'use strict'

const { GUI } = require('./../gui');

const { ConnectionType, Connection } = require('./connection')
const { SerialPort } = require('serialport');
const { SerialPortStream } = require('@serialport/stream');
const { autoDetect } = require('@serialport/bindings-cpp')
const binding = autoDetect();

class ConnectionSerial extends Connection {
    constructor() {
        super();
        this._serialport = null;
        this._errorListeners = [];
        this._onReceiveListeners = [];
        this._onErrorListener = [];
        super._type = ConnectionType.Serial;
    }

    connectImplementation(path, options, callback) {
        try {
            this._serialport = new SerialPortStream({binding, path: path, baudRate: options.bitrate, autoOpen: true}, () => {
                if (callback) {
                    callback({
                        connectionId: ++this._connectionId,
                        bitrate: options.bitrate
                    });
                }
            });
        } catch (error) {
            console.log(error);
            callback(false);
        }

        this._serialport.on('data', buffer => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: buffer
                });
            });
        });

        this._serialport.on('close', error => {
            this.abort();
        });

        this._serialport.on('error', error => {
            this.abort();
            console.log("Serial error: " + error);
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);
            });
        });
    }

    disconnectImplementation(callback) {
        if (this._serialport && this._serialport.isOpen) {
            this._serialport.close(error => {
                if (error) {
                    console.log("Unable to close serial: " + error)
                }
            });
        }

        if (callback) {
            callback(true);
        }
    }

    sendImplementation(data, callback) {
        if (this._serialport && this._serialport.isOpen) {
            this._serialport.write(Buffer.from(data), error => {
                var result = 0;
                var sent = data.byteLength;
                if (error) {
                    result = 1;
                    sent = 0;
                    console.log("Serial write error: " + error)
                }
                if (callback) {
                    callback({
                        bytesSent: sent,
                        resultCode: result
                    });
                }
            });
        }
    }

    addOnReceiveCallback(callback){
        this._onReceiveErrorListeners.push(callback);
    }

    removeOnReceiveCallback(callback){
        this._onReceiveListeners = this._onReceiveErrorListeners.filter(listener => listener !== callback);
    }

    addOnReceiveErrorCallback(callback) {
        this._onReceiveErrorListeners.push(callback);
    }

    removeOnReceiveErrorCallback(callback) {
        this._onReceiveErrorListeners = this._onReceiveErrorListeners.filter(listener => listener !== callback);
    }

    static async getDevices(callback) {
        SerialPort.list().then((ports, error) => {
            var devices = [];
            if (error) {
                GUI.log("Unable to list serial ports.");
            } else {
                ports.forEach(port => {
                    if (GUI.operating_system == 'Linux') {
			/* Limit to: USB serial, RFCOMM (BT), 6 legacy devices */
			if (port.pnpId ||
			    port.path.match(/rfcomm\d*/) ||
			    port.path.match(/ttyS[0-5]$/)) {
			    devices.push(port.path);
                        }
		    } else {
			devices.push(port.path);
		    }
                });
            }
            if (callback)
                callback(devices);
        });
    }
}

module.exports = ConnectionSerial;
