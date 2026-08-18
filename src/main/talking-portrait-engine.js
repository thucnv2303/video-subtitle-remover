const { app, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CONFIG_FILE = 'talking-portrait.json';
const SAFE_RUNTIME_ROOT = 'C:\\VSR-JoyVASA';
let activeChild = null;

function configPath() { return path.join(app.getPath('userData'), CONFIG_FILE); }
function readConfig() { try { const parsed = JSON.parse(fs.readFileSync(configPath(), 'utf8')); return parsed && typeof parsed === 'object' ? parsed : {}; } catch { return {}; } }
function writeConfig(next) { fs.mkdirSync(path.dirname(configPath()), { recursive: true }); fs.writeFileSync(configPath(), JSON.stringify(next, null, 2), 'utf8'); }

function resolveEngineRoot() {
  const cfg = readConfig();
  const candidates = [cfg.engineRoot, process.env.JOYVASA_HOME, path.join(app.getAppPath(), 'tools', 'JoyVASA'), path.join(path.dirname(app.getAppPath()), 'JoyVASA')].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(path.join(candidate, 'inference.py'))) || '';
}

function resolvePython(engineRoot) {
  const cfg = readConfig();
  const appRoot = app.getAppPath();
  const candidates = [
    cfg.pythonPath,
    process.env.JOYVASA_PYTHON,
    path.join(SAFE_RUNTIME_ROOT, 'venv', 'Scripts', 'python.exe'),
    path.join(appRoot, 'tools', 'miniconda3', 'envs', 'joyvasa', 'python.exe'),
    engineRoot && path.join(engineRoot, '.venv', 'Scripts', 'python.exe'),
    engineRoot && path.join(engineRoot, 'venv', 'Scripts', 'python.exe'),
  ].filter(Boolean);
  const explicit = candidates.find((candidate) => fs.existsSync(candidate));
  if (explicit) return { command: explicit, prefixArgs: [], mode: 'python' };
  return { command: '', prefixArgs: [], mode: 'missing' };
}

function requiredAssets(engineRoot) {
  if (!engineRoot) return [];
  return [
    path.join(engineRoot, 'pretrained_weights', 'JoyVASA', 'motion_generator'),
    path.join(engineRoot, 'pretrained_weights', 'JoyVASA', 'motion_template'),
    path.join(engineRoot, 'pretrained_weights', 'chinese-hubert-base', 'config.json'),
    path.join(engineRoot, 'pretrained_weights', 'liveportrait', 'base_models'),
    path.join(engineRoot, 'pretrained_weights', 'liveportrait', 'retargeting_models'),
  ];
}

function engineStatus() {
  const engineRoot = resolveEngineRoot(); const python = resolvePython(engineRoot); const missing = [];
  if (!engineRoot) missing.push('JoyVASA/inference.py');
  for (const required of requiredAssets(engineRoot)) if (!fs.existsSync(required)) missing.push(path.relative(engineRoot, required));
  if (python.mode !== 'python') missing.push('JoyVASA Python runtime');
  return { ok: Boolean(engineRoot) && missing.length === 0, engineRoot, pythonMode: python.mode, pythonCommand: python.command, missing, configured: readConfig(), running: Boolean(activeChild) };
}

async function chooseEngineRoot(event) {
  const owner = BrowserWindow.fromWebContents(event.sender);
  const result = owner && !owner.isDestroyed() ? await dialog.showOpenDialog(owner, { title: 'Chọn thư mục JoyVASA', properties: ['openDirectory'] }) : await dialog.showOpenDialog({ title: 'Chọn thư mục JoyVASA', properties: ['openDirectory'] });
  if (result.canceled || !result.filePaths?.[0]) return { ok: false, canceled: true };
  const engineRoot = result.filePaths[0];
  if (!fs.existsSync(path.join(engineRoot, 'inference.py'))) return { ok: false, error: 'Thư mục đã chọn không có inference.py của JoyVASA.' };
  writeConfig({ ...readConfig(), engineRoot }); return engineStatus();
}

function sanitizeInputPath(value, allowedExts, label) {
  const full = path.resolve(String(value || ''));
  if (!full || !fs.existsSync(full) || !fs.statSync(full).isFile()) throw new Error(`Không tìm thấy ${label}.`);
  if (!allowedExts.includes(path.extname(full).toLowerCase())) throw new Error(`${label} không đúng định dạng hỗ trợ.`);
  return full;
}

function stageInput(sourcePath, runDir, stem) {
  const ext = path.extname(sourcePath).toLowerCase();
  const stagedPath = path.join(runDir, `${stem}${ext}`);
  fs.copyFileSync(sourcePath, stagedPath);
  if (!fs.existsSync(stagedPath) || fs.statSync(stagedPath).size === 0) throw new Error(`Không thể staging ${stem} cho JoyVASA.`);
  return stagedPath;
}

