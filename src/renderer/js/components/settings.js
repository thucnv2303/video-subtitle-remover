/**
 * Settings Component
 * Quản lý trang Cài đặt: load/save AI provider state, TTS config, output directory,
 * voice clone management, diagnostics, and TTS status.
 */

import { state } from '../store.js';
import { addLog, showToast } from '../utils/logger.js';

let _legacyMigrationDone = false;

// ─── Init ─────────────────────────────────────────────────────────────────────

export function initSettings() {
  _ensureSettingsLayout();
  _bindProviderControls();
  _bindVolSlider();
  _bindSaveButton();
  _bindVoiceClone();
  _bindTestTts();
  _bindDiagnostics();
  renderSavedVoices();
  loadSettingsValues();
  _refreshDiagnostics();
}

// ─── Settings layout ──────────────────────────────────────────────────────────

function _ensureSettingsLayout() {
  const scroll = document.querySelector('#page-settings .settings-scroll');
  if (!scroll || scroll.dataset.settingsV1Ready === 'true') return;

  const cards = Array.from(scroll.children).filter(el => el.classList?.contains('settings-card'));
  if (cards.length < 3) return;

  const header = scroll.querySelector('.settings-header');
  const aiCard = cards[0];
  const generalCard = cards[1];
  const diagnosticsCard = cards[2];
  const get = (id) => document.getElementById(id);
  const group = (id) => get(id)?.closest('.form-group');

  // Capture every node BEFORE detaching anything from the original AI/TTS card.
  const providerGroup = group('ai-provider');
  const apiKeyGroup = group('ai-api-key');
  const endpointGroup = group('ai-endpoint');
  const ttsStatusGroup = group('tts-status-chip');
  const voiceGroup = group('tts-voice');
  const languageGroup = group('tts-language');
  const bgVolumeGroup = group('tts-bg-volume');
  const removeVocalGroup = get('tts-remove-vocal')?.closest('.form-group');
  const cloneNameGroup = group('clone-voice-name');
  const refAudioGroup = get('btn-upload-ref-audio')?.closest('.form-group');
  const cloneButton = get('btn-clone-voice');
  const savedVoices = get('saved-voices-list');
  const testTextGroup = get('tts-test-text')?.closest('.form-group');
  const testRow = get('btn-test-tts')?.closest('.tts-test-row');
  const saveButton = get('btn-save-ai');

  const requiredNodes = [
    providerGroup,
    apiKeyGroup,
    endpointGroup,
    ttsStatusGroup,
    voiceGroup,
    languageGroup,
    bgVolumeGroup,
    removeVocalGroup,
    cloneNameGroup,
    refAudioGroup,
    cloneButton,
    savedVoices,
    testTextGroup,
    testRow,
    saveButton,
  ];
  if (requiredNodes.some(node => !node)) {
    console.error('[Settings] Không đủ DOM controls để dựng Settings V1.');
    return;
  }

  const modelGroup = document.createElement('div');
  modelGroup.className = 'form-group';
  modelGroup.id = 'ai-model-group';
  modelGroup.innerHTML = `
    <label class="form-label">Model</label>
    <input type="text" id="ai-model" class="form-input" placeholder="VD: gemini-2.5-flash, deepseek-chat, qwen2.5:14b">
  `;

  apiKeyGroup.id = 'ai-api-key-group';
  endpointGroup.id = 'ai-endpoint-group';
  get('ai-api-key').placeholder = 'Nhập API key cho Gemini / DeepSeek...';
  get('ai-endpoint').placeholder = 'VD: http://localhost:11434/api/chat';

  const pipelineCard = document.createElement('div');
  pipelineCard.className = 'settings-card';
  pipelineCard.dataset.settingsRole = 'pipeline1-defaults';

  const voiceCard = document.createElement('div');
  voiceCard.className = 'settings-card';
  voiceCard.dataset.settingsRole = 'voice-cloning';

  // General
  const generalHeading = generalCard.querySelector('h3');
  if (generalHeading) generalHeading.textContent = '⚙️ General';
  generalCard.dataset.settingsRole = 'general';
  generalCard.prepend(_desc('Thiết lập thư mục đầu ra dùng chung cho các file kết quả.'));

  // AI Provider
  aiCard.replaceChildren(
    _heading('🤖 AI Provider'),
    _desc('Chọn provider và lưu API key / model độc lập cho từng provider.'),
    providerGroup,
    apiKeyGroup,
    modelGroup,
    endpointGroup,
  );
  aiCard.dataset.settingsRole = 'ai-provider';

  // Pipeline 1 defaults
  pipelineCard.append(
    _heading('🎤 Pipeline 1 Defaults'),
    _desc('Thiết lập mặc định cho TTS của Pipeline 1. Các job hiện có không bị thay đổi.'),
    ttsStatusGroup,
    voiceGroup,
    languageGroup,
    bgVolumeGroup,
    removeVocalGroup,
  );

  // Voice cloning
  voiceCard.append(
    _heading('🧬 Voice Cloning'),
    _desc('Tạo giọng clone từ audio mẫu 3–15 giây, quản lý giọng đã lưu và thử phát.'),
    cloneNameGroup,
    refAudioGroup,
    cloneButton,
    _divider(),
    _subheading('📋 Giọng đã lưu'),
    savedVoices,
    _divider(),
    _subheading('🔊 Thử giọng'),
    testTextGroup,
    testRow,
  );

  // System / Diagnostics
  const diagnosticsHeading = diagnosticsCard.querySelector('h3');
  if (diagnosticsHeading) diagnosticsHeading.textContent = '🖥 System / Diagnostics';
  diagnosticsCard.dataset.settingsRole = 'system-diagnostics';

  const backendRow = document.createElement('div');
  backendRow.className = 'setting-row';
  backendRow.innerHTML = `
    <div><span class="form-label">Backend</span><br><span class="form-desc">Python service</span></div>
    <span class="status-chip" id="backend-status-chip">Chưa kiểm tra</span>
  `;

  const gpuStatusRow = document.createElement('div');
  gpuStatusRow.className = 'setting-row';
  gpuStatusRow.innerHTML = `
    <div><span class="form-label">Compute</span><br><span class="form-desc">GPU / CPU runtime</span></div>
    <span class="status-chip" id="gpu-status-chip">Chưa kiểm tra</span>
  `;

  const refreshButton = document.createElement('button');
  refreshButton.id = 'btn-refresh-diagnostics';
  refreshButton.className = 'btn btn-outline';
  refreshButton.textContent = '↻ Làm mới chẩn đoán';
  refreshButton.style.marginTop = '12px';
  refreshButton.style.width = '100%';

  const firstHardwareRow = diagnosticsCard.querySelector('.setting-row');
  if (firstHardwareRow) {
    diagnosticsCard.insertBefore(gpuStatusRow, firstHardwareRow);
    diagnosticsCard.insertBefore(backendRow, gpuStatusRow);
  } else {
    diagnosticsCard.append(backendRow, gpuStatusRow);
  }
  diagnosticsCard.append(refreshButton);

  saveButton.textContent = '💾 Lưu tất cả cài đặt';
  saveButton.className = 'btn btn-primary';
  saveButton.style.width = '100%';
  saveButton.style.padding = '12px';
  saveButton.style.margin = '0 0 24px';
  saveButton.style.fontWeight = '600';

  // Keep the intended five-card order. The save action is outside the cards.
  if (header) scroll.replaceChildren(header);
  else scroll.replaceChildren();
  scroll.append(generalCard, aiCard, pipelineCard, voiceCard, diagnosticsCard, saveButton);
  scroll.dataset.settingsV1Ready = 'true';
}

