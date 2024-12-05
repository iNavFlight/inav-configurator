
const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  listSerialDevices: () => ipcRenderer.invoke('listSerialDevices'),
  storeGet: (key, defaultValue) => ipcRenderer.sendSync('storeGet', key, defaultValue),
  storeSet: (key, value) => ipcRenderer.send('storeSet', key, value),
  appGetPath: (name) => ipcRenderer.sendSync('appGetPath', name),
  appGetVersion: () => ipcRenderer.sendSync('appGetVersion'),
  appGetLocale: () => ipcRenderer.sendSync('appGetLocale'),
  tcpConnect: (host, port) => ipcRenderer.invoke('tcpConnect', host, port),
  tcpClose: (id) => ipcRenderer.send('tcpClose', id),
  tcpSend: (id, data) => ipcRenderer.invoke('tcpSend', id, data),
  onTcpError: (callback) => ipcRenderer.on('tcpError', (_event, error) => callback(error)),
  onTcpData: (callback) => ipcRenderer.on('tcpData', (_event, data) => callback(data)),
  onTcpEnd: (callback) => ipcRenderer.on('tcpEnd', (_event) => callback())
});