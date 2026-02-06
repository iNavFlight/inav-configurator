/**
 * WebAssembly SITL Simulator
 * Manages the Emscripten-compiled INAV SITL running in the browser via WebAssembly
 * 
 * Reference: js/sitl.js (native SITL process management)
 */

import { get } from 'jquery';
import GUI from './../gui';
import bridge from '../bridge';

import inavSITLModule from './WASM/inav_9.0.0_WASM.js';
import inavWasmUrl from './WASM/inav_9.0.0_WASM.wasm?url';
import { reset } from 'ol/transform';

// WASM module reference - accessible from outside this module
let WASMModule = null;
let isLoading = false;
let isRunning = false;

// Event listeners for output
const outputListeners = {
    print: [],
    printErr: []
};

/**
 * WebAssembly SITL configuration and control
 */
const SITLWebAssembly = {
    
    /**
     * Command line arguments for WASM SITL
     * Similar structure to native SITL (js/sitl.js)
     */
    commandLineArgs: [],
    
    /**
     * Logger callback - can be overridden
     */
    onLog: null,

    moduleConfig: {},

    /**
     * Register a listener for print output from WASM
     * 
     * @param {Function} listener - (text) => Called when WASM prints
     */
    onPrint: function(listener) {
        if (typeof listener === 'function') {
            outputListeners.print.push(listener);
        }
        return this;
    },

    /**
     * Register a listener for printErr output from WASM
     * 
     * @param {Function} listener - (text) => Called when WASM prints to stderr
     */
    onPrintErr: function(listener) {
        if (typeof listener === 'function') {
            outputListeners.printErr.push(listener);
        }
        return this;
    },

    /**
     * Remove a specific listener
     * 
     * @param {Function} listener - The listener to remove
     * @param {string} type - 'print' or 'printErr'
     */
    offPrint: function(listener, type = 'print') {
        const listeners = outputListeners[type] || [];
        const index = listeners.indexOf(listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
        return this;
    },

    /**
     * Remove all listeners
     * 
     * @param {string} type - 'print', 'printErr', or undefined for both
     */
    clearListeners: function(type = null) {
        if (!type) {
            outputListeners.print = [];
            outputListeners.printErr = [];
        } else if (outputListeners[type]) {
            outputListeners[type] = [];
        }
        return this;
    },

    /**
     * Internal method to emit print event
     * @private
     */
    _emitPrint: function(text) {
        outputListeners.print.forEach(listener => {
            try {
                listener(text);
            } catch (e) {
                console.error('Error in print listener:', e);
            }
        });
    },

    /**
     * Internal method to emit printErr event
     * @private
     */
    _emitPrintErr: function(text) {
        outputListeners.printErr.forEach(listener => {
            try {
                listener(text);
            } catch (e) {
                console.error('Error in printErr listener:', e);
            }
        });
    },

    /**
     * Initialize the WASM SITL module
     * Pre-loads the WASM binary and sets up the Module object
     * 
     * @param {Object} moduleConfig - Optional Module configuration
     *        {
     *          locateFile: function(path) => full path to .wasm file,
     *          preInit: function[] - functions to run before init,
     *          preRun: function[] - functions to run before main(),
     *          onRuntimeInitialized: function() - callback when runtime ready
     *        }
     * @param {Function} callback - (err, module) => Called when ready
     */
    init: async function(moduleConfig = {}, callback) {
        
        if (WASMModule) {
            console.log('WASM SITL already initialized');
            if (callback) callback(null, WASMModule);
            return;
        }

        try {
            isLoading = true;

            // Create base Module configuration
            const baseConfig = {
                locateFile: (path) => {
                    if (path.endsWith('.wasm')) {
                        return inavWasmUrl;
                    }
                    return path;
                },
                onExit: (code) => {
                    isRunning = false;
                    GUI.log(`[SITL WASM] Exited with code ${code}`);

                    if (code === 1) {
                        // Save command line args and attempt restart after short delay
                        let commandLineArgs = this.commandLineArgs.slice();
                        this.reset();
                        setTimeout(() => {
                            this.start(commandLineArgs, (err) => {
                                if (err) {
                                    GUI.log(`[SITL WASM] Failed to restart after crash: ${err.message}`);
                                } else {
                                    GUI.log('[SITL WASM] Restarted');
                                }
                            });
                        }, 1000);
                    }
                },                

                // Prepare command line arguments
                arguments: this.commandLineArgs,

                // Print output to event listeners and custom logger
                print: (text) => {
                    if (this.onLog) this.onLog(text);
                    this._emitPrint(text + '\n');
                },

                printErr: (text) => {
                    if (this.onLog) this.onLog(text);
                    this._emitPrintErr(text + '\n');
                },

                // Callbacks
                preInit: moduleConfig.preInit || [],
                preRun: moduleConfig.preRun || [],

                // Memory configuration
                wasmBinary: null // Will be loaded dynamically
            };

            // Merge with user config
            const finalConfig = Object.assign({}, baseConfig, moduleConfig);

            // Load the WASM module and configure it
            const module = await inavSITLModule(finalConfig);
        
            WASMModule = module;
            isLoading = false;

            GUI.log('[SITL WASM] Initialized successfully');
            
            if (callback) callback(null, WASMModule);
            
            return WASMModule;

        } catch (error) {
            isLoading = false;
            const msg = `Failed to initialize SITL WASM: ${error.message}`;
            console.error(msg);
            GUI.log(msg);
            
            if (callback) callback(error, null);
            throw error;
        }
    },

    /**
     * Start the WASM SITL
     * 
     * @param {Object} options - Configuration options
     *        {
     *          eepromFile: 'sitl.eepr' - EEPROM file name,
     *          sim: 'realflight' - Simulator type (realflight, xplane, etc.),
     *          useIMU: false - Use IMU simulation,
     *          simIp: '127.0.0.1' - Simulator IP,
     *          simPort: 49000 - Simulator port,
     *          channelMap: '' - Channel mapping,
     *          proxyPort: 8081 - Websocket Proxy port 
     *        }
     * @param {Function} callback - (err, commandString) => Called with formatted command or error
     */
    start: async function(options = {}, callback) {
        
        if (isRunning) {
            const msg = 'SITL WASM already running';
            console.warn(msg);
            if (callback) callback(new Error(msg));
            return;
        }

        if (isLoading) {
            const msg = 'SITL WASM still initializing';
            console.warn(msg);
            if (callback) callback(new Error(msg));
            return;
        }

        try {
            // Build command line arguments (matching native SITL pattern)
            
            if (Array.isArray(options)) {
                this.commandLineArgs = options;
            } else {
                this.commandLineArgs = this._buildArguments(options);
            }

            // If not initialized, initialize first
            if (!WASMModule) {
                await this.init({}, (err, module) => {
                    if (err) {
                        if (callback) callback(err);
                        return;
                    }
                });
            }

            const commandString = 'inav_SITL_WASM ' + this.commandLineArgs.join(' ') + '\n';
            isRunning = true;

            const args = [...this.commandLineArgs]; // Copy, because callMain may modify
            
            if (WASMModule.callMain) {
                WASMModule.callMain(args);
            }

            if (callback) callback(null, commandString);

        } catch (error) {
            isRunning = false;
            const msg = `Failed to start SITL WASM: ${error.message}`;
            console.error(msg);
            GUI.log(msg);
            
            if (callback) callback(error);
        }
    },

    /**
     * Reload the WASM module
     *
    **/
    reset: function() {
        
        if (!WASMModule) {
            console.warn('SITL WASM not initialized, nothing to reset');
            return;
        }

        if (isRunning) {
            console.warn('SITL WASM is running, stopping before reset');
            this.stop();
        }
        
        WASMModule = null;
        isRunning = false;
        isLoading = false;
    },

    /**
     * Stop the WASM SITL simulator
     * Note: Emscripten WASM doesn't have a built-in "stop" mechanism.
     * This would typically be done by triggering a quit() call in the SITL code.
     * 
     * @param {Function} callback - () => Called when stopped
     */
    stop: function(callback) {
        
        if (!isRunning) {
            console.warn('SITL WASM not running');
            if (callback) callback();
            return;
        }

        try {
            // If SITL has a wasmExit function exported, call it
            if (WASMModule && WASMModule._wasmExit) {
                WASMModule._wasmExit();
            }

            // If SITL has a C function exposed via ccall
            if (WASMModule && WASMModule.ccall) {
                try {
                    WASMModule.ccall('quit', null, [], []);
                } catch (e) {
                    console.log('quit() function not available:', e.message);
                }
            }
            isRunning = false;

        } catch (error) {
            if (error.name === 'ExitStatus') {
                // emscripten always throws an error on exit
                isRunning = false;
                GUI.log('[SITL WASM] Stopped');
                console.log('WASM exit: ', error.status);
            } else {
                console.error('Error stopping SITL WASM:', error);
            }
        } finally {
            
            if (callback) callback();
        }
    },

    /**
     * Build command line arguments from options object
     * Mirrors the argument building in js/sitl.js
     * 
     * @private
     * @param {Object} options - Configuration
     * @returns {Array<string>} Command line arguments
     */
    _buildArguments: function(options) {
        
        const args = [];

        // EEPROM file path
        if (options.eepromFile) {
            args.push(`--path=${options.eepromFile}`);
        }
        
        if (options.proxyPort !== undefined) {
            args.push(`--proxyPort=${options.proxyPort}`);
        }

        // Simulator configuration
        if (options.sim) {
            args.push(`--sim=${options.sim}`);
            
            if (options.useIMU) {
                args.push('--useimu');
            }

            if (options.simIp) {
                args.push(`--simip=${options.simIp}`);
            }

            if (options.simPort) {
                args.push(`--simport=${options.simPort}`);
            }

            if (options.channelMap) {
                args.push(`--chanmap=${options.channelMap}`);
            }
            
        }

        return args;
    },

    /**
     * Call an exported C function from the SITL WASM module
     * 
     * @param {string} funcName - Function name (without _prefix)
     * @param {string} returnType - Emscripten return type ('number', 'string', 'boolean', 'array', null)
     * @param {Array<string>} argTypes - Emscripten argument types
     * @param {Array} args - Arguments to pass
     * @returns {*} Function result or null if WASM not initialized
     */
    callCFunction: function(funcName, returnType, argTypes, args) {
        
        if (!WASMModule) {
            console.warn('SITL WASM not initialized');
            return null;
        }

        if (!WASMModule.ccall) {
            console.warn('ccall not available in WASM module');
            return null;
        }

        try {
            return WASMModule.ccall(funcName, returnType, argTypes, args);
        } catch (error) {
            console.error(`Error calling ${funcName}:`, error);
            return null;
        }
    },

    /**
     * Get memory data from WASM module at specific address
     * 
     * @param {number} address - Memory address
     * @param {number} length - Number of bytes to read
     * @returns {Uint8Array|null} Memory data or null if not available
     */
    readMemory: function(address, length) {
        
        if (!WASMModule || !WASMModule.HEAPU8) {
            return null;
        }

        try {
            return WASMModule.HEAPU8.slice(address, address + length);
        } catch (error) {
            console.error('Error reading WASM memory:', error);
            return null;
        }
    },

    /**
     * Get the WASM module object for direct access
     * Useful for accessing exported functions and memory
     * 
     * @returns {Object|null} The Module object or null if not initialized
     */
    getModule: function() {
        return WASMModule;
    },

    getHeapU8: function() {
        if (!WASMModule || !WASMModule.HEAPU8) {
            return null;
        }

        return WASMModule.HEAPU8;
    },

    getHeapU16: function() {
        if (!WASMModule || !WASMModule.HEAPU16) {
            return null;
        }
        return WASMModule.HEAPU16;
    },

    /**
     * Check if SITL WASM is running
     * 
     * @returns {boolean}
     */
    isRunning: function() {
        return isRunning;
    },

    /**
     * Check if SITL WASM is initializing
     * 
     * @returns {boolean}
     */
    isLoading: function() {
        return isLoading;
    },

};

export default SITLWebAssembly;
export { WASMModule, isRunning, isLoading };
