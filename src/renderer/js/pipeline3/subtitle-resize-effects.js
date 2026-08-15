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
const FONT_GROUPS = [
  ['Việt / hệ thống', ['Segoe UI', 'Arial', 'Tahoma', 'Verdana', 'Trebuchet MS', 'Calibri', 'Aptos', 'Nirmala UI']],
  ['Display', ['Arial Black', 'Impact']],
  ['Serif', ['Georgia', 'Times New Roman', 'Cambria', 'Constantia']],
  ['Mono', ['Consolas', 'Courier New']],
  ['Phổ biến nếu đã cài', ['Roboto', 'Inter', 'Be Vietnam Pro', 'Montserrat', 'Poppins', 'Oswald']],
];
const TYPO_STYLES = {
  clean: { label: 'Clean UI', fontFamily: 'Segoe UI', fontSize: 42, bold: true, italic: false, outlineWidth: 2, shadow: 1, textColor: '#ffffff', bgEnabled: false },
  heavy: { label: 'Heavy Caption', fontFamily: 'Arial Black', fontSize: 48, bold: true, italic: false, outlineWidth: 4, shadow: 2, textColor: '#ffffff', bgEnabled: false },
  impact: { label: 'Impact', fontFamily: 'Impact', fontSize: 50, bold: false, italic: false, outlineWidth: 3, shadow: 2, textColor: '#ffffff', bgEnabled: false },
  serif: { label: 'Serif Guide', fontFamily: 'Georgia', fontSize: 44, bold: true, italic: false, outlineWidth: 2, shadow: 1, textColor: '#fff7ed', bgEnabled: true, bgColor: '#111827', bgOpacity: 54 },
  mono: { label: 'Mono Tech', fontFamily: 'Consolas', fontSize: 40, bold: true, italic: false, outlineWidth: 2, shadow: 1, textColor: '#dbeafe', bgEnabled: true, bgColor: '#07111f', bgOpacity: 62 },
  soft: { label: 'Soft Tutorial', fontFamily: 'Be Vietnam Pro', fontSize: 43, bold: true, italic: false, outlineWidth: 2, shadow: 1, textColor: '#ffffff', bgEnabled: true, bgColor: '#0f172a', bgOpacity: 46 },
};
const RESIZE_INPUT_IDS = new Set(['p3e-max-width', 'p3e-x', 'p3e-y']);
const TYPO_SYNC_IDS = new Set(['p3e-font', 'p3e-size', 'p3e-bold', 'p3e-italic', 'p3e-color', 'p3e-outline-width', 'p3e-shadow', 'p3e-bg-enabled', 'p3e-bg-color', 'p3e-bg-opacity']);

let installed = false;
let observer = null;
let activePointerId = null;
let activeHandle = null;

function el(id) { return document.getElementById(id); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = String(value ?? '');
  return node.innerHTML;
}

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
#step-3-content .p3e-typography-tools{margin-top:10px;padding-top:10px;border-top:1px solid rgba(100,116,139,.22)}
#step-3-content .p3e-typography-tools>strong{display:block;margin-bottom:7px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--text-dim,#94a3b8)}
#step-3-content .p3e-typo-chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-bottom:8px}
#step-3-content .p3e-typo-chip{min-width:0;padding:7px 8px;border:1px solid var(--border,#24394d);border-radius:7px;background:rgba(15,31,46,.65);color:var(--text,#e5edf5);font-size:11px;cursor:pointer;text-align:left}
#step-3-content .p3e-typo-chip:hover{border-color:var(--accent,#3b82f6);background:rgba(30,64,100,.55)}
#step-3-content .p3e-custom-font-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;margin-bottom:8px}
#step-3-content .p3e-font-sample{min-height:56px;padding:9px 10px;border:1px solid var(--border,#24394d);border-radius:7px;background:rgba(5,15,25,.55);overflow:hidden}
#step-3-content .p3e-font-sample small{display:block;margin-bottom:5px;color:var(--text-dim,#94a3b8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#step-3-content .p3e-font-sample span{display:block;font-size:22px;line-height:1.15;color:var(--text,#f8fafc);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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

function rebuildFontOptions(select, activeFont = '') {
  if (!select) return;
  const current = String(activeFont || select.value || 'Arial').trim() || 'Arial';
  select.innerHTML = '';
  const known = new Set();
  FONT_GROUPS.forEach(([label, fonts]) => {
    const group = document.createElement('optgroup');
    group.label = label;
    fonts.forEach(font => {
      if (known.has(font)) return;
      known.add(font);
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      group.appendChild(option);
    });
    select.appendChild(group);
  });
  if (!known.has(current)) {
    const custom = document.createElement('optgroup');
    custom.label = 'Font tùy chỉnh';
    const option = document.createElement('option');
    option.value = current;
    option.textContent = current;
    custom.appendChild(option);
    select.appendChild(custom);
  }
  select.value = current;
}

function dispatchInput(node) {
  node?.dispatchEvent(new Event('input', { bubbles: true }));
}

function setExistingControl(id, value, type = 'value') {
  const node = el(id);
  if (!node || value === undefined) return;
  if (type === 'checked') node.checked = Boolean(value);
  else node.value = String(value);
  dispatchInput(node);
}

