const STYLE_ATTR = 'data-pipeline1-approved';

ensureStyle();
mountPipeline1();

function ensureStyle() {
  if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/pipeline1-approved.css';
  link.setAttribute(STYLE_ATTR, 'true');
  document.head.appendChild(link);
}

function mountPipeline1() {
  const pane = document.getElementById('step-1-content');
  if (!pane || pane.dataset.approvedMounted === 'true') return;

  pane.innerHTML = `
    <div class="p1-approved-shell">
      <header class="p1-page-header">
        <div class="p1-page-title-row">
          <span class="p1-page-icon">P1</span>
          <div>
            <h1>Pipeline 1 · Phân tích &amp; Viết lại nội dung</h1>
            <p>Phân tích video, trích xuất nội dung và viết lại bằng AI để tối ưu cho giọng đọc / TTS.</p>
          </div>
        </div>
      </header>

      <div class="p1-workspace-grid">
        <aside class="p1-config-column">
          <section class="p1-card p1-ai-card">
            ${sectionTitle('1', 'AI & Prompt', 'AI')}
            <div class="p1-field">
              <label for="step1-ai-provider">Nhà cung cấp AI</label>
              <select id="step1-ai-provider" class="p1-control">
                <option value="gemini">Gemini</option>
                <option value="deepseek">DeepSeek</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>
            <div class="p1-field">
              <label for="step1-ai-model">Model</label>
              <input id="step1-ai-model" class="p1-control" type="text" list="step1-ai-model-list" placeholder="Model đang dùng">
              <datalist id="step1-ai-model-list"></datalist>
            </div>
            <div class="p1-field">
              <label for="ai-prompt-select">Prompt preset</label>
              <select id="ai-prompt-select" class="p1-control"></select>
            </div>
            <div class="p1-two-actions">
              <button id="step1-btn-edit-prompt" class="p1-btn p1-btn-secondary" type="button">☷ Quản lý Prompt</button>
              <button id="step1-btn-check-ai" class="p1-btn p1-btn-secondary" type="button">⌁ Kiểm tra kết nối</button>
            </div>
            <button id="step1-btn-add-prompt" class="p1-hidden-control" type="button" tabindex="-1" aria-hidden="true">Add Prompt</button>
            <div id="step1-ai-status" class="p1-inline-status" aria-live="polite"></div>
          </section>

          <section class="p1-card p1-voice-card">
            ${sectionTitle('2', 'Giọng đọc & Voice', 'TTS')}
            <div class="p1-field">
              <label for="step1-tts-voice">Loại giọng</label>
              <select id="step1-tts-voice" class="p1-control">
                <option value="none">Không lồng tiếng</option>
                <option value="default">Giọng mặc định (OmniVoice)</option>
                <option value="vi-VN-HoaiMyNeural">Nữ - Hoài My (Neural)</option>
                <option value="vi-VN-NamMinhNeural">Nam - Nam Minh (Neural)</option>
                <option value="en-US-JennyNeural">Jenny - English</option>
                <option value="en-US-GuyNeural">Guy - English</option>
              </select>
            </div>
            <button id="step1-btn-preview-voice" class="p1-btn p1-btn-preview" type="button">▶ Nghe thử giọng</button>
            <audio id="step1-voice-preview-audio" class="p1-preview-audio" controls></audio>

            <div class="p1-field p1-speed-field">
              <div class="p1-label-row"><label for="step1-tts-speed">Tốc độ đọc</label><strong id="step1-speed-value">1.00x</strong></div>
              <input id="step1-tts-speed" class="p1-range" type="range" min="0.5" max="2" value="1" step="0.05">
              <div class="p1-range-labels"><span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span></div>
            </div>

            <label class="p1-toggle-row">
              <span class="p1-toggle-copy"><strong>Ổn định cao</strong><small>Giảm nhiễu, ưu tiên giọng mượt hơn</small></span>
              <input id="step1-voice-stable" type="checkbox" checked>
              <span class="p1-switch"></span>
            </label>
            <label class="p1-toggle-row">
              <span class="p1-toggle-copy"><strong>Chuẩn hóa âm lượng</strong><small>Giữ mức âm lượng nghe đồng đều</small></span>
              <input id="step1-normalize-volume" type="checkbox" checked>
              <span class="p1-switch"></span>
            </label>
          </section>
        </aside>

        <main class="p1-center-column">
          <section class="p1-card p1-queue-card">
            <div class="p1-card-head">
              ${sectionTitle('3', 'Job Queue', 'QUEUE', true)}
              <button id="step1-btn-refresh-queue" class="p1-ghost-action" type="button">↻ Làm mới</button>
            </div>
            <div class="p1-queue-head"><span>#</span><span>Tên video</span><span>Trạng thái</span><span>Thời gian</span><span>Thao tác</span></div>
            <div id="step1-job-list" class="tk-job-list p1-job-list">
              <div class="job-empty">Chưa có video nào.</div>
            </div>
            <div class="p1-drop-area">
              <div class="p1-drop-icon">▶</div>
              <strong>Kéo &amp; thả video vào đây</strong>
              <span>Hỗ trợ MP4, MOV, MKV, AVI, WEBM</span>
              <small>hoặc</small>
              <button id="btn-upload-step1" class="p1-btn p1-btn-primary p1-add-video" type="button">＋ Thêm Video</button>
            </div>
            <div class="p1-queue-footer">
              <span>Tổng: <strong id="job-count">(0 Items)</strong></span>
              <span id="p1-complete-count">Đã hoàn thành: 0/0</span>
            </div>
            <div class="p1-total-progress"><span id="p1-total-progress-fill"></span></div>
          </section>

          <section class="p1-card p1-actions-card">
            ${sectionTitle('5', 'Hành động', 'ACTION')}
            <div class="p1-action-grid">
              <button id="btn-start-all" class="p1-btn p1-btn-run" type="button">▶ Bắt đầu chạy</button>
              <button id="p1-action-add" class="p1-btn p1-btn-primary" type="button">＋ Thêm Video</button>
              <button id="btn-stop-all" class="p1-btn p1-btn-secondary" type="button">⏹ Dừng xử lý</button>
              <button id="p1-delete-selected" class="p1-btn p1-btn-danger-ghost" type="button">🗑 Xóa đã chọn</button>
              <button id="p1-delete-all" class="p1-btn p1-btn-secondary" type="button">× Xóa tất cả</button>
            </div>
          </section>
        </main>

        <aside class="p1-detail-column">
          <section class="p1-card p1-detail-card">
            <div class="p1-detail-heading">
              ${sectionTitle('4', 'Chi tiết Job đang chọn', 'JOB', true)}
              <div class="p1-job-meta"><span id="step1-detail-id">ID: —</span><span id="step1-detail-status" class="p1-status-chip">Chờ xử lý</span></div>
            </div>
            <h3 id="step1-detail-title" class="p1-selected-title">Vui lòng chọn 1 Job</h3>
            <div class="p1-tabs" role="tablist">
              <button class="p1-tab active" type="button" data-p1-tab="content">Nội dung (SRT / Tóm tắt)</button>
              <button class="p1-tab" type="button" data-p1-tab="audio">Âm thanh Lồng tiếng</button>
            </div>

            <div class="p1-tab-pane active" data-p1-pane="content">
              <textarea id="step1-detail-text" class="p1-transcript" placeholder="Nội dung bóc băng hoặc AI viết lại sẽ hiển thị ở đây..."></textarea>
              <div class="p1-detail-actions">
                <button id="step1-btn-extract" class="p1-btn p1-btn-secondary" type="button">↻ Trích xuất lại</button>
                <button id="step1-btn-rewrite" class="p1-btn p1-btn-secondary" type="button">✨ AI Viết lại</button>
                <button id="step1-btn-save-text" class="p1-btn p1-btn-accent" type="button">💾 Cập nhật Text</button>
              </div>
            </div>

            <div class="p1-tab-pane" data-p1-pane="audio">
              <div class="p1-audio-workspace">
                <div id="step1-audio-empty" class="p1-audio-empty">Chưa có audio lồng tiếng</div>
                <audio id="step1-detail-audio" class="p1-detail-audio" controls></audio>
              </div>
              <div class="p1-detail-actions p1-audio-actions">
                <button id="step1-btn-gen-tts" class="p1-btn p1-btn-primary" type="button">◉ Tạo TTS</button>
                <button id="step1-btn-import-audio" class="p1-btn p1-btn-secondary" type="button">📁 Upload Audio</button>
              </div>
            </div>
          </section>

          <section class="p1-card p1-log-card">
            <div class="p1-card-head">
              ${sectionTitle('6', 'Console / Log', 'LOG', true)}
              <div class="p1-log-actions"><span class="p1-live-dot">● Live</span><button id="step1-btn-copy-log" class="p1-mini-btn" type="button">Copy</button><button id="step1-btn-clear-log" class="p1-mini-btn" type="button">Xóa</button></div>
            </div>
            <div id="step1-log-output" class="tk-log-body p1-log-output"></div>
          </section>
        </aside>
      </div>
    </div>`;

  pane.dataset.approvedMounted = 'true';
  ensurePipelineNav();
  bindUiOnlyBehavior();
  syncControlsFromSettings();
  observeJobList();
}

