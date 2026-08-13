(function () {
  'use strict';

  const RATE_PROFILE_KEY = 'voice_render_rate_profiles_v1';
  const PREVIEW_TEXT = 'Xin chào, đây là đoạn nghe thử nhanh của giọng đang chọn trong Voice Render.';
  const FALLBACK_WPM = { vi: 220, en: 170, ko: 210 };
  const FALLBACK_CPS = { zh: 4.2, ja: 4.5 };
  let pendingPreviewVoiceId = null;
  let pendingRunSnapshot = null;

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

  function readRateProfiles() {
    try {
      const value = JSON.parse(localStorage.getItem(RATE_PROFILE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  function profileKey(voiceId, language) {
    return `${voiceId || 'default'}|${language || 'vi'}`;
  }

  function selectedVoiceId() {
    return localStorage.getItem('voice_render_voice') || 'default';
  }

  function selectedLanguage() {
    return document.getElementById('vr-language')?.value || 'vi';
  }

  function recordRateSample(voiceId, language, text, durationSeconds, source) {
    const seconds = Number(durationSeconds);
    const words = wordCount(text);
    const chars = readableCharCount(text);
    if (!Number.isFinite(seconds) || seconds <= 0.25 || (!words && !chars)) return;

    const profiles = readRateProfiles();
    const key = profileKey(voiceId, language);
    const current = profiles[key] || { words: 0, chars: 0, seconds: 0, samples: 0 };
    const maxAccumulatedSeconds = 60 * 60;
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

    const wpm = words ? Math.round((words / seconds) * 60) : null;
    console.info(`[Voice Render] learned rate ${voiceId}/${language}: ${wpm ? `${wpm} WPM` : `${(chars / seconds).toFixed(2)} char/s`} from ${source || 'runtime'}`);
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
      let seconds = 0;
      let rateLabel = '';

      if (observedWords >= 20 && words > 0) {
        const wordsPerSecond = observedWords / observedSeconds;
        seconds = words / wordsPerSecond;
        rateLabel = `${Math.round(wordsPerSecond * 60)} WPM`;
      } else if (observedChars > 0 && chars > 0) {
        const charsPerSecond = observedChars / observedSeconds;
        seconds = chars / charsPerSecond;
        rateLabel = `${charsPerSecond.toFixed(2)} ký tự/s`;
      }
      if (Number.isFinite(seconds) && seconds > 0) return { seconds, learned: true, rateLabel };
    }

    if (language === 'zh' || language === 'ja') {
      const cps = FALLBACK_CPS[language] || 4.2;
      return { seconds: chars / cps, learned: false, rateLabel: `${cps} ký tự/s mặc định` };
    }
    const wpm = FALLBACK_WPM[language] || 200;
    return { seconds: (words / wpm) * 60, learned: false, rateLabel: `${wpm} WPM mặc định` };
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
    target.textContent = formatDuration(estimate.seconds);
    const voiceName = document.getElementById('vr-selected-voice-name')?.textContent || voiceId;
    target.title = estimate.learned
      ? `Ước tính theo tốc độ đã đo của ${voiceName}: ${estimate.rateLabel}`
      : `Chưa có dữ liệu tốc độ của ${voiceName}; đang dùng ${estimate.rateLabel}. Nghe thử hoặc render để tự hiệu chỉnh.`;
    target.dataset.rateSource = estimate.learned ? 'learned' : 'fallback';
  }

  function calibrateAudioFile(audioPath, voiceId, language, text, source) {
    if (!audioPath) return;
    const audio = new Audio(`file:///${String(audioPath).replace(/\\/g, '/')}`);
    audio.preload = 'metadata';
    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', cleanup);
    };
    const onLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        recordRateSample(voiceId, language, text, audio.duration, source);
      }
      cleanup();
    };
    audio.addEventListener('loadedmetadata', onLoaded, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    audio.load();
  }

  function installTtsCalibration() {
    if (!window.api?.post || window.api.post.__voiceRenderRateWrapped) return;
    const originalPost = window.api.post.bind(window.api);
    const wrapped = async (endpoint, payload, ...rest) => {
      const result = await originalPost(endpoint, payload, ...rest);
      if (endpoint === '/api/tts/generate' && result?.status === 'ok' && result.audio_path && payload?.text === PREVIEW_TEXT && pendingPreviewVoiceId) {
        calibrateAudioFile(result.audio_path, pendingPreviewVoiceId, payload.language || selectedLanguage(), payload.text, 'preview');
      }
      return result;
    };
    wrapped.__voiceRenderRateWrapped = true;
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

      const selectVoice = event.target?.closest?.('[data-select-voice]');
      if (selectVoice) setTimeout(updateAdaptiveEstimate, 0);
    }, true);

    const resultAudio = document.getElementById('vr-result-audio');
    resultAudio?.addEventListener('loadedmetadata', () => {
      if (!pendingRunSnapshot || !Number.isFinite(resultAudio.duration) || resultAudio.duration <= 0) return;
      recordRateSample(
        pendingRunSnapshot.voiceId,
        pendingRunSnapshot.language,
        pendingRunSnapshot.text,
        resultAudio.duration,
        'full-render'
      );
      pendingRunSnapshot = null;
    });

    ['vr-text', 'vr-language', 'vr-chunk-size', 'vr-auto-chunk', 'vr-keep-paragraphs'].forEach((id) => {
      const el = document.getElementById(id);
      el?.addEventListener('input', () => setTimeout(updateAdaptiveEstimate, 0));
      el?.addEventListener('change', () => setTimeout(updateAdaptiveEstimate, 0));
    });
    window.addEventListener('tts-voices-updated', () => setTimeout(updateAdaptiveEstimate, 0));
    setTimeout(updateAdaptiveEstimate, 0);
  }

  async function refreshOwnerStatus() {
    if (!document.getElementById('global-app-status')) return;

    let backendOk = false;
    let ttsOk = false;

    try {
      await window.api?.health?.();
      backendOk = true;
      setStatus('global-status-backend', 'Sẵn sàng', true);
    } catch {
      setStatus('global-status-backend', 'Mất kết nối', false);
    }

    try {
      const tts = await window.api?.getTTSStatus?.();
      ttsOk = !!tts?.available;
      setStatus('global-status-tts', ttsOk ? (tts.model_loaded ? 'Đã nạp' : 'Sẵn sàng') : 'Chưa sẵn sàng', ttsOk);
    } catch {
      setStatus('global-status-tts', 'Không khả dụng', false);
    }

    try {
      const gpu = await window.api?.gpuInfo?.();
      const name = gpu?.gpu_name || gpu?.name || 'Không khả dụng';
      const available = gpu?.gpu_available ?? gpu?.cuda_available;
      const vram = gpu?.vram_total ? ` · ${gpu.vram_total}` : '';
      setStatus('global-status-gpu', `${name}${vram}`, available === true ? true : available === false ? false : undefined, name);
    } catch {
      setStatus('global-status-gpu', 'Không khả dụng', undefined);
    }

    try {
      const info = await window.electronAPI?.getSystemInfo?.();
      const cpuPct = Number.isFinite(info?.cpu_usage_percent) ? `${Math.round(info.cpu_usage_percent)}%` : '—';
      const cpuTitle = info?.cpu_model ? `${info.cpu_model} · ${info.logical_cores || '—'} luồng` : '';
      setStatus('global-status-cpu', cpuPct, Number.isFinite(info?.cpu_usage_percent) ? true : undefined, cpuTitle);

      if (info?.total_memory_bytes) {
        const used = Number(info.used_memory_bytes ?? (info.total_memory_bytes - info.free_memory_bytes));
        const total = Number(info.total_memory_bytes);
        const ramPct = Number.isFinite(info?.memory_usage_percent)
          ? `${Math.round(info.memory_usage_percent)}%`
          : `${Math.round((used / total) * 100)}%`;
        setStatus('global-status-ram', ramPct, true, `${(used / 1073741824).toFixed(1)} / ${(total / 1073741824).toFixed(1)} GB`);
      } else {
        setStatus('global-status-ram', 'Không khả dụng', undefined);
      }

      const version = `VSR ${info?.app_version ? `v${info.app_version}` : ''} · Electron ${info?.electron_version || '—'}`;
      setStatus('global-status-version', version, true);
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
      const bridgeOk = !!(window.electronAPI?.saveFile && window.electronAPI?.mergeWavFiles);
      if (!bridgeOk) {
        console.error('[Voice Render] render bridge missing: saveFile/mergeWavFiles unavailable');
        window.showToast?.('Bridge lưu/ghép Voice Render chưa sẵn sàng. Xem log PowerShell.', 'error');
      }
    }, true);
  }

  function install() {
    const timer = setInterval(() => {
      if (!document.getElementById('global-app-status')) return;
      clearInterval(timer);
      refreshOwnerStatus();
      installRenderDiagnostics();
      installTtsCalibration();
      document.getElementById('global-status-refresh')?.addEventListener('click', refreshOwnerStatus);
      setInterval(refreshOwnerStatus, 10000);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
