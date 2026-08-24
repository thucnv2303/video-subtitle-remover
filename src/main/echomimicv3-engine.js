const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = 'C:\\VSR-EchoMimicV3';
const REPO = path.join(ROOT, 'repo');
const PYTHON = path.join(ROOT, 'venv', 'Scripts', 'python.exe');
const FLASH = path.join(ROOT, 'flash');
const WORKER = path.resolve(__dirname, '..', '..', 'scripts', 'echomimicv3-worker-v53.py');
const LOW_VRAM_MARKER = 'VSR_LOW_VRAM_OFFLOAD_V2';
const LONG_AUDIO_MARKER = 'VSR_LONG_AUDIO_V2';
const MMGP_MARKER = 'VSR_MMGP_V52';
const WORKER_PREFIX = 'VSR_WORKER_JSON ';
const BENCH_FRAMES = 49;

let workerChild = null;
let workerState = 'stopped';
let workerReadyPromise = null;
let workerReadyResolve = null;
let workerReadyReject = null;
let activeJob = null;
let bootEmitter = null;
let stdoutBuffer = '';

function assets() {
  return {
    script: path.join(REPO, 'infer_flash.py'),
    config: path.join(REPO, 'config', 'config.yaml'),
    model: path.join(FLASH, 'Wan2.1-Fun-V1.1-1.3B-InP'),
    audio: path.join(FLASH, 'chinese-wav2vec2-base'),
    transformer: path.join(FLASH, 'transformer', 'diffusion_pytorch_model.safetensors'),
  };
}

function status() {
  const a = assets();
  const required = [
    PYTHON,
    WORKER,
    a.script,
    a.config,
    path.join(a.model, 'config.json'),
    path.join(a.model, 'diffusion_pytorch_model.safetensors'),
    path.join(a.model, 'Wan2.1_VAE.pth'),
    path.join(a.model, 'models_t5_umt5-xxl-enc-bf16.pth'),
    path.join(a.model, 'models_clip_open-clip-xlm-roberta-large-vit-huge-14.pth'),
    path.join(a.audio, 'config.json'),
    a.transformer,
  ];
  const missing = required.filter(item => !fs.existsSync(item));
  let runtimeSource = '';
  if (fs.existsSync(a.script)) {
    try { runtimeSource = fs.readFileSync(a.script, 'utf8'); } catch (_) {}
  }
  const lowVramPatched = runtimeSource.includes(LOW_VRAM_MARKER);
  const longAudioPatched = runtimeSource.includes(LONG_AUDIO_MARKER);
  const mmgpV52Ready = runtimeSource.includes(MMGP_MARKER);
  if (!lowVramPatched) missing.push('EchoMimicV3 low-VRAM runtime patch V2');
  if (!longAudioPatched) missing.push('EchoMimicV3 long-audio runtime patch V2');
  if (!mmgpV52Ready) missing.push('EchoMimicV3 MMGP runtime V5.2');
  return {
    ok: missing.length === 0,
    name: 'EchoMimicV3 Flash',
    runtimeRoot: ROOT,
    missing,
    running: Boolean(activeJob),
    workerState,
    workerPid: workerChild?.pid || null,
    lowVramPatched,
    longAudioPatched,
    mmgpV52Ready,
    persistentWorkerV53: fs.existsSync(WORKER),
  };
}

