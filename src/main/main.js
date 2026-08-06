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

// AI Settings & Secure Storage

const ALLOWED_CLOUD_PROVIDERS = new Set(['deepseek', 'gemini']);
const MAX_KEYS_PER_PROVIDER = 10;

function assertCloudProvider(provider) {
  if (!ALLOWED_CLOUD_PROVIDERS.has(provider)) {
    throw new Error(`Nhà cung cấp không được hỗ trợ: ${provider}`);
  }
}

function checkSafeStorage() {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Hệ điều hành không hỗ trợ mã hóa an toàn (safeStorage).');
  }
}

function getKeysPath() {
  return path.join(app.getPath('userData'), 'ai_keys.json');
}

// Validate store shape: { deepseek?: string[], gemini?: string[] }
// Only allows known providers; all values must be valid hex ciphertext strings.
// Throws on invalid shape or invalid ciphertext; returns {} on ENOENT.
const MAX_HEX_CIPHERTEXT_LENGTH = 8192; // safeStorage output is bounded
const HEX_REGEX = /^[0-9a-f]+$/i;
function isValidCiphertext(entry) {
  return typeof entry === 'string' &&
    entry.length > 0 &&
    entry.length % 2 === 0 &&
    entry.length <= MAX_HEX_CIPHERTEXT_LENGTH &&
    HEX_REGEX.test(entry);
}

function loadEncryptedKeys() {
  const keysPath = getKeysPath();
  let raw;
  try {
    raw = fs.readFileSync(keysPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw new Error('Không thể đọc kho khóa: ' + err.code);
  }
  let parsed;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error('Kho khóa bị lỗi định dạng JSON. Không nạp.'); }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Kho khóa có cấu trúc không hợp lệ (root phải là object).');
  }
  for (const [k, v] of Object.entries(parsed)) {
    if (!ALLOWED_CLOUD_PROVIDERS.has(k)) {
      throw new Error(`Kho khóa chứa provider không hợp lệ: ${k}`);
    }
    if (!Array.isArray(v) || !v.every(isValidCiphertext)) {
      throw new Error(`Kho khóa có mục mã hóa không hợp lệ cho provider: ${k}`);
    }
  }
  return parsed;
}

// Windows-safe atomic replacement:
// 1. Write serialized JSON to exact temp path (keysPath.tmp_PID).
// 2. If destination exists, move it to an exact backup path (keysPath.bak_PID).
// 3. Rename temp to destination.
// 4. If step 3 fails, restore backup to destination.
// 5. Remove exact backup after successful replacement.
// 6. Clean up any stale temp/backup from prior interrupted operation on entry.
function saveEncryptedKeys(data) {
  const keysPath = getKeysPath();
  const tmpPath = keysPath + '.tmp_' + process.pid;
  const bakPath = keysPath + '.bak_' + process.pid;
  const serialized = JSON.stringify(data);

  // Clean up any stale artifacts from prior interrupted saves
  try { fs.unlinkSync(tmpPath); } catch {}
  try { fs.unlinkSync(bakPath); } catch {}

  try {
    fs.writeFileSync(tmpPath, serialized, 'utf8');
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch {}
    throw new Error('Không thể ghi tệp tạm kho khóa: ' + err.message);
  }

  // Move existing destination to backup before rename
  let hadExisting = false;
  try {
    fs.renameSync(keysPath, bakPath);
    hadExisting = true;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      try { fs.unlinkSync(tmpPath); } catch {}
      throw new Error('Không thể tạo bản sao lưu kho khóa: ' + err.message);
    }
  }

  try {
    fs.renameSync(tmpPath, keysPath);
  } catch (err) {
    // Restore backup if rename failed
    if (hadExisting) {
      try { fs.renameSync(bakPath, keysPath); } catch {}
    }
    try { fs.unlinkSync(tmpPath); } catch {}
    throw new Error('Không thể ghi kho khóa: ' + err.message);
  }

  // Cleanup backup only after successful replacement
  if (hadExisting) {
    try { fs.unlinkSync(bakPath); } catch {}
  }
}

