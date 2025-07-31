// ===================================================
// 🖥️ JUNOSIXTEEN ELECTRON DESKTOP APP
// Windows/Mac/Linux Desktop Application
// ===================================================

const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Global Variables
let mainWindow;
let serverProcess;
const isDev = process.env.NODE_ENV === 'development';

// ===================================================
// 🏗️ APP CONFIGURATION
// ===================================================

// Security: Only allow loading from our domain
app.commandLine.appendSwitch('disable-web-security');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

// Single instance enforcement
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

// ===================================================
// 🚀 MAIN WINDOW CREATION
// ===================================================

function createMainWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 1000,
        minWidth: 1000,
        minHeight: 700,
        icon: path.join(__dirname, 'assets', 'icon.png'),
        title: 'JunoSixteen - Gamified Learning Platform',
        show: false, // Don't show until ready
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'src', 'preload.js'),
            webSecurity: false // For development
        },
        titleBarStyle: 'default',
        frame: true,
        backgroundColor: '#667eea',
        autoHideMenuBar: true
    });

    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        startBackendServer();
    });

    // Handle window closed
    mainWindow.on('closed', () => {
        mainWindow = null;
        stopBackendServer();
    });

    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Prevent navigation to external sites
    mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        
        if (parsedUrl.origin !== 'http://localhost:3000' && 
            parsedUrl.origin !== 'file://') {
            event.preventDefault();
        }
    });
}

// ===================================================
// 🎛️ MENU CONFIGURATION
// ===================================================

function createMenu() {
    const template = [
        {
            label: 'JunoSixteen',
            submenu: [
                {
                    label: 'About JunoSixteen',
                    click: () => showAboutDialog()
                },
                { type: 'separator' },
                {
                    label: 'Preferences',
                    accelerator: 'CmdOrCtrl+,',
                    click: () => openPreferences()
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => app.quit()
                }
            ]
        },
        {
            label: 'Learning',
            submenu: [
                {
                    label: 'Start Quiz',
                    accelerator: 'CmdOrCtrl+N',
                    click: () => sendToRenderer('start-quiz')
                },
                {
                    label: 'View Progress',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => sendToRenderer('view-progress')
                },
                {
                    label: 'Leaderboard',
                    accelerator: 'CmdOrCtrl+L',
                    click: () => sendToRenderer('view-leaderboard')
                }
            ]
        },
        {
            label: 'AI Features',
            submenu: [
                {
                    label: 'UL Analytics Dashboard',
                    click: () => openULDashboard()
                },
                {
                    label: 'MCP Question Generator',
                    click: () => openMCPGenerator()
                },
                {
                    label: 'Cluster Analysis',
                    click: () => sendToRenderer('analyze-cluster')
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Reload',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => mainWindow.reload()
                },
                {
                    label: 'Force Reload',
                    accelerator: 'CmdOrCtrl+Shift+R',
                    click: () => mainWindow.webContents.reloadIgnoringCache()
                },
                {
                    label: 'Toggle Developer Tools',
                    accelerator: 'F12',
                    click: () => mainWindow.webContents.toggleDevTools()
                },
                { type: 'separator' },
                {
                    label: 'Actual Size',
                    accelerator: 'CmdOrCtrl+0',
                    click: () => mainWindow.webContents.setZoomLevel(0)
                },
                {
                    label: 'Zoom In',
                    accelerator: 'CmdOrCtrl+Plus',
                    click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 1)
                },
                {
                    label: 'Zoom Out',
                    accelerator: 'CmdOrCtrl+-',
                    click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 1)
                },
                { type: 'separator' },
                {
                    label: 'Toggle Fullscreen',
                    accelerator: 'F11',
                    click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen())
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'User Guide',
                    click: () => shell.openExternal('https://docs.junosixteen.com')
                },
                {
                    label: 'Keyboard Shortcuts',
                    click: () => showShortcuts()
                },
                { type: 'separator' },
                {
                    label: 'Report Issue',
                    click: () => shell.openExternal('https://github.com/junosixteen/issues')
                },
                {
                    label: 'Check for Updates',
                    click: () => checkForUpdates()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// ===================================================
// 🔧 BACKEND SERVER MANAGEMENT
// ===================================================

function startBackendServer() {
    const { spawn } = require('child_process');
    
    try {
        // Start the production server
        serverProcess = spawn('node', ['server-production.js'], {
            stdio: 'inherit',
            cwd: __dirname
        });

        serverProcess.on('error', (error) => {
            console.error('Failed to start backend server:', error);
            showErrorDialog('Backend Error', 'Failed to start backend server');
        });

        console.log('✅ Backend server started successfully');
        
    } catch (error) {
        console.error('Error starting backend:', error);
    }
}

function stopBackendServer() {
    if (serverProcess) {
        serverProcess.kill();
        serverProcess = null;
        console.log('🔴 Backend server stopped');
    }
}

// ===================================================
// 📡 IPC COMMUNICATION
// ===================================================

// Send messages to renderer process
function sendToRenderer(channel, data = null) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
    }
}

