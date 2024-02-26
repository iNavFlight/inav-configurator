'use strict'

const  { ConnectionType, Connection } = require('./connection')
const dgram = require('node:dgram');
const socket = dgram.createSocket('udp4');

const { GUI } = require('./../gui');
const i18n = require('./../localization');

const STANDARD_UDP_PORT = 5761;
class ConnectionUdp extends Connection {
    
    constructor() {
        super();
        
        this._connectionIP =  "";
        this._connectionPort =  0;
        this._onReceiveListeners = [];
        this._onErrorListener = [];
        super._type = ConnectionType.UDP;
    }

    connectImplementation(address, options, callback) {     
        var addr = address.split(':');
        if (addr.length >= 2) {
            this._connectionIP = addr[0];
            this._connectionPort = parseInt(addr[1])
        } else {
            this._connectionIP = address[0];
            this._connectionPort = STANDARD_UDP_PORT;
        } 

        try {
            socket.bind(this._connectionPort, () => {
                GUI.log(i18n.getMessage('connectionConnected', ["udp://" + this._connectionIP + ":" + this._connectionPort]));
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

        socket.on('message', (msg, _rinfo) => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: ++this._connectionId,
                    data: msg
                });
            });
        })

       socket.on('error', (error) => {
            GUI.log("UDP error: " + error);
            console.log("UDP error: " + error);
            this.abort();              
            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);    
            });
        });
    }

    disconnectImplementation(callback) {
        var ret = true;
        try {
            socket.disconnect();
        } catch (error) {
            console.log("Disconecct error: " + error)
            ret = false;
        }

        this._connectionIP = "";
        this._connectionPort = 0;

       if (callback) {
           callback(ret);
       }
    }

   sendImplementation(data, callback) {;
    
    try {
        socket.send(Buffer.from(data), this._connectionPort, this._connectionIP, (error) => {  
            var result = 0;
            var sent = data.byteLength;
            if (error) {
                result = 1;
                sent = 0;
                console.log("Serial wrire error: " + error)
            }
            if (callback) {
                callback({
                    bytesSent: sent,
                    resultCode: result
                });
            }
        });
    } catch (error) {
        console.log("UDP write error: " +  error)
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

module.exports = ConnectionUdp;
