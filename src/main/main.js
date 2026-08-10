const { app, BrowserWindow, ipcMain, dialog, Menu, net } = require('electron');
const path = require('path');
const { PythonBridge } = require('./python-bridge');
const registerP1VisionIPC = require('./p1-vision-ipc');

// Prevent Windows cache lock errors (Access is Denied 0x5 / Gpu Cache Creation failed)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow;
const pythonBridge = new PythonBridge({ appRoot: path.join(__dirname, '..', '..') });
registerP1VisionIPC({ ipcMain, net });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    title: 'Video Subtitle Remover',
    backgroundColor: '#0a0a0f',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    console.log('Window is now visible');
  });

  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
    console.log('Page loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load page: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer] ${message}`);
  });

  pythonBridge.on('log', (msg) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('python:log', msg);
  });

  pythonBridge.on('error', (msg) => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('python:error', msg);
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  console.log('Another instance of Video Subtitle Remover is already running. Quitting duplicate instance.');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    createWindow();
    pythonBridge.start().then(() => {
      console.log(`Python backend started on port ${pythonBridge.getPort()}`);
    }).catch((err) => {
      console.error('Failed to start Python backend:', err.message);
      console.log('You can start it manually: python api/server.py');
    });

    app.on('activate', function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => { pythonBridge.stop(); });

ipcMain.handle('dialog:openFile', async (event, customFilters) => {
  const defaultFilters = [
    { name: 'Media Files', extensions: ['mp4', 'avi', 'mkv', 'mov', 'jpg', 'png', 'bmp'] },
    { name: 'Audio Files', extensions: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus'] },
    { name: 'Subtitle Files', extensions: ['srt', 'ass', 'vtt', 'txt'] },
    { name: 'All Files', extensions: ['*'] }
  ];
  return dialog.showOpenDialog({ title: 'Chọn file', properties: ['openFile', 'multiSelections'], filters: customFilters || defaultFilters });
});

ipcMain.handle('dialog:openDirectory', async () => dialog.showOpenDialog({
  title: 'Chọn thư mục đầu ra', properties: ['openDirectory']
}));

ipcMain.handle('dialog:saveFile', async (event, defaultPath) => {
  const { canceled, filePath } = await dialog.showSaveDialog({ title: 'Lưu file', defaultPath });
  return canceled ? null : filePath;
});

ipcMain.handle('ollama:listModels', async (event, endpoint) => {
  const raw = typeof endpoint === 'string' && endpoint.trim() ? endpoint.trim() : 'http://localhost:11434/api/chat';
  try {
    const url = new URL(raw.includes('://') ? raw : `http://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol)) return { ok: false, error: 'Endpoint Ollama phải dùng HTTP hoặc HTTPS.' };
    const host = url.hostname.toLowerCase();
    if (!['localhost', '127.0.0.1', '::1'].includes(host)) return { ok: false, error: 'Quét model chỉ hỗ trợ Ollama local (localhost/127.0.0.1).' };
    url.pathname = '/api/tags'; url.search = ''; url.hash = '';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await net.fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) return { ok: false, error: `Ollama trả về HTTP ${response.status}.` };
      const body = await response.json();
      const models = Array.isArray(body?.models) ? body.models.map(item => item?.name || item?.model).filter(name => typeof name === 'string' && name.trim()) : [];
      return { ok: true, models: [...new Set(models)] };
    } finally { clearTimeout(timeout); }
  } catch (err) {
    return { ok: false, error: err?.name === 'AbortError' ? 'Ollama không phản hồi trong 6 giây.' : (err?.message || 'Không thể kết nối Ollama.') };
  }
});

ipcMain.handle('python:start', async () => {
  try { await pythonBridge.start(); return true; }
  catch (err) { console.error(err); return false; }
});
ipcMain.handle('python:stop', () => { pythonBridge.stop(); return true; });
ipcMain.handle('python:status', () => pythonBridge.isRunning());
ipcMain.handle('app:openPath', async (e, p) => { const { shell } = require('electron'); await shell.openPath(p); });
ipcMain.handle('app:getPath', () => app.getAppPath());