function safeFile(value, exts, label) {
  const file = path.resolve(String(value || ''));
  if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Không tìm thấy ${label}.`);
  if (!exts.includes(path.extname(file).toLowerCase())) throw new Error(`${label} không đúng định dạng.`);
  return file;
}

function copyInput(source, dir, stem) {
  const target = path.join(dir, `${stem}${path.extname(source).toLowerCase()}`);
  fs.copyFileSync(source, target);
  return target;
}

function makeEmitter(event, runId) {
  return (type, message) => {
    if (!message || event.sender.isDestroyed()) return;
    event.sender.send('talking-portrait:progress', { runId, type, message: String(message).trim() });
  };
}

function clearWorkerReady(error) {
  if (error && workerReadyReject) workerReadyReject(error);
  workerReadyPromise = null;
  workerReadyResolve = null;
  workerReadyReject = null;
}

function settleActive(result) {
  if (!activeJob) return;
  const current = activeJob;
  activeJob = null;
  current.resolve(result);
}

function resetWorkerState() {
  workerChild = null;
  workerState = 'stopped';
  bootEmitter = null;
  stdoutBuffer = '';
}

function onWorkerControl(message) {
  const marker = message?.marker;
  const emit = activeJob?.emit || bootEmitter;
  if (marker && emit) emit(message.type === 'job_error' || message.type === 'fatal' ? 'error' : 'info', marker);

  if (message.type === 'ready') {
    workerState = 'ready';
    const resolve = workerReadyResolve;
    clearWorkerReady();
    if (resolve) resolve(message);
    return;
  }

  if (message.type === 'job_received' || message.type === 'pipeline_start') {
    workerState = 'busy';
    return;
  }

  if (message.type === 'pipeline_done' && activeJob?.emit) {
    activeJob.emit('info', `V5.3 ${message.warm ? 'warm' : 'first'} chunk: ${message.pipeline_seconds}s · peak CUDA ${message.peak_cuda_gb} GB`);
    return;
  }

  if (message.type === 'job_complete') {
    workerState = 'ready';
    const result = {
      ok: true,
      runId: activeJob?.runId,
      outputPath: message.output_path,
      outputDir: activeJob?.outputDir,
      engine: 'echomimicv3',
      ratio: 'source',
      profile: 'flash-8step-768-mmgp-v53-49f',
      benchmarkOnly: true,
      warm: Boolean(message.warm),
      pipelineSeconds: message.pipeline_seconds,
      peakCudaGb: message.peak_cuda_gb,
    };
    if (activeJob?.emit) activeJob.emit('success', `EchoMimicV3 V5.3 benchmark hoàn tất: ${message.output_path}`);
    settleActive(result);
    return;
  }

  if (message.type === 'job_error') {
    workerState = 'ready';
    settleActive({ ok: false, runId: activeJob?.runId, error: message.error || 'EchoMimicV3 worker job failed.' });
    return;
  }

  if (message.type === 'fatal') workerState = 'failed';
}

function consumeWorkerStdout(chunk) {
  stdoutBuffer += chunk.toString();
  let newline;
  while ((newline = stdoutBuffer.indexOf('\n')) >= 0) {
    const line = stdoutBuffer.slice(0, newline).replace(/\r$/, '');
    stdoutBuffer = stdoutBuffer.slice(newline + 1);
    if (!line) continue;
    if (line.startsWith(WORKER_PREFIX)) {
      try {
        onWorkerControl(JSON.parse(line.slice(WORKER_PREFIX.length)));
      } catch (error) {
        const emit = activeJob?.emit || bootEmitter;
        if (emit) emit('error', `V5.3 protocol parse error: ${error.message}`);
      }
    } else {
      const emit = activeJob?.emit || bootEmitter;
      if (emit) emit('info', line);
    }
  }
}

function startWorker(emit) {
  if (workerChild && (workerState === 'ready' || workerState === 'busy')) return Promise.resolve();
  if (workerReadyPromise) return workerReadyPromise;

  const ready = status();
  if (!ready.ok) return Promise.reject(new Error(`EchoMimicV3 V5.3 chưa sẵn sàng: ${ready.missing.join(', ')}`));

  const a = assets();
  workerState = 'booting';
  bootEmitter = emit;
  workerReadyPromise = new Promise((resolve, reject) => {
    workerReadyResolve = resolve;
    workerReadyReject = reject;
  });

  const args = [
    WORKER,
    '--repo', REPO,
    '--config', a.config,
    '--model', a.model,
    '--audio-model', a.audio,
    '--transformer', a.transformer,
  ];
  const child = spawn(PYTHON, args, {
    cwd: REPO,
    windowsHide: true,
    env: {
      ...process.env,
      PYTHONUTF8: '1',
      PYTHONIOENCODING: 'utf-8',
      PYTORCH_CUDA_ALLOC_CONF: 'expandable_segments:True',
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  workerChild = child;

  child.stdout.on('data', consumeWorkerStdout);
  child.stderr.on('data', data => {
    const emitLine = activeJob?.emit || bootEmitter;
    if (emitLine) emitLine('info', data.toString());
  });
  child.on('error', error => {
    workerState = 'failed';
    clearWorkerReady(error);
    settleActive({ ok: false, runId: activeJob?.runId, error: `Không khởi động được EchoMimicV3 V5.3 worker: ${error.message}` });
    resetWorkerState();
  });
  child.on('close', code => {
    const wasBusy = Boolean(activeJob);
    const error = new Error(`EchoMimicV3 V5.3 worker đã thoát với mã ${code}.`);
    clearWorkerReady(error);
    if (wasBusy) settleActive({ ok: false, runId: activeJob?.runId, error: error.message, code });
    resetWorkerState();
  });

  return workerReadyPromise;
}

async function generate(event, payload = {}) {
  if (activeJob) return { ok: false, error: 'Đang có một EchoMimicV3 job chạy.' };
  const ready = status();
  if (!ready.ok) return { ok: false, error: 'EchoMimicV3 Flash MMGP V5.3 chưa sẵn sàng.', status: ready };

  let image;
  let audio;
  try {
    image = safeFile(payload.imagePath, ['.jpg', '.jpeg', '.png', '.webp', '.bmp'], 'ảnh nhân vật');
    audio = safeFile(payload.audioPath, ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac'], 'voice');
  } catch (error) {
    return { ok: false, error: error.message };
  }

  const runId = `echo-${Date.now()}`;
  const runDir = path.join(ROOT, 'runs', runId);
  const outputDir = path.join(runDir, 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  image = copyInput(image, runDir, 'portrait');
  audio = copyInput(audio, runDir, 'voice');
  const emit = makeEmitter(event, runId);

  emit('info', 'Engine: EchoMimicV3 Flash · persistent worker V5.3 · MMGP · 8-step');
  emit('info', `Input staged: ${image}`);
  emit('info', `Voice staged: ${audio}`);
  emit('info', `V5.3 controlled benchmark: 768x768 · 25 FPS · ${BENCH_FRAMES} frames · persistent worker · MMGP LowRAM_HighVRAM 90% · TeaCache.`);

  try {
    await startWorker(emit);
  } catch (error) {
    return { ok: false, runId, error: error.message };
  }

  if (!workerChild || workerState !== 'ready') {
    return { ok: false, runId, error: `EchoMimicV3 worker không ở trạng thái READY (${workerState}).` };
  }

  const jobId = `${runId}-job`;
  return new Promise(resolve => {
    activeJob = { jobId, runId, outputDir, emit, resolve };
    workerState = 'busy';
    const command = JSON.stringify({
      command: 'render',
      job_id: jobId,
      image_path: image,
      audio_path: audio,
      output_dir: outputDir,
    });
    try {
      workerChild.stdin.write(`${command}\n`, 'utf8');
    } catch (error) {
      workerState = 'ready';
      settleActive({ ok: false, runId, error: `Không gửi được job tới EchoMimicV3 worker: ${error.message}` });
    }
  });
}

function cancel() {
  if (!workerChild) return { ok: true, cancelled: false };
  try {
    const pid = workerChild.pid;
    if (process.platform === 'win32' && pid) {
      const result = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { windowsHide: true });
      const accepted = result.status === 0;
      if (accepted) workerState = 'stopping';
      return { ok: accepted, cancelled: accepted, pid, workerRestartRequired: accepted };
    }
    const accepted = workerChild.kill('SIGTERM');
    if (accepted) workerState = 'stopping';
    return { ok: accepted, cancelled: accepted, pid, workerRestartRequired: accepted };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = { status, generate, cancel };
