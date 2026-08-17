const state = window._appState;
const busyNoVocal = new Set();

function log(message, type = 'info') { window.addLog?.(message, type); }
function toast(message, type = 'info') { window.showToast?.(message, type, 4000); }
function stem(fileName) { return String(fileName || 'video').replace(/\.[^.]+$/, ''); }
function looksLikePath(value) { return typeof value === 'string' && (/^[A-Za-z]:[\\/]/.test(value) || value.startsWith('/') || value.startsWith('\\\\')); }
function extensionOf(filePath, fallback = '') {
  const match = String(filePath || '').match(/(\.[A-Za-z0-9]{1,8})$/);
  return match ? match[1].toLowerCase() : fallback;
}
function jobById(id) { return state?.jobs?.find(job => job.id === id) || null; }

async function saveCopy(sourcePath, suggestedName) {
  if (!sourcePath) return toast('Job chưa có artifact này.', 'warning');
  if (typeof window.electronAPI?.saveCopy !== 'function') return toast('Bridge tải kết quả chưa sẵn sàng. Hãy khởi động lại app.', 'error');
  const result = await window.electronAPI.saveCopy({ sourcePath, suggestedName });
  if (result?.canceled) return;
  if (!result?.ok) return toast(result?.error || 'Không thể tải kết quả.', 'error');
  toast(`Đã lưu: ${result.output_path}`, 'success');
  log(`[Export] Đã tải kết quả → ${result.output_path}`, 'success');
}

function p1Artifacts(job) {
  const paths = job?.p1ArtifactPaths || {};
  const result = [];
  const add = (label, sourcePath, name) => { if (looksLikePath(sourcePath)) result.push({ label, sourcePath, name }); };
  add('Kịch bản SRT', paths['remix_script.srt'], `${stem(job.fileName)}_script.srt`);
  add('Remix script JSON', paths['remix_script.json'], `${stem(job.fileName)}_remix_script.json`);
  add('Timeline JSON', paths['multimodal_timeline.json'], `${stem(job.fileName)}_timeline.json`);
  add('Edit plan JSON', paths['edit_plan.json'], `${stem(job.fileName)}_edit_plan.json`);
  add('Scenes JSON', paths['scenes.json'], `${stem(job.fileName)}_scenes.json`);
  add('Voice', job.ttsAudioPath, `${stem(job.fileName)}_voice${extensionOf(job.ttsAudioPath, '.wav')}`);
  return result;
}

