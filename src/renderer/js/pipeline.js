(function mountApprovedPipeline1() {
  const pane = document.getElementById('step-1-content');
  if (!pane) return;

  if (!document.querySelector('link[data-pipeline1-approved]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/pipeline1-approved.css';
    link.dataset.pipeline1Approved = 'true';
    document.head.appendChild(link);
  }

  const title = (n, text, icon) => `<div class="p1-section-title"><span class="p1-section-number">${n}</span><strong>${text}</strong><span class="p1-section-icon">${icon}</span></div>`;

  pane.innerHTML = `
  <div class="p1-approved-shell">
    <header class="p1-page-header"><div class="p1-page-title-row"><span class="p1-page-icon">P1</span><div><h1>Pipeline 1 · Phân tích &amp; Viết lại nội dung</h1><p>Phân tích video, trích xuất nội dung và viết lại bằng AI để tối ưu cho giọng đọc / TTS.</p></div></div></header>
    <div class="p1-workspace-grid">
      <aside class="p1-config-column">
        <section class="p1-card p1-ai-card">
          ${title('1','AI & Prompt','AI')}
          <div class="p1-field"><label for="step1-ai-provider">Nhà cung cấp AI</label><select id="step1-ai-provider" class="p1-control"><option value="gemini">Gemini</option><option value="deepseek">DeepSeek</option><option value="ollama">Ollama</option></select></div>
          <div class="p1-field"><label for="step1-ai-model">Model</label><input id="step1-ai-model" class="p1-control" type="text" list="step1-ai-model-list" placeholder="Model đang dùng"><datalist id="step1-ai-model-list"></datalist></div>
          <div class="p1-field"><label for="ai-prompt-select">Prompt preset</label><select id="ai-prompt-select" class="p1-control"></select></div>
          <div class="p1-two-actions"><button id="step1-btn-edit-prompt" class="p1-btn p1-btn-secondary" type="button">☷ Quản lý Prompt</button><button id="step1-btn-check-ai" class="p1-btn p1-btn-secondary" type="button">⌁ Kiểm tra kết nối</button></div>
          <button id="step1-btn-add-prompt" class="p1-hidden-control" type="button" tabindex="-1">Add Prompt</button><div id="step1-ai-status" class="p1-inline-status" aria-live="polite"></div>
        </section>
        <section class="p1-card p1-voice-card">
          ${title('2','Giọng đọc & Voice','TTS')}
          <div class="p1-field"><label for="step1-tts-voice">Loại giọng</label><select id="step1-tts-voice" class="p1-control"><option value="none">Không lồng tiếng</option><option value="default">Giọng mặc định (OmniVoice)</option><option value="vi-VN-HoaiMyNeural">Nữ - Hoài My (Neural)</option><option value="vi-VN-NamMinhNeural">Nam - Nam Minh (Neural)</option><option value="en-US-JennyNeural">Jenny - English</option><option value="en-US-GuyNeural">Guy - English</option></select></div>
          <button id="step1-btn-preview-voice" class="p1-btn p1-btn-preview" type="button">▶ Nghe thử giọng</button><audio id="step1-voice-preview-audio" class="p1-preview-audio" controls></audio>
          <div class="p1-field p1-speed-field"><div class="p1-label-row"><label for="step1-tts-speed">Tốc độ đọc</label><strong id="step1-speed-value">1.00x</strong></div><input id="step1-tts-speed" class="p1-range" type="range" min="0.5" max="2" value="1" step="0.05"><div class="p1-range-labels"><span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span></div></div>
          <label class="p1-toggle-row"><span class="p1-toggle-copy"><strong>Ổn định cao</strong><small>Giảm nhiễu, ưu tiên giọng mượt hơn</small></span><input id="step1-voice-stable" type="checkbox" checked><span class="p1-switch"></span></label>
          <label class="p1-toggle-row"><span class="p1-toggle-copy"><strong>Chuẩn hóa âm lượng</strong><small>Giữ mức âm lượng nghe đồng đều</small></span><input id="step1-normalize-volume" type="checkbox" checked><span class="p1-switch"></span></label>
        </section>
      </aside>
      <main class="p1-center-column">
        <section class="p1-card p1-queue-card">
          <div class="p1-card-head">${title('3','Job Queue','QUEUE')}<button id="step1-btn-refresh-queue" class="p1-ghost-action" type="button">↻ Làm mới</button></div>
          <div class="p1-queue-head"><span>#</span><span>Tên video</span><span>Trạng thái</span><span>Thời gian</span><span>Thao tác</span></div>
          <div id="step1-job-list" class="tk-job-list p1-job-list"><div class="job-empty">Chưa có video nào.</div></div>
          <div class="p1-drop-area"><div class="p1-drop-icon">▶</div><strong>Kéo &amp; thả video vào đây</strong><span>Hỗ trợ MP4, MOV, MKV, AVI, WEBM</span><small>hoặc</small><button id="btn-upload-step1" class="p1-btn p1-btn-primary p1-add-video" type="button">＋ Thêm Video</button></div>
          <div class="p1-queue-footer"><span>Tổng: <strong id="job-count">0 video</strong></span><span id="p1-complete-count">Đã hoàn thành: 0/0</span></div><div class="p1-total-progress"><span id="p1-total-progress-fill"></span></div>
        </section>
        <section class="p1-card p1-actions-card">${title('5','Hành động','ACTION')}<div class="p1-action-grid"><button id="btn-start-all" class="p1-btn p1-btn-run" type="button">▶ Bắt đầu chạy</button><button id="p1-action-add" class="p1-btn p1-btn-primary" type="button">＋ Thêm Video</button><button id="btn-stop-all" class="p1-btn p1-btn-secondary" type="button">⏹ Dừng xử lý</button><button id="p1-delete-selected" class="p1-btn p1-btn-danger-ghost" type="button">🗑 Xóa đã chọn</button><button id="p1-delete-all" class="p1-btn p1-btn-secondary" type="button">× Xóa tất cả</button></div></section>
      </main>
      <aside class="p1-detail-column">
        <section class="p1-card p1-detail-card">
          <div class="p1-detail-heading">${title('4','Chi tiết Job đang chọn','JOB')}<div class="p1-job-meta"><span id="step1-detail-id">ID: —</span><span id="step1-detail-status" class="p1-status-chip">Chờ xử lý</span></div></div>
          <h3 id="step1-detail-title" class="p1-selected-title">Vui lòng chọn 1 Job</h3>
          <div class="p1-tabs"><button class="p1-tab active" type="button" data-p1-tab="content">Nội dung (SRT / Tóm tắt)</button><button class="p1-tab" type="button" data-p1-tab="audio">Âm thanh Lồng tiếng</button></div>
          <div class="p1-tab-pane active" data-p1-pane="content"><textarea id="step1-detail-text" class="p1-transcript" placeholder="Nội dung bóc băng hoặc AI viết lại sẽ hiển thị ở đây..."></textarea><div class="p1-detail-actions"><button id="step1-btn-extract" class="p1-btn p1-btn-secondary" type="button">↻ Trích xuất lại</button><button id="step1-btn-rewrite" class="p1-btn p1-btn-secondary" type="button">✨ AI Viết lại</button><button id="step1-btn-save-text" class="p1-btn p1-btn-accent" type="button">💾 Cập nhật Text</button></div></div>
          <div class="p1-tab-pane" data-p1-pane="audio"><div class="p1-audio-workspace"><div id="step1-audio-empty" class="p1-audio-empty">Chưa có audio lồng tiếng</div><audio id="step1-detail-audio" class="p1-detail-audio" controls></audio></div><div class="p1-detail-actions p1-audio-actions"><button id="step1-btn-gen-tts" class="p1-btn p1-btn-primary" type="button">◉ Tạo TTS</button><button id="step1-btn-import-audio" class="p1-btn p1-btn-secondary" type="button">📁 Upload Audio</button></div></div>
        </section>
        <section class="p1-card p1-log-card"><div class="p1-card-head">${title('6','Console / Log','LOG')}<div class="p1-log-actions"><span class="p1-live-dot">● Live</span><button id="step1-btn-copy-log" class="p1-mini-btn" type="button">Copy</button><button id="step1-btn-clear-log" class="p1-mini-btn" type="button">Xóa</button></div></div><div id="step1-log-output" class="tk-log-body p1-log-output"></div></section>
      </aside>
    </div>
  </div>`;

  pane.dataset.approvedMounted = 'true';
  mountPipelineNav();
  bindUiState();
  watchQueue();
})();

function mountPipelineNav() {
  const nav = document.querySelector('.nav-menu');
  const settings = nav?.querySelector('[data-page="settings"]');
  if (nav && !nav.querySelector('[data-pipeline1-nav]')) {
    const item = document.createElement('a');
    item.href = '#'; item.className = 'nav-item active'; item.dataset.page = 'home'; item.dataset.pipeline1Nav = 'true';
    item.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span>Pipeline 1</span>';
    settings ? nav.insertBefore(item, settings) : nav.appendChild(item);
  }
  const brand = document.querySelector('.brand h2');
  if (brand) { brand.dataset.shortBrand = brand.textContent.trim() || 'VSR'; brand.textContent = 'Video Subtitle Remover'; }
  document.querySelector('.app-container')?.classList.add('pipeline1-shell-active');
  document.querySelectorAll('.nav-item').forEach(link => link.addEventListener('click', () => {
    const isSettings = link.dataset.page === 'settings';
    document.querySelector('.app-container')?.classList.toggle('pipeline1-shell-active', !isSettings);
    if (brand) brand.textContent = isSettings ? (brand.dataset.shortBrand || 'VSR') : 'Video Subtitle Remover';
  }));
}

function bindUiState() {
  document.querySelectorAll('.p1-tab').forEach(tab => tab.addEventListener('click', () => {
    document.querySelectorAll('.p1-tab').forEach(item => item.classList.toggle('active', item === tab));
    document.querySelectorAll('.p1-tab-pane').forEach(pane => pane.classList.toggle('active', pane.dataset.p1Pane === tab.dataset.p1Tab));
  }));

  const provider = document.getElementById('step1-ai-provider');
  const model = document.getElementById('step1-ai-model');
  const voice = document.getElementById('step1-tts-voice');
  const speed = document.getElementById('step1-tts-speed');

  provider?.addEventListener('change', () => { localStorage.setItem('ai_provider', provider.value); if (model) model.value = localStorage.getItem(`ai_model_${provider.value}`) || ''; fillModelList(provider.value); });
  model?.addEventListener('change', () => localStorage.setItem(`ai_model_${provider?.value || 'gemini'}`, model.value));
  voice?.addEventListener('change', () => localStorage.setItem('tts_voice', voice.value));
  speed?.addEventListener('input', () => { document.getElementById('step1-speed-value').textContent = `${Number(speed.value).toFixed(2)}x`; localStorage.setItem('tts_speed', speed.value); });

  document.getElementById('btn-upload-step1')?.addEventListener('click', () => document.getElementById('btn-open-file')?.click());
  document.getElementById('p1-action-add')?.addEventListener('click', () => document.getElementById('btn-upload-step1')?.click());
  document.getElementById('step1-btn-copy-log')?.addEventListener('click', async () => {
    const text = document.getElementById('step1-log-output')?.innerText || '';
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch { notify('Không thể copy log.', 'error'); }
  });
  document.getElementById('step1-btn-clear-log')?.addEventListener('click', () => { const log = document.getElementById('step1-log-output'); if (log) log.innerHTML = ''; });
  document.getElementById('step1-btn-preview-voice')?.addEventListener('click', previewVoice);
  document.getElementById('step1-btn-check-ai')?.addEventListener('click', checkAi);
  document.getElementById('step1-btn-refresh-queue')?.addEventListener('click', () => window.renderJobList?.());
  document.getElementById('p1-delete-selected')?.addEventListener('click', deleteSelected);
  document.getElementById('p1-delete-all')?.addEventListener('click', deleteAllIdle);
  syncFromSettings();
}

function syncFromSettings() {
  const provider = document.getElementById('step1-ai-provider');
  const model = document.getElementById('step1-ai-model');
  const voice = document.getElementById('step1-tts-voice');
  const p = localStorage.getItem('ai_provider') || 'gemini';
  if (provider) provider.value = ['gemini','deepseek','ollama'].includes(p) ? p : 'gemini';
  if (model) model.value = localStorage.getItem(`ai_model_${provider?.value || 'gemini'}`) || '';
  fillModelList(provider?.value || 'gemini');
  syncVoiceOptions();
  const savedVoice = localStorage.getItem('tts_voice') || 'none';
  if (voice && [...voice.options].some(option => option.value === savedVoice)) voice.value = savedVoice;
  const speed = document.getElementById('step1-tts-speed');
  const savedSpeed = Number(localStorage.getItem('tts_speed') || 1);
  if (speed && savedSpeed >= .5 && savedSpeed <= 2) { speed.value = String(savedSpeed); document.getElementById('step1-speed-value').textContent = `${savedSpeed.toFixed(2)}x`; }
}

function fillModelList(provider) {
  const list = document.getElementById('step1-ai-model-list'); if (!list) return;
  const values = provider === 'gemini' ? ['gemini-2.5-flash','gemini-2.5-pro'] : provider === 'deepseek' ? ['deepseek-chat','deepseek-reasoner'] : [];
  list.replaceChildren(...values.map(value => { const option=document.createElement('option'); option.value=value; return option; }));
}
function syncVoiceOptions() {
  const select=document.getElementById('step1-tts-voice'); if (!select) return;
  [...select.options].filter(option => option.value.startsWith('clone:')).forEach(option => option.remove());
  let voices=[]; try { voices=JSON.parse(localStorage.getItem('tts_voices') || '[]'); } catch { voices=[]; }
  voices.forEach((item,index) => { const option=document.createElement('option'); option.value=`clone:${index}`; option.textContent=`Giọng clone - ${item.name || index+1}`; select.appendChild(option); });
}

async function checkAi() {
  const button=document.getElementById('step1-btn-check-ai'); const status=document.getElementById('step1-ai-status');
  if (button) { button.disabled=true; button.textContent='Đang kiểm tra...'; }
  if (status) status.textContent='Đang kiểm tra backend...';
  try { await window.api.health(); if (status) { status.textContent='Backend sẵn sàng.'; status.dataset.state='success'; } }
  catch { if (status) { status.textContent='Backend chưa kết nối.'; status.dataset.state='error'; } }
  finally { if (button) { button.disabled=false; button.textContent='⌁ Kiểm tra kết nối'; } }
}

async function previewVoice() {
  const button=document.getElementById('step1-btn-preview-voice'); const select=document.getElementById('step1-tts-voice'); const audio=document.getElementById('step1-voice-preview-audio');
  const selected=select?.value || 'none'; if (!button || !audio) return;
  if (selected === 'none') { notify('Hãy chọn một giọng trước khi nghe thử.','warn'); return; }
  let ref=null;
  if (selected.startsWith('clone:')) { try { ref=JSON.parse(localStorage.getItem('tts_voices') || '[]')[Number(selected.split(':')[1])]?.audioPath || null; } catch { ref=null; } }
  button.disabled=true; button.textContent='Đang tạo giọng thử...';
  try { const result=await window.api.generateTTS('Xin chào, đây là giọng đọc bạn đang chọn.',ref,localStorage.getItem('tts_language') || 'vi',selected); if (result?.status !== 'ok' || !result.audio_path) throw new Error(result?.error || 'Không tạo được audio thử.'); audio.src='file:///' + result.audio_path.replace(/\\/g,'/'); audio.style.display='block'; audio.playbackRate = Number(document.getElementById('step1-tts-speed')?.value || 1); await audio.play(); }
  catch (error) { notify(error?.message || 'Không thể nghe thử giọng.','error'); }
  finally { button.disabled=false; button.textContent='▶ Nghe thử giọng'; }
}

function deleteSelected() {
  const state=window._appState; const id=state?.pipeline1SelectedJobId;
  if (!state || !id) return notify('Chưa chọn Job để xóa.','warn');
  const job=state.jobs.find(item => item.id === id); if (!job || ['queued','processing'].includes(job.status)) return notify('Không thể xóa Job đang chạy.','warn');
  state.jobs=state.jobs.filter(item => item.id !== id); if (state.activeJobId === id) state.activeJobId=null; state.pipeline1SelectedJobId=null; window.renderJobList?.(); safeRenderDetail();
}
function deleteAllIdle() {
  const state=window._appState; if (!state) return;
  const locked=state.jobs.filter(item => ['queued','processing'].includes(item.status)); const removed=state.jobs.length-locked.length; state.jobs=locked;
  if (!locked.some(item => item.id === state.activeJobId)) state.activeJobId=null; if (!locked.some(item => item.id === state.pipeline1SelectedJobId)) state.pipeline1SelectedJobId=null;
  window.renderJobList?.(); safeRenderDetail(); notify(removed ? `Đã xóa ${removed} Job.` : 'Không có Job có thể xóa.', removed ? 'success' : 'info');
}
function notify(message,type='info') { if (typeof window.showToast === 'function') window.showToast(message,type); else console.log(`[Pipeline1] ${message}`); }

function watchQueue() {
  const list=document.getElementById('step1-job-list'); if (!list) return;
  const refresh=() => requestAnimationFrame(() => { decorateJobs(); updateQueueSummary(); syncDetailMeta(); });
  new MutationObserver(refresh).observe(list,{childList:true,subtree:true}); setTimeout(refresh,250);
}
function decorateJobs() {
  const state=window._appState; if (!state) return;
  [...document.querySelectorAll('#step1-job-list .tk-job-card')].forEach((card,index) => {
    if (card.dataset.approvedDecorated === 'true') return;
    const job=state.jobs[index], header=card.querySelector('.tk-job-card-header'); if (!job || !header) return;
    const controls=header.querySelector('div:last-child');
    header.innerHTML=`<span class="p1-job-index">${index+1}</span><span class="p1-job-thumb">▶</span><span class="p1-job-name-wrap"><strong title="${escapeAttr(job.fileName)}">${escapeHtml(job.fileName)}</strong><small>Video nguồn · Pipeline 1</small></span><span class="p1-job-state status-${job.status}">${statusLabel(job.status)}</span><span class="p1-job-time">${job._elapsedTimeString || '—'}</span><span class="p1-job-actions"></span>`;
    const slot=header.querySelector('.p1-job-actions'); if (controls && slot) { [...controls.querySelectorAll('button')].forEach(button => slot.appendChild(button)); controls.remove(); }
    card.dataset.approvedDecorated='true';
  });
}
function updateQueueSummary() {
  const jobs=window._appState?.jobs || []; const done=jobs.filter(job => job.status === 'finished').length; const total=jobs.length;
  const count=document.getElementById('job-count'), complete=document.getElementById('p1-complete-count'), fill=document.getElementById('p1-total-progress-fill');
  if (count) count.textContent=`${total} video`; if (complete) complete.textContent=`Đã hoàn thành: ${done}/${total}`; if (fill) fill.style.width=`${total ? Math.round(done/total*100) : 0}%`;
}
function syncDetailMeta() {
  const state=window._appState; const job=state?.jobs?.find(item => item.id === state.pipeline1SelectedJobId);
  const id=document.getElementById('step1-detail-id'), status=document.getElementById('step1-detail-status');
  if (id) id.textContent=job ? `ID: #${String(job.id).toUpperCase()}` : 'ID: —'; if (status) { status.textContent=job ? statusLabel(job.status) : 'Chờ xử lý'; status.dataset.state=job?.status || 'idle'; }
}
function statusLabel(status) { return ({idle:'Chờ xử lý',queued:'Đang chờ',processing:'Đang xử lý',finished:'Phân tích xong',error:'Lỗi'})[status] || status; }
function escapeHtml(value) { const div=document.createElement('div'); div.textContent=String(value ?? ''); return div.innerHTML; }
function escapeAttr(value) { return String(value ?? '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function selectedJob() { const state=window._appState; return state?.jobs?.find(job => job.id === state.pipeline1SelectedJobId) || null; }
function safeRenderDetail() {
  const job=selectedJob();
  const heading=document.getElementById('step1-detail-title'), status=document.getElementById('step1-detail-status'), text=document.getElementById('step1-detail-text'), audio=document.getElementById('step1-detail-audio'), empty=document.getElementById('step1-audio-empty');
  if (heading) heading.textContent=job?.fileName || 'Vui lòng chọn 1 Job';
  if (status) { status.textContent=job ? statusLabel(job.status) : 'Chờ xử lý'; status.dataset.state=job?.status || 'idle'; }
  if (text) text.value=job ? (job.aiContent || job.srtContent || '') : '';
  if (audio) { if (job?.ttsAudioPath) { audio.src='file:///' + job.ttsAudioPath.replace(/\\/g,'/'); audio.style.display='block'; } else { audio.removeAttribute('src'); audio.style.display='none'; } }
  if (empty) empty.style.display=job?.ttsAudioPath ? 'none' : 'block';
  syncDetailMeta();
}

function bindSafeDetailActions() {
  window.renderJobDetail1=safeRenderDetail;

  const oldSave=document.getElementById('step1-btn-save-text');
  if (oldSave) { const save=oldSave.cloneNode(true); oldSave.replaceWith(save); save.addEventListener('click',() => { const job=selectedJob(); const text=document.getElementById('step1-detail-text'); if (!job || !text) return; job.aiContent=text.value; window.addLog?.(`[AI] Đã cập nhật nội dung: ${job.fileName}`,'info'); }); }

  document.getElementById('step1-btn-extract')?.addEventListener('click',async() => {
    const job=selectedJob(); if (!job) return notify('Hãy chọn một Job.','warn');
    try { window.addLog?.('[ASR] Đang trích xuất lại nội dung...','info'); const result=await window.api.extractTextP1(job.id,job.filePath,job.asrLanguage || 'zh'); if (!result?.srt_content) throw new Error('Không có nội dung trả về.'); job.srtContent=result.srt_content; safeRenderDetail(); window.addLog?.('[ASR] Trích xuất lại thành công.','success'); }
    catch(error) { window.addLog?.('[ASR] Lỗi: ' + error.message,'error'); notify(error.message,'error'); }
  });

  document.getElementById('step1-btn-rewrite')?.addEventListener('click',async() => {
    const job=selectedJob(); if (!job) return notify('Hãy chọn một Job.','warn'); const source=job.srtContent || document.getElementById('step1-detail-text')?.value || ''; if (!source) return notify('Job chưa có nội dung để AI viết lại.','warn');
    try { await window.triggerAutoAiRewrite?.(job,source); safeRenderDetail(); }
    catch(error) { notify(error.message || 'AI viết lại thất bại.','error'); }
  });

  document.getElementById('step1-btn-gen-tts')?.addEventListener('click',async() => {
    const job=selectedJob(); if (!job) return notify('Hãy chọn một Job.','warn'); let source=job.aiContent || job.srtContent || ''; if (!source) return notify('Job chưa có nội dung để tạo TTS.','warn'); if (!source.includes('-->') && job.srtContent && window._buildTimedSrt) source=window._buildTimedSrt(source,job.srtContent);
    try { await window.triggerAutoTts?.(job,source); safeRenderDetail(); document.querySelector('[data-p1-tab="audio"]')?.click(); }
    catch(error) { notify(error.message || 'Tạo TTS thất bại.','error'); }
  });

  document.getElementById('step1-btn-import-audio')?.addEventListener('click',async() => {
    const job=selectedJob(); if (!job) return notify('Hãy chọn một Job.','warn'); if (!window.electronAPI?.openFile) return;
    const result=await window.electronAPI.openFile([{name:'Audio',extensions:['wav','mp3','flac','ogg','m4a','aac','wma','opus']}]); const path=!result?.canceled && result?.filePaths?.[0]; if (!path) return; job.ttsAudioPath=path; safeRenderDetail(); window.addLog?.(`[TTS] Đã chọn audio: ${path}`,'info');
  });
}

document.addEventListener('DOMContentLoaded',() => {
  document.querySelectorAll('.step-chevron').forEach(step => step.addEventListener('click',() => {
    const n=step.dataset.step; document.querySelectorAll('.step-chevron').forEach(item => item.classList.remove('active')); step.classList.add('active');
    document.querySelectorAll('.pipeline-pane').forEach(current => { const active=current.id === `step-${n}-content`; current.style.display=active ? 'block' : 'none'; current.classList.toggle('active',active); });
    document.querySelector('.app-container')?.classList.toggle('pipeline1-shell-active',n === '1'); if (n === '2') window.dispatchEvent(new Event('resize'));
  }));
  bindSafeDetailActions();
});
