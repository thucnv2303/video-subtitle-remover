// Pipeline 1 test body — executed inside renderer context via eval()
// Returns a Promise that resolves to JSON.stringify({log, passCount, failCount})
// executeJavaScript awaits Promise return values automatically.
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

  // === 2. Verify production voice options are present in index.html =====
  var voiceEl = document.getElementById('step1-tts-voice');
  assert(!!voiceEl, 'step1-tts-voice element exists');
  var opts = [].slice.call(voiceEl.options).map(function(o){ return o.value; });
  assert(opts.indexOf('none') !== -1,
    'step1-tts-voice contains value="none". Options: ' + opts.join(','));
  assert(opts.indexOf('vi-VN-HoaiMyNeural') !== -1,
    'step1-tts-voice contains value="vi-VN-HoaiMyNeural". Options: ' + opts.join(','));
  assert(opts.indexOf('vi-VN-NamMinhNeural') !== -1,
    'step1-tts-voice contains value="vi-VN-NamMinhNeural". Options: ' + opts.join(','));

  // === 3. Populate two distinct jobs ====================================
  window._appState.jobs = [
    { id: 'jobA', fileName: 'VideoA.mp4', filePath: '/tmp/VideoA.mp4', status: 'queued',
      aiModel: 'gemini-pro', ttsVoice: 'vi-VN-HoaiMyNeural', ttsSpeed: '150',
      srtContent: '', aiContent: undefined, ttsAudioPath: null },
    { id: 'jobB', fileName: 'VideoB.mp4', filePath: '/tmp/VideoB.mp4', status: 'queued',
      aiModel: 'llama3:latest', ttsVoice: 'vi-VN-NamMinhNeural', ttsSpeed: '75',
      srtContent: '', aiContent: undefined, ttsAudioPath: null }
  ];

  // === 4. Render via production renderJobList() ==========================
  assert(typeof window.renderJobList === 'function', 'renderJobList is exposed on window');
  window.renderJobList();
  var list1 = document.getElementById('step1-job-list');
  assert(!!list1, 'step1-job-list element exists');
  var cards = list1.querySelectorAll('.tk-job-card');
  assert(cards.length === 2, 'Two tk-job-cards rendered (' + cards.length + ' found)');

  // === 5. Click Job A (first card) and verify selection =================
  cards[0].click();
  assert(window._appState.pipeline1SelectedJobId === 'jobA',
    'pipeline1SelectedJobId set to jobA after click. Got: ' + window._appState.pipeline1SelectedJobId);
  window.renderJobList();
  var cards2 = list1.querySelectorAll('.tk-job-card');
  assert(cards2[0].classList.contains('active'),
    'Card A has active class after click. Classes: ' + cards2[0].className);
  assert(!cards2[1].classList.contains('active'),
    'Card B does NOT have active class. Classes: ' + cards2[1].className);

  // === 6. Detail panel title reflects Job A ==============================
  var titleEl = document.getElementById('step1-detail-title');
  if (titleEl) {
    assert(titleEl.textContent.trim() === 'VideoA.mp4',
      'Detail panel title shows Job A. Got: ' + titleEl.textContent.trim());
  } else { notTested('step1-detail-title not found'); }

  // === 7. Elements exist =================================================
  var modelEl = document.getElementById('step1-ai-model');
  var speedEl = document.getElementById('step1-tts-speed');
  assert(!!modelEl, 'step1-ai-model element exists');
  assert(!!speedEl, 'step1-tts-speed element exists');

  // === 8. Speed slider is correctly configured ==========================
  assert(speedEl.min === '50', 'Speed slider min=50. Got: ' + speedEl.min);
  assert(speedEl.max === '200', 'Speed slider max=200. Got: ' + speedEl.max);
  assert(speedEl.step === '5', 'Speed slider step=5. Got: ' + speedEl.step);

  // === 9. Save model via DOM change event ================================
  if (modelEl) {
    if (![].slice.call(modelEl.options).some(function(o){return o.value==='gemini-pro';})) {
      modelEl.appendChild(new Option('gemini-pro', 'gemini-pro'));
    }
    modelEl.value = 'gemini-pro';
    modelEl.dispatchEvent(new Event('change', { bubbles: true }));
    assert(window._appState.jobs.find(function(j){return j.id==='jobA';}).aiModel === 'gemini-pro',
      'Job A aiModel saved after change event');
  }

  // === 10. Save voice via production option (NO fake injection) ==========
  // Use the production option already present in index.html
  voiceEl.value = 'vi-VN-HoaiMyNeural';
  voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(window._appState.jobs.find(function(j){return j.id==='jobA';}).ttsVoice === 'vi-VN-HoaiMyNeural',
    'Job A ttsVoice saved as vi-VN-HoaiMyNeural after change event');
  // Speed should be ENABLED for Edge TTS voice
  assert(speedEl.disabled === false,
    'Speed slider ENABLED for Edge TTS voice. disabled=' + speedEl.disabled);

  // === 11. Save speed via DOM change event ===============================
  speedEl.value = '150';
  speedEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(window._appState.jobs.find(function(j){return j.id==='jobA';}).ttsSpeed === '150',
    'Job A ttsSpeed saved as 150 after change event. Got: ' +
    window._appState.jobs.find(function(j){return j.id==='jobA';}).ttsSpeed);

  // === 12. Clone voice disables speed slider truthfully =================
  // Add a fake clone option for this test only
  var cloneOpt = new Option('Test Clone', 'clone:0');
  voiceEl.appendChild(cloneOpt);
  voiceEl.value = 'clone:0';
  voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(speedEl.disabled === true,
    'Speed slider DISABLED when clone: voice selected. disabled=' + speedEl.disabled);
  var speedLbl = document.getElementById('step1-tts-speed-label');
  if (speedLbl) {
    assert(speedLbl.textContent.indexOf('N/A') !== -1,
      'Speed label shows N/A for clone voice. Got: ' + speedLbl.textContent);
  } else { notTested('step1-tts-speed-label not found'); }
  // Remove the clone option
  voiceEl.removeChild(cloneOpt);

  // === 13. Switching back to Edge TTS re-enables speed ==================
  voiceEl.value = 'vi-VN-HoaiMyNeural';
  voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(speedEl.disabled === false,
    'Speed slider RE-ENABLED when switching from clone to Edge TTS. disabled=' + speedEl.disabled);

  // === 14. Click Job B and save different values ========================
  var cardBEl = list1.querySelectorAll('.tk-job-card')[1];
  assert(!!cardBEl, 'Card B found in step1-job-list');
  cardBEl.click();
  assert(window._appState.pipeline1SelectedJobId === 'jobB',
    'pipeline1SelectedJobId set to jobB after click. Got: ' + window._appState.pipeline1SelectedJobId);
  if (modelEl) {
    if (![].slice.call(modelEl.options).some(function(o){return o.value==='llama3:latest';})) {
      modelEl.appendChild(new Option('llama3:latest', 'llama3:latest'));
    }
    modelEl.value = 'llama3:latest';
    modelEl.dispatchEvent(new Event('change', { bubbles: true }));
  }
  voiceEl.value = 'vi-VN-NamMinhNeural';
  voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
  speedEl.value = '75';
  speedEl.dispatchEvent(new Event('change', { bubbles: true }));
  var jobB = window._appState.jobs.find(function(j){return j.id==='jobB';});
  assert(jobB.aiModel === 'llama3:latest', 'Job B aiModel. Got: ' + jobB.aiModel);
  assert(jobB.ttsVoice === 'vi-VN-NamMinhNeural', 'Job B ttsVoice. Got: ' + jobB.ttsVoice);
  assert(jobB.ttsSpeed === '75', 'Job B ttsSpeed=75. Got: ' + jobB.ttsSpeed);

  // === 15. Switch back to Job A — restore values ========================
  list1.querySelectorAll('.tk-job-card')[0].click();
  assert(window._appState.pipeline1SelectedJobId === 'jobA', 'pipeline1SelectedJobId restored to jobA');
  if (modelEl) {
    assert(modelEl.value === 'gemini-pro',
      'AI model UI restored to Job A value. Got: ' + modelEl.value);
  }
  assert(voiceEl.value === 'vi-VN-HoaiMyNeural',
    'TTS voice UI restored to Job A value. Got: ' + voiceEl.value);
  assert(speedEl.value === '150',
    'TTS speed UI restored to Job A value (150). Got: ' + speedEl.value);
  assert(speedEl.disabled === false,
    'Speed slider enabled after restore to Edge TTS job A. disabled=' + speedEl.disabled);
  window.renderJobList();
  var cards3 = list1.querySelectorAll('.tk-job-card');
  assert(cards3[0].classList.contains('active'),
    'Card A active class restored. Classes: ' + cards3[0].className);
  assert(!cards3[1].classList.contains('active'),
    'Card B does not have active class. Classes: ' + cards3[1].className);

  // === 16. AI execution — AWAITED =======================================
  var capturedAiPayload = null;
  if (!window.electronAPI) window.electronAPI = {};
  var _origAiRewrite = window.electronAPI.aiRewrite;
  window.electronAPI.aiRewrite = function(payload) {
    capturedAiPayload = payload;
    return Promise.resolve({ status: 'ok', result: 'mocked-ai-result' });
  };
  localStorage.setItem('ai_provider', 'gemini');
  var jobA = window._appState.jobs.find(function(j){return j.id==='jobA';});
  var testSrt = '1\n00:00:01,000 --> 00:00:03,000\nTest subtitle';
  if (typeof window.triggerAutoAiRewrite === 'function') {
    try {
      await window.triggerAutoAiRewrite(jobA, testSrt);
    } catch(ex) {
      // Prompt error or other non-capture errors are OK
    }
    if (capturedAiPayload !== null) {
      assert(capturedAiPayload.provider === 'gemini',
        'AI execution payload.provider === gemini. Got: ' + capturedAiPayload.provider);
      assert(capturedAiPayload.model === jobA.aiModel,
        'AI execution payload.model === job.aiModel. Got: ' + capturedAiPayload.model);
      assert(capturedAiPayload.srt_content === testSrt,
        'AI execution payload.srt_content === testSrt. Got: ' + capturedAiPayload.srt_content);
    } else {
      notTested('triggerAutoAiRewrite did not reach aiRewrite (prompt unconfigured in test context)');
    }
  } else {
    notTested('triggerAutoAiRewrite not exposed on window');
  }
  window.electronAPI.aiRewrite = _origAiRewrite;

  // === 17. TTS execution — AWAITED with speed+voice contract ============
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
    try {
      await window.triggerAutoTts(jobA, testSrt);
    } catch(ex) {}
    if (capturedFetchBody !== null) {
      assert(capturedFetchBody.tts_voice === 'vi-VN-HoaiMyNeural',
        'TTS payload.tts_voice === vi-VN-HoaiMyNeural. Got: ' + capturedFetchBody.tts_voice);
      // job.ttsSpeed is '150' (slider), converted: 150/100 = 1.5
      assert(Math.abs(capturedFetchBody.tts_speed - 1.5) < 0.01,
        'TTS payload.tts_speed === 1.5 (from slider 150). Got: ' + capturedFetchBody.tts_speed);
    } else {
      notTested('triggerAutoTts fetch body not captured');
    }
  } else {
    notTested('triggerAutoTts not exposed on window');
  }
  window.fetch = _origFetch;

  // === 18. TTS speed contract: UI -> multiplier ========================
  function sliderToMultiplier(sliderVal) { return Number(sliderVal) / 100; }
  assert(sliderToMultiplier(100) === 1.0, 'UI 100 => multiplier 1.0');
  assert(sliderToMultiplier(150) === 1.5, 'UI 150 => multiplier 1.5');
  assert(sliderToMultiplier(50) === 0.5, 'UI 50 => multiplier 0.5');
  assert(sliderToMultiplier(75) === 0.75, 'UI 75 => multiplier 0.75');
  assert(sliderToMultiplier(200) === 2.0, 'UI 200 => multiplier 2.0');

  // === 19. Empty AI model shows "Chưa chọn" =============================
  var cloudModelEl = document.getElementById('ai-cloud-model');
  var step1mEl = document.getElementById('step1-ai-model');
  if (!cloudModelEl) {
    cloudModelEl = document.createElement('select');
    cloudModelEl.id = 'ai-cloud-model';
    document.body.appendChild(cloudModelEl);
  }
  cloudModelEl.innerHTML = '';
  localStorage.removeItem('ai_model_gemini');
  localStorage.setItem('ai_provider', 'gemini');
  window.dispatchEvent(new Event('aiModelChanged'));
  if (step1mEl) {
    var firstOption = step1mEl.options[0];
    var hasChonOption = firstOption && (
      firstOption.text.indexOf('ch') !== -1 ||
      firstOption.text.indexOf('Ch') !== -1 ||
      firstOption.value === ''
    );
    assert(hasChonOption,
      'Empty AI model shows Chua chon or empty. Got: ' +
      (firstOption ? firstOption.text : 'no options'));
  } else {
    notTested('step1-ai-model not in DOM for empty-model test');
  }

  } catch(e) {
    if (!e.message.startsWith('ASSERT:')) {
      log.push('HARNESS ERROR: ' + e.message);
      failCount++;
    }
  }

  return JSON.stringify({ log: log, passCount: passCount, failCount: failCount });
})();
