import '../pipeline-state.js';
import '../pipeline1-run-config.js';
import '../pipeline1-artifact-gate.js';
import { runPipeline1MultimodalAnalysis, narrationToSingleSrt, compactNarration } from '../pipeline1-analysis.js';

/**
 * Pipeline 1 analysis + voice-aware continuous narration + TTS.
 * P1 must fail when required analysis/artifacts/TTS fail.
 */

const P1_NARRATION_MIN_RATIO = 0.95;
const P1_NARRATION_MAX_RATIO = 1.00;
const P1_NARRATION_TARGET_RATIO = 0.975;

function _selectRunningJob(job) {
  const state = window._appState;
  if (!state || !job) return;
  const selectedExists = Boolean(
    state.pipeline1SelectedJobId
    && state.jobs?.some(item => item.id === state.pipeline1SelectedJobId)
  );
  if (!selectedExists) state.pipeline1SelectedJobId = job.id;
  state.activeJobId = job.id;
  window.renderJobDetail1?.();
}

function _rememberP1Error(job, error, stage) {
  if (!job) return;
  const message = String(error?.message || error || '').trim();
  if (message) job.p1ErrorMessage = message;
  job.p1ErrorStage = stage || job.p1ErrorStage || 'pipeline';
  job.p1ErrorAt = Date.now();
}

function _durationRatio(audioDurationMs, videoDurationMs) {
  const audio = Number(audioDurationMs) || 0;
  const video = Number(videoDurationMs) || 0;
  if (audio <= 0 || video <= 0) return 0;
  return audio / video;
}

function _durationInWindow(audioDurationMs, videoDurationMs) {
  const ratio = _durationRatio(audioDurationMs, videoDurationMs);
  return ratio >= P1_NARRATION_MIN_RATIO && ratio <= P1_NARRATION_MAX_RATIO;
}

function _durationPct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function _durationSec(valueMs) {
  return `${(Number(valueMs || 0) / 1000).toFixed(2)}s`;
}

function _repairScale(audioDurationMs, videoDurationMs) {
  const ratio = _durationRatio(audioDurationMs, videoDurationMs);
  return ratio > 0 ? P1_NARRATION_TARGET_RATIO / ratio : 1;
}

async function _sourceVideoDurationMs(job) {
  const candidates = [
    job?.p1Artifacts?.multimodal_timeline?.source_duration,
    job?.p1Artifacts?.scenes?.source_duration,
    job?.p1Analysis?.source_duration,
  ];
  for (const value of candidates) {
    const seconds = Number(value);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  }

  const info = await window.api.videoInfo(job.filePath);
  const seconds = Number(info?.duration) || 0;
  if (!(seconds > 0)) throw new Error('Không đọc được thời lượng video nguồn để kiểm tra voice.');
  return seconds * 1000;
}

function _ttsSpeed(job) {
  const value = Number(job?.p1Config?.ttsSpeed || localStorage.getItem('tts_speed') || 1);
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.5, Math.min(2, value));
}

function _voiceReference(voice) {
  if (!String(voice || '').startsWith('clone:')) return null;
  const idx = parseInt(String(voice).split(':')[1], 10);
  const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
  const refAudio = voices[idx]?.audioPath || null;
  if (!refAudio) throw new Error('Không tìm thấy audio tham chiếu của giọng clone đã chọn.');
  return refAudio;
}

