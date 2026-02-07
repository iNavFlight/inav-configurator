
import pkg from './../package.json' assert { type: 'json' };
import webSerial from './web/serial';
import webLocalStorage from './web/localStoreage';
import browser from './web/browser';

const usbBootloaders =  [
  { vendorId: 1155, productId: 57105, name: 'STM DFU'}, 
  { vendorId: 11836, productId: 57105, name: 'AT32 DFU'}
];

const Platform = Object.freeze({
    Electron: 'Electron',
    Web: 'Web',
    // Currently not used, but may be useful in the future to differentiate between different platforms (e.g. for file handling)
    Android: 'Android',
    iOS: 'iOS',
});

const bridge = {
    
    serialEvents: new EventTarget(),
    bootloaderIds: usbBootloaders,
    platform: Platform.Web,

    init: function() {
        if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
            this.platform = Platform.Electron;
        } else {
            this.platform = Platform.Web;
        }
        // More robust platform detection can be added here in the future if needed
        
        if (this.platform === Platform.Electron) {
            window.electronAPI.onSerialData(buffer => this.serialEvents.dispatchEvent(new CustomEvent('data', { detail: buffer })));
            window.electronAPI.serialClose(() => this.serialEvents.dispatchEvent(new CustomEvent('close')));
            window.electronAPI.onSerialError(error => this.serialEvents.dispatchEvent(new CustomEvent('error', { detail: error })))

        } else {
            webSerial.events.addEventListener('data', event => this.serialEvents.dispatchEvent(new CustomEvent('data', { detail: event.detail })));
            webSerial.events.addEventListener('close', () => this.serialEvents.dispatchEvent(new CustomEvent('close')));
            webSerial.events.addEventListener('error', event => this.serialEvents.dispatchEvent(new CustomEvent('error', { detail: event.detail })));
        }
    },

    getPlatformInfo: function() {
        let info = 'Unknown Browser';
        if (this.platform === Platform.Electron) {
            const electronMatch = navigator.userAgent.match(/Electron\/([\d\.]+)/);
            info = 'Electron: <strong>' + (electronMatch ? electronMatch[1] : 'unknown') + '</strong>, ';
        } else {
            info = browser.getBrowserInfo();
        }
        return info;
    },

    getPlatform: function() {
        return this.platform;
    },

    proxy: function(url) {
        if (this.platform === Platform.Electron) {
            return url;
        } else  {
            // Use a cloudflare worker as a proxy to bypass CORS policy  
            return `https://proxy.inav.workers.dev/?url=${url}`
        }
    },

    readFile: async function(file) {
         if (this.platform === Platform.Electron) {
            const response = await window.electronAPI.readFile(file);
            return {
                error: response.error,
                data: response.error ? null : response.toString()
            }
        } else {
            try {
                const text = await file.text();
                return {
                    error: false,
                    data: text
                }
            } catch (error) {
                return {
                    error: error,
                    data: null
                }
            }
         }
    },

    writeFile: async function (filename, data, binary = false) {
        if (this.platform === Platform.Electron) {
            return window.electronAPI.writeFile(filename, data);
        } else if (this.platform === Platform.Web) {
            const blob = new Blob([data],  {type: binary ? 'application/octet-stream' : 'text/plain'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename,
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return false;
        }
    },

    getAppLocale : function() {
        if (this.platform === Platform.Electron) {
            return window.electronAPI.appGetLocale();
        } else {
            return navigator.language;
        }
    },

    storeGet: function(key, defaultValue) {
        if (this.platform === Platform.Electron) {
            return window.electronAPI.storeGet(key, defaultValue);
        } else {
            return webLocalStorage.get(key, defaultValue);
        }
    },

    storeSet: function(key, value) {
        if (this.platform === Platform.Electron) {
            window.electronAPI.storeSet(key, value);
        } else {
            webLocalStorage.set(key, value);
        }
    },

    storeDelete: function(key) {
        if (this.platform === Platform.Electron) {
            window.electronAPI.storeDelete(key);
        } else {
            webLocalStorage.delete(key);
        }
    },

    getAppVersion: function() {
        if (this.platform === Platform.Electron) {
            return window.electronAPI.appGetVersion();
        } else {
            return pkg.version;
        }
    },

    serialConnect: function(path, options) {
        if (this.platform === Platform.Electron) {
            return window.electronAPI.serialConnect(path, options);
        } else {
            return webSerial.connect(path, options);
        }
    },

    serialClose: function() {
        if (this.platform === Platform.Electron) {
            return window.electronAPI.serialClose();
        } else {
           return webSerial.close();
        }
    },

    serialSend: function(data) {
        if (this.platform === Platform.Electron) {
            return window.electronAPI.serialSend(data);
        } else {
            return webSerial.send(data);
        }
    },

    listSerialDevices: async function () {
        if (this.platform === Platform.Electron) {
            return window.electronAPI.listSerialDevices();
        } else {
            return webSerial.getDevices();
        }
    },

    requestWebSerialPermission: async function () {
        if (this.platform === Platform.Web)    {
            return webSerial.requestPermission();
        }
    },
}

export { bridge, Platform };