function _heading(text) {
  const h = document.createElement('h3');
  h.textContent = text;
  return h;
}

function _subheading(text) {
  const h = document.createElement('h4');
  h.style.margin = '0 0 8px';
  h.textContent = text;
  return h;
}

function _desc(text) {
  const p = document.createElement('p');
  p.className = 'form-desc';
  p.style.margin = '0 0 14px';
  p.textContent = text;
  return p;
}

function _divider() {
  const div = document.createElement('div');
  div.className = 'form-divider';
  return div;
}

// ─── Load / Save Settings Values ─────────────────────────────────────────────

export function loadSettingsValues() {
  _ensureSettingsLayout();
  const get = (id) => document.getElementById(id);

  const provider = localStorage.getItem('ai_provider') || 'gemini';
  _migrateLegacyApiKeyOnce(provider);

  const aiProvider = get('ai-provider');
  const ttsVoice = get('tts-voice');
  const ttsLang = get('tts-language');
  const ttsBgVol = get('tts-bg-volume');
  const volLabel = get('vol-label');
  const removeVocal = get('tts-remove-vocal');
  const outputDir = get('output-dir-text');

  if (aiProvider) aiProvider.value = provider;
  _loadProviderFields(provider);
  _updateProviderVisibility(provider);

  if (ttsVoice) ttsVoice.value = localStorage.getItem('tts_voice') || 'none';
  if (ttsLang) ttsLang.value = localStorage.getItem('tts_language') || 'vi';
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
}

