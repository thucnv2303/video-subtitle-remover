(function () {
  'use strict';

  const PAGE_ID = 'page-video-render';
  const NAV_ID = 'nav-video-render';
  const STYLE_ATTR = 'data-video-render-style';

  const state = {
    videoPath: '',
    videoDuration: 0,
    clips: [],
    activeClipId: null,
    rendering: false,
    mode: 'lossless', // 'lossless' | 'accurate'
    outputDir: '',
    logs: [],
    lastOutputPath: '',
  };

  function ensureStyle() {
    if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/video-render.css';
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

  function vidrLog(msg, type = 'info') {
    const time = new Date().toLocaleTimeString();
    state.logs.unshift({ time, message: msg, type });
    if (state.logs.length > 200) state.logs.pop();
    renderLogs();
  }

  function renderLogs() {
    const el = document.getElementById('vidr-log-output');
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

        <div class="vidr-grid">
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

            <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;user-select:none;color:#e2e8f0;margin:2px 0;">
              <input type="checkbox" id="vidr-remove-vocal" style="accent-color:#3b82f6;width:15px;height:15px;">
              <span><strong>Xóa giọng nói gốc</strong> <small style="color:var(--text-muted,#94a3b8);">(Chỉ giữ lại nhạc & âm thanh nền BGM)</small></span>
            </label>

            <div style="display:flex;gap:8px;">
              <button id="vidr-btn-isolate-bgm" class="vidr-btn secondary" type="button" style="width:100%;font-size:12px;padding:6px 10px;" title="Tách bỏ giọng nói ra khỏi video nguồn ngay lập tức và tạo video chỉ có nhạc nền">🎵 Tách nhạc nền video nguồn (1-Click)</button>
            </div>

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

            <div class="vidr-field" style="margin-top:auto;">
              <span>Nhật ký tiến trình (Log)</span>
              <div id="vidr-log-output" class="vidr-log-output"></div>
            </div>
          </section>
        </div>
      </div>`;
    main.appendChild(section);
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

    // Bind action buttons
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

    // Setup drag and drop reordering
    setupDragAndDrop(listEl);
  }

  function setupDragAndDrop(container) {
    let draggedItem = null;

    container.querySelectorAll('.vidr-clip-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', () => {
        draggedItem = null;
        item.style.opacity = '1';
        container.querySelectorAll('.vidr-clip-item').forEach(i => i.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.classList.add('drag-over');
      });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        if (!draggedItem || draggedItem === item) return;

        const fromId = draggedItem.dataset.clipId;
        const toId = item.dataset.clipId;

        const fromIdx = state.clips.findIndex(c => c.id === fromId);
        const toIdx = state.clips.findIndex(c => c.id === toId);

        if (fromIdx >= 0 && toIdx >= 0) {
          const [moved] = state.clips.splice(fromIdx, 1);
          state.clips.splice(toIdx, 0, moved);
          renderClipList();
          vidrLog(`Đã đổi vị trí "${moved.name}" sang vị trí ${toIdx + 1}.`, 'info');
        }
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

    // Clear old timeupdate handler
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

    // Auto pause at clip end
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
        vidrLog(`🎉 Cắt và ghép video thành công! File lưu tại: ${res.output_path}`, 'success');
        window.showToast?.('Cắt & Ghép video thành công!', 'success');

        // Play final video in preview
        const videoEl = document.getElementById('vidr-preview-video');
        if (videoEl) {
          if (videoEl._clipEndHandler) {
            videoEl.removeEventListener('timeupdate', videoEl._clipEndHandler);
            videoEl._clipEndHandler = null;
          }
          videoEl.src = toMediaUrl(res.output_path);
          videoEl.load();
          videoEl.play().catch(e => console.warn('Play output video catch:', e));
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

        // Fallback: HTML5 file input
        let fileInput = document.getElementById('vidr-hidden-file-input');
        if (!fileInput) {
          fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.id = 'vidr-hidden-file-input';
          fileInput.accept = 'video/*,.mp4,.mkv,.mov,.avi,.ts,.webm,.flv';
          fileInput.style.display = 'none';
          document.body.appendChild(fileInput);
          fileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const path = window.electronAPI?.getPathForFile?.(file) || file.path || file.name;
              applySelectedVideo(path);
            }
          });
        }
        fileInput.click();
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

    document.getElementById('vidr-btn-isolate-bgm')?.addEventListener('click', async () => {
      if (!state.videoPath) {
        window.showToast?.('Vui lòng chọn video nguồn trước.', 'warning');
        vidrLog('Cảnh báo: Chưa chọn video nguồn để tách BGM.', 'warn');
        return;
      }
      const btn = document.getElementById('vidr-btn-isolate-bgm');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '⏳ Đang tách vocal & giữ BGM...';
      vidrLog('Bắt đầu tách giọng nói gốc ra khỏi video nguồn...', 'info');

      try {
        const res = await window.api.removeVocalVideo(state.videoPath);
        if (res && res.status === 'ok') {
          vidrLog(`🎉 Tách giọng nói thành công! Video giữ nhạc nền lưu tại: ${res.output_video_path}`, 'success');
          window.showToast?.('Tách giọng gốc thành công!', 'success');
          const videoEl = document.getElementById('vidr-preview-video');
          if (videoEl) {
            if (videoEl._clipEndHandler) {
              videoEl.removeEventListener('timeupdate', videoEl._clipEndHandler);
              videoEl._clipEndHandler = null;
            }
            videoEl.src = toMediaUrl(res.output_video_path);
            videoEl.load();
            videoEl.play().catch(e => console.warn('Play novocal video catch:', e));
          }
        } else {
          throw new Error(res?.error || 'Không thể tách vocal');
        }
      } catch (err) {
        vidrLog(`Lỗi tách vocal: ${err.message}`, 'error');
        window.showToast?.(`Lỗi: ${err.message}`, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  function init() {
    ensureStyle();
    mountNav();
    mountPage();
    bindEvents();
    renderClipList();
    vidrLog('Tab Video Render đã sẵn sàng hoạt động.', 'info');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
