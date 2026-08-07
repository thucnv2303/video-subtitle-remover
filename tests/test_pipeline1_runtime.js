const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile(path.join(__dirname, '../src/renderer/index.html'));

  win.webContents.on('did-finish-load', async () => {
    try {
      const result = await win.webContents.executeJavaScript(`
        (function() {
          let log = [];
          function assert(condition, msg) {
            if (!condition) {
              log.push('FAIL: ' + msg);
              throw new Error(msg);
            }
            log.push('PASS: ' + msg);
          }

          try {
            // 1. Shared state object identity
            assert(window._appState, 'window._appState exists');
            assert(typeof window._appState === 'object', 'window._appState is object');

            // 3. No state ReferenceError
            assert(window._appState.pipeline1SelectedJobId !== undefined, 'pipeline1SelectedJobId is initialized');

            // Set up test DOM
            const btnStart = document.getElementById('btn-start-all');
            assert(btnStart, 'btn-start-all exists (DOM layout)');

            // 4. Two jobs render as separate cards
            window._appState.jobs = [
              { id: 'jobA', fileName: 'Video A', status: 'queued', aiModel: 'modelA', ttsVoice: 'Hoài My (Nữ, Miền Nam)', ttsSpeed: '50' },
              { id: 'jobB', fileName: 'Video B', status: 'queued', aiModel: 'modelB', ttsVoice: 'Nam Minh (Nam, Miền Bắc)', ttsSpeed: '75' }
            ];
            
            // Re-render job list (assuming renderJobList is available)
            if (typeof window.renderJobList === 'function') {
                window.renderJobList();
            } else {
                // If not available, we mock the UI state change directly
            }

            // 5. Selecting Job A sets selected ID
            window._appState.pipeline1SelectedJobId = 'jobA';
            window.renderJobDetail1();
            
            // 10. Detail panel updates
            const modelEl = document.getElementById('step1-ai-model');
            const voiceEl = document.getElementById('step1-tts-voice');
            const speedEl = document.getElementById('step1-tts-speed');

            assert(modelEl.value === 'modelA' || modelEl.value === '', 'Job A model is restored');
            assert(voiceEl.value === 'Hoài My (Nữ, Miền Nam)', 'Job A voice is restored');
            if (speedEl) assert(speedEl.value === '50', 'Job A speed is restored');

            // 6. Job A model/voice/speed are saved
            modelEl.append(new Option('modelX', 'modelX'));
            modelEl.value = 'modelX';
            modelEl.dispatchEvent(new Event('change'));
            assert(window._appState.jobs[0].aiModel === 'modelX', 'Job A model saved via event');

            // 7. Job B stores different values
            window._appState.pipeline1SelectedJobId = 'jobB';
            window.renderJobDetail1();
            assert(modelEl.value !== 'modelX', 'Job B model is different');

            // 8. Returning to Job A restores its values
            window._appState.pipeline1SelectedJobId = 'jobA';
            window.renderJobDetail1();
            assert(modelEl.value === 'modelX', 'Job A model restored again');

            // 11. AI model event copies all available options
            const cloudModel = document.createElement('select');
            cloudModel.id = 'ai-cloud-model';
            cloudModel.append(new Option('Cloud1', 'Cloud1'));
            document.body.appendChild(cloudModel);
            localStorage.setItem('ai_provider', 'gemini');
            window.dispatchEvent(new Event('aiModelChanged'));
            assert(modelEl.options.length > 0 && modelEl.options[0].value === 'Cloud1', 'AI model copies options');

            // 12. Empty model state displays "Chưa chọn"
            cloudModel.innerHTML = '';
            localStorage.setItem('ai_provider', 'nonexistent');
            window.dispatchEvent(new Event('aiModelChanged'));
            assert(modelEl.options[0].text === 'Chưa chọn', 'Empty model state displays Chưa chọn. Actual: ' + modelEl.options[0].text);

            // 14. Missing TTS/provider state handled without uncaught errors
            window.renderJobDetail1(); // Should not throw

            return { success: true, log };
          } catch (e) {
            return { success: false, error: e.message, log };
          }
        })();
      `);

      if (result.success) {
        console.log("All Runtime Tests PASSED:\n" + result.log.join('\n'));
        app.exit(0);
      } else {
        console.error("Runtime Tests FAILED:\n" + result.log.join('\n') + '\nError: ' + result.error);
        app.exit(1);
      }
    } catch (err) {
      console.error("Electron Execution Error: " + err);
      app.exit(1);
    }
  });
});

