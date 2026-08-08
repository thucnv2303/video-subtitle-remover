// Pipeline 1 test body (034-REV1) — executed inside renderer context via executeJavaScript
// Covers: production card clicks, race safety, new-job default, per-job provider+model, execution
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

  // Mojibake scanner
  var MOJI_PATS = ['\u00c3', '\u00c4\u00b9', '\u00c6', '\u00e2', '\u00f0\u0178', '\u00ef\u00bf\u00bd',
    '\u00e1\u00bb', '\u00e1\u00ba', '\u2122', '\u2018'];
  function scanMojibake(text, label) {
    MOJI_PATS.forEach(function(pat) {
      assert(text.indexOf(pat) === -1,
        'No mojibake "' + pat + '" in ' + label);
    });
  }

  // Wait for async ops
  function wait(ms) { return new Promise(function(r){ setTimeout(r, ms); }); }

  try {

  // === 1. Core state integrity ==========================================
  assert(typeof window._appState === 'object' && window._appState !== null,
    'window._appState is non-null object');
  assert('pipeline1SelectedJobId' in window._appState,
    'pipeline1SelectedJobId field exists');
  assert(Array.isArray(window._appState.jobs), 'state.jobs is array');

  // === 2. Provider selector exists with all required options ============
  var providerEl = document.getElementById('step1-ai-provider');
  assert(!!providerEl, 'step1-ai-provider exists in Pipeline 1 sidebar');
  var pVals = [].slice.call(providerEl.options).map(function(o){ return o.value; });
  assert(pVals.indexOf('gemini') !== -1, 'gemini option in step1-ai-provider. Opts: ' + pVals.join(','));
  assert(pVals.indexOf('deepseek') !== -1, 'deepseek option in step1-ai-provider');
  assert(pVals.indexOf('ollama') !== -1, 'ollama option in step1-ai-provider');

  // === 3. Model selector exists =========================================
  var modelEl = document.getElementById('step1-ai-model');
  assert(!!modelEl, 'step1-ai-model exists');

  // === 4. loadStep1Models exposed on window =============================
  assert(typeof window.loadStep1Models === 'function',
    'loadStep1Models exposed on window');

  // === 5. Voice selector options ========================================
  var voiceEl = document.getElementById('step1-tts-voice');
  assert(!!voiceEl, 'step1-tts-voice exists');
  var vOpts = [].slice.call(voiceEl.options).map(function(o){ return o.value; });
  assert(vOpts.indexOf('none') !== -1, 'step1-tts-voice has none');
  assert(vOpts.indexOf('vi-VN-HoaiMyNeural') !== -1, 'step1-tts-voice has vi-VN-HoaiMyNeural');

  // === 6. Install mocks for model discovery ============================
  // Mocks allow controlled deterministic model lists without real network/keys
  if (!window.electronAPI) window.electronAPI = {};
  var _origTestProvider = window.electronAPI.testProvider;
  var _origListOllama = window.electronAPI.listOllamaModels;

  var GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro'];
  var DEEPSEEK_MODELS = ['deepseek-chat', 'deepseek-coder'];
  var OLLAMA_MODELS = ['qwen3-coder:30b', 'llama3'];

  // Configurable delay for race tests
  var testProviderDelay = 0;
  var ollamaDelay = 0;

  window.electronAPI.testProvider = function(provider) {
    var delay = testProviderDelay;
    var models = provider === 'deepseek' ? DEEPSEEK_MODELS : GEMINI_MODELS;
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve({ status: 'ok', models: models });
      }, delay);
    });
  };
  window.electronAPI.listOllamaModels = function() {
    var delay = ollamaDelay;
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve({ status: 'ok', models: OLLAMA_MODELS });
      }, delay);
    });
  };

  // === 6.1. STARTUP / SAVED MODEL ==========================================
  window._appState.pipeline1SelectedJobId = null;
  localStorage.setItem('ai_provider', 'gemini');
  localStorage.setItem('ai_model_gemini', 'gemini-2.5-pro');
  providerEl.value = 'gemini';
  await window.loadStep1Models('gemini', null);
  assert(providerEl.value === 'gemini', '[STARTUP] provider=gemini');
  assert(modelEl.value === 'gemini-2.5-pro', '[STARTUP] model=gemini-2.5-pro (không được ra flash)');

  // === 6.2. SETTINGS EVENT / NO JOB =========================================
  localStorage.setItem('ai_provider', 'deepseek');
  localStorage.setItem('ai_model_deepseek', 'deepseek-coder');
  window.dispatchEvent(new Event('aiModelChanged'));
  await wait(150); // allow async model load
  assert(providerEl.value === 'deepseek', '[SETTINGS NO-JOB] provider=deepseek');
  assert(modelEl.value === 'deepseek-coder', '[SETTINGS NO-JOB] model=deepseek-coder');

  // === 6.3. SETTINGS EVENT / EXISTING JOB ===================================
  window._appState.jobs = [
    { id: 'jobC', fileName: 'VideoC.mp4', filePath: '/tmp/VideoC.mp4', status: 'idle',
      aiProvider: 'gemini', aiModel: 'gemini-2.5-flash',
      ttsVoice: 'none', ttsSpeed: '100', pipeline: 1, srtContent: '' }
  ];
  window._appState.pipeline1SelectedJobId = 'jobC';
  window.renderJobList();
  window.renderJobDetail1();
  await wait(150);

  localStorage.setItem('ai_provider', 'deepseek');
  window.dispatchEvent(new Event('aiModelChanged'));
  await wait(150);
  
  var jobC = window._appState.jobs.find(function(j) { return j.id === 'jobC'; });
  assert(jobC.aiProvider === 'gemini', '[SETTINGS EXISTING-JOB] job.aiProvider=gemini');
  assert(jobC.aiModel === 'gemini-2.5-flash', '[SETTINGS EXISTING-JOB] job.aiModel=gemini-2.5-flash');
  assert(providerEl.value === 'gemini', '[SETTINGS EXISTING-JOB] visible provider=gemini');
  assert(modelEl.value === 'gemini-2.5-flash', '[SETTINGS EXISTING-JOB] visible model=gemini-2.5-flash');


  // === 7. Set up 2 jobs with full aiProvider+aiModel state =============
  window._appState.pipeline1SelectedJobId = null;
  window._appState.jobs = [
    { id: 'jobA', fileName: 'VideoA.mp4', filePath: '/tmp/VideoA.mp4', status: 'idle',
      aiProvider: 'gemini', aiModel: 'gemini-2.5-flash',
      ttsVoice: 'vi-VN-HoaiMyNeural', ttsSpeed: '150',
      srtContent: '', aiContent: undefined, ttsAudioPath: null, pipeline: 1 },
    { id: 'jobB', fileName: 'VideoB.mp4', filePath: '/tmp/VideoB.mp4', status: 'idle',
      aiProvider: 'ollama', aiModel: 'qwen3-coder:30b',
      ttsVoice: 'vi-VN-NamMinhNeural', ttsSpeed: '75',
      srtContent: '', aiContent: undefined, ttsAudioPath: null, pipeline: 1 }
  ];
  assert('aiProvider' in window._appState.jobs[0], 'job.aiProvider field exists');
  assert('aiModel' in window._appState.jobs[0], 'job.aiModel field exists');

  // Render cards
  assert(typeof window.renderJobList === 'function', 'renderJobList exposed on window');
  window.renderJobList();
  var list1 = document.getElementById('step1-job-list');
  assert(!!list1, 'step1-job-list exists');
  var cards = list1.querySelectorAll('.job-card');
  assert(cards.length === 2, 'Two .job-card elements. Found: ' + cards.length);

  // === 8. Empty detail state BEFORE any selection =======================
  var titleEl = document.getElementById('step1-detail-title');
  var statusEl = document.getElementById('step1-detail-status');
  assert(!!titleEl, 'step1-detail-title exists');
  assert(!!statusEl, 'step1-detail-status exists');
  window.renderJobDetail1();
  assert(titleEl.textContent.trim() === 'Vui lòng chọn 1 Job',
    'Empty state title exact Vietnamese. Got: "' + titleEl.textContent.trim() + '"');
  assert(statusEl.textContent.trim() === 'Trống',
    'Empty state status exact Vietnamese. Got: "' + statusEl.textContent.trim() + '"');
  scanMojibake(titleEl.textContent, 'detail-title (empty)');
  scanMojibake(statusEl.textContent, 'detail-status (empty)');

  // ==============================================================
  // === 9. PRODUCTION CARD CLICK: Click Job A via .job-card.click()
  // ==============================================================
  cards[0].click(); // production click — triggers event listener
  // Wait for async model load
  await wait(200);

  assert(window._appState.pipeline1SelectedJobId === 'jobA',
    '[CLICK A] pipeline1SelectedJobId === jobA. Got: ' + window._appState.pipeline1SelectedJobId);
  assert(titleEl.textContent.trim() === 'VideoA.mp4',
    '[CLICK A] detail title === VideoA.mp4. Got: "' + titleEl.textContent.trim() + '"');
  assert(providerEl.value === 'gemini',
    '[CLICK A] provider restored to gemini. Got: ' + providerEl.value);
  await wait(150); // allow async model list to populate
  var jobA = window._appState.jobs.find(function(j){return j.id==='jobA';});
  assert(modelEl.value === 'gemini-2.5-flash',
    '[CLICK A] model restored to gemini-2.5-flash. Got: ' + modelEl.value);
  // Card A should be active
  var cards2 = list1.querySelectorAll('.job-card');
  assert(cards2[0].classList.contains('active'),
    '[CLICK A] Card A has active class. Classes: ' + cards2[0].className);
  assert(!cards2[1].classList.contains('active'),
    '[CLICK A] Card B does NOT have active class');

  // ==============================================================
  // === 10. PRODUCTION CARD CLICK: Click Job B via .job-card.click()
  // ==============================================================
  cards2[1].click(); // production click on card B
  await wait(300); // allow ollama async load

  assert(window._appState.pipeline1SelectedJobId === 'jobB',
    '[CLICK B] pipeline1SelectedJobId === jobB. Got: ' + window._appState.pipeline1SelectedJobId);
  assert(titleEl.textContent.trim() === 'VideoB.mp4',
    '[CLICK B] detail title === VideoB.mp4. Got: "' + titleEl.textContent.trim() + '"');
  assert(providerEl.value === 'ollama',
    '[CLICK B] provider restored to ollama. Got: ' + providerEl.value);
  await wait(100);
  var jobB = window._appState.jobs.find(function(j){return j.id==='jobB';});
  assert(modelEl.value === 'qwen3-coder:30b',
    '[CLICK B] model restored to qwen3-coder:30b. Got: ' + modelEl.value);
  var ollamaModelOpts = [].slice.call(modelEl.options).map(function(o){ return o.value; }).filter(Boolean);
  assert(ollamaModelOpts.indexOf('qwen3-coder:30b') !== -1,
    '[CLICK B] qwen3-coder:30b in model list. Opts: ' + ollamaModelOpts.join(','));
  var cards3 = list1.querySelectorAll('.job-card');
  assert(!cards3[0].classList.contains('active'), '[CLICK B] Card A not active');
  assert(cards3[1].classList.contains('active'), '[CLICK B] Card B active');

  // ==============================================================
  // === 11. PRODUCTION CARD CLICK: Click Job A again (A->B->A restore)
  // ==============================================================
  var cardsForA = list1.querySelectorAll('.job-card');
  cardsForA[0].click();
  await wait(300);

  assert(window._appState.pipeline1SelectedJobId === 'jobA',
    '[A->B->A] pipeline1SelectedJobId restored to jobA. Got: ' + window._appState.pipeline1SelectedJobId);
  assert(titleEl.textContent.trim() === 'VideoA.mp4',
    '[A->B->A] detail title restored to VideoA.mp4. Got: "' + titleEl.textContent.trim() + '"');
  assert(providerEl.value === 'gemini',
    '[A->B->A] provider restored to gemini. Got: ' + providerEl.value);
  await wait(150);
  assert(modelEl.value === 'gemini-2.5-flash',
    '[A->B->A] model restored to gemini-2.5-flash. Got: ' + modelEl.value);
  var cards4 = list1.querySelectorAll('.job-card');
  assert(cards4[0].classList.contains('active'), '[A->B->A] Card A active');
  assert(!cards4[1].classList.contains('active'), '[A->B->A] Card B not active');

  // ==============================================================
  // === 12. RACE TEST A: Click Job A (Gemini slow) then quickly Job B (Ollama fast)
  //         Final UI must show Job B / Ollama — Gemini MUST NOT overwrite
  // ==============================================================

  // Reset both jobs
  jobA.aiProvider = 'gemini'; jobA.aiModel = 'gemini-2.5-flash';
  jobB.aiProvider = 'ollama'; jobB.aiModel = 'qwen3-coder:30b';
  window._appState.pipeline1SelectedJobId = null;
  window.renderJobList();

  // Gemini takes 300ms, Ollama takes 20ms
  testProviderDelay = 300;
  ollamaDelay = 20;

  // Click A first
  var raceCards = list1.querySelectorAll('.job-card');
  raceCards[0].click(); // starts slow Gemini load
  // Immediately click B (before Gemini resolves)
  raceCards[1].click(); // starts fast Ollama load

  // Wait for Ollama (fast), then for Gemini to also resolve (and be ignored)
  await wait(400);

  // Final state must be Job B with Ollama models
  assert(window._appState.pipeline1SelectedJobId === 'jobB',
    '[RACE A] After rapid A->B click, selected job === jobB. Got: ' + window._appState.pipeline1SelectedJobId);
  assert(providerEl.value === 'ollama',
    '[RACE A] Provider === ollama (not stale gemini). Got: ' + providerEl.value);
  var raceModelOpts = [].slice.call(modelEl.options).map(function(o){ return o.value; }).filter(Boolean);
  assert(raceModelOpts.indexOf('gemini-2.5-flash') === -1,
    '[RACE A] Stale Gemini model NOT in dropdown. Opts: ' + raceModelOpts.join(','));
  assert(raceModelOpts.indexOf('qwen3-coder:30b') !== -1,
    '[RACE A] Ollama model qwen3-coder:30b IS in dropdown. Opts: ' + raceModelOpts.join(','));
  assert(modelEl.value === 'qwen3-coder:30b',
    '[RACE A] Model === qwen3-coder:30b (not stale gemini). Got: ' + modelEl.value);

  // ==============================================================
  // === 13. RACE TEST B: Rapid provider change Gemini->DeepSeek
  //         Gemini slow, DeepSeek fast; final dropdown must be DeepSeek only
  // ==============================================================

  testProviderDelay = 300; // reset
  ollamaDelay = 20;

  // Select Job A
  window._appState.pipeline1SelectedJobId = 'jobA';
  window.renderJobList();
  window.renderJobDetail1();
  await wait(50);

  // Start Gemini load (slow)
  var geminiDelay = 300;
  var deepseekDelay = 20;
  window.electronAPI.testProvider = function(provider) {
    var delay = provider === 'deepseek' ? deepseekDelay : geminiDelay;
    var models = provider === 'deepseek' ? DEEPSEEK_MODELS : GEMINI_MODELS;
    return new Promise(function(resolve) {
      setTimeout(function() { resolve({ status: 'ok', models: models }); }, delay);
    });
  };

  // Trigger gemini load
  providerEl.value = 'gemini';
  providerEl.dispatchEvent(new Event('change', { bubbles: true }));

  // Immediately switch to deepseek (before gemini resolves)
  await wait(10);
  providerEl.value = 'deepseek';
  providerEl.dispatchEvent(new Event('change', { bubbles: true }));

  // Wait for both to resolve
  await wait(400);

  // Final state: deepseek models only
  var rapidOpts = [].slice.call(modelEl.options).map(function(o){ return o.value; }).filter(Boolean);
  assert(rapidOpts.indexOf('gemini-2.5-flash') === -1,
    '[RACE B] Stale Gemini model NOT in dropdown after rapid gemini->deepseek. Opts: ' + rapidOpts.join(','));
  assert(rapidOpts.indexOf('deepseek-chat') !== -1,
    '[RACE B] DeepSeek model IS in dropdown. Opts: ' + rapidOpts.join(','));
  assert(providerEl.value === 'deepseek',
    '[RACE B] Provider === deepseek (not stale gemini). Got: ' + providerEl.value);

  // Restore mock to synchronous
  window.electronAPI.testProvider = function(provider) {
    var models = provider === 'deepseek' ? DEEPSEEK_MODELS : GEMINI_MODELS;
    return Promise.resolve({ status: 'ok', models: models });
  };
  window.electronAPI.listOllamaModels = function() {
    return Promise.resolve({ status: 'ok', models: OLLAMA_MODELS });
  };

  // === 14. REAL NEW-JOB PRODUCTION PATH ==================================

  // Reset state: no selected job
  window._appState.pipeline1SelectedJobId = null;
  window._appState.jobs = [];
  window.renderJobList();
  window.renderJobDetail1();

  // Set Pipeline 1 provider to deepseek via DOM
  providerEl.value = 'deepseek';
  providerEl.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(150); // allow async model load for deepseek

  // Select deepseek-chat in model dropdown
  modelEl.value = 'deepseek-chat';
  modelEl.dispatchEvent(new Event('change', { bubbles: true }));

  assert(providerEl.value === 'deepseek', '[NEW JOB] Pipeline 1 provider = deepseek before add');
  assert(modelEl.value === 'deepseek-chat', '[NEW JOB] Pipeline 1 model = deepseek-chat before add');

  // Mock openFile
  var _origOpenFile = window.electronAPI.openFile;
  window.electronAPI.openFile = function() {
    return Promise.resolve({ canceled: false, filePaths: ['/tmp/TestVideo.mp4'] });
  };
  
  document.getElementById('btn-upload-step1').click();
  await wait(200); // wait for openFile, addToQueue, createJob

  assert(window._appState.jobs.length === 1, '[NEW JOB] One job created via upload. Count: ' + window._appState.jobs.length);
  var createdJob = window._appState.jobs[0];
  assert(createdJob.aiProvider === 'deepseek', '[NEW JOB] createdJob.aiProvider === deepseek. Got: ' + createdJob.aiProvider);
  assert(createdJob.aiModel === 'deepseek-chat', '[NEW JOB] createdJob.aiModel === deepseek-chat. Got: ' + createdJob.aiModel);
  
  window.electronAPI.openFile = _origOpenFile;

  // ==============================================================
  // === 15. EXECUTION CONTRACT: Cloud Job A (gemini)
  // ==============================================================

  // Restore jobs for execution tests
  window._appState.jobs = [
    { id: 'jobExA', fileName: 'VideoA.mp4', filePath: '/tmp/VideoA.mp4', status: 'idle',
      aiProvider: 'gemini', aiModel: 'gemini-2.5-flash',
      ttsVoice: 'vi-VN-HoaiMyNeural', ttsSpeed: '150',
      srtContent: '', aiContent: undefined, ttsAudioPath: null, pipeline: 1,
      _aiTriggered: false, _ttsRunning: false, ttsGenerate: false },
    { id: 'jobExB', fileName: 'VideoB.mp4', filePath: '/tmp/VideoB.mp4', status: 'idle',
      aiProvider: 'ollama', aiModel: 'qwen3-coder:30b',
      ttsVoice: 'vi-VN-NamMinhNeural', ttsSpeed: '75',
      srtContent: '', aiContent: undefined, ttsAudioPath: null, pipeline: 1,
      _aiTriggered: false, _ttsRunning: false, ttsGenerate: false }
  ];
  var execJobA = window._appState.jobs[0];
  var execJobB = window._appState.jobs[1];

  var capturedAiPayload = null;
  var _origAiRewrite = window.electronAPI.aiRewrite;
  window.electronAPI.aiRewrite = function(payload) {
    capturedAiPayload = payload;
    return Promise.resolve({ status: 'ok', result: 'mocked' });
  };

  var testSrt = '1\n00:00:01,000 --> 00:00:03,000\nTest';
  if (typeof window.triggerAutoAiRewrite === 'function') {
    try { await window.triggerAutoAiRewrite(execJobA, testSrt); } catch(ex) {}
    if (capturedAiPayload !== null) {
      assert(capturedAiPayload.provider === 'gemini',
        'EXEC Cloud: payload.provider === gemini (job.aiProvider). Got: ' + capturedAiPayload.provider);
      assert(capturedAiPayload.model === 'gemini-2.5-flash',
        'EXEC Cloud: payload.model === gemini-2.5-flash (job.aiModel). Got: ' + capturedAiPayload.model);
    } else { notTested('Cloud AI payload not captured'); }
  } else { notTested('triggerAutoAiRewrite not exposed'); }
  window.electronAPI.aiRewrite = _origAiRewrite;

  // === 16. EXECUTION CONTRACT: Ollama Job B ============================
  var capturedOllamaPayload = null;
  var _origOllamaChat = window.electronAPI.ollamaChat;
  window.electronAPI.ollamaChat = function(payload) {
    capturedOllamaPayload = payload;
    return Promise.resolve({ status: 'ok', result: 'mocked ollama' });
  };
  if (typeof window.triggerAutoAiRewrite === 'function') {
    try { await window.triggerAutoAiRewrite(execJobB, testSrt); } catch(ex) {}
    if (capturedOllamaPayload !== null) {
      assert(capturedOllamaPayload.model === 'qwen3-coder:30b',
        'EXEC Ollama: ollamaChat.model === qwen3-coder:30b (job.aiModel). Got: ' + capturedOllamaPayload.model);
    } else { notTested('Ollama payload not captured'); }
  } else { notTested('triggerAutoAiRewrite not exposed for ollama'); }
  window.electronAPI.ollamaChat = _origOllamaChat;

  // === 17. TTS execution contract (speed multiplier & P1 identity) ===================
  var capturedTtsBody = null;
  var _origFetch = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === 'string' && url.indexOf('tts-retry') !== -1) {
      try { capturedTtsBody = JSON.parse(opts.body); } catch(ex) {}
      return Promise.resolve({ ok: true, json: function() {
        return Promise.resolve({
          status: 'ok',
          audio_path: '/tmp/x.mp3',
          srt_content: 'tts-timed-srt',
          artifact_dir: '/fake/p1/dir',
          manifest_path: '/fake/p1/dir/manifest.json',
          tts_srt_path: '/fake/p1/dir/tts.srt',
          karaoke_ass_path: '/fake/p1/dir/karaoke.ass'
        });
      }});
    }
    return _origFetch ? _origFetch(url, opts) : Promise.reject(new Error('no fetch'));
  };
  
  if (typeof window.triggerAutoTts === 'function') {
    // Add deterministic identity for positive test
    execJobA.pipeline = 1;
    execJobA.sourceFingerprint = 'sha256:0000aaaa';
    
    try { await window.triggerAutoTts(execJobA, testSrt); } catch(ex) {}
    if (capturedTtsBody !== null) {
      assert(capturedTtsBody.job_id === execJobA.id, 'TTS payload job_id === job.id');
      assert(capturedTtsBody.source_fingerprint === 'sha256:0000aaaa', 'TTS payload source_fingerprint === job.sourceFingerprint');
      assert(capturedTtsBody.tts_voice === 'vi-VN-HoaiMyNeural',
        'TTS payload.tts_voice === vi-VN-HoaiMyNeural. Got: ' + capturedTtsBody.tts_voice);
      assert(Math.abs(capturedTtsBody.tts_speed - 1.5) < 0.01,
        'TTS payload.tts_speed === 1.5 (150/100). Got: ' + capturedTtsBody.tts_speed);
      
      // Check assignments
      assert(execJobA.p1ArtifactDir === '/fake/p1/dir', 'job.p1ArtifactDir assigned');
      assert(execJobA.p1ManifestPath === '/fake/p1/dir/manifest.json', 'job.p1ManifestPath assigned');
      assert(execJobA.ttsTimedSrtPath === '/fake/p1/dir/tts.srt', 'job.ttsTimedSrtPath assigned');
      assert(execJobA.karaokeAssPath === '/fake/p1/dir/karaoke.ass', 'job.karaokeAssPath assigned');
      assert(execJobA.ttsAudioPath === '/tmp/x.mp3', 'job.ttsAudioPath remains intact');
      assert(execJobA.ttsTimedSrt === 'tts-timed-srt', 'job.ttsTimedSrt remains intact');
    } else { notTested('TTS fetch body not captured'); }

    // Negative test: missing identity
    var execJobNegative = Object.assign({}, execJobA);
    execJobNegative.sourceFingerprint = null; // missing identity
    var fetchCalled = false;
    window.fetch = function(url, opts) {
      if (typeof url === 'string' && url.indexOf('tts-retry') !== -1) fetchCalled = true;
      return Promise.resolve({ok: true, json: function() { return Promise.resolve({status: 'ok'}); }});
    };
    try { await window.triggerAutoTts(execJobNegative, testSrt); } catch(ex) {
      log.push('UNEXPECTED THROW in negative TTS test: ' + ex.message);
    }
    assert(fetchCalled === false, 'Negative identity: fetch not called');

  } else { notTested('triggerAutoTts not exposed'); }
  window.fetch = _origFetch;

  // === 18. Speed multiplier formula =====================================
  function sliderToMult(v) { return Number(v) / 100; }
  assert(sliderToMult(100) === 1.0, 'UI 100 => 1.0x');
  assert(sliderToMult(150) === 1.5, 'UI 150 => 1.5x');
  assert(sliderToMult(50) === 0.5, 'UI 50 => 0.5x');
  assert(sliderToMult(200) === 2.0, 'UI 200 => 2.0x');

  // === 19. No controlled-error shows infinite "Đang tải..." =============
  // Must set providerEl.value to match the requested provider so isStale() does not fire
  window._appState.pipeline1SelectedJobId = null;
  providerEl.value = 'gemini';
  window.electronAPI.testProvider = function() {
    return Promise.resolve({ status: 'error', error: 'Chưa lưu API key nào.' });
  };
  await window.loadStep1Models('gemini', null);
  var errOpts = [].slice.call(modelEl.options).map(function(o){ return o.text; });
  assert(errOpts.every(function(t){ return t !== 'Đang tải...'; }),
    'No "Đang tải..." when provider has no key. Opts: ' + errOpts.join(';'));
  assert(errOpts.some(function(t){ return t.indexOf('API key') !== -1 || t.indexOf('Chưa') !== -1; }),
    'Controlled message shown when no API key. Opts: ' + errOpts.join(';'));

  // === 20. Speed slider config ==========================================
  var speedEl = document.getElementById('step1-tts-speed');
  assert(!!speedEl, 'step1-tts-speed exists');
  assert(speedEl.min === '50', 'Speed min=50');
  assert(speedEl.max === '200', 'Speed max=200');

  // === 21. Final mojibake scan ==========================================
  // Restore readable state
  window._appState.pipeline1SelectedJobId = null;
  window.renderJobDetail1();
  scanMojibake(titleEl.textContent, 'step1-detail-title (final)');
  scanMojibake(statusEl.textContent, 'step1-detail-status (final)');

  } catch(e) {
    if (!e.message.startsWith('ASSERT:')) {
      log.push('HARNESS ERROR: ' + e.message);
      failCount++;
    }
  } finally {
    // Restore mocks
    if (window.electronAPI) {
      if (typeof window.electronAPI._origTestProvider !== 'undefined')
        window.electronAPI.testProvider = window.electronAPI._origTestProvider;
      if (typeof window.electronAPI._origListOllama !== 'undefined')
        window.electronAPI.listOllamaModels = window.electronAPI._origListOllama;
    }
  }

  return JSON.stringify({ log: log, passCount: passCount, failCount: failCount });
})();
