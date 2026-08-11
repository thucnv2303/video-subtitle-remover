const SYNC_INTERVAL_MS = 250;
const QUEUE_RECOVERY_DELAY_MS = 120;

let recoveryTimer = null;
let recoveryJobId = null;
let errorLogCaptureInstalled = false;

function state() {
  return window._appState || null;
}

function p1Jobs(appState) {
  return Array.isArray(appState?.jobs) ? appState.jobs.filter(job => job?.pipeline === 1) : [];
}

function p1State(job) {
  return job?.p1Status || job?.status || 'idle';
}

function hasActiveP1(appState) {
  if (!appState) return false;
  if (appState.pipeline1JobId) return true;
  return p1Jobs(appState).some(job => ['queued', 'processing'].includes(p1State(job)));
}

function currentP1Job(appState) {
  if (!appState) return null;
  return appState.jobs?.find(job => job.id === appState.pipeline1JobId)
    || p1Jobs(appState).find(job => p1State(job) === 'processing')
    || null;
}

function hasStartableP1(appState) {
  if (!appState?.isBackendReady) return false;
  return Array.isArray(appState.jobs) && appState.jobs.some(job => ['idle', 'error'].includes(p1State(job)));
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
  nextJob.p1Status = 'idle';
  nextJob.progress = 0;
  nextJob.p1Progress = 0;
  nextJob._p1Cancelled = false;
  nextJob._p1StopRequested = false;
  window.renderJobList?.();

  const card = document.querySelectorAll('#step1-job-list .tk-job-card')[index];
  if (!card) {
    nextJob.status = 'queued';
    nextJob.p1Status = 'queued';
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
  if (!appState || appState.pipeline1JobId || p1Jobs(appState).some(job => p1State(job) === 'processing')) {
    if (recoveryTimer) clearTimeout(recoveryTimer);
    recoveryTimer = null;
    recoveryJobId = null;
    return;
  }

  const nextJob = p1Jobs(appState).find(job => p1State(job) === 'queued' && !job._p1Cancelled && !job._p1StopRequested);
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
    if (!latest || latest.pipeline1JobId || p1Jobs(latest).some(job => p1State(job) === 'processing')) return;
    const candidate = p1Jobs(latest).find(job => job.id === nextJob.id && p1State(job) === 'queued' && !job._p1Cancelled && !job._p1StopRequested);
    if (!candidate) return;

    const hadFailure = p1Jobs(latest).some(job => p1State(job) === 'error');
    if (triggerLegacyP1QueueStart(latest, candidate) && hadFailure) {
      window.addLog?.(`[P1] ↪ Job lỗi đã được cô lập; tiếp tục hàng đợi với: ${candidate.fileName}`, 'warning');
    }
  }, QUEUE_RECOVERY_DELAY_MS);
}

function installP1ErrorCapture() {
  if (errorLogCaptureInstalled || typeof window.addLog !== 'function') return;
  const original = window.addLog;
  if (original.__p1ErrorCaptureWrapped) {
    errorLogCaptureInstalled = true;
    return;
  }

  const wrapped = function wrappedP1Log(message, type = 'info') {
    const match = String(message || '').match(/^\[AI\]\s*❌\s*Lỗi Pipeline 1:\s*(.+)$/i);
    const appState = state();
    const current = currentP1Job(appState);
    if (match && current) {
      current.p1ErrorMessage = match[1].trim() || 'Pipeline 1 thất bại.';
      current.p1ErrorStage ||= 'pipeline';
      current.p1ErrorAt = Date.now();
    }
    return original.apply(this, arguments);
  };
  wrapped.__p1ErrorCaptureWrapped = true;
  window.addLog = wrapped;
  errorLogCaptureInstalled = true;
}

