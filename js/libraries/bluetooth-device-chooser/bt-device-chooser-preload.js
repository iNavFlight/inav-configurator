import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    bleScan: (callback) => ipcRenderer.on('ble-scan', (_event, data) => callback(data)),
    deviceSelected: (deviceId) => ipcRenderer.send('deviceSelected', deviceId)
});