import { state } from '../store.js';
import { addLog } from '../utils/logger.js';

const OLLAMA_DEFAULT = 'http://localhost:11434/api/chat';
const $ = id => document.getElementById(id);
const value = id => $(id)?.value ?? '';
const toast = (message, type = 'info') => window.showToast?.(message, type);

export function initSettings() {
  upgradeAiUi();
  installPipeline2Guard();
  bindAiEvents();
  bindCommonEvents();
  renderSavedVoices();
  loadSettingsValues();
}

export function loadSettingsValues() {
  const provider = localStorage.getItem('ai_provider') || 'gemini';
  if ($('ai-provider')) $('ai-provider').value = provider;
  if ($('ai-cloud-keys')) $('ai-cloud-keys').value = loadKeys(provider).join('\n');
  if ($('ai-cloud-model')) $('ai-cloud-model').value = localStorage.getItem(`ai_model_${provider}`) || '';
  if ($('ai-endpoint')) $('ai-endpoint').value = localStorage.getItem('ai_endpoint') || OLLAMA_DEFAULT;
  if ($('ai-ollama-model-custom')) $('ai-ollama-model-custom').value = localStorage.getItem('ai_model_ollama') || '';
  if ($('ai-prompt')) $('ai-prompt').value = localStorage.getItem('ai_prompt') || $('ai-prompt').defaultValue || '';
  if ($('tts-voice')) $('tts-voice').value = localStorage.getItem('tts_voice') || 'none';
  if ($('tts-language')) $('tts-language').value = localStorage.getItem('tts_language') || 'vi';
  if ($('tts-remove-vocal')) $('tts-remove-vocal').checked = localStorage.getItem('tts_remove_vocal') === 'true';
  if ($('tts-bg-volume')) {
    $('tts-bg-volume').value = localStorage.getItem('tts_bg_volume') || '10';
    if ($('vol-label')) $('vol-label').textContent = `${$('tts-bg-volume').value}%`;
  }
  if ($('output-dir-text')) $('output-dir-text').textContent = state.outputDir || localStorage.getItem('output_dir') || 'Mặc định (cùng thư mục video gốc)';
  syncProviderPanels();
  updateVoiceDropdown(getSavedVoices());
}

function upgradeAiUi() {
  const provider = $('ai-provider');
  const oldKey = $('ai-api-key');
  if (!provider || !oldKey || $('ai-provider-config')) return;
  oldKey.closest('.form-group')?.remove();
  $('ai-endpoint')?.closest('.form-group')?.remove();
  const wrapper = document.createElement('div');
  wrapper.id = 'ai-provider-config';
  wrapper.innerHTML = `
    <div id="ai-cloud-panel">
      <div class="form-group"><label class="form-label">API key của nhà cung cấp</label>
        <textarea id="ai-cloud-keys" class="form-input" rows="3" autocomplete="off" spellcheck="false" placeholder="Mỗi dòng một API key"></textarea>
        <div class="form-help">Chỉ lưu trên máy này; không gửi sang Pipeline 2.</div></div>
      <div class="form-group"><label class="form-label">Model</label>
        <input id="ai-cloud-model" class="form-input" autocomplete="off" placeholder="Để trống để dùng model mặc định"></div>
    </div>
    <div id="ai-ollama-panel" hidden>
      <div class="form-group"><label class="form-label">Ollama endpoint</label><input id="ai-endpoint" class="form-input" value="${OLLAMA_DEFAULT}"></div>
      <div class="form-group"><label class="form-label">Model Ollama</label>
        <div style="display:flex;gap:8px"><select id="ai-ollama-model-select" class="dropdown form-input"><option value="">Bấm Quét model</option></select>
        <button id="btn-scan-ollama" class="btn btn-secondary" type="button">Quét model</button></div>
        <input id="ai-ollama-model-custom" class="form-input" style="margin-top:8px" placeholder="Hoặc nhập tên model"></div>
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin:10px 0"><button id="btn-test-ai-provider" class="btn btn-secondary" type="button">Kiểm tra kết nối</button><span id="ai-provider-status" class="status-chip">Chưa kiểm tra</span></div>`;
  provider.closest('.form-group')?.insertAdjacentElement('afterend', wrapper);
}

