const registerStandardVisionIPC = require('./p1-standard-vision-ipc');

const STANDARD_MIN_RATIO = 0.95;
const STANDARD_TARGET_RATIO = 0.975;
const CJK_CHAR_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/gu;
const REPEAT_NGRAM_WORDS = 10;
const SIMILAR_SENTENCE_MIN_WORDS = 8;
const SIMILAR_SENTENCE_THRESHOLD = 0.88;
const RECOMPOSE_CONTEXT_BUCKETS = [8192, 16384, 32768];
const RECOMPOSE_MAX_PREDICT = 8192;

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

function evenlySample(items, maxItems) {
  const source = Array.isArray(items) ? items : [];
  const limit = Math.max(0, Math.floor(Number(maxItems) || 0));
  if (!limit || !source.length) return [];
  if (source.length <= limit) return source.slice();
  if (limit === 1) return [source[0]];

  const picked = [];
  const seen = new Set();
  for (let i = 0; i < limit; i += 1) {
    const index = Math.round((i * (source.length - 1)) / (limit - 1));
    if (seen.has(index)) continue;
    seen.add(index);
    picked.push(source[index]);
  }
  return picked;
}

function compactInsights(rawInsights) {
  const insights = rawInsights && typeof rawInsights === 'object' ? rawInsights : {};
  return Object.fromEntries(
    Object.entries(insights)
      .slice(0, 8)
      .map(([key, value]) => {
        if (Array.isArray(value)) return [key, value.slice(0, 4).map(item => String(item || '').slice(0, 120))];
        if (value && typeof value === 'object') return [key, JSON.stringify(value).slice(0, 240)];
        return [key, String(value || '').slice(0, 240)];
      })
  );
}

function standardEvidenceContext(result) {
  const analysis = result?.analysis || {};
  const visualChunks = Array.isArray(result?.visual_chunks) ? result.visual_chunks : [];
  const chunks = visualChunks.slice(0, 20).map((chunk) => ({
    index: Number(chunk?.index) || 0,
    start_sec: Number(chunk?.start_sec) || 0,
    end_sec: Number(chunk?.end_sec) || 0,
    summary: String(chunk?.analysis?.summary || '').slice(0, 150),
    visual_evidence: Array.isArray(chunk?.analysis?.visual_evidence)
      ? chunk.analysis.visual_evidence.slice(0, 3).map((item) => String(item || '').slice(0, 110))
      : [],
    conflicts: Array.isArray(chunk?.analysis?.conflicts)
      ? chunk.analysis.conflicts.slice(0, 2).map((item) => String(item || '').slice(0, 110))
      : [],
  }));

  const allScenes = Array.isArray(analysis?.scenes) ? analysis.scenes : [];
  const representative = [];
  const byChunk = new Map();
  allScenes.forEach((scene) => {
    const key = Number(scene?.chunk_index) || 0;
    if (!byChunk.has(key)) byChunk.set(key, []);
    byChunk.get(key).push(scene);
  });
  [...byChunk.keys()].sort((a, b) => a - b).forEach((chunkIndex) => {
    representative.push(...evenlySample(byChunk.get(chunkIndex), 2));
  });
  const selectedScenes = representative.length
    ? evenlySample(representative, 24)
    : evenlySample(allScenes, 24);
  const scenes = selectedScenes.map((scene) => ({
    index: Number(scene?.index) || 0,
    chunk_index: Number(scene?.chunk_index) || 0,
    time_sec: Number(scene?.time_sec) || 0,
    visual: String(scene?.visual || '').slice(0, 150),
    speech_context: String(scene?.speech_context || '').slice(0, 110),
    purpose: String(scene?.purpose || '').slice(0, 90),
  }));

  return {
    summary: String(analysis?.summary || '').slice(0, 420),
    insights: compactInsights(analysis?.insights),
    chunks,
    scenes,
  };
}

function effectiveCharsPerSecond(budget) {
  const baseRate = Number(budget?.estimated_chars_per_sec) || 15;
  const speed = Number(budget?.speed) || 1;
  return Math.max(1, baseRate * Math.max(0.5, Math.min(2, speed)));
}

