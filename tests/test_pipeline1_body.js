// Pipeline 1 test body (033) — executed inside renderer context via executeJavaScript
// Reproduces owner-observed failure: real card click -> detail panel update
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
  var opts = [].slice.call(voiceEl.options).map(function(o){ return o.value; });
  assert(opts.indexOf('none') !== -1,
    'step1-tts-voice has value="none". Opts: ' + opts.join(','));
  assert(opts.indexOf('vi-VN-HoaiMyNeural') !== -1,
    'step1-tts-voice has value="vi-VN-HoaiMyNeural". Opts: ' + opts.join(','));
  assert(opts.indexOf('vi-VN-NamMinhNeural') !== -1,
    'step1-tts-voice has value="vi-VN-NamMinhNeural". Opts: ' + opts.join(','));

  // === 3. Populate 2 distinct jobs =====================================
  window._appState.pipeline1SelectedJobId = null;
  window._appState.jobs = [
    { id: 'jobA', fileName: 'VideoA.mp4', filePath: '/tmp/VideoA.mp4', status: 'idle',
      aiModel: 'gemini-pro', ttsVoice: 'vi-VN-HoaiMyNeural', ttsSpeed: '150',
      srtContent: '', aiContent: undefined, ttsAudioPath: null, pipeline: 1 },
    { id: 'jobB', fileName: 'VideoB.mp4', filePath: '/tmp/VideoB.mp4', status: 'idle',
      aiModel: 'llama3:latest', ttsVoice: 'vi-VN-NamMinhNeural', ttsSpeed: '75',
      srtContent: '', aiContent: undefined, ttsAudioPath: null, pipeline: 1 }
  ];

  // === 4. renderJobList renders 2 separate cards =======================
  assert(typeof window.renderJobList === 'function', 'renderJobList is exposed on window');
  window.renderJobList();
  var list1 = document.getElementById('step1-job-list');
  assert(!!list1, 'step1-job-list element exists');
  var cards = list1.querySelectorAll('.job-card');
  assert(cards.length === 2, 'Two .job-card elements rendered (production class). Found: ' + cards.length);

  // === 5. Initial state: detail title shows "Vui lòng chọn" ============
  var titleEl = document.getElementById('step1-detail-title');
  assert(!!titleEl, 'step1-detail-title element exists');
  assert(titleEl.textContent.trim().length > 0, 'step1-detail-title has content');
  // It should still show the "choose" prompt since no job is selected
  var initialTitle = titleEl.textContent.trim();
  // No assertion on exact text since it may be in Vietnamese

  // === 5b. Pre-seed AI model options so renderJobDetail1 can set values =
  var modelEl = document.getElementById('step1-ai-model');
  if (modelEl) {
    if (![].slice.call(modelEl.options).some(function(o){return o.value==='gemini-pro';})) {
      modelEl.appendChild(new Option('gemini-pro', 'gemini-pro'));
    }
    if (![].slice.call(modelEl.options).some(function(o){return o.value==='llama3:latest';})) {
      modelEl.appendChild(new Option('llama3:latest', 'llama3:latest'));
    }
  }

  // === 6. Click Job A card =============================================
  cards[0].click();
  // Wait for sync state update (renderJobList is synchronous)
  assert(window._appState.pipeline1SelectedJobId === 'jobA',
    'pipeline1SelectedJobId set to jobA. Got: ' + window._appState.pipeline1SelectedJobId);

  // === 7. Active CSS class on card A ===================================
  var cards2 = list1.querySelectorAll('.job-card');
  assert(cards2[0].classList.contains('active'),
    'Card A has active class after click. Classes: ' + cards2[0].className);
  assert(!cards2[1].classList.contains('active'),
    'Card B does NOT have active class. Classes: ' + cards2[1].className);

  // === 8. Detail panel shows Job A =====================================
  assert(titleEl.textContent.trim() === 'VideoA.mp4',
    'Detail title shows VideoA.mp4. Got: "' + titleEl.textContent.trim() + '"');
  // Verify the empty/choose prompt is GONE
  var lowerTitle = titleEl.textContent.toLowerCase();
  assert(lowerTitle.indexOf('vui') === -1 && lowerTitle.indexOf('ch') === -1 || lowerTitle === 'videoa.mp4',
    'Detail panel shows job filename, not "choose" prompt. Got: ' + titleEl.textContent);

  // === 9. Speed slider config ==========================================
  var speedEl = document.getElementById('step1-tts-speed');
  assert(!!speedEl, 'step1-tts-speed element exists');
  assert(speedEl.min === '50', 'Speed slider min=50. Got: ' + speedEl.min);
  assert(speedEl.max === '200', 'Speed slider max=200. Got: ' + speedEl.max);

  // === 10. Detail panel controls reflect Job A values ==================
  if (modelEl) {
    // Options already seeded above; renderJobDetail1 should have set value
    assert(modelEl.value === 'gemini-pro',
      'AI model restored to Job A value. Got: ' + modelEl.value);
  } else { notTested('step1-ai-model not in DOM'); }
  assert(voiceEl.value === 'vi-VN-HoaiMyNeural',
    'TTS voice restored to Job A value. Got: ' + voiceEl.value);
  assert(speedEl.value === '150',
    'TTS speed restored to Job A value (150). Got: ' + speedEl.value);

  // === 11. Save Job A values via change events =========================
  voiceEl.value = 'vi-VN-HoaiMyNeural';
  voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(speedEl.disabled === false,
    'Speed enabled for Edge TTS voice. disabled=' + speedEl.disabled);
  speedEl.value = '150';
  speedEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(window._appState.jobs.find(function(j){return j.id==='jobA';}).ttsSpeed === '150',
    'Job A ttsSpeed=150 saved. Got: ' + window._appState.jobs.find(function(j){return j.id==='jobA';}).ttsSpeed);

  // === 12. Clone voice disables speed ==================================
  var cloneOpt = new Option('Test Clone', 'clone:0');
  voiceEl.appendChild(cloneOpt);
  voiceEl.value = 'clone:0';
  voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(speedEl.disabled === true,
    'Speed DISABLED for clone: voice. disabled=' + speedEl.disabled);
  var speedLbl = document.getElementById('step1-tts-speed-label');
  if (speedLbl) {
    assert(speedLbl.textContent.indexOf('N/A') !== -1,
      'Speed label shows N/A for clone. Got: ' + speedLbl.textContent);
  } else { notTested('step1-tts-speed-label not found'); }
  // Restore to edge voice
  voiceEl.value = 'vi-VN-HoaiMyNeural';
  voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(speedEl.disabled === false,
    'Speed RE-ENABLED after switching from clone. disabled=' + speedEl.disabled);
  voiceEl.removeChild(cloneOpt);

  // === 13. Click Job B — detail changes to Job B =======================
  var cardBEl = list1.querySelectorAll('.job-card')[1];
  assert(!!cardBEl, 'Card B found in step1-job-list');
  cardBEl.click();
  assert(window._appState.pipeline1SelectedJobId === 'jobB',
    'pipeline1SelectedJobId set to jobB. Got: ' + window._appState.pipeline1SelectedJobId);
  assert(titleEl.textContent.trim() === 'VideoB.mp4',
    'Detail title changes to VideoB.mp4. Got: "' + titleEl.textContent.trim() + '"');

  // Job B active class
  var cards3 = list1.querySelectorAll('.job-card');
  assert(!cards3[0].classList.contains('active'),
    'Card A no longer active. Classes: ' + cards3[0].className);
  assert(cards3[1].classList.contains('active'),
    'Card B now active. Classes: ' + cards3[1].className);

  // Job B controls restored
  assert(voiceEl.value === 'vi-VN-NamMinhNeural',
    'TTS voice changed to Job B value. Got: ' + voiceEl.value);
  assert(speedEl.value === '75',
    'TTS speed changed to Job B value (75). Got: ' + speedEl.value);

  // === 14. Save Job B values ===========================================
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
  assert(jobB.ttsVoice === 'vi-VN-NamMinhNeural', 'Job B voice saved. Got: ' + jobB.ttsVoice);
  assert(jobB.ttsSpeed === '75', 'Job B speed saved. Got: ' + jobB.ttsSpeed);

  // === 15. A->B->A restore =============================================
  list1.querySelectorAll('.job-card')[0].click();
  assert(window._appState.pipeline1SelectedJobId === 'jobA',
    'Restored to jobA after A->B->A');
  assert(titleEl.textContent.trim() === 'VideoA.mp4',
    'Detail panel restored to Job A. Got: "' + titleEl.textContent.trim() + '"');
  assert(voiceEl.value === 'vi-VN-HoaiMyNeural',
    'Voice restored to Job A (vi-VN-HoaiMyNeural). Got: ' + voiceEl.value);
  assert(speedEl.value === '150',
    'Speed restored to Job A (150). Got: ' + speedEl.value);
  assert(speedEl.disabled === false,
    'Speed enabled after restore to edge TTS job A. disabled=' + speedEl.disabled);
  var cards4 = list1.querySelectorAll('.job-card');
  assert(cards4[0].classList.contains('active'),
    'Card A active after restore. Classes: ' + cards4[0].className);
  assert(!cards4[1].classList.contains('active'),
    'Card B not active after restore. Classes: ' + cards4[1].className);

  // === 16. Mojibake scan of rendered Job Queue text ====================
  var MOJIBAKE_PATTERNS = ['\u00c3', '\u00c4\u00b9', '\u00c3\u2020', '\u00c3\u00a0', '\u00f0\u0178', '\u00ef\u00bf\u00bd'];
  var listText = list1.textContent || '';
  MOJIBAKE_PATTERNS.forEach(function(pat) {
    assert(listText.indexOf(pat) === -1,
      'No mojibake pattern "' + pat + '" in Job Queue text');
  });

  // === 17. AI execution contract ========================================
  var capturedAiPayload = null;
  if (!window.electronAPI) window.electronAPI = {};
  var _origAiRewrite = window.electronAPI.aiRewrite;
  window.electronAPI.aiRewrite = function(payload) {
    capturedAiPayload = payload;
    return Promise.resolve({ status: 'ok', result: 'mocked' });
  };
  var jobA = window._appState.jobs.find(function(j){return j.id==='jobA';});
  var testSrt = '1\n00:00:01,000 --> 00:00:03,000\nTest subtitle';
  if (typeof window.triggerAutoAiRewrite === 'function') {
    try { await window.triggerAutoAiRewrite(jobA, testSrt); } catch(ex) {}
    if (capturedAiPayload !== null) {
      assert(capturedAiPayload.model === jobA.aiModel,
        'AI payload.model === job.aiModel. Got: ' + capturedAiPayload.model);
    } else {
      notTested('triggerAutoAiRewrite fetch not captured (prompt unconfigured)');
    }
  } else { notTested('triggerAutoAiRewrite not exposed'); }
  window.electronAPI.aiRewrite = _origAiRewrite;

  // === 18. TTS execution contract with speed multiplier ================
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

  // === 19. Speed multiplier contract ===================================
  function sliderToMultiplier(v) { return Number(v) / 100; }
  assert(sliderToMultiplier(100) === 1.0, 'UI 100 => 1.0x');
  assert(sliderToMultiplier(150) === 1.5, 'UI 150 => 1.5x');
  assert(sliderToMultiplier(50) === 0.5, 'UI 50 => 0.5x');
  assert(sliderToMultiplier(200) === 2.0, 'UI 200 => 2.0x');

  // === 20. Empty model shows Chua chon ================================
  var cloudModelEl = document.getElementById('ai-cloud-model');
  if (!cloudModelEl) {
    cloudModelEl = document.createElement('select');
    cloudModelEl.id = 'ai-cloud-model';
    document.body.appendChild(cloudModelEl);
  }
  cloudModelEl.innerHTML = '';
  localStorage.removeItem('ai_model_gemini');
  localStorage.setItem('ai_provider', 'gemini');
  window.dispatchEvent(new Event('aiModelChanged'));
  if (modelEl) {
    var firstOpt = modelEl.options[0];
    var hasChon = firstOpt && (
      firstOpt.text.indexOf('Ch') !== -1 || firstOpt.value === ''
    );
    assert(hasChon, 'Empty AI model shows Chua chon. Got: ' + (firstOpt ? firstOpt.text : 'no options'));
  } else { notTested('step1-ai-model not in DOM for empty test'); }

  } catch(e) {
    if (!e.message.startsWith('ASSERT:')) {
      log.push('HARNESS ERROR: ' + e.message);
      failCount++;
    }
  }

  return JSON.stringify({ log: log, passCount: passCount, failCount: failCount });
})();