function bindAiEvents() {
  $('ai-provider')?.addEventListener('change', () => {
    const provider = value('ai-provider');
    if ($('ai-cloud-keys')) $('ai-cloud-keys').value = loadKeys(provider).join('\n');
    if ($('ai-cloud-model')) $('ai-cloud-model').value = localStorage.getItem(`ai_model_${provider}`) || '';
    setAiStatus('Chưa kiểm tra');
    syncProviderPanels();
  });
  $('ai-ollama-model-select')?.addEventListener('change', event => { if (event.target.value && $('ai-ollama-model-custom')) $('ai-ollama-model-custom').value = event.target.value; });
  $('btn-scan-ollama')?.addEventListener('click', scanOllama);
  $('btn-test-ai-provider')?.addEventListener('click', testProvider);
  $('btn-save-ai')?.addEventListener('click', () => { saveAll(); addLog('Đã lưu cấu hình AI & TTS!', 'success'); toast('Đã lưu cài đặt!', 'success'); });
}

function syncProviderPanels() {
  const ollama = value('ai-provider') === 'ollama';
  if ($('ai-cloud-panel')) $('ai-cloud-panel').hidden = ollama;
  if ($('ai-ollama-panel')) $('ai-ollama-panel').hidden = !ollama;
}

async function scanOllama() {
  const button = $('btn-scan-ollama');
  if (!window.electronAPI?.listOllamaModels) return setAiStatus('Cần chạy trong Electron app', 'offline');
  button.disabled = true; button.textContent = 'Đang quét...'; setAiStatus('Đang kết nối...');
  try {
    const result = await window.electronAPI.listOllamaModels(value('ai-endpoint') || OLLAMA_DEFAULT);
    if (result.status !== 'ok') throw new Error(result.error || 'Không thể quét Ollama');
    $('ai-endpoint').value = result.endpoint;
    const select = $('ai-ollama-model-select');
    select.innerHTML = '<option value="">Chọn model</option>';
    result.models.forEach(name => select.append(new Option(name, name)));
    const saved = localStorage.getItem('ai_model_ollama') || '';
    if (result.models.includes(saved)) select.value = saved;
    setAiStatus(`Ollama online — ${result.models.length} model`, 'online');
  } catch (error) { setAiStatus(error.message, 'offline'); }
  finally { button.disabled = false; button.textContent = 'Quét model'; }
}

async function testProvider() {
  const provider = value('ai-provider') || 'gemini';
  const button = $('btn-test-ai-provider');
  button.disabled = true; button.textContent = 'Đang kiểm tra...';
  try {
    if (provider === 'ollama') {
      const model = value('ai-ollama-model-custom').trim() || value('ai-ollama-model-select').trim();
      if (!model) throw new Error('Chưa chọn model Ollama.');
      if (!window.electronAPI?.ollamaChat) throw new Error('Cần chạy trong Electron app.');
      const result = await window.electronAPI.ollamaChat({ endpoint: value('ai-endpoint') || OLLAMA_DEFAULT, model, messages: [{ role: 'user', content: 'Reply with exactly: OK' }] });
      if (result.status !== 'ok') throw new Error(result.error || 'Ollama test failed');
      setAiStatus(`Kết nối thành công: ${model}`, 'online');
    } else {
      if (readKeys().length === 0) throw new Error('Chưa nhập API key.');
      setAiStatus('Cấu hình hợp lệ; key sẽ được kiểm tra khi chạy AI', 'online');
    }
  } catch (error) { setAiStatus(error.message, 'offline'); }
  finally { button.disabled = false; button.textContent = 'Kiểm tra kết nối'; }
}

