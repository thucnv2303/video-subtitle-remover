(function standaloneOutputFolderAction() {
  'use strict';

  let patched = false;

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
    return Number(job.p2Progress ?? job.progress ?? 0) >= 100;
  }

  function findJobForCard(card, standaloneJobs, index) {
    const jobId = card.dataset.jobId || card.dataset.pipelineJobId;
    if (jobId) {
      const exact = state()?.jobs?.find(item => item.id === jobId);
      if (exact) return exact;
    }
    return standaloneJobs[index] || null;
  }

  function installFolderAction(card, job) {
    if (!card || !job || !isStandaloneJob(job) || !isCompleted(job)) return;
    const dir = outputDirectory(job);
    if (!dir) return;

    const detail = card.querySelector('.job-detail') || card;
    let button = card.querySelector('.open-fp');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn btn-xs btn-ghost open-fp';
      detail.appendChild(button);
    }

    button.dataset.openOutputFolder = 'true';
    button.textContent = '📁';
    button.title = 'Mở thư mục lưu trữ';
    button.setAttribute('aria-label', `Mở thư mục lưu trữ của ${job.fileName || 'video'}`);
    button.style.cssText = 'margin-left:8px;padding:2px 6px;line-height:1;cursor:pointer;flex:0 0 auto';
    button.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      window.electronAPI?.openPath?.(dir);
    };
  }

  function renderFolderActions() {
    const s = state();
    const list = document.getElementById('job-list');
    if (!s || !list || s.standaloneSubtitleMode !== true) return;

    const standaloneJobs = (s.jobs || []).filter(isStandaloneJob);
    const cards = [...list.querySelectorAll('.job-card')].filter(card => card.style.display !== 'none');
    cards.forEach((card, index) => installFolderAction(card, findJobForCard(card, standaloneJobs, index)));
  }

  function patchRenderer() {
    if (patched || typeof window.renderJobList !== 'function') return false;
    const original = window.renderJobList;
    window.renderJobList = function standaloneFolderAwareRenderJobList(...args) {
      const result = original.apply(this, args);
      renderFolderActions();
      return result;
    };
    patched = true;
    renderFolderActions();
    return true;
  }

  if (!patchRenderer()) {
    const timer = setInterval(() => {
      if (patchRenderer()) clearInterval(timer);
    }, 50);
    setTimeout(() => clearInterval(timer), 5000);
  }

  document.addEventListener('click', event => {
    if (event.target.closest?.('#nav-subtitle-remover, #p2-refresh-jobs')) {
      queueMicrotask(renderFolderActions);
    }
  }, true);
})();
