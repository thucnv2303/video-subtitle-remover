/**
 * Pipeline 3 — Finalize Video
 *
 * Nhận vào job đã có:
 *   job.outputPath      — video đã xóa hardsub (từ Pipeline 2)
 *   job.ttsAudioPath    — audio TTS gốc từ Pipeline 1
 *   job.ttsTimedSrt     — SRT timing theo voice Pipeline 1
 *   job.karaokeAss      — ASS karaoke content (nếu có)
 *   job.voiceSub        — boolean: có burn subtitle không
 *
 * Luồng xử lý:
 *   Bước 1: Giữ nguyên tốc độ video; fit voice có giới hạn nếu mismatch vừa phải
 *   Bước 2: Tách vocal gốc → lấy nhạc nền (nếu bật tts-remove-vocal)
 *   Bước 3: Ghép audio TTS/P3-derived voice vào clean video
 *   Bước 4: Burn subtitle theo timing của voice thực tế
 *
 * Output: job.finalOutputPath — đường dẫn video hoàn chỉnh
 */

const P3_VOICE_FIT_MIN_RATIO = 0.90;
const P3_VOICE_FIT_MAX_RATIO = 1.15;
const P3_VOICE_NOOP_DELTA = 0.005;

function _durationPct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function _durationSec(valueMs) {
  return `${(Number(valueMs || 0) / 1000).toFixed(2)}s`;
}

function _p3ArtifactDir(job) {
  const p1Dir = String(job?.p1ArtifactDir || '').trim().replace(/[\\/]+$/, '');
  if (!p1Dir) return '';
  const parent = p1Dir.replace(/[\\/]+p1$/i, '');
  const sep = p1Dir.includes('\\') ? '\\' : '/';
  return `${parent}${sep}p3`;
}

function _srtTimeToMs(value) {
  const match = String(value || '').match(/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/);
  if (!match) return null;
  return (
    Number(match[1]) * 3600000
    + Number(match[2]) * 60000
    + Number(match[3]) * 1000
    + Number(match[4])
  );
}

