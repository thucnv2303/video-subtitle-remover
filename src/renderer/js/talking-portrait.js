(function () {
  'use strict';

  const PAGE_ID = 'page-talking-portrait';
  const NAV_ID = 'nav-talking-portrait';
  const state = { imagePath: '', audioPath: '', imageUrl: '', audioUrl: '', running: false };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  }

  function ensureStyle() {
    if (document.querySelector('link[data-talking-portrait-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/talking-portrait.css';
    link.dataset.talkingPortraitStyle = 'true';
    document.head.appendChild(link);
  }

  function mountNav() {
    const menu = document.querySelector('.nav-menu');
    if (!menu || document.getElementById(NAV_ID)) return;
    const settings = menu.querySelector('[data-page="settings"]');
    const item = document.createElement('a');
    item.href = '#';
    item.id = NAV_ID;
    item.className = 'nav-item';
    item.dataset.page = 'talking-portrait';
    item.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M18 5l3-2v6l-3-2z"/></svg><span>AI Avatar</span><b class="tp-new">NEW</b>';
    if (settings) menu.insertBefore(item, settings); else menu.appendChild(item);
  }

  function mountPage() {
    const main = document.querySelector('.main-area');
    if (!main || document.getElementById(PAGE_ID)) return;
    const page = document.createElement('section');
    page.id = PAGE_ID;
    page.className = 'page tp-page';
    page.innerHTML = `
      <div class="tp-shell">
        <header class="tp-header"><div><h1>AI Avatar <span>— Video nhép miệng</span></h1><p>Tạo video nhân vật nói tự nhiên từ một ảnh chân dung và voice, tối ưu workflow tiếng Việt.</p></div><span id="tp-engine" class="tp-chip warn">JoyVASA · cần cài engine</span></header>
        <div class="tp-steps"><b class="active">1 Tải lên</b><span>›</span><b>2 Tùy chỉnh</b><span>›</span><b>3 Xem trước</b><span>›</span><b>4 Xuất video</b></div>
        <div class="tp-grid">
          <section class="tp-panel tp-inputs"><h2>1. Tải lên dữ liệu</h2>
            <label>Hình ảnh nhân vật <small>JPG, PNG, WEBP · nên dùng ảnh chính diện, đủ sáng</small></label>
            <div class="tp-image-row"><div id="tp-image-preview" class="tp-image-preview"><span>Chưa chọn ảnh</span></div><label class="tp-drop"><input id="tp-image" type="file" accept="image/png,image/jpeg,image/webp"><strong>＋ Chọn ảnh</strong><small>Kéo thả hoặc chọn file</small></label></div>
            <label>Giọng nói <small>WAV, MP3, M4A</small></label>
            <label class="tp-file"><input id="tp-audio" type="file" accept="audio/*"><strong id="tp-audio-name">＋ Chọn voice</strong><small id="tp-audio-meta">Voice tiếng Việt được hỗ trợ</small></label>
            <audio id="tp-audio-player" controls></audio>
            <div class="tp-note"><strong>Engine MVP</strong><span>JoyVASA + LivePortrait · audio-driven facial dynamics, head motion và lip-sync.</span></div>
          </section>
          <section class="tp-panel tp-preview"><h2>3. Xem trước</h2><div id="tp-stage" class="tp-stage"><div><strong>Preview Avatar</strong><span>Chọn ảnh và voice để chuẩn bị job</span></div></div><div id="tp-status" class="tp-status">Sẵn sàng cấu hình.</div></section>
          <section class="tp-panel tp-settings"><h2>2. Tùy chỉnh</h2>
            <label>Phong cách chuyển động</label><div class="tp-modes"><button data-mode="natural" class="active">Tự nhiên<small>Cân bằng</small></button><button data-mode="expressive">Sinh động<small>Nhiều biểu cảm</small></button><button data-mode="calm">Điềm tĩnh<small>Ít chuyển động</small></button></div>
            <label>Biểu cảm <output id="tp-exp-out">65%</output></label><input id="tp-expression" type="range" min="20" max="100" value="65">
            <label>Chuyển động đầu <output id="tp-head-out">60%</output></label><input id="tp-head" type="range" min="20" max="100" value="60">
            <label>Tự nhiên mắt <output id="tp-eye-out">70%</output></label><input id="tp-eye" type="range" min="20" max="100" value="70">
            <label>Độ khớp miệng <output id="tp-lip-out">80%</output></label><input id="tp-lip" type="range" min="40" max="100" value="80">
            <div class="tp-vietnamese"><div><strong>Voice tiếng Việt</strong><small>Audio-driven; không phụ thuộc transcript.</small></div><span>ON</span></div>
            <label>Chất lượng</label><select id="tp-quality"><option value="preview">Preview nhanh</option><option value="quality" selected>Chất lượng cao</option></select>
          </section>
        </div>
        <footer class="tp-footer"><div><strong>Điều kiện tạo video</strong><span id="tp-ready">Cần chọn ảnh và voice.</span></div><button id="tp-generate" disabled>Tạo video full</button></footer>
      </div>`;
    main.appendChild(page);
  }

  function filePath(file) {
    try { return window.electronAPI?.getPathForFile?.(file) || ''; } catch { return ''; }
  }

  function updateReady() {
    const ready = Boolean(state.imagePath && state.audioPath);
    const btn = document.getElementById('tp-generate');
    const text = document.getElementById('tp-ready');
    if (btn) btn.disabled = !ready || state.running;
    if (text) text.textContent = ready ? 'Ảnh + voice hợp lệ. Có thể tạo job.' : 'Cần chọn ảnh và voice.';
  }

  function bind() {
    document.getElementById(NAV_ID)?.addEventListener('click', (event) => {
      event.preventDefault();
      document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
      document.getElementById(NAV_ID)?.classList.add('active');
      document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
      document.getElementById(PAGE_ID)?.classList.add('active');
    });
    document.getElementById('tp-image')?.addEventListener('change', (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      state.imagePath = filePath(file);
      if (state.imageUrl) URL.revokeObjectURL(state.imageUrl);
      state.imageUrl = URL.createObjectURL(file);
      document.getElementById('tp-image-preview').innerHTML = `<img src="${state.imageUrl}" alt="Ảnh nhân vật">`;
      document.getElementById('tp-stage').innerHTML = `<img src="${state.imageUrl}" alt="Avatar preview">`;
      updateReady();
    });
    document.getElementById('tp-audio')?.addEventListener('change', (event) => {
      const file = event.target.files?.[0]; if (!file) return;
      state.audioPath = filePath(file);
      if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
      state.audioUrl = URL.createObjectURL(file);
      document.getElementById('tp-audio-name').textContent = file.name;
      const player = document.getElementById('tp-audio-player'); player.src = state.audioUrl; player.style.display = 'block';
      updateReady();
    });
    document.querySelectorAll('.tp-modes button').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.tp-modes button').forEach(x => x.classList.remove('active')); btn.classList.add('active'); }));
    [['tp-expression','tp-exp-out'],['tp-head','tp-head-out'],['tp-eye','tp-eye-out'],['tp-lip','tp-lip-out']].forEach(([id,out]) => document.getElementById(id)?.addEventListener('input', e => document.getElementById(out).textContent = `${e.target.value}%`));
    document.getElementById('tp-generate')?.addEventListener('click', async () => {
      const status = document.getElementById('tp-status');
      status.textContent = 'UI đã sẵn sàng. Engine JoyVASA chưa được bootstrap trong build này; không tạo output giả.';
      status.classList.add('warning');
    });
  }

  function init() { ensureStyle(); mountNav(); mountPage(); bind(); updateReady(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 120)); else setTimeout(init, 120);
})();
