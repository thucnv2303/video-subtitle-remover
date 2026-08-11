const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const activeRuns = new Map();
const MAX_FRAMES_PER_CHUNK = 8;
const MAX_CHUNKS = 10;
const MAX_CHUNK_IMAGE_CHARS = 12 * 1024 * 1024;

const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    insights: {
      type: 'object',
      properties: {
        topic: { type: 'string' }, product_or_subject: { type: 'string' }, audience: { type: 'string' }, hook: { type: 'string' },
        benefits: { type: 'array', items: { type: 'string' } }, evidence: { type: 'array', items: { type: 'string' } },
        cta: { type: 'string' }, conflicts: { type: 'array', items: { type: 'string' } },
      },
      required: ['topic', 'product_or_subject', 'audience', 'hook', 'benefits', 'evidence', 'cta', 'conflicts'],
    },
    scenes: { type: 'array', items: { type: 'object', properties: {
      index: { type: 'integer' }, time_sec: { type: 'number' }, visual: { type: 'string' }, speech_context: { type: 'string' }, purpose: { type: 'string' },
    }, required: ['index', 'time_sec', 'visual', 'speech_context', 'purpose'] } },
    script_segments: { type: 'array', items: { type: 'object', properties: {
      start: { type: 'string' }, end: { type: 'string' }, text: { type: 'string' },
    }, required: ['start', 'end', 'text'] } },
    edit_plan: { type: 'array', items: { type: 'object', properties: {
      scene_index: { type: 'integer' }, action: { type: 'string', enum: ['keep', 'trim', 'reorder'] }, reason: { type: 'string' },
    }, required: ['scene_index', 'action', 'reason'] } },
    edit_notes: { type: 'array', items: { type: 'string' } },
  },
  required: ['summary', 'insights', 'scenes', 'script_segments', 'edit_plan', 'edit_notes'],
};

const VISION_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    scenes: { type: 'array', items: { type: 'object', properties: {
      index: { type: 'integer' }, time_sec: { type: 'number' }, visual: { type: 'string' }, speech_context: { type: 'string' }, purpose: { type: 'string' },
    }, required: ['index', 'time_sec', 'visual', 'speech_context', 'purpose'] } },
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
  url.pathname = pathname; url.search = ''; url.hash = '';
  return url.toString();
}

function timeoutError(phase, model, timeoutMs) {
  const err = new Error(`${phase} với model ${model} quá thời gian ${Math.round(timeoutMs / 1000)} giây.`);
  err.code = 'OLLAMA_PHASE_TIMEOUT'; err.phase = phase; err.model = model;
  return err;
}

function outputTruncatedError(phase, model, limit) {
  const err = new Error(`output chạm giới hạn ${limit} token trước khi JSON hoàn tất.`);
  err.code = 'OLLAMA_OUTPUT_TRUNCATED'; err.phase = phase; err.model = model; err.tokenLimit = limit;
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
  } finally { clearTimeout(timeout); }
}

function parseJsonContent(value) {
  if (value && typeof value === 'object') return value;
  const text = String(value || '').trim();
  if (!text) throw new Error('AI trả về nội dung rỗng.');
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try { return JSON.parse(cleaned); } catch {
    const first = cleaned.indexOf('{'), last = cleaned.lastIndexOf('}');
    if (first >= 0 && last > first) return JSON.parse(cleaned.slice(first, last + 1));
    throw new Error('AI không trả về JSON hợp lệ.');
  }
}

