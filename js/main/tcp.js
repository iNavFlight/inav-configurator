// Runs in main thread

import net from 'net'

const tcp = {
    _socket: null,
    _id: 1,
    connect: function(host, port, window, setNoDelay = true) {
        return new Promise(resolve => {     
            try {
                this._socket = net.connect({host: host, port: port}, () => {    
                    this._socket.setNoDelay(setNoDelay); 
                });

                this._socket.on('error', error => {
                    if (!window.isDestroyed()) {
                        window.webContents.send('tcpError', error); 
                    }
                });

                this._socket.on('end', () => {
                    if (!window.isDestroyed()) {
                        window.webContents.send('tcpEnd');
                    }
                });

                this._socket.on('data', buffer => {
                    if (!window.isDestroyed()) {
                        window.webContents.send('tcpData', buffer);
                    }
                });
                resolve({error: false, id: this._id++});  
                
            } catch (err) {
                resolve ({error: true, errorMsg: err});
            }
        });
    },
    close: function() {
        if (this._socket && !this._socket.destroyed) {
            this._socket.end();
        }
        this._socket = null;
    },
    send: function(data) {
        return new Promise(resolve => {  
            if (this._socket && !this._socket.destroyed) {
                this._socket.write(Buffer.from(data), () => {
                    resolve({error: false, bytesWritten: data.byteLength});
                });
            } else {
                resolve({error: true, msg: "Socket closed or invalid"});
            }
        });
    }
};

export default tcp;