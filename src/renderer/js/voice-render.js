(function () {
  'use strict';

  if (window.__vsrVoiceRenderRuntimeLoaded === true) return;
  window.__vsrVoiceRenderRuntimeLoaded = true;

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
    preparingRender: false,
    stopRequested: false,
    previewingVoiceId: null,
    selectedVoiceId: localStorage.getItem('voice_render_voice') || 'default',
    lastAudioPath: '',
    chunks: [],
    completedChunkPaths: [],
    logs: [],
    refAudioPath: '',
    originalRefAudioPath: '',
    cloneCleanProfile: 'balanced',
    cloneReferenceTranscript: '',
    cloneReferenceSelection: null,
    lastSystemRefresh: 0,
    batchJobs: [],
    batchFolder: localStorage.getItem('voice_render_batch_folder') || '',
    batchSelectedJobId: null,
    batchRunning: false,
    batchStopping: false,
    batchCurrentIdx: -1,
  };

  function ensureStyle() {
    if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/voice-render.css';
    link.setAttribute(STYLE_ATTR, 'true');
    document.head.appendChild(link);
  }

  function toMediaUrl(path, cacheKey = '') {
    const raw = String(path || '').trim();
    if (!raw) return '';
    let mediaUrl = raw;
    if (!/^(file|blob|https?):/i.test(raw)) {
      const n = raw.replace(/\\/g, '/');
      const formatted = n.startsWith('/') ? `file://${n}` : `file:///${n}`;
      mediaUrl = encodeURI(formatted).replace(/#/g, '%23').replace(/\(/g, '%28').replace(/\)/g, '%29');
    } else {
      mediaUrl = encodeURI(decodeURI(raw)).replace(/#/g, '%23').replace(/\(/g, '%28').replace(/\)/g, '%29');
    }
    if (!cacheKey || /^blob:/i.test(mediaUrl)) return mediaUrl;
    const separator = mediaUrl.includes('?') ? '&' : '?';
    return `${mediaUrl}${separator}t=${encodeURIComponent(String(cacheKey))}`;
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
      referenceTranscript: voice?.referenceTranscriptSource ? (voice?.referenceTranscript || '') : '',
      breathSuppressed: voice?.breathSuppressed === true,
      bestSegmentSelected: voice?.bestSegmentSelected === true,
      samplePath: voice?.samplePath || null,
    })).filter((voice) => voice.refAudioPath);
    return [...SYSTEM_VOICES, ...clones];
  }

  function selectedVoice() {
    const voices = voiceCatalog();
    return voices.find((voice) => voice.id === state.selectedVoiceId) || voices[0];
  }

  async function ensureVoiceReferenceTranscript(voice) {
    if (!voice?.refAudioPath || (voice.referenceTranscript && voice.breathSuppressed && voice.bestSegmentSelected)) return voice;
    if (!window.api?.transcribeVoiceReference) throw new Error('Backend chưa hỗ trợ xác nhận transcript voice clone.');
    vrLog(`Đang xác nhận transcript audio mẫu: ${voice.name}`, 'info');
    const result = await window.api.transcribeVoiceReference(voice.refAudioPath, voice.language || 'vi');
    if (result?.status !== 'ok' || !result.transcript?.trim()) {
      throw new Error(result?.error || 'Không bóc được transcript audio mẫu.');
    }
    const index = Number(String(voice.id || '').split(':')[1]);
    const voices = getSavedVoices();
    if (Number.isInteger(index) && voices[index]) {
      voices[index] = {
        ...voices[index],
        audioPath: result.audio_path || voice.refAudioPath,
        audioFile: (result.audio_path || voice.refAudioPath).split(/[\\/]/).pop(),
        referenceTranscript: result.transcript.trim(),
        referenceTranscriptSource: 'faster-whisper-medium',
        breathSuppressed: true,
        bestSegmentSelected: true,
        breathReductionDb: result.breath_reduction_db || 14,
        referenceStart: result.selected_start ?? null,
        referenceEnd: result.selected_end ?? null,
        referenceQualityScore: result.selected_score ?? null,
      };
      saveVoices(voices);
    }
    vrLog(`Đã khóa transcript tham chiếu (${result.transcript.trim().length} ký tự).`, 'success');
    return {
      ...voice,
      refAudioPath: result.audio_path || voice.refAudioPath,
      referenceTranscript: result.transcript.trim(),
      breathSuppressed: true,
      bestSegmentSelected: true,
    };
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
          <div>
            <h1 style="font-size:20px;font-weight:700;margin:0 0 4px 0;display:flex;align-items:center;gap:8px;color:#fff;">
              🎤 Voice Render <span style="font-size:12px;font-weight:normal;padding:2px 8px;border-radius:12px;background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);">Multi-Voice TTS & Clone</span>
            </h1>
            <p style="font-size:13px;color:var(--text-muted,#94a3b8);margin:0;">Tự động hóa bóc tách kịch bản từ Google Sheets và xuất file audio chuẩn 48kHz Stereo tương thích 100% CapCut & Premiere.</p>
          </div>
          <button id="vr-open-clone" class="vr-btn secondary" type="button">＋ Clone Voice</button>
        </header>

        <!-- Mode Switcher Tabs -->
        <div class="vr-mode-tabs">
          <button id="vr-tab-single" class="vr-mode-tab active" type="button">⚡ Render Đơn Lẻ</button>
          <button id="vr-tab-batch" class="vr-mode-tab" type="button">📊 Hàng Loạt Từ Google Sheets <span id="vr-batch-count-pill" style="font-size:11px;padding:1px 6px;border-radius:10px;background:rgba(59,130,246,0.3);display:none;">0</span></button>
        </div>

        <!-- Mode 1: Single View -->
        <div id="vr-single-view" class="vr-grid">
          <section class="vr-panel vr-config">
            <div class="vr-panel-title"><div><span class="vr-step">1</span><h2>Cấu hình render</h2></div><span id="vr-run-status" class="vr-chip idle">Sẵn sàng</span></div>
            <div class="vr-two-col">
              <label class="vr-field"><span>Tên dự án / Tiêu đề</span><input id="vr-project-name" class="vr-input" value="Voice Render" maxlength="120"></label>
              <label class="vr-field"><span>Ngôn ngữ</span><select id="vr-language" class="vr-select"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="zh">中文</option><option value="ja">日本語</option><option value="ko">한국어</option></select></label>
            </div>
            <div class="vr-selected-voice"><div><span>Giọng đang chọn</span><strong id="vr-selected-voice-name">OmniVoice mặc định</strong></div><button id="vr-focus-voices" class="vr-link-btn" type="button">Chọn giọng ↓</button></div>
            <label class="vr-field vr-text-field">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <span>Nội dung render <small>(hỗ trợ văn bản dài)</small></span>
                <button id="vr-btn-ai-prosody" type="button" class="vr-link-btn" style="color:var(--accent,#3b82f6); font-weight:600; cursor:pointer;" title="Dùng AI LLM tự động phân tích và chèn nhịp ngắt, dấu nhấn nhá *...* và cảm xúc">✨ AI Thêm cảm xúc & Nhấn nhá</button>
              </div>
              <textarea id="vr-text" class="vr-textarea" placeholder="Nhập hoặc dán văn bản cần render..."></textarea>
            </label>
            <div class="vr-stats"><div><span>Từ</span><b id="vr-word-count">0</b></div><div><span>Ký tự</span><b id="vr-char-count">0</b></div><div><span>Ước tính</span><b id="vr-duration-est">0 phút</b></div><div><span>Chunk</span><b id="vr-chunk-est">0</b></div></div>
            <div class="vr-long-box"><div class="vr-long-title">Xử lý văn bản dài</div><label><span>Tự chia chunk</span><input id="vr-auto-chunk" type="checkbox" checked></label><label><span>Kích thước chunk</span><select id="vr-chunk-size"><option value="200">200 ký tự (Tối ưu nhất cho AI)</option><option value="280" selected>280 ký tự (Chuẩn câu)</option><option value="400">400 ký tự</option><option value="600">600 ký tự</option></select></label><label><span>Giữ đoạn văn</span><input id="vr-keep-paragraphs" type="checkbox" checked></label><label><span>Ghép file đầu ra</span><input id="vr-merge-output" type="checkbox" checked disabled></label></div>
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

        <!-- Mode 2: Batch Google Sheets View -->
        <div id="vr-batch-view" class="vr-batch-view" style="display:none;">
          <!-- Batch Config Card -->
          <div class="vr-batch-config-card">
            <div class="vr-field">
              <span>Đường link Google Sheets (Bảng tính kịch bản Voiceover)</span>
              <div style="display:flex;gap:8px;">
                <input type="text" id="vr-sheet-url" class="vr-input" value="https://docs.google.com/spreadsheets/d/142oK47OvdLmHZrkFUbllcL8CbwtxKeZ054In2z7Cm1o/edit?gid=0#gid=0" placeholder="https://docs.google.com/spreadsheets/d/.../edit" style="flex:1;">
                <button id="vr-btn-scan-sheet" class="vr-btn primary" type="button" style="white-space:nowrap;">📥 Quét Sheet</button>
              </div>
            </div>

            <div class="vr-field">
              <span>Thư mục lưu file Audio kết quả trên máy</span>
              <div style="display:flex;gap:8px;">
                <input type="text" id="vr-batch-folder-path" class="vr-input" placeholder="Chưa chọn thư mục lưu audio..." readonly style="flex:1;">
                <button id="vr-btn-pick-folder" class="vr-btn secondary" type="button" style="white-space:nowrap;">📂 Chọn thư mục</button>
              </div>
            </div>

            <div class="vr-field">
              <span>Giọng đọc & Ngôn ngữ áp dụng</span>
              <div style="display:flex;gap:8px;align-items:center;">
                <select id="vr-batch-voice-select" class="vr-select" style="flex:1;min-width:0;"></select>
                <select id="vr-batch-language" class="vr-select" style="width:105px;">
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Batch 2-Column Grid: Queue on Left, Inspector & Preview on Right -->
          <div class="vr-batch-grid">
            <!-- Left Column: Batch Queue & Actions -->
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div class="vr-table-wrap">
                <div class="vr-table-header-bar">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <strong style="font-size:14px;color:#fff;">📋 Hàng đợi render voice hàng loạt</strong>
                    <span id="vr-batch-summary" class="vr-badge waiting">0 file</span>
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button id="vr-btn-batch-clear" class="vr-btn danger" style="padding:4px 10px;font-size:11px;" type="button">🗑 Xóa hết</button>
                  </div>
                </div>

                <div class="vr-table-scroll">
                  <table class="vr-table">
                    <thead>
                      <tr>
                        <th style="width:36px;text-align:center;"><input type="checkbox" id="vr-batch-select-all" checked></th>
                        <th style="width:36px;">STT</th>
                        <th>Tên File Audio (Theo Tên Video Gốc)</th>
                        <th>Kịch Bản Voiceover</th>
                        <th style="width:70px;text-align:center;">Ký tự</th>
                        <th style="width:80px;">Ước tính</th>
                        <th style="width:115px;">Trạng thái</th>
                        <th style="width:90px;text-align:center;">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody id="vr-batch-tbody">
                      <tr>
                        <td colspan="8" style="text-align:center;padding:40px 10px;color:#64748b;">
                          Chưa có dữ liệu. Hãy dán link Google Sheet ở trên và bấm "Quét Sheet", sau đó chọn thư mục lưu audio.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Batch Action Bar -->
              <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                <button id="vr-btn-batch-run" class="vr-btn primary" type="button" style="padding:12px 20px;font-size:14px;font-weight:700;">
                  ▶ BẮT ĐẦU RENDER HÀNG LOẠT
                </button>
                <button id="vr-btn-batch-stop" class="vr-btn danger" type="button" style="display:none;padding:12px 20px;font-size:14px;font-weight:700;">
                  ⏹ DỪNG LẠI
                </button>
                <button id="vr-btn-batch-retry-errors" class="vr-btn secondary" type="button">
                  🔄 Chạy lại các file lỗi
                </button>
                <button id="vr-btn-batch-open-folder" class="vr-btn secondary" type="button">
                  📂 Mở thư mục kết quả
                </button>
              </div>

              <!-- Batch Log Output -->
              <div class="vr-panel" style="padding:12px;">
                <span style="font-size:12px;font-weight:600;color:var(--text-muted,#94a3b8);display:block;margin-bottom:6px;">Nhật ký tiến trình hàng loạt (Log)</span>
                <div id="vr-batch-log-output" class="vr-log-output" style="max-height:160px;min-height:100px;"></div>
              </div>
            </div>

            <!-- Right Column: Inspector & Live Audio Preview -->
            <div class="vr-inspector-panel">
              <div class="vr-inspector-head">
                <div style="font-size:13px;font-weight:700;color:#60a5fa;">🔍 Chi tiết kịch bản & Nghe thử audio</div>
                <span id="vr-inspector-badge" class="vr-badge waiting">Chưa chọn</span>
              </div>

              <div id="vr-inspector-empty" style="padding:40px 15px;text-align:center;color:#64748b;font-size:12px;">
                Chọn một file trong danh sách bên trái để xem kịch bản đầy đủ và nghe thử audio sau khi render.
              </div>

              <div id="vr-inspector-body" style="display:none;flex-direction:column;gap:12px;">
                <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px;">
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:2px;">Tên file audio sẽ xuất (Theo Tên Video Gốc):</div>
                  <div id="vr-inspector-filename" style="font-size:13px;font-weight:600;color:#f8fafc;word-break:break-all;font-family:Consolas,monospace;">—</div>
                  <div id="vr-inspector-topic" style="font-size:11px;color:#38bdf8;margin-top:4px;"></div>
                </div>

                <div class="vr-player-wrap" style="background:rgba(2,6,23,0.8);padding:10px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);">
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">Trình phát Audio Preview (48kHz Stereo):</div>
                  <audio id="vr-batch-preview-audio" controls style="width:100%;height:36px;"></audio>
                </div>

                <div class="vr-field">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:600;color:#94a3b8;">Nội dung kịch bản Voiceover:</span>
                    <span id="vr-inspector-char-count" style="font-size:11px;color:#60a5fa;">0 ký tự</span>
                  </div>
                  <textarea id="vr-inspector-script-text" class="vr-textarea" style="height:140px;font-size:12px;" placeholder="Kịch bản voiceover..."></textarea>
                </div>

                <div style="display:flex;gap:8px;margin-top:4px;">
                  <button id="vr-btn-inspector-run-single" class="vr-btn primary" type="button" style="flex:1;">
                    ▶ Render file này
                  </button>
                  <button id="vr-btn-inspector-open-file" class="vr-btn secondary" type="button">
                    📁 Mở file
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="vr-clone-modal" class="vr-modal hidden" role="dialog" aria-modal="true">
        <div class="vr-modal-card">
          <div class="vr-modal-head"><div><h2>Clone Voice</h2><p>Lưu trực tiếp vào thư viện voice chung của app.</p></div><button id="vr-close-clone" type="button">×</button></div>
          <label class="vr-field"><span>Tên giọng</span><input id="vr-clone-name" placeholder="VD: Narrator Clone A" maxlength="80"></label>
          <div class="vr-two-col"><label class="vr-field"><span>Ngôn ngữ</span><select id="vr-clone-language"><option value="vi">Tiếng Việt</option><option value="en">English</option></select></label><label class="vr-field"><span>Audio mẫu <small>5–15 giây, chỉ một người nói</small></span><button id="vr-pick-clone-audio" class="vr-btn secondary" type="button">Chọn audio</button></label></div>
          <div id="vr-clone-file" class="vr-file-line">Chưa chọn file</div>
          <div class="vr-clean-row"><label class="vr-field"><span>Mức lọc tạp âm</span><select id="vr-clone-clean-profile"><option value="balanced">Cân bằng · Khuyên dùng</option><option value="strong">Lọc mạnh · Audio nhiều ồn</option></select></label><button id="vr-clean-clone-audio" class="vr-btn secondary" type="button" disabled>✨ Làm sạch lại</button></div>
          <div id="vr-clone-clean-status" class="vr-clean-status neutral">Chọn audio để app tự lọc ồn, cắt khoảng lặng và cân âm lượng.</div>
          <label class="vr-field"><span>Transcript audio tham chiếu <small>(tự nhận dạng, cần kiểm tra lại)</small></span><textarea id="vr-clone-note" rows="4" placeholder="Nội dung phải khớp chính xác lời nói trong audio mẫu..."></textarea></label>
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

  function robustSentenceUnits(text) {
    const source = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!source) return [];

    const paragraphs = source.split(/\n\s*\n+/);
    const units = [];

    paragraphs.forEach((p, pIdx) => {
      const trimmedPara = p.trim();
      if (!trimmedPara) return;

      // Chia câu theo các dấu kết thúc câu: . ! ? 。 ！ ？ … hoặc ngắt dòng
      const rawSentences = trimmedPara.match(/[^.!?。！？…\n]+[.!?。！？…\n]*/g) || [trimmedPara];

      rawSentences.forEach((s, sIdx) => {
        const cleaned = s.replace(/\s+/g, ' ').trim();
        if (cleaned) {
          units.push({
            text: cleaned,
            terminated: true,
            paragraphBreakAfter: (sIdx === rawSentences.length - 1) && (pIdx < paragraphs.length - 1)
          });
        }
      });
    });

    return units;
  }

  function splitLongText(input, maxChars = 280, preserveParagraphs = true) {
    const text = String(input || '').replace(/\r\n/g, '\n').trim();
    if (!text) return [];

    const targetChars = Math.max(100, Math.min(600, Number(maxChars) || 280));
    const units = robustSentenceUnits(text);
    const chunks = [];
    let current = '';

    const pushCurrent = () => {
      if (!current.trim()) return;
      chunks.push(current.trim());
      current = '';
    };

    for (const unit of units) {
      // Nếu 1 câu dài vượt quá giới hạn an toàn, tách tiếp theo mệnh đề (, ; : - —) hoặc từ
      if (unit.text.length > targetChars) {
        pushCurrent();
        const subClauses = unit.text.match(/[^,;:—–…]+[,;:—–…]*/g) || [unit.text];
        let subCurrent = '';
        for (const clause of subClauses) {
          const trimmedClause = clause.trim();
          if (!trimmedClause) continue;
          if (trimmedClause.length > targetChars) {
            if (subCurrent) { chunks.push(subCurrent.trim()); subCurrent = ''; }
            const words = trimmedClause.split(/\s+/);
            let wordChunk = '';
            for (const w of words) {
              if (wordChunk && (wordChunk.length + w.length + 1 > targetChars)) {
                chunks.push(wordChunk.trim());
                wordChunk = w;
              } else {
                wordChunk = wordChunk ? `${wordChunk} ${w}` : w;
              }
            }
            if (wordChunk) chunks.push(wordChunk.trim());
          } else if (subCurrent && (subCurrent.length + trimmedClause.length + 1 > targetChars)) {
            chunks.push(subCurrent.trim());
            subCurrent = trimmedClause;
          } else {
            subCurrent = subCurrent ? `${subCurrent} ${trimmedClause}` : trimmedClause;
          }
        }
        if (subCurrent) chunks.push(subCurrent.trim());
        continue;
      }

      const candidate = current ? `${current} ${unit.text}` : unit.text;
      if (current && candidate.length > targetChars) {
        pushCurrent();
        current = unit.text;
      } else {
        current = candidate;
      }

      if (preserveParagraphs && unit.paragraphBreakAfter) pushCurrent();
    }

    pushCurrent();
    return chunks;
  }

  function updateEstimates() {
    const text = document.getElementById('vr-text')?.value || '';
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;
    const maxChars = Number(document.getElementById('vr-chunk-size')?.value || 280);
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
    root.innerHTML = state.chunks.map((chunk, index) => `<div class="vr-queue-row ${chunk.status}"><span class="vr-queue-dot"></span><div><strong>Chunk ${index + 1}</strong><small>${chunk.text.length.toLocaleString('vi-VN')} ký tự</small></div><span class="vr-queue-state">${({ waiting: 'Chờ xử lý', rendering: 'Đang render…', success: 'Hoàn thành', error: 'Lỗi', stopped: 'Đã dừng' })[chunk.status] || chunk.status}</span></div>`).join('');
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
    let voice = voiceCatalog().find((item) => item.id === voiceId);
    if (!voice || !window.api?.post) return;
    state.previewingVoiceId = voice.id;
    renderVoiceList();
    vrLog(`Tạo preview: ${voice.name}`, 'info');
    try {
      voice = await ensureVoiceReferenceTranscript(voice);
      const result = await window.api.post('/api/tts/generate', { text: PREVIEW_TEXT, ref_audio_path: voice.refAudioPath || null, ref_text: voice.referenceTranscript || null, language: voice.language || 'vi', ...(voice.voiceName ? { voice_name: voice.voiceName } : {}) });
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
    if (state.rendering || state.preparingRender) return;
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
    const maxChars = Number(document.getElementById('vr-chunk-size')?.value || 280);
    const autoChunk = document.getElementById('vr-auto-chunk')?.checked !== false;
    const preserveParagraphs = document.getElementById('vr-keep-paragraphs')?.checked !== false;
    if (!autoChunk && text.trim().length > maxChars) {
      window.showToast?.(`Văn bản vượt ${maxChars.toLocaleString('vi-VN')} ký tự. Hãy bật Tự chia chunk để render an toàn.`, 'warning');
      document.getElementById('vr-auto-chunk')?.focus();
      return;
    }
    const chunks = autoChunk ? splitLongText(text, maxChars, preserveParagraphs) : [text.trim()];
    if (!chunks.length) return;
    let voice = selectedVoice();
    let outputPath = null;
    state.preparingRender = true;
    const startButton = document.getElementById('vr-start');
    if (startButton) startButton.disabled = true;
    setRunStatus('working', voice.refAudioPath ? 'Đang xác nhận voice…' : 'Đang chuẩn bị…');
    try {
      voice = await ensureVoiceReferenceTranscript(voice);
      outputPath = await window.electronAPI.saveFile(`voice-render-${new Date().toISOString().slice(0, 10)}.wav`);
    } catch (error) {
      vrLog(`Không thể xác nhận transcript voice clone: ${error?.message || error}`, 'error');
      setRunStatus('error', 'Lỗi transcript');
      window.showToast?.(error?.message || 'Không thể xác nhận transcript voice clone.', 'error');
      return;
    } finally {
      state.preparingRender = false;
      if (startButton) startButton.disabled = false;
    }
    if (!outputPath) { setRunStatus('ready', 'Sẵn sàng'); return; }
    if (!/\.wav$/i.test(outputPath)) {
      window.showToast?.('Đầu ra Voice Render phải là file WAV.', 'warning');
      return;
    }

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
        const result = await window.api.post('/api/tts/generate', { text: chunk.text, ref_audio_path: voice.refAudioPath || null, ref_text: voice.referenceTranscript || null, language, output_path: chunkPath, ...(voice.voiceName ? { voice_name: voice.voiceName } : {}) });
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
      audio.src = toMediaUrl(merged.output_path, Date.now());
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
    state.originalRefAudioPath = filePath;
    state.refAudioPath = '';
    const fileName = filePath.split(/[\\/]/).pop();
    const fileEl = document.getElementById('vr-clone-file');
    if (fileEl) fileEl.textContent = fileName;
    
    // Tự động gợi ý tên giọng nếu ô tên đang trống
    const nameInput = document.getElementById('vr-clone-name');
    if (nameInput && !nameInput.value.trim()) {
      nameInput.value = fileName.replace(/\.[^/.]+$/, '');
    }
    
    const saveBtn = document.getElementById('vr-save-clone');
    if (saveBtn) saveBtn.disabled = true;
    
    vrLog(`Đã chọn audio mẫu clone: ${fileName}`, 'info');
    await cleanCloneAudio();
  }

  async function cleanCloneAudio() {
    const sourcePath = state.originalRefAudioPath;
    const profileSelect = document.getElementById('vr-clone-clean-profile');
    const profile = profileSelect?.value || 'balanced';
    const button = document.getElementById('vr-clean-clone-audio');
    const status = document.getElementById('vr-clone-clean-status');
    const saveBtn = document.getElementById('vr-save-clone');
    if (!sourcePath || !window.electronAPI?.preprocessCloneAudio) {
      window.showToast?.('Chưa chọn audio hoặc app chưa hỗ trợ bộ lọc local.', 'warning');
      return;
    }
    if (button) { button.disabled = true; button.textContent = 'Đang lọc…'; }
    if (profileSelect) profileSelect.disabled = true;
    if (saveBtn) saveBtn.disabled = true;
    if (status) { status.className = 'vr-clean-status working'; status.textContent = 'Đang lọc tạp âm và chuẩn hóa audio…'; }
    try {
      const result = await window.electronAPI.preprocessCloneAudio(sourcePath, profile);
      if (!result?.ok || !result.output_path) throw new Error(result?.error || 'Không thể làm sạch audio.');
      state.refAudioPath = result.output_path;
      state.cloneCleanProfile = result.profile || profile;
      const audio = document.getElementById('vr-clone-preview-audio');
      if (audio) {
        audio.src = toMediaUrl(result.output_path, Date.now());
        delete audio.dataset.samplePath;
      }
      if (status) { status.className = 'vr-clean-status working'; status.textContent = 'Audio đã sạch. Đang nhận dạng transcript tham chiếu…'; }
      const transcriptResult = await window.api.transcribeVoiceReference(result.output_path, document.getElementById('vr-clone-language')?.value || 'vi');
      if (transcriptResult?.status !== 'ok' || !transcriptResult.transcript?.trim()) throw new Error(transcriptResult?.error || 'Không bóc được transcript audio mẫu.');
      if (transcriptResult.audio_path) {
        state.refAudioPath = transcriptResult.audio_path;
        if (audio) audio.src = toMediaUrl(transcriptResult.audio_path, Date.now());
      }
      state.cloneReferenceTranscript = transcriptResult.transcript.trim();
      state.cloneReferenceSelection = transcriptResult.selected_trimmed ? {
        start: transcriptResult.selected_start,
        end: transcriptResult.selected_end,
        score: transcriptResult.selected_score,
      } : null;
      const transcriptInput = document.getElementById('vr-clone-note');
      if (transcriptInput) transcriptInput.value = state.cloneReferenceTranscript;
      const duration = Number(result.output?.duration_seconds || 0).toFixed(1);
      if (status) {
        status.className = `vr-clean-status ${result.warning ? 'warn' : 'success'}`;
        const breathInfo = Number(transcriptResult.breath_intervals || 0) > 0 ? ` · giảm hơi thở ${transcriptResult.breath_reduction_db || 14} dB (${transcriptResult.breath_intervals} khoảng)` : '';
        const selectionInfo = transcriptResult.selected_trimmed ? ` · chọn đoạn tốt nhất ${Number(transcriptResult.selected_start).toFixed(1)}–${Number(transcriptResult.selected_end).toFixed(1)}s` : '';
        status.textContent = `Đã làm sạch, giảm hơi thở và xác nhận transcript · WAV mono 24 kHz · ${duration}s${selectionInfo}${breathInfo}${result.warning ? ` · ${result.warning}` : ''}`;
      }
      if (saveBtn) saveBtn.disabled = false;
      vrLog(`Đã làm sạch audio clone: ${result.profile_label || profile}, ${duration}s`, 'success');
    } catch (error) {
      state.refAudioPath = '';
      if (status) { status.className = 'vr-clean-status error'; status.textContent = error?.message || 'Không thể làm sạch audio.'; }
      vrLog(`Lọc audio clone lỗi: ${error?.message || error}`, 'error');
      window.showToast?.(error?.message || 'Không thể làm sạch audio.', 'error');
    } finally {
      if (button) { button.disabled = !state.originalRefAudioPath; button.textContent = '✨ Làm sạch lại'; }
      if (profileSelect) profileSelect.disabled = false;
    }
  }

  async function testClone() {
    const name = document.getElementById('vr-clone-name')?.value.trim();
    const language = document.getElementById('vr-clone-language')?.value || 'vi';
    const referenceTranscript = document.getElementById('vr-clone-note')?.value.trim() || '';
    if (!name || !state.refAudioPath || !referenceTranscript) {
      window.showToast?.('Nhập tên, chọn audio và xác nhận transcript trước.', 'warning');
      return;
    }
    const button = document.getElementById('vr-test-clone');
    button.disabled = true;
    button.textContent = 'Đang tạo mẫu…';
    try {
      const result = await window.api.post('/api/tts/generate', { text: PREVIEW_TEXT, ref_audio_path: state.refAudioPath, ref_text: referenceTranscript, language });
      if (result?.status !== 'ok' || !result.audio_path) throw new Error(result?.error || 'Không tạo được mẫu clone.');
      const audio = document.getElementById('vr-clone-preview-audio');
      audio.src = toMediaUrl(result.audio_path, Date.now());
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
    const samplePath = document.getElementById('vr-clone-preview-audio')?.dataset.samplePath || state.refAudioPath || '';
    const referenceTranscript = document.getElementById('vr-clone-note')?.value.trim() || '';
    
    if (!name) {
      window.showToast?.('Vui lòng nhập tên giọng clone.', 'warning');
      document.getElementById('vr-clone-name')?.focus();
      return;
    }
    if (!state.refAudioPath) {
      window.showToast?.('Vui lòng chọn file audio mẫu trước.', 'warning');
      return;
    }
    if (!referenceTranscript) {
      window.showToast?.('Transcript audio tham chiếu không được để trống.', 'warning');
      document.getElementById('vr-clone-note')?.focus();
      return;
    }

    const voices = getSavedVoices();
    voices.push({
      name,
      language: languageLabel(language),
      audioPath: state.refAudioPath,
      audioFile: state.refAudioPath.split(/[\\/]/).pop(),
      sourceAudioPath: state.originalRefAudioPath,
      cleanProfile: state.cloneCleanProfile,
      referenceTranscript,
      referenceTranscriptSource: 'user-confirmed',
      breathSuppressed: true,
      bestSegmentSelected: true,
      breathReductionDb: 14,
      referenceStart: state.cloneReferenceSelection?.start ?? null,
      referenceEnd: state.cloneReferenceSelection?.end ?? null,
      referenceQualityScore: state.cloneReferenceSelection?.score ?? null,
      samplePath: samplePath || state.refAudioPath,
      note: document.getElementById('vr-clone-note')?.value.trim() || '',
      date: new Date().toLocaleDateString('vi-VN')
    });
    saveVoices(voices);
    state.selectedVoiceId = `clone:${voices.length - 1}`;
    localStorage.setItem('voice_render_voice', state.selectedVoiceId);
    renderVoiceList();
    vrLog(`Đã lưu voice clone vào thư viện chung: ${name}`, 'success');
    window.showToast?.('Voice clone đã có trong thư viện chung.', 'success');
    
    // Reset và đóng modal
    state.refAudioPath = '';
    state.originalRefAudioPath = '';
    state.cloneReferenceTranscript = '';
    state.cloneReferenceSelection = null;
    const nameInput = document.getElementById('vr-clone-name');
    if (nameInput) nameInput.value = '';
    const noteInput = document.getElementById('vr-clone-note');
    if (noteInput) noteInput.value = '';
    const fileLine = document.getElementById('vr-clone-file');
    if (fileLine) fileLine.textContent = 'Chưa chọn file';
    const saveBtn = document.getElementById('vr-save-clone');
    if (saveBtn) saveBtn.disabled = true;
    const cleanButton = document.getElementById('vr-clean-clone-audio');
    if (cleanButton) cleanButton.disabled = true;
    const cleanStatus = document.getElementById('vr-clone-clean-status');
    if (cleanStatus) { cleanStatus.className = 'vr-clean-status neutral'; cleanStatus.textContent = 'Chọn audio để app tự lọc ồn, cắt khoảng lặng và cân âm lượng.'; }
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
    document.getElementById('vr-btn-ai-prosody')?.addEventListener('click', async () => {
      const textarea = document.getElementById('vr-text');
      const text = textarea?.value?.trim();
      if (!text) {
        vrLog('Vui lòng nhập hoặc dán văn bản trước khi bấm AI thêm cảm xúc.', 'warn');
        textarea?.focus();
        return;
      }
      const btn = document.getElementById('vr-btn-ai-prosody');
      const originalLabel = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ AI đang tối ưu cảm xúc...';
      vrLog('Đang gửi văn bản tới AI LLM để tối ưu ngữ điệu và ngắt nhịp...', 'info');

      try {
        const provider = localStorage.getItem('ai_provider') || 'ollama';
        const model = (localStorage.getItem(`ai_model_${provider}`) || '').trim();
        const endpoint = localStorage.getItem('ai_endpoint') || (provider === 'ollama' ? 'http://localhost:11434/api/chat' : '');
        
        let apiKeys = [];
        try {
          const raw = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]');
          if (Array.isArray(raw)) {
            apiKeys = raw.map(item => typeof item === 'string' ? item : item?.key).filter(Boolean);
          }
        } catch {}

        const legacyKey = (localStorage.getItem('ai_api_key') || '').trim();
        if (legacyKey && !apiKeys.length) {
          apiKeys = [legacyKey];
        }

        if (provider === 'ollama' && !apiKeys.length) {
          apiKeys = [model || 'qwen2.5'];
        }

        const aiConfig = {
          provider,
          model: model || (provider === 'ollama' ? (apiKeys[0] || 'qwen2.5') : ''),
          api_keys: apiKeys,
          endpoint,
          prompt: 'Bạn là chuyên gia lồng tiếng Voice Talent. Hãy viết lại văn bản sau thành kịch bản nói tiếng Việt cực kỳ tự nhiên, câu ngắn 8-14 từ dễ lấy hơi, văn phong nói sống động. Dùng *từ khóa* để nhấn mạnh từ đắt giá, dùng ... để ngắt nhịp lấy hơi, dùng — để chuyển ý, viết số thành chữ. Trả về trực tiếp văn bản kịch bản hoàn chỉnh, không giải thích.',
        };

        const res = await window.api.aiRewrite(text, aiConfig);
        if (res && res.status === 'ok' && res.result) {
          textarea.value = res.result.trim();
          updateEstimates();
          vrLog('✨ Đã tối ưu kịch bản có cảm xúc & nhấn nhá thành công!', 'success');
        } else {
          vrLog(`Không thể tối ưu kịch bản: ${res?.error || 'Lỗi kết nối AI'}`, 'error');
        }
      } catch (err) {
        vrLog(`Lỗi xử lý AI: ${err.message}`, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = originalLabel;
      }
    });
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
    document.getElementById('vr-clean-clone-audio')?.addEventListener('click', cleanCloneAudio);
    document.getElementById('vr-clone-clean-profile')?.addEventListener('change', () => { if (state.originalRefAudioPath) cleanCloneAudio(); });
    document.getElementById('vr-test-clone')?.addEventListener('click', testClone);
    document.getElementById('vr-save-clone')?.addEventListener('click', saveClone);
    window.addEventListener('tts-voices-updated', () => { renderVoiceList(); renderBatchVoiceSelect(); });
    bindModeSwitcher();
    bindBatchEvents();
    updateEstimates();
    renderVoiceList();
    renderBatchVoiceSelect();
    renderLogs();
    refreshGlobalStatus(true);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     BATCH GOOGLE SHEETS & MULTI-VOICE RENDER
     ══════════════════════════════════════════════════════════════════════════ */

  function vrBatchLog(message, type = 'info') {
    const time = new Date().toLocaleTimeString('vi-VN');
    const container = document.getElementById('vr-batch-log-output');
    if (!container) return;
    const row = document.createElement('div');
    row.className = `vr-log-row ${type}`;
    row.innerHTML = `<span>${time}</span><b>[${type.toUpperCase()}]</b><em>${escapeHtml(message)}</em>`;
    container.appendChild(row);
    container.scrollTop = container.scrollHeight;
  }

  function convertGoogleSheetUrlToCsv(url) {
    if (!url) return '';
    let clean = url.trim();
    if (clean.includes('/gviz/tq?tqx=out:csv') || clean.includes('/pub?output=csv') || clean.includes('export?format=csv')) {
      return clean;
    }
    const match = clean.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return clean;
    const sheetId = match[1];
    let gid = '0';
    const gidMatch = clean.match(/[#&?]gid=([0-9]+)/);
    if (gidMatch) gid = gidMatch[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }

  function parseCSV(text) {
    if (!text || typeof text !== 'string') return [];
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    let i = 0;
    const len = text.length;

    while (i < len) {
      const char = text[i];
      if (inQuotes) {
        if (char === '"') {
          if (i + 1 < len && text[i + 1] === '"') {
            field += '"';
            i += 2;
            continue;
          } else {
            inQuotes = false;
            i++;
            continue;
          }
        } else {
          field += char;
          i++;
          continue;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
          i++;
          continue;
        } else if (char === ',') {
          row.push(field);
          field = '';
          i++;
          continue;
        } else if (char === '\r') {
          if (i + 1 < len && text[i + 1] === '\n') {
            i += 2;
          } else {
            i++;
          }
          row.push(field);
          field = '';
          if (row.some(f => f.trim().length > 0)) {
            rows.push(row);
          }
          row = [];
          continue;
        } else if (char === '\n') {
          row.push(field);
          field = '';
          if (row.some(f => f.trim().length > 0)) {
            rows.push(row);
          }
          row = [];
          i++;
          continue;
        } else {
          field += char;
          i++;
          continue;
        }
      }
    }

    if (field.length > 0 || row.length > 0) {
      row.push(field);
      if (row.some(f => f.trim().length > 0)) {
        rows.push(row);
      }
    }

    return rows;
  }

  function sanitizeWavFileName(rawName, index) {
    let name = String(rawName || '').trim();
    if (!name) name = `Voice_Render_${index + 1}`;
    // Strip video / audio file extension if already present in sheet
    name = name.replace(/\.(mp4|mkv|mov|avi|flv|webm|ts|m4v|wav|mp3|aac|m4a|ogg|opus)$/i, '');
    // Sanitize Windows forbidden filename characters: \ / : * ? " < > |
    name = name.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, ' ').trim();
    if (!name) name = `Voice_Render_${index + 1}`;
    return `${name}.wav`;
  }

  function renderBatchVoiceSelect() {
    const select = document.getElementById('vr-batch-voice-select');
    if (!select) return;
    const voices = voiceCatalog();
    const currentVal = select.value || state.selectedVoiceId || 'default';
    select.innerHTML = '';
    voices.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = `${v.name} (${v.type})`;
      select.appendChild(opt);
    });
    if ([...select.options].some(o => o.value === currentVal)) {
      select.value = currentVal;
    }
  }

  async function scanBatchGoogleSheet() {
    const input = document.getElementById('vr-sheet-url');
    const rawUrl = input?.value?.trim();
    if (!rawUrl) {
      window.showToast?.('Vui lòng nhập đường link Google Sheets.', 'warning');
      return;
    }

    const csvUrl = convertGoogleSheetUrlToCsv(rawUrl);
    vrBatchLog(`Đang kết nối và quét dữ liệu Google Sheet: ${csvUrl}...`, 'info');
    window.showToast?.('Đang tải dữ liệu từ Google Sheets...', 'info');

    try {
      let csvText = '';
      if (window.electronAPI?.fetchText) {
        const netRes = await window.electronAPI.fetchText(csvUrl);
        if (!netRes.ok) {
          throw new Error(netRes.error || `HTTP ${netRes.status || 'Error'}`);
        }
        csvText = netRes.text;
      } else {
        const resp = await fetch(csvUrl);
        if (!resp.ok) {
          throw new Error(`HTTP ${resp.status} - Hãy chắc chắn link Google Sheet đã bật chia sẻ công khai ("Bất kỳ ai có liên kết").`);
        }
        csvText = await resp.text();
      }

      const rows = parseCSV(csvText);
      if (!rows || rows.length < 2) {
        throw new Error('Bảng tính không có dữ liệu hoặc định dạng rỗng.');
      }

      const headers = rows[0].map(h => String(h || '').trim().toLowerCase());
      let nameIdx = headers.findIndex(h => /tên video gốc|tên video|video gốc|tên file|filename|video|name/i.test(h));
      let topicIdx = headers.findIndex(h => /chủ đề|sản phẩm|topic|product|title/i.test(h));
      let scriptIdx = headers.findIndex(h => /kịch bản voiceover|kịch bản tts|voiceover|kịch bản voice|voiceover tts|tts script|script/i.test(h));

      if (nameIdx < 0) nameIdx = 1; // Fallback to col 1 ("Tên Video Gốc")
      if (scriptIdx < 0) scriptIdx = headers.findIndex(h => /kịch bản|voice|tts|lời thoại/i.test(h));
      if (scriptIdx < 0) scriptIdx = 6; // Fallback to col 6 ("Kịch Bản Voiceover TTS")

      const jobs = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const rawName = String(row[nameIdx] || '').trim();
        const topic = topicIdx >= 0 ? String(row[topicIdx] || '').trim() : '';
        const script = String(row[scriptIdx] || '').trim();

        if (!rawName && !script) continue;

        const wavName = sanitizeWavFileName(rawName, r - 1);
        const charCount = script.length;
        const words = script ? script.trim().split(/\s+/).length : 0;
        const estSec = Math.max(1, Math.round(words / 2.7));
        const estMin = Math.floor(estSec / 60);
        const estRemSec = estSec % 60;
        const estLabel = estMin > 0 ? `${estMin}m ${estRemSec}s` : `${estSec}s`;

        let fullOutputPath = '';
        if (state.batchFolder) {
          const sep = state.batchFolder.includes('/') ? '/' : '\\';
          fullOutputPath = `${state.batchFolder.replace(/[\\/]+$/, '')}${sep}${wavName}`;
        }

        jobs.push({
          id: 'vr_bjob_' + Date.now() + '_' + r + '_' + Math.random().toString(36).slice(2, 6),
          stt: r,
          rawName: rawName || `Video_${r}`,
          wavName: wavName,
          topic: topic,
          script: script,
          charCount: charCount,
          wordCount: words,
          durationEst: estLabel,
          status: 'waiting',
          progress: 0,
          outputPath: fullOutputPath,
          errorMsg: '',
          selected: true
        });
      }

      state.batchJobs = jobs;
      renderBatchTable();
      if (jobs.length > 0) {
        selectBatchJob(jobs[0].id);
      }
      vrBatchLog(`🎉 Đã quét thành công ${jobs.length} kịch bản Voiceover từ Google Sheet!`, 'success');
      window.showToast?.(`Đã nạp ${jobs.length} kịch bản từ Google Sheet!`, 'success');
    } catch (e) {
      vrBatchLog(`Lỗi quét Google Sheet: ${e.message}`, 'error');
      window.showToast?.(`Lỗi quét Sheet: ${e.message}`, 'error');
    }
  }

  async function pickBatchVoiceFolder() {
    try {
      if (window.electronAPI?.openDirectory) {
        const res = await window.electronAPI.openDirectory();
        const folderPath = !res?.canceled && res?.filePaths?.[0];
        if (folderPath) {
          state.batchFolder = folderPath;
          localStorage.setItem('voice_render_batch_folder', folderPath);
          const input = document.getElementById('vr-batch-folder-path');
          if (input) input.value = folderPath;

          const sep = folderPath.includes('/') ? '/' : '\\';
          state.batchJobs.forEach(job => {
            job.outputPath = `${folderPath.replace(/[\\/]+$/, '')}${sep}${job.wavName}`;
          });

          renderBatchTable();
          renderBatchInspector();
          vrBatchLog(`Đã chọn thư mục lưu audio: ${folderPath}`, 'info');
        }
      }
    } catch (e) {
      vrBatchLog(`Lỗi chọn thư mục: ${e.message}`, 'error');
    }
  }

  function updateBatchSummary() {
    const pill = document.getElementById('vr-batch-count-pill');
    const summary = document.getElementById('vr-batch-summary');
    const total = state.batchJobs.length;
    const ready = state.batchJobs.filter(j => j.status === 'waiting').length;
    const done = state.batchJobs.filter(j => j.status === 'done').length;
    const err = state.batchJobs.filter(j => j.status === 'error').length;
    const rendering = state.batchJobs.filter(j => j.status === 'rendering').length;

    if (pill) {
      pill.style.display = total > 0 ? 'inline-block' : 'none';
      pill.textContent = total;
    }
    if (summary) {
      summary.className = `vr-badge ${err > 0 ? 'error' : done === total && total > 0 ? 'done' : rendering > 0 ? 'processing' : 'waiting'}`;
      summary.textContent = `${total} file · ${ready} chờ · ${done} hoàn tất${err > 0 ? ` · ${err} lỗi` : ''}${rendering > 0 ? ' · đang chạy' : ''}`;
    }
  }

  function selectBatchJob(jobId) {
    state.batchSelectedJobId = jobId;
    renderBatchTable();
    renderBatchInspector();
  }

  function renderBatchTable() {
    const tbody = document.getElementById('vr-batch-tbody');
    if (!tbody) return;

    if (!state.batchJobs.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:40px 10px;color:#64748b;">
            Chưa có dữ liệu. Hãy dán link Google Sheet ở trên và bấm "Quét Sheet", sau đó chọn thư mục lưu audio.
          </td>
        </tr>`;
      updateBatchSummary();
      return;
    }

    let html = '';
    state.batchJobs.forEach((job, idx) => {
      const isSelected = job.id === state.batchSelectedJobId;
      let statusBadge = '<span class="vr-badge waiting">Chờ xử lý</span>';
      if (job.status === 'rendering') statusBadge = `<span class="vr-badge processing">⚡ Đang render (${job.progress || 0}%)</span>`;
      else if (job.status === 'done') statusBadge = '<span class="vr-badge done">✓ Hoàn tất</span>';
      else if (job.status === 'error') statusBadge = `<span class="vr-badge error" title="${escapeHtml(job.errorMsg || 'Lỗi')}">⚠ Lỗi</span>`;

      const scriptPreview = job.script ? job.script.replace(/\n+/g, ' ').slice(0, 65) + (job.script.length > 65 ? '…' : '') : '<i style="color:#64748b;">(Không có kịch bản)</i>';

      html += `
        <tr class="${isSelected ? 'selected' : ''}" data-job-id="${job.id}">
          <td style="text-align:center;" onclick="event.stopPropagation();">
            <input type="checkbox" class="vr-batch-job-cb" data-job-id="${job.id}" ${job.selected ? 'checked' : ''}>
          </td>
          <td style="color:#94a3b8;font-size:11px;">${idx + 1}</td>
          <td>
            <div style="font-weight:600;color:#f1f5f9;font-size:12px;word-break:break-all;font-family:Consolas,monospace;">${escapeHtml(job.wavName)}</div>
            ${job.topic ? `<div style="font-size:11px;color:#38bdf8;margin-top:2px;">${escapeHtml(job.topic)}</div>` : ''}
          </td>
          <td style="color:#cbd5e1;font-size:11px;max-width:260px;" title="${escapeHtml(job.script)}">
            ${escapeHtml(scriptPreview)}
          </td>
          <td style="text-align:center;color:#94a3b8;font-size:11px;">${job.charCount}</td>
          <td style="color:#94a3b8;font-size:11px;">${job.durationEst}</td>
          <td>${statusBadge}</td>
          <td style="text-align:center;" onclick="event.stopPropagation();">
            <div style="display:flex;gap:4px;justify-content:center;">
              <button class="vr-btn secondary vr-btn-job-inspect" data-job-id="${job.id}" style="padding:2px 6px;font-size:11px;" title="Xem chi tiết & nghe thử">🔍</button>
              ${job.status === 'done' && job.outputPath ? `
                <button class="vr-btn secondary vr-btn-job-open" data-job-id="${job.id}" style="padding:2px 6px;font-size:11px;" title="Mở file audio">📁</button>
              ` : `
                <button class="vr-btn primary vr-btn-job-run-single" data-job-id="${job.id}" style="padding:2px 6px;font-size:11px;" title="Render riêng file này" ${state.batchRunning ? 'disabled' : ''}>▶</button>
              `}
            </div>
          </td>
        </tr>`;
    });

    tbody.innerHTML = html;
    updateBatchSummary();

    // Bind row click & buttons
    tbody.querySelectorAll('tr[data-job-id]').forEach(tr => {
      tr.addEventListener('click', () => selectBatchJob(tr.dataset.jobId));
    });

    tbody.querySelectorAll('.vr-batch-job-cb').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const j = state.batchJobs.find(x => x.id === cb.dataset.jobId);
        if (j) j.selected = cb.checked;
        updateBatchSummary();
      });
    });

    tbody.querySelectorAll('.vr-btn-job-inspect').forEach(btn => {
      btn.addEventListener('click', () => selectBatchJob(btn.dataset.jobId));
    });

    tbody.querySelectorAll('.vr-btn-job-run-single').forEach(btn => {
      btn.addEventListener('click', () => {
        const j = state.batchJobs.find(x => x.id === btn.dataset.jobId);
        if (j) runSingleBatchJob(j);
      });
    });

    tbody.querySelectorAll('.vr-btn-job-open').forEach(btn => {
      btn.addEventListener('click', () => {
        const j = state.batchJobs.find(x => x.id === btn.dataset.jobId);
        if (j?.outputPath) window.electronAPI?.openPath?.(j.outputPath);
      });
    });
  }

  function renderBatchInspector() {
    const emptyEl = document.getElementById('vr-inspector-empty');
    const bodyEl = document.getElementById('vr-inspector-body');
    const badgeEl = document.getElementById('vr-inspector-badge');
    const fileNameEl = document.getElementById('vr-inspector-filename');
    const topicEl = document.getElementById('vr-inspector-topic');
    const scriptEl = document.getElementById('vr-inspector-script-text');
    const charCountEl = document.getElementById('vr-inspector-char-count');
    const audioEl = document.getElementById('vr-batch-preview-audio');
    const runBtn = document.getElementById('vr-btn-inspector-run-single');
    const openBtn = document.getElementById('vr-btn-inspector-open-file');

    const job = state.batchJobs.find(j => j.id === state.batchSelectedJobId);
    if (!job) {
      if (emptyEl) emptyEl.style.display = 'block';
      if (bodyEl) bodyEl.style.display = 'none';
      if (badgeEl) { badgeEl.className = 'vr-badge waiting'; badgeEl.textContent = 'Chưa chọn'; }
      return;
    }

    if (emptyEl) emptyEl.style.display = 'none';
    if (bodyEl) bodyEl.style.display = 'flex';

    if (badgeEl) {
      if (job.status === 'rendering') { badgeEl.className = 'vr-badge processing'; badgeEl.textContent = 'Đang render'; }
      else if (job.status === 'done') { badgeEl.className = 'vr-badge done'; badgeEl.textContent = 'Đã hoàn tất'; }
      else if (job.status === 'error') { badgeEl.className = 'vr-badge error'; badgeEl.textContent = 'Lỗi'; }
      else { badgeEl.className = 'vr-badge waiting'; badgeEl.textContent = 'Chờ xử lý'; }
    }

    if (fileNameEl) fileNameEl.textContent = job.wavName;
    if (topicEl) topicEl.textContent = job.topic ? `Chủ đề: ${job.topic}` : '';
    if (scriptEl) {
      scriptEl.value = job.script || '';
      scriptEl.oninput = () => {
        job.script = scriptEl.value;
        job.charCount = job.script.length;
        const words = job.script ? job.script.trim().split(/\s+/).length : 0;
        job.wordCount = words;
        if (charCountEl) charCountEl.textContent = `${job.charCount} ký tự (${words} từ)`;
      };
    }
    if (charCountEl) charCountEl.textContent = `${job.charCount} ký tự (${job.wordCount || 0} từ)`;

    if (audioEl) {
      if (job.status === 'done' && job.outputPath) {
        const audioUrl = toMediaUrl(job.outputPath, Date.now());
        if (audioEl.dataset.mediaUrl !== audioUrl) {
          audioEl.dataset.mediaUrl = audioUrl;
          audioEl.src = audioUrl;
          audioEl.load();
        }
      } else {
        delete audioEl.dataset.mediaUrl;
        audioEl.removeAttribute('src');
        audioEl.load();
      }
    }

    if (openBtn) {
      openBtn.disabled = !(job.status === 'done' && job.outputPath);
      openBtn.onclick = () => {
        if (job.outputPath) window.electronAPI?.openPath?.(job.outputPath);
      };
    }

    if (runBtn) {
      runBtn.disabled = state.batchRunning || job.status === 'rendering';
      runBtn.onclick = () => runSingleBatchJob(job);
    }
  }

  async function runSingleBatchJob(job) {
    if (!job) return false;
    if (!job.script || !job.script.trim()) {
      job.status = 'error';
      job.errorMsg = 'Kịch bản trống';
      renderBatchTable();
      renderBatchInspector();
      vrBatchLog(`[${job.wavName}] Bỏ qua: Kịch bản trống.`, 'warn');
      return false;
    }

    if (!state.batchFolder) {
      window.showToast?.('Vui lòng chọn thư mục lưu audio trước khi render.', 'warning');
      vrBatchLog('Vui lòng chọn thư mục lưu audio.', 'warn');
      return false;
    }

    const sep = state.batchFolder.includes('/') ? '/' : '\\';
    job.outputPath = `${state.batchFolder.replace(/[\\/]+$/, '')}${sep}${job.wavName}`;

    job.status = 'rendering';
    job.progress = 0;
    job.errorMsg = '';
    renderBatchTable();
    renderBatchInspector();

    const voiceSelect = document.getElementById('vr-batch-voice-select');
    const targetVoiceId = voiceSelect?.value || state.selectedVoiceId || 'default';
    const voices = voiceCatalog();
    let voice = voices.find(v => v.id === targetVoiceId) || voices[0];

    const langSelect = document.getElementById('vr-batch-language');
    const language = langSelect?.value || 'vi';

    vrBatchLog(`▶ Bắt đầu render: ${job.wavName} (${job.charCount} ký tự) với giọng [${voice.name}]...`, 'info');

    try {
      voice = await ensureVoiceReferenceTranscript(voice);
      const chunkSize = 280;
      const chunks = splitLongText(job.script, chunkSize, true);
      if (!chunks.length) throw new Error('Không chia được chunk từ kịch bản.');

      const completedChunkPaths = [];
      const totalChunks = chunks.length;

      for (let i = 0; i < totalChunks; i++) {
        if (state.batchStopping) {
          vrBatchLog(`[${job.wavName}] Đã dừng render theo yêu cầu.`, 'warn');
          job.status = 'waiting';
          renderBatchTable();
          renderBatchInspector();
          return false;
        }

        const chunkText = chunks[i];
        const chunkPath = deriveChunkPath(job.outputPath, i);
        job.progress = Math.round(((i) / totalChunks) * 100);
        renderBatchTable();

        const isClone = voice.type === 'Clone';
        const payload = {
          text: chunkText,
          ref_audio_path: isClone ? (voice.refAudioPath || null) : null,
          ref_text: isClone ? (voice.referenceTranscript || null) : null,
          language,
          output_path: chunkPath,
          ...(voice.voiceName ? { voice_name: voice.voiceName } : {}),
        };

        const resp = await window.api.post('/api/tts/generate', payload);
        if (resp?.status !== 'ok' || !resp.audio_path) {
          throw new Error(resp?.error || `Lỗi render chunk ${i + 1}/${totalChunks}`);
        }
        completedChunkPaths.push(resp.audio_path);
      }

      job.progress = 95;
      renderBatchTable();

      // Merge chunks into the final broadcast 48kHz Stereo PCM_16 WAV file named after Tên Video Gốc!
      if (!window.electronAPI?.mergeWavFiles) {
        throw new Error('IPC mergeWavFiles không khả dụng.');
      }

      const merged = await window.electronAPI.mergeWavFiles(completedChunkPaths, job.outputPath);
      if (!merged?.ok || !merged.output_path) {
        throw new Error(merged?.error || 'Không thể ghép các chunk audio.');
      }

      job.status = 'done';
      job.progress = 100;
      job.outputPath = merged.output_path;
      renderBatchTable();
      renderBatchInspector();
      vrBatchLog(`✓ Hoàn tất: ${job.wavName} ➔ ${merged.output_path}`, 'success');
      return true;
    } catch (err) {
      job.status = 'error';
      job.errorMsg = err.message || String(err);
      renderBatchTable();
      renderBatchInspector();
      vrBatchLog(`✕ Lỗi render [${job.wavName}]: ${job.errorMsg}`, 'error');
      return false;
    }
  }

  async function startBatchExecution() {
    if (!state.batchJobs.length) {
      window.showToast?.('Chưa có job nào trong hàng đợi. Hãy quét Google Sheet trước.', 'warning');
      return;
    }

    if (!state.batchFolder) {
      window.showToast?.('Vui lòng chọn thư mục lưu audio trước khi render hàng loạt.', 'warning');
      await pickBatchVoiceFolder();
      if (!state.batchFolder) return;
    }

    const selectedJobs = state.batchJobs.filter(j => j.selected && j.status !== 'done');
    if (!selectedJobs.length) {
      window.showToast?.('Không có job nào được chọn hoặc tất cả đã hoàn tất.', 'info');
      return;
    }

    state.batchRunning = true;
    state.batchStopping = false;

    const runBtn = document.getElementById('vr-btn-batch-run');
    const stopBtn = document.getElementById('vr-btn-batch-stop');
    if (runBtn) runBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';

    vrBatchLog(`🚀 BẮT ĐẦU CHẠY HÀNG LOẠT: ${selectedJobs.length} file audio...`, 'info');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < state.batchJobs.length; i++) {
      if (state.batchStopping) {
        vrBatchLog('⏹ Đã dừng tiến trình hàng loạt theo yêu cầu.', 'warn');
        break;
      }
      const job = state.batchJobs[i];
      if (!job.selected || job.status === 'done') continue;

      state.batchCurrentIdx = i;
      selectBatchJob(job.id);

      const ok = await runSingleBatchJob(job);
      if (ok) successCount++;
      else failCount++;
    }

    state.batchRunning = false;
    state.batchStopping = false;
    state.batchCurrentIdx = -1;

    if (runBtn) runBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';

    renderBatchTable();
    renderBatchInspector();

    vrBatchLog(`🏁 KẾT THÚC HÀNG LOẠT: Thành công ${successCount}, Lỗi ${failCount}.`, successCount > 0 ? 'success' : 'warn');
    window.showToast?.(`Hoàn tất batch: ${successCount} thành công, ${failCount} lỗi.`, successCount > 0 ? 'success' : 'warning');
  }

  function stopBatchExecution() {
    if (!state.batchRunning) return;
    state.batchStopping = true;
    vrBatchLog('Đang dừng hàng loạt sau file hiện tại...', 'warn');
    const stopBtn = document.getElementById('vr-btn-batch-stop');
    if (stopBtn) stopBtn.textContent = '⏳ Đang dừng...';
  }

  function bindModeSwitcher() {
    const tabSingle = document.getElementById('vr-tab-single');
    const tabBatch = document.getElementById('vr-tab-batch');
    const viewSingle = document.getElementById('vr-single-view');
    const viewBatch = document.getElementById('vr-batch-view');

    tabSingle?.addEventListener('click', () => {
      tabSingle.classList.add('active');
      tabBatch?.classList.remove('active');
      if (viewSingle) viewSingle.style.display = 'grid';
      if (viewBatch) viewBatch.style.display = 'none';
    });

    tabBatch?.addEventListener('click', () => {
      tabBatch.classList.add('active');
      tabSingle?.classList.remove('active');
      if (viewSingle) viewSingle.style.display = 'none';
      if (viewBatch) viewBatch.style.display = 'flex';
      renderBatchVoiceSelect();
      renderBatchTable();
      renderBatchInspector();
    });
  }

  function bindBatchEvents() {
    document.getElementById('vr-btn-scan-sheet')?.addEventListener('click', scanBatchGoogleSheet);
    document.getElementById('vr-btn-pick-folder')?.addEventListener('click', pickBatchVoiceFolder);
    document.getElementById('vr-btn-batch-run')?.addEventListener('click', startBatchExecution);
    document.getElementById('vr-btn-batch-stop')?.addEventListener('click', stopBatchExecution);

    document.getElementById('vr-batch-select-all')?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      state.batchJobs.forEach(j => j.selected = checked);
      renderBatchTable();
    });

    document.getElementById('vr-btn-batch-clear')?.addEventListener('click', () => {
      state.batchJobs = [];
      state.batchSelectedJobId = null;
      renderBatchTable();
      renderBatchInspector();
      vrBatchLog('Đã xóa toàn bộ hàng đợi.', 'info');
    });

    document.getElementById('vr-btn-batch-retry-errors')?.addEventListener('click', () => {
      const errJobs = state.batchJobs.filter(j => j.status === 'error');
      if (!errJobs.length) {
        window.showToast?.('Không có file nào bị lỗi.', 'info');
        return;
      }
      errJobs.forEach(j => {
        j.status = 'waiting';
        j.selected = true;
        j.errorMsg = '';
      });
      renderBatchTable();
      startBatchExecution();
    });

    document.getElementById('vr-btn-batch-open-folder')?.addEventListener('click', () => {
      if (state.batchFolder) {
        window.electronAPI?.openPath?.(state.batchFolder);
      } else {
        window.showToast?.('Chưa chọn thư mục kết quả.', 'warning');
      }
    });

    // Populate saved batch folder into input if available
    const folderInput = document.getElementById('vr-batch-folder-path');
    if (folderInput && state.batchFolder) {
      folderInput.value = state.batchFolder;
    }
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
