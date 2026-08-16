import { selectedP3Job, ensureP3Config } from './editor-store.js';
import { cuesForJob } from './subtitle-ass.js';

const STYLE_ID = 'p3e-subtitle-motion-style';
const KARAOKE_TAG_RE = /\\k(?:f|o)?\d+/i;
const MOTIONS = [
  ['none', 'Không', 'Đứng yên'],
  ['fade', 'Fade', 'Mờ dần vào'],
  ['pop', 'Pop', 'Nảy nhẹ'],
  ['slide_up', 'Slide ↑', 'Trượt lên'],
  ['slide_down', 'Slide ↓', 'Trượt xuống'],
  ['slide_left', 'Slide ←', 'Trượt trái'],
  ['slide_right', 'Slide →', 'Trượt phải'],
  ['zoom_in', 'Zoom +', 'Phóng vào'],
  ['zoom_out', 'Zoom −', 'Thu về'],
  ['blur_in', 'Blur', 'Mờ → rõ'],
  ['fade_up', 'Fade ↑', 'Fade + trượt'],
  ['pulse', 'Pulse', 'Nhịp nhấn mạnh'],
  ['typewriter', 'Typewriter', 'Gõ theo thời gian cue'],
  ['karaoke', 'Word Follow', 'Theo timing karaoke thật'],
];

let installed = false;
let raf = 0;

function el(id) { return document.getElementById(id); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = String(value ?? '');
  return node.innerHTML;
}
function originalKaraokeAss(job) {
  const source = String(job?.p3OriginalKaraokeAss || '');
  return KARAOKE_TAG_RE.test(source) ? source : '';
}
function hasRealKaraoke(job) {
  return Boolean(originalKaraokeAss(job) && !job?.p3CueEdited);
}
function activeMode(config) {
  if (config?.motionMode === 'typewriter') return 'typewriter';
  if (config?.motionMode === 'karaoke') return 'karaoke';
  return String(config?.effect || 'none');
}
function typewriterRevealFraction(speed) {
  const normalized = (clamp(speed || 120, 40, 260) - 40) / 220;
  return 1 - (normalized * 0.75);
}

