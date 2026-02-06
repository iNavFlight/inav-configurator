'use strict'

import GUI from './../gui';
import { ConnectionType, Connection } from './connection';
import i18n from './../localization';
import bridge from './../bridge';
import SITLWebAssembly from './../web/SITL-Webassembly.js';
import { disconnect } from 'process';
import { listen } from 'ol/events.js';

class ConnectionExt extends Connection {
    constructor() {
        super(); 

        this._onReceiveListeners = [];
        this._onErrorListener = [];
        this._messageCheckInterval = null;
        super._type = ConnectionType.serialEXT;
    }

    _getNextSerialMessage() {   
        
        const portIdPtr = SITLWebAssembly.callCFunction('malloc', 'number', ['number'], [1]);
        const dataPtr = SITLWebAssembly.callCFunction('malloc', 'number', ['number'], [2048]);
        const lengthPtr = SITLWebAssembly.callCFunction('malloc', 'number', ['number'], [2]);

        if (!portIdPtr || !dataPtr || !lengthPtr) {
            throw new Error("Unable to allocate memory in WASM for serial message");
        }

        try {

            const hasMessage = SITLWebAssembly.callCFunction('serialExGetMessage', 'boolean', ['number', 'number', 'number'], [portIdPtr, dataPtr, lengthPtr]);
            if (!hasMessage) {
                return null;
            }

            // Read values
            const portId = SITLWebAssembly.getHeapU8()[portIdPtr];
            const length = SITLWebAssembly.getHeapU16()[lengthPtr / 2];
            
            // Copy data (important: don't just return a pointer)
            const data = new Uint8Array(SITLWebAssembly.getHeapU8().buffer, dataPtr, length);
            const dataCopy = new Uint8Array(data);
            
            return {
                portId: portId,
                data: dataCopy,
                length: length
            };

        } finally {
            // Free allocated memory
            SITLWebAssembly.callCFunction('free', null, ['number'], [portIdPtr]);
            SITLWebAssembly.callCFunction('free', null, ['number'], [dataPtr]);
            SITLWebAssembly.callCFunction('free', null, ['number'], [lengthPtr]);
        }
    }

    _processAvailableMessages() {
        const MAX_MESSAGES_PER_POLL = 4096;
        let messages = [];
        let totalMessageLength = 0;

        while (messages.length < MAX_MESSAGES_PER_POLL) {
            const message = this._getNextSerialMessage();

            if (!message || message.length === 0) {
                break; // No more messages
            }
            
            if (message.portId !== this._connectionId) {
                continue; // Not for us
            }

            messages.push(message.data);
            totalMessageLength += message.length;
        }

        if (messages.length === MAX_MESSAGES_PER_POLL) {
            console.log("Warning: reached max serial messages per poll, data may be pending");
        }

        if (messages.length === 0) {
            return; // No messages to process
        }

        let messageBuffer = new Uint8Array(totalMessageLength);
        let offset = 0;
        for (let msg of messages) {
            messageBuffer.set(msg, offset);
            offset += msg.length;
        }
        
        this._onReceiveListeners.forEach(listener => {
            listener({
                connectionId: this._connectionId,
                data: messageBuffer
            });
        });
    }

    _pollingLoop() {
        if (!this._messageCheckInterval || !SITLWebAssembly.isRunning()) {
            return;
        }

        try {
            const pendingPort = SITLWebAssembly.callCFunction('serialExGetPendingPort', 'number');
            if (pendingPort !== 0xFFFFFFFF && pendingPort !== -1) {  // UINT32_MAX = 4294967295 = no messages
                this._processAvailableMessages();
            }

        } catch (error) {
            console.log(error);
        }
    }

    connectImplementation(path, options, callback) {
        
        if (typeof(path) !== "number") {
            throw new Error("ConnectionExt requires a numeric connection id");
        }

        if (!SITLWebAssembly.isRunning()) {
            if (callback) {
                callback(false);
            }
        }

        let isConnected = false;
        try {
            isConnected = SITLWebAssembly.callCFunction('inavSerialExConnect', 'boolean', ['number'], [path]);
        } catch (error) {
            console.log(error);
            this._isConnected = false;
        }

        if (!isConnected) {
            if (callback) {
                callback(false);
            }
            return;
        }

        this._isConnected = isConnected;
        this._connectionId = path;

        this._messageCheckInterval = setInterval(this._pollingLoop.bind(this), 10);
    

        if (callback) {
            callback({
                bitrate: 115200,
                connectionId: this._connectionId
            });
        } 
    }

    disconnectImplementation(callback) {
        
        // Nothing to close if WASM is not running
        if (!SITLWebAssembly.isRunning()) {
            if (callback) {
                callback(true);
            }
            return;
        }
        
        let isDisconnected = false;
        if (this._messageCheckInterval) {
            try {
                isDisconnected = SITLWebAssembly.callCFunction('inavSerialExDisconnect', 'boolean', ['number'], [this._connectionId]);
                clearInterval(this._messageCheckInterval);
                this._messageCheckInterval = null;
            } catch (error) {
                console.log(error);
            }
        }

        this._connectionId = null;

        if (callback) {
           callback(isDisconnected);
       }


    }

    sendImplementation(data, callback) {
        
        if (!SITLWebAssembly.isRunning() && !this._messageCheckInterval) {
            if (callback) {
                callback({ 
                    bytesSent: 0,
                    resultCode: 1
                });
            }   
            return;
        }
        
        let len = data.byteLength;
        const dataPtr = SITLWebAssembly.callCFunction('malloc', 'number', ['number'], [len]);

        if (!dataPtr) {
            console.log("Unable to allocate memory in WASM for serial write");
            if (callback) { 
                callback({ 
                    bytesSent: 0,
                    resultCode: 1
                });
            }   
            return;
        }

        // Copy data to WASM memory
        const heapU8 = SITLWebAssembly.getHeapU8();
        heapU8.set(new Uint8Array(data), dataPtr);

        const sent = SITLWebAssembly.callCFunction('inavSerialExSend', 'boolean', ['number', 'number', 'number'], [this._connectionId, dataPtr, len]);
        
        const result = sent ? 0 : 1;

        if (!sent) {
            console.log("SerialExt write error");
            len = 0;
        }

        // Free allocated memory
        SITLWebAssembly.callCFunction('free', null, ['number'], [dataPtr]);

        if (callback) {
            callback({
                bytesSent: len,
                resultCode: result
            });
        }
    }

    addOnReceiveCallback(callback) {
        this._onReceiveListeners.push(callback);
    }

    removeOnReceiveCallback(callback) {
        this._onReceiveListeners = this._onReceiveListeners.filter(listener => listener !== callback);
    }

    addOnReceiveErrorCallback(callback) {
        this._onReceiveErrorListeners.push(callback);
    }

    removeOnReceiveErrorCallback(callback) {
        this._onReceiveErrorListeners = this._onReceiveErrorListeners.filter(listener => listener !== callback);
    }
}

export default ConnectionExt;