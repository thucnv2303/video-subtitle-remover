import { $, $$, el } from '../utils/dom.js';
import { state, saveState } from '../store.js';
import { addLog, showToast } from '../utils/logger.js';
import { fmtTime } from '../utils/formatters.js';

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
    algorithm: 'lama',
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
    _aiTriggered: false,
    _ttsTriggered: false,
  };
}

export function getActiveJob() {
  return state.jobs.find(j => j.id === state.activeJobId) || null;
}

export function saveControlsToJob() {
  const job = getActiveJob();
  if (!job || job.status === 'processing') return;
  if (el.algoSelect) job.algorithm = el.algoSelect.value;
  if (el.maskMode) job.maskMode = el.maskMode.value || 'box';
  job.extractSrt = $('#chk-extract-srt')?.checked || false;
  job.asrFallback = $('#chk-asr-fallback')?.checked || false;
  job.asrLanguage = $('#asr-language')?.value || 'vi';
  job.aiRewrite = $('#chk-ai-rewrite')?.checked || false;
  job.ttsGenerate = el.chkTtsGenerate?.checked || false;
  job.voiceSub = el.chkVoiceSub?.checked || false;
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
  if (el.algoSelect) el.algoSelect.value = job.algorithm || 'lama';
  if (el.maskMode) el.maskMode.value = job.maskMode || 'box';
  const chkSrt = $('#chk-extract-srt');
  const chkAsr = $('#chk-asr-fallback');
  const selAsrLang = $('#asr-language');
  const chkAi = $('#chk-ai-rewrite');
  if (chkSrt) chkSrt.checked = job.extractSrt;
  if (chkAsr) chkAsr.checked = job.asrFallback || false;
  if (selAsrLang) selAsrLang.value = job.asrLanguage || 'vi';
  if (chkAi) chkAi.checked = job.aiRewrite;
  const asrOpts = $('#asr-options');
  if (asrOpts) asrOpts.style.display = job.asrFallback ? '' : 'none';
  const chkTts = el.chkTtsGenerate;
  if (chkTts) chkTts.checked = job.ttsGenerate || false;
  const chkVS = el.chkVoiceSub;
  if (chkVS) chkVS.checked = job.voiceSub || false;

  $('#card-srt')?.classList.toggle('active', job.extractSrt);
  $('#card-ai')?.classList.toggle('active', job.aiRewrite);
  $('#card-voice')?.classList.toggle('active', job.ttsGenerate);
  $('#card-voicesub')?.classList.toggle('active', job.voiceSub);

  if (el.srtContent) el.srtContent.value = job.srtContent || '';
  if (el.aiContent) el.aiContent.value = job.aiContent || '';
  if (el.voicesubContent) el.voicesubContent.value = job.voiceSubContent || '';
  if (typeof window.renderVoiceSegments === 'function') window.renderVoiceSegments(job.voiceSegments || []);
  if (job.subtitleMode === 'manual') {
    el.modeManual?.classList.add('active'); el.modeAuto?.classList.remove('active');
    el.regionsPanel?.classList.remove('hidden');
  } else {
    el.modeAuto?.classList.add('active'); el.modeManual?.classList.remove('active');
    el.regionsPanel?.classList.add('hidden');
  }

  if (typeof window.renderRegionsList === 'function') window.renderRegionsList();
  if (typeof window.renderRegionOverlays === 'function') window.renderRegionOverlays();
  if (typeof window.updateStartButton === 'function') window.updateStartButton();
}

export function selectJob(jobId) {
  saveControlsToJob();
  const job = state.jobs.find(j => j.id === jobId);
  if (!job) return;
  state.activeJobId = jobId;
  loadControlsFromJob(job);
  loadVideo(job);
  renderJobList();
}

