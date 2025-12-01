'use strict'

import { GUI } from './../gui';
import  { ConnectionType, Connection } from './connection';
import i18n from './../localization';
import bridge from '../bridge';

const STANDARD_TCP_PORT = 5761;

class ConnectionTcp extends Connection {    
    constructor() {
        super();
        
        this._connectionIP =  "";
        this.connectionPort =  0;
        this._onReceiveListeners = [];
        this._onErrorListener = [];
        super._type = ConnectionType.TCP;

        bridge.tcpEvents.addEventListener('data', event => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: event.detail
                });
            });
        });

       bridge.tcpEvents.addEventListener('close', event => {
            console.log("TCP Remote has closed the connection");
            this.abort();
        });

        bridge.tcpEvents.addEventListener('error', event => {
            const error = event.detail;
            GUI.log(error);
            console.log(error);
            this.abort();                          
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);    
            });
        });
    }

    connectImplementation(address, options, callback) {     
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
}

export default ConnectionTcp;