function presetToArgs(payload = {}) {
  const mode = String(payload.mode || 'natural'); const expression = Math.max(20, Math.min(100, Number(payload.expression) || 65)); const head = Math.max(20, Math.min(100, Number(payload.head) || 60));
  const baseCfg = mode === 'expressive' ? 3.2 : mode === 'calm' ? 2.2 : 2.8;
  return { cfgScale: Number(Math.max(1.6, Math.min(4.0, baseCfg + ((expression - 65) / 100) * 1.2)).toFixed(2)), drivingMultiplier: Number(Math.max(0.85, Math.min(1.35, 1.0 + ((head - 50) / 100) * 0.35)).toFixed(2)), useHalf: String(payload.quality || 'quality') === 'preview' };
}

function predictedOutput(outputDir, imagePath, audioPath) { return path.join(outputDir, `${path.parse(imagePath).name}_${path.parse(audioPath).name}.mp4`); }

function spawnJoyVasa(event, payload = {}) {
  if (activeChild) return Promise.resolve({ ok: false, error: 'Đang có một AI Avatar job chạy.' });
  const status = engineStatus(); if (!status.ok) return Promise.resolve({ ok: false, error: `JoyVASA chưa sẵn sàng: ${status.missing.join(', ') || 'chưa cấu hình engine'}`, status });
  let imagePath; let audioPath;
  try { imagePath = sanitizeInputPath(payload.imagePath, ['.jpg', '.jpeg', '.png', '.webp', '.bmp'], 'ảnh nhân vật'); audioPath = sanitizeInputPath(payload.audioPath, ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac'], 'voice'); } catch (error) { return Promise.resolve({ ok: false, error: error.message }); }

  const runId = `avatar-${Date.now()}`;
  const runDir = path.join(SAFE_RUNTIME_ROOT, 'runs', runId);
  const outputDir = path.join(runDir, 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  try {
    imagePath = stageInput(imagePath, runDir, 'portrait');
    audioPath = stageInput(audioPath, runDir, 'voice');
  } catch (error) {
    return Promise.resolve({ ok: false, runId, error: error.message });
  }

  const mapped = presetToArgs(payload); const python = resolvePython(status.engineRoot);
  const scriptArgs = [path.join(status.engineRoot, 'inference.py'), '-r', imagePath, '-a', audioPath, '-o', outputDir, '--animation-mode', 'human', '--cfg-scale', String(mapped.cfgScale), '--driving-multiplier', String(mapped.drivingMultiplier), '--animation-region', 'all'];
  if (mapped.useHalf) scriptArgs.push('--flag-use-half-precision');
  const expectedOutput = predictedOutput(outputDir, imagePath, audioPath);
  return new Promise((resolve) => {
    let stdout = ''; let stderr = ''; let settled = false;
    const child = spawn(python.command, [...python.prefixArgs, ...scriptArgs], { cwd: status.engineRoot, windowsHide: true, env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' } }); activeChild = child;
    const emit = (type, text) => { const message = String(text || '').trim(); if (message && !event.sender.isDestroyed()) event.sender.send('talking-portrait:progress', { runId, type, message }); };
    emit('info', `Input staged: ${imagePath}`);
    emit('info', `Voice staged: ${audioPath}`);
    child.stdout.on('data', (chunk) => { const text = chunk.toString(); stdout += text; emit('info', text); });
    child.stderr.on('data', (chunk) => { const text = chunk.toString(); stderr += text; emit('info', text); });
    child.on('error', (error) => { if (activeChild === child) activeChild = null; if (settled) return; settled = true; resolve({ ok: false, runId, error: `Không khởi động được JoyVASA: ${error.message}`, command: python.mode }); });
    child.on('close', (code) => { if (activeChild === child) activeChild = null; if (settled) return; settled = true; if (code === 0 && fs.existsSync(expectedOutput)) { emit('success', `Hoàn tất: ${expectedOutput}`); resolve({ ok: true, runId, outputPath: expectedOutput, outputDir, cfg: mapped }); return; } const tail = (stderr || stdout).trim().split(/\r?\n/).slice(-12).join('\n'); resolve({ ok: false, runId, error: tail || `JoyVASA kết thúc với mã ${code}.`, code, expectedOutput }); });
  });
}

function cancel() {
  if (!activeChild) return { ok: true, cancelled: false };
  try { const accepted = activeChild.kill(); return { ok: accepted, cancelled: accepted, stopping: accepted }; } catch (error) { return { ok: false, error: error.message }; }
}

module.exports = { engineStatus, chooseEngineRoot, spawnJoyVasa, cancel, presetToArgs };