export async function loadVideo(job) {
  if (!job || !job.filePath) return;
  try {
    addLog(`Đang tải video: ${job.fileName}...`, 'info');
    const info = await window.api.videoInfo(job.filePath);
    if (!info || !info.width) {
      addLog('Lỗi: Backend trả dữ liệu video không hợp lệ', 'error');
      return;
    }
    state.videoInfo = info;
    if (el.metaName) el.metaName.textContent = job.fileName;
    if (el.metaRes) el.metaRes.textContent = `${info.width}×${info.height}`;
    if (el.metaFps) el.metaFps.textContent = `${info.fps.toFixed(1)} fps`;
    if (el.metaDur) el.metaDur.textContent = fmtTime(info.duration);
    if (el.timelineOrig) {
      el.timelineOrig.max = info.total_frames - 1;
      el.timelineOrig.disabled = false;
    }
    if (el.btnPlayOrig) el.btnPlayOrig.disabled = false;
    if (el.btnPrevOrig) el.btnPrevOrig.disabled = false;
    if (el.btnNextOrig) el.btnNextOrig.disabled = false;
    if (el.dropZone) el.dropZone.classList.add('hidden');

    if (el.timelineResult) {
      el.timelineResult.max = info.total_frames - 1;
      el.timelineResult.value = 0;
    }
    if (el.frameInfoResult) el.frameInfoResult.textContent = `0/${info.total_frames - 1}`;
    if (el.resultPlaceholder) el.resultPlaceholder.classList.remove('hidden');
    if (window.ctxResult && el.canvasResult) window.ctxResult.clearRect(0, 0, el.canvasResult.width, el.canvasResult.height);

    if (typeof window.loadOrigFrame === 'function') await window.loadOrigFrame(0, job.filePath);

    if (job.status === 'finished' && job.outputPath) {
      if (el.timelineResult) el.timelineResult.disabled = false;
      if (el.btnPlayResult) el.btnPlayResult.disabled = false;
      if (el.btnPrevResult) el.btnPrevResult.disabled = false;
      if (el.btnNextResult) el.btnNextResult.disabled = false;
      if (typeof window.loadResultFrame === 'function') window.loadResultFrame(0, job.outputPath);
    } else {
      if (el.timelineResult) el.timelineResult.disabled = true;
      if (el.btnPlayResult) el.btnPlayResult.disabled = true;
      if (el.btnPrevResult) el.btnPrevResult.disabled = true;
      if (el.btnNextResult) el.btnNextResult.disabled = true;
    }
  } catch (e) {
    addLog('Lỗi tải video: ' + e.message, 'error');
    console.error('loadVideo error:', e);
  }
}

export function renderJobList() {
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
          <div style="display:flex; gap:4px; align-items:center;">
            ${(job.status !== 'processing' && job.status !== 'queued') ? `<button class="btn btn-xs btn-rerun-p2" data-id="${job.id}" style="padding:2px 6px; font-size:10px; background:#3b82f6; color:#fff; border:none; border-radius:4px; cursor:pointer;" title="Chạy lại job này">↻ Chạy lại</button>` : ''}
            ${(job.status === 'finished' && (job.finalOutputPath || job.outputPath)) ? `<button class="btn btn-xs btn-ghost" onclick="event.stopPropagation(); window.electronAPI?.openPath?.('${(job.finalOutputPath || job.outputPath).replace(/\\\\/g, '\\\\\\\\')}')" style="padding: 2px 6px; z-index:10;">📂 ${job.finalOutputPath ? '🎬 Final' : 'Mở Video'}</button>` : ''}
          </div>
        </div>
        <div class="job-progress-bar"><div class="job-progress-fill" style="width:${job.progress}%"></div></div>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-rerun-p2')) {
          e.stopPropagation();
          job.status = 'queued';
          job.progress = 0;
          job.p2Status = 'queued';
          job.p2Progress = 0;
          renderJobList();
          if (typeof window.processNextJob === 'function') window.processNextJob();
          return;
        }
        if (e.target.classList.contains('btn-delete-job')) {
          state.jobs = state.jobs.filter(j => j.id !== job.id);
          if (state.activeJobId === job.id) state.activeJobId = null;
          renderJobList();
        } else {
          selectJob(job.id);
        }
      });
      list2.appendChild(card);
    });
  }

  const list1 = document.getElementById('step1-job-list');
  const jobCount = document.getElementById('job-count');
  if (list1) {
    list1.innerHTML = '';
    if (jobCount) jobCount.textContent = `(${state.jobs.length} Items)`;
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
                  : `<button class="btn-process-job" data-id="${job.id}" style="background:#10b981; color:white; border:none; padding:2px 8px; border-radius:4px; cursor:pointer; font-size:11px;">▶ Chạy lại</button>`
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
            if (state.activeJobId === job.id) state.activeJobId = null;
            renderJobList();
          } else if (e.target.classList.contains('btn-process-job')) {
            job.status = 'queued';
            job.progress = 0;
            renderJobList();
            if (typeof window.processNextJob === 'function') window.processNextJob();
          }
        });
        list1.appendChild(card);
      });
    }
  }
}