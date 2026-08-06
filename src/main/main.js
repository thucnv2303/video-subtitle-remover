const { app, BrowserWindow, ipcMain, dialog, Menu, safeStorage } = require('electron');
const fs = require('fs');
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
    title: 'Chá»n file',
    properties: ['openFile', 'multiSelections'],
    filters: customFilters || defaultFilters
  });
  return result;
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Chá»n thÆ° má»¥c Ä‘áº§u ra',
    properties: ['openDirectory']
  });
  return result;
});

ipcMain.handle('dialog:saveFile', async (event, defaultPath) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'LÆ°u file',
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
    throw new Error('Ollama endpoint chá»‰ há»— trá»£ http hoáº·c https.');
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
    catch { reject(new Error('Endpoint khÃ´ng há»£p lá»‡.')); return; }

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
          request.destroy(new Error('Pháº£n há»“i Ollama vÆ°á»£t quÃ¡ giá»›i háº¡n 2 MB.'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let data;
        try { data = text ? JSON.parse(text) : {}; }
        catch { reject(new Error(`Ollama tráº£ vá» JSON khÃ´ng há»£p lá»‡ (HTTP ${response.statusCode || 0}).`)); return; }
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
    if (!model) throw new Error('ChÆ°a chá»n model Ollama.');
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    if (messages.length === 0) throw new Error('Ná»™i dung gá»­i Ollama Ä‘ang trá»‘ng.');
    const endpoint = normalizeOllamaChatEndpoint(payload.endpoint);
    const data = await requestJson(endpoint, {
      method: 'POST',
      body: { model, messages, stream: false },
      timeoutMs: 120000,
    });
    const result = data?.message?.content;
    if (!result) throw new Error('Ollama khÃ´ng tráº£ vá» ná»™i dung.');
    return { status: 'ok', result, endpoint, model };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});

// AI Settings & Secure Storage
function checkSafeStorage() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Há»‡ Ä‘iá»u hÃ nh khÃ´ng há»— trá»£ mÃ£ hÃ³a an toÃ n (safeStorage).');
  }
}

function getKeysPath() {
  return path.join(app.getPath('userData'), 'ai_keys.json');
}

