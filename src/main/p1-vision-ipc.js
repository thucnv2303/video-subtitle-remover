const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { execFile } = require('child_process');

const activeRuns = new Map();
const MAX_FRAMES_PER_CHUNK = 8;
const MAX_CHUNKS = 10;
const MAX_CHUNK_IMAGE_CHARS = 12 * 1024 * 1024;
const NARRATION_TARGET_RATIO = 0.975;
const CJK_CHAR_RE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff]/gu;
const REPEAT_NGRAM_WORDS = 10;
const SIMILAR_SENTENCE_MIN_WORDS = 8;
const SIMILAR_SENTENCE_THRESHOLD = 0.88;

const VISION_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    scenes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'integer' },
          time_sec: { type: 'number' },
          visual: { type: 'string' },
          speech_context: { type: 'string' },
          purpose: { type: 'string' },
        },
        required: ['index', 'time_sec', 'visual', 'speech_context', 'purpose'],
      },
    },
    visual_evidence: { type: 'array', items: { type: 'string' } },
    conflicts: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'scenes', 'visual_evidence', 'conflicts'],
};

function emitProgress(event, message, type = 'info', details = {}) {
  try { event.sender.send('p1:vision-progress', { message, type, at: Date.now(), ...details }); } catch { /* renderer closed */ }
}

function localOllamaUrl(rawEndpoint, pathname) {
  const raw = typeof rawEndpoint === 'string' && rawEndpoint.trim() ? rawEndpoint.trim() : 'http://localhost:11434/api/chat';
  const url = new URL(raw.includes('://') ? raw : `http://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Endpoint Ollama phải dùng HTTP hoặc HTTPS.');
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase())) throw new Error('Pipeline 1 chỉ cho phép Ollama local.');
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url.toString();
}

function timeoutError(phase, model, timeoutMs) {
  const err = new Error(`${phase} với model ${model} quá thời gian ${Math.round(timeoutMs / 1000)} giây.`);
  err.code = 'OLLAMA_PHASE_TIMEOUT';
  err.phase = phase;
  err.model = model;
  return err;
}

function outputTruncatedError(phase, model, limit) {
  const err = new Error(`output chạm giới hạn ${limit} token trước khi JSON hoàn tất.`);
  err.code = 'OLLAMA_OUTPUT_TRUNCATED';
  err.phase = phase;
  err.model = model;
  err.tokenLimit = limit;
  return err;
}

function narrationLengthError(phase, model, length, budget) {
  const err = new Error(`narration ${length} ký tự nằm ngoài budget ${budget.min_chars}-${budget.max_chars} ký tự.`);
  err.code = 'NARRATION_LENGTH_OUT_OF_BUDGET';
  err.phase = phase;
  err.model = model;
  err.narrationLength = length;
  err.minChars = budget.min_chars;
  err.maxChars = budget.max_chars;
  return err;
}

function narrationQualityError(phase, model, report) {
  const codes = Array.isArray(report?.issues) ? report.issues.join(', ') : 'UNKNOWN';
  const err = new Error(`narration không đạt quality gate: ${codes}.`);
  err.code = 'NARRATION_QUALITY_FAILED';
  err.phase = phase;
  err.model = model;
  err.quality = report;
  return err;
}

function semanticRemixError(message, details = {}) {
  const err = new Error(message);
  err.code = 'SEMANTIC_REMIX_INVALID';
  Object.assign(err, details);
  return err;
}

function cancelledError() {
  const err = new Error('Pipeline 1 đã được người dùng dừng.');
  err.code = 'P1_CANCELLED';
  return err;
}

async function fetchJson(net, url, options = {}, timeoutMs = 120000, phase = 'Ollama request') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), timeoutMs);
  try {
    const response = await net.fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
    if (!response.ok) throw new Error(body?.error || `${phase}: HTTP ${response.status}`);
    return body;
  } catch (err) {
    if (controller.signal.aborted) throw timeoutError(phase, 'local', timeoutMs);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function parseJsonContent(value) {
  if (value && typeof value === 'object') return value;
  const text = String(value || '').trim();
  if (!text) throw new Error('AI trả về nội dung rỗng.');
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error('AI không trả về JSON hợp lệ.');
  }
}

function compactNarration(value) {
  return String(value || '').replace(/```(?:json)?/gi, '').replace(/\s+/g, ' ').trim();
}

function compactField(value, maxLength) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text;
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

async function modelInfo(net, endpoint, model) {
  return fetchJson(net, localOllamaUrl(endpoint, '/api/show'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, verbose: false }),
  }, 15000, `Đọc capability ${model}`);
}

function modelLabel(info, fallbackName) {
  return `${info?.model || fallbackName || 'unknown'} (${info?.details?.parameter_size || '?'}, ${info?.details?.quantization_level || '?'})`;
}

