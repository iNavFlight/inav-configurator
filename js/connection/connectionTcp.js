'use strict'

import { GUI } from './../gui';
import  { ConnectionType, Connection } from './connection';
import i18n from './../localization';
import bridge from '../bridge';

const STANDARD_TCP_PORT = 5761;

class ConnectionTcp extends Connection {
    constructor() {
        super();

        this._connectionIP = "";
        this.connectionPort = 0;
        this._onReceiveListeners = [];
        this._onErrorListener = [];
        super._type = ConnectionType.TCP;

        this._ipcDataHandler = null;
        this._ipcEndHandler = null;
        this._ipcErrorHandler = null;
    }

    registerListeners() {
        if (this._ipcDataHandler) {
            return; // Already registered
        }

        this._ipcDataHandler = window.electronAPI.onTcpData(buffer => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: event.detail
                });
            });
        });

        this._ipcEndHandler = window.electronAPI.onTcpEnd(() => {
            console.log("TCP Remote has closed the connection");
            this.abort();
        });

        this._ipcErrorHandler = window.electronAPI.onTcpError(error => {
            GUI.log(error);
            console.log(error);
            this.abort();
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);
            });
        });
    }

    removeListeners() {
        if (this._ipcDataHandler) {
            window.electronAPI.offTcpData(this._ipcDataHandler);
            this._ipcDataHandler = null;
        }
        if (this._ipcEndHandler) {
            window.electronAPI.offTcpEnd(this._ipcEndHandler);
            this._ipcEndHandler = null;
        }
        if (this._ipcErrorHandler) {
            window.electronAPI.offTcpError(this._ipcErrorHandler);
            this._ipcErrorHandler = null;
        }
    }

    connectImplementation(address, options, callback) {
        this.registerListeners();

        var addr = address.split(':');
        if (addr.length >= 2) {
            this._connectionIP = addr[0];
            this._connectionPort = parseInt(addr[1])
        } else {
            this._connectionIP = address[0];
            this._connectionPort = STANDARD_TCP_PORT;
        } 

        bridge.tcpConnect(this._connectionIP, this._connectionPort).then(response => {
            if (!response.error) {
                GUI.log(i18n.getMessage('connectionConnected', ["tcp://" + this._connectionIP + ":" + this._connectionPort]));
                this._connectionId = response.id;
                if (callback) {
                    callback({
                        bitrate: 115200,
                        connectionId: this._connectionId
                    });
                } 
            } else {
                console.log("TCP error " + response.errorMsg);
                if (callback) {
                    callback(false);
                }
            }
        });
    }

    disconnectImplementation(callback) {
        
        if (this._connectionId) {
            bridge.tcpClose();
        }

        this._connectionIP = "";
        this._connectionPort = 0;

       if (callback) {
           callback(true);
       }
    }

   sendImplementation(data, callback) {     
        if (this._connectionId) {
            bridge.tcpSend(data).then(response => {
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
}

export default ConnectionTcp;
