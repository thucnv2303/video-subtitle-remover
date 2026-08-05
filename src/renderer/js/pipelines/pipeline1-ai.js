/**
 * Pipeline 1 — AI Analysis + TTS Chain
 *
 * Luồng: SRT gốc → AI Rewrite → TTS audio
 * Kết quả lưu vào job:
 *   job.srtContent      — SRT gốc từ OCR/ASR
 *   job.aiContent       — SRT đã được AI dịch/viết lại
 *   job.ttsAudioPath    — đường dẫn audio TTS đã tạo
 *   job.ttsTimedSrt     — SRT với timing khớp TTS (dùng cho burn sub ở Pipeline 3)
 */

// ─── AI Rewrite ──────────────────────────────────────────────────────────────

/**
 * Gửi SRT lên AI để viết lại/dịch, sau đó tự động chain sang TTS nếu job.ttsGenerate = true.
 * @param {object} job
 * @param {string} srtText — nội dung SRT gốc
 */
export async function triggerAutoAiRewrite(job, srtText) {
  const btnRetry = document.getElementById('btn-retry-ai');
  _setBtn(btnRetry, true, '⏳ AI đang viết...');
  _addLog('[AI] 🔄 Đang viết lại phụ đề bằng AI...', 'info');

  try {
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    let api_keys = [];
    try { api_keys = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]'); } catch { api_keys = []; }
    const selectedModel = localStorage.getItem(`ai_model_${provider}`) || '';

    // Fallback key sources
    if (api_keys.length === 0) {
      if (provider === 'ollama' && selectedModel) api_keys = [selectedModel];
      else if (localStorage.getItem('ai_api_key')) api_keys = [{ key: localStorage.getItem('ai_api_key') }];
    }

    // Lấy nội dung prompt đang chọn
    let promptText = localStorage.getItem('ai_prompt') || '';
    if (!promptText) {
      try {
        const prompts = JSON.parse(localStorage.getItem('ai_prompts') || '[]');
        const activeId = localStorage.getItem('ai_active_prompt_id');
        const found = prompts.find(p => p.id === activeId);
        if (found) promptText = found.content;
      } catch { /* ignore */ }
    }

    if (!promptText || api_keys.filter(Boolean).length === 0) {
      _addLog('[AI] ⚠️ Chưa cấu hình AI key/prompt — bỏ qua AI rewrite.', 'warning');
      _setBtn(btnRetry, false, '🔄 Viết lại AI');
      // Vẫn chain TTS với SRT gốc nếu cần
      if (job.ttsGenerate) await triggerAutoTts(job, srtText);
      return;
    }

    const aiConfig = {
      provider,
      api_keys: api_keys.map(k => k.key || k),
      model: selectedModel,
      endpoint: localStorage.getItem('ai_endpoint') || '',
      prompt: promptText,
    };

    const res = await fetch(`${window.api.base}/api/ai-rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ srt_content: srtText, ai_config: aiConfig }),
    });
    const data = await res.json();

    if (data.status === 'ok') {
      const aiText = data.result;
      job.aiContent = aiText;

      // Cập nhật UI textarea
      const elAiContent = document.getElementById('ai-content');
      if (elAiContent) elAiContent.value = aiText;

      _addLog('[AI] ✅ Viết lại phụ đề thành công!', 'success');

      // Đảm bảo content truyền vào TTS luôn là SRT hợp lệ có -->
      const srtForTts = aiText.includes('-->') ? aiText : _buildTimedSrt(aiText, srtText);

      // Chain sang TTS ngay
      if (job.ttsGenerate) {
        job._aiTriggered = true;
        await triggerAutoTts(job, srtForTts);
      }
    } else {
      _addLog('[AI] ❌ Lỗi viết lại: ' + (data.error || 'Unknown'), 'error');
      // Fallback: chain TTS với SRT gốc
      if (job.ttsGenerate) await triggerAutoTts(job, srtText);
    }
  } catch (e) {
    _addLog('[AI] ❌ Lỗi kết nối AI: ' + e.message, 'error');
    if (job.ttsGenerate) await triggerAutoTts(job, srtText);
  } finally {
    _setBtn(btnRetry, false, '🔄 Viết lại AI');
  }
}

// ─── TTS (Auto chain sau AI) ─────────────────────────────────────────────────

/**
 * Tạo TTS audio từ SRT. Lưu kết quả vào job.ttsAudioPath và job.ttsTimedSrt.
 * KHÔNG ghép vào video ở đây — việc ghép thuộc Pipeline 3 (Finalize).
 * @param {object} job
 * @param {string} srtText — SRT hợp lệ (có -->) để tạo TTS
 */
export async function triggerAutoTts(job, srtText) {
  const voice = job.ttsVoice || localStorage.getItem('tts_voice') || 'none';
  if (!voice || voice === 'none') {
    _addLog('[TTS] ⚠️ Chưa chọn giọng — bỏ qua TTS.', 'warning');
    return;
  }

  if (job._ttsRunning) {
    _addLog('[TTS] ℹ️ TTS đang chạy, bỏ qua trigger thứ 2.', 'info');
    return;
  }
  job._ttsRunning = true;

  const btnRetry = document.getElementById('btn-retry-tts');
  _setBtn(btnRetry, true, '⏳ Đang tạo voice...');
  _addLog('[TTS] 🎤 Đang tạo âm thanh lồng tiếng...', 'info');

  try {
    // Lấy ref audio nếu dùng clone voice
    let refAudio = null;
    if (voice.startsWith('clone:')) {
      const idx = parseInt(voice.split(':')[1]);
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      if (voices[idx]) refAudio = voices[idx].audioPath;
    }

    const ttsRes = await fetch(`${window.api.base}/api/tts-retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        srt_content:   srtText,
        tts_voice:     voice,
        video_path:    job.filePath,
        tts_ref_audio: refAudio,
      }),
    });
    const ttsData = await ttsRes.json();

    if (ttsData.status !== 'ok') {
      _addLog('[TTS] ❌ Tạo voice thất bại: ' + (ttsData.error || 'Unknown'), 'error');
      return;
    }

    // Lưu kết quả TTS vào job để Pipeline 3 dùng
    job.ttsAudioPath  = ttsData.audio_path;
    job.ttsTimedSrt   = ttsData.srt_content || _buildTimedSrt(srtText, job.srtContent);
    job.ttsAudioDurMs = ttsData.audio_duration_ms || 0;
    job.ttsSegmentsTiming = ttsData.segments_timing || [];
    job.karaokeAss    = ttsData.karaoke_ass || null;

    const segCount = job.ttsSegmentsTiming.length;
    _addLog(`[TTS] ✅ Tạo ${segCount} segments thành công! Audio: ${ttsData.audio_path}`, 'success');

    // Preview audio trong UI
    const audioEl = document.getElementById('job-tts-preview-audio');
    if (audioEl) {
      audioEl.src = 'file://' + job.ttsAudioPath.replace(/\\/g, '/');
      audioEl.style.display = 'block';
    }

    // Cập nhật voice segments list
    if (typeof window.renderVoiceSegments === 'function') {
      window.renderVoiceSegments([{ text: 'Auto TTS', audio_path: job.ttsAudioPath }]);
    }

    _addLog('[TTS] ✅ Pipeline 1 hoàn tất — chuyển sang Pipeline 3 để hoàn thiện video.', 'success');

  } catch (e) {
    _addLog('[TTS] ❌ Lỗi pipeline TTS: ' + e.message, 'error');
    console.error('[triggerAutoTts]', e);
  } finally {
    job._ttsRunning = false;
    _setBtn(btnRetry, false, '🔄 Tạo lại TTS');
  }
}

