import { spawn } from 'node:child_process'
import { app } from 'electron';
import path from 'path';
import fs from 'node:fs'
import os from 'os';

const child_process = {
    _processes: [],

    start: function (command, args, opts, window) {        
        let process;        
        try {
            const commandPath = path.join(app.getPath('userData'), 'sitl', command);

            if (os.platform() !== 'win32') {
                const stats = fs.statSync(commandPath);
                const permission = stats.mode & 0o777;
                if (permission !== 0o755) {
                    fs.chmodSync(commandPath, 0o755);
                }
            }
    
            process = spawn(commandPath, args, opts);
        } catch (err) {
            console.log(err);
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
            if (!window.isDestroyed()) {
                window.webContents.send('onChildProcessError', error);
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