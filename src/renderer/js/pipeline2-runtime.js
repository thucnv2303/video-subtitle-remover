(function pipeline2RuntimeEnhancer() {
  'use strict';

  const PREVIEW_INTERVAL_MS = 850;
  const STATUS_INTERVAL_MS = 1800;
  const UI_TICK_MS = 500;
  const REGION_COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#ef4444'];

  let installed = false;
  let previewBusy = false;
  let lastPreviewAt = 0;
  let lastStatusAt = 0;
  let statusBusy = false;
  let liveRow = null;
  let liveJobId = null;
  let lastStage = 'Đang chuẩn bị';
  let lastFrame = null;
  let gpuInfo = null;
  let telemetryJobId = null;
  let unsubscribeWs = null;
  let manualSelectionStart = null;
  let manualRegionUiJobId = null;
  let manualRegionObserversInstalled = false;

  function state() {
    return window._appState || null;
  }

  function currentP2Job() {
    const s = state();
    if (!s?.processingJobId) return null;
    const job = s.jobs?.find(item => item.id === s.processingJobId) || null;
    if (!job) return null;
    const isP2 = job.pipeline === 2 || ['queued', 'processing', 'error', 'finished'].includes(job.p2Status);
    return isP2 ? job : null;
  }

  function activeJob() {
    const s = state();
    if (!s?.activeJobId) return null;
    return s.jobs?.find(item => item.id === s.activeJobId) || null;
  }

  function formatElapsed(job) {
    const s = state();
    const started = Number(s?.processingStartTime || job?._p2RuntimeStartedAt || 0);
    if (!started) return '00:00';
    const elapsed = Math.max(0, Math.floor((Date.now() - started) / 1000));
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const sec = elapsed % 60;
    return h > 0
      ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  function algorithmLabel(job) {
    return ({
      'sttn-auto': 'STTN Auto',
      'sttn-det': 'STTN Detect',
      lama: 'LaMa',
      propainter: 'ProPainter',
      opencv: 'OpenCV'
    })[job?.algorithm] || job?.algorithm || 'P2';
  }

  function logOutput() {
    return document.getElementById('log-output');
  }

  function ensureLiveRow(job) {
    const output = logOutput();
    if (!output || !job) return null;
    if (!liveRow?.isConnected || liveJobId !== job.id) {
      liveRow = document.createElement('div');
      liveRow.className = 'log-entry log-info';
      liveRow.dataset.logCat = 'inpaint';
      liveRow.dataset.p2LiveProgress = 'true';
      output.appendChild(liveRow);
      liveJobId = job.id;
    }
    return liveRow;
  }

  function updateLiveRow(job, pct, stage = lastStage, frame = lastFrame) {
    const row = ensureLiveRow(job);
    if (!row) return;
    lastStage = stage || lastStage;
    if (frame !== undefined && frame !== null) lastFrame = frame;
    const now = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    const accelerator = gpuInfo?.gpu_available ? 'CUDA' : 'CPU';
    const totalFrames = Number(state()?.videoInfo?.total_frames || 0);
    const frameText = Number.isFinite(Number(lastFrame)) && totalFrames > 0
      ? ` • frame ${Math.min(Number(lastFrame) + 1, totalFrames)}/${totalFrames}`
      : '';
    row.textContent = `[${now}] [P2] ${algorithmLabel(job)} • ${Math.round(Number(pct) || 0)}% • ${formatElapsed(job)} • ${accelerator}${frameText} • ${lastStage}`;
    const output = logOutput();
    if (output) output.scrollTop = output.scrollHeight;
  }

  function finishLiveRow(job, message, type = 'success') {
    if (!job || !liveRow?.isConnected || liveJobId !== job.id) return;
    const now = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    liveRow.className = `log-entry log-${type}`;
    liveRow.textContent = `[${now}] [P2] ${message}`;
    delete liveRow.dataset.p2LiveProgress;
    liveRow = null;
    liveJobId = null;
    lastStage = 'Đang chuẩn bị';
    lastFrame = null;
  }

  function isNoisyAccessLog(text) {
    const successfulPolling = /\bINFO:\s+127\.0\.0\.1:\d+\s+-\s+"(?:GET|POST) \/api\/(?:status|preview|health|tts\/status|gpu-info|frame\/[^\s?"]+)\b[^\"]*HTTP\/1\.1"\s+200\s+OK/i.test(text);
    const expectedPreviewNotReady = /\bINFO:\s+127\.0\.0\.1:\d+\s+-\s+"GET \/api\/preview\b[^\"]*HTTP\/1\.1"\s+404\s+Not Found/i.test(text);
    return successfulPolling || expectedPreviewNotReady;
  }

  function isHeartbeat(text) {
    return /\[Inpaint\]\s+Đang xử lý|processing frame\s+\d+\s+to\s+\d+|Processing:\s*\d+\s*-\s*\d+\s*\/\s*Total|(?:processing|xử lý)[^\n]*frame\s+\d+\s*\/\s*\d+/i.test(text);
  }

  function extractHeartbeat(text, job) {
    const pctMatch = text.match(/tiến độ:\s*(\d+(?:\.\d+)?)%/i);
    const frameRange = text.match(/processing frame\s+(\d+)\s+to\s+(\d+)/i);
    const processingRange = text.match(/Processing:\s*(\d+)\s*-\s*(\d+)\s*\/\s*Total:\s*(\d+)/i);
    const simpleFrame = text.match(/frame\s+(\d+)\s*\/\s*(\d+)/i);
    if (frameRange) {
      lastFrame = Math.max(0, Number(frameRange[2]) - 1);
      lastStage = `Xóa subtitle frame ${frameRange[1]}–${frameRange[2]}`;
    } else if (processingRange) {
      lastFrame = Math.max(0, Number(processingRange[2]) - 1);
      lastStage = `Xử lý frame ${processingRange[1]}–${processingRange[2]}`;
    } else if (simpleFrame) {
      lastFrame = Math.max(0, Number(simpleFrame[1]) - 1);
      lastStage = `Xử lý frame ${simpleFrame[1]}/${simpleFrame[2]}`;
    } else {
      lastStage = 'Đang xử lý video';
    }
    const pct = pctMatch ? Number(pctMatch[1]) : Number(job?.progress || job?.p2Progress || 0);
    updateLiveRow(job, pct, lastStage, lastFrame);
  }

  function installLogCoalescing() {
    const output = logOutput();
    if (!output || output.dataset.p2Coalescing === 'true') return;
    output.dataset.p2Coalescing = 'true';

    new MutationObserver((mutations) => {
      const job = currentP2Job();
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.classList.contains('log-entry')) continue;
          if (node.dataset.p2LiveProgress === 'true') continue;
          const text = node.textContent || '';
          if (isNoisyAccessLog(text)) {
            node.remove();
            continue;
          }
          if (job && isHeartbeat(text)) {
            extractHeartbeat(text, job);
            node.remove();
          }
        }
      }
    }).observe(output, { childList: true });
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
      scaleToDisplayY: canvasRect.height / Number(info.height)
    };
  }

  function pointerInsideCanvas(event, geometry) {
    return event.clientX >= geometry.canvasRect.left
      && event.clientX <= geometry.canvasRect.right
      && event.clientY >= geometry.canvasRect.top
      && event.clientY <= geometry.canvasRect.bottom;
  }

  function pointerToCanvas(event, geometry) {
    const x = Math.min(geometry.canvasRect.width, Math.max(0, event.clientX - geometry.canvasRect.left));
    const y = Math.min(geometry.canvasRect.height, Math.max(0, event.clientY - geometry.canvasRect.top));
    return { x, y };
  }

  function drawSelectionPreview(start, end, geometry) {
    let preview = document.getElementById('region-preview');
    if (!preview) {
      preview = document.createElement('div');
      preview.id = 'region-preview';
      geometry.overlay.appendChild(preview);
    }
    const left = geometry.offsetX + Math.min(start.x, end.x);
    const top = geometry.offsetY + Math.min(start.y, end.y);
    preview.style.cssText = `position:absolute;pointer-events:none;z-index:10;border:2px dashed #7c3aed;left:${left}px;top:${top}px;width:${Math.abs(end.x-start.x)}px;height:${Math.abs(end.y-start.y)}px`;
  }

  function regionUiSignature(job) {
    return (job?.regions || []).map(region => [
      region.xmin,
      region.xmax,
      region.ymin,
      region.ymax,
      region.startFrame,
      region.endFrame,
      region.maskMode || job?.maskMode || 'box'
    ].join(':')).join('|');
  }

  function renderManualRegions(job) {
    const list = document.getElementById('regions-list');
    const geometry = renderedCanvasGeometry();
    if (!job || job.subtitleMode !== 'manual' || !list || !geometry) return;

    const signature = regionUiSignature(job);
    const expectedListNodes = job.regions.length || 1;
    const listReady = list.dataset.p2RegionSignature === signature
      && list.querySelectorAll('[data-p2-region-runtime]').length === expectedListNodes;
    if (!listReady) {
      list.innerHTML = '';
      if (!job.regions.length) {
        const empty = document.createElement('div');
        empty.className = 'region-empty';
        empty.dataset.p2RegionRuntime = 'true';
        empty.textContent = 'Bấm "+ Vẽ vùng" rồi kéo chuột trên video';
        list.appendChild(empty);
      } else {
        job.regions.forEach((region, index) => {
          const item = document.createElement('div');
          item.className = 'region-item p2-region-runtime-item';
          item.dataset.p2RegionRuntime = 'true';
          item.style.cssText = 'display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;gap:6px;padding:5px 0';

          const dot = document.createElement('span');
          dot.className = 'region-dot';
          dot.style.background = REGION_COLORS[index % REGION_COLORS.length];

          const label = document.createElement('span');
          label.className = 'region-label';
          label.textContent = `Vùng #${region.label} (${region.startFrame}-${region.endFrame})`;

          const mask = document.createElement('select');
          mask.className = 'p2-region-mask-select';
          mask.setAttribute('aria-label', `Mask cho vùng ${region.label}`);
          mask.style.cssText = 'min-width:72px;height:26px;border:1px solid #334d67;border-radius:5px;background:#0f1e2d;color:#eaf2fb;padding:2px 5px;font-size:9px';
          [['box','Box'], ['tight','Tight'], ['soft','Soft']].forEach(([value, text]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = text;
            mask.appendChild(option);
          });
          mask.value = region.maskMode || job.maskMode || 'box';
          mask.addEventListener('change', () => {
            region.maskMode = mask.value;
            list.dataset.p2RegionSignature = '';
          });

          const remove = document.createElement('button');
          remove.className = 'btn-region-del';
          remove.type = 'button';
          remove.textContent = '✕';
          remove.addEventListener('click', () => {
            job.regions.splice(index, 1);
            list.dataset.p2RegionSignature = '';
            geometry.overlay.dataset.p2RegionSignature = '';
            renderManualRegions(job);
          });

          item.append(dot, label, mask, remove);
          list.appendChild(item);
        });
      }
      list.dataset.p2RegionSignature = signature;
    }

    const overlayReady = geometry.overlay.dataset.p2RegionSignature === signature
      && geometry.overlay.querySelectorAll('[data-p2-region-runtime]').length === job.regions.length;
    if (!overlayReady) {
      geometry.overlay.querySelectorAll('.region-overlay,[data-p2-region-runtime]').forEach(node => node.remove());
      job.regions.forEach((region, index) => {
        const div = document.createElement('div');
        div.className = 'region-overlay';
        div.dataset.p2RegionRuntime = 'true';
        div.style.cssText = `position:absolute;border:2px solid ${REGION_COLORS[index % REGION_COLORS.length]};pointer-events:none;left:${geometry.offsetX + region.xmin * geometry.scaleToDisplayX}px;top:${geometry.offsetY + region.ymin * geometry.scaleToDisplayY}px;width:${(region.xmax-region.xmin) * geometry.scaleToDisplayX}px;height:${(region.ymax-region.ymin) * geometry.scaleToDisplayY}px;`;
        geometry.overlay.appendChild(div);
      });
      geometry.overlay.dataset.p2RegionSignature = signature;
    }
    manualRegionUiJobId = job.id;
  }

  function syncManualRegionUi() {
    const job = activeJob();
    if (!job || job.subtitleMode !== 'manual') return;
    renderManualRegions(job);
  }

  function installManualRegionObservers() {
    if (manualRegionObserversInstalled) return;
    const overlay = document.getElementById('subtitle-overlay');
    const list = document.getElementById('regions-list');
    if (!overlay || !list) return;
    manualRegionObserversInstalled = true;

    let scheduled = false;
    const scheduleSync = () => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        const job = activeJob();
        if (!job || job.subtitleMode !== 'manual') return;
        const geometry = renderedCanvasGeometry();
        if (!geometry) return;
        const signature = regionUiSignature(job);
        const expectedListNodes = job.regions.length || 1;
        const listReady = list.dataset.p2RegionSignature === signature
          && list.querySelectorAll('[data-p2-region-runtime]').length === expectedListNodes;
        const overlayReady = overlay.dataset.p2RegionSignature === signature
          && overlay.querySelectorAll('[data-p2-region-runtime]').length === job.regions.length;
        if (!listReady || !overlayReady) renderManualRegions(job);
      });
    };

    new MutationObserver(scheduleSync).observe(list, { childList: true });
    new MutationObserver(scheduleSync).observe(overlay, { childList: true });
  }

  function installManualRegionGeometry() {
    const canvasInner = document.getElementById('canvas-inner-orig');
    if (!canvasInner || canvasInner.dataset.p2ManualGeometry === 'true') return;
    canvasInner.dataset.p2ManualGeometry = 'true';

    canvasInner.addEventListener('mousedown', (event) => {
      const s = state();
      const job = activeJob();
      if (!s?.isDrawing || !job || job.subtitleMode !== 'manual') return;

      event.preventDefault();
      event.stopImmediatePropagation();
      s.isSelecting = false;
      s.selectionStart = null;
      manualSelectionStart = null;

      const geometry = renderedCanvasGeometry();
      if (!geometry || !pointerInsideCanvas(event, geometry)) return;
      manualSelectionStart = pointerToCanvas(event, geometry);
    }, true);

    canvasInner.addEventListener('mousemove', (event) => {
      if (!manualSelectionStart) return;
      const geometry = renderedCanvasGeometry();
      if (!geometry) return;
      drawSelectionPreview(manualSelectionStart, pointerToCanvas(event, geometry), geometry);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    canvasInner.addEventListener('mouseup', (event) => {
      if (!manualSelectionStart) return;
      const s = state();
      const job = activeJob();
      const geometry = renderedCanvasGeometry();
      document.getElementById('region-preview')?.remove();
      if (!s || !job || job.subtitleMode !== 'manual' || !geometry || !s.videoInfo) {
        manualSelectionStart = null;
        return;
      }
      const end = pointerToCanvas(event, geometry);
      const start = manualSelectionStart;
      manualSelectionStart = null;

      const xmin = Math.round(Math.min(start.x, end.x) * geometry.scaleToSourceX);
      const xmax = Math.round(Math.max(start.x, end.x) * geometry.scaleToSourceX);
      const ymin = Math.round(Math.min(start.y, end.y) * geometry.scaleToSourceY);
      const ymax = Math.round(Math.max(start.y, end.y) * geometry.scaleToSourceY);
      if (xmax - xmin >= 10 && ymax - ymin >= 5) {
        job.regions.push({
          xmin,
          xmax,
          ymin,
          ymax,
          startFrame: 0,
          endFrame: Number(s.videoInfo.total_frames || 1) - 1,
          label: job.regions.length + 1,
          maskMode: document.getElementById('mask-mode')?.value || job.maskMode || 'box'
        });
      }
      s.isDrawing = false;
      s.isSelecting = false;
      s.selectionStart = null;
      document.getElementById('btn-draw-region')?.classList.remove('active');
      geometry.canvas.style.cursor = 'default';
      const list = document.getElementById('regions-list');
      if (list) list.dataset.p2RegionSignature = '';
      geometry.overlay.dataset.p2RegionSignature = '';
      renderManualRegions(job);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);

    window.addEventListener('resize', () => {
      const overlay = document.getElementById('subtitle-overlay');
      if (overlay) overlay.dataset.p2RegionSignature = '';
      syncManualRegionUi();
    });
  }

  function installPerRegionMaskPayload() {
    if (!window.api?.startProcessBatch || window.api.startProcessBatch.__p2RegionMaskWrapped) return;
    const originalStartProcessBatch = window.api.startProcessBatch.bind(window.api);
    const wrapped = async (jobs) => {
      const s = state();
      const job = s?.processingJobId ? s.jobs?.find(item => item.id === s.processingJobId) : null;
      if (job?.subtitleMode === 'manual' && job.regions?.length && Array.isArray(jobs)) {
        const region = job.regions[Math.max(0, Number(s.processingPassIndex || 0))];
        if (region) {
          jobs = jobs.map((payload, index) => index === 0
            ? { ...payload, mask_mode: region.maskMode || job.maskMode || 'box' }
            : payload);
        }
      }
      return originalStartProcessBatch(jobs);
    };
    wrapped.__p2RegionMaskWrapped = true;
    window.api.startProcessBatch = wrapped;
  }

  async function loadGpuTelemetry(job) {
    if (!job || telemetryJobId === job.id || !window.api?.gpuInfo) return;
    telemetryJobId = job.id;
    try {
      gpuInfo = await window.api.gpuInfo();
      const accelerator = gpuInfo?.gpu_available ? 'CUDA' : 'CPU';
      const detail = gpuInfo?.gpu_available
        ? `${gpuInfo.gpu_name || 'NVIDIA GPU'}; VRAM=${gpuInfo.vram_total || '?'}; CUDA=${gpuInfo.cuda_version || '?'}; expected device=cuda:0`
        : 'Không phát hiện CUDA; engine sẽ dùng CPU nếu backend cho phép.';
      window.addLog?.(`[P2] Accelerator preflight: ${accelerator}; ${detail}`, gpuInfo?.gpu_available ? 'success' : 'warning');
    } catch (err) {
      window.addLog?.(`[P2] Không đọc được accelerator preflight: ${err?.message || err}`, 'warning');
    }
  }

  async function drawLivePreview() {
    const job = currentP2Job();
    if (!job || job.status !== 'processing' || previewBusy || !window.api?.getLivePreview) return;
    const now = Date.now();
    if (now - lastPreviewAt < PREVIEW_INTERVAL_MS) return;
    lastPreviewAt = now;
    previewBusy = true;
    try {
      const blob = await window.api.getLivePreview();
      if (!blob || !blob.size) return;
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.getElementById('canvas-result');
          const ctx = canvas?.getContext?.('2d');
          if (!canvas || !ctx) return;
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          document.getElementById('result-placeholder')?.classList.add('hidden');
          const info = document.getElementById('frame-info-result');
          if (info) info.textContent = lastFrame !== null ? `LIVE • frame ${Number(lastFrame) + 1}` : 'LIVE';
        } finally {
          URL.revokeObjectURL(url);
        }
      };
      img.onerror = () => URL.revokeObjectURL(url);
      img.src = url;
    } catch {
      // 404 is normal until the backend has produced its first preview frame.
    } finally {
      previewBusy = false;
    }
  }

  function failP2Job(job, message) {
    if (!job || job._p2RuntimeFailed) return;
    job._p2RuntimeFailed = true;
    job.errorMessage = message;
    job.status = 'error';
    job.p2Status = 'error';
    const s = state();
    if (s?.processingJobId === job.id) s.processingJobId = null;
    if (s?.pollTimer) {
      clearInterval(s.pollTimer);
      s.pollTimer = null;
    }
    if (s?.processingTimerInterval) {
      clearInterval(s.processingTimerInterval);
      s.processingTimerInterval = null;
    }
    if (s) {
      s.processingStartTime = null;
      s.processingPassIndex = 0;
    }
    const cancel = document.getElementById('btn-cancel');
    if (cancel) cancel.textContent = '⬛ Hủy xử lý';
    const eta = document.getElementById('progress-eta');
    if (eta) eta.textContent = message;
    finishLiveRow(job, `FAIL • ${message}`, 'error');
    window.addLog?.(`[P2] ❌ ${message}`, 'error');
    window.renderJobList?.();
    window.updateStartButton?.();
    window.pipelineStateGate?.scheduleSync?.();
  }

  async function inspectBackendStatus() {
    const job = currentP2Job();
    if (!job || job.status !== 'processing' || statusBusy || !window.api?.getStatus) return;
    const now = Date.now();
    if (now - lastStatusAt < STATUS_INTERVAL_MS) return;
    lastStatusAt = now;
    statusBusy = true;
    try {
      const status = await window.api.getStatus();
      const backendJob = status?.current_job_id && status?.jobs ? status.jobs[status.current_job_id] : null;
      if (!backendJob) return;
      const backendStatus = String(backendJob.status || '');
      if (/^error\b/i.test(backendStatus)) {
        const detail = backendStatus.replace(/^error\s*:?\s*/i, '').trim() || 'Pipeline 2 backend báo lỗi.';
        failP2Job(job, detail);
        return;
      }
      const pct = Number(backendJob.progress || job.progress || 0);
      job.progress = pct;
      if (job.p2Status === 'processing') job.p2Progress = pct;
      updateLiveRow(job, pct, lastStage, lastFrame);
    } catch {
      // Existing app polling remains authoritative for transient transport failures.
    } finally {
      statusBusy = false;
    }
  }

  function handleWs(msg) {
    if (msg?.type !== 'progress' || !msg.data) return;
    const job = currentP2Job();
    if (!job || job.status !== 'processing') return;
    const data = msg.data;
    const pct = Number(data.progress || job.progress || 0);
    if (data.frame !== undefined) lastFrame = Number(data.frame);
    if (data.stage) lastStage = String(data.stage);
    else if (pct > 0) lastStage = 'Đang xóa subtitle';
    updateLiveRow(job, pct, lastStage, lastFrame);
    drawLivePreview();
  }

  function tick() {
    installManualRegionGeometry();
    installManualRegionObservers();
    installPerRegionMaskPayload();

    const selected = activeJob();
    if (selected?.subtitleMode === 'manual') {
      if (manualRegionUiJobId !== selected.id) {
        const list = document.getElementById('regions-list');
        const overlay = document.getElementById('subtitle-overlay');
        if (list) list.dataset.p2RegionSignature = '';
        if (overlay) overlay.dataset.p2RegionSignature = '';
      }
      syncManualRegionUi();
    }

    const job = currentP2Job();
    if (!job) {
      if (liveRow?.isConnected && liveJobId) {
        const previous = state()?.jobs?.find(item => item.id === liveJobId);
        if (previous?.status === 'finished') finishLiveRow(previous, `${algorithmLabel(previous)} hoàn tất • 100%`, 'success');
        else if (previous?.status === 'error') finishLiveRow(previous, `FAIL • ${previous.errorMessage || 'Pipeline 2 lỗi'}`, 'error');
      }
      return;
    }

    if (!job._p2RuntimeStartedAt) job._p2RuntimeStartedAt = Date.now();
    loadGpuTelemetry(job);
    updateLiveRow(job, Number(job.p2Progress ?? job.progress ?? 0), lastStage, lastFrame);
    drawLivePreview();
    inspectBackendStatus();
  }

  function install() {
    if (installed) return true;
    if (!window._appState || !window.api || !document.getElementById('log-output')) return false;
    installed = true;
    installLogCoalescing();
    installManualRegionGeometry();
    installManualRegionObservers();
    installPerRegionMaskPayload();
    if (typeof window.api.onWebSocketMessage === 'function') unsubscribeWs = window.api.onWebSocketMessage(handleWs);
    setInterval(tick, UI_TICK_MS);
    window.addEventListener('beforeunload', () => unsubscribeWs?.(), { once: true });
    return true;
  }

  let attempts = 0;
  const bootstrap = setInterval(() => {
    attempts += 1;
    if (install() || attempts > 100) clearInterval(bootstrap);
  }, 100);
})();
