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
