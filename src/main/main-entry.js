const { app, ipcMain, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { burnP3SubtitleHq, retimeP3Video } = require('./p3-export-bridge');

ipcMain.handle('p3:burnSubtitleHq', async (event, payload) => burnP3SubtitleHq(payload));
ipcMain.handle('p3:retimeVideo', async (event, payload) => retimeP3Video(payload));
ipcMain.handle('app:saveCopy', async (event, payload = {}) => {
  const sourcePath = path.resolve(String(payload.sourcePath || ''));
  if (!sourcePath || !fs.existsSync(sourcePath)) return { ok: false, error: 'Không tìm thấy file kết quả để tải.' };
  const stat = fs.statSync(sourcePath);
  if (!stat.isFile()) return { ok: false, error: 'Kết quả tải xuống phải là một file.' };

  const suggestedName = path.basename(String(payload.suggestedName || sourcePath));
  const defaultPath = path.join(path.dirname(sourcePath), suggestedName);
  const owner = BrowserWindow.fromWebContents(event.sender);
  const options = { title: 'Tải kết quả', defaultPath };
  const result = owner && !owner.isDestroyed()
    ? await dialog.showSaveDialog(owner, options)
    : await dialog.showSaveDialog(options);
  if (result.canceled || !result.filePath) return { ok: false, canceled: true };

  try {
    await fs.promises.copyFile(sourcePath, result.filePath);
    return { ok: true, output_path: result.filePath };
  } catch (error) {
    return { ok: false, error: error?.message || 'Không thể lưu bản sao kết quả.' };
  }
});

app.on('browser-window-created', (event, window) => {
  window.webContents.on('did-finish-load', () => {
    window.webContents.executeJavaScript("import(new URL('./js/pipeline3/preview-ass-parity.js', location.href).href)")
      .catch(error => console.error('[P3] Preview parity module load failed:', error));
    window.webContents.executeJavaScript("import(new URL('./js/job-export-controls.js', location.href).href)")
      .catch(error => console.error('[Job Export] module load failed:', error));
    window.webContents.executeJavaScript("import(new URL('./js/talking-portrait.js', location.href).href)")
      .catch(error => console.error('[AI Avatar] module load failed:', error));
  });
});

require('./main');