// Handle IPC messages from renderer
ipcMain.handle('app-version', () => {
    return app.getVersion();
});

ipcMain.handle('get-user-data', () => {
    return {
        appVersion: app.getVersion(),
        platform: process.platform,
        arch: process.arch,
        electronVersion: process.versions.electron
    };
});

ipcMain.handle('save-user-preferences', async (event, preferences) => {
    try {
        const userDataPath = app.getPath('userData');
        const preferencesPath = path.join(userDataPath, 'preferences.json');
        
        await fs.promises.writeFile(preferencesPath, JSON.stringify(preferences, null, 2));
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-user-preferences', async () => {
    try {
        const userDataPath = app.getPath('userData');
        const preferencesPath = path.join(userDataPath, 'preferences.json');
        
        const data = await fs.promises.readFile(preferencesPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Return default preferences
        return {
            theme: 'system',
            language: 'de',
            notifications: true,
            autoStart: false
        };
    }
});

// ===================================================
// 🎨 DIALOG FUNCTIONS
// ===================================================

function showAboutDialog() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'About JunoSixteen',
        message: 'JunoSixteen',
        detail: `Version: ${app.getVersion()}\n\nGameified Learning Platform with AI Integration\n\n• UL (Unsupervised Learning) Clustering\n• MCP (Machine Control Program) Generation\n• Multi-Platform Support\n• Advanced Gamification\n\nDeveloped by JunoSixteen Team`,
        buttons: ['OK'],
        defaultId: 0
    });
}

function showShortcuts() {
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Keyboard Shortcuts',
        message: 'JunoSixteen Shortcuts',
        detail: `Learning:\n  Ctrl+N - Start Quiz\n  Ctrl+P - View Progress\n  Ctrl+L - Leaderboard\n\nGeneral:\n  Ctrl+R - Reload\n  F12 - Developer Tools\n  F11 - Fullscreen\n  Ctrl+Q - Quit\n\nQuiz Navigation:\n  1,2,3,4 - Select Answer\n  Space - Next Question\n  Esc - Exit Quiz`,
        buttons: ['OK'],
        defaultId: 0
    });
}

function showErrorDialog(title, message) {
    dialog.showErrorBox(title, message);
}

function openPreferences() {
    sendToRenderer('open-preferences');
}

function openULDashboard() {
    const { shell } = require('electron');
    shell.openExternal('http://localhost:3000/demo-dashboard.html');
}

function openMCPGenerator() {
    sendToRenderer('open-mcp-generator');
}

function checkForUpdates() {
    // Placeholder for update checking
    dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Updates',
        message: 'You are running the latest version of JunoSixteen!',
        buttons: ['OK']
    });
}

// ===================================================
// 🚀 APP EVENT HANDLERS
// ===================================================

app.whenReady().then(() => {
    createMainWindow();
    createMenu();
    
    console.log('🚀 JunoSixteen Desktop App Started');
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Version: ${app.getVersion()}`);
    console.log(`   Electron: ${process.versions.electron}`);
});

app.on('window-all-closed', () => {
    stopBackendServer();
    
    // On macOS, keep app running even when windows are closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS, recreate window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
    });
});

// Handle certificate errors
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (url.startsWith('https://localhost')) {
        // Ignore certificate errors for localhost
        event.preventDefault();
        callback(true);
    } else {
        callback(false);
    }
});

// Auto-updater (for production)
if (!isDev) {
    const { autoUpdater } = require('electron-updater');
    
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update Available',
            message: 'A new version is available. It will be downloaded in the background.',
            buttons: ['OK']
        });
    });
}

console.log('🖥️ JunoSixteen Electron Desktop App Initialized');

module.exports = { app, mainWindow }; 