function storeProviderKeys(provider, keysArray) {
  assertCloudProvider(provider);
  checkSafeStorage();
  const data = loadEncryptedKeys();
  if (keysArray && keysArray.length > 0) {
    const limited = keysArray.slice(0, MAX_KEYS_PER_PROVIDER);
    const encrypted = limited.map(key => safeStorage.encryptString(key).toString('hex'));
    data[provider] = encrypted;
  } else {
    delete data[provider];
  }
  saveEncryptedKeys(data);
}

function getProviderKeys(provider) {
  assertCloudProvider(provider);
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
  try {
    assertCloudProvider(provider);
    checkSafeStorage();
    const data = loadEncryptedKeys();
    const arr = data[provider];
    if (!Array.isArray(arr)) return { status: 'ok', count: 0 };
    const count = arr.filter(isValidCiphertext).length;
    return { status: 'ok', count };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
});

ipcMain.handle('ai:delete-provider-keys', (event, provider) => {
  try {
    assertCloudProvider(provider);
    storeProviderKeys(provider, null);
    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', error: err.message };
  }
});

async function fetchDeepSeekModels(key) {
  return new Promise((resolve, reject) => {
    const req = https.request('https://api.deepseek.com/models', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${key}` }
    }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', chunk => {
        size += chunk.length;
        if (size > 2 * 1024 * 1024) { req.destroy(new Error('Phản hồi DeepSeek vượt quá giới hạn 2 MB.')); return; }
        chunks.push(chunk);
      });
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            if (!Array.isArray(parsed.data)) { reject(new Error('DeepSeek trả về dữ liệu models không hợp lệ.')); return; }
            const models = [...new Set(parsed.data.map(m => m.id).filter(Boolean))];
            resolve(models);
          } catch (e) {
            reject(new Error('DeepSeek trả về JSON không hợp lệ.'));
          }
        } else {
          reject(new Error(res.statusCode === 401 || res.statusCode === 403 ? 'API key không hợp lệ hoặc không có quyền.' : `DeepSeek HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error('Lỗi kết nối DeepSeek: ' + e.message)));
    req.setTimeout(10000, () => req.destroy(new Error('Timeout DeepSeek')));
    req.end();
  });
}

