/**
 * Settings Component
 * Quản lý trang Cài đặt: load/save AI keys, TTS config, output directory,
 * voice clone management, TTS status check.
 */

import { state, saveState } from '../store.js';
import { addLog, showToast } from '../utils/logger.js';

let initialPersistedProvider = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSettings() {
  _bindVolSlider();
  _bindSaveButton();
  _bindOutputDirButton();
  _bindVoiceClone();
  _bindTestTts();
  _bindProviderSelect();
  _bindDiagnosticsRefresh();
  renderSavedVoices();
  refreshDiagnostics();
}

// ─── Provider Isolation & Migration ──────────────────────────────────────────

export function getApiKeyForProvider(provider) {
  if (provider === 'ollama') {
    return localStorage.getItem('ai_model_ollama') || '';
  }

  const rawSpecific = localStorage.getItem(`ai_api_keys_${provider}`);
  if (rawSpecific) {
    try {
      const parsed = JSON.parse(rawSpecific);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].key) {
        return parsed[0].key;
      }
    } catch {
      if (typeof rawSpecific === 'string' && rawSpecific.trim()) {
        return rawSpecific.trim();
      }
    }
  }

  // Fallback to legacy key ONLY when provider matches initialPersistedProvider
  if (provider === initialPersistedProvider) {
    const legacyKey = (localStorage.getItem('ai_api_key') || '').trim();
    if (legacyKey) {
      const keys = [{ key: legacyKey }];
      localStorage.setItem(`ai_api_keys_${provider}`, JSON.stringify(keys));
      return legacyKey;
    }
  }

  return '';
}

function _updateProviderUI(provider) {
  const get = (id) => document.getElementById(id);
  const aiApiKey = get('ai-api-key');
  const aiModel = get('ai-model');
  const aiEndpoint = get('ai-endpoint');
  const keyLabel = get('ai-api-key-label');
  const modelGroup = get('ai-model-group');

  if (aiModel) {
    aiModel.value = localStorage.getItem('ai_model_' + provider) || '';
  }

  if (provider === 'ollama') {
    if (aiApiKey && aiApiKey.parentElement) aiApiKey.parentElement.style.display = 'none';
    if (modelGroup) modelGroup.style.display = 'none';
    if (aiEndpoint) {
      aiEndpoint.value = localStorage.getItem('ai_endpoint') || 'http://localhost:11434/api/chat';
      if (aiEndpoint.parentElement) aiEndpoint.parentElement.style.display = '';
    }
  } else {
    if (aiApiKey) {
      if (aiApiKey.parentElement) aiApiKey.parentElement.style.display = '';
      if (keyLabel) keyLabel.textContent = 'API Key';
      aiApiKey.value = getApiKeyForProvider(provider);
      aiApiKey.placeholder = `Nhập API Key cho ${provider === 'gemini' ? 'Google Gemini' : 'DeepSeek'}...`;
    }
    if (modelGroup) modelGroup.style.display = '';
    if (aiEndpoint) {
      if (aiEndpoint.parentElement) {
        aiEndpoint.parentElement.style.display = 'none';
      }
    }
  }
}

function _bindProviderSelect() {
  const sel = document.getElementById('ai-provider');
  if (sel) {
    sel.addEventListener('change', () => {
      _updateProviderUI(sel.value);
    });
  }
}

// ─── Load / Save Settings Values ─────────────────────────────────────────────

