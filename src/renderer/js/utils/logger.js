/**
 * Logger — addLog, showToast, getLogCategory
 *
 * addLog() hỗ trợ 2 cách gọi:
 *   addLog(message, type)              — gọi qua window.addLog (không cần el)
 *   addLog(el, message, type, tab)     — gọi từ module truyền el object
 *
 * Cả 2 đều ghi vào #log-output và #step1-log-output.
 */

// Tab log đang active — được cập nhật từ app.js
let _activeLogTab = 'all';
export function setActiveLogTab(tab) { _activeLogTab = tab; }

export function getLogCategory(message) {
  const msg = message.toLowerCase();
  if (/^\[(asr|ai|tts|voice|voicesub|finalize)\]/i.test(message)) return 'feature';
  if (msg.includes('trích xuất') && msg.includes('srt')) return 'feature';
  if (msg.includes('phụ đề ai')) return 'feature';
  if (msg.includes('âm thanh tts')) return 'feature';
  if (msg.includes('viết lại')) return 'feature';
  if (msg.includes('lồng tiếng')) return 'feature';
  if (msg.includes('clone gi')) return 'feature';
  if (/^\[py\]/i.test(message)) return 'inpaint';
  if (/^\[err\]/i.test(message)) return 'inpaint';
  if (/^\[inpaint\]/i.test(message)) return 'inpaint';
  if (msg.includes('pass ') && msg.includes('vùng')) return 'inpaint';
  if (msg.includes('xử lý') && (msg.includes('frame') || msg.includes('pass'))) return 'inpaint';
  if (msg.includes('hoàn tất')) return 'inpaint';
  if (msg.includes('payload')) return 'inpaint';
  return 'system';
}

/**
 * Thêm dòng log vào #log-output và #step1-log-output.
 *
 * Hỗ trợ 2 cách gọi:
 *   addLog(message, type)                      — simple form, dùng cho window.addLog
 *   addLog(el, message, type, activeLogTab)     — legacy form từ module
 */
export function addLog(elOrMessage, messageOrType = 'info', typeOrTab = 'all', tabArg) {
  let message, type, activeTab;

  // Phân biệt 2 dạng gọi
  if (typeof elOrMessage === 'string') {
    // Dạng 1: addLog(message, type)
    message   = elOrMessage;
    type      = messageOrType;
    activeTab = _activeLogTab;
  } else {
    // Dạng 2: addLog(el, message, type, activeLogTab)
    message   = messageOrType;
    type      = typeOrTab;
    activeTab = tabArg || _activeLogTab;
  }

  const entry = document.createElement('div');
  const cat   = getLogCategory(message);
  entry.className       = `log-entry log-${type}`;
  entry.dataset.logCat  = cat;
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  entry.textContent = `[${time}] ${message}`;

  if (activeTab !== 'all' && activeTab !== cat) {
    entry.classList.add('log-hidden');
  }

  // Ghi vào log panel chính (#log-output ở Step 2)
  const mainLog = document.getElementById('log-output');
  if (mainLog) {
    mainLog.appendChild(entry);
    mainLog.scrollTop = mainLog.scrollHeight;
  }

  // Ghi vào console nhỏ Step 1 (#step1-log-output) — giới hạn 100 dòng
  const step1Log = document.getElementById('step1-log-output');
  if (step1Log) {
    const clone = entry.cloneNode(true);
    step1Log.appendChild(clone);
    if (step1Log.childNodes.length > 100) {
      step1Log.removeChild(step1Log.firstChild);
    }
    step1Log.scrollTop = step1Log.scrollHeight;
  }
}

/**
 * Hiện toast notification.
 *
 * Hỗ trợ 2 cách gọi:
 *   showToast(message, type, duration)         — simple form, dùng cho window.showToast
 *   showToast(el, message, type, duration)     — legacy form (el bị bỏ qua)
 */
export function showToast(elOrMessage, messageOrType = 'info', typeOrDuration = 3000, durationArg) {
  let message, type, duration;

  if (typeof elOrMessage === 'string') {
    // Dạng 1: showToast(message, type, duration)
    message  = elOrMessage;
    type     = messageOrType;
    duration = typeof typeOrDuration === 'number' ? typeOrDuration : 3000;
  } else {
    // Dạng 2: showToast(el, message, type, duration)
    message  = messageOrType;
    type     = typeOrDuration;
    duration = durationArg || 3000;
  }

  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className   = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
