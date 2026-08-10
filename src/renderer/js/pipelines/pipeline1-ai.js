import '../pipeline-state.js';
import '../pipeline1-run-config.js';

/**
 * Pipeline 1 — AI Analysis + TTS Chain
 *
 * Luồng: SRT gốc → AI Rewrite → TTS audio
 * Kết quả lưu vào job:
 *   job.srtContent      — SRT gốc từ OCR/ASR
 *   job.aiContent       — SRT đã được AI dịch/viết lại
 *   job.ttsAudioPath    — đường dẫn audio TTS đã tạo
 *   job.ttsTimedSrt     — SRT với timing khớp TTS (dùng cho burn sub ở Pipeline 3)
 *
 * Strict completion contract:
 * - An enabled AI/TTS stage must throw on failure.
 * - app.js owns the final P1 finished/error transition.
 * - No fallback may silently convert an enabled-stage failure into P1 success.
 */

function _readProviderKeys(provider) {
  let apiKeys = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`) || '[]');
    if (Array.isArray(parsed)) {
      apiKeys = parsed.map(item => typeof item === 'string' ? item : item?.key).filter(Boolean);
    }
  } catch { apiKeys = []; }
  return apiKeys;
}

function _resolveAiConfig(job) {
  const snapshot = job?.p1Config || {};
  const provider = snapshot.provider || localStorage.getItem('ai_provider') || 'gemini';
  const selectedModel = (snapshot.model || localStorage.getItem(`ai_model_${provider}`) || '').trim();
  const promptText = (snapshot.prompt || localStorage.getItem('ai_prompt') || '').trim();
  const endpoint = snapshot.endpoint || localStorage.getItem('ai_endpoint') || (provider === 'ollama' ? 'http://localhost:11434/api/chat' : '');
  const apiKeys = _readProviderKeys(provider);

  if (!selectedModel) throw new Error('Chưa cấu hình model AI cho Pipeline 1.');
  if (!promptText) throw new Error('Chưa cấu hình Prompt cho Pipeline 1.');
  if (provider !== 'ollama' && apiKeys.length === 0) {
    throw new Error(`Chưa cấu hình API key cho ${provider}.`);
  }

  // The backend's existing Ollama path accepts the model name through api_keys
  // for backward compatibility. Do not persist a fake global ai_api_key.
  const normalizedKeys = provider === 'ollama' && apiKeys.length === 0
    ? [selectedModel]
    : apiKeys;

  return {
    provider,
    api_keys: normalizedKeys,
    model: selectedModel,
    endpoint,
    prompt: promptText,
  };
}

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
    if (!srtText?.trim()) throw new Error('Không có SRT đầu vào cho AI rewrite.');
    const aiConfig = _resolveAiConfig(job);

    const res = await fetch(`${window.api.base}/api/ai-rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ srt_content: srtText, ai_config: aiConfig }),
    });
    if (!res.ok) throw new Error(`AI Rewrite HTTP ${res.status}`);

    const data = await res.json();
    if (data.status !== 'ok' || !data.result) {
      throw new Error(data.error || 'AI Rewrite không trả về nội dung hợp lệ.');
    }

    const aiText = data.result;
    job.aiContent = aiText;
    job._aiTriggered = true;

    const elAiContent = document.getElementById('ai-content');
    if (elAiContent) elAiContent.value = aiText;
    const detailText = document.getElementById('step1-detail-text');
    if (detailText && window._appState?.pipeline1SelectedJobId === job.id) detailText.value = aiText;

    _addLog('[AI] ✅ Viết lại phụ đề thành công!', 'success');

    const srtForTts = aiText.includes('-->') ? aiText : _buildTimedSrt(aiText, srtText);

    if (job.ttsGenerate) {
      await triggerAutoTts(job, srtForTts);
    }

    return { status: 'ok', result: aiText };
  } catch (e) {
    _addLog('[AI] ❌ AI rewrite thất bại: ' + e.message, 'error');
    throw e;
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
  const voice = job.ttsVoice || job.p1Config?.ttsVoice || localStorage.getItem('tts_voice') || 'none';
  if (!voice || voice === 'none') {
    throw new Error('TTS đã được bật nhưng chưa chọn giọng đọc.');
  }
  if (!srtText?.trim()) throw new Error('Không có nội dung để tạo TTS.');

  if (job._ttsRunning) {
    throw new Error('TTS đang chạy cho Job này.');
  }
  job._ttsRunning = true;

  const btnRetry = document.getElementById('btn-retry-tts');
  _setBtn(btnRetry, true, '⏳ Đang tạo voice...');
  _addLog('[TTS] 🎤 Đang tạo âm thanh lồng tiếng...', 'info');

  try {
    let refAudio = null;
    if (voice.startsWith('clone:')) {
      const idx = parseInt(voice.split(':')[1]);
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      if (voices[idx]) refAudio = voices[idx].audioPath;
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
    if (!ttsRes.ok) throw new Error(`TTS HTTP ${ttsRes.status}`);

    const ttsData = await ttsRes.json();
    if (ttsData.status !== 'ok' || !ttsData.audio_path) {
      throw new Error(ttsData.error || 'TTS không trả về audio hợp lệ.');
    }

    job.ttsAudioPath = ttsData.audio_path;
    job.ttsTimedSrt = ttsData.srt_content || _buildTimedSrt(srtText, job.srtContent);
    job.ttsAudioDurMs = ttsData.audio_duration_ms || 0;
    job.ttsSegmentsTiming = ttsData.segments_timing || [];
    job.karaokeAss = ttsData.karaoke_ass || null;
    job._ttsTriggered = true;

    const segCount = job.ttsSegmentsTiming.length;
    _addLog(`[TTS] ✅ Tạo ${segCount} segments thành công! Audio: ${ttsData.audio_path}`, 'success');

    const audioEl = document.getElementById('job-tts-preview-audio');
    if (audioEl) {
      audioEl.src = 'file://' + job.ttsAudioPath.replace(/\\/g, '/');
      audioEl.style.display = 'block';
    }
    const detailAudio = document.getElementById('step1-detail-audio');
    if (detailAudio && window._appState?.pipeline1SelectedJobId === job.id) {
      detailAudio.src = 'file:///' + job.ttsAudioPath.replace(/\\/g, '/');
      detailAudio.style.display = 'block';
      const empty = document.getElementById('step1-audio-empty');
      if (empty) empty.style.display = 'none';
    }

    if (typeof window.renderVoiceSegments === 'function') {
      window.renderVoiceSegments([{ text: 'Auto TTS', audio_path: job.ttsAudioPath }]);
    }

    _addLog('[TTS] ✅ TTS hoàn tất — chờ Pipeline 1 đóng gói kết quả và mở khóa Pipeline 2.', 'success');
    return { status: 'ok', audio_path: job.ttsAudioPath };
  } catch (e) {
    _addLog('[TTS] ❌ TTS thất bại: ' + e.message, 'error');
    console.error('[triggerAutoTts]', e);
    throw e;
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
      const end = _msToSrtTime(i * 4000 + 3800);
      return `${i + 1}\n${start} --> ${end}\n${line}\n`;
    }).join('\n');
  }

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
      const to = Math.min(Math.floor((i + 1) * ratio), newLines.length);
      result += `${i + 1}\n${s.start} --> ${s.end}\n${newLines.slice(from, to).join(' ')}\n\n`;
    });
  }
  return result;
}

export function _msToSrtTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mil = ms % 1000;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(mil).padStart(3,'0')}`;
}

function _addLog(msg, type) {
  if (typeof window.addLog === 'function') window.addLog(msg, type);
  else console.log(`[${type}] ${msg}`);
}

function _setBtn(btn, disabled, text) {
  if (!btn) return;
  btn.disabled = disabled;
  btn.textContent = text;
}
