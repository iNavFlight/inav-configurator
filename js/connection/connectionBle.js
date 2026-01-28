'use strict'

import { GUI } from './../gui';

import  { ConnectionType, Connection } from './connection';
import i18n from './../localization';

// BLE 20 bytes buffer
const BLE_WRITE_BUFFER_LENGTH = 20;

const BleDevices = [
    {
        name: "CC2541 based",
        serviceUuid:        '0000ffe0-0000-1000-8000-00805f9b34fb',
        writeCharateristic: '0000ffe1-0000-1000-8000-00805f9b34fb', 
        readCharateristic:  '0000ffe1-0000-1000-8000-00805f9b34fb',
        delay:              30,
    },
    {
        name: "Nordic Semiconductor NRF",
        serviceUuid:        '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
        writeCharateristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e', 
        readCharateristic:  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
        delay:              30,
    },
    {
        name: "SpeedyBee Type 2",
        serviceUuid:        '0000abf0-0000-1000-8000-00805f9b34fb',
        writeCharateristic: '0000abf1-0000-1000-8000-00805f9b34fb', 
        readCharateristic:  '0000abf2-0000-1000-8000-00805f9b34fb',
        delay:              0,
    },
    {
        name: "SpeedyBee Type 1",
        serviceUuid:        '00001000-0000-1000-8000-00805f9b34fb',
        writeCharateristic: '00001001-0000-1000-8000-00805f9b34fb', 
        readCharateristic:  '00001002-0000-1000-8000-00805f9b34fb',
        delay:              0,
    }
];

class ConnectionBle extends Connection {
    
    constructor() {
        super();
        
        this._readCharacteristic    = false;
        this._writeCharacteristic   = false;
        this._device                = false;
        this._deviceDescription     = false;
        this._onCharateristicValueChangedListeners = [];
        this._onDisconnectListeners   = [];
        this._reconnects = 0;
        this._handleOnCharateristicValueChanged = false;
        this._handleDisconnect = false;
        super._type = ConnectionType.BLE;
    }

    get deviceDescription() {
        return this._deviceDescription;
    }

    async connectImplementation(path, options, callback) {
        console.log("[BLE] === Starting BLE connection sequence ===");
        console.log("[BLE] Path:", path);
        console.log("[BLE] Options:", options);
        await this.openDevice()
            .then(() => {
                console.log("[BLE] Device opened successfully");
                this.addOnReceiveErrorListener(error => {
                    console.error("[BLE] Receive error:", error);
                    GUI.log(i18n.getMessage('connectionBleInterrupted'));
                    this.abort();
                });

                console.log("[BLE] Connection complete, calling callback");
                if (callback) {
                    callback({
                        // Dummy values
                        connectionId: 0xff,
                        bitrate: 115200
                    });
                }
            }).catch(error => {
                console.error("[BLE] Connection failed:", error);
                GUI.log(i18n.getMessage('connectionBleError', [error]));
                if (callback) {
                    callback(false);
                }
            });

        return Promise.resolve();
    }

    async openDevice(){
        console.log("[BLE] Opening device (request → connect → start notifications)...");
        await this.request()
            .then(device => {
                console.log("[BLE] Device requested, now connecting to GATT...");
                return this.connectBle(device);
            })
            .then(() => {
                console.log("[BLE] GATT connected, starting notifications...");
                return this.startNotification();
            })
            .catch(error => {
                console.error("[BLE] openDevice failed:", error);
                throw error;
            });

        console.log("[BLE] Device opened successfully");
        return Promise.resolve();
    };

