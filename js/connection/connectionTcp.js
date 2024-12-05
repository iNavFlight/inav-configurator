'use strict'

import { GUI } from './../gui';
import  { ConnectionType, Connection } from './connection';
import i18n from './../localization';

const STANDARD_TCP_PORT = 5761;

class ConnectionTcp extends Connection {
    
    constructor() {
        super();
        
        this._connectionIP =  "";
        this.connectionPort =  0;
        this._onReceiveListeners = [];
        this._onErrorListener = [];
        super._type = ConnectionType.TCP;
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

        window.electronAPI.tcpConnect(this._connectionIP, this._connectionPort).then(respose => {
            if (!respose.error) {
                GUI.log(i18n.getMessage('connectionConnected', ["tcp://" + this._connectionIP + ":" + this._connectionPort]));
                this._connectionId = respose.id;
                if (callback) {
                    callback({
                        bitrate: 115200,
                        connectionId: this._connectionId
                    });
                } 
            } else {
                console.log(respose.errorMsg);
                callback(false);
            }
        });

        window.electronAPI.onTcpData(buffer => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: buffer
                });
            });
        })

       window.electronAPI.onTcpEnd(() => {
            console.log("TCP Remote has closed the connection");
            if (this._connectionId) {
                this.abort();
                this.close
            }
        });

        window.electronAPI.onTcpError(error => {
            GUI.log(error);
            console.log(error);
            
            if (this._connectionId) {
                this.abort();
            }               
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);    
            });
        });
    }

    disconnectImplementation(callback) {
        
        if (this._connectionId >= 0) {
            window.electronAPI.tcpClose();
        }

        this._connectionIP = "";
        this._connectionPort = 0;
        this._connectionId = -1;

       if (callback) {
           callback(true);
       }
    }

   sendImplementation(data, callback) {;      
        if (this._connectionId) {
            window.electronAPI.tcpSend(this._connectionId, data).then(bytesSend => {
                if (callback) {
                    callback({
                        bytesSent: bytesSend,
                        resultCode: 0
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
