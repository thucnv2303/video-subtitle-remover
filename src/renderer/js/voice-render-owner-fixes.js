(function () {
  'use strict';

  if (window.__vsrVoiceRenderOwnerFixesLoaded === true) return;
  window.__vsrVoiceRenderOwnerFixesLoaded = true;

  const RATE_PROFILE_KEY = 'voice_render_rate_profiles_v2';
  const PREVIEW_TEXT = 'Xin chào, đây là đoạn nghe thử nhanh của giọng đang chọn trong Voice Render.';
  const FALLBACK_WPM = { vi: 220, en: 170, ko: 210 };
  const FALLBACK_CPS = { zh: 4.2, ja: 4.5 };
  const BUILTIN_PROFILES = {
    default: { prosody: 'Tự nhiên · Ổn định', speedFactor: 1.00 },
    'vi-VN-HoaiMyNeural': { prosody: 'Mềm · Bình tĩnh', speedFactor: 0.94 },
    'vi-VN-NamMinhNeural': { prosody: 'Rõ · Dứt khoát', speedFactor: 1.06 },
    'en-US-JennyNeural': { prosody: 'Sáng · Nhanh', speedFactor: 1.10 },
    'en-US-GuyNeural': { prosody: 'Trầm · Chậm', speedFactor: 0.90 },
  };
  const LEGACY_PROSODIES = [
    'Tự nhiên · Ấm', 'Tự nhiên · Sáng', 'Rõ · Dứt khoát',
    'Mềm · Bình tĩnh', 'Trầm · Chậm rãi', 'Nhanh · Năng lượng',
  ];
  const LEGACY_SPEEDS = [0.88, 0.92, 0.96, 1.02, 1.08, 1.14, 0.84, 1.18];

  let pendingPreviewVoiceId = null;
  let pendingRunSnapshot = null;
  let pendingCloneProfile = null;

  function setStatus(id, text, ok, title) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text || '—';
    el.dataset.ok = ok === true ? 'true' : ok === false ? 'false' : 'unknown';
    if (title) el.title = title;
  }

  function wordCount(text) {
    const value = String(text || '').trim();
    return value ? value.split(/\s+/).length : 0;
  }

  function readableCharCount(text) {
    return String(text || '').replace(/\s+/g, '').length;
  }

  function readSavedVoices() {
    try {
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      return Array.isArray(voices) ? voices : [];
    } catch {
      return [];
    }
  }

  function writeSavedVoices(voices) {
    localStorage.setItem('tts_voices', JSON.stringify(voices));
    window.dispatchEvent(new CustomEvent('tts-voices-updated', { detail: { source: 'voice-profile-fix' } }));
  }

  function migrateLegacyVoiceProfiles() {
    const voices = readSavedVoices();
    if (!voices.length) return;
    const used = new Set(Object.values(BUILTIN_PROFILES).map((profile) => `${profile.prosody}|${Number(profile.speedFactor).toFixed(2)}`));
    let changed = false;
    voices.forEach((voice, index) => {
      const hasProsody = !!String(voice?.prosody || voice?.tone || '').trim();
      const hasSpeed = Number.isFinite(Number(voice?.speedFactor));
      if (hasProsody && hasSpeed) {
        used.add(`${voice.prosody || voice.tone}|${Number(voice.speedFactor).toFixed(2)}`);
        return;
      }
      let assigned = null;
      for (let offset = 0; offset < LEGACY_SPEEDS.length * LEGACY_PROSODIES.length; offset += 1) {
        const prosody = LEGACY_PROSODIES[(index + offset) % LEGACY_PROSODIES.length];
        const speedFactor = LEGACY_SPEEDS[(index + Math.floor(offset / LEGACY_PROSODIES.length)) % LEGACY_SPEEDS.length];
        const key = `${prosody}|${speedFactor.toFixed(2)}`;
        if (!used.has(key)) {
          assigned = { prosody, speedFactor };
          used.add(key);
          break;
        }
      }
      assigned ||= { prosody: `Cá nhân · ${index + 1}`, speedFactor: Math.max(0.80, Math.min(1.20, 0.86 + index * 0.02)) };
      voice.prosody = assigned.prosody;
      voice.tone = assigned.prosody;
      voice.speedFactor = assigned.speedFactor;
      voice.profileMigrated = true;
      changed = true;
    });
    if (changed) writeSavedVoices(voices);
  }

  function selectedVoiceId() {
    return localStorage.getItem('voice_render_voice') || 'default';
  }

  function selectedLanguage() {
    return document.getElementById('vr-language')?.value || 'vi';
  }

  function getVoiceProfile(voiceId) {
    if (BUILTIN_PROFILES[voiceId]) return { ...BUILTIN_PROFILES[voiceId] };
    if (String(voiceId || '').startsWith('clone:')) {
      const index = Number(String(voiceId).split(':')[1]);
      const voice = readSavedVoices()[index];
      if (voice) {
        return {
          prosody: voice.prosody || voice.tone || 'Tự nhiên · Cá nhân',
          speedFactor: Number.isFinite(Number(voice.speedFactor)) ? Number(voice.speedFactor) : 1,
        };
      }
    }
    return { prosody: 'Tự nhiên', speedFactor: 1 };
  }

  function profileKey(voiceId, language) {
    return `${voiceId || 'default'}|${language || 'vi'}`;
  }

  function readRateProfiles() {
    try {
      const value = JSON.parse(localStorage.getItem(RATE_PROFILE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function recordRateSample(voiceId, language, text, durationSeconds, source) {
    const seconds = Number(durationSeconds);
    const words = wordCount(text);
    const chars = readableCharCount(text);
    if (!Number.isFinite(seconds) || seconds <= 0.25 || (!words && !chars)) return;

    const profiles = readRateProfiles();
    const key = profileKey(voiceId, language);
    const current = profiles[key] || { words: 0, chars: 0, seconds: 0, samples: 0 };
    const maxAccumulatedSeconds = 3600;
    let carry = 1;
    if (Number(current.seconds || 0) + seconds > maxAccumulatedSeconds && Number(current.seconds || 0) > 0) {
      carry = Math.max(0.25, (maxAccumulatedSeconds - seconds) / Number(current.seconds));
    }

    profiles[key] = {
      words: Number(current.words || 0) * carry + words,
      chars: Number(current.chars || 0) * carry + chars,
      seconds: Number(current.seconds || 0) * carry + seconds,
      samples: Number(current.samples || 0) + 1,
      last_source: source || 'runtime',
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem(RATE_PROFILE_KEY, JSON.stringify(profiles));
    updateAdaptiveEstimate();
  }

  function estimateSeconds(text, voiceId, language) {
    const words = wordCount(text);
    const chars = readableCharCount(text);
    if (!words && !chars) return { seconds: 0, learned: false, rateLabel: '' };

    const profile = readRateProfiles()[profileKey(voiceId, language)];
    if (profile && Number(profile.seconds) > 0) {
      const observedSeconds = Number(profile.seconds);
      const observedWords = Number(profile.words || 0);
      const observedChars = Number(profile.chars || 0);
      if (observedWords >= 20 && words > 0) {
        const wordsPerSecond = observedWords / observedSeconds;
        return { seconds: words / wordsPerSecond, learned: true, rateLabel: `${Math.round(wordsPerSecond * 60)} WPM đã đo` };
      }
      if (observedChars > 0 && chars > 0) {
        const charsPerSecond = observedChars / observedSeconds;
        return { seconds: chars / charsPerSecond, learned: true, rateLabel: `${charsPerSecond.toFixed(2)} ký tự/s đã đo` };
      }
    }

    const voiceProfile = getVoiceProfile(voiceId);
    const speedFactor = Math.max(0.75, Math.min(1.25, Number(voiceProfile.speedFactor) || 1));
    if (language === 'zh' || language === 'ja') {
      const cps = (FALLBACK_CPS[language] || 4.2) * speedFactor;
      return { seconds: chars / cps, learned: false, rateLabel: `${cps.toFixed(2)} ký tự/s theo profile ${speedFactor.toFixed(2)}x` };
    }
    const wpm = (FALLBACK_WPM[language] || 200) * speedFactor;
    return { seconds: (words / wpm) * 60, learned: false, rateLabel: `${Math.round(wpm)} WPM theo profile ${speedFactor.toFixed(2)}x` };
  }

  function formatDuration(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    if (value < 60) return `${Math.round(value)} giây`;
    const minutes = value / 60;
    return `~ ${minutes.toFixed(minutes >= 10 ? 0 : 1)} phút`;
  }

  function updateAdaptiveEstimate() {
    const target = document.getElementById('vr-duration-est');
    const text = document.getElementById('vr-text')?.value || '';
    if (!target) return;
    const voiceId = selectedVoiceId();
    const language = selectedLanguage();
    const estimate = estimateSeconds(text, voiceId, language);
    const voiceProfile = getVoiceProfile(voiceId);
    target.textContent = formatDuration(estimate.seconds);
    const voiceName = document.getElementById('vr-selected-voice-name')?.textContent || voiceId;
    target.title = `${voiceName} · ${voiceProfile.prosody} · ${voiceProfile.speedFactor.toFixed(2)}x · ${estimate.rateLabel}`;
    target.dataset.rateSource = estimate.learned ? 'learned' : 'profile';
  }

  function calibrateAudioFile(audioPath, voiceId, language, text, source) {
    if (!audioPath) return;
    const audio = new Audio(`file:///${String(audioPath).replace(/\\/g, '/')}`);
    audio.preload = 'metadata';
    const onLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        recordRateSample(voiceId, language, text, audio.duration, source);
      }
    };
    audio.addEventListener('loadedmetadata', onLoaded, { once: true });
    audio.load();
  }

  async function applyProfileTempo(audioPath, voiceId) {
    const profile = getVoiceProfile(voiceId);
    const factor = Math.max(0.75, Math.min(1.25, Number(profile.speedFactor) || 1));
    if (!window.electronAPI?.applyVoiceTempo || Math.abs(factor - 1) < 0.005) return audioPath;
    const result = await window.electronAPI.applyVoiceTempo(audioPath, factor);
    if (!result?.ok || !result.output_path) throw new Error(result?.error || 'Không áp được tốc độ voice.');
    return result.output_path;
  }

  function decorateVoiceRows() {
    document.querySelectorAll('[data-voice-row]').forEach((row) => {
      const id = row.getAttribute('data-voice-row');
      const copy = row.querySelector('.vr-voice-copy small');
      if (!copy || !id) return;
      const profile = getVoiceProfile(id);
      const base = copy.textContent.split(' · Nhịp ')[0];
      copy.textContent = `${base} · Nhịp ${profile.prosody} · ${profile.speedFactor.toFixed(2)}x`;
    });
  }

  function installCloneProfileControls() {
    const note = document.getElementById('vr-clone-note');
    if (!note || document.getElementById('vr-clone-prosody')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'vr-two-col';
    wrapper.innerHTML = `
      <label class="vr-field"><span>Ngữ điệu</span><select id="vr-clone-prosody"><option>Tự nhiên · Ấm</option><option>Tự nhiên · Sáng</option><option>Rõ · Dứt khoát</option><option>Mềm · Bình tĩnh</option><option>Trầm · Chậm rãi</option><option>Nhanh · Năng lượng</option></select></label>
      <label class="vr-field"><span>Tốc độ riêng <b id="vr-clone-speed-label">1.00x</b></span><input id="vr-clone-speed" type="range" min="0.80" max="1.20" step="0.02" value="1.00"></label>`;
    note.closest('.vr-field')?.before(wrapper);
    const slider = document.getElementById('vr-clone-speed');
    slider?.addEventListener('input', () => {
      const label = document.getElementById('vr-clone-speed-label');
      if (label) label.textContent = `${Number(slider.value).toFixed(2)}x`;
    });
  }

  function profileIsDuplicate(prosody, speedFactor) {
    const factor = Number(speedFactor);
    const builtins = Object.values(BUILTIN_PROFILES);
    const clones = readSavedVoices().map((voice) => ({ prosody: voice.prosody || voice.tone || '', speedFactor: Number(voice.speedFactor || 1) }));
    return [...builtins, ...clones].some((profile) => profile.prosody === prosody && Math.abs(Number(profile.speedFactor) - factor) < 0.005);
  }

  function installSharedVoiceCreationGuard() {
    document.addEventListener('click', (event) => {
      const settingsAdd = event.target?.closest?.('#settings-add-voice');
      if (settingsAdd) {
        event.preventDefault();
        event.stopImmediatePropagation();
        document.getElementById('nav-voice-render')?.click();
        setTimeout(() => document.getElementById('vr-open-clone')?.click(), 50);
        window.showToast?.('Tạo voice mới tại Voice Render để lưu đủ ngữ điệu và tốc độ.', 'info');
        return;
      }

      const saveClone = event.target?.closest?.('#vr-save-clone');
      if (!saveClone) return;
      const name = document.getElementById('vr-clone-name')?.value.trim() || '';
      const prosody = document.getElementById('vr-clone-prosody')?.value || 'Tự nhiên · Ấm';
      const speedFactor = Number(document.getElementById('vr-clone-speed')?.value || 1);
      const duplicateName = readSavedVoices().some((voice) => String(voice.name || '').trim().toLowerCase() === name.toLowerCase());
      if (duplicateName) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.showToast?.('Tên voice đã tồn tại. Vui lòng đặt tên khác.', 'warning');
        return;
      }
      pendingCloneProfile = { name, prosody, speedFactor };
      setTimeout(() => {
        if (!pendingCloneProfile) return;
        const voices = readSavedVoices();
        const index = voices.findIndex((voice) => String(voice.name || '').trim() === pendingCloneProfile.name);
        if (index >= 0) {
          voices[index] = { ...voices[index], prosody: pendingCloneProfile.prosody, tone: pendingCloneProfile.prosody, speedFactor: pendingCloneProfile.speedFactor };
          writeSavedVoices(voices);
        }
        pendingCloneProfile = null;
        decorateVoiceRows();
        updateAdaptiveEstimate();
      }, 0);
    }, true);
  }

  function installTtsCalibrationAndTempo() {
    if (!window.api?.post || window.api.post.__voiceRenderProfileWrapped) return;
    const originalPost = window.api.post.bind(window.api);
    const wrapped = async (endpoint, payload, ...rest) => {
      let result = await originalPost(endpoint, payload, ...rest);
      if (endpoint !== '/api/tts/generate' || result?.status !== 'ok' || !result.audio_path) return result;

      let voiceId = null;
      let source = null;
      if (payload?.text === PREVIEW_TEXT && pendingPreviewVoiceId) {
        voiceId = pendingPreviewVoiceId;
        source = 'preview';
      } else if (payload?.output_path && pendingRunSnapshot) {
        voiceId = pendingRunSnapshot.voiceId;
        source = 'chunk-render';
      }

      if (source === 'preview' && voiceId) {
        const processedPath = await applyProfileTempo(result.audio_path, voiceId);
        result = { ...result, audio_path: processedPath };
        calibrateAudioFile(processedPath, voiceId, payload.language || selectedLanguage(), payload.text, source);
      }
      return result;
    };
    wrapped.__voiceRenderProfileWrapped = true;
    window.api.post = wrapped;

    document.addEventListener('click', (event) => {
      const preview = event.target?.closest?.('[data-preview-voice]');
      if (preview?.dataset.previewVoice) pendingPreviewVoiceId = preview.dataset.previewVoice;

      const start = event.target?.closest?.('#vr-start');
      if (start) {
        pendingRunSnapshot = {
          voiceId: selectedVoiceId(),
          language: selectedLanguage(),
          text: document.getElementById('vr-text')?.value || '',
        };
      }

      if (event.target?.closest?.('[data-select-voice]')) {
        setTimeout(() => { decorateVoiceRows(); updateAdaptiveEstimate(); }, 0);
      }
    }, true);

    const resultAudio = document.getElementById('vr-result-audio');
    resultAudio?.addEventListener('loadedmetadata', () => {
      if (!pendingRunSnapshot || !Number.isFinite(resultAudio.duration) || resultAudio.duration <= 0) return;
      recordRateSample(pendingRunSnapshot.voiceId, pendingRunSnapshot.language, pendingRunSnapshot.text, resultAudio.duration, 'full-render');
      pendingRunSnapshot = null;
    });

    ['vr-text', 'vr-language', 'vr-chunk-size', 'vr-auto-chunk', 'vr-keep-paragraphs'].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => setTimeout(updateAdaptiveEstimate, 0));
      el?.addEventListener('change', () => setTimeout(updateAdaptiveEstimate, 0));
    });
    window.addEventListener('tts-voices-updated', () => setTimeout(() => { decorateVoiceRows(); updateAdaptiveEstimate(); }, 0));
    setTimeout(() => { decorateVoiceRows(); updateAdaptiveEstimate(); }, 0);
  }

  async function refreshOwnerStatus() {
    if (!document.getElementById('global-app-status')) return;
    let backendOk = false;
    let ttsOk = false;
    try {
      await window.api?.health?.();
      backendOk = true;
      setStatus('global-status-backend', 'Sẵn sàng', true);
    } catch { setStatus('global-status-backend', 'Mất kết nối', false); }
    try {
      const tts = await window.api?.getTTSStatus?.();
      ttsOk = !!tts?.available;
      setStatus('global-status-tts', ttsOk ? (tts.model_loaded ? 'Đã nạp' : 'Sẵn sàng') : 'Chưa sẵn sàng', ttsOk);
    } catch { setStatus('global-status-tts', 'Không khả dụng', false); }
    try {
      const gpu = await window.api?.gpuInfo?.();
      const name = gpu?.gpu_name || gpu?.name || 'Không khả dụng';
      const available = gpu?.gpu_available ?? gpu?.cuda_available;
      const vram = gpu?.vram_total ? ` · ${gpu.vram_total}` : '';
      setStatus('global-status-gpu', `${name}${vram}`, available === true ? true : available === false ? false : undefined, name);
    } catch { setStatus('global-status-gpu', 'Không khả dụng', undefined); }
    try {
      const info = await window.electronAPI?.getSystemInfo?.();
      const cpuPct = Number.isFinite(info?.cpu_usage_percent) ? `${Math.round(info.cpu_usage_percent)}%` : '—';
      const cpuTitle = info?.cpu_model ? `${info.cpu_model} · ${info.logical_cores || '—'} luồng` : '';
      setStatus('global-status-cpu', cpuPct, Number.isFinite(info?.cpu_usage_percent) ? true : undefined, cpuTitle);
      if (info?.total_memory_bytes) {
        const used = Number(info.used_memory_bytes ?? (info.total_memory_bytes - info.free_memory_bytes));
        const total = Number(info.total_memory_bytes);
        const ramPct = Number.isFinite(info?.memory_usage_percent) ? `${Math.round(info.memory_usage_percent)}%` : `${Math.round((used / total) * 100)}%`;
        setStatus('global-status-ram', ramPct, true, `${(used / 1073741824).toFixed(1)} / ${(total / 1073741824).toFixed(1)} GB`);
      } else setStatus('global-status-ram', 'Không khả dụng', undefined);
      setStatus('global-status-version', `VSR ${info?.app_version ? `v${info.app_version}` : ''} · Electron ${info?.electron_version || '—'}`, true);
    } catch (error) {
      setStatus('global-status-cpu', 'Không khả dụng', undefined);
      setStatus('global-status-ram', 'Không khả dụng', undefined);
      console.error('[Voice Render] system-info bridge failed:', error?.message || error);
    }
    const overall = document.getElementById('global-status-overall');
    if (overall) {
      overall.textContent = backendOk && ttsOk ? 'Hoạt động tốt' : backendOk ? 'Cần kiểm tra TTS' : 'Backend offline';
      overall.dataset.ok = backendOk && ttsOk ? 'true' : 'false';
    }
  }

  function installRenderDiagnostics() {
    const button = document.getElementById('vr-start');
    if (!button || button.dataset.ownerDiagnosticsBound === 'true') return;
    button.dataset.ownerDiagnosticsBound = 'true';
    button.addEventListener('click', () => {
      const bridgeOk = !!(window.electronAPI?.saveFile && window.electronAPI?.mergeWavFiles && window.electronAPI?.applyVoiceTempo);
      if (!bridgeOk) {
        console.error('[Voice Render] render bridge missing: saveFile/mergeWavFiles/applyVoiceTempo unavailable');
        window.showToast?.('Bridge Voice Render chưa sẵn sàng. Xem log PowerShell.', 'error');
      }
    }, true);
  }

  function install() {
    const timer = setInterval(() => {
      if (!document.getElementById('global-app-status')) return;
      clearInterval(timer);
      migrateLegacyVoiceProfiles();
      installCloneProfileControls();
      installSharedVoiceCreationGuard();
      refreshOwnerStatus();
      installRenderDiagnostics();
      installTtsCalibrationAndTempo();
      document.getElementById('global-status-refresh')?.addEventListener('click', refreshOwnerStatus);
      setInterval(refreshOwnerStatus, 10000);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
