const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { execSync } = require('child_process');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Load your index.html
    mainWindow.loadFile('index.html');

    // Check if apktool and hermes-dec are installed globally
    try {
        execSync('apktool -version', { stdio: 'ignore' });
        execSync('hermes-dec -version', { stdio: 'ignore' });
        console.log('apktool and hermes-dec are installed globally.');
    } catch (err) {
        dialog.showErrorBox('Error', 'apktool or hermes-dec is not installed globally. Please install them and restart the application.');
        app.quit();
    }

    // Ask for folder location when the app starts
    mainWindow.webContents.on('did-finish-load', () => {
        const folderPath = dialog.showOpenDialogSync(mainWindow, {
            properties: ['openDirectory']
        });

        if (folderPath) {
            console.log('Selected folder:', folderPath[0]);
        } else {
            dialog.showErrorBox('Error', 'No folder was selected. The application will now close.');
            app.quit();
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