function sectionTitle(number, title, icon, compact = false) {
  return `<div class="p1-section-title${compact ? ' compact' : ''}"><span class="p1-section-number">${number}</span><strong>${title}</strong><span class="p1-section-icon">${icon}</span></div>`;
}

function ensurePipelineNav() {
  const nav = document.querySelector('.nav-menu');
  const settings = nav?.querySelector('[data-page="settings"]');
  if (!nav || nav.querySelector('[data-pipeline1-nav]')) return;
  const item = document.createElement('a');
  item.href = '#';
  item.className = 'nav-item active';
  item.dataset.page = 'home';
  item.dataset.pipeline1Nav = 'true';
  item.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span>Pipeline 1</span>';
  if (settings) nav.insertBefore(item, settings);
  else nav.appendChild(item);

  const brand = document.querySelector('.brand h2');
  if (brand && brand.textContent.trim() === 'VSR') brand.dataset.shortBrand = 'VSR';
  activatePipelineShell();

  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', () => {
      const isSettings = link.dataset.page === 'settings';
      const isPipeline = link.dataset.pipeline1Nav === 'true';
      document.querySelector('.app-container')?.classList.toggle('pipeline1-shell-active', !isSettings);
      if (brand) brand.textContent = isSettings ? (brand.dataset.shortBrand || 'VSR') : 'Video Subtitle Remover';
      if (isPipeline) item.classList.add('active');
    });
  });
}

