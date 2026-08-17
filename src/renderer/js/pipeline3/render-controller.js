import { ensureP3Config } from './editor-store.js';
import { updateJobDerivedAss } from './subtitle-ass.js';
import { applyTypewriterToAss, motionRenderConfig } from './subtitle-motion.js';

let activeRenderJobId = null;

function ensureP3RenderLogPanel() {
  let panel = document.getElementById('p3e-render-log-panel');
  if (panel) return panel;
  const timeline = document.querySelector('#step-3-content .p3e-timeline-card');
  if (!timeline?.parentNode) return null;
  panel = document.createElement('section');
  panel.id = 'p3e-render-log-panel';
  panel.className = 'p3e-card';
  panel.style.cssText = 'flex:0 0 auto;min-height:112px;max-height:180px;display:flex;flex-direction:column;overflow:hidden;';
  panel.innerHTML = '<div class="p3e-heading"><div><strong>Render Log</strong><small>Pipeline 3 · lỗi thật theo từng bước</small></div><button id="p3e-clear-render-log" class="p3e-btn" type="button">Xóa</button></div><div id="p3e-render-log" style="min-height:72px;max-height:130px;overflow:auto;padding:8px 10px;background:#07111b;font:9px/1.55 Consolas,monospace;color:#aebfd0;white-space:pre-wrap;word-break:break-word;"></div>';
  timeline.insertAdjacentElement('afterend', panel);
  const main = panel.parentElement;
  if (main?.classList.contains('p3e-main')) main.style.gridTemplateRows = 'minmax(330px,1fr) minmax(145px,25%) auto';
  panel.querySelector('#p3e-clear-render-log')?.addEventListener('click', () => {
    const box = document.getElementById('p3e-render-log');
    if (box) box.textContent = '';
  });
  return panel;
}

function appendP3RenderLog(message, type = 'info') {
  ensureP3RenderLogPanel();
  const box = document.getElementById('p3e-render-log');
  if (!box) return;
  const row = document.createElement('div');
  const stamp = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  row.textContent = `[${stamp}] ${String(message || '')}`;
  row.style.color = type === 'error' ? '#fca5a5' : type === 'success' ? '#86efac' : type === 'warning' ? '#fde68a' : '#aebfd0';
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

function installP3LogMirror() {
  const original = window.addLog;
  window.addLog = function p3DiagnosticLog(message, type) {
    appendP3RenderLog(message, type);
    if (typeof original === 'function') return original.apply(this, arguments);
  };
  return () => {
    if (window.addLog !== original) window.addLog = original;
  };
}

function p3BridgePreflight(job, config) {
  const missing = [];
  if (!window.api?.videoInfo) missing.push('videoInfo API');
  if (!window.api?.replaceAudio) missing.push('replaceAudio API');
  if (config.subtitleEnabled && typeof window.electronAPI?.burnP3SubtitleHq !== 'function') missing.push('burnP3SubtitleHq bridge');
  const plan = job?.p3FitPlan;
  if (plan?.ok && Math.abs(Number(plan.videoSpeed || 1) - 1) >= .02 && typeof window.electronAPI?.retimeP3Video !== 'function') missing.push('retimeP3Video bridge');
  if (plan?.ok && Math.abs(Number(plan.voiceSpeed || 1) - 1) >= .001 && typeof window.electronAPI?.prepareP1NarrationAudio !== 'function') missing.push('prepareP1NarrationAudio bridge');
  return missing;
}

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
  ensureP3RenderLogPanel();
  if (activeRenderJobId) {
    const message = `Pipeline 3 đang render Job khác (${activeRenderJobId}). Hãy chờ hoàn tất.`;
    appendP3RenderLog(`[P3] ${message}`, 'warning');
    window.showToast?.(message, 'warning', 3500);
    return false;
  }

  const config = ensureP3Config(job);
  if (!job.p3CleanVideoPath) job.p3CleanVideoPath = job.outputPath || '';
  if (!job.p3CleanVideoPath) {
    appendP3RenderLog('[P3] PRECHECK FAIL · Job chưa có clean video từ Pipeline 2.', 'error');
    window.showToast?.('Job chưa có clean video từ Pipeline 2.', 'error', 4000);
    return false;
  }
  if (typeof window.finalizeVideo !== 'function') {
    appendP3RenderLog('[P3] PRECHECK FAIL · Pipeline 3 finalizer chưa sẵn sàng.', 'error');
    window.showToast?.('Pipeline 3 finalizer chưa sẵn sàng.', 'error', 4000);
    return false;
  }
  const missingBridge = p3BridgePreflight(job, config);
  if (missingBridge.length) {
    const message = `PRECHECK FAIL · Thiếu bridge/API: ${missingBridge.join(', ')}`;
    appendP3RenderLog(`[P3] ${message}`, 'error');
    window.showToast?.(message, 'error', 5000);
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

  const restoreLog = installP3LogMirror();
  const restoreBurn = installBurnTimingBridge(job, config);
  appendP3RenderLog(`[P3] START · Job ${job.id} · ${job.fileName || ''}`, 'info');
  onState?.('rendering');
  job.p3Status = 'rendering';
  try {
    const ok = await window.finalizeVideo(job);
    job.p3Status = ok ? 'finished' : 'error';
    onState?.(ok ? 'finished' : 'error');
    appendP3RenderLog(ok ? `[P3] DONE · ${job.finalOutputPath || job.outputPath || ''}` : '[P3] FAILED · Finalizer trả về false. Xem dòng lỗi ngay phía trên.', ok ? 'success' : 'error');
    return Boolean(ok);
  } catch (error) {
    job.p3Status = 'error';
    onState?.('error', error);
    window.addLog?.(`[P3] Render lỗi: ${error?.stack || error?.message || error}`, 'error');
    return false;
  } finally {
    restoreBurn();
    restoreLog();
    activeRenderJobId = null;
  }
}

export function restoreCleanP3Input(job) { if (job?.p3CleanVideoPath) job.outputPath = job.p3CleanVideoPath; }
export function getActiveP3RenderJobId() { return activeRenderJobId; }
