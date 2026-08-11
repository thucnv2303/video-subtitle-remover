const TARGET_SAMPLE_INTERVAL_SEC = 4;
const MIN_SAMPLE_COUNT = 6;
const SHORT_VIDEO_SAMPLE_COUNT = 8;
const MAX_FRAMES_PER_VISION_CHUNK = 8;
const MAX_TOTAL_SAMPLE_COUNT = 80;
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

export function adaptiveSampleCount(durationSec, totalFrames) {
  const duration = Math.max(0, Number(durationSec) || 0);
  const total = Math.max(1, Math.floor(Number(totalFrames) || 1));
  let wanted = Math.ceil(duration / TARGET_SAMPLE_INTERVAL_SEC);
  wanted = Math.max(duration >= 20 ? SHORT_VIDEO_SAMPLE_COUNT : MIN_SAMPLE_COUNT, wanted);
  wanted = Math.min(MAX_TOTAL_SAMPLE_COUNT, wanted, total);
  return Math.max(1, wanted);
}

export function sampleFrameIndexes(totalFrames, count) {
  const total = Math.max(1, Math.floor(Number(totalFrames) || 1));
  const wanted = Math.max(1, Math.min(Math.floor(Number(count) || 1), total));
  const indexes = new Set();
  for (let i = 0; i < wanted; i += 1) {
    const ratio = wanted === 1 ? 0 : i / (wanted - 1);
    indexes.add(Math.min(total - 1, Math.max(0, Math.round(ratio * (total - 1)))));
  }
  return [...indexes];
}

function sourceBlocksToSrt(blocks) {
  return blocks.map((block, index) => `${index + 1}\n${block.start} --> ${block.end}\n${block.text}\n`).join('\n');
}

function overlappingTranscript(sourceBlocks, startSec, endSec) {
  const startMs = Math.max(0, startSec * 1000);
  const endMs = Math.max(startMs, endSec * 1000);
  return sourceBlocks.filter(block => {
    const blockStart = srtTimeToMs(block.start);
    const blockEnd = srtTimeToMs(block.end);
    return blockEnd >= startMs && blockStart <= endMs;
  });
}

export function buildVisionChunks(frames, sourceBlocks, durationSec) {
  const duration = Math.max(0, Number(durationSec) || 0);
  const ordered = [...(frames || [])].sort((a, b) => Number(a.time_sec) - Number(b.time_sec));
  const chunks = [];
  for (let offset = 0; offset < ordered.length; offset += MAX_FRAMES_PER_VISION_CHUNK) {
    const chunkFrames = ordered.slice(offset, offset + MAX_FRAMES_PER_VISION_CHUNK);
    const first = Number(chunkFrames[0]?.time_sec || 0);
    const last = Number(chunkFrames[chunkFrames.length - 1]?.time_sec || first);
    const previousTime = Number(ordered[offset - 1]?.time_sec);
    const nextTime = Number(ordered[offset + chunkFrames.length]?.time_sec);
    const startSec = offset === 0 || !Number.isFinite(previousTime) ? 0 : Math.max(0, (previousTime + first) / 2);
    const endSec = offset + chunkFrames.length >= ordered.length || !Number.isFinite(nextTime)
      ? duration
      : Math.min(duration, (last + nextTime) / 2);
    const transcriptBlocks = overlappingTranscript(sourceBlocks, startSec, endSec);
    chunks.push({
      index: chunks.length,
      start_sec: Number(startSec.toFixed(3)),
      end_sec: Number(endSec.toFixed(3)),
      transcript_srt: sourceBlocksToSrt(transcriptBlocks),
      frames: chunkFrames,
    });
  }
  return chunks;
}

