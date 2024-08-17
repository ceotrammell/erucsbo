const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    logMessage: (callback) => ipcRenderer.on('log-message', callback),
    pythonVersion: (callback) => ipcRenderer.on('python-version', callback),
    nodeVersion: (callback) => ipcRenderer.on('node-version', callback),
    selectApkFile: (apkFilePath) => ipcRenderer.send('apk-file-selected', apkFilePath),
    apktoolOutput: (callback) => ipcRenderer.on('apktool-output', callback),
    toggleFileInput: (callback) => ipcRenderer.on('toggle-file-input', callback),
    updateBundleName: (callback) => ipcRenderer.on('update-bundle-name', callback)
});