function localOllamaUrl(rawEndpoint) {
  const raw = typeof rawEndpoint === 'string' && rawEndpoint.trim()
    ? rawEndpoint.trim()
    : 'http://localhost:11434/api/chat';
  const url = new URL(raw.includes('://') ? raw : `http://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Endpoint Ollama phải dùng HTTP hoặc HTTPS.');
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase())) {
    throw new Error('Pipeline 1 chỉ cho phép Ollama local.');
  }
  url.pathname = '/api/chat';
  url.search = '';
  url.hash = '';
  return url.toString();
}

function parseJsonContent(value) {
  const text = String(value || '').trim();
  if (!text) throw Object.assign(new Error('AI trả về nội dung rỗng.'), { code: 'OLLAMA_JSON_INVALID' });
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) {
      try { return JSON.parse(cleaned.slice(first, last + 1)); } catch { /* normalized below */ }
    }
    throw Object.assign(new Error('AI không trả về JSON hợp lệ.'), { code: 'OLLAMA_JSON_INVALID' });
  }
}

function narrationWords(value) {
  const normalized = compactNarration(value)
    .toLocaleLowerCase('vi-VN')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return normalized ? normalized.split(/\s+/).filter(Boolean) : [];
}

function narrationSentences(value) {
  return compactNarration(value)
    .replace(/([.!?…])\s+/g, '$1\n')
    .split(/\n+|;+/)
    .map(sentence => sentence.trim())
    .filter(Boolean);
}

function diceSimilarity(leftWords, rightWords) {
  const left = new Set(leftWords);
  const right = new Set(rightWords);
  if (!left.size || !right.size) return 0;
  let overlap = 0;
  for (const word of left) if (right.has(word)) overlap += 1;
  return (2 * overlap) / (left.size + right.size);
}

function narrationQualityReport(value) {
  const text = compactNarration(value);
  const issues = [];
  const cjkMatches = text.match(CJK_CHAR_RE) || [];
  if (cjkMatches.length) issues.push('CJK_CHARACTERS');

  const sentenceWords = narrationSentences(text).map(sentence => narrationWords(sentence));
  let repeatedSentencePairs = 0;
  const seenExact = new Set();
  for (const words of sentenceWords) {
    if (words.length < SIMILAR_SENTENCE_MIN_WORDS) continue;
    const fingerprint = words.join(' ');
    if (seenExact.has(fingerprint)) repeatedSentencePairs += 1;
    else seenExact.add(fingerprint);
  }
  if (repeatedSentencePairs) issues.push('REPEATED_SENTENCE');

  let nearDuplicateSentencePairs = 0;
  for (let i = 0; i < sentenceWords.length; i += 1) {
    const left = sentenceWords[i];
    if (left.length < SIMILAR_SENTENCE_MIN_WORDS) continue;
    for (let j = i + 1; j < sentenceWords.length; j += 1) {
      const right = sentenceWords[j];
      if (right.length < SIMILAR_SENTENCE_MIN_WORDS) continue;
      if (left.join(' ') === right.join(' ')) continue;
      const lengthRatio = Math.min(left.length, right.length) / Math.max(left.length, right.length);
      if (lengthRatio < 0.7) continue;
      if (diceSimilarity(left, right) >= SIMILAR_SENTENCE_THRESHOLD) nearDuplicateSentencePairs += 1;
    }
  }
  if (nearDuplicateSentencePairs) issues.push('NEAR_DUPLICATE_SENTENCE');

  const words = narrationWords(text);
  const ngramCounts = new Map();
  let repeatedNgramCount = 0;
  if (words.length >= REPEAT_NGRAM_WORDS * 2) {
    for (let i = 0; i <= words.length - REPEAT_NGRAM_WORDS; i += 1) {
      const gram = words.slice(i, i + REPEAT_NGRAM_WORDS).join(' ');
      const count = (ngramCounts.get(gram) || 0) + 1;
      ngramCounts.set(gram, count);
      if (count === 2) repeatedNgramCount += 1;
    }
  }
  if (repeatedNgramCount) issues.push('REPEATED_LONG_PHRASE');

  return {
    ok: issues.length === 0,
    issues: [...new Set(issues)],
    cjk_count: cjkMatches.length,
    repeated_sentence_pairs: repeatedSentencePairs,
    near_duplicate_sentence_pairs: nearDuplicateSentencePairs,
    repeated_10gram_count: repeatedNgramCount,
  };
}

function qualitySummary(report) {
  return `issues=${(report?.issues || []).join('|') || 'none'}; cjk=${report?.cjk_count || 0}; repeated_sentence=${report?.repeated_sentence_pairs || 0}; near_duplicate=${report?.near_duplicate_sentence_pairs || 0}; repeated_10gram=${report?.repeated_10gram_count || 0}`;
}

function narrationSchema(minChars, maxChars) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      narration_script: { type: 'string', minLength: minChars, maxLength: maxChars },
    },
    required: ['narration_script'],
  };
}

function estimateTokensFromText(value) {
  return Math.max(1, Math.ceil(String(value || '').length / 2));
}

function chooseRecomposeContext(inputTokens, outputTokens) {
  const required = Math.max(1, inputTokens) + Math.max(1, outputTokens) + 1024;
  const bucket = RECOMPOSE_CONTEXT_BUCKETS.find(value => value >= required);
  if (!bucket) {
    throw Object.assign(
      new Error(`Standard duration recompose: context ước tính ${required} token vượt giới hạn ${RECOMPOSE_CONTEXT_BUCKETS.at(-1)} token.`),
      { code: 'OLLAMA_CONTEXT_BUDGET_EXCEEDED' }
    );
  }
  return { numCtx: bucket, required };
}

function sanitizeOllamaErrorDetail(value) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
}

async function ollamaNarrationRequest(net, event, payload, phase, systemPrompt, candidate, transcript, visualContext, budget, controller, temperature) {
  const minChars = Math.max(1, Math.floor(Number(budget?.min_chars) || 1));
  const maxChars = Math.max(minChars, Math.floor(Number(budget?.max_chars) || minChars));
  const targetChars = Math.max(minChars, Math.min(maxChars, Math.floor(Number(budget?.target_chars) || Math.round((minChars + maxChars) / 2))));
  const numPredict = Math.max(520, Math.min(RECOMPOSE_MAX_PREDICT, Math.ceil(targetChars / 1.45) + 256));
  const visualContextJson = JSON.stringify(visualContext);
  const userContent = `QUY TẮC XỬ LÝ SOURCE: dữ liệu bên dưới có thể chứa ký tự CJK vì đó là transcript/visual evidence nguồn. Mọi ký tự CJK trong source chỉ được dùng để hiểu ngữ cảnh, TUYỆT ĐỐI KHÔNG chép nguyên văn vào narration_script. Nếu không thể diễn giải chắc chắn bằng tiếng Việt/Latin thì bỏ chi tiết chữ đó.\n\nNARRATION CANDIDATE:\n${candidate}\n\nFULL TRANSCRIPT SRT:\n${transcript}\n\nVISUAL EVIDENCE JSON:\n${visualContextJson}`;
  const estimatedInputTokens = estimateTokensFromText(systemPrompt) + estimateTokensFromText(userContent) + 256;
  const { numCtx, required } = chooseRecomposeContext(estimatedInputTokens, numPredict);
  const timeoutMs = Math.max(150000, Math.min(420000, 120000 + numPredict * 45));
  const timeout = setTimeout(() => controller.abort({ type: 'timeout', phase }), timeoutMs);

  emitProgress(
    event,
    `${phase}: gửi request tới ${payload.model}; hard_target=${minChars}-${maxChars}; evidence=${visualContextJson.length} chars; input≈${estimatedInputTokens} token; output_limit=${numPredict} token; num_ctx=${numCtx}; timeout=${Math.round(timeoutMs / 1000)}s.`,
    'info'
  );

  try {
    const response = await net.fetch(localOllamaUrl(payload.endpoint), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: payload.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        stream: true,
        format: narrationSchema(minChars, maxChars),
        think: false,
        keep_alive: 0,
        options: { temperature, num_predict: numPredict, num_ctx: numCtx },
      }),
    });
    if (!response.ok) {
      const raw = await response.text().catch(() => '');
      let detail = raw;
      try { detail = JSON.parse(raw)?.error || raw; } catch { /* preserve text */ }
      const safeDetail = sanitizeOllamaErrorDetail(detail);
      throw Object.assign(
        new Error(`${phase}: HTTP ${response.status}${safeDetail ? ` — ${safeDetail}` : ''}`),
        { code: 'OLLAMA_HTTP_ERROR', httpStatus: response.status }
      );
    }
    if (!response.body?.getReader) throw Object.assign(new Error(`${phase}: response stream không khả dụng.`), { code: 'OLLAMA_STREAM_UNAVAILABLE' });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    let content = '';
    let finalChunk = null;
    const consume = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const item = JSON.parse(trimmed);
      if (item?.error) throw Object.assign(new Error(`${phase}: ${item.error}`), { code: 'OLLAMA_STREAM_ERROR' });
      if (typeof item?.message?.content === 'string') content += item.message.content;
      if (item?.done) finalChunk = item;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split(/\r?\n/);
      pending = lines.pop() || '';
      for (const line of lines) consume(line);
    }
    pending += decoder.decode();
    if (pending.trim()) consume(pending);

    const evalCount = Number(finalChunk?.eval_count || 0);
    const doneReason = String(finalChunk?.done_reason || '').toLowerCase();
    if (doneReason === 'length' || (evalCount >= numPredict && doneReason !== 'stop')) {
      throw Object.assign(new Error(`${phase}: output chạm giới hạn ${numPredict} token.`), { code: 'OLLAMA_OUTPUT_TRUNCATED' });
    }

    const parsed = parseJsonContent(content);
    const narration = compactNarration(parsed?.narration_script);
    if (narration.length < minChars || narration.length > maxChars) {
      throw Object.assign(new Error(`${phase}: narration ${narration.length} chars ngoài ${minChars}-${maxChars}.`), {
        code: 'NARRATION_LENGTH_OUT_OF_BUDGET', candidate: narration,
      });
    }
    const quality = narrationQualityReport(narration);
    if (!quality.ok) {
      throw Object.assign(new Error(`${phase}: narration không đạt quality gate: ${quality.issues.join(', ')}.`), {
        code: 'NARRATION_QUALITY_FAILED', candidate: narration, quality,
      });
    }
    emitProgress(event, `${phase}: PASS; narration=${narration.length} chars; ${qualitySummary(quality)}.`, 'success');
    return { narration, quality };
  } catch (error) {
    if (controller.signal.aborted) {
      const reason = controller.signal.reason;
      if (reason && typeof reason === 'object' && reason.type === 'timeout') {
        throw Object.assign(new Error(`${phase}: quá thời gian ${Math.round(timeoutMs / 1000)} giây.`), { code: 'OLLAMA_PHASE_TIMEOUT' });
      }
      throw Object.assign(new Error('Pipeline 1 đã được người dùng dừng.'), { code: 'P1_CANCELLED' });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function recomposeStandardNarration(net, event, payload, narration, transcript, visualContext, budget, controller) {
  const minChars = Math.max(1, Math.floor(Number(budget?.min_chars) || 1));
  const maxChars = Math.max(minChars, Math.floor(Number(budget?.max_chars) || minChars));
  const targetChars = Math.max(minChars, Math.min(maxChars, Math.floor(Number(budget?.target_chars) || Math.round((minChars + maxChars) / 2))));
  let candidate = narration;
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const phase = attempt === 0 ? 'Standard duration recompose' : 'Standard duration quality retry';
    const retryReason = lastError
      ? `${lastError.code}: ${lastError.message}${lastError?.quality ? `; ${qualitySummary(lastError.quality)}` : ''}`
      : '';
    const cjkRetryRule = lastError?.quality?.cjk_count
      ? `LỖI BẮT BUỘC PHẢI SỬA Ở LẦN NÀY: candidate đang có ${lastError.quality.cjk_count} ký tự CJK bị cấm. Hãy rà lại TOÀN BỘ narration_script và loại/diễn giải lại tất cả các ký tự đó bằng tiếng Việt hoặc Latin; không được giữ lại dù chỉ 1 ký tự.`
      : '';
    const prompt = [
      'Bạn viết lại MỘT narration tiếng Việt liền mạch cho Pipeline 1 TRƯỚC TTS.',
      `Hard target ${minChars}-${maxChars} ký tự, ưu tiên khoảng ${targetChars}.`,
      attempt === 0
        ? 'Candidate hiện tại là draft ngắn. Hãy mở rộng bằng FULL TRANSCRIPT + VISUAL EVIDENCE, ưu tiên các chi tiết có căn cứ chưa được kể.'
        : `Candidate hiện tại là CHÍNH bản vừa bị code từ chối (${retryReason}). Hãy GIỮ phần tốt của bản này và chỉ sửa lỗi contract; KHÔNG quay lại draft ngắn ban đầu.`,
      cjkRetryRule,
      'Dùng transcript và Vision evidence làm nguồn sự thật duy nhất.',
      'FULL TRANSCRIPT và VISUAL EVIDENCE có thể chứa chữ Hán/Hiragana/Katakana/Hangul do source gốc. Các glyph đó là INPUT-ONLY: không được copy, quote hoặc giữ nguyên trong narration_script.',
      'Nếu một chi tiết source chỉ tồn tại dưới dạng chữ CJK: chỉ diễn giải khi hiểu chắc nghĩa bằng tiếng Việt/Latin; nếu không chắc thì bỏ chi tiết chữ đó, không đoán.',
      'Có thể mở rộng hành động nhìn thấy, trình tự, vật thể, bối cảnh sản phẩm và câu chuyển ý có căn cứ.',
      'Ưu tiên evidence mới/chưa dùng thay vì diễn đạt lại ý đã có.',
      'CẤM lặp nguyên câu, lặp cụm dài, lặp CTA/kết luận/lợi ích dưới cách diễn đạt gần giống.',
      'CẤM bịa claim, số liệu, nguyên liệu, công dụng hoặc chi tiết không có căn cứ.',
      'QUY TẮC NGÔN NGỮ TUYỆT ĐỐI: narration_script phải có ZERO ký tự CJK/Hán/Hiragana/Katakana/Hangul; chỉ dùng tiếng Việt tự nhiên, ký tự Latin, số và dấu câu cần thiết.',
      'TRƯỚC KHI TRẢ JSON: tự quét narration_script từ đầu đến cuối. Nếu còn bất kỳ ký tự CJK nào, phải sửa/xóa/diễn giải lại rồi quét lại; chỉ trả kết quả khi CJK=0.',
      'Không filler chỉ để đủ ký tự.',
      'Output là một narration liên tục, không SRT, numbering, bullet hoặc scene label.',
      'Code sẽ kiểm cứng độ dài, CJK, repeated sentence, near-duplicate sentence và repeated 10-word phrase.',
      'Không giải thích. Chỉ trả JSON đúng schema.',
    ].filter(Boolean).join('\n');

    try {
      return await ollamaNarrationRequest(
        net, event, payload, phase, prompt, candidate, transcript, visualContext, budget, controller, attempt === 0 ? 0.2 : 0.3
      );
    } catch (error) {
      lastError = error;
      if (error?.candidate) candidate = compactNarration(error.candidate);
      const retryable = ['OLLAMA_OUTPUT_TRUNCATED', 'OLLAMA_JSON_INVALID', 'NARRATION_LENGTH_OUT_OF_BUDGET', 'NARRATION_QUALITY_FAILED'].includes(error?.code);
      if (attempt === 0 && retryable && !controller.signal.aborted) {
        emitProgress(
          event,
          `${phase}: chưa đạt contract (${error.code}); retry sẽ sửa chính candidate bị reject${error?.candidate ? ` (${candidate.length} chars)` : ''}, không quay lại draft ${narration.length} chars.`,
          'warning'
        );
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Standard duration recompose thất bại.');
}

function failedRecompose(result, error, message) {
  return {
    ...result,
    ok: false,
    code: error?.code || 'STANDARD_NARRATION_DURATION_RECOMPOSE_FAILED',
    phase: error?.phase || 'Standard narration duration recompose',
    model: error?.model || result?.reasoning_model || null,
    cancelled: error?.code === 'P1_CANCELLED',
    error: error?.message || message,
  };
}

module.exports = function registerP1StandardVisionIPC({ ipcMain, net }) {
  const recomposeControllers = new Map();
  let standardCancelHandler = null;

  const scopedIpcMain = {
    handle(channel, handler) {
      if (channel === 'ollama:p1FitNarration') return undefined;

      if (channel === 'ollama:p1CancelVision') {
        standardCancelHandler = handler;
        return ipcMain.handle('ollama:p1CancelStandardVision', async (event) => {
          const controller = recomposeControllers.get(event.sender.id);
          if (controller && !controller.signal.aborted) controller.abort('owner-stop');
          return standardCancelHandler(event);
        });
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

        const controller = new AbortController();
        recomposeControllers.set(event.sender.id, controller);
        let recomposed;
        try {
          recomposed = await recomposeStandardNarration(net, event, payload, narration, transcript, visualContext, budget, controller);
        } catch (error) {
          return failedRecompose(result, error, 'Evidence-backed Standard narration recompose không đạt contract.');
        } finally {
          if (recomposeControllers.get(event.sender.id) === controller) recomposeControllers.delete(event.sender.id);
        }

        result.analysis.narration_script = recomposed.narration;
        result.narration_quality = recomposed.quality || result.narration_quality || null;
        result.narration_budget = {
          ...budget,
          target_ratio: STANDARD_TARGET_RATIO,
          min_ratio: STANDARD_MIN_RATIO,
          pre_tts_duration_recomposed: true,
          initial_narration_chars: narration.length,
          final_narration_chars: recomposed.narration.length,
        };

        emitProgress(
          event,
          `Standard duration guard PASS: ${narration.length} -> ${recomposed.narration.length} chars; target=${minChars}-${maxChars}. TTS chỉ chạy sau khi narration đủ coverage dự kiến.`,
          'success'
        );
        return result;
      });
    },
  };

  registerStandardVisionIPC({ ipcMain: scopedIpcMain, net });
};