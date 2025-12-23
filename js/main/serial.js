
import { SerialPort } from 'serialport';
import { SerialPortStream } from '@serialport/stream';
import { autoDetect } from '@serialport/bindings-cpp';

const binding = autoDetect();

const serial = {
    _serialport: null,
    _id: 1,

    connect: async function(path, options, window) {
        // Clean up any existing serial port to prevent handle leaks
        if (this._serialport) {
            try {
                const oldPort = this._serialport;
                this._serialport = null;
                oldPort.removeAllListeners();
                if (oldPort.isOpen) {
                    await new Promise(resolveClose => {
                        oldPort.close(() => resolveClose());
                    });
                }
                oldPort.destroy();
                // Small delay to ensure OS releases the file handle
                await new Promise(r => setTimeout(r, 100));
            } catch (e) {
                console.log('Cleanup error (ignored):', e.message);
            }
        }

        return new Promise(resolve => {
            try {
                var openPortResolved = false;
                this._serialport = new SerialPortStream({binding, path: path, baudRate: options.bitrate, autoOpen: true});
                this._serialport.on('error', error => {
                    console.log('Serial port error:', error.message);
                    if (!window.isDestroyed()) {
                        window.webContents.send('serialError', error);
                    }

                    // Clean up the serial port to prevent handle leaks
                    // This prevents "Resource temporarily unavailable Cannot lock port" errors
                    if (this._serialport) {
                        const failedPort = this._serialport;
                        this._serialport = null;
                        failedPort.removeAllListeners();
                        failedPort.destroy();
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
                const port = this._serialport;
                this._serialport = null;
                port.close(error => {
                    if (error) {
                        resolve({error: true, msg: error})
                    } else {
                        resolve({error: false})
                    }
                });
            } else if (this._serialport) {
                // Port exists but isn't open - destroy it to clean up
                try {
                    this._serialport.destroy();
                } catch (e) {
                    // Ignore cleanup errors
                }
                this._serialport = null;
                resolve({error: false});
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