import { selectedP3Job, ensureP3Config } from './editor-store.js';

const STYLE_ID = 'p3e-sub-resize-effects-style';
const EFFECTS = [
  ['slide_up', 'Trượt lên'],
  ['slide_down', 'Trượt xuống'],
  ['slide_left', 'Trượt trái'],
  ['slide_right', 'Trượt phải'],
  ['zoom_in', 'Zoom vào'],
  ['zoom_out', 'Zoom ra'],
  ['pulse', 'Nhịp Pulse'],
  ['blur_in', 'Mờ → rõ'],
  ['fade_up', 'Fade + trượt lên'],
];
const RESIZE_INPUT_IDS = new Set(['p3e-max-width', 'p3e-x', 'p3e-y']);

let installed = false;
let observer = null;
let activePointerId = null;
let activeHandle = null;

function el(id) { return document.getElementById(id); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#step-3-content .p3e-sub-resize-handle{position:absolute;z-index:8;width:12px;height:34px;border:1px solid rgba(147,197,253,.95);border-radius:5px;background:rgba(15,43,67,.94);box-shadow:0 0 0 2px rgba(37,99,235,.14);cursor:ew-resize;transform:translate(-50%,-50%);touch-action:none;display:none}
#step-3-content .p3e-sub-resize-handle.show{display:block}
#step-3-content .p3e-sub-resize-handle::after{content:'';position:absolute;left:4px;top:8px;width:2px;height:16px;border-left:1px solid #bfdbfe;border-right:1px solid #bfdbfe;opacity:.9}
#step-3-content .p3e-sub-resize-handle.dragging{background:#1d4ed8;border-color:#dbeafe}
#step-3-content .p3e-sub{box-sizing:border-box}
@keyframes p3eFxFade{0%{opacity:0}100%{opacity:1}}
@keyframes p3eFxPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.82)}70%{opacity:1;transform:translate(-50%,-50%) scale(1.06)}100%{transform:translate(-50%,-50%) scale(1)}}
@keyframes p3eFxSlideUp{0%{opacity:0;transform:translate(-50%,calc(-50% + 30px))}100%{opacity:1;transform:translate(-50%,-50%)}}
@keyframes p3eFxSlideDown{0%{opacity:0;transform:translate(-50%,calc(-50% - 30px))}100%{opacity:1;transform:translate(-50%,-50%)}}
@keyframes p3eFxSlideLeft{0%{opacity:0;transform:translate(calc(-50% + 40px),-50%)}100%{opacity:1;transform:translate(-50%,-50%)}}
@keyframes p3eFxSlideRight{0%{opacity:0;transform:translate(calc(-50% - 40px),-50%)}100%{opacity:1;transform:translate(-50%,-50%)}}
@keyframes p3eFxZoomIn{0%{opacity:0;transform:translate(-50%,-50%) scale(.7)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes p3eFxZoomOut{0%{opacity:0;transform:translate(-50%,-50%) scale(1.28)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes p3eFxPulse{0%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.1)}100%{transform:translate(-50%,-50%) scale(1)}}
@keyframes p3eFxBlurIn{0%{opacity:.2;filter:blur(7px)}100%{opacity:1;filter:blur(0)}}
@keyframes p3eFxFadeUp{0%{opacity:0;transform:translate(-50%,calc(-50% + 24px))}100%{opacity:1;transform:translate(-50%,-50%)}}
`;
  document.head.appendChild(style);
}

function effectAnimation(effect, duration) {
  const name = {
    fade: 'p3eFxFade', pop: 'p3eFxPop', slide_up: 'p3eFxSlideUp', slide_down: 'p3eFxSlideDown',
    slide_left: 'p3eFxSlideLeft', slide_right: 'p3eFxSlideRight', zoom_in: 'p3eFxZoomIn', zoom_out: 'p3eFxZoomOut',
    pulse: 'p3eFxPulse', blur_in: 'p3eFxBlurIn', fade_up: 'p3eFxFadeUp',
  }[effect];
  return name ? `${name} ${clamp(duration, 80, 1200)}ms ease-out both` : '';
}

function replayEffect() {
  const job = selectedP3Job();
  const sub = el('p3e-sub');
  if (!job || !sub || sub.classList.contains('placeholder')) return;
  const config = ensureP3Config(job);
  const animation = effectAnimation(config.effect, config.effectMs || 180);
  sub.style.animation = 'none';
  void sub.offsetWidth;
  sub.style.animation = animation || 'none';
}

function addEffectOptions() {
  const select = el('p3e-effect');
  if (!select) return false;
  for (const [value, label] of EFFECTS) {
    if (select.querySelector(`option[value="${value}"]`)) continue;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }
  if (!select.dataset.p3FxBound) {
    select.dataset.p3FxBound = 'true';
    select.addEventListener('input', () => requestAnimationFrame(replayEffect));
  }
  return true;
}

function ensureHandles() {
  const canvas = el('p3e-canvas');
  if (!canvas) return false;
  for (const side of ['left', 'right']) {
    if (canvas.querySelector(`.p3e-sub-resize-handle[data-side="${side}"]`)) continue;
    const handle = document.createElement('div');
    handle.className = 'p3e-sub-resize-handle';
    handle.dataset.side = side;
    handle.title = side === 'left' ? 'Kéo để chỉnh cạnh trái khung chữ' : 'Kéo để chỉnh cạnh phải khung chữ';
    handle.addEventListener('pointerdown', onResizeStart);
    handle.addEventListener('pointermove', onResizeMove);
    handle.addEventListener('pointerup', onResizeEnd);
    handle.addEventListener('pointercancel', onResizeEnd);
    canvas.appendChild(handle);
  }
  return true;
}

function syncResizeUi() {
  const job = selectedP3Job();
  const sub = el('p3e-sub');
  const canvas = el('p3e-canvas');
  if (!job || !sub || !canvas) return;
  const config = ensureP3Config(job);
  const width = clamp(config.maxWidth || 80, 20, 100);
  const x = clamp(config.x ?? 50, 0, 100);
  const visible = !sub.classList.contains('placeholder');
  const widthCss = `${width}%`;
  if (sub.style.width !== widthCss) sub.style.width = widthCss;
  if (sub.style.maxWidth !== widthCss) sub.style.maxWidth = widthCss;

  const half = width / 2;
  const positions = { left: x - half, right: x + half };
  canvas.querySelectorAll('.p3e-sub-resize-handle').forEach(handle => {
    const side = handle.dataset.side;
    handle.style.left = `${clamp(positions[side], 0, 100)}%`;
    handle.style.top = `${clamp(config.y ?? 82, 0, 100)}%`;
    handle.classList.toggle('show', visible);
  });
}

function updateWidthFromPointer(event) {
  const job = selectedP3Job();
  const canvas = el('p3e-canvas');
  const slider = el('p3e-max-width');
  if (!job || !canvas || !slider) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0) return;
  const config = ensureP3Config(job);
  const pointerPct = clamp((event.clientX - rect.left) / rect.width * 100, 0, 100);
  const center = clamp(config.x ?? 50, 0, 100);
  const maxInsideCanvas = Math.max(20, 2 * Math.min(center, 100 - center));
  const width = clamp(Math.abs(pointerPct - center) * 2, 20, Math.min(100, maxInsideCanvas));
  config.maxWidth = Number(width.toFixed(1));
  slider.value = String(config.maxWidth);
  slider.dispatchEvent(new Event('input', { bubbles: true }));
  syncResizeUi();
}

function onResizeStart(event) {
  event.preventDefault();
  event.stopPropagation();
  activePointerId = event.pointerId;
  activeHandle = event.currentTarget;
  activeHandle.setPointerCapture(event.pointerId);
  activeHandle.classList.add('dragging');
}
function onResizeMove(event) { if (event.pointerId === activePointerId && event.currentTarget === activeHandle) updateWidthFromPointer(event); }
function onResizeEnd(event) {
  if (event.pointerId !== activePointerId) return;
  try { activeHandle?.releasePointerCapture(event.pointerId); } catch {}
  activeHandle?.classList.remove('dragging');
  activePointerId = null;
  activeHandle = null;
}

function bindObservers() {
  const sub = el('p3e-sub');
  if (!sub) return false;
  observer?.disconnect();
  observer = new MutationObserver(mutations => {
    syncResizeUi();
    if (mutations.some(item => item.type === 'childList' || item.type === 'characterData')) replayEffect();
  });
  observer.observe(sub, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  document.addEventListener('input', event => {
    if (RESIZE_INPUT_IDS.has(event.target?.id)) requestAnimationFrame(syncResizeUi);
  }, true);
  document.addEventListener('click', event => {
    if (event.target?.closest?.('[data-job], [data-anchor], .p3e-preset')) requestAnimationFrame(syncResizeUi);
  }, true);
  window.addEventListener('resize', () => requestAnimationFrame(syncResizeUi));
  return true;
}

function installWhenReady(attempt = 0) {
  installStyle();
  const ready = addEffectOptions() && ensureHandles() && bindObservers();
  if (ready) {
    syncResizeUi();
    replayEffect();
    return;
  }
  if (attempt < 80) setTimeout(() => installWhenReady(attempt + 1), 100);
}

export function installP3SubtitleResizeEffects() {
  if (installed) return;
  installed = true;
  installWhenReady();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installP3SubtitleResizeEffects, { once: true });
else installP3SubtitleResizeEffects();