export function loadSettingsValues() {
  const get = (id) => document.getElementById(id);

  const aiProvider  = get('ai-provider');
  const aiPrompt    = get('ai-prompt');
  const ttsVoice    = get('tts-voice');
  const ttsLang     = get('tts-language');
  const ttsBgVol    = get('tts-bg-volume');
  const volLabel    = get('vol-label');
  const removeVocal = get('tts-remove-vocal');
  const outputDir   = get('output-dir-text');

  const storedProvider = localStorage.getItem('ai_provider') || 'gemini';
  initialPersistedProvider = storedProvider;

  if (aiProvider) {
    aiProvider.value = storedProvider;
  }

  _updateProviderUI(storedProvider);

  if (aiPrompt)    aiPrompt.value    = localStorage.getItem('ai_prompt')    || (aiPrompt?.defaultValue || '');
  if (ttsVoice)    ttsVoice.value    = localStorage.getItem('tts_voice')    || 'none';
  if (ttsLang)     ttsLang.value     = localStorage.getItem('tts_language') || 'vi';
  if (removeVocal) removeVocal.checked = localStorage.getItem('tts_remove_vocal') === 'true';
  if (ttsBgVol) {
    ttsBgVol.value = localStorage.getItem('tts_bg_volume') || '10';
    if (volLabel) volLabel.textContent = ttsBgVol.value + '%';
  }
  if (outputDir) {
    const dir = state.outputDir || localStorage.getItem('output_dir') || '';
    outputDir.textContent = dir || 'Mặc định (cùng thư mục video gốc)';
  }



  updateVoiceDropdown(getSavedVoices());
  refreshDiagnostics();
}

function _saveAllSettings() {
  const get = (id) => document.getElementById(id);
  const val = (id) => get(id)?.value ?? '';
  const chk = (id) => get(id)?.checked ?? false;

  const provider = val('ai-provider') || 'gemini';
  const keyInput = val('ai-api-key').trim();
  const modelInput = val('ai-model').trim();
  const endpointInput = val('ai-endpoint').trim();

  localStorage.setItem('ai_provider', provider);
  if (modelInput) {
    localStorage.setItem('ai_model_' + provider, modelInput);
  }

  if (provider === 'ollama') {
    if (endpointInput) localStorage.setItem('ai_endpoint', endpointInput);
  } else {
    const keys = keyInput ? [{ key: keyInput }] : [];
    localStorage.setItem(`ai_api_keys_${provider}`, JSON.stringify(keys));
  }

  localStorage.setItem('ai_prompt', val('ai-prompt'));
  localStorage.setItem('tts_voice', val('tts-voice'));
  localStorage.setItem('tts_language', val('tts-language'));
  localStorage.setItem('tts_bg_volume', val('tts-bg-volume'));
  localStorage.setItem('tts_remove_vocal', chk('tts-remove-vocal'));
}

// ─── Voice Clone Management ───────────────────────────────────────────────────

export function getSavedVoices() {
  try { return JSON.parse(localStorage.getItem('tts_voices') || '[]'); }
  catch { return []; }
}

function _saveSavedVoices(voices) {
  localStorage.setItem('tts_voices', JSON.stringify(voices));
}

export function renderSavedVoices() {
  const voices = getSavedVoices();
  const list   = document.getElementById('saved-voices-list');
  if (!list) return;

  if (voices.length === 0) {
    list.innerHTML = '<div class="voice-empty">Chưa có giọng clone nào.</div>';
  } else {
    list.innerHTML = voices.map((v, i) => `
      <div class="voice-card">
        <div class="voice-icon">🎙</div>
        <div class="voice-info">
          <div class="voice-name">${v.name}</div>
          <div class="voice-meta">${v.audioFile} • ${v.date}</div>
        </div>
        <div class="voice-actions">
          <button class="btn-voice-del" data-idx="${i}" title="Xóa">✕</button>
        </div>
      </div>`).join('');
  }

  updateVoiceDropdown(voices);

  // Bind delete buttons
  list.querySelectorAll('.btn-voice-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const vs  = getSavedVoices();
      vs.splice(idx, 1);
      _saveSavedVoices(vs);
      renderSavedVoices();
      showToast(document.getElementById('toast-container') ? { toast: document.querySelector('.toast') } : {}, 'Đã xóa giọng!', 'info');
      _showGlobalToast('Đã xóa giọng!', 'info');
    });
  });
}

