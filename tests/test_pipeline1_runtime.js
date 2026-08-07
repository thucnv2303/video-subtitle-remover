/**
 * test_pipeline1_runtime.js
 *
 * Production-behavior headless Electron test for Pipeline 1 per-job state.
 * Reads test body from test_pipeline1_body.js and executes it inside
 * the renderer via eval(), supporting async/await properly.
 *
 * Exit 0 = all PASS. Exit 1 = any FAIL.
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

const testBodyPath = path.join(__dirname, 'test_pipeline1_body.js');
const testBody = fs.readFileSync(testBodyPath, 'utf8');

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
      // Write body to temp file, load via fs.readFileSync inside renderer
      // The body is wrapped to run inside async function and returns a Promise.
      const { app: _app } = require('electron');
      const os = require('os');
      const tempFile = path.join(os.tmpdir(), 'p1_test_body_' + Date.now() + '.js');
      fs.writeFileSync(tempFile, testBody, 'utf8');

      // Execute inside renderer: reads the file and evals it.
      // The eval returns a Promise (from async IIFE in the body).
      // executeJavaScript will await a returned Promise automatically.
      const resultJson = await win.webContents.executeJavaScript(
        '(function() {' +
        '  var fs = require("fs");' +
        '  var body = fs.readFileSync(' + JSON.stringify(tempFile) + ', "utf8");' +
        '  return eval(body);' +
        '})()'
      );

      fs.unlinkSync(tempFile);

      const result = JSON.parse(resultJson);
      const lines = result.log.join('\n');
      const failLines = result.log.filter(l => l.startsWith('FAIL:') || l.startsWith('HARNESS ERROR:'));
      const notTestedCount = result.log.filter(l => l.startsWith('NOT TESTED:')).length;

      process.stdout.write(lines + '\n');
      process.stdout.write(
        '\nSUMMARY: ' + result.passCount + ' PASS / ' + result.failCount + ' FAIL / ' + notTestedCount + ' NOT TESTED\n'
      );

      if (failLines.length > 0) {
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