function _loadProviderFields(provider) {
  const apiKey = document.getElementById('ai-api-key');
  const model = document.getElementById('ai-model');
  const endpoint = document.getElementById('ai-endpoint');

  if (apiKey) apiKey.value = _isCloudProvider(provider) ? _readProviderKey(provider) : '';
  if (model) model.value = localStorage.getItem(`ai_model_${provider}`) ?? '';
  if (endpoint) endpoint.value = provider === 'ollama' ? (localStorage.getItem('ai_endpoint') || '') : '';
}

function _readProviderKey(provider) {
  try {
    const values = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]');
    const first = Array.isArray(values) ? values[0] : null;
    return typeof first === 'string' ? first : (first?.key || '');
  } catch {
    return '';
  }
}

function _migrateLegacyApiKeyOnce(provider) {
  if (_legacyMigrationDone) return;
  _legacyMigrationDone = true;
  if (!_isCloudProvider(provider)) return;

  let providerKeys = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]');
    providerKeys = Array.isArray(parsed) ? parsed : [];
  } catch {
    providerKeys = [];
  }

  const legacy = (localStorage.getItem('ai_api_key') || '').trim();
  if (providerKeys.length === 0 && legacy) {
    localStorage.setItem(`ai_api_keys_${provider}`, JSON.stringify([{ key: legacy }]));
  }

  // Retire the legacy global key after the one allowed initial-load migration.
  if (legacy) localStorage.removeItem('ai_api_key');
}

function _saveAllSettings() {
  const get = (id) => document.getElementById(id);
  const val = (id) => get(id)?.value ?? '';
  const chk = (id) => get(id)?.checked ?? false;

  const provider = val('ai-provider') || 'gemini';
  const model = val('ai-model');
  localStorage.setItem('ai_provider', provider);
  localStorage.setItem(`ai_model_${provider}`, model);

  if (_isCloudProvider(provider)) {
    const key = val('ai-api-key').trim();
    const keys = key ? [{ key }] : [];
    localStorage.setItem(`ai_api_keys_${provider}`, JSON.stringify(keys));
  }

  if (provider === 'ollama') {
    localStorage.setItem('ai_endpoint', val('ai-endpoint').trim());
  }

  localStorage.setItem('tts_voice', val('tts-voice'));
  localStorage.setItem('tts_language', val('tts-language'));
  localStorage.setItem('tts_bg_volume', val('tts-bg-volume'));
  localStorage.setItem('tts_remove_vocal', chk('tts-remove-vocal'));
}

function _isCloudProvider(provider) {
  return provider === 'gemini' || provider === 'deepseek';
}

function _updateProviderVisibility(provider) {
  const keyGroup = document.getElementById('ai-api-key-group');
  const modelGroup = document.getElementById('ai-model-group');
  const endpointGroup = document.getElementById('ai-endpoint-group');

  if (keyGroup) keyGroup.style.display = provider === 'ollama' ? 'none' : '';
  if (modelGroup) modelGroup.style.display = '';
  if (endpointGroup) endpointGroup.style.display = provider === 'ollama' ? '' : 'none';
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
  const list = document.getElementById('saved-voices-list');
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

  list.querySelectorAll('.btn-voice-del').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx);
      const vs = getSavedVoices();
      vs.splice(idx, 1);
      _saveSavedVoices(vs);
      renderSavedVoices();
      showToast(document.getElementById('toast-container') ? { toast: document.querySelector('.toast') } : {}, 'Đã xóa giọng!', 'info');
      _showGlobalToast('Đã xóa giọng!', 'info');
    });
  });
}

