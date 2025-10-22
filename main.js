const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');

// Entwicklungsmodus erkennen
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;

function createWindow() {
  // Hauptfenster erstellen
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#667eea'
  });

  // HTML-Datei laden
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Fenster anzeigen wenn bereit
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Splash Screen Effekt
    mainWindow.webContents.executeJavaScript(`
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.5s ease-in-out';
      setTimeout(() => {
        document.body.style.opacity = '1';
      }, 100);
    `);
  });

  // DevTools im Entwicklungsmodus öffnen
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Fenster geschlossen
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Externe Links im Standard-Browser öffnen
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App bereit
app.whenReady().then(() => {
  createWindow();
  createMenu();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Alle Fenster geschlossen
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Menü erstellen
function createMenu() {
  const template = [
    {
      label: 'JunoSixteen',
      submenu: [
        {
          label: 'Über JunoSixteen',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Über JunoSixteen',
              message: 'JunoSixteen Demo v1.0',
              detail: 'Gamifizierte Lernplattform\nLevel 1 & 2 Demo\n\nEntwickelt vom JunoSixteen Team',
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Beenden',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Spiel',
      submenu: [
        {
          label: 'Neues Spiel',
          accelerator: 'Ctrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript('resetGame();');
          }
        },
        {
          label: 'Level 1',
          accelerator: 'Ctrl+1',
          click: () => {
            mainWindow.webContents.executeJavaScript('switchLevel(1);');
          }
        },
        {
          label: 'Level 2',
          accelerator: 'Ctrl+2',
          click: () => {
            mainWindow.webContents.executeJavaScript('switchLevel(2);');
          }
        },
        { type: 'separator' },
        {
          label: 'Vollbild',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            const isFullScreen = mainWindow.isFullScreen();
            mainWindow.setFullScreen(!isFullScreen);
          }
        }
      ]
    },
    {
      label: 'Ansicht',
      submenu: [
        {
          label: 'Neu laden',
          accelerator: 'Ctrl+R',
          click: () => {
            mainWindow.webContents.reload();
          }
        },
        {
          label: 'Entwicklertools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        },
        { type: 'separator' },
        {
          label: 'Vergrößern',
          accelerator: 'Ctrl+Plus',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
          }
        },
        {
          label: 'Verkleinern',
          accelerator: 'Ctrl+-',
          click: () => {
            const currentZoom = mainWindow.webContents.getZoomLevel();
            mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
          }
        },
        {
          label: 'Tatsächliche Größe',
          accelerator: 'Ctrl+0',
          click: () => {
            mainWindow.webContents.setZoomLevel(0);
          }
        }
      ]
    },
    {
      label: 'Hilfe',
      submenu: [
        {
          label: 'Tastenkürzel',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Tastenkürzel',
              message: 'Verfügbare Tastenkürzel:',
              detail: `Ctrl+N - Neues Spiel
Ctrl+1 - Level 1
Ctrl+2 - Level 2
Ctrl+R - Neu laden
F11 - Vollbild
Ctrl+Plus/Minus - Zoom
Ctrl+Q - Beenden`,
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Spielregeln',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Spielregeln',
              message: 'So funktioniert JunoSixteen:',
              detail: `• Jedes Level hat 10 Fragen
• Punkte = Level × 50 × Fragennummer
• Risikofragen verdoppeln die Punkte
• Bei Risikofragen führt ein Fehler zum Level-Neustart
• Teamfragen verdreifachen die Punkte
• Level-Abschluss gibt 5x Bonus
• Sammle Badges für besondere Leistungen`,
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  // macOS spezifische Anpassungen
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'Über ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Dienste', role: 'services' },
        { type: 'separator' },
        { label: app.getName() + ' ausblenden', accelerator: 'Command+H', role: 'hide' },
        { label: 'Andere ausblenden', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Alle einblenden', role: 'unhide' },
        { type: 'separator' },
        { label: 'Beenden', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Event Handler
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Spielstand speichern',
    defaultPath: 'junosixteen-spielstand.json',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  return result;
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Spielstand laden',
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    properties: ['openFile']
  });
  return result;
});

// Fehlerbehandlung
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('Unerwarteter Fehler', `Ein unerwarteter Fehler ist aufgetreten:\n\n${error.message}`);
});

// Auto-Updater entfernt - vereinfachte Version ohne externe Dependencies
console.log('JunoSixteen Desktop App gestartet - Version 1.0');
console.log('Level 1 & 2 freigeschaltet - Keine Authentifizierung erforderlich'); 