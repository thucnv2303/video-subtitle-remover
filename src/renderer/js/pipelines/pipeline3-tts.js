import { $, $$, el } from '../utils/dom.js';
import { state, saveState } from '../store.js';
import { addLog, showToast } from '../utils/logger.js';

export async function triggerAutoTts(job, srtText) {
    const voice = job.ttsVoice || localStorage.getItem('tts_voice') || 'none';
    if (!voice || voice === 'none') {
      addLog('[TTS] ⚠️ Chưa chọn giọng — bỏ qua auto TTS.', 'warning');
      return;
    }
    // Chống chạy 2 lần đồng thời
    if (job._ttsRunning) {
      addLog('[TTS] ℹ️ Pipeline TTS đang chạy, bỏ qua trigger thứ 2.', 'info');
      return;
    }
    job._ttsRunning = true;

    const btnRetry = document.getElementById('btn-retry-tts');
    const removeVocal = localStorage.getItem('tts_remove_vocal') === 'true';
    const baseVideo   = job.outputPath; // video đã xóa hardcoded sub

    if (!baseVideo) {
      addLog('[TTS] ❌ Không có video đầu ra để ghép — hãy chạy xóa phụ đề trước.', 'error');
      return;
    }

    if (btnRetry) { btnRetry.disabled = true; btnRetry.textContent = '⏳ Bước 1/4 — Tạo voice...'; }

    try {
      // ══ BƯỚC 1: Tạo TTS audio + lấy timing thực ══════════════════════
      addLog('[TTS] 🎤 Bước 1/4 — Đang tạo âm thanh lồng tiếng...', 'info');

      let refAudio = null;
      if (voice.startsWith('clone:')) {
        const idx = parseInt(voice.split(':')[1]);
        const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
        if (voices[idx]) refAudio = voices[idx].audioPath;
      }

      const ttsRes = await fetch(`${api.base}/api/tts-retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          srt_content:    srtText,
          tts_voice:      voice,
          video_path:     job.filePath,
          tts_ref_audio:  refAudio
        })
      });
      const ttsData = await ttsRes.json();

      if (ttsData.status !== 'ok') {
        addLog('[TTS] ❌ Tạo voice thất bại: ' + (ttsData.error || 'Unknown'), 'error');
        return;
      }

      const ttsAudioPath = ttsData.audio_path;
      // SRT với timing khớp hoàn toàn với voice (TTS-first timing)
      const timedSrt = ttsData.srt_content || _buildTimedSrt(srtText, job.srtContent);
      const segCount = ttsData.segments_timing?.length || 0;
      addLog(`[TTS] ✅ Tạo ${segCount} segments thành công!`, 'success');

      // Preview audio
      const audioEl = document.getElementById('job-tts-preview-audio');
      if (audioEl) {
        audioEl.src = 'file://' + ttsAudioPath.replace(/\\/g, '/');
        audioEl.style.display = 'block';
      }
      job.voiceSegments = [{ text: 'Auto TTS', audio_path: ttsAudioPath }];
      renderVoiceSegments(job.voiceSegments);

      // ══ BƯỚC 2: Tách vocal gốc (nếu bật) → lấy nhạc nền ══════════════
      let bgAudioPath = null;
      if (removeVocal) {
        if (btnRetry) btnRetry.textContent = '⏳ Bước 2/4 — Tách vocal gốc...';
        addLog('[TTS] 🎵 Bước 2/4 — Đang tách vocal gốc, giữ nhạc nền...', 'info');
        try {
          const vocalRes = await api.removeVocal(job.filePath);
          if (vocalRes.status === 'ok' || vocalRes.status === 'warning') {
            bgAudioPath = vocalRes.audio_path;
            addLog(`[TTS] ✅ Tách vocal xong (${vocalRes.method_used})${vocalRes.message ? ': ' + vocalRes.message : ''}.`, 'success');
          } else {
            addLog('[TTS] ⚠️ Tách vocal thất bại: ' + vocalRes.error + ' — dùng audio gốc.', 'warning');
          }
        } catch (e) {
          addLog('[TTS] ⚠️ Lỗi tách vocal: ' + e.message + ' — dùng audio gốc.', 'warning');
        }
      } else {
        addLog('[TTS] ℹ️ Bước 2/4 — Bỏ qua tách vocal (chưa bật tùy chọn).', 'info');
      }

      // ══ BƯỚC 2.5: Tự động điều chỉnh tốc độ video khớp với TTS ══════
      // Đo duration TTS vs video; nếu lệch >2% thì adjust trong giới hạn ±30%
      let videoForMix = baseVideo;   // video sẽ được dùng để mix audio
      if (ttsData.audio_duration_ms > 0) {
        if (btnRetry) btnRetry.textContent = '⏳ Điều chỉnh tốc độ video...';
        const tempoOut = job.filePath.replace(/\.[^.]+$/, '') + '_tempo.mp4';
        try {
          const tempoRes = await api.adjustVideoTempo(
            baseVideo, tempoOut, ttsData.audio_duration_ms,
            1.30,  // max speed up 30%
            0.80   // max slow down 20%
          );
          if (tempoRes.status === 'ok' && tempoRes.adjusted) {
            videoForMix = tempoOut;
            const dir = tempoRes.speed_ratio > 1 ? 'tăng' : 'giảm';
            const pct = Math.abs((tempoRes.speed_ratio - 1) * 100).toFixed(1);
            addLog(`[TTS] ⏱ Điều chỉnh tốc độ video ${dir} ${pct}% để khớp voice (${(tempoRes.audio_duration_ms/1000).toFixed(1)}s).`, 'success');
          } else if (tempoRes.status === 'ok') {
            addLog('[TTS] ✅ Tốc độ video và voice khớp (chênh <2%), không cần điều chỉnh.', 'info');
          } else {
            addLog('[TTS] ⚠️ Không điều chỉnh tốc độ: ' + (tempoRes.error || ''), 'warning');
          }
        } catch (e) {
          addLog('[TTS] ⚠️ Lỗi điều chỉnh tốc độ: ' + e.message, 'warning');
        }
      }

      // ══ BƯỚC 3: Ghép audio vào video → _with_voice.mp4 ════════════════
      if (btnRetry) btnRetry.textContent = '⏳ Bước 3/4 — Ghép audio...';
      addLog('[TTS] 🔊 Bước 3/4 — Đang ghép âm thanh vào video...', 'info');

      // Dùng videoForMix (đã được điều chỉnh tempo nếu cần)
      const safeBase = videoForMix.replace(/_with_voice.*\.mp4$/i, '_no_sub.mp4')
                                  .replace(/_tempo\.mp4$/i, '_no_sub.mp4');

      const videoWithVoice = job.filePath.replace(/\.[^.]+$/, '') + '_with_voice.mp4';

      const bgVol = parseInt(localStorage.getItem('tts_bg_volume') || '10');

      let mergeRes;
      if (bgAudioPath) {
        // 3-way mix: nhạc nền đã tách + TTS, không có voice gốc
        mergeRes = await fetch(`${api.base}/api/mix-audio-tracks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_path:    videoForMix,
            tts_path:      ttsAudioPath,
            bg_audio_path: bgAudioPath,
            output_path:   videoWithVoice,
            bg_volume:     bgVol
          })
        }).then(r => r.json());
      } else {
        // 2-way mix: audio gốc (bgVol%) + TTS voice
        mergeRes = await api.replaceAudio(videoForMix, ttsAudioPath, videoWithVoice, bgVol);
      }

      if (mergeRes.status !== 'ok') {
        addLog('[TTS] ❌ Ghép audio thất bại: ' + mergeRes.error, 'error');
        return;
      }
      addLog('[TTS] ✅ Đã ghép audio thành công!', 'success');

      // ══ BƯỚC 4: Tạo karaoke subtitle từ timing TTS → burn vào video ═══
      // Chỉ thực hiện nếu user đã tick "Gán phụ đề" (chk-voice-sub)
      if (job.voiceSub) {
        if (btnRetry) btnRetry.textContent = '⏳ Bước 4/4 — Tạo karaoke sub...';
        addLog('[TTS] 📝 Bước 4/4 — Đang tạo karaoke phụ đề đúng vị trí...', 'info');

        // 4a: Phát hiện vị trí phụ đề — ưu tiên dùng sub_areas từ job (user đã vẽ)
        // fallback mới: dùng vị trí mặc định (dưới) để tránh crash PaddleOCR
        let subPositions = [];
        let videoMeta = {};
        try {
          // Nếu job có regions (chế độ thủ công), lấy Y position từ đó
          if (job.regions && job.regions.length > 0 && state.videoInfo) {
            const h = state.videoInfo.height;
            const w = state.videoInfo.width;
            videoMeta = { video_height: h, video_width: w };
            // Tạo position segments từ regions
            subPositions = job.regions.map(r => {
              const yCenter = (r.ymin + r.ymax) / 2 / h;
              let alignment = 2, margin_v = 15;
              if (yCenter < 0.4) { alignment = 8; margin_v = Math.round(r.ymin * 0.8); }
              else if (yCenter < 0.65) { alignment = 5; margin_v = 0; }
              else { alignment = 2; margin_v = Math.round((h - r.ymax) * 0.8); }
              return {
                start_ms: r.startFrame / (state.videoInfo.fps || 25) * 1000,
                end_ms:   r.endFrame   / (state.videoInfo.fps || 25) * 1000,
                position: alignment === 8 ? 'top' : alignment === 5 ? 'middle' : 'bottom',
                alignment,
                margin_v: Math.max(5, margin_v)
              };
            });
            addLog(`[TTS] 📍 Lấy vị trí từ ${job.regions.length} vùng đã vẽ.`, 'success');
          } else {
            // Thử detect-sub-positions nhưng có timeout ngắn để không block lâu
            const posRes = await api.detectSubPositions(job.filePath, 60);  // sample step lớn hơn = nhanh hơn
            if (posRes.status === 'ok' && posRes.positions?.length > 0) {
              subPositions = posRes.positions;
              videoMeta = { video_height: posRes.video_height, video_width: posRes.video_width };
              addLog(`[TTS] 📍 ${subPositions.length} vùng: ` +
                subPositions.map(p => `${p.position}@${(p.start_ms/1000).toFixed(1)}s`).join(', '), 'success');
            } else {
              addLog('[TTS] ⚠️ Không phát hiện vùng → vị trí mặc định (dưới).', 'warning');
            }
          }
        } catch (e) {
          addLog('[TTS] ⚠️ Bỏ qua detect vị trí: ' + e.message, 'warning');
        }

        // 4b: Burn ASS karaoke sub vào video đã có voice
        // Luôn tính finalOutput từ job.filePath (không đổi) để tránh _final_final
        const finalOutput = job.filePath.replace(/\.[^.]+$/, '') + '_final.mp4';

        const cssColor = document.getElementById('sub-color')?.value || '#ffffff';
        const rc = cssColor.slice(1,3), gc = cssColor.slice(3,5), bc2 = cssColor.slice(5,7);
        const styleArgs = {
          font_name:     document.getElementById('sub-font')?.value || 'Arial',
          font_size:     parseInt(document.getElementById('sub-size')?.value || '24'),
          primary_color: `&H00${bc2}${gc}${rc}`.toUpperCase(),
          ...videoMeta
        };

        const subRes = await api.burnSubtitlePositioned(
          videoWithVoice, timedSrt, finalOutput, subPositions, styleArgs,
          ttsData.karaoke_ass || null   // karaoke ASS với \k per-word timing
        );

        if (subRes.status === 'ok') {
          const extra = subRes.styles_used > 1 ? ` (${subRes.styles_used} vị trí)` : '';
          addLog(`[TTS] ✅ Burn karaoke sub thành công${extra}!`, 'success');
        } else {
          // Fallback: nếu burn sub lỗi, dùng video đã có voice không có sub
          addLog('[TTS] ⚠️ Burn sub thất bại: ' + subRes.error + ' — dùng video không có sub.', 'warning');
          job.finalOutputPath = videoWithVoice;
          showToast('Video với voice đã tạo (không có sub).', 'warning', 5000);
          _showFinalOutputButton(videoWithVoice);
          renderJobList();
          return;
        }

        job.finalOutputPath = finalOutput;
        addLog('[TTS] 🎉 Hoàn tất pipeline! Video: ' + finalOutput, 'success');
        showToast('Video hoàn chỉnh đã tạo xong!', 'success', 6000);
        job.outputPath = finalOutput;
      } else {
        // Không gán sub — video với voice là output cuối
        addLog('[TTS] ℹ️ Bỏ qua gán phụ đề (chưa tick "Gán phụ đề").', 'info');
        addLog('[TTS] 🎉 Hoàn tất! Video có voice (không sub): ' + videoWithVoice, 'success');
        showToast('Video với voice đã tạo xong (không có sub)!', 'success', 6000);
        job.finalOutputPath = videoWithVoice;
        job.outputPath = videoWithVoice;
      }

      job.status = 'finished';
      job.progress = 100;
      _showFinalOutputButton(job.finalOutputPath);
      renderJobList();
      updateStartButton();

    } catch (e) {
      addLog('[TTS] ❌ Lỗi pipeline: ' + e.message, 'error');
      console.error('[triggerAutoTts]', e);
    } finally {
      job._ttsRunning = false;
      if (btnRetry) { btnRetry.disabled = false; btnRetry.textContent = '🔄 Tạo lại TTS'; }
    }
  }