function applyTypographyStyle(key) {
  const style = TYPO_STYLES[key];
  if (!style) return;
  setExistingControl('p3e-font', style.fontFamily);
  setExistingControl('p3e-size', style.fontSize);
  setExistingControl('p3e-bold', style.bold, 'checked');
  setExistingControl('p3e-italic', style.italic, 'checked');
  setExistingControl('p3e-color', style.textColor);
  setExistingControl('p3e-outline-width', style.outlineWidth);
  setExistingControl('p3e-shadow', style.shadow);
  setExistingControl('p3e-bg-enabled', style.bgEnabled, 'checked');
  if (style.bgColor) setExistingControl('p3e-bg-color', style.bgColor);
  if (style.bgOpacity !== undefined) setExistingControl('p3e-bg-opacity', style.bgOpacity);
  requestAnimationFrame(syncTypographyUi);
}

function syncTypographyUi() {
  const job = selectedP3Job();
  const select = el('p3e-font');
  const customInput = el('p3e-custom-font');
  const sample = el('p3e-font-sample-text');
  const familyLabel = el('p3e-font-family-label');
  const sub = el('p3e-sub');
  if (!job || !select) return;
  const config = ensureP3Config(job);
  const family = String(config.fontFamily || select.value || 'Arial').trim() || 'Arial';
  if (![...select.options].some(option => option.value === family)) rebuildFontOptions(select, family);
  if (select.value !== family) select.value = family;
  if (customInput && document.activeElement !== customInput) customInput.value = family;
  if (familyLabel) familyLabel.textContent = family;
  if (sample) {
    sample.style.fontFamily = `"${family.replace(/"/g, '')}", sans-serif`;
    sample.style.fontWeight = config.bold ? '700' : '400';
    sample.style.fontStyle = config.italic ? 'italic' : 'normal';
  }
  if (sub) sub.style.fontFamily = `"${family.replace(/"/g, '')}", sans-serif`;
}

function installTypographyUi() {
  const select = el('p3e-font');
  if (!select) return false;
  const job = selectedP3Job();
  const config = job ? ensureP3Config(job) : null;
  if (!select.dataset.p3TypographyOptions) {
    rebuildFontOptions(select, config?.fontFamily || select.value);
    select.dataset.p3TypographyOptions = 'true';
  }

  const foldBody = select.closest('.p3e-fold-body');
  if (!foldBody) return false;
  let tools = el('p3e-typography-tools');
  if (!tools) {
    tools = document.createElement('div');
    tools.id = 'p3e-typography-tools';
    tools.className = 'p3e-typography-tools';
    tools.innerHTML = `<strong>Kiểu chữ nhanh</strong><div class="p3e-typo-chips">${Object.entries(TYPO_STYLES).map(([key, style]) => `<button type="button" class="p3e-typo-chip" data-p3-typo="${key}">${escapeHtml(style.label)}</button>`).join('')}</div><div class="p3e-custom-font-row"><input id="p3e-custom-font" class="p3e-input" type="text" placeholder="Tên font đã cài trên máy"><button id="p3e-apply-custom-font" class="p3e-btn" type="button">Áp dụng</button></div><div class="p3e-font-sample"><small>Font hiện tại: <b id="p3e-font-family-label">—</b></small><span id="p3e-font-sample-text">Aa ĂÂĐ ÊÔƠƯ 0123</span></div>`;
    const fontGrid = select.closest('.p3e-grid2');
    if (fontGrid?.nextSibling) fontGrid.parentNode.insertBefore(tools, fontGrid.nextSibling);
    else foldBody.prepend(tools);
  }

  if (!tools.dataset.p3TypographyBound) {
    tools.dataset.p3TypographyBound = 'true';
    tools.addEventListener('click', event => {
      const chip = event.target.closest('[data-p3-typo]');
      if (chip) {
        applyTypographyStyle(chip.dataset.p3Typo);
        return;
      }
      if (event.target.closest('#p3e-apply-custom-font')) {
        const input = el('p3e-custom-font');
        const value = String(input?.value || '').trim();
        if (!value) return;
        rebuildFontOptions(select, value);
        select.value = value;
        dispatchInput(select);
        requestAnimationFrame(syncTypographyUi);
      }
    });
    tools.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.target?.id === 'p3e-custom-font') {
        event.preventDefault();
        el('p3e-apply-custom-font')?.click();
      }
    });
  }
  syncTypographyUi();
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
  if (!document.documentElement.dataset.p3SubtitleEnhancerBound) {
    document.documentElement.dataset.p3SubtitleEnhancerBound = 'true';
    document.addEventListener('input', event => {
      if (RESIZE_INPUT_IDS.has(event.target?.id)) requestAnimationFrame(syncResizeUi);
      if (TYPO_SYNC_IDS.has(event.target?.id)) requestAnimationFrame(syncTypographyUi);
    }, true);
    document.addEventListener('click', event => {
      if (event.target?.closest?.('[data-job], [data-anchor], .p3e-preset')) {
        requestAnimationFrame(() => { syncResizeUi(); syncTypographyUi(); });
      }
    }, true);
    window.addEventListener('resize', () => requestAnimationFrame(syncResizeUi));
  }
  return true;
}

function installWhenReady(attempt = 0) {
  installStyle();
  const ready = addEffectOptions() && installTypographyUi() && ensureHandles() && bindObservers();
  if (ready) {
    syncResizeUi();
    syncTypographyUi();
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
