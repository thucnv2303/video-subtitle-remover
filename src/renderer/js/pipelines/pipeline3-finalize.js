import { planP3Fit } from '../pipeline3/fit-planner.js';

/**
 * Pipeline 3 — focused final composition.
 * P1 artifacts and P2 clean video stay immutable; P3 creates derived media only.
 */

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
  return Number(match[1]) * 3600000 + Number(match[2]) * 60000 + Number(match[3]) * 1000 + Number(match[4]);
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

async function _prepareP3Voice(job, p1Audio, sourceTimedSrt, plan) {
  const originalVoiceMs = Number(job?.ttsAudioDurMs) || 0;
  const requestedSpeed = Number(plan?.voiceSpeed) || 1;
  if (!(originalVoiceMs > 0) || Math.abs(requestedSpeed - 1) < 0.001) {
    return { ok: true, audioPath: p1Audio, timedSrt: sourceTimedSrt, durationMs: originalVoiceMs, tempo: 1 };
  }

  const artifactDir = _p3ArtifactDir(job);
  if (!artifactDir) return { ok: false, error: 'Không xác định được thư mục artifact P3 để tạo derived voice.' };
  if (!window.electronAPI?.prepareP1NarrationAudio) return { ok: false, error: 'Bridge pitch-preserving voice tempo chưa sẵn sàng.' };

  const prepared = await window.electronAPI.prepareP1NarrationAudio({
    source_path: p1Audio,
    artifact_dir: artifactDir,
    speed: requestedSpeed,
  });
  if (!prepared?.ok || !prepared?.audio_path || !(Number(prepared.duration_ms) > 0)) {
    return { ok: false, error: prepared?.error || 'Không tạo được derived voice P3.' };
  }

  const adjustedDurationMs = Number(prepared.duration_ms);
  const timingScale = adjustedDurationMs / originalVoiceMs;
  let timedSrt = sourceTimedSrt;
  if (timedSrt) {
    timedSrt = _scaleTimedSrt(timedSrt, timingScale);
    const sep = artifactDir.includes('\\') ? '\\' : '/';
    const srtPath = `${artifactDir}${sep}tts_timed.srt`;
    const save = await window.api.writeFile(srtPath, timedSrt);
    if (save?.status === 'error') return { ok: false, error: save.error || 'Không lưu được P3 timed SRT.' };
    job.p3TimedSrt = timedSrt;
    job.p3TimedSrtPath = srtPath;
  }

  job.p3VoiceAudioPath = prepared.audio_path;
  job.p3VoiceDurMs = adjustedDurationMs;
  job.p3VoiceTempo = requestedSpeed;
  _addLog(`[Finalize] ✅ Voice tempo ${requestedSpeed.toFixed(4)}x: ${_durationSec(originalVoiceMs)} → ${_durationSec(adjustedDurationMs)}.`, 'success');
  return { ok: true, audioPath: prepared.audio_path, timedSrt, durationMs: adjustedDurationMs, tempo: requestedSpeed };
}

async function _prepareP3Video(job, baseVideo, videoInfo, plan, bgVolume) {
  const requestedSpeed = Number(plan?.videoSpeed) || 1;
  if (Math.abs(requestedSpeed - 1) < 0.02) {
    return { ok: true, videoPath: baseVideo, durationMs: Number(videoInfo?.duration || 0) * 1000, tempo: 1, adjusted: false };
  }

  // Current backend tempo endpoint removes source audio. Until the narrow backend
  // amendment is landed, do not silently destroy a requested background/original mix.
  if (Number(bgVolume) > 0) {
    return {
      ok: false,
      error: 'Video retime hiện chưa thể giữ audio nền đồng bộ khi âm lượng nền > 0. Hãy đặt nền = 0 hoặc dùng Fit Voice/Natural cho build này.',
    };
  }

  const sourceDurationMs = Number(videoInfo?.duration || 0) * 1000;
  if (!(sourceDurationMs > 0)) return { ok: false, error: 'Không đọc được duration clean video.' };
  const outputPath = String(baseVideo).replace(/\.[^.]+$/, '') + '_p3_tempo.mp4';
  const targetDurationMs = sourceDurationMs / requestedSpeed;
  const res = await window.api.adjustVideoTempo(baseVideo, outputPath, targetDurationMs, requestedSpeed, requestedSpeed);
  if (!res || res.status !== 'ok' || !res.output_path) return { ok: false, error: res?.error || 'Không retime được video P3.' };
  job.p3VideoTempoPath = res.output_path;
  job.p3VideoTempo = Number(res.speed_ratio) || requestedSpeed;
  const durationMs = sourceDurationMs / job.p3VideoTempo;
  _addLog(`[Finalize] ✅ Video tempo ${job.p3VideoTempo.toFixed(4)}x: ${_durationSec(sourceDurationMs)} → ~${_durationSec(durationMs)}.`, 'success');
  return { ok: true, videoPath: res.output_path, durationMs, tempo: job.p3VideoTempo, adjusted: Boolean(res.adjusted) };
}

