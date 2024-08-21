const { app, BrowserWindow, ipcMain, Menu, MenuItem, shell } = require('electron');
const windowStateKeeper = require('electron-window-state');
const path = require('path');
const Store = require('electron-store');
Store.initRenderer();

require('@electron/remote/main').initialize();

const usbBootloaderIds =  [
  { vendorId: 1155, productId: 57105}, 
  { vendorId: 11836, productId: 57105}
];

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;
let bluetoothDeviceChooser = null;
let btDeviceList = null;
let selectBluetoothCallback = null;

// In Electron the bluetooth device chooser didn't exist, so we have to build our own
function createDeviceChooser() {
  bluetoothDeviceChooser = new BrowserWindow({
    parent: mainWindow,
    width: 400,
    height: 400,
    webPreferences: {
      preload: path.join(__dirname, 'libraries/bluetooth-device-chooser/preload.js')
    }
  });
  bluetoothDeviceChooser.removeMenu();
  bluetoothDeviceChooser.loadFile(path.join(__dirname, 'libraries/bluetooth-device-chooser/index.html'));

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
      nodeIntegration: true,
      contextIsolation: false
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
    if (details.deviceType === 'usb' && details.origin === 'file://') {     
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

  require("@electron/remote/main").enable(mainWindow.webContents);
  mainWindow.removeMenu();
  mainWindow.setMinimumSize(800, 600);
  mainWindow.loadFile('./index.html');
  
  mainWindowState.manage(mainWindow);

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
};

app.on('window-all-closed', () => {
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
  console.log("We're closing...");
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