function _msToSrtTime(ms) {
  const safe = Math.max(0, Math.round(Number(ms) || 0));
  const h = Math.floor(safe / 3600000);
  const m = Math.floor((safe % 3600000) / 60000);
  const s = Math.floor((safe % 60000) / 1000);
  const mil = safe % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(mil).padStart(3, '0')}`;
}

function _scaleTimedSrt(srtText, scale) {
  const safeScale = Number(scale);
  if (!String(srtText || '').trim() || !Number.isFinite(safeScale) || safeScale <= 0) return String(srtText || '');
  return String(srtText).replace(
    /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/g,
    (full, start, end) => {
      const startMs = _srtTimeToMs(start.replace('.', ','));
      const endMs = _srtTimeToMs(end.replace('.', ','));
      if (startMs == null || endMs == null) return full;
      return `${_msToSrtTime(startMs * safeScale)} --> ${_msToSrtTime(endMs * safeScale)}`;
    }
  );
}

async function _prepareP3Voice(job, baseVideo, p1Audio) {
  const originalVoiceMs = Number(job?.ttsAudioDurMs) || 0;
  if (!(originalVoiceMs > 0)) {
    _addLog('[Finalize] ℹ️ Không có duration TTS P1 — giữ nguyên voice, không auto-fit.', 'info');
    return { ok: true, audioPath: p1Audio, timedSrt: job.ttsTimedSrt, durationMs: 0, tempo: 1 };
  }

  const info = await window.api.videoInfo(baseVideo);
  const videoDurationMs = (Number(info?.duration) || 0) * 1000;
  if (!(videoDurationMs > 0)) {
    return { ok: false, error: 'Không đọc được duration clean video để fit voice ở Pipeline 3.' };
  }

  const ratio = originalVoiceMs / videoDurationMs;
  _addLog(`[Finalize] ⏱ Voice-fit telemetry: video=${_durationSec(videoDurationMs)}, P1 voice=${_durationSec(originalVoiceMs)}, ratio=${_durationPct(ratio)}.`, 'info');

  if (ratio < P3_VOICE_FIT_MIN_RATIO) {
    _addLog(`[Finalize] ℹ️ Voice ngắn (${_durationPct(ratio)} < ${_durationPct(P3_VOICE_FIT_MIN_RATIO)}): giữ tốc độ tự nhiên; phần timeline còn lại dùng hình/nhạc/nền.`, 'info');
    return { ok: true, audioPath: p1Audio, timedSrt: job.ttsTimedSrt, durationMs: originalVoiceMs, tempo: 1 };
  }

  if (ratio > P3_VOICE_FIT_MAX_RATIO) {
    return {
      ok: false,
      error: `Voice dài ${_durationPct(ratio)} so với final video; vượt giới hạn auto-fit ${_durationPct(P3_VOICE_FIT_MAX_RATIO)}. Cần sửa narration/edit plan thay vì ép tốc độ giọng.`,
    };
  }

  if (Math.abs(ratio - 1) <= P3_VOICE_NOOP_DELTA) {
    _addLog('[Finalize] ✅ Voice gần khớp final video; không cần retime.', 'success');
    return { ok: true, audioPath: p1Audio, timedSrt: job.ttsTimedSrt, durationMs: originalVoiceMs, tempo: 1 };
  }

  const artifactDir = _p3ArtifactDir(job);
  if (!artifactDir) {
    return { ok: false, error: 'Không xác định được thư mục artifact P3 để tạo derived voice mà không ghi đè P1.' };
  }
  if (!window.electronAPI?.prepareP1NarrationAudio) {
    return { ok: false, error: 'Bridge pitch-preserving audio tempo chưa sẵn sàng cho Pipeline 3.' };
  }

  const prepared = await window.electronAPI.prepareP1NarrationAudio({
    source_path: p1Audio,
    artifact_dir: artifactDir,
    speed: ratio,
  });
  if (!prepared?.ok || !prepared?.audio_path || !(Number(prepared.duration_ms) > 0)) {
    return { ok: false, error: prepared?.error || 'Không tạo được derived voice Pipeline 3.' };
  }

  const adjustedDurationMs = Number(prepared.duration_ms);
  const timingScale = adjustedDurationMs / originalVoiceMs;
  let timedSrt = job.ttsTimedSrt;
  if (timedSrt) {
    timedSrt = _scaleTimedSrt(timedSrt, timingScale);
    const sep = artifactDir.includes('\\') ? '\\' : '/';
    const srtPath = `${artifactDir}${sep}tts_timed.srt`;
    const save = await window.api.writeFile(srtPath, timedSrt);
    if (save?.status === 'error') {
      return { ok: false, error: save.error || 'Không lưu được subtitle timing của derived voice P3.' };
    }
    job.p3TimedSrt = timedSrt;
    job.p3TimedSrtPath = srtPath;
  }

  job.p3VoiceAudioPath = prepared.audio_path;
  job.p3VoiceDurMs = adjustedDurationMs;
  job.p3VoiceTempo = ratio;

  _addLog(
    `[Finalize] ✅ Derived voice P3: tempo=${ratio.toFixed(4)}x, ${_durationSec(originalVoiceMs)} → ${_durationSec(adjustedDurationMs)}; P1 voice.wav không bị ghi đè.`,
    'success'
  );
  return {
    ok: true,
    audioPath: prepared.audio_path,
    timedSrt,
    durationMs: adjustedDurationMs,
    tempo: ratio,
  };
}

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Finalize video: ghép TTS audio + burn subtitle lên video đã xóa sub.
 * @param {object} job
 */
export async function finalizeVideo(job) {
  const baseVideo = job.outputPath; // video đã xóa hardsub từ Pipeline 2
  let ttsAudio = job.ttsAudioPath;
  let timedSrt = job.ttsTimedSrt;

  if (!baseVideo) {
    _addLog('[Finalize] ❌ Chưa có video đã xóa sub — hãy chạy Pipeline 2 trước.', 'error');
    return false;
  }

  if (!ttsAudio) {
    _addLog('[Finalize] ⚠️ Chưa có audio TTS — chỉ burn subtitle (nếu bật).', 'warning');
    if (job.voiceSub && job.ttsTimedSrt) {
      return await _burnSubOnly(job, baseVideo);
    }
    _addLog('[Finalize] ℹ️ Không có gì để finalize.', 'info');
    return false;
  }

  const removeVocal = localStorage.getItem('tts_remove_vocal') === 'true';
  const videoForMix = baseVideo;

  _addLog('[Finalize] 🚀 Bắt đầu hoàn thiện video...', 'info');

  // ── Bước 1: Giữ video, fit derived voice có giới hạn ──────────────────────
  _addLog('[Finalize] ⏱ Bước 1/4 — Kiểm tra duration voice trên final timeline...', 'info');
  try {
    const voiceFit = await _prepareP3Voice(job, baseVideo, ttsAudio);
    if (!voiceFit.ok) {
      _addLog('[Finalize] ❌ Voice-fit bị chặn: ' + voiceFit.error, 'error');
      return false;
    }
    ttsAudio = voiceFit.audioPath;
    timedSrt = voiceFit.timedSrt || timedSrt;
  } catch (e) {
    _addLog('[Finalize] ❌ Lỗi voice-fit: ' + e.message, 'error');
    return false;
  }

  // ── Bước 2: Tách vocal gốc → lấy nhạc nền (optional) ─────────────────────
  let bgAudioPath = null;
  if (removeVocal) {
    _addLog('[Finalize] 🎵 Bước 2/4 — Đang tách vocal gốc, giữ nhạc nền...', 'info');
    try {
      const vocalRes = await window.api.removeVocal(job.filePath);
      if (vocalRes.status === 'ok' || vocalRes.status === 'warning') {
        bgAudioPath = vocalRes.audio_path;
        _addLog(`[Finalize] ✅ Tách vocal xong (${vocalRes.method_used})${vocalRes.message ? ': ' + vocalRes.message : ''}.`, 'success');
      } else {
        _addLog('[Finalize] ⚠️ Tách vocal thất bại: ' + vocalRes.error + ' — dùng audio gốc.', 'warning');
      }
    } catch (e) {
      _addLog('[Finalize] ⚠️ Lỗi tách vocal: ' + e.message + ' — dùng audio gốc.', 'warning');
    }
  } else {
    _addLog('[Finalize] ℹ️ Bước 2/4 — Bỏ qua tách vocal.', 'info');
  }

  // ── Bước 3: Ghép audio TTS vào video ──────────────────────────────────────
  _addLog('[Finalize] 🔊 Bước 3/4 — Đang ghép âm thanh vào video...', 'info');

  const videoWithVoice = job.filePath.replace(/\.[^.]+$/, '') + '_with_voice.mp4';
  const bgVol = parseInt(localStorage.getItem('tts_bg_volume') || '10');

  let mergeRes;
  try {
    if (bgAudioPath) {
      mergeRes = await fetch(`${window.api.base}/api/mix-audio-tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_path: videoForMix,
          tts_path: ttsAudio,
          bg_audio_path: bgAudioPath,
          output_path: videoWithVoice,
          bg_volume: bgVol,
        }),
      }).then(r => r.json());
    } else {
      mergeRes = await window.api.replaceAudio(videoForMix, ttsAudio, videoWithVoice, bgVol);
    }
  } catch (e) {
    _addLog('[Finalize] ❌ Lỗi ghép audio: ' + e.message, 'error');
    return false;
  }

  if (!mergeRes || mergeRes.status !== 'ok') {
    _addLog('[Finalize] ❌ Ghép audio thất bại: ' + (mergeRes?.error || 'Unknown'), 'error');
    return false;
  }
  _addLog('[Finalize] ✅ Ghép audio thành công!', 'success');

  // ── Bước 4: Burn subtitle lên video (nếu bật) ──────────────────────────────
  if (job.voiceSub && timedSrt) {
    const finalOutput = _getFinalOutputPath(job);
    const success = await _burnSubtitle(job, videoWithVoice, finalOutput, timedSrt);
    if (success) {
      job.finalOutputPath = finalOutput;
    } else {
      job.finalOutputPath = videoWithVoice;
      _addLog('[Finalize] ⚠️ Dùng video có voice nhưng không có subtitle.', 'warning');
    }
  } else {
    _addLog('[Finalize] ℹ️ Bước 4/4 — Bỏ qua burn subtitle.', 'info');
    job.finalOutputPath = videoWithVoice;
  }

  job.outputPath = job.finalOutputPath;

  _addLog('[Finalize] 🎉 Hoàn tất! Video: ' + job.finalOutputPath, 'success');
  _showFinalOutputButton(job.finalOutputPath);

  if (typeof window.renderJobList === 'function') window.renderJobList();
  if (typeof window.updateStartButton === 'function') window.updateStartButton();

  return true;
}

