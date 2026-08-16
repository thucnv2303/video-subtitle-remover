(function installNativeFilePathCompat() {
  'use strict';

  if (typeof File === 'undefined') return;

  const DATASET_KEY = 'vsrNativeFilePaths';
  const VIDEO_RE = /\.(mp4|avi|mkv|mov|webm)$/i;

  function fileKey(file) {
    if (!file) return '';
    return [
      String(file.name || ''),
      Number(file.size || 0),
      Number(file.lastModified || 0),
      String(file.type || ''),
    ].join('::');
  }

  function isAbsolutePath(value) {
    const text = String(value || '').trim();
    return /^[A-Za-z]:[\\/]/.test(text) || /^\\\\[^\\]+\\[^\\]+/.test(text) || text.startsWith('/');
  }

  function readPublishedPaths() {
    const raw = document.documentElement?.dataset?.[DATASET_KEY];
    if (!raw) return new Map();
    try {
      const payload = JSON.parse(decodeURIComponent(raw));
      return new Map((payload?.entries || [])
        .filter(entry => entry?.key && isAbsolutePath(entry?.path))
        .map(entry => [entry.key, entry.path]));
    } catch {
      return new Map();
    }
  }

  function resolveNativeFilePath(file) {
    if (!file) return '';
    const published = readPublishedPaths().get(fileKey(file));
    if (isAbsolutePath(published)) return published;
    try {
      const legacy = window.electronAPI?.getPathForFile?.(file);
      return isAbsolutePath(legacy) ? legacy.trim() : '';
    } catch {
      return '';
    }
  }

  function stampNativeFilePath(file) {
    if (!file) return '';
    const nativePath = resolveNativeFilePath(file);
    if (!nativePath) return '';
    try {
      Object.defineProperty(file, 'path', {
        configurable: true,
        enumerable: false,
        value: nativePath,
        writable: false,
      });
    } catch {
      // File may be non-extensible. The consumer guard below still blocks basename fallback.
    }
    return nativePath;
  }

  function stampFileList(files) {
    return Array.from(files || []).map(file => ({ file, path: stampNativeFilePath(file) }));
  }

  function blockUnresolvedEvent(event, unresolved) {
    if (!unresolved.length) return false;
    event.preventDefault?.();
    event.stopImmediatePropagation?.();
    const names = unresolved.map(file => file?.name || 'unknown').join(', ');
    const message = `Không lấy được đường dẫn tuyệt đối của video: ${names}. Job chưa được tạo để tránh gửi basename sai sang backend.`;
    window.addLog?.(`[File] ${message}`, 'error');
    window.showToast?.(message, 'error', 6000);
    return true;
  }

  window.resolveNativeFilePath = resolveNativeFilePath;
  window.isAbsoluteNativeFilePath = isAbsolutePath;

  const existing = Object.getOwnPropertyDescriptor(File.prototype, 'path');
  if (!existing || existing.configurable !== false) {
    try {
      Object.defineProperty(File.prototype, 'path', {
        configurable: true,
        enumerable: false,
        get() {
          return resolveNativeFilePath(this);
        },
      });
    } catch {
      // Consumer guard remains authoritative even if File.prototype cannot be patched.
    }
  }

  // These capture listeners run before app.js change/drop consumers. Preload has already
  // published native paths for the same event from its isolated world.
  document.addEventListener('change', (event) => {
    const files = Array.from(event?.target?.files || []);
    if (!files.length) return;
    const unresolved = stampFileList(files).filter(item => !item.path).map(item => item.file);
    blockUnresolvedEvent(event, unresolved);
  }, true);

  document.addEventListener('drop', (event) => {
    const files = Array.from(event?.dataTransfer?.files || []).filter(file => VIDEO_RE.test(file?.name || ''));
    if (!files.length) return;
    const unresolved = stampFileList(files).filter(item => !item.path).map(item => item.file);
    blockUnresolvedEvent(event, unresolved);
  }, true);
})();