export function _buildTimedSrt(newText, originalSrt) {
    // Kiểm tra newText có phải SRT hợp lệ không
    if (newText && newText.includes('-->')) {
      return newText;
    }

    // Không có SRT gốc → tạo SRT đơn giản, 1 dòng toàn bộ, duration 1 giờ
    if (!originalSrt || !originalSrt.includes('-->')) {
      const lines = (newText || '').split('\n').filter(l => l.trim());
      let srt = '';
      lines.forEach((line, i) => {
        const start = _msToSrtTime(i * 4000);
        const end   = _msToSrtTime(i * 4000 + 3800);
        srt += `${i + 1}\n${start} --> ${end}\n${line}\n\n`;
      });
      return srt || newText;
    }

    // Parse timestamp slots từ SRT gốc
    const slots = [];
    const blocks = originalSrt.trim().split(/\n\n+/);
    for (const block of blocks) {
      const tsMatch = block.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
      if (tsMatch) {
        slots.push({ start: tsMatch[1].replace('.', ','), end: tsMatch[2].replace('.', ',') });
      }
    }

    if (slots.length === 0) return newText;

    // Tách nội dung mới thành các dòng (bỏ dòng trống và số thứ tự)
    const newLines = (newText || '').split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^\d+$/.test(l) && !l.includes('-->'));

    if (newLines.length === 0) return originalSrt; // fallback về gốc

    // Phân bổ newLines vào slots
    let result = '';
    if (newLines.length === slots.length) {
      // 1:1 match
      slots.forEach((slot, i) => {
        result += `${i + 1}\n${slot.start} --> ${slot.end}\n${newLines[i]}\n\n`;
      });
    } else if (newLines.length < slots.length) {
      // Ít dòng hơn → phân bổ đều, mỗi dòng AI trải qua nhiều slot
      const ratio = slots.length / newLines.length;
      slots.forEach((slot, i) => {
        const lineIdx = Math.min(Math.floor(i / ratio), newLines.length - 1);
        result += `${i + 1}\n${slot.start} --> ${slot.end}\n${newLines[lineIdx]}\n\n`;
      });
    } else {
      // Nhiều dòng hơn slot → gộp nhiều dòng vào 1 slot
      const ratio = newLines.length / slots.length;
      slots.forEach((slot, i) => {
        const fromLine = Math.floor(i * ratio);
        const toLine   = Math.min(Math.floor((i + 1) * ratio), newLines.length);
        const text = newLines.slice(fromLine, toLine).join(' ');
        result += `${i + 1}\n${slot.start} --> ${slot.end}\n${text}\n\n`;
      });
    }

    return result;
  }

