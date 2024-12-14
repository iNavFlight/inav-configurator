import { app, BrowserWindow, ipcMain, Menu, MenuItem, shell, dialog } from 'electron';
import windowStateKeeper from 'electron-window-state';
import Store from "electron-store";
import path from 'path';
import { fileURLToPath } from 'node:url';
import started from 'electron-squirrel-startup';
import { SerialPort } from 'serialport';
import { writeFile, readFile } from 'node:fs/promises';

import tcp from './tcp';
import udp from './udp';
import serial from './serial';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const usbBootloaderIds =  [
  { vendorId: 1155, productId: 57105}, 
  { vendorId: 11836, productId: 57105}
];

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow = null;
let bluetoothDeviceChooser = null;
let btDeviceList = null;
let selectBluetoothCallback = null;

const store = new Store();

// In Electron the bluetooth device chooser didn't exist, so we have to build our own
function createDeviceChooser() {
  bluetoothDeviceChooser = new BrowserWindow({
    parent: mainWindow,
    width: 410,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'bt-device-chooser-preload.mjs'),
    }
  });
  bluetoothDeviceChooser.removeMenu();
  
  if (BT_DEVICE_CHOOSER_VITE_DEV_SERVER_URL) {
    bluetoothDeviceChooser.loadURL(`${BT_DEVICE_CHOOSER_VITE_DEV_SERVER_URL}/js/libraries/bluetooth-device-chooser/bt-device-chooser-index.html`);
  } else {
    bluetoothDeviceChooser.loadFile(path.join(__dirname, `../renderer/${BT_DEVICE_CHOOSER_VITE_NAME}/js/libraries/bluetooth-device-chooser/bt-device-chooser-index.html`));
  }
  

  bluetoothDeviceChooser.on('closed', () => {
    btDeviceList = null;
    if (selectBluetoothCallback) {
      selectBluetoothCallback('');
      selectBluetoothCallback = null;
    }
    bluetoothDeviceChooser = null;
  });

  ipcMain.on('deviceSelected', (_event, deviceID) => {
    if (selectBluetoothCallback) {
      selectBluetoothCallback(deviceID);
      selectBluetoothCallback = null;
    }
  });

}

app.on('ready', () => {
  createWindow();
});

function createWindow() {

  let mainWindowState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600
  });
  
  mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    autoHideMenuBar: true,
    icon: "images/inav_icon_128.png",
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true,
      webSecurity: false
      //contextIsolation: true
    },
  });

  mainWindow.webContents.on('context-menu', (_, props) => {
    const menu = new Menu()  ;
    menu.append(new MenuItem({ label: "Undo", role: "undo", accelerator: 'CmdOrCtrl+Z', visible: props.isEditable }));
    menu.append(new MenuItem({ label: "Redo", role: "redo", accelerator: 'CmdOrCtrl+Y', visible: props.isEditable }));
    menu.append(new MenuItem({ type: "separator", visible: props.isEditable }));
    menu.append(new MenuItem({ label: 'Cut', role: 'cut', accelerator: 'CmdOrCtrl+X', visible: props.isEditable && props.selectionText }));
    menu.append(new MenuItem({ label: 'Copy', role: 'copy', accelerator: 'CmdOrCtrl+C', visible: props.selectionText }));
    menu.append(new MenuItem({ label: 'Paste', role: 'paste', accelerator: 'CmdOrCtrl+V', visible: props.isEditable }));
    menu.append(new MenuItem({ label: "Select all", role: 'selectAll', accelerator: 'CmdOrCtrl+A', visible: props.isEditable}));

    menu.items.forEach(item => {
      if (item.visible) {
        menu.popup();
        return;
      } 
    });
  });

  mainWindow.webContents.on('select-bluetooth-device', (event, deviceList, callback) => {
    event.preventDefault();
    selectBluetoothCallback = callback;

    const compare = (a, b) => {
      if (a.length !== b.length) {
        return false;
      }
      a.every((element, index) => {
        if (element.deviceId !== b[index].deviceId) {
          return false;
        }
      })
      return true;
    }

    if (!btDeviceList || !compare(btDeviceList, deviceList)) {
      btDeviceList = [...deviceList];
  
      if (!bluetoothDeviceChooser) {
        createDeviceChooser();
      }
      bluetoothDeviceChooser.webContents.send('ble-scan', btDeviceList);
    }
  });

  
  mainWindow.webContents.session.on('select-usb-device', (event, details, callback) => {
    console.log(details.deviceList)
    let premittedDevice = null;
    if (details.deviceList) {
      details.deviceList.every((device, idx) => {
        if (device.productId == usbBootloaderIds[idx].productId && device.vendorId == usbBootloaderIds[idx].vendorId) {
          premittedDevice = device.deviceId;
          return;
        }
      });
    } 

    if (premittedDevice) {
      callback(premittedDevice);
    } else {
      callback();
    }
  
  });
  

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'usb') {     
        return true;
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Open links starts with https:// in default browser
    if (url.startsWith('https://')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }

    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        autoHideMenuBar: true
      }
    }
  });

  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')
  
  if (process.platform === "linux"){
    app.commandLine.appendSwitch("enable-experimental-web-platform-features", true);
  }

  app.commandLine.appendSwitch("enable-web-bluetooth", true);

  mainWindow.removeMenu();
  mainWindow.setMinimumSize(800, 600);

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }
  
  mainWindowState.manage(mainWindow);

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.on("ready-to-show", () => {
      mainWindow.webContents.openDevTools();
    });
  }
};

