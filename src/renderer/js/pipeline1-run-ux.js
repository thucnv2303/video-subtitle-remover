const SYNC_INTERVAL_MS = 250;
const QUEUE_RECOVERY_DELAY_MS = 120;

let recoveryTimer = null;
let recoveryJobId = null;

function state() {
  return window._appState || null;
}

function p1Jobs(appState) {
  return Array.isArray(appState?.jobs) ? appState.jobs.filter(job => job?.pipeline === 1) : [];
}

function hasActiveP1(appState) {
  if (!appState) return false;
  if (appState.pipeline1JobId) return true;
  return p1Jobs(appState).some(job => ['queued', 'processing'].includes(job.status));
}

function currentP1Job(appState) {
  if (!appState) return null;
  return appState.jobs?.find(job => job.id === appState.pipeline1JobId)
    || p1Jobs(appState).find(job => job.status === 'processing')
    || null;
}

function hasStartableP1(appState) {
  if (!appState?.isBackendReady) return false;
  return Array.isArray(appState.jobs) && appState.jobs.some(job => job.status === 'idle');
}

function syncRunningJobSelection(appState) {
  const current = currentP1Job(appState);
  if (!current) return;
  if (appState.pipeline1SelectedJobId === current.id && appState.activeJobId === current.id) return;

  appState.pipeline1SelectedJobId = current.id;
  appState.activeJobId = current.id;
  window.renderJobList?.();
  window.renderJobDetail1?.();
}

function triggerLegacyP1QueueStart(appState, nextJob) {
  if (!appState || !nextJob) return false;
  const index = appState.jobs.findIndex(job => job.id === nextJob.id);
  if (index < 0) return false;

  nextJob.status = 'idle';
  nextJob.progress = 0;
  nextJob._p1Cancelled = false;
  nextJob._p1StopRequested = false;
  window.renderJobList?.();

  const card = document.querySelectorAll('#step1-job-list .tk-job-card')[index];
  if (!card) {
    nextJob.status = 'queued';
    window.renderJobList?.();
    return false;
  }

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'btn-process-job';
  trigger.dataset.id = nextJob.id;
  trigger.hidden = true;
  card.appendChild(trigger);
  trigger.click();
  trigger.remove();
  return true;
}

function recoverStalledP1Queue() {
  const appState = state();
  if (!appState || appState.pipeline1JobId || p1Jobs(appState).some(job => job.status === 'processing')) {
    if (recoveryTimer) clearTimeout(recoveryTimer);
    recoveryTimer = null;
    recoveryJobId = null;
    return;
  }

  const nextJob = p1Jobs(appState).find(job => job.status === 'queued' && !job._p1Cancelled && !job._p1StopRequested);
  if (!nextJob) {
    if (recoveryTimer) clearTimeout(recoveryTimer);
    recoveryTimer = null;
    recoveryJobId = null;
    return;
  }

  if (recoveryTimer && recoveryJobId === nextJob.id) return;
  if (recoveryTimer) clearTimeout(recoveryTimer);
  recoveryJobId = nextJob.id;
  recoveryTimer = setTimeout(() => {
    recoveryTimer = null;
    recoveryJobId = null;
    const latest = state();
    if (!latest || latest.pipeline1JobId || p1Jobs(latest).some(job => job.status === 'processing')) return;
    const candidate = p1Jobs(latest).find(job => job.id === nextJob.id && job.status === 'queued' && !job._p1Cancelled && !job._p1StopRequested);
    if (!candidate) return;

    const hadFailure = p1Jobs(latest).some(job => job.status === 'error');
    if (triggerLegacyP1QueueStart(latest, candidate) && hadFailure) {
      window.addLog?.(`[P1] ↪ Job lỗi đã được cô lập; tiếp tục hàng đợi với: ${candidate.fileName}`, 'warning');
    }
  }, QUEUE_RECOVERY_DELAY_MS);
}

