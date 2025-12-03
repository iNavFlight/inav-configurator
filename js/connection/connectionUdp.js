'use strict'

import  { ConnectionType, Connection } from './connection';

import GUI from './../gui';
import i18n from './../localization';
import bridge from '../bridge';

const STANDARD_UDP_PORT = 5761;

//const socket = window.electronAPI.dgramCreateSocket('udp4');
class ConnectionUdp extends Connection {

    constructor() {
        super();

        this._connectionIP = "";
        this._connectionPort = 0;
        this._onReceiveListeners = [];
        this._onErrorListener = [];
        super._type = ConnectionType.UDP;

        this._ipcMessageHandler = null;
        this._ipcErrorHandler = null;
    }

    registerListeners() {
        if (this._ipcMessageHandler) {
            return; // Already registered
        }

        this._ipcMessageHandler = window.electronAPI.onUdpMessage(message => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: event.detail
                });
            });
        });

        this._ipcErrorHandler = window.electronAPI.onUdpError(error => {
            GUI.log(error);
            console.log(error);
            this.abort();
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);
            });
        });
    }

    removeListeners() {
        if (this._ipcMessageHandler) {
            window.electronAPI.offUdpMessage(this._ipcMessageHandler);
            this._ipcMessageHandler = null;
        }
        if (this._ipcErrorHandler) {
            window.electronAPI.offUdpError(this._ipcErrorHandler);
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
            this._connectionPort = STANDARD_UDP_PORT;
        } 

        bridge.udpConnect(this._connectionIP, this._connectionPort).then(response => {
            if (!response.error) {
                GUI.log(i18n.getMessage('connectionConnected', ["udp://" + this._connectionIP + ":" + this._connectionPort]));
                this._connectionId = response.id;
                if (callback) {
                    callback({
                        bitrate: 115200,
                        connectionId: this._connectionId
                    });
                } 
            } else {
                console.log("UDP error: " + response.msg);
                if (callback) {
                    callback(false);
                }
            }
        });
    }

    disconnectImplementation(callback) {
        if (this._connectionId) {
            bridge.udpClose().then(response => {
                var ok = true;
                if (response.error) {
                    console.log("Unable to close UDP: " + response.msg);
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
            bridge.udpSend(data).then(response => {
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

export default ConnectionUdp;
