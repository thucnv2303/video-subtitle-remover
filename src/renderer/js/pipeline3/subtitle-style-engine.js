import { selectedP3Job, ensureP3Config } from './editor-store.js';

const STYLE_ID = 'p3e-subtitle-style-engine-css';
const CATEGORIES = [
  ['all', 'Tất cả'], ['basic', 'Basic'], ['social', 'Social'], ['tutorial', 'Tutorial'],
  ['karaoke', 'Karaoke'], ['highlight', 'Highlight'], ['glow', 'Glow'], ['box', 'Box'], ['cover', 'Cover'],
];

const base = {
  fontFamily: 'Arial', fontSize: 44, bold: true, italic: false, underline: false,
  textColor: '#ffffff', textOpacity: 100, outlineColor: '#000000', outlineWidth: 3, shadow: 2,
  letterSpacing: 0, glowEnabled: false, glowColor: '#3b82f6', glowBlur: 4, glowOutline: 3,
  bgEnabled: false, bgColor: '#000000', bgOpacity: 55, padding: 10, maxWidth: 82,
  effect: 'none', effectMs: 180, preserveKaraoke: false,
  coverEnabled: false, coverColor: '#0a0a0a', coverOpacity: 76, coverWidth: 92, coverHeightPx: 112,
};

function p(id, category, label, patch) { return { id, category, label, config: { ...base, ...patch } }; }

