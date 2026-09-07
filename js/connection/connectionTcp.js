'use strict'

import GUI from './../gui';
import  { ConnectionType, Connection } from './connection';
import i18n from './../localization';

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

    registerIpcListeners() {
        if (this._ipcDataHandler) {
            return; // Already registered
        }

        this._ipcDataHandler = window.electronAPI.onTcpData(buffer => {
            this.notifyReceiveListeners({
                connectionId: this._connectionId,
                data: buffer
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
            this.notifyReceiveErrorListeners(error);
        });
    }

    removeIpcListeners() {
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
        this.registerIpcListeners();

        var addr = address.split(':');
        if (addr.length >= 2) {
            this._connectionIP = addr[0];
            this._connectionPort = parseInt(addr[1])
        } else {
            this._connectionIP = address[0];
            this._connectionPort = STANDARD_TCP_PORT;
        } 

        window.electronAPI.tcpConnect(this._connectionIP, this._connectionPort).then(response => {
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
        }).catch(this.reportFailure("TCP connection failed", callback));
    }

    disconnectImplementation(callback) {

        if (this.hasConnectionId()) {
            window.electronAPI.tcpClose();
        }

        this._connectionIP = "";
        this._connectionPort = 0;

       if (callback) {
           callback(true);
       }
    }

    sendImplementation(data, callback) {
        this.completeSend('TCP', this.hasConnectionId() ? window.electronAPI.tcpSend(data) : null, callback);
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
