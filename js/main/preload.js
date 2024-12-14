
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  listSerialDevices: () => ipcRenderer.invoke('listSerialDevices'),
  storeGet: (key, defaultValue) => ipcRenderer.sendSync('storeGet', key, defaultValue),
  storeSet: (key, value) => ipcRenderer.send('storeSet', key, value),
  appGetPath: (name) => ipcRenderer.sendSync('appGetPath', name),
  appGetVersion: () => ipcRenderer.sendSync('appGetVersion'),
  appGetLocale: () => ipcRenderer.sendSync('appGetLocale'),
  showOpenDialog: (options) => ipcRenderer.invoke('dialog.showOpenDialog', options),
  showSaveDialog: (options) => ipcRenderer.invoke('dialog.showSaveDialog', options),
  alertDialog: (message) => ipcRenderer.sendSync('dialog.alert', message),
  confirmDialog: (message) => ipcRenderer.sendSync('dialog.confirm', message),
  tcpConnect: (host, port) => ipcRenderer.invoke('tcpConnect', host, port),
  tcpClose: () => ipcRenderer.send('tcpClose'),
  tcpSend: (data) => ipcRenderer.invoke('tcpSend', data),
  onTcpError: (callback) => ipcRenderer.on('tcpError', (_event, error) => callback(error)),
  onTcpData: (callback) => ipcRenderer.on('tcpData', (_event, data) => callback(data)),
  onTcpEnd: (callback) => ipcRenderer.on('tcpEnd', (_event) => callback()),
  serialConnect: (path, options) => ipcRenderer.invoke('serialConnect', path, options),
  serialClose: () => ipcRenderer.invoke('serialClose'),
  serialSend: (data) => ipcRenderer.invoke('serialSend', data),
  onSerialError: (callback) => ipcRenderer.on('serialError', (_event, error) => callback(error)),
  onSerialData: (callback) => ipcRenderer.on('serialData', (_event, data) => callback(data)),
  onSerialClose: (callback) => ipcRenderer.on('serialClose', (_event) => callback()),
  udpConnect: (ip, port) => ipcRenderer.invoke('udpConnect', ip, port),
  udpClose: () => ipcRenderer.invoke('udpClose'),
  udpSend: (data) => ipcRenderer.invoke('udpSend', data),
  onUdpError: (callback) => ipcRenderer.on('udpError', (_event, error) => callback(error)),
  onUdpMessage: (callback) => ipcRenderer.on('udpMessage', (_event, data) => callback(data)),
  writeFile: (filename, data) => ipcRenderer.invoke('writeFile', filename, data),
  readFile: (filename, encoding = 'utf8') => ipcRenderer.invoke('readFile', filename, encoding)
});