function p1ErrorDetail(job) {
  const candidates = [job?.p1ErrorMessage, job?.errorMessage, job?.lastError, job?.error];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value?.message && typeof value.message === 'string') return value.message.trim();
  }
  return 'Pipeline 1 đã kết thúc với trạng thái lỗi. Chưa có chi tiết lỗi được lưu cho lần chạy này.';
}

function ensureP1ErrorDialog() {
  let overlay = document.getElementById('p1-error-dialog');
  if (overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'p1-error-dialog';
  overlay.className = 'p1-error-dialog';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'p1-error-dialog-title');

  const panel = document.createElement('section');
  panel.className = 'p1-error-dialog-panel';

  const header = document.createElement('div');
  header.className = 'p1-error-dialog-header';

  const titleWrap = document.createElement('div');
  const eyebrow = document.createElement('span');
  eyebrow.className = 'p1-error-dialog-eyebrow';
  eyebrow.textContent = 'PIPELINE 1';
  const title = document.createElement('h3');
  title.id = 'p1-error-dialog-title';
  title.textContent = 'Job xử lý bị lỗi';
  titleWrap.append(eyebrow, title);

  const closeIcon = document.createElement('button');
  closeIcon.type = 'button';
  closeIcon.className = 'p1-error-dialog-close';
  closeIcon.dataset.p1ErrorClose = 'true';
  closeIcon.setAttribute('aria-label', 'Đóng thông báo lỗi');
  closeIcon.textContent = '×';
  header.append(titleWrap, closeIcon);

  const jobName = document.createElement('strong');
  jobName.className = 'p1-error-dialog-job';
  jobName.dataset.p1ErrorJob = 'true';

  const message = document.createElement('pre');
  message.className = 'p1-error-dialog-message';
  message.dataset.p1ErrorMessage = 'true';

  const meta = document.createElement('div');
  meta.className = 'p1-error-dialog-meta';
  meta.dataset.p1ErrorMeta = 'true';

  const actions = document.createElement('div');
  actions.className = 'p1-error-dialog-actions';

  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.className = 'p1-error-dialog-action';
  retryButton.dataset.p1ErrorRetry = 'true';
  retryButton.textContent = '↻ Chạy lại';

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'p1-error-dialog-action';
  closeButton.dataset.p1ErrorClose = 'true';
  closeButton.textContent = 'Đóng';
  actions.append(retryButton, closeButton);

  panel.append(header, jobName, message, meta, actions);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.remove('is-open');
    overlay.hidden = true;
    delete overlay.dataset.p1JobId;
  };

  overlay.addEventListener('click', event => {
    const retry = event.target.closest('[data-p1-error-retry="true"]');
    if (retry) {
      const appState = state();
      const job = appState?.jobs?.find(item => item.id === overlay.dataset.p1JobId);
      if (job && p1State(job) === 'error' && queueFailedP1Job(job)) close();
      return;
    }
    if (event.target === overlay || event.target.closest('[data-p1-error-close="true"]')) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !overlay.hidden) close();
  });
  return overlay;
}

function openP1ErrorDialog(job) {
  if (!job) return;
  const overlay = ensureP1ErrorDialog();
  const jobName = overlay.querySelector('[data-p1-error-job="true"]');
  const message = overlay.querySelector('[data-p1-error-message="true"]');
  const meta = overlay.querySelector('[data-p1-error-meta="true"]');
  const retry = overlay.querySelector('[data-p1-error-retry="true"]');
  overlay.dataset.p1JobId = job.id || '';
  if (jobName) jobName.textContent = job.fileName || `Job ${job.id || ''}`;
  if (message) message.textContent = p1ErrorDetail(job);
  if (meta) {
    const parts = [];
    if (job.p1ErrorStage) parts.push(`Giai đoạn: ${job.p1ErrorStage}`);
    if (job.p1ErrorAt) parts.push(`Thời điểm: ${new Date(job.p1ErrorAt).toLocaleTimeString('vi-VN', { hour12: false })}`);
    meta.textContent = parts.length ? parts.join(' · ') : 'Chi tiết lỗi được lấy từ lần xử lý gần nhất của Job này.';
  }
  if (retry) retry.hidden = p1State(job) !== 'error';
  overlay.hidden = false;
  overlay.classList.add('is-open');
  overlay.querySelector('[data-p1-error-close="true"]')?.focus();
}

