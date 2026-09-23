// Runs in main thread

import dgram from 'dgram';

const udp = {
    _socket: null,
    _id: 1,
    _ip: null,
    _port: null,
    connect: function(ip, port, window = true) {
        return new Promise(resolve => {     
            try {
                if (this._socket) {
                    this._socket.close();
                }

                this._socket = dgram.createSocket('udp4');

                this._socket.on('error', error => {
                    if (window && typeof window.isDestroyed === 'function' && !window.isDestroyed()) {
                        window.webContents.send('udpError', error); 
                    }
                });

                this._socket.on('message', (message, _rinfo) => {
                    if (window && typeof window.isDestroyed === 'function' && !window.isDestroyed()) {
                        window.webContents.send('udpMessage', message);
                    }
                });

                this._socket.bind(port, () => {
                    this._ip = ip;
                    this._port = port;
                    resolve({ error: false, id: this._id++ });
                });
            } catch (err) {
                resolve({error: true, errorMsg: err});
            }
        });
    },
    close: function() {
        return new Promise(resolve => {
            try {
                if (this._socket) {
                    const socket = this._socket;
                    this._socket = null;
                    this._ip = null;
                    this._port = null;
                    socket.close(() => {
                        resolve({error: false});
                    });
                } else {
                    resolve({error: false});
                }
            } catch (err) {
                resolve({error: true, msg: err});
            }
        });
    },
    send: function(data) {
        return new Promise(resolve => {  
            if (this._socket && this._ip && this._port) {
                this._socket.send(Buffer.from(data), this._port, this._ip, (error) => {
                    if (!error) {
                        resolve({error: false, bytesWritten: data.byteLength});
                    } else {
                        resolve({error: true, msg: error});
                    }
                });
            } else {
                resolve({error: true, msg: "UDP socket closed or invalid"});
            }
        });
    }
};

export default udp;
