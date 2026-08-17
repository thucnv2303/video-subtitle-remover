const { ipcMain } = require('electron');
const { burnP3SubtitleHq, retimeP3Video } = require('./p3-export-bridge');

ipcMain.handle('p3:burnSubtitleHq', async (event, payload) => burnP3SubtitleHq(payload));
ipcMain.handle('p3:retimeVideo', async (event, payload) => retimeP3Video(payload));

require('./main');
