(function standaloneQueueActions() {
  'use strict';

  let patched = false;

  const state = () => window._appState || null;
  const isStandaloneJob = job => job?.standaloneSubtitleRemoval === true;
  const isRunnable = job => isStandaloneJob(job) && ['idle', 'error'].includes(job?.status);
  const notify = (message, type = 'info') => {
    if (typeof window.showToast === 'function') window.showToast(message, type);
    else window.addLog?.(`[Xóa Sub] ${message}`, type === 'error' ? 'error' : 'info');
  };

  function ensureSelection(job) {
    if (!isStandaloneJob(job)) return;
    if (typeof job.standaloneSelected !== 'boolean') {
      job.standaloneSelected = isRunnable(job);
    }
    if (!isRunnable(job)) job.standaloneSelected = false;
  }

  function selectedRunnableJobs() {
    return (state()?.jobs || []).filter(job => {
      ensureSelection(job);
      return isRunnable(job) && job.standaloneSelected === true;
    });
  }

  function configuredOutputDirectory() {
    const configured = String(state()?.outputDir || localStorage.getItem('output_dir') || '').trim();
    return configured.replace(/\\/g, '/');
  }

  function openConfiguredOutputDirectory() {
    const dir = configuredOutputDirectory();
    if (!dir) {
      notify('Chưa cấu hình thư mục lưu trữ trong Cài đặt.', 'warning');
      return;
    }
    window.electronAPI?.openPath?.(dir);
  }

  function runSelectedJobs() {
    const s = state();
    if (!s) return;

    const competing = (s.jobs || []).some(job => !isStandaloneJob(job) && ['queued', 'processing'].includes(job.status));
    if (competing) {
      notify('Hãy chờ pipeline chính hoàn tất trước khi chạy Xóa Sub.', 'warning');
      return;
    }

    const jobs = selectedRunnableJobs();
    if (!jobs.length) {
      notify('Chưa chọn video nào sẵn sàng để chạy.', 'warning');
      return;
    }

    jobs.forEach(job => {
      job.pipeline = 2;
      job.extractSrt = false;
      job.asrFallback = false;
      job.aiRewrite = false;
      job.ttsGenerate = false;
      job.status = 'queued';
      job.progress = 0;
      job.p2Status = 'queued';
      job.p2Progress = 0;
      job.p3Status = 'locked';
      job.standaloneSelected = false;
    });

    window.renderJobList?.();
    notify(`Đã đưa ${jobs.length} video đã chọn vào hàng đợi.`, 'success');
    window.processNextJob?.();
  }

  function setAllRunnable(selected) {
    (state()?.jobs || []).forEach(job => {
      if (isStandaloneJob(job)) {
        ensureSelection(job);
        job.standaloneSelected = isRunnable(job) ? selected : false;
      }
    });
    decorateStandaloneQueue();
  }

  function ensureActionControls() {
    const actions = document.getElementById('standalone-subtitle-actions');
    if (!actions) return;

    const runButton = document.getElementById('standalone-run-all');
    if (runButton) {
      runButton.textContent = '▶ Chạy đã chọn';
      runButton.title = 'Chỉ chạy các video đang được tick';
    }

    if (!document.getElementById('standalone-select-all-wrap')) {
      const label = document.createElement('label');
      label.id = 'standalone-select-all-wrap';
      label.style.cssText = 'display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-size:11px;color:#a9bbcc;cursor:pointer';
      label.innerHTML = '<input id="standalone-select-all" type="checkbox"> <span>Chọn tất cả</span>';
      actions.appendChild(label);
      label.querySelector('input')?.addEventListener('change', event => {
        setAllRunnable(Boolean(event.target.checked));
      });
    }

    if (!document.getElementById('standalone-open-output-dir')) {
      const button = document.createElement('button');
      button.id = 'standalone-open-output-dir';
      button.type = 'button';
      button.className = 'p2-btn p2-sync-btn';
      button.textContent = '📁 Mở thư mục lưu trữ';
      button.title = 'Mở thư mục đầu ra đang cấu hình trong Cài đặt';
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openConfiguredOutputDirectory();
      });
      actions.appendChild(button);
    }
  }

  function decorateJobCards() {
    const s = state();
    const list = document.getElementById('job-list');
    if (!s || !list || s.standaloneSubtitleMode !== true) return;

    const cards = [...list.querySelectorAll('.job-card')];
    cards.forEach((card, index) => {
      const jobId = card.dataset.jobId || card.dataset.pipelineJobId;
      const job = (jobId && s.jobs.find(item => item.id === jobId)) || s.jobs[index] || null;
      if (!isStandaloneJob(job)) return;
      ensureSelection(job);

      card.querySelector('.open-fp')?.remove();

      let checkbox = card.querySelector('.standalone-job-select');
      if (!checkbox) {
        checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'standalone-job-select';
        checkbox.title = 'Chọn job này để chạy';
        checkbox.setAttribute('aria-label', `Chọn ${job.fileName || 'video'} để chạy`);
        checkbox.style.cssText = 'position:absolute;left:8px;top:10px;width:15px;height:15px;cursor:pointer;z-index:3';
        card.style.position = 'relative';
        card.style.paddingLeft = '30px';
        card.prepend(checkbox);
        checkbox.addEventListener('click', event => event.stopPropagation());
        checkbox.addEventListener('change', event => {
          job.standaloneSelected = Boolean(event.target.checked) && isRunnable(job);
          updateSelectionUi();
        });
      }

      checkbox.checked = job.standaloneSelected === true;
      checkbox.disabled = !isRunnable(job);
    });
  }

  function updateSelectionUi() {
    const runnable = (state()?.jobs || []).filter(isRunnable);
    runnable.forEach(ensureSelection);
    const selectedCount = runnable.filter(job => job.standaloneSelected === true).length;
    const selectAll = document.getElementById('standalone-select-all');
    if (selectAll) {
      selectAll.checked = runnable.length > 0 && selectedCount === runnable.length;
      selectAll.indeterminate = selectedCount > 0 && selectedCount < runnable.length;
      selectAll.disabled = runnable.length === 0;
    }

    const runButton = document.getElementById('standalone-run-all');
    if (runButton) {
      runButton.textContent = selectedCount > 0 ? `▶ Chạy đã chọn (${selectedCount})` : '▶ Chạy đã chọn';
      runButton.disabled = selectedCount === 0;
    }
  }

  function decorateStandaloneQueue() {
    if (state()?.standaloneSubtitleMode !== true) return;
    ensureActionControls();
    decorateJobCards();
    updateSelectionUi();
  }

  function patchRenderer() {
    if (patched || typeof window.renderJobList !== 'function') return false;
    const original = window.renderJobList;
    window.renderJobList = function standaloneQueueAwareRenderJobList(...args) {
      const result = original.apply(this, args);
      decorateStandaloneQueue();
      return result;
    };
    patched = true;
    decorateStandaloneQueue();
    return true;
  }

  document.addEventListener('click', event => {
    const runButton = event.target.closest?.('#standalone-run-all');
    if (runButton && state()?.standaloneSubtitleMode === true) {
      event.preventDefault();
      event.stopImmediatePropagation();
      runSelectedJobs();
      return;
    }
    if (event.target.closest?.('#nav-subtitle-remover')) {
      queueMicrotask(decorateStandaloneQueue);
    }
  }, true);

  if (!patchRenderer()) {
    const timer = setInterval(() => {
      if (patchRenderer()) clearInterval(timer);
    }, 50);
    setTimeout(() => clearInterval(timer), 5000);
  }
})();
