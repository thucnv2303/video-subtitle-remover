(function () {
  'use strict';

  const NAV_ID = 'nav-ai-auto-remix';
  const PAGE_ID = 'page-ai-auto-remix';
  const STYLE_ATTR = 'data-ai-auto-remix-style';

  const state = {
    queue: [], // [{ id, path, name, status: 'idle'|'processing'|'done'|'error', faceStats: null, remixClips: [], voiceScript: '', outputPath: '', error: '' }]
    activeId: null,
    runningBatch: false,
    logs: [],
    settings: {
      provider: 'ollama',
      model: 'qwen2.5',
      filterFaces: true,
      ttsVoice: 'default',
      removeVocal: true,
      mode: 'lossless'
    }
  };

  function ensureStyle() {
    if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/ai-auto-remix.css';
    link.setAttribute(STYLE_ATTR, 'true');
    document.head.appendChild(link);
  }

  function toMediaUrl(path) {
    const raw = String(path || '').trim();
    if (!raw) return '';
    if (/^(file|blob|https?):/i.test(raw)) return raw;
    const n = raw.replace(/\\/g, '/');
    const formatted = n.startsWith('/') ? `file://${n}` : `file:///${n}`;
    return encodeURI(formatted).replace(/#/g, '%23').replace(/\?/g, '%3F');
  }

  function escapeHtml(val) {
    return String(val ?? '').replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function log(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    state.logs.unshift({ time, message: msg, type });
    if (state.logs.length > 200) state.logs.pop();
    renderLogs();
  }

  function renderLogs() {
    const el = document.getElementById('remix-log-output');
    if (!el) return;
    el.innerHTML = state.logs.map(l => {
      const color = l.type === 'error' ? '#f87171' : l.type === 'warn' ? '#fbbf24' : l.type === 'success' ? '#34d399' : '#94a3b8';
      return `<div style="color:${color};margin-bottom:2px;"><span style="color:#64748b;">[${l.time}]</span> ${escapeHtml(l.message)}</div>`;
    }).join('');
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

  function getActiveItem() {
    return state.queue.find(item => item.id === state.activeId) || state.queue[0] || null;
  }

  function getResolvedAiConfig() {
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

    return {
      provider,
      model: model || (provider === 'ollama' ? (apiKeys[0] || 'qwen2.5') : ''),
      api_keys: apiKeys,
      endpoint
    };
  }

  function mountNav() {
    const sidebarNav = document.querySelector('.sidebar-nav') || document.querySelector('nav');
    if (!sidebarNav || document.getElementById(NAV_ID)) return;

    const navItem = document.createElement('a');
    navItem.href = '#';
    navItem.className = 'nav-item';
    navItem.id = NAV_ID;
    navItem.innerHTML = `
      <span class="nav-icon">⚡</span>
      <span class="nav-text">AI Auto-Remix</span>
      <span style="background:linear-gradient(135deg,#38bdf8,#818cf8);color:#000;font-size:9px;font-weight:800;padding:1px 5px;border-radius:4px;margin-left:4px;">AUTO</span>
    `;

    const vidrNav = document.getElementById('nav-video-render');
    if (vidrNav && vidrNav.nextSibling) {
      sidebarNav.insertBefore(navItem, vidrNav.nextSibling);
    } else {
      sidebarNav.appendChild(navItem);
    }
  }

  function mountPage() {
    const mainContent = document.querySelector('.main-content') || document.querySelector('main');
    if (!mainContent || document.getElementById(PAGE_ID)) return;

    const page = document.createElement('div');
    page.id = PAGE_ID;
    page.className = 'page ai-remix-page';
    page.innerHTML = `
      <div class="remix-shell">
        <div class="remix-header">
          <div>
            <h1>⚡ AI Video Auto-Remix <span style="font-size:12px;font-weight:400;color:#38bdf8;border:1px solid rgba(56,189,248,0.3);padding:2px 8px;border-radius:12px;">Smart Multi-Video Director</span></h1>
            <p>Tự động hóa 100%: Quét loại bỏ mặt người ➔ AI Local sinh Timeline kịch bản mới ➔ Lồng tiếng Voiceover ➔ Cắt ghép hàng loạt chỉ với 1 nút bấm.</p>
          </div>
          <div style="display:flex;gap:8px;">
            <button id="remix-btn-add-files" class="remix-btn-secondary">📁 Thêm Video</button>
            <button id="remix-btn-clear-queue" class="remix-btn-secondary" style="color:#f87171;">🗑 Xóa danh sách</button>
          </div>
        </div>

        <div class="remix-grid">
          <!-- Cột 1: Hàng đợi Video & Cấu hình -->
          <div class="remix-card">
            <h3 class="remix-card-title">
              <span>1. Hàng đợi Multi-Video</span>
              <span id="remix-queue-count" style="font-size:12px;color:#94a3b8;">0 video</span>
            </h3>

            <div id="remix-queue-container" class="remix-queue-list">
              <div style="text-align:center;padding:24px;color:#64748b;font-size:12px;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;">
                Kéo thả nhiều video hoặc bấm <b>"📁 Thêm Video"</b> để bắt đầu
              </div>
            </div>

            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:12px;display:flex;flex-direction:column;gap:10px;">
              <h4 style="margin:0;font-size:13px;color:#cbd5e1;">⚙️ Cấu hình Tự Động Hóa:</h4>
              
              <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;">
                <span>🚫 Loại bỏ khuôn mặt người:</span>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                  <input type="checkbox" id="remix-opt-filter-faces" checked> <b>Bật lọc mặt</b>
                </label>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;">
                <span>🎤 Giọng đọc Voiceover:</span>
                <select id="remix-opt-voice" style="background:#0a0f1d;border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:6px;padding:4px 8px;font-size:12px;">
                  <option value="default">OmniVoice Mặc định</option>
                  <option value="thucnu">Thục Nữ (Truyền cảm)</option>
                  <option value="namminh">Nam Minh (Mạnh mẽ)</option>
                  <option value="hoaimy">Hoài My (Nhẹ nhàng)</option>
                </select>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;">
                <span>🎵 Âm thanh video gốc:</span>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                  <input type="checkbox" id="remix-opt-remove-vocal" checked> <b>Khử vocal, giữ BGM</b>
                </label>
              </div>

              <div style="display:flex;align-items:center;justify-content:space-between;font-size:12px;">
                <span>🖼 Tạo ảnh Thumbnail sản phẩm:</span>
                <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                  <input type="checkbox" id="remix-opt-gen-thumb" checked> <b>Bật tạo Thumbnail</b>
                </label>
              </div>
            </div>
          </div>

          <!-- Cột 2: Đạo diễn AI & Kịch bản dựng -->
          <div class="remix-card">
            <h3 class="remix-card-title">
              <span>2. Đạo diễn AI & Kịch bản dựng</span>
              <span id="remix-active-title" style="font-size:11px;color:#38bdf8;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Chưa chọn</span>
            </h3>

            <!-- Thống kê lọc mặt -->
            <div id="remix-face-stats" class="remix-face-box">
              <span><b>🚫 Trạng thái lọc mặt người:</b> Đang chờ quét...</span>
            </div>

            <!-- Bảng Timeline kịch bản mới -->
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:600;color:#cbd5e1;">🎬 Timeline Remix mới:</span>
                <span id="remix-clips-count" style="font-size:11px;color:#94a3b8;">0 phân đoạn</span>
              </div>
              <div id="remix-timeline-list" class="remix-timeline-list">
                <div style="color:#64748b;font-size:12px;text-align:center;padding:16px;">Chưa có phân đoạn remix.</div>
              </div>
            </div>

            <!-- Kịch bản Voiceover -->
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:600;color:#cbd5e1;">🎙 Kịch bản Voiceover tự động:</span>
                <button id="remix-btn-re-ai" class="remix-btn-secondary" style="padding:2px 8px;font-size:11px;">✨ AI Viết lại</button>
              </div>
              <textarea id="remix-voiceover-input" class="remix-script-box" placeholder="Kịch bản lồng tiếng có nhấn nhá do AI tự động sinh ra..."></textarea>
            </div>

            <!-- Thumbnail Sản Phẩm Preview & Info -->
            <div style="display:flex;flex-direction:column;gap:6px;">
              <span style="font-size:12px;font-weight:600;color:#cbd5e1;">🖼 Ảnh Thumbnail sản phẩm:</span>
              <div id="remix-thumb-preview-box" class="remix-thumb-preview-wrap">
                <img id="remix-thumb-img" class="remix-thumb-img" src="" alt="Thumbnail" style="display:none;" title="Bấm để xem ảnh kích thước lớn">
                <div id="remix-thumb-placeholder" style="color:#64748b;font-size:12px;text-align:center;flex:1;">
                  Ảnh thumbnail sẽ tự động tạo từ frame sản phẩm đẹp nhất khi chạy Auto-Remix.
                </div>
                <div id="remix-thumb-info" style="display:none;flex:1;flex-direction:column;gap:4px;font-size:11px;color:#cbd5e1;">
                  <div><b>Tiêu đề:</b> <span id="remix-thumb-hl-text" style="color:#fde047;font-weight:700;">-</span></div>
                  <div><b>Nhãn:</b> <span id="remix-thumb-badge-text" style="color:#f87171;font-weight:700;">-</span></div>
                  <button id="remix-btn-open-thumb" class="remix-btn-secondary" style="align-self:flex-start;padding:3px 8px;font-size:10px;margin-top:4px;">🔍 Mở ảnh Thumbnail</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Cột 3: Trình phát Video kết quả & Nút bấm 1-Click -->
          <div class="remix-card">
            <h3 class="remix-card-title">
              <span>3. Xem trước & Xuất Video</span>
              <span id="remix-render-status" style="font-size:11px;color:#34d399;">Sẵn sàng</span>
            </h3>

            <!-- Video Player Preview -->
            <div class="remix-video-wrapper">
              <video id="remix-preview-video" controls></video>
            </div>

            <!-- Tiến độ hàng loạt -->
            <div class="remix-progress-wrap">
              <div style="display:flex;justify-content:space-between;font-size:12px;">
                <span id="remix-progress-text">Tiến độ hàng loạt: 0/0 video</span>
                <span id="remix-progress-pct" style="font-weight:700;color:#38bdf8;">0%</span>
              </div>
              <div class="remix-progress-bar">
                <div id="remix-progress-fill" class="remix-progress-fill"></div>
              </div>
            </div>

            <!-- Nút bấm 1-Click -->
            <button id="remix-btn-start-batch" class="remix-btn-primary">
              <span>⚡ BẮT ĐẦU AUTO REMIX HÀNG LOẠT (1-CLICK)</span>
            </button>

            <!-- Console Log -->
            <div style="display:flex;flex-direction:column;gap:4px;">
              <span style="font-size:11px;font-weight:600;color:#94a3b8;">Nhật ký xử lý:</span>
              <div id="remix-log-output" class="remix-log-output"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    mainContent.appendChild(page);
    bindEvents();
    renderQueue();
    log('Tab AI Video Auto-Remix đã sẵn sàng hoạt động.', 'info');
  }

  function renderQueue() {
    const container = document.getElementById('remix-queue-container');
    const countEl = document.getElementById('remix-queue-count');
    if (!container) return;

    if (countEl) countEl.textContent = `${state.queue.length} video`;

    if (!state.queue.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px;color:#64748b;font-size:12px;border:1px dashed rgba(255,255,255,0.1);border-radius:8px;">
          Kéo thả nhiều video hoặc bấm <b>"📁 Thêm Video"</b> để bắt đầu
        </div>
      `;
      renderActiveDetails();
      return;
    }

    container.innerHTML = state.queue.map(item => {
      const isAct = item.id === state.activeId;
      const badgeCls = item.status === 'processing' ? 'remix-badge-processing' : item.status === 'done' ? 'remix-badge-done' : item.status === 'error' ? 'remix-badge-error' : 'remix-badge-idle';
      const badgeText = item.status === 'processing' ? 'Đang xử lý...' : item.status === 'done' ? 'Hoàn tất ✓' : item.status === 'error' ? 'Lỗi ✕' : 'Chờ';
      
      return `
        <div class="remix-queue-item ${isAct ? 'active' : ''}" data-id="${item.id}">
          <div class="remix-queue-info">
            <span class="remix-queue-name" title="${escapeHtml(item.path)}">${escapeHtml(item.name)}</span>
            <span class="remix-queue-status">${item.clipsCount ? `${item.clipsCount} clips` : 'Chưa phân tích'}</span>
          </div>
          <span class="remix-badge ${badgeCls}">${badgeText}</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.remix-queue-item').forEach(el => {
      el.addEventListener('click', () => {
        state.activeId = el.dataset.id;
        renderQueue();
        renderActiveDetails();
      });
    });

    renderActiveDetails();
  }

  function renderActiveDetails() {
    const item = getActiveItem();
    const titleEl = document.getElementById('remix-active-title');
    const faceEl = document.getElementById('remix-face-stats');
    const clipsCountEl = document.getElementById('remix-clips-count');
    const timelineList = document.getElementById('remix-timeline-list');
    const voiceInput = document.getElementById('remix-voiceover-input');
    const videoEl = document.getElementById('remix-preview-video');

    if (!item) {
      if (titleEl) titleEl.textContent = 'Chưa chọn';
      if (faceEl) faceEl.innerHTML = '<span><b>🚫 Trạng thái lọc mặt:</b> Chưa có video.</span>';
      if (clipsCountEl) clipsCountEl.textContent = '0 phân đoạn';
      if (timelineList) timelineList.innerHTML = '<div style="color:#64748b;font-size:12px;text-align:center;padding:16px;">Chưa có phân đoạn remix.</div>';
      if (voiceInput) voiceInput.value = '';
      if (videoEl) videoEl.src = '';
      return;
    }

    if (titleEl) titleEl.textContent = item.name;

    // Face stats
    if (faceEl) {
      if (item.faceStats) {
        const faceCount = item.faceStats.face_intervals?.length || 0;
        const freeCount = item.faceStats.face_free_intervals?.length || 0;
        faceEl.className = 'remix-face-box ' + (faceCount > 0 ? '' : 'clean');
        faceEl.innerHTML = `
          <span><b>🚫 Đã phát hiện & loại bỏ:</b> ${faceCount} đoạn chứa khuôn mặt người.</span>
          <span><b>✨ Giữ lại:</b> ${freeCount} phân đoạn cảnh sạch (${item.faceStats.total_face_free_duration || 0}s).</span>
        `;
      } else {
        faceEl.className = 'remix-face-box';
        faceEl.innerHTML = '<span><b>🚫 Trạng thái lọc mặt:</b> Sẵn sàng quét khi bấm bắt đầu.</span>';
      }
    }

    // Timeline list
    if (clipsCountEl) clipsCountEl.textContent = `${item.remixClips?.length || 0} phân đoạn`;
    if (timelineList) {
      if (item.remixClips && item.remixClips.length > 0) {
        timelineList.innerHTML = item.remixClips.map((clip, idx) => `
          <div class="remix-timeline-card">
            <div style="display:flex;flex-direction:column;gap:2px;overflow:hidden;">
              <span style="font-weight:600;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px;">${escapeHtml(clip.name || `Đoạn ${idx+1}`)}</span>
              <span style="color:#38bdf8;font-family:monospace;font-size:11px;">${clip.start} ➔ ${clip.to}</span>
            </div>
            <button class="remix-btn-preview" data-start="${clip.start}" data-to="${clip.to}">▶ Xem</button>
          </div>
        `).join('');

        timelineList.querySelectorAll('.remix-btn-preview').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            previewClip(item.path, btn.dataset.start, btn.dataset.to);
          });
        });
      } else {
        timelineList.innerHTML = '<div style="color:#64748b;font-size:12px;text-align:center;padding:16px;">Chưa có phân đoạn remix.</div>';
      }
    }

    // Voiceover script
    if (voiceInput) {
      voiceInput.value = item.voiceScript || '';
    }

    // Thumbnail Preview & Info
    const thumbImg = document.getElementById('remix-thumb-img');
    const thumbPlaceholder = document.getElementById('remix-thumb-placeholder');
    const thumbInfo = document.getElementById('remix-thumb-info');
    const thumbHl = document.getElementById('remix-thumb-hl-text');
    const thumbBadge = document.getElementById('remix-thumb-badge-text');

    if (item.thumbnailPath) {
      if (thumbImg) {
        thumbImg.src = toMediaUrl(item.thumbnailPath);
        thumbImg.style.display = 'block';
        thumbImg.onclick = () => {
          if (window.electronAPI?.openPath) window.electronAPI.openPath(item.thumbnailPath);
        };
      }
      if (thumbPlaceholder) thumbPlaceholder.style.display = 'none';
      if (thumbInfo) {
        thumbInfo.style.display = 'flex';
        if (thumbHl) thumbHl.textContent = item.thumbnailHeadline || 'SIÊU PHẨM HOT';
        if (thumbBadge) thumbBadge.textContent = item.thumbnailBadge || '⚡ BEST SELLER';
        const openBtn = document.getElementById('remix-btn-open-thumb');
        if (openBtn) {
          openBtn.onclick = () => {
            if (window.electronAPI?.openPath) window.electronAPI.openPath(item.thumbnailPath);
          };
        }
      }
    } else {
      if (thumbImg) {
        thumbImg.src = '';
        thumbImg.style.display = 'none';
      }
      if (thumbPlaceholder) thumbPlaceholder.style.display = 'block';
      if (thumbInfo) thumbInfo.style.display = 'none';
    }

    // Video player
    if (videoEl) {
      const targetPath = item.outputPath || item.path;
      const targetUrl = toMediaUrl(targetPath);
      if (videoEl.src !== targetUrl) {
        videoEl.src = targetUrl;
        videoEl.load();
      }
    }
  }

  function previewClip(videoPath, start, to) {
    const videoEl = document.getElementById('remix-preview-video');
    if (!videoEl || !videoPath) return;

    const sSec = parseTimeToSeconds(start);
    const tSec = parseTimeToSeconds(to);
    const targetUrl = toMediaUrl(videoPath);

    if (videoEl._clipEndHandler) {
      videoEl.removeEventListener('timeupdate', videoEl._clipEndHandler);
      videoEl._clipEndHandler = null;
    }

    const seekAndPlay = () => {
      try {
        videoEl.currentTime = sSec;
        videoEl.play().catch(e => console.warn('Preview play catch:', e));
      } catch (e) {
        console.warn('Seek error:', e);
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
    log(`Đang xem trước phân đoạn (${start} ➔ ${to})`, 'info');
  }

  async function handleBatchProcess() {
    if (state.runningBatch) return;
    if (!state.queue.length) {
      window.showToast?.('Vui lòng thêm ít nhất 1 video vào hàng đợi.', 'warning');
      return;
    }

    state.runningBatch = true;
    const btn = document.getElementById('remix-btn-start-batch');
    const fill = document.getElementById('remix-progress-fill');
    const pctText = document.getElementById('remix-progress-pct');
    const statusText = document.getElementById('remix-render-status');
    const progText = document.getElementById('remix-progress-text');

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳ ĐANG XỬ LÝ HÀNG LOẠT (VUI LÒNG CHỜ)...</span>';
    }

    log(`🚀 Bắt đầu chuỗi tự động hóa 1-Click cho ${state.queue.length} video...`, 'info');
    let completedCount = 0;

    for (let i = 0; i < state.queue.length; i++) {
      const item = state.queue[i];
      state.activeId = item.id;
      item.status = 'processing';
      renderQueue();

      if (progText) progText.textContent = `Tiến độ hàng loạt: ${i + 1}/${state.queue.length} video (${item.name})`;
      if (statusText) statusText.textContent = `Đang xử lý video ${i + 1}...`;
      log(`[${i+1}/${state.queue.length}] Bắt đầu xử lý: ${item.name}`, 'info');

      try {
        const aiConfig = getResolvedAiConfig();
        const ttsVoice = document.getElementById('remix-opt-voice')?.value || 'default';
        const removeVocal = document.getElementById('remix-opt-remove-vocal')?.checked ?? true;
        const genThumb = document.getElementById('remix-opt-gen-thumb')?.checked ?? true;

        // Bước 1: Quét lọc mặt & AI Director
        log(`🔍 [${item.name}] Đang quét lọc khuôn mặt người & AI Director lập Timeline + Kịch bản...`, 'info');
        const dirRes = await window.api.aiRemixAutoDirector(item.path, null, aiConfig, 0.35);

        if (dirRes && dirRes.status === 'ok') {
          item.faceStats = {
            face_intervals: dirRes.face_intervals || [],
            face_free_intervals: dirRes.face_free_intervals || [],
            total_face_free_duration: dirRes.face_free_intervals?.reduce((s, c) => s + (c.duration || 0), 0)
          };
          item.remixClips = dirRes.remix_clips || [];
          item.voiceScript = dirRes.voiceover_script || '';
          item.thumbnailHeadline = dirRes.thumbnail_headline || '';
          item.thumbnailSubHeadline = dirRes.thumbnail_sub_headline || '';
          item.thumbnailBadge = dirRes.thumbnail_badge || '';
          item.clipsCount = item.remixClips.length;
          renderActiveDetails();
          log(`✨ [${item.name}] Đã lọc xong ${dirRes.face_intervals?.length || 0} đoạn mặt người. Tạo ${item.remixClips.length} phân đoạn remix!`, 'success');
        }

        // Bước 2: Cắt ghép video, lồng tiếng TTS, khử vocal và tạo Thumbnail
        log(`🎬 [${item.name}] Đang cắt ghép chuỗi cảnh, tạo giọng đọc TTS, hòa trộn âm thanh và thiết kế Thumbnail...`, 'info');
        const procRes = await window.api.aiRemixProcessSingleVideo(
          item.path,
          null,
          ttsVoice,
          'lossless',
          removeVocal,
          genThumb,
          aiConfig,
          item.remixClips,
          item.voiceScript,
          item.thumbnailHeadline,
          item.thumbnailSubHeadline,
          item.thumbnailBadge
        );

        if (procRes && procRes.status === 'ok') {
          item.status = 'done';
          item.outputPath = procRes.output_video_path;
          item.thumbnailPath = procRes.thumbnail_path || '';
          item.scriptPath = procRes.script_path || '';
          renderActiveDetails();
          log(`🎉 [${item.name}] XỬ LÝ HOÀN TẤT ĐỒNG BỘ! Video: ${item.outputPath}`, 'success');
          if (item.thumbnailPath) log(`🖼 Thumbnail đã tạo: ${item.thumbnailPath}`, 'success');
        } else {
          throw new Error(procRes?.error || 'Lỗi xử lý video');
        }
      } catch (err) {
        item.status = 'error';
        item.error = err.message;
        log(`❌ [${item.name}] Lỗi: ${err.message}`, 'error');
      }

      completedCount++;
      const pct = Math.round((completedCount / state.queue.length) * 100);
      if (fill) fill.style.width = `${pct}%`;
      if (pctText) pctText.textContent = `${pct}%`;
      renderQueue();
    }

    if (progText) progText.textContent = `Đã hoàn tất ${completedCount}/${state.queue.length} video!`;
    if (statusText) statusText.textContent = 'Hoàn tất xuất sắc!';
    window.showToast?.('Đã hoàn tất Auto-Remix cho toàn bộ hàng đợi!', 'success');
    log('🎉🎉 ĐÃ HOÀN TẤT AUTO-REMIX CHO TOÀN BỘ HÀNG ĐỢI MULTI-VIDEO!', 'success');

    state.runningBatch = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>⚡ BẮT ĐẦU AUTO REMIX HÀNG LOẠT (1-CLICK)</span>';
    }
  }

  function addFilesToQueue(filePaths) {
    if (!Array.isArray(filePaths) || !filePaths.length) return;
    let added = 0;
    filePaths.forEach(p => {
      if (!p || !/\.(mp4|mkv|mov|avi|webm|flv|ts)$/i.test(p)) return;
      if (state.queue.some(item => item.path === p)) return;
      const name = p.split(/[\\/]/).pop();
      const id = 'vid_' + Math.random().toString(36).substr(2, 9);
      state.queue.push({
        id,
        path: p,
        name,
        status: 'idle',
        faceStats: null,
        remixClips: [],
        voiceScript: '',
        outputPath: '',
        error: ''
      });
      added++;
    });

    if (added > 0) {
      if (!state.activeId && state.queue.length > 0) {
        state.activeId = state.queue[0].id;
      }
      renderQueue();
      log(`Đã thêm ${added} video vào hàng đợi.`, 'info');
      window.showToast?.(`Đã nạp ${added} video!`, 'success');
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

    // Add files button
    document.getElementById('remix-btn-add-files')?.addEventListener('click', async () => {
      if (window.electronAPI?.openFile) {
        const res = await window.electronAPI.openFile({
          properties: ['openFile', 'multiSelections'],
          filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'ts'] }]
        });
        if (res && Array.isArray(res)) {
          addFilesToQueue(res);
        }
      } else {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.multiple = true;
        inp.accept = 'video/*';
        inp.onchange = (e) => {
          const files = Array.from(e.target.files || []);
          const paths = files.map(f => f.path || f.name).filter(Boolean);
          addFilesToQueue(paths);
        };
        inp.click();
      }
    });

    // Clear queue
    document.getElementById('remix-btn-clear-queue')?.addEventListener('click', () => {
      if (state.runningBatch) return;
      state.queue = [];
      state.activeId = null;
      renderQueue();
      log('Đã xóa toàn bộ hàng đợi video.', 'info');
    });

    // Start Batch button
    document.getElementById('remix-btn-start-batch')?.addEventListener('click', handleBatchProcess);

    // AI Re-write script
    document.getElementById('remix-btn-re-ai')?.addEventListener('click', async () => {
      const item = getActiveItem();
      if (!item) {
        window.showToast?.('Vui lòng chọn 1 video để AI viết lại kịch bản.', 'warning');
        return;
      }
      const btn = document.getElementById('remix-btn-re-ai');
      btn.disabled = true;
      btn.textContent = '⏳ Đang viết...';
      log(`AI đang tối ưu lại kịch bản cho ${item.name}...`, 'info');

      try {
        const aiConfig = getResolvedAiConfig();
        const dirRes = await window.api.aiRemixAutoDirector(item.path, item.faceStats?.face_free_intervals, aiConfig);
        if (dirRes && dirRes.status === 'ok') {
          item.voiceScript = dirRes.voiceover_script || item.voiceScript;
          if (dirRes.remix_clips?.length) item.remixClips = dirRes.remix_clips;
          renderActiveDetails();
          log('✨ AI đã cập nhật kịch bản Voiceover thành công!', 'success');
        }
      } catch (err) {
        log(`Lỗi AI viết kịch bản: ${err.message}`, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = '✨ AI Viết lại';
      }
    });

    // Voiceover manual input sync
    document.getElementById('remix-voiceover-input')?.addEventListener('input', (e) => {
      const item = getActiveItem();
      if (item) item.voiceScript = e.target.value;
    });

    // Drag & Drop
    const pageEl = document.getElementById(PAGE_ID);
    if (pageEl) {
      pageEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
      pageEl.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = Array.from(e.dataTransfer?.files || []);
        const paths = files.map(f => f.path || f.name).filter(Boolean);
        addFilesToQueue(paths);
      });
    }
  }

  function init() {
    ensureStyle();
    mountNav();
    mountPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
