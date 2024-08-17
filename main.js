const { app, BrowserWindow, dialog, Menu } = require('electron');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

function installDependencies() {
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
        console.log('First run detected. Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
        console.log('Dependencies installed.');
    }
}

function getPythonCommand() {
    try {
        if (os.platform() === 'win32') {
            // On Windows, use `where` command
            const pythonPath = execSync('where python').toString().trim().split('\n')[0];
            return pythonPath;
        } else {
            // On macOS/Linux, use `which` command
            try {
                const python3Path = execSync('which python3').toString().trim();
                return python3Path;
            } catch {
                const pythonPath = execSync('which python').toString().trim();
                return pythonPath;
            }
        }
    } catch (err) {
        console.error('Python not found. Please ensure that Python is installed and available in PATH.');
        dialog.showErrorBox('Error', 'Python is not installed or not available in PATH. Please install Python.');
        app.quit();
    }
}

function getPythonVersion(pythonCommand) {
    try {
        const pythonVersion = execSync(`${pythonCommand} --version`).toString().trim();
        return pythonVersion;
    } catch (err) {
        console.error('Unable to determine Python version.');
        return 'Unknown';
    }
}

function getNodeVersion() {
    try {
        const nodeVersion = execSync('node --version').toString().trim();
        return nodeVersion;
    } catch (err) {
        console.error('Unable to determine Node.js version.');
        return 'Unknown';
    }
}

function checkApktool() {
    const apktoolPath = os.platform() === 'win32' ? 'apktool.bat' : 'apktool';

    try {
        execSync(`${apktoolPath} -version`, { stdio: 'ignore' });
        console.log('Apktool is installed and accessible.');
    } catch (err) {
        dialog.showErrorBox('Error', 'Apktool is not installed or not accessible. Please ensure that Apktool is set up correctly.');
        app.quit();
    }
}

function ensureHermesDirectories() {
    const toolsPath = path.join(__dirname, 'resources', 'tools', 'hermes');
    const disassemblyOutput = path.join(toolsPath, 'disassemreact');
    const decompiledOutput = path.join(toolsPath, 'decompiledreact');

    if (!fs.existsSync(disassemblyOutput)) {
        fs.mkdirSync(disassemblyOutput, { recursive: true });
        console.log(`Created directory: ${disassemblyOutput}`);
    }

    if (!fs.existsSync(decompiledOutput)) {
        fs.mkdirSync(decompiledOutput, { recursive: true });
        console.log(`Created directory: ${decompiledOutput}`);
    }
}

function createWindow() {
    installDependencies(); // Ensure dependencies are installed

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile('index.html');

    // Remove default menu
    Menu.setApplicationMenu(null);

    // Check Python installation
    const pythonCommand = getPythonCommand();
    if (!pythonCommand) {
        dialog.showErrorBox('Error', 'Python is not installed. The application will now close.');
        app.quit();
    } else {
        console.log(`Python found at: ${pythonCommand}`);
        const pythonVersion = getPythonVersion(pythonCommand);
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.send('python-version', pythonVersion);
        });
    }

    // Get Node.js version
    const nodeVersion = getNodeVersion();
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('node-version', nodeVersion);
    });

    // Check Apktool installation
    checkApktool();

    // Ensure Hermes output directories exist
    ensureHermesDirectories();

    // No further actions on startup, just setting up the environment
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
