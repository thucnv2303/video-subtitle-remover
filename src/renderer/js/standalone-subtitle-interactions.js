(function standaloneSubtitleInteractions() {
  'use strict';

  let initialized = false;
  let regionObserver = null;
  let livePreviewPatched = false;
  let dragState = null;

  const state = () => window._appState || null;
  const activeJob = () => state()?.jobs?.find(job => job.id === state()?.activeJobId) || null;
  const standaloneActive = () => state()?.standaloneSubtitleMode === true;
  const isStandaloneJob = job => job?.standaloneSubtitleRemoval === true;

  function maxFrame() {
    return Math.max(0, Number(state()?.videoInfo?.total_frames || 1) - 1);
  }

  function clampFrame(value, max = maxFrame()) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(max, Math.max(0, parsed));
  }

  function renderedCanvasGeometry() {
    const canvas = document.getElementById('canvas-original');
    const overlay = document.getElementById('subtitle-overlay');
    const info = state()?.videoInfo;
    if (!canvas || !overlay || !info?.width || !info?.height) return null;
    const canvasRect = canvas.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvasRect.height <= 0) return null;
    return {
      canvas,
      overlay,
      canvasRect,
      overlayRect,
      offsetX: canvasRect.left - overlayRect.left,
      offsetY: canvasRect.top - overlayRect.top,
      scaleToSourceX: Number(info.width) / canvasRect.width,
      scaleToSourceY: Number(info.height) / canvasRect.height,
      scaleToDisplayX: canvasRect.width / Number(info.width),
      scaleToDisplayY: canvasRect.height / Number(info.height),
      sourceWidth: Number(info.width),
      sourceHeight: Number(info.height)
    };
  }

  function initializeRegionFrameRange(region) {
    if (!region || region._standaloneFrameRangeInitialized) return;
    const max = maxFrame();
    const current = clampFrame(state()?.currentFrameOrig || 0, max);
    let start = region.startFrame != null ? Number(region.startFrame) : current;
    let end = region.endFrame != null ? Number(region.endFrame) : max;
    start = clampFrame(start, max);
    end = clampFrame(end, max);
    if (end < start) end = start;
    region.startFrame = start;
    region.endFrame = end;
    region._standaloneFrameRangeInitialized = true;
  }

  function makeFrameInput(value, max, label) {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = String(max);
    input.value = String(value);
    input.className = 'standalone-frame-input';
    input.setAttribute('aria-label', label);
    input.style.cssText = 'width:100%;height:24px;border:1px solid #334d67;border-radius:5px;background:#0f1e2d;color:#eaf2fb;padding:2px 6px;font-size:9px;box-sizing:border-box';
    return input;
  }

  const REGION_COLORS = [
    '#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4',
    '#ec4899', '#84cc16', '#6366f1', '#14b8a6', '#f97316', '#eab308'
  ];

  function decorateRegionFrameRanges() {
    if (!standaloneActive()) return;
    const job = activeJob();
    const list = document.getElementById('regions-list');
    if (!job || !isStandaloneJob(job) || job.subtitleMode !== 'manual' || !list || !Array.isArray(job.regions)) return;

    const max = maxFrame();
    const items = [...list.querySelectorAll('.p2-region-runtime-item, .region-item')]
      .filter(item => !item.classList.contains('region-empty'));

    job.regions.forEach((region, index) => {
      initializeRegionFrameRange(region);
      const item = items[index];
      if (!item || item.querySelector('.standalone-frame-range')) return;

      const row = document.createElement('div');
      row.className = 'standalone-frame-range';
      row.style.cssText = 'grid-column:1/-1;display:grid;grid-template-columns:auto minmax(58px,1fr) auto minmax(58px,1fr);gap:6px;align-items:center;padding:3px 0 2px 18px';

      const jumpToStart = (e) => {
        if (e) e.stopPropagation();
        const timeline = document.getElementById('timeline-orig');
        if (timeline && region.startFrame != null) {
          timeline.value = region.startFrame;
          timeline.dispatchEvent(new Event('input'));
        }
      };

      const jumpToEnd = (e) => {
        if (e) e.stopPropagation();
        const timeline = document.getElementById('timeline-orig');
        if (timeline && region.endFrame != null) {
          timeline.value = region.endFrame;
          timeline.dispatchEvent(new Event('input'));
        }
      };

      const fromLabel = document.createElement('span');
      fromLabel.textContent = 'Từ frame';
      fromLabel.style.cssText = 'font-size:9px;color:#8da5bc;white-space:nowrap;cursor:pointer;';
      fromLabel.title = 'Click để xem frame bắt đầu';
      fromLabel.addEventListener('click', jumpToStart);

      const from = makeFrameInput(region.startFrame, max, `Frame bắt đầu vùng ${region.label}`);
      from.addEventListener('focus', jumpToStart);

      const toLabel = document.createElement('span');
      toLabel.textContent = 'Đến frame';
      toLabel.style.cssText = 'font-size:9px;color:#8da5bc;white-space:nowrap;cursor:pointer;';
      toLabel.title = 'Click để xem frame kết thúc';
      toLabel.addEventListener('click', jumpToEnd);

      const to = makeFrameInput(region.endFrame, max, `Frame kết thúc vùng ${region.label}`);
      to.addEventListener('focus', jumpToEnd);

      const commit = () => {
        let start = clampFrame(from.value, max);
        let end = clampFrame(to.value, max);
        if (end < start) end = start;
        region.startFrame = start;
        region.endFrame = end;
        from.value = String(start);
        to.value = String(end);
        const text = item.querySelector('.region-label');
        if (text) {
          const color = REGION_COLORS[index % REGION_COLORS.length];
          text.innerHTML = `<span style="background:${color};color:#fff;padding:1px 5px;border-radius:3px;font-size:9px;font-weight:700;">#${region.label || (index + 1)}</span> <span class="p2-jump-start" style="cursor:pointer;text-decoration:underline dotted;" title="Nhảy đến frame đầu">(${start}</span>-<span class="p2-jump-end" style="cursor:pointer;text-decoration:underline dotted;" title="Nhảy đến frame cuối">${end})</span>`;
          text.querySelector('.p2-jump-start')?.addEventListener('click', (e) => { e.stopPropagation(); jumpToStart(); });
          text.querySelector('.p2-jump-end')?.addEventListener('click', (e) => { e.stopPropagation(); jumpToEnd(); });
        }
        const overlay = document.getElementById('subtitle-overlay');
        const node = overlay?.querySelector?.(`.region-overlay[data-standalone-region-index="${index}"]`);
        if (node) {
          node.dataset.startFrame = String(start);
          node.dataset.endFrame = String(end);
        }
        const timeline = document.getElementById('timeline-orig');
        const currentFrame = timeline ? Number(timeline.value || 0) : 0;
        overlay?.querySelectorAll?.('.region-overlay').forEach(n => {
          const s = Number(n.dataset.startFrame ?? -Infinity);
          const e = Number(n.dataset.endFrame ?? Infinity);
          n.style.display = (currentFrame >= s && currentFrame <= e) ? 'block' : 'none';
        });
        list.dataset.p2RegionSignature = '';
      };

      from.addEventListener('change', commit);
      to.addEventListener('change', commit);
      row.append(fromLabel, from, toLabel, to);
      item.appendChild(row);

      item.style.cursor = 'pointer';
      item.addEventListener('click', (e) => {
        if (e.target.closest('input, select, button')) return;
        jumpToStart();
      });
    });
  }

  const HANDLE_POSITIONS = ['nw', 'ne', 'se', 'sw', 'n', 's', 'w', 'e'];

  function ensureResizeHandles(node, color) {
    if (node.querySelector('.region-resize-handle')) return;
    const size = 8;
    const half = size / 2;
    HANDLE_POSITIONS.forEach(pos => {
      const handle = document.createElement('div');
      handle.className = `region-resize-handle handle-${pos}`;
      handle.dataset.handle = pos;
      let posStyle = '';
      let cursor = 'nwse-resize';
      if (pos === 'nw') { posStyle = `top:-${half}px;left:-${half}px;`; cursor = 'nwse-resize'; }
      else if (pos === 'ne') { posStyle = `top:-${half}px;right:-${half}px;`; cursor = 'nesw-resize'; }
      else if (pos === 'se') { posStyle = `bottom:-${half}px;right:-${half}px;`; cursor = 'nwse-resize'; }
      else if (pos === 'sw') { posStyle = `bottom:-${half}px;left:-${half}px;`; cursor = 'nesw-resize'; }
      else if (pos === 'n') { posStyle = `top:-${half}px;left:calc(50% - ${half}px);`; cursor = 'ns-resize'; }
      else if (pos === 's') { posStyle = `bottom:-${half}px;left:calc(50% - ${half}px);`; cursor = 'ns-resize'; }
      else if (pos === 'w') { posStyle = `top:calc(50% - ${half}px);left:-${half}px;`; cursor = 'ew-resize'; }
      else if (pos === 'e') { posStyle = `top:calc(50% - ${half}px);right:-${half}px;`; cursor = 'ew-resize'; }

      handle.style.cssText = `position:absolute;width:${size}px;height:${size}px;background:#ffffff;border:1.5px solid ${color || '#3b82f6'};border-radius:2px;cursor:${cursor};pointer-events:auto;z-index:20;${posStyle}box-shadow:0 0 2px rgba(0,0,0,0.6);box-sizing:border-box;`;
      node.appendChild(handle);
    });
  }

  function syncOverlayInteractivity() {
    if (!standaloneActive()) return;
    const job = activeJob();
    const overlay = document.getElementById('subtitle-overlay');
    if (!job || !isStandaloneJob(job) || job.subtitleMode !== 'manual' || !overlay) return;
    const regions = [...overlay.querySelectorAll('.region-overlay[data-p2-region-runtime], [data-p2-region-runtime].region-overlay')];
    regions.forEach((node, index) => {
      node.dataset.standaloneRegionIndex = String(index);
      node.style.pointerEvents = 'auto';
      node.style.cursor = 'move';
      node.title = 'Kéo để di chuyển, kéo các góc/cạnh để thay đổi kích thước';
      const color = REGION_COLORS[index % REGION_COLORS.length];
      ensureResizeHandles(node, color);
    });
  }

  function syncManualUi() {
    decorateRegionFrameRanges();
    syncOverlayInteractivity();
    syncCrosshair();
  }

  function syncCrosshair() {
    const s = state();
    const job = activeJob();
    const canvas = document.getElementById('canvas-inner-orig');
    if (!canvas) return;
    const enabled = Boolean(standaloneActive() && isStandaloneJob(job) && job?.subtitleMode === 'manual' && s?.isDrawing);
    canvas.style.cursor = enabled ? 'crosshair' : '';
  }

  function clearResultPreviewForJobSwitch() {
    const canvas = document.getElementById('canvas-result');
    const ctx = canvas?.getContext?.('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('result-placeholder')?.classList.remove('hidden');
    const timeline = document.getElementById('timeline-result');
    if (timeline) {
      timeline.value = 0;
      timeline.disabled = true;
    }
    ['btn-play-result', 'btn-prev-result', 'btn-next-result'].forEach(id => {
      const button = document.getElementById(id);
      if (button) button.disabled = true;
    });
  }

  function patchLivePreview() {
    if (livePreviewPatched || typeof window.api?.getLivePreview !== 'function') return false;
    const original = window.api.getLivePreview.bind(window.api);
    window.api.getLivePreview = async function standaloneJobScopedLivePreview(...args) {
      const s = state();
      if (standaloneActive() && s?.processingJobId && s.processingJobId !== s.activeJobId) {
        return new Blob([], { type: 'image/jpeg' });
      }
      return original(...args);
    };
    livePreviewPatched = true;
    return true;
  }

  function beginRegionDrag(event) {
    if (!standaloneActive() || event.button !== 0) return;
    const handle = event.target.closest?.('.region-resize-handle');
    const target = event.target.closest?.('.region-overlay[data-standalone-region-index]');
    const job = activeJob();
    const geometry = renderedCanvasGeometry();
    if (!target || !job || !isStandaloneJob(job) || job.subtitleMode !== 'manual' || !geometry) return;
    const index = Number(target.dataset.standaloneRegionIndex);
    const region = job.regions?.[index];
    if (!region) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (typeof window.setActiveRegionIndex === 'function') {
      window.setActiveRegionIndex(index);
    }
    const listItem = document.querySelector(`.p2-region-runtime-item[data-standalone-region-index="${index}"]`);
    if (listItem) listItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const mode = handle ? handle.dataset.handle : 'move';
    dragState = {
      target,
      job,
      region,
      geometry,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      xmin: Number(region.xmin),
      xmax: Number(region.xmax),
      ymin: Number(region.ymin),
      ymax: Number(region.ymax)
    };
    if (mode === 'move') {
      target.style.cursor = 'grabbing';
    }
  }

  function moveRegion(event) {
    if (!dragState) return;
    const { target, region, geometry, mode } = dragState;
    const dx = (event.clientX - dragState.startClientX) * geometry.scaleToSourceX;
    const dy = (event.clientY - dragState.startClientY) * geometry.scaleToSourceY;
    
    let xmin = dragState.xmin;
    let xmax = dragState.xmax;
    let ymin = dragState.ymin;
    let ymax = dragState.ymax;
    const MIN_SIZE = 10;

    if (mode === 'move') {
      const width = dragState.xmax - dragState.xmin;
      const height = dragState.ymax - dragState.ymin;
      xmin = Math.min(geometry.sourceWidth - width, Math.max(0, dragState.xmin + dx));
      ymin = Math.min(geometry.sourceHeight - height, Math.max(0, dragState.ymin + dy));
      xmax = xmin + width;
      ymax = ymin + height;
    } else {
      if (mode.includes('e')) {
        xmax = Math.min(geometry.sourceWidth, Math.max(dragState.xmin + MIN_SIZE, dragState.xmax + dx));
      }
      if (mode.includes('w')) {
        xmin = Math.max(0, Math.min(dragState.xmax - MIN_SIZE, dragState.xmin + dx));
      }
      if (mode.includes('s')) {
        ymax = Math.min(geometry.sourceHeight, Math.max(dragState.ymin + MIN_SIZE, dragState.ymax + dy));
      }
      if (mode.includes('n')) {
        ymin = Math.max(0, Math.min(dragState.ymax - MIN_SIZE, dragState.ymin + dy));
      }
    }

    region.xmin = Math.round(xmin);
    region.xmax = Math.round(xmax);
    region.ymin = Math.round(ymin);
    region.ymax = Math.round(ymax);

    target.style.left = `${geometry.offsetX + region.xmin * geometry.scaleToDisplayX}px`;
    target.style.top = `${geometry.offsetY + region.ymin * geometry.scaleToDisplayY}px`;
    target.style.width = `${(region.xmax - region.xmin) * geometry.scaleToDisplayX}px`;
    target.style.height = `${(region.ymax - region.ymin) * geometry.scaleToDisplayY}px`;
  }

  function endRegionDrag() {
    if (!dragState) return;
    const overlay = document.getElementById('subtitle-overlay');
    const list = document.getElementById('regions-list');
    if (dragState.target) dragState.target.style.cursor = 'move';
    if (overlay) overlay.dataset.p2RegionSignature = '';
    if (list) list.dataset.p2RegionSignature = '';
    dragState = null;
    queueMicrotask(syncManualUi);
  }

  function resolveJobVideoPath(job) {
    if (!job) return '';
    return job.filePath || job.videoPath || job.inputPath || job.path || state()?.currentVideoPath || state()?.videoPath || '';
  }

  async function handleAutoScanRegions() {
    const s = state();
    const job = activeJob();
    const vpath = resolveJobVideoPath(job);
    if (!s || !job || !vpath) {
      if (window.showToast) window.showToast('Vui lòng mở hoặc chọn video trước khi quét phụ đề!', 'warning');
      return;
    }
    const btn = document.getElementById('btn-auto-scan-regions');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Đang quét...';
    }
    try {
      const currentMask = document.getElementById('mask-mode')?.value || job.maskMode || 'box';
      const resp = await fetch('http://127.0.0.1:8765/api/auto-detect-regions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_path: vpath, sample_step: 12, padding: 12, mask_mode: currentMask })
      });
      const data = await resp.json();
      if (data.status === 'ok' && Array.isArray(data.regions) && data.regions.length > 0) {
        job.regions = data.regions.map(r => ({
          ...r,
          maskMode: currentMask
        }));
        job.subtitleMode = 'manual';
        job.maskMode = currentMask;
        const list = document.getElementById('regions-list');
        const overlay = document.getElementById('subtitle-overlay');
        if (list) list.dataset.p2RegionSignature = '';
        if (overlay) overlay.dataset.p2RegionSignature = '';
        if (typeof window.renderManualRegions === 'function') {
          window.renderManualRegions(job);
        }
        syncManualUi();
        if (window.showToast) {
          window.showToast(`Đã tự động tìm thấy ${data.regions.length} vùng phụ đề (chế độ: ${currentMask})!`, 'success');
        }
      } else {
        if (window.showToast) {
          window.showToast(data.message || 'Không tìm thấy phụ đề nào trong video!', 'info');
        }
      }
    } catch (err) {
      console.error('Lỗi khi tự động quét box:', err);
      if (window.showToast) window.showToast('Lỗi kết nối khi quét phụ đề!', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚡ Tự quét Box';
      }
    }
  }

  function bindGlobalMaskModeSync() {
    const maskSelect = document.getElementById('mask-mode');
    if (maskSelect && !maskSelect.dataset.p2MaskSyncBound) {
      maskSelect.dataset.p2MaskSyncBound = 'true';
      maskSelect.addEventListener('change', () => {
        const job = activeJob();
        if (!job) return;
        const newMask = maskSelect.value || 'box';
        job.maskMode = newMask;
        if (Array.isArray(job.regions) && job.regions.length > 0) {
          job.regions.forEach(r => { r.maskMode = newMask; });
          const list = document.getElementById('regions-list');
          if (list) list.dataset.p2RegionSignature = '';
          if (typeof window.renderManualRegions === 'function') {
            window.renderManualRegions(job);
          }
        }
      });
    }
  }

  function installEventGuards() {
    document.addEventListener('click', event => {
      if (!standaloneActive()) return;
      const card = event.target.closest?.('#job-list .job-card');
      if (card) {
        const jobId = card.dataset.jobId || card.dataset.pipelineJobId;
        if (jobId && jobId !== state()?.activeJobId) clearResultPreviewForJobSwitch();
      }
      if (event.target.closest?.('#btn-draw-region, #mode-auto, #mode-manual, #btn-auto-scan-regions')) {
        queueMicrotask(syncManualUi);
      }
    }, true);

    document.getElementById('btn-auto-scan-regions')?.addEventListener('click', handleAutoScanRegions);
    bindGlobalMaskModeSync();
    document.addEventListener('mousedown', beginRegionDrag, true);
    document.addEventListener('mousemove', moveRegion, true);
    document.addEventListener('mouseup', endRegionDrag, true);
    window.addEventListener('blur', endRegionDrag);

    document.getElementById('canvas-inner-orig')?.addEventListener('mouseenter', syncCrosshair);
    document.getElementById('canvas-inner-orig')?.addEventListener('mousemove', syncCrosshair);
  }

  function installObservers() {
    const list = document.getElementById('regions-list');
    const overlay = document.getElementById('subtitle-overlay');
    if ((!list && !overlay) || regionObserver) return;
    let scheduled = false;
    regionObserver = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        syncManualUi();
      });
    });
    if (list) regionObserver.observe(list, { childList: true, subtree: true });
    if (overlay) regionObserver.observe(overlay, { childList: true, subtree: true });
  }

  function init() {
    if (initialized || !state() || !window.api) return false;
    initialized = true;
    installEventGuards();
    installObservers();
    patchLivePreview();
    syncManualUi();

    if (!livePreviewPatched) {
      const timer = setInterval(() => {
        if (patchLivePreview()) clearInterval(timer);
      }, 50);
      setTimeout(() => clearInterval(timer), 5000);
    }
    return true;
  }

  if (!init()) {
    const timer = setInterval(() => {
      if (init()) clearInterval(timer);
    }, 50);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();
