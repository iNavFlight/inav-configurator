'use strict'

import { GUI } from './../gui';
import { ConnectionType, Connection } from './connection';
import i18n from './../localization';
import bridge from './../bridge';

const serialDevices = [
    { vendorId: 1027, productId: 24577 }, // FT232R USB UART
    { vendorId: 1155, productId: 12886 }, // STM32 in HID mode
    { vendorId: 1155, productId: 14158 }, // 0483:374e STM Electronics STLink Virtual COM Port (NUCLEO boards)
    { vendorId: 1155, productId: 22336 }, // STM Electronics Virtual COM Port
    { vendorId: 4292, productId: 60000 }, // CP210x
    { vendorId: 4292, productId: 60001 }, // CP210x
    { vendorId: 4292, productId: 60002 }, // CP210x
    { vendorId: 11836, productId: 22336 }, // AT32 VCP
    { vendorId: 12619, productId: 22336 }, // APM32 VCP
];

class ConnectionSerial extends Connection {
    constructor() {
        super();
        this._errorListeners = [];
        this._onReceiveListeners = [];
        this._onErrorListener = [];
        this._dataHandler = null;
        this._closeHandler = null;
        this._errorHandler = null;
        super._type = ConnectionType.Serial;        
    }

    registerListeners() {
        
        this._dataHandler = event => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: event.detail
                });
            });
        };
        bridge.serialEvents.addEventListener('data', this._dataHandler);

        this._closeHandler = event => {
            console.log("Serial conenection closed");
            this.abort();
        };
        bridge.serialEvents.addEventListener('close', this._closeHandler);

        this._errorHandler = event => {
            const error = event.detail;
            GUI.log(error);
            console.log(error);
            this.abort();

            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);
            });
        };
        bridge.serialEvents.addEventListener('error', this._errorHandler);
    }

    removeListeners() {
        bridge.serialEvents.removeEventListener('data', this._dataHandler);
        this._dataHandler = null;
        bridge.serialEvents.removeEventListener('close', this._closeHandler);
        this._closeHandler = null;
        bridge.serialEvents.removeEventListener('error', this._errorHandler);
        this._errorHandler = null;
    }

    removeIpcListeners() {
        if (this._ipcDataHandler) {
            window.electronAPI.offSerialData(this._ipcDataHandler);
            this._ipcDataHandler = null;
        }
        if (this._ipcCloseHandler) {
            window.electronAPI.offSerialClose(this._ipcCloseHandler);
            this._ipcCloseHandler = null;
        }
        if (this._ipcErrorHandler) {
            window.electronAPI.offSerialError(this._ipcErrorHandler);
            this._ipcErrorHandler = null;
        }
    }

    connectImplementation(path, options, callback) {
        this.registerListeners();
        bridge.serialConnect(path, options).then(response => {
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
            bridge.serialClose().then(response => {
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
            bridge.serialSend(data).then(response => {
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
        this._onReceiveListeners.push(callback);
    }

    removeOnReceiveCallback(callback){
        this._onReceiveListeners = this._onReceiveListeners.filter(listener => listener !== callback);
    }

    addOnReceiveErrorCallback(callback) {
        this._onReceiveErrorListeners.push(callback);
    }

    removeOnReceiveErrorCallback(callback) {
        this._onReceiveErrorListeners = this._onReceiveErrorListeners.filter(listener => listener !== callback);
    } 

    static async getDevices() {
        return await bridge.listSerialDevices();
    }
}

export default ConnectionSerial;