// ─── SRT Utilities ───────────────────────────────────────────────────────────

/**
 * Ghép nội dung text mới vào timestamp của SRT gốc.
 * Trả về SRT hợp lệ có -->.
 */
export function _buildTimedSrt(newText, originalSrt) {
  if (newText && newText.includes('-->')) return newText;

  if (!originalSrt || !originalSrt.includes('-->')) {
    const lines = (newText || '').split('\n').filter(l => l.trim());
    return lines.map((line, i) => {
      const start = _msToSrtTime(i * 4000);
      const end   = _msToSrtTime(i * 4000 + 3800);
      return `${i + 1}\n${start} --> ${end}\n${line}\n`;
    }).join('\n');
  }

  // Parse timestamp slots từ SRT gốc
  const slots = [];
  for (const block of originalSrt.trim().split(/\n\n+/)) {
    const m = block.match(/(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})/);
    if (m) slots.push({ start: m[1].replace('.', ','), end: m[2].replace('.', ',') });
  }
  if (slots.length === 0) return newText;

  const newLines = (newText || '').split('\n')
    .map(l => l.trim())
    .filter(l => l && !/^\d+$/.test(l) && !l.includes('-->'));
  if (newLines.length === 0) return originalSrt;

  let result = '';
  if (newLines.length === slots.length) {
    slots.forEach((s, i) => { result += `${i + 1}\n${s.start} --> ${s.end}\n${newLines[i]}\n\n`; });
  } else if (newLines.length < slots.length) {
    const ratio = slots.length / newLines.length;
    slots.forEach((s, i) => {
      const idx = Math.min(Math.floor(i / ratio), newLines.length - 1);
      result += `${i + 1}\n${s.start} --> ${s.end}\n${newLines[idx]}\n\n`;
    });
  } else {
    const ratio = newLines.length / slots.length;
    slots.forEach((s, i) => {
      const from = Math.floor(i * ratio);
      const to   = Math.min(Math.floor((i + 1) * ratio), newLines.length);
      result += `${i + 1}\n${s.start} --> ${s.end}\n${newLines.slice(from, to).join(' ')}\n\n`;
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

// ─── Private helpers ─────────────────────────────────────────────────────────

function _addLog(msg, type) {
  if (typeof window.addLog === 'function') window.addLog(msg, type);
  else console.log(`[${type}] ${msg}`);
}

function _setBtn(btn, disabled, text) {
  if (!btn) return;
  btn.disabled = disabled;
  btn.textContent = text;
}
