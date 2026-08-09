/**
 * Settings Component
 * Quản lý trang Cài đặt: load/save AI keys, TTS config, output directory,
 * voice clone management, TTS status check, and System Diagnostics.
 */

import { state, saveState } from '../store.js';
import { addLog, showToast } from '../utils/logger.js';

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSettings() {
  _bindVolSlider();
  _bindSaveButton();
  _bindOutputDirButton();
  _bindVoiceClone();
  _bindTestTts();
  _bindDiagnostics();
  _bindProviderChange();
  renderSavedVoices();
}

// ─── Load / Save Settings Values ─────────────────────────────────────────────

export function loadSettingsValues() {
  const get = (id) => document.getElementById(id);

  // Legacy Key Migration (REV5 Requirement)
  const legacyApiKey = localStorage.getItem('ai_api_key');
  const legacyModelName = localStorage.getItem('ai_model_name');

  if (legacyApiKey !== null) {
    localStorage.setItem('ai_api_key_gemini', legacyApiKey);
    localStorage.removeItem('ai_api_key');
  }
  if (legacyModelName !== null) {
    localStorage.setItem('ai_model', legacyModelName);
    localStorage.removeItem('ai_model_name');
  }

  const aiProvider  = get('ai-provider');
  const aiApiKey    = get('ai-api-key');
  const aiModel     = get('ai-model');
  const aiEndpoint  = get('ai-endpoint');
  const ttsVoice    = get('tts-voice');
  const ttsLang     = get('tts-language');
  const ttsBgVol    = get('tts-bg-volume');
  const volLabel    = get('vol-label');
  const removeVocal = get('tts-remove-vocal');
  const outputDir   = get('output-dir-text');

  const savedProvider = localStorage.getItem('ai_provider') || 'gemini';
  if (aiProvider) {
    aiProvider.value = savedProvider;
    // Load the key for the saved provider
    const specificKey = localStorage.getItem(`ai_api_key_${savedProvider}`) || '';
    if (aiApiKey) aiApiKey.value = specificKey;
  }

  if (aiModel)     aiModel.value     = localStorage.getItem('ai_model')      || '';
  if (aiEndpoint)  aiEndpoint.value  = localStorage.getItem('ai_endpoint')   || '';
  if (ttsVoice)    ttsVoice.value    = localStorage.getItem('tts_voice')     || 'none';
  if (ttsLang)     ttsLang.value     = localStorage.getItem('tts_language')  || 'vi';
  if (removeVocal) removeVocal.checked = localStorage.getItem('tts_remove_vocal') === 'true';

  if (ttsBgVol) {
    ttsBgVol.value = localStorage.getItem('tts_bg_volume') || '10';
    if (volLabel) volLabel.textContent = ttsBgVol.value + '%';
  }
  if (outputDir) {
    const dir = state.outputDir || localStorage.getItem('output_dir') || '';
    outputDir.textContent = dir || 'Mặc định (cùng thư mục video gốc)';
  }

  // Đồng bộ dropdown voice với các clone đã lưu
  updateVoiceDropdown(getSavedVoices());
}

function _saveAllSettings() {
  const get = (id) => document.getElementById(id);

  const val = (id) => get(id)?.value ?? '';
  const chk = (id) => get(id)?.checked ?? false;

  const provider = val('ai-provider');
  localStorage.setItem('ai_provider',       provider);
  localStorage.setItem(`ai_api_key_${provider}`, val('ai-api-key'));
  localStorage.setItem('ai_model',          val('ai-model'));
  localStorage.setItem('ai_endpoint',       val('ai-endpoint'));
  localStorage.setItem('tts_voice',         val('tts-voice'));
  localStorage.setItem('tts_language',      val('tts-language'));
  localStorage.setItem('tts_bg_volume',     val('tts-bg-volume'));
  localStorage.setItem('tts_remove_vocal',  chk('tts-remove-vocal'));

  // Provider-specific legacy array format needed for pipeline1
  const key = val('ai-api-key');
  if (key) {
    const keys = [{ key }];
    localStorage.setItem(`ai_api_keys_${provider}`, JSON.stringify(keys));
  }
}

// ─── Provider Change Event ────────────────────────────────────────────────────

function _bindProviderChange() {
  const providerSel = document.getElementById('ai-provider');
  const apiKeyInp   = document.getElementById('ai-api-key');

  if (providerSel && apiKeyInp) {
    providerSel.addEventListener('change', () => {
      const provider = providerSel.value;
      const specificKey = localStorage.getItem(`ai_api_key_${provider}`) || '';
      apiKeyInp.value = specificKey;
    });
  }
}

// ─── System / Diagnostics ─────────────────────────────────────────────────────

function _bindDiagnostics() {
  const btn = document.getElementById('btn-refresh-diagnostics');
  if (btn) {
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.textContent = 'Đang tải...';

      await checkTTSStatus();
      await _checkBackendStatus();
      await _checkGPUStatus();

      btn.disabled = false;
      btn.textContent = 'Làm mới';
    });
  }
}

async function _checkBackendStatus() {
  const chip = document.getElementById('backend-status-chip');
  if (!chip) return;
  try {
    const status = await window.api.health();
    if (status && status.status === 'ok') {
      chip.textContent = 'Đang hoạt động';
      chip.className = 'status-chip online';
    } else {
      chip.textContent = 'Lỗi kết nối';
      chip.className = 'status-chip offline';
    }
  } catch (e) {
    chip.textContent = 'Không kết nối';
    chip.className = 'status-chip offline';
  }
}

async function _checkGPUStatus() {
  const chip = document.getElementById('gpu-status-chip');
  const detail = document.getElementById('gpu-detail');
  const cuda = document.getElementById('cuda-version');

  if (!chip || !detail || !cuda) return;

  try {
    const info = await window.api.gpuInfo();
    if (info) {
      if (info.cuda_available) {
        chip.textContent = 'CUDA Sẵn sàng';
        chip.className = 'status-chip online';
      } else {
        chip.textContent = 'Không có CUDA';
        chip.className = 'status-chip warn';
      }
      detail.textContent = info.device_name || 'Không xác định';
      cuda.textContent = info.cuda_version || 'N/A';
    }
  } catch (e) {
    chip.textContent = 'Không kiểm tra được';
    chip.className = 'status-chip offline';
    detail.textContent = 'Lỗi kết nối backend';
    cuda.textContent = 'N/A';
  }
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

// ─── TTS Status Check ─────────────────────────────────────────────────────────

export async function checkTTSStatus() {
  const chip = document.getElementById('tts-status-chip');
  if (!chip) return;
  try {
    const status = await window.api.getTTSStatus();
    if (status && status.available) {
      chip.textContent  = 'Sẵn sàng';
      chip.className    = 'status-chip online';
    } else {
      chip.textContent  = 'Chưa cài OmniVoice';
      chip.className    = 'status-chip offline';
    }
  } catch {
    chip.textContent = 'Backend chưa kết nối';
    chip.className   = 'status-chip offline';
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
