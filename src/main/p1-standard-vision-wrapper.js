const registerStandardVisionIPC = require('./p1-standard-vision-ipc');

const STANDARD_MIN_RATIO = 0.95;
const STANDARD_TARGET_RATIO = 0.975;

function compactNarration(value) {
  return String(value || '').replace(/```(?:json)?/gi, '').replace(/\s+/g, ' ').trim();
}

function emitProgress(event, message, type = 'info') {
  try {
    event.sender.send('p1:vision-progress', { message, type, at: Date.now() });
  } catch {
    // Renderer may already be closed.
  }
}

function standardEvidenceContext(result) {
  const analysis = result?.analysis || {};
  const visualChunks = Array.isArray(result?.visual_chunks) ? result.visual_chunks : [];
  const chunks = visualChunks.slice(0, 20).map((chunk) => ({
    index: Number(chunk?.index) || 0,
    start_sec: Number(chunk?.start_sec) || 0,
    end_sec: Number(chunk?.end_sec) || 0,
    summary: String(chunk?.analysis?.summary || '').slice(0, 220),
    visual_evidence: Array.isArray(chunk?.analysis?.visual_evidence)
      ? chunk.analysis.visual_evidence.slice(0, 6).map((item) => String(item || '').slice(0, 180))
      : [],
    conflicts: Array.isArray(chunk?.analysis?.conflicts)
      ? chunk.analysis.conflicts.slice(0, 4).map((item) => String(item || '').slice(0, 180))
      : [],
  }));
  const scenes = Array.isArray(analysis?.scenes) ? analysis.scenes.slice(0, 80).map((scene) => ({
    index: Number(scene?.index) || 0,
    chunk_index: Number(scene?.chunk_index) || 0,
    time_sec: Number(scene?.time_sec) || 0,
    visual: String(scene?.visual || '').slice(0, 220),
    speech_context: String(scene?.speech_context || '').slice(0, 180),
    purpose: String(scene?.purpose || '').slice(0, 140),
  })) : [];
  return {
    summary: String(analysis?.summary || '').slice(0, 600),
    insights: analysis?.insights || {},
    chunks,
    scenes,
  };
}

function effectiveCharsPerSecond(budget) {
  const baseRate = Number(budget?.estimated_chars_per_sec) || 15;
  const speed = Number(budget?.speed) || 1;
  return Math.max(1, baseRate * Math.max(0.5, Math.min(2, speed)));
}

function failedRecompose(result, fitResult, message) {
  return {
    ...result,
    ok: false,
    code: fitResult?.code || 'STANDARD_NARRATION_DURATION_RECOMPOSE_FAILED',
    phase: fitResult?.phase || 'Standard narration duration recompose',
    model: fitResult?.model || result?.reasoning_model || null,
    cancelled: Boolean(fitResult?.cancelled),
    error: fitResult?.error || message,
  };
}

/**
 * Registers the pre-semantic Pipeline 1 reasoning path under isolated IPC names.
 * Shared audio persistence/fit handlers stay owned by p1-vision-ipc.js.
 *
 * Standard mode keeps the original isolated analysis implementation, but if its
 * first grounded narration is materially shorter than the selected voice/video
 * budget, reuse the same module's evidence-backed narration recompose handler
 * BEFORE TTS. This avoids accepting a 30-40s voice for a ~90s source merely
 * because the original transcript is short, while still forbidding filler and
 * unsupported claims.
 */
module.exports = function registerP1StandardVisionIPC({ ipcMain, net }) {
  let standardFitHandler = null;

  const scopedIpcMain = {
    handle(channel, handler) {
      if (channel === 'ollama:p1FitNarration') {
        standardFitHandler = handler;
        return undefined;
      }

      if (channel === 'ollama:p1CancelVision') {
        return ipcMain.handle('ollama:p1CancelStandardVision', handler);
      }

      if (channel !== 'ollama:p1AnalyzeVision') return undefined;

      return ipcMain.handle('ollama:p1AnalyzeStandardVision', async (event, payload = {}) => {
        const result = await handler(event, payload);
        if (!result?.ok || !result?.analysis) return result;

        const narration = compactNarration(result.analysis.narration_script);
        const budget = result.narration_budget || {};
        const minChars = Math.max(1, Math.floor(Number(budget?.min_chars) || 1));
        const maxChars = Math.max(minChars, Math.floor(Number(budget?.max_chars) || minChars));
        if (!narration || narration.length >= minChars) return result;

        if (!standardFitHandler) {
          return failedRecompose(result, null, 'Standard narration ngắn hơn duration budget nhưng evidence-backed recompose handler chưa sẵn sàng.');
        }

        const sourceDurationSec = Number(payload?.video_info?.duration) || 0;
        const transcript = String(payload?.transcript_srt || '').trim();
        const visualContext = standardEvidenceContext(result);
        if (!(sourceDurationSec > 0) || !transcript || !visualContext.scenes.length) {
          return failedRecompose(result, null, 'Thiếu source duration, transcript hoặc Vision evidence để kéo narration Standard về đúng timeline một cách có căn cứ.');
        }

        const cps = effectiveCharsPerSecond(budget);
        const predictedBeforeSec = narration.length / cps;
        emitProgress(
          event,
          `Standard duration guard: draft=${narration.length} chars (~${predictedBeforeSec.toFixed(1)}s) dưới hard target ${minChars}-${maxChars} chars. Recompose bằng full transcript + Vision evidence trước TTS.`,
          'warning'
        );

        const fitResult = await standardFitHandler(event, {
          endpoint: payload.endpoint,
          model: payload.model,
          narration_script: narration,
          audio_duration_ms: Math.max(1, Math.round(predictedBeforeSec * 1000)),
          video_duration_ms: Math.max(1, Math.round(sourceDurationSec * 1000)),
          transcript_srt: transcript,
          visual_context: visualContext,
        });

        if (!fitResult?.ok || !fitResult?.narration_script || fitResult?.evidence_backed !== true) {
          return failedRecompose(result, fitResult, 'Evidence-backed Standard narration recompose không đạt contract.');
        }

        const repaired = compactNarration(fitResult.narration_script);
        if (repaired.length < minChars || repaired.length > maxChars) {
          return failedRecompose(
            result,
            fitResult,
            `Standard narration sau recompose vẫn ngoài hard target ${minChars}-${maxChars} chars.`
          );
        }

        result.analysis.narration_script = repaired;
        result.narration_quality = fitResult.quality || result.narration_quality || null;
        result.narration_budget = {
          ...budget,
          ...(fitResult.budget || {}),
          target_ratio: STANDARD_TARGET_RATIO,
          min_ratio: STANDARD_MIN_RATIO,
          pre_tts_duration_recomposed: true,
          initial_narration_chars: narration.length,
          final_narration_chars: repaired.length,
        };

        emitProgress(
          event,
          `Standard duration guard PASS: ${narration.length} -> ${repaired.length} chars; target=${minChars}-${maxChars}. TTS chỉ chạy sau khi narration đủ coverage dự kiến.`,
          'success'
        );
        return result;
      });
    },
  };

  registerStandardVisionIPC({ ipcMain: scopedIpcMain, net });
};
