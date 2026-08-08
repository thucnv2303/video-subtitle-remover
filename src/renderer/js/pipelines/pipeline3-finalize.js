/**
 * Pipeline 3 — Finalize Video
 *
 * Nhận vào job đã có:
 *   job.outputPath      — video đã xóa hardsub (từ Pipeline 2)
 *   job.ttsAudioPath    — audio TTS đã tạo (từ Pipeline 1, nếu có)
 *   job.ttsTimedSrt     — SRT với timing khớp TTS (từ Pipeline 1, nếu có)
 *   job.karaokeAss      — ASS karaoke content (từ Pipeline 1, nếu có)
 *   job.voiceSub        — boolean: có burn subtitle không
 *
 * Luồng xử lý:
 *   Bước 1: Điều chỉnh tốc độ video khớp TTS (nếu cần)
 *   Bước 2: Tách vocal gốc → lấy nhạc nền (nếu bật tts-remove-vocal)
 *   Bước 3: Ghép audio TTS vào video đã xóa sub → _with_voice.mp4
 *   Bước 4: Burn subtitle lên video (nếu job.voiceSub = true) → _final.mp4
 *
 * Output: job.finalOutputPath — đường dẫn video hoàn chỉnh
 */

// ─── Main entry point ────────────────────────────────────────────────────────

/**
 * Finalize video: ghép TTS audio + burn subtitle lên video đã xóa sub.
 * @param {object} job
 */
