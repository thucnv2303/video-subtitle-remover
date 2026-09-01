const { app, BrowserWindow, ipcMain, dialog, Menu, net } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { execFile } = require('child_process');
const { PythonBridge } = require('./python-bridge');
const registerP1VisionIPC = require('./p1-vision-ipc');
const registerP1StandardVisionIPC = require('./p1-standard-vision-wrapper');

// Prevent Windows cache lock errors (Access is Denied 0x5 / Gpu Cache Creation failed)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-http-cache');

let mainWindow;
const pythonBridge = new PythonBridge({ appRoot: path.join(__dirname, '..', '..') });
registerP1VisionIPC({ ipcMain, net });
registerP1StandardVisionIPC({ ipcMain, net });

function ensureVoiceRenderBootstrap() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.executeJavaScript(`
    (() => {
      if (!document.querySelector('link[data-voice-render-owner-fixes]')) {
        const style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = 'styles/voice-render-owner-fixes.css';
        style.dataset.voiceRenderOwnerFixes = 'true';
        document.head.appendChild(style);
      }

      const loadOwnerFixes = () => {
        const alreadyDeclared = [...document.scripts].some((node) => /(?:^|\\/)js\\/voice-render-owner-fixes\\.js(?:[?#].*)?$/i.test(node.getAttribute('src') || ''));
        if (alreadyDeclared || document.querySelector('script[data-voice-render-owner-fixes]')) return;
        const fixes = document.createElement('script');
        fixes.src = 'js/voice-render-owner-fixes.js';
        fixes.dataset.voiceRenderOwnerFixes = 'true';
        fixes.addEventListener('error', () => console.error('[Voice Render] failed to load owner runtime fixes'));
        document.body.appendChild(fixes);
      };

      if (document.getElementById('nav-voice-render')) {
        loadOwnerFixes();
        return 'already-mounted';
      }

      document.querySelectorAll('script[data-voice-render]').forEach((node) => node.remove());
      const script = document.createElement('script');
      script.src = 'js/voice-render.js';
      script.dataset.voiceRender = 'main-window-bootstrap';
      script.addEventListener('load', loadOwnerFixes);
      script.addEventListener('error', () => console.error('[Voice Render] failed to load js/voice-render.js'));
      document.body.appendChild(script);
      return 'loading';
    })();
  `).catch((err) => {
    console.error('[Voice Render] bootstrap failed:', err?.message || err);
  });
}

function readCpuTotals() {
  const cpus = os.cpus() || [];
  return cpus.reduce((acc, cpu) => {
    const times = cpu?.times || {};
    const total = Object.values(times).reduce((sum, value) => sum + Number(value || 0), 0);
    acc.idle += Number(times.idle || 0);
    acc.total += total;
    return acc;
  }, { idle: 0, total: 0 });
}

async function getSystemInfoSnapshot() {
  const cpus = os.cpus() || [];
  const first = readCpuTotals();
  await new Promise((resolve) => setTimeout(resolve, 160));
  const second = readCpuTotals();
  const deltaTotal = second.total - first.total;
  const deltaIdle = second.idle - first.idle;
  const cpuUsagePercent = deltaTotal > 0
    ? Math.max(0, Math.min(100, 100 - (deltaIdle / deltaTotal * 100)))
    : null;

  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = Math.max(0, totalMemory - freeMemory);
  const memoryUsagePercent = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : null;

  return {
    platform: os.platform(),
    release: os.release(),
    cpu_model: cpus[0]?.model || '',
    logical_cores: cpus.length,
    cpu_usage_percent: cpuUsagePercent,
    total_memory_bytes: totalMemory,
    free_memory_bytes: freeMemory,
    used_memory_bytes: usedMemory,
    memory_usage_percent: memoryUsagePercent,
    app_version: app.getVersion(),
    electron_version: process.versions.electron || '',
  };
}