function saveAll() {
  const provider = value('ai-provider') || 'gemini';
  localStorage.setItem('ai_provider', provider);
  localStorage.setItem('ai_prompt', value('ai-prompt'));
  localStorage.setItem('tts_voice', value('tts-voice'));
  localStorage.setItem('tts_language', value('tts-language'));
  localStorage.setItem('tts_bg_volume', value('tts-bg-volume'));
  localStorage.setItem('tts_remove_vocal', String($('tts-remove-vocal')?.checked || false));
  if (provider === 'ollama') {
    const model = value('ai-ollama-model-custom').trim() || value('ai-ollama-model-select').trim();
    localStorage.setItem('ai_endpoint', value('ai-endpoint').trim() || OLLAMA_DEFAULT);
    localStorage.setItem('ai_model_ollama', model);
    localStorage.removeItem('ai_api_key');
    localStorage.removeItem('ai_api_keys_ollama');
  } else {
    const keys = readKeys();
    localStorage.setItem(`ai_api_keys_${provider}`, JSON.stringify(keys.map(key => ({ key }))));
    localStorage.setItem(`ai_model_${provider}`, value('ai-cloud-model').trim());
    keys[0] ? localStorage.setItem('ai_api_key', keys[0]) : localStorage.removeItem('ai_api_key');
  }
}

