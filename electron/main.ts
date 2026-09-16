import { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let pythonDaemon: ChildProcess | null = null;
let tray: Tray | null = null;

function startPythonDaemon() {
  try {
    const scriptPath = path.join(__dirname, '../windows_agent/agent_daemon.py');
    pythonDaemon = spawn('python', [scriptPath, '8765'], {
      stdio: 'ignore',
      detached: true,
      windowsHide: true,
    });
    pythonDaemon.unref();
  } catch (err) {
    console.warn('Failed to start python daemon automatically:', err);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'Local Computer Agent',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: true,
  });

  const url = process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000';
  mainWindow.loadURL(url);

  // Register Global Emergency Stop Hotkey (Ctrl+Alt+S)
  globalShortcut.register('Ctrl+Alt+S', () => {
    console.log('[!] Emergency Stop triggered via global hotkey Ctrl+Alt+S');
    if (mainWindow) {
      mainWindow.webContents.send('emergency-stop-triggered', { reason: 'Global Hotkey Ctrl+Alt+S' });
    }
  });

  // Register secondary Emergency Stop (Escape when app focused)
  globalShortcut.register('Escape', () => {
    if (mainWindow && mainWindow.isFocused()) {
      mainWindow.webContents.send('emergency-stop-triggered', { reason: 'Escape key pressed' });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startPythonDaemon();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (pythonDaemon) {
    try {
      pythonDaemon.kill();
    } catch (_) {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('toggle-always-on-top', (_event, enable: boolean) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(enable, 'screen-saver');
    return mainWindow.isAlwaysOnTop();
  }
  return false;
});
