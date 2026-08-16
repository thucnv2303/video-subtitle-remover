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

  window.resolveNativeFilePath = resolveNativeFilePath;

  const existing = Object.getOwnPropertyDescriptor(File.prototype, 'path');
  if (existing && existing.configurable === false) return;

  Object.defineProperty(File.prototype, 'path', {
    configurable: true,
    enumerable: false,
    get() {
      return resolveNativeFilePath(this);
    },
  });
})();