export async function finalizeVideo(job) {
  const baseVideo = job.p3CleanVideoPath || job.outputPath;
  let ttsAudio = job.ttsAudioPath;
  let timedSrt = job.p3TimedSrt || job.ttsTimedSrt;
  if (!baseVideo) {
    _addLog('[Finalize] ❌ Chưa có clean video từ Pipeline 2.', 'error');
    return false;
  }

  if (!ttsAudio) {
    _addLog('[Finalize] ⚠️ Không có TTS; chỉ burn subtitle nếu được bật.', 'warning');
    if (job.voiceSub && timedSrt) return _burnSubOnly(job, baseVideo, timedSrt);
    return false;
  }

  const config = job.p3Config || {};
  const bgVol = Math.max(0, Math.min(100, Number(config.bgVolume ?? localStorage.getItem('tts_bg_volume') ?? 10)));
  const removeVocal = Boolean(config.removeVocal ?? (localStorage.getItem('tts_remove_vocal') === 'true'));
  const info = await window.api.videoInfo(baseVideo);
  const videoDurationMs = Number(info?.duration || 0) * 1000;
  const voiceDurationMs = Number(job.ttsAudioDurMs) || 0;
  const plan = planP3Fit(videoDurationMs, voiceDurationMs, config.fitMode || 'auto');
  job.p3FitPlan = plan;
  if (!plan.ok) {
    _addLog('[Finalize] ❌ Fit bị chặn: ' + plan.reason, 'error');
    return false;
  }

  _addLog(`[Finalize] 🚀 P3 final: strategy=${plan.selectedStrategy || plan.mode}; voice=${plan.voiceSpeed.toFixed(3)}x; video=${plan.videoSpeed.toFixed(3)}x.`, 'info');

  let videoFit;
  try {
    videoFit = await _prepareP3Video(job, baseVideo, info, plan, bgVol);
    if (!videoFit.ok) throw new Error(videoFit.error);
  } catch (e) {
    _addLog('[Finalize] ❌ Video-fit: ' + e.message, 'error');
    return false;
  }
  const videoForMix = videoFit.videoPath;

  try {
    const voiceFit = await _prepareP3Voice(job, ttsAudio, timedSrt, plan);
    if (!voiceFit.ok) throw new Error(voiceFit.error);
    ttsAudio = voiceFit.audioPath;
    timedSrt = voiceFit.timedSrt || timedSrt;
  } catch (e) {
    _addLog('[Finalize] ❌ Voice-fit: ' + e.message, 'error');
    return false;
  }

  let bgAudioPath = null;
  if (removeVocal && bgVol > 0) {
    _addLog('[Finalize] 🎵 Tách giọng gốc để giữ nền...', 'info');
    try {
      const vocalRes = await window.api.removeVocal(videoForMix);
      if (vocalRes.status === 'ok' || vocalRes.status === 'warning') bgAudioPath = vocalRes.audio_path;
      else _addLog('[Finalize] ⚠️ Tách vocal thất bại; dùng audio gốc nếu có.', 'warning');
    } catch (e) {
      _addLog('[Finalize] ⚠️ Tách vocal lỗi; dùng audio gốc nếu có: ' + e.message, 'warning');
    }
  }

  const videoWithVoice = job.filePath.replace(/\.[^.]+$/, '') + '_with_voice.mp4';
  let mergeRes;
  try {
    if (bgAudioPath) {
      mergeRes = await fetch(`${window.api.base}/api/mix-audio-tracks`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_path: videoForMix, tts_path: ttsAudio, bg_audio_path: bgAudioPath, output_path: videoWithVoice, bg_volume: bgVol }),
      }).then(r => r.json());
    } else {
      mergeRes = await window.api.replaceAudio(videoForMix, ttsAudio, videoWithVoice, bgVol);
    }
  } catch (e) {
    _addLog('[Finalize] ❌ Ghép audio lỗi: ' + e.message, 'error');
    return false;
  }
  if (!mergeRes || mergeRes.status !== 'ok') {
    _addLog('[Finalize] ❌ Ghép audio thất bại: ' + (mergeRes?.error || 'Unknown'), 'error');
    return false;
  }

  if (job.voiceSub && timedSrt) {
    const finalOutput = _getFinalOutputPath(job);
    const success = await _burnSubtitle(job, videoWithVoice, finalOutput, timedSrt);
    job.finalOutputPath = success ? finalOutput : videoWithVoice;
    if (!success) _addLog('[Finalize] ⚠️ Dùng video có voice nhưng subtitle burn thất bại.', 'warning');
  } else {
    job.finalOutputPath = videoWithVoice;
  }

  job.outputPath = job.finalOutputPath;
  _addLog('[Finalize] 🎉 Hoàn tất! Video: ' + job.finalOutputPath, 'success');
  _showFinalOutputButton(job.finalOutputPath);
  window.renderJobList?.();
  window.updateStartButton?.();
  return true;
}