// ─── Burn Subtitle Only (không có TTS) ──────────────────────────────────────

async function _burnSubOnly(job, videoPath) {
  _addLog('[Finalize] 📝 Burn subtitle lên video (không có TTS)...', 'info');
  const finalOutput = _getFinalOutputPath(job);
  const success = await _burnSubtitle(job, videoPath, finalOutput, job.ttsTimedSrt);
  if (success) {
    job.finalOutputPath = finalOutput;
    job.outputPath = finalOutput;
    _showFinalOutputButton(finalOutput);
    if (typeof window.renderJobList === 'function') window.renderJobList();
    return true;
  }
  return false;
}

// ─── Burn Subtitle Helper ────────────────────────────────────────────────────

async function _burnSubtitle(job, videoPath, outputPath, srtContent = job.ttsTimedSrt) {
  _addLog('[Finalize] 📝 Bước 4/4 — Đang burn subtitle...', 'info');

  const cssColor = document.getElementById('step3-color')?.value
                 || document.getElementById('sub-color')?.value
                 || '#ffffff';
  const rc = cssColor.slice(1, 3);
  const gc = cssColor.slice(3, 5);
  const bc = cssColor.slice(5, 7);
  const styleArgs = {
    font_name: document.getElementById('step3-font')?.value
                || document.getElementById('sub-font')?.value
                || 'Arial',
    font_size: parseInt(document.getElementById('step3-size')?.value
                || document.getElementById('sub-size')?.value
                || '24'),
    primary_color: `&H00${bc}${gc}${rc}`.toUpperCase(),
  };

  let subPositions = [];
  let videoMeta = {};
  try {
    if (job.regions?.length > 0 && window._appState?.videoInfo) {
      const info = window._appState.videoInfo;
      videoMeta = { video_height: info.height, video_width: info.width };
      subPositions = job.regions.map(r => {
        const yCenter = (r.ymin + r.ymax) / 2 / info.height;
        let alignment = 2, margin_v = 15;
        if (yCenter < 0.4) { alignment = 8; margin_v = Math.round(r.ymin * 0.8); }
        else if (yCenter < 0.65) { alignment = 5; margin_v = 0; }
        else { alignment = 2; margin_v = Math.round((info.height - r.ymax) * 0.8); }
        return {
          start_ms: r.startFrame / (info.fps || 25) * 1000,
          end_ms: r.endFrame / (info.fps || 25) * 1000,
          position: alignment === 8 ? 'top' : alignment === 5 ? 'middle' : 'bottom',
          alignment,
          margin_v: Math.max(5, margin_v),
        };
      });
      _addLog(`[Finalize] 📍 Lấy vị trí từ ${job.regions.length} vùng đã vẽ.`, 'success');
    } else {
      const posRes = await window.api.detectSubPositions(job.filePath, 60);
      if (posRes.status === 'ok' && posRes.positions?.length > 0) {
        subPositions = posRes.positions;
        videoMeta = { video_height: posRes.video_height, video_width: posRes.video_width };
        _addLog(`[Finalize] 📍 Phát hiện ${subPositions.length} vùng subtitle.`, 'success');
      } else {
        _addLog('[Finalize] ⚠️ Không phát hiện vùng → dùng vị trí mặc định (dưới).', 'warning');
      }
    }
  } catch (e) {
    _addLog('[Finalize] ⚠️ Bỏ qua detect vị trí: ' + e.message, 'warning');
  }

  try {
    const subRes = await window.api.burnSubtitlePositioned(
      videoPath,
      srtContent,
      outputPath,
      subPositions,
      { ...styleArgs, ...videoMeta },
      job.karaokeAss || null
    );

    if (subRes.status === 'ok') {
      const extra = subRes.styles_used > 1 ? ` (${subRes.styles_used} vị trí)` : '';
      _addLog(`[Finalize] ✅ Burn subtitle thành công${extra}!`, 'success');
      return true;
    }
    _addLog('[Finalize] ❌ Burn subtitle thất bại: ' + (subRes.error || 'Unknown'), 'error');
    return false;
  } catch (e) {
    _addLog('[Finalize] ❌ Lỗi burn subtitle: ' + e.message, 'error');
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _getFinalOutputPath(job) {
  return job.filePath.replace(/\.[^.]+$/, '') + '_final.mp4';
}

function _showFinalOutputButton(filePath) {
  if (!window.electronAPI?.openPath) return;
  const existing = document.getElementById('btn-open-final-output');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.id = 'btn-open-final-output';
  btn.className = 'btn btn-accent btn-block';
  btn.style.marginTop = '8px';
  btn.innerHTML = '📂 Mở video hoàn chỉnh (_final.mp4)';
  btn.onclick = () => window.electronAPI.openPath(filePath);
  const progressSection = document.getElementById('progress-section');
  if (progressSection) progressSection.appendChild(btn);
}

function _addLog(msg, type) {
  if (typeof window.addLog === 'function') window.addLog(msg, type);
  else console.log(`[${type}] ${msg}`);
}

export {
  _scaleTimedSrt,
  _prepareP3Voice,
};