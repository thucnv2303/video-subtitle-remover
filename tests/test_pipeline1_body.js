// Pipeline 1 test body — executed inside renderer context
// Must return JSON.stringify({log, passCount, failCount})
var log = [];
var passCount = 0;
var failCount = 0;
function assert(condition, msg) {
  if (!condition) { log.push('FAIL: ' + msg); failCount++; throw new Error(msg); }
  log.push('PASS: ' + msg); passCount++;
}
function notTested(msg) { log.push('NOT TESTED: ' + msg); }
try {

// 1. Shared state identity
assert(typeof window._appState === 'object' && window._appState !== null,
  'window._appState is a non-null object');
assert('pipeline1SelectedJobId' in window._appState,
  'pipeline1SelectedJobId field exists in state');
assert(Array.isArray(window._appState.jobs), 'state.jobs is an array');

// 2. Populate two distinct jobs
window._appState.jobs = [
  { id: 'jobA', fileName: 'VideoA.mp4', filePath: '/tmp/VideoA.mp4', status: 'queued',
    aiModel: 'gemini-pro', ttsVoice: 'vi-VN-HoaiMyNeural', ttsSpeed: '1.5',
    srtContent: '', aiContent: undefined, ttsAudioPath: null },
  { id: 'jobB', fileName: 'VideoB.mp4', filePath: '/tmp/VideoB.mp4', status: 'queued',
    aiModel: 'llama3:latest', ttsVoice: 'vi-VN-NamMinhNeural', ttsSpeed: '0.8',
    srtContent: '', aiContent: undefined, ttsAudioPath: null }
];

// 3. Render via production renderJobList()
assert(typeof window.renderJobList === 'function', 'renderJobList is exposed on window');
window.renderJobList();
var list1 = document.getElementById('step1-job-list');
assert(!!list1, 'step1-job-list element exists');
var cards = list1.querySelectorAll('.tk-job-card');
assert(cards.length === 2, 'Two tk-job-cards rendered (' + cards.length + ' found)');

// 4. Click Job A (first card) and verify selection
cards[0].click();
assert(window._appState.pipeline1SelectedJobId === 'jobA',
  'pipeline1SelectedJobId set to jobA after click. Got: ' + window._appState.pipeline1SelectedJobId);
window.renderJobList();
var cards2 = list1.querySelectorAll('.tk-job-card');
assert(cards2[0].classList.contains('active'),
  'Card A has active class after click. Classes: ' + cards2[0].className);
assert(!cards2[1].classList.contains('active'),
  'Card B does NOT have active class. Classes: ' + cards2[1].className);

// 5. Detail panel title reflects Job A
var titleEl = document.getElementById('step1-detail-title');
if (titleEl) {
  assert(titleEl.textContent.trim() === 'VideoA.mp4',
    'Detail panel title shows Job A. Got: ' + titleEl.textContent.trim());
} else { notTested('step1-detail-title not found'); }

// 6. Save model/voice/speed for Job A via DOM change events
var modelEl = document.getElementById('step1-ai-model');
var voiceEl = document.getElementById('step1-tts-voice');
var speedEl = document.getElementById('step1-tts-speed');
assert(!!modelEl, 'step1-ai-model element exists');
assert(!!voiceEl, 'step1-tts-voice element exists');
assert(!!speedEl, 'step1-tts-speed element exists');
if (modelEl) {
  // Add option before setting value — selects reject unknown values
  if (![].slice.call(modelEl.options).some(function(o){return o.value==='gemini-pro';})) {
    modelEl.appendChild(new Option('gemini-pro', 'gemini-pro'));
  }
  modelEl.value = 'gemini-pro';
  modelEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(window._appState.jobs.find(function(j){return j.id==='jobA';}).aiModel === 'gemini-pro',
    'Job A aiModel saved after change event');
}
if (voiceEl) {
  if (![].slice.call(voiceEl.options).some(function(o){return o.value==='vi-VN-HoaiMyNeural';})) {
    voiceEl.appendChild(new Option('vi-VN-HoaiMyNeural', 'vi-VN-HoaiMyNeural'));
  }
  voiceEl.value = 'vi-VN-HoaiMyNeural';
  voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(window._appState.jobs.find(function(j){return j.id==='jobA';}).ttsVoice === 'vi-VN-HoaiMyNeural',
    'Job A ttsVoice saved after change event');
}
if (speedEl) {
  // Range inputs accept any value in their range
  speedEl.value = '50';
  speedEl.dispatchEvent(new Event('change', { bubbles: true }));
  assert(window._appState.jobs.find(function(j){return j.id==='jobA';}).ttsSpeed === '50',
    'Job A ttsSpeed saved after change event. Got: ' +
    window._appState.jobs.find(function(j){return j.id==='jobA';}).ttsSpeed);
}

// 7. Click Job B (second card) and save different values
var cardBEl = list1.querySelectorAll('.tk-job-card')[1];
assert(!!cardBEl, 'Card B found in step1-job-list');
cardBEl.click();
assert(window._appState.pipeline1SelectedJobId === 'jobB',
  'pipeline1SelectedJobId set to jobB after click. Got: ' + window._appState.pipeline1SelectedJobId);
if (modelEl) {
  if (![].slice.call(modelEl.options).some(function(o){return o.value==='llama3:latest';})) {
    modelEl.appendChild(new Option('llama3:latest', 'llama3:latest'));
  }
  modelEl.value = 'llama3:latest'; modelEl.dispatchEvent(new Event('change', { bubbles: true }));
}
if (voiceEl) {
  if (![].slice.call(voiceEl.options).some(function(o){return o.value==='vi-VN-NamMinhNeural';})) {
    voiceEl.appendChild(new Option('vi-VN-NamMinhNeural', 'vi-VN-NamMinhNeural'));
  }
  voiceEl.value = 'vi-VN-NamMinhNeural'; voiceEl.dispatchEvent(new Event('change', { bubbles: true }));
}
if (speedEl) { speedEl.value = '30'; speedEl.dispatchEvent(new Event('change', { bubbles: true })); }
var jobB = window._appState.jobs.find(function(j){return j.id==='jobB';});
assert(jobB.aiModel === 'llama3:latest', 'Job B aiModel differs from A. Got: ' + jobB.aiModel);
assert(jobB.ttsVoice === 'vi-VN-NamMinhNeural', 'Job B ttsVoice differs from A. Got: ' + jobB.ttsVoice);
assert(jobB.ttsSpeed === '30', 'Job B ttsSpeed differs from A. Got: ' + jobB.ttsSpeed);

// 8. Switch back to Job A and verify restore
list1.querySelectorAll('.tk-job-card')[0].click();
assert(window._appState.pipeline1SelectedJobId === 'jobA', 'pipeline1SelectedJobId restored to jobA');
if (modelEl) {
  assert(modelEl.value === 'gemini-pro',
    'AI model UI restored to Job A value. Got: ' + modelEl.value);
}
if (voiceEl) {
  assert(voiceEl.value === 'vi-VN-HoaiMyNeural',
    'TTS voice UI restored to Job A value. Got: ' + voiceEl.value);
}
if (speedEl) {
  assert(speedEl.value === '50',
    'TTS speed UI restored to Job A value. Got: ' + speedEl.value);
}
window.renderJobList();
var cards3 = list1.querySelectorAll('.tk-job-card');
assert(cards3[0].classList.contains('active'),
  'Card A active class restored. Classes: ' + cards3[0].className);
assert(!cards3[1].classList.contains('active'),
  'Card B does not have active class. Classes: ' + cards3[1].className);

// 9. AI execution reads job.aiModel
var capturedAiPayload = null;
if (!window.electronAPI) window.electronAPI = {};
var _origAiRewrite = window.electronAPI.aiRewrite;
window.electronAPI.aiRewrite = function(payload) {
  capturedAiPayload = payload;
  return Promise.resolve({ status: 'ok', result: 'mocked' });
};
localStorage.setItem('ai_provider', 'gemini');
var jobA = window._appState.jobs.find(function(j){return j.id==='jobA';});
if (typeof window.triggerAutoAiRewrite === 'function') {
  window.triggerAutoAiRewrite(jobA, '1\n00:00:01,000 --> 00:00:03,000\nTest subtitle').catch(function(){});
  if (capturedAiPayload !== null) {
    assert(capturedAiPayload.model === jobA.aiModel,
      'AI execution payload.model === job.aiModel. Got: ' + capturedAiPayload.model);
  } else { notTested('triggerAutoAiRewrite payload not captured synchronously'); }
} else { notTested('triggerAutoAiRewrite not exposed on window'); }
window.electronAPI.aiRewrite = _origAiRewrite;

// 10. TTS execution reads job.ttsVoice and job.ttsSpeed
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
  window.triggerAutoTts(jobA, '1\n00:00:01,000 --> 00:00:03,000\nTest subtitle').catch(function(){});
  if (capturedFetchBody !== null) {
    assert(capturedFetchBody.tts_voice === jobA.ttsVoice,
      'TTS payload.tts_voice === job.ttsVoice. Got: ' + capturedFetchBody.tts_voice);
    assert(capturedFetchBody.tts_speed === parseFloat(jobA.ttsSpeed),
      'TTS payload.tts_speed === parseFloat(job.ttsSpeed). Got: ' + capturedFetchBody.tts_speed);
  } else { notTested('triggerAutoTts fetch body not captured synchronously'); }
} else { notTested('triggerAutoTts not exposed on window'); }
window.fetch = _origFetch;

// 11. Empty AI model shows Chua chon
var cloudModel = document.getElementById('ai-cloud-model');
if (cloudModel) {
  cloudModel.innerHTML = '';
  localStorage.removeItem('ai_model_gemini');
  localStorage.setItem('ai_provider', 'gemini');
  window.dispatchEvent(new Event('aiModelChanged'));
  var step1m = document.getElementById('step1-ai-model');
  var isEmpty = !step1m || step1m.options.length === 0 ||
    (step1m.options[0] && (step1m.options[0].text.indexOf('ch') !== -1 || step1m.options[0].value === ''));
  assert(isEmpty,
    'Empty AI model shows Chua chon or empty. Got: ' +
    (step1m && step1m.options[0] ? step1m.options[0].text : 'null'));
} else { notTested('ai-cloud-model not found for empty-model test'); }

} catch(e) { log.push('HARNESS ERROR: ' + e.message); failCount++; }
return JSON.stringify({ log: log, passCount: passCount, failCount: failCount });