async function collectVisualContext(job, sourceBlocks) {
  const info = await window.api.videoInfo(job.filePath);
  if (!info?.total_frames || !info?.fps) throw new Error('Không đọc được metadata video để phân tích hình ảnh.');
  const duration = Number(info.duration) || (Number(info.total_frames) / Number(info.fps));
  const sampleCount = adaptiveSampleCount(duration, info.total_frames);
  const indexes = sampleFrameIndexes(info.total_frames, sampleCount);
  const frames = [];
  let originalBytes = 0;
  let encodedChars = 0;

  if (sampleCount >= MAX_TOTAL_SAMPLE_COUNT && Math.ceil(duration / TARGET_SAMPLE_INTERVAL_SEC) > MAX_TOTAL_SAMPLE_COUNT) {
    log(`[P1] ⚠ Adaptive vision chạm safety cap ${MAX_TOTAL_SAMPLE_COUNT} keyframe cho video ${duration.toFixed(1)}s.`, 'warning');
  }

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

  const chunks = buildVisionChunks(frames, sourceBlocks, duration);
  const approxCompressedBytes = encodedChars * 0.75;
  log(`[P1] 🧭 Adaptive vision: ${duration.toFixed(1)}s → ${frames.length} keyframe / ${chunks.length} chunk; target≈1 frame/${TARGET_SAMPLE_INTERVAL_SEC}s; max ${MAX_FRAMES_PER_VISION_CHUNK} frame/chunk.`, 'info');
  log(`[P1] 🗜 Keyframe payload: nguồn ${(originalBytes / 1048576).toFixed(2)} MiB → khoảng ${(approxCompressedBytes / 1048576).toFixed(2)} MiB; cạnh tối đa ${MAX_VISION_EDGE}px.`, 'info');
  chunks.forEach(chunk => {
    log(`[P1] 🧩 Vision chunk ${chunk.index + 1}/${chunks.length}: ${chunk.start_sec.toFixed(1)}–${chunk.end_sec.toFixed(1)}s; ${chunk.frames.length} frame; ${parseSrtBlocks(chunk.transcript_srt).length} transcript segment.`, 'info');
  });
  return { info: { ...info, duration }, frames, chunks };
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

  log('[P1] 🖼 Giai đoạn B — Lấy keyframe thích ứng từ video gốc...', 'info');
  const { info, frames, chunks } = await collectVisualContext(job, sourceBlocks);
  log(`[P1] ✅ Đã lấy ${frames.length} keyframe thích ứng trên ${Number(info.duration || 0).toFixed(1)}s video.`, 'success');

  log('[P1] 🧠 Giai đoạn C — Vision theo chunk + global reasoning...', 'info');
  const unsubscribeProgress = window.electronAPI?.onP1VisionProgress?.((payload) => {
    const message = String(payload?.message || '').trim();
    if (!message) return;
    const type = ['success', 'error', 'warning'].includes(payload?.type) ? payload.type : 'info';
    const formatted = `[Ollama] ${message}`;
    if (payload?.progress_key && typeof window.updateP1ProgressLog === 'function') {
      window.updateP1ProgressLog(payload.progress_key, formatted, type, Boolean(payload.progress_done));
      return;
    }
    log(formatted, type);
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
      chunks,
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
    artifact_version: 2,
    analysis_mode: 'multimodal-adaptive-chunks-v2',
    asr_language: job.asrLanguageDetected,
    reasoning_model: visual.reasoning_model || config.model,
    vision_model: visual.vision_model || config.model,
  };

  const sampling = {
    target_interval_sec: TARGET_SAMPLE_INTERVAL_SEC,
    frame_count: frames.length,
    max_frames_per_chunk: MAX_FRAMES_PER_VISION_CHUNK,
    hard_frame_cap: MAX_TOTAL_SAMPLE_COUNT,
    chunk_count: chunks.length,
  };
  const chunkTimeline = chunks.map(chunk => ({
    index: chunk.index,
    start_sec: chunk.start_sec,
    end_sec: chunk.end_sec,
    keyframes: chunk.frames.map(({ frame, time_sec }) => ({ frame, time_sec })),
  }));

  const scenes = { ...sourceMeta, scenes: analysis.scenes };
  const multimodalTimeline = {
    ...sourceMeta,
    summary: analysis.summary,
    insights: analysis.insights || {},
    sampling,
    chunks: chunkTimeline,
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
  log(`[P1] ✅ Adaptive multimodal hoàn tất — ${frames.length} keyframe / ${chunks.length} chunk / ${analysis.scenes.length} scene / ${scriptSegments.length} đoạn script; vision=${sourceMeta.vision_model}; reasoning=${sourceMeta.reasoning_model}.`, 'success');

  return { sourceSrt: transcriptSrt, rewrittenSrt, analysis, bundle, info, visual };
}
