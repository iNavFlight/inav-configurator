const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
    bleScan: (callback) => ipcRenderer.on('ble-scan', (_event, data) => callback(data)),
    deviceSelected: (deviceId) => ipcRenderer.send('deviceSelected', deviceId)
});