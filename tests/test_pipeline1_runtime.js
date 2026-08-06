const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const fs = require('fs');
const path = require('path');

let passCount = 0;
let failCount = 0;
function assert(condition, message) {
    if (condition) { console.log('PASS: ' + message); passCount++; }
    else { console.log('FAIL: ' + message); failCount++; }
}

async function runTest() {
    const html = fs.readFileSync('src/renderer/index.html', 'utf8');
    
    // Setup jsdom with all scripts
    const storeJs = fs.readFileSync('src/renderer/js/store.js', 'utf8');
    const settingsJs = fs.readFileSync('src/renderer/js/components/settings.js', 'utf8').replace(/import\s+.*?;\s*/g, '');
    const appJs = fs.readFileSync('src/renderer/js/app.js', 'utf8');

    const dom = new JSDOM(html, {
        runScripts: 'dangerously',
        url: 'http://localhost/',
        beforeParse(window) {
            window.electronAPI = { getSystemInfo: async () => ({}), openDirectory: async () => ({}) };
            window.fetch = async () => ({ json: async () => ({}) });
            
            // Mock localStorage
            const storage = {};
            window.localStorage = {
                getItem: (k) => storage[k] || null,
                setItem: (k, v) => storage[k] = String(v),
                removeItem: (k) => delete storage[k]
            };
        }
    });

    const window = dom.window;
    const document = window.document;

    // Handle rejections
    let hasRejection = false;
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Caught unhandled rejection:', e.reason);
        hasRejection = true;
    });

    // Execute modules in order
    // 1. store.js (simulate export)
    window.eval(storeJs.replace(/export\s+const\s+state\s*=/g, 'const state =').replace(/export\s+function\s+(\w+)/g, 'window.$1 = function '));
    
    // 2. settings.js (simulate export)
    let processedSettings = settingsJs.replace(/export\s+const\s+(\w+)\s*=/g, 'const $1 =').replace(/export\s+async\s+function\s+(\w+)/g, 'async function $1').replace(/export\s+function\s+(\w+)/g, 'function $1');
    processedSettings += '\nwindow.initSettings = initSettings;\nwindow.loadSettingsValues = loadSettingsValues;\nwindow.renderSavedVoices = renderSavedVoices;\nwindow.updateVoiceDropdown = updateVoiceDropdown;\nwindow.checkTTSStatus = checkTTSStatus;';
    window.eval(processedSettings);

    // 3. app.js
    window.eval(appJs);

    assert(window._appState !== undefined, 'store.js initializes window._appState');
    assert(typeof window.updateStartButton === 'function', 'app.js parses and initializes without SyntaxError');
    assert(!hasRejection, 'No ReferenceError: state is not defined occurs during initialization');

    // Simulate Job A
    window._appState.jobs.push({ id: 'jobA', fileName: 'testA.mp4', status: 'idle', pipeline: 1 });
    window._appState.jobs.push({ id: 'jobB', fileName: 'testB.mp4', status: 'idle', pipeline: 1 });
    
    if (document.getElementById('ai-cloud-model')) document.getElementById('ai-cloud-model').innerHTML = '<option value="gpt-4">GPT-4</option><option value="gemini">Gemini</option>'; window.localStorage.setItem('ai_provider', 'gemini');
    window.localStorage.setItem('ai_model_gemini', 'gpt-4');
    window.dispatchEvent(new window.Event('aiModelChanged'));
    
    // Selecting Job A
    window._appState.pipeline1SelectedJobId = 'jobA';
    window.renderJobDetail1();
    assert(document.getElementById('step1-ai-model').value === '', 'No-model state displays empty (Chưa chọn)');

    document.getElementById('step1-ai-model').innerHTML = '<option value="gpt-4">GPT-4</option>'; document.getElementById('step1-ai-model').value = 'gpt-4';
    document.getElementById('step1-ai-model').dispatchEvent(new window.Event('change'));
    assert(window._appState.jobs[0].p1AiModel === 'gpt-4', 'Setting model updates Job A');

    document.getElementById('step1-tts-voice').value = 'vi-VN-HoaiMyNeural';
    document.getElementById('step1-tts-voice').dispatchEvent(new window.Event('change'));
    assert(window._appState.jobs[0].p1TtsVoice === 'vi-VN-HoaiMyNeural', 'Setting voice updates Job A');

    // Selecting Job B
    window._appState.pipeline1SelectedJobId = 'jobB';
    window.renderJobDetail1();
    document.getElementById('step1-ai-model').innerHTML = '<option value="gpt-4">GPT-4</option><option value="gemini">Gemini</option>'; document.getElementById('step1-ai-model').value = 'gemini';
    document.getElementById('step1-ai-model').dispatchEvent(new window.Event('change'));
    assert(window._appState.jobs[1].p1AiModel === 'gemini', 'Selecting Job B and using different values updates Job B');

    // Return to Job A
    window._appState.pipeline1SelectedJobId = 'jobA';
    window.renderJobDetail1();
    assert(document.getElementById('step1-ai-model').value === 'gpt-4', 'Returning to Job A restores Job A values');

    // Check Mojibake
    assert(!appJs.includes('ChÆ°a chá» n'), 'Mojibake scan passes');

    console.log('\n--- TOTAL ---');
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    
    process.exit(failCount > 0 ? 1 : 0);
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});

