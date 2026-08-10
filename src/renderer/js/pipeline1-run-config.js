/**
 * Pipeline 1 run configuration bridge.
 *
 * The approved Pipeline 1 UI no longer exposes the legacy AI/TTS enable
 * checkboxes that app.js used to read. This bridge snapshots the approved UI
 * into each idle P1 job immediately before the legacy Start All handler queues
 * the jobs.
 */

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
  const promptId = select?.value || localStorage.getItem('ai_active_prompt_id') || '';
  let prompts = [];
  try { prompts = JSON.parse(localStorage.getItem('ai_prompts') || '[]'); } catch { prompts = []; }
  const selected = Array.isArray(prompts) ? prompts.find(item => item?.id === promptId) : null;
  const prompt = selected?.content || localStorage.getItem('ai_prompt') || '';
  return { promptId, prompt: prompt.trim() };
}

function _failStart(event, message) {
  event.preventDefault();
  event.stopImmediatePropagation();
  if (typeof window.addLog === 'function') window.addLog(`[P1] ❌ ${message}`, 'error');
  if (typeof window.showToast === 'function') window.showToast(message, 'error', 5000);
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

  const provider = providerEl?.value || localStorage.getItem('ai_provider') || 'gemini';
  const model = (modelEl?.value || localStorage.getItem(`ai_model_${provider}`) || '').trim();
  const { promptId, prompt } = _resolvePrompt(promptEl);
  const voice = voiceEl?.value || localStorage.getItem('tts_voice') || 'none';
  const endpoint = localStorage.getItem('ai_endpoint') || (provider === 'ollama' ? 'http://localhost:11434/api/chat' : '');
  const apiKeys = _readProviderKeys(provider);

  if (!['gemini', 'deepseek', 'ollama'].includes(provider)) {
    _failStart(event, `Nhà cung cấp AI không hợp lệ: ${provider}`);
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

  // Persist values typed in the approved UI even if the field never lost focus.
  localStorage.setItem('ai_provider', provider);
  localStorage.setItem(`ai_model_${provider}`, model);
  if (promptId) localStorage.setItem('ai_active_prompt_id', promptId);
  localStorage.setItem('ai_prompt', prompt);
  localStorage.setItem('tts_voice', voice);
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
  };

  idleJobs.forEach(job => {
    // AI is a required stage of the approved P1 flow. TTS is enabled whenever
    // the user selected a voice; choosing "none" intentionally disables TTS.
    job.aiRewrite = true;
    job.ttsGenerate = ttsEnabled;
    job.ttsVoice = voice;
    job.p1Config = { ...snapshot };
    job._aiTriggered = false;
    job._ttsTriggered = false;
    job._ttsRunning = false;
  });

  if (typeof window.addLog === 'function') {
    window.addLog(
      `[P1] Cấu hình chạy: AI=${provider}/${model}; TTS=${ttsEnabled ? voice : 'tắt'}.`,
      'info'
    );
  }
}

const startButton = document.getElementById('btn-start-all');
if (startButton) {
  // Capture phase runs before the legacy app.js click handler, even though
  // app.js owns the actual queue transition.
  startButton.addEventListener('click', snapshotPipeline1RunConfig, true);
}

export { snapshotPipeline1RunConfig };