export const P3_SUBTITLE_STYLES = [
  p('basic-clean-white','basic','Clean White',{fontFamily:'Segoe UI',fontSize:42,outlineWidth:2,shadow:1}),
  p('basic-clean-dark','basic','Clean Dark',{fontFamily:'Segoe UI',fontSize:42,textColor:'#e5e7eb',outlineColor:'#111827',outlineWidth:2,bgEnabled:true,bgColor:'#0f172a',bgOpacity:42}),
  p('basic-minimal','basic','Minimal',{fontFamily:'Arial',fontSize:38,bold:false,outlineWidth:1,shadow:1}),
  p('basic-bold-outline','basic','Bold Outline',{fontFamily:'Arial Black',fontSize:48,outlineWidth:5,shadow:2}),

  p('social-youtube-bold','social','YouTube Bold',{fontFamily:'Arial Black',fontSize:48,outlineWidth:4,bgEnabled:true,bgOpacity:58}),
  p('social-tiktok-pop','social','TikTok Pop',{fontFamily:'Arial Black',fontSize:50,textColor:'#ffffff',outlineColor:'#111827',outlineWidth:5,effect:'pop',effectMs:220}),
  p('social-shorts-blue','social','Shorts Blue',{fontFamily:'Montserrat',fontSize:46,textColor:'#dbeafe',outlineColor:'#1d4ed8',outlineWidth:4,shadow:2,effect:'fade_up',effectMs:220}),
  p('social-creator-yellow','social','Creator Yellow',{fontFamily:'Poppins',fontSize:46,textColor:'#fde047',outlineWidth:4,shadow:2,effect:'zoom_in',effectMs:180}),

  p('tutorial-clean','tutorial','Tutorial Clean',{fontFamily:'Be Vietnam Pro',fontSize:42,outlineWidth:2,shadow:1}),
  p('tutorial-box','tutorial','Tutorial Box',{fontFamily:'Be Vietnam Pro',fontSize:42,bgEnabled:true,bgColor:'#0f172a',bgOpacity:58,outlineWidth:1,padding:12}),
  p('tutorial-tech-blue','tutorial','Tech Blue',{fontFamily:'Consolas',fontSize:40,textColor:'#dbeafe',outlineColor:'#1e3a8a',outlineWidth:3,bgEnabled:true,bgColor:'#07111f',bgOpacity:62}),
  p('tutorial-step-guide','tutorial','Step Guide',{fontFamily:'Segoe UI',fontSize:41,textColor:'#ffffff',outlineWidth:2,bgEnabled:true,bgColor:'#1e293b',bgOpacity:54,effect:'slide_up',effectMs:180}),

  p('karaoke-gold','karaoke','Karaoke Gold',{fontFamily:'Arial',fontSize:44,textColor:'#facc15',outlineColor:'#111827',outlineWidth:3,preserveKaraoke:true}),
  p('karaoke-cyan','karaoke','Karaoke Cyan',{fontFamily:'Arial',fontSize:44,textColor:'#22d3ee',outlineColor:'#083344',outlineWidth:3,preserveKaraoke:true}),
  p('karaoke-pink','karaoke','Karaoke Pink',{fontFamily:'Arial',fontSize:44,textColor:'#f9a8d4',outlineColor:'#500724',outlineWidth:3,preserveKaraoke:true}),
  p('karaoke-lime','karaoke','Karaoke Lime',{fontFamily:'Arial',fontSize:44,textColor:'#bef264',outlineColor:'#1a2e05',outlineWidth:3,preserveKaraoke:true}),

  p('highlight-yellow','highlight','Highlight Yellow',{fontFamily:'Arial Black',fontSize:46,textColor:'#111827',outlineWidth:0,bgEnabled:true,bgColor:'#fde047',bgOpacity:100,padding:11}),
  p('highlight-cyan','highlight','Highlight Cyan',{fontFamily:'Arial Black',fontSize:46,textColor:'#082f49',outlineWidth:0,bgEnabled:true,bgColor:'#67e8f9',bgOpacity:100,padding:11}),
  p('highlight-pink','highlight','Highlight Pink',{fontFamily:'Arial Black',fontSize:46,textColor:'#500724',outlineWidth:0,bgEnabled:true,bgColor:'#f9a8d4',bgOpacity:100,padding:11}),
  p('highlight-contrast','highlight','High Contrast',{fontFamily:'Arial Black',fontSize:47,textColor:'#ffffff',outlineColor:'#000000',outlineWidth:6,shadow:3}),

  p('glow-neon-blue','glow','Neon Blue',{fontFamily:'Arial Black',fontSize:47,textColor:'#eff6ff',outlineColor:'#1d4ed8',outlineWidth:2,glowEnabled:true,glowColor:'#3b82f6',glowBlur:6,glowOutline:4,preserveKaraoke:false}),
  p('glow-neon-pink','glow','Neon Pink',{fontFamily:'Arial Black',fontSize:47,textColor:'#fff1f2',outlineColor:'#be185d',outlineWidth:2,glowEnabled:true,glowColor:'#ec4899',glowBlur:6,glowOutline:4,preserveKaraoke:false}),
  p('glow-neon-lime','glow','Neon Lime',{fontFamily:'Arial Black',fontSize:47,textColor:'#f7fee7',outlineColor:'#3f6212',outlineWidth:2,glowEnabled:true,glowColor:'#84cc16',glowBlur:6,glowOutline:4,preserveKaraoke:false}),
  p('glow-electric-white','glow','Electric White',{fontFamily:'Arial Black',fontSize:48,textColor:'#ffffff',outlineColor:'#64748b',outlineWidth:2,glowEnabled:true,glowColor:'#e2e8f0',glowBlur:7,glowOutline:5,preserveKaraoke:false}),

  p('box-dark','box','Box Dark',{fontFamily:'Segoe UI',fontSize:43,bgEnabled:true,bgColor:'#020617',bgOpacity:78,outlineWidth:0,shadow:0,padding:12}),
  p('box-light','box','Box Light',{fontFamily:'Segoe UI',fontSize:43,textColor:'#111827',bgEnabled:true,bgColor:'#f8fafc',bgOpacity:92,outlineWidth:0,shadow:1,padding:12}),
  p('box-capsule-blue','box','Capsule Blue',{fontFamily:'Poppins',fontSize:42,bgEnabled:true,bgColor:'#1d4ed8',bgOpacity:92,outlineWidth:0,padding:13}),
  p('box-capsule-red','box','Capsule Red',{fontFamily:'Poppins',fontSize:42,bgEnabled:true,bgColor:'#b91c1c',bgOpacity:92,outlineWidth:0,padding:13}),

  p('cover-dark','cover','Cover Dark',{fontFamily:'Arial Black',fontSize:45,coverEnabled:true,coverColor:'#020617',coverOpacity:88,coverWidth:96,coverHeightPx:120,outlineWidth:2}),
  p('cover-soft','cover','Cover Soft',{fontFamily:'Segoe UI',fontSize:44,coverEnabled:true,coverColor:'#111827',coverOpacity:68,coverWidth:94,coverHeightPx:116,outlineWidth:2}),
  p('cover-blue','cover','Cover Blue',{fontFamily:'Arial Black',fontSize:45,coverEnabled:true,coverColor:'#0f2f57',coverOpacity:84,coverWidth:94,coverHeightPx:118,outlineWidth:2}),
  p('cover-red','cover','Cover Red',{fontFamily:'Arial Black',fontSize:45,coverEnabled:true,coverColor:'#4c0519',coverOpacity:82,coverWidth:94,coverHeightPx:118,outlineWidth:2}),
];

let installed = false;
let activeCategory = 'all';
let observer = null;
let applyingStyle = false;

