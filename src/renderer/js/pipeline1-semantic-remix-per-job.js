const STYLE_ATTR = 'data-p1-remix-per-job';
const SYNC_MS = 250;

function appState() {
  return window._appState || null;
}

function effectiveP1State(job) {
  return job?.p1Status || job?.status || 'idle';
}

function isLocked(job) {
  return ['queued', 'processing'].includes(effectiveP1State(job));
}

function ensureStyle() {
  if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/pipeline1-semantic-remix-per-job.css';
  link.setAttribute(STYLE_ATTR, 'true');
  document.head.appendChild(link);
}

function ensureJobValue(job) {
  if (!job) return false;
  if (typeof job.semanticRemixEnabled !== 'boolean') job.semanticRemixEnabled = false;
  return job.semanticRemixEnabled;
}

function syncExistingConfig(job) {
  if (!job?.p1Config || typeof job.p1Config !== 'object') return;
  job.p1Config.semanticRemixEnabled = Boolean(job.semanticRemixEnabled);
}

function buildControl(job) {
  const wrap = document.createElement('label');
  wrap.className = 'p1-remix-job-control';
  wrap.dataset.p1RemixJobId = job.id || '';
  wrap.title = 'Bật để Job này dùng Semantic Remix: phân tích sản phẩm/ngữ cảnh và tạo semantic edit plan. Tắt để chạy Standard.';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'p1-remix-job-checkbox';
  checkbox.setAttribute('aria-label', `Semantic Remix cho ${job.fileName || 'Job'}`);

  const track = document.createElement('span');
  track.className = 'p1-remix-job-track';
  track.setAttribute('aria-hidden', 'true');

  const text = document.createElement('span');
  text.className = 'p1-remix-job-copy';
  const title = document.createElement('strong');
  title.textContent = 'Remix';
  const state = document.createElement('small');
  state.className = 'p1-remix-job-state';
  text.append(title, state);

  wrap.append(checkbox, track, text);

  wrap.addEventListener('click', event => event.stopPropagation());
  checkbox.addEventListener('change', event => {
    event.stopPropagation();
    if (isLocked(job)) {
      checkbox.checked = Boolean(job.semanticRemixEnabled);
      return;
    }
    job.semanticRemixEnabled = Boolean(checkbox.checked);
    syncExistingConfig(job);
    syncControl(wrap, job);
    window.addLog?.(
      `[P1] Job ${job.fileName || job.id}: ScriptMode=${job.semanticRemixEnabled ? 'semantic-remix' : 'standard'}.`,
      'info'
    );
  });

  syncControl(wrap, job);
  return wrap;
}

function syncControl(control, job) {
  if (!control || !job) return;
  const checked = ensureJobValue(job);
  const locked = isLocked(job);
  const checkbox = control.querySelector('.p1-remix-job-checkbox');
  const state = control.querySelector('.p1-remix-job-state');
  if (checkbox) {
    checkbox.checked = checked;
    checkbox.disabled = locked;
  }
  control.classList.toggle('is-on', checked);
  control.classList.toggle('is-locked', locked);
  control.setAttribute('aria-disabled', locked ? 'true' : 'false');
  if (state) state.textContent = locked ? (checked ? 'Remix · Đã khóa' : 'Standard · Đã khóa') : (checked ? 'Remix' : 'Standard');
}

function mountOnCard(card, job) {
  if (!card || !job) return;
  ensureJobValue(job);

  let control = card.querySelector(':scope > .p1-remix-job-control');
  if (control && control.dataset.p1RemixJobId !== String(job.id || '')) {
    control.remove();
    control = null;
  }
  if (!control) {
    control = buildControl(job);
    card.appendChild(control);
  }
  syncControl(control, job);
}

function syncAllCards() {
  const state = appState();
  if (!Array.isArray(state?.jobs)) return false;
  const queue = document.getElementById('step1-job-list');
  if (!queue) return false;

  const cards = [...queue.querySelectorAll('.tk-job-card')];
  cards.forEach((card, index) => {
    const job = state.jobs[index];
    if (job) mountOnCard(card, job);
  });
  return true;
}

function installPerJobSemanticRemixControls() {
  ensureStyle();
  syncAllCards();
}

installPerJobSemanticRemixControls();
setInterval(syncAllCards, SYNC_MS);

export { installPerJobSemanticRemixControls, syncAllCards };
