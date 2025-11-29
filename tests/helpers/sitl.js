/**
 * SITL (Software In The Loop) helper for integration tests
 * Manages starting/stopping a real INAV SITL instance for testing
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// SITL binary path relative to configurator root (assumes inav repo is sibling directory)
const SITL_BINARY = path.resolve(__dirname, '../../..', 'inav/build/bin/SITL.elf');
const SITL_PORT = 5761; // UART2 port
const SITL_STARTUP_TIMEOUT = 5000;

class SITLHelper {
    constructor() {
        this.process = null;
        this.ready = false;
    }

    /**
     * Start the SITL process
     * @returns {Promise<void>}
     */
    async start() {
        if (this.process) {
            throw new Error('SITL already running');
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('SITL startup timeout'));
            }, SITL_STARTUP_TIMEOUT);

            this.process = spawn(SITL_BINARY, [], {
                cwd: path.dirname(SITL_BINARY),
                stdio: ['ignore', 'pipe', 'pipe'],
            });

            const checkReady = (output) => {
                // SITL outputs various messages when starting up
                // Look for EEPROM or GIMBAL messages which indicate initialization
                if (output.includes('[GIMBAL]') || output.includes('[EEPROM] Saved')) {
                    clearTimeout(timeout);
                    this.ready = true;
                    // Poll until port is accepting connections
                    const pollReady = async () => {
                        if (await this.isReady()) {
                            resolve();
                        } else {
                            setTimeout(pollReady, 100);
                        }
                    };
                    pollReady();
                }
            };

            this.process.stdout.on('data', (data) => {
                checkReady(data.toString());
            });

            this.process.stderr.on('data', (data) => {
                checkReady(data.toString());
            });

            this.process.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });

            this.process.on('exit', (code) => {
                this.process = null;
                this.ready = false;
                if (code !== 0 && code !== null) {
                    console.error(`SITL exited with code ${code}`);
                }
            });
        });
    }

    /**
     * Stop the SITL process
     */
    async stop() {
        if (!this.process) {
            return;
        }

        return new Promise((resolve) => {
            this.process.on('exit', () => {
                this.process = null;
                this.ready = false;
                resolve();
            });

            this.process.kill('SIGTERM');

            // Force kill after 2 seconds
            setTimeout(() => {
                if (this.process) {
                    this.process.kill('SIGKILL');
                }
            }, 2000);
        });
    }

    /**
     * Check if SITL is running and accepting connections
     * @returns {Promise<boolean>}
     */
    async isReady() {
        if (!this.process || !this.ready) {
            return false;
        }

        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1000);

            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });

            socket.on('error', () => {
                resolve(false);
            });

            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });

            socket.connect(SITL_PORT, 'localhost');
        });
    }

    /**
     * Get connection info for the SITL
     * @returns {{ host: string, port: number }}
     */
    getConnectionInfo() {
        return {
            host: 'localhost',
            port: SITL_PORT,
        };
    }
}

// Singleton instance
const sitlHelper = new SITLHelper();

export { SITLHelper, SITL_PORT, SITL_BINARY };
export default sitlHelper;
