(function installNativeFilePathCompat() {
  'use strict';

  if (typeof File === 'undefined') return;
  if (!window.electronAPI?.getPathForFile) return;

  function resolveNativeFilePath(file) {
    if (!file) return '';
    try {
      const nativePath = window.electronAPI.getPathForFile(file);
      return typeof nativePath === 'string' ? nativePath.trim() : '';
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
      // If the File object cannot be stamped, callers can still use the resolver.
    }
    return nativePath;
  }

  function stampFileList(files) {
    Array.from(files || []).forEach(stampNativeFilePath);
  }

  window.resolveNativeFilePath = resolveNativeFilePath;

  const existing = Object.getOwnPropertyDescriptor(File.prototype, 'path');
  if (!existing || existing.configurable !== false) {
    Object.defineProperty(File.prototype, 'path', {
      configurable: true,
      enumerable: false,
      get() {
        return resolveNativeFilePath(this);
      },
    });
  }

  // Capture before app.js change/drop handlers read `f.path || f.name`.
  document.addEventListener('change', (event) => {
    stampFileList(event?.target?.files);
  }, true);

  document.addEventListener('drop', (event) => {
    stampFileList(event?.dataTransfer?.files);
  }, true);
})();
