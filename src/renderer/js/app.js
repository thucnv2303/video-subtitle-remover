/**
 * Video Subtitle Remover - Main App Logic
 * Each job is independently configurable and queued for sequential processing.
 */
(function () {
  'use strict';

  // ─── Constants ──────────────────────────────────
  const REGION_COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#ef4444'];

  // ─── State ───────────────────────────────────────
  const state = {
    jobs: [],
    activeJobId: null,
    outputDir: null,
    isBackendReady: false,
    isDrawing: false,      // draw mode active
    isSelecting: false,    // currently dragging
    selectionStart: null,
    playIntervalOrig: null,
    playIntervalResult: null,
    currentFrameOrig: 0,
    currentFrameResult: 0,
    videoInfo: null,
    processingJobId: null,
    processingPassIndex: 0, // current pass in multi-pass
    pollTimer: null,
  };

  // Job factory: each job has its own settings
  function createJob(filePath) {
    const fileName = filePath.split(/[\\/]/).pop();
    const baseName = fileName.replace(/\.[^.]+$/, '');
    let outputPath;
    if (state.outputDir) {
      outputPath = state.outputDir.replace(/\\/g, '/') + '/' + baseName + '_no_sub.mp4';
    } else {
      const dir = filePath.replace(/\\/g, '/').replace(/\/[^/]+$/, '');
      outputPath = dir + '/' + baseName + '_no_sub.mp4';
    }
    return {
      id: Math.random().toString(36).substr(2, 9),
      filePath,
      fileName,
      outputPath,
      status: 'idle',
      progress: 0,
      algorithm: 'sttn-auto',
      maskMode: 'box',
      subtitleMode: 'auto',
      regions: [],
      extractSrt: true,
      aiRewrite: false,
      ttsGenerate: false,
      voiceSub: false,
      srtContent: '',
      aiContent: '',
      voiceSubContent: '',
      voiceSegments: [],
    };
  }

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ─── DOM Refs ────────────────────────────────────
  const el = {
    navItems: $$('.nav-item'),
    pages: $$('.page'),
    statusDot: $('#backend-status .status-dot'),
    statusText: $('#backend-status .status-text'),
    gpuBadge: $('#gpu-badge'),
    gpuDetail: $('#gpu-detail'),
    gpuChip: $('#gpu-chip'),
    cudaVersion: $('#cuda-version'),
    canvasOrig: $('#canvas-original'),
    canvasResult: $('#canvas-result'),
    dropZone: $('#drop-zone'),
    subtitleOverlay: $('#subtitle-overlay'),
    resultPlaceholder: $('#result-placeholder'),
    btnOpenFile: $('#btn-open-file'),
    btnOutputDir: $('#btn-output-dir'),
    btnDrawRegion: $('#btn-draw-region'),
    regionsPanel: $('#regions-panel'),
    regionsList: $('#regions-list'),
    maskMode: $('#mask-mode'),
    timelineOrig: $('#timeline-orig'),
    frameInfoOrig: $('#frame-info-orig'),
    btnPlayOrig: $('#btn-play-orig'),
    btnPrevOrig: $('#btn-prev-orig'),
    btnNextOrig: $('#btn-next-orig'),
    timelineResult: $('#timeline-result'),
    frameInfoResult: $('#frame-info-result'),
    btnPlayResult: $('#btn-play-result'),
    btnPrevResult: $('#btn-prev-result'),
    btnNextResult: $('#btn-next-result'),
    metaName: $('#meta-name'),
    metaRes: $('#meta-res'),
    metaFps: $('#meta-fps'),
    metaDur: $('#meta-dur'),
    modeAuto: $('#mode-auto'),
    modeManual: $('#mode-manual'),
    algoSelect: $('#algo-select'),

    btnStart: $('#btn-start'),
    btnCancel: $('#btn-cancel'),
    progressSection: $('#progress-section'),
    progressBar: $('#progress-bar'),
    progressLabel: $('#progress-label'),
    progressEta: $('#progress-eta'),
    logOutput: $('#log-output'),
    btnCopyLog: $('#btn-copy-log'),
    btnClearLog: $('#btn-clear-log'),
    jobList: $('#job-list'),
    aiProvider: $('#ai-provider'),
    aiApiKey: $('#ai-api-key'),
    aiEndpoint: $('#ai-endpoint'),
    aiPrompt: $('#ai-prompt'),
    ttsVoice: $('#tts-voice'),
    ttsLanguage: $('#tts-language'),
    ttsBgVolume: $('#tts-bg-volume'),
    volLabel: $('#vol-label'),
    btnSaveAi: $('#btn-save-ai'),
    ttsStatusChip: $('#tts-status-chip'),
    cloneVoiceName: $('#clone-voice-name'),
    btnUploadRefAudio: $('#btn-upload-ref-audio'),
    refAudioName: $('#ref-audio-name'),
    refAudioPreview: $('#ref-audio-preview'),
    btnCloneVoice: $('#btn-clone-voice'),
    savedVoicesList: $('#saved-voices-list'),
    ttsTestText: $('#tts-test-text'),
    btnTestTts: $('#btn-test-tts'),
    ttsTestAudio: $('#tts-test-audio'),
    // Content panels
    chkTtsGenerate: $('#chk-tts-generate'),
    panelSrt: $('#panel-srt'),
    panelAi: $('#panel-ai'),
    panelVoice: $('#panel-voice'),
    srtContent: $('#srt-content'),
    aiContent: $('#ai-content'),
    voiceSegments: $('#voice-segments'),
    // Panel action buttons
    btnAiRegenerate: $('#btn-ai-regenerate'),
    btnAiImport: $('#btn-ai-import'),
    btnAiApply: $('#btn-ai-apply'),
    btnVoiceRegenerate: $('#btn-voice-regenerate'),
    btnVoiceImport: $('#btn-voice-import'),
    btnVoiceApply: $('#btn-voice-apply'),
    // Voice sub panel
    chkVoiceSub: $('#chk-voice-sub'),
    panelVoiceSub: $('#panel-voice-sub'),
    voicesubContent: $('#voicesub-content'),
    voicesubMode: $('#voicesub-mode'),
    btnVoicesubImport: $('#btn-voicesub-import'),
    btnVoicesubApply: $('#btn-voicesub-apply'),
    // Resize handles
    resizeHandle1: $('#resize-handle-1'),
    resizeHandle2: $('#resize-handle-2'),
  };

  const ctxOrig = el.canvasOrig.getContext('2d');
  const ctxResult = el.canvasResult.getContext('2d');

  // ─── Helpers: Active Job ─────────────────────────
  function getActiveJob() {
    return state.jobs.find(j => j.id === state.activeJobId) || null;
  }

  // Save current control values INTO the active job
  function saveControlsToJob() {
    const job = getActiveJob();
    if (!job || job.status === 'processing' || job.status === 'finished') return;
    job.algorithm = el.algoSelect.value;
    job.maskMode = el.maskMode?.value || 'box';
    job.extractSrt = $('#chk-extract-srt')?.checked || false;
    job.aiRewrite = $('#chk-ai-rewrite')?.checked || false;
    job.ttsGenerate = el.chkTtsGenerate?.checked || false;
    job.voiceSub = el.chkVoiceSub?.checked || false;
  }

  // Load a job's settings INTO the controls panel
  function loadControlsFromJob(job) {
    if (!job) return;
    el.algoSelect.value = job.algorithm;
    if (el.maskMode) el.maskMode.value = job.maskMode || 'box';
    const chkSrt = $('#chk-extract-srt');
    const chkAi = $('#chk-ai-rewrite');
    if (chkSrt) chkSrt.checked = job.extractSrt;
    if (chkAi) chkAi.checked = job.aiRewrite;
    const chkTts = el.chkTtsGenerate;
    if (chkTts) chkTts.checked = job.ttsGenerate || false;
    const chkVS = el.chkVoiceSub;
    if (chkVS) chkVS.checked = job.voiceSub || false;
    // Toggle content panels
    toggleContentPanels(job);
    // Load content into panels
    if (el.srtContent) el.srtContent.value = job.srtContent || '';
    if (el.aiContent) el.aiContent.value = job.aiContent || '';
    if (el.voicesubContent) el.voicesubContent.value = job.voiceSubContent || '';
    renderVoiceSegments(job.voiceSegments || []);
    if (job.subtitleMode === 'manual') {
      el.modeManual.classList.add('active'); el.modeAuto.classList.remove('active');
      el.regionsPanel.classList.remove('hidden');
    } else {
      el.modeAuto.classList.add('active'); el.modeManual.classList.remove('active');
      el.regionsPanel.classList.add('hidden');
    }

    renderRegionsList();
    renderRegionOverlays();
    updateStartButton();
  }

  // ─── Navigation ──────────────────────────────────
  el.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      el.navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      el.pages.forEach(p => p.classList.remove('active'));
      const target = $(`#page-${page}`);
      if (target) target.classList.add('active');
      if (page === 'settings') { loadSettingsValues(); checkTTSStatus(); }
    });
  });

  // ─── Toast & Log ─────────────────────────────────
  function showToast(msg, type = 'info', dur = 3000) {
    const c = $('#toast-container');
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, dur);
  }

  function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    entry.textContent = `[${time}] ${message}`;
    el.logOutput.appendChild(entry);
    el.logOutput.scrollTop = el.logOutput.scrollHeight;
  }
  window.addLog = addLog;

  el.btnClearLog.addEventListener('click', () => { el.logOutput.innerHTML = ''; });
  el.btnCopyLog.addEventListener('click', () => {
    navigator.clipboard.writeText(el.logOutput.innerText).then(() => showToast('Đã sao chép!', 'success'));
  });

  // ─── Backend Connection ──────────────────────────
  async function connectToBackend() {
    addLog('Đang kết nối đến Python backend...', 'info');
    setStatus('connecting');
    const ready = await api.waitForBackend(60, 1000);
    if (ready) {
      state.isBackendReady = true;
      setStatus('online');
      addLog('Backend đã sẵn sàng!', 'success');
      api.connectWebSocket();
      api.onWebSocketMessage(handleWSMessage);
      loadGpuInfo();
      updateStartButton();
    } else {
      setStatus('offline');
      addLog('Không thể kết nối backend!', 'error');
    }
  }

  function setStatus(s) {
    el.statusDot.className = 'status-dot ' + s;
    el.gpuBadge.querySelector('.status-dot').className = 'status-dot ' + s;
    el.statusText.textContent = s === 'online' ? 'Online' : s === 'connecting' ? '...' : 'Off';
  }

  async function loadGpuInfo() {
    try {
      const info = await api.gpuInfo();
      const name = info.gpu_name || 'CPU Only';
      el.gpuDetail.textContent = name;
      el.gpuChip.querySelector('span:last-child').textContent = name;
      el.cudaVersion.textContent = info.cuda_version || 'N/A';
      const dot = el.gpuChip.querySelector('.status-dot');
      if (info.gpu_available) { dot.classList.add('online'); addLog(`GPU: ${name} (VRAM: ${info.vram_total || '?'})`, 'success'); }
      else { dot.classList.add('offline'); addLog('Không phát hiện GPU → CPU.', 'warning'); }
    } catch (e) { addLog('Lỗi GPU: ' + e.message, 'error'); }
  }

  // ─── File Selection ──────────────────────────────
  async function selectFile() {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.openFile();
    if (result && !result.canceled && result.filePaths.length > 0) {
      result.filePaths.forEach(fp => addToQueue(fp));
      if (!state.activeJobId && state.jobs.length > 0) selectJob(state.jobs[state.jobs.length - 1].id);
    }
  }

  function addToQueue(filePath) {
    if (state.jobs.find(j => j.filePath === filePath)) return;
    const job = createJob(filePath);
    state.jobs.push(job);
    renderJobList();
    updateStartButton();
    addLog(`Đã thêm: ${job.fileName}`, 'info');
  }

  // ─── Select / Switch Job ─────────────────────────
  function selectJob(jobId) {
    // Save current job settings first
    saveControlsToJob();

    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    state.activeJobId = jobId;
    loadControlsFromJob(job);
    loadVideo(job);
    renderJobList();
  }

  // ─── Render Job List ─────────────────────────────
  function renderJobList() {
    if (state.jobs.length === 0) {
      el.jobList.innerHTML = '<div class="job-empty">Chưa có video nào.<br>Hãy kéo thả hoặc bấm "Chọn Video".</div>';
      return;
    }
    el.jobList.innerHTML = '';
    state.jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'job-card' + (state.activeJobId === job.id ? ' active' : '');
      card.addEventListener('click', () => selectJob(job.id));

      const statusLabel = {
        idle: '⏸ Chờ cài đặt',
        queued: '⏳ Đang chờ',
        processing: '🔄 Đang xử lý',
        finished: '✅ Hoàn tất',
        error: '❌ Lỗi',
      }[job.status] || job.status;

      card.innerHTML = `
        <div class="job-name" title="${job.filePath}">${job.fileName}</div>
        <div class="job-detail">
          <span class="status-tag status-${job.status}">${statusLabel}</span>
          <span>${job.progress}%</span>
        </div>
        <div class="job-progress-bar"><div class="job-progress-fill" style="width:${job.progress}%"></div></div>
      `;
      el.jobList.appendChild(card);
    });
  }

  $('#btn-clear-queue')?.addEventListener('click', () => {
    // Only remove idle/finished jobs, keep processing/queued
    state.jobs = state.jobs.filter(j => j.status === 'processing' || j.status === 'queued');
    if (!state.jobs.find(j => j.id === state.activeJobId)) state.activeJobId = null;
    renderJobList();
    updateStartButton();
  });

  el.btnOpenFile.addEventListener('click', selectFile);
  el.dropZone.addEventListener('click', selectFile);

  // Drag & drop
  const paneOrig = $('#pane-original');
  paneOrig.addEventListener('dragover', (e) => { e.preventDefault(); el.dropZone.classList.add('drag-over'); });
  paneOrig.addEventListener('dragleave', () => el.dropZone.classList.remove('drag-over'));
  paneOrig.addEventListener('drop', (e) => {
    e.preventDefault();
    el.dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(f => { if (f.path) addToQueue(f.path); });
      if (!state.activeJobId && state.jobs.length > 0) selectJob(state.jobs[0].id);
    }
  });

  // Output dir (settings page)
  if (el.btnOutputDir) {
    el.btnOutputDir.addEventListener('click', async () => {
      if (!window.electronAPI?.openDirectory) return;
      const result = await window.electronAPI.openDirectory();
      if (result && !result.canceled && result.filePaths.length > 0) {
        state.outputDir = result.filePaths[0];
        addLog(`Thư mục xuất: ${state.outputDir}`, 'info');
        const textEl = $('#output-dir-text');
        if (textEl) textEl.textContent = state.outputDir;
      }
    });
  }

  // ─── Load Video for a Job ────────────────────────
  async function loadVideo(job) {
    try {
      if (!state.isBackendReady) { addLog('Backend chưa sẵn sàng!', 'warning'); return; }
      const info = await api.videoInfo(job.filePath);
      state.videoInfo = info;
      el.metaName.textContent = job.fileName;
      el.metaRes.textContent = `${info.width}×${info.height}`;
      el.metaFps.textContent = `${info.fps.toFixed(1)} fps`;
      el.metaDur.textContent = fmtTime(info.duration);
      el.timelineOrig.max = info.total_frames - 1;
      el.timelineOrig.disabled = false;
      el.btnPlayOrig.disabled = false;
      el.btnPrevOrig.disabled = false;
      el.btnNextOrig.disabled = false;
      el.dropZone.classList.add('hidden');

      // Reset result
      el.timelineResult.max = info.total_frames - 1;
      el.timelineResult.value = 0;
      el.frameInfoResult.textContent = `0/${info.total_frames - 1}`;
      el.resultPlaceholder.classList.remove('hidden');
      ctxResult.clearRect(0, 0, el.canvasResult.width, el.canvasResult.height);

      // Load first frame
      await loadOrigFrame(0, job.filePath);

      // If job is finished, also load result
      if (job.status === 'finished' && job.outputPath) {
        el.timelineResult.disabled = false;
        el.btnPlayResult.disabled = false;
        el.btnPrevResult.disabled = false;
        el.btnNextResult.disabled = false;
        loadResultFrame(0, job.outputPath);
      } else {
        el.timelineResult.disabled = true;
        el.btnPlayResult.disabled = true;
        el.btnPrevResult.disabled = true;
        el.btnNextResult.disabled = true;
      }
    } catch (e) {
      addLog('Lỗi tải video: ' + e.message, 'error');
    }
  }

  async function loadOrigFrame(n, filePath) {
    const fp = filePath || state.jobs.find(j => j.id === state.activeJobId)?.filePath;
    if (!fp) return;
    try {
      const blob = await api.getFrame(n, fp);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { el.canvasOrig.width = img.width; el.canvasOrig.height = img.height; ctxOrig.drawImage(img, 0, 0); URL.revokeObjectURL(url); };
      img.src = url;
      state.currentFrameOrig = n;
      el.timelineOrig.value = n;
      if (state.videoInfo) el.frameInfoOrig.textContent = `${n}/${state.videoInfo.total_frames - 1}`;
      updateRegionVisibility(); // Fast: toggle region visibility by frame
    } catch (e) { /* silent */ }
  }

  async function loadResultFrame(n, outputPath) {
    const op = outputPath || state.jobs.find(j => j.id === state.activeJobId)?.outputPath;
    if (!op) return;
    try {
      const blob = await api.getOutputFrame(n, op);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { el.canvasResult.width = img.width; el.canvasResult.height = img.height; ctxResult.drawImage(img, 0, 0); URL.revokeObjectURL(url); el.resultPlaceholder.classList.add('hidden'); };
      img.src = url;
      state.currentFrameResult = n;
      el.timelineResult.value = n;
      if (state.videoInfo) el.frameInfoResult.textContent = `${n}/${state.videoInfo.total_frames - 1}`;
    } catch (e) { /* silent */ }
  }

  // ─── Synced Playback (both panes follow same frame) ──
  // Load both frames at the same position
  function loadSyncedFrame(n) {
    loadOrigFrame(n);
    const job = getActiveJob();
    if (job && (job.status === 'finished' || job.status === 'processing') && job.outputPath) {
      loadResultFrame(n, job.outputPath);
    }
  }

  function toggleSyncedPlay() {
    if (state.playIntervalOrig) {
      // Stop
      clearInterval(state.playIntervalOrig);
      state.playIntervalOrig = null;
      el.btnPlayOrig.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
      el.btnPlayResult.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
    } else {
      // Play
      if (!state.videoInfo) return;
      const pauseIcon = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
      el.btnPlayOrig.innerHTML = pauseIcon;
      el.btnPlayResult.innerHTML = pauseIcon;
      const fps = Math.max(state.videoInfo.fps, 1);
      state.playIntervalOrig = setInterval(() => {
        if (state.currentFrameOrig < state.videoInfo.total_frames - 1) {
          loadSyncedFrame(state.currentFrameOrig + 1);
        } else {
          toggleSyncedPlay(); // auto stop at end
        }
      }, 1000 / fps);
    }
  }

  // Timeline scrub: sync both panes
  el.timelineOrig.addEventListener('input', (e) => loadSyncedFrame(parseInt(e.target.value)));
  el.timelineResult.addEventListener('input', (e) => loadSyncedFrame(parseInt(e.target.value)));

  // Play buttons: both trigger synced play
  el.btnPlayOrig.addEventListener('click', toggleSyncedPlay);
  el.btnPlayResult.addEventListener('click', toggleSyncedPlay);

  // Prev/Next: sync both panes
  el.btnPrevOrig.addEventListener('click', () => { if (state.currentFrameOrig > 0) loadSyncedFrame(state.currentFrameOrig - 1); });
  el.btnNextOrig.addEventListener('click', () => { if (state.videoInfo && state.currentFrameOrig < state.videoInfo.total_frames - 1) loadSyncedFrame(state.currentFrameOrig + 1); });
  el.btnPrevResult.addEventListener('click', () => { if (state.currentFrameOrig > 0) loadSyncedFrame(state.currentFrameOrig - 1); });
  el.btnNextResult.addEventListener('click', () => { if (state.videoInfo && state.currentFrameOrig < state.videoInfo.total_frames - 1) loadSyncedFrame(state.currentFrameOrig + 1); });

  // ─── Subtitle Mode (per job) ─────────────────────
  el.modeAuto.addEventListener('click', () => {
    const job = getActiveJob();
    if (job) job.subtitleMode = 'auto';
    el.modeAuto.classList.add('active'); el.modeManual.classList.remove('active');
    el.regionsPanel.classList.add('hidden');
    el.subtitleOverlay.classList.remove('selecting');
    state.isDrawing = false;
    renderRegionOverlays();
  });
  el.modeManual.addEventListener('click', () => {
    const job = getActiveJob();
    if (job) job.subtitleMode = 'manual';
    el.modeManual.classList.add('active'); el.modeAuto.classList.remove('active');
    el.regionsPanel.classList.remove('hidden');
    renderRegionsList();
    renderRegionOverlays();
  });

  // Draw region button
  el.btnDrawRegion.addEventListener('click', () => {
    const job = getActiveJob();
    if (!job || !state.videoInfo || job.regions.length >= 6) {
      if (job && job.regions.length >= 6) showToast('Tối đa 6 vùng!', 'warning');
      return;
    }
    state.isDrawing = true;
    el.subtitleOverlay.classList.add('selecting');
    // Show hint
    let hint = el.subtitleOverlay.querySelector('.draw-mode-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'draw-mode-hint';
      hint.textContent = 'Kéo chuột để vẽ vùng sub';
      el.subtitleOverlay.appendChild(hint);
    }
    addLog('Kéo chuột trên video để vẽ vùng subtitle mới.', 'info');
  });

  // Mouse drawing
  el.subtitleOverlay.addEventListener('mousedown', (e) => {
    if (!state.isDrawing) return;
    const rect = el.subtitleOverlay.getBoundingClientRect();
    state.isSelecting = true;
    state.selectionStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    const old = el.subtitleOverlay.querySelector('.selection-rect');
    if (old) old.remove();
  });
  document.addEventListener('mousemove', (e) => {
    if (!state.isSelecting) return;
    const rect = el.subtitleOverlay.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    let sel = el.subtitleOverlay.querySelector('.selection-rect');
    if (!sel) { sel = document.createElement('div'); sel.className = 'selection-rect'; el.subtitleOverlay.appendChild(sel); }
    sel.style.cssText = `left:${Math.min(state.selectionStart.x, x)}px;top:${Math.min(state.selectionStart.y, y)}px;width:${Math.abs(x - state.selectionStart.x)}px;height:${Math.abs(y - state.selectionStart.y)}px`;
  });
  document.addEventListener('mouseup', () => {
    if (!state.isSelecting) return;
    state.isSelecting = false;
    state.isDrawing = false;
    el.subtitleOverlay.classList.remove('selecting');
    // Remove hint
    const hint = el.subtitleOverlay.querySelector('.draw-mode-hint');
    if (hint) hint.remove();
    const sel = el.subtitleOverlay.querySelector('.selection-rect');
    if (!sel || !state.videoInfo) return;
    const scaleX = state.videoInfo.width / el.canvasOrig.offsetWidth;
    const scaleY = state.videoInfo.height / el.canvasOrig.offsetHeight;
    const w = parseFloat(sel.style.width);
    const h = parseFloat(sel.style.height);
    sel.remove();
    if (w < 5 || h < 5) return; // too small
    const job = getActiveJob();
    if (!job) return;
    const idx = job.regions.length;
    const region = {
      id: 'r' + Math.random().toString(36).substr(2, 6),
      ymin: Math.max(0, Math.round(parseFloat(sel.style.top) * scaleY)),
      ymax: Math.round((parseFloat(sel.style.top) + h) * scaleY),
      xmin: Math.max(0, Math.round(parseFloat(sel.style.left) * scaleX)),
      xmax: Math.round((parseFloat(sel.style.left) + w) * scaleX),
      startFrame: 0,
      endFrame: state.videoInfo.total_frames - 1,
      color: REGION_COLORS[idx % REGION_COLORS.length],
      label: idx + 1,
    };
    job.regions.push(region);
    addLog(`Vùng #${region.label} đã thêm: Y[${region.ymin}-${region.ymax}] X[${region.xmin}-${region.xmax}]`, 'success');
    renderRegionsList();
    renderRegionOverlays();
  });

  // ─── Render Region List (controls panel) ──────────
  function renderRegionsList() {
    const job = getActiveJob();
    if (!job || job.regions.length === 0) {
      el.regionsList.innerHTML = '<div class="region-empty">Bấm "+ Vẽ vùng" rồi kéo chuột trên video</div>';
      return;
    }
    const totalFrames = state.videoInfo ? state.videoInfo.total_frames - 1 : 0;
    el.regionsList.innerHTML = '';
    job.regions.forEach((r, i) => {
      const card = document.createElement('div');
      card.className = 'region-card';
      card.style.setProperty('--region-color', r.color);
      card.innerHTML = `
        <div class="region-top">
          <span class="region-label" style="color:${r.color}">● Vùng #${r.label}</span>
          <button class="btn-del" data-rid="${r.id}" title="Xóa vùng">✕</button>
        </div>
        <div class="region-coords">Y:${r.ymin}-${r.ymax} X:${r.xmin}-${r.xmax}</div>
        <div class="region-timeline">
          <span>Từ</span>
          <input type="number" class="region-start" data-rid="${r.id}" value="${r.startFrame}" min="0" max="${totalFrames}">
          <span>→</span>
          <input type="number" class="region-end" data-rid="${r.id}" value="${r.endFrame}" min="0" max="${totalFrames}">
        </div>
      `;
      el.regionsList.appendChild(card);
    });
    // Event listeners
    el.regionsList.querySelectorAll('.btn-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rid = btn.dataset.rid;
        job.regions = job.regions.filter(r => r.id !== rid);
        // Re-label
        job.regions.forEach((r, i) => { r.label = i + 1; r.color = REGION_COLORS[i % REGION_COLORS.length]; });
        renderRegionsList();
        renderRegionOverlays();
      });
    });
    el.regionsList.querySelectorAll('.region-start').forEach(inp => {
      inp.addEventListener('change', () => {
        const r = job.regions.find(x => x.id === inp.dataset.rid);
        if (r) r.startFrame = parseInt(inp.value) || 0;
      });
    });
    el.regionsList.querySelectorAll('.region-end').forEach(inp => {
      inp.addEventListener('change', () => {
        const r = job.regions.find(x => x.id === inp.dataset.rid);
        if (r) r.endFrame = parseInt(inp.value) || 0;
      });
    });
  }

  // ─── Render Region Overlays on Canvas ─────────────
  // Cached overlays: create once, toggle visibility per frame
  let _regionOverlayCache = [];

  function buildRegionOverlays() {
    // Full rebuild: called when regions list changes (add/remove/switch job)
    _regionOverlayCache.forEach(d => d.remove());
    _regionOverlayCache = [];
    const job = getActiveJob();
    if (!job || job.subtitleMode !== 'manual' || !state.videoInfo) return;
    const scaleX = el.canvasOrig.offsetWidth / state.videoInfo.width;
    const scaleY = el.canvasOrig.offsetHeight / state.videoInfo.height;
    job.regions.forEach(r => {
      const div = document.createElement('div');
      div.className = 'region-overlay-rect';
      div.dataset.rid = r.id;
      div.dataset.startFrame = r.startFrame;
      div.dataset.endFrame = r.endFrame;
      div.style.cssText = `left:${r.xmin * scaleX}px;top:${r.ymin * scaleY}px;width:${(r.xmax - r.xmin) * scaleX}px;height:${(r.ymax - r.ymin) * scaleY}px;border-color:${r.color}`;
      div.innerHTML = `<span class="region-num" style="background:${r.color}">${r.label}</span>`;
      el.subtitleOverlay.appendChild(div);
      _regionOverlayCache.push(div);
    });
    updateRegionVisibility();
  }

  function updateRegionVisibility() {
    // Fast: just toggle display, no DOM creation
    const f = state.currentFrameOrig;
    _regionOverlayCache.forEach(div => {
      const s = parseInt(div.dataset.startFrame);
      const e = parseInt(div.dataset.endFrame);
      div.style.display = (f >= s && f <= e) ? '' : 'none';
    });
  }

  // Alias for backwards compat
  function renderRegionOverlays() { buildRegionOverlays(); }

  // Algorithm change listener
  el.algoSelect.addEventListener('change', () => {
    const job = getActiveJob();
    if (job) job.algorithm = el.algoSelect.value;
  });
  // Mask mode change listener
  if (el.maskMode) {
    el.maskMode.addEventListener('change', () => {
      const job = getActiveJob();
      if (job) job.maskMode = el.maskMode.value;
    });
  }

  // ─── Content Panel Toggle ────────────────────────
  function toggleContentPanels(job) {
    if (!job) {
      el.panelSrt?.classList.add('hidden');
      el.panelAi?.classList.add('hidden');
      el.panelVoice?.classList.add('hidden');
      return;
    }
    el.panelSrt?.classList.toggle('hidden', !job.extractSrt);
    el.panelAi?.classList.toggle('hidden', !job.aiRewrite);
    el.panelVoice?.classList.toggle('hidden', !(job.ttsGenerate));
    el.panelVoiceSub?.classList.toggle('hidden', !(job.voiceSub));
  }

  // Checkbox change → toggle panels
  ['chk-extract-srt', 'chk-ai-rewrite'].forEach(id => {
    const chk = $(`#${id}`);
    if (chk) chk.addEventListener('change', () => {
      const job = getActiveJob();
      if (job) { saveControlsToJob(); toggleContentPanels(job); }
    });
  });
  if (el.chkTtsGenerate) {
    el.chkTtsGenerate.addEventListener('change', () => {
      const job = getActiveJob();
      if (job) { job.ttsGenerate = el.chkTtsGenerate.checked; toggleContentPanels(job); }
    });
  }
  if (el.chkVoiceSub) {
    el.chkVoiceSub.addEventListener('change', () => {
      const job = getActiveJob();
      if (job) {
        job.voiceSub = el.chkVoiceSub.checked;
        // Auto-populate voice sub content from AI content or SRT
        if (job.voiceSub && !job.voiceSubContent) {
          job.voiceSubContent = job.aiContent || job.srtContent || '';
          if (el.voicesubContent) el.voicesubContent.value = job.voiceSubContent;
        }
        toggleContentPanels(job);
      }
    });
  }

  // ─── Voice Segments Renderer ─────────────────────
  function renderVoiceSegments(segments) {
    if (!el.voiceSegments) return;
    if (!segments || segments.length === 0) {
      el.voiceSegments.innerHTML = '<div class="voice-empty">Chưa có voice nào.</div>';
      return;
    }
    el.voiceSegments.innerHTML = segments.map((s, i) => `
      <div class="voice-segment">
        <span class="seg-text">#${i+1}: ${s.text?.substring(0, 40) || '...'}...</span>
        <audio src="file:///${(s.audio_path || '').replace(/\\\\/g, '/')}" controls></audio>
      </div>`).join('');
  }

  // ─── Action Buttons: AI ──────────────────────────
  if (el.btnAiImport) {
    el.btnAiImport.addEventListener('click', async () => {
      if (!window.electronAPI?.openFile) return;
      const result = await window.electronAPI.openFile([{name:'SRT',extensions:['srt','txt']}]);
      const fp = result && !result.canceled && result.filePaths?.[0];
      if (fp) {
        try {
          const resp = await fetch('file:///' + fp.replace(/\\\\/g, '/'));
          const text = await resp.text();
          if (el.aiContent) el.aiContent.value = text;
          const job = getActiveJob();
          if (job) job.aiContent = text;
          addLog('[AI] Đã nhập SRT: ' + fp.split(/[\\\\/]/).pop(), 'info');
        } catch (e) { addLog('[AI] Lỗi đọc file: ' + e.message, 'error'); }
      }
    });
  }

  if (el.btnAiApply) {
    el.btnAiApply.addEventListener('click', async () => {
      const job = getActiveJob();
      if (!job) return;
      const srtText = el.aiContent?.value?.trim();
      if (!srtText) { showToast('Chưa có nội dung phụ đề!', 'warn'); return; }
      // Save SRT to temp file
      const srtPath = job.outputPath.replace(/_no_sub\.mp4$/, '_ai_rewrite.srt');
      try {
        // Write SRT via backend — we'll use burn-subtitle directly
        const outputPath = job.outputPath.replace(/_no_sub\.mp4$/, '_subtitled.mp4');
        el.btnAiApply.disabled = true;
        el.btnAiApply.textContent = '⏳ Đang xử lý...';
        addLog('[AI] Đang burn phụ đề vào video...', 'info');
        const result = await api.burnSubtitle(job.outputPath, srtPath, outputPath, 'soft');
        if (result.status === 'ok') {
          addLog('[AI] ✅ Đã thêm phụ đề: ' + outputPath, 'success');
          showToast('Đã áp dụng phụ đề!', 'success');
        } else {
          addLog('[AI] ❌ Lỗi: ' + result.error, 'error');
        }
      } catch (e) { addLog('[AI] ❌ ' + e.message, 'error'); }
      finally { el.btnAiApply.disabled = false; el.btnAiApply.textContent = '💾 Áp dụng phụ đề vào video'; }
    });
  }

  // ─── Action Buttons: Voice ───────────────────────
  if (el.btnVoiceImport) {
    el.btnVoiceImport.addEventListener('click', async () => {
      if (!window.electronAPI?.openFile) return;
      const result = await window.electronAPI.openFile([{name:'Audio',extensions:['wav','mp3','flac','ogg','m4a','aac','wma','opus']}]);
      const fp = result && !result.canceled && result.filePaths?.[0];
      if (fp) {
        const job = getActiveJob();
        if (job) {
          job.voiceSegments = [{ text: 'Imported audio', audio_path: fp }];
          renderVoiceSegments(job.voiceSegments);
          addLog('[Voice] Đã nhập audio: ' + fp.split(/[\\\\/]/).pop(), 'info');
        }
      }
    });
  }

  if (el.btnVoiceApply) {
    el.btnVoiceApply.addEventListener('click', async () => {
      const job = getActiveJob();
      if (!job || !job.voiceSegments?.length) { showToast('Chưa có voice nào!', 'warn'); return; }
      const audioPath = job.voiceSegments[0]?.audio_path;
      if (!audioPath) return;
      const outputPath = job.outputPath.replace(/_no_sub\.mp4$/, '_voiced.mp4');
      el.btnVoiceApply.disabled = true;
      el.btnVoiceApply.textContent = '⏳ Đang ghép...';
      addLog('[Voice] Đang ghép audio vào video...', 'info');
      try {
        const bgVol = parseInt(localStorage.getItem('tts_bg_volume') || '10');
        const result = await api.replaceAudio(job.outputPath, audioPath, outputPath, bgVol);
        if (result.status === 'ok') {
          addLog('[Voice] ✅ Đã ghép voice: ' + outputPath, 'success');
          showToast('Đã ghép voice vào video!', 'success');
        } else { addLog('[Voice] ❌ ' + result.error, 'error'); }
      } catch (e) { addLog('[Voice] ❌ ' + e.message, 'error'); }
      finally { el.btnVoiceApply.disabled = false; el.btnVoiceApply.textContent = '🔊 Ghép voice vào video'; }
    });
  }

  // ─── Action Buttons: Voice Sub ────────────────────
  if (el.btnVoicesubImport) {
    el.btnVoicesubImport.addEventListener('click', async () => {
      if (!window.electronAPI?.openFile) return;
      const result = await window.electronAPI.openFile([{name:'SRT',extensions:['srt','txt']}]);
      const fp = result && !result.canceled && result.filePaths?.[0];
      if (fp) {
        try {
          const resp = await fetch('file:///' + fp.replace(/\\\\/g, '/'));
          const text = await resp.text();
          if (el.voicesubContent) el.voicesubContent.value = text;
          const job = getActiveJob();
          if (job) job.voiceSubContent = text;
          addLog('[VoiceSub] Đã nhập SRT: ' + fp.split(/[\\\\/]/).pop(), 'info');
        } catch (e) { addLog('[VoiceSub] Lỗi: ' + e.message, 'error'); }
      }
    });
  }

  if (el.btnVoicesubApply) {
    el.btnVoicesubApply.addEventListener('click', async () => {
      const job = getActiveJob();
      if (!job) return;
      const srtText = el.voicesubContent?.value?.trim();
      if (!srtText) { showToast('Chưa có nội dung phụ đề!', 'warn'); return; }

      // Determine input video: voiced version if exists, otherwise no_sub version
      const voicedPath = job.outputPath.replace(/_no_sub\.mp4$/, '_voiced.mp4');
      const inputVideo = job.outputPath; // Use the no_sub output as base

      // Write SRT content to file via a temp endpoint or assume it's already saved
      const srtPath = job.outputPath.replace(/_no_sub\.mp4$/, '_voice.srt');
      const subMode = el.voicesubMode?.value || 'soft';
      const outputPath = job.outputPath.replace(/_no_sub\.mp4$/, '_final.mp4');

      el.btnVoicesubApply.disabled = true;
      el.btnVoicesubApply.textContent = '⏳ Đang gán...';
      addLog(`[VoiceSub] Đang gán phụ đề (${subMode})...`, 'info');

      try {
        const result = await api.burnSubtitle(inputVideo, srtPath, outputPath, subMode);
        if (result.status === 'ok') {
          addLog('[VoiceSub] ✅ Đã gán phụ đề: ' + outputPath, 'success');
          showToast('Đã gán phụ đề thành công!', 'success');
        } else {
          addLog('[VoiceSub] ❌ ' + result.error, 'error');
        }
      } catch (e) { addLog('[VoiceSub] ❌ ' + e.message, 'error'); }
      finally {
        el.btnVoicesubApply.disabled = false;
        el.btnVoicesubApply.textContent = '📝 Gán sub vào video';
      }
    });
  }

  // ─── Column Resize ──────────────────────────────
  function initColumnResize() {
    const container = document.querySelector('.three-col');
    if (!container) return;
    const colCtrl = container.querySelector('.col-controls');
    const colPreview = container.querySelector('.col-preview');
    const colJobs = container.querySelector('.col-jobs');
    if (!colCtrl || !colPreview || !colJobs) return;

    // Load saved widths
    const savedWidths = localStorage.getItem('col_widths');
    if (savedWidths) {
      try {
        const w = JSON.parse(savedWidths);
        if (w.ctrl) colCtrl.style.width = w.ctrl + 'px';
        if (w.jobs) colJobs.style.width = w.jobs + 'px';
      } catch {}
    }

    function setupHandle(handle, leftCol, rightCol, isLeft) {
      if (!handle) return;
      let startX, startLeftW, startRightW;
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startX = e.clientX;
        startLeftW = leftCol.offsetWidth;
        startRightW = rightCol.offsetWidth;
        handle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        function onMove(e) {
          const dx = e.clientX - startX;
          const newLeftW = Math.max(160, Math.min(startLeftW + dx, 500));
          leftCol.style.width = newLeftW + 'px';
          if (!isLeft) {
            const newRightW = Math.max(160, Math.min(startRightW - dx, 500));
            rightCol.style.width = newRightW + 'px';
          }
        }
        function onUp() {
          handle.classList.remove('dragging');
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          // Save
          localStorage.setItem('col_widths', JSON.stringify({
            ctrl: colCtrl.offsetWidth,
            jobs: colJobs.offsetWidth
          }));
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    setupHandle(el.resizeHandle1, colCtrl, colPreview, true);
    setupHandle(el.resizeHandle2, colPreview, colJobs, false);
  }
  initColumnResize();

  // ─── Audio format for ref upload ─────────────────
  // ─── Processing: Per-Job Queue ───────────────────
  function updateStartButton() {
    const job = getActiveJob();
    // Enable if: there's an active job, it's idle (not yet queued), and backend is ready
    const canStart = job && job.status === 'idle' && state.isBackendReady;
    el.btnStart.disabled = !canStart;

    // Show cancel only if active job is processing
    if (job && (job.status === 'processing' || job.status === 'queued')) {
      el.btnStart.classList.add('hidden');
      el.btnCancel.classList.remove('hidden');
    } else {
      el.btnStart.classList.remove('hidden');
      el.btnCancel.classList.add('hidden');
    }
  }

  el.btnStart.addEventListener('click', () => {
    const job = getActiveJob();
    if (!job || job.status !== 'idle' || !state.isBackendReady) return;

    // Save current controls to job before queuing
    saveControlsToJob();

    // Mark as queued
    job.status = 'queued';
    addLog(`Job "${job.fileName}" đã thêm vào hàng đợi.`, 'info');
    renderJobList();
    updateStartButton();

    // Try to start processing if nothing is running
    processNextJob();
  });

  el.btnCancel.addEventListener('click', async () => {
    const job = getActiveJob();
    if (!job) return;
    if (job.status === 'processing') {
      try { await api.cancelProcess(); } catch (e) {}
      job.status = 'idle';
      job.progress = 0;
      state.processingJobId = null;
      if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
      addLog(`Đã hủy job "${job.fileName}".`, 'warning');
    } else if (job.status === 'queued') {
      job.status = 'idle';
      addLog(`Đã gỡ "${job.fileName}" khỏi hàng đợi.`, 'warning');
    }
    renderJobList();
    updateStartButton();
    el.progressSection.classList.add('hidden');
  });

  // Process the next queued job (multi-pass for multi-region)
  async function processNextJob() {
    if (state.processingJobId) return;
    const nextJob = state.jobs.find(j => j.status === 'queued');
    if (!nextJob) return;

    nextJob.status = 'processing';
    nextJob.progress = 0;
    state.processingJobId = nextJob.id;
    state.processingPassIndex = 0;
    renderJobList();

    addLog(`▶ Bắt đầu xử lý: ${nextJob.fileName}`, 'success');
    if (state.activeJobId === nextJob.id) {
      el.progressSection.classList.remove('hidden');
      updateStartButton();
    }

    await runNextPass(nextJob);
  }

  async function runNextPass(job) {
    const aiConfig = {
      provider: localStorage.getItem('ai_provider') || 'gemini',
      api_key: localStorage.getItem('ai_api_key') || '',
      endpoint: localStorage.getItem('ai_endpoint') || '',
      prompt: localStorage.getItem('ai_prompt') || ''
    };

    let subtitleAreas = [];
    let frameRange = null;
    let inputPath = job.filePath;

    if (job.subtitleMode === 'manual' && job.regions.length > 0) {
      // Multi-pass: each region is a separate pass
      const passIdx = state.processingPassIndex;
      if (passIdx >= job.regions.length) {
        // All passes done
        onJobFinished(job);
        return;
      }
      const region = job.regions[passIdx];
      subtitleAreas = [[region.ymin, region.ymax, region.xmin, region.xmax]];
      frameRange = { start: region.startFrame, end: region.endFrame };

      // For pass > 0: input is the output of previous pass
      if (passIdx > 0) {
        // Use temp output naming
        inputPath = job.outputPath.replace(/_no_sub\.mp4$/, `_pass${passIdx}_no_sub.mp4`);
      }

      // Output for this pass
      let outputPath;
      if (passIdx < job.regions.length - 1) {
        // Intermediate pass: temp file
        outputPath = job.outputPath.replace(/_no_sub\.mp4$/, `_pass${passIdx + 1}_no_sub.mp4`);
      } else {
        // Final pass: actual output
        outputPath = job.outputPath;
      }

      addLog(`  Pass ${passIdx + 1}/${job.regions.length}: Vùng #${region.label} (frame ${region.startFrame}-${region.endFrame})`, 'info');

      const jobPayload = [{
        input_path: inputPath,
        output_path: outputPath,
        subtitle_areas: subtitleAreas,
        frame_range: frameRange,
        inpaint_mode: job.algorithm,
        mask_mode: job.maskMode || 'box',
        extract_srt: passIdx === 0 ? job.extractSrt : false,
        ai_rewrite: passIdx === 0 ? job.aiRewrite : false,
        ai_config: aiConfig,
        tts_voice: passIdx === job.regions.length - 1 ? (localStorage.getItem('tts_voice') || 'none') : 'none',
        tts_bg_volume: parseInt(localStorage.getItem('tts_bg_volume') || '10')
      }];

      try {
        await api.startProcessBatch(jobPayload);
        state.pollTimer = setInterval(pollProgress, 2000);
      } catch (e) {
        addLog('Lỗi pass: ' + e.message, 'error');
        job.status = 'error';
        state.processingJobId = null;
        renderJobList();
        processNextJob();
      }
    } else {
      // Auto mode or manual with no regions: single pass, no frame range
      const jobPayload = [{
        input_path: job.filePath,
        output_path: job.outputPath,
        subtitle_areas: subtitleAreas,
        inpaint_mode: job.algorithm,
        mask_mode: job.maskMode || 'box',
        extract_srt: job.extractSrt,
        ai_rewrite: job.aiRewrite,
        ai_config: aiConfig,
        tts_voice: localStorage.getItem('tts_voice') || 'none',
        tts_bg_volume: parseInt(localStorage.getItem('tts_bg_volume') || '10')
      }];

      try {
        await api.startProcessBatch(jobPayload);
        state.pollTimer = setInterval(pollProgress, 2000);
      } catch (e) {
        addLog('Lỗi: ' + e.message, 'error');
        job.status = 'error';
        state.processingJobId = null;
        renderJobList();
        processNextJob();
      }
    }
  }

  async function pollProgress() {
    if (!state.processingJobId) return;
    const job = state.jobs.find(j => j.id === state.processingJobId);
    if (!job) return;

    try {
      const st = await api.getStatus();
      // Backend returns: { jobs: { [id]: { progress, status, ... } }, current_job_id }
      const backendJobId = st.current_job_id;
      const backendJob = backendJobId && st.jobs ? st.jobs[backendJobId] : null;

      if (backendJob) {
        const pct = backendJob.progress || 0;
        job.progress = pct;

        // Update progress UI if this is the active job
        if (state.activeJobId === job.id) {
          setProgress(pct, backendJob.status === 'processing' ? `${pct}%` : backendJob.status);
          // Sync frame: calculate frame from progress percentage
          if (pct > 0 && state.videoInfo && state.videoInfo.total_frames) {
            const frame = Math.min(
              Math.floor((pct / 100) * state.videoInfo.total_frames),
              state.videoInfo.total_frames - 1
            );
            loadSyncedFrame(frame);
          }
        }

        renderJobList();

        if (backendJob.status === 'finished' || pct >= 100) {
          onJobFinished(job);
        }
      }
    } catch (e) {}
  }

  function handleWSMessage(msg) {
    if (msg.type === 'progress' && msg.data) {
      const d = msg.data;
      const pct = d.progress || 0;
      const job = state.jobs.find(j => j.id === state.processingJobId);
      if (job) {
        job.progress = pct;
        if (state.activeJobId === job.id) {
          setProgress(pct, d.status || `${pct}%`);
          // Sync both frames during processing
          if (d.frame !== undefined && state.videoInfo) {
            loadSyncedFrame(d.frame);
          }
        }
        renderJobList();
        if (d.is_finished || pct >= 100) onJobFinished(job);
      }
    }
  }

  function setProgress(pct, text) {
    el.progressBar.style.width = `${pct}%`;
    el.progressLabel.textContent = `${Math.round(pct)}%`;
    if (text) el.progressEta.textContent = text;
  }

  function onJobFinished(job) {
    if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }

    // Check for multi-pass: if manual mode with regions and more passes remain
    if (job.subtitleMode === 'manual' && job.regions.length > 0) {
      state.processingPassIndex++;
      if (state.processingPassIndex < job.regions.length) {
        // More passes to go
        addLog(`  Pass ${state.processingPassIndex}/${job.regions.length} hoàn tất, tiếp tục...`, 'info');
        job.progress = Math.round((state.processingPassIndex / job.regions.length) * 100);
        renderJobList();
        runNextPass(job);
        return;
      }
    }

    // All passes done (or single pass)
    job.status = 'finished';
    job.progress = 100;
    state.processingJobId = null;
    state.processingPassIndex = 0;

    addLog(`✅ Hoàn tất: ${job.fileName}`, 'success');
    showToast(`"${job.fileName}" đã xử lý xong!`, 'success', 5000);

    renderJobList();

    // If this is the active job, update UI
    if (state.activeJobId === job.id) {
      setProgress(100, 'Hoàn tất!');
      updateStartButton();
      if (job.outputPath) {
        el.timelineResult.disabled = false;
        el.btnPlayResult.disabled = false;
        el.btnPrevResult.disabled = false;
        el.btnNextResult.disabled = false;
        loadSyncedFrame(0);
      }
    }

    // Process next queued job automatically
    processNextJob();
  }

  // ─── Settings Page ───────────────────────────────
  function loadSettingsValues() {
    if (el.aiProvider) el.aiProvider.value = localStorage.getItem('ai_provider') || 'gemini';
    if (el.aiApiKey) el.aiApiKey.value = localStorage.getItem('ai_api_key') || '';
    if (el.aiEndpoint) el.aiEndpoint.value = localStorage.getItem('ai_endpoint') || '';
    if (el.aiPrompt) el.aiPrompt.value = localStorage.getItem('ai_prompt') || el.aiPrompt.defaultValue;
    if (el.ttsVoice) el.ttsVoice.value = localStorage.getItem('tts_voice') || 'none';
    if (el.ttsLanguage) el.ttsLanguage.value = localStorage.getItem('tts_language') || 'vi';
    if (el.ttsBgVolume) {
      el.ttsBgVolume.value = localStorage.getItem('tts_bg_volume') || '10';
      if (el.volLabel) el.volLabel.textContent = el.ttsBgVolume.value + '%';
    }
  }

  if (el.ttsBgVolume) {
    el.ttsBgVolume.addEventListener('input', (e) => { if (el.volLabel) el.volLabel.textContent = e.target.value + '%'; });
  }

  if (el.btnSaveAi) {
    el.btnSaveAi.addEventListener('click', () => {
      localStorage.setItem('ai_provider', el.aiProvider.value);
      localStorage.setItem('ai_api_key', el.aiApiKey.value);
      localStorage.setItem('ai_endpoint', el.aiEndpoint.value);
      localStorage.setItem('ai_prompt', el.aiPrompt.value);
      localStorage.setItem('tts_voice', el.ttsVoice.value);
      localStorage.setItem('tts_language', el.ttsLanguage?.value || 'vi');
      localStorage.setItem('tts_bg_volume', el.ttsBgVolume.value);
      addLog('Đã lưu cấu hình AI & TTS!', 'success');
      showToast('Đã lưu cài đặt!', 'success');
    });
  }

  // ─── TTS Voice Clone Management ─────────────────────
  let _ttsRefAudioPath = null;

  function getSavedVoices() {
    try { return JSON.parse(localStorage.getItem('tts_voices') || '[]'); }
    catch { return []; }
  }

  function saveSavedVoices(voices) {
    localStorage.setItem('tts_voices', JSON.stringify(voices));
  }

  function renderSavedVoices() {
    const voices = getSavedVoices();
    const list = el.savedVoicesList;
    if (!list) return;
    if (voices.length === 0) {
      list.innerHTML = '<div class="voice-empty">Chưa có giọng clone nào.</div>';
    } else {
      list.innerHTML = voices.map((v, i) => `
        <div class="voice-card">
          <div class="voice-icon">🎤</div>
          <div class="voice-info">
            <div class="voice-name">${v.name}</div>
            <div class="voice-meta">${v.audioFile} • ${v.date}</div>
          </div>
          <div class="voice-actions">
            <button class="btn-voice-del" data-idx="${i}" title="Xóa">✕</button>
          </div>
        </div>`).join('');
    }
    // Update voice dropdown
    updateVoiceDropdown(voices);
    // Bind delete
    list.querySelectorAll('.btn-voice-del').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const vs = getSavedVoices();
        vs.splice(idx, 1);
        saveSavedVoices(vs);
        renderSavedVoices();
        showToast('Đã xóa giọng!', 'info');
      });
    });
  }

  function updateVoiceDropdown(voices) {
    if (!el.ttsVoice) return;
    // Keep first 2 options (none, default), remove rest
    while (el.ttsVoice.options.length > 2) el.ttsVoice.remove(2);
    voices.forEach((v, i) => {
      const opt = document.createElement('option');
      opt.value = `clone:${i}`;
      opt.textContent = `🧬 ${v.name}`;
      el.ttsVoice.appendChild(opt);
    });
    // Restore selection
    const saved = localStorage.getItem('tts_voice') || 'none';
    el.ttsVoice.value = saved;
  }

  // Upload ref audio
  if (el.btnUploadRefAudio) {
    el.btnUploadRefAudio.addEventListener('click', async () => {
      if (window.electronAPI && window.electronAPI.openFile) {
        const result = await window.electronAPI.openFile([{name:'Audio',extensions:['wav','mp3','flac','ogg','m4a','aac','wma','opus']}]);
        const fp = result && !result.canceled && result.filePaths?.[0];
        if (fp) {
          _ttsRefAudioPath = fp;
          el.refAudioName.textContent = fp.split(/[\\/]/).pop();
          el.refAudioPreview.src = 'file:///' + fp.replace(/\\/g, '/');
          el.refAudioPreview.style.display = '';
          el.btnCloneVoice.disabled = false;
        }
      } else {
        showToast('Chức năng chọn file chỉ khả dụng trong app', 'warn');
      }
    });
  }

  // Clone voice button - test-generate to validate clone
  if (el.btnCloneVoice) {
    el.btnCloneVoice.addEventListener('click', async () => {
      const name = el.cloneVoiceName?.value?.trim();
      if (!name) { showToast('Nhap ten giong!', 'warn'); return; }
      if (!_ttsRefAudioPath) { showToast('Chon file audio mau!', 'warn'); return; }

      el.btnCloneVoice.disabled = true;
      el.btnCloneVoice.textContent = 'Dang tao mau giong...';
      addLog(`[TTS] Dang clone giong "${name}"...`, 'info');

      try {
        const lang = el.ttsLanguage?.value || 'vi';
        const testText = 'Xin chao, day la giong doc duoc clone boi OmniVoice.';
        const result = await api.generateTTS(testText, _ttsRefAudioPath, lang);

        if (result.status === 'ok' && result.audio_path) {
          const voices = getSavedVoices();
          voices.push({
            name,
            audioPath: _ttsRefAudioPath,
            audioFile: _ttsRefAudioPath.split(/[\\/]/).pop(),
            samplePath: result.audio_path,
            date: new Date().toLocaleDateString('vi-VN'),
          });
          saveSavedVoices(voices);
          renderSavedVoices();

          if (el.ttsTestAudio) {
            el.ttsTestAudio.src = 'file:///' + result.audio_path.replace(/\\/g, '/');
            el.ttsTestAudio.style.display = '';
            el.ttsTestAudio.play();
          }

          el.cloneVoiceName.value = '';
          _ttsRefAudioPath = null;
          el.refAudioName.textContent = 'Chua chon file';
          el.refAudioPreview.style.display = 'none';

          showToast('Da clone giong "' + name + '" thanh cong!', 'success');
          addLog('[TTS] Clone giong "' + name + '" thanh cong!', 'success');
        } else {
          addLog('[TTS] Clone that bai: ' + (result.error || 'Unknown'), 'error');
          showToast('Clone giong that bai: ' + (result.error || ''), 'error');
        }
      } catch (e) {
        addLog('[TTS] Loi: ' + e.message, 'error');
        showToast('Khong the ket noi TTS engine', 'error');
      } finally {
        el.btnCloneVoice.disabled = false;
        el.btnCloneVoice.textContent = 'Them giong clone';
      }
    });
  }

  // Test TTS button
  if (el.btnTestTts) {
    el.btnTestTts.addEventListener('click', async () => {
      const text = el.ttsTestText?.value?.trim();
      if (!text) { showToast('Nhap text de thu!', 'warn'); return; }

      const voiceVal = el.ttsVoice?.value || 'default';
      let refAudio = null;
      if (voiceVal.startsWith('clone:')) {
        const idx = parseInt(voiceVal.split(':')[1]);
        const voices = getSavedVoices();
        if (voices[idx]) refAudio = voices[idx].audioPath;
      }

      el.btnTestTts.disabled = true;
      el.btnTestTts.textContent = 'Dang tao...';
      addLog(`[TTS] Dang tao giong thu: "${text.substring(0, 50)}..."`, 'info');

      try {
        const lang = el.ttsLanguage?.value || 'vi';
        const result = await api.generateTTS(text, refAudio, lang);
        if (result.status === 'ok' && result.audio_path) {
          el.ttsTestAudio.src = 'file:///' + result.audio_path.replace(/\\/g, '/');
          el.ttsTestAudio.style.display = '';
          el.ttsTestAudio.play();
          addLog('[TTS] Tao voice thanh cong!', 'success');
        } else {
          addLog('[TTS] Loi: ' + (result.error || 'Unknown'), 'error');
          showToast('Loi TTS: ' + (result.error || ''), 'error');
        }
      } catch (e) {
        addLog('[TTS] Loi ket noi: ' + e.message, 'error');
        showToast('Khong the ket noi TTS engine', 'error');
      } finally {
        el.btnTestTts.disabled = false;
        el.btnTestTts.textContent = 'Thu phat';
      }
    });
  }

  // Check TTS status
  async function checkTTSStatus() {
    if (!el.ttsStatusChip) return;
    try {
      const r = await fetch(`${api.base || 'http://localhost:8765'}/api/tts/status`);
      const status = await r.json();
      if (status.available) {
        el.ttsStatusChip.textContent = 'San sang';
        el.ttsStatusChip.className = 'status-chip online';
      } else {
        el.ttsStatusChip.textContent = 'Chua cai OmniVoice';
        el.ttsStatusChip.className = 'status-chip offline';
      }
    } catch (e) {
      console.warn('[TTS] Status check failed:', e.message);
      el.ttsStatusChip.textContent = 'Backend chua ket noi';
      el.ttsStatusChip.className = 'status-chip offline';
      setTimeout(checkTTSStatus, 10000);
    }
  }

  // Init saved voices and TTS status
  renderSavedVoices();
  setTimeout(checkTTSStatus, 8000);

  // Utils
  function fmtTime(s) {
    if (!s || isNaN(s)) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

});