async function modelInfo(net, endpoint, model) {
  return fetchJson(net, localOllamaUrl(endpoint, '/api/show'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, verbose: false }),
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
    .filter(item => item.name && item.name !== preferredModel).sort((a, b) => a.size - b.size) : [];
  for (const candidate of candidates.slice(0, 20)) {
    try {
      const info = await modelInfo(net, endpoint, candidate.name);
      const caps = Array.isArray(info?.capabilities) ? info.capabilities : [];
      if (caps.includes('vision')) {
        emitProgress(event, `Vision model được chọn: ${modelLabel(info, candidate.name)}.`, 'success');
        return { model: candidate.name, capabilities: caps, fallback: true, info };
      }
    } catch (err) { emitProgress(event, `Bỏ qua ${candidate.name}: ${err?.message || 'không đọc được capability'}.`, 'warning'); }
  }
  return { model: null, capabilities: preferredCaps, fallback: false, info: null };
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256'); const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk)); stream.on('error', reject); stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function compactFrames(frames, maxFrames = MAX_FRAMES_PER_CHUNK) {
  const safe = Array.isArray(frames) ? frames.slice(0, maxFrames) : [];
  let totalChars = 0;
  return safe.map(frame => {
    const image = String(frame?.image_base64 || ''); totalChars += image.length;
    if (!image) return null;
    if (totalChars > MAX_CHUNK_IMAGE_CHARS) throw new Error('Dữ liệu ảnh của một Vision chunk vượt giới hạn 12 MB sau nén.');
    return { frame: Number(frame?.frame) || 0, time_sec: Number(frame?.time_sec) || 0, image_base64: image };
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

function outputContractPrompt(userPrompt, videoInfo, frameMeta) {
  return `Bạn là bộ reasoning cuối của Pipeline 1. Output protocol hệ thống có ưu tiên cao hơn format trong prompt người dùng.\n\nMỤC TIÊU/PHONG CÁCH DO NGƯỜI DÙNG CẤU HÌNH:\n---\n${userPrompt}\n---\n\nYÊU CẦU BẮT BUỘC:\n- Dùng transcript toàn video và toàn bộ visual evidence theo timeline.\n- Phân tích chủ thể/sản phẩm, đối tượng, hook, lợi ích, bằng chứng, CTA và chi tiết trực quan quan trọng.\n- Nếu transcript mâu thuẫn hình ảnh, ghi trong insights.conflicts.\n- Viết lại lời thoại tiếng Việt tự nhiên, phù hợp TTS.\n- script_segments phải nằm trong thời lượng video.\n- Không bịa thông tin không có căn cứ.\n- RESPONSE phải tuân theo JSON schema hệ thống.\n- Giữ output súc tích: summary <= 2 câu; mỗi scene field <= 1 câu ngắn; mỗi script segment <= 2 câu ngắn; edit_notes tối đa 5 mục.\n- Không thêm giải thích ngoài JSON.\n\nVideo metadata: ${JSON.stringify(videoInfo || {})}\nVisual sampling timeline: ${JSON.stringify(frameMeta || [])}`;
}

function bytesToGiB(value) { return (Number(value || 0) / (1024 ** 3)).toFixed(1); }

function reasoningTokenBudget(transcript) {
  const segments = (String(transcript || '').match(/-->/g) || []).length;
  if (segments >= 40) return 4000;
  if (segments >= 20) return 3600;
  if (segments >= 14) return 3200;
  if (segments >= 8) return 2800;
  return 2400;
}

function visionTokenBudget(frameCount) {
  const count = Math.max(1, Math.min(MAX_FRAMES_PER_CHUNK, Math.floor(Number(frameCount) || 1)));
  return Math.min(2200, 1200 + count * 100);
}

async function runningModels(net, endpoint) {
  const result = await fetchJson(net, localOllamaUrl(endpoint, '/api/ps'), {}, 5000, 'Đọc model đang chạy');
  return Array.isArray(result?.models) ? result.models : [];
}

function startModelMonitor(net, endpoint, event, model, phase) {
  let stopped = false, polling = false, lastSignature = '';
  const progressKey = `ollama:${phase.toLowerCase().replace(/\s+/g, '-')}`;
  const poll = async () => {
    if (stopped || polling) return; polling = true;
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
    } catch { /* telemetry cannot fail inference */ } finally { polling = false; }
  };
  poll(); const timer = setInterval(poll, 4000);
  return () => { stopped = true; clearInterval(timer); };
}

async function unloadModel(net, endpoint, model, event) {
  emitProgress(event, `Giải phóng model ${model} trước global reasoning...`);
  try {
    await fetchJson(net, localOllamaUrl(endpoint, '/api/generate'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, prompt: '', stream: false, keep_alive: 0 }),
    }, 30000, `Unload ${model}`);
    const deadline = Date.now() + 12000;
    while (Date.now() < deadline) {
      const active = await runningModels(net, endpoint).catch(() => []);
      if (!active.some(item => (item?.name || item?.model) === model)) { emitProgress(event, `Đã giải phóng ${model}.`, 'success'); return; }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    emitProgress(event, `${model} vẫn còn trong /api/ps sau yêu cầu unload; tiếp tục với cảnh báo.`, 'warning');
  } catch (err) { emitProgress(event, `Không xác nhận được unload ${model}: ${err?.message || err}.`, 'warning'); }
}

async function chatStream(net, endpoint, model, messages, { event, phase, format, timeoutMs, numPredict, runController }) {
  if (runController.signal.aborted) throw cancelledError();
  const started = Date.now(); const progressKey = `ollama:${phase.toLowerCase().replace(/\s+/g, '-')}`;
  const timeout = setTimeout(() => {
    if (!runController.signal.aborted) runController.abort({ type: 'timeout', phase, model, timeoutMs });
  }, timeoutMs);
  const stopMonitor = startModelMonitor(net, endpoint, event, model, phase);
  emitProgress(event, `${phase}: gửi request tới ${model}; timeout=${Math.round(timeoutMs / 1000)}s; output_limit=${numPredict} token.`, 'info', { progress_key: progressKey });

  try {
    const response = await net.fetch(localOllamaUrl(endpoint, '/api/chat'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: runController.signal,
      body: JSON.stringify({ model, messages, stream: true, format, think: false, keep_alive: 0, options: { temperature: 0.2, num_predict: numPredict } }),
    });
    if (!response.ok) {
      const text = await response.text(); let detail = text;
      try { detail = JSON.parse(text)?.error || text; } catch { /* keep text */ }
      throw new Error(`${phase} / ${model}: HTTP ${response.status} ${detail || ''}`.trim());
    }
    if (!response.body?.getReader) throw new Error(`${phase} / ${model}: response stream không khả dụng.`);

    const reader = response.body.getReader(); const decoder = new TextDecoder();
    let pending = '', content = '', chunkCount = 0, firstOutputAt = null, finalChunk = null;
    const consume = (line) => {
      const trimmed = line.trim(); if (!trimmed) return;
      const item = JSON.parse(trimmed); if (item?.error) throw new Error(`${phase} / ${model}: ${item.error}`);
      const part = item?.message?.content;
      if (typeof part === 'string' && part) {
        content += part;
        if (!firstOutputAt) {
          firstOutputAt = Date.now();
          emitProgress(event, `${phase}: ${model} đã bắt đầu sinh output sau ${((firstOutputAt - started) / 1000).toFixed(1)}s.`, 'success');
        }
      }
      chunkCount += 1;
      if (chunkCount % 25 === 0) emitProgress(event, `${phase}: ${model} đang sinh output... ${((Date.now() - started) / 1000).toFixed(0)}s.`, 'info', { progress_key: progressKey });
      if (item?.done) finalChunk = item;
    };

    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      pending += decoder.decode(value, { stream: true });
      const lines = pending.split(/\r?\n/); pending = lines.pop() || '';
      for (const line of lines) consume(line);
    }
    pending += decoder.decode(); if (pending.trim()) consume(pending);
    if (!content.trim()) throw new Error(`${phase} / ${model}: Ollama kết thúc nhưng không trả content.`);
    const evalCount = Number(finalChunk?.eval_count || 0);
    const doneReason = String(finalChunk?.done_reason || '').toLowerCase();
    if (doneReason === 'length' || (evalCount >= numPredict && doneReason !== 'stop')) throw outputTruncatedError(phase, model, numPredict);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    const evalDuration = Number(finalChunk?.eval_duration || 0);
    const tokPerSec = evalDuration > 0 ? (evalCount / (evalDuration / 1e9)).toFixed(1) : '?';
    emitProgress(event, `${phase}: ${model} hoàn tất trong ${elapsed}s; output_tokens=${evalCount || '?'}, tốc độ=${tokPerSec} tok/s.`, 'success', { progress_key: progressKey, progress_done: true });
    return { message: { content }, metrics: finalChunk || {} };
  } catch (err) {
    if (runController.signal.aborted) {
      const reason = runController.signal.reason;
      if (reason && typeof reason === 'object' && reason.type === 'timeout') throw timeoutError(reason.phase || phase, reason.model || model, reason.timeoutMs || timeoutMs);
      throw cancelledError();
    }
    throw err;
  } finally { clearTimeout(timeout); stopMonitor(); }
}

