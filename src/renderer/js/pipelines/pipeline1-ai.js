import '../pipeline-state.js';
import '../pipeline1-run-config.js';
import '../pipeline1-artifact-gate.js';
import { runPipeline1MultimodalAnalysis } from '../pipeline1-analysis.js';

/**
 * Pipeline 1 analysis + remix + TTS.
 * P1 must fail when required analysis/artifacts/TTS fail.
 */

function _selectRunningJob(job) {
  const state = window._appState;
  if (!state || !job) return;
  state.pipeline1SelectedJobId = job.id;
  state.activeJobId = job.id;
  window.renderJobDetail1?.();
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
    const aiText = result.rewrittenSrt;
    if (!aiText?.includes('-->')) throw new Error('Remix script không có timing SRT hợp lệ.');

    job.aiContent = aiText;
    job.remixSrt = aiText;
    job._aiTriggered = true;
    _selectRunningJob(job);

    const elAiContent = document.getElementById('ai-content');
    if (elAiContent) elAiContent.value = aiText;
    const detailText = document.getElementById('step1-detail-text');
    if (detailText) detailText.value = aiText;

    if (job.ttsGenerate) {
      const ttsResult = await triggerAutoTts(job, aiText);
      if (ttsResult?.status === 'cancelled' || job._p1Cancelled) return { status: 'cancelled' };
    }

    job.p1ArtifactsReady = true;
    job._p1StopRequested = false;
    _selectRunningJob(job);
    _addLog('[P1] ✅ Analysis/remix artifacts đã sẵn sàng.', 'success');
    return { status: 'ok', result: aiText, analysis: result.analysis, artifacts: result.bundle };
  } catch (error) {
    job.p1ArtifactsReady = false;
    if (job._p1Cancelled || error?.name === 'AbortError') {
      _addLog('[P1] ⏹ Pipeline 1 đã dừng theo yêu cầu.', 'warning');
      return { status: 'cancelled' };
    }
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
    if (job._p1Cancelled) {
      _addLog('[TTS] ⏹ Đã dừng sau khi request TTS hiện tại kết thúc an toàn.', 'warning');
      return { status: 'cancelled' };
    }
    if (!ttsRes.ok) throw new Error(`TTS HTTP ${ttsRes.status}`);

    const ttsData = await ttsRes.json();
    if (job._p1Cancelled) return { status: 'cancelled' };
    if (ttsData.status !== 'ok' || !ttsData.audio_path) {
      throw new Error(ttsData.error || 'TTS không trả về audio hợp lệ.');
    }

    job.ttsAudioPath = ttsData.audio_path;
    if (job.p1ArtifactDir && window.electronAPI?.persistP1Audio) {
      const persisted = await window.electronAPI.persistP1Audio({ source_path: job.ttsAudioPath, artifact_dir: job.p1ArtifactDir });
      if (!persisted?.ok || !persisted?.audio_path) throw new Error(persisted?.error || 'Không thể lưu audio TTS vào P1 artifacts.');
      job.ttsAudioPath = persisted.audio_path;
      job.p1ArtifactPaths = job.p1ArtifactPaths || {};
      job.p1ArtifactPaths.voice = persisted.audio_path;
    }
    job.ttsTimedSrt = ttsData.srt_content || _buildTimedSrt(srtText, job.srtContent);
    job.ttsAudioDurMs = ttsData.audio_duration_ms || 0;
    job.ttsSegmentsTiming = ttsData.segments_timing || [];
    job.karaokeAss = ttsData.karaoke_ass || null;
    job._ttsTriggered = true;

    if (job.p1ArtifactDir && job.ttsTimedSrt) {
      const save = await window.api.writeFile(`${job.p1ArtifactDir}/tts_timed.srt`, job.ttsTimedSrt);
      if (save?.status === 'error') throw new Error(save.error || 'Không lưu được tts_timed.srt.');
      job.p1ArtifactPaths = job.p1ArtifactPaths || {};
      job.p1ArtifactPaths['tts_timed.srt'] = `${job.p1ArtifactDir}/tts_timed.srt`;
    }

    _selectRunningJob(job);
    if (typeof window.renderVoiceSegments === 'function') {
      window.renderVoiceSegments([{ text: 'Pipeline 1 TTS', audio_path: job.ttsAudioPath }]);
    }

    _addLog(`[TTS] ✅ TTS hoàn tất: ${job.ttsAudioPath}`, 'success');
    return { status: 'ok', audio_path: job.ttsAudioPath };
  } catch (error) {
    if (job._p1Cancelled || error?.name === 'AbortError') {
      _addLog('[TTS] ⏹ TTS đã dừng theo yêu cầu.', 'warning');
      return { status: 'cancelled' };
    }
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
