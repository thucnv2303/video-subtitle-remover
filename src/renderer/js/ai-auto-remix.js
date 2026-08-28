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
        <!-- Top Header Bar -->
        <div class="remix-header">
          <div class="remix-header-left">
            <div class="remix-header-title">
              <span>⚡ AI VIDEO AUTO-REMIX</span>
              <span class="remix-pill-badge">PRO DIRECTOR</span>
            </div>
            <div class="remix-header-subtitle">
              Tự động hóa 100%: Quét loại bỏ mặt người ➔ AI sinh Timeline ➔ Lồng tiếng Voiceover ➔ Tạo Thumbnail ➔ Xuất hàng loạt 1-Click
            </div>
          </div>
          <div style="display:flex;gap:10px;">
            <button id="remix-btn-add-files" class="remix-btn-glow" style="padding:8px 16px;font-size:12px;box-shadow:none;">📁 Thêm Video</button>
            <button id="remix-btn-clear-queue" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">🗑 Xóa danh sách</button>
          </div>
        </div>

        <!-- 3-Column Futuristic Grid -->
        <div class="remix-grid">
          
          <!-- Column 1: Batch Video Queue -->
          <div class="remix-card">
            <div class="remix-card-header">
              <h3 class="remix-card-title">
                <span>📁 Batch Video Queue</span>
              </h3>
              <span id="remix-queue-count" style="font-size:11px;color:#38bdf8;font-weight:700;">0 Video</span>
            </div>

            <!-- Queue Container -->
            <div id="remix-queue-container" class="remix-queue-list"></div>

            <!-- Drag & Drop Zone -->
            <div id="remix-dropzone-box" class="remix-dropzone">
              <span style="font-size:26px;">☁️</span>
              <div style="font-size:12px;font-weight:700;color:#f1f5f9;">Drag & Drop Videos</div>
              <div style="font-size:11px;color:#64748b;">Kéo thả video vào đây hoặc bấm để chọn</div>
            </div>

            <!-- Auto Settings Switches -->
            <div style="border-top:1px solid rgba(255,255,255,0.06);padding-top:10px;display:flex;flex-direction:column;gap:8px;font-size:11px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#cbd5e1;">🚫 Lọc mặt người:</span>
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="remix-opt-filter-faces" checked> <b>Bật</b></label>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#cbd5e1;">🎤 Giọng đọc TTS:</span>
                <select id="remix-opt-voice" style="background:#080c14;border:1px solid rgba(255,255,255,0.1);color:#fff;border-radius:4px;padding:2px 6px;font-size:11px;">
                  <option value="default">OmniVoice Mặc định</option>
                  <option value="thucnu">Thục Nữ</option>
                  <option value="namminh">Nam Minh</option>
                  <option value="hoaimy">Hoài My</option>
                </select>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#cbd5e1;">🎵 Khử vocal video gốc:</span>
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="remix-opt-remove-vocal" checked> <b>Giữ BGM</b></label>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#cbd5e1;">🖼 Tạo ảnh Thumbnail:</span>
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer;"><input type="checkbox" id="remix-opt-gen-thumb" checked> <b>Bật</b></label>
              </div>
            </div>
          </div>

          <!-- Column 2: Live AI Director & Remix Timeline -->
          <div class="remix-card">
            <div class="remix-card-header">
              <h3 class="remix-card-title">
                <span>🧠 Live AI Director</span>
              </h3>
              <span id="remix-active-title" style="font-size:11px;color:#38bdf8;max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Chưa chọn</span>
            </div>

            <!-- Face Stats & Director Top Box -->
            <div class="remix-director-grid">
              <div class="remix-director-box">
                <div style="font-size:11px;font-weight:700;color:#cbd5e1;">🚫 Bộ lọc mặt người:</div>
                <div id="remix-stat-excluded" class="remix-face-stat-item">
                  <span class="stat-icon-excluded">●</span>
                  <span id="remix-excluded-text" style="color:#fca5a5;">Chưa quét</span>
                </div>
                <div id="remix-stat-preserved" class="remix-face-stat-item">
                  <span class="stat-icon-preserved">✓</span>
                  <span id="remix-preserved-text" style="color:#6ee7b7;">Chưa có dữ liệu</span>
                </div>
              </div>

              <!-- Timeline Sequence Cards -->
              <div class="remix-director-box">
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;font-weight:700;color:#cbd5e1;">
                  <span>🎬 Remix Timeline</span>
                  <span id="remix-clips-count" style="color:#38bdf8;font-size:10px;">0 clips</span>
                </div>
                <div id="remix-timeline-list" class="remix-timeline-sequence">
                  <div style="color:#64748b;font-size:11px;text-align:center;padding:12px;">Chưa có phân đoạn remix.</div>
                </div>
              </div>
            </div>

            <!-- Auto-Voiceover Script Editor -->
            <div class="remix-script-editor-wrap">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:700;color:#cbd5e1;">🎙 Auto-Voiceover Script Editor</span>
                <button id="remix-btn-re-ai" style="background:rgba(56,189,248,0.1);border:1px solid rgba(56,189,248,0.3);color:#38bdf8;border-radius:6px;padding:2px 8px;font-size:10px;font-weight:700;cursor:pointer;">✨ AI Viết lại</button>
              </div>
              <textarea id="remix-voiceover-input" class="remix-script-textarea" placeholder="Kịch bản lồng tiếng có nhấn nhá do AI tự động sinh ra..."></textarea>
              <div class="remix-keyword-bar">
                <span>Keywords:</span>
                <span class="remix-chip chip-cyan">AI Hook</span>
                <span class="remix-chip chip-purple">Speed</span>
                <span class="remix-chip chip-green">Features</span>
                <span class="remix-chip chip-cyan">Quality</span>
              </div>
            </div>

            <!-- Product Thumbnail Preview Showcase -->
            <div style="display:flex;flex-direction:column;gap:4px;">
              <span style="font-size:12px;font-weight:700;color:#cbd5e1;">🖼 Product Thumbnail Preview</span>
              <div id="remix-thumb-showcase" class="remix-thumb-showcase" title="Bấm để mở ảnh Thumbnail">
                <img id="remix-thumb-img" class="remix-thumb-bg" src="" alt="Thumbnail" style="display:none;">
                <span id="remix-thumb-badge-tag" class="remix-thumb-badge-tag">⚡ VIRAL</span>
                <div id="remix-thumb-placeholder" style="color:#64748b;font-size:12px;text-align:center;padding:20px;">
                  Thumbnail sản phẩm sắc nét sẽ tự động tạo khi chạy Auto-Remix.
                </div>
                <div id="remix-thumb-overlay" class="remix-thumb-overlay-text" style="display:none;">
                  <span id="remix-thumb-headline-display" class="remix-thumb-headline-main">SIÊU PHẨM HOT | 4K</span>
                  <span id="remix-thumb-sub-display" style="font-size:11px;color:#fff;">TIỆN LỢI - HIỆU QUẢ VƯỢT TRỘI</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Column 3: Video Player & Batch Runner -->
          <div class="remix-card">
            <div class="remix-card-header">
              <h3 class="remix-card-title">
                <span>📺 Video Player</span>
              </h3>
              <span id="remix-render-status" style="font-size:11px;color:#34d399;font-weight:700;">Sẵn sàng</span>
            </div>

            <!-- Main Video Player -->
            <div class="remix-video-box">
              <video id="remix-preview-video" controls></video>
            </div>

            <!-- Batch Progress Bar -->
            <div style="display:flex;flex-direction:column;gap:6px;">
              <div style="display:flex;justify-content:space-between;font-size:11px;">
                <span id="remix-progress-text" style="color:#94a3b8;font-weight:600;">Batch Progress: 0/0 video</span>
                <span id="remix-progress-pct" style="color:#38bdf8;font-weight:800;">0%</span>
              </div>
              <div style="width:100%;height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;">
                <div id="remix-progress-fill" style="width:0%;height:100%;background:linear-gradient(90deg,#0284c7,#a855f7);transition:width 0.3s ease;"></div>
              </div>
            </div>

            <!-- Start 1-Click Action Button -->
            <button id="remix-btn-start-batch" class="remix-btn-glow">
              <span>🚀 START 1-CLICK AUTO REMIX</span>
            </button>

            <!-- Event Log Console -->
            <div style="display:flex;flex-direction:column;gap:4px;">
              <span style="font-size:11px;font-weight:700;color:#94a3b8;">Event Log Console</span>
              <div id="remix-terminal-log" class="remix-terminal"></div>
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

    if (countEl) countEl.textContent = `${state.queue.length} Video`;

    if (!state.queue.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px 12px;color:#64748b;font-size:11px;border:1px dashed rgba(255,255,255,0.08);border-radius:8px;">
          Chưa có video. Kéo thả video vào ô bên dưới hoặc bấm <b>"📁 Thêm Video"</b>.
        </div>
      `;
      renderActiveDetails();
      return;
    }

    container.innerHTML = state.queue.map(item => {
      const isAct = item.id === state.activeId;
      const badgeCls = item.status === 'processing' ? 'badge-processing' : item.status === 'done' ? 'badge-done' : item.status === 'error' ? 'badge-error' : 'badge-idle';
      const badgeText = item.status === 'processing' ? 'Đang chạy' : item.status === 'done' ? 'Done' : item.status === 'error' ? 'Error' : 'Idle';
      
      return `
        <div class="remix-queue-card ${isAct ? 'active' : ''}" data-id="${item.id}">
          <div class="remix-queue-left">
            <div class="remix-queue-play-icon">▶</div>
            <div class="remix-queue-meta">
              <span class="remix-queue-filename" title="${escapeHtml(item.path)}">${escapeHtml(item.name)}</span>
              <span class="remix-queue-sub">${item.clipsCount ? `${item.clipsCount} clips` : 'Chờ phân tích'}</span>
            </div>
          </div>
          <span class="remix-status-badge ${badgeCls}">${badgeText}</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.remix-queue-card').forEach(el => {
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
    const excludedText = document.getElementById('remix-excluded-text');
    const preservedText = document.getElementById('remix-preserved-text');
    const clipsCountEl = document.getElementById('remix-clips-count');
    const timelineList = document.getElementById('remix-timeline-list');
    const voiceInput = document.getElementById('remix-voiceover-input');
    const videoEl = document.getElementById('remix-preview-video');
    const thumbImg = document.getElementById('remix-thumb-img');
    const thumbPlaceholder = document.getElementById('remix-thumb-placeholder');
    const thumbOverlay = document.getElementById('remix-thumb-overlay');
    const thumbHl = document.getElementById('remix-thumb-headline-display');
    const thumbSub = document.getElementById('remix-thumb-sub-display');
    const thumbBadge = document.getElementById('remix-thumb-badge-tag');

    if (!item) {
      if (titleEl) titleEl.textContent = 'Chưa chọn';
      if (excludedText) excludedText.textContent = 'Chưa quét';
      if (preservedText) preservedText.textContent = 'Chưa có dữ liệu';
      if (clipsCountEl) clipsCountEl.textContent = '0 clips';
      if (timelineList) timelineList.innerHTML = '<div style="color:#64748b;font-size:11px;text-align:center;padding:12px;">Chưa có phân đoạn remix.</div>';
      if (voiceInput) voiceInput.value = '';
      if (videoEl) videoEl.src = '';
      if (thumbImg) thumbImg.style.display = 'none';
      if (thumbPlaceholder) thumbPlaceholder.style.display = 'block';
      if (thumbOverlay) thumbOverlay.style.display = 'none';
      return;
    }

    if (titleEl) titleEl.textContent = item.name;

    // Face stats
    if (item.faceStats) {
      const faceCount = item.faceStats.face_intervals?.length || 0;
      const freeCount = item.faceStats.face_free_intervals?.length || 0;
      if (excludedText) excludedText.textContent = `Đã loại bỏ: ${faceCount} đoạn mặt`;
      if (preservedText) preservedText.textContent = `Giữ lại: ${freeCount} cảnh sạch (${item.faceStats.total_face_free_duration || 0}s)`;
    } else {
      if (excludedText) excludedText.textContent = 'Sẵn sàng lọc mặt';
      if (preservedText) preservedText.textContent = 'Tự động quét khi chạy';
    }

    // Timeline Sequence Cards (Hook, Features, Experience, CTA)
    if (clipsCountEl) clipsCountEl.textContent = `${item.remixClips?.length || 0} clips`;
    if (timelineList) {
      if (item.remixClips && item.remixClips.length > 0) {
        const dotColors = ['tag-dot-hook', 'tag-dot-feat', 'tag-dot-exp', 'tag-dot-cta'];
        timelineList.innerHTML = item.remixClips.map((clip, idx) => {
          const dotCls = dotColors[idx % dotColors.length];
          return `
            <div class="remix-timeline-row">
              <div class="remix-timeline-tag">
                <span class="${dotCls}"></span>
                <span style="color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;" title="${escapeHtml(clip.name || `Clip ${idx+1}`)}">${escapeHtml(clip.name || `Clip ${idx+1}`)}</span>
              </div>
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="remix-timeline-time">${clip.start}➔${clip.to}</span>
                <button class="remix-btn-preview-clip" data-start="${clip.start}" data-to="${clip.to}" style="background:#0284c7;color:#fff;border:none;border-radius:4px;padding:2px 6px;font-size:10px;cursor:pointer;">▶</button>
              </div>
            </div>
          `;
        }).join('');

        timelineList.querySelectorAll('.remix-btn-preview-clip').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            previewClip(item.path, btn.dataset.start, btn.dataset.to);
          });
        });
      } else {
        timelineList.innerHTML = '<div style="color:#64748b;font-size:11px;text-align:center;padding:12px;">Chưa có phân đoạn remix.</div>';
      }
    }

    // Voiceover script
    if (voiceInput) {
      voiceInput.value = item.voiceScript || '';
    }

    // Thumbnail Preview Showcase
    if (item.thumbnailPath) {
      if (thumbImg) {
        thumbImg.src = toMediaUrl(item.thumbnailPath);
        thumbImg.style.display = 'block';
      }
      if (thumbPlaceholder) thumbPlaceholder.style.display = 'none';
      if (thumbOverlay) thumbOverlay.style.display = 'flex';
      if (thumbHl) thumbHl.textContent = item.thumbnailHeadline || 'SIÊU PHẨM HOT | 4K';
      if (thumbSub) thumbSub.textContent = item.thumbnailSubHeadline || 'TIỆN LỢI - HIỆU QUẢ VƯỢT TRỘI';
      if (thumbBadge) thumbBadge.textContent = item.thumbnailBadge || '⚡ VIRAL';
    } else {
      if (thumbImg) thumbImg.style.display = 'none';
      if (thumbPlaceholder) thumbPlaceholder.style.display = 'block';
      if (thumbOverlay) thumbOverlay.style.display = 'none';
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

  const chooseVideos = async () => {
    let paths = [];
    if (window.electronAPI?.openFile) {
      try {
        const res = await window.electronAPI.openFile([
          { name: 'Video Files', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'flv', 'ts'] }
        ]);
        if (!res?.canceled && res?.filePaths?.length) {
          paths = res.filePaths;
        } else if (Array.isArray(res) && res.length) {
          paths = res;
        }
      } catch (err) {
        console.warn('Electron openFile error:', err);
      }
    }

    if (!paths.length) {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.multiple = true;
      inp.accept = 'video/*';
      inp.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        const fpaths = files.map(f => f.path || f.name).filter(Boolean);
        if (fpaths.length) addFilesToQueue(fpaths);
      };
      inp.click();
      return;
    }

    if (paths.length) {
      addFilesToQueue(paths);
    }
  };

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
        thumbnailPath: '',
        thumbnailHeadline: '',
        thumbnailSubHeadline: '',
        thumbnailBadge: '',
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

      if (progText) progText.textContent = `Batch Progress: ${i + 1}/${state.queue.length} (${item.name})`;
      if (statusText) statusText.textContent = `Processing Video ${i + 1}...`;
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
          item.thumbnailFeatures = dirRes.thumbnail_features || [];
          item.productName = dirRes.product_name || '';
          item.customerAvatar = dirRes.customer_avatar || '';
          item.clipsCount = item.remixClips.length;
          renderActiveDetails();
          log(`✨ [${item.name}] Sản phẩm: ${item.productName || item.thumbnailHeadline} | Lọc ${dirRes.face_intervals?.length || 0} đoạn mặt người. Tạo ${item.remixClips.length} phân đoạn remix!`, 'success');
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
          item.thumbnailBadge,
          item.thumbnailFeatures
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
      btn.innerHTML = '<span>🚀 START 1-CLICK AUTO REMIX</span>';
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

    // Add files button & Dropzone click
    document.getElementById('remix-btn-add-files')?.addEventListener('click', chooseVideos);
    document.getElementById('remix-dropzone-box')?.addEventListener('click', chooseVideos);

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

    // Click thumbnail to open
    document.getElementById('remix-thumb-showcase')?.addEventListener('click', () => {
      const item = getActiveItem();
      if (item?.thumbnailPath && window.electronAPI?.openPath) {
        window.electronAPI.openPath(item.thumbnailPath);
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
        if (paths.length) {
          addFilesToQueue(paths);
        }
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
