import { selectedP3Job, ensureP3Config } from './editor-store.js';
import { cuesForJob } from './subtitle-ass.js';

let resizeObserver = null;
let mutationObserver = null;
let scheduled = false;
let applyingText = false;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function numberValue(id, fallback = 0) {
  const value = Number(document.getElementById(id)?.value);
  return Number.isFinite(value) ? value : fallback;
}

function wrapWords(line, maxChars) {
  const words = String(line || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const rows = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxChars) {
      rows.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) rows.push(current);
  return rows.join('\n');
}

function wrapLikeAss(value, config, logicalWidth) {
  const clean = String(value || '').replace(/[{}]/g, '').replace(/\\/g, '／');
  const maxWidthPct = clamp(config.maxWidth || 80, 20, 100);
  const fontSize = clamp(config.fontSize || 46, 10, 160);
  const textWidth = Math.max(320, logicalWidth) * maxWidthPct / 100;
  const maxChars = Math.max(8, Math.min(90, Math.floor(textWidth / Math.max(6, fontSize * 0.56))));
  return clean.split(/\r?\n/).map(line => wrapWords(line, maxChars)).join('\n');
}

function scheduleSync() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    syncPreviewToLogicalVideo();
  });
}

function currentCueText(job, video) {
  const cue = cuesForJob(job).find(item => video.currentTime >= item.start && video.currentTime < item.end);
  return cue?.text || '';
}

function syncPreviewToLogicalVideo() {
  const canvas = document.getElementById('p3e-canvas');
  const video = document.getElementById('p3e-video');
  const sub = document.getElementById('p3e-sub');
  const cover = document.getElementById('p3e-cover');
  const job = selectedP3Job();
  if (!canvas || !video || !sub || !job) return;

  const logicalWidth = Number(video.videoWidth) || Number(job?.p3VideoInfo?.width) || 0;
  const logicalHeight = Number(video.videoHeight) || Number(job?.p3VideoInfo?.height) || 0;
  const rect = canvas.getBoundingClientRect();
  if (!(logicalWidth > 0) || !(logicalHeight > 0) || !(rect.width > 0) || !(rect.height > 0)) return;

  const scaleX = rect.width / logicalWidth;
  const scaleY = rect.height / logicalHeight;
  const scale = Math.min(scaleX, scaleY);
  const config = ensureP3Config(job);

  const fontSize = clamp(config.fontSize ?? numberValue('p3e-size', 46), 10, 160);
  const outline = clamp(config.outlineWidth ?? numberValue('p3e-outline-width', 0), 0, 12);
  const shadow = clamp(config.shadow ?? numberValue('p3e-shadow', 0), 0, 12);
  const padding = Math.max(0, Number(config.padding ?? numberValue('p3e-padding', 0)) || 0);
  const spacing = clamp(config.letterSpacing || 0, -2, 12);
  const maxWidthPct = clamp(config.maxWidth || numberValue('p3e-max-width', 80), 20, 100);
  const logicalTextWidth = logicalWidth * maxWidthPct / 100;

  sub.style.fontSize = `${fontSize * scale}px`;
  sub.style.padding = `${padding * scale}px`;
  sub.style.letterSpacing = `${spacing * scale}px`;
  sub.style.webkitTextStrokeWidth = `${outline * scale}px`;
  sub.style.textShadow = `0 ${shadow * scale}px ${Math.max(scale, shadow * 2 * scale)}px rgba(0,0,0,.85)`;
  sub.style.maxWidth = `${logicalTextWidth * scale}px`;
  sub.style.minWidth = '0px';
  sub.style.width = 'max-content';
  sub.style.whiteSpace = 'pre-line';
  sub.style.overflowWrap = 'normal';
  sub.style.wordBreak = 'normal';

  const cueText = currentCueText(job, video);
  if (cueText) {
    const wrapped = wrapLikeAss(cueText, config, logicalWidth);
    if (sub.textContent !== wrapped) {
      applyingText = true;
      sub.textContent = wrapped;
      applyingText = false;
    }
  }

  if (cover) {
    const coverWidthPct = clamp(config.coverWidth || 92, 10, 100);
    const coverHeight = Math.max(20, Math.min(logicalHeight, Math.round(Number(config.coverHeightPx) || 112)));
    cover.style.width = `${logicalWidth * coverWidthPct / 100 * scale}px`;
    cover.style.height = `${coverHeight * scale}px`;
  }

  sub.dataset.logicalVideoWidth = String(logicalWidth);
  sub.dataset.logicalVideoHeight = String(logicalHeight);
  sub.dataset.assPreviewScale = scale.toFixed(6);
}

function bindWhenReady() {
  const viewport = document.getElementById('p3e-viewport');
  const video = document.getElementById('p3e-video');
  const sub = document.getElementById('p3e-sub');
  if (!viewport || !video || !sub) {
    setTimeout(bindWhenReady, 100);
    return;
  }

  if (!resizeObserver) {
    resizeObserver = new ResizeObserver(scheduleSync);
    resizeObserver.observe(viewport);
  }
  if (!mutationObserver) {
    mutationObserver = new MutationObserver(() => {
      if (!applyingText) scheduleSync();
    });
    mutationObserver.observe(sub, { childList: true, characterData: true, subtree: true });
  }

  video.addEventListener('loadedmetadata', scheduleSync);
  video.addEventListener('timeupdate', scheduleSync);
  document.addEventListener('input', event => {
    if (event.target?.closest?.('#step-3-content')) scheduleSync();
  }, true);
  document.addEventListener('change', event => {
    if (event.target?.closest?.('#step-3-content')) scheduleSync();
  }, true);
  document.addEventListener('click', event => {
    if (event.target?.closest?.('#step-3-content')) scheduleSync();
  }, true);
  scheduleSync();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindWhenReady, { once: true });
else bindWhenReady();