function escapeConcatPath(filePath) {
  return String(filePath).replace(/\\/g, '/').replace(/'/g, "\\'");
}

function isOwnedVoiceChunk(inputPath, outputPath) {
  const input = path.resolve(String(inputPath || ''));
  const output = path.resolve(String(outputPath || ''));
  if (path.dirname(input) !== path.dirname(output)) return false;
  if (!/\.wav$/i.test(output) || !/\.part-\d{3}\.wav$/i.test(input)) return false;
  const outputStem = path.basename(output, path.extname(output));
  const inputName = path.basename(input);
  return inputName.toLowerCase().startsWith(`${outputStem}.part-`.toLowerCase());
}

function mergeVoiceRenderWavFiles(inputPaths, outputPath) {
  return new Promise((resolve) => {
    const inputs = Array.isArray(inputPaths) ? inputPaths.filter(Boolean) : [];
    if (!inputs.length || !outputPath || !/\.wav$/i.test(String(outputPath))) {
      resolve({ ok: false, error: 'Thiếu danh sách chunk WAV hoặc đường dẫn đầu ra WAV hợp lệ.' });
      return;
    }

    const unsafe = inputs.find((filePath) => !isOwnedVoiceChunk(filePath, outputPath));
    if (unsafe) {
      resolve({ ok: false, error: `Chunk không thuộc run Voice Render hiện tại: ${unsafe}` });
      return;
    }

    const missing = inputs.find((filePath) => !fs.existsSync(filePath));
    if (missing) {
      resolve({ ok: false, error: `Thiếu chunk WAV: ${missing}` });
      return;
    }

    const listPath = path.join(os.tmpdir(), `vsr-voice-merge-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
    const manifest = inputs.map((filePath) => `file '${escapeConcatPath(filePath)}'`).join('\n');

    try {
      fs.writeFileSync(listPath, manifest, 'utf8');
    } catch (error) {
      resolve({ ok: false, error: error?.message || 'Không tạo được manifest ghép WAV.' });
      return;
    }

    execFile('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'concat', '-safe', '0', '-i', listPath,
      '-vn', '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', outputPath,
    ], { windowsHide: true }, async (error, stdout, stderr) => {
      try { fs.unlinkSync(listPath); } catch {}
      if (error) {
        resolve({ ok: false, error: (stderr || error.message || 'FFmpeg merge failed').trim() });
        return;
      }

      const cleanupErrors = [];
      for (const inputPath of inputs) {
        try {
          await fs.promises.unlink(inputPath);
        } catch (cleanupError) {
          if (cleanupError?.code !== 'ENOENT') cleanupErrors.push(cleanupError?.message || String(cleanupError));
        }
      }

      resolve({ ok: true, output_path: outputPath, cleanup_warnings: cleanupErrors });
    });
  });
}

function applyVoiceRenderTempo(inputPath, speedFactor) {
  return new Promise((resolve) => {
    const source = path.resolve(String(inputPath || ''));
    const factor = Number(speedFactor);
    if (!source || !fs.existsSync(source)) {
      resolve({ ok: false, error: 'Không tìm thấy audio để áp tốc độ voice.' });
      return;
    }
    if (!Number.isFinite(factor) || factor < 0.75 || factor > 1.25) {
      resolve({ ok: false, error: 'Tốc độ voice phải nằm trong khoảng 0.75x–1.25x.' });
      return;
    }
    if (Math.abs(factor - 1) < 0.005) {
      resolve({ ok: true, output_path: source, speed_factor: 1 });
      return;
    }

    const ext = path.extname(source).toLowerCase();
    const sameFileWav = ext === '.wav';
    const tempoPath = sameFileWav
      ? `${source}.tempo-${Date.now()}.wav`
      : path.join(path.dirname(source), `${path.basename(source, ext)}.tempo-${Date.now()}.wav`);

    execFile('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', source,
      '-vn', '-filter:a', `atempo=${factor.toFixed(4)}`,
      '-c:a', 'pcm_s16le', '-ar', '48000', '-ac', '2', tempoPath,
    ], { windowsHide: true }, async (error, stdout, stderr) => {
      if (error) {
        try { await fs.promises.unlink(tempoPath); } catch {}
        resolve({ ok: false, error: (stderr || error.message || 'FFmpeg tempo failed').trim() });
        return;
      }

      if (!sameFileWav) {
        resolve({ ok: true, output_path: tempoPath, speed_factor: factor });
        return;
      }

      try {
        await fs.promises.unlink(source);
        await fs.promises.rename(tempoPath, source);
        resolve({ ok: true, output_path: source, speed_factor: factor });
      } catch (replaceError) {
        resolve({ ok: false, error: replaceError?.message || 'Không thay được WAV sau khi áp tốc độ voice.' });
      }
    });
  });
}

const CLONE_AUDIO_EXTENSIONS = new Set(['.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac', '.wma', '.opus']);
const CLONE_CLEAN_PROFILES = {
  balanced: {
    label: 'Cân bằng',
    filter: 'adeclip,highpass=f=70,lowpass=f=10500,afftdn=nf=-28:tn=1,silenceremove=start_periods=1:start_duration=0.12:start_threshold=-48dB,areverse,silenceremove=start_periods=1:start_duration=0.22:start_threshold=-48dB,areverse,loudnorm=I=-20:TP=-2:LRA=7',
  },
  strong: {
    label: 'Lọc mạnh',
    filter: 'adeclip,highpass=f=85,lowpass=f=9500,afftdn=nf=-24:tn=1,silenceremove=start_periods=1:start_duration=0.12:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.22:start_threshold=-45dB,areverse,loudnorm=I=-20:TP=-2:LRA=6',
  },
};

function execMediaTool(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true, timeout: 120000, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(String(stderr || error.message || `${command} failed`).trim()));
        return;
      }
      resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') });
    });
  });
}

async function probeCloneAudio(sourcePath) {
  const { stdout } = await execMediaTool('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'format=duration:stream=sample_rate,channels',
    '-of', 'json', sourcePath,
  ]);
  const parsed = JSON.parse(stdout || '{}');
  const stream = parsed.streams?.[0] || {};
  return {
    duration_seconds: Number(parsed.format?.duration || 0),
    sample_rate: Number(stream.sample_rate || 0),
    channels: Number(stream.channels || 0),
  };
}

async function preprocessCloneAudio(payload = {}) {
  const sourcePath = path.resolve(String(payload.inputPath || ''));
  const profileName = String(payload.profile || 'balanced').toLowerCase();
  const profile = CLONE_CLEAN_PROFILES[profileName];

  if (!sourcePath || !fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
    return { ok: false, error: 'Không tìm thấy file audio mẫu.' };
  }
  if (!CLONE_AUDIO_EXTENSIONS.has(path.extname(sourcePath).toLowerCase())) {
    return { ok: false, error: 'Định dạng audio chưa được hỗ trợ để tạo voice clone.' };
  }
  if (!profile) {
    return { ok: false, error: 'Mức lọc âm thanh không hợp lệ.' };
  }

  let inputInfo;
  try {
    inputInfo = await probeCloneAudio(sourcePath);
  } catch (error) {
    return { ok: false, error: `Không đọc được audio mẫu: ${error.message}` };
  }
  if (!Number.isFinite(inputInfo.duration_seconds) || inputInfo.duration_seconds < 2) {
    return { ok: false, error: 'Audio mẫu cần dài ít nhất 2 giây.' };
  }
  if (inputInfo.duration_seconds > 60) {
    return { ok: false, error: 'Audio mẫu quá dài. Hãy chọn đoạn giọng nói dưới 60 giây, tốt nhất 5–15 giây.' };
  }

  const outputDir = path.join(app.getPath('userData'), 'voice-clone-references');
  await fs.promises.mkdir(outputDir, { recursive: true });
  const safeStem = path.basename(sourcePath, path.extname(sourcePath)).replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 48) || 'voice';
  const outputPath = path.join(outputDir, `${safeStem}-${profileName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.wav`);

  try {
    await execMediaTool('ffmpeg', [
      '-y', '-hide_banner', '-loglevel', 'error', '-i', sourcePath,
      '-vn', '-af', profile.filter,
      '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', outputPath,
    ]);
    const outputInfo = await probeCloneAudio(outputPath);
    if (outputInfo.duration_seconds < 1.5) throw new Error('Sau khi cắt khoảng lặng, audio còn quá ngắn để clone giọng.');
    return {
      ok: true,
      output_path: outputPath,
      source_path: sourcePath,
      profile: profileName,
      profile_label: profile.label,
      input: inputInfo,
      output: outputInfo,
      warning: inputInfo.duration_seconds > 15 ? 'Audio dài hơn mức khuyên dùng 5–15 giây.' : '',
    };
  } catch (error) {
    try { await fs.promises.unlink(outputPath); } catch {}
    return { ok: false, error: error?.message || 'Không thể làm sạch audio mẫu.' };
  }
}

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
    ensureVoiceRenderBootstrap();
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
  const options = {
    title: 'Chọn thư mục',
    properties: ['openDirectory']
  };
  return dialog.showOpenDialog(options);
});

ipcMain.handle('fs:scanVideoFiles', async (event, dirPath) => {
  if (!dirPath || typeof dirPath !== 'string' || !fs.existsSync(dirPath)) {
    return { ok: false, error: 'Thư mục không tồn tại.', files: [] };
  }
  const videoExts = new Set(['.mp4', '.mkv', '.mov', '.avi', '.ts', '.webm', '.flv', '.wmv', '.m4v']);
  const results = [];

  function scan(currentDir, depth = 0) {
    if (depth > 4) return;
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          scan(fullPath, depth + 1);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (videoExts.has(ext)) {
            results.push({
              name: entry.name,
              baseName: path.parse(entry.name).name,
              path: fullPath
            });
          }
        }
      }
    } catch (e) {
      console.warn('Scan dir error:', e);
    }
  }

  scan(dirPath, 0);
  return { ok: true, files: results };
});

ipcMain.handle('net:fetchText', async (event, url) => {
  if (!url || typeof url !== 'string') {
    return { ok: false, error: 'URL không hợp lệ.' };
  }
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv,text/plain,*/*'
      }
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status} (${res.statusText}) - Hãy chắc chắn Google Sheet đã bật chia sẻ công khai ("Bất kỳ ai có liên kết đều có thể xem").` };
    }
    const text = await res.text();
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e.message || 'Không thể kết nối tới Google Sheets.' };
  }
});

