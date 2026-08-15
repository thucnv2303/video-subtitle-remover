(function () {
  'use strict';

  const NAV_ID = 'nav-subtitle-remover';
  const VOICE_NAV_ID = 'nav-voice-render';
  const HOME_PAGE_ID = 'page-home';
  const MASK_OPTIONS = [
    ['box', 'Box'],
    ['tight', 'Tight'],
    ['soft', 'Soft'],
  ];

  let drawLatched = false;
  let standaloneActive = false;
  let restoreSnapshot = null;
  let regionObserver = null;
  let navObserver = null;
  let initialized = false;

  function getState() {
    return window._appState || null;
  }

  function getActiveJob() {
    const state = getState();
    return state?.jobs?.find((job) => job.id === state.activeJobId) || null;
  }

  function setDrawState(enabled) {
    const state = getState();
    const job = getActiveJob();
    const active = Boolean(enabled && job?.subtitleMode === 'manual');
    drawLatched = active;
    if (state) state.isDrawing = active;
    document.getElementById('btn-draw-region')?.classList.toggle('active', active);
    const canvasInner = document.getElementById('canvas-inner-orig');
    const canvas = document.getElementById('canvas-original');
    if (canvasInner) canvasInner.style.cursor = active ? 'crosshair' : '';
    if (canvas) canvas.style.cursor = active ? 'crosshair' : 'default';
  }

  function restoreLatchedDrawAfterRegion() {
    const job = getActiveJob();
    if (drawLatched && job?.subtitleMode === 'manual') setDrawState(true);
  }

  function decorateRegionMasks() {
    const job = getActiveJob();
    const list = document.getElementById('regions-list');
    if (!job || !list || !Array.isArray(job.regions)) return;

    [...list.querySelectorAll('.region-item')].forEach((item, index) => {
      const region = job.regions[index];
      if (!region || item.querySelector('.standalone-region-mask')) return;

      const select = document.createElement('select');
      select.className = 'dropdown standalone-region-mask';
      select.setAttribute('aria-label', `Mask cho vùng ${region.label || index + 1}`);
      select.style.marginLeft = 'auto';
      select.style.width = '92px';
      select.style.minWidth = '92px';
      select.style.padding = '4px 6px';

      MASK_OPTIONS.forEach(([value, label]) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = label;
        select.appendChild(option);
      });

      select.value = region.maskMode || job.maskMode || 'box';
      if (!region.maskMode) region.maskMode = select.value;
      select.addEventListener('change', () => {
        region.maskMode = select.value;
      });

      const deleteButton = item.querySelector('.btn-region-del');
      item.insertBefore(select, deleteButton || null);
    });
  }

  function installRegionObserver() {
    const list = document.getElementById('regions-list');
    if (!list || regionObserver) return;
    regionObserver = new MutationObserver(() => {
      decorateRegionMasks();
      queueMicrotask(restoreLatchedDrawAfterRegion);
    });
    regionObserver.observe(list, { childList: true, subtree: true });
    decorateRegionMasks();
  }

  function installMaskBridge() {
    if (!window.api?.startProcessBatch || window.api.startProcessBatch.__standaloneRegionMaskBridge) return;
    const original = window.api.startProcessBatch.bind(window.api);

    const wrapped = async function (jobs) {
      const state = getState();
      const processingJob = state?.jobs?.find((job) => job.id === state.processingJobId) || null;
      if (processingJob?.subtitleMode === 'manual' && Array.isArray(jobs) && jobs[0]) {
        const passIndex = Number(state.processingPassIndex || 0);
        const region = processingJob.regions?.[passIndex];
        if (region) jobs[0].mask_mode = region.maskMode || processingJob.maskMode || 'box';
      }
      return original(jobs);
    };

    wrapped.__standaloneRegionMaskBridge = true;
    window.api.startProcessBatch = wrapped;
  }

  function capturePipelineState() {
    const panes = ['1', '2', '3'].map((step) => document.getElementById(`step-${step}-content`));
    return {
      barDisplay: document.querySelector('.pipeline-bar-v2')?.style.display || '',
      panes: panes.map((pane) => pane ? { display: pane.style.display, active: pane.classList.contains('active') } : null),
      chevrons: [...document.querySelectorAll('.step-chevron')].map((item) => item.classList.contains('active')),
    };
  }

  function enterStandaloneMode() {
    const homePage = document.getElementById(HOME_PAGE_ID);
    const step2 = document.getElementById('step-2-content');
    if (!homePage || !step2) return;

    if (!standaloneActive) restoreSnapshot = capturePipelineState();
    standaloneActive = true;

    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.id === NAV_ID));
    document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page === homePage));

    const pipelineBar = document.querySelector('.pipeline-bar-v2');
    if (pipelineBar) pipelineBar.style.display = 'none';

    ['1', '2', '3'].forEach((step) => {
      const pane = document.getElementById(`step-${step}-content`);
      if (!pane) return;
      const isStep2 = step === '2';
      pane.classList.toggle('active', isStep2);
      pane.style.display = isStep2 ? '' : 'none';
    });

    installRegionObserver();
    decorateRegionMasks();
  }

  function exitStandaloneMode() {
    if (!standaloneActive) return;
    standaloneActive = false;

    const pipelineBar = document.querySelector('.pipeline-bar-v2');
    if (pipelineBar) pipelineBar.style.display = restoreSnapshot?.barDisplay || '';

    ['1', '2', '3'].forEach((step, index) => {
      const pane = document.getElementById(`step-${step}-content`);
      const saved = restoreSnapshot?.panes?.[index];
      if (!pane || !saved) return;
      pane.style.display = saved.display;
      pane.classList.toggle('active', saved.active);
    });

    [...document.querySelectorAll('.step-chevron')].forEach((item, index) => {
      item.classList.toggle('active', Boolean(restoreSnapshot?.chevrons?.[index]));
    });

    restoreSnapshot = null;
    setDrawState(false);
  }

  function mountNav() {
    if (document.getElementById(NAV_ID)) return true;
    const voiceNav = document.getElementById(VOICE_NAV_ID);
    if (!voiceNav) return false;

    const item = document.createElement('a');
    item.href = '#';
    item.id = NAV_ID;
    item.className = 'nav-item';
    item.dataset.page = 'subtitle-remover';
    item.title = 'Xóa Sub';
    item.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16"/><path d="M7 7l1 13h8l1-13"/><path d="M9 4h6v3"/></svg><span>Xóa Sub</span>';
    voiceNav.insertAdjacentElement('afterend', item);

    item.addEventListener('click', (event) => {
      event.preventDefault();
      enterStandaloneMode();
    });
    return true;
  }

  function installNavigation() {
    if (!mountNav()) {
      const menu = document.querySelector('.nav-menu');
      if (menu && !navObserver) {
        navObserver = new MutationObserver(() => {
          if (mountNav()) {
            navObserver.disconnect();
            navObserver = null;
          }
        });
        navObserver.observe(menu, { childList: true });
      }
    }

    document.addEventListener('click', (event) => {
      const navItem = event.target.closest?.('.nav-item');
      if (standaloneActive && navItem && navItem.id !== NAV_ID) exitStandaloneMode();
    }, true);
  }

  function installDrawGuards() {
    document.getElementById('btn-draw-region')?.addEventListener('click', () => {
      queueMicrotask(() => {
        const state = getState();
        const job = getActiveJob();
        setDrawState(Boolean(state?.isDrawing && job?.subtitleMode === 'manual'));
      });
    });

    document.getElementById('mode-auto')?.addEventListener('click', () => {
      queueMicrotask(() => setDrawState(false));
    });

    document.getElementById('mode-manual')?.addEventListener('click', () => {
      queueMicrotask(() => setDrawState(false));
    });

    document.getElementById('canvas-inner-orig')?.addEventListener('mouseup', () => {
      setTimeout(restoreLatchedDrawAfterRegion, 0);
    });
  }

  function init() {
    if (initialized || !getState() || !window.api) return false;
    initialized = true;
    installMaskBridge();
    installRegionObserver();
    installDrawGuards();
    installNavigation();
    return true;
  }

  if (!init()) {
    const timer = setInterval(() => {
      if (init()) clearInterval(timer);
    }, 50);
    setTimeout(() => clearInterval(timer), 10000);
  }
})();
