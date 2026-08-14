import './pipeline1-run-ux.js';

/**
 * Pipeline 1 run configuration bridge.
 * Snapshots the approved UI before the legacy queue handler runs.
 */

const SEMANTIC_REMIX_KEY = 'p1_semantic_remix_enabled';

function _readProviderKeys(provider) {
  try {
    const raw = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]');
    return Array.isArray(raw)
      ? raw.map(item => typeof item === 'string' ? item : item?.key).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function _resolvePrompt(select) {
  const requestedId = select?.value || localStorage.getItem('ai_active_prompt_id') || '';
  let prompts = [];
  try {
    const parsed = JSON.parse(localStorage.getItem('ai_prompts') || '[]');
    prompts = Array.isArray(parsed) ? parsed : [];
  } catch {
    prompts = [];
  }
  const selected = prompts.find(item => item?.id === requestedId) || null;
  return {
    promptId: selected?.id || '',
    prompt: String(selected?.content || '').trim(),
  };
}

function _semanticRemixEnabled() {
  return localStorage.getItem(SEMANTIC_REMIX_KEY) === 'true';
}

function installSemanticRemixControl() {
  if (document.getElementById('step1-semantic-remix')) return true;
  const startButton = document.getElementById('btn-start-all');
  const actionRow = startButton?.parentElement;
  if (!startButton || !actionRow) return false;

  const group = document.createElement('div');
  group.id = 'step1-script-mode-group';
  group.className = 'tk-group';
  group.style.cssText = 'margin-top:12px;padding:10px;border:1px solid var(--border);border-radius:6px;background:var(--surface);';

  const row = document.createElement('label');
  row.style.cssText = 'display:flex;gap:9px;align-items:flex-start;cursor:pointer;';

  const checkbox = document.createElement('input');
  checkbox.id = 'step1-semantic-remix';
  checkbox.type = 'checkbox';
  checkbox.checked = _semanticRemixEnabled();
  checkbox.style.marginTop = '3px';

  const copy = document.createElement('span');
  copy.innerHTML = '<strong>Semantic Remix</strong><br><small style="color:var(--text-muted)">Phân tích video / sản phẩm / khách hàng và lập kế hoạch dựng lại theo cảnh. Mặc định tắt.</small>';

  row.append(checkbox, copy);
  group.appendChild(row);
  actionRow.insertAdjacentElement('beforebegin', group);
  if (!group.isConnected) return false;

  checkbox.addEventListener('change', () => {
    localStorage.setItem(SEMANTIC_REMIX_KEY, checkbox.checked ? 'true' : 'false');
    window.addLog?.(`[P1] ScriptMode=${checkbox.checked ? 'semantic-remix' : 'standard'} cho lần chạy tiếp theo.`, 'info');
  });
  return true;
}

function _failStart(event, message) {
  event.preventDefault();
  event.stopImmediatePropagation();
  window.addLog?.(`[P1] ❌ ${message}`, 'error');
  window.showToast?.(message, 'error', 5000);
}

function snapshotPipeline1RunConfig(event) {
  const state = window._appState;
  if (!state?.jobs) return;

  const idleJobs = state.jobs.filter(job => job.status === 'idle');
  if (idleJobs.length === 0) return;

  const providerEl = document.getElementById('step1-ai-provider');
  const modelEl = document.getElementById('step1-ai-model');
  const promptEl = document.getElementById('ai-prompt-select');
  const voiceEl = document.getElementById('step1-tts-voice');
  const speedEl = document.getElementById('step1-tts-speed');
  const semanticEl = document.getElementById('step1-semantic-remix');

  const provider = providerEl?.value || localStorage.getItem('ai_provider') || 'gemini';
  const model = (modelEl?.value || localStorage.getItem(`ai_model_${provider}`) || '').trim();
  const { promptId, prompt } = _resolvePrompt(promptEl);
  const voice = voiceEl?.value || localStorage.getItem('tts_voice') || 'none';
  const endpoint = localStorage.getItem('ai_endpoint') || (provider === 'ollama' ? 'http://localhost:11434/api/chat' : '');
  const apiKeys = _readProviderKeys(provider);
  const semanticRemixEnabled = semanticEl ? Boolean(semanticEl.checked) : _semanticRemixEnabled();

  if (!['gemini', 'deepseek', 'ollama'].includes(provider)) {
    _failStart(event, `Nhà cung cấp AI không hợp lệ: ${provider}`);
    return;
  }
  if (provider !== 'ollama') {
    _failStart(event, 'Pipeline 1 multimodal hiện chỉ mở cho Ollama local. Cloud provider chưa được phép fallback text-only.');
    return;
  }
  if (!model) {
    _failStart(event, 'Hãy chọn model AI trước khi chạy Pipeline 1.');
    return;
  }
  if (!prompt) {
    _failStart(event, 'Hãy chọn hoặc cấu hình Prompt trước khi chạy Pipeline 1.');
    return;
  }
  if (provider !== 'ollama' && apiKeys.length === 0) {
    _failStart(event, `Chưa có API key cho ${provider}. Hãy cấu hình trong Cài đặt.`);
    return;
  }

  localStorage.setItem('ai_provider', provider);
  localStorage.setItem(`ai_model_${provider}`, model);
  if (promptId) localStorage.setItem('ai_active_prompt_id', promptId);
  localStorage.setItem('ai_prompt', prompt);
  localStorage.setItem('tts_voice', voice);
  localStorage.setItem(SEMANTIC_REMIX_KEY, semanticRemixEnabled ? 'true' : 'false');
  if (speedEl?.value) localStorage.setItem('tts_speed', speedEl.value);

  const ttsEnabled = Boolean(voice && voice !== 'none');
  const snapshot = {
    provider,
    model,
    promptId,
    prompt,
    endpoint,
    ttsVoice: voice,
    ttsEnabled,
    ttsSpeed: Number(speedEl?.value || localStorage.getItem('tts_speed') || 1),
    analysisMode: 'multimodal-keyframes-v1',
    semanticRemixEnabled,
  };

  idleJobs.forEach(job => {
    job.aiRewrite = true;
    job.ttsGenerate = ttsEnabled;
    job.ttsVoice = voice;
    job.asrLanguage = 'auto';
    job.p1Config = { ...snapshot };
    job.p1ArtifactsReady = false;
    job.p1Analysis = null;
    job.p1Artifacts = null;
    job._p1DurationCheckpoint = null;
    job._aiTriggered = false;
    job._ttsTriggered = false;
    job._ttsRunning = false;
    job._p1Cancelled = false;
    job._p1StopRequested = false;
  });

  window.addLog?.(
    `[P1] Cấu hình chạy: ASR=auto; Analysis=multimodal; ScriptMode=${semanticRemixEnabled ? 'semantic-remix' : 'standard'}; AI=${provider}/${model}; TTS=${ttsEnabled ? voice : 'tắt'}.`,
    'info'
  );
}

let attempts = 0;
const controlTimer = setInterval(() => {
  attempts += 1;
  if (installSemanticRemixControl() || attempts >= 40) clearInterval(controlTimer);
}, 100);

const startButton = document.getElementById('btn-start-all');
if (startButton) startButton.addEventListener('click', snapshotPipeline1RunConfig, true);

export { snapshotPipeline1RunConfig, installSemanticRemixControl };
