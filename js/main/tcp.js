// Runs in main thread

import net from 'node:net'

const tcp = {
    _sockets: [],
    _id: 1,
    connect: function(host, port, window, setNoDelay = true) {
        return new Promise(resolve => {        
            try {
                const socket = net.connect({host: host, port: port}, () =>  {
                    socket.setNoDelay(setNoDelay);
                });
                this._sockets[this._id] = socket;

                socket.on('error', error => {
                    window.webContents.send('tcpError', error); 
                });

                socket.on('end', () => {
                    window.webContents.send('tcpEnd'); 
                });

                socket.on('data', buffer => {
                    window.webContents.send('tcpData', buffer); 
                });

                resolve ({error: false, id: this._id++});
            } catch (err) {
                resolve ({error: true, errorMsg: err});
            }
        });
    },
    close: function(id) {
        const socket = this._sockets[id];
        if (socket && !socket.destroyed) {
            socket.end();
        }
        this._sockets[id - 1] = undefined;
    },
    send: function(id, data) {
        return new Promise(resolve => {  
            const socket = this._sockets[id];
            if (socket && !socket.destroyed) {
                socket.write(Buffer.from(data), () => {
                    resolve(data.length);
                });
            }
        });
    }
};

export default tcp;