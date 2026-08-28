/**
 * app.js — Main entry point (non-module script, loaded via <script src="...">)
 *
 * Vì index.html load file này dưới dạng script thường (không type="module"),
 * các module ES6 khác (pipeline1-ai, pipeline3-finalize, settings, prompt-manager...)
 * được load riêng qua <script type="module"> tag trong index.html,
 * rồi expose hàm của chúng lên window.* để app.js có thể gọi.
 *
 * Trách nhiệm của app.js:
 *   - Kết nối backend, WebSocket
 *   - Quản lý job queue & state
 *   - Pipeline 2: inpaint (xóa sub)
 *   - Điều phối pipeline 1 (AI+TTS) và pipeline 3 (Finalize)
 *   - Video preview (canvas, timeline)
 *   - UI: navigation, drag-drop, region drawing, progress
 */
(function () {
  'use strict';

  // ─── Constants ───────────────────────────────────────────────────────────
  const REGION_COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#ef4444'];

  // ─── State ───────────────────────────────────────────────────────────────
  const state = {
    jobs: [],
    activeJobId: null, pipeline1SelectedJobId: null,
    outputDir: localStorage.getItem('output_dir') || null,
    isBackendReady: false,
    isDrawing: false,
    isSelecting: false,
    selectionStart: null,
    playIntervalOrig: null,
    playIntervalResult: null,
    currentFrameOrig: 0,
    currentFrameResult: 0,
    videoInfo: null,
    processingJobId: null,
    processingPassIndex: 0,
    pollTimer: null,
    activeLogTab: 'all',
    processingStartTime: null,
    processingTimerInterval: null,
    pipeline1JobId: null,  // job đang chạy Pipeline 1 (AI+TTS)
  };

  // Expose state globally so modules (pipeline3-finalize, etc.) can read it
  window._appState = state;

  // ─── SRT Display Helper ───────────────────────────────────────────────────
  /**
   * Chuyển SRT thô thành text thuần để hiển thị trong job card.
   * Bỏ số thứ tự dòng và timestamps, chỉ giữ nội dung.
   */
  function _srtToDisplayText(srtOrText) {
    if (!srtOrText) return 'Chưa có dữ liệu';
    // Nếu không có --> thì đây là plain text rồi
    if (!srtOrText.includes('-->')) return srtOrText.trim() || 'Chưa có dữ liệu';
    // Parse SRT: bỏ dòng số thứ tự và dòng timestamp
    const lines = srtOrText.split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^\d+$/.test(l) && !/\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->/.test(l));
    return lines.join(' ') || 'Chưa có dữ liệu';
  }

  // ─── Job Factory ─────────────────────────────────────────────────────────
  function createJob(filePath) {
    const fileName = filePath.split(/[\\/]/).pop();
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const dir = filePath.replace(/\\/g, '/').replace(/\/[^/]+$/, '');
    const outputPath = state.outputDir
      ? state.outputDir.replace(/\\/g, '/').replace(/\/+$/, '') + '/' + baseName + '_no_sub.mp4'
      : dir + '/' + baseName + '_no_sub.mp4';
    return {
      id: Math.random().toString(36).substr(2, 9),
      filePath, fileName, outputPath,
      status: 'idle', progress: 0,
      algorithm: 'sttn-auto', maskMode: 'box', subtitleMode: 'auto',
      regions: [], extractSrt: true, asrFallback: false, asrLanguage: 'vi',
      aiRewrite: false, ttsGenerate: false, voiceSub: false,
      srtContent: '', aiContent: '', voiceSubContent: '', voiceSegments: [],
      ttsAudioPath: null, ttsTimedSrt: null, ttsAudioDurMs: 0,
      karaokeAss: null, finalOutputPath: null,
      _aiTriggered: false, _ttsTriggered: false, _ttsRunning: false,
    };
  }

  // ─── DOM Refs ─────────────────────────────────────────────────────────────
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const el = {
    navItems: $$('.nav-item'), pages: $$('.page'),
    statusDot: $('#backend-status .status-dot'),
    statusText: $('#backend-status .status-text'),
    gpuBadge: $('#gpu-badge'), gpuDetail: $('#gpu-detail'),
    gpuChip: $('#gpu-chip'), cudaVersion: $('#cuda-version'),
    canvasOrig: $('#canvas-original'), canvasResult: $('#canvas-result'),
    dropZone: $('#drop-zone'), subtitleOverlay: $('#subtitle-overlay'),
    resultPlaceholder: $('#result-placeholder'),
    btnOpenFile: $('#btn-open-file'), btnOutputDir: $('#btn-output-dir'),
    btnDrawRegion: $('#btn-draw-region'),
    regionsPanel: $('#regions-panel'), regionsList: $('#regions-list'),
    maskMode: $('#mask-mode'),
    timelineOrig: $('#timeline-orig'), frameInfoOrig: $('#frame-info-orig'),
    btnPlayOrig: $('#btn-play-orig'), btnPrevOrig: $('#btn-prev-orig'), btnNextOrig: $('#btn-next-orig'),
    timelineResult: $('#timeline-result'), frameInfoResult: $('#frame-info-result'),
    btnPlayResult: $('#btn-play-result'), btnPrevResult: $('#btn-prev-result'), btnNextResult: $('#btn-next-result'),
    metaName: $('#meta-name'), metaRes: $('#meta-res'), metaFps: $('#meta-fps'), metaDur: $('#meta-dur'),
    modeAuto: $('#mode-auto'), modeManual: $('#mode-manual'), algoSelect: $('#algo-select'),
    btnStart: $('#btn-start'), btnCancel: $('#btn-cancel'),
    progressSection: $('#progress-section'), progressBar: $('#progress-bar'),
    progressLabel: $('#progress-label'), progressEta: $('#progress-eta'),
    logOutput: $('#log-output'), btnCopyLog: $('#btn-copy-log'), btnClearLog: $('#btn-clear-log'),
    jobList: $('#job-list'),
    aiProvider: $('#ai-provider'), aiApiKey: $('#ai-api-key'),
    aiEndpoint: $('#ai-endpoint'), aiPrompt: $('#ai-prompt'),
    ttsVoice: $('#tts-voice'), ttsLanguage: $('#tts-language'),
    ttsBgVolume: $('#tts-bg-volume'), volLabel: $('#vol-label'),
    ttsRemoveVocal: $('#tts-remove-vocal'),
    btnSaveAi: $('#btn-save-ai'), ttsStatusChip: $('#tts-status-chip'),
    cloneVoiceName: $('#clone-voice-name'), btnUploadRefAudio: $('#btn-upload-ref-audio'),
    refAudioName: $('#ref-audio-name'), refAudioPreview: $('#ref-audio-preview'),
    btnCloneVoice: $('#btn-clone-voice'), savedVoicesList: $('#saved-voices-list'),
    ttsTestText: $('#tts-test-text'), btnTestTts: $('#btn-test-tts'), ttsTestAudio: $('#tts-test-audio'),
    chkTtsGenerate: $('#chk-tts-generate'), chkVoiceSub: $('#chk-voice-sub'),
    srtContent: $('#srt-content'), aiContent: $('#ai-content'),
    voicesubContent: $('#voicesub-content'), voiceSegments: $('#voice-segments'),
    resizeHandle1: $('#resize-handle-1'), resizeHandle2: $('#resize-handle-2'),
    aiModel: $('#ai-model'), aiModel2: $('#step1-ai-model'),
    cloudAiPanel: $('#cloud-ai-panel'), localAiPanel: $('#local-ai-panel'),
  };

  const ctxOrig   = el.canvasOrig?.getContext('2d');
  const ctxResult = el.canvasResult?.getContext('2d');

  // ─── Logger (global) ─────────────────────────────────────────────────────
  /**
   * window.addLog — gọi được từ mọi module (pipeline1, pipeline3, settings...)
   * Ghi vào #log-output (Step 2) và #step1-log-output (Step 1 console).
   */
  function addLog(message, type = 'info') {
    const cat  = _getLogCategory(message);
    const entry = document.createElement('div');
    entry.className      = `log-entry log-${type}`;
    entry.dataset.logCat = cat;
    const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
    entry.textContent = `[${time}] ${message}`;

    if (state.activeLogTab !== 'all' && state.activeLogTab !== cat) {
      entry.classList.add('log-hidden');
    }

    // Log panel chính (Step 2)
    if (el.logOutput) {
      el.logOutput.appendChild(entry);
      el.logOutput.scrollTop = el.logOutput.scrollHeight;
    }

    // Console nhỏ Step 1
    const step1Log = document.getElementById('step1-log-output');
    if (step1Log) {
      const clone = entry.cloneNode(true);
      step1Log.appendChild(clone);
      if (step1Log.childNodes.length > 100) step1Log.removeChild(step1Log.firstChild);
      step1Log.scrollTop = step1Log.scrollHeight;
    }
  }
  window.addLog = addLog;

  function _getLogCategory(message) {
    const msg = message.toLowerCase();
    if (/^\[(asr|ai|tts|voice|voicesub|finalize)\]/i.test(message)) return 'feature';
    if (msg.includes('trích xuất') && msg.includes('srt')) return 'feature';
    if (msg.includes('viết lại') || msg.includes('lồng tiếng') || msg.includes('âm thanh tts')) return 'feature';
    if (/^\[py\]/i.test(message) || /^\[err\]/i.test(message) || /^\[inpaint\]/i.test(message)) return 'inpaint';
    if (msg.includes('xử lý') && (msg.includes('frame') || msg.includes('pass'))) return 'inpaint';
    return 'system';
  }

  // ─── Toast (global) ──────────────────────────────────────────────────────
  function showToast(msg, type = 'info', dur = 3000) {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className   = `toast toast-${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.classList.add('toast-out'); setTimeout(() => t.remove(), 300); }, dur);
  }
  window.showToast = showToast;

  // ─── Log tab filters ─────────────────────────────────────────────────────
  $$('.log-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.log-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeLogTab = tab.dataset.logTab || 'all';
      // Re-apply visibility to existing entries
      if (el.logOutput) {
        el.logOutput.querySelectorAll('.log-entry').forEach(entry => {
          const cat = entry.dataset.logCat;
          entry.classList.toggle('log-hidden', state.activeLogTab !== 'all' && state.activeLogTab !== cat);
        });
      }
    });
  });

  el.btnClearLog?.addEventListener('click', () => {
    if (el.logOutput) el.logOutput.innerHTML = '';
    const s1 = document.getElementById('step1-log-output');
    if (s1) s1.innerHTML = '';
  });

  // Step 1 log buttons
  document.getElementById('step1-btn-clear-log')?.addEventListener('click', () => {
    const s1 = document.getElementById('step1-log-output');
    if (s1) s1.innerHTML = '';
  });

  el.btnCopyLog?.addEventListener('click', () => {
    if (el.logOutput) navigator.clipboard.writeText(el.logOutput.innerText).then(() => showToast('Đã sao chép!', 'success'));
  });

  document.getElementById('step1-btn-copy-log')?.addEventListener('click', () => {
    const s1 = document.getElementById('step1-log-output');
    if (s1) navigator.clipboard.writeText(s1.innerText).then(() => showToast('Đã sao chép!', 'success'));
  });

  window.addEventListener('error', (e) => addLog(`[UI Error] ${e.message}`, 'error'));
  window.addEventListener('unhandledrejection', (e) => addLog(`[UI Async Error] ${e.reason?.message || e.reason}`, 'error'));

  // ─── Navigation ──────────────────────────────────────────────────────────
  el.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset?.page;
      if (!page) return;
      el.navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      el.pages.forEach(p => p.classList.remove('active'));
      const targetPage = document.getElementById(`page-${page}`);
      if (targetPage) {
        targetPage.classList.add('active');
      }
      if (page === 'settings') {
        if (typeof window.loadSettingsValues === 'function') window.loadSettingsValues();
        if (typeof window.checkTTSStatus === 'function') window.checkTTSStatus();
      }
    });
  });

  // ─── Backend Connection ──────────────────────────────────────────────────
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
      addLog('Không thể kết nối backend. Kiểm tra Python server.', 'error');
    }
  }

  function setStatus(s) {
    if (el.statusDot) el.statusDot.className = 'status-dot ' + s;
    const gpuDot = el.gpuBadge?.querySelector('.status-dot');
    if (gpuDot) gpuDot.className = 'status-dot ' + s;
    if (el.statusText) el.statusText.textContent = s === 'online' ? 'Online' : s === 'connecting' ? '...' : 'Off';
  }

  async function loadGpuInfo() {
    try {
      const info = await api.gpuInfo();
      const name = info.gpu_name || 'CPU Only';
      if (el.gpuDetail) el.gpuDetail.textContent = name;
      const gpuSpan = el.gpuChip?.querySelector('span:last-child');
      if (gpuSpan) gpuSpan.textContent = name;
      if (el.cudaVersion) el.cudaVersion.textContent = info.cuda_version || 'N/A';
      const dot = el.gpuChip?.querySelector('.status-dot');
      if (info.gpu_available) {
        dot?.classList.add('online');
        addLog(`GPU: ${name} (VRAM: ${info.vram_total || '?'})`, 'success');
      } else {
        dot?.classList.add('offline');
        addLog('Không phát hiện GPU — dùng CPU.', 'warning');
      }
    } catch (e) { addLog('Lỗi kiểm tra GPU: ' + e.message, 'error'); }
  }

  // ─── File Selection ──────────────────────────────────────────────────────
  el.btnOpenFile?.addEventListener('click', selectFile);
  document.getElementById('btn-upload-step1')?.addEventListener('click', selectFile);

  async function selectFile() {
    if (window.electronAPI?.openFile) {
      try {
        const result = await window.electronAPI.openFile();
        if (!result?.canceled && result?.filePaths?.length > 0) {
          result.filePaths.forEach(fp => addToQueue(fp));
          if (!state.activeJobId && state.jobs.length > 0)
            selectJob(state.jobs[state.jobs.length - 1].id);
          return;
        }
      } catch (e) { addLog('Lỗi dialog file: ' + e.message, 'error'); }
    }
    // Fallback HTML input
    let inp = $('#hidden-file-input');
    if (!inp) {
      inp = document.createElement('input');
      inp.type = 'file'; inp.id = 'hidden-file-input';
      inp.accept = 'video/*,.mp4,.avi,.mkv,.mov';
      inp.multiple = true; inp.style.display = 'none';
      document.body.appendChild(inp);
      inp.addEventListener('change', (e) => {
        Array.from(e.target.files || []).forEach(f => { if (f.path || f.name) addToQueue(f.path || f.name); });
        if (!state.activeJobId && state.jobs.length > 0)
          selectJob(state.jobs[state.jobs.length - 1].id);
      });
    }
    inp.click();
  }

  // Drag & drop
  document.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    Array.from(e.dataTransfer.files || []).forEach(f => {
      if (/\.(mp4|avi|mkv|mov|webm)$/i.test(f.name)) addToQueue(f.path || f.name);
    });
    if (!state.activeJobId && state.jobs.length > 0) selectJob(state.jobs[state.jobs.length - 1].id);
  });

  function addToQueue(filePath) {
    if (state.jobs.find(j => j.filePath === filePath)) return;
    const job = createJob(filePath);
    state.jobs.push(job);
    renderJobList();
    updateStartButton();
    addLog(`Đã thêm: ${job.fileName}`, 'info');
  }

  // ─── Job Selection ───────────────────────────────────────────────────────
  function selectJob(jobId) {
    saveControlsToJob();
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    state.activeJobId = jobId;
    loadControlsFromJob(job);
    loadVideo(job);
    renderJobList();
  }
  window.selectJob = selectJob;

  function getActiveJob() { return state.jobs.find(j => j.id === state.activeJobId) || null; }

  function saveControlsToJob() {
    const job = getActiveJob();
    if (!job || job.status === 'processing') return;
    job.algorithm   = el.algoSelect?.value || 'lama';
    job.maskMode    = el.maskMode?.value   || 'box';
    job.extractSrt  = $('#chk-extract-srt')?.checked   || false;
    job.asrFallback = $('#chk-asr-fallback')?.checked  || false;
    job.asrLanguage = $('#asr-language')?.value        || 'vi';
    job.aiRewrite   = $('#chk-ai-rewrite')?.checked    || false;
    job.ttsGenerate = el.chkTtsGenerate?.checked       || false;
    job.voiceSub    = el.chkVoiceSub?.checked          || false;
  }

  function loadControlsFromJob(job) {
    if (!job) return;
    if (el.algoSelect) el.algoSelect.value = job.algorithm;
    if (el.maskMode)   el.maskMode.value   = job.maskMode || 'box';
    const chkSrt = $('#chk-extract-srt'), chkAsr = $('#chk-asr-fallback');
    const selLang = $('#asr-language'),   chkAi  = $('#chk-ai-rewrite');
    if (chkSrt)  chkSrt.checked  = job.extractSrt;
    if (chkAsr)  chkAsr.checked  = job.asrFallback || false;
    if (selLang) selLang.value   = job.asrLanguage || 'vi';
    if (chkAi)   chkAi.checked   = job.aiRewrite;
    const asrOpts = $('#asr-options');
    if (asrOpts) asrOpts.style.display = job.asrFallback ? '' : 'none';
    if (el.chkTtsGenerate) el.chkTtsGenerate.checked = job.ttsGenerate || false;
    if (el.chkVoiceSub)    el.chkVoiceSub.checked    = job.voiceSub    || false;
    $('#card-srt')?.classList.toggle('active',      job.extractSrt);
    $('#card-ai')?.classList.toggle('active',       job.aiRewrite);
    $('#card-voice')?.classList.toggle('active',    job.ttsGenerate);
    $('#card-voicesub')?.classList.toggle('active', job.voiceSub);
    if (el.srtContent)     el.srtContent.value     = job.srtContent     || '';
    if (el.aiContent)      el.aiContent.value      = job.aiContent      || '';
    if (el.voicesubContent) el.voicesubContent.value = job.voiceSubContent || '';
    renderVoiceSegments(job.voiceSegments || []);
    if (job.subtitleMode === 'manual') {
      el.modeManual?.classList.add('active');   el.modeAuto?.classList.remove('active');
      el.regionsPanel?.classList.remove('hidden');
    } else {
      el.modeAuto?.classList.add('active');     el.modeManual?.classList.remove('active');
      el.regionsPanel?.classList.add('hidden');
    }
    renderRegionsList();
    renderRegionOverlays();
    updateStartButton();
  }

  // ─── Render Job List ──────────────────────────────────────────────────────
  function renderJobList() {
    const statusLabel = { idle: '⏳ Chờ', queued: '⏳ Đang chờ', processing: '🔄 Xử lý', finished: '✅ Hoàn tất', error: '❌ Lỗi' };

    // Step 2 job list (right column)
    const list2 = document.getElementById('job-list');
    if (list2) {
      if (state.jobs.length === 0) {
        list2.innerHTML = '<div class="job-empty">Chưa có video nào.<br>Hãy kéo thả hoặc bấm "Chọn Video".</div>';
      } else {
        list2.innerHTML = '';
        state.jobs.forEach(job => {
          const card = document.createElement('div');
          card.className = `job-card${job.id === state.activeJobId ? ' active' : ''}`;
          const fp = (job.finalOutputPath || job.outputPath || '').replace(/\\/g, '/');
          card.innerHTML = `
            <div class="job-name" title="${job.filePath}">${job.fileName}</div>
            <div class="job-detail">
              <span class="status-tag status-${job.status}">${statusLabel[job.status] || job.status}</span>
              <span>${job.progress}%</span>
              ${job.status === 'finished' && fp ? `<button class="btn btn-xs btn-ghost open-fp" style="margin-left:8px;padding:2px 6px">📂 Mở</button>` : ''}
            </div>
            <div class="job-progress-bar"><div class="job-progress-fill" style="width:${job.progress}%"></div></div>`;
          card.querySelector('.open-fp')?.addEventListener('click', (e) => {
            e.stopPropagation(); window.electronAPI?.openPath(fp);
          });
          card.addEventListener('click', () => selectJob(job.id));
          list2.appendChild(card);
        });
      }
    }

    // Step 1 detailed list
    const list1 = document.getElementById('step1-job-list');
    const jobCount = document.getElementById('job-count');
    if (jobCount) jobCount.textContent = `(${state.jobs.length} Items)`;
    if (list1) {
      if (state.jobs.length === 0) {
        list1.innerHTML = '<div class="job-empty" style="text-align:center;color:#71717a;margin-top:50px;">Chưa có video nào. Bấm "+ Thêm Video" để bắt đầu.</div>';
      } else {
        list1.innerHTML = '';
        state.jobs.forEach((job, idx) => {
          const card = document.createElement('div');
          card.className = 'tk-job-card';
          if (state.pipeline1SelectedJobId === job.id) card.classList.add('active');
          const stClass = { finished: 'completed', error: 'failed' }[job.status] || 'processing';
          const actionBtn = job.status === 'processing'
            ? `<button class="btn-stop-job" data-id="${job.id}" style="background:#ef4444;color:white;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:11px">⏹ Dừng (${job._elapsedTimeString || '00:00'})</button>`
            : job.status === 'queued'
              ? `<button class="btn-stop-job" data-id="${job.id}" style="background:#ef4444;color:white;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:11px">⏹ Hủy</button>`
              : `<button class="btn-process-job" data-id="${job.id}" style="background:#10b981;color:white;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:11px">▶ Chạy</button>`;
          card.innerHTML = `
            <div class="tk-job-card-header ${stClass}">
              <span>Job #${idx+1}: ${job.fileName}</span>
              <div style="display:flex;gap:6px;align-items:center">
                <span style="background:rgba(255,255,255,.2);padding:2px 8px;border-radius:4px;font-size:11px">${job.status.toUpperCase()}</span>
                ${actionBtn}
                <button class="btn-delete-job" data-id="${job.id}" style="background:rgba(239,68,68,.8);color:white;border:none;padding:2px 8px;border-radius:4px;cursor:pointer;font-size:11px">✖</button>
              </div>
            </div>`;
            
          card.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-delete-job')) {
              state.jobs = state.jobs.filter(j => j.id !== job.id);
              if (state.activeJobId === job.id) state.activeJobId = null;
              if (state.pipeline1SelectedJobId === job.id) state.pipeline1SelectedJobId = null;
              renderJobList();
              renderJobDetail1();
            } else if (e.target.classList.contains('btn-process-job')) {
              if (['idle','error','finished'].includes(job.status)) {
                job.status   = 'queued';
                job.pipeline = 1; // Pipeline 1: AI+TTS, không inpaint
                renderJobList();
                processPipeline1Queue();
              }
            } else if (e.target.classList.contains('btn-stop-job')) {
              if (job.status === 'processing') { addLog(`Dừng Job "${job.fileName}"...`, 'warning'); await window.electronAPI?.cancelProcess(); }
              job.status = 'idle'; job._elapsedTimeString = '';
              if (state.processingJobId === job.id) state.processingJobId = null;
              renderJobList(); updateStartButton();
            } else { 
              state.pipeline1SelectedJobId = job.id;
              renderJobList();
              renderJobDetail1();
            }
          });
          list1.appendChild(card);
        });
      }
    }

    // Step 3 list
    const list3 = document.getElementById('step3-job-list');
    if (list3) {
      const done = state.jobs.filter(j => j.status === 'finished');
      if (done.length === 0) {
        list3.innerHTML = '<div class="job-empty" style="text-align:center;color:var(--text-muted);margin-top:40px">Chưa có video hoàn thành.</div>';
      } else {
        list3.innerHTML = '';
        done.forEach(job => {
          const card = document.createElement('div');
          card.className = `job-card${job.id === state.activeJobId ? ' active' : ''}`;
          card.innerHTML = `<div class="job-name">${job.fileName}</div>
            <div class="job-detail"><span class="status-tag status-finished">✅ Hoàn tất</span></div>`;
          card.addEventListener('click', () => selectJob(job.id));
          list3.appendChild(card);
        });
      }
    }
  }
  window.renderJobList = renderJobList;

  // ─── Start / Cancel buttons ──────────────────────────────────────────────
  el.btnStart?.addEventListener('click', () => {
    const job = getActiveJob();
    if (!job || job.status !== 'idle' || !state.isBackendReady) return;
    saveControlsToJob();
    job.status = 'queued';
    addLog(`Job "${job.fileName}" đã thêm vào hàng đợi.`, 'info');
    renderJobList(); updateStartButton();
    processNextJob();
  });

  el.btnCancel?.addEventListener('click', async () => {
    const job = getActiveJob();
    if (!job) return;
    if (job.status === 'processing') {
      try { await api.cancelProcess(); } catch (e) { /* ignore */ }
      job.status = 'idle'; job.progress = 0;
      state.processingJobId = null;
      if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
      addLog(`Đã hủy job "${job.fileName}".`, 'warning');
    } else if (job.status === 'queued') {
      job.status = 'idle';
      addLog(`Đã gỡ "${job.fileName}" khỏi hàng đợi.`, 'warning');
    }
    renderJobList(); updateStartButton();
    el.progressSection?.classList.add('hidden');
  });

  document.getElementById('btn-start-all')?.addEventListener('click', () => {
    // btn-start-all ở Step 1 → chạy Pipeline 1 (AI Analysis + TTS), KHÔNG inpaint
    state.jobs.filter(j => !['queued', 'processing'].includes(j.status)).forEach(j => {
      j.pipeline = 1; // đánh dấu chạy pipeline 1
      j.status   = 'queued';
    });
    renderJobList(); updateStartButton();
    processPipeline1Queue(); // hàm riêng cho pipeline 1
  });

  document.getElementById('btn-stop-all')?.addEventListener('click', async () => {
    state.jobs.forEach(j => { if (j.status === 'queued') j.status = 'idle'; });
    if (state.processingJobId) {
      const pj = state.jobs.find(j => j.id === state.processingJobId);
      if (pj) { try { await api.cancelProcess(); } catch (e) { /* ignore */ } }
    }
    // Dừng cả pipeline 1 jobs đang chạy
    if (state.pipeline1JobId) {
      const p1j = state.jobs.find(j => j.id === state.pipeline1JobId);
      if (p1j) { p1j.status = 'idle'; p1j._p1Cancelled = true; }
      state.pipeline1JobId = null;
    }
    renderJobList(); updateStartButton();
  });

  function updateStartButton() {
    const job = getActiveJob();
    const canStart = job && job.status !== 'processing' && job.status !== 'queued' && state.isBackendReady;
    if (el.btnStart) {
      el.btnStart.disabled = !canStart;
      el.btnStart.textContent = (job?.status === 'finished' || job?.status === 'error') ? '▶ Chạy lại' : '▶ Bắt đầu';
      el.btnStart.classList.toggle('hidden', job?.status === 'processing');
    }
    if (el.btnCancel) el.btnCancel.classList.toggle('hidden', job?.status !== 'processing' && job?.status !== 'queued');
    if (el.progressSection) el.progressSection.classList.toggle('hidden', job?.status !== 'processing' && job?.status !== 'queued');
  }
  window.updateStartButton = updateStartButton;

  function setProgress(pct, text) {
    if (el.progressBar)   el.progressBar.style.width = `${pct}%`;
    if (el.progressLabel) el.progressLabel.textContent = `${Math.round(pct)}%`;
    if (text && el.progressEta) el.progressEta.textContent = text;
  }

  // ─── Pipeline 2: Process Job (Inpaint) ───────────────────────────────────
  async function processNextJob() {
    if (state.processingJobId) return;
    const nextJob = state.jobs.find(j => j.status === 'queued');
    if (!nextJob) return;

    nextJob.status = 'processing'; nextJob.progress = 0;
    state.processingJobId = nextJob.id; state.processingPassIndex = 0;
    renderJobList();
    addLog(`✅ Bắt đầu xử lý: ${nextJob.fileName}`, 'success');
    if (state.activeJobId === nextJob.id) { el.progressSection?.classList.remove('hidden'); updateStartButton(); }

    state.processingStartTime = Date.now();
    if (state.processingTimerInterval) clearInterval(state.processingTimerInterval);
    state.processingTimerInterval = setInterval(() => {
      if (!state.processingStartTime) return;
      const elapsed = Math.floor((Date.now() - state.processingStartTime) / 1000);
      const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = elapsed % 60;
      const t = h > 0
        ? `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      if (nextJob._elapsedTimeString !== t) { nextJob._elapsedTimeString = t; renderJobList(); }
      if (el.btnCancel) el.btnCancel.textContent = `⏱ ${t}  ⬛ Hủy xử lý`;
    }, 1000);

    await runNextPass(nextJob);
  }
  window.processNextJob = processNextJob;

  async function runNextPass(job) {
    const aiConfig = {
      provider:  localStorage.getItem('ai_provider')  || 'gemini',
      api_key:   localStorage.getItem('ai_api_key')   || '',
      endpoint:  localStorage.getItem('ai_endpoint')  || '',
      prompt:    localStorage.getItem('ai_prompt')    || '',
    };

    let subtitleAreas = [], regionsPayload = null;

    if (job.subtitleMode === 'manual' && job.regions.length > 0) {
      subtitleAreas = job.regions.map(r => [r.ymin, r.ymax, r.xmin, r.xmax]);
      regionsPayload = job.regions;
      addLog(`[Inpaint] Bắt đầu xóa đồng loạt ${job.regions.length} vùng phụ đề trực tiếp trong 1 lượt (Single-Pass)...`, 'info');
      try {
        const res = await api.startProcessBatch([{
          input_path: job.filePath, output_path: job.outputPath,
          subtitle_areas: subtitleAreas, regions: regionsPayload,
          inpaint_mode: job.algorithm, mask_mode: job.maskMode || 'box',
          extract_srt: job.extractSrt,
          asr_fallback: job.asrFallback || false, asr_language: job.asrLanguage || 'vi',
          ai_rewrite: false, ai_config: aiConfig, tts_voice: 'none',
        }]);
        job.backendJobId = res?.jobs?.[0] || null;
        state.pollTimer = setInterval(pollProgress, 2000);
      } catch (e) { _jobError(job, e.message); }
    } else {
      addLog(`[Debug] extract_srt=${job.extractSrt}, ai_rewrite=${job.aiRewrite}, tts_generate=${job.ttsGenerate}`, 'info');
      try {
        const res = await api.startProcessBatch([{
          input_path: job.filePath, output_path: job.outputPath,
          subtitle_areas: subtitleAreas, inpaint_mode: job.algorithm,
          mask_mode: job.maskMode || 'box', extract_srt: job.extractSrt,
          asr_fallback: job.asrFallback || false, asr_language: job.asrLanguage || 'vi',
          // ai_rewrite và tts_voice luôn false/none — xử lý ở frontend pipeline 1
          ai_rewrite: false, ai_config: aiConfig, tts_voice: 'none',
        }]);
        job.backendJobId = res?.jobs?.[0] || null;
        state.pollTimer = setInterval(pollProgress, 2000);
      } catch (e) { _jobError(job, e.message); }
    }
  }

  function _jobError(job, msg) {
    addLog('Lỗi: ' + msg, 'error');
    job.status = 'error'; state.processingJobId = null;
    renderJobList(); processNextJob();
  }

  // ─── Progress polling & WebSocket ────────────────────────────────────────
  async function pollProgress() {
    if (!state.processingJobId) return;
    const job = state.jobs.find(j => j.id === state.processingJobId);
    if (!job) return;
    try {
      const st = await api.getStatus();
      const targetJobId = job.backendJobId;
      if (!targetJobId) return;
      const backendJob = st.jobs ? st.jobs[targetJobId] : null;
      if (backendJob) {
        const pct = Number(backendJob.progress || 0);
        if (Number.isFinite(pct) && pct > 0) {
          job.progress = pct;
          if (state.activeJobId === job.id) {
            setProgress(pct, backendJob.status === 'processing' ? `${pct}%` : backendJob.status);
            if (state.videoInfo?.total_frames) {
              loadSyncedFrame(Math.min(Math.floor((pct/100)*state.videoInfo.total_frames), state.videoInfo.total_frames-1));
            }
          }
          renderJobList();
        }
        if (backendJob.status === 'finished' && backendJob.is_finished === true) {
          onJobFinished(job);
        }
      }
    } catch (e) { /* ignore polling errors */ }
  }

  function handleWSMessage(msg) {
    if (msg.type !== 'progress' || !msg.data) return;
    const d   = msg.data;
    const pct = Number(d.progress || 0);
    // Tìm job đang chạy — ưu tiên pipeline1JobId (OCR job), sau đó processingJobId (inpaint job)
    const job = state.jobs.find(j => j.id === state.pipeline1JobId)
             || state.jobs.find(j => j.id === state.processingJobId);
    if (!job) return;
    if (d.job_id && job.backendJobId && d.job_id !== job.backendJobId) return;

    if (Number.isFinite(pct) && pct > 0) {
      job.progress = pct;
      if (state.activeJobId === job.id) {
        setProgress(pct, d.status || `${pct}%`);
        if (d.frame !== undefined && state.videoInfo) loadSyncedFrame(d.frame);
      }
      renderJobList();
    }

    // Nếu là inpaint job (không phải pipeline1), chỉ gọi onJobFinished khi backend gửi cờ is_finished: true và status === 'finished'
    if (!state.pipeline1JobId && d.is_finished === true && d.status === 'finished') {
      onJobFinished(job);
    }

    // Handle srt_content từ backend WS (OCR kết quả)
    if (d.srt_content && !job.srtContent) {
      job.srtContent = d.srt_content;
      if (el.srtContent) el.srtContent.value = d.srt_content;
      addLog('[ASR] ✅ SRT đã được trích xuất.', 'success');
    }
  }

  function onJobFinished(job) {
    if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
    if (state.processingTimerInterval) { clearInterval(state.processingTimerInterval); state.processingTimerInterval = null; }
    state.processingStartTime = null;
    if (el.btnCancel) el.btnCancel.textContent = '⬛ Hủy xử lý';

    // All inpaint passes done
    job.progress = 100;
    job.status = 'finished';
    state.processingJobId = null;
    state.processingPassIndex = 0;
    addLog(`✅ Xóa sub hoàn tất: ${job.fileName}`, 'success');

    if (state.activeJobId === job.id) {
      setProgress(100, 'Xóa sub hoàn tất!');
      updateStartButton();
      if (job.outputPath) {
        el.timelineResult.disabled = false; el.btnPlayResult.disabled = false;
        el.btnPrevResult.disabled  = false; el.btnNextResult.disabled  = false;
        loadSyncedFrame(0);
      }
    }

    // ── Pipeline 1: AI Rewrite → TTS (nếu user bật) ──────────────────────
    const srtText = job.srtContent || el.srtContent?.value?.trim();
    if (srtText) {
      const needAi  = job.aiRewrite   && !job._aiTriggered;
      const needTts = job.ttsGenerate && !job._ttsTriggered && !needAi;

      if (needAi || needTts) {
        job.status = 'processing';  // giữ trạng thái cho đến khi pipeline 1 xong
        renderJobList();

        if (needAi) {
          job._aiTriggered = true;
          // Gọi qua window vì pipeline1-ai.js là ES6 module expose lên window
          if (typeof window.triggerAutoAiRewrite === 'function') {
            window.triggerAutoAiRewrite(job, srtText).then(() => _afterPipeline1(job));
          } else {
            addLog('[AI] ⚠️ Module pipeline1-ai chưa được load.', 'warning');
            _afterPipeline1(job);
          }
        } else {
          job._ttsTriggered = true;
          const srtForTts = job.aiContent?.includes('-->') ? job.aiContent : (job.aiContent ? _buildTimedSrt(job.aiContent, srtText) : srtText);
          if (typeof window.triggerAutoTts === 'function') {
            window.triggerAutoTts(job, srtForTts).then(() => _afterPipeline1(job));
          } else {
            addLog('[TTS] ⚠️ Module pipeline1-ai chưa được load.', 'warning');
            _afterPipeline1(job);
          }
        }
        return; // Không gọi processNextJob ngay
      }
    }

    _finalizeJobOrNext(job);
  }

  function _afterPipeline1(job) {
    _finalizeJobOrNext(job);
  }

  function _finalizeJobOrNext(job) {
    job.status   = 'finished';
    job.progress = 100;
    showToast(`"${job.fileName}" đã xử lý xong!`, 'success', 5000);
    renderJobList();
    if (state.activeJobId === job.id) { setProgress(100, 'Hoàn tất!'); updateStartButton(); }
    processNextJob();
  }

  // ─── Pipeline 1 Queue Runner ──────────────────────────────────────────────
  /**
   * Chạy các job có pipeline=1 (AI Analysis + TTS).
   * KHÔNG gọi inpaint backend. Chỉ: OCR/ASR từ video gốc → AI rewrite → TTS.
   * Sau khi xong, job.status = 'finished', sẵn sàng cho Pipeline 2 thủ công.
   */
  async function processPipeline1Queue() {
    if (state.pipeline1JobId) return; // đang có job chạy
    const nextJob = state.jobs.find(j => j.status === 'queued' && j.pipeline === 1);
    if (!nextJob) return;

    state.pipeline1JobId = nextJob.id;
    nextJob.status   = 'processing';
    nextJob.progress = 0;
    nextJob._p1Cancelled = false;
    renderJobList();
    addLog(`[AI] 🚀 Bắt đầu Pipeline 1: ${nextJob.fileName}`, 'success');

    try {
      // Bước 1: Trích xuất văn bản từ âm thanh (ASR)
      addLog('[AI] 🎤 Bước 1/3 — Đang trích xuất văn bản từ âm thanh (ASR)...', 'info');

      const asrRes = await api.extractTextP1(
        nextJob.id,
        nextJob.filePath,
        nextJob.asrLanguage || 'zh'
      );

      if (nextJob._p1Cancelled) {
        _finishP1Job(nextJob, 'idle');
        return;
      }

      if (asrRes.status !== 'ok' || asrRes.job_id !== nextJob.id) {
        throw new Error('Job ID mismatch or response parsing failed.');
      }

      if (!asrRes.srt_content || asrRes.srt_content.trim() === '') {
        throw new Error('Không phát hiện được văn bản trong video.');
      }

      nextJob.srtContent = asrRes.srt_content;
      if (!nextJob.aiContent) {
        nextJob.aiContent = _srtToDisplayText(asrRes.srt_content);
      }

      const srtEl = document.getElementById('srt-content');
      if (srtEl && state.activeJobId === nextJob.id) {
        srtEl.value = asrRes.srt_content;
      }

      const srtEl2 = document.getElementById('step1-detail-text');
      if (srtEl2 && state.activeJobId === nextJob.id) {
        srtEl2.value = asrRes.srt_content;
      }

      const lineCount = (asrRes.srt_content.match(/-->/g) || []).length;
      addLog(`[AI] ✅ ASR hoàn tất — ${lineCount} dòng phụ đề.`, 'success');

      nextJob.progress = 33;
      renderJobList(); // cập nhật card với srtContent mới

      // Bước 2: AI Rewrite (nếu bật và có SRT)
      if (nextJob.aiRewrite && nextJob.srtContent) {
        addLog('[AI] 🤖 Bước 2/3 — AI đang viết lại phụ đề...', 'info');
        if (typeof window.triggerAutoAiRewrite === 'function') {
          await window.triggerAutoAiRewrite(nextJob, nextJob.srtContent);
          // Sau khi AI xong, đảm bảo aiContent hiển thị text sạch trong card
          if (nextJob.aiContent && nextJob.aiContent.includes('-->')) {
            nextJob.aiContent = _srtToDisplayText(nextJob.aiContent);
          }
        } else {
          addLog('[AI] ⚠️ Module pipeline1-ai chưa load.', 'warning');
        }
        if (nextJob._p1Cancelled) { _finishP1Job(nextJob, 'idle'); return; }
      } else if (!nextJob.aiRewrite) {
        addLog('[AI] ℹ️ Bước 2/3 — Bỏ qua AI rewrite (chưa bật).', 'info');
      }

      nextJob.progress = 66;
      renderJobList();

      // Bước 3: TTS (nếu bật và chưa được chain từ AI rewrite)
      // triggerAutoAiRewrite đã chain TTS rồi nếu aiRewrite=true
      // Nên chỉ gọi TTS riêng khi aiRewrite=false
      if (nextJob.ttsGenerate && !nextJob.aiRewrite) {
        addLog('[TTS] 🎤 Bước 3/3 — Tạo âm thanh lồng tiếng...', 'info');
        const srtForTts = nextJob.srtContent || '';
        if (srtForTts && typeof window.triggerAutoTts === 'function') {
          await window.triggerAutoTts(nextJob, srtForTts);
        } else if (!srtForTts) {
          addLog('[TTS] ⚠️ Không có SRT để tạo TTS.', 'warning');
        }
        if (nextJob._p1Cancelled) { _finishP1Job(nextJob, 'idle'); return; }
      } else if (nextJob.ttsGenerate && nextJob.aiRewrite) {
        addLog('[TTS] ℹ️ Bước 3/3 — TTS đã được chain từ AI rewrite.', 'info');
      } else {
        addLog('[TTS] ℹ️ Bước 3/3 — Bỏ qua TTS (chưa bật).', 'info');
      }

      nextJob.progress = 100;
      _finishP1Job(nextJob, 'finished');
      addLog(`[AI] 🎉 Pipeline 1 hoàn tất: ${nextJob.fileName}`, 'success');
      showToast(`"${nextJob.fileName}" — AI & TTS hoàn tất!`, 'success', 5000);

    } catch (e) {
      addLog('[AI] ❌ Lỗi Pipeline 1: ' + e.message, 'error');
      _finishP1Job(nextJob, 'error');
    }
  }

  function _finishP1Job(job, status) {
    job.status = status;
    state.pipeline1JobId = null;
    // Dọn dẹp processingJobId nếu OCR job vừa kết thúc
    if (state.processingJobId === job.id) state.processingJobId = null;
    if (state.pollTimer) { clearInterval(state.pollTimer); state.pollTimer = null; }
    renderJobList();
    // Tiếp tục job pipeline 1 tiếp theo nếu có
    if (status === 'finished') processPipeline1Queue();
  }

  /**
   * Chờ backend hoàn thành OCR job (skip_inpaint=true) và lấy SRT.
   * Backend gửi srt_content qua WebSocket (handleWSMessage sẽ set job.srtContent).
   * @returns {Promise<string|null>} SRT content hoặc null nếu timeout/lỗi
   */
  async function _waitForOcrSrt(job, timeoutSecs = 120) {
    // Đăng ký polling
    state.processingJobId = job.id; // để handleWSMessage nhận đúng job
    state.pollTimer = setInterval(async () => { /* handled below */ }, 99999);

    return new Promise((resolve) => {
      let elapsed = 0;
      const interval = setInterval(async () => {
        elapsed += 2;

        // WS đã set srtContent (qua handleWSMessage → d.srt_content)
        if (job.srtContent) {
          clearInterval(interval);
          resolve(job.srtContent);
          return;
        }

        // Poll /api/status để cập nhật progress và detect finish
        try {
          const st = await api.getStatus();
          const backendJob = st.current_job_id && st.jobs ? st.jobs[st.current_job_id] : null;
          if (backendJob) {
            const pct = backendJob.progress || 0;
            job.progress = Math.min(Math.round(pct * 0.33), 33);
            renderJobList();
            if (backendJob.status === 'finished' || pct >= 100) {
              clearInterval(interval);
              resolve(job.srtContent || null);
              return;
            }
          }
        } catch (e) { /* ignore */ }

        if (job._p1Cancelled) { clearInterval(interval); resolve(null); return; }
        if (elapsed >= timeoutSecs) {
          clearInterval(interval);
          addLog('[AI] ⏱ Timeout chờ OCR.', 'warning');
          resolve(job.srtContent || null);
        }
      }, 2000);
    });
  }

  // Fallback _buildTimedSrt (dùng khi pipeline1-ai.js chưa load)
  function _buildTimedSrt(newText, originalSrt) {
    if (newText && newText.includes('-->')) return newText;
    if (!originalSrt || !originalSrt.includes('-->')) return newText || '';
    const slots = [];
    for (const block of originalSrt.trim().split(/\n\n+/)) {
      const m = block.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
      if (m) slots.push({ start: m[1].replace('.', ','), end: m[2].replace('.', ',') });
    }
    const lines = (newText || '').split('\n').map(l => l.trim()).filter(l => l && !/^\d+$/.test(l) && !l.includes('-->'));
    if (!slots.length || !lines.length) return newText || '';
    let result = '';
    slots.forEach((s, i) => {
      const idx = Math.min(Math.floor(i * lines.length / slots.length), lines.length - 1);
      result += `${i+1}\n${s.start} --> ${s.end}\n${lines[idx]}\n\n`;
    });
    return result;
  }

  // ─── Video Preview ────────────────────────────────────────────────────────
  async function loadOrigFrame(frameNum, videoPath) {
    try {
      const blob = await api.getFrame(frameNum, videoPath);
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload = () => {
        if (!el.canvasOrig) return;
        el.canvasOrig.width = img.width; el.canvasOrig.height = img.height;
        ctxOrig.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        state.currentFrameOrig = frameNum;
        if (el.frameInfoOrig && state.videoInfo) el.frameInfoOrig.textContent = `${frameNum}/${state.videoInfo.total_frames-1}`;
        if (el.timelineOrig) el.timelineOrig.value = frameNum;
        renderRegionOverlays();
        const job = getActiveJob();
        if (job?.outputPath) {
          loadResultFrame(frameNum, job.outputPath);
        }
      };
      img.src = url;
    } catch (e) { /* ignore frame load errors during seek */ }
  }
  window.loadOrigFrame = loadOrigFrame;

  async function loadResultFrame(frameNum, outputPath) {
    try {
      const blob = await api.getOutputFrame(frameNum, outputPath);
      const url  = URL.createObjectURL(blob);
      const img  = new Image();
      img.onload = () => {
        if (!el.canvasResult) return;
        el.canvasResult.width = img.width; el.canvasResult.height = img.height;
        ctxResult.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        el.resultPlaceholder?.classList.add('hidden');
        state.currentFrameResult = frameNum;
        if (el.frameInfoResult && state.videoInfo) el.frameInfoResult.textContent = `${frameNum}/${state.videoInfo.total_frames-1}`;
        if (el.timelineResult) el.timelineResult.value = frameNum;
      };
      img.src = url;
    } catch (e) { /* ignore */ }
  }
  window.loadResultFrame = loadResultFrame;

  function loadSyncedFrame(frameNum) {
    const job = getActiveJob();
    loadOrigFrame(frameNum, job?.filePath);
    if (job?.status === 'finished' && job.outputPath) loadResultFrame(frameNum, job.outputPath);
  }

  function attachHoldToStep(btn, stepFn) {
    if (!btn) return;
    let timer = null;
    let interval = null;
    let isHolding = false;

    const start = (e) => {
      if (e && e.button !== undefined && e.button !== 0) return;
      isHolding = true;
      stepFn();
      timer = setTimeout(() => {
        if (!isHolding) return;
        interval = setInterval(() => {
          if (!isHolding) { clearInterval(interval); return; }
          stepFn();
        }, 50);
      }, 250);
    };

    const stop = () => {
      isHolding = false;
      if (timer) { clearTimeout(timer); timer = null; }
      if (interval) { clearInterval(interval); interval = null; }
    };

    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
    btn.addEventListener('touchstart', (e) => { start(e.touches?.[0] || e); }, { passive: true });
    btn.addEventListener('touchend', stop);
    btn.addEventListener('touchcancel', stop);
  }

  async function loadVideo(job) {
    try {
      if (!state.isBackendReady) { setTimeout(() => loadVideo(job), 2000); return; }
      addLog(`Đang tải preview: ${job.fileName}...`, 'info');
      const info = await api.videoInfo(job.filePath);
      if (!info?.width) { addLog('Lỗi: Dữ liệu video không hợp lệ', 'error'); return; }
      state.videoInfo = info;
      if (el.metaName) el.metaName.textContent = job.fileName;
      if (el.metaRes)  el.metaRes.textContent  = `${info.width}×${info.height}`;
      if (el.metaFps)  el.metaFps.textContent  = `${info.fps.toFixed(1)} fps`;
      if (el.metaDur)  el.metaDur.textContent  = fmtTime(info.duration);
      if (el.timelineOrig) { el.timelineOrig.max = info.total_frames - 1; el.timelineOrig.disabled = false; }
      el.btnPlayOrig?.removeAttribute('disabled'); el.btnPrevOrig?.removeAttribute('disabled'); el.btnNextOrig?.removeAttribute('disabled');
      el.dropZone?.classList.add('hidden');
      el.timelineResult.max = info.total_frames - 1; el.timelineResult.value = 0;
      if (el.frameInfoResult) el.frameInfoResult.textContent = `0/${info.total_frames-1}`;
      el.resultPlaceholder?.classList.remove('hidden');
      ctxResult?.clearRect(0, 0, el.canvasResult.width, el.canvasResult.height);
      await loadOrigFrame(0, job.filePath);
      const hasResult = job.status === 'finished' && job.outputPath;
      el.timelineResult.disabled   = !hasResult; el.btnPlayResult.disabled   = !hasResult;
      el.btnPrevResult.disabled    = !hasResult; el.btnNextResult.disabled    = !hasResult;
      if (hasResult) loadResultFrame(0, job.outputPath);
    } catch (e) { addLog('Lỗi tải video: ' + e.message, 'error'); }
  }

  function fmtTime(s) {
    if (!s || isNaN(s)) return '00:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  // Timeline controls
  el.timelineOrig?.addEventListener('input', () => {
    const job = getActiveJob(); if (!job) return;
    const f = parseInt(el.timelineOrig.value);
    loadOrigFrame(f, job.filePath);
  });
  el.timelineResult?.addEventListener('input', () => {
    const job = getActiveJob(); if (!job || !job.outputPath) return;
    loadResultFrame(parseInt(el.timelineResult.value), job.outputPath);
  });

  attachHoldToStep(el.btnPrevOrig, () => {
    const j = getActiveJob();
    if (j) loadOrigFrame(Math.max(0, state.currentFrameOrig - 1), j.filePath);
  });
  attachHoldToStep(el.btnNextOrig, () => {
    const j = getActiveJob();
    if (j && state.videoInfo) loadOrigFrame(Math.min(state.currentFrameOrig + 1, state.videoInfo.total_frames - 1), j.filePath);
  });
  attachHoldToStep(el.btnPrevResult, () => {
    const j = getActiveJob();
    if (j?.outputPath) loadResultFrame(Math.max(0, state.currentFrameResult - 1), j.outputPath);
  });
  attachHoldToStep(el.btnNextResult, () => {
    const j = getActiveJob();
    if (j?.outputPath && state.videoInfo) loadResultFrame(Math.min(state.currentFrameResult + 1, state.videoInfo.total_frames - 1), j.outputPath);
  });

  el.btnPlayOrig?.addEventListener('click', () => {
    if (state.playIntervalOrig) { clearInterval(state.playIntervalOrig); state.playIntervalOrig = null; el.btnPlayOrig.textContent = '▶'; return; }
    el.btnPlayOrig.textContent = '⏸';
    state.playIntervalOrig = setInterval(() => {
      const j = getActiveJob(); if (!j || !state.videoInfo) return;
      const next = (state.currentFrameOrig + 1) % state.videoInfo.total_frames;
      loadOrigFrame(next, j.filePath);
    }, 100);
  });
  el.btnPlayResult?.addEventListener('click', () => {
    if (state.playIntervalResult) { clearInterval(state.playIntervalResult); state.playIntervalResult = null; el.btnPlayResult.textContent = '▶'; return; }
    el.btnPlayResult.textContent = '⏸';
    state.playIntervalResult = setInterval(() => {
      const j = getActiveJob(); if (!j?.outputPath || !state.videoInfo) return;
      const next = (state.currentFrameResult + 1) % state.videoInfo.total_frames;
      loadResultFrame(next, j.outputPath);
    }, 100);
  });

  // ─── Region Drawing ───────────────────────────────────────────────────────
  function renderRegionsList() {
    const job = getActiveJob();
    if (!el.regionsList) return;
    if (!job || !job.regions.length) {
      el.regionsList.innerHTML = '<div class="region-empty">Bấm "+ Vẽ vùng" rồi kéo chuột trên video</div>';
      return;
    }
    el.regionsList.innerHTML = '';
    job.regions.forEach((r, i) => {
      const item = document.createElement('div');
      item.className = 'region-item';
      item.innerHTML = `<span class="region-dot" style="background:${REGION_COLORS[i%REGION_COLORS.length]}"></span>
        <span class="region-label">Vùng #${r.label} (${r.startFrame}-${r.endFrame})</span>
        <button class="btn-region-del" data-idx="${i}">✕</button>`;
      item.querySelector('.btn-region-del').addEventListener('click', () => {
        job.regions.splice(i, 1);
        renderRegionsList(); renderRegionOverlays();
      });
      el.regionsList.appendChild(item);
    });
  }

  function renderRegionOverlays() {
    if (!el.subtitleOverlay) return;
    el.subtitleOverlay.innerHTML = '';
    const job = getActiveJob();
    if (!job || !state.videoInfo || !el.canvasOrig) return;
    const cw = el.canvasOrig.clientWidth || el.canvasOrig.width;
    const ch = el.canvasOrig.clientHeight || el.canvasOrig.height;
    const scaleX = cw / (state.videoInfo.width || 1);
    const scaleY = ch / (state.videoInfo.height || 1);
    const currentFrame = Number(state.currentFrameOrig ?? el.timelineOrig?.value ?? 0);

    job.regions.forEach((r, i) => {
      const inRange = (r.startFrame == null || r.endFrame == null) || (currentFrame >= r.startFrame && currentFrame <= r.endFrame);
      if (!inRange) return;

      const div = document.createElement('div');
      div.className = 'region-overlay';
      div.dataset.regionIndex = String(i);
      div.style.cssText = `position:absolute;border:2px solid ${REGION_COLORS[i%REGION_COLORS.length]};pointer-events:none;
        left:${r.xmin*scaleX}px;top:${r.ymin*scaleY}px;
        width:${(r.xmax-r.xmin)*scaleX}px;height:${(r.ymax-r.ymin)*scaleY}px;`;
      el.subtitleOverlay.appendChild(div);
    });
  }

  el.btnDrawRegion?.addEventListener('click', () => {
    state.isDrawing = !state.isDrawing;
    el.btnDrawRegion.classList.toggle('active', state.isDrawing);
    if (el.canvasOrig) el.canvasOrig.style.cursor = state.isDrawing ? 'crosshair' : 'default';
  });

  el.modeAuto?.addEventListener('click',   () => { const j=getActiveJob(); if(j){ j.subtitleMode='auto';   loadControlsFromJob(j); } });
  el.modeManual?.addEventListener('click', () => { const j=getActiveJob(); if(j){ j.subtitleMode='manual'; loadControlsFromJob(j); } });

  const canvasInner = document.getElementById('canvas-inner-orig');
  if (canvasInner) {
    canvasInner.addEventListener('mousedown', (e) => {
      if (!state.isDrawing) return;
      const rect = canvasInner.getBoundingClientRect();
      state.isSelecting    = true;
      state.selectionStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    });
    canvasInner.addEventListener('mousemove', (e) => {
      if (!state.isSelecting || !state.selectionStart) return;
      const rect   = canvasInner.getBoundingClientRect();
      const x2     = e.clientX - rect.left, y2 = e.clientY - rect.top;
      let preview  = document.getElementById('region-preview');
      if (!preview) { preview = document.createElement('div'); preview.id = 'region-preview'; preview.style.cssText = 'position:absolute;border:2px dashed #7c3aed;pointer-events:none;z-index:10'; canvasInner.appendChild(preview); }
      const x = Math.min(state.selectionStart.x, x2), y = Math.min(state.selectionStart.y, y2);
      preview.style.cssText += `;left:${x}px;top:${y}px;width:${Math.abs(x2-state.selectionStart.x)}px;height:${Math.abs(y2-state.selectionStart.y)}px`;
    });
    canvasInner.addEventListener('mouseup', (e) => {
      if (!state.isSelecting || !state.selectionStart || !state.videoInfo) return;
      document.getElementById('region-preview')?.remove();
      state.isSelecting = false;
      const rect   = canvasInner.getBoundingClientRect();
      const x2     = e.clientX - rect.left, y2 = e.clientY - rect.top;
      const scaleX = state.videoInfo.width  / canvasInner.clientWidth;
      const scaleY = state.videoInfo.height / canvasInner.clientHeight;
      const xmin   = Math.round(Math.min(state.selectionStart.x, x2) * scaleX);
      const xmax   = Math.round(Math.max(state.selectionStart.x, x2) * scaleX);
      const ymin   = Math.round(Math.min(state.selectionStart.y, y2) * scaleY);
      const ymax   = Math.round(Math.max(state.selectionStart.y, y2) * scaleY);
      if (xmax - xmin < 10 || ymax - ymin < 5) return; // too small
      const job = getActiveJob();
      if (!job) return;
      job.regions.push({ xmin, xmax, ymin, ymax, startFrame: 0, endFrame: state.videoInfo.total_frames-1, label: job.regions.length+1 });
      state.isDrawing = false;
      el.btnDrawRegion?.classList.remove('active');
      if (el.canvasOrig) el.canvasOrig.style.cursor = 'default';
      renderRegionsList(); renderRegionOverlays();
    });
  }

  // ─── Voice Segments render ────────────────────────────────────────────────
  function renderVoiceSegments(segments) {
    const container = document.getElementById('voice-segments');
    if (!container) return;
    if (!segments || segments.length === 0) { container.innerHTML = ''; return; }
    container.innerHTML = segments.map((s, i) => `
      <div class="voice-seg" style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <span style="font-size:11px;color:var(--text-muted)">Seg ${i+1}</span>
        ${s.audio_path ? `<audio controls style="flex:1;height:24px" src="file://${s.audio_path.replace(/\\/g,'/')}"></audio>` : `<span style="font-size:11px">${s.text||''}</span>`}
      </div>`).join('');
  }
  window.renderVoiceSegments = renderVoiceSegments;

  // ─── Output Dir Button ────────────────────────────────────────────────────
  el.btnOutputDir?.addEventListener('click', async () => {
    if (!window.electronAPI?.openDirectory) return;
    const result = await window.electronAPI.openDirectory();
    if (!result?.canceled && result?.filePaths?.[0]) {
      state.outputDir = result.filePaths[0];
      localStorage.setItem('output_dir', state.outputDir);
      const display = document.getElementById('output-dir-text');
      if (display) display.textContent = state.outputDir;
      addLog(`Thư mục đầu ra: ${state.outputDir}`, 'info');
    }
  });

  // ─── Column Resize ────────────────────────────────────────────────────────
  function initResize(handle, leftSel, rightSel) {
    if (!handle) return;
    let dragging = false, startX, startLeft, startRight;
    handle.addEventListener('mousedown', (e) => {
      dragging = true; startX = e.clientX;
      const lEl = document.querySelector(leftSel), rEl = document.querySelector(rightSel);
      startLeft = lEl?.offsetWidth || 0; startRight = rEl?.offsetWidth || 0;
      document.body.style.cursor = 'col-resize';
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const lEl = document.querySelector(leftSel), rEl = document.querySelector(rightSel);
      if (lEl) lEl.style.width = Math.max(160, startLeft + dx) + 'px';
      if (rEl) rEl.style.flex  = 'none', rEl.style.width = Math.max(160, startRight - dx) + 'px';
    });
    document.addEventListener('mouseup', () => { dragging = false; document.body.style.cursor = ''; });
  }
  initResize(el.resizeHandle1, '.col-controls', '.col-preview');
  initResize(el.resizeHandle2, '.col-preview',  '.col-jobs');

  // ─── CheckBox expand/collapse for job cards ───────────────────────────────
  ['chk-extract-srt','chk-ai-rewrite','chk-tts-generate','chk-voice-sub'].forEach(id => {
    const chk = document.getElementById(id);
    if (!chk) return;
    chk.addEventListener('change', () => {
      saveControlsToJob();
      const job = getActiveJob();
      if (!job) return;
      $('#card-srt')?.classList.toggle('active',      job.extractSrt);
      $('#card-ai')?.classList.toggle('active',       job.aiRewrite);
      $('#card-voice')?.classList.toggle('active',    job.ttsGenerate);
      $('#card-voicesub')?.classList.toggle('active', job.voiceSub);
    });
  });

  // ASR fallback toggle
  document.getElementById('chk-asr-fallback')?.addEventListener('change', (e) => {
    const asrOpts = document.getElementById('asr-options');
    if (asrOpts) asrOpts.style.display = e.target.checked ? '' : 'none';
    saveControlsToJob();
  });

  // ─── Settings (delegated to settings module via window.*) ────────────────
  function loadSettingsValues() {
    if (typeof window.loadSettingsValues === 'function') window.loadSettingsValues();
  }

  // ─── Python backend log forwarding ───────────────────────────────────────
  if (window.electronAPI?.onPythonLog) {
    window.electronAPI.onPythonLog((msg) => {
      msg.split('\n').filter(l => l.trim()).forEach(line => addLog('[Py] ' + line, 'info'));
    });
  }
  if (window.electronAPI?.onPythonError) {
    window.electronAPI.onPythonError((msg) => {
      msg.split('\n').filter(l => l.trim()).forEach(line => addLog('[Err] ' + line, 'error'));
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  connectToBackend();

  // Khởi tạo các module ES6 sau khi DOM sẵn sàng
  // (các module được load qua <script type="module"> trong index.html
  //  và tự gọi window.initXxx = ... rồi app.js gọi lại đây)
  setTimeout(() => {
    if (typeof window.initPromptManager === 'function') window.initPromptManager();
    else console.warn('[App] initPromptManager chưa được load — kiểm tra script tag trong index.html');

    if (typeof window.initSettings === 'function') window.initSettings();
    else console.warn('[App] initSettings chưa được load');

    if (typeof window.renderSavedVoices === 'function') window.renderSavedVoices();

    // Sync voice dropdown với voices đã lưu (nếu settings module chưa ready)
    const voices = (() => { try { return JSON.parse(localStorage.getItem('tts_voices') || '[]'); } catch { return []; } })();
    const ttsVoiceSel = document.getElementById('tts-voice');
    if (ttsVoiceSel && voices.length > 0) {
      voices.forEach((v, i) => {
        if (![...ttsVoiceSel.options].some(o => o.value === `clone:${i}`)) {
          const opt = document.createElement('option');
          opt.value = `clone:${i}`; opt.textContent = `🎤 ${v.name}`;
          ttsVoiceSel.appendChild(opt);
        }
      });
      const saved = localStorage.getItem('tts_voice') || 'none';
      if ([...ttsVoiceSel.options].some(o => o.value === saved)) ttsVoiceSel.value = saved;
    }

    setTimeout(() => {
      if (typeof window.checkTTSStatus === 'function') window.checkTTSStatus();
    }, 3000);

    updateStartButton();
    addLog('App khởi động thành công.', 'info');
  }, 100);

})(); // end IIFE

  window.renderJobDetail1 = function() {
    const titleEl = document.getElementById('step1-detail-title');
    const statusEl = document.getElementById('step1-detail-status');
    const textEl = document.getElementById('step1-detail-text');
    const audioEl = document.getElementById('step1-detail-audio');
    const audioEmptyEl = document.getElementById('step1-audio-empty');
    
    if (!state.pipeline1SelectedJobId) {
      if (titleEl) titleEl.textContent = 'Vui lòng chọn 1 Job';
      if (statusEl) statusEl.textContent = 'Trống';
      if (textEl) textEl.value = '';
      if (audioEl) { audioEl.style.display = 'none'; audioEl.src = ''; }
      if (audioEmptyEl) audioEmptyEl.style.display = 'block';
      return;
    }
    
    const job = state.jobs.find(j => j.id === state.pipeline1SelectedJobId);
    if (!job) return;
    
    if (titleEl) titleEl.textContent = job.fileName;
    if (statusEl) statusEl.textContent = job.status.toUpperCase();
    
    if (textEl) textEl.value = job.aiContent || job.srtContent || '';
    
    if (job.ttsAudioPath) {
      if (audioEl) {
        audioEl.style.display = 'block';
        audioEl.src = 'file://' + job.ttsAudioPath.replace(/\\/g, '/');
      }
      if (audioEmptyEl) audioEmptyEl.style.display = 'none';
    } else {
      if (audioEl) { audioEl.style.display = 'none'; audioEl.src = ''; }
      if (audioEmptyEl) audioEmptyEl.style.display = 'block';
    }
  }

  document.getElementById('step1-btn-save-text')?.addEventListener('click', () => {
    if (!state.pipeline1SelectedJobId) return;
    const job = state.jobs.find(j => j.id === state.pipeline1SelectedJobId);
    if (!job) return;
    const textEl = document.getElementById('step1-detail-text');
    if (textEl) {
      if (job.aiContent !== undefined) {
        job.aiContent = textEl.value;
      } else {
        job.srtContent = textEl.value;
      }
      addLog('Đã lưu nội dung cập nhật cho ' + job.fileName, 'info');
    }
  });