export function updateVoiceDropdown(voices) {
  const dropdowns = [
    document.getElementById('tts-voice'),
    document.getElementById('job-tts-voice'),
    document.getElementById('step1-tts-voice'),
  ].filter(Boolean);

  dropdowns.forEach(sel => {
    const toRemove = [];
    for (const opt of sel.options) {
      if (opt.value.startsWith('clone:')) toRemove.push(opt);
    }
    toRemove.forEach(opt => opt.remove());

    voices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = `clone:${i}`;
      opt.textContent = `🎤 ${v.name}`;
      sel.appendChild(opt);
    });

    const saved = localStorage.getItem('tts_voice') || 'none';
    if ([...sel.options].some(o => o.value === saved)) sel.value = saved;
  });
}

// ─── Diagnostics / TTS Status ─────────────────────────────────────────────────

export async function checkTTSStatus() {
  const chip = document.getElementById('tts-status-chip');
  if (!chip) return;

  try {
    const status = await window.api.getTTSStatus();
    if (status?.available) {
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

async function _refreshDiagnostics() {
  const backendChip = document.getElementById('backend-status-chip');
  const gpuStatusChip = document.getElementById('gpu-status-chip');
  const refreshButton = document.getElementById('btn-refresh-diagnostics');

  if (refreshButton) {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Đang kiểm tra...';
  }

  if (!window.api) {
    _setStatusChip(backendChip, 'Backend chưa sẵn sàng', 'offline');
    _setStatusChip(gpuStatusChip, 'Không xác định', 'offline');
    if (refreshButton) {
      refreshButton.disabled = false;
      refreshButton.textContent = '↻ Làm mới chẩn đoán';
    }
    return;
  }

  const [healthResult, gpuResult] = await Promise.allSettled([
    window.api.health(),
    window.api.gpuInfo(),
  ]);

  if (healthResult.status === 'fulfilled') {
    _setStatusChip(backendChip, 'Online', 'online');
  } else {
    _setStatusChip(backendChip, 'Offline', 'offline');
  }

  if (gpuResult.status === 'fulfilled') {
    const info = gpuResult.value || {};
    const hasGpu = info.cuda_available ?? info.gpu_available ?? false;
    const name = info.gpu_name || 'CPU Only';
    _setStatusChip(gpuStatusChip, hasGpu ? name : 'CPU Only', hasGpu ? 'online' : 'neutral');

    const gpuDetail = document.getElementById('gpu-detail');
    const gpuChip = document.getElementById('gpu-chip');
    const cudaVersion = document.getElementById('cuda-version');
    if (gpuDetail) gpuDetail.textContent = name;
    const gpuText = gpuChip?.querySelector('span:last-child');
    if (gpuText) gpuText.textContent = name;
    if (cudaVersion) cudaVersion.textContent = info.cuda_version || (hasGpu ? 'N/A' : 'CPU mode');
    const dot = gpuChip?.querySelector('.status-dot');
    if (dot) {
      dot.classList.remove('online', 'offline');
      if (hasGpu) dot.classList.add('online');
    }
  } else {
    _setStatusChip(gpuStatusChip, 'Không đọc được', 'offline');
  }

  await checkTTSStatus();

  if (refreshButton) {
    refreshButton.disabled = false;
    refreshButton.textContent = '↻ Làm mới chẩn đoán';
  }
}

function _setStatusChip(chip, text, stateName) {
  if (!chip) return;
  chip.textContent = text;
  chip.className = 'status-chip';
  if (stateName === 'online' || stateName === 'offline') chip.classList.add(stateName);
}

// ─── Bindings ─────────────────────────────────────────────────────────────────

function _bindProviderControls() {
  const provider = document.getElementById('ai-provider');
  if (!provider) return;
  provider.addEventListener('change', () => {
    const nextProvider = provider.value || 'gemini';
    _loadProviderFields(nextProvider);
    _updateProviderVisibility(nextProvider);
  });
}

function _bindVolSlider() {
  const slider = document.getElementById('tts-bg-volume');
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

function _bindDiagnostics() {
  document.getElementById('btn-refresh-diagnostics')?.addEventListener('click', _refreshDiagnostics);
}

let _ttsRefAudioPath = null;

function _bindVoiceClone() {
  const btnUpload = document.getElementById('btn-upload-ref-audio');
  const btnClone = document.getElementById('btn-clone-voice');
  const refName = document.getElementById('ref-audio-name');
  const refPreview = document.getElementById('ref-audio-preview');
  const cloneName = document.getElementById('clone-voice-name');
  const ttsLang = document.getElementById('tts-language');

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
        if (refName) refName.textContent = fp.split(/[\\/]/).pop();
        if (refPreview) {
          refPreview.src = 'file:///' + fp.replace(/\\/g, '/');
          refPreview.style.display = '';
        }
        if (btnClone) btnClone.disabled = false;
      }
    });
  }

  if (btnClone) {
    btnClone.addEventListener('click', async () => {
      const name = cloneName?.value?.trim();
      if (!name) { _showGlobalToast('Nhập tên giọng!', 'warn'); return; }
      if (!_ttsRefAudioPath) { _showGlobalToast('Chọn file audio mẫu!', 'warn'); return; }

      btnClone.disabled = true;
      btnClone.textContent = 'Đang tạo mẫu (0%)...';
      addLog(`[TTS] Đang clone giọng "${name}"...`, 'info');

      let sim = 0;
      const simTimer = setInterval(() => {
        sim = Math.min(sim + Math.random() * 8 + 2, 95);
        btnClone.textContent = `Đang tạo mẫu (${Math.floor(sim)}%)...`;
      }, 1000);

      try {
        const lang = ttsLang?.value || 'vi';
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

          const ttsVoiceSel = document.getElementById('tts-voice');
          if (ttsVoiceSel) {
            ttsVoiceSel.value = `clone:${voices.length - 1}`;
            localStorage.setItem('tts_voice', ttsVoiceSel.value);
          }

          const testAudio = document.getElementById('tts-test-audio');
          if (testAudio) {
            testAudio.src = 'file:///' + result.audio_path.replace(/\\/g, '/');
            testAudio.style.display = '';
            testAudio.play();
          }

          if (cloneName) cloneName.value = '';
          _ttsRefAudioPath = null;
          if (refName) refName.textContent = 'Chưa chọn file';
          if (refPreview) refPreview.style.display = 'none';

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
        btnClone.disabled = false;
        btnClone.textContent = 'Thêm giọng clone';
      }
    });
  }
}

