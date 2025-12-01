

const serialDevices = [
    { vendorId: 1027, productId: 24577, name: 'FT232R'  }, 
    { vendorId: 1155, productId: 12886, name: 'STM32 HID' },
    { vendorId: 1155, productId: 14158, name: 'STM Nucleo' }, 
    { vendorId: 1155, productId: 22336, name: 'STM VCP' }, 
    { vendorId: 4292, productId: 60000, name: 'CP210x' }, 
    { vendorId: 4292, productId: 60001, name: 'CP210x' }, 
    { vendorId: 4292, productId: 60002, name: 'CP210x' }, 
    { vendorId: 11836, productId: 22336, name: 'AT32 VCP' }, 
];

const webSerialDevices = serialDevices.map(({vendorId, productId}) => ( {
    usbVendorId: vendorId,
    usbProductId: productId,
}));


// https://github.com/betaflight/betaflight-configurator/blob/master/src/js/protocols/WebSerial.js
async function* streamAsyncIterable(reader, keepReadingFlag) {
    try {
        while (keepReadingFlag()) {
            try {
                const { done, value } = await reader.read();
                if (done) {
                    return;
                }
                yield value;
            } catch (error) {
                console.warn(`WebSerial Read error in streamAsyncIterable:`, error);
                break;
            }
        }
    } finally {
        // Only release the lock if we still have the reader and it hasn't been released
        try {
            // Always attempt once; spec allows releasing even if the stream
            // is already closed.  `locked` is the boolean we can trust.
            if (reader?.locked) {
                reader.releaseLock();
            }
        } catch (error) {
            console.warn(`${logHead} Error releasing reader lock:`, error);
        }
    }
}

const webSerial = {
    events: new EventTarget(),
    currentPort: null,
    ports: [],
    isConnected: false,
    reader: null,
    writer: null,
    isReading: false,
    id: 1,

    connect: function(path, options) {
       return new Promise(async resolve => {
            if (this.isConnected) {
                resolve({error: true, errorMsg: 'Already connected'});
                return;
            }

            const port = this.ports.find(port => port.device.name == path);

            if (!port) {
                resolve({error: true, errorMsg: `Unable to find port ${path}`});
                return;
            }

            try {
                this.currentPort = port.port;
                
                await this.currentPort.open({baudRate: options.bitrate});

                this.writer = this.currentPort.writable.getWriter();
                this.reader = this.currentPort.readable.getReader();

                this.currentPort.addEventListener('disconnect', this.onDisconnect );

                this.isReading = true;
                this.isConnected = true;
                this.readLoop();
                resolve({error: false, id: this.id++});
            } catch (err) {
                resolve ({error: true, errorMsg: err});
            }
       })
        
    },

    onDisconnect: function() {
        this.close().then(() => { this.events.dispatchEvent(new CustomEvent('close'))});
    },

    close: function() {
        return new Promise(async resolve => {
            if (!this.isConnected) {
                resolve({error: false})
                return;
            }

            this.isReading = false;

            await new Promise((resolve) => setTimeout(resolve, 50));

            if (this.reader) {
                try {
                    await this.reader.cancel();
                } catch (error) {
                    console.warn(`Reader cancel error (can be ignored): ${error}`);
                }
                this.reader = null;
            }

            if (this.writer) {
                try {
                    this.writer.releaseLock();
                } catch (error) {
                    console.warn(`Writer release error (can be ignored): ${error}`);
                }
                this.writer = null;
            }

            if (this.currentPort) 
            {
                this.currentPort.removeEventListener('disconnect', this.onDisconnect);
                
                try {
                    await this.currentPort.close();
                } catch (error) {
                    resolve({error: true, msg: error.message})
                }
                this.currentPort = null;
            }
            this.isConnected = false;
            resolve({error: false})
        });
    },

    send: function(data) {
        return new Promise(async resolve => {
            if (!this.isConnected || !this.writer) {
                resolve({error: true, msg: 'Port closed or inavlid state.'})
            }

            try {
                await this.writer.write(data);
                resolve({error: false, bytesWritten: data.byteLength});
            } catch (error) {
                resolve({error: true, msg: `Serial write error: ${error}`});
            }

        });
    },

    readLoop: async function() {
        try {
             for await (let buffer of streamAsyncIterable(this.reader, () => this.isReading)) {
                this.events.dispatchEvent(new CustomEvent('data', { detail: buffer }));
            }
        } catch (error) {
            this.events.dispatchEvent(new CustomEvent('error', {detail: error.message}))
        }
    },

    requestPermission: async function () {
        try{
            await navigator.serial.requestPort({filter: webSerialDevices});
        } catch (error) {
            console.log(`User aborted serial port selction ${error.message}`);
        } 
    },

    getDevices: async function () {
        try {
            const savedPorts = await navigator.serial.getPorts();
            this.ports = [];
            return savedPorts.map((port) => {
                const portInfo = port.getInfo();
                const device = serialDevices.find(dev => dev.productId == portInfo.usbProductId && dev.vendorId == portInfo.usbVendorId )
        
                this.ports.push({
                    device: device,
                    port: port
                });
    
                return device.name;
            });
        } catch (error) {
            console.log(`Unable to list serial ports: ${error.message}`)
        }
    }
}

export default webSerial