function parseStructuredResult(result, phase, model, limit) {
  try {
    return parseJsonContent(result?.message?.content);
  } catch (err) {
    const wrapped = new Error(`${phase} / ${model}: JSON output không hợp lệ — ${err?.message || err}`);
    wrapped.code = 'OLLAMA_JSON_INVALID'; wrapped.phase = phase; wrapped.model = model; wrapped.tokenLimit = limit;
    throw wrapped;
  }
}

async function runReasoningWithOneRepair(net, endpoint, model, systemPrompt, transcript, visualContext, event, runController) {
  const primaryLimit = reasoningTokenBudget(transcript);
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `TRANSCRIPT SRT TOÀN VIDEO:\n${transcript}\n\nVISUAL TIMELINE JSON THEO CHUNK:\n${JSON.stringify(visualContext)}` },
  ];
  try {
    const result = await chatStream(net, endpoint, model, messages, {
      event, phase: 'Global reasoning/remix', format: FINAL_SCHEMA, timeoutMs: 360000, numPredict: primaryLimit, runController,
    });
    return parseStructuredResult(result, 'Global reasoning/remix', model, primaryLimit);
  } catch (err) {
    if (!['OLLAMA_OUTPUT_TRUNCATED', 'OLLAMA_JSON_INVALID'].includes(err?.code) || runController.signal.aborted) throw err;
    emitProgress(event, `Global reasoning/remix: output chưa hoàn chỉnh (${err.code}); thử lại đúng 1 lần với output ngắn hơn.`, 'warning');
    const repairPrompt = `${systemPrompt}\n\nLẦN THỬ LẠI BẮT BUỘC:\n- Chỉ trả JSON hợp lệ theo schema.\n- Rút gọn mạnh mọi field mô tả.\n- Không lặp transcript hay visual timeline.\n- Ưu tiên đủ closing bracket/object hơn độ dài nội dung.`;
    const repairLimit = Math.min(4400, primaryLimit + 400);
    const repaired = await chatStream(net, endpoint, model, [
      { role: 'system', content: repairPrompt },
      { role: 'user', content: `TRANSCRIPT SRT TOÀN VIDEO:\n${transcript}\n\nVISUAL TIMELINE JSON THEO CHUNK:\n${JSON.stringify(visualContext)}` },
    ], { event, phase: 'Global reasoning/remix retry', format: FINAL_SCHEMA, timeoutMs: 360000, numPredict: repairLimit, runController });
    return parseStructuredResult(repaired, 'Global reasoning/remix retry', model, repairLimit);
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
    ], { event, phase, format: VISION_SCHEMA, timeoutMs: 240000, numPredict: limit, runController });
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

