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
    const legacyFullRange = Number(region.startFrame || 0) === 0 && Number(region.endFrame) === max;
    if (legacyFullRange) region.startFrame = current;
    region.startFrame = clampFrame(region.startFrame ?? current, max);
    region.endFrame = clampFrame(region.endFrame ?? max, max);
    if (region.endFrame < region.startFrame) region.endFrame = region.startFrame;
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

      const fromLabel = document.createElement('span');
      fromLabel.textContent = 'Từ frame';
      fromLabel.style.cssText = 'font-size:9px;color:#8da5bc;white-space:nowrap';
      const from = makeFrameInput(region.startFrame, max, `Frame bắt đầu vùng ${region.label}`);
      const toLabel = document.createElement('span');
      toLabel.textContent = 'Đến frame';
      toLabel.style.cssText = fromLabel.style.cssText;
      const to = makeFrameInput(region.endFrame, max, `Frame kết thúc vùng ${region.label}`);

      const commit = () => {
        let start = clampFrame(from.value, max);
        let end = clampFrame(to.value, max);
        if (end < start) end = start;
        region.startFrame = start;
        region.endFrame = end;
        from.value = String(start);
        to.value = String(end);
        const text = item.querySelector('.region-label');
        if (text) text.textContent = `Vùng #${region.label} (${start}-${end})`;
        list.dataset.p2RegionSignature = '';
      };

      from.addEventListener('change', commit);
      to.addEventListener('change', commit);
      row.append(fromLabel, from, toLabel, to);
      item.appendChild(row);
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
      node.title = 'Kéo để di chuyển vùng';
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
    const target = event.target.closest?.('.region-overlay[data-standalone-region-index]');
    const job = activeJob();
    const geometry = renderedCanvasGeometry();
    if (!target || !job || !isStandaloneJob(job) || job.subtitleMode !== 'manual' || !geometry) return;
    const index = Number(target.dataset.standaloneRegionIndex);
    const region = job.regions?.[index];
    if (!region) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    dragState = {
      target,
      job,
      region,
      geometry,
      startClientX: event.clientX,
      startClientY: event.clientY,
      xmin: Number(region.xmin),
      xmax: Number(region.xmax),
      ymin: Number(region.ymin),
      ymax: Number(region.ymax)
    };
    target.style.cursor = 'grabbing';
  }

  function moveRegion(event) {
    if (!dragState) return;
    const { target, region, geometry } = dragState;
    const dx = (event.clientX - dragState.startClientX) * geometry.scaleToSourceX;
    const dy = (event.clientY - dragState.startClientY) * geometry.scaleToSourceY;
    const width = dragState.xmax - dragState.xmin;
    const height = dragState.ymax - dragState.ymin;
    const xmin = Math.min(geometry.sourceWidth - width, Math.max(0, dragState.xmin + dx));
    const ymin = Math.min(geometry.sourceHeight - height, Math.max(0, dragState.ymin + dy));
    const xmax = xmin + width;
    const ymax = ymin + height;

    region.xmin = Math.round(xmin);
    region.xmax = Math.round(xmax);
    region.ymin = Math.round(ymin);
    region.ymax = Math.round(ymax);

    target.style.left = `${geometry.offsetX + region.xmin * geometry.scaleToDisplayX}px`;
    target.style.top = `${geometry.offsetY + region.ymin * geometry.scaleToDisplayY}px`;
  }

  function endRegionDrag() {
    if (!dragState) return;
    const overlay = document.getElementById('subtitle-overlay');
    const list = document.getElementById('regions-list');
    dragState.target.style.cursor = 'move';
    if (overlay) overlay.dataset.p2RegionSignature = '';
    if (list) list.dataset.p2RegionSignature = '';
    dragState = null;
    queueMicrotask(syncManualUi);
  }

  function installEventGuards() {
    document.addEventListener('click', event => {
      if (!standaloneActive()) return;
      const card = event.target.closest?.('#job-list .job-card');
      if (card) {
        const jobId = card.dataset.jobId || card.dataset.pipelineJobId;
        if (jobId && jobId !== state()?.activeJobId) clearResultPreviewForJobSwitch();
      }
      if (event.target.closest?.('#btn-draw-region, #mode-auto, #mode-manual')) {
        queueMicrotask(syncManualUi);
      }
    }, true);

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
