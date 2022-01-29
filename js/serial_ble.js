'use strict'

// Dummy value
const BLE_CONNECTION_ID = 0xFF;
// BLE 20 bytes buffer
const BLE_WRITE_BUFFER_LENGTH = 20;

var serialBle = {
    bleDevices: [
        {
            name: "HM-1X/HC-08",
            serviceUuid:        '0000ffe0-0000-1000-8000-00805f9b34fb',
            writeCharateristic: '0000ffe1-0000-1000-8000-00805f9b34fb', 
            readCharateristic:  '0000ffe1-0000-1000-8000-00805f9b34fb',
            delay:              70,
            chunkSize:          180,
        },
        {
            name: "Nordic Semiconductor NRF",
            serviceUuid:        '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
            writeCharateristic: '6e400003-b5a3-f393-e0a9-e50e24dcca9e', 
            readCharateristic:  '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
            delay:              70,
            chunkSize:          180,
        },
        {
            name: "SpeedyBee Type 2",
            serviceUuid:        '0000abf0-0000-1000-8000-00805f9b34fb',
            writeCharateristic: '0000abf1-0000-1000-8000-00805f9b34fb', 
            readCharateristic:  '0000abf2-0000-1000-8000-00805f9b34fb',
            delay:              10,
            chunkSize:          0,
        },
        {
            name: "SpeedyBee Type 1",
            serviceUuid:        '00001000-0000-1000-8000-00805f9b34fb',
            writeCharateristic: '00001001-0000-1000-8000-00805f9b34fb', 
            readCharateristic:  '00001002-0000-1000-8000-00805f9b34fb',
            delay:              10,
            chunkSize:          0,
        }
    ],

    readCharacteristic: null,
    writeCharacteristic: null,
    device: null,
    deviceDescription: null,

    connect: async function(callback) {

        console.log("Request BLE Device");
        await this.request()
            .then(device => this.connectBle(device))
            .then (_ => this.startNotification())
            .catch(error => {
                GUI.log("Error while opening BLE device: " + error)
                if (GUI.connected_to || GUI.connecting_to) {
                    $('a.connect').click();
                } else {
                    serial.disconnect();
                }
        });

        this.registerOnRecieveCallback();

        serial.onReceive.addListener(function (bytesReceived) {
            serial.bytesReceived += bytesReceived.data.length;
        });

        callback({connectionId: BLE_CONNECTION_ID});

        return Promise.resolve();
    }, 

    request: function() {
        var ids = [];
        this.bleDevices.forEach(device => {
            ids.push(device.serviceUuid)
        });
        return navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ids
        }).then(device => {
            serial.bitrate = 9600; // Dummy value
            serial.connectionId = BLE_CONNECTION_ID; // BLE
            serial.bytesReceived = 0;
            serial.bytesSent = 0;
            serial.failed = 0;
            serial.openRequested = false;

            console.log("Found BLE device: " + device.name);
            this.device = device;
            this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

            return this.device;
        });
    },

    handleDisconnect: function(event) {
        let device = event.target;

        GUI.log("BLE device disconnected, trying to reconnect.");

        this.connect(device)
            .then(_ => startNotifications())
            .catch(error => log(error));
    },

    connectBle: function(device) {
        if (device.gatt.connected && this.characteristic) {
            return Promise.resolve(this.characteristic);
        }
        return device.gatt.connect()
            .then(server => {
                console.log("Connect to: " + device.name);
                GUI.log("Connect to: " + device.name)    
                return server.getPrimaryServices();
            }).then(services => {
                let connectedService = services.find(service => {
                    this.deviceDescription = serialBle.bleDevices.find(device => device.serviceUuid == service.uuid);
                    if (this.deviceDescription) {
                        return true;
                    }
                });
                if (!this.deviceDescription) {
                    throw new Error("Unsupported device (service uuid mismatch). Got " + service.uuid);
                }
                GUI.log("BLE device type:  " + this.deviceDescription.name);
                return connectedService.getCharacteristics();
            }).then(characteristics => {
                characteristics.find(characteristic => {
                    if (characteristic.uuid == this.deviceDescription.writeCharateristic) {
                        this.writeCharacteristic = characteristic;
                    }
                    if (characteristic.uuid == this.deviceDescription.readCharateristic) {
                        this.readCharacteristic = characteristic;
                    }
                    if (this.writeCharacteristic && this.readCharacteristic) {
                        return true;
                    }
                });
                if (!this.writeCharacteristic) {
                    throw new Error("No or unexpected write charateristic (shoud be " +  this.deviceDescription.writeCharateristic + ")");
                }
                if (!this.readCharacteristic) {
                    throw new Error("No or unexpected read charateristic (shoud be " +  this.deviceDescription.readCharateristic + ")");
                }
                return Promise.resolve();
            });          
    },

    startNotification: function() {

        if (!this.readCharacteristic) {
            throw new Error("No read charateristic");
        }

        if (!this.readCharacteristic.properties.notify) {
            throw new Error("Read charateristic can't notify.");
        }

        return this.readCharacteristic.startNotifications()
            .then(() => {
                console.log("BLE notifications started.");
        });
    },

    disconnect: function(funcRef) {
        let ret = false;
        if (serialBle.device) {
            GUI.log("Disconnect from BLE device: " + serialBle.device.name);

            serialBle.device.removeEventListener('gattserverdisconnected', serialBle.handleDisconnect);

            if (serialBle.device.gatt.connected) {
                serialBle.device.gatt.disconnect();
                ret = true;
            }
            serialBle.device = null;
            serialBle.writeCharacteristic = null; 
            serialBle.readCharacteristic = null;
            serialBle.deviceDescription = null; 
        }
        funcRef(ret);
    },

    registerOnRecieveCallback: function() {
        serial.onReceive.register(function(listener) {          
            function bleListener(event) {
                let buffer = new Uint8Array(event.target.value.byteLength);
                for (var i = 0; i < event.target.value.byteLength; i++) {
                    buffer[i] = event.target.value.getUint8(i);
                }

                listener({
                    connectionId: BLE_CONNECTION_ID,
                    data: buffer
                });
            }
            serialBle.readCharacteristic.addEventListener('characteristicvaluechanged', bleListener);
        });
    },

    send: async function(id, data, callback) {;
        if (!serialBle.writeCharacteristic) {
            return;
        }
        let sendBytes = 0;
        let inBuffer = new Uint8Array(data);
        for (i = 0; i < inBuffer.length; i += BLE_WRITE_BUFFER_LENGTH) {
            var length = BLE_WRITE_BUFFER_LENGTH;
            if (i + BLE_WRITE_BUFFER_LENGTH > inBuffer.length) {
                length = inBuffer.length % BLE_WRITE_BUFFER_LENGTH;
            }
            var outBuffer = inBuffer.subarray(i, i + length);
            sendBytes += outBuffer.length;
            await serialBle.writeCharacteristic.writeValue(outBuffer);   
        }
        callback({bytesSent: sendBytes})
    }
} 
