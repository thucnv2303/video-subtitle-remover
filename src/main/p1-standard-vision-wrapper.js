const registerStandardVisionIPC = require('./p1-standard-vision-ipc');

/**
 * Registers the pre-semantic Pipeline 1 reasoning path under isolated IPC names.
 * Shared audio persistence/fit handlers stay owned by p1-vision-ipc.js.
 */
module.exports = function registerP1StandardVisionIPC({ ipcMain, net }) {
  const channelMap = new Map([
    ['ollama:p1AnalyzeVision', 'ollama:p1AnalyzeStandardVision'],
    ['ollama:p1CancelVision', 'ollama:p1CancelStandardVision'],
  ]);

  const scopedIpcMain = {
    handle(channel, handler) {
      const mapped = channelMap.get(channel);
      if (!mapped) return undefined;
      return ipcMain.handle(mapped, handler);
    },
  };

  registerStandardVisionIPC({ ipcMain: scopedIpcMain, net });
};
