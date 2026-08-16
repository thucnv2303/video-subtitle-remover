import './pipeline1-run-ux.js';
import './pipeline1-log-router.js';
import './pipeline3/editor.js';
import './pipeline3/subtitle-resize-effects.js';
import './pipeline3/subtitle-style-engine.js';
import './pipeline3/runtime-fix-rev4.js';
import './pipeline3/subtitle-motion.js';
import { installPerJobSemanticRemixControls } from './pipeline1-semantic-remix-per-job.js';

/**
 * Pipeline 1 run configuration bridge.
 * Snapshots shared run settings plus each Job's own Semantic Remix choice.
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

function installSemanticRemixControl() {
  installPerJobSemanticRemixControls();
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
  if (speedEl?.value) localStorage.setItem('tts_speed', speedEl.value);

  const ttsEnabled = Boolean(voice && voice !== 'none');
  const sharedSnapshot = {
    provider,
    model,
    promptId,
    prompt,
    endpoint,
    ttsVoice: voice,
    ttsEnabled,
    ttsSpeed: Number(speedEl?.value || localStorage.getItem('tts_speed') || 1),
    analysisMode: 'multimodal-keyframes-v1',
  };

  let remixCount = 0;
  idleJobs.forEach(job => {
    const semanticRemixEnabled = Boolean(job.semanticRemixEnabled);
    if (semanticRemixEnabled) remixCount += 1;

    job.aiRewrite = true;
    job.ttsGenerate = ttsEnabled;
    job.ttsVoice = voice;
    job.asrLanguage = 'auto';
    job.p1Config = { ...sharedSnapshot, semanticRemixEnabled };
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
    `[P1] Cấu hình chạy: ASR=auto; Analysis=multimodal; Remix=${remixCount}/${idleJobs.length} jobs; AI=${provider}/${model}; TTS=${ttsEnabled ? voice : 'tắt'}.`,
    'info'
  );
}

installSemanticRemixControl();

const startButton = document.getElementById('btn-start-all');
if (startButton) startButton.addEventListener('click', snapshotPipeline1RunConfig, true);

export { snapshotPipeline1RunConfig, installSemanticRemixControl };
