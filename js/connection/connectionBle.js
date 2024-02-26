'use strict'

const { GUI } = require('./../gui');

const  { ConnectionType, Connection } = require('./connection');
const i18n = require('./../localization');

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
        console.log("Request BLE Device");    
        await this.openDevice()
            .then(() => {
                this.addOnReceiveErrorListener(error => {
                    GUI.log(i18n.getMessage('connectionBleInterrupted'));
                    this.abort();
                });

                if (callback) {
                    callback({
                        // Dummy values
                        connectionId: 0xff,
                        bitrate: 115200 
                    });
                }
            }).catch(error => {
                GUI.log(i18n.getMessage('connectionBleError', [error]));
                if (callback) {
                    callback(false);
                }
            });

        return Promise.resolve();
    }

    async openDevice(){
        await this.request()
            .then(device => this.connectBle(device))
            .then(() => this.startNotification());

        return Promise.resolve();
    };

    request() {
        var ids = [];
        BleDevices.forEach(device => {
            ids.push(device.serviceUuid)
        });
        
        return navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ids
        }).then(device => {
            console.log("Found BLE device: " + device.name);
            this._device = device;
            this._handleDisconnect = event => {
                this._onDisconnectListeners.forEach(listener => {
                    listener("disconnected");
                });      
            };

            this._device.addEventListener('gattserverdisconnected', this._handleDisconnect);
            return this._device;
        });
    }

    connectBle(device) {
        if (device.gatt.connected && this._readCharacteristic && this._writeCharacteristic) {
            return Promise.resolve();
        }

        return device.gatt.connect()
            .then(server => {
                console.log("Connect to: " + device.name);
                GUI.log(i18n.getMessage('connectionConnected', [device.name]));
                return server.getPrimaryServices();
            }).then(services => {
                let connectedService = services.find(service => {
                    this._deviceDescription = BleDevices.find(device => device.serviceUuid == service.uuid);
                    return this._deviceDescription;
                });

                if (!this._deviceDescription) {
                    throw new Error("Unsupported device (service UUID mismatch).");
                }

                GUI.log(i18n.getMessage('connectionBleType', [this._deviceDescription.name]));
                return connectedService.getCharacteristics();
            }).then(characteristics => {
                characteristics.forEach(characteristic => {
                    if (characteristic.uuid == this._deviceDescription.writeCharateristic) {
                        this._writeCharacteristic = characteristic;
                    }

                    if (characteristic.uuid == this._deviceDescription.readCharateristic) {
                        this._readCharacteristic = characteristic;
                    }

                    return this._writeCharacteristic && this._readCharacteristic;
                });

                if (!this._writeCharacteristic) {
                    throw new Error("No or unexpected write charateristic found (should be " +  this._deviceDescription.writeCharateristic + ")");
                }

                if (!this._readCharacteristic) {
                    throw new Error("No or unexpected read charateristic found (should be " +  this._deviceDescription.readCharateristic + ")");
                }
                
                this._handleOnCharateristicValueChanged = event => {
                    let buffer = new Uint8Array(event.target.value.byteLength);
                    for (var i = 0; i < event.target.value.byteLength; i++) {
                        buffer[i] = event.target.value.getUint8(i);
                    }

                    this._onCharateristicValueChangedListeners.forEach(listener => {
                        listener({
                            connectionId: 0xFF,
                            data: buffer
                        });
                    });
                };

                this._readCharacteristic.addEventListener('characteristicvaluechanged', this._handleOnCharateristicValueChanged)
                return Promise.resolve();
            });          
    }

    startNotification() {
        if (!this._readCharacteristic) {
            throw new Error("No read charateristic");
        }

        if (!this._readCharacteristic.properties.notify) {
            throw new Error("Read charateristic can't notify.");
        }

        return this._readCharacteristic.startNotifications()
            .then(() => {
                console.log("BLE notifications started.");
        });
    }

    disconnectImplementation(callback) {
        if (this._device) {
            this._device.removeEventListener('gattserverdisconnected', this._handleDisconnect);
            this._readCharacteristic.removeEventListener('characteristicvaluechanged', this._handleOnCharateristicValueChanged);

            if (this._device.gatt.connected) {
                this._device.gatt.disconnect();
            }        
            this._device = false;
            this._writeCharacteristic = false; 
            this._readCharacteristic = false;
            this._deviceDescription = false; 
        }

        if (callback) {
            callback(true);
        }
    }

    async sendImplementation (data, callback) {;
        if (!this._writeCharacteristic) {
            return;
        }
        
        let sent = 0;
        let dataBuffer = new Uint8Array(data);
        for (var i = 0; i < dataBuffer.length; i += BLE_WRITE_BUFFER_LENGTH) {
            var length = BLE_WRITE_BUFFER_LENGTH;

            if (i + BLE_WRITE_BUFFER_LENGTH > dataBuffer.length) {
                length = dataBuffer.length % BLE_WRITE_BUFFER_LENGTH;
            }

            var outBuffer = dataBuffer.subarray(i, i + length);
            sent += outBuffer.length;
            await this._writeCharacteristic.writeValue(outBuffer);   
        }

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

module.exports = ConnectionBle;
