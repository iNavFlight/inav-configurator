'use strict'

const net = require('net')

const { GUI } = require('./../gui');
const  { ConnectionType, Connection } = require('./connection')
const i18n = require('./../localization');

const STANDARD_TCP_PORT = 5761;

class ConnectionTcp extends Connection {
    
    constructor() {
        super();
        
        this._socket = null;
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

        try {
            this._socket = net.connect({ host: this._connectionIP, port: this._connectionPort }, () => {
                this._socket.setNoDelay(true);
                GUI.log(i18n.getMessage('connectionConnected', ["tcp://" + this._connectionIP + ":" + this._connectionPort]));
                
                if (callback) {
                    callback({
                        bitrate: 115200,
                        connectionId: ++this._connectionId
                    });
                }

            });
        } catch (error) {
            console.log(error);
            callback(false);
        }

        this._socket.on('data', buffer => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: buffer
                });
            });
        })

        this._socket.on('end', () => {
            console.log("TCP Remote has closed the connection");
            if (this._socket) {
                this.abort();
            }
        });

        this._socket.on('error', (error) => {
            GUI.log(error);
            console.log(error);
            
            if (this._socket) {
                this.abort();
            }               
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);    
            });
        });
    }

    disconnectImplementation(callback) {
        
        if (this._socket && !this._socket.destroyed) {
            this._socket.end();
        }

        this._connectionIP = "";
        this._connectionPort = 0;
        this._socket = null;

       if (callback) {
           callback(true);
       }
    }

   sendImplementation(data, callback) {;
        if (this._socket && !this._socket.destroyed) {
            this._socket.write(Buffer.from(data), () => {
                if (callback) {
                    callback({
                        bytesSent: data.byteLength,
                        resultCode: 0
                    });
                }
            })
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

module.exports = ConnectionTcp;
