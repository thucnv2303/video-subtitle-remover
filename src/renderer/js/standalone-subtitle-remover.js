(function standaloneSubtitleRemover() {
  'use strict';

  const NAV_ID = 'nav-subtitle-remover';
  const VOICE_NAV_ID = 'nav-voice-render';
  const PAGE_ID = 'page-subtitle-remover';
  const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mkv', 'mov', 'webm', 'm4v'];

  let initialized = false;
  let standaloneActive = false;
  let homeAnchor = null;
  let navObserver = null;
  let renderPatched = false;

  const state = () => window._appState || null;
  const activeJob = () => state()?.jobs?.find(job => job.id === state()?.activeJobId) || null;
  const isStandaloneJob = job => job?.standaloneSubtitleRemoval === true;
  const notify = (message, type = 'info') => {
    if (typeof window.showToast === 'function') window.showToast(message, type);
    else window.addLog?.(`[Xóa Sub] ${message}`, type === 'error' ? 'error' : 'info');
  };

  function ensureStandalonePage() {
    let page = document.getElementById(PAGE_ID);
    if (page) return page;
    const main = document.querySelector('.main-area');
    if (!main) return null;
    page = document.createElement('section');
    page.id = PAGE_ID;
    page.className = 'page standalone-subtitle-page';
    page.style.cssText = 'height:100%;min-height:0;overflow:hidden;';
    main.appendChild(page);
    return page;
  }

  function ensureHomeAnchor() {
    const step2 = document.getElementById('step-2-content');
    if (!step2) return null;
    if (!homeAnchor) {
      homeAnchor = document.createComment('standalone-subtitle-remover-step2-anchor');
      step2.parentNode?.insertBefore(homeAnchor, step2);
    }
    return homeAnchor;
  }

  function moveP2ToStandalonePage() {
    const page = ensureStandalonePage();
    const step2 = document.getElementById('step-2-content');
    if (!page || !step2) return false;
    ensureHomeAnchor();
    if (step2.parentElement !== page) page.appendChild(step2);
    step2.style.display = '';
    step2.classList.add('active', 'standalone-subtitle-active');
    return true;
  }

  function restoreP2ToHome() {
    const step2 = document.getElementById('step-2-content');
    if (!step2 || !homeAnchor?.parentNode) return;
    homeAnchor.parentNode.insertBefore(step2, homeAnchor.nextSibling);
    step2.classList.remove('standalone-subtitle-active');
    step2.classList.remove('active');
    step2.style.display = 'none';
  }

  function ensureStandaloneActions() {
    const step2 = document.getElementById('step-2-content');
    if (!step2) return;
    const existing = document.getElementById('standalone-subtitle-actions');
    if (existing) return;

    const actionGrid = step2.querySelector('.p2-action-grid');
    const queueCard = step2.querySelector('.p2-queue-card');
    const host = actionGrid || queueCard || document.getElementById('job-list')?.parentElement || step2;
    const actions = document.createElement('div');
    actions.id = 'standalone-subtitle-actions';
    actions.style.cssText = actionGrid
      ? 'display:contents'
      : 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px';
    actions.innerHTML = '<button id="standalone-add-videos" class="p2-btn p2-sync-btn" type="button">＋ Thêm Video</button><button id="standalone-run-all" class="p2-btn p2-sync-btn" type="button">▶ Chạy tất cả</button><span id="standalone-queue-summary" class="p2-muted"></span>';
    if (actionGrid) actionGrid.insertBefore(actions, actionGrid.firstChild);
    else host.insertBefore(actions, host.firstChild);

    document.getElementById('standalone-add-videos')?.addEventListener('click', openStandaloneFiles);
    document.getElementById('standalone-run-all')?.addEventListener('click', startAllStandalone);
  }

  function setStandaloneChrome(enabled) {
    const step2 = document.getElementById('step-2-content');
    if (!step2) return;

    const title = step2.querySelector('.p2-page-title-row h1');
    const copy = step2.querySelector('.p2-page-title-row p');
    const sourceBadge = step2.querySelector('.p2-source-badge');
    const p1Summary = step2.querySelector('.p2-p1-summary');
    const queueHint = step2.querySelector('.p2-queue-hint');
    const queueVideoHeader = step2.querySelector('.p2-queue-head span:nth-child(2)');
    const syncButton = document.getElementById('p2-sync-jobs');
    const legacyOpen = document.getElementById('btn-open-file');

    if (title) title.textContent = enabled ? 'Xóa Sub' : 'Pipeline 2 · Xóa phụ đề';
    if (copy) copy.textContent = enabled
      ? 'Xóa burned-in subtitle trực tiếp từ một hoặc nhiều video. Không cần chạy Pipeline 1 hoặc Pipeline 3.'
      : 'Loại bỏ phụ đề cháy khỏi video gốc. Chỉ xử lý các Job đã hoàn tất và được mở khóa từ Pipeline 1.';
    if (sourceBadge) sourceBadge.style.display = enabled ? 'none' : '';
    if (p1Summary) p1Summary.style.display = enabled ? 'none' : '';
    if (queueHint) queueHint.textContent = enabled
      ? 'Thêm nhiều video trực tiếp. Mỗi video là một Job độc lập và được xử lý tuần tự.'
      : 'Chỉ hiển thị Job đủ điều kiện từ Pipeline 1. Danh sách tự cuộn khi có nhiều Job.';
    if (queueVideoHeader) queueVideoHeader.textContent = enabled ? 'Video' : 'Video (từ Pipeline 1)';
    if (syncButton) syncButton.style.display = enabled ? 'none' : '';
    if (legacyOpen) legacyOpen.style.display = enabled ? 'none' : '';

    ensureStandaloneActions();
    const actions = document.getElementById('standalone-subtitle-actions');
    if (actions) actions.style.display = enabled
      ? (actions.parentElement?.classList.contains('p2-action-grid') ? 'contents' : 'flex')
      : 'none';

    updateQueueSummary();
  }

  function updateQueueSummary() {
    const jobs = state()?.jobs?.filter(isStandaloneJob) || [];
    const summary = document.getElementById('standalone-queue-summary');
    if (!summary) return;
    const ready = jobs.filter(job => !['queued', 'processing'].includes(job.status)).length;
    const running = jobs.filter(job => ['queued', 'processing'].includes(job.status)).length;
    const done = jobs.filter(job => job.status === 'finished').length;
    summary.textContent = `${jobs.length} video · ${ready} sẵn sàng · ${running} đang chạy · ${done} hoàn tất`;
  }

  function filterRenderedQueues() {
    const s = state();
    if (!s) return;

    const p2Cards = [...document.querySelectorAll('#job-list .job-card')];
    p2Cards.forEach((card, index) => {
      const job = s.jobs[index];
      if (!job) return;
      card.dataset.jobId = job.id;
      card.style.display = standaloneActive === isStandaloneJob(job) ? '' : 'none';
    });

    if (standaloneActive) {
      const visible = p2Cards.some(card => card.style.display !== 'none');
      const list = document.getElementById('job-list');
      if (list && !visible) {
        list.innerHTML = '<div class="job-empty" data-standalone-empty="true">Chưa có video. Bấm “＋ Thêm Video” hoặc kéo thả nhiều video vào trang này.</div>';
      }
    }

    document.querySelectorAll('#step1-job-list .tk-job-card').forEach((card, index) => {
      const job = s.jobs[index];
      if (job && isStandaloneJob(job)) card.style.display = 'none';
    });

    document.querySelectorAll('#step3-job-list .job-card').forEach((card, index) => {
      const finished = s.jobs.filter(job => job.status === 'finished');
      const job = finished[index];
      if (job && isStandaloneJob(job)) card.style.display = 'none';
    });

    updateQueueSummary();
  }

  function patchRenderJobList() {
    if (renderPatched || typeof window.renderJobList !== 'function') return false;
    const original = window.renderJobList;
    window.renderJobList = function standaloneAwareRenderJobList(...args) {
      const result = original.apply(this, args);
      filterRenderedQueues();
      return result;
    };
    renderPatched = true;
    return true;
  }

  function ensureStandaloneSelection() {
    const s = state();
    if (!s) return;
    const current = s.jobs.find(job => job.id === s.activeJobId);
    if (current && isStandaloneJob(current)) return;
    const first = s.jobs.find(isStandaloneJob);
    if (first && typeof window.selectJob === 'function') window.selectJob(first.id);
    else s.activeJobId = null;
  }

  function enterStandaloneMode() {
    const s = state();
    const page = ensureStandalonePage();
    if (!s || !page || !moveP2ToStandalonePage()) return;

    standaloneActive = true;
    s.standaloneSubtitleMode = true;
    document.querySelectorAll('.page').forEach(item => item.classList.toggle('active', item === page));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.id === NAV_ID));
    setStandaloneChrome(true);
    ensureStandaloneSelection();
    window.renderJobList?.();
    filterRenderedQueues();
    window.dispatchEvent(new Event('resize'));
  }

  function exitStandaloneMode() {
    if (!standaloneActive) return;
    standaloneActive = false;
    const s = state();
    if (s) s.standaloneSubtitleMode = false;
    setStandaloneChrome(false);
    restoreP2ToHome();
    filterRenderedQueues();
  }

  function mountNav() {
    if (document.getElementById(NAV_ID)) return true;
    const menu = document.querySelector('.nav-menu');
    if (!menu) return false;
    const voice = document.getElementById(VOICE_NAV_ID);
    const settings = menu.querySelector('[data-page="settings"]');
    const item = document.createElement('a');
    item.href = '#';
    item.id = NAV_ID;
    item.className = 'nav-item';
    item.dataset.page = 'subtitle-remover';
    item.title = 'Xóa Sub';
    item.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16"/><path d="M7 7l1 13h8l1-13"/><path d="M9 4h6v3"/></svg><span>Xóa Sub</span>';
    if (voice) voice.insertAdjacentElement('afterend', item);
    else if (settings) menu.insertBefore(item, settings);
    else menu.appendChild(item);
    item.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
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

    document.addEventListener('click', event => {
      const nav = event.target.closest?.('.nav-item');
      if (standaloneActive && nav && nav.id !== NAV_ID) exitStandaloneMode();
    }, true);
  }

  const normalizePath = value => String(value || '').trim();
  const fileNameFromPath = filePath => normalizePath(filePath).split(/[\\/]/).pop() || 'video';

  function validVideoPath(filePath) {
    const ext = fileNameFromPath(filePath).split('.').pop()?.toLowerCase();
    return VIDEO_EXTENSIONS.includes(ext);
  }

  function outputPathFor(filePath) {
    const s = state();
    const normalized = normalizePath(filePath);
    const fileName = fileNameFromPath(normalized);
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const dir = normalized.replace(/\\/g, '/').replace(/\/[^/]+$/, '');
    return s?.outputDir
      ? `${s.outputDir.replace(/\\/g, '/').replace(/\/+$/, '')}/${baseName}_no_sub.mp4`
      : `${dir}/${baseName}_no_sub.mp4`;
  }

  function createStandaloneJob(filePath) {
    const s = state();
    if (!s || !filePath) return null;
    const normalized = normalizePath(filePath);
    const duplicate = s.jobs.find(job => isStandaloneJob(job) && normalizePath(job.filePath) === normalized);
    if (duplicate) return duplicate;

    const job = {
      id: `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      fileName: fileNameFromPath(normalized),
      filePath: normalized,
      path: normalized,
      outputPath: outputPathFor(normalized),
      status: 'idle',
      progress: 0,
      pipeline: 2,
      standaloneSubtitleRemoval: true,
      p1Status: 'idle',
      p1Progress: 0,
      p2Status: 'ready',
      p2Progress: 0,
      p3Status: 'locked',
      algorithm: document.getElementById('algo-select')?.value || 'sttn-auto',
      maskMode: document.getElementById('mask-mode')?.value || 'box',
      subtitleMode: 'auto',
      regions: [],
      extractSrt: false,
      asrFallback: false,
      asrLanguage: 'vi',
      aiRewrite: false,
      ttsGenerate: false,
      voiceSub: false,
      srtContent: '',
      aiContent: '',
      voiceSubContent: '',
      voiceSegments: [],
      ttsAudioPath: null,
      ttsTimedSrt: null,
      ttsAudioDurMs: 0,
      karaokeAss: null,
      finalOutputPath: null,
      _aiTriggered: false,
      _ttsTriggered: false,
      _ttsRunning: false
    };
    s.jobs.push(job);
    return job;
  }

  function addStandalonePaths(paths) {
    const s = state();
    if (!s) return 0;
    const accepted = [...new Set((paths || []).map(normalizePath).filter(validVideoPath))];
    let added = 0;
    let last = null;

    accepted.forEach(filePath => {
      const before = s.jobs.length;
      last = createStandaloneJob(filePath);
      if (s.jobs.length > before) added += 1;
    });

    if (last && typeof window.selectJob === 'function') window.selectJob(last.id);
    window.renderJobList?.();
    filterRenderedQueues();
    if (accepted.length && !added) notify('Các video đã có trong hàng đợi.', 'info');
    else if (added) notify(`Đã thêm ${added} video vào Xóa Sub.`, 'success');
    return added;
  }

  async function openStandaloneFiles() {
    if (!standaloneActive || !window.electronAPI?.openFile) return;
    try {
      const result = await window.electronAPI.openFile([{ name: 'Video Files', extensions: VIDEO_EXTENSIONS }]);
      if (!result?.canceled) addStandalonePaths(result?.filePaths || []);
    } catch (error) {
      notify(error?.message || 'Không mở được hộp chọn video.', 'error');
    }
  }

  function startAllStandalone() {
    const s = state();
    if (!s) return;
    const competing = s.jobs.some(job => !isStandaloneJob(job) && ['queued', 'processing'].includes(job.status));
    if (competing) {
      notify('Hãy chờ pipeline chính hoàn tất trước khi chạy hàng đợi Xóa Sub.', 'warning');
      return;
    }

    const jobs = s.jobs.filter(job => isStandaloneJob(job) && !['queued', 'processing'].includes(job.status));
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
    });
    window.renderJobList?.();
    filterRenderedQueues();
    if (!jobs.length) {
      notify('Không có video sẵn sàng để chạy.', 'info');
      return;
    }
    notify(`Đã đưa ${jobs.length} video vào hàng đợi Xóa Sub.`, 'success');
    window.processNextJob?.();
  }

  function installStandaloneDrop() {
    document.addEventListener('dragover', event => {
      if (standaloneActive) event.preventDefault();
    }, true);
    document.addEventListener('drop', event => {
      if (!standaloneActive) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const files = [...(event.dataTransfer?.files || [])];
      const paths = files
        .map(file => window.electronAPI?.getPathForFile?.(file) || file.path || '')
        .filter(Boolean);
      addStandalonePaths(paths);
    }, true);
  }

  function installDrawGuard() {
    const canvas = document.getElementById('canvas-inner-orig');
    const draw = document.getElementById('btn-draw-region');
    const auto = document.getElementById('mode-auto');
    if (draw) draw.addEventListener('click', () => {
      queueMicrotask(() => {
        const enabled = Boolean(state()?.isDrawing && activeJob()?.subtitleMode === 'manual');
        if (canvas) canvas.style.cursor = enabled ? 'crosshair' : '';
      });
    });
    if (auto) auto.addEventListener('click', () => {
      queueMicrotask(() => {
        if (canvas) canvas.style.cursor = '';
      });
    });
  }

  function init() {
    if (initialized || !state() || !window.api) return false;
    initialized = true;
    ensureStandalonePage();
    ensureHomeAnchor();
    installNavigation();
    installStandaloneDrop();
    installDrawGuard();
    if (!patchRenderJobList()) {
      const renderTimer = setInterval(() => {
        if (patchRenderJobList()) clearInterval(renderTimer);
      }, 50);
      setTimeout(() => clearInterval(renderTimer), 5000);
    }
    return true;
  }

  if (!init()) {
    const bootTimer = setInterval(() => {
      if (init()) clearInterval(bootTimer);
    }, 50);
    setTimeout(() => clearInterval(bootTimer), 10000);
  }
})();
