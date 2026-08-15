import { selectedP3Job, ensureP3Config } from './editor-store.js';

const STYLE_ID = 'p3e-runtime-fix-rev4-style';
const QUALITY = {
  balanced: { label: 'Cân bằng', detail: 'H.264 · CRF 20 · medium', crf: 20, preset: 'medium' },
  high: { label: 'Cao', detail: 'H.264 · CRF 18 · slow', crf: 18, preset: 'slow' },
  very_high: { label: 'Rất cao', detail: 'H.264 · CRF 16 · slow', crf: 16, preset: 'slow' },
  max: { label: 'Tối đa', detail: 'H.264 · CRF 14 · slower', crf: 14, preset: 'slower' },
};

let installed = false;
let observer = null;

function el(id) { return document.getElementById(id); }
function baseName(pathValue) {
  const raw = String(pathValue || '').replace(/\\/g, '/');
  return raw.split('/').pop() || 'video.mp4';
}
function dirName(pathValue) {
  const raw = String(pathValue || '');
  const slash = Math.max(raw.lastIndexOf('/'), raw.lastIndexOf('\\'));
  return slash >= 0 ? raw.slice(0, slash) : '';
}
function joinPath(dir, file) {
  const d = String(dir || '').replace(/[\\/]+$/, '');
  if (!d) return file;
  const sep = d.includes('\\') ? '\\' : '/';
  return `${d}${sep}${file}`;
}
function sanitizeFileName(value, fallback = 'video_final.mp4') {
  const raw = String(value || '').trim().replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/[. ]+$/g, '');
  if (!raw) return fallback;
  const stem = raw.replace(/\.mp4$/i, '');
  return `${stem || 'video_final'}.mp4`;
}
function defaultFileName(job) {
  const source = baseName(job?.filePath || job?.p3CleanVideoPath || job?.outputPath || 'video.mp4');
  return `${source.replace(/\.[^.]+$/, '')}_final.mp4`;
}
function defaultDirectory(job) {
  return dirName(job?.filePath || job?.p3CleanVideoPath || job?.outputPath || '');
}

export function getP3ExportQuality(config = {}) {
  return QUALITY[config.exportQuality] || QUALITY.high;
}

export function getP3OutputPath(job) {
  if (!job) return '';
  const config = ensureP3Config(job);
  const fileName = sanitizeFileName(config.outputFileName, defaultFileName(job));
  const directory = String(config.outputDirectory || '').trim() || defaultDirectory(job);
  return joinPath(directory, fileName);
}

function installStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
#step-3-content,#step-3-content *{box-sizing:border-box}
#step-3-content .p3e-shell{grid-template-columns:minmax(210px,250px) minmax(480px,1fr) minmax(340px,390px)}
#step-3-content .p3e-inspector,#step-3-content .p3e-accordion,#step-3-content .p3e-fold,#step-3-content .p3e-fold-body,#step-3-content .p3e-grid2,#step-3-content .p3e-style-engine,#step-3-content .p3e-style-grid,#step-3-content .p3e-style-card,#step-3-content .p3e-typography-tools,#step-3-content .p3e-advanced-style{min-width:0;max-width:100%}
#step-3-content .p3e-inspector,#step-3-content .p3e-accordion,#step-3-content .p3e-fold-body{overflow-x:hidden}
#step-3-content .p3e-fold-body>*{min-width:0;max-width:100%}
#step-3-content .p3e-grid2{grid-template-columns:repeat(2,minmax(0,1fr))}
#step-3-content .p3e-grid2>*,#step-3-content .p3e-advanced-style-grid>*{min-width:0}
#step-3-content .p3e-input,#step-3-content input,#step-3-content select,#step-3-content textarea,#step-3-content button{max-width:100%}
#step-3-content .p3e-style-cats{max-width:100%;display:flex;flex-wrap:wrap;overflow:visible;padding-bottom:2px}
#step-3-content .p3e-style-grid{grid-template-columns:repeat(2,minmax(0,1fr));overflow-x:hidden}
#step-3-content .p3e-export-rev4{display:grid;gap:9px}
#step-3-content .p3e-export-path-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:end}
#step-3-content .p3e-export-path{overflow-wrap:anywhere;word-break:break-word}
#step-3-content .p3e-export-quality{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
#step-3-content .p3e-export-quality button{min-width:0;padding:8px;border:1px solid #334d67;border-radius:7px;background:#102131;color:#aebfd0;text-align:left;cursor:pointer}
#step-3-content .p3e-export-quality button.active{border-color:#60a5fa;background:rgba(37,99,235,.16);color:#eff6ff}
#step-3-content .p3e-export-quality b,#step-3-content .p3e-export-quality small{display:block;white-space:normal}
#step-3-content .p3e-export-quality small{margin-top:3px;color:#8398ad;font-size:8px}
#step-3-content .p3e-vocal-strict-note{border-color:rgba(245,158,11,.42);background:rgba(120,53,15,.12);color:#f6d69a}
@media(max-width:1380px){#step-3-content .p3e-shell{grid-template-columns:205px minmax(440px,1fr) 330px;gap:8px;padding:8px}#step-3-content .p3e-grid2,#step-3-content .p3e-advanced-style-grid{grid-template-columns:1fr}}
@media(max-width:1160px){#step-3-content .p3e-shell{grid-template-columns:190px minmax(410px,1fr) 310px}#step-3-content .p3e-style-grid,#step-3-content .p3e-export-quality{grid-template-columns:1fr}}
`;
  document.head.appendChild(style);
}

function ensureAudioWarning() {
  const fold = document.querySelector('.p3e-fold[data-fold="audio"] .p3e-fold-body');
  if (!fold || el('p3e-vocal-strict-note')) return;
  const note = document.createElement('div');
  note.id = 'p3e-vocal-strict-note';
  note.className = 'p3e-note p3e-vocal-strict-note';
  note.textContent = 'Xóa giọng gốc là chế độ nghiêm ngặt: chỉ tiếp tục render khi Demucs tách được no-vocals. Fallback yếu sẽ bị chặn thay vì trộn giọng gốc trở lại.';
  fold.appendChild(note);
}

function exportMarkup() {
  return `<div id="p3e-export-rev4" class="p3e-export-rev4">
    <label>Thư mục đầu ra<div class="p3e-export-path-row"><input id="p3e-output-dir" class="p3e-input" type="text" readonly><button id="p3e-choose-output-dir" class="p3e-btn" type="button">Chọn…</button></div></label>
    <label>Tên file<input id="p3e-output-name" class="p3e-input" type="text" placeholder="video_final.mp4"></label>
    <div><label>Chất lượng H.264</label><div class="p3e-export-quality">${Object.entries(QUALITY).map(([key,item])=>`<button type="button" data-p3-quality="${key}"><b>${item.label}</b><small>${item.detail}</small></button>`).join('')}</div></div>
    <div id="p3e-output-path" class="p3e-note p3e-export-path"></div>
  </div>`;
}

function ensureExportUi() {
  const fold = document.querySelector('.p3e-fold[data-fold="export"] .p3e-fold-body');
  if (!fold) return false;
  if (!el('p3e-export-rev4')) fold.insertAdjacentHTML('afterbegin', exportMarkup());
  bindExportUi();
  syncExportUi();
  return true;
}

function syncExportUi() {
  const job = selectedP3Job();
  if (!job) return;
  const config = ensureP3Config(job);
  const fallbackName = defaultFileName(job);
  const name = sanitizeFileName(config.outputFileName, fallbackName);
  const configuredDir = String(config.outputDirectory || '').trim();
  const actualDir = configuredDir || defaultDirectory(job);
  const quality = getP3ExportQuality(config);
  const dirInput = el('p3e-output-dir');
  const nameInput = el('p3e-output-name');
  if (dirInput && document.activeElement !== dirInput) dirInput.value = actualDir;
  if (nameInput && document.activeElement !== nameInput) nameInput.value = name;
  const pathBox = el('p3e-output-path');
  if (pathBox) pathBox.textContent = `Đầu ra: ${getP3OutputPath(job)}`;
  const legacySummary = el('p3e-export-summary');
  if (legacySummary) legacySummary.textContent = `MP4 · H.264/libx264 · CRF ${quality.crf} · ${quality.preset} · giữ resolution/FPS nguồn · không resize`;
  document.querySelectorAll('[data-p3-quality]').forEach(button => button.classList.toggle('active', button.dataset.p3Quality === (config.exportQuality || 'high')));
}

function bindExportUi() {
  const root = el('p3e-export-rev4');
  if (!root || root.dataset.bound === 'true') return;
  root.dataset.bound = 'true';

  el('p3e-choose-output-dir')?.addEventListener('click', async () => {
    const job = selectedP3Job();
    if (!job || !window.electronAPI?.openDirectory) return;
    const result = await window.electronAPI.openDirectory();
    const directory = result?.canceled ? '' : String(result?.filePaths?.[0] || '').trim();
    if (!directory) return;
    ensureP3Config(job).outputDirectory = directory;
    syncExportUi();
  });

  el('p3e-output-name')?.addEventListener('change', event => {
    const job = selectedP3Job();
    if (!job) return;
    const config = ensureP3Config(job);
    config.outputFileName = sanitizeFileName(event.target.value, defaultFileName(job));
    syncExportUi();
  });

  root.addEventListener('click', event => {
    const button = event.target.closest?.('[data-p3-quality]');
    if (!button) return;
    const job = selectedP3Job();
    if (!job || !QUALITY[button.dataset.p3Quality]) return;
    ensureP3Config(job).exportQuality = button.dataset.p3Quality;
    syncExportUi();
  });
}

function bindGlobalSync() {
  if (document.documentElement.dataset.p3Rev4SyncBound === 'true') return;
  document.documentElement.dataset.p3Rev4SyncBound = 'true';
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-job], .p3e-preset, [data-style-id]')) requestAnimationFrame(syncExportUi);
  }, true);
  window.addEventListener('resize', () => requestAnimationFrame(syncExportUi));
}

function installWhenReady(attempt = 0) {
  installStyle();
  ensureAudioWarning();
  const ready = ensureExportUi();
  bindGlobalSync();
  if (ready) {
    observer?.disconnect();
    const host = document.getElementById('step-3-content');
    if (host) {
      observer = new MutationObserver(() => {
        ensureAudioWarning();
        ensureExportUi();
      });
      observer.observe(host, { childList: true, subtree: true });
    }
    return;
  }
  if (attempt < 80) setTimeout(() => installWhenReady(attempt + 1), 100);
}

export function installP3RuntimeFixRev4() {
  if (installed) return;
  installed = true;
  installWhenReady();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installP3RuntimeFixRev4, { once: true });
else installP3RuntimeFixRev4();
