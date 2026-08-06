/**
 * Pipeline 1 — AI rewrite and TTS artifacts.
 * This module never removes subtitles or renders final video.
 */

export async function triggerAutoAiRewrite(job, srtText) {
  const btnRetry = document.getElementById('btn-retry-ai');
  _setBtn(btnRetry, true, '⏳ AI đang viết...');
  _addLog('[AI] 🔄 Đang viết lại phụ đề bằng AI...', 'info');

  try {
    const provider = localStorage.getItem('ai_provider') || 'gemini';
    const model = job.p1AiModel || localStorage.getItem(`ai_model_${provider}`) || '';
    const prompt = _getActivePrompt();
    if (!prompt) throw new Error('Chưa cấu hình prompt AI.');

    let aiText;
    if (provider === 'ollama') {
      if (!model) throw new Error('Chưa chọn model Ollama.');
      if (!window.electronAPI?.ollamaChat) throw new Error('Ollama chỉ khả dụng trong Electron app.');
      const result = await window.electronAPI.ollamaChat({
        endpoint: localStorage.getItem('ai_endpoint') || 'http://localhost:11434/api/chat',
        model,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: srtText },
        ],
      });
      if (result.status !== 'ok') throw new Error(result.error || 'Ollama rewrite failed');
      aiText = result.result;
    } else {
      if (!window.electronAPI?.aiRewrite) throw new Error('Cần chạy trong Electron app để sử dụng API key an toàn.');
      const result = await window.electronAPI.aiRewrite({
        provider, model, prompt, srt_content: srtText
      });
      if (result.status !== 'ok') throw new Error(result.error);
      aiText = result.result;
    }

    if (!aiText || typeof aiText !== 'string') throw new Error('AI không trả về nội dung hợp lệ.');
    job.aiContent = aiText;
    const output = document.getElementById('ai-content');
    if (output) output.value = aiText;
    _addLog('[AI] ✅ Viết lại phụ đề thành công!', 'success');

    const srtForTts = aiText.includes('-->') ? aiText : _buildTimedSrt(aiText, srtText);
    if (job.ttsGenerate) {
      job._aiTriggered = true;
      await triggerAutoTts(job, srtForTts);
    }
  } catch (error) {
    _addLog(`[AI] ❌ ${error.message}`, 'error');
    if (job.ttsGenerate) await triggerAutoTts(job, srtText);
  } finally {
    _setBtn(btnRetry, false, '🔄 Viết lại AI');
  }
}



function _getActivePrompt() {
  const direct = localStorage.getItem('ai_prompt') || '';
  if (direct) return direct;
  try {
    const prompts = JSON.parse(localStorage.getItem('ai_prompts') || '[]');
    const activeId = localStorage.getItem('ai_active_prompt_id');
    return prompts.find(item => item.id === activeId)?.content || '';
  } catch {
    return '';
  }
}

export async function triggerAutoTts(job, srtText) {
  const voice = job.p1TtsVoice || job.ttsVoice || localStorage.getItem('tts_voice') || 'none';
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

  try {
    let refAudio = null;
    if (voice.startsWith('clone:')) {
      const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
      refAudio = voices[Number(voice.split(':')[1])]?.audioPath || null;
    }
    const response = await fetch(`${window.api.base}/api/tts-retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        srt_content: srtText,
        tts_voice: voice,
        video_path: job.filePath,
        tts_ref_audio: refAudio,
        speed: (job.p1TtsSpeed !== undefined ? Number(job.p1TtsSpeed) : 50) / 50.0 // Normalize speed (50 is 1.0x)
      }),
    });
    const result = await response.json();
    if (!response.ok || result.status !== 'ok') throw new Error(result.error || `HTTP ${response.status}`);

    job.ttsAudioPath = result.audio_path;
    job.ttsTimedSrt = result.srt_content || _buildTimedSrt(srtText, job.srtContent);
    job.ttsAudioDurMs = result.audio_duration_ms || 0;
    job.ttsSegmentsTiming = result.segments_timing || [];
    job.karaokeAss = result.karaoke_ass || null;
    _addLog(`[TTS] ✅ Tạo ${job.ttsSegmentsTiming.length} segments thành công!`, 'success');
  } catch (error) {
    _addLog(`[TTS] ❌ ${error.message}`, 'error');
  } finally {
    job._ttsRunning = false;
    _setBtn(btnRetry, false, '🔄 Tạo lại TTS');
  }
}

export function _buildTimedSrt(newText, originalSrt) {
  if (newText && newText.includes('-->')) return newText;
  if (!originalSrt || !originalSrt.includes('-->')) {
    return (newText || '').split('\n').filter(line => line.trim()).map((line, index) => {
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
  if (slots.length === 0) return newText;

  const lines = (newText || '').split('\n')
    .map(line => line.trim())
    .filter(line => line && !/^\d+$/.test(line) && !line.includes('-->'));
  if (lines.length === 0) return originalSrt;

  let output = '';
  const ratio = lines.length / slots.length;
  slots.forEach((slot, index) => {
    const from = Math.floor(index * ratio);
    const to = Math.max(from + 1, Math.min(Math.floor((index + 1) * ratio), lines.length));
    output += `${index + 1}\n${slot.start} --> ${slot.end}\n${lines.slice(from, to).join(' ')}\n\n`;
  });
  return output;
}

export function _msToSrtTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
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
