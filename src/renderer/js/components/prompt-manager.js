/**
 * Prompt Manager — Quản lý danh sách prompt AI
 * Expose qua window.initPromptManager để gọi từ app.js (non-module script)
 */

import { addLog, showToast } from '../utils/logger.js';

const DEFAULT_PROMPTS = [
  {
    id: 'p1',
    name: '🎙️ Lồng tiếng truyền cảm & Nhấn nhá (Mặc định)',
    content: 'Bạn là chuyên gia lồng tiếng Voice Talent. Hãy viết lại/dịch văn bản sau thành kịch bản nói tiếng Việt cực kỳ tự nhiên, câu ngắn 8-14 từ dễ lấy hơi, văn phong nói sống động. Dùng *từ khóa* để nhấn mạnh từ đắt giá, dùng ... để ngắt nhịp lấy hơi, dùng — để chuyển ý, viết số thành chữ. Giữ nguyên định dạng dòng/SRT nếu có.',
  },
  {
    id: 'p2',
    name: '🔥 Review / Bán hàng TikTok (Sôi nổi & Kích thích)',
    content: 'Bạn là MC Reviewer chuyên nghiệp. Hãy viết lại văn bản sau theo phong cách cuốn hút, tạo tò mò, nhấn mạnh tính năng độc đáo bằng dấu *từ khóa*, ngắt nhịp hồi hộp bằng ... và kết thúc bằng câu kêu gọi hành động hào hứng.',
  },
  {
    id: 'p3',
    name: '📖 Kể chuyện & Drama (Hồi hộp & Lắng đọng)',
    content: 'Bạn là người dẫn chuyện Audio Book. Hãy viết lại văn bản sau với nhịp điệu chậm rãi, sâu lắng, chèn các khoảng ngắt ... để tạo sự hồi hộp, nhấn nhá *từ khóa* ở các bước ngoặt cảm xúc.',
  },
  {
    id: 'p4',
    name: '📝 Dịch sát nghĩa phụ đề (Chuẩn phụ đề)',
    content: 'Bạn là chuyên gia dịch thuật phụ đề. Hãy dịch phụ đề sau sang Tiếng Việt thật tự nhiên, chính xác, giữ nguyên cấu trúc dòng và timestamp.',
  },
];

function getPrompts() {
  try {
    const p = JSON.parse(localStorage.getItem('ai_prompts'));
    return p && p.length ? p : DEFAULT_PROMPTS;
  } catch { return DEFAULT_PROMPTS; }
}

function savePrompts(p) {
  localStorage.setItem('ai_prompts', JSON.stringify(p));
}

export function renderPromptDropdown() {
  const select = document.getElementById('ai-prompt-select');
  if (!select) return;
  const prompts  = getPrompts();
  select.innerHTML = '';
  prompts.forEach(p => {
    const opt = document.createElement('option');
    opt.value       = p.id;
    opt.textContent = p.name;
    select.appendChild(opt);
  });
  const activeId = localStorage.getItem('ai_active_prompt_id');
  if (activeId && prompts.find(p => p.id === activeId)) select.value = activeId;
}

export function initPromptManager() {
  const btnManage  = document.getElementById('btn-manage-prompts');
  const modal      = document.getElementById('prompt-modal');
  const btnClose   = document.getElementById('btn-close-prompt-modal');
  const select     = document.getElementById('ai-prompt-select');  // dropdown trong panel AI
  const list       = document.getElementById('modal-prompt-list'); // list trong modal
  const inpName    = document.getElementById('modal-prompt-name');
  const inpContent = document.getElementById('modal-prompt-content');
  const btnSave    = document.getElementById('btn-save-prompt');
  const btnDelete  = document.getElementById('btn-delete-prompt');

  // ── Render list trong modal ──
  function renderModalList() {
    if (!list) return;
    const prompts = getPrompts();
    list.innerHTML = '';
    prompts.forEach(p => {
      const opt = document.createElement('option');
      opt.value       = p.id;
      opt.textContent = p.name;
      list.appendChild(opt);
    });
  }

  // ── Mở modal ──
  if (btnManage) {
    btnManage.addEventListener('click', () => {
      renderModalList();
      if (modal) modal.classList.remove('hidden');
    });
  }

  // Cũng bind các nút ở Step 1 panel (step1-btn-edit-prompt, step1-btn-add-prompt)
  ['step1-btn-edit-prompt', 'step1-btn-add-prompt'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        renderModalList();
        if (modal) modal.classList.remove('hidden');
      });
    }
  });

  // ── Đóng modal ──
  if (btnClose) {
    btnClose.addEventListener('click', () => { if (modal) modal.classList.add('hidden'); });
  }
  // Đóng khi click overlay
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  // ── Chọn prompt trong modal list → điền vào form ──
  if (list) {
    list.addEventListener('change', () => {
      const p = getPrompts().find(x => x.id === list.value);
      if (p) {
        if (inpName)    inpName.value    = p.name;
        if (inpContent) inpContent.value = p.content;
      }
    });
  }

  // ── Lưu prompt ──
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const name    = inpName?.value.trim();
      const content = inpContent?.value.trim();
      if (!name || !content) {
        showToast('Vui lòng nhập tên và nội dung', 'warn');
        return;
      }
      const prompts    = getPrompts();
      const existingId = list?.value;
      if (existingId) {
        const p = prompts.find(x => x.id === existingId);
        if (p) { p.name = name; p.content = content; }
        else   prompts.push({ id: 'p' + Date.now(), name, content });
      } else {
        prompts.push({ id: 'p' + Date.now(), name, content });
      }
      savePrompts(prompts);
      renderModalList();
      renderPromptDropdown();
      showToast('Đã lưu prompt', 'success');
      if (inpName)    inpName.value    = '';
      if (inpContent) inpContent.value = '';
      if (list)       list.value       = '';
    });
  }

  // ── Xóa prompt ──
  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      const existingId = list?.value;
      if (!existingId) return;
      if (existingId === 'p1') { showToast('Không thể xóa prompt mặc định', 'error'); return; }
      const prompts = getPrompts().filter(x => x.id !== existingId);
      savePrompts(prompts);
      renderModalList();
      renderPromptDropdown();
      showToast('Đã xóa prompt', 'info');
      if (inpName)    inpName.value    = '';
      if (inpContent) inpContent.value = '';
      if (list)       list.value       = '';
    });
  }

  // ── Chọn prompt ở dropdown → lưu active ──
  if (select) {
    select.addEventListener('change', () => {
      localStorage.setItem('ai_active_prompt_id', select.value);
      const p = getPrompts().find(x => x.id === select.value);
      if (p) localStorage.setItem('ai_prompt', p.content);
    });
  }

  // ── Init state ──
  renderPromptDropdown();
  if (!localStorage.getItem('ai_prompt')) {
    localStorage.setItem('ai_prompt', DEFAULT_PROMPTS[0].content);
    localStorage.setItem('ai_active_prompt_id', 'p1');
    if (select) select.value = 'p1';
  }
}
