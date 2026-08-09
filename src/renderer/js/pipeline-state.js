(function pipelineStateGate() {
  'use strict';

  const P1 = { IDLE:'idle', QUEUED:'queued', PROCESSING:'processing', FINISHED:'finished', ERROR:'error' };
  const P2 = { LOCKED:'locked', READY:'ready', QUEUED:'queued', PROCESSING:'processing', FINISHED:'finished', ERROR:'error' };
  const LEGACY_P2_READY = 'p2-ready';
  let renderPatched = false;
  let syncScheduled = false;

  const appState = () => window._appState || null;
  const isBusy = value => value === 'queued' || value === 'processing';
  const activeStep = () => document.querySelector('.step-chevron.active')?.dataset?.step || '1';

  function p1Label(status) {
    return ({ idle:'Chờ xử lý', queued:'Đang chờ', processing:'Đang xử lý', finished:'Phân tích xong', error:'Lỗi' })[status] || status;
  }

  function p2Label(status) {
    return ({ locked:'Chờ Pipeline 1', ready:'Sẵn sàng', queued:'Đang chờ', processing:'Đang xóa sub', finished:'Đã xóa sub', error:'Lỗi' })[status] || status;
  }

  function log(message, type='info') {
    if (typeof window.addLog === 'function') window.addLog(message, type);
  }

  function notify(message, type='info') {
    if (typeof window.showToast === 'function') window.showToast(message, type);
    else log(message, type === 'error' ? 'error' : 'info');
  }

  function ensureJob(job) {
    if (!job) return;
    if (job._pipelineStateVersion !== 1) {
      job.p1Status = P1.IDLE;
      job.p1Progress = 0;
      job.p2Status = P2.LOCKED;
      job.p2Progress = 0;
      job.p3Status = 'locked';
      job._pipelineStateVersion = 1;
    }
    if (!job.p1Status) job.p1Status = P1.IDLE;
    if (!job.p2Status) job.p2Status = P2.LOCKED;
    if (!job.p3Status) job.p3Status = 'locked';
  }

  function ensureAll() {
    const state = appState();
    if (!state?.jobs) return [];
    state.jobs.forEach(ensureJob);
    return state.jobs;
  }

  function p2Eligible(job) {
    return !!job && job.p1Status === P1.FINISHED && job.p2Status !== P2.LOCKED;
  }

  function syncLegacyToPipelineState() {
    const jobs = ensureAll();
    jobs.forEach(job => {
      // Legacy P1 runner marks pipeline=1 and reuses job.status.
      if (job.pipeline === 1) {
        if (job.status === 'queued') {
          job.p1Status = P1.QUEUED;
          job.p1Progress = Number(job.progress) || 0;
          job.p2Status = P2.LOCKED;
        } else if (job.status === 'processing') {
          job.p1Status = P1.PROCESSING;
          job.p1Progress = Number(job.progress) || 0;
          job.p2Status = P2.LOCKED;
        } else if (job.status === 'error') {
          job.p1Status = P1.ERROR;
          job.p1Progress = Number(job.progress) || 0;
          job.p2Status = P2.LOCKED;
          // Allow the legacy P1 Start All handler to retry this job later.
          job.status = 'idle';
          job.progress = 0;
        } else if (job.status === 'idle' && isBusy(job.p1Status)) {
          // Legacy cancel returns status to idle. Keep P2 locked and reset P1 state.
          job.p1Status = P1.IDLE;
          job.p1Progress = 0;
          job.p2Status = P2.LOCKED;
        } else if (job.status === 'finished' && job.p1Status !== P1.FINISHED) {
          job.p1Status = P1.FINISHED;
          job.p1Progress = 100;
          job.p2Status = P2.READY;
          job.p2Progress = 0;
          job.p3Status = 'locked';
          // Do not use idle here: legacy P1 Start All queues every idle job.
          job.status = LEGACY_P2_READY;
          job.progress = 0;
          log(`[P1→P2] ${job.fileName} đã hoàn tất Pipeline 1 và được mở khóa cho Pipeline 2.`, 'success');
        }
      }

      // Once P2 starts, legacy job.status is mapped only to Pipeline 2 state.
      if (job.pipeline === 2) {
        if (job.status === 'queued') {
          job.p2Status = P2.QUEUED;
          job.p2Progress = Number(job.progress) || 0;
        } else if (job.status === 'processing') {
          job.p2Status = P2.PROCESSING;
          job.p2Progress = Number(job.progress) || 0;
        } else if (job.status === 'error') {
          job.p2Status = P2.ERROR;
          job.p2Progress = Number(job.progress) || 0;
        } else if (job.status === 'finished' && job.p2Status !== P2.FINISHED) {
          job.p2Status = P2.FINISHED;
          job.p2Progress = 100;
          job.p3Status = 'ready';
          log(`[P2→P3] ${job.fileName} đã xóa subtitle xong và sẵn sàng cho Pipeline 3.`, 'success');
        }
      }
    });
  }

  function syncP1Ui() {
    const state = appState();
    if (!state) return;
    const cards = [...document.querySelectorAll('#step1-job-list .tk-job-card')];
    cards.forEach((card, index) => {
      if (!card.dataset.pipelineJobId && state.jobs[index]) card.dataset.pipelineJobId = state.jobs[index].id;
      const job = state.jobs.find(item => item.id === card.dataset.pipelineJobId) || state.jobs[index];
      if (!job) return;
      const status = card.querySelector('.p1-job-state');
      if (status) {
        status.textContent = p1Label(job.p1Status);
        status.className = `p1-job-state status-${job.p1Status}`;
      }
    });

    const selected = state.jobs.find(job => job.id === state.pipeline1SelectedJobId);
    const detailStatus = document.getElementById('step1-detail-status');
    if (detailStatus) {
      detailStatus.textContent = selected ? p1Label(selected.p1Status) : 'Chờ xử lý';
      detailStatus.dataset.state = selected?.p1Status || P1.IDLE;
    }

    const total = state.jobs.length;
    const done = state.jobs.filter(job => job.p1Status === P1.FINISHED).length;
    const count = document.getElementById('job-count');
    const complete = document.getElementById('p1-complete-count');
    const fill = document.getElementById('p1-total-progress-fill');
    if (count) count.textContent = `${total} video`;
    if (complete) complete.textContent = `Đã hoàn thành: ${done}/${total}`;
    if (fill) fill.style.width = `${total ? Math.round(done / total * 100) : 0}%`;
  }

  function syncP2Ui() {
    const state = appState();
    const list = document.getElementById('job-list');
    if (!state || !list) return;

    // Pipeline 2 is handoff-only: direct upload stays hidden from this step.
    const directUpload = document.getElementById('btn-open-file');
    if (directUpload) directUpload.style.display = 'none';
    document.getElementById('drop-zone')?.classList.add('hidden');

    const cards = [...list.querySelectorAll('.job-card')];
    cards.forEach((card, index) => {
      if (!card.dataset.pipelineJobId && state.jobs[index]) card.dataset.pipelineJobId = state.jobs[index].id;
      const job = state.jobs.find(item => item.id === card.dataset.pipelineJobId) || state.jobs[index];
      if (!job) return;
      if (!p2Eligible(job)) {
        card.remove();
        return;
      }
      const tag = card.querySelector('.status-tag');
      if (tag) tag.textContent = p2Label(job.p2Status);
      const progressText = `${Math.round(Number(job.p2Progress) || 0)}%`;
      const spans = card.querySelectorAll('.job-detail > span');
      if (spans[1]) spans[1].textContent = progressText;
      const bar = card.querySelector('.job-progress-fill');
      if (bar) bar.style.width = progressText;
    });

    if (!state.jobs.some(p2Eligible) && !list.querySelector('[data-pipeline-gate="p2-empty"]')) {
      list.innerHTML = '<div class="job-empty" data-pipeline-gate="p2-empty">Chưa có Job từ Pipeline 1.<br>Hãy hoàn tất Pipeline 1 trước.</div>';
    }
  }

  function syncP3Ui() {
    const state = appState();
    const list = document.getElementById('step3-job-list');
    if (!state || !list) return;
    const legacyFinished = state.jobs.filter(job => job.status === 'finished');
    [...list.querySelectorAll('.job-card')].forEach((card, index) => {
      if (!card.dataset.pipelineJobId && legacyFinished[index]) card.dataset.pipelineJobId = legacyFinished[index].id;
      const job = state.jobs.find(item => item.id === card.dataset.pipelineJobId) || legacyFinished[index];
      if (!job || job.p3Status !== 'ready') card.remove();
    });
    if (!state.jobs.some(job => job.p3Status === 'ready') && !list.querySelector('[data-pipeline-gate="p3-empty"]')) {
      list.innerHTML = '<div class="job-empty" data-pipeline-gate="p3-empty" style="text-align:center;color:var(--text-muted);margin-top:40px">Chưa có Job hoàn tất Pipeline 1 và Pipeline 2.</div>';
    }
  }

  function clearP2View() {
    const state = appState();
    if (state) state.activeJobId = null;
    ['meta-name','meta-res','meta-fps','meta-dur'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.textContent = '—';
    });
    const original = document.getElementById('canvas-original');
    const result = document.getElementById('canvas-result');
    original?.getContext?.('2d')?.clearRect(0, 0, original.width, original.height);
    result?.getContext?.('2d')?.clearRect(0, 0, result.width, result.height);
    document.getElementById('subtitle-overlay')?.replaceChildren();
    document.getElementById('result-placeholder')?.classList.remove('hidden');
    ['timeline-orig','timeline-result','btn-play-orig','btn-prev-orig','btn-next-orig','btn-play-result','btn-prev-result','btn-next-result'].forEach(id => {
      const element = document.getElementById(id);
      if (element) element.disabled = true;
    });
  }

  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      syncLegacyToPipelineState();
      syncP1Ui();
      syncP2Ui();
      syncP3Ui();
    });
  }

  function patchRender() {
    if (renderPatched || typeof window.renderJobList !== 'function') return false;
    const original = window.renderJobList;
    window.renderJobList = function pipelineAwareRender(...args) {
      ensureAll();
      const result = original.apply(this, args);
      scheduleSync();
      return result;
    };
    renderPatched = true;
    return true;
  }

  function selectEligibleP2Job() {
    const state = appState();
    if (!state) return;
    const active = state.jobs.find(job => job.id === state.activeJobId);
    if (active && p2Eligible(active)) return;
    const first = state.jobs.find(p2Eligible);
    if (first && typeof window.selectJob === 'function') window.selectJob(first.id);
    else clearP2View();
  }

  function startP2(job) {
    const state = appState();
    if (!state || !job || !p2Eligible(job)) return;
    if (state.jobs.some(item => isBusy(item.p1Status))) {
      notify('Pipeline 2 đang khóa trong khi hàng đợi Pipeline 1 còn chạy.', 'warning');
      return;
    }
    if (![P2.READY, P2.ERROR].includes(job.p2Status)) {
      notify(job.p2Status === P2.FINISHED ? 'Job này đã hoàn tất Pipeline 2.' : 'Job Pipeline 2 chưa sẵn sàng.', 'info');
      return;
    }

    // Pipeline 2 strict boundary: original video in, subtitle removal only.
    job.pipeline = 2;
    job.algorithm = document.getElementById('algo-select')?.value || job.algorithm || 'sttn-auto';
    job.maskMode = document.getElementById('mask-mode')?.value || job.maskMode || 'box';
    job.extractSrt = false;
    job.asrFallback = false;
    job.aiRewrite = false;
    job.ttsGenerate = false;
    job.status = 'queued';
    job.progress = 0;
    job.p2Status = P2.QUEUED;
    job.p2Progress = 0;
    window.renderJobList?.();

    if (typeof window.processNextJob === 'function') window.processNextJob();
    else {
      job.status = 'error';
      job.p2Status = P2.ERROR;
      notify('Pipeline 2 runner chưa sẵn sàng.', 'error');
    }
  }

  function bindGuards() {
    document.addEventListener('click', event => {
      const step = event.target.closest?.('.step-chevron');
      if (step?.dataset?.step === '2') {
        setTimeout(() => { selectEligibleP2Job(); scheduleSync(); }, 0);
      }

      const directUpload = event.target.closest?.('#btn-open-file');
      if (directUpload && activeStep() === '2') {
        event.preventDefault();
        event.stopImmediatePropagation();
        notify('Hãy thêm video từ Pipeline 1. Pipeline 2 chỉ nhận Job đã hoàn tất Pipeline 1.', 'warning');
        return;
      }

      const p2Start = event.target.closest?.('#btn-start');
      if (!p2Start) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const state = appState();
      const job = state?.jobs?.find(item => item.id === state.activeJobId);
      if (!job || !p2Eligible(job)) {
        notify('Job phải hoàn tất Pipeline 1 trước khi chạy Pipeline 2.', 'warning');
        return;
      }
      startP2(job);
    }, true);

    document.addEventListener('drop', event => {
      if (activeStep() !== '2') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      notify('Pipeline 2 không nhận video trực tiếp. Hãy thêm video ở Pipeline 1.', 'warning');
    }, true);
  }

  function observeLists() {
    const observer = new MutationObserver(scheduleSync);
    ['step1-job-list', 'job-list', 'step3-job-list'].forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element, { childList:true, subtree:true });
    });
  }

  function boot() {
    ensureAll();
    bindGuards();
    observeLists();

    const patchTimer = setInterval(() => {
      if (patchRender()) clearInterval(patchTimer);
    }, 50);
    setTimeout(() => clearInterval(patchTimer), 5000);

    setInterval(scheduleSync, 250);
    scheduleSync();
  }

  window.pipelineStateGate = { ensureAll, p2Eligible, scheduleSync };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();