const P1_OWNED_MESSAGE_RE = /^\[(?:P1|ASR|AI|TTS|Voice|VoiceSub|Ollama|Gemini)\](?:\s|$)/i;
const P1_RENDERED_MESSAGE_RE = /^\[[^\]]+\]\s+\[(?:P1|ASR|AI|TTS|Voice|VoiceSub|Ollama|Gemini)\](?:\s|$)/i;

function p1Container() {
  return document.getElementById('step1-log-output');
}

function isP1OwnedMessage(message) {
  return P1_OWNED_MESSAGE_RE.test(String(message || '').trim());
}

function isP1OwnedRenderedEntry(entry) {
  return entry?.classList?.contains('log-entry')
    && P1_RENDERED_MESSAGE_RE.test(String(entry.textContent || '').trim());
}

function formatLogText(message) {
  const time = new Date().toLocaleTimeString('vi-VN', { hour12: false });
  return `[${time}] ${message}`;
}

function appendP1Entry(message, type = 'info') {
  const container = p1Container();
  if (!container) return false;

  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.dataset.logOwner = 'p1';
  entry.textContent = formatLogText(message);
  container.appendChild(entry);
  container.scrollTop = container.scrollHeight;
  return true;
}

function updateP1ProgressOnly(progressKey, message, type = 'info', done = false) {
  if (!progressKey || !message) return;
  const container = p1Container();
  if (!container) return;

  let entry = [...container.querySelectorAll('.log-entry')]
    .find(item => item.dataset.progressKey === progressKey) || null;
  if (!entry) {
    entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.dataset.progressKey = progressKey;
    entry.dataset.logOwner = 'p1';
    container.appendChild(entry);
  }
  entry.className = `log-entry log-${type}`;
  entry.textContent = formatLogText(message);
  if (done) entry.dataset.progressDone = 'true';
  container.scrollTop = container.scrollHeight;
}

function cleanLegacyP1RowsFromP2() {
  const globalLog = document.getElementById('log-output');
  if (!globalLog) return;
  globalLog.querySelectorAll(':scope > .log-entry').forEach(entry => {
    if (isP1OwnedRenderedEntry(entry)) entry.remove();
  });
}

function installP1LogRouter() {
  if (window.__p1LogRouterInstalled) return true;
  if (typeof window.addLog !== 'function') return false;

  const originalAddLog = window.addLog;
  const routedAddLog = function routedP1Log(message, type = 'info') {
    if (isP1OwnedMessage(message) && appendP1Entry(message, type)) return;
    return originalAddLog.apply(this, arguments);
  };
  routedAddLog.__p1OwnerRouter = true;
  routedAddLog.__p1OriginalAddLog = originalAddLog;
  window.addLog = routedAddLog;
  window.updateP1ProgressLog = updateP1ProgressOnly;
  cleanLegacyP1RowsFromP2();
  window.__p1LogRouterInstalled = true;
  return true;
}

let attempts = 0;
const installTimer = setInterval(() => {
  attempts += 1;
  if (installP1LogRouter() || attempts >= 80) clearInterval(installTimer);
}, 100);

export { installP1LogRouter, isP1OwnedMessage, updateP1ProgressOnly };
