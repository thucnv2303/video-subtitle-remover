import { ensureP3Config } from './editor-store.js';

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
  }
}

export function restoreCleanP3Input(job) {
  if (job?.p3CleanVideoPath) job.outputPath = job.p3CleanVideoPath;
}
