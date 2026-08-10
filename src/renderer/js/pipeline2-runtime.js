(function pipeline2RuntimeEnhancer() {
  'use strict';

  const PREVIEW_INTERVAL_MS = 850;
  const STATUS_INTERVAL_MS = 1800;
  const UI_TICK_MS = 500;

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
    return /\bINFO:\s+127\.0\.0\.1:\d+\s+-\s+"(?:GET|POST) \/api\/(?:status|preview|health|gpu-info)\b.*HTTP\/1\.1"\s+200\s+OK/i.test(text);
  }

  function isHeartbeat(text) {
    return /\[Inpaint\]\s+Đang xử lý|processing frame\s+\d+\s+to\s+\d+|Processing:\s*\d+\s*-\s*\d+\s*\/\s*Total/i.test(text);
  }

  function extractHeartbeat(text, job) {
    const pctMatch = text.match(/tiến độ:\s*(\d+(?:\.\d+)?)%/i);
    const frameRange = text.match(/processing frame\s+(\d+)\s+to\s+(\d+)/i);
    const processingRange = text.match(/Processing:\s*(\d+)\s*-\s*(\d+)\s*\/\s*Total:\s*(\d+)/i);
    if (frameRange) {
      lastFrame = Math.max(0, Number(frameRange[2]) - 1);
      lastStage = `Xóa subtitle frame ${frameRange[1]}–${frameRange[2]}`;
    } else if (processingRange) {
      lastFrame = Math.max(0, Number(processingRange[2]) - 1);
      lastStage = `Xử lý frame ${processingRange[1]}–${processingRange[2]}`;
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
      if (!job) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.classList.contains('log-entry')) continue;
          if (node.dataset.p2LiveProgress === 'true') continue;
          const text = node.textContent || '';
          if (isNoisyAccessLog(text)) {
            node.remove();
            continue;
          }
          if (isHeartbeat(text)) {
            extractHeartbeat(text, job);
            node.remove();
          }
        }
      }
    }).observe(output, { childList: true });
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
