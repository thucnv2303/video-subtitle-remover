import { $, $$, el } from '../utils/dom.js';
import { state, saveState } from '../store.js';
import { addLog, showToast } from '../utils/logger.js';

export function createJob(filePath) {
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

export function getActiveJob() {
    return state.jobs.find(j => j.id === state.activeJobId) || null;
  }

export function saveControlsToJob() {
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

export function loadControlsFromJob(job) {
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

export function selectJob(jobId) {
    // Save current job settings first
    saveControlsToJob();

    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    state.activeJobId = jobId;
    loadControlsFromJob(job);
    loadVideo(job);
    renderJobList();
  }

export function renderJobList() {
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

export async function processNextJob() {
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

export function onJobFinished(job) {
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

export async function loadVideo(job) {
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