export function updateVoiceDropdown(voices) {
  // Cập nhật tất cả dropdown chọn voice trong app
  const dropdowns = [
    document.getElementById('tts-voice'),
    document.getElementById('job-tts-voice'),
    document.getElementById('step1-tts-voice'),
  ].filter(Boolean);

  dropdowns.forEach(sel => {
    // Xóa các option clone cũ (giữ lại các option mặc định: none, default, Edge TTS voices)
    const toRemove = [];
    for (const opt of sel.options) {
      if (opt.value.startsWith('clone:')) toRemove.push(opt);
    }
    toRemove.forEach(opt => opt.remove());

    // Thêm lại từ danh sách mới
    voices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value       = `clone:${i}`;
      opt.textContent = `🎤 ${v.name}`;
      sel.appendChild(opt);
    });

    // Khôi phục giá trị đã chọn
    const saved = localStorage.getItem('tts_voice') || 'none';
    if ([...sel.options].some(o => o.value === saved)) sel.value = saved;
  });
}

// ─── System / Diagnostics Check Functions ─────────────────────────────────────

export async function refreshDiagnostics() {
  await Promise.all([
    checkBackendHealth(),
    checkGPUInfo(),
    checkTTSStatus()
  ]);
}

export async function checkBackendHealth() {
  const chip = document.getElementById('backend-status-chip');
  if (!chip) return;
  try {
    const res = await window.api.health();
    if (res && (res.status === 'ok' || res.status === 'healthy' || res.health === 'ok')) {
      chip.textContent = 'Đã kết nối';
      chip.className = 'status-chip online';
    } else {
      chip.textContent = 'Phản hồi lạ';
      chip.className = 'status-chip offline';
    }
  } catch {
    chip.textContent = 'Mất kết nối';
    chip.className = 'status-chip offline';
  }
}

export async function checkGPUInfo() {
  const chip = document.getElementById('gpu-status-chip');
  const detail = document.getElementById('gpu-detail');
  const cuda = document.getElementById('cuda-version');
  if (!chip && !detail) return;

  try {
    const res = await window.api.gpuInfo();
    if (res && res.gpu_available === true) {
      if (chip) {
        chip.textContent = 'GPU (CUDA)';
        chip.className = 'status-chip online';
      }
      if (detail) detail.textContent = res.gpu_name || 'NVIDIA GPU';
      if (cuda) cuda.textContent = res.cuda_version || 'CUDA';
    } else if (res && res.gpu_available === false) {
      // CPU-only is a valid NON-ERROR state!
      if (chip) {
        chip.textContent = 'CPU Mode';
        chip.className = 'status-chip neutral';
      }
      if (detail) detail.textContent = 'CPU Mode (Không dùng GPU)';
      if (cuda) cuda.textContent = 'N/A';
    } else {
      if (chip) {
        chip.textContent = 'Lỗi GPU';
        chip.className = 'status-chip offline';
      }
      if (detail) detail.textContent = 'Thông tin GPU không hợp lệ';
      if (cuda) cuda.textContent = 'Lỗi';
    }
  } catch {
    if (chip) {
      chip.textContent = 'Lỗi GPU';
      chip.className = 'status-chip offline';
    }
    if (detail) detail.textContent = 'Không thể kiểm tra GPU';
    if (cuda) cuda.textContent = 'Lỗi';
  }
}

export async function checkTTSStatus() {
  const chip = document.getElementById('tts-status-chip');
  if (!chip) return;
  try {
    const status = await window.api.getTTSStatus();
    if (status && status.available) {
      chip.textContent = 'Sẵn sàng';
      chip.className = 'status-chip online';
    } else {
      chip.textContent = 'Chưa cài OmniVoice';
      chip.className = 'status-chip offline';
    }
  } catch {
    chip.textContent = 'Backend chưa kết nối';
    chip.className = 'status-chip offline';
  }
}