ipcMain.handle('dialog:saveFile', async (event, defaultPath) => {
  const options = {
    title: 'Lưu file Voice Render',
    defaultPath,
    filters: [
      { name: 'WAV Audio', extensions: ['wav'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  };
  const { canceled, filePath } = await dialog.showSaveDialog(options);
  if (canceled || !filePath) return null;
  return path.extname(filePath) ? filePath : `${filePath}.wav`;
});

ipcMain.handle('ollama:listModels', async (event, endpoint) => {
  const raw = typeof endpoint === 'string' && endpoint.trim()
    ? endpoint.trim()
    : 'http://localhost:11434/api/chat';

  try {
    const url = new URL(raw.includes('://') ? raw : `http://${raw}`);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { ok: false, error: 'Endpoint Ollama phải dùng HTTP hoặc HTTPS.' };
    }

    const host = url.hostname.toLowerCase();
    if (!['localhost', '127.0.0.1', '::1'].includes(host)) {
      return { ok: false, error: 'Quét model chỉ hỗ trợ Ollama local (localhost/127.0.0.1).' };
    }

    url.pathname = '/api/tags';
    url.search = '';
    url.hash = '';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await net.fetch(url.toString(), { signal: controller.signal });
      if (!response.ok) {
        return { ok: false, error: `Ollama trả về HTTP ${response.status}.` };
      }
      const body = await response.json();
      const models = Array.isArray(body?.models)
        ? body.models
            .map(item => item?.name || item?.model)
            .filter(name => typeof name === 'string' && name.trim())
        : [];
      return { ok: true, models: [...new Set(models)] };
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    const message = err?.name === 'AbortError'
      ? 'Ollama không phản hồi trong 6 giây.'
      : (err?.message || 'Không thể kết nối Ollama.');
    return { ok: false, error: message };
  }
});

async function fetchCloudProviderModels(provider, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const url = provider === 'gemini'
      ? `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`
      : 'https://api.deepseek.com/models';
    const headers = provider === 'deepseek'
      ? { Authorization: `Bearer ${apiKey}` }
      : undefined;
    const response = await net.fetch(url, { method: 'GET', headers, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`${providerLabel(provider)} trả về HTTP ${response.status}.`);
    }
    const body = await response.json();
    const models = provider === 'gemini'
      ? (Array.isArray(body?.models) ? body.models : [])
          .filter(item => Array.isArray(item?.supportedGenerationMethods) && item.supportedGenerationMethods.includes('generateContent'))
          .map(item => String(item?.name || '').replace(/^models\//, ''))
      : (Array.isArray(body?.data) ? body.data : []).map(item => item?.id);
    return [...new Set(models.filter(name => typeof name === 'string' && name.trim()))];
  } finally {
    clearTimeout(timeout);
  }
}

function providerLabel(provider) {
  return provider === 'gemini' ? 'Gemini' : 'DeepSeek';
}

ipcMain.handle('ai:validateProviderKeys', async (event, payload = {}) => {
  const provider = String(payload?.provider || '').toLowerCase();
  if (!['gemini', 'deepseek'].includes(provider)) {
    return { ok: false, error: 'Chỉ hỗ trợ kiểm tra key Gemini hoặc DeepSeek.', results: [], models: [] };
  }
  const keys = Array.isArray(payload?.keys)
    ? [...new Set(payload.keys.map(key => String(key || '').trim()).filter(Boolean))].slice(0, 20)
    : [];
  if (!keys.length) {
    return { ok: false, error: `Chưa có API key ${providerLabel(provider)}.`, results: [], models: [] };
  }

  const results = [];
  const models = new Set();
  for (let index = 0; index < keys.length; index += 1) {
    try {
      const keyModels = await fetchCloudProviderModels(provider, keys[index]);
      keyModels.forEach(model => models.add(model));
      results.push({ index, ok: true });
    } catch (error) {
      const message = error?.name === 'AbortError'
        ? `${providerLabel(provider)} không phản hồi trong 10 giây.`
        : (error?.message || `Không kiểm tra được ${providerLabel(provider)}.`);
      results.push({ index, ok: false, error: message });
    }
  }
  const validCount = results.filter(item => item.ok).length;
  return {
    ok: validCount > 0,
    error: validCount > 0 ? '' : `Không có API key ${providerLabel(provider)} hợp lệ.`,
    results,
    models: [...models],
    validCount,
    invalidCount: results.length - validCount,
  };
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
ipcMain.handle('app:openPath', async (e, p) => {
  const { shell } = require('electron');
  await shell.openPath(p);
});

ipcMain.handle('app:getPath', () => {
  return app.getAppPath();
});

ipcMain.handle('app:systemInfo', async () => getSystemInfoSnapshot());
ipcMain.handle('voice-render:mergeWavFiles', async (event, inputPaths, outputPath) => mergeVoiceRenderWavFiles(inputPaths, outputPath));
ipcMain.handle('voice-render:applyTempo', async (event, inputPath, speedFactor) => applyVoiceRenderTempo(inputPath, speedFactor));
ipcMain.handle('voice-clone:preprocessAudio', async (event, payload) => preprocessCloneAudio(payload));
