(function standaloneOutputFolderAction() {
  'use strict';

  let observer = null;
  let scheduled = false;

  const state = () => window._appState || null;
  const isStandaloneJob = job => job?.standaloneSubtitleRemoval === true;

  function outputDirectory(job) {
    const outputPath = String(job?.finalOutputPath || job?.outputPath || '').trim();
    if (!outputPath) return '';
    const normalized = outputPath.replace(/\\/g, '/');
    const slash = normalized.lastIndexOf('/');
    return slash > 0 ? normalized.slice(0, slash) : normalized;
  }

  function isCompleted(job) {
    if (!job) return false;
    if (job.status === 'finished' || job.p2Status === 'finished') return true;
    const progress = Number(job.p2Progress ?? job.progress ?? 0);
    return progress >= 100 && Boolean(job.finalOutputPath || job.outputPath);
  }

  function resolveCardJob(card, standaloneJobs, index) {
    const jobId = card.dataset.jobId || card.dataset.pipelineJobId;
    if (jobId) {
      const exact = state()?.jobs?.find(item => item.id === jobId);
      if (exact) return exact;
    }
    return standaloneJobs[index] || null;
  }

  function decorateCompletedJobs() {
    scheduled = false;
    const s = state();
    const list = document.getElementById('job-list');
    if (!s || !list || s.standaloneSubtitleMode !== true) return;

    const standaloneJobs = (s.jobs || []).filter(isStandaloneJob);
    const visibleCards = [...list.querySelectorAll('.job-card')].filter(card => card.style.display !== 'none');

    visibleCards.forEach((card, index) => {
      const job = resolveCardJob(card, standaloneJobs, index);
      if (!job || !isStandaloneJob(job) || !isCompleted(job)) return;

      const dir = outputDirectory(job);
      if (!dir) return;

      let button = card.querySelector('[data-open-output-folder="true"]');
      if (!button) {
        const legacy = card.querySelector('.open-fp');
        if (legacy) {
          button = legacy.cloneNode(false);
          legacy.replaceWith(button);
        } else {
          button = document.createElement('button');
          button.type = 'button';
          button.className = 'btn btn-xs btn-ghost open-fp';
          button.style.cssText = 'margin-left:8px;padding:2px 6px;line-height:1;cursor:pointer';
          (card.querySelector('.job-detail') || card).appendChild(button);
        }
      }

      if (button.dataset.openOutputFolder === 'true') return;
      button.dataset.openOutputFolder = 'true';
      button.textContent = '📁';
      button.title = 'Mở thư mục lưu trữ';
      button.setAttribute('aria-label', `Mở thư mục lưu trữ của ${job.fileName || 'video'}`);
      button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        window.electronAPI?.openPath?.(dir);
      });
    });
  }

  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(decorateCompletedJobs);
  }

  function init() {
    const list = document.getElementById('job-list');
    if (!list || observer) return false;
    observer = new MutationObserver(scheduleDecorate);
    observer.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-job-id', 'data-pipeline-job-id']
    });
    document.addEventListener('click', event => {
      if (event.target.closest?.('#nav-subtitle-remover, #p2-refresh-jobs')) scheduleDecorate();
    }, true);
    scheduleDecorate();
    return true;
  }

  if (!init()) {
    const timer = setInterval(() => {
      if (init()) clearInterval(timer);
    }, 50);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();