async function findVisionModel(net, endpoint, preferredModel, event) {
  emitProgress(event, `Kiểm tra capability model đã chọn: ${preferredModel}...`);
  const preferredInfo = await modelInfo(net, endpoint, preferredModel);
  const preferredCaps = Array.isArray(preferredInfo?.capabilities) ? preferredInfo.capabilities : [];
  emitProgress(event, `Reasoning model: ${modelLabel(preferredInfo, preferredModel)}; capability=[${preferredCaps.join(', ') || 'none'}].`);
  if (preferredCaps.includes('vision')) {
    emitProgress(event, `Model ${preferredModel} có vision; dùng model này cho Vision chunks và global reasoning.`, 'success');
    return { model: preferredModel, capabilities: preferredCaps, fallback: false, info: preferredInfo };
  }

  emitProgress(event, `${preferredModel} không có vision. Đang tìm model vision local nhẹ nhất...`, 'warning');
  const tags = await fetchJson(net, localOllamaUrl(endpoint, '/api/tags'), {}, 10000, 'Quét model Ollama');
  const candidates = Array.isArray(tags?.models) ? tags.models
    .map(item => ({ name: item?.name || item?.model, size: Number(item?.size) || Number.MAX_SAFE_INTEGER }))
    .filter(item => item.name && item.name !== preferredModel)
    .sort((a, b) => a.size - b.size) : [];
  for (const candidate of candidates.slice(0, 20)) {
    try {
      const info = await modelInfo(net, endpoint, candidate.name);
      const caps = Array.isArray(info?.capabilities) ? info.capabilities : [];
      if (caps.includes('vision')) {
        emitProgress(event, `Vision model được chọn: ${modelLabel(info, candidate.name)}.`, 'success');
        return { model: candidate.name, capabilities: caps, fallback: true, info };
      }
    } catch (err) {
      emitProgress(event, `Bỏ qua ${candidate.name}: ${err?.message || 'không đọc được capability'}.`, 'warning');
    }
  }
  return { model: null, capabilities: preferredCaps, fallback: false, info: null };
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function compactFrames(frames, maxFrames = MAX_FRAMES_PER_CHUNK) {
  const safe = Array.isArray(frames) ? frames.slice(0, maxFrames) : [];
  let totalChars = 0;
  return safe.map(frame => {
    const image = String(frame?.image_base64 || '');
    totalChars += image.length;
    if (!image) return null;
    if (totalChars > MAX_CHUNK_IMAGE_CHARS) throw new Error('Dữ liệu ảnh của một Vision chunk vượt giới hạn 12 MB sau nén.');
    return {
      frame: Number(frame?.frame) || 0,
      time_sec: Number(frame?.time_sec) || 0,
      image_base64: image,
    };
  }).filter(Boolean);
}

function compactChunks(rawChunks) {
  const input = Array.isArray(rawChunks) ? rawChunks.slice(0, MAX_CHUNKS) : [];
  return input.map((chunk, index) => {
    const frames = compactFrames(chunk?.frames);
    if (!frames.length) throw new Error(`Vision chunk ${index + 1} không có keyframe hợp lệ.`);
    return {
      index,
      start_sec: Math.max(0, Number(chunk?.start_sec) || 0),
      end_sec: Math.max(0, Number(chunk?.end_sec) || 0),
      transcript_srt: String(chunk?.transcript_srt || '').trim(),
      frames,
    };
  });
}

function normalizedTtsSpeed(rawSpeed) {
  const value = Number(rawSpeed);
  if (!Number.isFinite(value)) return 1;
  return Math.max(0.5, Math.min(2, value));
}

function voiceCharsPerSecond(voice) {
  const normalized = String(voice || '').toLowerCase();
  if (normalized.startsWith('clone:')) return 16.5;
  if (normalized.includes('neural')) return 14.5;
  return 15.0;
}

function narrationBudget(videoDurationSec, voice, speed) {
  const duration = Math.max(1, Number(videoDurationSec) || 1);
  const ttsSpeed = normalizedTtsSpeed(speed);
  const rate = voiceCharsPerSecond(voice);
  const minChars = Math.max(40, Math.round(duration * 0.95 * rate * ttsSpeed));
  const maxChars = Math.max(minChars + 10, Math.round(duration * 1.00 * rate * ttsSpeed));
  const targetChars = Math.max(minChars, Math.min(maxChars, Math.round(duration * NARRATION_TARGET_RATIO * rate * ttsSpeed)));
  return {
    voice: String(voice || 'none'),
    speed: ttsSpeed,
    estimated_chars_per_sec: rate,
    min_chars: minChars,
    max_chars: maxChars,
    target_chars: targetChars,
    target_ratio: NARRATION_TARGET_RATIO,
  };
}

function finalSchemaForBudget(budget, videoDurationSec) {
  const duration = Math.max(1, Number(videoDurationSec) || 1);
  const short = duration <= 60;
  const medium = duration <= 180;
  const listMax = short ? 4 : medium ? 6 : 8;
  const beatMax = short ? 8 : medium ? 16 : 24;
  const noteMax = short ? 3 : medium ? 5 : 8;
  const textMax = short ? 140 : medium ? 190 : 240;
  const summaryMax = short ? 220 : medium ? 320 : 420;
  const fieldMax = short ? 120 : medium ? 170 : 220;
  const storyMax = short ? 180 : medium ? 260 : 340;
  const maxTargetDuration = Number((duration * 1.15).toFixed(3));
  const stringArray = (maxItems = listMax) => ({
    type: 'array',
    maxItems,
    items: { type: 'string', maxLength: textMax },
  });
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string', maxLength: summaryMax },
      video_profile: {
        type: 'object',
        additionalProperties: false,
        properties: {
          content_type: { type: 'string', maxLength: fieldMax },
          primary_goal: { type: 'string', maxLength: fieldMax },
          story_structure: { type: 'string', maxLength: storyMax },
          visual_style: { type: 'string', maxLength: fieldMax },
          pacing: { type: 'string', maxLength: fieldMax },
          strengths: stringArray(),
          weaknesses: stringArray(),
        },
        required: ['content_type', 'primary_goal', 'story_structure', 'visual_style', 'pacing', 'strengths', 'weaknesses'],
      },
      product_profile: {
        type: 'object',
        additionalProperties: false,
        properties: {
          product_or_subject: { type: 'string', maxLength: fieldMax },
          category: { type: 'string', maxLength: fieldMax },
          value_proposition: { type: 'string', maxLength: storyMax },
          features: stringArray(),
          benefits: stringArray(),
          proof_points: stringArray(),
          unknowns: stringArray(),
        },
        required: ['product_or_subject', 'category', 'value_proposition', 'features', 'benefits', 'proof_points', 'unknowns'],
      },
      customer_profile: {
        type: 'object',
        additionalProperties: false,
        properties: {
          target_audience: { type: 'string', maxLength: storyMax },
          pains: stringArray(),
          desires: stringArray(),
          objections: stringArray(),
          awareness_level: { type: 'string', maxLength: fieldMax },
          buying_motivation: { type: 'string', maxLength: storyMax },
        },
        required: ['target_audience', 'pains', 'desires', 'objections', 'awareness_level', 'buying_motivation'],
      },
      remix_strategy: {
        type: 'object',
        additionalProperties: false,
        properties: {
          objective: { type: 'string', maxLength: storyMax },
          angle: { type: 'string', maxLength: storyMax },
          hook: { type: 'string', maxLength: storyMax },
          story_arc: { type: 'string', maxLength: summaryMax },
          cta: { type: 'string', maxLength: storyMax },
          target_duration_sec: { type: 'number', exclusiveMinimum: 0, maximum: maxTargetDuration },
          rationale: { type: 'string', maxLength: summaryMax },
        },
        required: ['objective', 'angle', 'hook', 'story_arc', 'cta', 'target_duration_sec', 'rationale'],
      },
      remix_beats: {
        type: 'array',
        minItems: 1,
        maxItems: beatMax,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            beat_index: { type: 'integer', minimum: 0 },
            role: { type: 'string', enum: ['hook', 'problem', 'product', 'demo', 'benefit', 'proof', 'transition', 'cta', 'custom'] },
            message: { type: 'string', maxLength: storyMax },
            source_scene_indexes: {
              type: 'array',
              minItems: 1,
              maxItems: 6,
              items: { type: 'integer', minimum: 0 },
            },
            edit_action: { type: 'string', enum: ['keep', 'trim', 'reorder', 'montage'] },
            target_duration_sec: { type: 'number', exclusiveMinimum: 0, maximum: maxTargetDuration },
            reason: { type: 'string', maxLength: storyMax },
          },
          required: ['beat_index', 'role', 'message', 'source_scene_indexes', 'edit_action', 'target_duration_sec', 'reason'],
        },
      },
      narration_script: {
        type: 'string',
        minLength: 1,
        maxLength: Math.max(1, Math.floor(Number(budget?.max_chars) || 1)),
      },
      edit_notes: { type: 'array', maxItems: noteMax, items: { type: 'string', maxLength: textMax } },
    },
    required: [
      'summary',
      'video_profile',
      'product_profile',
      'customer_profile',
      'remix_strategy',
      'remix_beats',
      'narration_script',
      'edit_notes',
    ],
  };
}

function narrationRepairSchemaForBudget(budget) {
  const minChars = Math.max(1, Math.floor(Number(budget?.min_chars) || 1));
  const maxChars = Math.max(minChars, Math.floor(Number(budget?.max_chars) || minChars));
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      narration_script: {
        type: 'string',
        minLength: minChars,
        maxLength: maxChars,
      },
    },
    required: ['narration_script'],
  };
}

function reasoningTokenBudget(targetChars, videoDurationSec) {
  const narrationTokens = Math.ceil(Math.max(1, Number(targetChars) || 1) / 1.6);
  const duration = Math.max(0, Number(videoDurationSec) || 0);
  const metadataAllowance = duration <= 60 ? 900 : duration <= 180 ? 1500 : 2200;
  return Math.max(1100, Math.min(5200, narrationTokens + metadataAllowance));
}

function narrationOnlyTokenBudget(targetChars) {
  const narrationTokens = Math.ceil(Math.max(1, Number(targetChars) || 1) / 1.6);
  return Math.max(260, Math.min(2600, narrationTokens + 100));
}

function reasoningTimeoutMs(videoDurationSec) {
  const duration = Math.max(0, Number(videoDurationSec) || 0);
  if (duration <= 60) return 150000;
  if (duration <= 180) return 210000;
  return 300000;
}

function visionTokenBudget(frameCount) {
  const count = Math.max(1, Math.min(MAX_FRAMES_PER_CHUNK, Math.floor(Number(frameCount) || 1)));
  return Math.min(2200, 1200 + count * 100);
}

