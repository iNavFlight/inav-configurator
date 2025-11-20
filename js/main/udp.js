// Runs in main thread

import dgram from 'dgram';
const socket = dgram.createSocket('udp4');

const udp = {
    _id: 1,
    _ip: null,
    _port: null,
    connect: function(ip, port, window = true) {
        return new Promise(resolve => {     
            try {
                socket.bind(port, () => {
                    this._ip = ip;
                    this._port = port;
                    resolve({ error: false, id: this._id++ });
                });

                socket.on('error', error => {
                    if (window && typeof window.isDestroyed === 'function' && !window.isDestroyed()) {
                        window.webContents.send('udpError', error); 
                    }
                });

                socket.on('message', (message, _rinfo) => {
                    if (window && typeof window.isDestroyed === 'function' && !window.isDestroyed()) {
                        window.webContents.send('udpMessage', message);
                    }
                });                   
            } catch (err) {
                resolve({error: true, errorMsg: err});
            }
        });
    },
    close: function() {
        return new Promise(resolve => {
            try {
                socket.disconnect();
                resolve({error: false});
            } catch (err) {
                resolve({error: true, msg: err});
            }
        });
    },
    send: function(data) {
        return new Promise(resolve => {  
            if (this._ip && this._port) {
                socket.send(Buffer.from(data), this._port, this._ip, (error) => {
                    if (!error) {
                        resolve({error: false, bytesWritten: data.byteLength});
                    } else {
                        resolve({error: true, msg: error});
                    }
                });
            }
        });
    }
};

export default udp;