async function _burnSubOnly(job, videoPath, timedSrt) {
  const finalOutput = _getFinalOutputPath(job);
  const success = await _burnSubtitle(job, videoPath, finalOutput, timedSrt);
  if (!success) return false;
  job.finalOutputPath = finalOutput;
  job.outputPath = finalOutput;
  _showFinalOutputButton(finalOutput);
  window.renderJobList?.();
  return true;
}

async function _burnSubtitle(job, videoPath, outputPath, srtContent) {
  _addLog('[Finalize] 📝 Burn subtitle final...', 'info');
  const config = job.p3Config || {};
  const cssColor = config.textColor || '#ffffff';
  const rc=cssColor.slice(1,3),gc=cssColor.slice(3,5),bc=cssColor.slice(5,7);
  const info = job.p3VideoInfo || await window.api.videoInfo(videoPath).catch(() => ({}));
  try {
    const subRes = await window.api.burnSubtitlePositioned(
      videoPath,
      srtContent,
      outputPath,
      [],
      {
        font_name: config.fontFamily || 'Arial',
        font_size: Math.round(Number(config.fontSize) || 46),
        primary_color: `&H00${bc}${gc}${rc}`.toUpperCase(),
        video_height: Number(info?.height) || 0,
        video_width: Number(info?.width) || 0,
      },
      job.karaokeAss || null
    );
    if (subRes?.status === 'ok') {
      _addLog('[Finalize] ✅ Burn subtitle thành công.', 'success');
      return true;
    }
    _addLog('[Finalize] ❌ Burn subtitle thất bại: ' + (subRes?.error || 'Unknown'), 'error');
    return false;
  } catch (e) {
    _addLog('[Finalize] ❌ Burn subtitle lỗi: ' + e.message, 'error');
    return false;
  }
}

function _getFinalOutputPath(job) {
  return job.filePath.replace(/\.[^.]+$/, '') + '_final.mp4';
}

function _showFinalOutputButton(filePath) {
  if (!window.electronAPI?.openPath) return;
  document.getElementById('btn-open-final-output')?.remove();
  const btn=document.createElement('button');
  btn.id='btn-open-final-output';btn.className='btn btn-accent btn-block';btn.style.marginTop='8px';btn.textContent='📂 Mở video hoàn chỉnh (_final.mp4)';btn.onclick=()=>window.electronAPI.openPath(filePath);
  document.getElementById('progress-section')?.appendChild(btn);
}

function _addLog(msg,type){if(typeof window.addLog==='function')window.addLog(msg,type);else console.log(`[${type}] ${msg}`);}

export { _scaleTimedSrt, _prepareP3Voice, _prepareP3Video };
