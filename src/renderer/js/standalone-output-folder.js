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

  function decorateCompletedJobs() {
    scheduled = false;
    const s = state();
    const list = document.getElementById('job-list');
    if (!s || !list || s.standaloneSubtitleMode !== true) return;

    list.querySelectorAll('.job-card').forEach(card => {
      const jobId = card.dataset.jobId || card.dataset.pipelineJobId;
      const job = s.jobs?.find(item => item.id === jobId);
      if (!job || !isStandaloneJob(job) || job.status !== 'finished') return;

      const dir = outputDirectory(job);
      if (!dir) return;

      const oldButton = card.querySelector('.open-fp');
      let button = oldButton;
      if (oldButton && oldButton.dataset.openOutputFolder !== 'true') {
        button = oldButton.cloneNode(true);
        oldButton.replaceWith(button);
      }
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-xs btn-ghost open-fp';
        button.style.cssText = 'margin-left:8px;padding:2px 6px';
        card.querySelector('.job-detail')?.appendChild(button);
      }
      if (!button || button.dataset.openOutputFolder === 'true') return;

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
    observer.observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-job-id'] });
    document.addEventListener('click', event => {
      if (event.target.closest?.('#nav-subtitle-remover')) queueMicrotask(scheduleDecorate);
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
