import '../pipeline-state.js';
import '../pipeline1-run-config.js';
import '../pipeline1-artifact-gate.js';
import { runPipeline1MultimodalAnalysis } from '../pipeline1-analysis.js';

/**
 * Pipeline 1 analysis + remix + TTS.
 * P1 must fail when required analysis/artifacts/TTS fail.
 */

const P1_NARRATION_MIN_RATIO = 0.95;
const P1_NARRATION_MAX_RATIO = 1.00;
const P1_NARRATION_TARGET_RATIO = 0.975;
const LEGACY_TTS_EXPORT_TAIL_MS = 1000;

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

function _exportedAudioDurationMs(ttsData) {
  const exact = Number(ttsData?.exported_audio_duration_ms);
  if (Number.isFinite(exact) && exact > 0) return exact;
  const legacy = Number(ttsData?.audio_duration_ms);
  if (Number.isFinite(legacy) && legacy > 0) return legacy + LEGACY_TTS_EXPORT_TAIL_MS;
  return 0;
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

async function _requestTts(job, srtText, voice, refAudio) {
  const ttsRes = await fetch(`${window.api.base}/api/tts-retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      srt_content: srtText,
      tts_voice: voice,
      video_path: job.filePath,
      tts_ref_audio: refAudio,
    }),
  });
  if (job._p1Cancelled) return { status: 'cancelled' };
  if (!ttsRes.ok) throw new Error(`TTS HTTP ${ttsRes.status}`);
  const data = await ttsRes.json();
  if (data.status !== 'ok' || !data.audio_path) {
    throw new Error(data.error || 'TTS không trả về audio hợp lệ.');
  }
  const exportedDurationMs = _exportedAudioDurationMs(data);
  if (!(exportedDurationMs > 0)) {
    throw new Error('TTS không trả về duration audio hợp lệ.');
  }
  data.exported_audio_duration_ms = exportedDurationMs;
  return data;
}

function _parseTimedSrtSegments(srtText) {
  const segments = [];
  const blocks = String(srtText || '').trim().split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const timeLine = lines.find(line => line.includes('-->'));
    if (!timeLine) continue;
    const match = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    if (!match) continue;
    const text = lines.filter(line => !/^\d+$/.test(line) && line !== timeLine).join(' ').trim();
    if (!text) continue;
    segments.push({
      start: match[1].replace('.', ','),
      end: match[2].replace('.', ','),
      text,
    });
  }
  return segments;
}

async function _repairScriptForDuration(job, srtText, audioDurationMs, videoDurationMs) {
  const ratio = _durationRatio(audioDurationMs, videoDurationMs);
  const scale = _repairScale(audioDurationMs, videoDurationMs);
  const direction = ratio > P1_NARRATION_MAX_RATIO
    ? `RÚT GỌN lời thoại còn khoảng ${(scale * 100).toFixed(0)}% độ dài hiện tại.`
    : `MỞ RỘNG NHẸ lời thoại lên khoảng ${(scale * 100).toFixed(0)}% độ dài hiện tại.`;
  const prompt = [
    'Bạn đang sửa lời thoại SRT để khớp thời lượng voice với video nguồn.',
    `Video nguồn dài ${(videoDurationMs / 1000).toFixed(2)} giây.`,
    `Voice export lần 1 dài ${(audioDurationMs / 1000).toFixed(2)} giây (${_durationPct(ratio)} thời lượng video).`,
    `Mục tiêu cuối: voice export phải nằm trong 95% đến 100% thời lượng video, ưu tiên khoảng ${(P1_NARRATION_TARGET_RATIO * 100).toFixed(1)}%.`,
    direction,
    'BẮT BUỘC giữ nguyên chính xác số segment, số thứ tự và timestamp SRT.',
    'Giữ nguyên ý nghĩa, hook, bằng chứng và CTA có căn cứ; không bịa thêm claim hoặc thông tin mới.',
    'Mỗi segment phải tự nhiên khi đọc TTS, súc tích, không lặp ý.',
    'Chỉ trả lại SRT hoàn chỉnh, không giải thích.',
  ].join('\n');

  _addLog(`[TTS] 🛠 Voice ngoài gate; sửa script đúng 1 lần với target≈${_durationPct(P1_NARRATION_TARGET_RATIO)}, text-scale≈${(scale * 100).toFixed(0)}%.`, 'warning');

  const config = job?.p1Config || {};
  const model = String(config.model || '').trim();
  if (!model) throw new Error('Không có reasoning model để sửa script theo thời lượng.');

  const response = await fetch(`${window.api.base}/api/ai-rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      srt_content: srtText,
      ai_config: {
        provider: config.provider || 'ollama',
        model,
        endpoint: config.endpoint || 'http://localhost:11434/api/chat',
        api_keys: [model],
        prompt,
      },
    }),
  });
  if (job._p1Cancelled) return null;
  if (!response.ok) throw new Error(`Script-fit HTTP ${response.status}`);
  const data = await response.json();
  if (data.status !== 'ok' || !String(data.result || '').includes('-->')) {
    throw new Error(data.error || 'AI không trả về SRT hợp lệ khi sửa thời lượng.');
  }

  const originalSegments = _parseTimedSrtSegments(srtText);
  const repairedSegments = _parseTimedSrtSegments(data.result);
  if (!originalSegments.length || repairedSegments.length !== originalSegments.length) {
    throw new Error(`Script-fit làm thay đổi số segment (${originalSegments.length} → ${repairedSegments.length}).`);
  }
  const timestampsPreserved = originalSegments.every((segment, index) => (
    segment.start === repairedSegments[index].start && segment.end === repairedSegments[index].end
  ));
  if (!timestampsPreserved) throw new Error('Script-fit làm thay đổi timestamp SRT; đã chặn để bảo vệ timeline.');
  return String(data.result).trim();
}

