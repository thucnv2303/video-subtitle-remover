(function () {
  'use strict';

  const PAGE_ID = 'page-video-render';
  const NAV_ID = 'nav-video-render';
  const STYLE_ATTR = 'data-video-render-style';

  const state = {
    // Mode: 'single' | 'batch'
    activeMode: 'single',

    // Single mode state
    videoPath: '',
    videoDuration: 0,
    clips: [],
    activeClipId: null,
    rendering: false,
    mode: 'lossless', // 'lossless' | 'accurate'
    outputDir: '',
    logs: [],
    lastOutputPath: '',

    // Batch mode state
    sheetUrl: '',
    batchFolder: '',
    batchOutputFolder: '',
    batchScannedFiles: [],
    batchJobs: [],
    batchRunning: false,
    batchStopping: false,
    batchCurrentIdx: -1,
  };

  function ensureStyle() {
    if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/video-render.css';
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
    }
    if (!cacheKey || /^blob:/i.test(mediaUrl)) return mediaUrl;
    const separator = mediaUrl.includes('?') ? '&' : '?';
    return `${mediaUrl}${separator}vsr_preview=${encodeURIComponent(String(cacheKey))}`;
  }

  function loadVideoPreview(videoEl, path, options = {}) {
    if (!videoEl) return false;
    const { cacheKey = '', forceReload = false, autoplay = false, onMetadata = null } = options;
    const targetUrl = toMediaUrl(path, cacheKey);
    if (!targetUrl) return false;
    if (!forceReload && videoEl.dataset.vidrMediaKey === targetUrl) return false;

    if (videoEl._vidrMetadataHandler) {
      videoEl.removeEventListener('loadedmetadata', videoEl._vidrMetadataHandler);
      videoEl._vidrMetadataHandler = null;
    }

    const metadataHandler = () => {
      videoEl._vidrMetadataHandler = null;
      if (typeof onMetadata === 'function') onMetadata(videoEl.duration);
      if (autoplay) videoEl.play().catch(e => console.warn('Play output video catch:', e));
    };
    videoEl._vidrMetadataHandler = metadataHandler;
    videoEl.addEventListener('loadedmetadata', metadataHandler, { once: true });

    videoEl.pause();
    if (forceReload) {
      videoEl.removeAttribute('src');
      videoEl.removeAttribute('data-vidr-media-key');
      videoEl.load();
    }
    videoEl.dataset.vidrMediaKey = targetUrl;
    videoEl.src = targetUrl;
    videoEl.load();
    return true;
  }

  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function vidrLog(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    state.logs.unshift({ time, message: msg, type });
    if (state.logs.length > 300) state.logs.pop();
    renderLogs();
  }

  function renderLogs() {
    const el = document.getElementById('vidr-log-output');
    if (el) {
      el.innerHTML = state.logs.map(l => {
        const color = l.type === 'error' ? '#f87171' : l.type === 'warn' ? '#fbbf24' : l.type === 'success' ? '#34d399' : '#94a3b8';
        return `<div style="color:${color};margin-bottom:2px;"><span style="color:#64748b;">[${l.time}]</span> ${escapeHtml(l.message)}</div>`;
      }).join('');
    }
    const batchLogEl = document.getElementById('vidr-batch-log-output');
    if (batchLogEl) {
      batchLogEl.innerHTML = state.logs.map(l => {
        const color = l.type === 'error' ? '#f87171' : l.type === 'warn' ? '#fbbf24' : l.type === 'success' ? '#34d399' : '#94a3b8';
        return `<div style="color:${color};margin-bottom:2px;"><span style="color:#64748b;">[${l.time}]</span> ${escapeHtml(l.message)}</div>`;
      }).join('');
    }
  }

  function parseTimeToSeconds(t) {
    if (!t) return 0;
    const s = String(t).trim();
    if (/^\d+(\.\d+)?$/.test(s)) return parseFloat(s);
    const parts = s.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
  }

  function formatSecondsToTime(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = Math.floor(s % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`;
  }

  function mountNav() {
    const menu = document.querySelector('.nav-menu');
    if (!menu || document.getElementById(NAV_ID)) return;
    const voiceRenderNav = document.getElementById('nav-voice-render');
    const settingsItem = menu.querySelector('[data-page="settings"]');
    const item = document.createElement('a');
    item.href = '#';
    item.id = NAV_ID;
    item.className = 'nav-item';
    item.dataset.page = 'video-render';
    item.title = 'Video Render';
    item.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="2" y1="7" x2="7" y2="7"/>
        <line x1="2" y1="17" x2="7" y2="17"/>
        <line x1="17" y1="17" x2="22" y2="17"/>
        <line x1="17" y1="7" x2="22" y2="7"/>
      </svg><span>Video Render</span>`;
    
    if (voiceRenderNav && voiceRenderNav.nextSibling) {
      menu.insertBefore(item, voiceRenderNav.nextSibling);
    } else if (settingsItem) {
      menu.insertBefore(item, settingsItem);
    } else {
      menu.appendChild(item);
    }
  }

  function mountPage() {
    const main = document.querySelector('.main-area');
    if (!main || document.getElementById(PAGE_ID)) return;
    const section = document.createElement('section');
    section.id = PAGE_ID;
    section.className = 'page video-render-page';
    section.innerHTML = `
      <div class="vidr-shell">
        <header class="vidr-header">
          <div>
            <h1>🎬 Video Render <span style="font-size:12px;font-weight:normal;padding:2px 8px;border-radius:12px;background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);">Smart Timeline Cut & Concat</span></h1>
            <p>Tự động cắt video theo bảng timeline hoặc lệnh FFmpeg và ghép nối thành video hoàn chỉnh theo thứ tự tùy biến.</p>
          </div>
          <button id="vidr-btn-pick-video" class="vidr-btn primary" type="button">📁 Chọn video nguồn</button>
        </header>

        <!-- Mode Switcher Tabs -->
        <div class="vidr-mode-tabs">
          <button id="vidr-tab-single" class="vidr-mode-tab active" type="button">⚡ Cắt Ghép Đơn Lẻ</button>
          <button id="vidr-tab-batch" class="vidr-mode-tab" type="button">📊 Hàng Loạt Từ Google Sheets <span id="vidr-batch-count-pill" style="font-size:11px;padding:1px 6px;border-radius:10px;background:rgba(59,130,246,0.3);display:none;">0</span></button>
        </div>

        <!-- Mode 1: Single Video View -->
        <div id="vidr-single-view" class="vidr-grid">
          <!-- Column 1: Config & Script -->
          <section class="vidr-panel">
            <div class="vidr-panel-title">
              <div><span class="vidr-step">1</span><h2>Cấu hình & Kịch bản cắt</h2></div>
            </div>

            <div class="vidr-field">
              <span>Video nguồn</span>
              <div class="vidr-video-select-bar">
                <input type="text" id="vidr-video-path" class="vidr-input" placeholder="Chưa chọn video..." readonly>
                <button id="vidr-btn-browse-file" class="vidr-btn secondary" type="button">Chọn file</button>
              </div>
            </div>

            <div class="vidr-field">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span>Kịch bản Timeline / Lệnh FFmpeg</span>
                <button id="vidr-btn-load-sample" class="vidr-link-btn" type="button">Nạp mẫu</button>
              </div>
              <textarea id="vidr-script-input" class="vidr-textarea" placeholder="# Dán danh sách lệnh FFmpeg hoặc timeline vào đây...
# Ví dụ:
# Đoạn 1
ffmpeg -ss 00:00:03 -to 00:00:05 -i input.mp4 -c copy clip1.mp4

# Đoạn 2
ffmpeg -ss 00:00:00 -to 00:00:02 -i input.mp4 -c copy clip2.mp4

# Đoạn 3
ffmpeg -ss 00:00:04 -to 00:00:06 -i input.mp4 -c copy clip3.mp4"></textarea>
            </div>

            <button id="vidr-btn-parse" class="vidr-btn primary" type="button" style="margin-top:auto;">⚡ Phân tích Timeline</button>
          </section>

          <!-- Column 2: Sequence Queue -->
          <section class="vidr-panel">
            <div class="vidr-panel-title">
              <div><span class="vidr-step">2</span><h2>Trình tự phân đoạn</h2></div>
              <span id="vidr-clips-count" style="font-size:12px;color:var(--text-muted,#94a3b8);">0 đoạn</span>
            </div>

            <div style="display:flex;justify-content:space-between;gap:8px;">
              <button id="vidr-btn-add-clip" class="vidr-btn secondary" style="flex:1;" type="button">＋ Thêm đoạn</button>
              <button id="vidr-btn-clear-clips" class="vidr-btn danger" type="button">🗑 Xóa hết</button>
            </div>

            <div id="vidr-clip-list" class="vidr-clip-list">
              <div class="vidr-empty">
                <div style="font-size:24px;margin-bottom:8px;">🎬</div>
                <div>Chưa có phân đoạn nào.</div>
                <div style="font-size:11px;margin-top:4px;">Dán kịch bản ở Cột 1 rồi bấm "Phân tích Timeline" hoặc bấm "+ Thêm đoạn".</div>
              </div>
            </div>

            <div style="padding-top:8px;border-top:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;font-size:12px;">
              <span style="color:var(--text-muted,#94a3b8);">Tổng thời lượng dự kiến:</span>
              <strong id="vidr-total-duration" style="color:#60a5fa;">00:00:00</strong>
            </div>
          </section>

          <!-- Column 3: Preview & Export -->
          <section class="vidr-panel">
            <div class="vidr-panel-title">
              <div><span class="vidr-step">3</span><h2>Xem trước & Kết xuất</h2></div>
            </div>

            <div class="vidr-player-wrap">
              <video id="vidr-preview-video" controls></video>
            </div>

            <div class="vidr-field">
              <span>Chế độ cắt & ghép</span>
              <select id="vidr-mode-select" class="vidr-select">
                <option value="lossless">⚡ Siêu tốc (Lossless Stream-Copy - Không nén lại)</option>
                <option value="accurate">🎯 Chuẩn xác khung hình (Accurate Re-encode - Tránh đen hình)</option>
              </select>
            </div>

            <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;user-select:none;color:#e2e8f0;margin:4px 0 8px;">
              <input type="checkbox" id="vidr-remove-vocal" style="accent-color:#3b82f6;width:15px;height:15px;">
              <span><strong>Xóa giọng nói gốc</strong> <small style="color:var(--text-muted,#94a3b8);">(Tự động bóc tách AI Demucs & chỉ giữ lại nhạc nền BGM khi xuất video)</small></span>
            </label>

            <div class="vidr-field">
              <span>File đầu ra</span>
              <input type="text" id="vidr-output-path" class="vidr-input" placeholder="Tự động đặt tên theo video gốc (_remix.mp4)">
            </div>

            <div class="vidr-progress-box">
              <div style="display:flex;justify-content:space-between;font-size:12px;">
                <span id="vidr-progress-status" style="color:var(--text-muted,#94a3b8);">Sẵn sàng</span>
                <span id="vidr-progress-pct">0%</span>
              </div>
              <div class="vidr-progress-bar"><div id="vidr-progress-fill" class="vidr-progress-fill"></div></div>
            </div>

            <button id="vidr-btn-start-render" class="vidr-btn primary" type="button" style="padding:12px;font-size:14px;">🚀 BẮT ĐẦU CẮT & GHÉP VIDEO</button>

            <div id="vidr-post-render-actions" style="display:none;margin-top:8px;flex-direction:column;gap:8px;">
              <button id="vidr-btn-push-to-sub" class="vidr-btn" type="button" style="padding:10px 14px;font-size:13px;background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(147,51,234,0.2));color:#93c5fd;border:1px solid rgba(59,130,246,0.5);font-weight:600;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;" title="Đưa video hoàn tất này sang tab Xóa Sub để tạo Job xóa phụ đề">
                ✨ Đẩy sang Xóa Sub (Tạo Job Xóa Sub) ➔
              </button>
            </div>

            <div class="vidr-field" style="margin-top:auto;">
              <span>Nhật ký tiến trình (Log)</span>
              <div id="vidr-log-output" class="vidr-log-output"></div>
            </div>
          </section>
        </div>

        <!-- Mode 2: Batch Google Sheets View -->
        <div id="vidr-batch-view" class="vidr-batch-view" style="display:none;">
          <!-- Batch Config Card -->
          <div class="vidr-batch-config-card">
            <div class="vidr-field">
              <span>Đường link Google Sheets (Bảng tính kịch bản)</span>
              <div style="display:flex;gap:8px;">
                <input type="text" id="vidr-sheet-url" class="vidr-input" value="https://docs.google.com/spreadsheets/d/142oK47OvdLmHZrkFUbllcL8CbwtxKeZ054In2z7Cm1o/edit?gid=0#gid=0" placeholder="https://docs.google.com/spreadsheets/d/.../edit" style="flex:1;">
                <button id="vidr-btn-scan-sheet" class="vidr-btn primary" type="button" style="white-space:nowrap;">📥 Quét Sheet</button>
              </div>
            </div>

            <div class="vidr-field">
              <span>Thư mục chứa video gốc trên máy</span>
              <div style="display:flex;gap:8px;">
                <input type="text" id="vidr-batch-folder-path" class="vidr-input" placeholder="Chưa chọn thư mục nguồn..." readonly style="flex:1;">
                <button id="vidr-btn-pick-folder" class="vidr-btn secondary" type="button" style="white-space:nowrap;">📂 Chọn thư mục</button>
              </div>
            </div>

            <div class="vidr-field">
              <span>Thư mục lưu video đầu ra (Tùy chọn)</span>
              <div style="display:flex;gap:8px;">
                <input type="text" id="vidr-batch-output-folder-path" class="vidr-input" placeholder="Mặc định: Cùng thư mục gốc..." readonly style="flex:1;">
                <button id="vidr-btn-pick-output-folder" class="vidr-btn secondary" type="button" style="white-space:nowrap;">📂 Chọn đầu ra</button>
              </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:6px;">
              <span>Cài đặt cắt ghép chung</span>
              <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                <select id="vidr-batch-mode-select" class="vidr-select" style="width:115px;">
                  <option value="lossless">⚡ Siêu tốc</option>
                  <option value="accurate">🎯 Chuẩn xác</option>
                </select>
                <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;color:#e2e8f0;">
                  <input type="checkbox" id="vidr-batch-remove-vocal" style="accent-color:#3b82f6;">
                  <span>Xóa giọng nói (BGM)</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Batch 2-Column Grid: Queue on Left, Inspector & Preview on Right -->
          <div class="vidr-batch-grid">
            <!-- Left Column: Batch Queue & Actions -->
            <div style="display:flex;flex-direction:column;gap:14px;">
              <div class="vidr-table-wrap">
                <div class="vidr-table-header-bar">
                  <div style="display:flex;align-items:center;gap:12px;">
                    <strong style="font-size:14px;color:#fff;">📋 Hàng đợi xử lý hàng loạt</strong>
                    <span id="vidr-batch-summary" class="vidr-badge waiting">0 video</span>
                  </div>
                  <div style="display:flex;gap:8px;">
                    <button id="vidr-btn-batch-clear" class="vidr-btn danger" style="padding:4px 10px;font-size:11px;" type="button">🗑 Xóa hết</button>
                  </div>
                </div>

                <div class="vidr-table-scroll">
                  <table class="vidr-table">
                    <thead>
                      <tr>
                        <th style="width:36px;text-align:center;"><input type="checkbox" id="vidr-batch-select-all" checked></th>
                        <th style="width:36px;">STT</th>
                        <th>Tên Video / Sản Phẩm</th>
                        <th>File Nguồn</th>
                        <th style="width:60px;text-align:center;">Đoạn</th>
                        <th style="width:75px;">Thời lượng</th>
                        <th style="width:115px;">Trạng thái</th>
                        <th style="width:90px;text-align:center;">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody id="vidr-batch-tbody">
                      <tr>
                        <td colspan="8" style="text-align:center;padding:40px 10px;color:#64748b;">
                          Chưa có dữ liệu. Hãy dán link Google Sheet ở trên và bấm "Quét Sheet", sau đó chọn thư mục chứa video gốc.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Batch Actions & Controls -->
                <div class="vidr-batch-actions">
                  <button id="vidr-btn-batch-run" class="vidr-btn primary" type="button" style="padding:10px 16px;font-size:13px;font-weight:700;">
                    ▶ BẮT ĐẦU CHẠY HÀNG LOẠT
                  </button>
                  <button id="vidr-btn-batch-stop" class="vidr-btn danger" type="button" style="padding:10px 14px;font-size:13px;display:none;">
                    ⏹ DỪNG LẠI
                  </button>
                  <button id="vidr-btn-batch-retry-failed" class="vidr-btn secondary" type="button" style="padding:10px 12px;font-size:12px;">
                    🔄 Chạy lại lỗi
                  </button>
                  <button id="vidr-btn-batch-open-output-folder" class="vidr-btn secondary" type="button" style="padding:10px 12px;font-size:12px;">
                    📂 Mở thư mục kết quả
                  </button>
                  <div style="flex:1;"></div>
                  <button id="vidr-btn-batch-push-sub" class="vidr-btn" type="button" style="padding:10px 16px;font-size:13px;background:linear-gradient(135deg,#3b82f6,#9333ea);color:#fff;border:none;font-weight:700;border-radius:8px;cursor:pointer;">
                    ✨ ĐẨY TOÀN BỘ SANG XÓA SUB ➔
                  </button>
                </div>
              </div>

              <!-- Batch Log Box -->
              <div class="vidr-field">
                <span>Nhật ký tiến trình hàng loạt (Log)</span>
                <div id="vidr-batch-log-output" class="vidr-log-output" style="height:120px;"></div>
              </div>
            </div>

            <!-- Right Column: Inspector & Live Preview -->
            <div class="vidr-inspector-panel">
              <div class="vidr-inspector-header">
                <div style="flex:1;overflow:hidden;">
                  <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#60a5fa;font-weight:700;">🔍 Xem trước & Chi tiết video</span>
                  <div id="vidr-inspect-title" class="vidr-inspector-title" style="margin-top:4px;word-break:break-word;">Chưa chọn video</div>
                  <div id="vidr-inspect-topic" style="font-size:11px;color:#93c5fd;margin-top:2px;"></div>
                </div>
                <div id="vidr-inspect-badge"></div>
              </div>

              <div class="vidr-player-wrap" style="aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;min-height:180px;">
                <video id="vidr-batch-preview-video" controls style="width:100%;height:100%;object-fit:contain;"></video>
              </div>

              <div id="vidr-inspect-info" style="font-size:12px;display:flex;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.06);padding-bottom:8px;">
                <span style="color:#94a3b8;">Thời lượng: <strong id="vidr-inspect-duration" style="color:#60a5fa;">00:00:00</strong></span>
                <span style="color:#94a3b8;">Phân đoạn: <strong id="vidr-inspect-clips-count" style="color:#34d399;">0 đoạn</strong></span>
              </div>

              <div style="display:flex;flex-direction:column;gap:6px;">
                <span style="font-size:12px;font-weight:600;color:#e2e8f0;">Danh sách phân đoạn (Bấm để phát thử):</span>
                <div id="vidr-inspect-clips-list" class="vidr-inspector-clips-list">
                  <div style="text-align:center;padding:16px;color:#64748b;font-size:11px;">Chọn một video từ bảng danh sách bên trái để xem chi tiết phân đoạn.</div>
                </div>
              </div>

              <div id="vidr-inspect-actions" style="display:flex;gap:8px;margin-top:auto;">
                <button id="vidr-btn-inspect-run" class="vidr-btn primary" style="flex:1;padding:8px;" type="button">▶ Cắt ghép video này</button>
                <button id="vidr-btn-inspect-push-sub" class="vidr-btn" style="flex:1;padding:8px;background:linear-gradient(135deg,rgba(59,130,246,0.2),rgba(147,51,234,0.2));color:#93c5fd;border:1px solid rgba(59,130,246,0.5);display:none;" type="button">✨ Đẩy sang Xóa Sub</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
    main.appendChild(section);
  }

  // ── CSV & Google Sheets Parser ──────────────────────────────────────────
  function parseCSV(text) {
    if (!text || typeof text !== 'string') return [];
    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(cell);
        cell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(cell);
        if (row.some(c => c && String(c).trim().length > 0)) {
          rows.push(row);
        }
        row = [];
        cell = '';
      } else {
        cell += char;
      }
      i++;
    }
    if (cell.length > 0 || row.length > 0) {
      row.push(cell);
      if (row.some(c => c && String(c).trim().length > 0)) {
        rows.push(row);
      }
    }
    return rows;
  }

  function convertGoogleSheetUrlToCsv(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const url = rawUrl.trim();
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/i);
    if (!match) return url;
    const sheetId = match[1];
    let gid = '0';
    const gidMatch = url.match(/[?&#]gid=([0-9]+)/i);
    if (gidMatch) gid = gidMatch[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
  }

  function parseTimelineScript(text) {
    if (!text || !text.trim()) return [];
    const lines = text.split('\n');
    const clips = [];
    let currentComment = '';

    const ffmpegPattern = /-ss\s+([0-9:.]+)\s+-to\s+([0-9:.]+)/i;
    const outPattern = /(?:copy|mp4)\s+([a-zA-Z0-9_\-]+\.mp4)\s*$/i;
    const arrowRegex = /([0-9:.]+)\s*(?:-->|->|-|đến)\s*([0-9:.]+)/i;

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
        currentComment = trimmed.replace(/^[#\/]+\s*/, '').trim();
        return;
      }

      let start = null;
      let to = null;
      let name = currentComment || `Đoạn ${clips.length + 1}`;

      const ffMatch = trimmed.match(ffmpegPattern);
      if (ffMatch) {
        start = ffMatch[1];
        to = ffMatch[2];
        const outMatch = trimmed.match(outPattern);
        if (outMatch) {
          const outName = outMatch[1].replace(/\.mp4$/i, '');
          name = currentComment ? `${currentComment} (${outName})` : outName;
        }
      } else {
        const arrowMatch = trimmed.match(arrowRegex);
        if (arrowMatch) {
          start = arrowMatch[1];
          to = arrowMatch[2];
        }
      }

      if (start && to) {
        const sSec = parseTimeToSeconds(start);
        const tSec = parseTimeToSeconds(to);
        const dur = Math.max(0, tSec - sSec);
        clips.push({
          id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          name: name || `Đoạn ${clips.length + 1}`,
          start: formatSecondsToTime(sSec),
          to: formatSecondsToTime(tSec),
          durationSec: dur,
        });
        currentComment = '';
      }
    });

    return clips;
  }

  // ── Single Mode Functions ──────────────────────────────────────────────
  function renderClipList() {
    const listEl = document.getElementById('vidr-clip-list');
    const countEl = document.getElementById('vidr-clips-count');
    const totalDurEl = document.getElementById('vidr-total-duration');
    if (!listEl) return;

    if (!state.clips.length) {
      listEl.innerHTML = `
        <div class="vidr-empty">
          <div style="font-size:24px;margin-bottom:8px;">🎬</div>
          <div>Chưa có phân đoạn nào.</div>
          <div style="font-size:11px;margin-top:4px;">Dán kịch bản ở Cột 1 rồi bấm "Phân tích Timeline" hoặc bấm "+ Thêm đoạn".</div>
        </div>`;
      if (countEl) countEl.textContent = '0 đoạn';
      if (totalDurEl) totalDurEl.textContent = '00:00:00';
      return;
    }

    let totalSec = 0;
    listEl.innerHTML = state.clips.map((clip, index) => {
      totalSec += (clip.durationSec || 0);
      return `
        <div class="vidr-clip-item ${clip.id === state.activeClipId ? 'active' : ''}" data-clip-id="${clip.id}" draggable="true">
          <span class="vidr-clip-handle" title="Kéo thả để đổi thứ tự">⋮⋮</span>
          <div class="vidr-clip-info">
            <div class="vidr-clip-name">${index + 1}. ${escapeHtml(clip.name)}</div>
            <div class="vidr-clip-range">${clip.start} ➔ ${clip.to}</div>
          </div>
          <span class="vidr-clip-duration">${(clip.durationSec || 0).toFixed(1)}s</span>
          <div class="vidr-clip-actions">
            <button class="vidr-icon-btn" data-action="preview" data-clip-id="${clip.id}" title="Xem thử đoạn này">▶</button>
            <button class="vidr-icon-btn danger" data-action="delete" data-clip-id="${clip.id}" title="Xóa đoạn này">✕</button>
          </div>
        </div>`;
    }).join('');

    if (countEl) countEl.textContent = `${state.clips.length} đoạn`;
    if (totalDurEl) totalDurEl.textContent = formatSecondsToTime(totalSec);

    listEl.querySelectorAll('[data-action="preview"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        previewClip(btn.dataset.clipId);
      });
    });

    listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteClip(btn.dataset.clipId);
      });
    });

    setupDragAndDrop(listEl);
  }

  function setupDragAndDrop(listEl) {
    let draggedItem = null;
    listEl.querySelectorAll('.vidr-clip-item').forEach(item => {
      item.addEventListener('dragstart', () => {
        draggedItem = item;
        item.style.opacity = '0.5';
      });
      item.addEventListener('dragend', () => {
        item.style.opacity = '1';
        draggedItem = null;
      });
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const rect = item.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) item.classList.add('drag-over-top');
        else item.classList.add('drag-over-bottom');
      });
      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over-top', 'drag-over-bottom');
        if (!draggedItem || draggedItem === item) return;

        const srcId = draggedItem.dataset.clipId;
        const tgtId = item.dataset.clipId;
        const srcIdx = state.clips.findIndex(c => c.id === srcId);
        const tgtIdx = state.clips.findIndex(c => c.id === tgtId);
        if (srcIdx < 0 || tgtIdx < 0) return;

        const [moved] = state.clips.splice(srcIdx, 1);
        state.clips.splice(tgtIdx, 0, moved);
        renderClipList();
        vidrLog('Đã đổi thứ tự phân đoạn.', 'info');
      });
    });
  }

  function previewClip(clipId) {
    const clip = state.clips.find(c => c.id === clipId);
    if (!clip || !state.videoPath) {
      window.showToast?.('Vui lòng chọn video nguồn để xem trước.', 'warning');
      return;
    }

    state.activeClipId = clipId;
    renderClipList();

    const videoEl = document.getElementById('vidr-preview-video');
    if (!videoEl) return;

    const sSec = parseTimeToSeconds(clip.start);
    const tSec = parseTimeToSeconds(clip.to);
    const targetUrl = toMediaUrl(state.videoPath);

    if (videoEl._clipEndHandler) {
      videoEl.removeEventListener('timeupdate', videoEl._clipEndHandler);
      videoEl._clipEndHandler = null;
    }

    const seekAndPlay = () => {
      try {
        videoEl.currentTime = sSec;
        const playPromise = videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn('Preview play catch:', e));
        }
      } catch (e) {
        console.warn('Seek preview error:', e);
      }
    };

    if (videoEl.src !== targetUrl) {
      videoEl.src = targetUrl;
      videoEl.addEventListener('loadedmetadata', seekAndPlay, { once: true });
    } else {
      seekAndPlay();
    }

    videoEl._clipEndHandler = () => {
      if (videoEl.currentTime >= tSec) {
        videoEl.pause();
        videoEl.removeEventListener('timeupdate', videoEl._clipEndHandler);
        videoEl._clipEndHandler = null;
      }
    };
    videoEl.addEventListener('timeupdate', videoEl._clipEndHandler);
    vidrLog(`Đang xem trước ${clip.name} (${clip.start} -> ${clip.to}).`, 'info');
  }

  function deleteClip(clipId) {
    state.clips = state.clips.filter(c => c.id !== clipId);
    if (state.activeClipId === clipId) state.activeClipId = null;
    renderClipList();
    vidrLog('Đã xóa 1 phân đoạn khỏi hàng đợi.', 'info');
  }

  function addClipPrompt() {
    const name = prompt('Nhập tên đoạn:', `Đoạn ${state.clips.length + 1}`);
    if (!name) return;
    const start = prompt('Nhập thời gian bắt đầu (VD: 00:00:05):', '00:00:00');
    if (!start) return;
    const to = prompt('Nhập thời gian kết thúc (VD: 00:00:10):', '00:00:05');
    if (!to) return;

    const sSec = parseTimeToSeconds(start);
    const tSec = parseTimeToSeconds(to);
    state.clips.push({
      id: 'clip_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      start: formatSecondsToTime(sSec),
      to: formatSecondsToTime(tSec),
      durationSec: Math.max(0, tSec - sSec),
    });
    renderClipList();
    vidrLog(`Đã thêm đoạn "${name}".`, 'success');
  }

  async function handleStartRender() {
    if (!state.videoPath) {
      window.showToast?.('Vui lòng chọn video nguồn trước khi render.', 'error');
      vidrLog('Lỗi: Chưa chọn video nguồn.', 'error');
      return;
    }

    if (!state.clips.length) {
      window.showToast?.('Hàng đợi phân đoạn đang rỗng. Vui lòng nạp timeline.', 'warning');
      vidrLog('Lỗi: Danh sách phân đoạn rỗng.', 'warn');
      return;
    }

    const btn = document.getElementById('vidr-btn-start-render');
    const fill = document.getElementById('vidr-progress-fill');
    const statusText = document.getElementById('vidr-progress-status');
    const pctText = document.getElementById('vidr-progress-pct');
    const outputPathInp = document.getElementById('vidr-output-path');
    const modeSelect = document.getElementById('vidr-mode-select');

    const postActions = document.getElementById('vidr-post-render-actions');
    if (postActions) postActions.style.display = 'none';

    state.rendering = true;
    btn.disabled = true;
    btn.textContent = '⏳ Đang cắt & ghép video...';
    if (statusText) statusText.textContent = 'Đang xử lý FFmpeg...';
    if (fill) fill.style.width = '30%';
    if (pctText) pctText.textContent = '30%';

    const mode = modeSelect?.value || 'lossless';
    const outputPath = outputPathInp?.value?.trim() || null;
    const removeVocal = document.getElementById('vidr-remove-vocal')?.checked || false;

    vidrLog(`Bắt đầu xử lý ${state.clips.length} phân đoạn (Chế độ: ${mode}${removeVocal ? ', Xóa giọng nói gốc' : ''})...`, 'info');

    try {
      const res = await window.api.videoRenderCutAndConcat(
        state.videoPath,
        state.clips,
        outputPath,
        mode,
        removeVocal
      );

      if (res && res.status === 'ok') {
        state.lastOutputPath = res.output_path;
        if (fill) fill.style.width = '100%';
        if (pctText) pctText.textContent = '100%';
        if (statusText) statusText.textContent = 'Hoàn tất xuất sắc!';
        if (postActions) postActions.style.display = 'flex';
        vidrLog(`🎉 Cắt và ghép video thành công! File lưu tại: ${res.output_path}`, 'success');
        window.showToast?.('Cắt & Ghép video thành công!', 'success');

        const videoEl = document.getElementById('vidr-preview-video');
        if (videoEl) {
          if (videoEl._clipEndHandler) {
            videoEl.removeEventListener('timeupdate', videoEl._clipEndHandler);
            videoEl._clipEndHandler = null;
          }
          const expectedDuration = state.clips.reduce((sum, clip) => sum + (Number(clip.durationSec) || 0), 0);
          loadVideoPreview(videoEl, res.output_path, {
            cacheKey: Date.now(),
            forceReload: true,
            autoplay: true,
            onMetadata: (actualDuration) => {
              if (!Number.isFinite(actualDuration)) return;
              const delta = Math.abs(actualDuration - expectedDuration);
              const message = `Preview mới: ${actualDuration.toFixed(2)}s · Timeline dự kiến: ${expectedDuration.toFixed(2)}s`;
              vidrLog(message, delta > 0.75 ? 'warn' : 'success');
            },
          });
        }
      } else {
        throw new Error(res?.error || 'Không rõ nguyên nhân lỗi từ FFmpeg.');
      }
    } catch (err) {
      if (fill) fill.style.width = '0%';
      if (pctText) pctText.textContent = '0%';
      if (statusText) statusText.textContent = 'Lỗi xử lý';
      vidrLog(`Lỗi cắt ghép video: ${err.message}`, 'error');
      window.showToast?.(`Lỗi: ${err.message}`, 'error');
    } finally {
      state.rendering = false;
      btn.disabled = false;
      btn.textContent = '🚀 BẮT ĐẦU CẮT & GHÉP VIDEO';
    }
  }

  // ── Batch Mode Logic ──────────────────────────────────────────────────
  async function fetchGoogleSheetData() {
    const input = document.getElementById('vidr-sheet-url');
    const rawUrl = input?.value?.trim();
    if (!rawUrl) {
      window.showToast?.('Vui lòng nhập đường link Google Sheets.', 'warning');
      return;
    }

    const csvUrl = convertGoogleSheetUrlToCsv(rawUrl);
    vidrLog(`Đang kết nối và quét dữ liệu Google Sheet: ${csvUrl}...`, 'info');
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
      let scriptIdx = headers.findIndex(h => /lệnh cắt|lệnh cắt ffmpeg|ffmpeg|kịch bản cắt|timeline|script/i.test(h));
      let vocalIdx = headers.findIndex(h => /vocal|voice|giọng|bgm|tách nhạc/i.test(h));

      if (nameIdx < 0) nameIdx = 1; // Fallback to col 1 ("Tên Video Gốc")
      if (scriptIdx < 0) scriptIdx = headers.findIndex(h => /lệnh|cắt|ffmpeg|script|timeline/i.test(h));
      if (scriptIdx < 0) scriptIdx = 5; // Fallback to col 5 ("Lệnh Cắt FFmpeg")

      const jobs = [];
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        const rawName = String(row[nameIdx] || '').trim();
        const topic = topicIdx >= 0 ? String(row[topicIdx] || '').trim() : '';
        const script = String(row[scriptIdx] || '').trim();
        const vocalVal = vocalIdx >= 0 ? String(row[vocalIdx] || '').trim().toLowerCase() : '';
        const removeVocal = ['1', 'true', 'yes', 'có', 'x'].includes(vocalVal);

        if (!rawName && !script) continue;

        const clips = parseTimelineScript(script);
        let totalSec = 0;
        clips.forEach(c => totalSec += (c.durationSec || 0));

        jobs.push({
          id: 'bjob_' + Date.now() + '_' + r + '_' + Math.random().toString(36).slice(2, 6),
          rawName: rawName || `Video_${r}`,
          topic: topic,
          matchedPath: '',
          script: script,
          clips: clips,
          durationSec: totalSec,
          removeVocal: removeVocal,
          status: 'waiting',
          progress: 0,
          outputPath: '',
          previewVersion: 0,
          actualDuration: null,
          errorMsg: '',
          selected: true
        });
      }

      state.batchJobs = jobs;
      matchBatchJobs();
      renderBatchTable();
      vidrLog(`🎉 Đã quét thành công ${jobs.length} kịch bản video từ Google Sheet!`, 'success');
      window.showToast?.(`Đã nạp ${jobs.length} video từ Google Sheet!`, 'success');
    } catch (e) {
      vidrLog(`Lỗi quét Google Sheet: ${e.message}`, 'error');
      window.showToast?.(`Lỗi quét Sheet: ${e.message}`, 'error');
    }
  }

  async function pickBatchFolder() {
    try {
      if (window.electronAPI?.openDirectory) {
        const res = await window.electronAPI.openDirectory();
        const folderPath = !res?.canceled && res?.filePaths?.[0];
        if (folderPath) {
          state.batchFolder = folderPath;
          const input = document.getElementById('vidr-batch-folder-path');
          if (input) input.value = folderPath;

          vidrLog(`Đang quét video trong thư mục: ${folderPath}...`, 'info');
          if (window.electronAPI?.scanVideoFiles) {
            const scanRes = await window.electronAPI.scanVideoFiles(folderPath);
            if (scanRes && scanRes.ok) {
              state.batchScannedFiles = scanRes.files || [];
              vidrLog(`Đã quét thấy ${state.batchScannedFiles.length} file video trên ổ đĩa.`, 'info');
            }
          }
          matchBatchJobs();
          renderBatchTable();
        }
      }
    } catch (e) {
      vidrLog(`Lỗi chọn thư mục: ${e.message}`, 'error');
    }
  }

  async function pickBatchOutputFolder() {
    try {
      if (window.electronAPI?.openDirectory) {
        const res = await window.electronAPI.openDirectory();
        const folderPath = !res?.canceled && res?.filePaths?.[0];
        if (folderPath) {
          state.batchOutputFolder = folderPath;
          const input = document.getElementById('vidr-batch-output-folder-path');
          if (input) input.value = folderPath;
          vidrLog(`Đã chọn thư mục lưu video đầu ra: ${folderPath}`, 'info');
        }
      }
    } catch (e) {
      vidrLog(`Lỗi chọn thư mục đầu ra: ${e.message}`, 'error');
    }
  }

  function openBatchOutputFolder() {
    const targetFolder = state.batchOutputFolder || state.batchFolder;
    if (targetFolder) {
      window.electronAPI?.openPath?.(targetFolder);
    } else {
      window.showToast?.('Chưa chọn thư mục đầu ra hoặc thư mục nguồn nào.', 'warning');
    }
  }

  function normalizeName(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/\\/g, '/')
      .split('/').pop()
      .replace(/\.[^.]+$/, '')
      .replace(/#[a-zA-Z0-9_\u00C0-\u1EF9]+/g, '') // remove hashtags
      .replace(/[^a-zA-Z0-9\u00C0-\u1EF9]/g, '');  // alphanumeric only
  }

  function matchBatchJobs() {
    if (!state.batchJobs.length) return;
    const scanned = state.batchScannedFiles || [];

    state.batchJobs.forEach(job => {
      const normRaw = normalizeName(job.rawName);
      const cleanRawFull = job.rawName.toLowerCase().replace(/\\/g, '/').split('/').pop();
      const cleanRawBase = cleanRawFull.replace(/\.[^.]+$/, '');

      // 1. Exact match filename or basename
      let match = scanned.find(f => {
        const fBase = f.baseName.toLowerCase();
        const fName = f.name.toLowerCase();
        return fName === cleanRawFull || fBase === cleanRawBase;
      });

      // 2. Normalized alphanumeric match
      if (!match && normRaw.length >= 4) {
        match = scanned.find(f => {
          const fNorm = normalizeName(f.baseName);
          return fNorm === normRaw || fNorm.includes(normRaw) || normRaw.includes(fNorm);
        });
      }

      if (match) {
        job.matchedPath = match.path;
        if (job.status === 'missing') job.status = 'waiting';
      } else if (!job.matchedPath) {
        job.status = 'missing';
      }
    });
    updateBatchCounters();
  }

  function updateBatchCounters() {
    const pill = document.getElementById('vidr-batch-count-pill');
    const summary = document.getElementById('vidr-batch-summary');
    const pushSubBtn = document.getElementById('vidr-btn-batch-push-sub');

    const total = state.batchJobs.length;
    const ready = state.batchJobs.filter(j => j.status === 'waiting' && j.matchedPath).length;
    const done = state.batchJobs.filter(j => j.status === 'done').length;
    const err = state.batchJobs.filter(j => j.status === 'error').length;
    const missing = state.batchJobs.filter(j => j.status === 'missing').length;
    const selectedDone = state.batchJobs.filter(j => j.selected && j.status === 'done' && j.outputPath).length;

    if (pill) {
      pill.style.display = total > 0 ? 'inline-block' : 'none';
      pill.textContent = total;
    }
    if (summary) {
      summary.className = `vidr-badge ${err > 0 ? 'error' : done === total && total > 0 ? 'done' : 'waiting'}`;
      summary.textContent = `${total} video · ${ready} sẵn sàng · ${done} hoàn tất${err > 0 ? ` · ${err} lỗi` : ''}${missing > 0 ? ` · ${missing} thiếu file` : ''}`;
    }
    if (pushSubBtn) {
      if (selectedDone > 0) {
        pushSubBtn.textContent = `✨ ĐẨY ${selectedDone} VIDEO ĐÃ CHỌN SANG XÓA SUB ➔`;
        pushSubBtn.style.opacity = '1';
        pushSubBtn.title = `Chuyển ${selectedDone} video đã chọn và hoàn tất sang tab Xóa Sub`;
      } else {
        pushSubBtn.textContent = '✨ ĐẨY VIDEO ĐÃ CHỌN SANG XÓA SUB ➔';
        pushSubBtn.style.opacity = '0.7';
        pushSubBtn.title = 'Tích chọn các video đã hoàn tất để chuyển sang tab Xóa Sub';
      }
    }
  }

  function selectBatchJob(jobId) {
    state.batchSelectedJobId = jobId;
    renderBatchTable();
    renderBatchInspector();
  }

  function renderBatchInspector() {
    const titleEl = document.getElementById('vidr-inspect-title');
    const topicEl = document.getElementById('vidr-inspect-topic');
    const badgeEl = document.getElementById('vidr-inspect-badge');
    const durEl = document.getElementById('vidr-inspect-duration');
    const countEl = document.getElementById('vidr-inspect-clips-count');
    const clipsListEl = document.getElementById('vidr-inspect-clips-list');
    const videoEl = document.getElementById('vidr-batch-preview-video');
    const runBtn = document.getElementById('vidr-btn-inspect-run');
    const pushBtn = document.getElementById('vidr-btn-inspect-push-sub');

    const job = state.batchJobs.find(j => j.id === state.batchSelectedJobId);
    if (!job) {
      if (titleEl) titleEl.textContent = 'Chưa chọn video';
      if (topicEl) topicEl.textContent = '';
      if (badgeEl) badgeEl.innerHTML = '';
      if (durEl) durEl.textContent = '00:00:00';
      if (countEl) countEl.textContent = '0 đoạn';
      if (clipsListEl) clipsListEl.innerHTML = '<div style="text-align:center;padding:16px;color:#64748b;font-size:11px;">Chọn một video từ bảng danh sách bên trái để xem chi tiết phân đoạn.</div>';
      if (videoEl) {
        videoEl.pause();
        videoEl.removeAttribute('src');
      }
      if (runBtn) runBtn.disabled = true;
      if (pushBtn) pushBtn.style.display = 'none';
      return;
    }

    if (titleEl) titleEl.textContent = job.rawName;
    if (topicEl) topicEl.textContent = job.topic ? `📌 ${job.topic}` : '';

    let badgeHtml = '';
    if (job.status === 'waiting') badgeHtml = `<span class="vidr-badge waiting">⏳ Chờ xử lý</span>`;
    else if (job.status === 'processing') badgeHtml = `<span class="vidr-badge processing">⚙ Đang cắt ghép (${job.progress}%)</span>`;
    else if (job.status === 'done') badgeHtml = `<span class="vidr-badge done">✅ Đã hoàn tất</span>`;
    else if (job.status === 'error') badgeHtml = `<span class="vidr-badge error" title="${escapeHtml(job.errorMsg)}">❌ Lỗi</span>`;
    else if (job.status === 'missing') badgeHtml = `<span class="vidr-badge missing">⚠ Thiếu file gốc</span>`;
    if (badgeEl) badgeEl.innerHTML = badgeHtml;

    const inspectorDuration = job.outputPath && Number.isFinite(job.actualDuration)
      ? job.actualDuration
      : job.durationSec;
    if (durEl) durEl.textContent = formatSecondsToTime(inspectorDuration);
    if (countEl) countEl.textContent = `${job.clips.length} đoạn`;

    // Load Preview Video Player
    const targetVideoPath = job.outputPath || job.matchedPath || '';
    if (videoEl) {
      if (videoEl._batchClipEndHandler) {
        videoEl.removeEventListener('timeupdate', videoEl._batchClipEndHandler);
        videoEl._batchClipEndHandler = null;
      }
      if (targetVideoPath) {
        loadVideoPreview(videoEl, targetVideoPath, {
          cacheKey: job.outputPath ? job.previewVersion : '',
          onMetadata: (actualDuration) => {
            if (!job.outputPath || !Number.isFinite(actualDuration)) return;
            job.actualDuration = actualDuration;
            if (durEl) durEl.textContent = formatSecondsToTime(actualDuration);
          },
        });
      } else {
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.removeAttribute('data-vidr-media-key');
        videoEl.load();
      }
    }

    // Render Clips List with 1-click preview seek
    if (clipsListEl) {
      if (!job.clips.length) {
        clipsListEl.innerHTML = '<div style="text-align:center;padding:16px;color:#64748b;font-size:11px;">Không có phân đoạn cắt trong kịch bản.</div>';
      } else {
        clipsListEl.innerHTML = job.clips.map((clip, index) => {
          return `
            <div class="vidr-inspector-clip-item" data-clip-index="${index}" title="Bấm để phát thử phân đoạn này">
              <span style="font-weight:600;color:#fff;">▶ ${index + 1}. ${escapeHtml(clip.name)}</span>
              <span style="color:#60a5fa;font-family:monospace;font-size:11px;">${clip.start} ➔ ${clip.to} (${(clip.durationSec || 0).toFixed(1)}s)</span>
            </div>`;
        }).join('');

        clipsListEl.querySelectorAll('.vidr-inspector-clip-item').forEach(item => {
          item.addEventListener('click', () => {
            const idx = parseInt(item.dataset.clipIndex, 10);
            const clip = job.clips[idx];
            if (!clip || !videoEl || !videoEl.src) {
              window.showToast?.('Chưa tìm thấy file video nguồn để phát thử.', 'warning');
              return;
            }

            clipsListEl.querySelectorAll('.vidr-inspector-clip-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const sSec = parseTimeToSeconds(clip.start);
            const tSec = parseTimeToSeconds(clip.to);

            if (videoEl._batchClipEndHandler) {
              videoEl.removeEventListener('timeupdate', videoEl._batchClipEndHandler);
            }

            try {
              videoEl.currentTime = sSec;
              videoEl.play().catch(e => console.warn('Preview play catch:', e));
            } catch (e) {
              console.warn('Seek error:', e);
            }

            videoEl._batchClipEndHandler = () => {
              if (videoEl.currentTime >= tSec) {
                videoEl.pause();
                videoEl.removeEventListener('timeupdate', videoEl._batchClipEndHandler);
                videoEl._batchClipEndHandler = null;
              }
            };
            videoEl.addEventListener('timeupdate', videoEl._batchClipEndHandler);
            vidrLog(`[Preview] Đang phát thử: ${clip.name} (${clip.start} ➔ ${clip.to}) của "${job.rawName}"`, 'info');
          });
        });
      }
    }

    if (runBtn) {
      runBtn.disabled = !job.matchedPath || job.status === 'processing';
      runBtn.onclick = () => runSingleBatchJob(job);
    }

    if (pushBtn) {
      pushBtn.style.display = job.status === 'done' && job.outputPath ? 'inline-block' : 'none';
      pushBtn.onclick = () => {
        if (window.standaloneSubtitleRemover?.enterAndAdd) {
          window.standaloneSubtitleRemover.enterAndAdd(job.outputPath);
          vidrLog(`✨ Đã chuyển "${job.rawName}" sang tab Xóa Sub!`, 'success');
          window.showToast?.(`Đã thêm "${job.rawName}" vào Xóa Sub!`, 'success');
        }
      };
    }
  }

  function renderBatchTable() {
    const tbody = document.getElementById('vidr-batch-tbody');
    if (!tbody) return;

    if (!state.batchJobs.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:40px 10px;color:#64748b;">
            Chưa có dữ liệu. Hãy dán link Google Sheet ở trên và bấm "Quét Sheet", sau đó chọn thư mục chứa video gốc.
          </td>
        </tr>`;
      updateBatchCounters();
      renderBatchInspector();
      return;
    }

    if (!state.batchSelectedJobId && state.batchJobs.length > 0) {
      state.batchSelectedJobId = state.batchJobs[0].id;
    }

    tbody.innerHTML = state.batchJobs.map((job, idx) => {
      let badgeHtml = '';
      if (job.status === 'waiting') badgeHtml = `<span class="vidr-badge waiting">⏳ Chờ xử lý</span>`;
      else if (job.status === 'processing') badgeHtml = `<span class="vidr-badge processing">⚙ Đang cắt ghép (${job.progress}%)</span>`;
      else if (job.status === 'done') badgeHtml = `<span class="vidr-badge done">✅ Hoàn tất</span>`;
      else if (job.status === 'error') badgeHtml = `<span class="vidr-badge error" title="${escapeHtml(job.errorMsg)}">❌ Lỗi</span>`;
      else if (job.status === 'missing') badgeHtml = `<span class="vidr-badge missing" title="Không tìm thấy file video này trong thư mục nguồn đã chọn">⚠ Thiếu file</span>`;

      const pathDisplay = job.matchedPath
        ? `<span style="color:#34d399;font-family:monospace;font-size:11px;" title="${escapeHtml(job.matchedPath)}">${escapeHtml(job.matchedPath.split(/[\\/]/).pop())}</span>`
        : `<span style="color:#f87171;font-size:11px;">(Chưa tìm thấy video)</span>`;

      const isSelected = job.id === state.batchSelectedJobId;
      return `
        <tr class="${state.batchCurrentIdx === idx ? 'active' : ''} ${isSelected ? 'selected' : ''}" data-job-id="${job.id}">
          <td style="text-align:center;">
            <input type="checkbox" class="vidr-batch-chk" data-job-id="${job.id}" ${job.selected ? 'checked' : ''}>
          </td>
          <td style="text-align:center;color:#94a3b8;">${idx + 1}</td>
          <td>
            <div style="font-weight:600;color:#fff;word-break:break-word;">${escapeHtml(job.rawName)}</div>
            ${job.topic ? `<div style="font-size:11px;color:#93c5fd;margin-top:2px;">📌 ${escapeHtml(job.topic)}</div>` : ''}
          </td>
          <td>${pathDisplay}</td>
          <td style="text-align:center;">${job.clips.length} đoạn</td>
          <td>${formatSecondsToTime(job.durationSec)}</td>
          <td>${badgeHtml}</td>
          <td style="text-align:center;">
            <div style="display:flex;gap:4px;justify-content:center;">
              <button class="vidr-icon-btn" data-batch-action="preview-job" data-job-id="${job.id}" title="Xem trước video và phân đoạn">🔍</button>
              <button class="vidr-icon-btn" data-batch-action="run-single" data-job-id="${job.id}" title="Chạy riêng job này">▶</button>
              ${job.status === 'done' ? `<button class="vidr-icon-btn" data-batch-action="push-single" data-job-id="${job.id}" title="Đẩy video này sang Xóa Sub">✨</button>` : ''}
              <button class="vidr-icon-btn danger" data-batch-action="delete-job" data-job-id="${job.id}" title="Xóa khỏi hàng đợi">✕</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('input, button')) return;
        selectBatchJob(tr.dataset.jobId);
      });
    });

    tbody.querySelectorAll('.vidr-batch-chk').forEach(chk => {
      chk.addEventListener('change', () => {
        const j = state.batchJobs.find(x => x.id === chk.dataset.jobId);
        if (j) j.selected = chk.checked;
        updateBatchCounters();
      });
    });

    tbody.querySelectorAll('[data-batch-action="preview-job"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectBatchJob(btn.dataset.jobId);
      });
    });

    tbody.querySelectorAll('[data-batch-action="run-single"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const j = state.batchJobs.find(x => x.id === btn.dataset.jobId);
        if (j) runSingleBatchJob(j);
      });
    });

    tbody.querySelectorAll('[data-batch-action="push-single"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const j = state.batchJobs.find(x => x.id === btn.dataset.jobId);
        if (j && j.outputPath) {
          if (window.standaloneSubtitleRemover?.enterAndAdd) {
            window.standaloneSubtitleRemover.enterAndAdd(j.outputPath);
            window.showToast?.(`Đã thêm "${j.rawName}" vào Xóa Sub!`, 'success');
          }
        }
      });
    });

    tbody.querySelectorAll('[data-batch-action="delete-job"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.batchJobs = state.batchJobs.filter(x => x.id !== btn.dataset.jobId);
        if (state.batchSelectedJobId === btn.dataset.jobId) {
          state.batchSelectedJobId = state.batchJobs[0]?.id || null;
        }
        renderBatchTable();
        renderBatchInspector();
      });
    });

    updateBatchCounters();
    renderBatchInspector();
  }

  async function runSingleBatchJob(job) {
    if (!job.matchedPath) {
      window.showToast?.(`Không tìm thấy file video cho "${job.rawName}". Vui lòng chọn thư mục chứa video.`, 'warning');
      return;
    }
    if (!job.clips.length) {
      window.showToast?.(`Kịch bản cắt của "${job.rawName}" không hợp lệ hoặc rỗng.`, 'warning');
      return;
    }

    job.status = 'processing';
    job.progress = 30;
    renderBatchTable();
    renderBatchInspector();

    const mode = document.getElementById('vidr-batch-mode-select')?.value || 'lossless';
    const globalRemoveVocal = document.getElementById('vidr-batch-remove-vocal')?.checked || false;
    const removeVocal = job.removeVocal || globalRemoveVocal;

    vidrLog(`[Batch] Bắt đầu cắt ghép: ${job.rawName} (${job.clips.length} đoạn, mode: ${mode}, xóa vocal: ${removeVocal})...`, 'info');

    let targetOutputPath = null;
    if (state.batchOutputFolder && state.batchOutputFolder.trim()) {
      const sep = state.batchOutputFolder.includes('/') ? '/' : '\\';
      const cleanFolder = state.batchOutputFolder.replace(/[\\/]+$/, '');
      const inputBaseName = job.matchedPath.split(/[\\/]/).pop().replace(/\.[^.]+$/, '');
      targetOutputPath = `${cleanFolder}${sep}${inputBaseName}_remix.mp4`;
    }

    try {
      const res = await window.api.videoRenderCutAndConcat(
        job.matchedPath,
        job.clips,
        targetOutputPath,
        mode,
        removeVocal
      );

      if (res && res.status === 'ok') {
        job.status = 'done';
        job.progress = 100;
        job.outputPath = res.output_path;
        job.previewVersion = Date.now();
        job.actualDuration = null;
        vidrLog(`[Batch] ✅ Cắt ghép thành công: ${job.rawName} ➔ ${res.output_path}`, 'success');
      } else {
        throw new Error(res?.error || 'Lỗi xử lý FFmpeg');
      }
    } catch (e) {
      job.status = 'error';
      job.errorMsg = e.message;
      vidrLog(`[Batch] ❌ Lỗi xử lý ${job.rawName}: ${e.message}`, 'error');
    } finally {
      renderBatchTable();
      renderBatchInspector();
    }
  }

  async function startBatchExecution() {
    if (state.batchRunning) return;
    const jobsToRun = state.batchJobs.filter(j => j.selected && (j.status === 'waiting' || j.status === 'error') && j.matchedPath);
    if (!jobsToRun.length) {
      window.showToast?.('Không có job nào sẵn sàng để chạy. Vui lòng kiểm tra file nguồn và danh sách.', 'warning');
      return;
    }

    state.batchRunning = true;
    state.batchStopping = false;

    const runBtn = document.getElementById('vidr-btn-batch-run');
    const stopBtn = document.getElementById('vidr-btn-batch-stop');
    if (runBtn) runBtn.style.display = 'none';
    if (stopBtn) stopBtn.style.display = 'inline-block';

    vidrLog(`[Batch Queue] Bắt đầu chạy hàng loạt ${jobsToRun.length} video...`, 'info');
    window.showToast?.(`Bắt đầu xử lý ${jobsToRun.length} video hàng loạt!`, 'info');

    for (let i = 0; i < state.batchJobs.length; i++) {
      if (state.batchStopping) {
        vidrLog('[Batch Queue] Đã dừng hàng loạt theo yêu cầu.', 'warn');
        window.showToast?.('Đã dừng tiến trình hàng loạt.', 'warning');
        break;
      }

      const job = state.batchJobs[i];
      if (!job.selected || (job.status !== 'waiting' && job.status !== 'error') || !job.matchedPath) {
        continue;
      }

      state.batchCurrentIdx = i;
      await runSingleBatchJob(job);
    }

    state.batchRunning = false;
    state.batchStopping = false;
    state.batchCurrentIdx = -1;

    if (runBtn) runBtn.style.display = 'inline-block';
    if (stopBtn) stopBtn.style.display = 'none';

    renderBatchTable();
    vidrLog('[Batch Queue] Hoàn tất toàn bộ chuỗi video hàng loạt!', 'success');
    window.showToast?.('Đã hoàn tất xử lý hàng loạt!', 'success');
  }

  function stopBatchExecution() {
    state.batchStopping = true;
    const stopBtn = document.getElementById('vidr-btn-batch-stop');
    if (stopBtn) stopBtn.textContent = '⏳ Đang dừng sau job hiện tại...';
  }

  function pushAllBatchToSubtitleRemover() {
    const selectedFinished = state.batchJobs.filter(j => j.selected && j.status === 'done' && j.outputPath);
    if (!selectedFinished.length) {
      const anyFinished = state.batchJobs.some(j => j.status === 'done' && j.outputPath);
      if (anyFinished) {
        window.showToast?.('Vui lòng tích chọn ít nhất 1 video đã hoàn tất trong bảng để chuyển sang Xóa Sub.', 'warning');
      } else {
        window.showToast?.('Chưa có video nào hoàn thành để chuyển sang Xóa Sub.', 'warning');
      }
      return;
    }

    const paths = selectedFinished.map(j => j.outputPath);
    if (window.standaloneSubtitleRemover?.enterAndAdd) {
      window.standaloneSubtitleRemover.enterAndAdd(paths);
      vidrLog(`✨ Đã chuyển ${paths.length} video đã chọn sang tab Xóa Sub!`, 'success');
      window.showToast?.(`Đã thêm ${paths.length} video đã chọn vào Xóa Sub!`, 'success');
    } else {
      window.showToast?.('Tab Xóa Sub chưa sẵn sàng.', 'error');
    }
  }

  function switchMode(mode) {
    state.activeMode = mode;
    const singleTab = document.getElementById('vidr-tab-single');
    const batchTab = document.getElementById('vidr-tab-batch');
    const singleView = document.getElementById('vidr-single-view');
    const batchView = document.getElementById('vidr-batch-view');

    if (mode === 'batch') {
      singleTab?.classList.remove('active');
      batchTab?.classList.add('active');
      if (singleView) singleView.style.display = 'none';
      if (batchView) batchView.style.display = 'flex';
      renderBatchTable();
    } else {
      batchTab?.classList.remove('active');
      singleTab?.classList.add('active');
      if (batchView) batchView.style.display = 'none';
      if (singleView) singleView.style.display = 'grid';
    }
  }

  function bindEvents() {
    // Nav activation
    const navItem = document.getElementById(NAV_ID);
    navItem?.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      navItem.classList.add('active');
      document.getElementById(PAGE_ID)?.classList.add('active');
    });

    document.querySelectorAll(`.nav-item:not(#${NAV_ID})`).forEach((item) => {
      item.addEventListener('click', () => {
        document.getElementById(PAGE_ID)?.classList.remove('active');
      });
    });

    // Mode Switcher
    document.getElementById('vidr-tab-single')?.addEventListener('click', () => switchMode('single'));
    document.getElementById('vidr-tab-batch')?.addEventListener('click', () => switchMode('batch'));

    // File choose & Drag-and-drop
    const applySelectedVideo = (path) => {
      if (!path) return;
      state.videoPath = path;
      const input = document.getElementById('vidr-video-path');
      if (input) input.value = path;
      const videoEl = document.getElementById('vidr-preview-video');
      if (videoEl) {
        if (videoEl._clipEndHandler) {
          videoEl.removeEventListener('timeupdate', videoEl._clipEndHandler);
          videoEl._clipEndHandler = null;
        }
        videoEl.src = toMediaUrl(path);
        videoEl.load();
      }
      vidrLog(`Đã chọn video: ${path}`, 'info');
      window.showToast?.(`Đã tải video: ${path.split(/[\\/]/).pop()}`, 'success');
    };

    const chooseVideo = async () => {
      try {
        if (window.electronAPI?.openFile) {
          const result = await window.electronAPI.openFile([
            { name: 'Video Files', extensions: ['mp4', 'mkv', 'mov', 'avi', 'ts', 'webm', 'flv', 'wmv', 'm4v'] }
          ]);
          const path = !result?.canceled && result?.filePaths?.[0];
          if (path) {
            applySelectedVideo(path);
            return;
          }
        }
      } catch (e) {
        console.warn('Dialog error:', e);
        vidrLog(`Lỗi chọn video: ${e.message}`, 'error');
      }
    };

    document.getElementById('vidr-btn-pick-video')?.addEventListener('click', chooseVideo);
    document.getElementById('vidr-btn-browse-file')?.addEventListener('click', chooseVideo);

    // Support Drag and Drop video file directly onto page
    const pageEl = document.getElementById(PAGE_ID);
    if (pageEl) {
      pageEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      pageEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (file) {
          const path = window.electronAPI?.getPathForFile?.(file) || file.path || file.name;
          if (path && /\.(mp4|mkv|mov|avi|ts|webm|flv|wmv|m4v)$/i.test(path)) {
            applySelectedVideo(path);
          } else {
            window.showToast?.('Vui lòng kéo thả file định dạng video (.mp4, .mkv, .mov...).', 'warning');
          }
        }
      });
    }

    // Parse button
    document.getElementById('vidr-btn-parse')?.addEventListener('click', () => {
      const text = document.getElementById('vidr-script-input')?.value;
      const parsed = parseTimelineScript(text);
      if (!parsed.length) {
        window.showToast?.('Không tìm thấy lệnh hoặc mốc thời gian hợp lệ.', 'warning');
        vidrLog('Không tìm thấy phân đoạn hợp lệ trong kịch bản.', 'warn');
        return;
      }
      state.clips = parsed;
      renderClipList();
      vidrLog(`Đã phân tích thành công ${parsed.length} phân đoạn từ kịch bản!`, 'success');
      window.showToast?.(`Đã tìm thấy ${parsed.length} phân đoạn!`, 'success');
    });

    // Sample script
    document.getElementById('vidr-btn-load-sample')?.addEventListener('click', () => {
      const sample = `# Đoạn 1
ffmpeg -ss 00:00:03 -to 00:00:05 -i input.mp4 -c copy clip1.mp4

# Đoạn 2
ffmpeg -ss 00:00:00 -to 00:00:02 -i input.mp4 -c copy clip2.mp4

# Đoạn 3
ffmpeg -ss 00:00:04 -to 00:00:06 -i input.mp4 -c copy clip3.mp4

# Đoạn 4 (Phần 1)
ffmpeg -ss 00:00:07 -to 00:00:10 -i input.mp4 -c copy clip4_1.mp4

# Đoạn 4 (Phần 2)
ffmpeg -ss 00:00:14 -to 00:00:18 -i input.mp4 -c copy clip4_2.mp4

# Đoạn 5
ffmpeg -ss 00:00:21 -to 00:00:25 -i input.mp4 -c copy clip5.mp4

# Đoạn 6
ffmpeg -ss 00:00:26 -to 00:00:29 -i input.mp4 -c copy clip6.mp4`;
      const textarea = document.getElementById('vidr-script-input');
      if (textarea) textarea.value = sample;
      vidrLog('Đã nạp kịch bản mẫu.', 'info');
    });

    document.getElementById('vidr-btn-add-clip')?.addEventListener('click', addClipPrompt);
    document.getElementById('vidr-btn-clear-clips')?.addEventListener('click', () => {
      state.clips = [];
      renderClipList();
      vidrLog('Đã xóa toàn bộ phân đoạn.', 'info');
    });

    document.getElementById('vidr-btn-start-render')?.addEventListener('click', handleStartRender);

    document.getElementById('vidr-btn-push-to-sub')?.addEventListener('click', () => {
      if (!state.lastOutputPath) {
        window.showToast?.('Chưa có video kết quả để chuyển sang Xóa Sub.', 'warning');
        return;
      }
      if (window.standaloneSubtitleRemover?.enterAndAdd) {
        window.standaloneSubtitleRemover.enterAndAdd(state.lastOutputPath);
        vidrLog(`✨ Đã chuyển video "${state.lastOutputPath}" sang tab Xóa Sub để tạo Job.`, 'success');
        window.showToast?.('Đã thêm video vào Xóa Sub!', 'success');
      } else {
        window.showToast?.('Tab Xóa Sub chưa sẵn sàng.', 'warning');
      }
    });

    // ── Batch Mode Event Listeners ────────────────────────────────────────
    document.getElementById('vidr-btn-scan-sheet')?.addEventListener('click', fetchGoogleSheetData);
    document.getElementById('vidr-btn-pick-folder')?.addEventListener('click', pickBatchFolder);
    document.getElementById('vidr-btn-pick-output-folder')?.addEventListener('click', pickBatchOutputFolder);
    document.getElementById('vidr-btn-batch-run')?.addEventListener('click', startBatchExecution);
    document.getElementById('vidr-btn-batch-stop')?.addEventListener('click', stopBatchExecution);
    document.getElementById('vidr-btn-batch-open-output-folder')?.addEventListener('click', openBatchOutputFolder);
    document.getElementById('vidr-btn-batch-retry-failed')?.addEventListener('click', () => {
      state.batchJobs.forEach(j => {
        if (j.status === 'error') {
          j.status = 'waiting';
          j.errorMsg = '';
        }
      });
      renderBatchTable();
      startBatchExecution();
    });
    document.getElementById('vidr-btn-batch-clear')?.addEventListener('click', () => {
      state.batchJobs = [];
      renderBatchTable();
      vidrLog('Đã xóa danh sách hàng loạt.', 'info');
    });
    document.getElementById('vidr-btn-batch-push-sub')?.addEventListener('click', pushAllBatchToSubtitleRemover);

    document.getElementById('vidr-batch-select-all')?.addEventListener('change', (e) => {
      const checked = e.target.checked;
      state.batchJobs.forEach(j => j.selected = checked);
      renderBatchTable();
    });
  }

  function init() {
    ensureStyle();
    mountNav();
    mountPage();
    bindEvents();
    renderClipList();
    renderBatchTable();
    vidrLog('Tab Video Render đã sẵn sàng hoạt động (Hỗ trợ Single & Batch Google Sheets).', 'info');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
