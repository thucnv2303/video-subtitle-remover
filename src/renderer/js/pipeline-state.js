(function pipelineStateGate() {
  'use strict';

  const P1 = { IDLE:'idle', QUEUED:'queued', PROCESSING:'processing', FINISHED:'finished', ERROR:'error' };
  const P2 = { LOCKED:'locked', READY:'ready', QUEUED:'queued', PROCESSING:'processing', FINISHED:'finished', ERROR:'error' };
  const LEGACY_P2_READY = 'p2-ready';
  let renderPatched = false;
  let syncScheduled = false;

  const state = () => window._appState || null;
  const busy = value => value === 'queued' || value === 'processing';
  const activeStep = () => document.querySelector('.step-chevron.active')?.dataset?.step || '1';
  const standaloneMode = () => state()?.standaloneSubtitleMode === true;
  const isStandaloneJob = job => job?.standaloneSubtitleRemoval === true;
  const toast = (message, type='info') => typeof window.showToast === 'function'
    ? window.showToast(message, type)
    : window.addLog?.(message, type === 'error' ? 'error' : 'info');

  function p1Label(value) {
    return ({ idle:'Chờ xử lý', queued:'Đang chờ', processing:'Đang xử lý', finished:'Phân tích xong', error:'Lỗi' })[value] || value;
  }

  function p2Label(value) {
    return ({ locked:'Chờ Pipeline 1', ready:'Sẵn sàng', queued:'Đang chờ', processing:'Đang xóa sub', finished:'Đã xóa sub', error:'Lỗi' })[value] || value;
  }

  function ensureJob(job) {
    if (!job) return;
    if (job._pipelineStateVersion !== 1) {
      job.p1Status = P1.IDLE;
      job.p1Progress = 0;
      job.p2Status = isStandaloneJob(job) ? P2.READY : P2.LOCKED;
      job.p2Progress = 0;
      job.p3Status = 'locked';
      job._pipelineStateVersion = 1;
    }
    job.p1Status ||= P1.IDLE;
    job.p2Status ||= isStandaloneJob(job) ? P2.READY : P2.LOCKED;
    job.p3Status ||= 'locked';
    if (isStandaloneJob(job) && job.p2Status === P2.LOCKED) job.p2Status = P2.READY;
  }

  function ensureAll() {
    const jobs = state()?.jobs || [];
    jobs.forEach(ensureJob);
    return jobs;
  }

  function p2Eligible(job, useStandaloneMode = standaloneMode()) {
    if (!job) return false;
    if (useStandaloneMode) return isStandaloneJob(job) && job.p2Status !== P2.LOCKED;
    return !isStandaloneJob(job) && job.p1Status === P1.FINISHED && job.p2Status !== P2.LOCKED;
  }

  function syncLegacyState() {
    ensureAll().forEach(job => {
      if (isStandaloneJob(job)) {
        job.p1Status = P1.IDLE;
        job.p1Progress = 0;
        job.p3Status = 'locked';
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
          } else if (job.status === 'finished') {
            job.p2Status = P2.FINISHED;
            job.p2Progress = 100;
          }
        } else if (job.status === 'idle' && !busy(job.p2Status) && job.p2Status !== P2.FINISHED) {
          job.p2Status = P2.READY;
          job.p2Progress = 0;
        }
        return;
      }

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
          job.status = 'idle';
          job.progress = 0;
        } else if (job.status === 'idle' && busy(job.p1Status)) {
          job.p1Status = P1.IDLE;
          job.p1Progress = 0;
          job.p2Status = P2.LOCKED;
        } else if (job.status === 'finished' && job.p1Status !== P1.FINISHED) {
          job.p1Status = P1.FINISHED;
          job.p1Progress = 100;
          job.p2Status = P2.READY;
          job.p2Progress = 0;
          job.p3Status = 'locked';
          job.status = LEGACY_P2_READY;
          job.progress = 0;
          window.addLog?.(`[P1→P2] ${job.fileName} đã hoàn tất Pipeline 1 và được mở khóa cho Pipeline 2.`, 'success');
        }
      }

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
          window.addLog?.(`[P2→P3] ${job.fileName} đã xóa subtitle xong và sẵn sàng cho Pipeline 3.`, 'success');
        }
      }
    });
  }

  function syncP1Ui() {
    const s = state();
    if (!s) return;
    const pipelineJobs = s.jobs.filter(job => !isStandaloneJob(job));
    [...document.querySelectorAll('#step1-job-list .tk-job-card')].forEach((card, index) => {
      const sourceJob = s.jobs[index];
      if (sourceJob && isStandaloneJob(sourceJob)) {
        card.remove();
        return;
      }
      if (!card.dataset.pipelineJobId && sourceJob) card.dataset.pipelineJobId = sourceJob.id;
      const job = s.jobs.find(item => item.id === card.dataset.pipelineJobId) || sourceJob;
      const chip = card.querySelector('.p1-job-state');
      if (job && chip) {
        chip.textContent = p1Label(job.p1Status);
        chip.className = `p1-job-state status-${job.p1Status}`;
      }
    });

    const selected = s.jobs.find(job => job.id === s.pipeline1SelectedJobId && !isStandaloneJob(job));
    const detail = document.getElementById('step1-detail-status');
    if (detail) {
      detail.textContent = selected ? p1Label(selected.p1Status) : 'Chờ xử lý';
      detail.dataset.state = selected?.p1Status || P1.IDLE;
    }

    const total = pipelineJobs.length;
    const done = pipelineJobs.filter(job => job.p1Status === P1.FINISHED).length;
    const count = document.getElementById('job-count');
    const complete = document.getElementById('p1-complete-count');
    const fill = document.getElementById('p1-total-progress-fill');
    if (count) count.textContent = `${total} video`;
    if (complete) complete.textContent = `Đã hoàn thành: ${done}/${total}`;
    if (fill) fill.style.width = `${total ? Math.round(done / total * 100) : 0}%`;
  }

  function syncP2Ui() {
    const s = state();
    const list = document.getElementById('job-list');
    if (!s || !list) return;
    const standalone = standaloneMode();

    const upload = document.getElementById('btn-open-file');
    if (upload) {
      upload.style.display = standalone ? '' : 'none';
      if (standalone) upload.textContent = '+ Thêm Video';
    }
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) dropZone.classList.toggle('hidden', !standalone);

    [...list.querySelectorAll('.job-card')].forEach((card, index) => {
      if (!card.dataset.pipelineJobId && s.jobs[index]) card.dataset.pipelineJobId = s.jobs[index].id;
      const job = s.jobs.find(item => item.id === card.dataset.pipelineJobId) || s.jobs[index];
      if (!job) return;
      if (!p2Eligible(job, standalone)) {
        card.remove();
        return;
      }
      const tag = card.querySelector('.status-tag');
      if (tag) tag.textContent = p2Label(job.p2Status);
      const pct = `${Math.round(Number(job.p2Progress) || 0)}%`;
      const spans = card.querySelectorAll('.job-detail > span');
      if (spans[1]) spans[1].textContent = pct;
      const bar = card.querySelector('.job-progress-fill');
      if (bar) bar.style.width = pct;
    });

    if (!s.jobs.some(job => p2Eligible(job, standalone))) {
      const message = standalone
        ? 'Chưa có video. Bấm “+ Thêm Video” hoặc kéo thả nhiều video vào đây.'
        : 'Chưa có Job từ Pipeline 1.<br>Hãy hoàn tất Pipeline 1 trước.';
      list.innerHTML = `<div class="job-empty" data-pipeline-gate="p2-empty">${message}</div>`;
    }

    const selected = s.jobs.find(job => job.id === s.activeJobId);
    const start = document.getElementById('btn-start');
    if (start && (activeStep() === '2' || standalone)) {
      const blockedByP1 = !standalone && s.jobs.some(job => !isStandaloneJob(job) && busy(job.p1Status));
      start.disabled = !selected || !p2Eligible(selected, standalone) || ![P2.READY, P2.ERROR].includes(selected.p2Status) || blockedByP1;
    }
  }

  function syncP3Ui() {
    const s = state();
    const list = document.getElementById('step3-job-list');
    if (!s || !list) return;
    const legacyFinished = s.jobs.filter(job => job.status === 'finished' && !isStandaloneJob(job));
    [...list.querySelectorAll('.job-card')].forEach((card, index) => {
      if (!card.dataset.pipelineJobId && legacyFinished[index]) card.dataset.pipelineJobId = legacyFinished[index].id;
      const job = s.jobs.find(item => item.id === card.dataset.pipelineJobId) || legacyFinished[index];
      if (!job || isStandaloneJob(job) || job.p3Status !== 'ready') card.remove();
    });
    if (!s.jobs.some(job => !isStandaloneJob(job) && job.p3Status === 'ready') && !list.querySelector('[data-pipeline-gate="p3-empty"]')) {
      list.innerHTML = '<div class="job-empty" data-pipeline-gate="p3-empty" style="text-align:center;color:var(--text-muted);margin-top:40px">Chưa có Job hoàn tất Pipeline 1 và Pipeline 2.</div>';
    }
  }

  function clearP2View() {
    const s = state();
    if (s) s.activeJobId = null;
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

  function selectP2Job() {
    const s = state();
    if (!s) return;
    const standalone = standaloneMode();
    const current = s.jobs.find(job => job.id === s.activeJobId);
    const target = current && p2Eligible(current, standalone)
      ? current
      : s.jobs.find(job => p2Eligible(job, standalone));
    if (target && typeof window.selectJob === 'function') {
      window.selectJob(target.id);
      return;
    }
    clearP2View();
  }

  function startP2(job) {
    const s = state();
    const standalone = isStandaloneJob(job);
    if (!s || !job || !p2Eligible(job, standalone)) return false;
    if (!standalone && s.jobs.some(item => !isStandaloneJob(item) && busy(item.p1Status))) {
      toast('Pipeline 2 đang khóa trong khi hàng đợi Pipeline 1 còn chạy.', 'warning');
      return false;
    }
    if (![P2.READY, P2.ERROR].includes(job.p2Status)) {
      toast(job.p2Status === P2.FINISHED ? 'Job này đã hoàn tất Pipeline 2.' : 'Job Pipeline 2 chưa sẵn sàng.', 'info');
      return false;
    }

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
    if (standalone) job.p3Status = 'locked';
    window.renderJobList?.();

    if (typeof window.processNextJob === 'function') {
      window.processNextJob();
      return true;
    }
    job.status = 'error';
    job.p2Status = P2.ERROR;
    toast('Pipeline 2 runner chưa sẵn sàng.', 'error');
    return false;
  }

  function startAllStandalone() {
    const s = state();
    if (!s || !standaloneMode()) return 0;
    const jobs = s.jobs.filter(job => isStandaloneJob(job) && [P2.READY, P2.ERROR].includes(job.p2Status));
    jobs.forEach(job => {
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
      job.p3Status = 'locked';
    });
    window.renderJobList?.();
    if (jobs.length && typeof window.processNextJob === 'function') window.processNextJob();
    return jobs.length;
  }

  function scheduleSync() {
    if (syncScheduled) return;
    syncScheduled = true;
    requestAnimationFrame(() => {
      syncScheduled = false;
      syncLegacyState();
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

  function bindGuards() {
    document.addEventListener('click', event => {
      const step = event.target.closest?.('.step-chevron');
      if (step?.dataset?.step === '2') setTimeout(() => { selectP2Job(); scheduleSync(); }, 0);

      const upload = event.target.closest?.('#btn-open-file');
      if (upload && activeStep() === '2' && !standaloneMode()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        toast('Hãy thêm video từ Pipeline 1. Pipeline 2 chỉ nhận Job đã hoàn tất Pipeline 1.', 'warning');
        return;
      }

      const start = event.target.closest?.('#btn-start');
      if (!start) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const s = state();
      const job = s?.jobs?.find(item => item.id === s.activeJobId);
      const standalone = standaloneMode();
      if (!job || !p2Eligible(job, standalone)) {
        toast(standalone ? 'Hãy chọn một video standalone trước khi chạy.' : 'Job phải hoàn tất Pipeline 1 trước khi chạy Pipeline 2.', 'warning');
        return;
      }
      startP2(job);
    }, true);

    document.addEventListener('drop', event => {
      if (activeStep() !== '2' && !standaloneMode()) return;
      if (standaloneMode()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      toast('Pipeline 2 không nhận video trực tiếp. Hãy thêm video ở Pipeline 1.', 'warning');
    }, true);
  }

  function observeLists() {
    const observer = new MutationObserver(scheduleSync);
    ['step1-job-list','job-list','step3-job-list'].forEach(id => {
      const element = document.getElementById(id);
      if (element) observer.observe(element, { childList:true, subtree:true });
    });
  }

  function boot() {
    ensureAll();
    bindGuards();
    observeLists();
    const timer = setInterval(() => { if (patchRender()) clearInterval(timer); }, 50);
    setTimeout(() => clearInterval(timer), 5000);
    setInterval(scheduleSync, 250);
    scheduleSync();
  }

  window.pipelineStateGate = { ensureAll, p2Eligible, selectP2Job, startP2, startAllStandalone, scheduleSync };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true });
  else boot();
})();