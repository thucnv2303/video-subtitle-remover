/**
 * test_pipeline1_runtime.js
 *
 * Production-behavior headless Electron test for Pipeline 1 per-job state.
 * Writes the test body to a temp file, then evaluates via fs.readFileSync
 * to avoid any string-injection issues with executeJavaScript.
 *
 * Exit 0 = all PASS. Exit 1 = any FAIL.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

app.disableHardwareAcceleration();

// Write the test body to a temp JS file so there are no injection issues
const testBody = fs.readFileSync(path.join(__dirname, 'test_pipeline1_body.js'), 'utf8');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  win.loadFile(path.join(__dirname, '../src/renderer/index.html'));

  win.webContents.on('console-message', (e, level, message) => {
    if (level >= 2) process.stderr.write('[Renderer] ' + message + '\n');
  });

  win.webContents.on('did-finish-load', async () => {
    let exitCode = 0;
    try {
      // Inject testBody as a script via eval in the renderer
      // We pass it through IPC-safe preload: write to tempfile then require
      const tempFile = path.join(os.tmpdir(), 'p1_test_body_' + process.pid + '.js');
      // Wrap test body to return result
      const wrapped = `(function() { ${testBody} })()`;
      fs.writeFileSync(tempFile, wrapped, 'utf8');

      const resultJson = await win.webContents.executeJavaScript(
        `(function() { const fs = require('fs'); const body = fs.readFileSync(${JSON.stringify(tempFile)}, 'utf8'); return eval(body); })()`
      );

      fs.unlinkSync(tempFile);

      const result = JSON.parse(resultJson);
      const lines = result.log.join('\n');
      const hasFail = result.log.some(l => l.startsWith('FAIL:') || l.startsWith('HARNESS ERROR:'));
      const notTestedCount = result.log.filter(l => l.startsWith('NOT TESTED:')).length;

      process.stdout.write(lines + '\n');
      process.stdout.write(
        '\nSUMMARY: ' + result.passCount + ' PASS / ' + result.failCount + ' FAIL / ' + notTestedCount + ' NOT TESTED\n'
      );

      if (hasFail) {
        process.stdout.write('Runtime Tests FAILED\n');
        exitCode = 1;
      } else {
        process.stdout.write('All Runtime Tests PASSED\n');
      }
    } catch (err) {
      process.stderr.write('Test harness error: ' + err.message + '\n');
      exitCode = 1;
    } finally {
      app.exit(exitCode);
    }
  });
});