function _bindDiagnosticsRefresh() {
  const btn = document.getElementById('btn-refresh-diagnostics');
  if (btn) {
    btn.addEventListener('click', () => {
      refreshDiagnostics();
    });
  }
}

// ─── Bindings ─────────────────────────────────────────────────────────────────

function _bindVolSlider() {
  const slider   = document.getElementById('tts-bg-volume');
  const volLabel = document.getElementById('vol-label');
  if (slider && volLabel) {
    slider.addEventListener('input', () => {
      volLabel.textContent = slider.value + '%';
    });
  }
}

function _bindSaveButton() {
  const btn = document.getElementById('btn-save-ai');
  if (!btn) return;
  btn.addEventListener('click', () => {
    _saveAllSettings();
    addLog('Đã lưu cấu hình AI & TTS!', 'success');
    _showGlobalToast('Đã lưu cài đặt!', 'success');
  });
}

function _bindOutputDirButton() {
  const btn     = document.getElementById('btn-output-dir');
  const display = document.getElementById('output-dir-text');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    if (window.electronAPI?.openDirectory) {
      const result = await window.electronAPI.openDirectory();
      if (result && !result.canceled && result.filePaths?.[0]) {
        const dir = result.filePaths[0];
        state.outputDir = dir;
        localStorage.setItem('output_dir', dir);
        if (display) display.textContent = dir;
        addLog(`Đã chọn thư mục: ${dir}`, 'info');
      }
    }
  });
}

let _ttsRefAudioPath = null;