function outputContractPrompt(userPrompt, videoInfo, frameMeta, budget) {
  const duration = Number(videoInfo?.duration || 0).toFixed(2);
  const frameCount = Array.isArray(frameMeta) ? frameMeta.length : 0;
  return `Bạn là bộ SEMANTIC REMIX REASONING cuối của Pipeline 1. Output protocol hệ thống có ưu tiên cao hơn format trong prompt người dùng.\n\nMỤC TIÊU/PHONG CÁCH DO NGƯỜI DÙNG CẤU HÌNH:\n---\n${userPrompt}\n---\n\nDỮ LIỆU NGUỒN/VOICE:\n- Video nguồn: ${duration}s.\n- Voice đã chọn: ${budget.voice}.\n- Tốc độ đọc đã chọn: ${budget.speed.toFixed(2)}x.\n- Nếu giữ gần toàn timeline nguồn thì tham chiếu voice khoảng ${budget.min_chars}-${budget.max_chars} ký tự; đây chỉ là THAM CHIẾU/CEILING, KHÔNG phải mục tiêu bắt buộc.\n- Visual sampling: ${frameCount} keyframe đã được Vision rút gọn thành scene evidence theo timeline.\n\nMỤC TIÊU SẢN PHẨM BẮT BUỘC:\n- Đây KHÔNG phải tác vụ dịch transcript hoặc tóm tắt lời thoại cho có nghĩa.\n- Phải kết hợp FULL TRANSCRIPT có timestamp + scene evidence trực quan để hiểu video trước, sau đó mới viết kịch bản mới.\n- Thứ tự suy luận bắt buộc: video_profile -> product_profile -> customer_profile -> remix_strategy -> remix_beats -> narration_script.\n- video_profile phải cho biết video hiện tại đang kể gì, mục tiêu gì, cấu trúc/pacing/style và điểm mạnh/yếu.\n- product_profile phải tách rõ sản phẩm/chủ thể, value proposition, feature/benefit/proof và điều CHƯA biết; không được biến điều chưa biết thành fact.\n- customer_profile phải suy luận khách hàng mục tiêu từ evidence, gồm pain/desire/objection/awareness/motivation; nếu evidence yếu phải diễn đạt thận trọng.\n- remix_strategy phải là một chiến lược mới có angle/hook/story arc/CTA và target_duration_sec CỐ Ý. Target có thể ngắn hơn video nguồn nếu bỏ đoạn lặp/rườm rà. Không được chọn target chỉ vì narration tình cờ ngắn.\n- remix_beats là timeline nội dung mới. Mỗi beat phải tham chiếu ÍT NHẤT một source_scene_indexes có thật trong VISUAL EVIDENCE JSON; tuyệt đối không bịa scene id. Được reorder/montage các cảnh nguồn nếu phục vụ strategy.\n- Mỗi beat phải nói rõ message, role, edit_action, target_duration_sec và reason để Pipeline 3 có thể cắt/reorder sau này.\n- narration_script là MỘT lời thoại tiếng Việt LIỀN MẠCH đọc từ đầu đến cuối; không SRT, không numbering, không bullet, không nhãn Scene, không chia mini-script theo cảnh.\n- Narration phải được VIẾT MỚI theo remix strategy; không được chỉ dịch hoặc paraphrase tuần tự transcript nguồn.\n- Có thể thay đổi thứ tự nhấn mạnh và mô tả hành động/sản phẩm nhìn thấy rõ trong Vision evidence.\n- Mọi claim sản phẩm, số liệu, nguyên liệu, lợi ích, testimonial phải có căn cứ từ transcript hoặc Vision evidence; không bịa chi tiết.\n- Chất lượng ưu tiên hơn số ký tự: không lặp câu, không lặp CTA/kết luận, không filler. Không cần chạm ${budget.min_chars}; tuyệt đối không vượt ${budget.max_chars} ký tự.\n- Chỉ dùng tiếng Việt tự nhiên; không chèn ký tự CJK/Hán/Nhật/Hàn lạc ngữ cảnh.\n- CTA/kết luận chỉ xuất hiện một lần ở cuối nếu phù hợp strategy.\n- Nếu evidence mâu thuẫn, ghi nhận trong profile/unknowns hoặc diễn đạt trung tính thay vì tự quyết định một fact.\n- RESPONSE chỉ là JSON đúng schema hệ thống, không giải thích ngoài JSON.`;
}

function canonicalizeSceneInventory(chunkAnalyses, videoDurationSec) {
  const duration = Math.max(0.001, Number(videoDurationSec) || 0.001);
  const raw = [];
  (Array.isArray(chunkAnalyses) ? chunkAnalyses : []).forEach((chunk, chunkIndex) => {
    const analysis = chunk?.analysis || {};
    const scenes = Array.isArray(analysis.scenes) ? analysis.scenes : [];
    scenes.forEach((scene, sceneIndex) => {
      const rawTime = Number(scene?.time_sec);
      const fallbackStart = Number(chunk?.start_sec) || 0;
      const fallbackEnd = Math.max(fallbackStart, Number(chunk?.end_sec) || fallbackStart);
      const fallbackRatio = scenes.length <= 1 ? 0.5 : sceneIndex / Math.max(1, scenes.length - 1);
      const fallbackTime = fallbackStart + (fallbackEnd - fallbackStart) * fallbackRatio;
      const timeSec = Math.max(0, Math.min(duration, Number.isFinite(rawTime) ? rawTime : fallbackTime));
      raw.push({
        chunk_index: Number.isFinite(Number(chunk?.index)) ? Number(chunk.index) : chunkIndex,
        time_sec: Number(timeSec.toFixed(3)),
        visual: compactField(scene?.visual, 240),
        speech_context: compactField(scene?.speech_context, 220),
        purpose: compactField(scene?.purpose, 180),
      });
    });
  });

  raw.sort((left, right) => left.time_sec - right.time_sec || left.chunk_index - right.chunk_index);
  return raw.map((scene, index) => {
    const previous = raw[index - 1];
    const next = raw[index + 1];
    const start = index === 0
      ? 0
      : Math.max(0, Math.min(scene.time_sec, (previous.time_sec + scene.time_sec) / 2));
    const estimatedEnd = index === raw.length - 1
      ? duration
      : Math.min(duration, Math.max(scene.time_sec, (scene.time_sec + next.time_sec) / 2));
    const end = Math.min(duration, Math.max(start + 0.05, estimatedEnd));
    return {
      index,
      ...scene,
      start_sec: Number(start.toFixed(3)),
      end_sec: Number(end.toFixed(3)),
    };
  });
}

function compactReasoningContext(chunkAnalyses, sceneInventory = []) {
  const chunks = (Array.isArray(chunkAnalyses) ? chunkAnalyses : []).map(chunk => {
    const analysis = chunk?.analysis || {};
    return {
      index: Number(chunk?.index) || 0,
      start_sec: Number(chunk?.start_sec) || 0,
      end_sec: Number(chunk?.end_sec) || 0,
      summary: compactField(analysis.summary, 220),
      visual_evidence: (Array.isArray(analysis.visual_evidence) ? analysis.visual_evidence : []).slice(0, 6).map(item => compactField(item, 180)),
      conflicts: (Array.isArray(analysis.conflicts) ? analysis.conflicts : []).slice(0, 4).map(item => compactField(item, 180)),
    };
  });
  const scenes = (Array.isArray(sceneInventory) ? sceneInventory : []).slice(0, 80).map(scene => ({
    index: Number(scene?.index) || 0,
    chunk_index: Number(scene?.chunk_index) || 0,
    start_sec: Number(scene?.start_sec) || 0,
    end_sec: Number(scene?.end_sec) || 0,
    time_sec: Number(scene?.time_sec) || 0,
    visual: compactField(scene?.visual, 220),
    speech_context: compactField(scene?.speech_context, 180),
    purpose: compactField(scene?.purpose, 150),
  }));
  return {
    chunks,
    scenes,
    visual_evidence: chunks.flatMap(chunk => chunk.visual_evidence).slice(0, 24),
    conflicts: chunks.flatMap(chunk => chunk.conflicts).slice(0, 12),
  };
}

function assertNarrationWithinBudget(value, budget, phase, model) {
  const narration = compactNarration(value);
  const minChars = Math.max(1, Math.floor(Number(budget?.min_chars) || 1));
  const maxChars = Math.max(minChars, Math.floor(Number(budget?.max_chars) || minChars));
  if (!narration) throw narrationLengthError(phase, model, 0, { min_chars: minChars, max_chars: maxChars });
  if (narration.length < minChars || narration.length > maxChars) {
    throw narrationLengthError(phase, model, narration.length, { min_chars: minChars, max_chars: maxChars });
  }
  return narration;
}

function assertNarrationWithinDraftBudget(value, budget, phase, model) {
  return assertNarrationWithinBudget(value, {
    min_chars: 1,
    max_chars: Math.max(1, Math.floor(Number(budget?.max_chars) || 1)),
  }, phase, model);
}

function assertNarrationQuality(value, phase, model) {
  const narration = compactNarration(value);
  const report = narrationQualityReport(narration);
  if (!report.ok) throw narrationQualityError(phase, model, report);
  return { narration, report };
}

