const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function localOllamaUrl(rawEndpoint, pathname) {
  const raw = typeof rawEndpoint === 'string' && rawEndpoint.trim()
    ? rawEndpoint.trim()
    : 'http://localhost:11434/api/chat';
  const url = new URL(raw.includes('://') ? raw : `http://${raw}`);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Endpoint Ollama phải dùng HTTP hoặc HTTPS.');
  const host = url.hostname.toLowerCase();
  if (!['localhost', '127.0.0.1', '::1'].includes(host)) throw new Error('Pipeline 1 chỉ cho phép Ollama local.');
  url.pathname = pathname;
  url.search = '';
  url.hash = '';
  return url.toString();
}

async function fetchJson(net, url, options = {}, timeoutMs = 120000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await net.fetch(url, { ...options, signal: controller.signal });
    const text = await response.text();
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text }; }
    if (!response.ok) throw new Error(body?.error || `HTTP ${response.status}`);
    return body;
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

async function modelInfo(net, endpoint, model) {
  return fetchJson(net, localOllamaUrl(endpoint, '/api/show'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, verbose: false }),
  }, 15000);
}

async function findVisionModel(net, endpoint, preferredModel) {
  const preferredInfo = await modelInfo(net, endpoint, preferredModel);
  const preferredCaps = Array.isArray(preferredInfo?.capabilities) ? preferredInfo.capabilities : [];
  if (preferredCaps.includes('vision')) return { model: preferredModel, capabilities: preferredCaps, fallback: false };

  const tags = await fetchJson(net, localOllamaUrl(endpoint, '/api/tags'), {}, 10000);
  const names = Array.isArray(tags?.models)
    ? tags.models.map(item => item?.name || item?.model).filter(Boolean)
    : [];
  for (const name of names.slice(0, 16)) {
    if (name === preferredModel) continue;
    try {
      const info = await modelInfo(net, endpoint, name);
      const caps = Array.isArray(info?.capabilities) ? info.capabilities : [];
      if (caps.includes('vision')) return { model: name, capabilities: caps, fallback: true };
    } catch {
      // Ignore one broken local model and keep looking.
    }
  }
  return { model: null, capabilities: preferredCaps, fallback: false };
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

function compactFrames(frames) {
  const safe = Array.isArray(frames) ? frames.slice(0, 12) : [];
  let totalChars = 0;
  return safe.map(frame => {
    const image = String(frame?.image_base64 || '');
    totalChars += image.length;
    if (!image) return null;
    if (totalChars > 32 * 1024 * 1024) throw new Error('Tổng dữ liệu keyframe vượt giới hạn 32 MB.');
    return {
      frame: Number(frame?.frame) || 0,
      time_sec: Number(frame?.time_sec) || 0,
      image_base64: image,
    };
  }).filter(Boolean);
}

function outputContractPrompt(userPrompt, videoInfo, frameMeta) {
  return `${userPrompt}\n\nBạn đang xử lý Pipeline 1 của ứng dụng video. Hãy dùng đồng thời transcript và hình ảnh keyframe, không được giả định chỉ từ một nguồn.\n\nYÊU CẦU BẮT BUỘC:\n- Phân tích video gốc: nội dung, sản phẩm/chủ thể, đối tượng, hook, lợi ích, bằng chứng, CTA và các chi tiết trực quan quan trọng.\n- Nếu transcript mâu thuẫn với hình ảnh, ghi nhận xung đột trong insights thay vì bịa.\n- Viết lại lời thoại tiếng Việt tự nhiên, phù hợp TTS.\n- script_segments phải nằm trong thời lượng video và dùng timestamp SRT.\n- Không thêm giá, công dụng, chứng nhận hoặc thông tin không có căn cứ từ transcript/hình ảnh.\n- Trả về DUY NHẤT JSON hợp lệ theo cấu trúc:\n{\n  "summary":"...",\n  "insights":{"topic":"...","product_or_subject":"...","audience":"...","hook":"...","benefits":[],"evidence":[],"cta":"","conflicts":[]},\n  "scenes":[{"index":1,"time_sec":0,"visual":"...","speech_context":"...","purpose":"..."}],\n  "script_segments":[{"start":"00:00:00,000","end":"00:00:04,000","text":"..."}],\n  "edit_plan":[{"scene_index":1,"action":"keep|trim|reorder","reason":"..."}],\n  "edit_notes":[]\n}\n\nVideo metadata: ${JSON.stringify(videoInfo || {})}\nKeyframe timestamps: ${JSON.stringify(frameMeta || [])}`;
}

async function chat(net, endpoint, model, messages, options = {}) {
  const payload = {
    model,
    messages,
    stream: false,
    format: 'json',
    options: { temperature: 0.2, ...options },
  };
  return fetchJson(net, localOllamaUrl(endpoint, '/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, 180000);
}

module.exports = function registerP1VisionIPC({ ipcMain, net }) {
  ipcMain.handle('p1:persistAudio', async (event, payload = {}) => {
    try {
      const sourcePath = String(payload.source_path || '').trim();
      const artifactDir = String(payload.artifact_dir || '').trim();
      if (!sourcePath || !fs.existsSync(sourcePath)) return { ok: false, error: 'Không tìm thấy audio TTS nguồn.' };
      if (!artifactDir) return { ok: false, error: 'Artifact directory đang trống.' };
      const ext = path.extname(sourcePath).toLowerCase() || '.mp3';
      if (!['.mp3','.wav','.m4a','.aac','.ogg','.flac','.opus'].includes(ext)) return { ok: false, error: 'Định dạng audio TTS không hợp lệ.' };
      fs.mkdirSync(artifactDir, { recursive: true });
      const target = path.join(artifactDir, `voice${ext}`);
      fs.copyFileSync(sourcePath, target);
      return { ok: true, audio_path: target };
    } catch (err) {
      return { ok: false, error: err?.message || 'Không thể lưu audio Pipeline 1.' };
    }
  });

  ipcMain.handle('ollama:p1AnalyzeVision', async (event, payload = {}) => {
    try {
      const model = String(payload.model || '').trim();
      const prompt = String(payload.prompt || '').trim();
      const transcript = String(payload.transcript_srt || '').trim();
      const videoPath = String(payload.video_path || '').trim();
      const frames = compactFrames(payload.frames);
      if (!model) return { ok: false, error: 'Chưa chọn model Ollama.' };
      if (!prompt) return { ok: false, error: 'Prompt Pipeline 1 đang trống.' };
      if (!transcript) return { ok: false, error: 'ASR transcript đang trống.' };
      if (!frames.length) return { ok: false, error: 'Không có keyframe để phân tích.' };
      if (!videoPath || !fs.existsSync(videoPath)) return { ok: false, error: 'Không tìm thấy video nguồn để tạo fingerprint.' };

      const vision = await findVisionModel(net, payload.endpoint, model);
      if (!vision.model) {
        return {
          ok: false,
          code: 'NO_VISION_MODEL',
          error: `Model ${model} không hỗ trợ vision và không tìm thấy model vision nào khác trong Ollama local. Hãy cài/chọn một model có capability vision.`,
          selected_model_capabilities: vision.capabilities,
        };
      }

      const frameMeta = frames.map(({ frame, time_sec }) => ({ frame, time_sec }));
      const systemPrompt = outputContractPrompt(prompt, payload.video_info, frameMeta);
      const images = frames.map(frame => frame.image_base64);

      let finalAnalysis;
      const reasoningModel = model;
      if (vision.model === model) {
        const result = await chat(net, payload.endpoint, model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `TRANSCRIPT SRT:\n${transcript}`, images },
        ]);
        finalAnalysis = parseJsonContent(result?.message?.content);
      } else {
        const visionResult = await chat(net, payload.endpoint, vision.model, [
          { role: 'system', content: 'Phân tích các keyframe video theo timestamp. Trả JSON với summary, scenes, visual_evidence và conflicts. Không viết script quảng cáo.' },
          { role: 'user', content: `TRANSCRIPT SRT để đối chiếu:\n${transcript}\n\nKeyframe timestamps: ${JSON.stringify(frameMeta)}`, images },
        ]);
        const visualContext = parseJsonContent(visionResult?.message?.content);
        const reasoningResult = await chat(net, payload.endpoint, model, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `TRANSCRIPT SRT:\n${transcript}\n\nVISUAL ANALYSIS JSON:\n${JSON.stringify(visualContext)}` },
        ]);
        finalAnalysis = parseJsonContent(reasoningResult?.message?.content);
      }

      const fingerprint = await sha256File(videoPath);
      return {
        ok: true,
        analysis: finalAnalysis,
        source_fingerprint: fingerprint,
        vision_model: vision.model,
        reasoning_model: reasoningModel,
        used_vision_fallback: vision.model !== model,
      };
    } catch (err) {
      const message = err?.name === 'AbortError'
        ? 'Ollama quá thời gian phản hồi khi phân tích video.'
        : (err?.message || 'Không thể phân tích video bằng Ollama.');
      return { ok: false, error: message };
    }
  });
};
