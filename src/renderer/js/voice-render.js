(function () {
  'use strict';

  const PAGE_ID = 'page-voice-render';
  const NAV_ID = 'nav-voice-render';
  const STYLE_ATTR = 'data-voice-render-style';
  const LOG_LIMIT = 160;
  const PREVIEW_TEXT = 'Xin chào, đây là đoạn nghe thử nhanh của giọng đang chọn trong Voice Render.';
  const SYSTEM_VOICES = [
    { id: 'default', name: 'OmniVoice mặc định', type: 'Mặc định', language: 'vi', tone: 'Tự nhiên · Ổn định', voiceName: null, refAudioPath: null },
    { id: 'vi-VN-HoaiMyNeural', name: 'Hoài My', type: 'Neural', language: 'vi', tone: 'Nữ · Tự nhiên', voiceName: 'vi-VN-HoaiMyNeural', refAudioPath: null },
    { id: 'vi-VN-NamMinhNeural', name: 'Nam Minh', type: 'Neural', language: 'vi', tone: 'Nam · Rõ ràng', voiceName: 'vi-VN-NamMinhNeural', refAudioPath: null },
    { id: 'en-US-JennyNeural', name: 'Jenny', type: 'Neural', language: 'en', tone: 'Nữ · English', voiceName: 'en-US-JennyNeural', refAudioPath: null },
    { id: 'en-US-GuyNeural', name: 'Guy', type: 'Neural', language: 'en', tone: 'Nam · English', voiceName: 'en-US-GuyNeural', refAudioPath: null },
  ];

  const state = {
    rendering: false,
    stopRequested: false,
    previewingVoiceId: null,
    selectedVoiceId: localStorage.getItem('voice_render_voice') || 'default',
    lastAudioPath: '',
    chunks: [],
    completedChunkPaths: [],
    logs: [],
    refAudioPath: '',
    lastSystemRefresh: 0,
  };

  function ensureStyle() {
    if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/voice-render.css';
    link.setAttribute(STYLE_ATTR, 'true');
    document.head.appendChild(link);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function getSavedVoices() {
    try {
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      return Array.isArray(voices) ? voices : [];
    } catch {
      return [];
    }
  }

  function saveVoices(voices) {
    localStorage.setItem('tts_voices', JSON.stringify(voices));
    syncKnownVoiceSelectors(voices);
    window.dispatchEvent(new CustomEvent('tts-voices-updated', { detail: { source: 'voice-render' } }));
  }

  function syncKnownVoiceSelectors(voices = getSavedVoices()) {
    ['tts-voice', 'job-tts-voice', 'step1-tts-voice'].map((id) => document.getElementById(id)).filter(Boolean).forEach((select) => {
      [...select.options].filter((option) => option.value.startsWith('clone:')).forEach((option) => option.remove());
      voices.forEach((voice, index) => {
        if (!voice?.audioPath) return;
        const option = document.createElement('option');
        option.value = `clone:${index}`;
        option.textContent = `Giọng clone - ${voice.name || index + 1}`;
        select.appendChild(option);
      });
      const saved = localStorage.getItem('tts_voice') || select.value;
      if ([...select.options].some((option) => option.value === saved)) select.value = saved;
    });
    try { window.renderSavedVoices?.(); } catch {}
  }

  function normalizeLanguage(value) {
    const raw = String(value || 'vi').trim();
    const key = raw.toLowerCase();
    if (['vi', 'vi-vn', 'tiếng việt', 'tieng viet', 'vietnamese'].includes(key)) return 'vi';
    if (['en', 'en-us', 'en-gb', 'english', 'tiếng anh', 'tieng anh'].includes(key)) return 'en';
    if (['zh', 'zh-cn', 'chinese', '中文'].includes(key)) return 'zh';
    if (['ja', 'ja-jp', 'japanese', '日本語'].includes(key)) return 'ja';
    if (['ko', 'ko-kr', 'korean', '한국어'].includes(key)) return 'ko';
    return raw;
  }

  function voiceCatalog() {
    const clones = getSavedVoices().map((voice, index) => ({
      id: `clone:${index}`,
      name: voice?.name || `Giọng clone ${index + 1}`,
      type: 'Clone',
      language: normalizeLanguage(voice?.language),
      tone: voice?.tone || 'Giọng clone dùng chung',
      voiceName: null,
      refAudioPath: voice?.audioPath || null,
      samplePath: voice?.samplePath || null,
    })).filter((voice) => voice.refAudioPath);
    return [...SYSTEM_VOICES, ...clones];
  }

  function selectedVoice() {
    const voices = voiceCatalog();
    return voices.find((voice) => voice.id === state.selectedVoiceId) || voices[0];
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
      </svg><span>Voice Render</span>`;
    if (settingsItem) menu.insertBefore(item, settingsItem);
    else menu.appendChild(item);
  }

  function mountGlobalStatus() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar || document.getElementById('global-app-status')) return;
    const footer = sidebar.querySelector('.sidebar-footer');
    const card = document.createElement('section');
    card.id = 'global-app-status';
    card.className = 'global-app-status';
    card.innerHTML = `
      <div class="global-status-head"><strong>Trạng thái App</strong><span id="global-status-overall">Đang kiểm tra</span></div>
      <div class="global-status-row"><span>Backend</span><b id="global-status-backend">—</b></div>
      <div class="global-status-row"><span>TTS Engine</span><b id="global-status-tts">—</b></div>
      <div class="global-status-row"><span>GPU</span><b id="global-status-gpu">—</b></div>
      <div class="global-status-row"><span>CPU</span><b id="global-status-cpu">—</b></div>
      <div class="global-status-row"><span>RAM</span><b id="global-status-ram">—</b></div>
      <div class="global-status-foot"><span id="global-status-version">VSR</span><button id="global-status-refresh" type="button">↻</button></div>`;
    if (footer) sidebar.insertBefore(card, footer);
    else sidebar.appendChild(card);
    document.getElementById('gpu-badge')?.classList.add('voice-render-hide-legacy-badge');
    document.getElementById('global-status-refresh')?.addEventListener('click', () => refreshGlobalStatus(true));
  }

  function mountPage() {
    const main = document.querySelector('.main-area');
    if (!main || document.getElementById(PAGE_ID)) return;
    const section = document.createElement('section');
    section.id = PAGE_ID;
    section.className = 'page voice-render-page';
    section.innerHTML = `
      <div class="vr-shell">
        <header class="vr-header">
          <div><h1>Voice Render</h1><p>Render TTS độc lập, dùng chung thư viện voice với luồng xử lý chính và tối ưu cho văn bản dài.</p></div>
          <button id="vr-open-clone" class="vr-btn secondary" type="button">＋ Clone Voice</button>
        </header>

        <div class="vr-grid">
          <section class="vr-panel vr-config">
            <div class="vr-panel-title"><div><span class="vr-step">1</span><h2>Cấu hình render</h2></div><span id="vr-run-status" class="vr-chip idle">Sẵn sàng</span></div>
            <div class="vr-two-col">
              <label class="vr-field"><span>Tên dự án / Tiêu đề</span><input id="vr-project-name" value="Voice Render" maxlength="120"></label>
              <label class="vr-field"><span>Ngôn ngữ</span><select id="vr-language"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="zh">中文</option><option value="ja">日本語</option><option value="ko">한국어</option></select></label>
            </div>
            <div class="vr-selected-voice"><div><span>Giọng đang chọn</span><strong id="vr-selected-voice-name">OmniVoice mặc định</strong></div><button id="vr-focus-voices" class="vr-link-btn" type="button">Chọn giọng ↓</button></div>
            <label class="vr-field vr-text-field"><span>Nội dung render <small>(hỗ trợ văn bản dài)</small></span><textarea id="vr-text" placeholder="Nhập hoặc dán văn bản cần render..."></textarea></label>
            <div class="vr-stats"><div><span>Từ</span><b id="vr-word-count">0</b></div><div><span>Ký tự</span><b id="vr-char-count">0</b></div><div><span>Ước tính</span><b id="vr-duration-est">0 phút</b></div><div><span>Chunk</span><b id="vr-chunk-est">0</b></div></div>
            <div class="vr-long-box"><div class="vr-long-title">Xử lý văn bản dài</div><label><span>Tự chia chunk</span><input id="vr-auto-chunk" type="checkbox" checked></label><label><span>Kích thước chunk</span><select id="vr-chunk-size"><option value="1200">1.200 ký tự</option><option value="1800" selected>1.800 ký tự</option><option value="2500">2.500 ký tự</option><option value="3500">3.500 ký tự</option></select></label><label><span>Giữ đoạn văn</span><input id="vr-keep-paragraphs" type="checkbox" checked></label><label><span>Ghép file đầu ra</span><input id="vr-merge-output" type="checkbox" checked disabled></label></div>
            <div class="vr-actions"><button id="vr-preview-selected" class="vr-btn secondary" type="button">▶ Nghe thử giọng</button><button id="vr-start" class="vr-btn primary" type="button">Render toàn bộ</button></div>
          </section>

          <section class="vr-panel vr-queue-panel">
            <div class="vr-panel-title"><div><span class="vr-step">2</span><h2>Hàng đợi & Tiến trình</h2></div><span id="vr-queue-summary" class="vr-meta">0 chunk</span></div>
            <div id="vr-queue" class="vr-queue"><div class="vr-empty-mini">Chưa có hàng đợi render.</div></div>
            <button id="vr-stop" class="vr-btn danger wide" type="button" disabled>■ Dừng sau chunk hiện tại</button>
          </section>

          <div class="vr-right-stack">
            <section class="vr-panel vr-result-panel">
              <div class="vr-panel-title"><div><span class="vr-step">3</span><h2>Kết quả đầu ra</h2></div><span id="vr-result-badge" class="vr-chip idle">Chưa có</span></div>
              <audio id="vr-result-audio" controls></audio>
              <div class="vr-output"><span>Đường dẫn</span><code id="vr-output-path">—</code></div>
              <div class="vr-result-actions"><button id="vr-open-file" class="vr-btn secondary" type="button" disabled>Mở file</button><button id="vr-open-folder" class="vr-btn secondary" type="button" disabled>Mở thư mục</button></div>
            </section>

            <section id="vr-voice-section" class="vr-panel vr-voice-panel">
              <div class="vr-panel-title"><div><h2>Thư viện giọng nói</h2><small>Dùng chung toàn hệ thống</small></div><button id="vr-refresh-voices" class="vr-link-btn" type="button">↻ Làm mới</button></div>
              <div id="vr-voice-list" class="vr-voice-list"></div>
            </section>

            <section class="vr-panel vr-log-panel">
              <div class="vr-log-head"><h2>Log</h2><div><select id="vr-log-filter"><option value="all">Tất cả</option><option value="info">Info</option><option value="success">Success</option><option value="warn">Warn</option><option value="error">Error</option></select><button id="vr-copy-log" type="button">Copy</button><button id="vr-clear-log" type="button">Xóa</button></div></div>
              <div id="vr-log-output" class="vr-log-output"></div>
            </section>
          </div>
        </div>
      </div>

      <div id="vr-clone-modal" class="vr-modal hidden" role="dialog" aria-modal="true">
        <div class="vr-modal-card">
          <div class="vr-modal-head"><div><h2>Clone Voice</h2><p>Lưu trực tiếp vào thư viện voice chung của app.</p></div><button id="vr-close-clone" type="button">×</button></div>
          <label class="vr-field"><span>Tên giọng</span><input id="vr-clone-name" placeholder="VD: Narrator Clone A" maxlength="80"></label>
          <div class="vr-two-col"><label class="vr-field"><span>Ngôn ngữ</span><select id="vr-clone-language"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label><label class="vr-field"><span>Audio mẫu</span><button id="vr-pick-clone-audio" class="vr-btn secondary" type="button">Chọn audio</button></label></div>
          <div id="vr-clone-file" class="vr-file-line">Chưa chọn file</div>
          <label class="vr-field"><span>Ghi chú / Transcript tham chiếu <small>(không bắt buộc)</small></span><textarea id="vr-clone-note" rows="4" placeholder="Mô tả chất giọng hoặc transcript của audio mẫu..."></textarea></label>
          <audio id="vr-clone-preview-audio" controls></audio>
          <div class="vr-actions"><button id="vr-test-clone" class="vr-btn secondary" type="button">▶ Phân tích / Nghe thử</button><button id="vr-save-clone" class="vr-btn primary" type="button" disabled>Lưu vào thư viện chung</button></div>
        </div>
      </div>`;
    main.appendChild(section);
  }

  function languageLabel(value) {
    return ({ vi: 'Tiếng Việt', en: 'English', zh: '中文', ja: '日本語', ko: '한국어' })[value] || value;
  }

  function renderVoiceList() {
    const list = document.getElementById('vr-voice-list');
    if (!list) return;
    const voices = voiceCatalog();
    if (!voices.some((voice) => voice.id === state.selectedVoiceId)) state.selectedVoiceId = 'default';
    list.innerHTML = voices.map((voice) => `
      <div class="vr-voice-row ${voice.id === state.selectedVoiceId ? 'selected' : ''}" data-voice-row="${escapeHtml(voice.id)}">
        <button class="vr-voice-select" type="button" data-select-voice="${escapeHtml(voice.id)}" aria-label="Chọn ${escapeHtml(voice.name)}"><span class="vr-voice-avatar">●</span><span class="vr-voice-copy"><strong>${escapeHtml(voice.name)}</strong><small>${escapeHtml(voice.type)} · ${escapeHtml(voice.tone)} · ${escapeHtml(languageLabel(voice.language))}</small></span><span class="vr-radio">${voice.id === state.selectedVoiceId ? '✓' : ''}</span></button>
        <button class="vr-preview-btn" type="button" data-preview-voice="${escapeHtml(voice.id)}" ${state.previewingVoiceId ? 'disabled' : ''}>${state.previewingVoiceId === voice.id ? 'Đang tạo…' : '▶ Nghe thử'}</button>
      </div>`).join('');
    const selected = selectedVoice();
    const name = document.getElementById('vr-selected-voice-name');
    if (name) name.textContent = selected?.name || 'OmniVoice mặc định';
    list.querySelectorAll('[data-select-voice]').forEach((button) => button.addEventListener('click', () => {
      if (state.rendering) return;
      state.selectedVoiceId = button.dataset.selectVoice || 'default';
      localStorage.setItem('voice_render_voice', state.selectedVoiceId);
      renderVoiceList();
      vrLog(`Đã chọn giọng: ${selectedVoice()?.name || state.selectedVoiceId}`, 'info');
    }));
    list.querySelectorAll('[data-preview-voice]').forEach((button) => button.addEventListener('click', () => previewVoice(button.dataset.previewVoice)));
  }

  function periodSentenceUnits(text) {
    const source = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!source) return [];

    const units = [];
    let cursor = 0;
    for (let index = 0; index < source.length; index += 1) {
      if (source[index] !== '.') continue;

      let end = index + 1;
      while (end < source.length && /[”"')\]]/.test(source[end])) end += 1;
      if (end < source.length && !/\s/.test(source[end])) continue;

      const whitespaceEnd = (() => {
        let value = end;
        while (value < source.length && /\s/.test(source[value])) value += 1;
        return value;
      })();
      const separator = source.slice(end, whitespaceEnd);
      const value = source.slice(cursor, end).replace(/\s+/g, ' ').trim();
      if (value) {
        units.push({
          text: value,
          terminated: true,
          paragraphBreakAfter: /\n\s*\n/.test(separator),
        });
      }
      cursor = whitespaceEnd;
      index = whitespaceEnd - 1;
    }

    const tail = source.slice(cursor).replace(/\s+/g, ' ').trim();
    if (tail) units.push({ text: tail, terminated: false, paragraphBreakAfter: false });
    return units;
  }

  function splitLongText(input, maxChars, preserveParagraphs = true) {
    const text = String(input || '').replace(/\r\n/g, '\n').trim();
    if (!text) return [];

    const targetChars = Math.max(120, Number(maxChars) || 450);
    const units = periodSentenceUnits(text);
    const chunks = [];
    let current = '';

    const pushCurrent = () => {
      if (!current.trim()) return;
      chunks.push(current.trim());
      current = '';
    };

    for (const unit of units) {
      const candidate = current ? `${current} ${unit.text}` : unit.text;
      if (current && candidate.length > targetChars) {
        pushCurrent();
        current = unit.text;
      } else {
        current = candidate;
      }

      // Paragraph boundaries may end a chunk only when the paragraph itself
      // ended with a period. The character target never authorizes a mid-sentence cut.
      if (preserveParagraphs && unit.terminated && unit.paragraphBreakAfter) pushCurrent();
    }

    pushCurrent();
    if (chunks.length > 10000) throw new Error('Văn bản tạo quá nhiều chunk.');
    return chunks;
  }

  function updateEstimates() {
    const text = document.getElementById('vr-text')?.value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const maxChars = Number(document.getElementById('vr-chunk-size')?.value || 1800);
    const preserveParagraphs = document.getElementById('vr-keep-paragraphs')?.checked !== false;
    const chunks = document.getElementById('vr-auto-chunk')?.checked === false ? (text.trim() ? [text.trim()] : []) : splitLongText(text, maxChars, preserveParagraphs);
    const minutes = words / 145;
    document.getElementById('vr-word-count').textContent = words.toLocaleString('vi-VN');
    document.getElementById('vr-char-count').textContent = chars.toLocaleString('vi-VN');
    document.getElementById('vr-duration-est').textContent = minutes < 1 ? `${Math.max(0, Math.round(minutes * 60))} giây` : `~ ${minutes.toFixed(minutes >= 10 ? 0 : 1)} phút`;
    document.getElementById('vr-chunk-est').textContent = String(chunks.length);
  }

  function deriveChunkPath(outputPath, index) {
    const suffix = `.part-${String(index + 1).padStart(3, '0')}.wav`;
    return /\.wav$/i.test(outputPath) ? outputPath.replace(/\.wav$/i, suffix) : `${outputPath}${suffix}`;
  }

  function parentFolder(filePath) {
    const normalized = String(filePath || '').replace(/\\/g, '/');
    return normalized.replace(/\/[^/]*$/, '') || normalized;
  }

  function setRunStatus(kind, text) {
    const chip = document.getElementById('vr-run-status');
    if (!chip) return;
    chip.className = `vr-chip ${kind}`;
    chip.textContent = text;
  }

  function resetResultForNewRun() {
    state.lastAudioPath = '';
    const audio = document.getElementById('vr-result-audio');
    if (audio) {
      try { audio.pause(); } catch {}
      audio.removeAttribute('src');
      audio.load();
    }
    document.getElementById('vr-output-path').textContent = '—';
    const badge = document.getElementById('vr-result-badge');
    badge.className = 'vr-chip working';
    badge.textContent = 'Đang xử lý';
    document.getElementById('vr-open-file').disabled = true;
    document.getElementById('vr-open-folder').disabled = true;
  }

  function setResultUnavailable(kind, text) {
    const badge = document.getElementById('vr-result-badge');
    if (!badge) return;
    badge.className = `vr-chip ${kind}`;
    badge.textContent = text;
  }

  function setRendering(rendering) {
    state.rendering = rendering;
    ['vr-text', 'vr-language', 'vr-chunk-size', 'vr-auto-chunk', 'vr-keep-paragraphs', 'vr-project-name'].forEach((id) => document.getElementById(id)?.toggleAttribute('disabled', rendering));
    const start = document.getElementById('vr-start');
    if (start) { start.disabled = rendering; start.textContent = rendering ? 'Đang render…' : 'Render toàn bộ'; }
    const stop = document.getElementById('vr-stop');
    if (stop) stop.disabled = !rendering;
    document.getElementById('vr-open-clone')?.toggleAttribute('disabled', rendering);
    renderVoiceList();
  }

  function renderQueue() {
    const root = document.getElementById('vr-queue');
    const summary = document.getElementById('vr-queue-summary');
    if (!root || !summary) return;
    const completed = state.chunks.filter((chunk) => chunk.status === 'success').length;
    summary.textContent = `${completed}/${state.chunks.length} hoàn thành`;
    if (!state.chunks.length) {
      root.innerHTML = '<div class="vr-empty-mini">Chưa có hàng đợi render.</div>';
      return;
    }
    root.innerHTML = state.chunks.map((chunk, index) => `<div class="vr-queue-row ${chunk.status}"><span class="vr-queue-dot"></span><div><strong>Chunk ${index + 1}</strong><small>${chunk.text.length.toLocaleString('vi-VN')} ký tự</small></div><span class="vr-queue-state">${({ waiting: 'Chờ xử lý', rendering: 'Đang render…', success: 'Hoàn thành', error: 'Lỗi', stopped: 'Đã dừng' })[chunk.status] || chunk.status}</span></div><span></span>`).join('');
    root.querySelector('.rendering')?.scrollIntoView({ block: 'nearest' });
  }

  function vrLog(message, type = 'info') {
    const item = { time: new Date().toLocaleTimeString('vi-VN', { hour12: false }), message: String(message), type };
    state.logs.push(item);
    if (state.logs.length > LOG_LIMIT) state.logs.splice(0, state.logs.length - LOG_LIMIT);
    renderLogs();
    window.addLog?.(`[Voice Render] ${message}`, type === 'warn' ? 'info' : type);
  }

  function renderLogs() {
    const root = document.getElementById('vr-log-output');
    if (!root) return;
    const filter = document.getElementById('vr-log-filter')?.value || 'all';
    const rows = state.logs.filter((item) => filter === 'all' || item.type === filter);
    root.innerHTML = rows.map((item) => `<div class="vr-log-row ${escapeHtml(item.type)}"><span>${escapeHtml(item.time)}</span><b>${escapeHtml(item.type.toUpperCase())}</b><em>${escapeHtml(item.message)}</em></div>`).join('') || '<div class="vr-empty-mini">Chưa có log Voice Render.</div>';
    root.scrollTop = root.scrollHeight;
  }

  async function previewVoice(voiceId) {
    if (state.previewingVoiceId || state.rendering) return;
    const voice = voiceCatalog().find((item) => item.id === voiceId);
    if (!voice || !window.api?.post) return;
    state.previewingVoiceId = voice.id;
    renderVoiceList();
    vrLog(`Tạo preview: ${voice.name}`, 'info');
    try {
      const result = await window.api.post('/api/tts/generate', { text: PREVIEW_TEXT, ref_audio_path: voice.refAudioPath || null, language: voice.language || 'vi', ...(voice.voiceName ? { voice_name: voice.voiceName } : {}) });
      if (result?.status !== 'ok' || !result.audio_path) throw new Error(result?.error || 'Không tạo được audio nghe thử.');
      const audio = new Audio(`file:///${result.audio_path.replace(/\\/g, '/')}`);
      await audio.play();
      vrLog(`Đang phát preview: ${voice.name}`, 'success');
    } catch (error) {
      vrLog(`Preview thất bại: ${error?.message || error}`, 'error');
      window.showToast?.(error?.message || 'Không thể nghe thử giọng.', 'error');
    } finally {
      state.previewingVoiceId = null;
      renderVoiceList();
    }
  }

  async function renderLongText() {
    if (state.rendering) return;
    const text = document.getElementById('vr-text')?.value || '';
    if (!text.trim()) {
      window.showToast?.('Nhập nội dung trước khi render.', 'warning');
      document.getElementById('vr-text')?.focus();
      return;
    }
    if (!window.api?.post || !window.electronAPI?.saveFile || !window.electronAPI?.mergeWavFiles) {
      window.showToast?.('Bridge Voice Render chưa sẵn sàng.', 'error');
      return;
    }
    const maxChars = Number(document.getElementById('vr-chunk-size')?.value || 1800);
    const autoChunk = document.getElementById('vr-auto-chunk')?.checked !== false;
    const preserveParagraphs = document.getElementById('vr-keep-paragraphs')?.checked !== false;
    if (!autoChunk && text.trim().length > maxChars) {
      window.showToast?.(`Văn bản vượt ${maxChars.toLocaleString('vi-VN')} ký tự. Hãy bật Tự chia chunk để render an toàn.`, 'warning');
      document.getElementById('vr-auto-chunk')?.focus();
      return;
    }
    const chunks = autoChunk ? splitLongText(text, maxChars, preserveParagraphs) : [text.trim()];
    if (!chunks.length) return;
    const outputPath = await window.electronAPI.saveFile(`voice-render-${new Date().toISOString().slice(0, 10)}.wav`);
    if (!outputPath) return;
    if (!/\.wav$/i.test(outputPath)) {
      window.showToast?.('Đầu ra Voice Render phải là file WAV.', 'warning');
      return;
    }

    const voice = selectedVoice();
    const language = document.getElementById('vr-language')?.value || voice.language || 'vi';
    const project = document.getElementById('vr-project-name')?.value.trim() || 'Voice Render';
    state.stopRequested = false;
    state.completedChunkPaths = [];
    state.chunks = chunks.map((chunk) => ({ text: chunk, status: 'waiting', path: '' }));
    resetResultForNewRun();
    renderQueue();
    setRendering(true);
    setRunStatus('working', 'Đang render');
    vrLog(`Bắt đầu "${project}": ${chunks.length} chunk, giọng ${voice.name}.`, 'info');

    try {
      for (let index = 0; index < state.chunks.length; index += 1) {
        if (state.stopRequested) {
          for (let i = index; i < state.chunks.length; i += 1) if (state.chunks[i].status === 'waiting') state.chunks[i].status = 'stopped';
          renderQueue();
          setRunStatus('warn', 'Đã dừng');
          setResultUnavailable('warn', 'Chưa ghép');
          vrLog('Đã dừng trước khi bắt đầu chunk tiếp theo.', 'warn');
          return;
        }
        const chunk = state.chunks[index];
        chunk.status = 'rendering';
        renderQueue();
        const chunkPath = deriveChunkPath(outputPath, index);
        vrLog(`Chunk ${index + 1}/${state.chunks.length}: bắt đầu (${chunk.text.length} ký tự).`, 'info');
        const result = await window.api.post('/api/tts/generate', { text: chunk.text, ref_audio_path: voice.refAudioPath || null, language, output_path: chunkPath, ...(voice.voiceName ? { voice_name: voice.voiceName } : {}) });
        if (result?.status !== 'ok' || !result.audio_path) {
          chunk.status = 'error';
          renderQueue();
          throw new Error(result?.error || `Chunk ${index + 1} không tạo được audio.`);
        }
        chunk.status = 'success';
        chunk.path = result.audio_path;
        state.completedChunkPaths.push(result.audio_path);
        renderQueue();
        vrLog(`Chunk ${index + 1}/${state.chunks.length}: hoàn thành.`, 'success');
      }

      if (state.stopRequested) {
        setRunStatus('warn', 'Đã dừng');
        setResultUnavailable('warn', 'Chưa ghép');
        vrLog('Render đã dừng sau chunk hiện tại; không ghép file cuối.', 'warn');
        return;
      }
      if (state.completedChunkPaths.length !== state.chunks.length) throw new Error('Thiếu chunk hoàn chỉnh; từ chối ghép output.');
      vrLog(`Bắt đầu ghép ${state.completedChunkPaths.length} chunk WAV.`, 'info');
      const merged = await window.electronAPI.mergeWavFiles(state.completedChunkPaths, outputPath);
      if (!merged?.ok || !merged.output_path) throw new Error(merged?.error || 'Không ghép được WAV cuối.');
      state.lastAudioPath = merged.output_path;
      const audio = document.getElementById('vr-result-audio');
      audio.src = `file:///${merged.output_path.replace(/\\/g, '/')}`;
      audio.load();
      document.getElementById('vr-output-path').textContent = merged.output_path;
      document.getElementById('vr-result-badge').className = 'vr-chip success';
      document.getElementById('vr-result-badge').textContent = 'Đã ghép';
      document.getElementById('vr-open-file').disabled = false;
      document.getElementById('vr-open-folder').disabled = false;
      setRunStatus('success', 'Hoàn tất');
      vrLog(`Hoàn tất output: ${merged.output_path}`, 'success');
      if (merged.cleanup_warnings?.length) vrLog(`Đã ghép nhưng cleanup chunk có ${merged.cleanup_warnings.length} cảnh báo.`, 'warn');
      window.showToast?.('Voice Render đã hoàn tất.', 'success');
    } catch (error) {
      setRunStatus('error', 'Lỗi render');
      setResultUnavailable('error', 'Không có output');
      vrLog(error?.message || String(error), 'error');
      window.showToast?.(error?.message || 'Voice Render thất bại.', 'error');
    } finally {
      setRendering(false);
    }
  }

  function requestStop() {
    if (!state.rendering || state.stopRequested) return;
    state.stopRequested = true;
    setRunStatus('working', 'Đang dừng…');
    vrLog('Đã yêu cầu dừng. Chunk đang chạy được phép hoàn tất; không khởi chạy chunk mới.', 'warn');
  }

  function openCloneModal() {
    document.getElementById('vr-clone-modal')?.classList.remove('hidden');
  }

  function closeCloneModal() {
    document.getElementById('vr-clone-modal')?.classList.add('hidden');
  }

  async function chooseCloneAudio() {
    if (!window.electronAPI?.openFile) return;
    const result = await window.electronAPI.openFile([{ name: 'Audio', extensions: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus'] }]);
    const filePath = result && !result.canceled && result.filePaths?.[0];
    if (!filePath) return;
    state.refAudioPath = filePath;
    document.getElementById('vr-clone-file').textContent = filePath.split(/[\\/]/).pop();
    document.getElementById('vr-save-clone').disabled = true;
    vrLog(`Đã chọn audio mẫu clone: ${filePath.split(/[\\/]/).pop()}`, 'info');
  }

  async function testClone() {
    const name = document.getElementById('vr-clone-name')?.value.trim();
    const language = document.getElementById('vr-clone-language')?.value || 'vi';
    if (!name || !state.refAudioPath) {
      window.showToast?.('Nhập tên và chọn audio mẫu trước.', 'warning');
      return;
    }
    const button = document.getElementById('vr-test-clone');
    button.disabled = true;
    button.textContent = 'Đang tạo mẫu…';
    try {
      const result = await window.api.post('/api/tts/generate', { text: PREVIEW_TEXT, ref_audio_path: state.refAudioPath, language });
      if (result?.status !== 'ok' || !result.audio_path) throw new Error(result?.error || 'Không tạo được mẫu clone.');
      const audio = document.getElementById('vr-clone-preview-audio');
      audio.src = `file:///${result.audio_path.replace(/\\/g, '/')}`;
      audio.dataset.samplePath = result.audio_path;
      await audio.play();
      document.getElementById('vr-save-clone').disabled = false;
      vrLog(`Clone preview đạt: ${name}`, 'success');
    } catch (error) {
      vrLog(`Clone preview lỗi: ${error?.message || error}`, 'error');
      window.showToast?.(error?.message || 'Không thể tạo mẫu clone.', 'error');
    } finally {
      button.disabled = false;
      button.textContent = '▶ Phân tích / Nghe thử';
    }
  }

  function saveClone() {
    const name = document.getElementById('vr-clone-name')?.value.trim();
    const language = document.getElementById('vr-clone-language')?.value || 'vi';
    const samplePath = document.getElementById('vr-clone-preview-audio')?.dataset.samplePath || '';
    if (!name || !state.refAudioPath || !samplePath) return;
    const voices = getSavedVoices();
    voices.push({ name, language: languageLabel(language), audioPath: state.refAudioPath, audioFile: state.refAudioPath.split(/[\\/]/).pop(), samplePath, note: document.getElementById('vr-clone-note')?.value.trim() || '', date: new Date().toLocaleDateString('vi-VN') });
    saveVoices(voices);
    state.selectedVoiceId = `clone:${voices.length - 1}`;
    localStorage.setItem('voice_render_voice', state.selectedVoiceId);
    renderVoiceList();
    vrLog(`Đã lưu voice clone vào thư viện chung: ${name}`, 'success');
    window.showToast?.('Voice clone đã có trong thư viện chung.', 'success');
    state.refAudioPath = '';
    document.getElementById('vr-clone-name').value = '';
    document.getElementById('vr-clone-note').value = '';
    document.getElementById('vr-clone-file').textContent = 'Chưa chọn file';
    document.getElementById('vr-save-clone').disabled = true;
    closeCloneModal();
  }

  async function refreshGlobalStatus(force = false) {
    if (!force && Date.now() - state.lastSystemRefresh < 12000) return;
    state.lastSystemRefresh = Date.now();
    const set = (id, text, ok) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = text || '—';
      el.dataset.ok = ok === true ? 'true' : ok === false ? 'false' : 'unknown';
    };
    let backendOk = false;
    let ttsOk = false;
    try {
      await window.api?.health?.();
      backendOk = true;
      set('global-status-backend', 'Sẵn sàng', true);
    } catch { set('global-status-backend', 'Mất kết nối', false); }
    try {
      const tts = await window.api?.getTTSStatus?.();
      ttsOk = !!tts?.available;
      set('global-status-tts', ttsOk ? (tts.model_loaded ? 'Đã nạp' : 'Sẵn sàng') : 'Chưa sẵn sàng', ttsOk);
    } catch { set('global-status-tts', 'Không khả dụng', false); }
    try {
      const gpu = await window.api?.gpuInfo?.();
      const gpuName = gpu?.gpu_name || gpu?.name || 'Không khả dụng';
      const gpuAvailable = gpu?.cuda_available ?? gpu?.gpu_available;
      set('global-status-gpu', gpuAvailable === false ? `${gpuName} · CPU mode` : gpuName, gpuAvailable === true ? true : undefined);
    } catch { set('global-status-gpu', 'Không khả dụng', undefined); }
    try {
      const info = await window.electronAPI?.getSystemInfo?.();
      set('global-status-cpu', info?.cpu_model ? `${info.cpu_model} · ${info.logical_cores || '—'} luồng` : 'Không khả dụng', info?.cpu_model ? true : undefined);
      if (info?.total_memory_bytes) {
        const used = Math.max(0, info.total_memory_bytes - info.free_memory_bytes);
        set('global-status-ram', `${(used / 1073741824).toFixed(1)} / ${(info.total_memory_bytes / 1073741824).toFixed(1)} GB`, true);
      } else set('global-status-ram', 'Không khả dụng', undefined);
      set('global-status-version', `VSR ${info?.app_version ? `v${info.app_version}` : ''} · Electron ${info?.electron_version || '—'}`, true);
    } catch {
      set('global-status-cpu', 'Không khả dụng', undefined);
      set('global-status-ram', 'Không khả dụng', undefined);
    }
    const overall = document.getElementById('global-status-overall');
    if (overall) {
      overall.textContent = backendOk && ttsOk ? 'Hoạt động tốt' : backendOk ? 'Cần kiểm tra TTS' : 'Backend offline';
      overall.dataset.ok = backendOk && ttsOk ? 'true' : 'false';
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
      renderVoiceList();
      updateEstimates();
      refreshGlobalStatus(true);
      activatePage('voice-render');
    });
    document.querySelectorAll(`.nav-item:not(#${NAV_ID})`).forEach((existingItem) => {
      if (existingItem.dataset.voiceRenderExitBound === 'true') return;
      existingItem.dataset.voiceRenderExitBound = 'true';
      existingItem.addEventListener('click', () => document.getElementById(PAGE_ID)?.classList.remove('active'));
    });
  }

  function bindPage() {
    document.getElementById('vr-text')?.addEventListener('input', updateEstimates);
    document.getElementById('vr-chunk-size')?.addEventListener('change', updateEstimates);
    document.getElementById('vr-auto-chunk')?.addEventListener('change', updateEstimates);
    document.getElementById('vr-keep-paragraphs')?.addEventListener('change', updateEstimates);
    document.getElementById('vr-start')?.addEventListener('click', renderLongText);
    document.getElementById('vr-stop')?.addEventListener('click', requestStop);
    document.getElementById('vr-preview-selected')?.addEventListener('click', () => previewVoice(state.selectedVoiceId));
    document.getElementById('vr-focus-voices')?.addEventListener('click', () => document.getElementById('vr-voice-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    document.getElementById('vr-refresh-voices')?.addEventListener('click', () => { renderVoiceList(); vrLog('Đã làm mới thư viện voice chung.', 'info'); });
    document.getElementById('vr-open-file')?.addEventListener('click', () => state.lastAudioPath && window.electronAPI?.openPath?.(state.lastAudioPath));
    document.getElementById('vr-open-folder')?.addEventListener('click', () => state.lastAudioPath && window.electronAPI?.openPath?.(parentFolder(state.lastAudioPath)));
    document.getElementById('vr-log-filter')?.addEventListener('change', renderLogs);
    document.getElementById('vr-clear-log')?.addEventListener('click', () => { state.logs = []; renderLogs(); });
    document.getElementById('vr-copy-log')?.addEventListener('click', () => navigator.clipboard?.writeText(state.logs.map((item) => `[${item.time}] ${item.type.toUpperCase()} ${item.message}`).join('\n')).then(() => window.showToast?.('Đã sao chép log Voice Render.', 'success')));
    document.getElementById('vr-open-clone')?.addEventListener('click', openCloneModal);
    document.getElementById('vr-close-clone')?.addEventListener('click', closeCloneModal);
    document.getElementById('vr-clone-modal')?.addEventListener('click', (event) => { if (event.target.id === 'vr-clone-modal') closeCloneModal(); });
    document.getElementById('vr-pick-clone-audio')?.addEventListener('click', chooseCloneAudio);
    document.getElementById('vr-test-clone')?.addEventListener('click', testClone);
    document.getElementById('vr-save-clone')?.addEventListener('click', saveClone);
    window.addEventListener('tts-voices-updated', () => renderVoiceList());
    updateEstimates();
    renderVoiceList();
    renderLogs();
    refreshGlobalStatus(true);
  }

  function init() {
    ensureStyle();
    mountNav();
    mountGlobalStatus();
    mountPage();
    bindNavigation();
    bindPage();
    syncKnownVoiceSelectors();
    setInterval(() => refreshGlobalStatus(false), 15000);
    vrLog('Voice Render sẵn sàng. Thư viện voice dùng chung đã nạp.', 'info');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
