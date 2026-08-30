const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const express = require('express');

let mainWindow;
let localServer;

function startEmbeddedServer() {
  const serverApp = express();
  const PORT = 38472; // dedicated local port for desktop

  serverApp.use(express.static(path.join(__dirname, 'dist')));
  serverApp.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  return new Promise((resolve) => {
    localServer = serverApp.listen(PORT, '127.0.0.1', () => {
      resolve(PORT);
    });
  });
}

async function createWindow() {
  const port = await startEmbeddedServer();

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'GST Invoice Pro - Desktop Edition',
    backgroundColor: '#f8fafc',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    autoHideMenuBar: false,
  });

  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (localServer) {
      localServer.close();
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
