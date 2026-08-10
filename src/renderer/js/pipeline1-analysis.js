const FRAME_SAMPLE_COUNT = 8;
const MAX_VISION_EDGE = 960;
const VISION_JPEG_QUALITY = 0.72;

function log(message, type = 'info') {
  if (typeof window.addLog === 'function') window.addLog(message, type);
}

function parseSrtBlocks(srt) {
  if (!srt || !srt.includes('-->')) return [];
  return srt.trim().split(/\n\s*\n/).map((block, index) => {
    const lines = block.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const timeLine = lines.find(line => line.includes('-->')) || '';
    const match = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    const text = lines.filter(line => !/^\d+$/.test(line) && !line.includes('-->')).join(' ').trim();
    return match ? { index: index + 1, start: match[1].replace('.', ','), end: match[2].replace('.', ','), text } : null;
  }).filter(Boolean);
}

function srtTimeToMs(value) {
  const match = String(value || '').match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  return (((Number(match[1]) * 60 + Number(match[2])) * 60 + Number(match[3])) * 1000) + Number(match[4]);
}

function msToSrtTime(ms) {
  const safe = Math.max(0, Math.round(Number(ms) || 0));
  const h = Math.floor(safe / 3600000);
  const m = Math.floor((safe % 3600000) / 60000);
  const s = Math.floor((safe % 60000) / 1000);
  const milli = safe % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(milli).padStart(3, '0')}`;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || '');
      resolve(value.includes(',') ? value.split(',').pop() : value);
    };
    reader.onerror = () => reject(reader.error || new Error('Không thể đọc keyframe.'));
    reader.readAsDataURL(blob);
  });
}

async function compressFrameBlob(blob) {
  if (typeof createImageBitmap !== 'function') return blobToBase64(blob);
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, MAX_VISION_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return blobToBase64(blob);
    ctx.drawImage(bitmap, 0, 0, width, height);
    const compressed = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', VISION_JPEG_QUALITY));
    return blobToBase64(compressed || blob);
  } finally {
    bitmap.close?.();
  }
}

function sampleFrameIndexes(totalFrames, count = FRAME_SAMPLE_COUNT) {
  const total = Math.max(1, Math.floor(Number(totalFrames) || 1));
  const wanted = Math.max(2, Math.min(count, total));
  const indexes = new Set();
  for (let i = 0; i < wanted; i += 1) {
    const ratio = wanted === 1 ? 0 : i / (wanted - 1);
    indexes.add(Math.min(total - 1, Math.max(0, Math.round(ratio * (total - 1)))));
  }
  return [...indexes];
}

async function collectVisualContext(job) {
  const info = await window.api.videoInfo(job.filePath);
  if (!info?.total_frames || !info?.fps) throw new Error('Không đọc được metadata video để phân tích hình ảnh.');
  const indexes = sampleFrameIndexes(info.total_frames);
  const frames = [];
  let originalBytes = 0;
  let encodedChars = 0;

  for (const frameIndex of indexes) {
    const blob = await window.api.getFrame(frameIndex, job.filePath);
    if (!blob || !blob.size) continue;
    originalBytes += blob.size;
    const imageBase64 = await compressFrameBlob(blob);
    encodedChars += imageBase64.length;
    frames.push({
      frame: frameIndex,
      time_sec: Number((frameIndex / info.fps).toFixed(3)),
      image_base64: imageBase64,
    });
  }

  if (frames.length < Math.min(3, indexes.length)) {
    throw new Error(`Chỉ lấy được ${frames.length}/${indexes.length} keyframe; chưa đủ để phân tích video.`);
  }

  const approxCompressedBytes = encodedChars * 0.75;
  log(`[P1] 🗜 Keyframe vision: ${frames.length} ảnh; nguồn ${(originalBytes / 1048576).toFixed(2)} MiB → payload khoảng ${(approxCompressedBytes / 1048576).toFixed(2)} MiB; cạnh tối đa ${MAX_VISION_EDGE}px.`, 'info');
  return { info, frames };
}

function normalizeScriptSegments(payload, sourceBlocks, durationSec) {
  const raw = payload?.script_segments || payload?.remix_script?.segments || payload?.segments || [];
  if (Array.isArray(raw) && raw.length) {
    const normalized = raw.map((item, index) => {
      const text = String(item?.text || item?.voiceover || item?.script || '').trim();
      if (!text) return null;
      let start = item?.start || item?.start_time || item?.start_timestamp;
      let end = item?.end || item?.end_time || item?.end_timestamp;
      if (!start && Number.isFinite(Number(item?.start_ms))) start = msToSrtTime(Number(item.start_ms));
      if (!end && Number.isFinite(Number(item?.end_ms))) end = msToSrtTime(Number(item.end_ms));
      if ((!start || !end) && sourceBlocks[index]) {
        start = sourceBlocks[index].start;
        end = sourceBlocks[index].end;
      }
      return start && end ? { start: String(start).replace('.', ','), end: String(end).replace('.', ','), text } : null;
    }).filter(Boolean);
    if (normalized.length) return normalized;
  }

  const fallbackText = String(payload?.remix_script?.text || payload?.script || payload?.summary || '').trim();
  if (!fallbackText) return [];
  const lines = fallbackText.split(/\n+/).map(line => line.trim()).filter(Boolean);
  if (sourceBlocks.length) {
    return sourceBlocks.map((block, index) => ({
      start: block.start,
      end: block.end,
      text: lines[Math.min(index, lines.length - 1)] || fallbackText,
    }));
  }

  const durationMs = Math.max(4000, Math.round((Number(durationSec) || 4) * 1000));
  const segMs = Math.max(2500, Math.floor(durationMs / Math.max(1, lines.length)));
  return lines.map((text, index) => ({
    start: msToSrtTime(index * segMs),
    end: msToSrtTime(Math.min(durationMs, (index + 1) * segMs - 100)),
    text,
  }));
}

function segmentsToSrt(segments) {
  return segments.map((segment, index) => `${index + 1}\n${segment.start} --> ${segment.end}\n${segment.text}\n`).join('\n');
}

function artifactRoot(job) {
  const configured = localStorage.getItem('output_dir');
  const sourceDir = job.filePath.replace(/\\/g, '/').replace(/\/[^/]+$/, '');
  const root = (configured || sourceDir || '.').replace(/[\\/]$/, '');
  return `${root}/jobs/${job.id}/p1`;
}

async function persistArtifacts(job, artifactBundle, rewrittenSrt) {
  const root = artifactRoot(job);
  const files = {
    'scenes.json': artifactBundle.scenes,
    'multimodal_timeline.json': artifactBundle.multimodal_timeline,
    'remix_script.json': artifactBundle.remix_script,
    'edit_plan.json': artifactBundle.edit_plan,
  };
  for (const [name, content] of Object.entries(files)) {
    const response = await window.api.writeFile(`${root}/${name}`, JSON.stringify(content, null, 2));
    if (response?.status === 'error') throw new Error(`Không thể ghi ${name}: ${response.error || 'Unknown error'}`);
  }
  const srtResponse = await window.api.writeFile(`${root}/remix_script.srt`, rewrittenSrt);
  if (srtResponse?.status === 'error') throw new Error(`Không thể ghi remix_script.srt: ${srtResponse.error || 'Unknown error'}`);
  job.p1ArtifactDir = root;
  job.p1ArtifactPaths = Object.fromEntries(Object.keys(files).map(name => [name, `${root}/${name}`]));
  job.p1ArtifactPaths['remix_script.srt'] = `${root}/remix_script.srt`;
}

export async function runPipeline1MultimodalAnalysis(job, sourceSrt = null) {
  const config = job?.p1Config || {};
  if (!job?.filePath) throw new Error('Job không có video nguồn.');
  if (config.provider !== 'ollama') {
    throw new Error('P1 multimodal hiện yêu cầu Ollama local để phân tích keyframe. Chưa cho phép text-only fallback mở khóa P2.');
  }
  if (!window.electronAPI?.analyzeP1Vision) {
    throw new Error('Bridge phân tích Vision chưa sẵn sàng.');
  }

  let transcriptSrt = String(sourceSrt || '').trim();
  if (!transcriptSrt) {
    log('[P1] 🎤 Giai đoạn A — ASR tự nhận diện ngôn ngữ...', 'info');
    const asr = await window.api.extractTextP1(job.id, job.filePath, 'auto');
    if (asr?.status !== 'ok' || !asr?.srt_content?.trim()) {
      throw new Error(asr?.error || 'ASR không tạo được transcript hợp lệ.');
    }
    transcriptSrt = asr.srt_content.trim();
    job.asrLanguageDetected = asr.detected_language || 'auto';
  } else {
    job.asrLanguageDetected = job.asrLanguageDetected || 'auto';
  }
  const sourceBlocks = parseSrtBlocks(transcriptSrt);
  if (!sourceBlocks.length) throw new Error('Transcript ASR không có segment/timestamp hợp lệ.');
  job.srtContent = transcriptSrt;
  job.asrLineCount = sourceBlocks.length;
  log(`[P1] ✅ ASR input: ${sourceBlocks.length} đoạn, ngôn ngữ=${job.asrLanguageDetected}.`, 'success');

  log('[P1] 🖼 Giai đoạn B — Lấy keyframe từ video gốc...', 'info');
  const { info, frames } = await collectVisualContext(job);
  log(`[P1] ✅ Đã lấy ${frames.length} keyframe trên ${Number(info.duration || 0).toFixed(1)}s video.`, 'success');

  log('[P1] 🧠 Giai đoạn C — Phân tích multimodal + xây remix script...', 'info');
  const unsubscribeProgress = window.electronAPI?.onP1VisionProgress?.((payload) => {
    const message = String(payload?.message || '').trim();
    if (!message) return;
    const type = ['success', 'error', 'warning'].includes(payload?.type) ? payload.type : 'info';
    log(`[Ollama] ${message}`, type);
  });

  let visual;
  try {
    visual = await window.electronAPI.analyzeP1Vision({
      endpoint: config.endpoint,
      model: config.model,
      prompt: config.prompt,
      transcript_srt: transcriptSrt,
      video_path: job.filePath,
      video_info: {
        duration: info.duration,
        fps: info.fps,
        total_frames: info.total_frames,
        width: info.width,
        height: info.height,
      },
      frames,
    });
  } finally {
    if (typeof unsubscribeProgress === 'function') unsubscribeProgress();
  }
  if (!visual?.ok) {
    const prefix = [visual?.phase, visual?.model].filter(Boolean).join(' / ');
    throw new Error(`${prefix ? `${prefix}: ` : ''}${visual?.error || 'Phân tích multimodal thất bại.'}`);
  }

  const analysis = visual.analysis || {};
  const scriptSegments = normalizeScriptSegments(analysis, sourceBlocks, info.duration);
  if (!analysis.summary?.trim()) throw new Error('AI không trả về summary phân tích video.');
  if (!Array.isArray(analysis.scenes) || analysis.scenes.length === 0) throw new Error('AI không trả về scene analysis.');
  if (!scriptSegments.length) throw new Error('AI không tạo được remix script có timing.');

  const rewrittenSrt = segmentsToSrt(scriptSegments);
  const sourceMeta = {
    job_id: job.id,
    source_fingerprint: visual.source_fingerprint || '',
    source_duration: Number(info.duration) || 0,
    source_fps: Number(info.fps) || 0,
    source_total_frames: Number(info.total_frames) || 0,
    artifact_version: 1,
    analysis_mode: 'multimodal-keyframes-v1',
    asr_language: job.asrLanguageDetected,
    reasoning_model: visual.reasoning_model || config.model,
    vision_model: visual.vision_model || config.model,
  };

  const scenes = { ...sourceMeta, scenes: analysis.scenes };
  const multimodalTimeline = {
    ...sourceMeta,
    summary: analysis.summary,
    insights: analysis.insights || {},
    keyframes: frames.map(({ frame, time_sec }) => ({ frame, time_sec })),
    scenes: analysis.scenes,
    source_transcript_srt: transcriptSrt,
  };
  const remixScript = { ...sourceMeta, segments: scriptSegments, srt: rewrittenSrt };
  const editPlan = { ...sourceMeta, plan: analysis.edit_plan || [], notes: analysis.edit_notes || [] };

  const bundle = {
    scenes,
    multimodal_timeline: multimodalTimeline,
    remix_script: remixScript,
    edit_plan: editPlan,
  };
  await persistArtifacts(job, bundle, rewrittenSrt);

  job.aiContent = rewrittenSrt;
  job.remixSrt = rewrittenSrt;
  job.p1Analysis = analysis;
  job.p1Artifacts = bundle;
  job.p1AnalysisMode = sourceMeta.analysis_mode;
  job.sourceFingerprint = sourceMeta.source_fingerprint;
  log(`[P1] ✅ Multimodal analysis hoàn tất — ${analysis.scenes.length} scene, ${scriptSegments.length} đoạn script; vision=${sourceMeta.vision_model}; reasoning=${sourceMeta.reasoning_model}.`, 'success');

  return { sourceSrt: transcriptSrt, rewrittenSrt, analysis, bundle, info, visual };
}
