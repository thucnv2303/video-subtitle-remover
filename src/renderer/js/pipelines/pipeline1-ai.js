import '../pipeline-state.js';
import '../pipeline1-run-config.js';
import '../pipeline1-artifact-gate.js';
import { runPipeline1MultimodalAnalysis, narrationToSingleSrt, compactNarration } from '../pipeline1-analysis.js';

/**
 * Pipeline 1 analysis + evidence-aware continuous narration + TTS.
 * P1 must fail when required analysis/artifacts/TTS fail.
 */

const P1_NARRATION_MIN_RATIO = 0.95;
const P1_NARRATION_MAX_RATIO = 1.00;
const P1_NARRATION_TARGET_RATIO = 0.975;
const P1_SMALL_TEMPO_MAX_DELTA = 0.05;

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
  if (!job.p1ErrorStage) job.p1ErrorStage = stage || 'pipeline';
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

function _measuredNarrationBudget(narration, audioDurationMs, videoDurationMs) {
  const text = compactNarration(narration);
  const audioSec = Math.max(0.001, Number(audioDurationMs) / 1000);
  const videoSec = Math.max(0.001, Number(videoDurationMs) / 1000);
  const measuredCharsPerSec = Math.max(1, text.length / audioSec);
  const minChars = Math.max(30, Math.round(measuredCharsPerSec * videoSec * P1_NARRATION_MIN_RATIO));
  const maxChars = Math.max(minChars + 10, Math.round(measuredCharsPerSec * videoSec * P1_NARRATION_MAX_RATIO));
  const targetChars = Math.max(minChars, Math.min(maxChars, Math.round(measuredCharsPerSec * videoSec * P1_NARRATION_TARGET_RATIO)));
  return {
    measured_chars_per_sec: measuredCharsPerSec,
    min_chars: minChars,
    max_chars: maxChars,
    target_chars: targetChars,
  };
}

function _tempoCorrectionFactor(audioDurationMs, videoDurationMs) {
  const audio = Number(audioDurationMs) || 0;
  const video = Number(videoDurationMs) || 0;
  if (!(audio > 0) || !(video > 0)) return 1;
  const targetMs = video * P1_NARRATION_TARGET_RATIO;
  return audio / targetMs;
}