function activatePipelineShell() {
  document.querySelector('.app-container')?.classList.add('pipeline1-shell-active');
  const brand = document.querySelector('.brand h2');
  if (brand) brand.textContent = 'Video Subtitle Remover';
}

function bindUiOnlyBehavior() {
  document.querySelectorAll('.p1-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const name = tab.dataset.p1Tab;
      document.querySelectorAll('.p1-tab').forEach(x => x.classList.toggle('active', x === tab));
      document.querySelectorAll('.p1-tab-pane').forEach(x => x.classList.toggle('active', x.dataset.p1Pane === name));
    });
  });

  const provider = document.getElementById('step1-ai-provider');
  const model = document.getElementById('step1-ai-model');
  provider?.addEventListener('change', () => {
    localStorage.setItem('ai_provider', provider.value);
    model.value = localStorage.getItem(`ai_model_${provider.value}`) || '';
    populateModelSuggestions(provider.value);
    setInlineStatus('Đã chuyển provider. Model được nạp theo cấu hình đã lưu.');
  });
  model?.addEventListener('change', () => {
    const p = provider?.value || 'gemini';
    localStorage.setItem(`ai_model_${p}`, model.value);
  });

  const voice = document.getElementById('step1-tts-voice');
  voice?.addEventListener('change', () => localStorage.setItem('tts_voice', voice.value));

  const speed = document.getElementById('step1-tts-speed');
  speed?.addEventListener('input', () => {
    document.getElementById('step1-speed-value').textContent = `${Number(speed.value).toFixed(2)}x`;
    localStorage.setItem('tts_speed', speed.value);
  });

  document.getElementById('step1-btn-preview-voice')?.addEventListener('click', previewSelectedVoice);
  document.getElementById('step1-btn-check-ai')?.addEventListener('click', checkAiConnection);
  document.getElementById('step1-btn-refresh-queue')?.addEventListener('click', () => {
    window.renderJobList?.();
    updateQueueSummary();
  });
  document.getElementById('p1-action-add')?.addEventListener('click', () => document.getElementById('btn-upload-step1')?.click());
  document.getElementById('p1-delete-selected')?.addEventListener('click', deleteSelectedJob);
  document.getElementById('p1-delete-all')?.addEventListener('click', deleteAllIdleJobs);

  window.addEventListener('storage', syncControlsFromSettings);
  setTimeout(syncControlsFromSettings, 250);
}