function injectStyles() {
  if (document.querySelector('link[data-p1-run-ux]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/pipeline1-run-ux.css';
  link.dataset.p1RunUx = 'true';
  document.head.appendChild(link);
}

function logLine(container, progressKey) {
  if (!container || !progressKey) return null;
  return [...container.querySelectorAll('.log-entry')].find(entry => entry.dataset.progressKey === progressKey) || null;
}

function formatLogText(message) {
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  return `[${time}] ${message}`;
}

function updateProgressLog(progressKey, message, type = 'info', done = false) {
  if (!progressKey || !message) return;
  const containers = [
    document.getElementById('log-output'),
    document.getElementById('step1-log-output'),
  ].filter(Boolean);

  for (const container of containers) {
    let entry = logLine(container, progressKey);
    if (!entry) {
      entry = document.createElement('div');
      entry.className = `log-entry log-${type}`;
      entry.dataset.progressKey = progressKey;
      container.appendChild(entry);
    }
    entry.className = `log-entry log-${type}`;
    entry.textContent = formatLogText(message);
    if (done) entry.dataset.progressDone = 'true';
    container.scrollTop = container.scrollHeight;
  }
}
window.updateP1ProgressLog = updateProgressLog;

function syncButton(button) {
  const appState = state();
  if (!button || !appState) return;
  const active = hasActiveP1(appState);
  const current = currentP1Job(appState);
  const stopping = Boolean(current?._p1StopRequested);
  const hoverStop = button.matches(':hover') && active && !stopping;

  syncRunningJobSelection(appState);
  recoverStalledP1Queue();

  button.classList.toggle('is-processing', active && !stopping);
  button.classList.toggle('is-stop-intent', hoverStop);
  button.classList.toggle('is-stopping', stopping);
  button.dataset.p1Busy = active ? 'true' : 'false';
  button.disabled = active ? stopping : !hasStartableP1(appState);

  if (stopping) {
    button.textContent = '⏹ Đang dừng...';
    button.title = 'Đang yêu cầu dừng Pipeline 1';
    button.setAttribute('aria-label', 'Đang dừng Pipeline 1');
  } else if (hoverStop) {
    button.textContent = '⏹ Dừng xử lý';
    button.title = 'Dừng Job Pipeline 1 đang chạy';
    button.setAttribute('aria-label', 'Dừng xử lý Pipeline 1');
  } else if (active) {
    button.textContent = '⏳ Đang xử lý...';
    button.title = current?.fileName ? `Pipeline 1 đang xử lý: ${current.fileName}` : 'Pipeline 1 đang chạy — đưa chuột vào để dừng';
    button.setAttribute('aria-label', current?.fileName ? `Pipeline 1 đang xử lý ${current.fileName}` : 'Pipeline 1 đang xử lý');
  } else {
    button.textContent = '▶ Bắt đầu chạy';
    button.title = 'Bắt đầu xử lý Pipeline 1';
    button.setAttribute('aria-label', 'Bắt đầu xử lý Pipeline 1');
  }
}

async function stopP1(button) {
  const appState = state();
  if (!appState || !hasActiveP1(appState)) return;
  const current = currentP1Job(appState);

  if (recoveryTimer) clearTimeout(recoveryTimer);
  recoveryTimer = null;
  recoveryJobId = null;

  if (current) {
    current._p1Cancelled = true;
    current._p1StopRequested = true;
  }

  p1Jobs(appState).forEach(job => {
    if (job.status === 'queued') {
      job.status = 'idle';
      job.progress = 0;
      job._p1Cancelled = true;
    }
  });

  syncButton(button);
  window.addLog?.(`[P1] ⏹ Đang dừng${current?.fileName ? `: ${current.fileName}` : ' Pipeline 1'}...`, 'warning');

  const requests = [];
  if (current?.id && window.electronAPI?.cancelP1Vision) {
    requests.push(window.electronAPI.cancelP1Vision({ job_id: current.id }));
  }
  if (window.api?.cancelProcess) requests.push(window.api.cancelProcess());
  await Promise.allSettled(requests);

  window.renderJobList?.();
  window.updateStartButton?.();
  syncButton(button);
}

function install() {
  injectStyles();
  const button = document.getElementById('btn-start-all');
  if (!button || button.dataset.p1RunController === 'true') return Boolean(button);
  button.dataset.p1RunController = 'true';

  const legacyStop = document.getElementById('btn-stop-all');
  if (legacyStop) legacyStop.hidden = true;
  button.closest('.p1-action-grid')?.classList.add('p1-run-stop-integrated');

  button.addEventListener('mouseenter', () => syncButton(button));
  button.addEventListener('mouseleave', () => syncButton(button));
  button.addEventListener('click', async (event) => {
    const appState = state();
    if (!hasActiveP1(appState)) {
      setTimeout(() => syncButton(button), 0);
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
    await stopP1(button);
  }, true);

  const queue = document.getElementById('step1-job-list');
  if (queue) {
    new MutationObserver(() => syncButton(button)).observe(queue, { childList: true, subtree: true, attributes: true });
  }

  syncButton(button);
  return true;
}

let attempts = 0;
const timer = setInterval(() => {
  attempts += 1;
  if (install() || attempts > 80) clearInterval(timer);
}, 100);

setInterval(() => {
  const button = document.getElementById('btn-start-all');
  if (button?.dataset.p1RunController === 'true') syncButton(button);
}, SYNC_INTERVAL_MS);
