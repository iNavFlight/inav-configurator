
import { SerialPort } from 'serialport';
import { SerialPortStream } from '@serialport/stream';
import { autoDetect } from '@serialport/bindings-cpp';

const binding = autoDetect();

const serial = {
    _serialport: null,
    _id: 1,

    connect: function(path, options, window) {
        return new Promise(resolve => {
            try {
                var openPortResolved = false;
                this._serialport = new SerialPortStream({binding, path: path, baudRate: options.bitrate, autoOpen: true});
                this._serialport.on('error', error => {
                    console.log('Serial port error:', error.message);
                    if (!window.isDestroyed()) {
                        window.webContents.send('serialError', error);
                    }

                    if(!openPortResolved) {
                        openPortResolved = true;
                        // Fixed: Report error correctly so connection handling works properly
                        resolve({error: true, msg: error.message || 'Serial port error'});
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

                this._serialport.on('open', () => {
                    openPortResolved = true;
                    resolve({error: false, id: this._id++});
                });

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
    },
    getDevices: async function () {
      const ports = await SerialPort.list();
      var devices = [];
      ports.forEach(port => {
        if (process.platform == 'Linux') {
          /* Limit to: USB serial, RFCOMM (BT), 6 legacy devices */
          if (port.pnpId || port.path.match(/rfcomm\d*/) || port.path.match(/ttyS[0-5]$/)) {
            devices.push(port.path);
          }
        } else {
          devices.push(port.path);
        }
      });
      return devices
      }
};

export default serial;