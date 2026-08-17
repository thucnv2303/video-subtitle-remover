const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');

const ALLOWED_PRESETS = new Set(['medium', 'slow', 'slower']);

function clampCrf(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(12, Math.min(28, Math.round(parsed))) : 18;
}

function normalizePreset(value) {
  const preset = String(value || 'slow').trim().toLowerCase();
  return ALLOWED_PRESETS.has(preset) ? preset : 'slow';
}

function resolveExistingFile(value, label) {
  const resolved = path.resolve(String(value || ''));
  if (!resolved || !fs.existsSync(resolved)) throw new Error(`${label} không tồn tại.`);
  return resolved;
}

function ensureOutputDirectory(output) {
  const outputDir = path.dirname(output);
  if (fs.existsSync(outputDir)) return;
  fs.mkdirSync(outputDir, { recursive: true });
}

function resolveOutputPath(value) {
  const output = path.resolve(String(value || ''));
  if (!output) throw new Error('Thiếu đường dẫn video đầu ra.');
  if (path.extname(output).toLowerCase() !== '.mp4') throw new Error('P3 Rev4 chỉ xuất MP4.');
  ensureOutputDirectory(output);
  return output;
}

function escapeAssFilterPath(filePath) {
  let normalized = String(filePath).replace(/\\/g, '/').replace(/'/g, "\\'");
  if (/^[A-Za-z]:/.test(normalized)) normalized = `${normalized[0]}\\:${normalized.slice(2)}`;
  return normalized.replace(/,/g, '\\,').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
}

function runFfmpeg(args, timeoutMs = 20 * 60 * 1000) {
  return new Promise((resolve) => {
    execFile('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { windowsHide: true, timeout: timeoutMs }, (error, stdout, stderr) => {
      if (error) {
        resolve({ ok: false, error: (stderr || error.message || 'FFmpeg failed').trim() });
        return;
      }
      resolve({ ok: true });
    });
  });
}

async function burnP3SubtitleHq(payload = {}) {
  let assPath = '';
  try {
    const videoPath = resolveExistingFile(payload.videoPath, 'Video đầu vào');
    const outputPath = resolveOutputPath(payload.outputPath);
    const assContent = String(payload.assContent || '').trim();
    if (!assContent) throw new Error('Thiếu ASS P3 để burn subtitle.');

    const crf = clampCrf(payload.crf);
    const preset = normalizePreset(payload.preset);
    assPath = path.join(os.tmpdir(), `vsr-p3-${Date.now()}-${Math.random().toString(36).slice(2)}.ass`);
    fs.writeFileSync(assPath, assContent, 'utf8');

    const result = await runFfmpeg([
      '-i', videoPath,
      '-vf', `ass='${escapeAssFilterPath(assPath)}'`,
      '-c:v', 'libx264', '-preset', preset, '-crf', String(crf),
      '-c:a', 'copy',
      '-movflags', '+faststart',
      outputPath,
    ]);
    if (!result.ok) return result;
    return { ok: true, output_path: outputPath, codec: 'libx264', crf, preset };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  } finally {
    if (assPath) {
      try { fs.unlinkSync(assPath); } catch {}
    }
  }
}

async function retimeP3Video(payload = {}) {
  try {
    const videoPath = resolveExistingFile(payload.videoPath, 'Video đầu vào');
    const outputPath = resolveOutputPath(payload.outputPath);
    const speed = Number(payload.speed);
    if (!Number.isFinite(speed) || speed < 0.90 || speed > 1.10) {
      throw new Error('Tốc độ video P3 phải nằm trong khoảng 0.90x–1.10x.');
    }
    const crf = clampCrf(payload.crf);
    const preset = normalizePreset(payload.preset);
    if (Math.abs(speed - 1) < 0.02) {
      return { ok: true, output_path: videoPath, speed_ratio: 1, adjusted: false, codec: 'copy' };
    }

    const ptsFactor = 1 / speed;
    const result = await runFfmpeg([
      '-i', videoPath,
      '-filter:v', `setpts=${ptsFactor.toFixed(8)}*PTS`,
      '-an',
      '-c:v', 'libx264', '-preset', preset, '-crf', String(crf),
      '-movflags', '+faststart',
      outputPath,
    ]);
    if (!result.ok) return result;
    return { ok: true, output_path: outputPath, speed_ratio: speed, adjusted: true, codec: 'libx264', crf, preset };
  } catch (error) {
    return { ok: false, error: error?.message || String(error) };
  }
}

module.exports = { burnP3SubtitleHq, retimeP3Video };