module.exports = function registerP1VisionIPC({ ipcMain, net }) {
  ipcMain.handle('p1:persistAudio', async (event, payload = {}) => {
    try {
      const sourcePath = String(payload.source_path || '').trim(), artifactDir = String(payload.artifact_dir || '').trim();
      if (!sourcePath || !fs.existsSync(sourcePath)) return { ok: false, error: 'Không tìm thấy audio TTS nguồn.' };
      if (!artifactDir) return { ok: false, error: 'Artifact directory đang trống.' };
      const ext = path.extname(sourcePath).toLowerCase() || '.mp3';
      if (!['.mp3','.wav','.m4a','.aac','.ogg','.flac','.opus'].includes(ext)) return { ok: false, error: 'Định dạng audio TTS không hợp lệ.' };
      fs.mkdirSync(artifactDir, { recursive: true }); const target = path.join(artifactDir, `voice${ext}`); fs.copyFileSync(sourcePath, target);
      return { ok: true, audio_path: target };
    } catch (err) { return { ok: false, error: err?.message || 'Không thể lưu audio Pipeline 1.' }; }
  });

  ipcMain.handle('ollama:p1CancelVision', async (event) => {
    const key = event.sender.id; const run = activeRuns.get(key);
    if (!run) return { ok: true, cancelled: false, message: 'Không có Ollama P1 request đang chạy.' };
    if (!run.controller.signal.aborted) run.controller.abort('owner-stop');
    emitProgress(event, 'Đã nhận yêu cầu dừng multimodal inference.', 'warning');
    return { ok: true, cancelled: true };
  });

  ipcMain.handle('ollama:p1AnalyzeVision', async (event, payload = {}) => {
    const runKey = event.sender.id;
    const previous = activeRuns.get(runKey);
    if (previous && !previous.controller.signal.aborted) previous.controller.abort('superseded');
    const runController = new AbortController(); activeRuns.set(runKey, { controller: runController });

    try {
      const model = String(payload.model || '').trim(), prompt = String(payload.prompt || '').trim();
      const transcript = String(payload.transcript_srt || '').trim(), videoPath = String(payload.video_path || '').trim();
      const chunks = compactChunks(payload.chunks);
      if (!model) return { ok: false, error: 'Chưa chọn model Ollama.' };
      if (!prompt) return { ok: false, error: 'Prompt Pipeline 1 đang trống.' };
      if (!transcript) return { ok: false, error: 'ASR transcript đang trống.' };
      if (!chunks.length) return { ok: false, error: 'Không có Vision chunk để phân tích.' };
      if (!videoPath || !fs.existsSync(videoPath)) return { ok: false, error: 'Không tìm thấy video nguồn để tạo fingerprint.' };

      emitProgress(event, `Kết nối Ollama local tại ${localOllamaUrl(payload.endpoint, '/api/tags')}...`);
      const tags = await fetchJson(net, localOllamaUrl(payload.endpoint, '/api/tags'), {}, 10000, 'Ollama preflight');
      emitProgress(event, `Ollama reachable; ${Array.isArray(tags?.models) ? tags.models.length : 0} model local.`, 'success');
      const vision = await findVisionModel(net, payload.endpoint, model, event);
      if (!vision.model) return { ok: false, code: 'NO_VISION_MODEL', error: `Model ${model} không hỗ trợ vision và không tìm thấy model vision nào khác trong Ollama local.`, selected_model_capabilities: vision.capabilities };
      if (runController.signal.aborted) throw cancelledError();

      const allFrameMeta = chunks.flatMap(chunk => chunk.frames.map(({ frame, time_sec }) => ({ frame, time_sec, chunk_index: chunk.index })));
      emitProgress(event, `Adaptive vision plan: ${allFrameMeta.length} keyframe / ${chunks.length} chunk; tối đa ${MAX_FRAMES_PER_CHUNK} frame/chunk.`, 'info');
      const chunkAnalyses = await analyzeVisionChunks(net, payload.endpoint, vision.model, chunks, event, runController);
      if (runController.signal.aborted) throw cancelledError();

      if (vision.model !== model) {
        await unloadModel(net, payload.endpoint, vision.model, event);
        if (runController.signal.aborted) throw cancelledError();
      }

      emitProgress(event, `Đã hoàn tất ${chunkAnalyses.length} Vision chunk. Chuyển sang global reasoning model ${model}.`, 'success');
      const systemPrompt = outputContractPrompt(prompt, payload.video_info, allFrameMeta);
      const finalAnalysis = await runReasoningWithOneRepair(net, payload.endpoint, model, systemPrompt, transcript, chunkAnalyses, event, runController);
      if (runController.signal.aborted) throw cancelledError();

      const fingerprint = await sha256File(videoPath);
      return {
        ok: true,
        analysis: finalAnalysis,
        visual_chunks: chunkAnalyses,
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
      return { ok: false, code: err?.code || 'OLLAMA_ANALYSIS_FAILED', phase: err?.phase || null, model: err?.model || null, cancelled: err?.code === 'P1_CANCELLED', error: normalizedError };
    } finally {
      const current = activeRuns.get(runKey);
      if (current?.controller === runController) activeRuns.delete(runKey);
    }
  });
};
