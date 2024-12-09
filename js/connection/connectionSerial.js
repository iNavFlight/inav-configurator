'use strict'

import { GUI } from './../gui';
import { ConnectionType, Connection } from './connection';
import i18n from './../localization';
import { data } from 'jquery';

class ConnectionSerial extends Connection {
    constructor() {
        super();
        this._errorListeners = [];
        this._onReceiveListeners = [];
        this._onErrorListener = [];
        super._type = ConnectionType.Serial;

        window.electronAPI.onSerialData(buffer => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: buffer
                });
            });
        });

        window.electronAPI.serialClose(() => {
            console.log("Serial conenection closed");
            this.abort();
        });

        window.electronAPI.onSerialError(error => {
            GUI.log(error);
            console.log(error);
            this.abort()
        
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);
            });
        });
    }

    connectImplementation(path, options, callback) {
        
        window.electronAPI.serialConnect(path, options).then(response => {
            if (!response.error) {
                GUI.log(i18n.getMessage('connectionConnected', [`${path} @ ${options.bitrate} baud`]));
                this._connectionId = response.id;
                if (callback) {
                    callback({
                        bitrate: options.bitrate,
                        connectionId: this._connectionId
                    });
                } 
            } else {
                console.log("Serial connection error: " + response.msg);
                if (callback) {
                    callback(false);
                }
            }
        });
    }

    disconnectImplementation(callback) {   
        if (this._connectionId) {
            window.electronAPI.serialClose().then(response => {
                var ok = true;
                if (response.error) {
                    console.log("Unable to close serial: " + response.msg);
                    ok = false;
                }            
                if (callback) {
                    callback(ok);
                }
            });  
        }  
    }

    sendImplementation(data, callback) {        
        if (this._connectionId) {
            window.electronAPI.serialSend(data).then(response => {
                var result = 0;
                var sent = response.bytesWritten;
                if (response.error) {
                    console.log("Serial write error: " + response.msg);
                    result = 1;
                    sent = 0;
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

    static async getDevices() {
        return window.electronAPI.listSerialDevices();
    }
}

export default ConnectionSerial;