function syncControlsFromSettings() {
  const provider = document.getElementById('step1-ai-provider');
  const model = document.getElementById('step1-ai-model');
  const voice = document.getElementById('step1-tts-voice');
  if (!provider || !model || !voice) return;

  const p = localStorage.getItem('ai_provider') || 'gemini';
  provider.value = ['gemini', 'deepseek', 'ollama'].includes(p) ? p : 'gemini';
  model.value = localStorage.getItem(`ai_model_${provider.value}`) || '';
  populateModelSuggestions(provider.value);

  syncVoiceOptions();
  const savedVoice = localStorage.getItem('tts_voice') || 'none';
  if ([...voice.options].some(o => o.value === savedVoice)) voice.value = savedVoice;

  const speed = document.getElementById('step1-tts-speed');
  const savedSpeed = Number(localStorage.getItem('tts_speed') || '1');
  if (speed && Number.isFinite(savedSpeed) && savedSpeed >= 0.5 && savedSpeed <= 2) {
    speed.value = String(savedSpeed);
    document.getElementById('step1-speed-value').textContent = `${savedSpeed.toFixed(2)}x`;
  }
}

function syncVoiceOptions() {
  const select = document.getElementById('step1-tts-voice');
  if (!select) return;
  [...select.options].filter(o => o.value.startsWith('clone:')).forEach(o => o.remove());
  let voices = [];
  try { voices = JSON.parse(localStorage.getItem('tts_voices') || '[]'); } catch { voices = []; }
  voices.forEach((voice, index) => {
    const option = document.createElement('option');
    option.value = `clone:${index}`;
    option.textContent = `Giọng clone - ${voice.name || index + 1}`;
    select.appendChild(option);
  });
}

function populateModelSuggestions(provider) {
  const list = document.getElementById('step1-ai-model-list');
  if (!list) return;
  const defaults = {
    gemini: ['gemini-2.5-flash', 'gemini-2.5-pro'],
    deepseek: ['deepseek-chat', 'deepseek-reasoner'],
    ollama: [],
  };
  list.replaceChildren(...(defaults[provider] || []).map(name => {
    const option = document.createElement('option');
    option.value = name;
    return option;
  }));
}

async function checkAiConnection() {
  const button = document.getElementById('step1-btn-check-ai');
  if (button) { button.disabled = true; button.textContent = 'Đang kiểm tra...'; }
  setInlineStatus('Đang kiểm tra backend...');
  try {
    await window.api.health();
    setInlineStatus('Backend sẵn sàng. Cấu hình AI có thể được sử dụng.', 'success');
  } catch {
    setInlineStatus('Backend chưa kết nối.', 'error');
  } finally {
    if (button) { button.disabled = false; button.textContent = '⌁ Kiểm tra kết nối'; }
  }
}

