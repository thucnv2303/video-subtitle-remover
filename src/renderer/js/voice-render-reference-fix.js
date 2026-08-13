(function () {
  'use strict';

  const ENVELOPE_PREFIX = '[[VSR_REF_TEXT_B64:';
  const MAX_REF_TEXT_CHARS = 4000;
  const INSTALL_RETRY_MS = 50;
  const INSTALL_RETRY_LIMIT = 120;
  let editingVoiceIndex = -1;

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
    return String(voice?.referenceTranscript || voice?.transcript || voice?.referenceText || '').trim();
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
    if (reference.length > MAX_REF_TEXT_CHARS) throw new Error(`Transcript audio mẫu vượt ${MAX_REF_TEXT_CHARS.toLocaleString('vi-VN')} ký tự.`);
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
      throw new Error(`Voice clone${voiceName} thiếu transcript audio mẫu. Hãy mở hồ sơ voice và bổ sung transcript trước khi nghe thử/render.`);
    }
    return { ...payload, text: wrapTargetText(payload.text, refText) };
  }

  function installPostWrapper() {
    if (!window.api?.post) return false;
    if (window.api.post.__voiceReferenceTranscriptWrapped) return true;
    const originalPost = window.api.post.bind(window.api);
    const wrapped = async (endpoint, payload, ...rest) => originalPost(endpoint, prepareClonePayload(endpoint, payload), ...rest);
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
    field.placeholder = 'Chép đúng từng từ được nói trong audio mẫu. Transcript này dùng để căn chỉnh reference audio với OmniVoice.';
    field.required = true;
    return true;
  }

  function ensureEditorStyle() {
    if (document.querySelector('style[data-vr-transcript-editor-style]')) return;
    const style = document.createElement('style');
    style.dataset.vrTranscriptEditorStyle = 'true';
    style.textContent = `
      #vr-transcript-modal[hidden]{display:none!important}
      .vr-ref-transcript-missing{color:#fbbf24!important}
      .vr-transcript-inline{border-color:rgba(245,158,11,.42)!important;background:rgba(245,158,11,.09)!important;color:#fbbf24!important;font-weight:700!important}
      .vr-transcript-profile{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin-bottom:12px;padding:10px 11px;border:1px solid rgba(96,165,250,.16);border-radius:8px;background:rgba(59,130,246,.055)}
      .vr-transcript-profile span,.vr-transcript-help{color:#7690aa;font-size:9px}.vr-transcript-profile strong{display:block;margin-top:3px;color:#e5eef8;font-size:12px}.vr-transcript-profile em{color:#fbbf24;font-size:9px;font-style:normal}
      #vr-transcript-audio{width:100%;height:34px;margin:0 0 12px}#vr-transcript-text{min-height:150px}.vr-transcript-help{margin:-4px 0 13px;line-height:1.5}.vr-transcript-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.vr-transcript-actions .vr-btn{min-width:112px}
    `;
    document.head.appendChild(style);
  }

  function ensureEditor() {
    if (document.getElementById('vr-transcript-modal')) return true;
    const host = document.getElementById('page-voice-render');
    if (!host) return false;
    ensureEditorStyle();
    const modal = document.createElement('div');
    modal.id = 'vr-transcript-modal';
    modal.className = 'vr-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="vr-modal-card">
        <div class="vr-modal-head"><div><h2>Hồ sơ voice clone</h2><p>Bổ sung transcript chính xác của audio mẫu để OmniVoice căn chỉnh reference voice với nội dung cần đọc.</p></div><button id="vr-transcript-close" type="button">×</button></div>
        <div class="vr-transcript-profile"><div><span>Voice clone</span><strong id="vr-transcript-voice-name">—</strong></div><em>Thiếu transcript mẫu</em></div>
        <audio id="vr-transcript-audio" controls></audio>
        <label class="vr-field"><span>Transcript chính xác của audio mẫu <small>(bắt buộc)</small></span><textarea id="vr-transcript-text" maxlength="${MAX_REF_TEXT_CHARS}" placeholder="Nhập đúng từng từ được nói trong audio mẫu..."></textarea></label>
        <p class="vr-transcript-help">Đây là transcript của <b>audio dùng để clone voice</b>, không phải nội dung bạn muốn voice đọc. Không nhập mô tả như “giọng nam, trầm, ấm”.</p>
        <div class="vr-transcript-actions"><button id="vr-transcript-cancel" class="vr-btn secondary" type="button">Hủy</button><button id="vr-transcript-save" class="vr-btn primary" type="button">Lưu transcript</button></div>
      </div>`;
    host.appendChild(modal);
    return true;
  }

  function openEditor(index) {
    const voice = readVoices()[index];
    if (!voice || !ensureEditor()) return;
    editingVoiceIndex = index;
    document.getElementById('vr-transcript-voice-name').textContent = voice.name || `Giọng clone ${index + 1}`;
    const text = document.getElementById('vr-transcript-text');
    text.value = transcriptOf(voice);
    const audio = document.getElementById('vr-transcript-audio');
    const audioPath = String(voice.audioPath || '');
    audio.src = audioPath ? `file:///${audioPath.replace(/\\/g, '/')}` : '';
    document.getElementById('vr-transcript-modal').hidden = false;
    setTimeout(() => text.focus(), 0);
  }

  function closeEditor() {
    const modal = document.getElementById('vr-transcript-modal');
    if (modal) modal.hidden = true;
    editingVoiceIndex = -1;
  }

  function saveEditor() {
    if (editingVoiceIndex < 0) return;
    const transcript = String(document.getElementById('vr-transcript-text')?.value || '').trim();
    if (!transcript) {
      window.showToast?.('Transcript audio mẫu không được để trống.', 'warning');
      document.getElementById('vr-transcript-text')?.focus();
      return;
    }
    if (transcript.length > MAX_REF_TEXT_CHARS) {
      window.showToast?.(`Transcript vượt ${MAX_REF_TEXT_CHARS.toLocaleString('vi-VN')} ký tự.`, 'warning');
      return;
    }
    const voices = readVoices();
    const voice = voices[editingVoiceIndex];
    if (!voice) return;
    voice.referenceTranscript = transcript;
    voice.transcript = transcript;
    voices[editingVoiceIndex] = voice;
    writeVoices(voices, 'voice-reference-transcript-update');
    window.showToast?.(`Đã cập nhật transcript mẫu cho ${voice.name || `voice ${editingVoiceIndex + 1}`}.`, 'success');
    closeEditor();
    setTimeout(decorateRows, 0);
  }

  function decorateRows() {
    ensureEditor();
    document.querySelectorAll('[data-voice-row^="clone:"]').forEach((row) => {
      const index = Number((row.getAttribute('data-voice-row') || '').split(':')[1]);
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
      const action = row.querySelector('.vr-preview-btn');
      if (action) {
        if (missing) {
          action.removeAttribute('data-preview-voice');
          action.dataset.editRefTranscript = String(index);
          action.textContent = 'Transcript';
          action.title = 'Mở hồ sơ voice để bổ sung transcript audio mẫu';
          action.disabled = false;
          action.classList.add('vr-transcript-inline');
        } else if (action.hasAttribute('data-edit-ref-transcript')) {
          action.removeAttribute('data-edit-ref-transcript');
          action.dataset.previewVoice = `clone:${index}`;
          action.textContent = '▶ Nghe thử';
          action.title = 'Nghe thử voice';
          action.classList.remove('vr-transcript-inline');
        }
      }
      row.querySelectorAll('[data-add-ref-transcript]').forEach((legacy) => legacy.remove());
    });
    document.querySelectorAll('#saved-voices-list [data-add-ref-transcript]').forEach((legacy) => legacy.remove());
  }

  function installObserver() {
    const discover = () => {
      const list = document.getElementById('vr-voice-list');
      if (list && list.dataset.refTranscriptObserved !== 'true') {
        list.dataset.refTranscriptObserved = 'true';
        new MutationObserver(() => decorateRows()).observe(list, { childList: true, subtree: true });
      }
      decorateRows();
    };
    discover();
    const observer = new MutationObserver(discover);
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 15000);
  }

  function installUiGuards() {
    if (document.documentElement.dataset.voiceReferenceTranscriptGuards === 'true') return;
    document.documentElement.dataset.voiceReferenceTranscriptGuards = 'true';
    document.addEventListener('click', (event) => {
      const edit = event.target?.closest?.('[data-edit-ref-transcript]');
      if (edit) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openEditor(Number(edit.dataset.editRefTranscript));
        return;
      }
      if (event.target?.closest?.('#vr-transcript-save')) { event.preventDefault(); saveEditor(); return; }
      if (event.target?.closest?.('#vr-transcript-cancel, #vr-transcript-close')) { event.preventDefault(); closeEditor(); return; }
      const modal = document.getElementById('vr-transcript-modal');
      if (modal && event.target === modal) { closeEditor(); return; }

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
          voices[index] = { ...voices[index], referenceTranscript: transcript, transcript };
          writeVoices(voices, 'voice-reference-transcript-save');
        }, 0);
      }
    }, true);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !document.getElementById('vr-transcript-modal')?.hidden) closeEditor();
    });
    window.addEventListener('tts-voices-updated', () => setTimeout(decorateRows, 0));
  }

  function init() {
    migrateExplicitTranscriptFields();
    installUiGuards();
    installObserver();
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      const postReady = installPostWrapper();
      const formReady = updateCloneFormContract();
      const editorReady = ensureEditor();
      decorateRows();
      if ((postReady && formReady && editorReady && document.getElementById('vr-voice-list')) || attempts >= INSTALL_RETRY_LIMIT) clearInterval(timer);
    }, INSTALL_RETRY_MS);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();