function _bindTestTts() {
  const btn = document.getElementById('btn-test-tts');
  const textArea = document.getElementById('tts-test-text');
  const ttsVoice = document.getElementById('tts-voice');
  const testAudio = document.getElementById('tts-test-audio');
  const ttsLang = document.getElementById('tts-language');

  if (!btn) return;
  btn.addEventListener('click', async () => {
    const text = textArea?.value?.trim();
    if (!text) { _showGlobalToast('Nhập text để thử!', 'warn'); return; }

    const voiceVal = ttsVoice?.value || 'default';
    let refAudio = null;
    if (voiceVal.startsWith('clone:')) {
      const idx = parseInt(voiceVal.split(':')[1]);
      const voices = getSavedVoices();
      if (voices[idx]) refAudio = voices[idx].audioPath;
    }

    btn.disabled = true;
    btn.textContent = 'Đang tạo...';
    addLog(`[TTS] Đang tạo giọng thử: "${text.substring(0, 50)}..."`, 'info');

    try {
      const lang = ttsLang?.value || 'vi';
      const result = await window.api.generateTTS(text, refAudio, lang, voiceVal);
      if (result.status === 'ok' && result.audio_path) {
        if (testAudio) {
          testAudio.src = 'file:///' + result.audio_path.replace(/\\/g, '/');
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
      btn.disabled = false;
      btn.textContent = 'Thử phát';
    }
  });
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _showGlobalToast(msg, type = 'info', dur = 3000) {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, dur);
}
