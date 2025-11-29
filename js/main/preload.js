
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  listSerialDevices: () => ipcRenderer.invoke('listSerialDevices'),
  storeGet: (key, defaultValue) => ipcRenderer.sendSync('storeGet', key, defaultValue),
  storeSet: (key, value) => ipcRenderer.send('storeSet', key, value),
  storeDelete: (key) => ipcRenderer.send('storeDelete', key),
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
  onTcpError: (callback) => {
    const handler = (_event, error) => callback(error);
    ipcRenderer.on('tcpError', handler);
    return handler;
  },
  offTcpError: (handler) => ipcRenderer.removeListener('tcpError', handler),
  onTcpData: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('tcpData', handler);
    return handler;
  },
  offTcpData: (handler) => ipcRenderer.removeListener('tcpData', handler),
  onTcpEnd: (callback) => {
    const handler = (_event) => callback();
    ipcRenderer.on('tcpEnd', handler);
    return handler;
  },
  offTcpEnd: (handler) => ipcRenderer.removeListener('tcpEnd', handler),
  serialConnect: (path, options) => ipcRenderer.invoke('serialConnect', path, options),
  serialClose: () => ipcRenderer.invoke('serialClose'),
  serialSend: (data) => ipcRenderer.invoke('serialSend', data),
  onSerialError: (callback) => {
    const handler = (_event, error) => callback(error);
    ipcRenderer.on('serialError', handler);
    return handler;
  },
  offSerialError: (handler) => ipcRenderer.removeListener('serialError', handler),
  onSerialData: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('serialData', handler);
    return handler;
  },
  offSerialData: (handler) => ipcRenderer.removeListener('serialData', handler),
  onSerialClose: (callback) => {
    const handler = (_event) => callback();
    ipcRenderer.on('serialClose', handler);
    return handler;
  },
  offSerialClose: (handler) => ipcRenderer.removeListener('serialClose', handler),
  udpConnect: (ip, port) => ipcRenderer.invoke('udpConnect', ip, port),
  udpClose: () => ipcRenderer.invoke('udpClose'),
  udpSend: (data) => ipcRenderer.invoke('udpSend', data),
  onUdpError: (callback) => {
    const handler = (_event, error) => callback(error);
    ipcRenderer.on('udpError', handler);
    return handler;
  },
  offUdpError: (handler) => ipcRenderer.removeListener('udpError', handler),
  onUdpMessage: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('udpMessage', handler);
    return handler;
  },
  offUdpMessage: (handler) => ipcRenderer.removeListener('udpMessage', handler),
  writeFile: (filename, data) => ipcRenderer.invoke('writeFile', filename, data),
  readFile: (filename, encoding = 'utf8') => ipcRenderer.invoke('readFile', filename, encoding),
  rm: (path) => ipcRenderer.invoke('rm', path),
  chmod: (path, mode) => ipcRenderer.invoke('chmod', path, mode),
  startChildProcess: (command, args, opts) => ipcRenderer.send('startChildProcess', command, args, opts),
  killChildProcess: () => ipcRenderer.send('killChildProcess'),
  onChildProcessStdout: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('onChildProcessStdout', handler);
    return handler;
  },
  offChildProcessStdout: (handler) => ipcRenderer.removeListener('onChildProcessStdout', handler),
  onChildProcessStderr: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('onChildProcessStderr', handler);
    return handler;
  },
  offChildProcessStderr: (handler) => ipcRenderer.removeListener('onChildProcessStderr', handler),
  onChildProcessError: (callback) => {
    const handler = (_event, error) => callback(error);
    ipcRenderer.on('onChildProcessError', handler);
    return handler;
  },
  offChildProcessError: (handler) => ipcRenderer.removeListener('onChildProcessError', handler),
});
