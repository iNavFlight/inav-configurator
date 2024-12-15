import { spawn } from 'node:child_process'

const child_process = {
    _processes: [],
    _id: 0,

    start: function (command, args, opts, window) {        
        var process;
        try {
            process = spawn(command, args, opts);
        } catch (err) {
            console.log(err);
            return -1;
        }
        
        this._processes[this._id] = process;
        
        process.stdout.on('data', (data) => {
            if (!window.isDestroyed()) {
                window.webContents.send('onChildProcessStdout', data.toString());
            }
        });

        process.stderr.on('data', (data) => {
            if (!window.isDestroyed()) {
                window.webContents.send('onChildProcessStderr', data.toString());
            }
        });

        process.on('error', (error) => {
            if (!window.isDestroyed()) {
                window.webContents.send('onChildProcessError', error);
            }
        });

        return this._id++;
    },

    stop: function(handle) {
        var process = this._processes[handle];
        if (process) {
            try {
                process.kill();
            } catch (err) {
                console.log(err);
            }
            this._processes[handle] = null;
        }
    },

    stopAll: function() {
        for (const process in this._processes) {
            if (process) {
                process.kill();
            }
        }
        this._processes = [];
    }
};

export default child_process;