(function () {
  'use strict';

  const NAV_ID = 'nav-subtitle-remover';
  const VOICE_NAV_ID = 'nav-voice-render';
  const HOME_PAGE_ID = 'page-home';
  const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mkv', 'mov', 'webm', 'm4v'];
  const MASK_OPTIONS = [['box', 'Box'], ['tight', 'Tight'], ['soft', 'Soft']];
  let drawLatched = false, standaloneActive = false, restoreSnapshot = null, regionObserver = null, navObserver = null, initialized = false;

  const getState = () => window._appState || null;
  const getActiveJob = () => getState()?.jobs?.find(job => job.id === getState().activeJobId) || null;
  const notify = (message, type='info') => typeof window.showToast === 'function' ? window.showToast(message, type) : window.addLog?.(`[Xóa Sub] ${message}`, type === 'error' ? 'error' : 'info');

  function setDrawState(enabled) {
    const state = getState(), job = getActiveJob();
    const active = Boolean(enabled && job?.subtitleMode === 'manual');
    drawLatched = active;
    if (state) state.isDrawing = active;
    document.getElementById('btn-draw-region')?.classList.toggle('active', active);
    const canvasInner = document.getElementById('canvas-inner-orig'), canvas = document.getElementById('canvas-original');
    if (canvasInner) canvasInner.style.cursor = active ? 'crosshair' : '';
    if (canvas) canvas.style.cursor = active ? 'crosshair' : 'default';
  }
  function restoreLatchedDrawAfterRegion() { if (drawLatched && getActiveJob()?.subtitleMode === 'manual') setDrawState(true); }

  function decorateRegionMasks() {
    const job = getActiveJob(), list = document.getElementById('regions-list');
    if (!job || !list || !Array.isArray(job.regions)) return;
    [...list.querySelectorAll('.region-item')].forEach((item, index) => {
      const region = job.regions[index];
      if (!region || item.querySelector('.standalone-region-mask') || item.querySelector('.p2-region-mask-select')) return;
      const select = document.createElement('select');
      select.className = 'dropdown standalone-region-mask';
      select.setAttribute('aria-label', `Mask cho vùng ${region.label || index + 1}`);
      select.style.cssText = 'margin-left:auto;width:92px;min-width:92px;padding:4px 6px';
      MASK_OPTIONS.forEach(([value, label]) => { const option = document.createElement('option'); option.value = value; option.textContent = label; select.appendChild(option); });
      select.value = region.maskMode || job.maskMode || 'box';
      if (!region.maskMode) region.maskMode = select.value;
      select.addEventListener('change', () => { region.maskMode = select.value; });
      item.insertBefore(select, item.querySelector('.btn-region-del') || null);
    });
  }
  function installRegionObserver() {
    const list = document.getElementById('regions-list');
    if (!list || regionObserver) return;
    regionObserver = new MutationObserver(() => { decorateRegionMasks(); queueMicrotask(restoreLatchedDrawAfterRegion); });
    regionObserver.observe(list, { childList: true, subtree: true });
    decorateRegionMasks();
  }

  function capturePipelineState() {
    const panes = ['1','2','3'].map(step => document.getElementById(`step-${step}-content`));
    return { barDisplay: document.querySelector('.pipeline-bar-v2')?.style.display || '', panes: panes.map(pane => pane ? { display:pane.style.display, active:pane.classList.contains('active') } : null), chevrons:[...document.querySelectorAll('.step-chevron')].map(item => item.classList.contains('active')) };
  }

  function ensureStandaloneControls() {
    const step2 = document.getElementById('step-2-content');
    if (!step2 || document.getElementById('standalone-subtitle-actions')) return;
    const actionGrid = step2.querySelector('.p2-action-grid');
    const queueCard = step2.querySelector('.p2-queue-card');
    const host = actionGrid || queueCard || document.getElementById('job-list')?.parentElement || step2;
    const bar = document.createElement('div');
    bar.id = 'standalone-subtitle-actions';
    bar.style.cssText = actionGrid ? 'display:contents' : 'display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 10px';
    bar.innerHTML = '<button id="standalone-add-videos" class="p2-btn p2-sync-btn" type="button">＋ Thêm Video</button><button id="standalone-run-all" class="p2-btn p2-sync-btn" type="button">▶ Chạy tất cả</button><span id="standalone-queue-summary" class="p2-muted"></span>';
    if (actionGrid) actionGrid.insertBefore(bar, actionGrid.firstChild); else host.insertBefore(bar, host.firstChild);
    document.getElementById('standalone-add-videos').addEventListener('click', openStandaloneFiles);
    document.getElementById('standalone-run-all').addEventListener('click', () => {
      const count = window.pipelineStateGate?.startAllStandalone?.() || 0;
      notify(count ? `Đã đưa ${count} video vào hàng đợi Xóa Sub.` : 'Không có video sẵn sàng để chạy.', count ? 'success' : 'info');
    });
  }

  function syncStandaloneChrome() {
    const pane = document.getElementById('step-2-content');
    const controls = document.getElementById('standalone-subtitle-actions');
    if (controls) controls.style.display = standaloneActive ? (controls.parentElement?.classList.contains('p2-action-grid') ? 'contents' : 'flex') : 'none';
    const jobs = getState()?.jobs?.filter(job => job.standaloneSubtitleRemoval) || [];
    const summary = document.getElementById('standalone-queue-summary');
    if (summary) summary.textContent = `${jobs.length} video • ${jobs.filter(job => ['ready','error'].includes(job.p2Status)).length} sẵn sàng • ${jobs.filter(job => job.p2Status === 'finished').length} hoàn tất`;

    const p1Summary = pane?.querySelector('.p2-p1-summary');
    const sourceBadge = pane?.querySelector('.p2-source-badge');
    if (p1Summary) p1Summary.style.display = standaloneActive ? 'none' : '';
    if (sourceBadge) sourceBadge.style.display = standaloneActive ? 'none' : '';

    const headerTitle = pane?.querySelector('.p2-page-title-row h1');
    const headerCopy = pane?.querySelector('.p2-page-title-row p');
    const queueHint = pane?.querySelector('.p2-queue-hint');
    const queueVideoHeader = pane?.querySelector('.p2-queue-head span:nth-child(2)');
    if (headerTitle) headerTitle.textContent = standaloneActive ? 'Xóa Sub · Xóa phụ đề độc lập' : 'Pipeline 2 · Xóa phụ đề';
    if (headerCopy) headerCopy.textContent = standaloneActive ? 'Thêm một hoặc nhiều video và xóa burned-in subtitle trực tiếp, không cần Pipeline 1 hoặc Pipeline 3.' : 'Loại bỏ phụ đề cháy khỏi video gốc. Chỉ xử lý các Job đã hoàn tất và được mở khóa từ Pipeline 1.';
    if (queueHint) queueHint.textContent = standaloneActive ? 'Thêm nhiều video trực tiếp. Mỗi video là một Job độc lập và được xử lý tuần tự qua engine Xóa Sub hiện có.' : 'Chỉ hiển thị Job đủ điều kiện từ Pipeline 1. Danh sách tự cuộn khi có nhiều Job.';
    if (queueVideoHeader) queueVideoHeader.textContent = standaloneActive ? 'Video' : 'Video (từ Pipeline 1)';

    const syncButton = document.getElementById('p2-sync-jobs');
    if (syncButton) syncButton.style.display = standaloneActive ? 'none' : '';
    const deleteButton = document.getElementById('p2-delete-selected');
    if (deleteButton) deleteButton.style.display = standaloneActive ? 'none' : '';
    pane?.classList.toggle('standalone-subtitle-active', standaloneActive);
  }

  function enterStandaloneMode() {
    const state = getState(), homePage = document.getElementById(HOME_PAGE_ID), step2 = document.getElementById('step-2-content');
    if (!state || !homePage || !step2) return;
    if (!standaloneActive) restoreSnapshot = capturePipelineState();
    standaloneActive = true; state.standaloneSubtitleMode = true;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.id === NAV_ID));
    document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page === homePage));
    const pipelineBar = document.querySelector('.pipeline-bar-v2'); if (pipelineBar) pipelineBar.style.display = 'none';
    ['1','2','3'].forEach(step => { const pane = document.getElementById(`step-${step}-content`); if (!pane) return; const active = step === '2'; pane.classList.toggle('active', active); pane.style.display = active ? '' : 'none'; });
    ensureStandaloneControls(); installRegionObserver(); decorateRegionMasks(); syncStandaloneChrome();
    window.renderJobList?.(); window.pipelineStateGate?.selectP2Job?.(); window.pipelineStateGate?.scheduleSync?.();
    window.dispatchEvent(new Event('resize'));
  }

  function exitStandaloneMode() {
    if (!standaloneActive) return;
    standaloneActive = false; const state = getState(); if (state) state.standaloneSubtitleMode = false;
    const pipelineBar = document.querySelector('.pipeline-bar-v2'); if (pipelineBar) pipelineBar.style.display = restoreSnapshot?.barDisplay || '';
    ['1','2','3'].forEach((step,index) => { const pane=document.getElementById(`step-${step}-content`), saved=restoreSnapshot?.panes?.[index]; if (!pane || !saved) return; pane.style.display=saved.display; pane.classList.toggle('active',saved.active); });
    [...document.querySelectorAll('.step-chevron')].forEach((item,index) => item.classList.toggle('active', Boolean(restoreSnapshot?.chevrons?.[index])));
    restoreSnapshot=null; setDrawState(false); syncStandaloneChrome(); window.renderJobList?.(); window.pipelineStateGate?.scheduleSync?.();
  }

  function mountNav() {
    if (document.getElementById(NAV_ID)) return true;
    const voiceNav=document.getElementById(VOICE_NAV_ID); if (!voiceNav) return false;
    const item=document.createElement('a'); item.href='#'; item.id=NAV_ID; item.className='nav-item'; item.dataset.page='subtitle-remover'; item.title='Xóa Sub';
    item.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16"/><path d="M7 7l1 13h8l1-13"/><path d="M9 4h6v3"/></svg><span>Xóa Sub</span>';
    voiceNav.insertAdjacentElement('afterend',item); item.addEventListener('click',event=>{event.preventDefault();enterStandaloneMode();}); return true;
  }
  function installNavigation() {
    if (!mountNav()) { const menu=document.querySelector('.nav-menu'); if (menu && !navObserver) { navObserver=new MutationObserver(()=>{if(mountNav()){navObserver.disconnect();navObserver=null;}}); navObserver.observe(menu,{childList:true}); } }
    document.addEventListener('click',event=>{const navItem=event.target.closest?.('.nav-item');if(standaloneActive&&navItem&&navItem.id!==NAV_ID)exitStandaloneMode();},true);
  }

  const normalizePath=value=>String(value||'').trim();
  const fileNameFromPath=filePath=>normalizePath(filePath).split(/[\\/]/).pop()||'video';
  function validVideoPath(filePath){const ext=fileNameFromPath(filePath).split('.').pop()?.toLowerCase();return VIDEO_EXTENSIONS.includes(ext);}
  function outputPathFor(filePath) {
    const state=getState();
    const normalized=normalizePath(filePath), fileName=fileNameFromPath(normalized), baseName=fileName.replace(/\.[^.]+$/,''), dir=normalized.replace(/\\/g,'/').replace(/\/[^/]+$/,'');
    return state?.outputDir ? `${state.outputDir.replace(/\\/g,'/')}/${baseName}_no_sub.mp4` : `${dir}/${baseName}_no_sub.mp4`;
  }

  function createStandaloneJob(filePath) {
    const state=getState(); if(!state||!filePath)return null;
    const normalized=normalizePath(filePath), duplicate=state.jobs.find(job=>job.standaloneSubtitleRemoval&&normalizePath(job.filePath)===normalized); if(duplicate)return duplicate;
    const job={
      id:`sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`, fileName:fileNameFromPath(normalized), filePath:normalized, path:normalized, outputPath:outputPathFor(normalized),
      status:'idle',progress:0,pipeline:2,standaloneSubtitleRemoval:true,p1Status:'idle',p1Progress:0,p2Status:'ready',p2Progress:0,p3Status:'locked',_pipelineStateVersion:1,
      algorithm:document.getElementById('algo-select')?.value||'sttn-auto',maskMode:document.getElementById('mask-mode')?.value||'box',subtitleMode:'auto',regions:[],
      extractSrt:false,asrFallback:false,asrLanguage:'vi',aiRewrite:false,ttsGenerate:false,voiceSub:false,srtContent:'',aiContent:'',voiceSubContent:'',voiceSegments:[],ttsAudioPath:null,ttsTimedSrt:null,ttsAudioDurMs:0,karaokeAss:null,finalOutputPath:null,_aiTriggered:false,_ttsTriggered:false,_ttsRunning:false
    };
    state.jobs.push(job); return job;
  }

  function addStandalonePaths(paths) {
    const state=getState(); if(!state)return 0;
    const accepted=[...new Set((paths||[]).map(normalizePath).filter(validVideoPath))]; let added=0,last=null;
    accepted.forEach(filePath=>{const before=state.jobs.length;last=createStandaloneJob(filePath);if(state.jobs.length>before)added+=1;});
    if(last)state.activeJobId=last.id; window.renderJobList?.(); if(last&&typeof window.selectJob==='function')window.selectJob(last.id); window.pipelineStateGate?.scheduleSync?.(); syncStandaloneChrome();
    if(accepted.length&&!added)notify('Các video đã có trong hàng đợi.','info'); else if(added)notify(`Đã thêm ${added} video vào Xóa Sub.`,'success'); return added;
  }

  async function openStandaloneFiles() {
    if(!standaloneActive||!window.electronAPI?.openFile)return;
    try{const result=await window.electronAPI.openFile([{name:'Video Files',extensions:VIDEO_EXTENSIONS}]);if(!result?.canceled)addStandalonePaths(result?.filePaths||[]);}catch(error){notify(error?.message||'Không mở được hộp chọn video.','error');}
  }
  function installStandaloneDrop() {
    document.addEventListener('dragover',event=>{if(standaloneActive)event.preventDefault();},true);
    document.addEventListener('drop',event=>{if(!standaloneActive)return;event.preventDefault();event.stopImmediatePropagation();const files=[...(event.dataTransfer?.files||[])];addStandalonePaths(files.map(file=>window.electronAPI?.getPathForFile?.(file)||file.path||'').filter(Boolean));},true);
  }
  function installDrawGuards() {
    document.getElementById('btn-draw-region')?.addEventListener('click',()=>queueMicrotask(()=>setDrawState(Boolean(getState()?.isDrawing&&getActiveJob()?.subtitleMode==='manual'))));
    document.getElementById('mode-auto')?.addEventListener('click',()=>queueMicrotask(()=>setDrawState(false)));
    document.getElementById('mode-manual')?.addEventListener('click',()=>queueMicrotask(()=>setDrawState(false)));
    document.getElementById('canvas-inner-orig')?.addEventListener('mouseup',()=>setTimeout(restoreLatchedDrawAfterRegion,0));
  }
  function init() {
    if(initialized||!getState()||!window.api)return false; initialized=true; ensureStandaloneControls(); installRegionObserver(); installDrawGuards(); installNavigation(); installStandaloneDrop(); setInterval(syncStandaloneChrome,500); return true;
  }
  if(!init()){const timer=setInterval(()=>{if(init())clearInterval(timer);},50);setTimeout(()=>clearInterval(timer),10000);}
})();