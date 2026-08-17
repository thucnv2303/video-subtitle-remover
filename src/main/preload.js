const { contextBridge, ipcRenderer, webUtils } = require('electron');

async function cancelAnyP1Vision(payload) {
  const results = await Promise.allSettled([
    ipcRenderer.invoke('ollama:p1CancelVision', payload),
    ipcRenderer.invoke('ollama:p1CancelStandardVision', payload),
  ]);
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.cancelled) return result.value;
  }
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value?.ok) return result.value;
  }
  const failure = results.find(result => result.status === 'rejected');
  if (failure) throw failure.reason;
  return { ok: true, cancelled: false };
}

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: (filters) => ipcRenderer.invoke('dialog:openFile', filters),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFile: (defaultPath) => ipcRenderer.invoke('dialog:saveFile', defaultPath),
  saveCopy: (payload) => ipcRenderer.invoke('app:saveCopy', payload),
  startPython: () => ipcRenderer.invoke('python:start'),
  stopPython: () => ipcRenderer.invoke('python:stop'),
  getPythonStatus: () => ipcRenderer.invoke('python:status'),
  listOllamaModels: (endpoint) => ipcRenderer.invoke('ollama:listModels', endpoint),
  analyzeP1Vision: (payload) => ipcRenderer.invoke('ollama:p1AnalyzeVision', payload),
  analyzeP1StandardVision: (payload) => ipcRenderer.invoke('ollama:p1AnalyzeStandardVision', payload),
  fitP1Narration: (payload) => ipcRenderer.invoke('ollama:p1FitNarration', payload),
  cancelP1Vision: (payload) => cancelAnyP1Vision(payload),
  cancelP1StandardVision: (payload) => ipcRenderer.invoke('ollama:p1CancelStandardVision', payload),
  persistP1Audio: (payload) => ipcRenderer.invoke('p1:persistAudio', payload),
  prepareP1NarrationAudio: (payload) => ipcRenderer.invoke('p1:prepareNarrationAudio', payload),
  getPathForFile: (file) => webUtils.getPathForFile(file),
  openPath: (p) => ipcRenderer.invoke('app:openPath', p),
  getAppPath: () => ipcRenderer.invoke('app:getPath'),
  getSystemInfo: () => ipcRenderer.invoke('app:systemInfo'),
  mergeWavFiles: (inputPaths, outputPath) => ipcRenderer.invoke('voice-render:mergeWavFiles', inputPaths, outputPath),
  applyVoiceTempo: (inputPath, speedFactor) => ipcRenderer.invoke('voice-render:applyTempo', inputPath, speedFactor),
  burnP3SubtitleHq: (payload) => ipcRenderer.invoke('p3:burnSubtitleHq', payload),
  retimeP3Video: (payload) => ipcRenderer.invoke('p3:retimeVideo', payload),
  onPythonLog: (callback) => ipcRenderer.on('python:log', (e, msg) => callback(msg)),
  onPythonError: (callback) => ipcRenderer.on('python:error', (e, msg) => callback(msg)),
  onP1VisionProgress: (callback) => {
    const listener = (e, payload) => callback(payload);
    ipcRenderer.on('p1:vision-progress', listener);
    return () => ipcRenderer.removeListener('p1:vision-progress', listener);
  },
  platform: process.platform
});

