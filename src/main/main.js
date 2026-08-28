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
        if (document.querySelector('script[data-voice-render-owner-fixes]')) return;
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
      '-vn', '-c:a', 'pcm_s16le', outputPath,
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
      '-c:a', 'pcm_s16le', tempoPath,
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
    title: 'Chọn thư mục đầu ra',
    properties: ['openDirectory']
  };
  return dialog.showOpenDialog(options);
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
