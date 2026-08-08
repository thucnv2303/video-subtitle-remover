document.addEventListener('DOMContentLoaded', () => {
  const steps = document.querySelectorAll('.step-chevron');
  const panes = document.querySelectorAll('.pipeline-pane');
  
  steps.forEach(step => {
    step.addEventListener('click', () => {
      const stepNum = step.dataset.step;
      steps.forEach(s => s.classList.remove('active'));
      step.classList.add('active');
      panes.forEach(p => {
        if (p.id === 'step-' + stepNum + '-content') {
          p.style.display = 'block'; p.classList.add('active');
        } else {
          p.style.display = 'none'; p.classList.remove('active');
        }
      });
      if (stepNum === '2') window.dispatchEvent(new Event('resize'));
    });
  });

  const btnUploadStep1 = document.getElementById('btn-upload-step1');
  const btnOpenFile = document.getElementById('btn-open-file');
  if (btnUploadStep1 && btnOpenFile) {
    btnUploadStep1.addEventListener('click', () => { btnOpenFile.click(); });
  }

  const btnManage = document.getElementById('step1-btn-edit-prompt');
  const btnAdd = document.getElementById('step1-btn-add-prompt');
  const modal = document.getElementById('prompt-modal');
  if (btnManage && modal) btnManage.addEventListener('click', () => { modal.classList.remove('hidden'); });
  if (btnAdd && modal) btnAdd.addEventListener('click', () => { modal.classList.remove('hidden'); });

  const btnCopy = document.getElementById('step1-btn-copy-log');
  const btnClear = document.getElementById('step1-btn-clear-log');
  if (btnCopy) btnCopy.addEventListener('click', () => {
     const text = document.getElementById('step1-log-output')?.innerText;
     if (text) navigator.clipboard.writeText(text);
  });
  if (btnClear) btnClear.addEventListener('click', () => {
     const log = document.getElementById('step1-log-output');
     if (log) log.innerHTML = '';
  });
});