function installOllamaModelScanner() {
  const provider = document.getElementById('ai-provider');
  const model = document.getElementById('ai-model');
  const group = document.getElementById('ai-model-group');
  const endpoint = document.getElementById('ai-endpoint');
  if (!provider || !model || !group || !endpoint) return false;
  if (document.getElementById('ollama-model-scan-row')) return true;

  const row = document.createElement('div');
  row.id = 'ollama-model-scan-row';
  row.style.cssText = 'display:none;grid-template-columns:auto minmax(0,1fr);gap:8px;margin-top:8px;align-items:center;';

  const scan = document.createElement('button');
  scan.id = 'btn-scan-ollama-models';
  scan.type = 'button';
  scan.className = 'approved-secondary-btn compact';
  scan.textContent = '↻ Quét model Ollama';

  const select = document.createElement('select');
  select.id = 'ollama-model-select';
  select.className = 'approved-input';
  select.disabled = true;
  select.innerHTML = '<option value="">Chưa quét model</option>';

  const status = document.createElement('p');
  status.id = 'ollama-model-scan-status';
  status.className = 'field-help';
  status.style.marginTop = '6px';

  row.append(scan, select);
  group.append(row, status);

  const syncVisibility = () => {
    const active = provider.value === 'ollama';
    row.style.display = active ? 'grid' : 'none';
    status.style.display = active ? 'block' : 'none';
  };

  const renderModels = (models) => {
    const current = model.value;
    select.innerHTML = '';
    if (!models.length) {
      select.innerHTML = '<option value="">Không có model local</option>';
      select.disabled = true;
      return;
    }
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Chọn model Ollama đã cài';
    select.appendChild(placeholder);
    models.forEach((name) => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    select.disabled = false;
    if (models.includes(current)) select.value = current;

    const suggestions = document.getElementById('ai-model-suggestions');
    if (suggestions) {
      suggestions.querySelectorAll('option[data-ollama-scanned="true"]').forEach((option) => option.remove());
      models.forEach((name) => {
        const option = document.createElement('option');
        option.value = name;
        option.dataset.ollamaScanned = 'true';
        suggestions.appendChild(option);
      });
    }
  };

  scan.addEventListener('click', async () => {
    scan.disabled = true;
    select.disabled = true;
    status.textContent = 'Đang quét model từ Ollama local...';
    try {
      const result = await ipcRenderer.invoke('ollama:listModels', endpoint.value);
      if (!result?.ok) {
        renderModels([]);
        status.textContent = result?.error || 'Không thể quét model Ollama.';
        return;
      }
      renderModels(result.models || []);
      status.textContent = result.models?.length
        ? `Đã tìm thấy ${result.models.length} model local.`
        : 'Ollama đang chạy nhưng chưa có model nào được cài.';
    } catch (err) {
      renderModels([]);
      status.textContent = err?.message || 'Không thể quét model Ollama.';
    } finally {
      scan.disabled = false;
    }
  });

  select.addEventListener('change', () => {
    if (!select.value) return;
    model.value = select.value;
    model.dispatchEvent(new Event('input', { bubbles: true }));
  });

  document.querySelectorAll('.provider-btn[data-provider]').forEach((button) => {
    button.addEventListener('click', () => setTimeout(syncVisibility, 0));
  });
  syncVisibility();
  return true;
}

function installFilePathCompatScript() {
  if (document.querySelector('script[data-file-path-compat]')) return;
  const script = document.createElement('script');
  script.src = 'js/file-path-compat.js';
  script.defer = false;
  script.dataset.filePathCompat = 'true';
  document.head.appendChild(script);
}

function installP1SpinnerPhaseScript() {
  if (document.querySelector('script[data-pipeline1-spinner-phase]')) return;
  const script = document.createElement('script');
  script.src = 'js/pipeline1-spinner-phase.js';
  script.defer = true;
  script.dataset.pipeline1SpinnerPhase = 'true';
  document.head.appendChild(script);
}

function installP1RunUxScript() {
  if (document.querySelector('script[data-pipeline1-run-ux]')) return;
  const script = document.createElement('script');
  script.src = 'js/pipeline1-run-ux.js';
  script.defer = true;
  script.dataset.pipeline1RunUx = 'true';
  document.head.appendChild(script);
}

function installP2RuntimeScript() {
  if (document.querySelector('script[data-pipeline2-runtime]')) return;
  const script = document.createElement('script');
  script.src = 'js/pipeline2-runtime.js';
  script.defer = true;
  script.dataset.pipeline2Runtime = 'true';
  document.head.appendChild(script);
}

function installVoiceRenderScript() {
  if (document.querySelector('script[data-voice-render]')) return;
  const script = document.createElement('script');
  script.src = 'js/voice-render.js';
  script.defer = true;
  script.dataset.voiceRender = 'true';
  document.head.appendChild(script);
}

function installVoiceRenderQualityFixScript() {
  if (document.querySelector('script[data-voice-render-quality-fix]')) return;
  const script = document.createElement('script');
  script.src = 'js/voice-render-quality-fix.js';
  script.defer = true;
  script.dataset.voiceRenderQualityFix = 'true';
  document.head.appendChild(script);
}

window.addEventListener('DOMContentLoaded', () => {
  installFilePathCompatScript();
  installP1SpinnerPhaseScript();
  installP1RunUxScript();
  installP2RuntimeScript();
  installVoiceRenderScript();
  installVoiceRenderQualityFixScript();
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (installOllamaModelScanner() || attempts >= 40) clearInterval(timer);
  }, 100);
});