    request() {
        var ids = [];
        BleDevices.forEach(device => {
            ids.push(device.serviceUuid)
        });

        console.log("[BLE] Requesting BLE device with optional services:", ids);

        return navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ids
        }).then(device => {
            console.log("[BLE] Found BLE device: " + device.name);
            console.log("[BLE] Device ID: " + device.id);
            console.log("[BLE] GATT connected: " + device.gatt.connected);
            this._device = device;
            this._handleDisconnect = event => {
                console.log("[BLE] GATT server disconnected event fired", {
                    deviceName: device.name,
                    deviceId: device.id,
                    timestamp: Date.now()
                });
                this._onDisconnectListeners.forEach(listener => {
                    listener("disconnected");
                });
            };

            console.log("[BLE] Adding disconnect listener...");
            this._device.addEventListener('gattserverdisconnected', this._handleDisconnect);
            return this._device;
        }).catch(error => {
            console.error("[BLE] Device request failed:", {
                message: error.message,
                name: error.name,
                code: error.code
            });
            throw error;
        });
    }

    connectBle(device) {
        if (device.gatt.connected && this._readCharacteristic && this._writeCharacteristic) {
            console.log("[BLE] Already connected, reusing connection");
            return Promise.resolve();
        }

        console.log("[BLE] Connecting to GATT server...");
        return device.gatt.connect()
            .then(server => {
                console.log("[BLE] Connected to: " + device.name);
                console.log("[BLE] GATT server connected:", server.connected);
                GUI.log(i18n.getMessage('connectionConnected', [device.name]));
                console.log("[BLE] Discovering primary services...");
                return server.getPrimaryServices();
            }).then(services => {
                console.log("[BLE] Found " + services.length + " services:");
                services.forEach(service => {
                    console.log("[BLE]   Service UUID: " + service.uuid);
                });

                let connectedService = services.find(service => {
                    this._deviceDescription = BleDevices.find(device => device.serviceUuid == service.uuid);
                    return this._deviceDescription;
                });

                if (!this._deviceDescription) {
                    console.error("[BLE] No matching service found. Expected one of:", BleDevices.map(d => d.serviceUuid));
                    throw new Error("Unsupported device (service UUID mismatch).");
                }

                console.log("[BLE] Matched device type: " + this._deviceDescription.name);
                console.log("[BLE] Expected write characteristic: " + this._deviceDescription.writeCharateristic);
                console.log("[BLE] Expected read characteristic: " + this._deviceDescription.readCharateristic);
                GUI.log(i18n.getMessage('connectionBleType', [this._deviceDescription.name]));

                console.log("[BLE] Getting characteristics from service...");
                return connectedService.getCharacteristics();
            }).then(characteristics => {
                console.log("[BLE] Found " + characteristics.length + " characteristics:");
                characteristics.forEach(characteristic => {
                    console.log("[BLE]   Characteristic UUID: " + characteristic.uuid);
                    console.log("[BLE]     Properties: read=" + characteristic.properties.read +
                                ", write=" + characteristic.properties.write +
                                ", writeWithoutResponse=" + characteristic.properties.writeWithoutResponse +
                                ", notify=" + characteristic.properties.notify +
                                ", indicate=" + characteristic.properties.indicate);

                    if (characteristic.uuid == this._deviceDescription.writeCharateristic) {
                        this._writeCharacteristic = characteristic;
                        console.log("[BLE]     → This is the WRITE characteristic");
                    }

                    if (characteristic.uuid == this._deviceDescription.readCharateristic) {
                        this._readCharacteristic = characteristic;
                        console.log("[BLE]     → This is the READ characteristic");
                    }

                    return this._writeCharacteristic && this._readCharacteristic;
                });

                if (!this._writeCharacteristic) {
                    console.error("[BLE] Write characteristic not found! Expected: " + this._deviceDescription.writeCharateristic);
                    throw new Error("No or unexpected write charateristic found (should be " +  this._deviceDescription.writeCharateristic + ")");
                }

                if (!this._readCharacteristic) {
                    console.error("[BLE] Read characteristic not found! Expected: " + this._deviceDescription.readCharateristic);
                    throw new Error("No or unexpected read charateristic found (should be " +  this._deviceDescription.readCharateristic + ")");
                }

                console.log("[BLE] Setting up notification handler...");
                this._handleOnCharateristicValueChanged = event => {
                    const value = event.target.value;
                    let buffer = new Uint8Array(value.byteLength);
                    for (var i = 0; i < value.byteLength; i++) {
                        buffer[i] = value.getUint8(i);
                    }

                    const hex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join(' ');
                    const ascii = Array.from(buffer).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');

                    console.log("[BLE] ← RECEIVED " + buffer.length + " bytes:");
                    console.log("[BLE]   Hex:   " + hex);
                    console.log("[BLE]   ASCII: " + ascii);
                    console.log("[BLE]   Timestamp: " + Date.now());

                    this._onCharateristicValueChangedListeners.forEach(listener => {
                        listener({
                            connectionId: 0xFF,
                            data: buffer
                        });
                    });
                };

                console.log("[BLE] Adding event listener for characteristicvaluechanged...");
                this._readCharacteristic.addEventListener('characteristicvaluechanged', this._handleOnCharateristicValueChanged)
                console.log("[BLE] Event listener added successfully");
                return Promise.resolve();
            }).catch(error => {
                console.error("[BLE] Connection error:", {
                    message: error.message,
                    name: error.name,
                    code: error.code,
                    stack: error.stack
                });
                throw error;
            });
    }

    startNotification() {
        if (!this._readCharacteristic) {
            console.error("[BLE] Cannot start notifications: No read characteristic");
            throw new Error("No read charateristic");
        }

        console.log("[BLE] Starting notifications on characteristic: " + this._readCharacteristic.uuid);
        console.log("[BLE] Characteristic properties:", {
            canRead: this._readCharacteristic.properties.read,
            canWrite: this._readCharacteristic.properties.write,
            canWriteWithoutResponse: this._readCharacteristic.properties.writeWithoutResponse,
            canNotify: this._readCharacteristic.properties.notify,
            canIndicate: this._readCharacteristic.properties.indicate
        });

        if (!this._readCharacteristic.properties.notify) {
            console.error("[BLE] Read characteristic does not support notify!");
            console.error("[BLE] Characteristic supports: " + JSON.stringify(this._readCharacteristic.properties));
            throw new Error("Read charateristic can't notify.");
        }

        const startTime = Date.now();
        return this._readCharacteristic.startNotifications()
            .then(() => {
                const duration = Date.now() - startTime;
                console.log("[BLE] ✓ Notifications started successfully (took " + duration + "ms)");
                console.log("[BLE] Ready to receive data on characteristic: " + this._readCharacteristic.uuid);
            }).catch(error => {
                console.error("[BLE] Failed to start notifications:", {
                    message: error.message,
                    name: error.name,
                    code: error.code
                });
                throw error;
            });
    }

    disconnectImplementation(callback) {
        console.log("[BLE] Disconnecting...");
        if (this._device) {
            console.log("[BLE] Removing event listeners...");
            this._device.removeEventListener('gattserverdisconnected', this._handleDisconnect);
            this._readCharacteristic.removeEventListener('characteristicvaluechanged', this._handleOnCharateristicValueChanged);

            if (this._device.gatt.connected) {
                console.log("[BLE] GATT is connected, disconnecting...");
                this._device.gatt.disconnect();
                console.log("[BLE] GATT disconnect() called");
            } else {
                console.log("[BLE] GATT already disconnected");
            }
            console.log("[BLE] Cleaning up device references...");
            this._device = false;
            this._writeCharacteristic = false;
            this._readCharacteristic = false;
            this._deviceDescription = false;
        } else {
            console.log("[BLE] No device to disconnect");
        }

        console.log("[BLE] Disconnect complete");
        if (callback) {
            callback(true);
        }
    }

    async sendImplementation (data, callback) {;
        if (!this._writeCharacteristic) {
            console.error("[BLE] Cannot send: No write characteristic");
            return;
        }

        let sent = 0;
        let dataBuffer = new Uint8Array(data);
        const totalBytes = dataBuffer.length;
        const hex = Array.from(dataBuffer).map(b => b.toString(16).padStart(2, '0')).join(' ');
        const ascii = Array.from(dataBuffer).map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');

        console.log("[BLE] → SENDING " + totalBytes + " bytes (will split into " + Math.ceil(totalBytes / BLE_WRITE_BUFFER_LENGTH) + " chunks of max " + BLE_WRITE_BUFFER_LENGTH + " bytes):");
        console.log("[BLE]   Hex:   " + hex);
        console.log("[BLE]   ASCII: " + ascii);
        console.log("[BLE]   Writing to characteristic: " + this._writeCharacteristic.uuid);

        const sendStartTime = Date.now();
        let chunkCount = 0;

        for (var i = 0; i < dataBuffer.length; i += BLE_WRITE_BUFFER_LENGTH) {
            var length = BLE_WRITE_BUFFER_LENGTH;

            if (i + BLE_WRITE_BUFFER_LENGTH > dataBuffer.length) {
                length = dataBuffer.length % BLE_WRITE_BUFFER_LENGTH;
            }

            var outBuffer = dataBuffer.subarray(i, i + length);
            chunkCount++;
            const chunkHex = Array.from(outBuffer).map(b => b.toString(16).padStart(2, '0')).join(' ');

            try {
                const writeStart = Date.now();
                console.log("[BLE]   Chunk " + chunkCount + ": Writing " + outBuffer.length + " bytes: " + chunkHex);
                await this._writeCharacteristic.writeValue(outBuffer);
                const writeDuration = Date.now() - writeStart;
                console.log("[BLE]   Chunk " + chunkCount + ": Write completed in " + writeDuration + "ms");
                sent += outBuffer.length;
            } catch (error) {
                console.error("[BLE] Write failed on chunk " + chunkCount + ":", {
                    message: error.message,
                    name: error.name,
                    code: error.code,
                    chunkSize: outBuffer.length,
                    bytesSentSoFar: sent
                });
                throw error;
            }
        }

        const totalDuration = Date.now() - sendStartTime;
        console.log("[BLE] ✓ All data sent: " + sent + " bytes in " + chunkCount + " chunks (total time: " + totalDuration + "ms)");

        if (callback) {
            callback({
                bytesSent: sent,
                resultCode: 0
            });
        }

    }

    addOnReceiveCallback(callback){
        this._onCharateristicValueChangedListeners.push(callback);
    }

    removeOnReceiveCallback(callback){
        this._onCharateristicValueChangedListeners = this._onCharateristicValueChangedListeners.filter(listener => listener !== callback);
    }

    addOnReceiveErrorCallback(callback) {
        this._onDisconnectListeners.push(callback);
    }

    removeOnReceiveErrorCallback(callback) {
        this._onDisconnectListeners = this._onDisconnectListeners.filter(listener => listener !== callback);
    }

    static getBleUUIDs() {
        var ids = [];
        BleDevices.forEach(device => {
            ids.push(device.serviceUuid)
        });
        return ids;
    }
}

export default ConnectionBle;
