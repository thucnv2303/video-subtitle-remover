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
    return match ? {
      index: index + 1,
      start: match[1].replace('.', ','),
      end: match[2].replace('.', ','),
      text,
    } : null;
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

function compactNarration(value) {
  return String(value || '').replace(/```(?:json)?/gi, '').replace(/\s+/g, ' ').trim();
}

function narrationToSingleSrt(narration, durationSec) {
  const text = compactNarration(narration);
  const durationMs = Math.max(1000, Math.round((Number(durationSec) || 1) * 1000));
  return `1\n00:00:00,000 --> ${msToSrtTime(durationMs)}\n${text}\n`;
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

function artifactRoot(job) {
  const configured = localStorage.getItem('output_dir');
  const normalized = String(job.filePath || '').replace(/\\/g, '/');
  const slash = normalized.lastIndexOf('/');
  const sourceDir = slash >= 0 ? normalized.slice(0, slash) : '.';
  const root = String(configured || sourceDir || '.').replace(/[\\/]$/, '');
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

function buildSemanticEditPlan(remixBeats, scenes) {
  const sceneMap = new Map((Array.isArray(scenes) ? scenes : []).map(scene => [Number(scene.index), scene]));
  const beats = Array.isArray(remixBeats) ? remixBeats : [];
  if (!beats.length) throw new Error('Semantic remix không có remix_beats để tạo edit plan.');
  return beats.map(beat => {
    const sourceSceneIndexes = Array.isArray(beat.source_scene_indexes) ? beat.source_scene_indexes.map(Number) : [];
    if (!sourceSceneIndexes.length) throw new Error(`Beat ${beat.beat_index} không có source scene.`);
    const sourceRanges = sourceSceneIndexes.map(sceneIndex => {
      const scene = sceneMap.get(sceneIndex);
      if (!scene) throw new Error(`Beat ${beat.beat_index} tham chiếu source scene ${sceneIndex} không tồn tại.`);
      const startSec = Number(scene.start_sec);
      const endSec = Number(scene.end_sec);
      if (!(endSec > startSec) || startSec < 0) throw new Error(`Source range của scene ${sceneIndex} không hợp lệ.`);
      return {
        scene_index: sceneIndex,
        start_sec: Number(startSec.toFixed(3)),
        end_sec: Number(endSec.toFixed(3)),
        time_sec: Number(Number(scene.time_sec || startSec).toFixed(3)),
      };
    });
    return {
      beat_index: Number(beat.beat_index),
      role: String(beat.role || ''),
      message: String(beat.message || ''),
      narration_text: String(beat.narration_text || ''),
      edit_action: String(beat.edit_action || ''),
      source_scene_indexes: sourceSceneIndexes,
      source_ranges: sourceRanges,
      target_duration_sec: Number(Number(beat.target_duration_sec || 0).toFixed(3)),
      evidence_basis: String(beat.evidence_basis || ''),
      reason: String(beat.reason || ''),
    };
  });
}

function standardArtifacts({ sourceMeta, analysis, scenes, sampling, chunkTimeline, frames, transcriptSrt, narrationScript, rewrittenSrt, visual }) {
  const standardMeta = { ...sourceMeta, semantic_remix_enabled: false };
  return {
    scenes: { ...standardMeta, scenes },
    multimodal_timeline: {
      ...standardMeta,
      summary: analysis.summary,
      insights: analysis.insights || {},
      sampling,
      chunks: chunkTimeline,
      keyframes: frames.map(({ frame, time_sec }) => ({ frame, time_sec })),
      scenes,
      source_transcript_srt: transcriptSrt,
    },
    remix_script: {
      ...standardMeta,
      narration_script: narrationScript,
      narration_budget: visual.narration_budget || null,
      segments: [{
        start: '00:00:00,000',
        end: msToSrtTime(Math.max(1000, Math.round(Number(sourceMeta.source_duration || 1) * 1000))),
        text: narrationScript,
      }],
      srt: rewrittenSrt,
    },
    edit_plan: {
      ...standardMeta,
      semantic_remix_enabled: false,
      authoritative: false,
      plan: [],
      notes: analysis.edit_notes || [],
    },
  };
}

export async function runPipeline1MultimodalAnalysis(job, sourceSrt = null) {
  const config = job?.p1Config || {};
  const semanticRemixEnabled = Boolean(config.semanticRemixEnabled);
  if (!job?.filePath) throw new Error('Job không có video nguồn.');
  if (config.provider !== 'ollama') {
    throw new Error('P1 multimodal hiện yêu cầu Ollama local để phân tích keyframe. Chưa cho phép text-only fallback mở khóa P2.');
  }
  const analyzeVision = semanticRemixEnabled
    ? window.electronAPI?.analyzeP1Vision
    : window.electronAPI?.analyzeP1StandardVision;
  if (!analyzeVision) {
    throw new Error(`Bridge phân tích ${semanticRemixEnabled ? 'Semantic Remix' : 'kịch bản bình thường'} chưa sẵn sàng.`);
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
  log(`[P1] 🧠 Giai đoạn C — ScriptMode=${semanticRemixEnabled ? 'semantic-remix' : 'standard'}; Vision theo chunk + global reasoning...`, 'info');

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
    visual = await analyzeVision({
      endpoint: config.endpoint,
      model: config.model,
      prompt: config.prompt,
      transcript_srt: transcriptSrt,
      video_path: job.filePath,
      tts_voice: config.ttsVoice || job.ttsVoice || 'none',
      tts_speed: Number(config.ttsSpeed || 1),
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
  const narrationScript = compactNarration(analysis.narration_script);
  const scenes = Array.isArray(analysis.scenes) ? analysis.scenes : [];
  if (!analysis.summary?.trim()) throw new Error('AI không trả về summary phân tích video.');
  if (!scenes.length) throw new Error('Vision không trả về scene evidence hợp lệ.');
  if (!narrationScript) throw new Error('AI không tạo được narration_script liền mạch.');

  const sourceMeta = {
    job_id: job.id,
    source_fingerprint: visual.source_fingerprint || '',
    source_duration: Number(info.duration) || 0,
    source_fps: Number(info.fps) || 0,
    source_total_frames: Number(info.total_frames) || 0,
    artifact_version: 4,
    analysis_mode: semanticRemixEnabled ? 'multimodal-semantic-remix-v4' : 'multimodal-standard-script-v4',
    semantic_remix_enabled: semanticRemixEnabled,
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

  let rewrittenSrt;
  let bundle;
  if (!semanticRemixEnabled) {
    rewrittenSrt = narrationToSingleSrt(narrationScript, info.duration);
    bundle = standardArtifacts({
      sourceMeta,
      analysis,
      scenes,
      sampling,
      chunkTimeline,
      frames,
      transcriptSrt,
      narrationScript,
      rewrittenSrt,
      visual,
    });
    job.p1SemanticTargetDurationSec = null;
    log(`[P1] ✅ Standard script v4 hoàn tất — ${frames.length} keyframe / ${chunks.length} chunk / 1 narration liền mạch ${narrationScript.length} ký tự; semantic edit plan=OFF.`, 'success');
  } else {
    const remixBeats = Array.isArray(analysis.remix_beats) ? analysis.remix_beats : [];
    const remixStrategy = analysis.remix_strategy || {};
    const semanticTargetDurationSec = Number(remixStrategy.target_duration_sec) || 0;
    if (!analysis.video_profile || !analysis.product_profile || !analysis.customer_profile) {
      throw new Error('AI chưa trả đủ video/product/customer profile.');
    }
    if (!remixBeats.length) throw new Error('AI không tạo được remix_beats hợp lệ.');
    if (!(semanticTargetDurationSec > 0)) throw new Error('AI không tạo được semantic target duration hợp lệ.');

    const editPlanItems = buildSemanticEditPlan(remixBeats, scenes);
    rewrittenSrt = narrationToSingleSrt(narrationScript, semanticTargetDurationSec);
    const semanticMeta = { ...sourceMeta, semantic_remix_enabled: true };
    bundle = {
      scenes: { ...semanticMeta, scenes },
      multimodal_timeline: {
        ...semanticMeta,
        summary: analysis.summary,
        sampling,
        chunks: chunkTimeline,
        keyframes: frames.map(({ frame, time_sec }) => ({ frame, time_sec })),
        scenes,
        video_profile: analysis.video_profile,
        product_profile: analysis.product_profile,
        customer_profile: analysis.customer_profile,
        semantic_coverage: analysis.semantic_coverage || null,
        source_transcript_srt: transcriptSrt,
      },
      remix_script: {
        ...semanticMeta,
        remix_strategy: remixStrategy,
        remix_beats: remixBeats,
        narration_script: narrationScript,
        narration_budget: visual.narration_budget || null,
        source_duration_sec: Number(info.duration) || 0,
        semantic_target_duration_sec: semanticTargetDurationSec,
        semantic_coverage: analysis.semantic_coverage || null,
        narrated_target_duration_sec: Number(analysis.semantic_coverage?.narrated_target_duration_sec || 0),
        predicted_narration_duration_sec: Number(analysis.semantic_coverage?.predicted_narration_duration_sec || 0),
        segments: [{
          start: '00:00:00,000',
          end: msToSrtTime(Math.max(1000, Math.round(semanticTargetDurationSec * 1000))),
          text: narrationScript,
        }],
        srt: rewrittenSrt,
      },
      edit_plan: {
        ...semanticMeta,
        authoritative: true,
        target_duration_sec: semanticTargetDurationSec,
        remix_strategy: remixStrategy,
        plan: editPlanItems,
        notes: analysis.edit_notes || [],
      },
    };
    job.p1SemanticTargetDurationSec = semanticTargetDurationSec;
    log(
      `[P1] ✅ Semantic remix v4 hoàn tất — ${frames.length} keyframe / ${chunks.length} chunk / ${scenes.length} scene / ${remixBeats.length} beat; target=${semanticTargetDurationSec.toFixed(1)}s từ source=${Number(info.duration || 0).toFixed(1)}s; narration=${narrationScript.length} ký tự.`,
      'success'
    );
  }

  await persistArtifacts(job, bundle, rewrittenSrt);
  job.aiContent = narrationScript;
  job.p1Narration = narrationScript;
  job.remixSrt = rewrittenSrt;
  job.p1Analysis = analysis;
  job.p1Artifacts = bundle;
  job.p1AnalysisMode = sourceMeta.analysis_mode;
  job.sourceFingerprint = sourceMeta.source_fingerprint;

  return {
    sourceSrt: transcriptSrt,
    narrationScript,
    rewrittenSrt,
    analysis,
    bundle,
    info,
    visual,
  };
}

export { narrationToSingleSrt, compactNarration, buildSemanticEditPlan };
