(function installNativeFilePathCompat() {
  'use strict';

  if (typeof File === 'undefined') return;
  if (!window.electronAPI?.getPathForFile) return;

  const existing = Object.getOwnPropertyDescriptor(File.prototype, 'path');
  if (existing?.get) return;

  Object.defineProperty(File.prototype, 'path', {
    configurable: true,
    enumerable: false,
    get() {
      try {
        return window.electronAPI.getPathForFile(this) || '';
      } catch {
        return '';
      }
    },
  });
})();