async function _syncRepairedRemixArtifacts(job, repairedSrt) {
  job.aiContent = repairedSrt;
  job.remixSrt = repairedSrt;
  const segments = _parseTimedSrtSegments(repairedSrt);
  if (!segments.length) throw new Error('Không parse được repaired remix SRT để đồng bộ artifact.');

  if (job.p1Artifacts?.remix_script) {
    job.p1Artifacts.remix_script.srt = repairedSrt;
    job.p1Artifacts.remix_script.segments = segments;
  }
  if (job.p1ArtifactDir) {
    const srtSave = await window.api.writeFile(`${job.p1ArtifactDir}/remix_script.srt`, repairedSrt);
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
    if (elAiContent) elAiContent.value = repairedSrt;
    const detailText = document.getElementById('step1-detail-text');
    if (detailText) detailText.value = repairedSrt;
  }
}

async function _persistAcceptedTts(job, ttsData) {
  job.ttsAudioPath = ttsData.audio_path;
  if (job.p1ArtifactDir && window.electronAPI?.persistP1Audio) {
    const persisted = await window.electronAPI.persistP1Audio({ source_path: job.ttsAudioPath, artifact_dir: job.p1ArtifactDir });
    if (!persisted?.ok || !persisted?.audio_path) throw new Error(persisted?.error || 'Không thể lưu audio TTS vào P1 artifacts.');
    job.ttsAudioPath = persisted.audio_path;
    job.p1ArtifactPaths = job.p1ArtifactPaths || {};
    job.p1ArtifactPaths.voice = persisted.audio_path;
  }
  job.ttsTimedSrt = ttsData.srt_content || _buildTimedSrt(job.remixSrt, job.srtContent);
  job.ttsAudioDurMs = _exportedAudioDurationMs(ttsData);
  job.ttsSegmentsTiming = ttsData.segments_timing || [];
  job.karaokeAss = ttsData.karaoke_ass || null;
  job._ttsTriggered = true;

  if (job.p1ArtifactDir && job.ttsTimedSrt) {
    const save = await window.api.writeFile(`${job.p1ArtifactDir}/tts_timed.srt`, job.ttsTimedSrt);
    if (save?.status === 'error') throw new Error(save.error || 'Không lưu được tts_timed.srt.');
    job.p1ArtifactPaths = job.p1ArtifactPaths || {};
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
    let aiText = result.rewrittenSrt;
    if (!aiText?.includes('-->')) throw new Error('Remix script không có timing SRT hợp lệ.');

    job.aiContent = aiText;
    job.remixSrt = aiText;
    job._aiTriggered = true;
    _selectRunningJob(job);

    const state = window._appState;
    if (state?.pipeline1SelectedJobId === job.id) {
      const elAiContent = document.getElementById('ai-content');
      if (elAiContent) elAiContent.value = aiText;
      const detailText = document.getElementById('step1-detail-text');
      if (detailText) detailText.value = aiText;
    }

    if (job.ttsGenerate) {
      const ttsResult = await triggerAutoTts(job, aiText);
      if (ttsResult?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };
      if (ttsResult?.repairedSrt) aiText = ttsResult.repairedSrt;
    }

    job.p1ArtifactsReady = true;
    job._p1StopRequested = false;
    delete job.p1ErrorMessage;
    delete job.p1ErrorStage;
    delete job.p1ErrorAt;
    _selectRunningJob(job);
    _addLog('[P1] ✅ Analysis/remix artifacts đã sẵn sàng.', 'success');
    return { status: 'ok', result: aiText, analysis: result.analysis, artifacts: job.p1Artifacts || result.bundle };
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

export async function triggerAutoTts(job, srtText) {
  const voice = job.ttsVoice || job.p1Config?.ttsVoice || localStorage.getItem('tts_voice') || 'none';
  if (!voice || voice === 'none') throw new Error('TTS đã được bật nhưng chưa chọn giọng đọc.');
  if (!srtText?.trim()) throw new Error('Không có remix SRT để tạo TTS.');
  if (job._ttsRunning) throw new Error('TTS đang chạy cho Job này.');
  if (job._p1Cancelled) return { status: 'cancelled' };

  _selectRunningJob(job);
  job._ttsRunning = true;
  job._ttsTriggered = false;
  const btnRetry = document.getElementById('btn-retry-tts');
  _setBtn(btnRetry, true, '⏳ Đang tạo voice...');
  _addLog('[TTS] 🎤 Đang tạo âm thanh lồng tiếng từ remix script...', 'info');

  try {
    let refAudio = null;
    if (voice.startsWith('clone:')) {
      const idx = parseInt(voice.split(':')[1], 10);
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      refAudio = voices[idx]?.audioPath || null;
      if (!refAudio) throw new Error('Không tìm thấy audio tham chiếu của giọng clone đã chọn.');
    }

    const videoDurationMs = await _sourceVideoDurationMs(job);
    let acceptedSrt = srtText;
    let ttsData = await _requestTts(job, acceptedSrt, voice, refAudio);
    if (ttsData?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };

    let exportedDurationMs = _exportedAudioDurationMs(ttsData);
    let ratio = _durationRatio(exportedDurationMs, videoDurationMs);
    _addLog(`[TTS] ⏱ Duration gate pass 1: video=${_durationSec(videoDurationMs)}, voice-export=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`, _durationInWindow(exportedDurationMs, videoDurationMs) ? 'success' : 'warning');

    let repairedSrt = null;
    if (!_durationInWindow(exportedDurationMs, videoDurationMs)) {
      repairedSrt = await _repairScriptForDuration(job, acceptedSrt, exportedDurationMs, videoDurationMs);
      if (job._p1Cancelled || !repairedSrt) return { status: 'cancelled' };
      await _syncRepairedRemixArtifacts(job, repairedSrt);
      acceptedSrt = repairedSrt;

      _addLog('[TTS] 🔁 Tạo lại voice lần cuối từ script đã fit duration...', 'info');
      ttsData = await _requestTts(job, acceptedSrt, voice, refAudio);
      if (ttsData?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };
      exportedDurationMs = _exportedAudioDurationMs(ttsData);
      ratio = _durationRatio(exportedDurationMs, videoDurationMs);
      _addLog(`[TTS] ⏱ Duration gate pass 2: video=${_durationSec(videoDurationMs)}, voice-export=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`, _durationInWindow(exportedDurationMs, videoDurationMs) ? 'success' : 'error');
    }

    if (!_durationInWindow(exportedDurationMs, videoDurationMs)) {
      throw new Error(`TTS duration không đạt gate sau tối đa 1 lần sửa script: video=${_durationSec(videoDurationMs)}, voice-export=${_durationSec(exportedDurationMs)}, ratio=${_durationPct(ratio)}; yêu cầu 95–100%.`);
    }

    await _persistAcceptedTts(job, ttsData);
    _selectRunningJob(job);
    if (typeof window.renderVoiceSegments === 'function' && window._appState?.pipeline1SelectedJobId === job.id) {
      window.renderVoiceSegments([{ text: 'Pipeline 1 TTS', audio_path: job.ttsAudioPath }]);
    }

    _addLog(`[TTS] ✅ Duration gate PASS: voice-export=${_durationSec(job.ttsAudioDurMs)} / video=${_durationSec(videoDurationMs)} (${_durationPct(ratio)}).`, 'success');
    _addLog(`[TTS] ✅ TTS hoàn tất: ${job.ttsAudioPath}`, 'success');
    return { status: 'ok', audio_path: job.ttsAudioPath, repairedSrt };
  } catch (error) {
    job._ttsTriggered = false;
    if (job._p1Cancelled || error?.name === 'AbortError') {
      _addLog('[TTS] ⏹ TTS đã dừng theo yêu cầu.', 'warning');
      return { status: 'cancelled' };
    }
    _rememberP1Error(job, error, 'TTS duration gate');
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
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
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

export { _durationRatio, _durationInWindow, _repairScale, _exportedAudioDurationMs };
