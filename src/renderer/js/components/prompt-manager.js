/**
 * Prompt Manager V2 — single source of truth for Pipeline 1 prompts.
 */

import { showToast } from '../utils/logger.js';

const PROMPTS_KEY = 'ai_prompts';
const ACTIVE_KEY = 'ai_active_prompt_id';
const DEFAULT_KEY = 'ai_default_prompt_id';
const MIRROR_KEY = 'ai_prompt';
const INIT_KEY = 'ai_prompts_v2_initialized';
const LEGACY_DEFAULT_CONTENT = 'Bạn là chuyên gia dịch thuật phụ đề. Hãy dịch phụ đề sau sang Tiếng Việt thật tự nhiên. Giữ nguyên định dạng dòng.';

const STANDARD_PROMPT = {
  id: 'p1-standard-v2',
  name: 'Phân tích & Viết lại (Mặc định)',
  description: 'Phân tích video và tạo một lời thoại tiếng Việt liền mạch, bám sát bằng chứng nguồn.',
  content: `Hãy phân tích toàn bộ video nguồn bằng transcript và bằng chứng hình ảnh được cung cấp, sau đó viết MỘT lời thoại tiếng Việt liền mạch cho toàn bộ video.

Yêu cầu:
- Bám sát nội dung, hành động, sản phẩm và quy trình thực sự xuất hiện trong nguồn; không bịa thông tin không có bằng chứng.
- Viết tự nhiên, rõ ràng, có nhịp kể hợp lý và phù hợp để đọc TTS liên tục.
- Không trả lời theo định dạng SRT và không chia nội dung thành các mẩu dịch phụ đề rời rạc.
- Không sao chép ký tự CJK từ transcript/hình ảnh nguồn vào lời thoại cuối. Hãy diễn giải bằng tiếng Việt hoặc ký tự Latin; nếu không chắc nghĩa thì bỏ chi tiết chữ đó.
- Ưu tiên đoạn thoại trôi chảy thay vì danh sách gạch đầu dòng.
- Giữ nội dung súc tích, không lặp ý hoặc kéo dài bằng câu đệm chỉ để tăng thời lượng.

Các quality gate và artifact schema của Pipeline 1 là ràng buộc kỹ thuật cuối cùng.`,
};

let selectedId = null;
let creatingNew = false;
let initialized = false;
let launchDelegationBound = false;

function normalizePrompt(prompt) {
  if (!prompt || typeof prompt !== 'object') return null;
  const id = String(prompt.id || '').trim();
  const name = String(prompt.name || '').trim();
  const content = String(prompt.content || '').trim();
  if (!id || !name || !content) return null;
  return {
    id,
    name,
    description: String(prompt.description || '').trim(),
    content,
  };
}

function isUntouchedLegacySeed(prompts) {
  return prompts.length === 1
    && prompts[0]?.id === 'p1'
    && String(prompts[0]?.content || '').trim() === LEGACY_DEFAULT_CONTENT;
}

function savePrompts(prompts) {
  localStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts));
}

function clearSelectionKeys() {
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(DEFAULT_KEY);
  localStorage.removeItem(MIRROR_KEY);
}

function setActivePrompt(id, prompts = getPrompts()) {
  const prompt = prompts.find(item => item.id === id) || null;
  if (!prompt) {
    localStorage.removeItem(ACTIVE_KEY);
    localStorage.removeItem(MIRROR_KEY);
    return null;
  }
  localStorage.setItem(ACTIVE_KEY, prompt.id);
  localStorage.setItem(MIRROR_KEY, prompt.content);
  return prompt;
}

function reconcileSelection(prompts) {
  if (!prompts.length) {
    clearSelectionKeys();
    return;
  }

  let defaultId = localStorage.getItem(DEFAULT_KEY) || '';
  if (!prompts.some(item => item.id === defaultId)) {
    defaultId = prompts[0].id;
    localStorage.setItem(DEFAULT_KEY, defaultId);
  }

  let activeId = localStorage.getItem(ACTIVE_KEY) || '';
  if (!prompts.some(item => item.id === activeId)) activeId = defaultId;
  setActivePrompt(activeId, prompts);
}

