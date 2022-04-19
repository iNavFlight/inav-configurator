'use strict'

const STANDARD_TCP_PORT = 5761;

class ConnectionTcp extends Connection {
    
    constructor() {
        super();
        
        this._connectionIP =  "";
        this.connectionPort =  0;
    }

    connectImplementation(address, options, callback) {     
        var addr = address.split(':');
        if (addr.length >= 2) {
            this._connectionIP = addr[0];
            this._connectionPort = parseInt(addr[1])
        } else {
            this._connectionIP = address[0];
            this._connectionPort = STANDARD_PORT;
        } 

        chrome.sockets.tcp.create({
            name: "iNavTCP",
            bufferSize: 65535
        }, createInfo => {
            this.checkChromeLastError();           
            if (createInfo && !this._openCanceled) {     
                chrome.sockets.tcp.connect(createInfo.socketId, this._connectionIP, this._connectionPort, result => {
                    this.checkChromeLastError();
                    
                    if (result == 0) {
                        // Disable Nagle's algorithm
                        chrome.sockets.tcp.setNoDelay(createInfo.socketId, true, noDelayResult => {        
                            this.checkChromeLastError();
                            if (noDelayResult < 0) {
                                console.warn("Unable to set TCP_NODELAY: " + noDelayResult);
                                if (callback) {
                                    callback(false);
                                }
                            }

                            this.addOnReceiveErrorListener(info => {
                                console.error(info);
                                googleAnalytics.sendException('TCP: ' + info.error, false);

                                let message;
                                switch (info.resultCode) {
                                    case -15:
                                        // connection is lost, cannot write to it anymore, preventing further disconnect attempts
                                        message = 'error: ERR_SOCKET_NOT_CONNECTED';
                                        console.log(`TCP: ${message}: ${info.resultCode}`);
                                        this._connectionId = false;
                                        return;
                                    case -21:
                                        message = 'error: NETWORK_CHANGED';
                                        break;
                                    case -100:
                                        message = 'error: CONNECTION_CLOSED';
                                        break;
                                    case -102:
                                        message = 'error: CONNECTION_REFUSED';
                                        break;
                                    case -105:
                                        message = 'error: NAME_NOT_RESOLVED';
                                        break;
                                    case -106:
                                        message = 'error: INTERNET_DISCONNECTED';
                                        break;
                                    case -109:
                                        message = 'error: ADDRESS_UNREACHABLE';
                                        break;
                                }

                                let resultMessage = message ? `${message} ${info.resultCode}` : info.resultCode;
                                console.warn(`TCP: ${resultMessage} ID: ${this._connectionId}`);

                                this.abort();      
                            });
                            
                            GUI.log(chrome.i18n.getMessage('connectionConnected', ["tcp://" + this._connectionIP + ":" + this._connectionPort]));
                            
                            if (callback) {
                                callback({
                                    bitrate: 115200,
                                    connectionId: createInfo.socketId
                                });
                            }
                            
                        });
                    } else {
                        console.error("Unable to open TCP socket: " + result);
                        if (callback) {
                            callback(false);
                        }
                    }
                });
            } else {
                console.error("Unable to create TCP socket.");

                if (callback) {
                    callback(false);
                }
            }
        });
    }

    disconnectImplementation(callback) {
        chrome.sockets.tcp.disconnect(this._connectionId);
        this.checkChromeLastError();
        this._connectionIP = "";
        this._connectionPort = 0;

       if (callback) {
           callback(true);
       }
    }

   sendImplementation(data, callback) {;
        chrome.sockets.tcp.send(this._connectionId, data, callback);
   }

    addOnReceiveCallback(callback){
        chrome.sockets.tcp.onReceive.addListener(callback);
    }

    removeOnReceiveCallback(callback){
        chrome.sockets.tcp.onReceive.removeListener(callback);
    }

    addOnReceiveErrorCallback(callback) {
        chrome.sockets.tcp.onReceiveError.addListener(callback);
    }

    removeOnReceiveErrorCallback(callback) {
        chrome.sockets.tcp.onReceiveError.removeListener(callback);
    }
}