export async function finalizeVideo(job) {
  const baseVideo = job.outputPath; // video đã xóa hardsub từ Pipeline 2
  const ttsAudio  = job.ttsAudioPath;

  if (!baseVideo) {
    _addLog('[Finalize] ❌ Chưa có video đã xóa sub — hãy chạy Pipeline 2 trước.', 'error');
    return false;
  }

  if (!ttsAudio) {
    _addLog('[Finalize] ⚠️ Chưa có audio TTS — chỉ burn subtitle (nếu bật).', 'warning');
    // Nếu không có TTS nhưng có voiceSub thì vẫn burn sub lên video gốc đã xóa sub
    if (job.voiceSub && job.ttsTimedSrt) {
      return await _burnSubOnly(job, baseVideo);
    }
    _addLog('[Finalize] ℹ️ Không có gì để finalize.', 'info');
    return false;
  }

  const removeVocal = localStorage.getItem('tts_remove_vocal') === 'true';
  let videoForMix   = baseVideo;

  _addLog('[Finalize] 🚀 Bắt đầu hoàn thiện video...', 'info');

  // ── Bước 1: Điều chỉnh tốc độ video khớp TTS ──────────────────────────────
  if (job.ttsAudioDurMs > 0) {
    _addLog('[Finalize] ⏱ Bước 1/4 — Điều chỉnh tốc độ video...', 'info');
    const tempoOut = job.filePath.replace(/\.[^.]+$/, '') + '_tempo.mp4';
    try {
      const tempoRes = await window.api.adjustVideoTempo(
        baseVideo, tempoOut, job.ttsAudioDurMs,
        1.30,  // max tăng tốc 30%
        0.80   // max giảm tốc 20%
      );
      if (tempoRes.status === 'ok' && tempoRes.adjusted) {
        videoForMix = tempoOut;
        const dir = tempoRes.speed_ratio > 1 ? 'tăng' : 'giảm';
        const pct = Math.abs((tempoRes.speed_ratio - 1) * 100).toFixed(1);
        _addLog(`[Finalize] ✅ Điều chỉnh tốc độ ${dir} ${pct}% để khớp voice.`, 'success');
      } else if (tempoRes.status === 'ok') {
        _addLog('[Finalize] ✅ Tốc độ khớp, không cần điều chỉnh.', 'info');
      } else {
        _addLog('[Finalize] ⚠️ Không điều chỉnh tốc độ: ' + (tempoRes.error || ''), 'warning');
      }
    } catch (e) {
      _addLog('[Finalize] ⚠️ Lỗi điều chỉnh tốc độ: ' + e.message + ' — tiếp tục.', 'warning');
    }
  } else {
    _addLog('[Finalize] ℹ️ Bước 1/4 — Bỏ qua điều chỉnh tốc độ (không có duration TTS).', 'info');
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
      // 3-way mix: nhạc nền đã tách + TTS (không giữ giọng gốc)
      mergeRes = await fetch(`${window.api.base}/api/mix-audio-tracks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_path:    videoForMix,
          tts_path:      ttsAudio,
          bg_audio_path: bgAudioPath,
          output_path:   videoWithVoice,
          bg_volume:     bgVol,
        }),
      }).then(r => r.json());
    } else {
      // 2-way mix: audio gốc (bgVol%) + TTS voice
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
  if (job.voiceSub && job.ttsTimedSrt) {
    const finalOutput = _getFinalOutputPath(job);
    const success = await _burnSubtitle(job, videoWithVoice, finalOutput);
    if (success) {
      job.finalOutputPath = finalOutput;
    } else {
      // Fallback: dùng video đã có voice, không có sub
      job.finalOutputPath = videoWithVoice;
      _addLog('[Finalize] ⚠️ Dùng video có voice nhưng không có subtitle.', 'warning');
    }
  } else {
    _addLog('[Finalize] ℹ️ Bước 4/4 — Bỏ qua burn subtitle.', 'info');
    job.finalOutputPath = videoWithVoice;
  }

  // Cập nhật outputPath cho job để UI hiển thị nút mở file
  job.outputPath = job.finalOutputPath;

  _addLog('[Finalize] 🎉 Hoàn tất! Video: ' + job.finalOutputPath, 'success');
  _showFinalOutputButton(job.finalOutputPath);

  // Render lại job list nếu có hàm global
  if (typeof window.renderJobList === 'function') window.renderJobList();
  if (typeof window.updateStartButton === 'function') window.updateStartButton();

  return true;
}

// ─── Burn Subtitle Only (không có TTS) ──────────────────────────────────────

async function _burnSubOnly(job, videoPath) {
  _addLog('[Finalize] 📝 Burn subtitle lên video (không có TTS)...', 'info');
  const finalOutput = _getFinalOutputPath(job);
  const success = await _burnSubtitle(job, videoPath, finalOutput);
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

async function _burnSubtitle(job, videoPath, outputPath) {
  _addLog('[Finalize] 📝 Bước 4/4 — Đang burn subtitle...', 'info');

  // Lấy style settings từ UI (Step 3)
  const cssColor  = document.getElementById('step3-color')?.value
                 || document.getElementById('sub-color')?.value
                 || '#ffffff';
  const rc  = cssColor.slice(1,3);
  const gc  = cssColor.slice(3,5);
  const bc  = cssColor.slice(5,7);
  const styleArgs = {
    font_name:     document.getElementById('step3-font')?.value
                || document.getElementById('sub-font')?.value
                || 'Arial',
    font_size:     parseInt(document.getElementById('step3-size')?.value
                || document.getElementById('sub-size')?.value
                || '24'),
    primary_color: `&H00${bc}${gc}${rc}`.toUpperCase(),
  };

  // Tính vị trí subtitle từ regions của job hoặc dùng detect
  let subPositions = [];
  let videoMeta    = {};
  try {
    if (job.regions?.length > 0 && window._appState?.videoInfo) {
      const info = window._appState.videoInfo;
      videoMeta = { video_height: info.height, video_width: info.width };
      subPositions = job.regions.map(r => {
        const yCenter = (r.ymin + r.ymax) / 2 / info.height;
        let alignment = 2, margin_v = 15;
        if (yCenter < 0.4)       { alignment = 8; margin_v = Math.round(r.ymin * 0.8); }
        else if (yCenter < 0.65) { alignment = 5; margin_v = 0; }
        else                     { alignment = 2; margin_v = Math.round((info.height - r.ymax) * 0.8); }
        return {
          start_ms:  r.startFrame / (info.fps || 25) * 1000,
          end_ms:    r.endFrame   / (info.fps || 25) * 1000,
          position:  alignment === 8 ? 'top' : alignment === 5 ? 'middle' : 'bottom',
          alignment,
          margin_v:  Math.max(5, margin_v),
        };
      });
      _addLog(`[Finalize] 📍 Lấy vị trí từ ${job.regions.length} vùng đã vẽ.`, 'success');
    } else {
      // Thử detect sub positions với sample step lớn để nhanh
      const posRes = await window.api.detectSubPositions(job.filePath, 60);
      if (posRes.status === 'ok' && posRes.positions?.length > 0) {
        subPositions = posRes.positions;
        videoMeta    = { video_height: posRes.video_height, video_width: posRes.video_width };
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
      job.ttsTimedSrt,
      outputPath,
      subPositions,
      { ...styleArgs, ...videoMeta },
      job.karaokeAss || null
    );

    if (subRes.status === 'ok') {
      const extra = subRes.styles_used > 1 ? ` (${subRes.styles_used} vị trí)` : '';
      _addLog(`[Finalize] ✅ Burn subtitle thành công${extra}!`, 'success');
      return true;
    } else {
      _addLog('[Finalize] ❌ Burn subtitle thất bại: ' + (subRes.error || 'Unknown'), 'error');
      return false;
    }
  } catch (e) {
    _addLog('[Finalize] ❌ Lỗi burn subtitle: ' + e.message, 'error');
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _getFinalOutputPath(job) {
  // Luôn tính từ filePath gốc để tránh _final_final_final
  return job.filePath.replace(/\.[^.]+$/, '') + '_final.mp4';
}

function _showFinalOutputButton(filePath) {
  if (!window.electronAPI?.openPath) return;
  const existing = document.getElementById('btn-open-final-output');
  if (existing) existing.remove();
  const btn = document.createElement('button');
  btn.id        = 'btn-open-final-output';
  btn.className = 'btn btn-accent btn-block';
  btn.style.marginTop = '8px';
  btn.innerHTML = '📂 Mở video hoàn chỉnh (_final.mp4)';
  btn.onclick   = () => window.electronAPI.openPath(filePath);
  const progressSection = document.getElementById('progress-section');
  if (progressSection) progressSection.appendChild(btn);
}

function _addLog(msg, type) {
  if (typeof window.addLog === 'function') window.addLog(msg, type);
  else console.log(`[${type}] ${msg}`);
}
