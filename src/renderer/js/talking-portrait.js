(function () {
  'use strict';

  const PAGE_ID = 'page-talking-portrait';
  const NAV_ID = 'nav-talking-portrait';
  const state = { imagePath: '', audioPath: '', imageUrl: '', audioUrl: '', running: false, engineReady: false, outputPath: '', mode: 'natural', unlisten: null };

  function ensureStyle() {
    if (document.querySelector('link[data-talking-portrait-style]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'styles/talking-portrait.css'; link.dataset.talkingPortraitStyle = 'true'; document.head.appendChild(link);
  }

  function mountNav() {
    const menu = document.querySelector('.nav-menu'); if (!menu || document.getElementById(NAV_ID)) return;
    const settings = menu.querySelector('[data-page="settings"]'); const item = document.createElement('a');
    item.href = '#'; item.id = NAV_ID; item.className = 'nav-item'; item.dataset.page = 'talking-portrait';
    item.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="M18 5l3-2v6l-3-2z"/></svg><span>AI Avatar</span><b class="tp-new">NEW</b>';
    if (settings) menu.insertBefore(item, settings); else menu.appendChild(item);
  }

  function mountPage() {
    const main = document.querySelector('.main-area'); if (!main || document.getElementById(PAGE_ID)) return;
    const page = document.createElement('section'); page.id = PAGE_ID; page.className = 'page tp-page';
    page.innerHTML = `
      <div class="tp-shell">
        <header class="tp-header"><div><h1>AI Avatar <span>— Video nhép miệng</span></h1><p>Tạo video nhân vật nói từ một ảnh chân dung và voice bằng JoyVASA + LivePortrait.</p></div><div><span id="tp-engine" class="tp-chip warn">Đang kiểm tra JoyVASA…</span><button id="tp-engine-config" class="tp-engine-config" type="button">Chọn engine</button></div></header>
        <div class="tp-steps"><b class="active">1 Tải lên</b><span>›</span><b>2 Tùy chỉnh</b><span>›</span><b>3 Tạo video</b><span>›</span><b>4 Xuất video</b></div>
        <div class="tp-grid">
          <section class="tp-panel tp-inputs"><h2>1. Tải lên dữ liệu</h2>
            <label>Hình ảnh nhân vật <small>JPG, PNG, WEBP · nên chính diện, đủ sáng</small></label>
            <div class="tp-image-row"><div id="tp-image-preview" class="tp-image-preview"><span>Chưa chọn ảnh</span></div><label class="tp-drop"><input id="tp-image" type="file" accept="image/png,image/jpeg,image/webp"><strong>＋ Chọn ảnh</strong><small>Chọn file từ máy</small></label></div>
            <label>Giọng nói <small>WAV, MP3, M4A</small></label><label class="tp-file"><input id="tp-audio" type="file" accept="audio/*"><strong id="tp-audio-name">＋ Chọn voice</strong><small>Voice tiếng Việt được hỗ trợ</small></label><audio id="tp-audio-player" controls></audio>
            <div class="tp-note"><strong>Engine</strong><span>JoyVASA sinh facial/head motion trực tiếp từ audio; LivePortrait render video.</span></div>
          </section>
          <section class="tp-panel tp-preview"><h2>3. Preview / Kết quả</h2><div id="tp-stage" class="tp-stage"><div><strong>Preview Avatar</strong><span>Chọn ảnh và voice để chuẩn bị job</span></div></div><video id="tp-result" controls style="display:none;width:100%;max-height:420px"></video><div id="tp-status" class="tp-status">Đang kiểm tra engine…</div><div class="tp-result-actions"><button id="tp-open-output" type="button" disabled>Mở video</button><button id="tp-save-output" type="button" disabled>Lưu bản sao</button></div></section>
          <section class="tp-panel tp-settings"><h2>2. Tùy chỉnh</h2>
            <label>Phong cách chuyển động</label><div class="tp-modes"><button data-mode="natural" class="active">Tự nhiên<small>Cân bằng</small></button><button data-mode="expressive">Sinh động<small>Mạnh hơn</small></button><button data-mode="calm">Điềm tĩnh<small>Nhẹ hơn</small></button></div>
            <label>Biểu cảm <output id="tp-exp-out">65%</output></label><input id="tp-expression" type="range" min="20" max="100" value="65">
            <label>Chuyển động đầu <output id="tp-head-out">60%</output></label><input id="tp-head" type="range" min="20" max="100" value="60">
            <label>Ưu tiên mắt tự nhiên <output id="tp-eye-out">70%</output></label><input id="tp-eye" type="range" min="20" max="100" value="70" disabled><small>JoyVASA upstream chưa có eye-strength độc lập ổn định; giữ engine mặc định.</small>
            <label>Ưu tiên lip-sync <output id="tp-lip-out">80%</output></label><input id="tp-lip" type="range" min="40" max="100" value="80" disabled><small>Lip motion lấy trực tiếp từ audio; không bật retargeting WIP.</small>
            <div class="tp-vietnamese"><div><strong>Voice tiếng Việt</strong><small>Audio-driven, không cần transcript.</small></div><span>ON</span></div>
            <label>Chất lượng</label><select id="tp-quality"><option value="preview">Preview nhanh (FP16)</option><option value="quality" selected>Chất lượng cao</option></select>
          </section>
        </div>
        <footer class="tp-footer"><div><strong>Điều kiện tạo video</strong><span id="tp-ready">Đang kiểm tra engine.</span></div><div><button id="tp-cancel" type="button" style="display:none">Dừng</button><button id="tp-generate" disabled>Tạo video full</button></div></footer>
      </div>`;
    main.appendChild(page);
  }

  function filePath(file) { try { return window.electronAPI?.getPathForFile?.(file) || ''; } catch { return ''; } }
  function setStatus(text, warning = false) { const el = document.getElementById('tp-status'); if (!el) return; el.textContent = text; el.classList.toggle('warning', warning); }

  function updateReady() {
    const inputsReady = Boolean(state.imagePath && state.audioPath); const ready = inputsReady && state.engineReady;
    const btn = document.getElementById('tp-generate'); const text = document.getElementById('tp-ready');
    if (btn) btn.disabled = !ready || state.running;
    if (text) text.textContent = !state.engineReady ? 'Cần cấu hình JoyVASA + model weights.' : inputsReady ? 'Engine + ảnh + voice đã sẵn sàng.' : 'Engine sẵn sàng; cần chọn ảnh và voice.';
  }

  async function refreshEngine() {
    const chip = document.getElementById('tp-engine');
    try {
      const status = await window.electronAPI?.getTalkingPortraitStatus?.(); state.engineReady = Boolean(status?.ok);
      if (chip) { chip.textContent = status?.ok ? `JoyVASA · sẵn sàng (${status.pythonMode})` : `JoyVASA · thiếu ${status?.missing?.join(', ') || 'engine'}`; chip.classList.toggle('warn', !status?.ok); }
      setStatus(status?.ok ? 'JoyVASA đã sẵn sàng.' : 'Chọn thư mục JoyVASA đã cài model weights để kích hoạt.', !status?.ok);
    } catch (error) { state.engineReady = false; if (chip) chip.textContent = 'JoyVASA · lỗi kiểm tra'; setStatus(error?.message || 'Không kiểm tra được JoyVASA.', true); }
    updateReady();
  }

  function showOutput(outputPath) {
    state.outputPath = outputPath || ''; const video = document.getElementById('tp-result'); const stage = document.getElementById('tp-stage');
    if (!state.outputPath || !video) return;
    video.src = `file://${state.outputPath.replace(/\\/g, '/')}`; video.style.display = 'block'; if (stage) stage.style.display = 'none';
    document.getElementById('tp-open-output').disabled = false; document.getElementById('tp-save-output').disabled = false;
  }

  function bind() {
    document.getElementById(NAV_ID)?.addEventListener('click', (event) => { event.preventDefault(); document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active')); document.getElementById(NAV_ID)?.classList.add('active'); document.querySelectorAll('.page').forEach(x => x.classList.remove('active')); document.getElementById(PAGE_ID)?.classList.add('active'); });
    document.getElementById('tp-engine-config')?.addEventListener('click', async () => { const result = await window.electronAPI?.chooseTalkingPortraitEngine?.(); if (result?.error) setStatus(result.error, true); await refreshEngine(); });
    document.getElementById('tp-image')?.addEventListener('change', (event) => { const file = event.target.files?.[0]; if (!file) return; state.imagePath = filePath(file); if (state.imageUrl) URL.revokeObjectURL(state.imageUrl); state.imageUrl = URL.createObjectURL(file); document.getElementById('tp-image-preview').innerHTML = `<img src="${state.imageUrl}" alt="Ảnh nhân vật">`; document.getElementById('tp-stage').innerHTML = `<img src="${state.imageUrl}" alt="Avatar preview">`; document.getElementById('tp-stage').style.display = ''; updateReady(); });
    document.getElementById('tp-audio')?.addEventListener('change', (event) => { const file = event.target.files?.[0]; if (!file) return; state.audioPath = filePath(file); if (state.audioUrl) URL.revokeObjectURL(state.audioUrl); state.audioUrl = URL.createObjectURL(file); document.getElementById('tp-audio-name').textContent = file.name; const player = document.getElementById('tp-audio-player'); player.src = state.audioUrl; player.style.display = 'block'; updateReady(); });
    document.querySelectorAll('.tp-modes button').forEach(btn => btn.addEventListener('click', () => { document.querySelectorAll('.tp-modes button').forEach(x => x.classList.remove('active')); btn.classList.add('active'); state.mode = btn.dataset.mode || 'natural'; }));
    [['tp-expression','tp-exp-out'],['tp-head','tp-head-out']].forEach(([id,out]) => document.getElementById(id)?.addEventListener('input', e => document.getElementById(out).textContent = `${e.target.value}%`));
    document.getElementById('tp-open-output')?.addEventListener('click', () => state.outputPath && window.electronAPI?.openPath?.(state.outputPath));
    document.getElementById('tp-save-output')?.addEventListener('click', () => state.outputPath && window.electronAPI?.saveCopy?.({ sourcePath: state.outputPath, suggestedName: 'ai-avatar.mp4' }));
    document.getElementById('tp-cancel')?.addEventListener('click', async () => { await window.electronAPI?.cancelTalkingPortrait?.(); setStatus('Đã gửi yêu cầu dừng JoyVASA.', true); });
    document.getElementById('tp-generate')?.addEventListener('click', async () => {
      if (state.running) return; state.running = true; updateReady(); document.getElementById('tp-cancel').style.display = ''; setStatus('Đang khởi động JoyVASA…');
      try {
        const result = await window.electronAPI?.generateTalkingPortrait?.({ imagePath: state.imagePath, audioPath: state.audioPath, mode: state.mode, expression: Number(document.getElementById('tp-expression').value), head: Number(document.getElementById('tp-head').value), quality: document.getElementById('tp-quality').value });
        if (!result?.ok) { setStatus(result?.error || 'JoyVASA không tạo được video.', true); return; }
        showOutput(result.outputPath); setStatus(`Hoàn tất AI Avatar · cfg ${result.cfg?.cfgScale} · motion ${result.cfg?.drivingMultiplier}`);
      } catch (error) { setStatus(error?.message || 'Lỗi khi chạy JoyVASA.', true); }
      finally { state.running = false; document.getElementById('tp-cancel').style.display = 'none'; updateReady(); }
    });
    state.unlisten = window.electronAPI?.onTalkingPortraitProgress?.((payload) => { if (payload?.message) setStatus(payload.message.slice(-320), payload.type === 'error'); });
  }

  function init() { ensureStyle(); mountNav(); mountPage(); bind(); refreshEngine(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 120)); else setTimeout(init, 120);
})();