function installStyle() {
  if (el(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#step-3-content .p3e-motion{margin-top:8px;display:grid;gap:8px}
#step-3-content .p3e-motion-title{display:flex;justify-content:space-between;gap:8px;align-items:center;color:#aebfd0;font-size:9px}
#step-3-content .p3e-motion-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
#step-3-content .p3e-motion-card{min-width:0;min-height:54px;padding:7px;border:1px solid #334d67;border-radius:7px;background:#102131;color:#c8d6e5;text-align:left;cursor:pointer;font:inherit}
#step-3-content .p3e-motion-card:hover:not(:disabled){border-color:#60a5fa;background:rgba(37,99,235,.13)}
#step-3-content .p3e-motion-card.active{border-color:#60a5fa;background:rgba(37,99,235,.2);box-shadow:inset 0 0 0 1px rgba(96,165,250,.2)}
#step-3-content .p3e-motion-card:disabled{opacity:.38;cursor:not-allowed}
#step-3-content .p3e-motion-card b,#step-3-content .p3e-motion-card small{display:block;white-space:normal}
#step-3-content .p3e-motion-card b{font-size:9px;color:#eef6ff}
#step-3-content .p3e-motion-card small{margin-top:3px;font-size:7px;color:#8094a9;line-height:1.25}
#step-3-content .p3e-motion-note{font-size:8px;line-height:1.4;color:#8ea3b8}
#step-3-content .p3e-motion-note.warn{color:#f6d69a}
#step-3-content .p3e-motion-speed{display:none;grid-template-columns:minmax(0,1fr) 54px;gap:7px;align-items:center}
#step-3-content .p3e-motion-speed.show{display:grid}
#step-3-content .p3e-motion-speed output{text-align:right;color:#9eb2c7;font-size:8px}
@media(max-width:1280px){#step-3-content .p3e-motion-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;
  document.head.appendChild(style);
}

function galleryMarkup() {
  return `<div id="p3e-motion" class="p3e-motion">
    <div class="p3e-motion-title"><strong>Kho hiệu ứng</strong><span>Preview = Final</span></div>
    <div class="p3e-motion-grid">${MOTIONS.map(([key,label,detail]) => `<button type="button" class="p3e-motion-card" data-p3-motion="${key}"><b>${escapeHtml(label)}</b><small>${escapeHtml(detail)}</small></button>`).join('')}</div>
    <label id="p3e-motion-speed" class="p3e-motion-speed">Tốc độ Typewriter<input id="p3e-typewriter-speed" type="range" min="40" max="260" step="10"><output id="p3e-typewriter-speed-out"></output></label>
    <div id="p3e-motion-note" class="p3e-motion-note"></div>
  </div>`;
}

function currentCue(job, timeSec) {
  return cuesForJob(job).find(cue => timeSec >= cue.start && timeSec < cue.end) || null;
}

function revealText(text, ratio, speed) {
  const chars = Array.from(String(text || ''));
  if (!chars.length) return '';
  const revealFraction = typewriterRevealFraction(speed);
  const adjusted = clamp(ratio / revealFraction, 0, 1);
  const count = Math.max(1, Math.min(chars.length, Math.ceil(chars.length * adjusted)));
  return chars.slice(0, count).join('');
}

function restoreFullCuePreview() {
  const job = selectedP3Job();
  const video = el('p3e-video');
  const sub = el('p3e-sub');
  if (!job || !video || !sub || sub.classList.contains('placeholder')) return;
  const cue = currentCue(job, Number(video.currentTime) || 0);
  if (cue) sub.textContent = cue.text;
}

function syncTypewriterPreview() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(() => {
    const job = selectedP3Job();
    const video = el('p3e-video');
    const sub = el('p3e-sub');
    if (!job || !video || !sub || sub.classList.contains('placeholder')) return;
    const config = ensureP3Config(job);
    if (config.motionMode !== 'typewriter') return;
    const cue = currentCue(job, Number(video.currentTime) || 0);
    if (!cue) return;
    const ratio = clamp(((Number(video.currentTime) || 0) - cue.start) / Math.max(.01, cue.end - cue.start), 0, 1);
    sub.textContent = revealText(cue.text, ratio, config.typewriterSpeed || 120);
  });
}

function replayExistingEffect() {
  const select = el('p3e-effect');
  if (!select) return;
  select.dispatchEvent(new Event('input', { bubbles: true }));
}

function selectMotion(mode) {
  const job = selectedP3Job();
  if (!job) return;
  const config = ensureP3Config(job);
  const previousMode = config.motionMode;
  const select = el('p3e-effect');
  if (mode === 'karaoke') {
    if (!hasRealKaraoke(job)) return;
    config.motionMode = 'karaoke';
    config.preserveKaraoke = true;
    config.glowEnabled = false;
    config.effect = 'none';
    if (select) select.value = 'none';
  } else if (mode === 'typewriter') {
    config.motionMode = 'typewriter';
    config.preserveKaraoke = false;
    config.effect = 'none';
    if (select) select.value = 'none';
  } else {
    config.motionMode = 'effect';
    config.effect = mode;
    if (select) select.value = mode;
    replayExistingEffect();
  }
  if (previousMode === 'typewriter' && config.motionMode !== 'typewriter') restoreFullCuePreview();
  syncMotionUi();
  syncTypewriterPreview();
}

function syncMotionUi() {
  const root = el('p3e-motion');
  const job = selectedP3Job();
  if (!root || !job) return;
  const config = ensureP3Config(job);
  const mode = activeMode(config);
  const karaokeAvailable = hasRealKaraoke(job);
  root.querySelectorAll('[data-p3-motion]').forEach(button => {
    button.classList.toggle('active', button.dataset.p3Motion === mode);
    if (button.dataset.p3Motion === 'karaoke') button.disabled = !karaokeAvailable;
  });
  const speedWrap = el('p3e-motion-speed');
  speedWrap?.classList.toggle('show', mode === 'typewriter');
  const speed = el('p3e-typewriter-speed');
  const out = el('p3e-typewriter-speed-out');
  if (speed && document.activeElement !== speed) speed.value = String(clamp(config.typewriterSpeed || 120, 40, 260));
  if (out) out.textContent = String(clamp(config.typewriterSpeed || 120, 40, 260));
  const note = el('p3e-motion-note');
  if (note) {
    if (!karaokeAvailable) {
      note.className = 'p3e-motion-note warn';
      note.textContent = job.p3CueEdited
        ? 'Word Follow đã khóa vì cue P3 đã được chỉnh; karaoke timing P1 không còn an toàn để giữ nguyên.'
        : 'Word Follow cần ASS karaoke gốc có timing \\k/\\kf/\\ko thật từ Pipeline 1. Job này chưa có artifact tương thích.';
    } else if (mode === 'karaoke') {
      note.className = 'p3e-motion-note';
      note.textContent = 'Word Follow dùng timing karaoke gốc thật. Glow và effect chuyển động khác được tắt để giữ timing chính xác.';
    } else if (mode === 'typewriter') {
      note.className = 'p3e-motion-note';
      note.textContent = 'Typewriter reveal theo thời gian cue và sẽ được chuyển thành event ASS thật khi render.';
    } else {
      note.className = 'p3e-motion-note';
      note.textContent = 'Chọn một preset để xem ngay trên Preview. Các effect cơ bản dùng cùng engine với final ASS.';
    }
  }
}

function installGallery() {
  const select = el('p3e-effect');
  if (!select) return false;
  const label = select.closest('label');
  if (!label) return false;
  select.style.display = 'none';
  if (!el('p3e-motion')) label.insertAdjacentHTML('afterend', galleryMarkup());
  const root = el('p3e-motion');
  if (!root.dataset.bound) {
    root.dataset.bound = 'true';
    root.addEventListener('click', event => {
      const button = event.target.closest?.('[data-p3-motion]');
      if (button && !button.disabled) selectMotion(button.dataset.p3Motion);
    });
    el('p3e-typewriter-speed')?.addEventListener('input', event => {
      const job = selectedP3Job();
      if (!job) return;
      ensureP3Config(job).typewriterSpeed = clamp(event.target.value, 40, 260);
      syncMotionUi();
      syncTypewriterPreview();
    });
  }
  syncMotionUi();
  return true;
}

function bindPreviewClock() {
  const video = el('p3e-video');
  if (!video || video.dataset.p3MotionBound) return;
  video.dataset.p3MotionBound = 'true';
  ['timeupdate', 'seeking', 'seeked', 'play'].forEach(type => video.addEventListener(type, syncTypewriterPreview));
}

function installWhenReady(attempt = 0) {
  installStyle();
  const ready = installGallery();
  bindPreviewClock();
  if (ready) return;
  if (attempt < 80) setTimeout(() => installWhenReady(attempt + 1), 100);
}

function assTimeToSeconds(value) {
  const match = String(value || '').trim().match(/^(\d+):(\d+):(\d+)[.](\d+)$/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(`0.${match[4]}`);
}
function secondsToAssTime(value) {
  const safe = Math.max(0, Number(value) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = Math.floor(safe % 60);
  const centis = Math.floor((safe - Math.floor(safe)) * 100);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}
function splitDialogue(line) {
  const match = String(line).match(/^Dialogue:\s*([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),([^,]*),(.*)$/i);
  if (!match) return null;
  return { layer: match[1], start: match[2], end: match[3], style: match[4], name: match[5], ml: match[6], mr: match[7], mv: match[8], effect: match[9], text: match[10] };
}
function dialogueLine(item, start, end, text) {
  return `Dialogue: ${item.layer},${start},${end},${item.style},${item.name},${item.ml},${item.mr},${item.mv},${item.effect},${text}`;
}
function textTokens(value) {
  const text = String(value || '');
  const prefixMatch = text.match(/^(\{[^}]*\})/);
  const prefix = prefixMatch ? prefixMatch[1] : '';
  const body = prefix ? text.slice(prefix.length) : text;
  const tokens = body.match(/\\N|./gu) || [];
  return { prefix, tokens };
}

export function applyTypewriterToAss(sourceAss, config = {}) {
  if (config.motionMode !== 'typewriter') return String(sourceAss || '');
  const lines = String(sourceAss || '').split(/\r?\n/);
  const output = [];
  for (const line of lines) {
    const item = splitDialogue(line);
    if (!item || !['P3', 'Glow'].includes(item.style)) {
      output.push(line);
      continue;
    }
    const start = assTimeToSeconds(item.start), end = assTimeToSeconds(item.end);
    const { prefix, tokens } = textTokens(item.text);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || tokens.length < 2) {
      output.push(line);
      continue;
    }
    const maxSteps = Math.min(tokens.length, 72);
    const stepSize = Math.max(1, Math.ceil(tokens.length / maxSteps));
    const steps = Math.ceil(tokens.length / stepSize);
    const revealDuration = (end - start) * typewriterRevealFraction(config.typewriterSpeed || 120);
    for (let index = 1; index <= steps; index += 1) {
      const tokenCount = Math.min(tokens.length, index * stepSize);
      const stepStart = start + ((index - 1) / steps) * revealDuration;
      const stepEnd = index === steps ? end : start + (index / steps) * revealDuration;
      output.push(dialogueLine(item, secondsToAssTime(stepStart), secondsToAssTime(stepEnd), `${prefix}${tokens.slice(0, tokenCount).join('')}`));
    }
  }
  return output.join('\n');
}

export function motionRenderConfig(job, config, timingChanged = false) {
  if (!config) return config;
  if (config.motionMode === 'karaoke') {
    if (!hasRealKaraoke(job) || timingChanged) return { ...config, motionMode: 'effect', preserveKaraoke: false, effect: 'none' };
    return { ...config, preserveKaraoke: true, glowEnabled: false, effect: 'none' };
  }
  if (config.motionMode === 'typewriter') return { ...config, preserveKaraoke: false, effect: 'none' };
  return config;
}

export function installP3SubtitleMotion() {
  if (installed) return;
  installed = true;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => installWhenReady(), { once: true });
  else installWhenReady();
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-job]')) requestAnimationFrame(() => { restoreFullCuePreview(); syncMotionUi(); syncTypewriterPreview(); });
  }, true);
}

installP3SubtitleMotion();