function _canSmallTempoCorrect(audioDurationMs, videoDurationMs) {
  const factor = _tempoCorrectionFactor(audioDurationMs, videoDurationMs);
  return factor >= 1 - P1_SMALL_TEMPO_MAX_DELTA && factor <= 1 + P1_SMALL_TEMPO_MAX_DELTA;
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

function _sourceFingerprint(job) {
  return String(
    job?.sourceFingerprint
    || job?.p1Artifacts?.multimodal_timeline?.source_fingerprint
    || job?.p1Artifacts?.scenes?.source_fingerprint
    || ''
  );
}

function _analysisSignature(job) {
  const config = job?.p1Config || {};
  return JSON.stringify({
    source_fingerprint: _sourceFingerprint(job),
    model: String(config.model || ''),
    prompt: String(config.prompt || ''),
  });
}

function _voiceSignature(job, voice, refAudio) {
  return JSON.stringify({
    voice: String(voice || ''),
    ref_audio: String(refAudio || ''),
    speed: Number(_ttsSpeed(job).toFixed(4)),
  });
}

function _canResumeAnalysis(job) {
  const checkpoint = job?._p1DurationCheckpoint;
  if (!checkpoint || checkpoint.resume_stage !== 'DURATION_CONTROL') return false;
  if (!job?.p1Artifacts || !job?.p1Analysis || !compactNarration(job?.p1Narration)) return false;
  const fingerprint = _sourceFingerprint(job);
  if (!fingerprint || checkpoint.source_fingerprint !== fingerprint) return false;
  return checkpoint.analysis_signature === _analysisSignature(job);
}

async function _persistDurationCheckpoint(job, checkpoint) {
  if (!job) return;
  job._p1DurationCheckpoint = { ...checkpoint, updated_at: Date.now() };
  if (!job.p1ArtifactDir) return;
  try {
    const saved = await window.api.writeFile(
      `${job.p1ArtifactDir}/p1_checkpoint.json`,
      JSON.stringify(job._p1DurationCheckpoint, null, 2)
    );
    if (saved?.status === 'error') {
      _addLog(`[P1] ⚠ Không ghi được p1_checkpoint.json: ${saved.error || 'unknown error'}`, 'warning');
    }
  } catch (error) {
    _addLog(`[P1] ⚠ Không ghi được p1_checkpoint.json: ${error?.message || error}`, 'warning');
  }
}

function _evidenceContext(job) {
  const timeline = job?.p1Artifacts?.multimodal_timeline || {};
  const scenes = Array.isArray(timeline.scenes) ? timeline.scenes.slice(0, 80).map((scene) => ({
    index: Number(scene?.index) || 0,
    chunk_index: Number(scene?.chunk_index) || 0,
    time_sec: Number(scene?.time_sec) || 0,
    visual: String(scene?.visual || '').slice(0, 220),
    speech_context: String(scene?.speech_context || '').slice(0, 180),
    purpose: String(scene?.purpose || '').slice(0, 140),
  })) : [];
  const chunks = Array.isArray(timeline.chunks) ? timeline.chunks.slice(0, 20).map((chunk) => ({
    index: Number(chunk?.index) || 0,
    start_sec: Number(chunk?.start_sec) || 0,
    end_sec: Number(chunk?.end_sec) || 0,
    keyframes: Array.isArray(chunk?.keyframes) ? chunk.keyframes.slice(0, 8) : [],
  })) : [];
  return {
    summary: String(timeline.summary || '').slice(0, 600),
    insights: timeline.insights || {},
    chunks,
    scenes,
  };
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

async function _applySmallTempoCorrection(job, ttsData, videoDurationMs, label) {
  if (!window.electronAPI?.prepareP1NarrationAudio) throw new Error('Bridge tempo correction chưa sẵn sàng.');
  const audioDurationMs = Number(ttsData?.exported_audio_duration_ms) || 0;
  const factor = _tempoCorrectionFactor(audioDurationMs, videoDurationMs);
  if (!_canSmallTempoCorrect(audioDurationMs, videoDurationMs)) return null;
  _addLog(`[TTS] 🎚 ${label}: hiệu chỉnh tempo toàn audio ${factor.toFixed(4)}x để nhắm ${_durationPct(P1_NARRATION_TARGET_RATIO)}; không viết lại narration.`, 'info');
  const adjusted = await window.electronAPI.prepareP1NarrationAudio({
    source_path: ttsData.audio_path,
    artifact_dir: job.p1ArtifactDir,
    speed: factor,
  });
  if (!adjusted?.ok || !adjusted?.audio_path || !(Number(adjusted.duration_ms) > 0)) {
    throw new Error(adjusted?.error || 'Không thể hiệu chỉnh tempo narration.');
  }
  return {
    ...ttsData,
    audio_path: adjusted.audio_path,
    exported_audio_duration_ms: Number(adjusted.duration_ms),
    duration_controller_tempo: factor,
    adjusted_speed: true,
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
  const timeline = job?.p1Artifacts?.multimodal_timeline || {};
  const transcript = String(timeline.source_transcript_srt || job?.srtContent || '').trim();
  const visualContext = _evidenceContext(job);
  if (!transcript || !visualContext.scenes.length) {
    throw new Error('Thiếu transcript hoặc Vision evidence đã lưu để recompose narration có căn cứ.');
  }

  const localBudget = _measuredNarrationBudget(narration, audioDurationMs, videoDurationMs);
  _addLog(`[TTS] 🧠 Large duration miss: recompose TOÀN BÀI từ transcript + Vision evidence; measured_rate=${localBudget.measured_chars_per_sec.toFixed(2)} char/s; target=${localBudget.min_chars}-${localBudget.max_chars}.`, 'warning');
  const result = await window.electronAPI.fitP1Narration({
    endpoint: config.endpoint || 'http://localhost:11434/api/chat',
    model,
    narration_script: compactNarration(narration),
    audio_duration_ms: Number(audioDurationMs),
    video_duration_ms: Number(videoDurationMs),
    transcript_srt: transcript,
    visual_context: visualContext,
  });
  if (job._p1Cancelled || result?.cancelled) return null;
  if (!result?.ok || !result?.narration_script) {
    throw new Error(result?.error || 'Evidence-backed narration fit không trả về lời thoại hợp lệ.');
  }
  if (result.evidence_backed !== true) {
    throw new Error('Duration controller không xác nhận evidence-backed fit; đã chặn final TTS.');
  }
  const repaired = compactNarration(result.narration_script);
  if (!repaired) throw new Error('Evidence-backed narration fit trả về lời thoại rỗng.');
  _addLog(`[TTS] 📝 Evidence-fit: ${compactNarration(narration).length} → ${repaired.length} ký tự; target=${result?.budget?.min_chars || '?'}-${result?.budget?.max_chars || '?'}; attempts=${result?.attempts || 1}.`, 'info');
  return { narration: repaired, budget: result.budget || localBudget, quality: result.quality || null };
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
  delete job.p1ErrorMessage;
  delete job.p1ErrorStage;
  delete job.p1ErrorAt;

  try {
    if (!sourceSrt?.trim()) throw new Error('Không có SRT đầu vào cho Pipeline 1.');
    const resumeAnalysis = _canResumeAnalysis(job);
    let result;
    if (resumeAnalysis) {
      _addLog('[P1] ↩ Resume duration-control: tái sử dụng ASR + Vision + global reasoning đã hợp lệ; không chạy lại multimodal.', 'success');
      result = {
        narrationScript: compactNarration(job.p1Narration),
        rewrittenSrt: job.remixSrt,
        analysis: job.p1Analysis,
        bundle: job.p1Artifacts,
      };
    } else {
      job._p1DurationCheckpoint = null;
      _addLog('[P1] 🧠 Bắt đầu phân tích original video + transcript + keyframes...', 'info');
      result = await runPipeline1MultimodalAnalysis(job, sourceSrt);
    }
    if (job._p1Cancelled) return { status: 'cancelled' };

    let narrationText = compactNarration(result.narrationScript);
    if (!narrationText) throw new Error('Không có narration liền mạch từ global reasoning.');
    job.aiContent = narrationText;
    job.p1Narration = narrationText;
    job.remixSrt = result.rewrittenSrt || job.remixSrt;
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
    const analysisSignature = _analysisSignature(job);
    const voiceSignature = _voiceSignature(job, voice, refAudio);
    const checkpoint = job._p1DurationCheckpoint;
    const reusePass1 = Boolean(
      checkpoint
      && checkpoint.resume_stage === 'DURATION_CONTROL'
      && checkpoint.analysis_signature === analysisSignature
      && checkpoint.voice_signature === voiceSignature
      && checkpoint.pass1_reusable === true
      && compactNarration(checkpoint.narration) === narration
      && checkpoint.pass1_audio_path
      && Number(checkpoint.pass1_audio_duration_ms) > 0
    );

    let ttsData;
    if (reusePass1) {
      ttsData = {
        status: 'ok',
        audio_path: checkpoint.pass1_audio_path,
        exported_audio_duration_ms: Number(checkpoint.pass1_audio_duration_ms),
        tts_speed: _ttsSpeed(job),
        resumed: true,
      };
      _addLog(`[TTS] ↩ Resume: tái sử dụng TTS pass 1 đã đo ${_durationSec(ttsData.exported_audio_duration_ms)}; không synthesize lại.`, 'success');
    } else {
      ttsData = await _requestContinuousTts(job, narration, voice, refAudio);
      if (ttsData?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };
      await _persistDurationCheckpoint(job, {
        stage: 'TTS_PASS1_DONE',
        resume_stage: 'DURATION_CONTROL',
        source_fingerprint: _sourceFingerprint(job),
        analysis_signature: analysisSignature,
        voice_signature: voiceSignature,
        narration,
        pass1_audio_path: ttsData.audio_path,
        pass1_audio_duration_ms: Number(ttsData.exported_audio_duration_ms),
        video_duration_ms: videoDurationMs,
        pass1_reusable: true,
      });
    }

    let exportedDurationMs = Number(ttsData.exported_audio_duration_ms) || 0;
    let ratio = _durationRatio(exportedDurationMs, videoDurationMs);
    _addLog(`[TTS] ⏱ Continuous duration gate pass 1: video=${_durationSec(videoDurationMs)}, voice=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`, _durationInWindow(exportedDurationMs, videoDurationMs) ? 'success' : 'warning');

    if (!_durationInWindow(exportedDurationMs, videoDurationMs) && _canSmallTempoCorrect(exportedDurationMs, videoDurationMs)) {
      const adjusted = await _applySmallTempoCorrection(job, ttsData, videoDurationMs, 'Pass 1 near-miss');
      if (adjusted) {
        ttsData = adjusted;
        exportedDurationMs = Number(ttsData.exported_audio_duration_ms) || 0;
        ratio = _durationRatio(exportedDurationMs, videoDurationMs);
        _addLog(`[TTS] ⏱ Duration gate sau tempo correction: voice=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}.`, _durationInWindow(exportedDurationMs, videoDurationMs) ? 'success' : 'warning');
        await _persistDurationCheckpoint(job, {
          ...(job._p1DurationCheckpoint || {}),
          pass1_audio_path: ttsData.audio_path,
          pass1_audio_duration_ms: exportedDurationMs,
          pass1_reusable: true,
        });
      }
    }

    if (!_durationInWindow(exportedDurationMs, videoDurationMs)) {
      const repaired = await _fitNarrationOnce(job, narration, exportedDurationMs, videoDurationMs);
      if (job._p1Cancelled || !repaired) return { status: 'cancelled' };
      narration = repaired.narration;
      await _syncNarrationArtifacts(job, narration, videoDurationMs, repaired.budget);

      await _persistDurationCheckpoint(job, {
        ...(job._p1DurationCheckpoint || {}),
        stage: 'FINAL_TTS_PENDING',
        resume_stage: 'DURATION_CONTROL',
        narration,
        pass1_reusable: false,
      });
      _addLog('[TTS] 🔁 Tạo lại TOÀN BỘ narration evidence-backed lần cuối; đây là TTS pass 2/2.', 'info');
      ttsData = await _requestContinuousTts(job, narration, voice, refAudio);
      if (ttsData?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };
      exportedDurationMs = Number(ttsData.exported_audio_duration_ms) || 0;
      ratio = _durationRatio(exportedDurationMs, videoDurationMs);
      _addLog(`[TTS] ⏱ Continuous duration gate pass 2: video=${_durationSec(videoDurationMs)}, voice=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`, _durationInWindow(exportedDurationMs, videoDurationMs) ? 'success' : 'warning');

      if (!_durationInWindow(exportedDurationMs, videoDurationMs) && _canSmallTempoCorrect(exportedDurationMs, videoDurationMs)) {
        const adjusted = await _applySmallTempoCorrection(job, ttsData, videoDurationMs, 'Pass 2 near-miss');
        if (adjusted) {
          ttsData = adjusted;
          exportedDurationMs = Number(ttsData.exported_audio_duration_ms) || 0;
          ratio = _durationRatio(exportedDurationMs, videoDurationMs);
          _addLog(`[TTS] ⏱ Final gate sau tempo correction: voice=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}.`, _durationInWindow(exportedDurationMs, videoDurationMs) ? 'success' : 'error');
        }
      }
    }

    if (!_durationInWindow(exportedDurationMs, videoDurationMs)) {
      throw new Error(`Continuous narration không đạt duration gate sau controller bị chặn ở tối đa 2 TTS: video=${_durationSec(videoDurationMs)}, voice=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`);
    }

    await _syncNarrationArtifacts(job, narration, videoDurationMs);
    await _persistAcceptedTts(job, ttsData, narration);
    await _persistDurationCheckpoint(job, {
      ...(job._p1DurationCheckpoint || {}),
      stage: 'P1_DONE',
      resume_stage: null,
      narration,
      final_audio_path: job.ttsAudioPath,
      final_audio_duration_ms: job.ttsAudioDurMs,
      final_ratio: ratio,
      pass1_reusable: false,
    });
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
    if (job._p1DurationCheckpoint?.resume_stage === 'DURATION_CONTROL') {
      job._p1DurationCheckpoint.stage = 'DURATION_CONTROL_FAILED';
      await _persistDurationCheckpoint(job, job._p1DurationCheckpoint);
    }
    _rememberP1Error(job, error, 'Duration control / Continuous narration TTS');
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
  _measuredNarrationBudget,
  _tempoCorrectionFactor,
  _canSmallTempoCorrect,
  _analysisSignature,
  _voiceSignature,
  _canResumeAnalysis,
  _buildContinuousTimedSrt,
};