async function previewSelectedVoice() {
  const button = document.getElementById('step1-btn-preview-voice');
  const select = document.getElementById('step1-tts-voice');
  const audio = document.getElementById('step1-voice-preview-audio');
  const voice = select?.value || 'none';
  if (!button || !audio) return;
  if (voice === 'none') {
    notify('Hãy chọn một giọng trước khi nghe thử.', 'warn');
    return;
  }

  let refAudio = null;
  if (voice.startsWith('clone:')) {
    try {
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      refAudio = voices[Number(voice.split(':')[1])]?.audioPath || null;
    } catch { refAudio = null; }
  }

  button.disabled = true;
  button.textContent = 'Đang tạo giọng thử...';
  try {
    const language = localStorage.getItem('tts_language') || 'vi';
    const result = await window.api.generateTTS('Xin chào, đây là giọng đọc bạn đang chọn.', refAudio, language, voice);
    if (result?.status !== 'ok' || !result.audio_path) throw new Error(result?.error || 'Không tạo được audio thử.');
    audio.src = 'file:///' + result.audio_path.replace(/\\/g, '/');
    audio.style.display = 'block';
    await audio.play();
    notify('Đang phát giọng đã chọn.', 'success');
  } catch (error) {
    notify(error?.message || 'Không thể nghe thử giọng.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = '▶ Nghe thử giọng';
  }
}

function setInlineStatus(text, type = '') {
  const node = document.getElementById('step1-ai-status');
  if (!node) return;
  node.textContent = text;
  node.dataset.state = type;
}

function notify(message, type = 'info') {
  if (typeof window.showToast === 'function') window.showToast(message, type);
  else console.log(`[Pipeline1 UI] ${message}`);
}

function deleteSelectedJob() {
  const state = window._appState;
  const selected = state?.pipeline1SelectedJobId;
  if (!state || !selected) {
    notify('Chưa chọn Job để xóa.', 'warn');
    return;
  }
  const job = state.jobs.find(x => x.id === selected);
  if (!job || job.status === 'processing' || job.status === 'queued') {
    notify('Không thể xóa Job đang xử lý hoặc đang chờ.', 'warn');
    return;
  }
  state.jobs = state.jobs.filter(x => x.id !== selected);
  if (state.activeJobId === selected) state.activeJobId = null;
  state.pipeline1SelectedJobId = null;
  window.renderJobList?.();
  window.renderJobDetail1?.();
  updateQueueSummary();
}

function deleteAllIdleJobs() {
  const state = window._appState;
  if (!state) return;
  const locked = state.jobs.filter(x => x.status === 'processing' || x.status === 'queued');
  const removed = state.jobs.length - locked.length;
  state.jobs = locked;
  if (!state.jobs.some(x => x.id === state.pipeline1SelectedJobId)) state.pipeline1SelectedJobId = null;
  if (!state.jobs.some(x => x.id === state.activeJobId)) state.activeJobId = null;
  window.renderJobList?.();
  window.renderJobDetail1?.();
  updateQueueSummary();
  notify(removed ? `Đã xóa ${removed} Job không chạy.` : 'Không có Job có thể xóa.', removed ? 'success' : 'info');
}

function observeJobList() {
  const list = document.getElementById('step1-job-list');
  if (!list) return;
  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      decorateJobCards();
      updateQueueSummary();
      syncDetailMeta();
    });
  });
  observer.observe(list, { childList: true, subtree: true });
  setTimeout(() => {
    decorateJobCards();
    updateQueueSummary();
    syncDetailMeta();
  }, 300);
}

function decorateJobCards() {
  const state = window._appState;
  const cards = [...document.querySelectorAll('#step1-job-list .tk-job-card')];
  if (!state || !cards.length) return;
  cards.forEach((card, index) => {
    if (card.dataset.approvedDecorated === 'true') return;
    const job = state.jobs[index];
    if (!job) return;
    const header = card.querySelector('.tk-job-card-header');
    if (!header) return;
    const controls = header.querySelector('div:last-child');
    const statusText = statusLabel(job.status);
    const elapsed = job._elapsedTimeString || '—';
    header.innerHTML = `
      <span class="p1-job-index">${index + 1}</span>
      <span class="p1-job-thumb">▶</span>
      <span class="p1-job-name-wrap"><strong title="${escapeAttr(job.fileName)}">${escapeHtml(job.fileName)}</strong><small>Video nguồn · Pipeline 1</small></span>
      <span class="p1-job-state status-${job.status}">${statusText}</span>
      <span class="p1-job-time">${elapsed}</span>
      <span class="p1-job-actions"></span>`;
    const actionSlot = header.querySelector('.p1-job-actions');
    if (controls && actionSlot) {
      [...controls.querySelectorAll('button')].forEach(btn => actionSlot.appendChild(btn));
      controls.remove();
    }
    card.dataset.approvedDecorated = 'true';
  });
}

function updateQueueSummary() {
  const jobs = window._appState?.jobs || [];
  const done = jobs.filter(job => job.status === 'finished').length;
  const total = jobs.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const count = document.getElementById('job-count');
  if (count) count.textContent = `${total} video`;
  const complete = document.getElementById('p1-complete-count');
  if (complete) complete.textContent = `Đã hoàn thành: ${done}/${total}`;
  const fill = document.getElementById('p1-total-progress-fill');
  if (fill) fill.style.width = `${pct}%`;
}

function syncDetailMeta() {
  const state = window._appState;
  const selected = state?.jobs?.find(job => job.id === state.pipeline1SelectedJobId);
  const id = document.getElementById('step1-detail-id');
  const status = document.getElementById('step1-detail-status');
  if (id) id.textContent = selected ? `ID: #${String(selected.id).toUpperCase()}` : 'ID: —';
  if (status) {
    status.textContent = selected ? statusLabel(selected.status) : 'Chờ xử lý';
    status.dataset.state = selected?.status || 'idle';
  }
}

function statusLabel(status) {
  return ({ idle: 'Chờ xử lý', queued: 'Đang chờ', processing: 'Đang xử lý', finished: 'Phân tích xong', error: 'Lỗi' })[status] || status;
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}

function escapeAttr(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