function el(id) { return document.getElementById(id); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function esc(value) { const n=document.createElement('div'); n.textContent=String(value??''); return n.innerHTML; }
function dispatchInput(node) { node?.dispatchEvent(new Event('input', { bubbles: true })); }

const CONTROL_MAP = {
  fontFamily:'p3e-font', fontSize:'p3e-size', bold:'p3e-bold', italic:'p3e-italic', textColor:'p3e-color',
  outlineColor:'p3e-outline', outlineWidth:'p3e-outline-width', shadow:'p3e-shadow', bgEnabled:'p3e-bg-enabled',
  bgColor:'p3e-bg-color', bgOpacity:'p3e-bg-opacity', padding:'p3e-padding', maxWidth:'p3e-max-width',
  effect:'p3e-effect', effectMs:'p3e-effect-ms', coverEnabled:'p3e-cover-enabled', coverColor:'p3e-cover-color',
  coverOpacity:'p3e-cover-opacity', coverWidth:'p3e-cover-width', coverHeightPx:'p3e-cover-height', preserveKaraoke:'p3e-preserve-karaoke',
};
const MANUAL_STYLE_CONTROL_IDS = new Set(Object.values(CONTROL_MAP));

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#step-3-content .p3e-presets{display:none!important}
#step-3-content .p3e-style-engine{margin:0 0 12px;padding:10px;border:1px solid var(--border,#24394d);border-radius:9px;background:rgba(7,20,32,.62)}
#step-3-content .p3e-style-engine-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
#step-3-content .p3e-style-engine-head strong{font-size:12px;color:var(--text,#e5edf5)}
#step-3-content .p3e-style-engine-head small{font-size:10px;color:var(--text-dim,#94a3b8)}
#step-3-content .p3e-style-cats{display:flex;gap:5px;overflow-x:auto;padding-bottom:7px;scrollbar-width:thin}
#step-3-content .p3e-style-cat{flex:0 0 auto;border:1px solid var(--border,#24394d);border-radius:999px;background:rgba(15,31,46,.7);color:var(--text-dim,#94a3b8);padding:5px 8px;font-size:10px;cursor:pointer}
#step-3-content .p3e-style-cat.active{border-color:#3b82f6;background:rgba(37,99,235,.2);color:#dbeafe}
#step-3-content .p3e-style-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;max-height:294px;overflow:auto;padding-right:2px}
#step-3-content .p3e-style-card{min-width:0;border:1px solid var(--border,#24394d);border-radius:8px;background:rgba(11,27,42,.78);padding:7px;cursor:pointer;text-align:left;color:var(--text,#e5edf5)}
#step-3-content .p3e-style-card:hover{border-color:#3b82f6;background:rgba(20,49,76,.75)}
#step-3-content .p3e-style-card.active{border-color:#60a5fa;box-shadow:0 0 0 1px rgba(96,165,250,.3) inset;background:rgba(30,64,100,.68)}
#step-3-content .p3e-style-card-preview{display:flex;align-items:center;justify-content:center;height:42px;border-radius:6px;background:#08131f;overflow:hidden;margin-bottom:5px}
#step-3-content .p3e-style-card-preview b{display:inline-block;max-width:95%;padding:3px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#step-3-content .p3e-style-card span{display:block;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#step-3-content .p3e-advanced-style{margin-top:10px;padding-top:9px;border-top:1px solid rgba(100,116,139,.22)}
#step-3-content .p3e-advanced-style>strong{display:block;margin-bottom:7px;font-size:11px;color:var(--text-dim,#94a3b8)}
#step-3-content .p3e-advanced-style-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}
#step-3-content .p3e-advanced-style label{font-size:10px;color:var(--text-dim,#94a3b8)}
#step-3-content .p3e-advanced-style input[type=number]{width:100%;margin-top:3px}
#step-3-content .p3e-glow-row{display:grid;grid-template-columns:auto 1fr;gap:7px;align-items:center;margin-top:7px}
`;
  document.head.appendChild(style);
}

function previewCss(config) {
  const bg = config.bgEnabled ? config.bgColor : 'transparent';
  const shadow = config.glowEnabled ? `0 0 ${Math.max(2, config.glowBlur)}px ${config.glowColor}` : `0 2px 3px rgba(0,0,0,.7)`;
  return `font-family:${config.fontFamily};font-size:${Math.max(12,config.fontSize*.32)}px;font-weight:${config.bold?800:500};font-style:${config.italic?'italic':'normal'};text-decoration:${config.underline?'underline':'none'};letter-spacing:${config.letterSpacing||0}px;color:${config.textColor};-webkit-text-stroke:${Math.min(2.4,config.outlineWidth*.45)}px ${config.outlineColor};text-shadow:${shadow};background:${bg};opacity:${clamp(config.textOpacity,20,100)/100}`;
}

function filteredStyles() { return activeCategory === 'all' ? P3_SUBTITLE_STYLES : P3_SUBTITLE_STYLES.filter(item => item.category === activeCategory); }

function renderCards() {
  const root = el('p3e-style-grid');
  const job = selectedP3Job();
  if (!root || !job) return;
  const config = ensureP3Config(job);
  root.innerHTML = filteredStyles().map(item => `<button class="p3e-style-card${config.stylePresetId===item.id?' active':''}" type="button" data-style-id="${item.id}"><div class="p3e-style-card-preview"><b style="${previewCss(item.config)}">Aa</b></div><span>${esc(item.label)}</span></button>`).join('');
}

function setControl(id, value) {
  const node = el(id);
  if (!node || value === undefined) return;
  if (node.type === 'checkbox') node.checked = Boolean(value);
  else node.value = String(value);
}

function syncExistingControls(config) { Object.entries(CONTROL_MAP).forEach(([key,id]) => setControl(id, config[key])); }
function refreshThroughEditor() { const node = el('p3e-font') || el('p3e-size'); if (node) dispatchInput(node); }

function applyStyle(id) {
  const item = P3_SUBTITLE_STYLES.find(style => style.id === id);
  const job = selectedP3Job();
  if (!item || !job) return;
  const config = ensureP3Config(job);
  applyingStyle = true;
  try {
    Object.assign(config, item.config, { stylePresetId: item.id });
    syncExistingControls(config);
    syncAdvancedControls(config);
    refreshThroughEditor();
  } finally {
    applyingStyle = false;
  }
  requestAnimationFrame(() => { syncPreviewDecorations(); renderCards(); });
}

function syncAdvancedControls(config) {
  const map = {
    'p3e-style-underline': ['underline','checked'], 'p3e-style-spacing':['letterSpacing','value'], 'p3e-style-opacity':['textOpacity','value'],
    'p3e-style-glow':['glowEnabled','checked'], 'p3e-style-glow-color':['glowColor','value'], 'p3e-style-glow-blur':['glowBlur','value'], 'p3e-style-glow-outline':['glowOutline','value'],
  };
  Object.entries(map).forEach(([id,[key,type]]) => { const node=el(id); if(!node)return; if(type==='checked')node.checked=Boolean(config[key]); else node.value=String(config[key]??''); });
}

function saveAdvancedControls() {
  const job = selectedP3Job();
  if (!job) return;
  const config = ensureP3Config(job);
  config.stylePresetId = 'custom';
  config.underline = Boolean(el('p3e-style-underline')?.checked);
  config.letterSpacing = clamp(el('p3e-style-spacing')?.value, -2, 12);
  config.textOpacity = clamp(el('p3e-style-opacity')?.value, 20, 100);
  config.glowEnabled = Boolean(el('p3e-style-glow')?.checked);
  config.glowColor = el('p3e-style-glow-color')?.value || '#3b82f6';
  config.glowBlur = clamp(el('p3e-style-glow-blur')?.value, 0, 8);
  config.glowOutline = clamp(el('p3e-style-glow-outline')?.value, 0, 8);
  refreshThroughEditor();
  requestAnimationFrame(() => { syncPreviewDecorations(); renderCards(); });
}

function syncPreviewDecorations() {
  const job = selectedP3Job();
  const sub = el('p3e-sub');
  const canvas = el('p3e-canvas');
  if (!job || !sub) return;
  const config = ensureP3Config(job);
  let fitScale = 1;
  try { fitScale = Number(JSON.parse(canvas?.dataset.fit || '{}').scale) || 1; } catch {}
  sub.style.textDecoration = config.underline ? 'underline' : 'none';
  sub.style.letterSpacing = `${(Number(config.letterSpacing)||0) * fitScale}px`;
  sub.style.color = hexToRgba(config.textColor, config.textOpacity);
  const drop = `0 ${Math.max(0,Number(config.shadow)||0)}px ${Math.max(1,(Number(config.shadow)||0)*2)}px rgba(0,0,0,.85)`;
  sub.style.textShadow = config.glowEnabled ? `${drop},0 0 ${Math.max(1,Number(config.glowBlur)||0)*2*fitScale}px ${config.glowColor}` : drop;
  syncAdvancedControls(config);
}

function hexToRgba(hex, opacity) {
  const h=String(hex||'#ffffff').replace('#','').padEnd(6,'0').slice(0,6);
  const r=parseInt(h.slice(0,2),16)||0,g=parseInt(h.slice(2,4),16)||0,b=parseInt(h.slice(4,6),16)||0;
  return `rgba(${r},${g},${b},${clamp(opacity,0,100)/100})`;
}

function installUi() {
  const font = el('p3e-font');
  if (!font) return false;
  const fold = font.closest('.p3e-fold-body');
  if (!fold) return false;

  if (!el('p3e-style-engine')) {
    const section = document.createElement('section');
    section.id = 'p3e-style-engine';
    section.className = 'p3e-style-engine';
    section.innerHTML = `<div class="p3e-style-engine-head"><strong>Thư viện kiểu subtitle</strong><small>${P3_SUBTITLE_STYLES.length} preset</small></div><div class="p3e-style-cats">${CATEGORIES.map(([id,label])=>`<button type="button" class="p3e-style-cat${id==='all'?' active':''}" data-style-category="${id}">${label}</button>`).join('')}</div><div id="p3e-style-grid" class="p3e-style-grid"></div>`;
    fold.prepend(section);
    section.addEventListener('click', event => {
      const cat = event.target.closest('[data-style-category]');
      if (cat) {
        activeCategory = cat.dataset.styleCategory;
        section.querySelectorAll('[data-style-category]').forEach(node => node.classList.toggle('active', node.dataset.styleCategory === activeCategory));
        renderCards();
        return;
      }
      const card = event.target.closest('[data-style-id]');
      if (card) applyStyle(card.dataset.styleId);
    });
  }

  if (!el('p3e-advanced-style')) {
    const advanced = document.createElement('div');
    advanced.id = 'p3e-advanced-style';
    advanced.className = 'p3e-advanced-style';
    advanced.innerHTML = `<strong>Tinh chỉnh nâng cao</strong><div class="p3e-advanced-style-grid"><label><input id="p3e-style-underline" type="checkbox"> Gạch chân</label><label>Letter spacing<input id="p3e-style-spacing" class="p3e-input" type="number" min="-2" max="12" step="0.5"></label><label>Opacity chữ (%)<input id="p3e-style-opacity" class="p3e-input" type="number" min="20" max="100" step="1"></label><label><input id="p3e-style-glow" type="checkbox"> Glow</label></div><div class="p3e-glow-row"><input id="p3e-style-glow-color" type="color"><div class="p3e-advanced-style-grid"><label>Glow blur<input id="p3e-style-glow-blur" class="p3e-input" type="number" min="0" max="8" step="1"></label><label>Glow outline<input id="p3e-style-glow-outline" class="p3e-input" type="number" min="0" max="8" step="1"></label></div></div>`;
    const typography = el('p3e-typography-tools');
    if (typography?.nextSibling) typography.parentNode.insertBefore(advanced, typography.nextSibling); else fold.appendChild(advanced);
    advanced.addEventListener('input', saveAdvancedControls);
  }

  renderCards();
  const job = selectedP3Job();
  if (job) { const config=ensureP3Config(job); syncAdvancedControls(config); syncPreviewDecorations(); }
  return true;
}

function markCustomFromManualInput(target) {
  if (applyingStyle || !MANUAL_STYLE_CONTROL_IDS.has(target?.id)) return;
  const job = selectedP3Job();
  if (job) ensureP3Config(job).stylePresetId = 'custom';
}

function bindSync() {
  if (observer || !el('p3e-sub')) return;
  observer = new MutationObserver(() => requestAnimationFrame(syncPreviewDecorations));
  observer.observe(el('p3e-sub'), { childList:true, characterData:true, subtree:true, attributes:true, attributeFilter:['class'] });
  document.addEventListener('input', event => {
    if (!event.target?.closest?.('#step-3-content')) return;
    if (!event.target?.closest?.('#p3e-advanced-style')) markCustomFromManualInput(event.target);
    requestAnimationFrame(() => { syncPreviewDecorations(); renderCards(); });
  }, true);
  document.addEventListener('click', event => {
    if (event.target?.closest?.('[data-job],.p3e-preset,[data-p3-typo]')) requestAnimationFrame(() => { syncPreviewDecorations(); renderCards(); });
  }, true);
  window.addEventListener('resize', () => requestAnimationFrame(syncPreviewDecorations));
}

function installWhenReady(attempt=0) {
  installStyle();
  if (installUi()) { bindSync(); return; }
  if (attempt < 80) setTimeout(() => installWhenReady(attempt+1), 100);
}

export function installP3SubtitleStyleEngine() {
  if (installed) return;
  installed = true;
  installWhenReady();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installP3SubtitleStyleEngine, { once:true });
else installP3SubtitleStyleEngine();
