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
        tts_voice: (passIdx === job.regions.length - 1 && job.ttsGenerate) ? (job.ttsVoice || localStorage.getItem('tts_voice') || 'none') : 'none',
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
        tts_voice: job.ttsGenerate ? (job.ttsVoice || localStorage.getItem('tts_voice') || 'none') : 'none',
        tts_bg_volume: parseInt(localStorage.getItem('tts_bg_volume') || '10')
      }];

      try {
        addLog(`[Debug] Payload: extract_srt=${jobPayload[0].extract_srt}, ai_rewrite=${jobPayload[0].ai_rewrite}, tts_voice=${jobPayload[0].tts_voice}`, 'info');
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

export async function pollProgress() {
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

export function handleWSMessage(msg) {
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