function showArtifactMenu(anchor, artifacts) {
  document.querySelector('.job-export-popover')?.remove();
  if (!artifacts.length) return toast('Job chưa có kết quả P1 để tải.', 'warning');
  const menu = document.createElement('div');
  menu.className = 'job-export-popover';
  menu.style.cssText = 'position:fixed;z-index:99999;min-width:210px;background:#0f2234;border:1px solid #31506c;border-radius:8px;padding:6px;box-shadow:0 12px 30px rgba(0,0,0,.4)';
  artifacts.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `↓ ${item.label}`;
    button.style.cssText = 'display:block;width:100%;text-align:left;background:transparent;color:#e6f1ff;border:0;padding:8px 10px;border-radius:5px;cursor:pointer';
    button.addEventListener('click', async () => { menu.remove(); await saveCopy(item.sourcePath, item.name); });
    menu.appendChild(button);
  });
  const rect = anchor.getBoundingClientRect();
  menu.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 230))}px`;
  menu.style.top = `${Math.min(rect.bottom + 4, window.innerHeight - 260)}px`;
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', (event) => { if (!menu.contains(event.target) && event.target !== anchor) menu.remove(); }, { once: true }), 0);
}

async function createP2NoVocal(job, button) {
  const input = job?.outputPath;
  if (!input || job.status !== 'finished') return toast('P2 phải hoàn tất trước khi tạo bản không giọng.', 'warning');
  if (busyNoVocal.has(job.id)) return;
  busyNoVocal.add(job.id);
  button.disabled = true;
  button.textContent = 'Đang tách giọng...';
  const out = input.replace(/\.mp4$/i, '_no_vocal.mp4');
  const bg = input.replace(/\.mp4$/i, '_no_vocal_bg.wav');
  let created = false;
  try {
    log(`[P2] 🎵 Tách giọng gốc bằng Demucs cho ${job.fileName}...`, 'info');
    const separated = await window.api.removeVocal(input, bg);
    if (separated?.status !== 'ok' || separated?.method_used !== 'demucs') {
      throw new Error(`Yêu cầu Demucs strict; backend trả ${separated?.method_used || separated?.error || separated?.status || 'unknown'}.`);
    }
    const muxed = await window.api.replaceAudio(input, separated.audio_path, out, 0);
    if (muxed?.status !== 'ok') throw new Error(muxed?.error || 'Không mux được no-vocals stem vào video P2.');
    job.p2NoVocalOutputPath = muxed.output_path || out;
    created = true;
    log(`[P2] ✅ Bản không giọng gốc: ${job.p2NoVocalOutputPath}`, 'success');
    toast('Đã tạo bản P2 không giọng gốc.', 'success');
  } catch (error) {
    log(`[P2] ❌ Tạo bản không giọng thất bại: ${error.message}`, 'error');
    toast(error.message, 'error');
  } finally {
    busyNoVocal.delete(job.id);
    button.disabled = false;
    button.textContent = created || job.p2NoVocalOutputPath ? '↓ Không giọng' : '♬ Xóa giọng';
  }
}

function makeButton(text, title) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  button.title = title;
  button.style.cssText = 'background:#17344e;color:#ddecff;border:1px solid #315a7d;padding:3px 7px;border-radius:5px;cursor:pointer;font-size:11px';
  return button;
}

function p1JobForCard(card) {
  const id = card.dataset.pipelineJobId || card.querySelector('[data-id]')?.dataset?.id;
  return id ? jobById(id) : null;
}

function p2JobForCard(card) {
  const id = card.dataset.pipelineJobId;
  return id ? jobById(id) : null;
}

function attachP1Buttons() {
  const list = document.getElementById('step1-job-list');
  if (!list || !state?.jobs) return;
  [...list.querySelectorAll('.tk-job-card')].forEach(card => {
    const job = p1JobForCard(card);
    const actions = card.querySelector('.tk-job-card-header > div');
    if (!job || !actions || actions.querySelector('[data-job-export-p1]')) return;
    const button = makeButton('↓ Kết quả', 'Tải artifact của Job Pipeline 1');
    button.dataset.jobExportP1 = job.id;
    button.disabled = p1Artifacts(job).length === 0;
    button.addEventListener('click', event => { event.stopPropagation(); showArtifactMenu(button, p1Artifacts(job)); });
    actions.insertBefore(button, actions.firstChild);
  });
}

function attachP2Buttons() {
  const list = document.getElementById('job-list');
  if (!list || !state?.jobs) return;
  [...list.querySelectorAll('.job-card')].forEach(card => {
    const job = p2JobForCard(card);
    const detail = card.querySelector('.job-detail');
    if (!job || !detail || detail.querySelector('[data-job-export-p2]')) return;
    if (job.status !== 'finished' || !job.outputPath) return;

    const download = makeButton('↓ P2', 'Tải video đã xóa subtitle của Job này');
    download.dataset.jobExportP2 = job.id;
    download.addEventListener('click', event => { event.stopPropagation(); saveCopy(job.outputPath, `${stem(job.fileName)}_no_sub.mp4`); });
    detail.appendChild(download);

    const noVocal = makeButton(job.p2NoVocalOutputPath ? '↓ Không giọng' : '♬ Xóa giọng', 'Tạo/tải bản P2 không có giọng gốc bằng Demucs');
    noVocal.dataset.jobNoVocal = job.id;
    noVocal.addEventListener('click', event => {
      event.stopPropagation();
      if (job.p2NoVocalOutputPath) saveCopy(job.p2NoVocalOutputPath, `${stem(job.fileName)}_no_sub_no_vocal.mp4`);
      else createP2NoVocal(job, noVocal);
    });
    detail.appendChild(noVocal);
  });
}

function sync() { attachP1Buttons(); attachP2Buttons(); }
const observer = new MutationObserver(sync);
observer.observe(document.body, { childList: true, subtree: true });
const timer = setInterval(sync, 250);
window.addEventListener('beforeunload', () => clearInterval(timer), { once: true });
sync();
window.jobExportControls = { sync, saveCopy, createP2NoVocal };