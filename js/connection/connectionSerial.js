'use strict'

import { GUI } from './../gui';
import { ConnectionType, Connection } from './connection';
import i18n from './../localization';
import platform from './../platform';

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
        this.ports = [];
        super._type = ConnectionType.Serial;

        this._ipcDataHandler = null;
        this._ipcCloseHandler = null;
        this._ipcErrorHandler = null;
        this._webPort = null;
        this._webReader = null;
        this._webReadLoopRunning = false;
        this._webReadLoopPromise = null;
        this._webDisconnecting = false;
    }

    registerIpcListeners() {
        if (this._ipcDataHandler) {
            return; // Already registered
        }

        this._ipcDataHandler = window.electronAPI.onSerialData(buffer => {
            this._onReceiveListeners.forEach(listener => {
                listener({
                    connectionId: this._connectionId,
                    data: buffer
                });
            });
        });

        this._ipcCloseHandler = window.electronAPI.onSerialClose(() => {
            console.log("Serial connection closed");
            this.abort();
        });

        this._ipcErrorHandler = window.electronAPI.onSerialError(error => {
            GUI.log(error);
            console.log(error);
            this.abort();

            this._onReceiveErrorListeners.forEach(listener => {
                listener(error);
            });
        });
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
        if (platform.isWeb) {
            this.connectWeb(path, options, callback);
            return;
        }

        this.registerIpcListeners();

        window.electronAPI.serialConnect(path, options).then(response => {
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
        if (platform.isWeb) {
            this.disconnectWeb(callback);
            return;
        }

        if (this._connectionId) {
            window.electronAPI.serialClose().then(response => {
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
        if (platform.isWeb) {
            this.sendWeb(data, callback);
            return;
        }

        if (this._connectionId) {
            window.electronAPI.serialSend(data).then(response => {
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
        if (platform.isWeb) {
            return platform.capabilities.serial ? ['webserial'] : [];
        }

        return window.electronAPI.listSerialDevices();
    }

    async connectWeb(path, options, callback) {
        if (!platform.capabilities.serial) {
            if (callback) {
                callback(false);
            }
            return;
        }

        try {
            const filters = serialDevices.map(device => ({
                usbVendorId: device.vendorId,
                usbProductId: device.productId
            }));
            const grantedPorts = await navigator.serial.getPorts();
            this._webPort = grantedPorts[0] || await navigator.serial.requestPort({ filters });

            await this._webPort.open({
                baudRate: options.bitrate,
                dataBits: 8,
                stopBits: 1,
                parity: 'none',
                flowControl: 'none'
            });

            this.startWebReadLoop();

            GUI.log(i18n.getMessage('connectionConnected', ['Web Serial']));
            if (callback) {
                callback({
                    bitrate: options.bitrate,
                    connectionId: 1
                });
            }
        } catch (error) {
            console.log('Web Serial connection error', error);
            if (callback) {
                callback(false);
            }
        }
    }

    startWebReadLoop() {
        if (!this._webPort?.readable || this._webReadLoopRunning) {
            return;
        }

        this._webReadLoopRunning = true;
        this._webDisconnecting = false;

        const read = async () => {
            while (this._webPort?.readable && !this._webDisconnecting) {
                this._webReader = this._webPort.readable.getReader();
                try {
                    while (true) {
                        const { value, done } = await this._webReader.read();
                        if (done || this._webDisconnecting) {
                            break;
                        }

                        if (value) {
                            this._onReceiveListeners.forEach(listener => {
                                listener({
                                    connectionId: this._connectionId,
                                    data: value
                                });
                            });
                        }
                    }
                } catch (error) {
                    if (!this._webDisconnecting) {
                        console.log('Web Serial read error', error);
                        this._onReceiveErrorListeners.forEach(listener => listener(error));
                    }
                } finally {
                    if (this._webReader) {
                        this._webReader.releaseLock();
                    }
                    this._webReader = null;
                }
            }

            this._webReadLoopRunning = false;
        };

        this._webReadLoopPromise = read().finally(() => {
            this._webReadLoopPromise = null;
        });
    }

    async disconnectWeb(callback) {
        let ok = true;

        try {
            this._webDisconnecting = true;

            if (this._webReader) {
                await this._webReader.cancel();
            }
            if (this._webReadLoopPromise) {
                await this._webReadLoopPromise;
            }
            if (this._webPort) {
                await this._webPort.close();
            }
        } catch (error) {
            console.log('Unable to close Web Serial port', error);
            ok = false;
        } finally {
            this._webPort = null;
            this._webReader = null;
            this._webReadLoopRunning = false;
            this._webReadLoopPromise = null;
            this._webDisconnecting = false;
        }

        if (callback) {
            callback(ok);
        }
    }

    async sendWeb(data, callback) {
        let resultCode = 0;
        let bytesSent = 0;

        try {
            if (!this._webPort?.writable) {
                throw new Error('Web Serial port is not writable');
            }

            const writer = this._webPort.writable.getWriter();
            try {
                const chunk = data instanceof Uint8Array ? data : new Uint8Array(data);
                await writer.write(chunk);
                bytesSent = chunk.byteLength;
            } finally {
                writer.releaseLock();
            }
        } catch (error) {
            console.log('Web Serial write error', error);
            resultCode = 1;
        }

        if (callback) {
            callback({
                bytesSent,
                resultCode
            });
        }
    }
}

export default ConnectionSerial;
