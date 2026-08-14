import { ensureP3Config } from './editor-store.js';
import { updateJobDerivedAss } from './subtitle-ass.js';

function installBurnTimingBridge(job, config) {
  const api = window.api;
  const original = api?.burnSubtitlePositioned;
  if (typeof original !== 'function') return () => {};

  api.burnSubtitlePositioned = async function p3TimingAwareBurn(
    videoPath,
    srtContent,
    outputPath,
    positions,
    styleArgs,
    karaokeAss
  ) {
    const info = job.p3VideoInfo || {};
    if (String(srtContent || '').trim() && Number(info.width) > 0 && Number(info.height) > 0) {
      job.p3TimedSrt = srtContent;
      const wasRetimed = String(srtContent).trim() !== String(job.ttsTimedSrt || '').trim();
      const renderConfig = wasRetimed ? { ...config, preserveKaraoke: false } : config;
      const derived = updateJobDerivedAss(job, renderConfig, info.width, info.height);
      if (wasRetimed && config.preserveKaraoke && job.p3OriginalKaraokeAss) {
        window.addLog?.('[P3] Voice đã retime: dùng ASS từ SRT timing thực tế thay cho karaoke timing P1 để tránh lệch subtitle.', 'info');
      }
      return original.call(api, videoPath, srtContent, outputPath, positions, styleArgs, derived || karaokeAss || null);
    }
    return original.call(api, videoPath, srtContent, outputPath, positions, styleArgs, karaokeAss);
  };

  return () => {
    if (api.burnSubtitlePositioned !== original) api.burnSubtitlePositioned = original;
  };
}

export async function renderP3Job(job, onState) {
  if (!job) return false;
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
  }
}

export function restoreCleanP3Input(job) {
  if (job?.p3CleanVideoPath) job.outputPath = job.p3CleanVideoPath;
}
