
import { SerialPortStream } from '@serialport/stream';
import { autoDetect } from '@serialport/bindings-cpp';

const binding = autoDetect();

const serial = {
    _serialport: null,
    _id: 1,

    connect: function(path, options, window) {
        return new Promise(resolve => {
            try {
                this._serialport = new SerialPortStream({binding, path: path, baudRate: options.bitrate, autoOpen: true});
                this._serialport.on('error', error => {
                    if (!window.isDestroyed()) {
                        window.webContents.send('serialError', error); 
                    }
                });

                this._serialport.on('close', () => {
                    if (!window.isDestroyed()) {
                        window.webContents.send('serialClose');
                    }
                });

                this._serialport.on('data', buffer => {
                    if (!window.isDestroyed()) {
                        window.webContents.send('serialData', buffer);
                    }
                });
                resolve({error: false, id: this._id++});
            } catch (err) {
                resolve ({error: true, errorMsg: err});
            }
        });
    },
    close: function() {
        return new Promise(resolve => {
            if (this._serialport && this._serialport.isOpen) {
                this._serialport.close(error => {
                    if (error) {
                        resolve({error: true, msg: error})
                    } else {
                        resolve({error: false})
                    }
                });
                this._serialport = null;
            } else {
                resolve({error: false})
            }
        });
    },
    send: function(data) {
        return new Promise(resolve => {
            if (this._serialport && this._serialport.isOpen) {
                this._serialport.write(Buffer.from(data), error => {
                    if (error) {
                        resolve({error: true, msg: `Serial write error: ${error}`});
                    } else {
                        resolve({error: false, bytesWritten: data.byteLength});
                    }
                });
            } else {
                resolve({error: true, msg: "Invalid serial port or port closed"});
            }
        });
    }
};

export default serial;