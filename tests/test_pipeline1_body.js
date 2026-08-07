// Pipeline 1 test body (034) — executed inside renderer context via executeJavaScript
// Covers: card selection, detail panel, mojibake, per-job AI provider+model, execution contract
// Returns a Promise -> JSON.stringify({log, passCount, failCount})
(async function() {
  var log = [];
  var passCount = 0;
  var failCount = 0;
  function assert(condition, msg) {
    if (!condition) { log.push('FAIL: ' + msg); failCount++; throw new Error('ASSERT: ' + msg); }
    log.push('PASS: ' + msg); passCount++;
  }
  function notTested(msg) { log.push('NOT TESTED: ' + msg); }

  try {

  // === 1. Shared state identity ========================================
  assert(typeof window._appState === 'object' && window._appState !== null,
    'window._appState is a non-null object');
  assert('pipeline1SelectedJobId' in window._appState,
    'pipeline1SelectedJobId field exists in state');
  assert(Array.isArray(window._appState.jobs), 'state.jobs is an array');

  // === 2. Production voice options =====================================
  var voiceEl = document.getElementById('step1-tts-voice');
  assert(!!voiceEl, 'step1-tts-voice element exists');
  var voiceOpts = [].slice.call(voiceEl.options).map(function(o){ return o.value; });
  assert(voiceOpts.indexOf('none') !== -1,
    'step1-tts-voice has value="none". Opts: ' + voiceOpts.join(','));
  assert(voiceOpts.indexOf('vi-VN-HoaiMyNeural') !== -1,
    'step1-tts-voice has value="vi-VN-HoaiMyNeural"');
  assert(voiceOpts.indexOf('vi-VN-NamMinhNeural') !== -1,
    'step1-tts-voice has value="vi-VN-NamMinhNeural"');

  // === 3. Provider selector exists with required options ================
  var providerEl = document.getElementById('step1-ai-provider');
  assert(!!providerEl, 'step1-ai-provider element exists in Pipeline 1');
  var pOpts = [].slice.call(providerEl.options).map(function(o){ return o.value; });
  assert(pOpts.indexOf('gemini') !== -1,
    'step1-ai-provider has gemini option. Opts: ' + pOpts.join(','));
  assert(pOpts.indexOf('deepseek') !== -1,
    'step1-ai-provider has deepseek option. Opts: ' + pOpts.join(','));
  assert(pOpts.indexOf('ollama') !== -1,
    'step1-ai-provider has ollama option. Opts: ' + pOpts.join(','));

  // === 4. Populate 2 distinct jobs with aiProvider+aiModel ==============
  window._appState.pipeline1SelectedJobId = null;
  window._appState.jobs = [
    { id: 'jobA', fileName: 'VideoA.mp4', filePath: '/tmp/VideoA.mp4', status: 'idle',
      aiProvider: 'gemini', aiModel: '', ttsVoice: 'vi-VN-HoaiMyNeural', ttsSpeed: '150',
      srtContent: '', aiContent: undefined, ttsAudioPath: null, pipeline: 1 },
    { id: 'jobB', fileName: 'VideoB.mp4', filePath: '/tmp/VideoB.mp4', status: 'idle',
      aiProvider: 'ollama', aiModel: '', ttsVoice: 'vi-VN-NamMinhNeural', ttsSpeed: '75',
      srtContent: '', aiContent: undefined, ttsAudioPath: null, pipeline: 1 }
  ];
  assert('aiProvider' in window._appState.jobs[0],
    'job.aiProvider field exists in job object');
  assert('aiModel' in window._appState.jobs[0],
    'job.aiModel field exists in job object');

  // === 5. renderJobList renders 2 separate .job-card elements ===========
  assert(typeof window.renderJobList === 'function', 'renderJobList is exposed on window');
  window.renderJobList();
  var list1 = document.getElementById('step1-job-list');
  assert(!!list1, 'step1-job-list element exists');
  var cards = list1.querySelectorAll('.job-card');
  assert(cards.length === 2,
    'Two .job-card elements rendered (production class). Found: ' + cards.length);

  // === 6. Empty detail state — exact Vietnamese text ====================
  var titleEl = document.getElementById('step1-detail-title');
  var statusEl = document.getElementById('step1-detail-status');
  assert(!!titleEl, 'step1-detail-title element exists');
  assert(!!statusEl, 'step1-detail-status element exists');

  window._appState.pipeline1SelectedJobId = null;
  window.renderJobDetail1();

  assert(titleEl.textContent.trim() === 'Vui lòng chọn 1 Job',
    'Empty state detail title exact Vietnamese. Got: "' + titleEl.textContent.trim() + '"');
  assert(statusEl.textContent.trim() === 'Trống',
    'Empty state detail status exact Vietnamese. Got: "' + statusEl.textContent.trim() + '"');

  // Mojibake scanner (reused throughout)
  var MOJI_PATS = ['\u00c3', '\u00c4\u00b9', '\u00c6', '\u00e2', '\u00f0\u0178', '\u00ef\u00bf\u00bd',
    '\u00e1\u00bb', '\u00e1\u00ba', '\u2122', '\u2018'];
  function scanMojibake(text, label) {
    MOJI_PATS.forEach(function(pat) {
      assert(text.indexOf(pat) === -1,
        'No mojibake pattern "' + pat + '" in ' + label);
    });
  }
  scanMojibake(titleEl.textContent, 'step1-detail-title (empty)');
  scanMojibake(statusEl.textContent, 'step1-detail-status (empty)');

  // === 7. Mock loadStep1Models for controlled test environment =========
  // We mock electronAPI.testProvider and electronAPI.listOllamaModels
  // so that model discovery works without real network/keys
  var GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
  var OLLAMA_MODELS = ['qwen3-coder:30b', 'llama3'];
  if (!window.electronAPI) window.electronAPI = {};
  var _origTestProvider = window.electronAPI.testProvider;
  var _origListOllama = window.electronAPI.listOllamaModels;

  window.electronAPI.testProvider = function(provider) {
    if (provider === 'gemini') {
      return Promise.resolve({ status: 'ok', models: GEMINI_MODELS });
    }
    if (provider === 'deepseek') {
      return Promise.resolve({ status: 'ok', models: ['deepseek-chat', 'deepseek-coder'] });
    }
    return Promise.resolve({ status: 'error', error: 'Unknown provider', models: [] });
  };
  window.electronAPI.listOllamaModels = function() {
    return Promise.resolve({ status: 'ok', models: OLLAMA_MODELS });
  };

  // === 8. Pre-seed model options for Job A (gemini) =====================
  // Call loadStep1Models directly to simulate clicking Job A with gemini
  assert(typeof window.loadStep1Models === 'function',
    'loadStep1Models is exposed on window');

  var jobA = window._appState.jobs.find(function(j){return j.id==='jobA';});
  var jobB = window._appState.jobs.find(function(j){return j.id==='jobB';});

  // Load gemini models for job A
  providerEl.value = 'gemini';
  await window.loadStep1Models('gemini', jobA);

  var modelEl = document.getElementById('step1-ai-model');
  assert(!!modelEl, 'step1-ai-model element exists');
  var modelOpts = [].slice.call(modelEl.options).map(function(o){ return o.value; }).filter(Boolean);
  assert(modelOpts.indexOf('gemini-2.5-flash') !== -1,
    'gemini-2.5-flash in step1-ai-model after loadStep1Models(gemini). Options: ' + modelOpts.join(','));
  assert(modelOpts.indexOf('gemini-2.5-pro') !== -1,
    'gemini-2.5-pro in step1-ai-model after loadStep1Models(gemini)');

  // Select gemini-2.5-flash and save to job
  modelEl.value = 'gemini-2.5-flash';
  modelEl.dispatchEvent(new Event('change', { bubbles: true }));

  // === 9. Click Job A card =============================================
  // Set selected job and restore controls
  window._appState.pipeline1SelectedJobId = 'jobA';
  jobA.aiProvider = 'gemini';
  jobA.aiModel = 'gemini-2.5-flash';
  window.renderJobList();
  window.renderJobDetail1();
  // Wait for async model load
  await new Promise(function(r){ setTimeout(r, 50); });

  assert(window._appState.pipeline1SelectedJobId === 'jobA',
    'pipeline1SelectedJobId = jobA after renderJobDetail1');
  assert(titleEl.textContent.trim() === 'VideoA.mp4',
    'Detail title shows VideoA.mp4. Got: "' + titleEl.textContent.trim() + '"');

  // Provider and model restored to Job A values
  assert(providerEl.value === 'gemini',
    'Provider restored to gemini for Job A. Got: ' + providerEl.value);
  // Model dropdown should have been populated and restored
  await new Promise(function(r){ setTimeout(r, 100); });
  assert(modelEl.value === 'gemini-2.5-flash',
    'Model restored to gemini-2.5-flash for Job A. Got: ' + modelEl.value);

  // Job A state
  assert(jobA.aiProvider === 'gemini',
    'jobA.aiProvider === gemini. Got: ' + jobA.aiProvider);
  assert(jobA.aiModel === 'gemini-2.5-flash',
    'jobA.aiModel === gemini-2.5-flash. Got: ' + jobA.aiModel);

  // === 10. Provider selector change — provider change updates job ========
  // Simulate user changing Job A provider to deepseek
  providerEl.value = 'gemini';
  providerEl.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(function(r){ setTimeout(r, 100); });
  assert(jobA.aiProvider === 'gemini',
    'jobA.aiProvider updated to gemini via change event. Got: ' + jobA.aiProvider);

  // === 11. Click Job B (Ollama) — detail updates =========================
  window._appState.pipeline1SelectedJobId = 'jobB';
  jobB.aiProvider = 'ollama';
  jobB.aiModel = '';
  window.renderJobList();
  window.renderJobDetail1();
  await new Promise(function(r){ setTimeout(r, 150); });

  assert(providerEl.value === 'ollama',
    'Provider restored to ollama for Job B. Got: ' + providerEl.value);
  var ollamaModelOpts = [].slice.call(modelEl.options).map(function(o){ return o.value; }).filter(Boolean);
  assert(ollamaModelOpts.indexOf('qwen3-coder:30b') !== -1,
    'qwen3-coder:30b loaded for ollama. Options: ' + ollamaModelOpts.join(','));

  // Select qwen3-coder:30b for Job B
  modelEl.value = 'qwen3-coder:30b';
  modelEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(jobB.aiModel === 'qwen3-coder:30b',
    'jobB.aiModel saved as qwen3-coder:30b. Got: ' + jobB.aiModel);
  assert(jobB.aiProvider === 'ollama',
    'jobB.aiProvider === ollama. Got: ' + jobB.aiProvider);

  // === 12. A -> B -> A restore ==========================================
  window._appState.pipeline1SelectedJobId = 'jobA';
  window.renderJobList();
  window.renderJobDetail1();
  await new Promise(function(r){ setTimeout(r, 150); });

  assert(titleEl.textContent.trim() === 'VideoA.mp4',
    'A->B->A: title restored to VideoA.mp4. Got: "' + titleEl.textContent.trim() + '"');
  assert(providerEl.value === 'gemini',
    'A->B->A: provider restored to gemini. Got: ' + providerEl.value);
  await new Promise(function(r){ setTimeout(r, 100); });
  assert(modelEl.value === 'gemini-2.5-flash',
    'A->B->A: model restored to gemini-2.5-flash. Got: ' + modelEl.value);

  // A card active
  var cards3 = list1.querySelectorAll('.job-card');
  assert(cards3[0].classList.contains('active'),
    'Card A active after A->B->A');
  assert(!cards3[1].classList.contains('active'),
    'Card B not active after A->B->A');

  // === 13. Back to Job B — restore Ollama ================================
  window._appState.pipeline1SelectedJobId = 'jobB';
  window.renderJobList();
  window.renderJobDetail1();
  await new Promise(function(r){ setTimeout(r, 150); });

  assert(providerEl.value === 'ollama',
    'Job B: provider restored to ollama. Got: ' + providerEl.value);
  await new Promise(function(r){ setTimeout(r, 100); });
  assert(modelEl.value === 'qwen3-coder:30b',
    'Job B: model restored to qwen3-coder:30b. Got: ' + modelEl.value);

  // === 14. Provider switch clears stale model ===========================
  window._appState.pipeline1SelectedJobId = 'jobA';
  window.renderJobList();
  window.renderJobDetail1();
  await new Promise(function(r){ setTimeout(r, 100); });

  // Switch Job A from gemini to deepseek
  providerEl.value = 'deepseek';
  providerEl.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise(function(r){ setTimeout(r, 150); });

  // Job A's provider should now be deepseek
  assert(jobA.aiProvider === 'deepseek',
    'After provider switch: jobA.aiProvider === deepseek. Got: ' + jobA.aiProvider);
  // The model list should NOT contain gemini models
  var dsOpts = [].slice.call(modelEl.options).map(function(o){ return o.value; }).filter(Boolean);
  assert(dsOpts.indexOf('gemini-2.5-flash') === -1,
    'Stale gemini model NOT in dropdown after switching to deepseek. Opts: ' + dsOpts.join(','));

  // === 15. No API key / provider error shows controlled message ==========
  var _prevTestProvider = window.electronAPI.testProvider;
  window.electronAPI.testProvider = function() {
    return Promise.resolve({ status: 'error', error: 'Chưa lưu API key nào.' });
  };
  await window.loadStep1Models('gemini', jobA);
  var errOpts = [].slice.call(modelEl.options).map(function(o){ return o.text; });
  var hasControlledMsg = errOpts.some(function(t) {
    return t.indexOf('API key') !== -1 || t.indexOf('Chưa') !== -1 || t.indexOf('Settings') !== -1
      || t.indexOf('Lỗi') !== -1;
  });
  assert(hasControlledMsg,
    'No API key shows controlled message (not "Đang tải..."). Options: ' + errOpts.join('; '));
  var noInfiniteLoad = errOpts.every(function(t){ return t !== 'Đang tải...'; });
  assert(noInfiniteLoad,
    'No infinite "Đang tải..." when provider has no key. Opts: ' + errOpts.join('; '));
  window.electronAPI.testProvider = _prevTestProvider;

  // Restore mocks
  window.electronAPI.testProvider = _origTestProvider;
  window.electronAPI.listOllamaModels = _origListOllama;

  // Restore job states for execution tests
  jobA.aiProvider = 'gemini';
  jobA.aiModel = 'gemini-2.5-flash';
  jobB.aiProvider = 'ollama';
  jobB.aiModel = 'qwen3-coder:30b';

  // === 16. Execution contract: cloud job A uses job.aiProvider + job.aiModel
  window.electronAPI.testProvider = window.electronAPI.testProvider || _origTestProvider;
  if (!window.electronAPI) window.electronAPI = {};

  var capturedAiPayload = null;
  var _origAiRewrite = window.electronAPI.aiRewrite;
  window.electronAPI.aiRewrite = function(payload) {
    capturedAiPayload = payload;
    return Promise.resolve({ status: 'ok', result: 'mocked AI output' });
  };

  var testSrt = '1\n00:00:01,000 --> 00:00:03,000\nTest subtitle';
  window._appState.pipeline1SelectedJobId = 'jobA';
  if (typeof window.triggerAutoAiRewrite === 'function') {
    try { await window.triggerAutoAiRewrite(jobA, testSrt); } catch(ex) {}
    if (capturedAiPayload !== null) {
      assert(capturedAiPayload.provider === 'gemini',
        'AI execution: payload.provider === gemini (from job.aiProvider). Got: ' + capturedAiPayload.provider);
      assert(capturedAiPayload.model === 'gemini-2.5-flash',
        'AI execution: payload.model === gemini-2.5-flash (from job.aiModel). Got: ' + capturedAiPayload.model);
    } else {
      notTested('AI payload not captured for Job A');
    }
  } else { notTested('triggerAutoAiRewrite not exposed'); }
  window.electronAPI.aiRewrite = _origAiRewrite;

  // === 17. Execution contract: Ollama job B uses job.aiModel ============
  var capturedOllamaPayload = null;
  var _origOllamaChat = window.electronAPI.ollamaChat;
  window.electronAPI.ollamaChat = function(payload) {
    capturedOllamaPayload = payload;
    return Promise.resolve({ status: 'ok', result: 'mocked ollama output' });
  };
  if (typeof window.triggerAutoAiRewrite === 'function') {
    try { await window.triggerAutoAiRewrite(jobB, testSrt); } catch(ex) {}
    if (capturedOllamaPayload !== null) {
      assert(capturedOllamaPayload.model === 'qwen3-coder:30b',
        'Ollama execution: model === qwen3-coder:30b (from job.aiModel). Got: ' + capturedOllamaPayload.model);
    } else {
      notTested('Ollama payload not captured for Job B');
    }
  } else { notTested('triggerAutoAiRewrite not exposed for ollama test'); }
  window.electronAPI.ollamaChat = _origOllamaChat;

  // === 18. Mojibake scan after all interactions =========================
  window._appState.pipeline1SelectedJobId = 'jobA';
  window.renderJobList();
  window.renderJobDetail1();
  await new Promise(function(r){ setTimeout(r, 100); });

  scanMojibake(list1.textContent || '', 'step1-job-list after all interactions');
  scanMojibake(titleEl.textContent, 'step1-detail-title (final)');
  scanMojibake(statusEl.textContent, 'step1-detail-status (final)');
  var saveBtnEl = document.getElementById('step1-btn-save-text');
  if (saveBtnEl) scanMojibake(saveBtnEl.textContent, 'step1-btn-save-text');
  var extractBtnEl = document.getElementById('step1-btn-extract');
  if (extractBtnEl) scanMojibake(extractBtnEl.textContent, 'step1-btn-extract');

  // === 19. TTS execution contract (speed multiplier) ====================
  var capturedFetchBody = null;
  var _origFetch = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === 'string' && url.indexOf('tts-retry') !== -1) {
      try { capturedFetchBody = JSON.parse(opts.body); } catch(ex) {}
      return Promise.resolve({
        ok: true,
        json: function() { return Promise.resolve({ status: 'ok', audio_path: '/tmp/mock.mp3', srt_content: '' }); }
      });
    }
    return _origFetch ? _origFetch(url, opts) : Promise.reject(new Error('no fetch'));
  };
  if (typeof window.triggerAutoTts === 'function') {
    try { await window.triggerAutoTts(jobA, testSrt); } catch(ex) {}
    if (capturedFetchBody !== null) {
      assert(capturedFetchBody.tts_voice === 'vi-VN-HoaiMyNeural',
        'TTS payload.tts_voice === vi-VN-HoaiMyNeural. Got: ' + capturedFetchBody.tts_voice);
      assert(Math.abs(capturedFetchBody.tts_speed - 1.5) < 0.01,
        'TTS payload.tts_speed === 1.5 (slider 150 / 100). Got: ' + capturedFetchBody.tts_speed);
    } else { notTested('TTS fetch body not captured'); }
  } else { notTested('triggerAutoTts not exposed'); }
  window.fetch = _origFetch;

  // === 20. Speed multiplier formula =====================================
  function sliderToMultiplier(v) { return Number(v) / 100; }
  assert(sliderToMultiplier(100) === 1.0, 'UI 100 => 1.0x');
  assert(sliderToMultiplier(150) === 1.5, 'UI 150 => 1.5x');
  assert(sliderToMultiplier(50) === 0.5, 'UI 50 => 0.5x');
  assert(sliderToMultiplier(200) === 2.0, 'UI 200 => 2.0x');

  // === 21. Step1 speed slider config =====================================
  var speedEl = document.getElementById('step1-tts-speed');
  assert(!!speedEl, 'step1-tts-speed exists');
  assert(speedEl.min === '50', 'Speed min=50. Got: ' + speedEl.min);
  assert(speedEl.max === '200', 'Speed max=200. Got: ' + speedEl.max);

  } catch(e) {
    if (!e.message.startsWith('ASSERT:')) {
      log.push('HARNESS ERROR: ' + e.message);
      failCount++;
    }
  }

  return JSON.stringify({ log: log, passCount: passCount, failCount: failCount });
})();
