/**
 * Video Subtitle Remover - Main App Logic
 * Each job is independently configurable and queued for sequential processing.
 */
(function () {
  'use strict';

  // ΓöÇΓöÇΓöÇ Constants ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const REGION_COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#ef4444'];

  // ΓöÇΓöÇΓöÇ State ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  const state = {
    jobs: [],
    activeJobId: null,
    outputDir: null,
    isBackendReady: false,
    isDrawing: false,           // draw mode active
    isSelecting: false,         // currently dragging
    selectionStart: null,
    playIntervalOrig: null,
    playIntervalResult: null,
    currentFrameOrig: 0,
    currentFrameResult: 0,
    videoInfo: null,
    processingJobId: null,
    processingPassIndex: 0,     // current pass in multi-pass
    pollTimer: null,
    processingStartTime: null,  // timestamp when job started
    processingTimerInterval: null, // setInterval for elapsed timer
    livePreviewInterval: null,  // setInterval for live preview polling (Bug #6 fix)
  };

  // Expose state globally so secondary IIFEs (Prompt Manager, etc.) can access it
  window._appState = state;

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
      asrFallback: false,
      asrLanguage: 'vi',
      aiRewrite: false,
      ttsGenerate: false,
      voiceSub: false,
      srtContent: '',
      aiContent: '',
      voiceSubContent: '',
      voiceSegments: [],
      // Auto-pipeline flags (prevent duplicate triggers)
      _aiTriggered: false,
      _ttsTriggered: false,
    };
  }

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ΓöÇΓöÇΓöÇ DOM Refs ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
    pipelineSteps: $$('.pipeline-step'),
    pipelinePanes: $$('.pipeline-pane'),
    btnUploadStep1: $('#btn-upload-step1'),
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
    cloudAiPanel: $('#cloud-ai-panel'),
    localAiPanel: $('#local-ai-panel'),
    apiKeyList: $('#api-key-list'),
    btnAddAiKey: $('#btn-add-ai-key'),
    btnTestAiKeys: $('#btn-test-ai-keys'),
    aiModel: $('#ai-model'),
    aiEndpoint: $('#ai-endpoint'),
    btnScanOllama: $('#btn-scan-ollama'),
    ollamaModelSelect: $('#ollama-model-select'),
    btnAddOllamaModel: $('#btn-add-ollama-model'),
    ollamaModelList: $('#ollama-model-list'),
    aiPrompt: $('#ai-prompt'),
    ttsVoice: $('#tts-voice'),
    ttsLanguage: $('#tts-language'),
    ttsBgVolume: $('#tts-bg-volume'),
    ttsRemoveVocal: $('#tts-remove-vocal'),
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

  // ΓöÇΓöÇΓöÇ Helpers: Active Job ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
    job.asrFallback = $('#chk-asr-fallback')?.checked || false;
    job.asrLanguage = $('#asr-language')?.value || 'vi';
    job.aiRewrite = $('#chk-ai-rewrite')?.checked || false;
    job.ttsGenerate = el.chkTtsGenerate?.checked || false;
    job.voiceSub = el.chkVoiceSub?.checked || false;
      // Auto-save global AI/TTS settings so user choices apply immediately
      const provider = el.aiProvider ? el.aiProvider.value : (localStorage.getItem('ai_provider') || 'gemini');
      localStorage.setItem('ai_provider', provider);
      const apiKey = document.getElementById('ai-api-key');
      if (apiKey && apiKey.value) localStorage.setItem('ai_api_key', apiKey.value);
      if (el.aiEndpoint) localStorage.setItem('ai_endpoint', el.aiEndpoint.value);
      if (el.aiModel && el.aiModel.value) localStorage.setItem('ai_model_' + provider, el.aiModel.value);
      if (el.ttsVoice) localStorage.setItem('tts_voice', el.ttsVoice.value);
      if (el.ttsLanguage) localStorage.setItem('tts_language', el.ttsLanguage.value);
      if (el.ttsBgVolume) localStorage.setItem('tts_bg_volume', el.ttsBgVolume.value);
      if (el.ttsRemoveVocal) localStorage.setItem('tts_remove_vocal', el.ttsRemoveVocal.checked);

  }

  // Load a job's settings INTO the controls panel
  function loadControlsFromJob(job) {
    if (!job) return;
    el.algoSelect.value = job.algorithm;
    if (el.maskMode) el.maskMode.value = job.maskMode || 'box';
    const chkSrt = $('#chk-extract-srt');
    const chkAsr = $('#chk-asr-fallback');
    const selAsrLang = $('#asr-language');
    const chkAi = $('#chk-ai-rewrite');
    if (chkSrt) chkSrt.checked = job.extractSrt;
    if (chkAsr) chkAsr.checked = job.asrFallback || false;
    if (selAsrLang) selAsrLang.value = job.asrLanguage || 'vi';
    if (chkAi) chkAi.checked = job.aiRewrite;
    // Show/hide ASR options
    const asrOpts = $('#asr-options');
    if (asrOpts) asrOpts.style.display = job.asrFallback ? '' : 'none';
    const chkTts = el.chkTtsGenerate;
    if (chkTts) chkTts.checked = job.ttsGenerate || false;
    const chkVS = el.chkVoiceSub;
    if (chkVS) chkVS.checked = job.voiceSub || false;
    // Toggle content panels
    if (job) {
      $('#card-srt')?.classList.toggle('active', job.extractSrt);
      $('#card-ai')?.classList.toggle('active', job.aiRewrite);
      $('#card-voice')?.classList.toggle('active', job.ttsGenerate);
      $('#card-voicesub')?.classList.toggle('active', job.voiceSub);
    }
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

  // ΓöÇΓöÇΓöÇ Navigation ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  el.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-page') || item.dataset?.page;
      if (!page) return;
      el.navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      el.pages.forEach(p => p.classList.remove('active'));
      const target = $(`#page-${page}`);
      if (target) target.classList.add('active');
      if (page === 'settings') { loadSettingsValues(); checkTTSStatus(); }
    });
  });

  // ΓöÇΓöÇΓöÇ Toast & Log ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  // ─── Log Tab System ─────────────────────────────────
  let activeLogTab = 'all';

  function getLogCategory(message) {
    const msg = message.toLowerCase();
    // Feature logs: ASR, AI, TTS, Voice, VoiceSub, SRT extraction results
    if (/^\[(asr|ai|tts|voice|voicesub)\]/i.test(message)) return 'feature';
    if (msg.includes('trích xuất') && msg.includes('srt')) return 'feature';
    if (msg.includes('phụ đề ai')) return 'feature';
    if (msg.includes('âm thanh tts')) return 'feature';
    if (msg.includes('viết lại')) return 'feature';
    if (msg.includes('lồng tiếng')) return 'feature';
    if (msg.includes('clone gi')) return 'feature';
    // Inpaint/subtitle removal logs
    if (/^\[py\]/i.test(message)) return 'inpaint';
    if (/^\[err\]/i.test(message)) return 'inpaint';
    if (/^\[inpaint\]/i.test(message)) return 'inpaint';
    if (msg.includes('pass ') && msg.includes('vùng')) return 'inpaint';
    if (msg.includes('xử lý') && (msg.includes('frame') || msg.includes('pass'))) return 'inpaint';
    if (msg.includes('hoàn tất')) return 'inpaint';
    if (msg.includes('payload')) return 'inpaint';
    // System logs: backend, GPU, file operations, UI errors
    return 'system';
  }

  function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    const cat = getLogCategory(message);
    entry.className = `log-entry log-${type}`;
    entry.dataset.logCat = cat;
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    entry.textContent = `[${time}] ${message}`;
    // Apply tab filter
    if (activeLogTab !== 'all' && activeLogTab !== cat) {
      entry.classList.add('log-hidden');
    }
    el.logOutput.appendChild(entry);
    el.logOutput.scrollTop = el.logOutput.scrollHeight;
  }
  window.addLog = addLog;

  // Tab switching
  document.querySelectorAll('.log-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.log-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeLogTab = tab.dataset.logTab;
      // Filter existing entries
      el.logOutput.querySelectorAll('.log-entry').forEach(entry => {
        if (activeLogTab === 'all' || entry.dataset.logCat === activeLogTab) {
          entry.classList.remove('log-hidden');
        } else {
          entry.classList.add('log-hidden');
        }
      });
      el.logOutput.scrollTop = el.logOutput.scrollHeight;
    });
  });

  window.addEventListener('error', (e) => {
    console.error('Global Error:', e);
    addLog(`[UI Error] ${e.message}`, 'error');
  });

  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Rejection:', e.reason);
    addLog(`[UI Async Error] ${e.reason?.message || e.reason}`, 'error');
  });

  el.btnClearLog?.addEventListener('click', () => { if (el.logOutput) el.logOutput.innerHTML = ''; });
  el.btnCopyLog?.addEventListener('click', () => {
    if (!el.logOutput) return;
    // Only copy visible (non-hidden) log entries
    const visibleText = Array.from(el.logOutput.querySelectorAll('.log-entry:not(.log-hidden)'))
      .map(e => e.textContent).join('\n');
    navigator.clipboard.writeText(visibleText).then(() => showToast('Đã sao chép!', 'success'));
  });

  // ΓöÇΓöÇΓöÇ Backend Connection ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  async function connectToBackend() {
    addLog('Đang kết nối đến Python backend...', 'info');
    setStatus('connecting');

    // Bridge Python stdout → frontend log panel (do this once on startup)
    if (window.electronAPI?.onPythonLog) {
      window.electronAPI.onPythonLog((msg) => {
        if (msg && msg.trim()) addLog('[PY] ' + msg.trim(), 'info');
      });
    }
    if (window.electronAPI?.onPythonError) {
      window.electronAPI.onPythonError((msg) => {
        if (msg && msg.trim()) addLog('[ERR] ' + msg.trim(), 'error');
      });
    }

    const ready = await api.waitForBackend(60, 1000);
    if (ready) {
      state.isBackendReady = true;
      setStatus('online');
      addLog('Backend đã sẵn sàng!', 'success');
      api.connectWebSocket();
      api.onWebSocketMessage(handleWSMessage);
      loadGpuInfo();
      updateStartButton();
      checkAsrStatus();
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
      else { dot.classList.add('offline'); addLog('Không phát hiện GPU ΓåÆ CPU.', 'warning'); }
    } catch (e) { addLog('Lỗi GPU: ' + e.message, 'error'); }
  }

  // ΓöÇΓöÇΓöÇ File Selection ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  async function selectFile() {
    if (window.electronAPI && window.electronAPI.openFile) {
      try {
        const result = await window.electronAPI.openFile();
        if (result && !result.canceled && result.filePaths?.length > 0) {
          result.filePaths.forEach(fp => addToQueue(fp));
          if (!state.activeJobId && state.jobs.length > 0) selectJob(state.jobs[state.jobs.length - 1].id);
          return;
        }
      } catch (e) {
        addLog('Lỗi dialog file: ' + e.message, 'error');
      }
    }
    // Fallback: HTML File Input
    let fileInp = $('#hidden-file-input');
    if (!fileInp) {
      fileInp = document.createElement('input');
      fileInp.type = 'file';
      fileInp.id = 'hidden-file-input';
      fileInp.accept = 'video/*,.mp4,.avi,.mkv,.mov';
      fileInp.multiple = true;
      fileInp.style.display = 'none';
      document.body.appendChild(fileInp);
      fileInp.addEventListener('change', (e) => {
        if (e.target.files?.length > 0) {
          Array.from(e.target.files).forEach(f => {
            const fp = f.path || f.name;
            if (fp) addToQueue(fp);
          });
          if (!state.activeJobId && state.jobs.length > 0) selectJob(state.jobs[state.jobs.length - 1].id);
        }
      });
    }
    fileInp.click();
  }

  function addToQueue(filePath) {
    if (state.jobs.find(j => j.filePath === filePath)) return;
    const job = createJob(filePath);
    state.jobs.push(job);
    renderJobList();
    updateStartButton();
    addLog(`Đã thêm: ${job.fileName}`, 'info');
    // Always select the newly added job to show preview
    selectJob(job.id);
  }

  // ΓöÇΓöÇΓöÇ Select / Switch Job ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇΓöÇ Render Job List ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  function renderJobList() {
    // Original step 2 job list
    const list2 = document.getElementById('job-list');
    if (list2) {
      list2.innerHTML = '';
      state.jobs.forEach(job => {
        const card = document.createElement('div');
        card.className = `job-card ${job.id === state.activeJobId ? 'active' : ''}`;
        
        const statusLabel = {
          idle: 'Chờ cài đặt',
          queued: 'Đang đợi...',
          processing: 'Đang xử lý',
          finished: 'Hoàn tất',
          error: 'Lỗi',
        }[job.status] || job.status;

        card.innerHTML = `
          <div class="job-name" title="${job.filePath}">${job.fileName}</div>
          <div class="job-detail" style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div>
              <span class="status-tag status-${job.status}">${statusLabel}</span>
              <span>${job.progress}%</span>
            </div>
            ${(job.status === 'finished' && (job.finalOutputPath || job.outputPath)) ? `<button class="btn btn-xs btn-ghost" onclick="event.stopPropagation(); window.electronAPI.openPath('${(job.finalOutputPath || job.outputPath).replace(/\\\\/g, '\\\\\\\\')}')" style="margin-left:8px; padding: 2px 6px; z-index:10;">📂 ${job.finalOutputPath ? '🎬 Final' : 'Mở Video'}</button>` : ''}
          </div>
          <div class="job-progress-bar"><div class="job-progress-fill" style="width:${job.progress}%"></div></div>
        `;
        card.addEventListener('click', (e) => {
           if (e.target.classList.contains('btn-delete-job')) {
              state.jobs = state.jobs.filter(j => j.id !== job.id);
              if(state.activeJobId === job.id) state.activeJobId = null;
              renderJobList();
           } else {
              selectJob(job.id);
           }
        });
        list2.appendChild(card);
      });
    }

    // Step 1 detailed job list
    const list1 = document.getElementById('step1-job-list');
    const jobCount = document.getElementById('job-count');
    if (list1) {
      list1.innerHTML = '';
      if(jobCount) jobCount.textContent = `(${state.jobs.length} Items)`;
      if (state.jobs.length === 0) {
         list1.innerHTML = '<div class="job-empty" style="text-align:center; color:#71717a; margin-top:50px;">Chưa có video nào. Bấm "+ Thêm Video" để bắt đầu.</div>';
      } else {
         state.jobs.forEach((job, idx) => {
           const card = document.createElement('div');
           card.className = 'tk-job-card';
           const stClass = job.status === 'finished' ? 'completed' : (job.status === 'error' ? 'failed' : 'processing');
           card.innerHTML = `
             <div class="tk-job-card-header ${stClass}">
               <span>Job #${idx+1}: ${job.fileName}</span>
               <div style="display:flex; gap: 6px; align-items:center;">
                 <span style="background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:4px; font-size:11px;">${job.status.toUpperCase()}</span>
                 ${(job.status === 'processing') 
                    ? `<button class="btn-stop-job" data-id="${job.id}" style="background:#ef4444; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:11px;">⏹ Dừng (${job._elapsedTimeString || '00:00'})</button>`
                    : (job.status === 'queued') 
                      ? `<button class="btn-stop-job" data-id="${job.id}" style="background:#ef4444; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:11px;">⏹ Hủy</button>`
                      : `<button class="btn-process-job" data-id="${job.id}" style="background:#10b981; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:11px;">▶ Chạy</button>`
                 }
                 <button class="btn-delete-job" data-id="${job.id}" style="background:rgba(239, 68, 68, 0.8); color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:11px;">✖</button>
               </div>
             </div>
             <div class="tk-job-card-body">
               <div class="tk-job-col">
                  <label>Analyzed Text</label>
                  <div class="tk-box">${job.aiContent || job.srtContent || 'Chưa có dữ liệu'}</div>
               </div>
               <div class="tk-job-col">
                  <label>TTS (Text-to-Speech)</label>
                  <div class="tk-box" style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
                     <div style="color:#71717a; font-size:11px; margin-bottom:8px;">Audio Waveform...</div>
                     <div class="tk-tts-controls" style="width:100%;">
                        <button class="btn-play">▶ Play</button>
                        <button class="btn-regen">↻ Regenerate</button>
                        <button class="btn-delete-job del" data-id="${job.id}">🗑 Delete</button>
                     </div>
                  </div>
               </div>
             </div>
           `;
           card.addEventListener('click', async (e) => {
             if (e.target.classList.contains('btn-delete-job')) {
                state.jobs = state.jobs.filter(j => j.id !== job.id);
                if(state.activeJobId === job.id) state.activeJobId = null;
                renderJobList();
             } else if (e.target.classList.contains('btn-process-job')) {
                if (job.status === 'idle' || job.status === 'error' || job.status === 'finished') {
                   job.status = 'queued';
                   renderJobList();
                   processNextJob();
                }
             } else if (e.target.classList.contains('btn-stop-job')) {
                if (job.status === 'processing') {
                   addLog(`Đang dừng xử lý Job "${job.fileName}"...`, 'warning');
                   await api.cancelProcess();
                }
                job.status = 'idle';
                job._elapsedTimeString = '';
                if (state.processingJobId === job.id) {
                   state.processingJobId = null;
                }
                renderJobList();
                updateStartButton();
             } else {
                selectJob(job.id);
             }
           });
           list1.appendChild(card);
         });
      }
    }
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

  // ─── Load Video for a Job ────────────────────────────
  async function loadVideo(job) {
    try {
      if (!state.isBackendReady) {
        addLog('Backend chưa sẵn sàng, đang chờ...', 'warning');
        // Retry after 2s if backend not ready
        setTimeout(() => loadVideo(job), 2000);
        return;
      }
      addLog(`Đang tải preview: ${job.fileName}...`, 'info');
      const info = await api.videoInfo(job.filePath);
      if (!info || !info.width) {
        addLog('Lỗi: Backend trả dữ liệu video không hợp lệ', 'error');
        return;
      }
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
      console.error('loadVideo error:', e);
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

  // ΓöÇΓöÇΓöÇ Synced Playback (both panes follow same frame) ΓöÇΓöÇ
  // Load both frames at the same position
  function loadSyncedFrame(n) {
    loadOrigFrame(n);
    const job = getActiveJob();
    if (job && (job.status === 'finished') && job.outputPath) {
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

  // ΓöÇΓöÇΓöÇ Subtitle Mode (per job) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
      if (job && job.regions.length >= 6) showToast('Tß╗æi ─æa 6 v├╣ng!', 'warning');
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
      maskMode: job.maskMode || 'box',  // inherit job default, user can override per-region
    };
    job.regions.push(region);
    addLog(`Vùng #${region.label} đã thêm: Y[${region.ymin}-${region.ymax}] X[${region.xmin}-${region.xmax}]`, 'success');
    renderRegionsList();
    renderRegionOverlays();
  });

  // --- Render Region List (controls panel) ----------
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

      // Build card via DOM (avoids template literal encoding issues)
      const top = document.createElement('div'); top.className = 'region-top';
      const lbl = document.createElement('span'); lbl.className = 'region-label';
      lbl.style.color = r.color; lbl.textContent = `📍 Vùng #${r.label}`;
      const delBtn = document.createElement('button'); delBtn.className = 'btn-del';
      delBtn.dataset.rid = r.id; delBtn.title = 'Xóa vùng'; delBtn.textContent = '✕';
      top.appendChild(lbl); top.appendChild(delBtn);

      const coords = document.createElement('div'); coords.className = 'region-coords';
      coords.textContent = `Y:${r.ymin}-${r.ymax} X:${r.xmin}-${r.xmax}`;

      // Per-region mask mode
      const maskRow = document.createElement('div'); maskRow.className = 'region-mask-row';
      const maskLbl = document.createElement('span'); maskLbl.textContent = 'Mask:';
      const maskSel = document.createElement('select'); maskSel.className = 'region-mask-sel';
      [['box','Hộp (Box)'],['tight','Chặt (Tight)'],['soft','Mềm (Soft)']].forEach(([v,t]) => {
        const opt = document.createElement('option'); opt.value = v; opt.textContent = t;
        if ((r.maskMode || 'box') === v) opt.selected = true;
        maskSel.appendChild(opt);
      });
      maskSel.dataset.rid = r.id;
      maskRow.appendChild(maskLbl); maskRow.appendChild(maskSel);

      const timeline = document.createElement('div'); timeline.className = 'region-timeline';
      const spanFrom = document.createElement('span'); spanFrom.textContent = 'Từ';
      const inpStart = document.createElement('input');
      Object.assign(inpStart, { type: 'number', className: 'region-start', value: r.startFrame, min: 0, max: totalFrames });
      inpStart.dataset.rid = r.id;
      const spanTo = document.createElement('span'); spanTo.textContent = '→';
      const inpEnd = document.createElement('input');
      Object.assign(inpEnd, { type: 'number', className: 'region-end', value: r.endFrame, min: 0, max: totalFrames });
      inpEnd.dataset.rid = r.id;
      timeline.appendChild(spanFrom); timeline.appendChild(inpStart);
      timeline.appendChild(spanTo); timeline.appendChild(inpEnd);

      card.appendChild(top); card.appendChild(coords); card.appendChild(maskRow); card.appendChild(timeline);
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
    // Per-region mask mode change
    el.regionsList.querySelectorAll('.region-mask-sel').forEach(sel => {
      sel.addEventListener('change', () => {
        const r = job.regions.find(x => x.id === sel.dataset.rid);
        if (r) r.maskMode = sel.value;
      });
    });
  }

  // ΓöÇΓöÇΓöÇ Render Region Overlays on Canvas ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // Handle dropdowns inside the feature cards that might not have ID-based binding above
  document.getElementById('right-panel')?.addEventListener('change', (e) => {
    const job = getActiveJob();
    if (!job) return;
    if (e.target.id === 'job-tts-voice') {
      job.ttsVoice = e.target.value;
    }
  });

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

  // ΓöÇΓöÇΓöÇ Job Cards (Accordion) Logic ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  document.querySelectorAll('.job-card-header').forEach(header => {
    header.addEventListener('click', (e) => {
      // Don't toggle accordion if they clicked the checkbox directly
      if (e.target.tagName.toLowerCase() === 'input') return;
      const card = header.closest('.job-card');
      card.classList.toggle('active');
    });
  });

  // Sync checkboxes with Job state
  ['chk-extract-srt', 'chk-ai-rewrite', 'chk-tts-generate', 'chk-voice-sub'].forEach(id => {
    const chk = $(`#${id}`);
    if (chk) {
      chk.addEventListener('change', () => {
        const job = getActiveJob();
        if (job) {
          if (id === 'chk-extract-srt') job.extractSrt = chk.checked;
          if (id === 'chk-ai-rewrite') job.aiRewrite = chk.checked;
          if (id === 'chk-tts-generate') job.ttsGenerate = chk.checked;
          if (id === 'chk-voice-sub') {
            job.voiceSub = chk.checked;
            if (job.voiceSub && !job.voiceSubContent) {
              job.voiceSubContent = job.aiContent || job.srtContent || '';
              const elSubContent = $('#voicesub-content');
              if (elSubContent) elSubContent.value = job.voiceSubContent;
            }
          }
          saveControlsToJob();
        }
      });
    }
  });


  // ΓöÇΓöÇΓöÇ Voice Segments Renderer ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇΓöÇ Action Buttons: AI ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
      const srtText = el.aiContent?.value?.trim() || document.getElementById('srt-content')?.value?.trim();
      if (!srtText) { showToast('Chưa có nội dung phụ đề!', 'warn'); return; }
      
      const srtPath = job.outputPath.replace(/_no_sub\.mp4$/, '_ai_rewrite.srt');
      try {
        // Write SRT to file before burning
        await fetch(`${api.base}/api/write-file`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({path: srtPath, content: srtText})
        });

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

  const btnRetryAi = document.getElementById('btn-retry-ai');
  if (btnRetryAi) {
    btnRetryAi.addEventListener('click', async () => {
        const _prov = document.getElementById('ai-provider') ? document.getElementById('ai-provider').value : 'gemini';
        localStorage.setItem('ai_provider', _prov);
        if (document.getElementById('ai-api-key') && document.getElementById('ai-api-key').value) localStorage.setItem('ai_api_key', document.getElementById('ai-api-key').value);
        if (document.getElementById('ai-endpoint') && document.getElementById('ai-endpoint').value) localStorage.setItem('ai_endpoint', document.getElementById('ai-endpoint').value);
        if (document.getElementById('ai-model') && document.getElementById('ai-model').value) localStorage.setItem('ai_model_' + _prov, document.getElementById('ai-model').value);

      const srtText = document.getElementById('srt-content')?.value?.trim();
      if (!srtText) { showToast('Chưa có phụ đề gốc để viết lại!', 'warn'); return; }
      const promptSel = document.getElementById('ai-prompt-select');
      const promptText = promptSel ? promptSel.options[promptSel.selectedIndex]?.text : '';
      if (!promptText) { showToast('Vui lòng chọn prompt AI', 'warn'); return; }
      
      btnRetryAi.disabled = true;
      addLog('[AI] Đang viết lại phụ đề...', 'info');
      try {
        const provider = localStorage.getItem('ai_provider') || 'gemini';
        let api_keys = [];
        try { api_keys = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]'); } catch { api_keys = []; }
        const selectedModel = localStorage.getItem(`ai_model_${provider}`) || '';
        if (api_keys.length === 0) {
          if (provider === 'ollama' && selectedModel) api_keys = [selectedModel];
          else if (localStorage.getItem('ai_api_key')) api_keys = [localStorage.getItem('ai_api_key')];
        }
        const aiConfig = {
          provider: provider,
          api_keys: api_keys.map(k => k.key || k),
          model: selectedModel,
          endpoint: localStorage.getItem('ai_endpoint') || '',
          prompt: promptText
        };
        const res = await fetch(`${api.base}/api/ai-rewrite`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({srt_content: srtText, ai_config: aiConfig})
        });
        const data = await res.json();
        if (data.status === 'ok') {
            document.getElementById('ai-content').value = data.result;
            addLog('[AI] Viết lại thành công!', 'success');
        } else {
            addLog('[AI] Lỗi: ' + data.error, 'error');
        }
      } catch(e) { addLog('[AI] Lỗi kết nối: ' + e.message, 'error'); }
      finally { btnRetryAi.disabled = false; }
    });
  }

  const btnRetryTts = document.getElementById('btn-retry-tts');
  if (btnRetryTts) {
    btnRetryTts.addEventListener('click', async () => {
      const srtText = document.getElementById('ai-content')?.value?.trim() || document.getElementById('srt-content')?.value?.trim();
      if (!srtText) { showToast('Chưa có phụ đề để lồng tiếng!', 'warn'); return; }
      const voice = document.getElementById('job-tts-voice')?.value;
      if (!voice || voice === 'none') { showToast('Vui lòng chọn giọng đọc', 'warn'); return; }
      
      let refAudio = null;
      if (voice.startsWith('clone:')) {
        const idx = parseInt(voice.split(':')[1]);
        const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
        if (voices[idx]) refAudio = voices[idx].audioPath;
      }
      
      const job = getActiveJob();
      if (!job) return;
      
      btnRetryTts.disabled = true;
      btnRetryTts.textContent = '⏳ Đang tạo...';
      addLog('[TTS] Đang tạo âm thanh...', 'info');
      try {
        const res = await fetch(`${api.base}/api/tts-retry`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({srt_content: srtText, tts_voice: voice, video_path: job.filePath, tts_ref_audio: refAudio})
        });
        const data = await res.json();
        if (data.status === 'ok') {
            // Lưu audio_path vào job để nút "Ghép voice" dùng được
            job.voiceSegments = [{ text: 'Manual TTS', audio_path: data.audio_path }];
            renderVoiceSegments(job.voiceSegments);

            const audio = document.getElementById('job-tts-preview-audio');
            if (audio) {
              audio.src = 'file://' + data.audio_path.replace(/\\/g, '/');
              audio.style.display = 'block';
              audio.play().catch(() => {});
            }
            addLog('[TTS] ✅ Tạo Voice thành công! Bấm "Ghép voice vào video" để tiếp tục.', 'success');
            showToast('Đã tạo voice! Bấm ghép để hoàn tất.', 'success');
        } else {
            addLog('[TTS] ❌ Lỗi: ' + (data.error || JSON.stringify(data.detail) || 'Lỗi không xác định'), 'error');
        }
      } catch(e) { addLog('[TTS] ❌ Lỗi: ' + e.message, 'error'); }
      finally { btnRetryTts.disabled = false; btnRetryTts.textContent = '🔄 Tạo lại TTS'; }
    });
  }

  // ΓöÇΓöÇΓöÇ Action Buttons: Voice ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
      if (!job || !job.voiceSegments?.length) { showToast('Chưa có voice nào! Hãy tạo voice trước.', 'warn'); return; }
      const audioPath = job.voiceSegments[0]?.audio_path;
      if (!audioPath) { showToast('Không tìm thấy file audio.', 'warn'); return; }

      const baseVideo = job.outputPath || job.filePath;
      if (!baseVideo) { showToast('Chưa có video đã xóa phụ đề!', 'warn'); return; }

      el.btnVoiceApply.disabled = true;
      el.btnVoiceApply.textContent = '⏳ Đang xử lý...';
      addLog('[Voice] 🚀 Bắt đầu ghép voice vào video...', 'info');

      try {
        // ── Bước 1: Remove vocal nếu bật ──────────────────────────────
        const removeVocal = localStorage.getItem('tts_remove_vocal') === 'true';
        let bgAudioPath = null;
        if (removeVocal) {
          el.btnVoiceApply.textContent = '⏳ Tách vocal...';
          addLog('[Voice] 🎵 Đang tách vocal gốc...', 'info');
          try {
            const vocalRes = await api.removeVocal(job.filePath);
            if (vocalRes.status === 'ok' || vocalRes.status === 'warning') {
              bgAudioPath = vocalRes.audio_path;
              addLog(`[Voice] ✅ Tách vocal xong (${vocalRes.method_used}).`, 'success');
            }
          } catch(e) { addLog('[Voice] ⚠️ Bỏ qua tách vocal: ' + e.message, 'warning'); }
        }

        // ── Bước 2: Mix audio vào video ────────────────────────────────
        el.btnVoiceApply.textContent = '⏳ Ghép audio...';
        const bgVol = parseInt(localStorage.getItem('tts_bg_volume') || '10');
        const videoWithVoice = job.filePath.replace(/\.[^.]+$/, '') + '_with_voice.mp4';
        let mergeRes;
        if (bgAudioPath) {
          mergeRes = await fetch(`${api.base}/api/mix-audio-tracks`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ video_path: baseVideo, tts_path: audioPath, bg_audio_path: bgAudioPath, output_path: videoWithVoice, bg_volume: bgVol })
          }).then(r => r.json());
        } else {
          mergeRes = await api.replaceAudio(baseVideo, audioPath, videoWithVoice, bgVol);
        }

        if (mergeRes.status !== 'ok') {
          addLog('[Voice] ❌ Ghép audio thất bại: ' + mergeRes.error, 'error');
          return;
        }
        addLog('[Voice] ✅ Đã ghép audio!', 'success');

        // ── Bước 3: Burn subtitle nếu có ─────────────────────────────
        el.btnVoiceApply.textContent = '⏳ Gán phụ đề...';
        const srtForSub = job.aiContent || job.srtContent || '';
        const finalOutput = job.filePath.replace(/\.[^.]+$/, '') + '_final.mp4';

        if (srtForSub && srtForSub.includes('-->')) {
          // Có SRT hợp lệ → burn sub
          const timedSrt = srtForSub;
          let subPositions = [];
          let videoMeta = {};
          if (job.regions?.length && state.videoInfo) {
            const h = state.videoInfo.height, w = state.videoInfo.width;
            videoMeta = { video_height: h, video_width: w };
            subPositions = job.regions.map(r => {
              const yCenter = (r.ymin + r.ymax) / 2 / h;
              let alignment = yCenter < 0.4 ? 8 : yCenter < 0.65 ? 5 : 2;
              let margin_v  = alignment === 8 ? Math.round(r.ymin * 0.8) : alignment === 2 ? Math.round((h - r.ymax) * 0.8) : 0;
              return { start_ms: 0, end_ms: 999999999, position: alignment === 8 ? 'top' : 'bottom', alignment, margin_v: Math.max(5, margin_v) };
            });
          }
          const cssColor = document.getElementById('sub-color')?.value || '#ffffff';
          const rc = cssColor.slice(1,3), gc = cssColor.slice(3,5), bc2 = cssColor.slice(5,7);
          const styleArgs = {
            font_name:     document.getElementById('sub-font')?.value  || 'Arial',
            font_size:     parseInt(document.getElementById('sub-size')?.value || '24'),
            primary_color: `&H00${bc2}${gc}${rc}`.toUpperCase(),
            ...videoMeta
          };
          const subRes = await api.burnSubtitlePositioned(videoWithVoice, timedSrt, finalOutput, subPositions, styleArgs, null);
          if (subRes.status === 'ok') {
            addLog('[Voice] ✅ Đã gán phụ đề!', 'success');
          } else {
            addLog('[Voice] ⚠️ Gán phụ đề thất bại, dùng video không có sub.', 'warning');
            // Đổi tên videoWithVoice thành finalOutput
            await fetch(`${api.base}/api/write-file`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({path:'__noop__',content:''}) }).catch(()=>{});
            job.finalOutputPath = videoWithVoice;
            _showFinalOutputButton(videoWithVoice);
            renderJobList();
            return;
          }
        } else {
          // Không có sub → dùng videoWithVoice làm final
          job.finalOutputPath = videoWithVoice;
          addLog('[Voice] ℹ️ Không có SRT → xuất video không có phụ đề.', 'info');
          showToast('Video với voice đã tạo!', 'success', 5000);
          _showFinalOutputButton(videoWithVoice);
          renderJobList();
          return;
        }

        job.finalOutputPath = finalOutput;
        job.outputPath = finalOutput;
        job.status = 'finished';
        addLog('[Voice] 🎉 Hoàn tất! Video: ' + finalOutput, 'success');
        showToast('Video hoàn chỉnh đã tạo!', 'success', 6000);
        _showFinalOutputButton(finalOutput);
        renderJobList();
        updateStartButton();

      } catch (e) {
        addLog('[Voice] ❌ Lỗi: ' + e.message, 'error');
        console.error('[btnVoiceApply]', e);
      } finally {
        el.btnVoiceApply.disabled = false;
        el.btnVoiceApply.textContent = '🔊 Ghép voice vào video';
      }
    });
  }

  // ΓöÇΓöÇΓöÇ Action Buttons: Voice Sub ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  if (el.btnVoicesubImport) {
    el.btnVoicesubImport.addEventListener('click', async () => {
      if (!window.electronAPI?.openFile) return;
      const result = await window.electronAPI.openFile([{name:'SRT',extensions:['srt','txt']}]);
      const fp = result && !result.canceled && result.filePaths?.[0];
      if (fp) {
        try {
          const resp = await fetch('file:///' + fp.replace(/\\/g, '/'));
          const text = await resp.text();
          if (el.voicesubContent) el.voicesubContent.value = text;
          const job = getActiveJob();
          if (job) job.voiceSubContent = text;
          addLog('[VoiceSub] Đã nhập SRT: ' + fp.split(/[\\/]/).pop(), 'info');
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

      // Determine input video: use the no_sub output as base
      const inputVideo = job.outputPath;
      const srtPath = job.outputPath.replace(/_no_sub\.mp4$/, '_voice.srt');
      const subMode = el.voicesubMode?.value || 'soft';
      const outputPath = job.outputPath.replace(/_no_sub\.mp4$/, '_final.mp4');

      el.btnVoicesubApply.disabled = true;
      el.btnVoicesubApply.textContent = '⏳ Đang gán...';
      addLog(`[VoiceSub] Đang gán phụ đề (${subMode})...`, 'info');

      try {
        // Bug #3 fix: write SRT content to file BEFORE calling burnSubtitle
        const writeRes = await api.writeFile(srtPath, srtText);
        if (writeRes.status !== 'ok') {
          addLog('[VoiceSub] ❌ Không thể lưu file SRT: ' + (writeRes.error || ''), 'error');
          return;
        }

        // Build style args for hard sub mode
        const styleArgs = {};
        if (subMode === 'hard') {
          styleArgs.font_name = document.getElementById('sub-font')?.value || 'Arial';
          styleArgs.font_size = parseInt(document.getElementById('sub-size')?.value || '24');
          // Convert CSS hex color (#rrggbb) to ASS hex (&H00BBGGRR)
          const cssColor = document.getElementById('sub-color')?.value || '#ffffff';
          const r = cssColor.slice(1, 3);
          const g = cssColor.slice(3, 5);
          const b = cssColor.slice(5, 7);
          styleArgs.primary_color = `&H00${b}${g}${r}`.toUpperCase();
          styleArgs.margin_v = parseInt(document.getElementById('sub-margin-v')?.value || '10');
        }

        const result = await api.burnSubtitle(inputVideo, srtPath, outputPath, subMode, styleArgs);
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

  
  const subModeSelect = document.getElementById('voicesub-mode');
  const styleSettings = document.getElementById('sub-style-settings');
  if (subModeSelect && styleSettings) {
    subModeSelect.addEventListener('change', () => {
      styleSettings.style.display = subModeSelect.value === 'hard' ? 'block' : 'none';
    });
    styleSettings.style.display = subModeSelect.value === 'hard' ? 'block' : 'none';
  }


  // ΓöÇΓöÇΓöÇ Column Resize ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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

  // ΓöÇΓöÇΓöÇ Audio format for ref upload ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  // ΓöÇΓöÇΓöÇ Processing: Per-Job Queue ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  function updateStartButton() {
    const job = getActiveJob();
    const canStart = job && (job.status === 'idle' || job.status === 'finished' || job.status === 'error') && state.isBackendReady;
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


  document.getElementById('btn-start-all')?.addEventListener('click', () => {
    if (!state.isBackendReady) return;
    saveControlsToJob();
    let queuedAny = false;
    state.jobs.forEach(j => {
      if (j.status === 'idle' || j.status === 'error' || j.status === 'finished') {
        j.status = 'queued';
        j._aiTriggered = false;
        j._ttsTriggered = false;
        j.srtContent = '';
        j.aiContent = '';
        queuedAny = true;
      }
    });
    if (queuedAny) {
      addLog(`Ðã thêm tất cả Job vào hàng đợi xử lý.`, 'info');
      renderJobList();
      updateStartButton();
      processNextJob();
    }
  });

  el.btnStart.addEventListener('click', () => {
    const job = getActiveJob();
    if (!job || (job.status === 'processing' || job.status === 'queued') || !state.isBackendReady) return;

    // Save current controls to job before queuing
    saveControlsToJob();

    // Mark as queued
    job.status = 'queued';
    // Reset auto-pipeline flags for fresh run
    job._aiTriggered = false;
    job._ttsTriggered = false;
    job.srtContent = '';
    job.aiContent = '';
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
      // Stop timer
      if (state.processingTimerInterval) { clearInterval(state.processingTimerInterval); state.processingTimerInterval = null; }
      state.processingStartTime = null;
      if (el.btnCancel) el.btnCancel.textContent = '⬛ Hủy xử lý';
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

    addLog(`✅ Bắt đầu xử lý: ${nextJob.fileName}`, 'success');
    if (state.activeJobId === nextJob.id) {
      el.progressSection.classList.remove('hidden');
      updateStartButton();
    }

    // Start processing timer in Cancel button
    state.processingStartTime = Date.now();
    if (state.processingTimerInterval) clearInterval(state.processingTimerInterval);
    state.processingTimerInterval = setInterval(() => {
      if (!state.processingStartTime) return;
      const elapsed = Math.floor((Date.now() - state.processingStartTime) / 1000);
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      const t = h > 0
        ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (el.btnCancel) el.btnCancel.textContent = `⏱ ${t}  ⬛ Hủy xử lý`;
    }, 1000);

    await runNextPass(nextJob);
  }

  async function runNextPass(job) {
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    let api_keys = [];
    try { api_keys = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]'); } catch { api_keys = []; }
    const selectedModel = localStorage.getItem(`ai_model_${provider}`) || '';
    
    // Fallback if textarea is empty
    if (api_keys.length === 0) {
      if (provider === 'ollama' && selectedModel) {
        api_keys = [selectedModel];
      } else if (localStorage.getItem('ai_api_key')) {
        api_keys = [localStorage.getItem('ai_api_key')];
      }
    }
    
    const aiConfig = {
      provider: provider,
      api_keys: api_keys.map(k => k.key || k),
      model: selectedModel,
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

      const regionMaskMode = region.maskMode || job.maskMode || 'box';
      addLog(`  Pass ${passIdx + 1}/${job.regions.length}: Vùng #${region.label} | mask=${regionMaskMode} | frame ${region.startFrame}-${region.endFrame}`, 'info');

      const jobPayload = [{
        input_path: inputPath,
        output_path: outputPath,
        subtitle_areas: subtitleAreas,
        frame_range: frameRange,
        inpaint_mode: job.algorithm,
        mask_mode: regionMaskMode,
        extract_srt: passIdx === 0 ? job.extractSrt : false,
        asr_fallback: passIdx === 0 ? (job.asrFallback || false) : false,
        asr_language: job.asrLanguage || 'vi',
        ai_rewrite: passIdx === 0 ? job.aiRewrite : false,
        ai_config: aiConfig,
        tts_voice: (passIdx === job.regions.length - 1 && job.ttsGenerate) ? (job.ttsVoice || localStorage.getItem('tts_voice') || 'none') : 'none',
        tts_ref_audio: null,
        tts_bg_volume: parseInt(localStorage.getItem('tts_bg_volume') || '10'),
        remove_vocal: localStorage.getItem('tts_remove_vocal') === 'true',
          voice_sub: job.voiceSub || false
      }];
      
      // Resolve clone voice ref_audio if needed
      jobPayload.forEach(p => {
        if (p.tts_voice && p.tts_voice.startsWith('clone:')) {
          const idx = parseInt(p.tts_voice.split(':')[1]);
          const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
          if (voices[idx]) p.tts_ref_audio = voices[idx].audioPath;
        }
      });

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
        asr_fallback: job.asrFallback || false,
        asr_language: job.asrLanguage || 'vi',
        ai_rewrite: job.aiRewrite,
        ai_config: aiConfig,
        tts_voice: job.ttsGenerate ? (job.ttsVoice || localStorage.getItem('tts_voice') || 'none') : 'none',
        tts_ref_audio: null, // Will populate below
        tts_bg_volume: parseInt(localStorage.getItem('tts_bg_volume') || '10'),
        remove_vocal: localStorage.getItem('tts_remove_vocal') === 'true',
          voice_sub: job.voiceSub || false
      }];
      
      // Resolve clone voice ref_audio if needed
      jobPayload.forEach(p => {
        if (p.tts_voice && p.tts_voice.startsWith('clone:')) {
          const idx = parseInt(p.tts_voice.split(':')[1]);
          const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
          if (voices[idx]) p.tts_ref_audio = voices[idx].audioPath;
        }
      });

      try {
      addLog(`[Payload] algo=${jobPayload[0].inpaint_mode} mask=${jobPayload[0].mask_mode} extract_srt=${jobPayload[0].extract_srt} asr=${jobPayload[0].asr_fallback} ai=${jobPayload[0].ai_rewrite} tts=${jobPayload[0].tts_voice}`, 'info');
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

        if (backendJob.status === 'finished' ) {
          onJobFinished(job);
        }
      }
    } catch (e) {}
  }

  // --- Live Preview ---
  async function fetchAndDrawLivePreview() {
    try {
      const blob = await api.getLivePreview();
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { 
        el.canvasResult.width = img.width; 
        el.canvasResult.height = img.height; 
        const ctx = el.canvasResult.getContext('2d');
        ctx.drawImage(img, 0, 0); 
        URL.revokeObjectURL(url); 
        el.resultPlaceholder.classList.add('hidden'); 
      };
      img.src = url;
    } catch (e) {}
  }

  function startLivePreviewPolling() {
    if (state.livePreviewInterval) return;
    fetchAndDrawLivePreview(); // immediate fetch
    state.livePreviewInterval = setInterval(fetchAndDrawLivePreview, 1000); // fetch every 1s
  }

  function stopLivePreviewPolling() {
    if (state.livePreviewInterval) {
      clearInterval(state.livePreviewInterval);
      state.livePreviewInterval = null;
    }
  }

  function handleWSMessage(msg) {
    if (msg.type === 'progress' && msg.data) {
      const d = msg.data;
      const job = state.jobs.find(j => j.id === state.processingJobId);

      // ── SRT ready: lưu vào job + UI, rồi tự động trigger AI rewrite nếu cần ──
      if (d.srt_ready) {
        const srtText = d.srt_ready;
        document.getElementById('srt-content').value = srtText;
        if (job) {
          job.srtContent = srtText;
          // Auto-forward to voicesub if voiceSub enabled and no dedicated content yet
          if (job.voiceSub && !job.voiceSubContent) {
            job.voiceSubContent = srtText;
            const elVS = document.getElementById('voicesub-content');
            if (elVS) elVS.value = srtText;
          }
        }
        addLog('[SRT] ✅ Đã trích xuất SRT gốc.', 'success');

        // Auto-trigger AI rewrite from frontend only if:
        // - job has aiRewrite enabled
        // - backend did NOT already handle it (ai_ready WS event sets job.aiContent)
        // - not already triggered this session (_aiTriggered flag)
        if (job && job.aiRewrite && srtText.trim() && !job.aiContent && !job._aiTriggered) {
          job._aiTriggered = true;
          triggerAutoAiRewrite(job, srtText);
        }
      }

      // ── AI ready: lưu vào job + UI, rồi tự động trigger TTS nếu cần ──
      if (d.ai_ready) {
        const aiText = d.ai_ready;
        document.getElementById('ai-content').value = aiText;
        if (job) {
          job.aiContent = aiText;
          job._aiTriggered = true; // backend đã làm, không trigger lại
          // Auto-forward to voicesub
          if (job.voiceSub) {
            job.voiceSubContent = aiText;
            const elVS = document.getElementById('voicesub-content');
            if (elVS) elVS.value = aiText;
          }
        }
        addLog('[AI] ✅ Đã nhận phụ đề AI viết lại.', 'success');

        // Auto-trigger TTS if the job has ttsGenerate enabled and not already done
        if (job && job.ttsGenerate && !job._ttsTriggered) {
          job._ttsTriggered = true;
          // Đảm bảo SRT hợp lệ trước khi truyền vào TTS
          const srtForTts = aiText.includes('-->') ? aiText : _buildTimedSrt(aiText, job.srtContent || '');
          triggerAutoTts(job, srtForTts);
        }
      }

      // ── TTS ready: hiển thị audio preview ──
      if (d.tts_ready) {
        const audio = document.getElementById('job-tts-preview-audio');
        if (audio) {
          audio.src = 'file://' + d.tts_ready.replace(/\\/g, '/');
          audio.style.display = 'block';
        }
        // Mark TTS as done so onJobFinished doesn't re-trigger
        if (job) {
          job._ttsTriggered = true;
          job.voiceSegments = [{ text: 'Backend TTS', audio_path: d.tts_ready }];
          renderVoiceSegments(job.voiceSegments);
        }
        addLog('[TTS] ✅ Đã tạo xong âm thanh lồng tiếng.', 'success');
      }

      if (d.stage) {
        addLog(`[${d.progress || 0}%] ${d.stage}`, 'info');
      }

      const pct = d.progress || 0;
      if (job) {
        job.progress = pct;
        // Completely remove job.outputPath mutation to fix multi-pass race condition
          // if (d.output_path) { job.outputPath = d.output_path; }
        if (state.activeJobId === job.id) {
          setProgress(pct, d.status || `${pct}%`);
          if (pct >= 0 && pct < 100 && d.status === 'processing') {
            startLivePreviewPolling();
          }
          if (d.frame !== undefined && state.videoInfo) {
            loadSyncedFrame(d.frame);
          }
        }
        if (d.is_finished || (d.status && typeof d.status === 'string' && d.status.startsWith('error'))) {
          setProgress(100, d.status || 'Hoàn tất');
        }
        if (d.is_finished) onJobFinished(job);
        renderJobList();
        if (d.is_finished || (d.status && typeof d.status === 'string' && d.status.startsWith('error'))) {
          stopLivePreviewPolling();
        }
      }
    }
  }

  // ── Auto AI Rewrite (triggered after SRT arrives if job.aiRewrite = true) ──
  async function triggerAutoAiRewrite(job, srtText) {
    const btnRetry = document.getElementById('btn-retry-ai');
    addLog('[AI] 🔄 Tự động viết lại phụ đề bằng AI...', 'info');
    if (btnRetry) { btnRetry.disabled = true; btnRetry.textContent = '⏳ AI đang viết...'; }

    try {
      const provider = localStorage.getItem('ai_provider') || 'gemini';
      let api_keys = [];
      try { api_keys = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]'); } catch { api_keys = []; }
      const selectedModel = localStorage.getItem(`ai_model_${provider}`) || '';
      if (api_keys.length === 0) {
        if (provider === 'ollama' && selectedModel) api_keys = [selectedModel];
        else if (localStorage.getItem('ai_api_key')) api_keys = [localStorage.getItem('ai_api_key')];
      }
      // Get the currently selected prompt content
      const promptSel = document.getElementById('ai-prompt-select');
      let promptText = localStorage.getItem('ai_prompt') || '';
      if (!promptText && promptSel) {
        // Fallback: lấy value của option đang chọn (value = prompt ID), tìm content
        try {
          const prompts = JSON.parse(localStorage.getItem('ai_prompts') || '[]');
          const activeId = promptSel.value;
          const found = prompts.find(p => p.id === activeId);
          if (found) promptText = found.content;
        } catch {}
      }

      if (!promptText || api_keys.filter(Boolean).length === 0) {
        addLog('[AI] ⚠️ Chưa cấu hình AI key/prompt — bỏ qua auto rewrite.', 'warning');
        if (btnRetry) { btnRetry.disabled = false; btnRetry.textContent = '🔄 Viết lại AI'; }
        // Still trigger TTS with original SRT if needed
        if (job.ttsGenerate) triggerAutoTts(job, srtText);
        return;
      }

      const aiConfig = {
        provider,
        api_keys: api_keys.map(k => k.key || k),
        model: selectedModel,
        endpoint: localStorage.getItem('ai_endpoint') || '',
        prompt: promptText
      };

      const res = await fetch(`${api.base}/api/ai-rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ srt_content: srtText, ai_config: aiConfig })
      });
      const data = await res.json();

      if (data.status === 'ok') {
        const aiText = data.result;
        document.getElementById('ai-content').value = aiText;
        job.aiContent = aiText;
        addLog('[AI] ✅ Viết lại phụ đề thành công!', 'success');

        // Auto-forward to voicesub
        if (job.voiceSub) {
          job.voiceSubContent = aiText;
          const elVS = document.getElementById('voicesub-content');
          if (elVS) elVS.value = aiText;
        }

        // Đảm bảo content truyền vào TTS luôn là SRT hợp lệ (có -->)
        // Nếu AI trả về plain text → map lại vào timestamp từ SRT gốc
        const srtForTts = aiText.includes('-->') ? aiText : _buildTimedSrt(aiText, srtText);

        // Chain: trigger TTS với content đã đảm bảo là SRT hợp lệ
        if (job.ttsGenerate) triggerAutoTts(job, srtForTts);
      } else {
        addLog('[AI] ❌ Auto rewrite lỗi: ' + data.error, 'error');
        // Fall back: trigger TTS với SRT gốc (vẫn đọc được)
        if (job.ttsGenerate) triggerAutoTts(job, srtText);
      }
    } catch (e) {
      addLog('[AI] ❌ Lỗi kết nối AI: ' + e.message, 'error');
      if (job.ttsGenerate) triggerAutoTts(job, srtText);
    } finally {
      if (btnRetry) { btnRetry.disabled = false; btnRetry.textContent = '🔄 Viết lại AI'; }
    }
  }

  // ── Pipeline chính: TTS → Vocal Remove → Mix → Karaoke Sub → Final ──────
  async function triggerAutoTts(job, srtText) {
    const voice = job.ttsVoice || localStorage.getItem('tts_voice') || 'none';
    if (!voice || voice === 'none') {
      addLog('[TTS] ⚠️ Chưa chọn giọng — bỏ qua auto TTS.', 'warning');
      return;
    }
    // Chống chạy 2 lần đồng thời
    if (job._ttsRunning) {
      addLog('[TTS] ℹ️ Pipeline TTS đang chạy, bỏ qua trigger thứ 2.', 'info');
      return;
    }
    job._ttsRunning = true;

    const btnRetry = document.getElementById('btn-retry-tts');
    const removeVocal = localStorage.getItem('tts_remove_vocal') === 'true';
    const baseVideo   = job.outputPath; // video đã xóa hardcoded sub

    if (!baseVideo) {
      addLog('[TTS] ❌ Không có video đầu ra để ghép — hãy chạy xóa phụ đề trước.', 'error');
      return;
    }

    if (btnRetry) { btnRetry.disabled = true; btnRetry.textContent = '⏳ Bước 1/4 — Tạo voice...'; }

    try {
      // ══ BƯỚC 1: Tạo TTS audio + lấy timing thực ══════════════════════
      addLog('[TTS] 🎤 Bước 1/4 — Đang tạo âm thanh lồng tiếng...', 'info');

      let refAudio = null;
      if (voice.startsWith('clone:')) {
        const idx = parseInt(voice.split(':')[1]);
        const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
        if (voices[idx]) refAudio = voices[idx].audioPath;
      }

      const ttsRes = await fetch(`${api.base}/api/tts-retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srt_content:    srtText,
          tts_voice:      voice,
          video_path:     job.filePath,
          tts_ref_audio:  refAudio
        })
      });
      const ttsData = await ttsRes.json();

      if (ttsData.status !== 'ok') {
        addLog('[TTS] ❌ Tạo voice thất bại: ' + (ttsData.error || 'Unknown'), 'error');
        return;
      }

      const ttsAudioPath = ttsData.audio_path;
      // SRT với timing khớp hoàn toàn với voice (TTS-first timing)
      const timedSrt = ttsData.srt_content || _buildTimedSrt(srtText, job.srtContent);
      const segCount = ttsData.segments_timing?.length || 0;
      addLog(`[TTS] ✅ Tạo ${segCount} segments thành công!`, 'success');

      // Preview audio
      const audioEl = document.getElementById('job-tts-preview-audio');
      if (audioEl) {
        audioEl.src = 'file://' + ttsAudioPath.replace(/\\/g, '/');
        audioEl.style.display = 'block';
      }
      job.voiceSegments = [{ text: 'Auto TTS', audio_path: ttsAudioPath }];
      renderVoiceSegments(job.voiceSegments);

      // ══ BƯỚC 2: Tách vocal gốc (nếu bật) → lấy nhạc nền ══════════════
      let bgAudioPath = null;
      if (removeVocal) {
        if (btnRetry) btnRetry.textContent = '⏳ Bước 2/4 — Tách vocal gốc...';
        addLog('[TTS] 🎵 Bước 2/4 — Đang tách vocal gốc, giữ nhạc nền...', 'info');
        try {
          const vocalRes = await api.removeVocal(job.filePath);
          if (vocalRes.status === 'ok' || vocalRes.status === 'warning') {
            bgAudioPath = vocalRes.audio_path;
            addLog(`[TTS] ✅ Tách vocal xong (${vocalRes.method_used})${vocalRes.message ? ': ' + vocalRes.message : ''}.`, 'success');
          } else {
            addLog('[TTS] ⚠️ Tách vocal thất bại: ' + vocalRes.error + ' — dùng audio gốc.', 'warning');
          }
        } catch (e) {
          addLog('[TTS] ⚠️ Lỗi tách vocal: ' + e.message + ' — dùng audio gốc.', 'warning');
        }
      } else {
        addLog('[TTS] ℹ️ Bước 2/4 — Bỏ qua tách vocal (chưa bật tùy chọn).', 'info');
      }

      // ══ BƯỚC 2.5: Tự động điều chỉnh tốc độ video khớp với TTS ══════
      // Đo duration TTS vs video; nếu lệch >2% thì adjust trong giới hạn ±30%
      let videoForMix = baseVideo;   // video sẽ được dùng để mix audio
      if (ttsData.audio_duration_ms > 0) {
        if (btnRetry) btnRetry.textContent = '⏳ Điều chỉnh tốc độ video...';
        const tempoOut = job.filePath.replace(/\.[^.]+$/, '') + '_tempo.mp4';
        try {
          const tempoRes = await api.adjustVideoTempo(
            baseVideo, tempoOut, ttsData.audio_duration_ms,
            1.30,  // max speed up 30%
            0.80   // max slow down 20%
          );
          if (tempoRes.status === 'ok' && tempoRes.adjusted) {
            videoForMix = tempoOut;
            const dir = tempoRes.speed_ratio > 1 ? 'tăng' : 'giảm';
            const pct = Math.abs((tempoRes.speed_ratio - 1) * 100).toFixed(1);
            addLog(`[TTS] ⏱ Điều chỉnh tốc độ video ${dir} ${pct}% để khớp voice (${(tempoRes.audio_duration_ms/1000).toFixed(1)}s).`, 'success');
          } else if (tempoRes.status === 'ok') {
            addLog('[TTS] ✅ Tốc độ video và voice khớp (chênh <2%), không cần điều chỉnh.', 'info');
          } else {
            addLog('[TTS] ⚠️ Không điều chỉnh tốc độ: ' + (tempoRes.error || ''), 'warning');
          }
        } catch (e) {
          addLog('[TTS] ⚠️ Lỗi điều chỉnh tốc độ: ' + e.message, 'warning');
        }
      }

      // ══ BƯỚC 3: Ghép audio vào video → _with_voice.mp4 ════════════════
      if (btnRetry) btnRetry.textContent = '⏳ Bước 3/4 — Ghép audio...';
      addLog('[TTS] 🔊 Bước 3/4 — Đang ghép âm thanh vào video...', 'info');

      // Dùng videoForMix (đã được điều chỉnh tempo nếu cần)
      const safeBase = videoForMix.replace(/_with_voice.*\.mp4$/i, '_no_sub.mp4')
                                  .replace(/_tempo\.mp4$/i, '_no_sub.mp4');

      const videoWithVoice = job.filePath.replace(/\.[^.]+$/, '') + '_with_voice.mp4';

      const bgVol = parseInt(localStorage.getItem('tts_bg_volume') || '10');

      let mergeRes;
      if (bgAudioPath) {
        // 3-way mix: nhạc nền đã tách + TTS, không có voice gốc
        mergeRes = await fetch(`${api.base}/api/mix-audio-tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_path:    videoForMix,
            tts_path:      ttsAudioPath,
            bg_audio_path: bgAudioPath,
            output_path:   videoWithVoice,
            bg_volume:     bgVol
          })
        }).then(r => r.json());
      } else {
        // 2-way mix: audio gốc (bgVol%) + TTS voice
        mergeRes = await api.replaceAudio(videoForMix, ttsAudioPath, videoWithVoice, bgVol);
      }

      if (mergeRes.status !== 'ok') {
        addLog('[TTS] ❌ Ghép audio thất bại: ' + mergeRes.error, 'error');
        return;
      }
      addLog('[TTS] ✅ Đã ghép audio thành công!', 'success');

      // ══ BƯỚC 4: Tạo karaoke subtitle từ timing TTS → burn vào video ═══
      // Chỉ thực hiện nếu user đã tick "Gán phụ đề" (chk-voice-sub)
      if (job.voiceSub) {
        if (btnRetry) btnRetry.textContent = '⏳ Bước 4/4 — Tạo karaoke sub...';
        addLog('[TTS] 📝 Bước 4/4 — Đang tạo karaoke phụ đề đúng vị trí...', 'info');

        // 4a: Phát hiện vị trí phụ đề — ưu tiên dùng sub_areas từ job (user đã vẽ)
        // fallback mới: dùng vị trí mặc định (dưới) để tránh crash PaddleOCR
        let subPositions = [];
        let videoMeta = {};
        try {
          // Nếu job có regions (chế độ thủ công), lấy Y position từ đó
          if (job.regions && job.regions.length > 0 && state.videoInfo) {
            const h = state.videoInfo.height;
            const w = state.videoInfo.width;
            videoMeta = { video_height: h, video_width: w };
            // Tạo position segments từ regions
            subPositions = job.regions.map(r => {
              const yCenter = (r.ymin + r.ymax) / 2 / h;
              let alignment = 2, margin_v = 15;
              if (yCenter < 0.4) { alignment = 8; margin_v = Math.round(r.ymin * 0.8); }
              else if (yCenter < 0.65) { alignment = 5; margin_v = 0; }
              else { alignment = 2; margin_v = Math.round((h - r.ymax) * 0.8); }
              return {
                start_ms: r.startFrame / (state.videoInfo.fps || 25) * 1000,
                end_ms:   r.endFrame   / (state.videoInfo.fps || 25) * 1000,
                position: alignment === 8 ? 'top' : alignment === 5 ? 'middle' : 'bottom',
                alignment,
                margin_v: Math.max(5, margin_v)
              };
            });
            addLog(`[TTS] 📍 Lấy vị trí từ ${job.regions.length} vùng đã vẽ.`, 'success');
          } else {
            // Thử detect-sub-positions nhưng có timeout ngắn để không block lâu
            const posRes = await api.detectSubPositions(job.filePath, 60);  // sample step lớn hơn = nhanh hơn
            if (posRes.status === 'ok' && posRes.positions?.length > 0) {
              subPositions = posRes.positions;
              videoMeta = { video_height: posRes.video_height, video_width: posRes.video_width };
              addLog(`[TTS] 📍 ${subPositions.length} vùng: ` +
                subPositions.map(p => `${p.position}@${(p.start_ms/1000).toFixed(1)}s`).join(', '), 'success');
            } else {
              addLog('[TTS] ⚠️ Không phát hiện vùng → vị trí mặc định (dưới).', 'warning');
            }
          }
        } catch (e) {
          addLog('[TTS] ⚠️ Bỏ qua detect vị trí: ' + e.message, 'warning');
        }

        // 4b: Burn ASS karaoke sub vào video đã có voice
        // Luôn tính finalOutput từ job.filePath (không đổi) để tránh _final_final
        const finalOutput = job.filePath.replace(/\.[^.]+$/, '') + '_final.mp4';

        const cssColor = document.getElementById('sub-color')?.value || '#ffffff';
        const rc = cssColor.slice(1,3), gc = cssColor.slice(3,5), bc2 = cssColor.slice(5,7);
        const styleArgs = {
          font_name:     document.getElementById('sub-font')?.value || 'Arial',
          font_size:     parseInt(document.getElementById('sub-size')?.value || '24'),
          primary_color: `&H00${bc2}${gc}${rc}`.toUpperCase(),
          ...videoMeta
        };

        const subRes = await api.burnSubtitlePositioned(
          videoWithVoice, timedSrt, finalOutput, subPositions, styleArgs,
          ttsData.karaoke_ass || null   // karaoke ASS với \k per-word timing
        );

        if (subRes.status === 'ok') {
          const extra = subRes.styles_used > 1 ? ` (${subRes.styles_used} vị trí)` : '';
          addLog(`[TTS] ✅ Burn karaoke sub thành công${extra}!`, 'success');
        } else {
          // Fallback: nếu burn sub lỗi, dùng video đã có voice không có sub
          addLog('[TTS] ⚠️ Burn sub thất bại: ' + subRes.error + ' — dùng video không có sub.', 'warning');
          job.finalOutputPath = videoWithVoice;
          showToast('Video với voice đã tạo (không có sub).', 'warning', 5000);
          _showFinalOutputButton(videoWithVoice);
          renderJobList();
          return;
        }

        job.finalOutputPath = finalOutput;
        addLog('[TTS] 🎉 Hoàn tất pipeline! Video: ' + finalOutput, 'success');
        showToast('Video hoàn chỉnh đã tạo xong!', 'success', 6000);
        job.outputPath = finalOutput;
      } else {
        // Không gán sub — video với voice là output cuối
        addLog('[TTS] ℹ️ Bỏ qua gán phụ đề (chưa tick "Gán phụ đề").', 'info');
        addLog('[TTS] 🎉 Hoàn tất! Video có voice (không sub): ' + videoWithVoice, 'success');
        showToast('Video với voice đã tạo xong (không có sub)!', 'success', 6000);
        job.finalOutputPath = videoWithVoice;
        job.outputPath = videoWithVoice;
      }

      job.status = 'finished';
      job.progress = 100;
      _showFinalOutputButton(job.finalOutputPath);
      renderJobList();
      updateStartButton();

    } catch (e) {
      addLog('[TTS] ❌ Lỗi pipeline: ' + e.message, 'error');
      console.error('[triggerAutoTts]', e);
    } finally {
      job._ttsRunning = false;
      if (btnRetry) { btnRetry.disabled = false; btnRetry.textContent = '🔄 Tạo lại TTS'; }
    }
  }

  /**
   * _buildTimedSrt: Tái tạo SRT có timestamp hợp lệ.
   *
   * Logic:
   *  1. Nếu newText đã là SRT hợp lệ (chứa "-->") → dùng luôn.
   *  2. Nếu newText là plain text (từ AI) → lấy timestamp từ originalSrt
   *     và thay nội dung từng dòng bằng nội dung mới tương ứng.
   *  3. Nếu số dòng AI ≠ số segment gốc → phân bổ đều các dòng AI
   *     vào các slot timestamp của SRT gốc.
   */
  function _buildTimedSrt(newText, originalSrt) {
    // Kiểm tra newText có phải SRT hợp lệ không
    if (newText && newText.includes('-->')) {
      return newText;
    }

    // Không có SRT gốc → tạo SRT đơn giản, 1 dòng toàn bộ, duration 1 giờ
    if (!originalSrt || !originalSrt.includes('-->')) {
      const lines = (newText || '').split('\n').filter(l => l.trim());
      let srt = '';
      lines.forEach((line, i) => {
        const start = _msToSrtTime(i * 4000);
        const end   = _msToSrtTime(i * 4000 + 3800);
        srt += `${i + 1}\n${start} --> ${end}\n${line}\n\n`;
      });
      return srt || newText;
    }

    // Parse timestamp slots từ SRT gốc
    const slots = [];
    const blocks = originalSrt.trim().split(/\n\n+/);
    for (const block of blocks) {
      const tsMatch = block.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
      if (tsMatch) {
        slots.push({ start: tsMatch[1].replace('.', ','), end: tsMatch[2].replace('.', ',') });
      }
    }

    if (slots.length === 0) return newText;

    // Tách nội dung mới thành các dòng (bỏ dòng trống và số thứ tự)
    const newLines = (newText || '').split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^\d+$/.test(l) && !l.includes('-->'));

    if (newLines.length === 0) return originalSrt; // fallback về gốc

    // Phân bổ newLines vào slots
    let result = '';
    if (newLines.length === slots.length) {
      // 1:1 match
      slots.forEach((slot, i) => {
        result += `${i + 1}\n${slot.start} --> ${slot.end}\n${newLines[i]}\n\n`;
      });
    } else if (newLines.length < slots.length) {
      // Ít dòng hơn → phân bổ đều, mỗi dòng AI trải qua nhiều slot
      const ratio = slots.length / newLines.length;
      slots.forEach((slot, i) => {
        const lineIdx = Math.min(Math.floor(i / ratio), newLines.length - 1);
        result += `${i + 1}\n${slot.start} --> ${slot.end}\n${newLines[lineIdx]}\n\n`;
      });
    } else {
      // Nhiều dòng hơn slot → gộp nhiều dòng vào 1 slot
      const ratio = newLines.length / slots.length;
      slots.forEach((slot, i) => {
        const fromLine = Math.floor(i * ratio);
        const toLine   = Math.min(Math.floor((i + 1) * ratio), newLines.length);
        const text = newLines.slice(fromLine, toLine).join(' ');
        result += `${i + 1}\n${slot.start} --> ${slot.end}\n${text}\n\n`;
      });
    }

    return result;
  }

  function _msToSrtTime(ms) {
    const h   = Math.floor(ms / 3600000);
    const m   = Math.floor((ms % 3600000) / 60000);
    const s   = Math.floor((ms % 60000) / 1000);
    const mil = ms % 1000;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(mil).padStart(3,'0')}`;
  }

  // Ghép audio vào video, xuất file _final.mp4
  async function _mergeAudioIntoVideo(job, videoPath, audioPath) {
    // Luôn tính từ job.filePath gốc để tránh _final_final_final
    const finalOutput = job.filePath.replace(/\.[^.]+$/, '') + '_final.mp4';

    const bgVol = parseInt(localStorage.getItem('tts_bg_volume') || '10');

    try {
      const mergeRes = await api.replaceAudio(videoPath, audioPath, finalOutput, bgVol);
      if (mergeRes.status === 'ok') {
        job.finalOutputPath = finalOutput;
        addLog('[TTS] 🎉 Hoàn tất! Video cuối: ' + finalOutput, 'success');
        showToast('Video hoàn chỉnh đã tạo xong!', 'success', 6000);
        // Cập nhật nút mở file trong job list
        renderJobList();
        // Hiện nút mở video final
        _showFinalOutputButton(finalOutput);
      } else {
        addLog('[TTS] ❌ Ghép audio thất bại: ' + mergeRes.error, 'error');
      }
    } catch (e) {
      addLog('[TTS] ❌ Lỗi ghép audio: ' + e.message, 'error');
    }
  }

  // Hiện nút mở video final trong progress section
  function _showFinalOutputButton(filePath) {
    if (!window.electronAPI?.openPath) return;
    const existingBtn = document.getElementById('btn-open-final-output');
    if (existingBtn) existingBtn.remove();
    const btn = document.createElement('button');
    btn.id = 'btn-open-final-output';
    btn.className = 'btn btn-accent btn-block';
    btn.style.marginTop = '8px';
    btn.innerHTML = '📂 Mở video hoàn chỉnh (_final.mp4)';
    btn.onclick = () => window.electronAPI.openPath(filePath);
    const progressSection = document.getElementById('progress-section');
    if (progressSection) progressSection.appendChild(btn);
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
    // Stop timer
    if (state.processingTimerInterval) { clearInterval(state.processingTimerInterval); state.processingTimerInterval = null; }
    state.processingStartTime = null;
    if (el.btnCancel) el.btnCancel.textContent = '⬛ Hủy xử lý';

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

    // ── Fallback auto-pipeline: nếu SRT đã có nhưng AI/TTS chưa chạy ──
    // Trường hợp này xảy ra khi backend tự làm AI+TTS rồi (ai_rewrite=true trong payload)
    // thì srt_ready/ai_ready đã được xử lý qua WS trước khi onJobFinished.
    // Trường hợp backend KHÔNG làm (ai_rewrite=false trong payload nhưng user check UI):
    // srt_ready đã set job.srtContent, giờ cần trigger frontend pipeline.
    const srtText = job.srtContent || document.getElementById('srt-content')?.value?.trim();
    if (srtText) {
      const needAi  = job.aiRewrite  && !job.aiContent    && !job._aiTriggered;
      const needTts = job.ttsGenerate && !job.voiceSegments?.length && !job._ttsTriggered;

      if (needAi || needTts) {
        // Giữ status = 'processing' cho đến khi TTS pipeline hoàn tất tự mark 'finished'
        job.status = 'processing';
        renderJobList();
        if (needAi) {
          job._aiTriggered = true;
          triggerAutoAiRewrite(job, srtText);  // sẽ chain sang TTS nếu cần
        } else {
          job._ttsTriggered = true;
          // Ưu tiên: aiContent (đã dịch) > srtContent gốc
          // Đảm bảo là SRT hợp lệ có -->
          const contentForTts = job.aiContent || srtText;
          const srtForTts = contentForTts.includes('-->') ? contentForTts : _buildTimedSrt(contentForTts, srtText);
          triggerAutoTts(job, srtForTts);
        }
        // Không gọi processNextJob() ngay — TTS pipeline sẽ set finished và gọi sau
        return;
      }
    }

    // Process next queued job automatically
    processNextJob();
  }

  // ─── Settings Page ─────────────────────────────────────────────────────────────
  
  
  // Simply load settings
  function loadSettingsValues() {
    if (el.aiProvider) el.aiProvider.value = localStorage.getItem('ai_provider') || 'gemini';
    
    const apiKey = document.getElementById('ai-api-key');
    if (apiKey) apiKey.value = localStorage.getItem('ai_api_key') || '';
    
    if (el.aiEndpoint) el.aiEndpoint.value = localStorage.getItem('ai_endpoint') || '';
    if (el.ttsVoice) el.ttsVoice.value = localStorage.getItem('tts_voice') || 'none';
    if (el.ttsLanguage) el.ttsLanguage.value = localStorage.getItem('tts_language') || 'vi';
    if (el.ttsBgVolume) {
      el.ttsBgVolume.value = localStorage.getItem('tts_bg_volume') || '10';
      if (el.volLabel) el.volLabel.textContent = el.ttsBgVolume.value + '%';
    }
    if (el.ttsRemoveVocal) el.ttsRemoveVocal.checked = localStorage.getItem('tts_remove_vocal') === 'true';
  }

  if (el.aiProvider) {
    el.aiProvider.addEventListener('change', () => {
      localStorage.setItem('ai_provider', el.aiProvider.value);
    });
  }

  if (el.ttsBgVolume) {
    el.ttsBgVolume.addEventListener('input', (e) => {
      if (el.volLabel) el.volLabel.textContent = e.target.value + '%';
    });
  }

  if (el.btnSaveAi) {
    el.btnSaveAi.addEventListener('click', () => {
      const provider = el.aiProvider ? el.aiProvider.value : 'gemini';
      localStorage.setItem('ai_provider', provider);
      
      const apiKey = document.getElementById('ai-api-key');
      if (apiKey) localStorage.setItem('ai_api_key', apiKey.value);
      
      if (el.aiEndpoint) localStorage.setItem('ai_endpoint', el.aiEndpoint.value);
      if (el.ttsVoice) localStorage.setItem('tts_voice', el.ttsVoice.value);
      if (el.ttsLanguage) localStorage.setItem('tts_language', el.ttsLanguage.value);
      if (el.ttsBgVolume) localStorage.setItem('tts_bg_volume', el.ttsBgVolume.value);
      if (el.ttsRemoveVocal) localStorage.setItem('tts_remove_vocal', el.ttsRemoveVocal.checked);
      
      addLog('Đã lưu cấu hình AI & TTS!', 'success');
      showToast('Đã lưu cài đặt!', 'success');
    });
  }

  // ΓöÇΓöÇΓöÇ TTS Voice Clone Management ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
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
          <div class="voice-icon">≡ƒÄñ</div>
          <div class="voice-info">
            <div class="voice-name">${v.name}</div>
            <div class="voice-meta">${v.audioFile} ΓÇó ${v.date}</div>
          </div>
          <div class="voice-actions">
            <button class="btn-voice-del" data-idx="${i}" title="X├│a">Γ£ò</button>
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
        showToast('─É├ú x├│a giß╗ìng!', 'info');
      });
    });
  }

  function updateVoiceDropdown(voices) {
    // --- Settings page dropdown (#tts-voice) ---
    if (el.ttsVoice) {
      while (el.ttsVoice.options.length > 2) el.ttsVoice.remove(2);
      voices.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = `clone:${i}`;
        opt.textContent = `🎭 ${v.name}`;
        el.ttsVoice.appendChild(opt);
        if(step1Voice) step1Voice.appendChild(opt.cloneNode(true));
      });
      const saved = localStorage.getItem('tts_voice') || 'none';
      el.ttsVoice.value = saved;
    }

    // --- Voice Card dropdown (#job-tts-voice) ---
    // Mirror ALL options from Settings dropdown + cloned voices
    const jobSel = document.getElementById('job-tts-voice');
    if (jobSel) {
      const current = jobSel.value;
      jobSel.innerHTML = '<option value="none">— Chọn giọng —</option>';

      // Cloned voices first (same list as Settings)
      voices.forEach((v, i) => {
        const opt = document.createElement('option');
        opt.value = `clone:${i}`;
        opt.textContent = `🎭 ${v.name}`;
        jobSel.appendChild(opt);
      });

      // Edge TTS system voices (Vietnamese + common)
      [
        { value: 'vi-VN-NamMinhNeural', label: '🇻🇳 Nam Minh (Nam)' },
        { value: 'vi-VN-HoaiMyNeural', label: '🇻🇳 Hoài My (Nữ)' },
        { value: 'en-US-GuyNeural', label: '🇺🇸 Guy (EN)' },
        { value: 'en-US-JennyNeural', label: '🇺🇸 Jenny (EN)' },
      ].forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.value; opt.textContent = v.label;
        jobSel.appendChild(opt);
      });

      // Restore selection
      if (current && jobSel.querySelector(`option[value="${current}"]`)) {
        jobSel.value = current;
      }
      // Sync to active job
      if (!jobSel.dataset.bound) {
        jobSel.dataset.bound = '1';
        jobSel.addEventListener('change', () => {
          const job = getActiveJob();
          if (job) job.ttsVoice = jobSel.value;
        });
      }
    }
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
        showToast('Chß╗⌐c n─âng chß╗ìn file chß╗ë khß║ú dß╗Ñng trong app', 'warn');
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
      el.btnCloneVoice.textContent = 'Đang tạo mẫu (0%)...';
      addLog(`[TTS] Đang clone giọng "${name}"...`, 'info');

      // Simulate progress
      let simProgress = 0;
      const progressTimer = setInterval(() => {
        simProgress += Math.random() * 8 + 2;
        if (simProgress > 95) simProgress = 95;
        el.btnCloneVoice.textContent = `Đang tạo mẫu (${Math.floor(simProgress)}%)...`;
      }, 1000);

      try {
        const lang = el.ttsLanguage?.value || 'vi';
        // Lấy text từ ô "Thử giọng" — người dùng tự nhập, không hardcode
        const testText = el.ttsTestText?.value?.trim()
          || 'Xin chào, đây là giọng đọc được clone bởi OmniVoice.';
        const result = await api.generateTTS(testText, _ttsRefAudioPath, lang);

        clearInterval(progressTimer);
        el.btnCloneVoice.textContent = `Đang hoàn tất (100%)...`;

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
          
          // Tự động chọn luôn giọng vừa clone để nghe thử
          if (el.ttsVoice) {
            el.ttsVoice.value = `clone:${voices.length - 1}`;
            localStorage.setItem('tts_voice', el.ttsVoice.value);
          }

          if (el.ttsTestAudio) {
            el.ttsTestAudio.src = 'file:///' + result.audio_path.replace(/\\/g, '/');
            el.ttsTestAudio.style.display = '';
            el.ttsTestAudio.play();
          }

          el.cloneVoiceName.value = '';
          _ttsRefAudioPath = null;
          if (el.refAudioName) el.refAudioName.textContent = 'Chưa chọn file';
          if (el.refAudioPreview) el.refAudioPreview.style.display = 'none';

          showToast('Đã clone giọng "' + name + '" thành công!', 'success');
          addLog('[TTS] Clone giọng "' + name + '" thành công!', 'success');
          // Also select in job Voice Card dropdown
          const jobSel = document.getElementById('job-tts-voice');
          if (jobSel) {
            const cloneOpt = jobSel.querySelector(`option[value="clone:${voices.length - 1}"]`);
            if (cloneOpt) jobSel.value = cloneOpt.value;
            const job = getActiveJob();
            if (job) job.ttsVoice = jobSel.value;
          }
        } else {
          addLog('[TTS] Clone thất bại: ' + (result.error || 'Unknown'), 'error');
          showToast('Clone giọng thất bại: ' + (result.error || ''), 'error');
        }
      } catch (e) {
        clearInterval(progressTimer);
        addLog('[TTS] Lỗi: ' + e.message, 'error');
        showToast('Không thể kết nối TTS engine', 'error');
      } finally {
        clearInterval(progressTimer);
        el.btnCloneVoice.disabled = false;
        el.btnCloneVoice.textContent = 'Thêm giọng clone';
      }
    });
  }

  // Test TTS button
  if (el.btnTestTts) {
    el.btnTestTts.addEventListener('click', async () => {
      const text = el.ttsTestText?.value?.trim();
      if (!text) { showToast('Nhập text để thử!', 'warn'); return; }

      const voiceVal = el.ttsVoice?.value || 'default';

      // Nếu là clone voice và có text mặc định (người dùng không thay đổi) → phát samplePath
      const isDefaultText = text === 'Xin chào, đây là giọng đọc được tạo bởi OmniVoice.';
      if (voiceVal.startsWith('clone:')) {
        const idx = parseInt(voiceVal.split(':')[1]);
        const voices = getSavedVoices();
        const voiceData = voices[idx];
        if (voiceData?.samplePath && isDefaultText) {
          // Phát sample đã lưu sẵn, không cần generate lại
          el.ttsTestAudio.src = 'file:///' + voiceData.samplePath.replace(/\\/g, '/');
          el.ttsTestAudio.style.display = '';
          el.ttsTestAudio.play().catch(() => {});
          addLog(`[TTS] ▶ Phát mẫu giọng "${voiceData.name}" (đã lưu sẵn).`, 'info');
          return;
        }
        // Text tuỳ chỉnh hoặc samplePath không tồn tại → generate với text mới
      }

      let refAudio = null;
      if (voiceVal.startsWith('clone:')) {
        const idx = parseInt(voiceVal.split(':')[1]);
        const voices = getSavedVoices();
        if (voices[idx]) refAudio = voices[idx].audioPath;
      }

      el.btnTestTts.disabled = true;
      el.btnTestTts.textContent = 'Đang tạo...';
      addLog(`[TTS] Đang tạo giọng thử: "${text.substring(0, 50)}..."`, 'info');

      try {
        const lang = el.ttsLanguage?.value || 'vi';
        const result = await api.generateTTS(text, refAudio, lang, voiceVal.startsWith('clone:') ? null : voiceVal);
        if (result.status === 'ok' && result.audio_path) {
          // Cập nhật samplePath nếu là clone voice (để lần sau không cần generate lại)
          if (voiceVal.startsWith('clone:')) {
            const idx = parseInt(voiceVal.split(':')[1]);
            const vs = getSavedVoices();
            if (vs[idx]) {
              vs[idx].samplePath = result.audio_path;
              saveSavedVoices(vs);
            }
          }
          el.ttsTestAudio.src = 'file:///' + result.audio_path.replace(/\\/g, '/');
          el.ttsTestAudio.style.display = '';
          el.ttsTestAudio.play().catch(() => {});
          addLog('[TTS] ✅ Tạo voice thành công!', 'success');
        } else {
          addLog('[TTS] ❌ Lỗi: ' + (result.error || 'Unknown'), 'error');
          showToast('Lỗi TTS: ' + (result.error || ''), 'error');
        }
      } catch (e) {
        addLog('[TTS] ❌ Lỗi kết nối: ' + e.message, 'error');
        showToast('Không thể kết nối TTS engine', 'error');
      } finally {
        el.btnTestTts.disabled = false;
        el.btnTestTts.textContent = '▶ Thử phát';
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

  // Init backend connection, saved voices and TTS status
  connectToBackend();
  renderSavedVoices();
  setTimeout(checkTTSStatus, 3000);

  // ─── Voice Card: Nghe thử giọng ────────────────
  const _previewBtn = document.getElementById('job-btn-preview-voice');
  if (_previewBtn) {
    _previewBtn.addEventListener('click', async () => {
      const voice = document.getElementById('job-tts-voice')?.value;
      if (!voice || voice === 'none') {
        showToast('Chưa chọn giọng!', 'warn');
        return;
      }

      // ── Clone voice: phát luôn samplePath đã tạo khi clone, không cần generate lại ──
      if (voice.startsWith('clone:')) {
        const idx = parseInt(voice.split(':')[1]);
        const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
        const voiceData = voices[idx];
        if (voiceData?.samplePath) {
          const audio = document.getElementById('job-tts-preview-audio');
          if (audio) {
            audio.src = 'file:///' + voiceData.samplePath.replace(/\\/g, '/');
            audio.style.display = 'block';
            audio.play().catch(() => {});
          }
          addLog(`[TTS] ▶ Phát mẫu giọng "${voiceData.name}" (đã lưu sẵn).`, 'info');
          return;
        }
        // samplePath không còn tồn tại → tạo lại
        addLog('[TTS] ⚠️ File mẫu không còn, đang tạo lại...', 'warning');
      }

      // ── Edge TTS voice: gọi API để tạo audio (nhanh, không cần lưu) ──
      const testText = document.getElementById('tts-test-text')?.value?.trim()
        || 'Xin chào, đây là giọng đọc AI.';

      _previewBtn.disabled = true;
      _previewBtn.textContent = '⏳ Đang tạo...';
      addLog(`[TTS] Đang thử giọng: ${voice}`, 'info');

      try {
        let refAudio = null;
        if (voice.startsWith('clone:')) {
          const idx = parseInt(voice.split(':')[1]);
          const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
          if (voices[idx]) refAudio = voices[idx].audioPath;
        }

        const body = { text: testText, language: 'vi', voice_name: voice };
        if (refAudio) body.ref_audio_path = refAudio;

        const resp = await fetch('http://localhost:8765/api/tts/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const result = await resp.json();

        if (result.status === 'ok' && result.audio_path) {
          // Lưu lại samplePath vào voice data nếu là clone voice
          if (voice.startsWith('clone:')) {
            const idx = parseInt(voice.split(':')[1]);
            const vs = JSON.parse(localStorage.getItem('tts_voices') || '[]');
            if (vs[idx]) {
              vs[idx].samplePath = result.audio_path;
              localStorage.setItem('tts_voices', JSON.stringify(vs));
            }
          }
          const audio = document.getElementById('job-tts-preview-audio');
          if (audio) {
            audio.src = 'file:///' + result.audio_path.replace(/\\/g, '/');
            audio.style.display = 'block';
            audio.play().catch(() => {});
          }
          addLog('[TTS] ✅ Phát audio thử thành công!', 'success');
        } else {
          const msg = result.error || 'Lỗi không rõ';
          addLog('[TTS] ❌ ' + msg, 'error');
          showToast('Lỗi TTS: ' + msg, 'error');
        }
      } catch (e) {
        addLog('[TTS] ❌ Lỗi kết nối: ' + e.message, 'error');
        showToast('Không thể kết nối backend', 'error');
      } finally {
        _previewBtn.disabled = false;
        _previewBtn.textContent = '▶ Nghe thử giọng';
      }
    });
  }

  // ─── ASR: toggle options panel + status chip ──────────────────
  const _chkAsr = document.getElementById('chk-asr-fallback');
  if (_chkAsr) {
    _chkAsr.addEventListener('change', () => {
      const opts = document.getElementById('asr-options');
      if (opts) opts.style.display = _chkAsr.checked ? '' : 'none';
      // Persist to active job
      const job = getActiveJob();
      if (job) {
        job.asrFallback = _chkAsr.checked;
        job.asrLanguage = document.getElementById('asr-language')?.value || 'vi';
      }
    });
  }

  // Check faster-whisper availability — called after backend is ready
  async function checkAsrStatus() {
    const chip = document.getElementById('asr-status-chip');
    if (!chip) return;
    try {
      const r = await fetch('http://localhost:8765/api/asr/status');
      const d = await r.json();
      if (d.available) {
        chip.textContent = `✅ Sẵn sàng (v${d.version})`;
        chip.className = 'status-chip status-ok';
      } else {
        chip.textContent = '❌ Chưa cài (pip install faster-whisper)';
        chip.className = 'status-chip status-error';
      }
    } catch {
      chip.textContent = '⚠️ Không thể kiểm tra';
      chip.className = 'status-chip status-warn';
    }
  }

  function fmtTime(s) {
    if (!s || isNaN(s)) return '00:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

})();


// ΓöÇΓöÇΓöÇ Prompt Manager ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
(function initPromptManager() {
  const elBtnManage = document.getElementById('btn-manage-prompts');
  const modal = document.getElementById('prompt-modal');
  const btnClose = document.getElementById('btn-close-prompt-modal');
  const select = document.getElementById('ai-prompt-select');
  const list = document.getElementById('modal-prompt-list');
  const inpName = document.getElementById('modal-prompt-name');
  const inpContent = document.getElementById('modal-prompt-content');
  const btnSave = document.getElementById('btn-save-prompt');
  const btnDelete = document.getElementById('btn-delete-prompt');

  const defaultPrompts = [
    { id: 'p1', name: 'Dß╗ïch sang Tiß║┐ng Viß╗çt (Mß║╖c ─æß╗ïnh)', content: 'Bß║ín l├á chuy├¬n gia dß╗ïch thuß║¡t phß╗Ñ ─æß╗ü. H├úy dß╗ïch phß╗Ñ ─æß╗ü sau sang Tiß║┐ng Viß╗çt thß║¡t tß╗▒ nhi├¬n. Giß╗» nguy├¬n ─æß╗ïnh dß║íng d├▓ng.' }
  ];

  function getPrompts() {
    try {
      const p = JSON.parse(localStorage.getItem('ai_prompts'));
      return p && p.length ? p : defaultPrompts;
    } catch { return defaultPrompts; }
  }

  function savePrompts(p) {
    localStorage.setItem('ai_prompts', JSON.stringify(p));
  }

  function renderDropdown() {
    if (!select) return;
    const prompts = getPrompts();
    select.innerHTML = '';
    prompts.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      select.appendChild(opt);
    });
    // restore selected
    const activeId = localStorage.getItem('ai_active_prompt_id');
    if (activeId && prompts.find(p => p.id === activeId)) {
      select.value = activeId;
    }
  }

  function renderList() {
    if (!list) return;
    const prompts = getPrompts();
    list.innerHTML = '';
    prompts.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      list.appendChild(opt);
    });
  }

  if (elBtnManage) {
    elBtnManage.addEventListener('click', () => {
      renderList();
      modal.classList.remove('hidden');
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (list) {
    list.addEventListener('change', () => {
      const prompts = getPrompts();
      const p = prompts.find(x => x.id === list.value);
      if (p) {
        inpName.value = p.name;
        inpContent.value = p.content;
      }
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const name = inpName.value.trim();
      const content = inpContent.value.trim();
      if (!name || !content) { showToast('Vui l├▓ng nhß║¡p t├¬n v├á nß╗Öi dung', 'warn'); return; }
      
      const prompts = getPrompts();
      const existingId = list.value;
      if (existingId) {
        const p = prompts.find(x => x.id === existingId);
        if (p) { p.name = name; p.content = content; }
      } else {
        prompts.push({ id: 'p' + Date.now(), name, content });
      }
      savePrompts(prompts);
      renderList();
      renderDropdown();
      showToast('─É├ú l╞░u prompt', 'success');
      inpName.value = ''; inpContent.value = '';
      list.value = '';
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      const existingId = list.value;
      if (!existingId) return;
      if (existingId === 'p1') { showToast('Kh├┤ng thß╗â x├│a prompt mß║╖c ─æß╗ïnh', 'error'); return; }
      const prompts = getPrompts().filter(x => x.id !== existingId);
      savePrompts(prompts);
      renderList();
      renderDropdown();
      showToast('─É├ú x├│a prompt', 'success');
      inpName.value = ''; inpContent.value = '';
    });
  }

  if (select) {
    select.addEventListener('change', () => {
      localStorage.setItem('ai_active_prompt_id', select.value);
      const p = getPrompts().find(x => x.id === select.value);
      if (p) localStorage.setItem('ai_prompt', p.content);
    });
  }

  // init
  renderDropdown();
  if (!localStorage.getItem('ai_prompt')) {
    localStorage.setItem('ai_prompt', defaultPrompts[0].content);
    localStorage.setItem('ai_active_prompt_id', 'p1');
    if (select) select.value = 'p1';
  }

  // ─── Video Analysis Feature ────────────────────────────────────
  const btnAnalyze = document.getElementById('btn-analyze-video');
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', async () => {
        const _prov = document.getElementById('ai-provider') ? document.getElementById('ai-provider').value : 'gemini';
        localStorage.setItem('ai_provider', _prov);
        if (document.getElementById('ai-api-key') && document.getElementById('ai-api-key').value) localStorage.setItem('ai_api_key', document.getElementById('ai-api-key').value);
        if (document.getElementById('ai-endpoint') && document.getElementById('ai-endpoint').value) localStorage.setItem('ai_endpoint', document.getElementById('ai-endpoint').value);
        if (document.getElementById('ai-model') && document.getElementById('ai-model').value) localStorage.setItem('ai_model_' + _prov, document.getElementById('ai-model').value);

      // Bug #5 fix: access state via window._appState (set in main IIFE)
      const _state = window._appState;
      if (!_state) { showToast('App chưa khởi tạo xong!', 'error'); return; }

      const jobId = _state.activeJobId;
      if (!jobId) {
        showToast('Vui lòng chọn video trước khi phân tích!', 'warning');
        return;
      }
      const job = _state.jobs.find(j => j.id === jobId);
      if (!job) return;

      const promptSel = document.getElementById('analysis-prompt-select');
      const promptText = promptSel ? promptSel.value : 'Hãy phân tích nội dung video này.';

      const provider = localStorage.getItem('ai_provider') || 'gemini';
      let api_keys = [];
      try { api_keys = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]'); } catch { api_keys = []; }
      const selectedModel = localStorage.getItem(`ai_model_${provider}`) || '';
      if (api_keys.length === 0) {
        if (provider === 'ollama' && selectedModel) api_keys = [selectedModel];
        else if (localStorage.getItem('ai_api_key')) api_keys = [localStorage.getItem('ai_api_key')];
      }
      
      const aiConfig = {
        provider: provider,
        api_keys: api_keys.map(k => k.key || k),
        model: selectedModel,
        endpoint: localStorage.getItem('ai_endpoint') || ''
      };

      const transcriptEl = document.getElementById('analysis-transcript');
      const resultEl = document.getElementById('analysis-result');
      
      transcriptEl.value = 'Đang bóc băng video... (có thể mất vài phút)';
      resultEl.value = 'Đang chờ phân tích...';
      btnAnalyze.disabled = true;
      btnAnalyze.innerHTML = '<span class="spinner"></span> Đang xử lý...';
      addLog('[AI] Bắt đầu bóc băng và phân tích video...', 'info');

      try {
        const res = await api.analyzeVideo(job.filePath, aiConfig, promptText);
        if (res.status === 'ok') {
          transcriptEl.value = res.transcript || '';
          resultEl.value = res.analysis || '';
          addLog('[AI] Phân tích hoàn tất!', 'success');
        } else {
          transcriptEl.value = res.transcript || 'Lỗi bóc băng.';
          resultEl.value = 'Lỗi: ' + res.error;
          addLog('[AI] Lỗi phân tích: ' + res.error, 'error');
        }
      } catch (err) {
        resultEl.value = 'Lỗi kết nối: ' + err.message;
        addLog('[AI] Lỗi kết nối: ' + err.message, 'error');
      } finally {
        btnAnalyze.disabled = false;
        btnAnalyze.innerHTML = '🔍 Bắt đầu Bóc băng & Phân tích';
      }
    });
  }

})();
