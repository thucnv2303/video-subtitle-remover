const fs = require('fs');

let app = fs.readFileSync('e:/Project AI/Video-sub-remove/src/renderer/js/app.backup.js', 'utf8');

const promptLogic = `
  // --- PROMPT LOGIC ---
  const elBtnManage = document.getElementById('btn-manage-prompts');
  const modal = document.getElementById('prompt-modal');
  const btnClose = document.getElementById('btn-close-prompt-modal');
  const select = document.getElementById('ai-prompt-select');
  const list = document.getElementById('modal-prompt-list');
  const btnAdd = document.getElementById('btn-add-prompt');
  const btnSave = document.getElementById('btn-save-prompt');
  const btnDelete = document.getElementById('btn-delete-prompt');
  const inpName = document.getElementById('modal-prompt-name');
  const inpContent = document.getElementById('modal-prompt-content');

  function getPrompts() { return JSON.parse(localStorage.getItem('ai_prompts') || '[]'); }
  function savePrompts(p) { localStorage.setItem('ai_prompts', JSON.stringify(p)); }

  function renderList() {
    if (!list) return;
    const prompts = getPrompts();
    list.innerHTML = '<option value="">-- Chọn Prompt --</option>';
    prompts.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = p.name;
      list.appendChild(opt);
    });
  }

  function renderDropdown() {
    if (!select) return;
    const prompts = getPrompts();
    const currentVal = select.value;
    select.innerHTML = '<option value="default">Mặc định (Dịch thông thường)</option>';
    prompts.forEach((p, i) => {
      const opt = document.createElement('option');
      opt.value = i; opt.textContent = p.name;
      select.appendChild(opt);
    });
    if (currentVal && currentVal !== 'default') select.value = currentVal;
  }

  if (elBtnManage) {
    elBtnManage.addEventListener('click', () => { renderList(); modal.classList.remove('hidden'); });
  }
  if (btnClose) {
    btnClose.addEventListener('click', () => { modal.classList.add('hidden'); });
  }
  if (list) {
    list.addEventListener('change', () => {
      const i = list.value;
      if (i === '') { inpName.value = ''; inpContent.value = ''; return; }
      const p = getPrompts()[i];
      if (p) { inpName.value = p.name; inpContent.value = p.content; }
    });
  }
  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      list.value = ''; inpName.value = ''; inpContent.value = '';
    });
  }
  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const name = inpName.value.trim();
      const content = inpContent.value.trim();
      if (!name || !content) { showToast('Vui lòng nhập tên và nội dung', 'warn'); return; }
      const prompts = getPrompts();
      if (list.value === '') {
        prompts.push({ name, content });
      } else {
        prompts[list.value] = { name, content };
      }
      savePrompts(prompts);
      renderList();
      renderDropdown();
      showToast('Đã lưu prompt', 'success');
      inpName.value = ''; inpContent.value = '';
      list.value = '';
    });
  }
  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      if (list.value === '') { showToast('Chọn prompt để xóa', 'warn'); return; }
      const prompts = getPrompts();
      prompts.splice(list.value, 1);
      savePrompts(prompts);
      renderList();
      renderDropdown();
      showToast('Đã xóa prompt', 'success');
      inpName.value = ''; inpContent.value = '';
      list.value = '';
    });
  }
  renderDropdown();
  // --- END PROMPT LOGIC ---
`;

const uploadLogic = `
  // --- UPLOAD BINDINGS ---
  const btnUploadStep1 = document.getElementById('btn-upload-step1');
  const btnOpenFile = document.getElementById('btn-open-file');
  const dropZone = document.getElementById('drop-zone');

  if (btnUploadStep1 && btnOpenFile && typeof selectFile !== 'undefined') {
    btnUploadStep1.addEventListener('click', selectFile);
    btnOpenFile.addEventListener('click', selectFile);
  }
  if (dropZone && typeof selectFile !== 'undefined') {
    dropZone.addEventListener('click', selectFile);
  }
  // --- END UPLOAD BINDINGS ---
`;

const pos = app.lastIndexOf('});');
if (pos !== -1) {
  app = app.substring(0, pos) + promptLogic + uploadLogic + app.substring(pos);
}

fs.writeFileSync('e:/Project AI/Video-sub-remove/src/renderer/js/app.js', app);

let html = fs.readFileSync('e:/Project AI/Video-sub-remove/src/renderer/index.html', 'utf8');
html = html.replace('<script type="module" src="js/app.js"></script>', '<script src="js/app.js"></script>');
fs.writeFileSync('e:/Project AI/Video-sub-remove/src/renderer/index.html', html);

console.log('App successfully rolled back and patched correctly.');
