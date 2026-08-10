const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const activeRuns = new Map();

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
    emitProgress(event, `Model ${preferredModel} có vision; dùng một model cho cả hình ảnh và reasoning.`, 'success');
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

function compactFrames(frames) {
  const safe = Array.isArray(frames) ? frames.slice(0, 10) : [];
  let totalChars = 0;
  return safe.map(frame => {
    const image = String(frame?.image_base64 || ''); totalChars += image.length;
    if (!image) return null;
    if (totalChars > 12 * 1024 * 1024) throw new Error('Tổng dữ liệu keyframe vượt giới hạn 12 MB sau nén.');
    return { frame: Number(frame?.frame) || 0, time_sec: Number(frame?.time_sec) || 0, image_base64: image };
  }).filter(Boolean);
}

function outputContractPrompt(userPrompt, videoInfo, frameMeta) {
  return `Bạn là bộ phân tích multimodal của Pipeline 1. Output protocol của hệ thống có ưu tiên cao hơn format được nhắc trong prompt người dùng.\n\nMỤC TIÊU/PHONG CÁCH DO NGƯỜI DÙNG CẤU HÌNH:\n---\n${userPrompt}\n---\n\nYÊU CẦU BẮT BUỘC:\n- Dùng đồng thời transcript và keyframe.\n- Phân tích video gốc: chủ thể/sản phẩm, đối tượng, hook, lợi ích, bằng chứng, CTA và chi tiết trực quan quan trọng.\n- Nếu transcript mâu thuẫn hình ảnh, ghi trong insights.conflicts.\n- Viết lại lời thoại tiếng Việt tự nhiên, phù hợp TTS.\n- script_segments phải nằm trong thời lượng video.\n- Không bịa thông tin không có căn cứ.\n- RESPONSE phải tuân theo JSON schema hệ thống.\n\nVideo metadata: ${JSON.stringify(videoInfo || {})}\nKeyframe timestamps: ${JSON.stringify(frameMeta || [])}`;
}

function bytesToGiB(value) { return (Number(value || 0) / (1024 ** 3)).toFixed(1); }

async function runningModels(net, endpoint) {
  const result = await fetchJson(net, localOllamaUrl(endpoint, '/api/ps'), {}, 5000, 'Đọc model đang chạy');
  return Array.isArray(result?.models) ? result.models : [];
}