export function _msToSrtTime(ms) {
    const h   = Math.floor(ms / 3600000);
    const m   = Math.floor((ms % 3600000) / 60000);
    const s   = Math.floor((ms % 60000) / 1000);
    const mil = ms % 1000;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(mil).padStart(3,'0')}`;
  }

export async function _mergeAudioIntoVideo(job, videoPath, audioPath) {
    // Luôn tính từ job.filePath gốc để tránh _final_final_final
    const finalOutput = job.filePath.replace(/\.[^.]+$/, '') + '_final.mp4';

    const bgVol = parseInt(localStorage.getItem('tts_bg_volume') || '10');

    try {
      const mergeRes = await api.replaceAudio(videoPath, audioPath, finalOutput, bgVol);
      if (mergeRes.status === 'ok') {
        job.finalOutputPath = finalOutput;
        addLog('[TTS] 🎉 Hoàn tất! Video cuối: ' + finalOutput, 'success');
        showToast('Video hoàn chỉnh đã tạo xong!', 'success', 6000);
        // Cập nhật nút mở file trong job list
        renderJobList();
        // Hiện nút mở video final
        _showFinalOutputButton(finalOutput);
      } else {
        addLog('[TTS] ❌ Ghép audio thất bại: ' + mergeRes.error, 'error');
      }
    } catch (e) {
      addLog('[TTS] ❌ Lỗi ghép audio: ' + e.message, 'error');
    }
  }

export function _showFinalOutputButton(filePath) {
    if (!window.electronAPI?.openPath) return;
    const existingBtn = document.getElementById('btn-open-final-output');
    if (existingBtn) existingBtn.remove();
    const btn = document.createElement('button');
    btn.id = 'btn-open-final-output';
    btn.className = 'btn btn-accent btn-block';
    btn.style.marginTop = '8px';
    btn.innerHTML = '📂 Mở video hoàn chỉnh (_final.mp4)';
    btn.onclick = () => window.electronAPI.openPath(filePath);
    const progressSection = document.getElementById('progress-section');
    if (progressSection) progressSection.appendChild(btn);
  }