function _bindVoiceClone() {
  const btnUpload = document.getElementById('btn-upload-ref-audio');
  const btnClone  = document.getElementById('btn-clone-voice');
  const refName   = document.getElementById('ref-audio-name');
  const refPreview = document.getElementById('ref-audio-preview');
  const cloneName = document.getElementById('clone-voice-name');
  const ttsLang   = document.getElementById('tts-language');

  if (btnUpload) {
    btnUpload.addEventListener('click', async () => {
      if (!window.electronAPI?.openFile) {
        _showGlobalToast('Chức năng chọn file chỉ khả dụng trong app', 'warn');
        return;
      }
      const result = await window.electronAPI.openFile([
        { name: 'Audio', extensions: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus'] },
      ]);
      const fp = result && !result.canceled && result.filePaths?.[0];
      if (fp) {
        _ttsRefAudioPath = fp;
        if (refName)    refName.textContent = fp.split(/[\\/]/).pop();
        if (refPreview) { refPreview.src = 'file:///' + fp.replace(/\\/g, '/'); refPreview.style.display = ''; }
        if (btnClone)   btnClone.disabled = false;
      }
    });
  }

  if (btnClone) {
    btnClone.addEventListener('click', async () => {
      const name = cloneName?.value?.trim();
      if (!name)            { _showGlobalToast('Nhập tên giọng!', 'warn'); return; }
      if (!_ttsRefAudioPath) { _showGlobalToast('Chọn file audio mẫu!', 'warn'); return; }

      btnClone.disabled     = true;
      btnClone.textContent  = 'Đang tạo mẫu (0%)...';
      addLog(`[TTS] Đang clone giọng "${name}"...`, 'info');

      // Simulate progress
      let sim = 0;
      const simTimer = setInterval(() => {
        sim = Math.min(sim + Math.random() * 8 + 2, 95);
        btnClone.textContent = `Đang tạo mẫu (${Math.floor(sim)}%)...`;
      }, 1000);

      try {
        const lang   = ttsLang?.value || 'vi';
        const result = await window.api.generateTTS(
          'Xin chào, đây là giọng được clone bởi OmniVoice.',
          _ttsRefAudioPath,
          lang
        );

        clearInterval(simTimer);
        btnClone.textContent = 'Đang hoàn tất (100%)...';

        if (result.status === 'ok' && result.audio_path) {
          const voices = getSavedVoices();
          voices.push({
            name,
            audioPath: _ttsRefAudioPath,
            audioFile: _ttsRefAudioPath.split(/[\\/]/).pop(),
            samplePath: result.audio_path,
            date: new Date().toLocaleDateString('vi-VN'),
          });
          _saveSavedVoices(voices);
          renderSavedVoices();

          // Tự động chọn giọng vừa clone
          const ttsVoiceSel = document.getElementById('tts-voice');
          if (ttsVoiceSel) {
            ttsVoiceSel.value = `clone:${voices.length - 1}`;
            localStorage.setItem('tts_voice', ttsVoiceSel.value);
          }

          // Phát thử mẫu
          const testAudio = document.getElementById('tts-test-audio');
          if (testAudio) {
            testAudio.src   = 'file:///' + result.audio_path.replace(/\\/g, '/');
            testAudio.style.display = '';
            testAudio.play();
          }

          // Reset form
          if (cloneName)   cloneName.value = '';
          _ttsRefAudioPath = null;
          if (refName)     refName.textContent = 'Chưa chọn file';
          if (refPreview)  refPreview.style.display = 'none';

          _showGlobalToast(`Đã clone giọng "${name}" thành công!`, 'success');
          addLog(`[TTS] Clone giọng "${name}" thành công!`, 'success');
        } else {
          addLog('[TTS] Clone thất bại: ' + (result.error || 'Unknown'), 'error');
          _showGlobalToast('Clone giọng thất bại: ' + (result.error || ''), 'error');
        }
      } catch (e) {
        clearInterval(simTimer);
        addLog('[TTS] Lỗi: ' + e.message, 'error');
        _showGlobalToast('Không thể kết nối TTS engine', 'error');
      } finally {
        clearInterval(simTimer);
        btnClone.disabled    = false;
        btnClone.textContent = 'Thêm giọng clone';
      }
    });
  }
}

function _bindTestTts() {
  const btn      = document.getElementById('btn-test-tts');
  const textArea = document.getElementById('tts-test-text');
  const ttsVoice = document.getElementById('tts-voice');
  const testAudio = document.getElementById('tts-test-audio');
  const ttsLang   = document.getElementById('tts-language');

  if (!btn) return;
  btn.addEventListener('click', async () => {
    const text = textArea?.value?.trim();
    if (!text) { _showGlobalToast('Nhập text để thử!', 'warn'); return; }

    const voiceVal = ttsVoice?.value || 'default';
    let refAudio   = null;
    if (voiceVal.startsWith('clone:')) {
      const idx    = parseInt(voiceVal.split(':')[1]);
      const voices = getSavedVoices();
      if (voices[idx]) refAudio = voices[idx].audioPath;
    }

    btn.disabled    = true;
    btn.textContent = 'Đang tạo...';
    addLog(`[TTS] Đang tạo giọng thử: "${text.substring(0, 50)}..."`, 'info');

    try {
      const lang   = ttsLang?.value || 'vi';
      const result = await window.api.generateTTS(text, refAudio, lang);
      if (result.status === 'ok' && result.audio_path) {
        if (testAudio) {
          testAudio.src   = 'file:///' + result.audio_path.replace(/\\/g, '/');
          testAudio.style.display = '';
          testAudio.play();
        }
        addLog('[TTS] Tạo voice thành công!', 'success');
      } else {
        addLog('[TTS] Lỗi: ' + (result.error || 'Unknown'), 'error');
        _showGlobalToast('Lỗi TTS: ' + (result.error || ''), 'error');
      }
    } catch (e) {
      addLog('[TTS] Lỗi kết nối: ' + e.message, 'error');
      _showGlobalToast('Không thể kết nối TTS engine', 'error');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Thử phát';
    }
  });
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _showGlobalToast(msg, type = 'info', dur = 3000) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className  = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, dur);
}
