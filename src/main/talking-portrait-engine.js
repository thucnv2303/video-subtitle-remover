const { app, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CONFIG_FILE = 'talking-portrait.json';
let activeChild = null;

function configPath() {
  return path.join(app.getPath('userData'), CONFIG_FILE);
}

function readConfig() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeConfig(next) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf8');
}

function resolveEngineRoot() {
  const cfg = readConfig();
  const candidates = [
    cfg.engineRoot,
    process.env.JOYVASA_HOME,
    path.join(app.getAppPath(), 'tools', 'JoyVASA'),
    path.join(path.dirname(app.getAppPath()), 'JoyVASA'),
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'inference.py'))) || '';
}

function resolvePython(engineRoot) {
  const cfg = readConfig();
  const candidates = [
    cfg.pythonPath,
    process.env.JOYVASA_PYTHON,
    engineRoot && path.join(engineRoot, '.venv', 'Scripts', 'python.exe'),
    engineRoot && path.join(engineRoot, 'venv', 'Scripts', 'python.exe'),
  ].filter(Boolean);
  const explicit = candidates.find((candidate) => fs.existsSync(candidate));
  if (explicit) return { command: explicit, prefixArgs: [], mode: 'python' };
  return { command: 'conda', prefixArgs: ['run', '-n', 'joyvasa', 'python'], mode: 'conda' };
}

function requiredAssets(engineRoot) {
  if (!engineRoot) return [];
  return [
    path.join(engineRoot, 'pretrained_weights', 'JoyVASA', 'motion_generator'),
    path.join(engineRoot, 'pretrained_weights', 'liveportrait', 'base_models'),
  ];
}

function engineStatus() {
  const engineRoot = resolveEngineRoot();
  const python = resolvePython(engineRoot);
  const missing = [];
  if (!engineRoot) missing.push('JoyVASA/inference.py');
  for (const required of requiredAssets(engineRoot)) {
    if (!fs.existsSync(required)) missing.push(path.relative(engineRoot, required));
  }
  return {
    ok: Boolean(engineRoot) && missing.length === 0,
    engineRoot,
    pythonMode: python.mode,
    pythonCommand: python.mode === 'python' ? python.command : 'conda run -n joyvasa python',
    missing,
    configured: readConfig(),
    running: Boolean(activeChild),
  };
}

async function chooseEngineRoot(event) {
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = owner && !owner.isDestroyed()
    ? await dialog.showOpenDialog(owner, { title: 'Chọn thư mục JoyVASA', properties: ['openDirectory'] })
    : await dialog.showOpenDialog({ title: 'Chọn thư mục JoyVASA', properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };
  const engineRoot = result.filePaths[0];
  if (!fs.existsSync(path.join(engineRoot, 'inference.py'))) {
    return { ok: false, error: 'Thư mục đã chọn không có inference.py của JoyVASA.' };
  }
  const cfg = readConfig();
  writeConfig({ ...cfg, engineRoot });
  return engineStatus();
}

function sanitizeInputPath(value, allowedExts, label) {
  const full = path.resolve(String(value || ''));
  if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) throw new Error(`Không tìm thấy ${label}.`);
  if (!allowedExts.includes(path.extname(full).toLowerCase())) throw new Error(`${label} không đúng định dạng hỗ trợ.`);
  return full;
}

function presetToArgs(payload = {}) {
  const mode = String(payload.mode || 'natural');
  const expression = Math.max(20, Math.min(100, Number(payload.expression) || 65));
  const head = Math.max(20, Math.min(100, Number(payload.head) || 60));
  const quality = String(payload.quality || 'quality');
  const baseCfg = mode === 'expressive' ? 3.2 : mode === 'calm' ? 2.2 : 2.8;
  const cfgScale = Math.max(1.6, Math.min(4.0, baseCfg + ((expression - 65) / 100) * 1.2));
  const drivingMultiplier = Math.max(0.85, Math.min(1.35, 1.0 + ((head - 50) / 100) * 0.35));
  return {
    cfgScale: Number(cfgScale.toFixed(2)),
    drivingMultiplier: Number(drivingMultiplier.toFixed(2)),
    useHalf: quality === 'preview',
  };
}

function predictedOutput(outputDir, imagePath, audioPath) {
  return path.join(outputDir, `${path.parse(imagePath).name}_${path.parse(audioPath).name}.mp4`);
}

function spawnJoyVasa(event, payload = {}) {
  if (activeChild) return Promise.resolve({ ok: false, error: 'Đang có một AI Avatar job chạy.' });
  const status = engineStatus();
  if (!status.ok) return Promise.resolve({ ok: false, error: `JoyVASA chưa sẵn sàng: ${status.missing.join(', ') || 'chưa cấu hình engine'}`, status });

  let imagePath;
  let audioPath;
  try {
    imagePath = sanitizeInputPath(payload.imagePath, ['.jpg', '.jpeg', '.png', '.webp', '.bmp'], 'ảnh nhân vật');
    audioPath = sanitizeInputPath(payload.audioPath, ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac'], 'voice');
  } catch (error) {
    return Promise.resolve({ ok: false, error: error.message });
  }

  const runId = `avatar-${Date.now()}`;
  const outputDir = path.join(app.getPath('userData'), 'talking-portrait', 'outputs', runId);
  fs.mkdirSync(outputDir, { recursive: true });
  const mapped = presetToArgs(payload);
  const python = resolvePython(status.engineRoot);
  const scriptArgs = [
    path.join(status.engineRoot, 'inference.py'),
    '-r', imagePath,
    '-a', audioPath,
    '-o', outputDir,
    '--animation-mode', 'human',
    '--cfg-scale', String(mapped.cfgScale),
    '--driving-multiplier', String(mapped.drivingMultiplier),
    '--animation-region', 'all',
  ];
  if (mapped.useHalf) scriptArgs.push('--flag-use-half-precision');
  const args = [...python.prefixArgs, ...scriptArgs];
  const expectedOutput = predictedOutput(outputDir, imagePath, audioPath);

  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    const child = spawn(python.command, args, {
      cwd: status.engineRoot,
      windowsHide: true,
      env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
    });
    activeChild = child;

    const emit = (type, text) => {
      const message = String(text || '').trim();
      if (!message || event.sender.isDestroyed()) return;
      event.sender.send('talking-portrait:progress', { runId, type, message });
    };

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString(); stdout += text; emit('info', text);
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString(); stderr += text; emit('info', text);
    });
    child.on('error', (error) => {
      activeChild = null;
      if (settled) return;
      settled = true;
      resolve({ ok: false, runId, error: `Không khởi động được JoyVASA: ${error.message}`, command: python.mode });
    });
    child.on('close', (code) => {
      activeChild = null;
      if (settled) return;
      settled = true;
      if (code === 0 && fs.existsSync(expectedOutput)) {
        emit('success', `Hoàn tất: ${expectedOutput}`);
        resolve({ ok: true, runId, outputPath: expectedOutput, outputDir, cfg: mapped });
        return;
      }
      const tail = (stderr || stdout).trim().split(/\r?\n/).slice(-8).join('\n');
      resolve({ ok: false, runId, error: tail || `JoyVASA kết thúc với mã ${code}.`, code, expectedOutput });
    });
  });
}

function cancel() {
  if (!activeChild) return { ok: true, cancelled: false };
  try {
    activeChild.kill();
    activeChild = null;
    return { ok: true, cancelled: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = { engineStatus, chooseEngineRoot, spawnJoyVasa, cancel, presetToArgs };
