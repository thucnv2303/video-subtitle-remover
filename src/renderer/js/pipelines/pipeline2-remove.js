import { $, $$, el } from '../utils/dom.js';
import { state, saveState } from '../store.js';
import { addLog, showToast } from '../utils/logger.js';

export async function runNextPass(job) {
  const aiConfig = {
    provider: localStorage.getItem('ai_provider') || 'gemini',
    api_key: localStorage.getItem('ai_api_key') || '',
    endpoint: localStorage.getItem('ai_endpoint') || '',
    prompt: localStorage.getItem('ai_prompt') || ''
  };

  let subtitleAreas = [];
  let regionsPayload = null;

  if (job.subtitleMode === 'manual' && job.regions.length > 0) {
    subtitleAreas = job.regions.map(r => [r.ymin, r.ymax, r.xmin, r.xmax]);
    regionsPayload = job.regions;
    addLog(`[Inpaint] Bắt đầu xóa đồng loạt ${job.regions.length} vùng phụ đề trực tiếp trong 1 lượt (Single-Pass)...`, 'info');
  }

  const jobPayload = [{
    input_path: job.filePath,
    output_path: job.outputPath,
    subtitle_areas: subtitleAreas,
    regions: regionsPayload,
    inpaint_mode: job.algorithm,
    mask_mode: job.maskMode || 'box',
    extract_srt: job.extractSrt,
    asr_fallback: job.asrFallback || false,
    asr_language: job.asrLanguage || 'vi',
    ai_rewrite: false,
    ai_config: aiConfig,
    tts_voice: job.ttsGenerate ? (job.ttsVoice || localStorage.getItem('tts_voice') || 'none') : 'none',
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

export async function pollProgress() {
  if (!state.processingJobId) return;
  const job = state.jobs.find(j => j.id === state.processingJobId);
  if (!job) return;

  try {
    const st = await api.getStatus();
    const backendJobId = st.current_job_id;
    const backendJob = backendJobId && st.jobs ? st.jobs[backendJobId] : null;

    if (backendJob) {
      const pct = Number(backendJob.progress || 0);
      job.progress = pct;

      if (state.activeJobId === job.id) {
        setProgress(pct, backendJob.status === 'processing' ? `${pct}%` : backendJob.status);
        if (pct > 0 && state.videoInfo && state.videoInfo.total_frames) {
          const frame = Math.min(
            Math.floor((pct / 100) * state.videoInfo.total_frames),
            state.videoInfo.total_frames - 1
          );
          loadSyncedFrame(frame);
        }
      }

      renderJobList();

      if (backendJob.status === 'finished' || (backendJob.status === 'processing' && pct >= 100 && backendJob.is_finished)) {
        onJobFinished(job);
      }
    }
  } catch (e) {}
}

export function handleWSMessage(msg) {
  if (msg.type === 'progress' && msg.data) {
    const d = msg.data;
    const pct = Number(d.progress || 0);
    const job = state.jobs.find(j => j.id === state.processingJobId);
    if (job) {
      if (d.job_id && job.backendJobId && d.job_id !== job.backendJobId) return;
      job.progress = pct;
      if (state.activeJobId === job.id) {
        setProgress(pct, d.status || `${pct}%`);
        if (d.frame !== undefined && state.videoInfo) {
          loadSyncedFrame(d.frame);
        }
      }
      renderJobList();
      if (d.is_finished === true || (d.status === 'finished' && pct >= 100)) onJobFinished(job);
    }
  }
}