function assertSemanticRemixPlan(value, scenes, videoDurationSec, phase, model) {
  const fail = (message, details = {}) => {
    throw semanticRemixError(`${phase} / ${model}: ${message}`, { phase, model, ...details });
  };
  if (!value || typeof value !== 'object') fail('semantic remix output rỗng hoặc sai kiểu.');

  const requiredObjects = ['video_profile', 'product_profile', 'customer_profile', 'remix_strategy'];
  for (const field of requiredObjects) {
    if (!value[field] || typeof value[field] !== 'object' || Array.isArray(value[field])) {
      fail(`thiếu ${field}.`, { field });
    }
  }

  const sourceDuration = Math.max(0.001, Number(videoDurationSec) || 0.001);
  const targetDuration = Number(value.remix_strategy?.target_duration_sec);
  if (!(targetDuration > 0)) fail('remix_strategy.target_duration_sec phải > 0.', { field: 'remix_strategy.target_duration_sec' });
  if (targetDuration > sourceDuration * 1.15) {
    fail(`target remix ${targetDuration.toFixed(2)}s vượt quá giới hạn an toàn 115% source ${sourceDuration.toFixed(2)}s.`, {
      targetDuration,
      sourceDuration,
    });
  }

  const sceneIds = new Set((Array.isArray(scenes) ? scenes : []).map(scene => Number(scene?.index)).filter(Number.isInteger));
  if (!sceneIds.size) fail('không có canonical source scene để map remix beats.');

  const beats = Array.isArray(value.remix_beats) ? value.remix_beats : [];
  if (!beats.length) fail('remix_beats rỗng.');
  const validRoles = new Set(['hook', 'problem', 'product', 'demo', 'benefit', 'proof', 'transition', 'cta', 'custom']);
  const validActions = new Set(['keep', 'trim', 'reorder', 'montage']);
  const seenBeatIndexes = new Set();
  const referencedSceneIds = new Set();
  let summedBeatDuration = 0;

  const normalizedBeats = beats.map((beat, arrayIndex) => {
    const beatIndex = Number(beat?.beat_index);
    if (!Number.isInteger(beatIndex) || beatIndex < 0) fail(`beat ${arrayIndex} có beat_index không hợp lệ.`, { beatIndex });
    if (seenBeatIndexes.has(beatIndex)) fail(`beat_index ${beatIndex} bị trùng.`, { beatIndex });
    seenBeatIndexes.add(beatIndex);

    const role = String(beat?.role || '').trim();
    if (!validRoles.has(role)) fail(`beat ${beatIndex} có role không hợp lệ: ${role || '(empty)'}.`, { beatIndex, role });
    const action = String(beat?.edit_action || '').trim();
    if (!validActions.has(action)) fail(`beat ${beatIndex} có edit_action không hợp lệ: ${action || '(empty)'}.`, { beatIndex, action });

    const sourceSceneIndexes = [...new Set((Array.isArray(beat?.source_scene_indexes) ? beat.source_scene_indexes : [])
      .map(Number)
      .filter(Number.isInteger))];
    if (!sourceSceneIndexes.length) fail(`beat ${beatIndex} không tham chiếu source scene.`, { beatIndex });
    for (const sceneIndex of sourceSceneIndexes) {
      if (!sceneIds.has(sceneIndex)) fail(`beat ${beatIndex} tham chiếu scene ${sceneIndex} không tồn tại.`, { beatIndex, sceneIndex });
      referencedSceneIds.add(sceneIndex);
    }

    const beatDuration = Number(beat?.target_duration_sec);
    if (!(beatDuration > 0)) fail(`beat ${beatIndex} có target_duration_sec không hợp lệ.`, { beatIndex, beatDuration });
    summedBeatDuration += beatDuration;
    return {
      ...beat,
      beat_index: beatIndex,
      role,
      edit_action: action,
      source_scene_indexes: sourceSceneIndexes,
      target_duration_sec: Number(beatDuration.toFixed(3)),
    };
  }).sort((left, right) => left.beat_index - right.beat_index);

  value.remix_strategy.target_duration_sec = Number(targetDuration.toFixed(3));
  value.remix_beats = normalizedBeats;
  value.semantic_coverage = {
    source_scene_count: sceneIds.size,
    referenced_scene_count: referencedSceneIds.size,
    beat_count: normalizedBeats.length,
    summed_beat_duration_sec: Number(summedBeatDuration.toFixed(3)),
  };
  return value;
}

function bytesToGiB(value) {
  return (Number(value || 0) / (1024 ** 3)).toFixed(1);
}

async function runningModels(net, endpoint) {
  const result = await fetchJson(net, localOllamaUrl(endpoint, '/api/ps'), {}, 5000, 'Đọc model đang chạy');
  return Array.isArray(result?.models) ? result.models : [];
}

