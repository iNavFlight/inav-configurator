
import pkg from './../package.json' assert { type: 'json' };
import webSerial from './web/serial';
import webLocalStorage from './web/localStoreage';

const usbBootloaders =  [
  { vendorId: 1155, productId: 57105, name: 'STM DFU'}, 
  { vendorId: 11836, productId: 57105, name: 'AT32 DFU'}
];

const bridge = {
    
    isElectron: false,
    serialEvents: new EventTarget(),
    tcpEvents: new EventTarget(),
    udpEvents: new EventTarget(),
    bootloaderIds: usbBootloaders,

    init: function() {
        this.isElectron = typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0;
        if (this.isElectron) {
            window.electronAPI.onSerialData(buffer => this.serialEvents.dispatchEvent(new CustomEvent('data', { detail: buffer })));
            window.electronAPI.serialClose(() => this.serialEvents.dispatchEvent(new CustomEvent('close')));
            window.electronAPI.onSerialError(error => this.serialEvents.dispatchEvent(new CustomEvent('error', { detail: error })));

            window.electronAPI.onTcpData(buffer => this.tcpEvents.dispatchEvent(new CustomEvent('data', { detail: buffer })));
            window.electronAPI.onTcpEnd(() => this.tcpEvents.dispatchEvent(new CustomEvent('close')));
            window.electronAPI.onTcpError(error => this.tcpEvents.dispatchEvent(new CustomEvent('error', { detail: error })));

            window.electronAPI.onUdpMessage(buffer => this.udpEvents.dispatchEvent(new CustomEvent('data', { detail: buffer })));
            window.electronAPI.onUdpError(error => this.udpEvents.dispatchEvent(new CustomEvent('error', { detail: error })));

        } else {
            webSerial.events.addEventListener('data', event => this.serialEvents.dispatchEvent(new CustomEvent('data', { detail: event.detail })));
            webSerial.events.addEventListener('close', () => this.serialEvents.dispatchEvent(new CustomEvent('close')));
            webSerial.events.addEventListener('error', event => this.serialEvents.dispatchEvent(new CustomEvent('error', { detail: event.detail })));
        }
    },


    githubApiUrl: function(url) {
        
    },

    getAppLocale : function() {
        if (this.isElectron) {
            return window.electronAPI.appGetLocale();
        } else {
            return navigator.language;
        }
    },

    storeGet: function(key, defaultValue) {
        if (this.isElectron) {
            return window.electronAPI.storeGet(key, defaultValue);
        } else {
            return webLocalStorage.get(key, defaultValue);
        }
    },

    storeSet: function(key, value) {
        if (this.isElectron) {
            window.electronAPI.storeSet(key, value);
        } else {
            webLocalStorage.set(key, value);
        }
    },

    storeDelete: function(key) {
        if (this.isElectron) {
            window.electronAPI.storeDelete(key);
        } else {
            webLocalStorage.delete(key);
        }
    },

    getAppVersion: function() {
        if (this.isElectron) {
            return window.electronAPI.appGetVersion();
        } else {
            return pkg.version;
        }
    },

    serialConnect: function(path, options) {
        if (this.isElectron) {
            return window.electronAPI.serialConnect(path, options);
        } else {
            return webSerial.connect(path, options);
        }
    },

    serialClose: function() {
        if (this.isElectron) {
            return window.electronAPI.serialClose();
        } else {
           return webSerial.close();
        }
    },

    serialSend: function(data) {
        if (this.isElectron) {
            return window.electronAPI.serialSend(data);
        } else {
            return webSerial.send(data);
        }
    },

    tcpConnect: function(host, port, window, setNoDelay) {
        if (this.isElectron) {
            return window.electronAPI.tcpConnect(host, port)
        } 
    },

    tcpClose: function() {
        if (this.isElectron) {
            return window.electronAPI.tcpClose();
        }
    },

    tcpSend: function(data) {
        if (this.isElectron) {
            return window.electronAPI.tcpSend(data);
        } 
    },

    udpConnect: function(host, port, window, setNoDelay) {
        if (this.isElectron) {
            return window.electronAPI.udpConnect(host, port)
        } 
    },

    udpClose: function() {
        if (this.isElectron) {
            return window.electronAPI.udpClose();
        }
    },

    udpSend: function(data) {
        if (this.isElectron) {
            return window.electronAPI.udpSend(data);
        } 
    },

    listSerialDevices: async function () {
        if (this.isElectron) {
            return window.electronAPI.listSerialDevices();
        } else {
            return webSerial.getDevices();
        }
    },

    requestWebSerialPermission: async function () {
        if (!this.isElectron)    {
            return webSerial.requestPermission();
        }
    },
}

export default bridge;
