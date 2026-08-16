import { ensureP3Config } from './editor-store.js';
import { updateJobDerivedAss } from './subtitle-ass.js';
import { applyTypewriterToAss, motionRenderConfig } from './subtitle-motion.js';

let activeRenderJobId = null;

function installBurnTimingBridge(job, config) {
  const api = window.api;
  const original = api?.burnSubtitlePositioned;
  if (typeof original !== 'function') return () => {};

  api.burnSubtitlePositioned = async function p3TimingAwareBurn(videoPath,srtContent,outputPath,positions,styleArgs,karaokeAss) {
    const info = job.p3VideoInfo || {};
    if (String(srtContent || '').trim() && Number(info.width) > 0 && Number(info.height) > 0) {
      job.p3RenderTimedSrt = srtContent;
      const sourceSrt = job.p3BaseTimedSrt || job.ttsTimedSrt || '';
      const timingChanged = String(srtContent).trim() !== String(sourceSrt).trim();
      const renderConfig = motionRenderConfig(job, timingChanged ? { ...config, preserveKaraoke: false } : config, timingChanged);
      if (timingChanged) job.p3AssTimedSrt = srtContent;
      else delete job.p3AssTimedSrt;
      let derived = updateJobDerivedAss(job, renderConfig, info.width, info.height);
      derived = applyTypewriterToAss(derived, renderConfig);
      if (derived) {
        job.p3DerivedAss = derived;
        job.karaokeAss = derived;
      }
      delete job.p3AssTimedSrt;
      if (timingChanged && config.preserveKaraoke && job.p3OriginalKaraokeAss) {
        window.addLog?.('[P3] Timing final đã đổi: dùng ASS từ SRT final thay cho karaoke timing P1 để tránh lệch subtitle.', 'info');
      }
      return original.call(api, videoPath, srtContent, outputPath, positions, styleArgs, derived || karaokeAss || null);
    }
    return original.call(api, videoPath, srtContent, outputPath, positions, styleArgs, karaokeAss);
  };

  return () => {
    delete job.p3AssTimedSrt;
    if (api.burnSubtitlePositioned !== original) api.burnSubtitlePositioned = original;
  };
}

export async function renderP3Job(job, onState) {
  if (!job) return false;
  if (activeRenderJobId) {
    window.showToast?.(`Pipeline 3 đang render Job khác (${activeRenderJobId}). Hãy chờ hoàn tất.`, 'warning', 3500);
    return false;
  }

  const config = ensureP3Config(job);
  if (!job.p3CleanVideoPath) job.p3CleanVideoPath = job.outputPath || '';
  if (!job.p3CleanVideoPath) {
    window.showToast?.('Job chưa có clean video từ Pipeline 2.', 'error', 4000);
    return false;
  }
  if (typeof window.finalizeVideo !== 'function') {
    window.showToast?.('Pipeline 3 finalizer chưa sẵn sàng.', 'error', 4000);
    return false;
  }

  if (!job.p3BaseTimedSrt) {
    job.p3BaseTimedSrt = (job.p3CueEdited && job.p3TimedSrt) ? job.p3TimedSrt : (job.ttsTimedSrt || job.p3TimedSrt || '');
  }
  if (job.p3BaseTimedSrt) job.p3TimedSrt = job.p3BaseTimedSrt;

  activeRenderJobId = job.id;
  job.outputPath = job.p3CleanVideoPath;
  job.voiceSub = Boolean(config.subtitleEnabled);
  localStorage.setItem('tts_remove_vocal', String(Boolean(config.removeVocal)));
  localStorage.setItem('tts_bg_volume', String(Math.max(0, Math.min(100, Number(config.bgVolume) || 0))));

  const restoreBurn = installBurnTimingBridge(job, config);
  onState?.('rendering');
  job.p3Status = 'rendering';
  try {
    const ok = await window.finalizeVideo(job);
    job.p3Status = ok ? 'finished' : 'error';
    onState?.(ok ? 'finished' : 'error');
    return Boolean(ok);
  } catch (error) {
    job.p3Status = 'error';
    onState?.('error', error);
    window.addLog?.(`[P3] Render lỗi: ${error?.message || error}`, 'error');
    return false;
  } finally {
    restoreBurn();
    activeRenderJobId = null;
  }
}

export function restoreCleanP3Input(job) { if (job?.p3CleanVideoPath) job.outputPath = job.p3CleanVideoPath; }
export function getActiveP3RenderJobId() { return activeRenderJobId; }