function startModelMonitor(net, endpoint, event, model, phase) {
  let stopped = false;
  let polling = false;
  let lastSignature = '';
  const progressKey = `ollama:${phase.toLowerCase().replace(/\s+/g, '-')}`;
  const poll = async () => {
    if (stopped || polling) return;
    polling = true;
    try {
      const models = await runningModels(net, endpoint);
      const active = models.find(item => (item?.name || item?.model) === model);
      if (active) {
        const signature = `${active.size || 0}:${active.size_vram || 0}:${active.context_length || 0}`;
        if (signature !== lastSignature) {
          lastSignature = signature;
          emitProgress(event, `${phase}: ${model} đang được Ollama giữ trong bộ nhớ; model=${bytesToGiB(active.size)} GiB, VRAM=${bytesToGiB(active.size_vram)} GiB, ctx=${active.context_length || '?'}.`, 'info', { progress_key: progressKey });
        }
      } else if (lastSignature !== 'not-loaded') {
        lastSignature = 'not-loaded';
        emitProgress(event, `${phase}: đang chờ Ollama load ${model}...`, 'info', { progress_key: progressKey });
      }
    } catch {
      // Telemetry cannot fail inference.
    } finally {
      polling = false;
    }
  };
  poll();
  const timer = setInterval(poll, 4000);
  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

async function unloadModel(net, endpoint, model, event) {
  emitProgress(event, `Giải phóng model ${model} trước global reasoning...`);
  try {
    await fetchJson(net, localOllamaUrl(endpoint, '/api/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: '', stream: false, keep_alive: 0 }),
    }, 30000, `Unload ${model}`);
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      const active = await runningModels(net, endpoint).catch(() => []);
      if (!active.some(item => (item?.name || item?.model) === model)) {
        emitProgress(event, `Đã giải phóng ${model}.`, 'success');
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    emitProgress(event, `${model} vẫn còn trong /api/ps sau yêu cầu unload; tiếp tục với cảnh báo.`, 'warning');
  } catch (err) {
    emitProgress(event, `Không xác nhận được unload ${model}: ${err?.message || err}.`, 'warning');
  }
}

async function chatStream(net, endpoint, model, messages, { event, phase, format, timeoutMs, numPredict, runController }) {
  if (runController.signal.aborted) throw cancelledError();
  const started = Date.now();
  const progressKey = `ollama:${phase.toLowerCase().replace(/\s+/g, '-')}`;
  const timeout = setTimeout(() => {
    if (!runController.signal.aborted) runController.abort({ type: 'timeout', phase, model, timeoutMs });
  }, timeoutMs);
  const stopMonitor = startModelMonitor(net, endpoint, event, model, phase);
  emitProgress(event, `${phase}: gửi request tới ${model}; timeout=${Math.round(timeoutMs / 1000)}s; output_limit=${numPredict} token.`, 'info', { progress_key: progressKey });

  try {
    const response = await net.fetch(localOllamaUrl(endpoint, '/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: runController.signal,
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        format,
        think: false,
        keep_alive: 0,
        options: { temperature: 0.2, num_predict: numPredict },
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      let detail = text;
      try { detail = JSON.parse(text)?.error || text; } catch { /* keep text */ }
      throw new Error(`${phase} / ${model}: HTTP ${response.status} ${detail || ''}`.trim());
    }
    if (!response.body?.getReader) throw new Error(`${phase} / ${model}: response stream không khả dụng.`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let pending = '';
    let content = '';
    let chunkCount = 0;
    let firstOutputAt = null;
    let finalChunk = null;
    const consume = (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const item = JSON.parse(trimmed);
      if (item?.error) throw new Error(`${phase} / ${model}: ${item.error}`);
      const part = item?.message?.content;
      if (typeof part === 'string' && part) {
        content += part;
        if (!firstOutputAt) {
          firstOutputAt = Date.now();
          emitProgress(event, `${phase}: ${model} đã bắt đầu sinh output sau ${((firstOutputAt - started) / 1000).toFixed(1)}s.`, 'success');
        }
      }
      chunkCount += 1;
      if (chunkCount % 25 === 0) {
        emitProgress(event, `${phase}: ${model} đang sinh output... ${((Date.now() - started) / 1000).toFixed(0)}s.`, 'info', { progress_key: progressKey });
      }
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
    if (!content.trim()) throw new Error(`${phase} / ${model}: Ollama kết thúc nhưng không trả content.`);

    const evalCount = Number(finalChunk?.eval_count || 0);
    const doneReason = String(finalChunk?.done_reason || '').toLowerCase();
    if (doneReason === 'length' || (evalCount >= numPredict && doneReason !== 'stop')) {
      throw outputTruncatedError(phase, model, numPredict);
    }
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    const evalDuration = Number(finalChunk?.eval_duration || 0);
    const tokPerSec = evalDuration > 0 ? (evalCount / (evalDuration / 1e9)).toFixed(1) : '?';
    emitProgress(event, `${phase}: ${model} hoàn tất trong ${elapsed}s; output_tokens=${evalCount || '?'}, tốc độ=${tokPerSec} tok/s.`, 'success', { progress_key: progressKey, progress_done: true });
    return { message: { content }, metrics: finalChunk || {} };
  } catch (err) {
    if (runController.signal.aborted) {
      const reason = runController.signal.reason;
      if (reason && typeof reason === 'object' && reason.type === 'timeout') {
        throw timeoutError(reason.phase || phase, reason.model || model, reason.timeoutMs || timeoutMs);
      }
      throw cancelledError();
    }
    throw err;
  } finally {
    clearTimeout(timeout);
    stopMonitor();
  }
}

function parseStructuredResult(result, phase, model, limit) {
  try {
    return parseJsonContent(result?.message?.content);
  } catch (err) {
    const wrapped = new Error(`${phase} / ${model}: JSON output không hợp lệ — ${err?.message || err}`);
    wrapped.code = 'OLLAMA_JSON_INVALID';
    wrapped.phase = phase;
    wrapped.model = model;
    wrapped.tokenLimit = limit;
    throw wrapped;
  }
}

function parseFinalReasoningResult(result, phase, model, limit, budget, sceneInventory, videoDurationSec) {
  const parsed = parseStructuredResult(result, phase, model, limit);
  parsed.narration_script = assertNarrationWithinDraftBudget(parsed?.narration_script, budget, phase, model);
  return assertSemanticRemixPlan(parsed, sceneInventory, videoDurationSec, phase, model);
}

async function repairNarrationQuality(net, endpoint, model, narration, budget, event, runController, options = {}) {
  const phase = String(options.phase || 'Narration quality repair');
  const requireFullBudget = Boolean(options.requireFullBudget);
  const initial = narrationQualityReport(narration);
  if (initial.ok) {
    emitProgress(event, `${phase}: quality gate PASS; ${qualitySummary(initial)}.`, 'success');
    return { narration: compactNarration(narration), report: initial, repaired: false };
  }

  emitProgress(event, `${phase}: quality gate phát hiện lỗi; ${qualitySummary(initial)}. Sửa narration đúng 1 lần, không chạy lại Vision.`, 'warning');
  const maxChars = Math.max(1, Math.floor(Number(budget?.max_chars) || compactNarration(narration).length || 1));
  const targetChars = Math.max(1, Math.floor(Number(budget?.target_chars) || Math.min(maxChars, compactNarration(narration).length || 1)));
  const limit = narrationOnlyTokenBudget(targetChars);
  const hardRangeRule = requireFullBudget
    ? `Kết quả phải nằm trong ${budget.min_chars}-${budget.max_chars} ký tự để còn đủ thời lượng; nếu không thể đạt min mà vẫn tự nhiên và không lặp, hãy trả bản tự nhiên ngắn hơn và hệ thống sẽ fail thay vì chấp nhận filler.`
    : `Mục tiêu mềm là ${budget.min_chars}-${budget.max_chars} ký tự, ưu tiên khoảng ${targetChars}; không cần chạm min và tuyệt đối không vượt ${maxChars} ký tự.`;
  const prompt = [
    'Bạn chỉ làm nhiệm vụ làm sạch chất lượng MỘT narration tiếng Việt đã có.',
    hardRangeRule,
    'Xóa hoàn toàn câu/ý/CTA/kết luận bị lặp; không thay lặp nguyên văn bằng một câu gần giống để né kiểm tra.',
    'CTA hoặc lời kết chỉ xuất hiện một lần ở cuối nếu thật sự cần.',
    'Loại bỏ ký tự Hán/Nhật/Hàn hoặc token lạc ngôn ngữ; diễn đạt lại bằng tiếng Việt tự nhiên, nếu không chắc nghĩa thì bỏ chi tiết đó.',
    'Giữ nhất quán tên chủ thể, sản phẩm, nguyên liệu và đối tượng; không tự đổi tên giữa các câu.',
    'Không thêm claim, số liệu, nguyên liệu, công dụng hay CTA mới không có trong narration hiện tại.',
    'Không dùng filler chỉ để tăng số ký tự. Chất lượng và mạch kể tự nhiên ưu tiên hơn việc chạm target mềm.',
    'Output là một đoạn narration liên tục: không SRT, không numbering, không bullet, không chia scene.',
    'Không giải thích. Chỉ trả JSON đúng schema.',
  ].join('\n');
  const result = await chatStream(net, endpoint, model, [
    { role: 'system', content: prompt },
    { role: 'user', content: compactNarration(narration) },
  ], {
    event,
    phase,
    format: narrationRepairSchemaForBudget({ max_chars: maxChars }),
    timeoutMs: 120000,
    numPredict: limit,
    runController,
  });
  const parsed = parseStructuredResult(result, phase, model, limit);
  let repaired = assertNarrationWithinDraftBudget(parsed?.narration_script, { max_chars: maxChars }, phase, model);
  if (requireFullBudget) repaired = assertNarrationWithinBudget(repaired, budget, phase, model);
  const checked = assertNarrationQuality(repaired, phase, model);
  emitProgress(event, `${phase}: quality gate PASS sau 1 lần sửa; ${qualitySummary(checked.report)}.`, 'success');
  return { narration: checked.narration, report: checked.report, repaired: true };
}

async function runReasoningWithOneRepair(net, endpoint, model, systemPrompt, transcript, visualContext, budget, event, runController, videoDurationSec) {
  const primaryLimit = reasoningTokenBudget(budget.target_chars, videoDurationSec);
  const timeoutMs = reasoningTimeoutMs(videoDurationSec);
  const format = finalSchemaForBudget(budget, videoDurationSec);
  const sceneInventory = Array.isArray(visualContext?.scenes) ? visualContext.scenes : [];
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `TRANSCRIPT SRT TOÀN VIDEO:\n${transcript}\n\nVISUAL EVIDENCE JSON ĐÃ RÚT GỌN:\n${JSON.stringify(visualContext)}` },
  ];
  try {
    const result = await chatStream(net, endpoint, model, messages, {
      event,
      phase: 'Global reasoning/remix',
      format,
      timeoutMs,
      numPredict: primaryLimit,
      runController,
    });
    return parseFinalReasoningResult(result, 'Global reasoning/remix', model, primaryLimit, budget, sceneInventory, videoDurationSec);
  } catch (err) {
    if (!['OLLAMA_OUTPUT_TRUNCATED', 'OLLAMA_JSON_INVALID', 'NARRATION_LENGTH_OUT_OF_BUDGET', 'SEMANTIC_REMIX_INVALID'].includes(err?.code) || runController.signal.aborted) throw err;
    emitProgress(event, `Global reasoning/remix: output chưa đạt semantic contract (${err.code}); thử lại đúng 1 lần.`, 'warning');
    const repairPrompt = `${systemPrompt}\n\nLẦN THỬ LẠI BẮT BUỘC:\n- Chỉ trả JSON hợp lệ đúng schema semantic-remix.\n- Phải có đủ video_profile, product_profile, customer_profile, remix_strategy, remix_beats, narration_script.\n- Mỗi remix beat phải tham chiếu source_scene_indexes có thật trong VISUAL EVIDENCE JSON; không bịa scene id.\n- target_duration_sec phải là quyết định remix có rationale, không phải lấy độ dài narration hiện tại làm lý do.\n- narration_script phải là kịch bản mới theo strategy, không dịch/paraphrase tuần tự transcript.\n- Không lặp câu/CTA/filler; không CJK lạc ngữ cảnh; không bịa fact.\n- Narration không được vượt ${budget.max_chars} ký tự; không bắt buộc chạm ${budget.min_chars}.`;
    const repaired = await chatStream(net, endpoint, model, [
      { role: 'system', content: repairPrompt },
      { role: 'user', content: `TRANSCRIPT SRT TOÀN VIDEO:\n${transcript}\n\nVISUAL EVIDENCE JSON ĐÃ RÚT GỌN:\n${JSON.stringify(visualContext)}` },
    ], {
      event,
      phase: 'Global reasoning/remix retry',
      format,
      timeoutMs,
      numPredict: primaryLimit,
      runController,
    });
    return parseFinalReasoningResult(repaired, 'Global reasoning/remix retry', model, primaryLimit, budget, sceneInventory, videoDurationSec);
  }
}

async function analyzeVisionChunks(net, endpoint, model, chunks, event, runController) {
  const results = [];
  for (let i = 0; i < chunks.length; i += 1) {
    if (runController.signal.aborted) throw cancelledError();
    const chunk = chunks[i];
    const phase = `Vision chunk ${i + 1}/${chunks.length}`;
    const limit = visionTokenBudget(chunk.frames.length);
    const images = chunk.frames.map(frame => frame.image_base64);
    const frameMeta = chunk.frames.map(({ frame, time_sec }) => ({ frame, time_sec }));
    emitProgress(event, `${phase}: ${chunk.start_sec.toFixed(1)}–${chunk.end_sec.toFixed(1)}s; ${chunk.frames.length} keyframe.`, 'info');
    const result = await chatStream(net, endpoint, model, [
      {
        role: 'system',
        content: 'Bạn chỉ làm nhiệm vụ thu thập visual evidence cho một đoạn video. Trả JSON đúng schema. Chỉ mô tả điều có căn cứ trực quan; dùng transcript đoạn này để đối chiếu nhưng không lặp transcript. Tối đa một scene cho mỗi keyframe; summary tối đa 2 câu; mỗi field scene tối đa 1 câu ngắn; visual_evidence tối đa 6 mục; conflicts tối đa 4 mục; không tạo remix script và không thêm giải thích ngoài JSON.',
      },
      {
        role: 'user',
        content: `CHUNK RANGE: ${chunk.start_sec.toFixed(3)}s–${chunk.end_sec.toFixed(3)}s\nTRANSCRIPT SRT TRONG CHUNK:\n${chunk.transcript_srt || '(không có lời thoại trong khoảng này)'}\n\nKeyframe timestamps: ${JSON.stringify(frameMeta)}`,
        images,
      },
    ], {
      event,
      phase,
      format: VISION_SCHEMA,
      timeoutMs: 240000,
      numPredict: limit,
      runController,
    });
    const analysis = parseStructuredResult(result, phase, model, limit);
    results.push({
      index: chunk.index,
      start_sec: chunk.start_sec,
      end_sec: chunk.end_sec,
      keyframes: frameMeta,
      transcript_segment_count: (chunk.transcript_srt.match(/-->/g) || []).length,
      analysis,
    });
  }
  return results;
}

function runCommand(command, args, timeoutMs = 120000) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true, timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        const detail = String(stderr || error.message || '').trim();
        reject(new Error(detail || `${command} thất bại.`));
        return;
      }
      resolve({ stdout: String(stdout || ''), stderr: String(stderr || '') });
    });
  });
}