function readKeys() { return [...new Set(value('ai-cloud-keys').split(/\r?\n|,/).map(item => item.trim()).filter(Boolean))]; }
function loadKeys(provider) { try { const data = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]'); return Array.isArray(data) ? data.map(item => item?.key || item).filter(Boolean) : []; } catch { return []; } }
function setAiStatus(text, stateName = '') { if ($('ai-provider-status')) { $('ai-provider-status').textContent = text; $('ai-provider-status').className = `status-chip${stateName ? ` ${stateName}` : ''}`; } }

function installPipeline2Guard() {
  const api = window.api;
  if (!api?.startProcessBatch || api.__pipeline2AiGuardInstalled) return;
  const original = api.startProcessBatch.bind(api);
  api.startProcessBatch = jobs => original((Array.isArray(jobs) ? jobs : []).map(job => {
    const safe = { ...job, ai_rewrite: false, tts_voice: 'none' };
    ['ai_config', 'api_key', 'api_keys', 'provider', 'model', 'endpoint'].forEach(key => delete safe[key]);
    return safe;
  }));
  api.__pipeline2AiGuardInstalled = true;
}

export function getSavedVoices() { try { return JSON.parse(localStorage.getItem('tts_voices') || '[]'); } catch { return []; } }
function saveVoices(voices) { localStorage.setItem('tts_voices', JSON.stringify(voices)); }
function escapeHtml(text) { return String(text ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }

export function renderSavedVoices() {
  const voices = getSavedVoices();
  const list = $('saved-voices-list');
  if (!list) return;
  list.innerHTML = voices.length ? voices.map((voice, index) => `<div class="voice-card"><div class="voice-icon">🎙</div><div class="voice-info"><div class="voice-name">${escapeHtml(voice.name)}</div><div class="voice-meta">${escapeHtml(voice.audioFile)} • ${escapeHtml(voice.date)}</div></div><button class="btn-voice-del" data-idx="${index}">✕</button></div>`).join('') : '<div class="voice-empty">Chưa có giọng clone nào.</div>';
  updateVoiceDropdown(voices);
  list.querySelectorAll('.btn-voice-del').forEach(button => button.addEventListener('click', () => { const next = getSavedVoices(); next.splice(Number(button.dataset.idx), 1); saveVoices(next); renderSavedVoices(); toast('Đã xóa giọng!', 'info'); }));
}

export function updateVoiceDropdown(voices) {
  [$('tts-voice'), $('job-tts-voice'), $('step1-tts-voice')].filter(Boolean).forEach(select => {
    [...select.options].filter(option => option.value.startsWith('clone:')).forEach(option => option.remove());
    voices.forEach((voice, index) => select.append(new Option(`🎤 ${voice.name}`, `clone:${index}`)));
    const saved = localStorage.getItem('tts_voice') || 'none';
    if ([...select.options].some(option => option.value === saved)) select.value = saved;
  });
}

export async function checkTTSStatus() {
  const chip = $('tts-status-chip');
  if (!chip) return;
  try { const status = await (await fetch('http://localhost:8765/api/tts/status')).json(); chip.textContent = status.available ? 'Sẵn sàng' : 'Chưa cài OmniVoice'; chip.className = `status-chip ${status.available ? 'online' : 'offline'}`; }
  catch { chip.textContent = 'Backend chưa kết nối'; chip.className = 'status-chip offline'; setTimeout(checkTTSStatus, 10000); }
}

function bindCommonEvents() {
  $('tts-bg-volume')?.addEventListener('input', event => { if ($('vol-label')) $('vol-label').textContent = `${event.target.value}%`; });
  $('btn-output-dir')?.addEventListener('click', async () => { const result = await window.electronAPI?.openDirectory?.(); const dir = result && !result.canceled && result.filePaths?.[0]; if (dir) { state.outputDir = dir; localStorage.setItem('output_dir', dir); if ($('output-dir-text')) $('output-dir-text').textContent = dir; } });
  bindVoiceClone();
  bindTestTts();
}

let refAudioPath = null;
function bindVoiceClone() {
  $('btn-upload-ref-audio')?.addEventListener('click', async () => {
    const result = await window.electronAPI?.openFile?.([{ name: 'Audio', extensions: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus'] }]);
    const path = result && !result.canceled && result.filePaths?.[0];
    if (!path) return;
    refAudioPath = path;
    if ($('ref-audio-name')) $('ref-audio-name').textContent = path.split(/[\\/]/).pop();
    if ($('ref-audio-preview')) { $('ref-audio-preview').src = `file:///${path.replace(/\\/g, '/')}`; $('ref-audio-preview').style.display = ''; }
    if ($('btn-clone-voice')) $('btn-clone-voice').disabled = false;
  });
  $('btn-clone-voice')?.addEventListener('click', async event => {
    const name = value('clone-voice-name').trim();
    if (!name || !refAudioPath) return toast('Nhập tên và chọn audio mẫu!', 'warn');
    const button = event.target;
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Đang tạo mẫu...';
    try {
      const result = await window.api.generateTTS('Xin chào, đây là giọng được clone bởi OmniVoice.', refAudioPath, value('tts-language') || 'vi');
      if (result.status !== 'ok' || !result.audio_path) throw new Error(result.error || 'Unknown');
      const voices = getSavedVoices();
      voices.push({ name, audioPath: refAudioPath, audioFile: refAudioPath.split(/[\\/]/).pop(), samplePath: result.audio_path, date: new Date().toLocaleDateString('vi-VN') });
      saveVoices(voices);
      renderSavedVoices();
      const selected = `clone:${voices.length - 1}`;
      localStorage.setItem('tts_voice', selected);
      if ($('tts-voice')) $('tts-voice').value = selected;
      if ($('tts-test-audio')) { $('tts-test-audio').src = `file:///${result.audio_path.replace(/\\/g, '/')}`; $('tts-test-audio').style.display = ''; await $('tts-test-audio').play().catch(() => {}); }
      if ($('clone-voice-name')) $('clone-voice-name').value = '';
      if ($('ref-audio-name')) $('ref-audio-name').textContent = 'Chưa chọn file';
      if ($('ref-audio-preview')) { $('ref-audio-preview').removeAttribute('src'); $('ref-audio-preview').style.display = 'none'; }
      refAudioPath = null;
      toast('Clone giọng thành công!', 'success');
    } catch (error) { addLog(`[TTS] Clone thất bại: ${error.message}`, 'error'); toast(error.message, 'error'); }
    finally { button.disabled = false; button.textContent = originalText; }
  });
}

function bindTestTts() {
  $('btn-test-tts')?.addEventListener('click', async event => {
    const text = value('tts-test-text').trim(); if (!text) return toast('Nhập text để thử!', 'warn');
    const voice = value('tts-voice') || 'default'; const ref = voice.startsWith('clone:') ? getSavedVoices()[Number(voice.split(':')[1])]?.audioPath || null : null;
    event.target.disabled = true;
    try { const result = await window.api.generateTTS(text, ref, value('tts-language') || 'vi', voice); if (result.status !== 'ok') throw new Error(result.error || 'Unknown'); if ($('tts-test-audio')) { $('tts-test-audio').src = `file:///${result.audio_path.replace(/\\/g, '/')}`; $('tts-test-audio').style.display = ''; await $('tts-test-audio').play(); } }
    catch (error) { toast(error.message, 'error'); } finally { event.target.disabled = false; }
  });
}
