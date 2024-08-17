const { app, BrowserWindow, dialog, Menu } = require('electron');
const { execSync, execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const outputDir = path.join(__dirname, 'outputs');
let mainWindow;

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

function cleanOutputDirectory() {
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
        console.log('Output directory cleared.');
    }
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Output directory created.');
}

const { spawn } = require('child_process');

function runApktool(apkFilePath) {
    const outputFolder = path.join(outputDir, 'decompiled');
    const apktoolPath = os.platform() === 'win32'
        ? path.join(__dirname, 'resources', 'tools', 'apktool', 'apktool.bat')
        : path.join(__dirname, 'resources', 'tools', 'apktool', 'apktool');

    // Ensure the output folder is ready
    if (fs.existsSync(outputFolder)) {
        fs.rmSync(outputFolder, { recursive: true, force: true });
        console.log('Output directory cleared.');
        mainWindow.webContents.send('log-message', 'Output directory cleared.');
    }

    fs.mkdirSync(outputFolder, { recursive: true });
    console.log('Output directory created.');
    mainWindow.webContents.send('log-message', 'Output directory created.');

    const apktoolProcess = os.platform() === 'win32'
        ? spawn('cmd', ['/c', apktoolPath, 'd', apkFilePath, '-f', '-o', outputFolder], { stdio: ['ignore', 'pipe', 'pipe'] })
        : spawn(apktoolPath, ['d', apkFilePath, '-f', '-o', outputFolder]);

    apktoolProcess.stdout.on('data', (data) => {
        const message = data.toString().trim();
        console.log(message);
        mainWindow.webContents.send('log-message', message);
    });

    apktoolProcess.stderr.on('data', (data) => {
        const errorMessage = data.toString().trim();
        console.error(errorMessage);
        mainWindow.webContents.send('log-message', errorMessage);
    });

    apktoolProcess.on('close', (code) => {
        if (code === 0) {
            const apktoolVersion = '2.9.3';
            const completionMessage = `Apktool ${apktoolVersion} extraction complete`;
            console.log(completionMessage);
            mainWindow.webContents.send('log-message', completionMessage);
        } else {
            const errorMessage = `apktool process exited with code ${code}`;
            console.error(errorMessage);
            mainWindow.webContents.send('log-message', errorMessage);
            dialog.showErrorBox('Error', errorMessage);
        }
    });
}

function createWindow() {
    installDependencies(); // Ensure dependencies are installed
    cleanOutputDirectory(); // Clean output directory on startup

    mainWindow = new BrowserWindow({ // Use the global mainWindow variable
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        icon: path.join(__dirname, 'assets', 'icons', 'erucsbo.jpg'),
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

    // Handle APK file selection from renderer
    mainWindow.webContents.on('ipc-message', (event, channel, apkFilePath) => {
        if (channel === 'apk-file-selected') {
            runApktool(apkFilePath);
        }
    });

    // Ensure Hermes output directories exist
    ensureHermesDirectories();

    // No further actions on startup, just setting up the environment
}


app.whenReady().then(() => {
    app.dock?.setIcon(path.join(__dirname, 'assets', 'icons', 'erucsbo.jpg'));
    createWindow();
});

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
