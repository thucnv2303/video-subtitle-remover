(function () {
  'use strict';

  const NAV_ID = 'nav-subtitle-remover';
  const HOME_PAGE_ID = 'page-home';
  const PIPELINE_BAR_SELECTOR = '.pipeline-bar-v2';
  const STEP_IDS = ['step-1-content', 'step-2-content', 'step-3-content'];
  const MASK_OPTIONS = ['box', 'tight', 'soft'];

  let standaloneActive = false;
  let previousStep = '1';
  let manualDrawLatched = false;
  let regionObserver = null;

  function appState() {
    return window._appState || null;
  }

  function activeJob() {
    const state = appState();
    return state?.jobs?.find((job) => job.id === state.activeJobId) || null;
  }

  function setDrawVisual(active) {
    const state = appState();
    const job = activeJob();
    const enabled = Boolean(active && job?.subtitleMode === 'manual');
    if (state) state.isDrawing = enabled;
    document.getElementById('btn-draw-region')?.classList.toggle('active', enabled);
    const canvasInner = document.getElementById('canvas-inner-orig');
    const canvas = document.getElementById('canvas-original');
    if (canvasInner) canvasInner.style.cursor = enabled ? 'crosshair' : '';
    if (canvas) canvas.style.cursor = enabled ? 'crosshair' : 'default';
    manualDrawLatched = enabled;
  }

  function syncDrawState() {
    const job = activeJob();
    if (!job || job.subtitleMode !== 'manual') {
      setDrawVisual(false);
      return;
    }
    if (manualDrawLatched) setDrawVisual(true);
  }

  function decorateRegionMasks() {
    const job = activeJob();
    const list = document.getElementById('regions-list');
    if (!job || !list) return;
    const items = [...list.querySelectorAll('.region-item')];
    items.forEach((item, index) => {
      const region = job.regions?.[index];
      if (!region || item.querySelector('.standalone-region-mask')) return;
      const select = document.createElement('select');
      select.className = 'standalone-region-mask';
      select.setAttribute('aria-label', `Mask cho vùng ${region.label || index + 1}`);
      MASK_OPTIONS.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value === 'box' ? 'Box' : value === 'tight' ? 'Tight' : 'Soft';
        select.appendChild(option);
      });
      select.value = region.maskMode || job.maskMode || 'box';
      if (!region.maskMode) region.maskMode = select.value;
      select.addEventListener('change', () => { region.maskMode = select.value; });
      item.insertBefore(select, item.querySelector('.btn-region-del'));
    });
  }

  function installRegionObserver() {
    const list = document.getElementById('regions-list');
    if (!list || regionObserver) return;
    regionObserver = new MutationObserver(() => {
      decorateRegionMasks();
      if (manualDrawLatched) queueMicrotask(syncDrawState);
    });
    regionObserver.observe(list, { childList: true, subtree: true });
    decorateRegionMasks();
  }

  function installApiMaskBridge() {
    if (!window.api?.startProcessBatch || window.api.startProcessBatch.__standaloneMaskBridge) return;
    const original = window.api.startProcessBatch.bind(window.api);
    const wrapped = async function (batch, ...rest) {
      const state = appState();
      const job = activeJob();
      if (job?.subtitleMode === 'manual' && Array.isArray(batch) && batch[0]) {
        const region = job.regions?.[state?.processingPassIndex || 0];
        if (region) batch[0].mask_mode = region.maskMode || job.maskMode || 'box';
      }
      return original(batch, ...rest);
    };
    wrapped.__standaloneMaskBridge = true;
    window.api.startProcessBatch = wrapped;
  }

  function mountNav() {
    const menu = document.querySelector('.nav-menu');
    const voice = document.getElementById('nav-voice-render');
    if (!menu || !voice) return false;
    if (document.getElementById(NAV_ID)) return true;
    const item = document.createElement('a');
    item.href = '#';
    item.id = NAV_ID;
    item.className = 'nav-item';
    item.dataset.page = 'subtitle-remover';
    item.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16"/><path d="M7 7l1 13h8l1-13"/><path d="M9 4h6v3"/></svg><span>Xóa Sub</span>';
    voice.insertAdjacentElement('afterend', item);
    item.addEventListener('click', (event) => {
      event.preventDefault();
      enterStandalone();
    });
    return true;
  }

  function enterStandalone() {
    const home = document.getElementById(HOME_PAGE_ID);
    const step2 = document.getElementById('step-2-content');
    if (!home || !step2) return;
    const activeStep = document.querySelector('.step-chevron.active')?.dataset.step;
    if (!standaloneActive && activeStep) previousStep = activeStep;
    standaloneActive = true;
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.id === NAV_ID));
    document.querySelectorAll('.page').forEach((page) => page.classList.toggle('active', page === home));
    const bar = document.querySelector(PIPELINE_BAR_SELECTOR);
    if (bar) bar.style.display = 'none';
    STEP_IDS.forEach((id) => {
      const pane = document.getElementById(id);
      if (!pane) return;
      const isStep2 = id === 'step-2-content';
      pane.classList.toggle('active', isStep2);
      pane.style.display = isStep2 ? '' : 'none';
    });
    installRegionObserver();
    decorateRegionMasks();
  }

  function exitStandalone() {
    if (!standaloneActive) return;
    standaloneActive = false;
    const bar = document.querySelector(PIPELINE_BAR_SELECTOR);
    if (bar) bar.style.display = '';
    STEP_IDS.forEach((id, index) => {
      const pane = document.getElementById(id);
      if (!pane) return;
      pane.style.display = '';
      pane.classList.toggle('active', String(index + 1) === previousStep);
    });
    document.querySelectorAll('.step-chevron').forEach((step) => step.classList.toggle('active', step.dataset.step === previousStep));
    setDrawVisual(false);
  }

  function bindModeAndDrawGuards() {
    document.getElementById('btn-draw-region')?.addEventListener('click', () => {
      const job = activeJob();
      if (job?.subtitleMode !== 'manual') {
        manualDrawLatched = false;
        queueMicrotask(() => setDrawVisual(false));
        return;
      }
      manualDrawLatched = !manualDrawLatched;
      queueMicrotask(() => setDrawVisual(manualDrawLatched));
    });

    document.getElementById('mode-auto')?.addEventListener('click', () => {
      manualDrawLatched = false;
      queueMicrotask(() => setDrawVisual(false));
    });

    document.getElementById('mode-manual')?.addEventListener('click', () => {
      manualDrawLatched = false;
      queueMicrotask(() => setDrawVisual(false));
    });

    document.getElementById('canvas-inner-orig')?.addEventListener('mouseup', () => {
      if (manualDrawLatched) queueMicrotask(() => setDrawVisual(true));
    });
  }

  function bindNavigationExit() {
    document.addEventListener('click', (event) => {
      const item = event.target.closest?.('.nav-item');
      if (standaloneActive && item && item.id !== NAV_ID) exitStandalone();
    }, true);
  }

  function init() {
    installApiMaskBridge();
    installRegionObserver();
    bindModeAndDrawGuards();
    bindNavigationExit();
    if (!mountNav()) {
      const menu = document.querySelector('.nav-menu');
      if (menu) {
        const observer = new MutationObserver(() => {
          if (mountNav()) observer.disconnect();
        });
        observer.observe(menu, { childList: true });
      }
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