function atempoFilter(speed) {
  let remaining = normalizedTtsSpeed(speed);
  const parts = [];
  while (remaining > 2.0) {
    parts.push('atempo=2.0');
    remaining /= 2.0;
  }
  while (remaining < 0.5) {
    parts.push('atempo=0.5');
    remaining /= 0.5;
  }
  parts.push(`atempo=${remaining.toFixed(6)}`);
  return parts.join(',');
}

async function probeAudioDurationMs(filePath) {
  const result = await runCommand('ffprobe', [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ], 30000);
  const seconds = Number(result.stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) throw new Error('ffprobe không đọc được duration audio TTS.');
  return Math.round(seconds * 1000);
}

async function prepareNarrationAudio(payload = {}) {
  const sourcePath = String(payload.source_path || '').trim();
  const artifactDir = String(payload.artifact_dir || '').trim();
  const speed = normalizedTtsSpeed(payload.speed);
  if (!sourcePath || !fs.existsSync(sourcePath)) return { ok: false, error: 'Không tìm thấy audio TTS nguồn.' };
  if (!artifactDir) return { ok: false, error: 'Artifact directory đang trống.' };

  fs.mkdirSync(artifactDir, { recursive: true });
  const target = path.join(artifactDir, 'voice.wav');
  const tempTarget = path.join(artifactDir, 'voice.preparing.wav');
  try { if (fs.existsSync(tempTarget)) fs.unlinkSync(tempTarget); } catch { /* best effort */ }

  const args = ['-y', '-hide_banner', '-loglevel', 'error', '-i', sourcePath, '-vn'];
  if (Math.abs(speed - 1) >= 0.001) args.push('-filter:a', atempoFilter(speed));
  args.push('-c:a', 'pcm_s16le', tempTarget);
  await runCommand('ffmpeg', args, 180000);
  if (!fs.existsSync(tempTarget) || fs.statSync(tempTarget).size <= 0) {
    throw new Error('ffmpeg không tạo được audio narration đã chuẩn hóa.');
  }
  if (fs.existsSync(target)) fs.unlinkSync(target);
  fs.renameSync(tempTarget, target);
  const durationMs = await probeAudioDurationMs(target);
  return {
    ok: true,
    audio_path: target,
    duration_ms: durationMs,
    speed,
    adjusted: Math.abs(speed - 1) >= 0.001,
  };
}

function narrationRepairBudget(narration, audioDurationMs, videoDurationMs) {
  const text = compactNarration(narration);
  const audioSec = Math.max(0.001, Number(audioDurationMs) / 1000);
  const videoSec = Math.max(0.001, Number(videoDurationMs) / 1000);
  const measuredCharsPerSec = Math.max(1, text.length / audioSec);
  const minChars = Math.max(30, Math.round(measuredCharsPerSec * videoSec * 0.95));
  const maxChars = Math.max(minChars + 10, Math.round(measuredCharsPerSec * videoSec * 1.00));
  const targetChars = Math.max(minChars, Math.min(maxChars, Math.round(measuredCharsPerSec * videoSec * NARRATION_TARGET_RATIO)));
  return {
    measured_chars_per_sec: measuredCharsPerSec,
    min_chars: minChars,
    max_chars: maxChars,
    target_chars: targetChars,
  };
}

function evidenceRecomposePrompt(narration, budget, audioDurationMs, videoDurationMs, retryReason = '') {
  const retry = retryReason
    ? `Lần trước bị code từ chối (${retryReason}). Lần này phải sửa đúng lỗi đó, không né validation.`
    : 'Đây là lần recomposition evidence-backed đầu tiên.';
  return [
    'Bạn đang RECOMPOSE TOÀN BỘ narration tiếng Việt cho Pipeline 1 để khớp thời lượng TTS đã đo.',
    `Narration hiện tại: ${narration.length} ký tự; voice đo thật ${(audioDurationMs / 1000).toFixed(2)}s; video ${(videoDurationMs / 1000).toFixed(2)}s.`,
    `Hard target theo measured voice rate: ${budget.min_chars}-${budget.max_chars} ký tự, ưu tiên khoảng ${budget.target_chars}.`,
    retry,
    'Bạn có FULL TRANSCRIPT và VISUAL EVIDENCE đã được Vision trích xuất. Phải tận dụng các chi tiết có căn cứ từ cả hai nguồn để phủ đủ timeline.',
    'Được mô tả hành động, vật thể, quy trình hoặc diễn biến nhìn thấy rõ trong visual evidence, kể cả vùng transcript ít lời.',
    'Được thêm câu chuyển ý tự nhiên để nối các evidence đã có.',
    'CẤM bịa claim, số liệu, công dụng, nguyên liệu, tên sản phẩm, lợi ích hoặc chi tiết không có căn cứ trong transcript/visual evidence.',
    'CẤM lặp câu, lặp CTA/kết luận, diễn đạt vòng vo hoặc filler chỉ để đủ ký tự.',
    'CTA/kết luận tối đa một lần ở cuối nếu evidence/narration hiện tại có căn cứ.',
    'Giữ nhất quán chủ thể/sản phẩm/nguyên liệu. Nếu evidence mâu thuẫn, dùng diễn đạt trung tính.',
    'Chỉ tiếng Việt tự nhiên, không ký tự CJK lạc ngữ cảnh.',
    'Output là MỘT narration liền mạch, không SRT, không numbering, không bullet, không chia scene.',
    'Nếu evidence thực sự không đủ để đạt hard target mà không bịa/lặp/filler, vẫn ưu tiên đúng sự thật; code sẽ fail closed.',
    'Không giải thích. Chỉ trả JSON đúng schema.',
  ].join('\n');
}

