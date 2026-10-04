import { spawn } from 'node:child_process'

const child_process = {
    _processes: [],

    start: function (command, args, opts, window) {
        var process;
        try {
            process = spawn(command, args, opts);
        } catch (err) {
            console.log(`[child_process] Spawn error: ${err.message}`);
            if (!window.isDestroyed()) {
                window.webContents.send('onChildProcessError', { message: `Spawn error: ${err.message}` });
            }
            return -1;
        }

        this._processes.push(process);

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
            console.log(`[child_process] Error: ${error.message}`);
            if (!window.isDestroyed()) {
                window.webContents.send('onChildProcessError', { message: error.message });
            }
        });

        process.on('exit', (code, signal) => {
            if (!window.isDestroyed()) {
                window.webContents.send('onChildProcessExit', { code, signal });
            }
        });
    },

    stop: function() {
        for (const process of this._processes) {
            if (process) {
                try {
                    process.kill();
                } catch (err) {
                    console.log(err);
                }
            }
        }
        this._processes = [];
    }
};

export default child_process;