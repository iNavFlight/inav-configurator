'use strict'

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
    }

    connectImplementation(path, options, callback) {                       
        try {
            this._serialport = new SerialPortStream({binding, path: path, baudRate: options.bitrate, autoOpen: true}, () => {
                
                this._serialport.on('data', buffer => {
                    this._onReceiveListeners.forEach(listener => {
                        listener({
                            connectionId: this._connectionId,
                            data: buffer
                        });
                    });
                })

                this._serialport.on('error', error => {
                    console.log("Serial error: " + error);
                    this._onReceiveErrorListeners.forEach(listener => {
                        listener(error);    
                    });
                });
                
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
    }

    disconnectImplementation(callback) {        
        if (this._serialport && this._serialport.isOpen) {
            this._serialport.close(error => {
                if (error) {
                    console.log("Unable to close serial: " + error)
                }
                if (callback) {
                    callback(error ? false : true);
                }
            });
        }
    }
    
    sendImplementation(data, callback) {
        if (this._serialport && this._serialport.isOpen) {
            this._serialport.write(Buffer.from(data), error => {
                var result = 0;
                if (error) {
                    result = 1;
                    console.log("Serial wrire error: " + error)
                }
                if (callback) {
                    callback({
                        bytesSent: data.byteLength,
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
                    devices.push(port.path);
                });
            }
            if (callback)
                callback(devices);
        });
    }
}