// fetchGeminiModels returns a flat string[] of model IDs when key is valid and
// compatible models exist. Rejects with a controlled error in all other cases:
//   - Invalid JSON -> error
//   - Missing models array -> error
//   - No generateContent-capable model -> controlled 'no_compatible_models' error
async function fetchGeminiModels(key) {
  return new Promise((resolve, reject) => {
    // NOTE: key is in URL query; do not log this URL
    const req = https.request(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`, {
      method: 'GET'
    }, (res) => {
      const chunks = [];
      let size = 0;
      res.on('data', chunk => {
        size += chunk.length;
        if (size > 2 * 1024 * 1024) { req.destroy(new Error('Phản hồi Gemini vượt quá giới hạn 2 MB.')); return; }
        chunks.push(chunk);
      });
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        if (res.statusCode === 200) {
          let parsed;
          try { parsed = JSON.parse(body); }
          catch { reject(new Error('Gemini trả về JSON không hợp lệ.')); return; }
          if (!parsed || !Array.isArray(parsed.models)) {
            reject(new Error('Gemini trả về danh sách models không hợp lệ.'));
            return;
          }
          const models = parsed.models
            .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name.replace('models/', ''));
          if (models.length === 0) {
            // Authenticated but no compatible model — not usable, do not save
            reject(new Error('API key được xác thực nhưng không có model generateContent tương thích.'));
            return;
          }
          resolve(models);
        } else {
          reject(new Error(res.statusCode === 400 || res.statusCode === 403 ? 'API key không hợp lệ.' : `Gemini HTTP ${res.statusCode}`));
        }
      });
    });
    req.on('error', (e) => reject(new Error('Lỗi kết nối Gemini: ' + e.message)));
    req.setTimeout(10000, () => req.destroy(new Error('Timeout Gemini')));
    req.end();
  });
}

ipcMain.handle('ai:save-provider-keys', async (event, provider, keys) => {
  try { assertCloudProvider(provider); } catch(e) { return { status: 'error', error: e.message }; }
  if (!keys || keys.length === 0) {
    try { storeProviderKeys(provider, null); } catch(e) { return { status: 'error', error: e.message }; }
    return { status: 'ok', models: [], validCount: 0, invalidCount: 0 };
  }
  try {
    checkSafeStorage();
    let allModels = [];
    let validKeys = [];
    let invalidCount = 0;

    // Sanitize: trim, deduplicate, reject empty, cap count
    const sanitized = [...new Set((Array.isArray(keys) ? keys : []).map(k => String(k).trim()).filter(Boolean))].slice(0, MAX_KEYS_PER_PROVIDER);
    if (sanitized.length === 0) throw new Error('Không có API key hợp lệ nào được gửi.');

    for (const key of sanitized) {
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

    if (validKeys.length === 0) throw new Error('Không có API key nào hợp lệ.');

    storeProviderKeys(provider, validKeys);

    return { status: 'ok', models: [...new Set(allModels)], validCount: validKeys.length, invalidCount };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});

ipcMain.handle('ai:test-provider', async (event, provider) => {
  try { assertCloudProvider(provider); } catch(e) { return { status: 'error', error: e.message }; }
  let keys;
  try { keys = getProviderKeys(provider); } catch(e) { return { status: 'error', error: e.message }; }
  if (keys.length === 0) return { status: 'error', error: 'Chưa lưu API key nào.' };

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
    if (validKeys === 0) return { status: 'error', error: 'API key không hợp lệ hoặc đã hết hạn.' };
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
          let size = 0;
          res.on('data', chunk => { size += chunk.length; if (size > 2 * 1024 * 1024) { req.destroy(new Error('Phản hồi DeepSeek rewrite vượt quá giới hạn 2 MB.')); return; } chunks.push(chunk); });
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
      if (!resultContent) throw new Error('Không nhận được nội dung từ AI.');
      return resultContent;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`AI Request Failed sau ${Math.min(keys.length, 3)} lần thử. Lỗi cuối: ${lastError?.message || 'Unknown'}`);
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
          let size = 0;
          res.on('data', chunk => { size += chunk.length; if (size > 2 * 1024 * 1024) { req.destroy(new Error('Phản hồi Gemini rewrite vượt quá giới hạn 2 MB.')); return; } chunks.push(chunk); });
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
      if (!resultContent) throw new Error('Không nhận được nội dung từ AI.');
      return resultContent;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`AI Request Failed sau ${Math.min(keys.length, 3)} lần thử. Lỗi cuối: ${lastError?.message || 'Unknown'}`);
}

ipcMain.handle('ai:rewrite', async (event, payload) => {
  try {
    const { provider, model, prompt, srt_content } = payload;

    try { assertCloudProvider(provider); } catch(e) { throw new Error(e.message); }

    const keys = getProviderKeys(provider);
    if (keys.length === 0) throw new Error(`Chưa có API key hợp lệ cho ${provider}.`);

    let result;
    if (provider === 'deepseek') {
      result = await executeDeepSeekRewrite(keys, payload);
    } else if (provider === 'gemini') {
      result = await executeGeminiRewrite(keys, payload);
    } else {
      throw new Error(`Nhà cung cấp không hợp lệ: ${provider}`);
    }

    return { status: 'ok', result };
  } catch (error) {
    return { status: 'error', error: error.message };
  }
});
