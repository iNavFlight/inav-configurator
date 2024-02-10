const { app, BrowserWindow } = require('electron');
const windowStateKeeper = require('electron-window-state');
const Store = require('electron-store');
Store.initRenderer();

require('@electron/remote/main').initialize();

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow = null;

app.on('ready', () => {

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
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  });
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

  require("@electron/remote/main").enable(mainWindow.webContents);
  mainWindow.removeMenu();
  mainWindow.setMinimumSize(800, 600);

  mainWindow.loadFile('index.html');
  
  mainWindowState.manage(mainWindow);

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
});

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