async function _requestContinuousTts(job, narration, voice, refAudio) {
  const text = compactNarration(narration);
  if (!text) throw new Error('Narration đang trống.');
  if (!job.p1ArtifactDir) throw new Error('P1 artifact directory chưa sẵn sàng cho continuous TTS.');
  if (!window.electronAPI?.prepareP1NarrationAudio) throw new Error('Bridge chuẩn hóa continuous narration audio chưa sẵn sàng.');

  const body = {
    text,
    ref_audio_path: refAudio,
    language: 'vi',
  };
  if (!String(voice).startsWith('clone:')) body.voice_name = voice;

  _addLog(`[TTS] 🎙 Full-text synthesis: 1 request / ${text.length} ký tự / voice=${voice} / speed=${_ttsSpeed(job).toFixed(2)}x.`, 'info');
  const response = await fetch(`${window.api.base}/api/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (job._p1Cancelled) return { status: 'cancelled' };
  if (!response.ok) throw new Error(`TTS generate HTTP ${response.status}`);
  const data = await response.json();
  if (data.status !== 'ok' || !data.audio_path) {
    throw new Error(data.error || 'TTS không trả về audio hợp lệ.');
  }

  const prepared = await window.electronAPI.prepareP1NarrationAudio({
    source_path: data.audio_path,
    artifact_dir: job.p1ArtifactDir,
    speed: _ttsSpeed(job),
  });
  if (!prepared?.ok || !prepared?.audio_path || !(Number(prepared.duration_ms) > 0)) {
    throw new Error(prepared?.error || 'Không đo được duration audio narration sau khi áp dụng tốc độ đọc.');
  }

  return {
    status: 'ok',
    audio_path: prepared.audio_path,
    exported_audio_duration_ms: Number(prepared.duration_ms),
    tts_speed: Number(prepared.speed) || _ttsSpeed(job),
    adjusted_speed: Boolean(prepared.adjusted),
  };
}

function _splitDisplayChunks(narration) {
  const text = compactNarration(narration);
  if (!text) return [];
  const sentenceParts = text.split(/(?<=[.!?…])\s+/).map(item => item.trim()).filter(Boolean);
  const chunks = [];
  for (const sentence of sentenceParts.length ? sentenceParts : [text]) {
    if (sentence.length <= 76) {
      chunks.push(sentence);
      continue;
    }
    const words = sentence.split(/\s+/).filter(Boolean);
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > 70 && current) {
        chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) chunks.push(current);
  }
  return chunks.length ? chunks : [text];
}

function _buildContinuousTimedSrt(narration, audioDurationMs) {
  const chunks = _splitDisplayChunks(narration);
  const duration = Math.max(1000, Math.round(Number(audioDurationMs) || 0));
  if (!chunks.length) return { srt: '', segments: [] };
  const weights = chunks.map(text => Math.max(1, text.replace(/\s+/g, '').length));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  let consumedWeight = 0;
  const segments = chunks.map((text, index) => {
    const startMs = index === 0 ? 0 : Math.round(duration * consumedWeight / totalWeight);
    consumedWeight += weights[index];
    const endMs = index === chunks.length - 1 ? duration : Math.round(duration * consumedWeight / totalWeight);
    return { start_ms: startMs, end_ms: Math.max(startMs + 1, endMs), text };
  });
  const srt = segments.map((segment, index) => (
    `${index + 1}\n${_msToSrtTime(segment.start_ms)} --> ${_msToSrtTime(segment.end_ms)}\n${segment.text}\n`
  )).join('\n');
  return { srt, segments };
}

async function _syncNarrationArtifacts(job, narration, videoDurationMs, repairBudget = null) {
  const text = compactNarration(narration);
  if (!text) throw new Error('Narration sau fit đang trống.');
  const videoDurationSec = Math.max(1, Number(videoDurationMs) / 1000);
  const remixSrt = narrationToSingleSrt(text, videoDurationSec);

  job.aiContent = text;
  job.p1Narration = text;
  job.remixSrt = remixSrt;
  if (job.p1Analysis) job.p1Analysis.narration_script = text;
  if (job.p1Artifacts?.remix_script) {
    job.p1Artifacts.remix_script.narration_script = text;
    job.p1Artifacts.remix_script.srt = remixSrt;
    job.p1Artifacts.remix_script.segments = [{
      start: '00:00:00,000',
      end: _msToSrtTime(Math.round(videoDurationMs)),
      text,
    }];
    if (repairBudget) job.p1Artifacts.remix_script.narration_repair_budget = repairBudget;
  }

  if (job.p1ArtifactDir) {
    const srtSave = await window.api.writeFile(`${job.p1ArtifactDir}/remix_script.srt`, remixSrt);
    if (srtSave?.status === 'error') throw new Error(srtSave.error || 'Không cập nhật được remix_script.srt.');
    if (job.p1Artifacts?.remix_script) {
      const jsonSave = await window.api.writeFile(
        `${job.p1ArtifactDir}/remix_script.json`,
        JSON.stringify(job.p1Artifacts.remix_script, null, 2)
      );
      if (jsonSave?.status === 'error') throw new Error(jsonSave.error || 'Không cập nhật được remix_script.json.');
    }
  }

  const state = window._appState;
  if (state?.pipeline1SelectedJobId === job.id) {
    const elAiContent = document.getElementById('ai-content');
    if (elAiContent) elAiContent.value = text;
    const detailText = document.getElementById('step1-detail-text');
    if (detailText) detailText.value = text;
  }

  return remixSrt;
}

async function _fitNarrationOnce(job, narration, audioDurationMs, videoDurationMs) {
  if (!window.electronAPI?.fitP1Narration) throw new Error('Bridge narration-fit chưa sẵn sàng.');
  const config = job?.p1Config || {};
  const model = String(config.model || '').trim();
  if (!model) throw new Error('Không có reasoning model để fit narration theo voice thực tế.');

  _addLog(`[TTS] 🛠 Voice ngoài gate; fit TOÀN BÀI đúng 1 lần từ measured voice rate. ratio=${_durationPct(_durationRatio(audioDurationMs, videoDurationMs))}.`, 'warning');
  const result = await window.electronAPI.fitP1Narration({
    endpoint: config.endpoint || 'http://localhost:11434/api/chat',
    model,
    narration_script: compactNarration(narration),
    audio_duration_ms: Number(audioDurationMs),
    video_duration_ms: Number(videoDurationMs),
  });
  if (job._p1Cancelled || result?.cancelled) return null;
  if (!result?.ok || !result?.narration_script) {
    throw new Error(result?.error || 'Narration fit không trả về lời thoại hợp lệ.');
  }
  const repaired = compactNarration(result.narration_script);
  if (!repaired) throw new Error('Narration fit trả về lời thoại rỗng.');
  _addLog(`[TTS] 📝 Narration fit: ${compactNarration(narration).length} → ${repaired.length} ký tự; target=${result?.budget?.min_chars || '?'}-${result?.budget?.max_chars || '?'} ký tự.`, 'info');
  return { narration: repaired, budget: result.budget || null };
}

async function _persistAcceptedTts(job, ttsData, narration) {
  job.ttsAudioPath = ttsData.audio_path;
  job.p1ArtifactPaths = job.p1ArtifactPaths || {};
  job.p1ArtifactPaths.voice = job.ttsAudioPath;
  job.ttsAudioDurMs = Number(ttsData.exported_audio_duration_ms) || 0;
  const timed = _buildContinuousTimedSrt(narration, job.ttsAudioDurMs);
  job.ttsTimedSrt = timed.srt;
  job.ttsSegmentsTiming = timed.segments.map(segment => ({
    start: segment.start_ms,
    end: segment.end_ms,
    text: segment.text,
  }));
  job.karaokeAss = null;
  job._ttsTriggered = true;

  if (job.p1ArtifactDir && job.ttsTimedSrt) {
    const save = await window.api.writeFile(`${job.p1ArtifactDir}/tts_timed.srt`, job.ttsTimedSrt);
    if (save?.status === 'error') throw new Error(save.error || 'Không lưu được tts_timed.srt.');
    job.p1ArtifactPaths['tts_timed.srt'] = `${job.p1ArtifactDir}/tts_timed.srt`;
  }
}

export async function triggerAutoAiRewrite(job, sourceSrt) {
  const btnRetry = document.getElementById('btn-retry-ai');
  _setBtn(btnRetry, true, '⏳ Đang phân tích video...');
  _selectRunningJob(job);
  job.p1ArtifactsReady = false;
  _addLog('[P1] 🧠 Bắt đầu phân tích original video + transcript + keyframes...', 'info');

  try {
    if (!sourceSrt?.trim()) throw new Error('Không có SRT đầu vào cho Pipeline 1.');
    const result = await runPipeline1MultimodalAnalysis(job, sourceSrt);
    if (job._p1Cancelled) return { status: 'cancelled' };

    let narrationText = compactNarration(result.narrationScript);
    if (!narrationText) throw new Error('Không có narration liền mạch từ global reasoning.');
    job.aiContent = narrationText;
    job.p1Narration = narrationText;
    job.remixSrt = result.rewrittenSrt;
    job._aiTriggered = true;
    _selectRunningJob(job);

    const state = window._appState;
    if (state?.pipeline1SelectedJobId === job.id) {
      const elAiContent = document.getElementById('ai-content');
      if (elAiContent) elAiContent.value = narrationText;
      const detailText = document.getElementById('step1-detail-text');
      if (detailText) detailText.value = narrationText;
    }

    if (job.ttsGenerate) {
      const ttsResult = await triggerAutoTts(job, narrationText);
      if (ttsResult?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };
      if (ttsResult?.narration) narrationText = ttsResult.narration;
    }

    job.p1ArtifactsReady = true;
    job._p1StopRequested = false;
    delete job.p1ErrorMessage;
    delete job.p1ErrorStage;
    delete job.p1ErrorAt;
    _selectRunningJob(job);
    _addLog('[P1] ✅ Analysis/remix artifacts đã sẵn sàng.', 'success');
    return { status: 'ok', result: narrationText, analysis: result.analysis, artifacts: job.p1Artifacts || result.bundle };
  } catch (error) {
    job.p1ArtifactsReady = false;
    if (job._p1Cancelled || error?.name === 'AbortError') {
      _addLog('[P1] ⏹ Pipeline 1 đã dừng theo yêu cầu.', 'warning');
      return { status: 'cancelled' };
    }
    _rememberP1Error(job, error, 'Phân tích / Remix AI');
    _addLog('[P1] ❌ Phân tích/remix thất bại: ' + error.message, 'error');
    throw error;
  } finally {
    _setBtn(btnRetry, false, '🔄 Phân tích lại');
  }
}

export async function triggerAutoTts(job, narrationText) {
  const voice = job.ttsVoice || job.p1Config?.ttsVoice || localStorage.getItem('tts_voice') || 'none';
  if (!voice || voice === 'none') throw new Error('TTS đã được bật nhưng chưa chọn giọng đọc.');
  let narration = compactNarration(narrationText);
  if (!narration) throw new Error('Không có narration liền mạch để tạo TTS.');
  if (job._ttsRunning) throw new Error('TTS đang chạy cho Job này.');
  if (job._p1Cancelled) return { status: 'cancelled' };

  _selectRunningJob(job);
  job._ttsRunning = true;
  job._ttsTriggered = false;
  const btnRetry = document.getElementById('btn-retry-tts');
  _setBtn(btnRetry, true, '⏳ Đang tạo voice...');
  _addLog('[TTS] 🎤 Đang tạo một narration liền mạch từ đầu đến cuối...', 'info');

  try {
    const refAudio = _voiceReference(voice);
    const videoDurationMs = await _sourceVideoDurationMs(job);

    let ttsData = await _requestContinuousTts(job, narration, voice, refAudio);
    if (ttsData?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };
    let exportedDurationMs = Number(ttsData.exported_audio_duration_ms) || 0;
    let ratio = _durationRatio(exportedDurationMs, videoDurationMs);
    _addLog(`[TTS] ⏱ Continuous duration gate pass 1: video=${_durationSec(videoDurationMs)}, voice=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`, _durationInWindow(exportedDurationMs, videoDurationMs) ? 'success' : 'warning');

    if (!_durationInWindow(exportedDurationMs, videoDurationMs)) {
      const repaired = await _fitNarrationOnce(job, narration, exportedDurationMs, videoDurationMs);
      if (job._p1Cancelled || !repaired) return { status: 'cancelled' };
      narration = repaired.narration;
      await _syncNarrationArtifacts(job, narration, videoDurationMs, repaired.budget);

      _addLog('[TTS] 🔁 Tạo lại TOÀN BỘ narration lần cuối, không chia speech segment...', 'info');
      ttsData = await _requestContinuousTts(job, narration, voice, refAudio);
      if (ttsData?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };
      exportedDurationMs = Number(ttsData.exported_audio_duration_ms) || 0;
      ratio = _durationRatio(exportedDurationMs, videoDurationMs);
      _addLog(`[TTS] ⏱ Continuous duration gate pass 2: video=${_durationSec(videoDurationMs)}, voice=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`, _durationInWindow(exportedDurationMs, videoDurationMs) ? 'success' : 'error');
    }

    if (!_durationInWindow(exportedDurationMs, videoDurationMs)) {
      throw new Error(`Continuous narration không đạt duration gate sau tối đa 1 lần fit: video=${_durationSec(videoDurationMs)}, voice=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`);
    }

    await _syncNarrationArtifacts(job, narration, videoDurationMs);
    await _persistAcceptedTts(job, ttsData, narration);
    _selectRunningJob(job);
    if (typeof window.renderVoiceSegments === 'function' && window._appState?.pipeline1SelectedJobId === job.id) {
      window.renderVoiceSegments([{ text: narration, audio_path: job.ttsAudioPath }]);
    }

    _addLog(`[TTS] ✅ Continuous duration gate PASS: voice=${_durationSec(job.ttsAudioDurMs)} / video=${_durationSec(videoDurationMs)} (${_durationPct(ratio)}).`, 'success');
    _addLog(`[TTS] ✅ TTS liền mạch hoàn tất: ${job.ttsAudioPath}`, 'success');
    return { status: 'ok', audio_path: job.ttsAudioPath, narration };
  } catch (error) {
    job._ttsTriggered = false;
    if (job._p1Cancelled || error?.name === 'AbortError') {
      _addLog('[TTS] ⏹ TTS đã dừng theo yêu cầu.', 'warning');
      return { status: 'cancelled' };
    }
    _rememberP1Error(job, error, 'Continuous narration TTS');
    _addLog('[TTS] ❌ TTS thất bại: ' + error.message, 'error');
    throw error;
  } finally {
    job._ttsRunning = false;
    _setBtn(btnRetry, false, '🔄 Tạo lại TTS');
  }
}

export function _buildTimedSrt(newText, originalSrt) {
  if (newText && newText.includes('-->')) return newText;
  if (!originalSrt || !originalSrt.includes('-->')) {
    const lines = (newText || '').split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      const start = _msToSrtTime(index * 4000);
      const end = _msToSrtTime(index * 4000 + 3800);
      return `${index + 1}\n${start} --> ${end}\n${line}\n`;
    }).join('\n');
  }

  const slots = [];
  for (const block of originalSrt.trim().split(/\n\n+/)) {
    const match = block.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    if (match) slots.push({ start: match[1].replace('.', ','), end: match[2].replace('.', ',') });
  }
  if (!slots.length) return newText;
  const lines = (newText || '').split('\n').map(line => line.trim()).filter(line => line && !/^\d+$/.test(line) && !line.includes('-->'));
  if (!lines.length) return originalSrt;

  return slots.map((slot, index) => {
    const textIndex = Math.min(Math.floor(index * lines.length / slots.length), lines.length - 1);
    return `${index + 1}\n${slot.start} --> ${slot.end}\n${lines[textIndex]}\n`;
  }).join('\n');
}

export function _msToSrtTime(ms) {
  const safe = Math.max(0, Math.round(Number(ms) || 0));
  const h = Math.floor(safe / 3600000);
  const m = Math.floor((safe % 3600000) / 60000);
  const s = Math.floor((safe % 60000) / 1000);
  const mil = safe % 1000;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(mil).padStart(3,'0')}`;
}

function _addLog(message, type) {
  if (typeof window.addLog === 'function') window.addLog(message, type);
  else console.log(`[${type}] ${message}`);
}

function _setBtn(button, disabled, text) {
  if (!button) return;
  button.disabled = disabled;
  button.textContent = text;
}

export {
  _durationRatio,
  _durationInWindow,
  _repairScale,
  _buildContinuousTimedSrt,
};