function initializeStore() {
  const alreadyV2 = localStorage.getItem(INIT_KEY) === 'true';
  const raw = localStorage.getItem(PROMPTS_KEY);
  let prompts = [];

  if (raw === null) {
    prompts = [{ ...STANDARD_PROMPT }];
    savePrompts(prompts);
  } else {
    try {
      const parsed = JSON.parse(raw);
      prompts = Array.isArray(parsed) ? parsed.map(normalizePrompt).filter(Boolean) : [];
    } catch {
      prompts = [];
      savePrompts(prompts);
    }
  }

  if (!alreadyV2 && isUntouchedLegacySeed(prompts)) {
    prompts = [{ ...STANDARD_PROMPT }];
    savePrompts(prompts);
    localStorage.setItem(DEFAULT_KEY, STANDARD_PROMPT.id);
    localStorage.setItem(ACTIVE_KEY, STANDARD_PROMPT.id);
    localStorage.setItem(MIRROR_KEY, STANDARD_PROMPT.content);
  }

  localStorage.setItem(INIT_KEY, 'true');
  reconcileSelection(prompts);
  return prompts;
}

function getPrompts() {
  const raw = localStorage.getItem(PROMPTS_KEY);
  if (raw === null) return initializeStore();
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizePrompt).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function installStyles() {
  if (document.querySelector('link[data-prompt-manager-v2]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/prompt-manager-v2.css';
  link.dataset.promptManagerV2 = 'true';
  document.head.appendChild(link);
}

function buildModalShell() {
  const modal = document.getElementById('prompt-modal');
  if (!modal || modal.dataset.promptV2 === 'true') return modal;
  modal.dataset.promptV2 = 'true';
  modal.classList.add('prompt-v2-overlay');
  modal.innerHTML = `
    <div class="prompt-v2-modal" role="dialog" aria-modal="true" aria-labelledby="prompt-v2-title">
      <header class="prompt-v2-header">
        <div>
          <h2 id="prompt-v2-title">Quản lý Prompt AI</h2>
          <p>Tạo, chỉnh sửa và chọn prompt dùng cho Pipeline 1 · Phân tích & Viết lại.</p>
        </div>
        <button class="prompt-v2-close" id="btn-close-prompt-modal" aria-label="Đóng">×</button>
      </header>
      <div class="prompt-v2-body">
        <section class="prompt-v2-panel">
          <div class="prompt-v2-panel-head">
            <h3 id="prompt-v2-count">Danh sách Prompt (0)</h3>
            <button class="prompt-v2-primary" id="prompt-v2-new">＋ Prompt mới</button>
          </div>
          <div class="prompt-v2-list" id="prompt-v2-list"></div>
          <div class="prompt-v2-list-actions">
            <button class="prompt-v2-ghost" id="prompt-v2-up">↑ Di chuyển lên</button>
            <button class="prompt-v2-ghost" id="prompt-v2-down">↓ Di chuyển xuống</button>
            <button class="prompt-v2-danger" id="prompt-v2-delete-all">🗑 Xóa tất cả</button>
          </div>
          <div class="prompt-v2-tip">ⓘ Prompt đang dùng sẽ được snapshot khi chạy Pipeline 1. Xóa prompt đang dùng sẽ chuyển sang prompt mặc định hoặc prompt còn lại đầu tiên.</div>
        </section>
        <section class="prompt-v2-panel">
          <div class="prompt-v2-panel-head">
            <h3>✎ Chi tiết Prompt</h3>
            <span class="prompt-v2-state-pill" id="prompt-v2-state">Chưa chọn</span>
          </div>
          <div class="prompt-v2-editor">
            <div class="prompt-v2-field">
              <div class="prompt-v2-label-row"><span>Tên Prompt <span class="prompt-v2-required">*</span></span><span class="prompt-v2-count" id="prompt-v2-name-count">0/100</span></div>
              <input class="prompt-v2-input" id="modal-prompt-name" maxlength="100" autocomplete="off">
            </div>
            <div class="prompt-v2-field">
              <div class="prompt-v2-label-row"><span>Mô tả (không bắt buộc)</span><span class="prompt-v2-count" id="prompt-v2-desc-count">0/200</span></div>
              <input class="prompt-v2-input" id="modal-prompt-description" maxlength="200" autocomplete="off">
            </div>
            <div class="prompt-v2-field">
              <div class="prompt-v2-label-row"><span>Nội dung Prompt <span class="prompt-v2-required">*</span></span><span class="prompt-v2-count" id="prompt-v2-content-count">0 ký tự</span></div>
              <textarea class="prompt-v2-textarea" id="modal-prompt-content" spellcheck="false"></textarea>
            </div>
            <div class="prompt-v2-editor-actions">
              <button class="prompt-v2-primary" id="btn-save-prompt">💾 Lưu thay đổi</button>
              <button class="prompt-v2-secondary" id="prompt-v2-default">☆ Đặt làm mặc định</button>
              <button class="prompt-v2-danger" id="btn-delete-prompt">🗑 Xóa Prompt</button>
            </div>
          </div>
        </section>
      </div>
      <footer class="prompt-v2-footer">
        <button class="prompt-v2-secondary" id="prompt-v2-close-footer">Đóng</button>
        <button class="prompt-v2-primary" id="prompt-v2-use">✓ Sử dụng Prompt này</button>
      </footer>
    </div>`;
  return modal;
}

function formRefs() {
  return {
    name: document.getElementById('modal-prompt-name'),
    description: document.getElementById('modal-prompt-description'),
    content: document.getElementById('modal-prompt-content'),
  };
}

function updateCounters() {
  const fields = formRefs();
  const nameCount = document.getElementById('prompt-v2-name-count');
  const descCount = document.getElementById('prompt-v2-desc-count');
  const contentCount = document.getElementById('prompt-v2-content-count');
  if (nameCount) nameCount.textContent = `${fields.name?.value.length || 0}/100`;
  if (descCount) descCount.textContent = `${fields.description?.value.length || 0}/200`;
  if (contentCount) contentCount.textContent = `${fields.content?.value.length || 0} ký tự`;
}

function fillEditor(prompt = null, asNew = false) {
  const fields = formRefs();
  creatingNew = asNew;
  selectedId = prompt?.id || null;
  if (fields.name) fields.name.value = prompt?.name || '';
  if (fields.description) fields.description.value = prompt?.description || '';
  if (fields.content) fields.content.value = prompt?.content || '';
  updateCounters();
  renderState();
}

function renderState() {
  const prompts = getPrompts();
  const activeId = localStorage.getItem(ACTIVE_KEY) || '';
  const defaultId = localStorage.getItem(DEFAULT_KEY) || '';
  const stateEl = document.getElementById('prompt-v2-state');
  const useBtn = document.getElementById('prompt-v2-use');
  const defaultBtn = document.getElementById('prompt-v2-default');
  const deleteBtn = document.getElementById('btn-delete-prompt');
  const selected = prompts.find(item => item.id === selectedId) || null;

  if (stateEl) {
    stateEl.classList.toggle('draft', creatingNew);
    stateEl.textContent = creatingNew ? 'Prompt mới' : selectedId === activeId ? '✓ Đang dùng' : selected ? 'Đã lưu' : 'Chưa chọn';
  }
  if (useBtn) useBtn.disabled = creatingNew || !selected;
  if (defaultBtn) {
    defaultBtn.disabled = creatingNew || !selected;
    defaultBtn.textContent = selected && selected.id === defaultId ? '★ Đang là mặc định' : '☆ Đặt làm mặc định';
  }
  if (deleteBtn) deleteBtn.disabled = creatingNew || !selected;
}

function renderModalList() {
  const list = document.getElementById('prompt-v2-list');
  const count = document.getElementById('prompt-v2-count');
  if (!list) return;
  const prompts = getPrompts();
  const activeId = localStorage.getItem(ACTIVE_KEY) || '';
  const defaultId = localStorage.getItem(DEFAULT_KEY) || '';
  if (count) count.textContent = `Danh sách Prompt (${prompts.length})`;
  list.innerHTML = '';

  if (!prompts.length) {
    const empty = document.createElement('div');
    empty.className = 'prompt-v2-empty';
    const strong = document.createElement('strong');
    strong.textContent = 'Chưa có prompt nào';
    const small = document.createElement('span');
    small.textContent = 'Nhấn “+ Prompt mới” để tạo prompt đầu tiên.';
    empty.append(strong, small);
    list.appendChild(empty);
  } else {
    prompts.forEach(prompt => {
      const card = document.createElement('div');
      card.className = `prompt-v2-card${prompt.id === selectedId ? ' selected' : ''}`;
      card.dataset.promptId = prompt.id;
      const radio = document.createElement('span');
      radio.className = 'prompt-v2-radio';
      const main = document.createElement('div');
      main.className = 'prompt-v2-card-main';
      const title = document.createElement('div');
      title.className = 'prompt-v2-card-title';
      title.textContent = `${prompt.id === defaultId ? '★ ' : ''}${prompt.name}`;
      const desc = document.createElement('div');
      desc.className = 'prompt-v2-card-desc';
      desc.textContent = prompt.description || prompt.content;
      const badges = document.createElement('div');
      badges.className = 'prompt-v2-badges';
      if (prompt.id === activeId) {
        const badge = document.createElement('span');
        badge.className = 'prompt-v2-badge active';
        badge.textContent = 'Đang dùng';
        badges.appendChild(badge);
      }
      if (prompt.id === defaultId) {
        const badge = document.createElement('span');
        badge.className = 'prompt-v2-badge default';
        badge.textContent = 'Mặc định';
        badges.appendChild(badge);
      }
      main.append(title, desc, badges);
      const menu = document.createElement('span');
      menu.className = 'prompt-v2-card-menu';
      menu.textContent = '⋮';
      card.append(radio, main, menu);
      card.addEventListener('click', () => {
        const current = getPrompts().find(item => item.id === prompt.id) || null;
        fillEditor(current, false);
        renderAll();
      });
      list.appendChild(card);
    });
  }

  const index = prompts.findIndex(item => item.id === selectedId);
  const up = document.getElementById('prompt-v2-up');
  const down = document.getElementById('prompt-v2-down');
  const deleteAll = document.getElementById('prompt-v2-delete-all');
  if (up) up.disabled = index <= 0;
  if (down) down.disabled = index < 0 || index >= prompts.length - 1;
  if (deleteAll) deleteAll.disabled = prompts.length === 0;
  renderState();
}

export function renderPromptDropdown() {
  const select = document.getElementById('ai-prompt-select');
  if (!select) return;
  const prompts = getPrompts();
  reconcileSelection(prompts);
  const activeId = localStorage.getItem(ACTIVE_KEY) || '';
  select.innerHTML = '';
  if (!prompts.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Chưa có prompt — hãy tạo prompt';
    select.appendChild(option);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  prompts.forEach(prompt => {
    const option = document.createElement('option');
    option.value = prompt.id;
    option.textContent = prompt.name;
    select.appendChild(option);
  });
  select.value = prompts.some(item => item.id === activeId) ? activeId : prompts[0].id;
}

function renderStep1PromptBox() {
  const box = document.querySelector('#step-1-content .tk-prompt-box');
  if (!box) return;
  box.classList.add('prompt-v2-step1');
  box.innerHTML = `
    <div class="prompt-v2-step-list" id="prompt-v2-step-list"></div>
    <div class="prompt-v2-step-actions">
      <button class="tk-btn" id="step1-btn-add-prompt">＋ Prompt mới</button>
      <button class="tk-btn" id="step1-btn-edit-prompt">✎ Quản lý</button>
      <button class="tk-btn tk-btn-danger" id="step1-btn-del-prompt">🗑 Xóa đang dùng</button>
    </div>`;
  const list = box.querySelector('#prompt-v2-step-list');
  const prompts = getPrompts();
  const activeId = localStorage.getItem(ACTIVE_KEY) || '';
  if (!prompts.length) {
    const empty = document.createElement('div');
    empty.className = 'prompt-v2-step-empty';
    empty.textContent = 'Chưa có prompt. Tạo prompt trước khi chạy Pipeline 1.';
    list.appendChild(empty);
  } else {
    prompts.forEach(prompt => {
      const row = document.createElement('div');
      row.className = `prompt-v2-step-item${prompt.id === activeId ? ' active' : ''}`;
      const title = document.createElement('div');
      title.className = 'prompt-v2-step-item-title';
      const name = document.createElement('span');
      name.textContent = prompt.name;
      const badge = document.createElement('span');
      badge.textContent = prompt.id === activeId ? '✓' : '';
      title.append(name, badge);
      const desc = document.createElement('small');
      desc.textContent = prompt.description || prompt.content;
      row.append(title, desc);
      row.addEventListener('click', () => {
        setActivePrompt(prompt.id, getPrompts());
        selectedId = prompt.id;
        creatingNew = false;
        renderAll();
      });
      list.appendChild(row);
    });
  }

  box.querySelector('#step1-btn-del-prompt')?.addEventListener('click', () => deletePrompt(activeId));
}

function renderAll() {
  renderPromptDropdown();
  renderStep1PromptBox();
  renderModalList();
}

function readEditor() {
  const fields = formRefs();
  return {
    name: String(fields.name?.value || '').trim(),
    description: String(fields.description?.value || '').trim(),
    content: String(fields.content?.value || '').trim(),
  };
}

function saveEditor() {
  const data = readEditor();
  if (!data.name || !data.content) {
    showToast('Tên Prompt và Nội dung Prompt là bắt buộc.', 'warn');
    return null;
  }
  let prompts = getPrompts();
  const duplicate = prompts.find(item => item.name.toLocaleLowerCase('vi-VN') === data.name.toLocaleLowerCase('vi-VN') && item.id !== selectedId);
  if (duplicate) {
    showToast('Tên Prompt đã tồn tại.', 'warn');
    return null;
  }

  if (creatingNew || !selectedId || !prompts.some(item => item.id === selectedId)) {
    const prompt = { id: `p${Date.now().toString(36)}`, ...data };
    prompts.push(prompt);
    savePrompts(prompts);
    if (prompts.length === 1) {
      localStorage.setItem(DEFAULT_KEY, prompt.id);
      setActivePrompt(prompt.id, prompts);
    }
    selectedId = prompt.id;
    creatingNew = false;
  } else {
    prompts = prompts.map(item => item.id === selectedId ? { ...item, ...data } : item);
    savePrompts(prompts);
    if (localStorage.getItem(ACTIVE_KEY) === selectedId) setActivePrompt(selectedId, prompts);
  }

  showToast('Đã lưu Prompt.', 'success');
  renderAll();
  return prompts.find(item => item.id === selectedId) || null;
}

function chooseReplacement(prompts) {
  const defaultId = localStorage.getItem(DEFAULT_KEY) || '';
  return prompts.find(item => item.id === defaultId) || prompts[0] || null;
}

function deletePrompt(id) {
  if (!id) return;
  let prompts = getPrompts();
  const target = prompts.find(item => item.id === id);
  if (!target) return;
  if (!window.confirm(`Xóa prompt “${target.name}”?`)) return;
  prompts = prompts.filter(item => item.id !== id);
  savePrompts(prompts);

  if (!prompts.length) {
    clearSelectionKeys();
    selectedId = null;
  } else {
    if (localStorage.getItem(DEFAULT_KEY) === id) localStorage.setItem(DEFAULT_KEY, prompts[0].id);
    if (localStorage.getItem(ACTIVE_KEY) === id) {
      const replacement = chooseReplacement(prompts);
      setActivePrompt(replacement?.id || '', prompts);
    }
    selectedId = prompts.some(item => item.id === selectedId) ? selectedId : (localStorage.getItem(ACTIVE_KEY) || prompts[0].id);
  }
  creatingNew = false;
  const selected = prompts.find(item => item.id === selectedId) || null;
  fillEditor(selected, false);
  showToast('Đã xóa Prompt.', 'info');
  renderAll();
}

function deleteAllPrompts() {
  const prompts = getPrompts();
  if (!prompts.length) return;
  if (!window.confirm('Xóa TẤT CẢ prompt? Danh sách rỗng sẽ được giữ nguyên sau khi khởi động lại ứng dụng.')) return;
  savePrompts([]);
  clearSelectionKeys();
  selectedId = null;
  creatingNew = false;
  fillEditor(null, false);
  showToast('Đã xóa toàn bộ Prompt.', 'info');
  renderAll();
}

function moveSelected(direction) {
  const prompts = getPrompts();
  const index = prompts.findIndex(item => item.id === selectedId);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= prompts.length) return;
  [prompts[index], prompts[next]] = [prompts[next], prompts[index]];
  savePrompts(prompts);
  renderAll();
}

function setDefaultSelected() {
  const prompts = getPrompts();
  const selected = prompts.find(item => item.id === selectedId);
  if (!selected || creatingNew) return;
  localStorage.setItem(DEFAULT_KEY, selected.id);
  showToast('Đã đặt Prompt mặc định.', 'success');
  renderAll();
}

function useSelected() {
  const prompts = getPrompts();
  const selected = prompts.find(item => item.id === selectedId);
  if (!selected || creatingNew) {
    showToast('Hãy lưu Prompt trước khi sử dụng.', 'warn');
    return;
  }
  setActivePrompt(selected.id, prompts);
  showToast(`Đang sử dụng: ${selected.name}`, 'success');
  renderAll();
}

function closeModal() {
  document.getElementById('prompt-modal')?.classList.add('hidden');
}

function openModal(promptId = null, asNew = false) {
  const modal = buildModalShell();
  if (!modal) return;
  const prompts = getPrompts();
  const activeId = localStorage.getItem(ACTIVE_KEY) || '';
  if (asNew) fillEditor(null, true);
  else {
    const prompt = prompts.find(item => item.id === promptId) || prompts.find(item => item.id === activeId) || prompts[0] || null;
    fillEditor(prompt, false);
  }
  renderAll();
  modal.classList.remove('hidden');
}

function bindModalEvents() {
  const modal = buildModalShell();
  if (!modal || modal.dataset.promptV2Bound === 'true') return;
  modal.dataset.promptV2Bound = 'true';
  modal.querySelector('#btn-close-prompt-modal')?.addEventListener('click', closeModal);
  modal.querySelector('#prompt-v2-close-footer')?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  modal.querySelector('#prompt-v2-new')?.addEventListener('click', () => fillEditor(null, true));
  modal.querySelector('#btn-save-prompt')?.addEventListener('click', saveEditor);
  modal.querySelector('#btn-delete-prompt')?.addEventListener('click', () => deletePrompt(selectedId));
  modal.querySelector('#prompt-v2-delete-all')?.addEventListener('click', deleteAllPrompts);
  modal.querySelector('#prompt-v2-up')?.addEventListener('click', () => moveSelected(-1));
  modal.querySelector('#prompt-v2-down')?.addEventListener('click', () => moveSelected(1));
  modal.querySelector('#prompt-v2-default')?.addEventListener('click', setDefaultSelected);
  modal.querySelector('#prompt-v2-use')?.addEventListener('click', useSelected);
  ['modal-prompt-name', 'modal-prompt-description', 'modal-prompt-content'].forEach(id => {
    modal.querySelector(`#${id}`)?.addEventListener('input', updateCounters);
  });
}

function bindLaunchDelegation() {
  if (launchDelegationBound) return;
  launchDelegationBound = true;
  document.addEventListener('click', event => {
    const launcher = event.target?.closest?.('#btn-manage-prompts, #step1-btn-edit-prompt, #step1-btn-add-prompt');
    if (!launcher) return;
    if (launcher.id === 'step1-btn-add-prompt') {
      openModal(null, true);
      return;
    }
    openModal(localStorage.getItem(ACTIVE_KEY) || null, false);
  });
}

export function initPromptManager() {
  if (initialized) {
    renderAll();
    return true;
  }
  if (!document.getElementById('prompt-modal')) return false;

  initialized = true;
  installStyles();
  initializeStore();
  buildModalShell();
  bindModalEvents();
  bindLaunchDelegation();

  document.getElementById('ai-prompt-select')?.addEventListener('change', event => {
    const prompts = getPrompts();
    if (setActivePrompt(event.target.value, prompts)) {
      selectedId = event.target.value;
      creatingNew = false;
      renderAll();
    }
  });

  const prompts = getPrompts();
  selectedId = localStorage.getItem(ACTIVE_KEY) || prompts[0]?.id || null;
  const selected = prompts.find(item => item.id === selectedId) || null;
  fillEditor(selected, false);
  renderAll();
  return true;
}

function scheduleSelfInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initPromptManager(), { once: true });
    return;
  }
  queueMicrotask(() => initPromptManager());
}

scheduleSelfInit();
