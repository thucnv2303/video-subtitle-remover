(function () {
  'use strict';

  const SPEED_MIN = 0.75;
  const SPEED_MAX = 1.25;
  const CHUNK_OPTIONS = [300, 450, 600];
  const DEFAULT_CHUNK_SIZE = 450;

  function readSavedVoices() {
    try {
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      return Array.isArray(voices) ? voices : [];
    } catch {
      return [];
    }
  }

  function writeSavedVoices(voices, source) {
    localStorage.setItem('tts_voices', JSON.stringify(voices));
    window.dispatchEvent(new CustomEvent('tts-voices-updated', {
      detail: { source: source || 'voice-render-quality-fix' },
    }));
  }

  function normalizedPath(value) {
    return String(value || '').replace(/\\/g, '/').toLowerCase();
  }

  function boundedSpeed(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(SPEED_MIN, Math.min(SPEED_MAX, parsed));
  }

  function resetSyntheticLegacySpeeds() {
    const voices = readSavedVoices();
    let changed = false;
    voices.forEach((voice) => {
      if (!voice?.profileMigrated) return;
      if (voice?.speedSource === 'user') return;
      if (Number(voice?.speedFactor) !== 1 || voice?.speedSource !== 'legacy-neutral') {
        voice.speedFactor = 1;
        voice.speedSource = 'legacy-neutral';
        changed = true;
      }
    });
    if (changed) writeSavedVoices(voices, 'voice-render-legacy-speed-neutralized');
  }

  function installSafeChunkOptions() {
    const select = document.getElementById('vr-chunk-size');
    if (!select || select.dataset.qualityChunkOptions === 'true') return !!select;
    const current = Number(select.value || DEFAULT_CHUNK_SIZE);
    select.innerHTML = '';
    CHUNK_OPTIONS.forEach((size) => {
      const option = document.createElement('option');
      option.value = String(size);
      option.textContent = `${size.toLocaleString('vi-VN')} ký tự`;
      select.appendChild(option);
    });
    const safeCurrent = CHUNK_OPTIONS.includes(current) ? current : DEFAULT_CHUNK_SIZE;
    select.value = String(safeCurrent);
    select.dataset.qualityChunkOptions = 'true';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function findCloneByRefAudio(refAudioPath) {
    const needle = normalizedPath(refAudioPath);
    if (!needle) return null;
    const voices = readSavedVoices();
    const index = voices.findIndex((voice) => normalizedPath(voice?.audioPath) === needle);
    if (index < 0) return null;
    return { index, voice: voices[index], voices };
  }

  function installNativeCloneSpeedWrapper() {
    if (!window.api?.post) return false;
    if (window.api.post.__voiceRenderNativeSpeedWrapped) return true;

    const innerPost = window.api.post.bind(window.api);
    const wrapped = async (endpoint, payload, ...rest) => {
      if (endpoint !== '/api/tts/generate' || !payload?.ref_audio_path) {
        return innerPost(endpoint, payload, ...rest);
      }

      const match = findCloneByRefAudio(payload.ref_audio_path);
      if (!match) return innerPost(endpoint, payload, ...rest);

      const requestedSpeed = boundedSpeed(match.voice?.speedFactor);
      const baseLanguage = String(payload.language || match.voice?.language || 'vi').split('|vsr-speed=')[0];
      const prepared = {
        ...payload,
        language: `${baseLanguage}|vsr-speed=${requestedSpeed.toFixed(2)}`,
      };

      // The older owner-fix wrapper performs FFmpeg atempo by re-reading the
      // clone's localStorage speed after the request completes. Temporarily
      // neutralize that one value while the wrapped request is in flight so
      // native OmniVoice speed is the only speed transform applied.
      const originalSpeed = match.voice?.speedFactor;
      match.voices[match.index] = { ...match.voice, speedFactor: 1 };
      localStorage.setItem('tts_voices', JSON.stringify(match.voices));
      try {
        return await innerPost(endpoint, prepared, ...rest);
      } finally {
        const latest = readSavedVoices();
        if (latest[match.index]) {
          latest[match.index] = { ...latest[match.index], speedFactor: originalSpeed };
          localStorage.setItem('tts_voices', JSON.stringify(latest));
        }
      }
    };

    wrapped.__voiceRenderNativeSpeedWrapped = true;
    wrapped.__voiceRenderNativeSpeedInner = innerPost;
    window.api.post = wrapped;
    return true;
  }

  function markNewCloneSpeedsExplicit() {
    document.addEventListener('click', (event) => {
      if (!event.target?.closest?.('#vr-save-clone')) return;
      const name = String(document.getElementById('vr-clone-name')?.value || '').trim();
      if (!name) return;
      setTimeout(() => {
        const voices = readSavedVoices();
        const index = voices.findIndex((voice) => String(voice?.name || '').trim() === name);
        if (index < 0) return;
        voices[index] = {
          ...voices[index],
          speedFactor: boundedSpeed(voices[index]?.speedFactor),
          speedSource: 'user',
          profileMigrated: false,
        };
        writeSavedVoices(voices, 'voice-render-explicit-speed');
      }, 0);
    }, true);
  }

  function install() {
    resetSyntheticLegacySpeeds();
    markNewCloneSpeedsExplicit();

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const chunksReady = installSafeChunkOptions();
      const postReady = installNativeCloneSpeedWrapper();
      if ((chunksReady && postReady) || attempts >= 120) clearInterval(timer);
    }, 50);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install, { once: true });
  } else {
    install();
  }
})();
