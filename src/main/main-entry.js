const { app, ipcMain } = require('electron');
const { burnP3SubtitleHq, retimeP3Video } = require('./p3-export-bridge');

ipcMain.handle('p3:burnSubtitleHq', async (event, payload) => burnP3SubtitleHq(payload));
ipcMain.handle('p3:retimeVideo', async (event, payload) => retimeP3Video(payload));

app.on('browser-window-created', (event, window) => {
  window.webContents.on('did-finish-load', () => {
    window.webContents.executeJavaScript("import(new URL('./js/pipeline3/preview-ass-parity.js', location.href).href)")
      .catch(error => console.error('[P3] Preview parity module load failed:', error));
  });
});

require('./main');