function loadEncryptedKeys() {
  try {
    const data = fs.readFileSync(getKeysPath(), 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function saveEncryptedKeys(data) {
  fs.writeFileSync(getKeysPath(), JSON.stringify(data), 'utf8');
}

function storeProviderKeys(provider, keysArray) {
  checkSafeStorage();
  const data = loadEncryptedKeys();
  if (keysArray && keysArray.length > 0) {
    const encrypted = keysArray.map(key => safeStorage.encryptString(key).toString('hex'));
    data[provider] = encrypted;
  } else {
    delete data[provider];
  }
  saveEncryptedKeys(data);
}

function getProviderKeys(provider) {
  checkSafeStorage();
  const data = loadEncryptedKeys();
  const encrypted = data[provider] || [];
  return encrypted.map(hex => {
    try {
      return safeStorage.decryptString(Buffer.from(hex, 'hex'));
    } catch {
      return null;
    }
  }).filter(Boolean);
}

ipcMain.handle('ai:has-provider-keys', (event, provider) => {
  try { return getProviderKeys(provider).length; } catch { return 0; }
});

ipcMain.handle('ai:delete-provider-keys', (event, provider) => {
  try { storeProviderKeys(provider, null); return true; } catch { return false; }
});

async function fetchDeepSeekModels(key) {
  return new Promise((resolve, reject) => {
    const req = https.request('https://api.deepseek.com/models', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${key}` }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            const models = (parsed.data || []).map(m => m.id);
            resolve(models);
          } catch (e) {
            reject(new Error('Invalid JSON from DeepSeek'));
          }
        } else {
          reject(new Error(res.statusCode === 401 || res.statusCode === 403 ? 'API key khÃ´ng há»£p lá»‡ hoáº·c khÃ´ng cÃ³ quyá»n' : `DeepSeek HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error('Lá»—i káº¿t ná»‘i DeepSeek: ' + e.message)));
    req.setTimeout(10000, () => req.destroy(new Error('Timeout DeepSeek')));
    req.end();
  });
}

async function fetchGeminiModels(key) {
  return new Promise((resolve, reject) => {
    const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            const models = (parsed.models || [])
              .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
              .map(m => m.name.replace('models/', ''));
            resolve(models.length ? models : ['gemini-1.5-flash', 'gemini-1.5-pro']);
          } catch (e) {
            resolve(['gemini-1.5-flash', 'gemini-1.5-pro']); // fallback
          }
        } else {
          reject(new Error(res.statusCode === 400 || res.statusCode === 403 ? 'API key khÃ´ng há»£p lá»‡' : `Gemini HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error('Lá»—i káº¿t ná»‘i Gemini: ' + e.message)));
    req.setTimeout(10000, () => req.destroy(new Error('Timeout Gemini')));
    req.end();
  });
}

ipcMain.handle('ai:save-provider-keys', async (event, provider, keys) => {
  if (!keys || keys.length === 0) {
    try { storeProviderKeys(provider, null); } catch(e) { return { status: 'error', error: e.message }; }
    return { status: 'ok', models: [], validCount: 0, invalidCount: 0 };
  }
  try {
    checkSafeStorage();
    let allModels = [];
    let validKeys = [];
    let invalidCount = 0;

    for (const key of keys) {
      try {
        let models = [];
        if (provider === 'deepseek') models = await fetchDeepSeekModels(key);
        else if (provider === 'gemini') models = await fetchGeminiModels(key);
        allModels.push(...models);
        validKeys.push(key);
      } catch (err) {
        invalidCount++;
      }
    }

    if (validKeys.length === 0) throw new Error('KhÃ´ng cÃ³ API key nÃ o há»£p lá»‡.');

    storeProviderKeys(provider, validKeys);

    return { status: 'ok', models: [...new Set(allModels)], validCount: validKeys.length, invalidCount };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});

ipcMain.handle('ai:test-provider', async (event, provider) => {
  const keys = getProviderKeys(provider);
  if (keys.length === 0) return { status: 'error', error: 'ChÆ°a lÆ°u API key nÃ o.' };

  try {
    let allModels = [];
    let validKeys = 0;
    for (const key of keys) {
      try {
        let models = [];
        if (provider === 'deepseek') models = await fetchDeepSeekModels(key);
        else if (provider === 'gemini') models = await fetchGeminiModels(key);
        allModels.push(...models);
        validKeys++;
      } catch (e) {}
    }
    if (validKeys === 0) return { status: 'error', error: 'API key khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n.' };
    return { status: 'ok', models: [...new Set(allModels)], validCount: validKeys };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});

async function executeDeepSeekRewrite(keys, payload) {
  const { model, prompt, srt_content } = payload;
  const body = JSON.stringify({
    model: model || 'deepseek-chat',
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: srt_content }
    ],
    stream: false
  });

  let lastError = null;
  for (let i = 0; i < Math.min(keys.length, 3); i++) {
    const key = keys[i];
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        }, (res) => {
          let chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            const resultStr = Buffer.concat(chunks).toString('utf8');
            if (res.statusCode >= 400) {
              let errData;
              try { errData = JSON.parse(resultStr); } catch { errData = {}; }
              reject(new Error(errData.error?.message || `HTTP ${res.statusCode}`));
            } else {
              try {
                resolve(JSON.parse(resultStr));
              } catch (e) { reject(new Error('Invalid JSON')); }
            }
          });
        });
        req.on('error', e => reject(e));
        req.setTimeout(30000, () => req.destroy(new Error('Timeout')));
        req.write(body);
        req.end();
      });
      const resultContent = response.choices?.[0]?.message?.content;
      if (!resultContent) throw new Error('KhÃ´ng nháº­n Ä‘Æ°á»£c ná»™i dung tá»« AI.');
      return resultContent;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`AI Request Failed sau ${Math.min(keys.length, 3)} láº§n thá»­. Lá»—i cuá»‘i: ${lastError?.message || 'Unknown'}`);
}

async function executeGeminiRewrite(keys, payload) {
  const { model, prompt, srt_content } = payload;
  const m = model || 'gemini-1.5-flash';

  const body = JSON.stringify({
    system_instruction: { parts: { text: prompt } },
    contents: [ { parts: [{ text: srt_content }] } ]
  });

  let lastError = null;
  for (let i = 0; i < Math.min(keys.length, 3); i++) {
    const key = keys[i];
    try {
      const response = await new Promise((resolve, reject) => {
        const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
          }
        }, (res) => {
          let chunks = [];
          res.on('data', chunk => chunks.push(chunk));
          res.on('end', () => {
            const resultStr = Buffer.concat(chunks).toString('utf8');
            if (res.statusCode >= 400) {
              let errData;
              try { errData = JSON.parse(resultStr); } catch { errData = {}; }
              reject(new Error(errData.error?.message || `HTTP ${res.statusCode}`));
            } else {
              try {
                resolve(JSON.parse(resultStr));
              } catch (e) { reject(new Error('Invalid JSON')); }
            }
          });
        });
        req.on('error', e => reject(e));
        req.setTimeout(30000, () => req.destroy(new Error('Timeout')));
        req.write(body);
        req.end();
      });
      const resultContent = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultContent) throw new Error('KhÃ´ng nháº­n Ä‘Æ°á»£c ná»™i dung tá»« AI.');
      return resultContent;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`AI Request Failed sau ${Math.min(keys.length, 3)} láº§n thá»­. Lá»—i cuá»‘i: ${lastError?.message || 'Unknown'}`);
}

ipcMain.handle('ai:rewrite', async (event, payload) => {
  try {
    const { provider, model, prompt, srt_content } = payload;

    if (!provider || provider === 'ollama') {
      throw new Error('ai:rewrite khÃ´ng há»— trá»£ Ollama qua kÃªnh nÃ y.');
    }

    const keys = getProviderKeys(provider);
    if (keys.length === 0) throw new Error(`ChÆ°a cÃ³ API key há»£p lá»‡ cho ${provider}.`);

    let result;
    if (provider === 'deepseek') {
      result = await executeDeepSeekRewrite(keys, payload);
    } else if (provider === 'gemini') {
      result = await executeGeminiRewrite(keys, payload);
    } else {
      throw new Error(`NhÃ  cung cáº¥p khÃ´ng há»£p lá»‡: ${provider}`);
    }

    return { status: 'ok', result };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});
