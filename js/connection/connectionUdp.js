'use strict'

const STANDARD_UDP_PORT = 5762;

class ConnectionUdp extends Connection {
    constructor() {
        super();

        this._connectionIP =  "";
        this._connectionPort =  0;
        this._timeoutId = false;
        this._isCli = false;
    }

    /**
     * @param {boolean} value
     */
    set isCli(value) {
        this._isCli = value;
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

        chrome.sockets.udp.create({
            name: "iNavUDP",
            bufferSize: 65535,
        }, createInfo => {
            this.checkChromeLastError();    
            if (createInfo && !this._openCanceled) { 
                chrome.sockets.udp.bind(createInfo.socketId, "0.0.0.0", this._connectionPort, result => {
                    this.checkChromeLastError(); 
                    if (result == 0) {                   
                        // UDP connections don't trigger an event if they are interrupted, a simple timeout mechanism must suffice here. 
                        this.addOnReceiveCallback(() => {
                            if (this._timeoutId) {
                                clearTimeout(this._timeoutId);
                            }

                            this._timeoutId = setTimeout(() => {
                                if (!this._isCli) { // Disable timeout for CLI
                                    GUI.log(chrome.i18n.getMessage('connectionUdpTimeout'));
                                    this.abort();
                                }
                            }, 10000);
                        })
                        
                        // Actually useless, but according to chrome documentation also UDP triggers error events ¯\_(ツ)_/¯
                        this.addOnReceiveErrorListener(info => {
                            console.error(info);
                            googleAnalytics.sendException('UDP: ' + info.error, false);

                            let message;
                            switch (info.resultCode) {
                                case -15:
                                    // connection is lost, cannot write to it anymore, preventing further disconnect attempts
                                    message = 'error: ERR_SOCKET_NOT_CONNECTED';
                                    console.log(`UDP: ${message}: ${info.resultCode}`);
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
                            console.warn(`UDP: ${resultMessage} ID: ${this._connectionId}`);

                            this.abort();        
                        });
                        
                        GUI.log(chrome.i18n.getMessage('connectionConnected', ["udp://" + this._connectionIP + ":" + this._connectionPort]));

                        if (callback) {
                            callback({
                                bitrate: 115200,
                                connectionId: createInfo.socketId
                            });
                        }
                    } else {
                        console.error("Unable to open UDP socket: " + result);
                        if (callback) {
                            callback(false);
                        }
                    }
                });
            } else {
                console.error("Unable to create UDP socket.");
                if (callback) {
                    callback(false);
                }
            }
        });
    }

    disconnectImplementation(callback) {
        chrome.sockets.udp.close(this._connectionId);  
        this.checkChromeLastError();    
        this._connectionIP = "";
        this._connectionPort = 0;
        clearTimeout(this._timeoutId);
        this._timeoutId = false;
        if (callback) {
            callback(true);
        }
    }

    sendImplementation(data, callback) {;
        chrome.sockets.udp.send(this._connectionId, data, this._connectionIP, this._connectionPort, callback);
    }
    
    addOnReceiveCallback(callback){
        chrome.sockets.udp.onReceive.addListener(callback);
    }

    removeOnReceiveCallback(callback){
        chrome.sockets.udp.onReceive.removeListener(callback);
    }

    addOnReceiveErrorCallback(callback) {
        chrome.sockets.udp.onReceiveError.addListener(callback);
    }

    removeOnReceiveErrorCallback(callback) {
        chrome.sockets.udp.onReceiveError.removeListener(callback);
    }
}
