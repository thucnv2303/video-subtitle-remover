(function () {
  'use strict';

  const ENVELOPE_PREFIX = '[[VSR_REF_TEXT_B64:';
  const MAX_REF_TEXT_CHARS = 4000;
  const INSTALL_RETRY_MS = 50;
  const INSTALL_RETRY_LIMIT = 120;

  function readVoices() {
    try {
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      return Array.isArray(voices) ? voices : [];
    } catch {
      return [];
    }
  }

  function writeVoices(voices, source) {
    localStorage.setItem('tts_voices', JSON.stringify(voices));
    window.dispatchEvent(new CustomEvent('tts-voices-updated', {
      detail: { source: source || 'voice-reference-transcript' },
    }));
  }

  function normalizedPath(value) {
    return String(value || '').replace(/\\/g, '/').toLowerCase();
  }

  function transcriptOf(voice) {
    return String(
      voice?.referenceTranscript ||
      voice?.transcript ||
      voice?.referenceText ||
      ''
    ).trim();
  }

  function findVoiceByRefAudio(refAudioPath) {
    const needle = normalizedPath(refAudioPath);
    if (!needle) return { voice: null, index: -1 };
    const voices = readVoices();
    const index = voices.findIndex((voice) => normalizedPath(voice?.audioPath) === needle);
    return { voice: index >= 0 ? voices[index] : null, index };
  }

  function utf8ToBase64(value) {
    const bytes = new TextEncoder().encode(String(value));
    let binary = '';
    const block = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += block) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + block));
    }
    return btoa(binary);
  }

  function wrapTargetText(targetText, refText) {
    const target = String(targetText || '');
    const reference = String(refText || '').trim();
    if (!reference) throw new Error('Voice clone thiếu transcript chính xác của audio mẫu.');
    if (reference.length > MAX_REF_TEXT_CHARS) {
      throw new Error(`Transcript audio mẫu vượt ${MAX_REF_TEXT_CHARS.toLocaleString('vi-VN')} ký tự.`);
    }
    return `${ENVELOPE_PREFIX}${utf8ToBase64(reference)}]]\n${target}`;
  }

  function modalTranscript() {
    const modal = document.getElementById('vr-clone-modal');
    if (!modal || modal.classList.contains('hidden')) return '';
    return String(document.getElementById('vr-clone-note')?.value || '').trim();
  }

  function prepareClonePayload(endpoint, payload) {
    if (endpoint !== '/api/tts/generate' || !payload?.ref_audio_path) return payload;
    if (String(payload.text || '').startsWith(ENVELOPE_PREFIX)) return payload;

    const { voice } = findVoiceByRefAudio(payload.ref_audio_path);
    const refText = voice ? transcriptOf(voice) : modalTranscript();
    if (!refText) {
      const voiceName = voice?.name ? ` “${voice.name}”` : '';
      throw new Error(`Voice clone${voiceName} thiếu transcript audio mẫu. Hãy bổ sung transcript chính xác trước khi nghe thử/render.`);
    }
    return {
      ...payload,
      text: wrapTargetText(payload.text, refText),
    };
  }

  function installPostWrapper() {
    if (!window.api?.post) return false;
    if (window.api.post.__voiceReferenceTranscriptWrapped) return true;

    const originalPost = window.api.post.bind(window.api);
    const wrapped = async (endpoint, payload, ...rest) => {
      const prepared = prepareClonePayload(endpoint, payload);
      return originalPost(endpoint, prepared, ...rest);
    };
    wrapped.__voiceReferenceTranscriptWrapped = true;
    wrapped.__voiceReferenceTranscriptInner = originalPost;
    window.api.post = wrapped;
    return true;
  }

  function migrateExplicitTranscriptFields() {
    const voices = readVoices();
    let changed = false;
    voices.forEach((voice) => {
      if (voice?.referenceTranscript) return;
      const legacy = String(voice?.transcript || voice?.referenceText || '').trim();
      if (!legacy) return;
      voice.referenceTranscript = legacy;
      voice.transcript = legacy;
      changed = true;
    });
    if (changed) writeVoices(voices, 'voice-reference-transcript-migration');
  }

  function updateCloneFormContract() {
    const field = document.getElementById('vr-clone-note');
    if (!field) return false;
    const label = field.closest('.vr-field')?.querySelector('span');
    if (label) label.innerHTML = 'Transcript chính xác của audio mẫu <small>(bắt buộc)</small>';
    field.placeholder = 'Chép đúng từng từ được nói trong audio mẫu. Transcript này dùng để giữ căn chỉnh voice clone và tránh mất từ đầu.';
    field.required = true;
    return true;
  }

  function decorateVoiceRenderRows() {
    document.querySelectorAll('[data-voice-row^="clone:"]').forEach((row) => {
      const id = row.getAttribute('data-voice-row') || '';
      const index = Number(id.split(':')[1]);
      if (!Number.isInteger(index) || index < 0) return;
      const voice = readVoices()[index];
      if (!voice) return;

      const missing = !transcriptOf(voice);
      const copy = row.querySelector('.vr-voice-copy small');
      if (copy) {
        const clean = copy.textContent.replace(/\s*·\s*Thiếu transcript mẫu/g, '').trim();
        copy.textContent = missing ? `${clean} · Thiếu transcript mẫu` : clean;
        copy.classList.toggle('vr-ref-transcript-missing', missing);
      }
      row.classList.toggle('vr-ref-transcript-row-missing', missing);

      let button = row.querySelector('[data-add-ref-transcript]');
      if (!missing) {
        button?.remove();
        return;
      }
      if (button) return;

      button = document.createElement('button');
      button.type = 'button';
      button.className = 'vr-preview-btn vr-transcript-action';
      button.dataset.addRefTranscript = String(index);
      button.textContent = '＋ Bổ sung transcript audio mẫu';
      button.title = 'Bổ sung transcript chính xác của audio mẫu clone';
      button.style.gridColumn = '1 / -1';
      button.style.height = '28px';
      button.style.borderColor = 'rgba(245, 158, 11, .42)';
      button.style.background = 'rgba(245, 158, 11, .09)';
      button.style.color = '#fbbf24';
      button.style.fontWeight = '700';
      row.appendChild(button);
    });
  }

  function decorateSettingsRows() {
    const list = document.getElementById('saved-voices-list');
    if (!list) return;
    const voices = readVoices();
    list.querySelectorAll('.approved-voice-row').forEach((row, fallbackIndex) => {
      const deleteButton = row.querySelector('[data-delete-voice]');
      const index = Number(deleteButton?.dataset.deleteVoice ?? fallbackIndex);
      if (!Number.isInteger(index) || index < 0) return;
      const voice = voices[index];
      if (!voice) return;

      const missing = !transcriptOf(voice);
      let button = row.querySelector('[data-add-ref-transcript]');
      if (!missing) {
        button?.remove();
        return;
      }
      if (button) return;

      button = document.createElement('button');
      button.type = 'button';
      button.className = 'approved-secondary-btn compact';
      button.dataset.addRefTranscript = String(index);
      button.textContent = '＋ Transcript';
      button.title = 'Bổ sung transcript chính xác của audio mẫu clone';
      button.style.marginLeft = 'auto';
      if (deleteButton) row.insertBefore(button, deleteButton);
      else row.appendChild(button);
    });
  }

  function decorateTranscriptUi() {
    decorateVoiceRenderRows();
    decorateSettingsRows();
  }

  function installListObservers() {
    const bindObserver = (element, key) => {
      if (!element || element.dataset[key] === 'true') return;
      element.dataset[key] = 'true';
      const observer = new MutationObserver(() => decorateTranscriptUi());
      observer.observe(element, { childList: true, subtree: true });
    };

    const discover = () => {
      bindObserver(document.getElementById('vr-voice-list'), 'refTranscriptObserved');
      bindObserver(document.getElementById('saved-voices-list'), 'refTranscriptObserved');
      decorateTranscriptUi();
    };

    discover();
    const discoveryObserver = new MutationObserver(discover);
    discoveryObserver.observe(document.body || document.documentElement, { childList: true, subtree: true });
    setTimeout(() => discoveryObserver.disconnect(), 15000);
  }

  function saveLegacyTranscript(index) {
    const voices = readVoices();
    const voice = voices[index];
    if (!voice) return;
    const current = transcriptOf(voice);
    const value = window.prompt(
      `Nhập transcript CHÍNH XÁC của audio mẫu cho voice “${voice.name || index + 1}”:\n\nKhông nhập mô tả chất giọng. Phải nhập đúng nội dung được nói trong file audio mẫu.`,
      current
    );
    if (value === null) return;
    const transcript = value.trim();
    if (!transcript) {
      window.showToast?.('Transcript audio mẫu không được để trống.', 'warning');
      return;
    }
    if (transcript.length > MAX_REF_TEXT_CHARS) {
      window.showToast?.(`Transcript vượt ${MAX_REF_TEXT_CHARS.toLocaleString('vi-VN')} ký tự.`, 'warning');
      return;
    }
    voice.referenceTranscript = transcript;
    voice.transcript = transcript;
    voice.note = transcript;
    voices[index] = voice;
    writeVoices(voices, 'voice-reference-transcript-update');
    window.showToast?.(`Đã lưu transcript mẫu cho ${voice.name || `voice ${index + 1}`}.`, 'success');
    setTimeout(decorateTranscriptUi, 0);
  }

  function installUiGuards() {
    if (document.documentElement.dataset.voiceReferenceTranscriptGuards === 'true') return;
    document.documentElement.dataset.voiceReferenceTranscriptGuards = 'true';

    document.addEventListener('click', (event) => {
      const updateButton = event.target?.closest?.('[data-add-ref-transcript]');
      if (updateButton) {
        event.preventDefault();
        event.stopImmediatePropagation();
        saveLegacyTranscript(Number(updateButton.dataset.addRefTranscript));
        return;
      }

      const testClone = event.target?.closest?.('#vr-test-clone');
      const saveClone = event.target?.closest?.('#vr-save-clone');
      if (testClone || saveClone) {
        const transcript = String(document.getElementById('vr-clone-note')?.value || '').trim();
        if (!transcript) {
          event.preventDefault();
          event.stopImmediatePropagation();
          document.getElementById('vr-clone-note')?.focus();
          window.showToast?.('Nhập transcript chính xác của audio mẫu trước khi tạo/nghe thử voice clone.', 'warning');
          return;
        }
      }

      if (saveClone) {
        const name = String(document.getElementById('vr-clone-name')?.value || '').trim();
        const transcript = String(document.getElementById('vr-clone-note')?.value || '').trim();
        setTimeout(() => {
          if (!name || !transcript) return;
          const voices = readVoices();
          const index = voices.findIndex((voice) => String(voice?.name || '').trim() === name);
          if (index < 0) return;
          voices[index] = {
            ...voices[index],
            referenceTranscript: transcript,
            transcript,
            note: transcript,
          };
          writeVoices(voices, 'voice-reference-transcript-save');
        }, 0);
      }
    }, true);

    window.addEventListener('tts-voices-updated', () => setTimeout(decorateTranscriptUi, 0));
  }

  function init() {
    migrateExplicitTranscriptFields();
    installUiGuards();
    installListObservers();

    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const postReady = installPostWrapper();
      const formReady = updateCloneFormContract();
      decorateTranscriptUi();
      if ((postReady && formReady && document.getElementById('vr-voice-list')) || attempts >= INSTALL_RETRY_LIMIT) {
        clearInterval(timer);
      }
    }, INSTALL_RETRY_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();