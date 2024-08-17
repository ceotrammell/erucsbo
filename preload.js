const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    logMessage: (callback) => ipcRenderer.on('log-message', callback),
    pythonVersion: (callback) => ipcRenderer.on('python-version', callback),
    nodeVersion: (callback) => ipcRenderer.on('node-version', callback),
});