function syncJobFeedback(appState) {
  if (!appState?.jobs) return;
  const cards = [...document.querySelectorAll('#step1-job-list .tk-job-card')];
  cards.forEach((card, index) => {
    const job = appState.jobs[index];
    if (!job) return;
    const effectiveState = p1State(job);
    const processing = effectiveState === 'processing';
    const failed = effectiveState === 'error';
    if (card.dataset.p1JobId !== job.id) card.dataset.p1JobId = job.id;
    card.classList.toggle('p1-job-card-processing', processing);
    card.classList.toggle('p1-job-card-error', failed);

    const status = card.querySelector('.p1-job-state');
    if (status) status.classList.toggle('p1-job-state-live', processing);

    const existingRetry = card.querySelector('.p1-job-retry');
    if (failed && !existingRetry) {
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'p1-job-retry';
      retry.textContent = '↻ Chạy lại';
      retry.title = 'Chạy lại Job này';
      retry.setAttribute('aria-label', `Chạy lại ${job.fileName || 'Job lỗi'}`);
      if (status) status.insertAdjacentElement('afterend', retry);
      else card.appendChild(retry);
    } else if (!failed && existingRetry) {
      existingRetry.remove();
    }
  });
}

function queueFailedP1Job(job) {
  const appState = state();
  if (!appState || !job || p1State(job) !== 'error') return false;
  const active = currentP1Job(appState);

  job.pipeline = 1;
  job.status = 'queued';
  job.p1Status = 'queued';
  job.progress = 0;
  job.p1Progress = 0;
  job._p1Cancelled = false;
  job._p1StopRequested = false;
  delete job.p1ErrorMessage;
  delete job.p1ErrorStage;
  delete job.p1ErrorAt;

  window.renderJobList?.();
  window.updateStartButton?.();
  window.pipelineStateGate?.scheduleSync?.();
  window.addLog?.(
    `[P1] ↻ Đã xếp lại Job lỗi vào hàng đợi: ${job.fileName}${active ? ` (sau ${active.fileName})` : ''}`,
    'warning'
  );

  if (!active) recoverStalledP1Queue();
  return true;
}

function bindErrorCardClick(queue) {
  if (!queue || queue.dataset.p1ErrorPopupBound === 'true') return;
  queue.dataset.p1ErrorPopupBound = 'true';
  queue.addEventListener('click', event => {
    const retry = event.target.closest('.p1-job-retry');
    if (retry) {
      const card = retry.closest('.tk-job-card');
      const appState = state();
      const job = card && appState?.jobs?.find(item => item.id === card.dataset.p1JobId);
      if (p1State(job) === 'error') {
        event.preventDefault();
        event.stopPropagation();
        queueFailedP1Job(job);
      }
      return;
    }

    if (event.target.closest('button, a, input, select, textarea')) return;
    const card = event.target.closest('.tk-job-card');
    if (!card || !queue.contains(card)) return;
    const appState = state();
    const job = appState?.jobs?.find(item => item.id === card.dataset.p1JobId);
    if (p1State(job) !== 'error') return;
    event.preventDefault();
    event.stopPropagation();
    openP1ErrorDialog(job);
  }, true);
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

  installP1ErrorCapture();
  syncRunningJobSelection(appState);
  recoverStalledP1Queue();
  syncJobFeedback(appState);

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
    if (p1State(job) === 'queued') {
      job.status = 'idle';
      job.p1Status = 'idle';
      job.progress = 0;
      job.p1Progress = 0;
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
    bindErrorCardClick(queue);
    new MutationObserver(() => syncButton(button)).observe(queue, { childList: true, subtree: true });
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