module.exports = function registerP1VisionIPC({ ipcMain, net }) {
  ipcMain.handle('p1:persistAudio', async (event, payload = {}) => {
    try {
      const sourcePath = String(payload.source_path || '').trim();
      const artifactDir = String(payload.artifact_dir || '').trim();
      if (!sourcePath || !fs.existsSync(sourcePath)) return { ok: false, error: 'Không tìm thấy audio TTS nguồn.' };
      if (!artifactDir) return { ok: false, error: 'Artifact directory đang trống.' };
      const ext = path.extname(sourcePath).toLowerCase() || '.mp3';
      if (!['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.opus'].includes(ext)) return { ok: false, error: 'Định dạng audio TTS không hợp lệ.' };
      fs.mkdirSync(artifactDir, { recursive: true });
      const target = path.join(artifactDir, `voice${ext}`);
      fs.copyFileSync(sourcePath, target);
      return { ok: true, audio_path: target };
    } catch (err) {
      return { ok: false, error: err?.message || 'Không thể lưu audio Pipeline 1.' };
    }
  });

  ipcMain.handle('p1:prepareNarrationAudio', async (event, payload = {}) => {
    try {
      return await prepareNarrationAudio(payload);
    } catch (err) {
      return { ok: false, error: err?.message || 'Không thể chuẩn hóa audio narration.' };
    }
  });

  ipcMain.handle('ollama:p1CancelVision', async (event) => {
    const key = event.sender.id;
    const run = activeRuns.get(key);
    if (!run) return { ok: true, cancelled: false, message: 'Không có Ollama P1 request đang chạy.' };
    if (!run.controller.signal.aborted) run.controller.abort('owner-stop');
    emitProgress(event, 'Đã nhận yêu cầu dừng multimodal inference.', 'warning');
    return { ok: true, cancelled: true };
  });

  ipcMain.handle('ollama:p1FitNarration', async (event, payload = {}) => {
    const runKey = event.sender.id;
    const previous = activeRuns.get(runKey);
    if (previous && !previous.controller.signal.aborted) previous.controller.abort('superseded');
    const runController = new AbortController();
    activeRuns.set(runKey, { controller: runController });
    try {
      const model = String(payload.model || '').trim();
      const endpoint = payload.endpoint;
      const narration = compactNarration(payload.narration_script);
      const audioDurationMs = Number(payload.audio_duration_ms) || 0;
      const videoDurationMs = Number(payload.video_duration_ms) || 0;
      const transcript = String(payload.transcript_srt || '').trim();
      const visualContext = payload.visual_context && typeof payload.visual_context === 'object'
        ? payload.visual_context
        : null;
      const evidenceMode = Boolean(transcript && visualContext);
      if (!model) return { ok: false, error: 'Chưa chọn reasoning model cho narration fit.' };
      if (!narration) return { ok: false, error: 'Narration hiện tại đang trống.' };
      if (!(audioDurationMs > 0) || !(videoDurationMs > 0)) return { ok: false, error: 'Thiếu duration để fit narration.' };

      const budget = narrationRepairBudget(narration, audioDurationMs, videoDurationMs);
      const limit = narrationOnlyTokenBudget(budget.target_chars);

      if (evidenceMode) {
        emitProgress(event, `Narration evidence-fit: measured_rate=${budget.measured_chars_per_sec.toFixed(2)} char/s; hard_target=${budget.min_chars}-${budget.max_chars} chars; transcript=${transcript.length} chars; output_limit=${limit} token.`, 'info');
        let lastError = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const phase = attempt === 0 ? 'Narration evidence-fit' : 'Narration evidence-fit retry';
          const prompt = evidenceRecomposePrompt(
            narration,
            budget,
            audioDurationMs,
            videoDurationMs,
            lastError ? `${lastError.code || 'FAILED'}: ${lastError.message || lastError}` : ''
          );
          try {
            const result = await chatStream(net, endpoint, model, [
              { role: 'system', content: prompt },
              {
                role: 'user',
                content: `NARRATION HIỆN TẠI:\n${narration}\n\nFULL TRANSCRIPT SRT:\n${transcript}\n\nVISUAL EVIDENCE JSON:\n${JSON.stringify(visualContext)}`,
              },
            ], {
              event,
              phase,
              format: narrationRepairSchemaForBudget(budget),
              timeoutMs: 150000,
              numPredict: limit,
              runController,
            });
            const parsed = parseStructuredResult(result, phase, model, limit);
            const durationRepaired = assertNarrationWithinBudget(parsed?.narration_script, budget, phase, model);
            const checked = assertNarrationQuality(durationRepaired, phase, model);
            emitProgress(event, `${phase}: PASS; narration=${checked.narration.length} chars; ${qualitySummary(checked.report)}.`, 'success');
            return {
              ok: true,
              narration_script: checked.narration,
              budget,
              quality: checked.report,
              evidence_backed: true,
              attempts: attempt + 1,
            };
          } catch (err) {
            lastError = err;
            const retryable = ['OLLAMA_OUTPUT_TRUNCATED', 'OLLAMA_JSON_INVALID', 'NARRATION_LENGTH_OUT_OF_BUDGET', 'NARRATION_QUALITY_FAILED'].includes(err?.code);
            if (attempt === 0 && retryable && !runController.signal.aborted) {
              emitProgress(event, `${phase}: chưa đạt contract (${err.code}); retry evidence-backed đúng 1 lần.`, 'warning');
              continue;
            }
            throw err;
          }
        }
      }

      const prompt = [
        'Bạn chỉ sửa MỘT lời thoại tiếng Việt liền mạch để khớp thời lượng TTS.',
        `Lời thoại hiện tại dài ${narration.length} ký tự.`,
        `Voice đo thực tế: ${(audioDurationMs / 1000).toFixed(2)}s; video: ${(videoDurationMs / 1000).toFixed(2)}s.`,
        `Target duration-fit là ${budget.min_chars}-${budget.max_chars} ký tự, mục tiêu khoảng ${budget.target_chars}.`,
        'Kết quả sẽ bị code kiểm tra cứng cả độ dài và chất lượng trước final TTS.',
        'Nếu cần dài hơn, mở rộng cách diễn đạt/chuyển ý từ chính nội dung hiện có; không lặp câu, không lặp CTA/kết luận và không thêm filler.',
        'Nếu không thể đạt min mà vẫn tự nhiên và đúng sự thật, hãy trả bản tự nhiên ngắn hơn; hệ thống sẽ fail thay vì nhận narration kém chất lượng.',
        'Giữ nguyên ý nghĩa, hook, bằng chứng và CTA đã có; CTA tối đa một lần; không bịa claim mới.',
        'Chỉ tiếng Việt tự nhiên; không chèn ký tự CJK/Hán/Nhật/Hàn lạc ngữ cảnh; giữ nhất quán tên chủ thể/nguyên liệu.',
        'Output là một đoạn narration liên tục: không SRT, không numbering, không bullet, không chia scene.',
        'Không giải thích. Chỉ trả JSON đúng schema.',
      ].join('\n');
      emitProgress(event, `Narration fit: measured_rate=${budget.measured_chars_per_sec.toFixed(2)} char/s; target=${budget.min_chars}-${budget.max_chars} chars; output_limit=${limit} token.`, 'info');
      const result = await chatStream(net, endpoint, model, [
        { role: 'system', content: prompt },
        { role: 'user', content: narration },
      ], {
        event,
        phase: 'Narration fit',
        format: narrationRepairSchemaForBudget(budget),
        timeoutMs: 120000,
        numPredict: limit,
        runController,
      });
      const parsed = parseStructuredResult(result, 'Narration fit', model, limit);
      const durationRepaired = assertNarrationWithinBudget(parsed?.narration_script, budget, 'Narration fit', model);
      const quality = await repairNarrationQuality(net, endpoint, model, durationRepaired, budget, event, runController, {
        phase: 'Narration fit quality',
        requireFullBudget: true,
      });
      return { ok: true, narration_script: quality.narration, budget, quality: quality.report, evidence_backed: false };
    } catch (err) {
      return {
        ok: false,
        code: err?.code || 'NARRATION_FIT_FAILED',
        phase: err?.phase || 'Narration fit',
        model: err?.model || null,
        cancelled: err?.code === 'P1_CANCELLED',
        error: err?.message || 'Không thể fit narration.',
      };
    } finally {
      const current = activeRuns.get(runKey);
      if (current?.controller === runController) activeRuns.delete(runKey);
    }
  });

  ipcMain.handle('ollama:p1AnalyzeVision', async (event, payload = {}) => {
    const runKey = event.sender.id;
    const previous = activeRuns.get(runKey);
    if (previous && !previous.controller.signal.aborted) previous.controller.abort('superseded');
    const runController = new AbortController();
    activeRuns.set(runKey, { controller: runController });

    try {
      const model = String(payload.model || '').trim();
      const prompt = String(payload.prompt || '').trim();
      const transcript = String(payload.transcript_srt || '').trim();
      const videoPath = String(payload.video_path || '').trim();
      const chunks = compactChunks(payload.chunks);
      const videoDurationSec = Math.max(0, Number(payload.video_info?.duration) || 0);
      const budget = narrationBudget(videoDurationSec, payload.tts_voice, payload.tts_speed);
      if (!model) return { ok: false, error: 'Chưa chọn model Ollama.' };
      if (!prompt) return { ok: false, error: 'Prompt Pipeline 1 đang trống.' };
      if (!transcript) return { ok: false, error: 'ASR transcript đang trống.' };
      if (!chunks.length) return { ok: false, error: 'Không có Vision chunk để phân tích.' };
      if (!videoPath || !fs.existsSync(videoPath)) return { ok: false, error: 'Không tìm thấy video nguồn để tạo fingerprint.' };

      emitProgress(event, `Kết nối Ollama local tại ${localOllamaUrl(payload.endpoint, '/api/tags')}...`);
      const tags = await fetchJson(net, localOllamaUrl(payload.endpoint, '/api/tags'), {}, 10000, 'Ollama preflight');
      emitProgress(event, `Ollama reachable; ${Array.isArray(tags?.models) ? tags.models.length : 0} model local.`, 'success');
      const vision = await findVisionModel(net, payload.endpoint, model, event);
      if (!vision.model) {
        return {
          ok: false,
          code: 'NO_VISION_MODEL',
          error: `Model ${model} không hỗ trợ vision và không tìm thấy model vision nào khác trong Ollama local.`,
          selected_model_capabilities: vision.capabilities,
        };
      }
      if (runController.signal.aborted) throw cancelledError();

      const allFrameMeta = chunks.flatMap(chunk => chunk.frames.map(({ frame, time_sec }) => ({ frame, time_sec, chunk_index: chunk.index })));
      emitProgress(event, `Adaptive vision plan: ${allFrameMeta.length} keyframe / ${chunks.length} chunk; tối đa ${MAX_FRAMES_PER_CHUNK} frame/chunk.`, 'info');
      const chunkAnalyses = await analyzeVisionChunks(net, payload.endpoint, vision.model, chunks, event, runController);
      if (runController.signal.aborted) throw cancelledError();

      const visualScenes = canonicalizeSceneInventory(chunkAnalyses, videoDurationSec);
      if (!visualScenes.length) throw semanticRemixError('Vision không tạo được canonical scene inventory.', { phase: 'Semantic scene inventory', model: vision.model });
      emitProgress(event, `Semantic scene inventory: ${visualScenes.length} scene có global index + source window.`, 'success');

      if (vision.model !== model) {
        await unloadModel(net, payload.endpoint, vision.model, event);
        if (runController.signal.aborted) throw cancelledError();
      }

      const timeoutMs = reasoningTimeoutMs(videoDurationSec);
      const outputLimit = reasoningTokenBudget(budget.target_chars, videoDurationSec);
      const reasoningContext = compactReasoningContext(chunkAnalyses, visualScenes);
      emitProgress(event, `Semantic remix budget: source=${videoDurationSec.toFixed(2)}s; voice=${budget.voice}; speed=${budget.speed.toFixed(2)}x; source_reference_chars=${budget.min_chars}-${budget.max_chars}; reasoning_timeout=${Math.round(timeoutMs / 1000)}s; output_limit=${outputLimit} token.`, 'info');
      emitProgress(event, `Đã hoàn tất ${chunkAnalyses.length} Vision chunk. Chuyển sang semantic remix reasoning model ${model}.`, 'success');
      const systemPrompt = outputContractPrompt(prompt, payload.video_info, allFrameMeta, budget);
      const finalAnalysis = await runReasoningWithOneRepair(
        net,
        payload.endpoint,
        model,
        systemPrompt,
        transcript,
        reasoningContext,
        budget,
        event,
        runController,
        videoDurationSec
      );
      if (runController.signal.aborted) throw cancelledError();

      finalAnalysis.narration_script = assertNarrationWithinDraftBudget(finalAnalysis.narration_script, budget, 'Global reasoning/remix', model);
      const quality = await repairNarrationQuality(net, payload.endpoint, model, finalAnalysis.narration_script, budget, event, runController, {
        phase: 'Narration quality',
        requireFullBudget: false,
      });
      finalAnalysis.narration_script = quality.narration;
      finalAnalysis.scenes = visualScenes;
      finalAnalysis.insights = {
        topic: finalAnalysis.video_profile?.content_type || finalAnalysis.summary || '',
        product_or_subject: finalAnalysis.product_profile?.product_or_subject || '',
        audience: finalAnalysis.customer_profile?.target_audience || '',
        hook: finalAnalysis.remix_strategy?.hook || '',
        benefits: Array.isArray(finalAnalysis.product_profile?.benefits) ? finalAnalysis.product_profile.benefits : [],
        evidence: Array.isArray(finalAnalysis.product_profile?.proof_points) ? finalAnalysis.product_profile.proof_points : [],
        cta: finalAnalysis.remix_strategy?.cta || '',
        conflicts: Array.isArray(reasoningContext.conflicts) ? reasoningContext.conflicts : [],
      };
      finalAnalysis.edit_plan = finalAnalysis.remix_beats.map(beat => ({
        scene_index: beat.source_scene_indexes[0],
        action: beat.edit_action === 'montage' ? 'reorder' : beat.edit_action,
        reason: beat.reason,
      }));
      emitProgress(
        event,
        `Semantic remix PASS: target=${Number(finalAnalysis.remix_strategy.target_duration_sec).toFixed(1)}s; beats=${finalAnalysis.remix_beats.length}; scenes_used=${finalAnalysis.semantic_coverage?.referenced_scene_count || 0}/${visualScenes.length}; narration=${finalAnalysis.narration_script.length} chars; quality_repaired=${quality.repaired ? 'yes' : 'no'}.`,
        'success'
      );

      const fingerprint = await sha256File(videoPath);
      return {
        ok: true,
        analysis: finalAnalysis,
        visual_chunks: chunkAnalyses,
        narration_budget: budget,
        narration_quality: quality.report,
        semantic_target_duration_sec: Number(finalAnalysis.remix_strategy.target_duration_sec) || 0,
        source_fingerprint: fingerprint,
        vision_model: vision.model,
        reasoning_model: model,
        used_vision_fallback: vision.model !== model,
      };
    } catch (err) {
      const type = err?.code === 'P1_CANCELLED' ? 'warning' : 'error';
      const rawError = String(err?.message || 'Không thể phân tích video bằng Ollama.');
      const phaseModel = [err?.phase, err?.model].filter(Boolean).join(' / ');
      const prefix = phaseModel ? `${phaseModel}: ` : '';
      const normalizedError = prefix && rawError.startsWith(prefix) ? rawError.slice(prefix.length) : rawError;
      emitProgress(event, `${err?.code === 'P1_CANCELLED' ? 'STOP' : 'FAIL'}: ${prefix}${normalizedError}`, type);
      return {
        ok: false,
        code: err?.code || 'OLLAMA_ANALYSIS_FAILED',
        phase: err?.phase || null,
        model: err?.model || null,
        cancelled: err?.code === 'P1_CANCELLED',
        error: normalizedError,
      };
    } finally {
      const current = activeRuns.get(runKey);
      if (current?.controller === runController) activeRuns.delete(runKey);
    }
  });
};

module.exports.__test = {
  narrationBudget,
  narrationRepairBudget,
  normalizedTtsSpeed,
  reasoningTokenBudget,
  narrationOnlyTokenBudget,
  reasoningTimeoutMs,
  finalSchemaForBudget,
  narrationRepairSchemaForBudget,
  assertNarrationWithinBudget,
  assertNarrationWithinDraftBudget,
  narrationQualityReport,
  assertNarrationQuality,
  canonicalizeSceneInventory,
  compactReasoningContext,
  assertSemanticRemixPlan,
};