function startModelMonitor(net, endpoint, event, model, phase) {
  let stopped = false, polling = false, lastSignature = '';
  const progressKey = `ollama:${phase.toLowerCase()}`;
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
  emitProgress(event, `Giải phóng model ${model} trước phase kế tiếp...`);
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
  const started = Date.now(); const progressKey = `ollama:${phase.toLowerCase()}`;
  const timeout = setTimeout(() => {
    if (!runController.signal.aborted) runController.abort({ type: 'timeout', phase, model, timeoutMs });
  }, timeoutMs);
  const stopMonitor = startModelMonitor(net, endpoint, event, model, phase);
  emitProgress(event, `${phase}: gửi request tới ${model}; timeout=${Math.round(timeoutMs / 1000)}s.`, 'info', { progress_key: progressKey });

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
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    const evalCount = Number(finalChunk?.eval_count || 0), evalDuration = Number(finalChunk?.eval_duration || 0);
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
      const frames = compactFrames(payload.frames);
      if (!model) return { ok: false, error: 'Chưa chọn model Ollama.' };
      if (!prompt) return { ok: false, error: 'Prompt Pipeline 1 đang trống.' };
      if (!transcript) return { ok: false, error: 'ASR transcript đang trống.' };
      if (!frames.length) return { ok: false, error: 'Không có keyframe để phân tích.' };
      if (!videoPath || !fs.existsSync(videoPath)) return { ok: false, error: 'Không tìm thấy video nguồn để tạo fingerprint.' };

      emitProgress(event, `Kết nối Ollama local tại ${localOllamaUrl(payload.endpoint, '/api/tags')}...`);
      const tags = await fetchJson(net, localOllamaUrl(payload.endpoint, '/api/tags'), {}, 10000, 'Ollama preflight');
      emitProgress(event, `Ollama reachable; ${Array.isArray(tags?.models) ? tags.models.length : 0} model local.`, 'success');
      const vision = await findVisionModel(net, payload.endpoint, model, event);
      if (!vision.model) return { ok: false, code: 'NO_VISION_MODEL', error: `Model ${model} không hỗ trợ vision và không tìm thấy model vision nào khác trong Ollama local.`, selected_model_capabilities: vision.capabilities };
      if (runController.signal.aborted) throw cancelledError();

      const frameMeta = frames.map(({ frame, time_sec }) => ({ frame, time_sec }));
      const systemPrompt = outputContractPrompt(prompt, payload.video_info, frameMeta);
      const images = frames.map(frame => frame.image_base64);
      const payloadMiB = (images.reduce((sum, image) => sum + image.length, 0) * 0.75 / (1024 ** 2)).toFixed(2);
      emitProgress(event, `Vision payload: ${frames.length} keyframe, khoảng ${payloadMiB} MiB base64-decoded image data.`);

      let finalAnalysis; const reasoningModel = model;
      if (vision.model === model) {
        const result = await chatStream(net, payload.endpoint, model, [
          { role: 'system', content: systemPrompt }, { role: 'user', content: `TRANSCRIPT SRT:\n${transcript}`, images },
        ], { event, phase: 'Multimodal analysis', format: FINAL_SCHEMA, timeoutMs: 300000, numPredict: 2200, runController });
        finalAnalysis = parseJsonContent(result?.message?.content);
      } else {
        const visionResult = await chatStream(net, payload.endpoint, vision.model, [
          { role: 'system', content: 'Phân tích keyframe video theo timestamp. Chỉ mô tả những gì có căn cứ trực quan và đối chiếu transcript.' },
          { role: 'user', content: `TRANSCRIPT SRT để đối chiếu:\n${transcript}\n\nKeyframe timestamps: ${JSON.stringify(frameMeta)}`, images },
        ], { event, phase: 'Vision analysis', format: VISION_SCHEMA, timeoutMs: 240000, numPredict: 1200, runController });
        const visualContext = parseJsonContent(visionResult?.message?.content);
        if (runController.signal.aborted) throw cancelledError();
        await unloadModel(net, payload.endpoint, vision.model, event);
        if (runController.signal.aborted) throw cancelledError();
        emitProgress(event, `Chuyển sang reasoning model ${model} với visual context đã rút gọn.`);
        const reasoningResult = await chatStream(net, payload.endpoint, model, [
          { role: 'system', content: systemPrompt }, { role: 'user', content: `TRANSCRIPT SRT:\n${transcript}\n\nVISUAL ANALYSIS JSON:\n${JSON.stringify(visualContext)}` },
        ], { event, phase: 'Reasoning/remix', format: FINAL_SCHEMA, timeoutMs: 360000, numPredict: 2200, runController });
        finalAnalysis = parseJsonContent(reasoningResult?.message?.content);
      }

      if (runController.signal.aborted) throw cancelledError();
      const fingerprint = await sha256File(videoPath);
      return { ok: true, analysis: finalAnalysis, source_fingerprint: fingerprint, vision_model: vision.model, reasoning_model: reasoningModel, used_vision_fallback: vision.model !== model };
    } catch (err) {
      const type = err?.code === 'P1_CANCELLED' ? 'warning' : 'error';
      emitProgress(event, `${err?.code === 'P1_CANCELLED' ? 'STOP' : 'FAIL'}: ${err?.message || 'Không thể phân tích video bằng Ollama.'}`, type);
      return { ok: false, code: err?.code || 'OLLAMA_ANALYSIS_FAILED', phase: err?.phase || null, model: err?.model || null, cancelled: err?.code === 'P1_CANCELLED', error: err?.message || 'Không thể phân tích video bằng Ollama.' };
    } finally {
      const current = activeRuns.get(runKey);
      if (current?.controller === runController) activeRuns.delete(runKey);
    }
  });
};
