(function () {
  'use strict';

  const NAV_ID = 'nav-subtitle-remover';
  const STANDALONE_CLASS = 'subtitle-remover-standalone';
  const MASK_OPTIONS = [
    ['box', 'Hộp (Box)'],
    ['tight', 'Chặt (Tight)'],
    ['soft', 'Mềm (Soft)'],
  ];

  let standaloneActive = false;
  let apiWrapped = false;
  let regionsObserver = null;

  function appState() {
    return window._appState || null;
  }

  function activeJob() {
    const state = appState();
    if (!state?.activeJobId || !Array.isArray(state.jobs)) return null;
    return state.jobs.find((job) => job.id === state.activeJobId) || null;
  }

  function ensureStyles() {
    if (document.querySelector('style[data-subtitle-remover-standalone]')) return;
    const style = document.createElement('style');
    style.dataset.subtitleRemoverStandalone = 'true';
    style.textContent = `
      body.${STANDALONE_CLASS} #page-home { display: block; }
      body.${STANDALONE_CLASS} #page-home .pipeline-bar-v2 { display: none !important; }
      body.${STANDALONE_CLASS} #step-1-content,
      body.${STANDALONE_CLASS} #step-3-content { display: none !important; }
      body.${STANDALONE_CLASS} #step-2-content { display: block !important; }
      body.${STANDALONE_CLASS} #step-2-content::before {
        content: 'Xóa Sub';
        display: block;
        font-size: 22px;
        font-weight: 700;
        line-height: 1.25;
        padding: 14px 18px 4px;
      }
      body.${STANDALONE_CLASS} #step-2-content::after {
        content: 'Công cụ độc lập dùng trực tiếp Pipeline 2 hiện có.';
        display: block;
        color: var(--text-muted, #8a8f98);
        font-size: 13px;
        padding: 0 18px 10px;
        order: -1;
      }
      #canvas-inner-orig.subtitle-drawing-active { cursor: crosshair !important; }
      .region-mask-select {
        margin-left: auto;
        min-width: 116px;
        max-width: 140px;
        padding: 4px 7px;
        border-radius: 5px;
        border: 1px solid var(--border, #333842);
        background: var(--surface, #181b20);
        color: var(--text, #e6e9ee);
        font-size: 11px;
      }
    `;
    document.head.appendChild(style);
  }

  function placeNav() {
    const menu = document.querySelector('.nav-menu');
    if (!menu) return;
    let item = document.getElementById(NAV_ID);
    if (!item) {
      item = document.createElement('a');
      item.href = '#';
      item.id = NAV_ID;
      item.className = 'nav-item';
      item.dataset.page = 'subtitle-remover';
      item.title = 'Xóa Sub';
      item.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2"/>
          <path d="M7 15h4M13 15h4M8 11h8"/>
          <path d="M5 3l14 18"/>
        </svg><span>Xóa Sub</span>`;
      item.addEventListener('click', (event) => {
        event.preventDefault();
        activateStandalone();
      });
    }

    const voice = document.getElementById('nav-voice-render');
    const settings = menu.querySelector('[data-page="settings"]');
    if (voice?.parentNode === menu) {
      if (voice.nextSibling !== item) menu.insertBefore(item, voice.nextSibling);
    } else if (settings) {
      menu.insertBefore(item, settings);
    } else if (!item.parentNode) {
      menu.appendChild(item);
    }
  }

  function setStep2Visible() {
    document.querySelectorAll('.pipeline-pane').forEach((pane) => pane.classList.remove('active'));
    const step2 = document.getElementById('step-2-content');
    if (step2) {
      step2.classList.add('active');
      step2.style.display = 'block';
    }
    document.getElementById('step-1-content')?.style.setProperty('display', 'none');
    document.getElementById('step-3-content')?.style.setProperty('display', 'none');
  }

  function activateStandalone() {
    standaloneActive = true;
    document.body.classList.add(STANDALONE_CLASS);
    document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
    document.getElementById(NAV_ID)?.classList.add('active');
    document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));
    document.getElementById('page-home')?.classList.add('active');
    setStep2Visible();
    syncDrawingCursor();
    decorateRegionMasks();
  }

  function leaveStandalone() {
    if (!standaloneActive) return;
    standaloneActive = false;
    document.body.classList.remove(STANDALONE_CLASS);
    syncDrawingCursor();
  }

  function installNavExitGuard() {
    document.addEventListener('click', (event) => {
      const nav = event.target?.closest?.('.nav-item');
      if (!nav || nav.id === NAV_ID) return;
      leaveStandalone();
    }, true);
  }

  function isManualDrawing() {
    const state = appState();
    const job = activeJob();
    return !!(state?.isDrawing && job?.subtitleMode === 'manual');
  }

  function syncDrawingCursor() {
    const target = document.getElementById('canvas-inner-orig');
    if (!target) return;
    target.classList.toggle('subtitle-drawing-active', isManualDrawing());
  }

  function keepDrawingAfterRegion() {
    const target = document.getElementById('canvas-inner-orig');
    if (!target || target.dataset.standaloneDrawingBound === 'true') return;
    target.dataset.standaloneDrawingBound = 'true';
    target.addEventListener('mouseup', () => {
      const state = appState();
      const job = activeJob();
      if (!state || job?.subtitleMode !== 'manual') return;
      setTimeout(() => {
        state.isDrawing = true;
        document.getElementById('btn-draw-region')?.classList.add('active');
        syncDrawingCursor();
        decorateRegionMasks();
      }, 0);
    });
  }

  function installDrawingStateSync() {
    document.addEventListener('click', (event) => {
      if (event.target?.closest?.('#btn-draw-region')) {
        setTimeout(syncDrawingCursor, 0);
        return;
      }
      if (event.target?.closest?.('#mode-auto')) {
        const state = appState();
        if (state) state.isDrawing = false;
        document.getElementById('btn-draw-region')?.classList.remove('active');
        setTimeout(syncDrawingCursor, 0);
        return;
      }
      if (event.target?.closest?.('#mode-manual')) setTimeout(syncDrawingCursor, 0);
    }, true);
  }

  function decorateRegionMasks() {
    const list = document.getElementById('regions-list');
    const job = activeJob();
    if (!list || !job?.regions?.length) return;

    list.querySelectorAll('.region-item').forEach((item, index) => {
      const region = job.regions[index];
      if (!region) return;
      let select = item.querySelector('.region-mask-select');
      if (!select) {
        select = document.createElement('select');
        select.className = 'region-mask-select';
        select.title = `Mask riêng cho vùng #${region.label || index + 1}`;
        MASK_OPTIONS.forEach(([value, label]) => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = label;
          select.appendChild(option);
        });
        select.addEventListener('click', (event) => event.stopPropagation());
        select.addEventListener('change', () => {
          const currentJob = activeJob();
          const currentRegion = currentJob?.regions?.[index];
          if (!currentRegion) return;
          currentRegion.maskMode = select.value;
        });
        const deleteButton = item.querySelector('.btn-region-del');
        if (deleteButton) item.insertBefore(select, deleteButton);
        else item.appendChild(select);
      }
      select.value = region.maskMode || job.maskMode || 'box';
      if (!region.maskMode) region.maskMode = select.value;
    });
  }

  function observeRegions() {
    const list = document.getElementById('regions-list');
    if (!list || regionsObserver) return;
    regionsObserver = new MutationObserver(() => setTimeout(decorateRegionMasks, 0));
    regionsObserver.observe(list, { childList: true, subtree: true });
  }

  function wrapProcessPayload() {
    if (apiWrapped || !window.api?.startProcessBatch) return;
    const original = window.api.startProcessBatch.bind(window.api);
    const wrapped = async (payload, ...rest) => {
      const state = appState();
      const job = state?.jobs?.find?.((candidate) => candidate.id === state.processingJobId);
      if (job?.subtitleMode === 'manual' && Array.isArray(job.regions) && job.regions.length && Array.isArray(payload) && payload[0]) {
        const region = job.regions[state.processingPassIndex || 0];
        if (region) payload[0].mask_mode = region.maskMode || job.maskMode || 'box';
      }
      return original(payload, ...rest);
    };
    wrapped.__standaloneSubtitleMaskWrapped = true;
    window.api.startProcessBatch = wrapped;
    apiWrapped = true;
  }

  function install() {
    ensureStyles();
    placeNav();
    installNavExitGuard();
    installDrawingStateSync();
    keepDrawingAfterRegion();
    observeRegions();
    wrapProcessPayload();
    decorateRegionMasks();
    syncDrawingCursor();

    const observer = new MutationObserver(() => {
      placeNav();
      keepDrawingAfterRegion();
      observeRegions();
      wrapProcessPayload();
      if (standaloneActive) setStep2Visible();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
