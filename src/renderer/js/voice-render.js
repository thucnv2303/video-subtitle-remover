(function () {
  'use strict';

  const PAGE_ID = 'page-voice-render';
  const NAV_ID = 'nav-voice-render';
  const STYLE_ATTR = 'data-voice-render-style';
  const DEFAULT_TEXT = 'Xin chào, đây là bản thu thử được tạo bằng OmniVoice.';

  const state = {
    rendering: false,
    lastAudioPath: '',
  };

  function ensureStyle() {
    if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/voice-render.css';
    link.setAttribute(STYLE_ATTR, 'true');
    document.head.appendChild(link);
  }

  function getSavedVoices() {
    try {
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      return Array.isArray(voices) ? voices : [];
    } catch {
      return [];
    }
  }

  function mountNav() {
    const menu = document.querySelector('.nav-menu');
    if (!menu || document.getElementById(NAV_ID)) return;
    const settingsItem = menu.querySelector('[data-page="settings"]');
    const item = document.createElement('a');
    item.href = '#';
    item.id = NAV_ID;
    item.className = 'nav-item';
    item.dataset.page = 'voice-render';
    item.title = 'Voice Render';
    item.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
      </svg>
      <span>Voice Render</span>`;
    if (settingsItem) menu.insertBefore(item, settingsItem);
    else menu.appendChild(item);
  }

  function mountPage() {
    const main = document.querySelector('.main-area');
    if (!main || document.getElementById(PAGE_ID)) return;
    const section = document.createElement('section');
    section.id = PAGE_ID;
    section.className = 'page voice-render-page';
    section.innerHTML = `
      <div class="voice-render-shell">
        <header class="voice-render-header">
          <div>
            <div class="voice-render-eyebrow">Công cụ độc lập</div>
            <h1>Voice Render</h1>
            <p>Render nhanh một file giọng nói bằng OmniVoice. Công cụ này không tạo Job và không tác động Pipeline 1/2/3.</p>
          </div>
          <div class="voice-render-engine-pill"><span></span> OmniVoice</div>
        </header>

        <div class="voice-render-grid">
          <section class="voice-render-panel voice-render-editor">
            <div class="voice-render-panel-title">
              <div><span class="voice-render-step">1</span><h2>Nội dung & giọng đọc</h2></div>
              <span id="voice-render-char-count" class="voice-render-meta">0 ký tự</span>
            </div>

            <label class="voice-render-field voice-render-text-field">
              <span>Văn bản cần đọc</span>
              <textarea id="voice-render-text" maxlength="12000" placeholder="Nhập nội dung cần render...">${DEFAULT_TEXT}</textarea>
              <small>Giữ nội dung ngắn gọn cho bản demo. Text được gửi trực tiếp tới OmniVoice local.</small>
            </label>

            <div class="voice-render-two-col">
              <label class="voice-render-field">
                <span>Ngôn ngữ</span>
                <select id="voice-render-language">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </label>

              <label class="voice-render-field">
                <span>Giọng OmniVoice</span>
                <select id="voice-render-voice"></select>
              </label>
            </div>

            <div id="voice-render-voice-help" class="voice-render-voice-help"></div>

            <div class="voice-render-actions">
              <button id="voice-render-refresh-voices" class="voice-render-btn secondary" type="button">↻ Làm mới giọng</button>
              <button id="voice-render-start" class="voice-render-btn primary" type="button">Render voice</button>
            </div>
          </section>

          <section class="voice-render-panel voice-render-result-panel">
            <div class="voice-render-panel-title">
              <div><span class="voice-render-step">2</span><h2>Kết quả</h2></div>
              <span id="voice-render-status" class="voice-render-status idle">Sẵn sàng</span>
            </div>

            <div id="voice-render-empty" class="voice-render-empty">
              <div class="voice-render-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              <strong>Chưa có audio</strong>
              <p>Nhập nội dung và bấm Render voice. Bạn sẽ chọn nơi lưu file WAV trước khi xử lý.</p>
            </div>

            <div id="voice-render-result" class="voice-render-result hidden">
              <audio id="voice-render-audio" controls></audio>
              <div class="voice-render-output-card">
                <span>File đã render</span>
                <code id="voice-render-output-path"></code>
              </div>
              <div class="voice-render-result-actions">
                <button id="voice-render-open-file" class="voice-render-btn secondary" type="button">Mở file</button>
                <button id="voice-render-render-again" class="voice-render-btn primary-soft" type="button">Render lại</button>
              </div>
            </div>

            <div class="voice-render-note">
              <strong>Độc lập với workflow chính</strong>
              <p>Không đọc/ghi trạng thái Job, không thay đổi P1/P2/P3 gate và không tự gắn audio vào video.</p>
            </div>
          </section>
        </div>
      </div>`;
    main.appendChild(section);
  }

  function populateVoices() {
    const select = document.getElementById('voice-render-voice');
    const help = document.getElementById('voice-render-voice-help');
    if (!select) return;
    const previous = select.value;
    const voices = getSavedVoices();
    select.innerHTML = '<option value="default">OmniVoice mặc định</option>';
    voices.forEach((voice, index) => {
      if (!voice?.audioPath) return;
      const option = document.createElement('option');
      option.value = `clone:${index}`;
      option.textContent = voice.name ? `Giọng clone — ${voice.name}` : `Giọng clone ${index + 1}`;
      select.appendChild(option);
    });
    if ([...select.options].some((option) => option.value === previous)) select.value = previous;
    if (help) {
      help.innerHTML = voices.some((voice) => voice?.audioPath)
        ? `Có <strong>${voices.filter((voice) => voice?.audioPath).length}</strong> giọng clone sẵn sàng. Quản lý danh sách này trong Cài đặt → TTS & Giọng đọc.`
        : 'Chưa có giọng clone. Tab vẫn có thể render bằng OmniVoice mặc định; muốn clone giọng hãy thêm audio mẫu trong Cài đặt.';
    }
  }

  function getRefAudioPath() {
    const value = document.getElementById('voice-render-voice')?.value || 'default';
    if (!value.startsWith('clone:')) return null;
    const index = Number(value.split(':')[1]);
    return getSavedVoices()[index]?.audioPath || null;
  }

  function setStatus(kind, text) {
    const el = document.getElementById('voice-render-status');
    if (!el) return;
    el.className = `voice-render-status ${kind}`;
    el.textContent = text;
  }

  function updateCount() {
    const text = document.getElementById('voice-render-text')?.value || '';
    const count = document.getElementById('voice-render-char-count');
    if (count) count.textContent = `${text.length.toLocaleString('vi-VN')} ký tự`;
  }

  function setRendering(rendering) {
    state.rendering = rendering;
    const button = document.getElementById('voice-render-start');
    if (button) {
      button.disabled = rendering;
      button.textContent = rendering ? 'Đang render…' : 'Render voice';
    }
    document.getElementById('voice-render-text')?.toggleAttribute('disabled', rendering);
    document.getElementById('voice-render-language')?.toggleAttribute('disabled', rendering);
    document.getElementById('voice-render-voice')?.toggleAttribute('disabled', rendering);
    document.getElementById('voice-render-refresh-voices')?.toggleAttribute('disabled', rendering);
  }

  async function renderVoice() {
    if (state.rendering) return;
    const text = document.getElementById('voice-render-text')?.value.trim() || '';
    const language = document.getElementById('voice-render-language')?.value || 'vi';
    const refAudioPath = getRefAudioPath();

    if (!text) {
      window.showToast?.('Nhập nội dung trước khi render.', 'warning');
      document.getElementById('voice-render-text')?.focus();
      return;
    }
    if (!window.api?.post) {
      window.showToast?.('TTS API chưa sẵn sàng.', 'error');
      return;
    }
    if (!window.electronAPI?.saveFile) {
      window.showToast?.('Chọn nơi lưu file chỉ khả dụng trong app desktop.', 'error');
      return;
    }

    const selectedVoice = document.getElementById('voice-render-voice')?.selectedOptions?.[0]?.textContent || 'OmniVoice';
    const defaultName = `voice-render-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.wav`;
    const outputPath = await window.electronAPI.saveFile(defaultName);
    if (!outputPath) return;

    setRendering(true);
    setStatus('working', 'Đang render');
    window.addLog?.(`[Voice Render] Bắt đầu OmniVoice (${selectedVoice}, ${text.length} ký tự).`, 'info');

    try {
      const result = await window.api.post('/api/tts/generate', {
        text,
        ref_audio_path: refAudioPath,
        language,
        output_path: outputPath,
      });
      if (result?.status !== 'ok' || !result.audio_path) {
        throw new Error(result?.error || 'OmniVoice không tạo được file audio.');
      }
      state.lastAudioPath = result.audio_path;
      const audio = document.getElementById('voice-render-audio');
      if (audio) {
        audio.src = `file:///${result.audio_path.replace(/\\/g, '/')}`;
        audio.load();
      }
      const pathEl = document.getElementById('voice-render-output-path');
      if (pathEl) pathEl.textContent = result.audio_path;
      document.getElementById('voice-render-empty')?.classList.add('hidden');
      document.getElementById('voice-render-result')?.classList.remove('hidden');
      setStatus('success', 'Hoàn tất');
      window.addLog?.(`[Voice Render] Hoàn tất: ${result.audio_path}`, 'success');
      window.showToast?.('Đã render voice.', 'success');
    } catch (error) {
      setStatus('error', 'Lỗi render');
      window.addLog?.(`[Voice Render] ${error?.message || error}`, 'error');
      window.showToast?.(error?.message || 'Không thể render voice.', 'error');
    } finally {
      setRendering(false);
    }
  }

  function activatePage(page) {
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.page === page));
    document.querySelectorAll('.page').forEach((pageEl) => pageEl.classList.toggle('active', pageEl.id === `page-${page}`));
  }

  function bindNavigation() {
    const item = document.getElementById(NAV_ID);
    if (!item || item.dataset.bound === 'true') return;
    item.dataset.bound = 'true';
    item.addEventListener('click', (event) => {
      event.preventDefault();
      populateVoices();
      activatePage('voice-render');
    });
  }

  function bindPage() {
    const text = document.getElementById('voice-render-text');
    text?.addEventListener('input', updateCount);
    document.getElementById('voice-render-refresh-voices')?.addEventListener('click', () => {
      populateVoices();
      window.showToast?.('Đã làm mới danh sách giọng.', 'info');
    });
    document.getElementById('voice-render-start')?.addEventListener('click', renderVoice);
    document.getElementById('voice-render-render-again')?.addEventListener('click', renderVoice);
    document.getElementById('voice-render-open-file')?.addEventListener('click', async () => {
      if (!state.lastAudioPath || !window.electronAPI?.openPath) return;
      await window.electronAPI.openPath(state.lastAudioPath);
    });
    updateCount();
    populateVoices();
  }

  function init() {
    ensureStyle();
    mountNav();
    mountPage();
    bindNavigation();
    bindPage();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