app.on('before-quit', async () => {
  await tcp.close();
  await serial.close();
});

app.on('window-all-closed', async () => {
  
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
  
  console.log("We're closing...");
});

async function getDevices() {
  const ports = await SerialPort.list();
  var devices = [];
  ports.forEach(port => {
    if (process.platform == 'Linux') {
      /* Limit to: USB serial, RFCOMM (BT), 6 legacy devices */
      if (port.pnpId || port.path.match(/rfcomm\d*/) || port.path.match(/ttyS[0-5]$/)) {
        devices.push(port.path);
      }
    } else {
      devices.push(port.path);
    }
  });
  return devices
  }

app.whenReady().then(() => {
  
   ipcMain.handle('listSerialDevices', (event) => {
    return getDevices()
  });

  ipcMain.on('storeGet', (event, key, defaultVale) => {
    event.returnValue = store.get(key, defaultVale);
  });

  ipcMain.on('storeSet', (_event, key, value) => {
    store.set(key, value);
  });

  ipcMain.on('appGetPath', (event, name) => {
    event.returnValue = app.getPath(name);
  });

  ipcMain.on('appGetVersion', (event) => {
    event.returnValue = app.getVersion();
  });

  ipcMain.on('appGetLocale', (event) => {
    event.returnValue = app.getLocale();
  });

  ipcMain.handle('dialog.showOpenDialog', (_event, options) => {
    return dialog.showOpenDialog(options);
  }),

  ipcMain.handle('dialog.showSaveDialog', (_event, options) => {
    return dialog.showSaveDialog(options);
  }),

  ipcMain.on('dialog.alert', (event, message) => {
    event.returnValue = dialog.showMessageBoxSync({ message: message, icon: path.join(__dirname, './../../images/inav_icon_128.png')});
  });

  ipcMain.on('dialog.confirm', (event, message) => {
    event.returnValue = (dialog.showMessageBoxSync({ message: message, icon: path.join(__dirname, './../../images/inav_icon_128.png'), buttons: ["Yes", "No"]}) == 0);
  });

  ipcMain.handle('tcpConnect', (_event, host, port) => {
    return tcp.connect(host, port, mainWindow);
  });

  ipcMain.handle('tcpSend', (_event, data) => {
    return tcp.send(data);
  });

  ipcMain.on('tcpClose', (_event) => {
    tcp.close();
  });

  ipcMain.handle('serialConnect', (_event, path, options) => {
    return serial.connect(path, options, mainWindow);
  });

  ipcMain.handle('serialSend', (_event, data) => {
    return serial.send(data);
  });

  ipcMain.handle('serialClose', (_event) => {
    return serial.close();
  });

  ipcMain.handle('udpConnect', (_event, ip, port) => {
    return udp.connect(ip, port, mainWindow);
  });

  ipcMain.handle('udpSend', (_event, data) => {
    return udp.send(data);
  });

  ipcMain.on('udpClose', (_event) => {
    udp.close();
  });

  ipcMain.handle('writeFile', (_event, filename, data) => {
    return new Promise(async resolve => {
      try {
        await writeFile(filename, data);
        resolve(false)
      } catch (err) {
        resolve(err);
      } 
    });
  });

  ipcMain.handle('readFile', (_event, filename, encoding) => {
    return new Promise(async resolve => {
      try {
        const data = await readFile(filename, {encoding: encoding});
        
        resolve({error: false, data: data});
      } catch (err) {
        resolve({error: err});
      }
    });
  });

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
