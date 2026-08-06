const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const { PythonBridge } = require('./python-bridge');
const http = require('http');
const https = require('https');
const { URL } = require('url');

// Prevent Windows cache lock errors (Access is Denied 0x5 / Gpu Cache Creation failed)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow;
const pythonBridge = new PythonBridge({ appRoot: path.join(__dirname, '..', '..') });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false, // Don't show until ready
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

  // Show window once content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    console.log('Window is now visible');
  });

  // Also show on did-finish-load as fallback
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
    console.log('Page loaded successfully');
  });

  // Log any page errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Failed to load page: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log(`[Renderer] ${message}`);
  });

  // Forward python logs to renderer
  pythonBridge.on('log', (msg) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('python:log', msg);
    }
  });

  pythonBridge.on('error', (msg) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('python:error', msg);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
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

    // Start python backend - don't block window creation
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

app.on('will-quit', () => {
  pythonBridge.stop();
});

// IPC Handlers
ipcMain.handle('dialog:openFile', async (event, customFilters) => {
  const defaultFilters = [
    { name: 'Media Files', extensions: ['mp4', 'avi', 'mkv', 'mov', 'jpg', 'png', 'bmp'] },
    { name: 'Audio Files', extensions: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus'] },
    { name: 'Subtitle Files', extensions: ['srt', 'ass', 'vtt', 'txt'] },
    { name: 'All Files', extensions: ['*'] }
  ];
  const result = await dialog.showOpenDialog({
    title: 'Chọn file',
    properties: ['openFile', 'multiSelections'],
    filters: customFilters || defaultFilters
  });
  return result;
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Chọn thư mục đầu ra',
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, defaultPath) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Lưu file',
    defaultPath
  });
  if (canceled) {
    return null;
  } else {
    return filePath;
  }
});

ipcMain.handle('python:start', async () => {
  try {
    await pythonBridge.start();
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
});

ipcMain.handle('python:stop', () => {
  pythonBridge.stop();
  return true;
});

ipcMain.handle('python:status', () => {
  return pythonBridge.isRunning();
});

ipcMain.handle('app:getPath', () => {
  return app.getAppPath();
});

function normalizeOllamaChatEndpoint(endpoint) {
  let value = String(endpoint || '').trim() || 'http://localhost:11434/api/chat';
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `http://${value}`;
  const parsed = new URL(value);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Ollama endpoint chỉ hỗ trợ http hoặc https.');
  }
  let pathname = parsed.pathname.replace(/\/+$/, '');
  if (!pathname || pathname === '/') pathname = '/api/chat';
  else if (pathname.endsWith('/api/tags')) pathname = pathname.slice(0, -9) + '/api/chat';
  else if (!pathname.endsWith('/api/chat')) pathname = pathname.endsWith('/api') ? `${pathname}/chat` : `${pathname}/api/chat`;
  parsed.pathname = pathname;
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

function requestJson(urlValue, { method = 'GET', body = null, timeoutMs = 10000 } = {}) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(urlValue); }
    catch { reject(new Error('Endpoint không hợp lệ.')); return; }

    const transport = parsed.protocol === 'https:' ? https : http;
    const payload = body == null ? null : Buffer.from(JSON.stringify(body), 'utf8');
    const request = transport.request(parsed, {
      method,
      headers: payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : undefined,
    }, response => {
      const chunks = [];
      let size = 0;
      response.on('data', chunk => {
        size += chunk.length;
        if (size > 2 * 1024 * 1024) {
          request.destroy(new Error('Phản hồi Ollama vượt quá giới hạn 2 MB.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let data;
        try { data = text ? JSON.parse(text) : {}; }
        catch { reject(new Error(`Ollama trả về JSON không hợp lệ (HTTP ${response.statusCode || 0}).`)); return; }
        if ((response.statusCode || 500) >= 400) {
          reject(new Error(data.error || `Ollama HTTP ${response.statusCode}`));
          return;
        }
        resolve(data);
      });
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error('Ollama request timeout.')));
    request.on('error', reject);
    if (payload) request.write(payload);
    request.end();
  });
}

ipcMain.handle('ollama:list-models', async (event, endpoint) => {
  try {
    const chatEndpoint = normalizeOllamaChatEndpoint(endpoint);
    const tagsEndpoint = chatEndpoint.replace(/\/api\/chat$/, '/api/tags');
    const data = await requestJson(tagsEndpoint, { timeoutMs: 8000 });
    const models = Array.isArray(data.models) ? data.models.map(item => item?.name || item?.model).filter(Boolean) : [];
    return { status: 'ok', endpoint: chatEndpoint, models: [...new Set(models)] };
  } catch (error) {
    return { status: 'error', error: error.message, models: [] };
  }
});

ipcMain.handle('ollama:chat', async (event, payload = {}) => {
  try {
    const model = String(payload.model || '').trim();
    if (!model) throw new Error('Chưa chọn model Ollama.');
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    if (messages.length === 0) throw new Error('Nội dung gửi Ollama đang trống.');
    const endpoint = normalizeOllamaChatEndpoint(payload.endpoint);
    const data = await requestJson(endpoint, {
      method: 'POST',
      body: { model, messages, stream: false },
      timeoutMs: 120000,
    });
    const result = data?.message?.content;
    if (!result) throw new Error('Ollama không trả về nội dung.');
    return { status: 'ok', result, endpoint, model };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});
