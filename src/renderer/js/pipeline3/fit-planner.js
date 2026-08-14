const VOICE_MIN = 0.92;
const VOICE_MAX = 1.08;
const VIDEO_MIN = 0.90;
const VIDEO_MAX = 1.10;
const CLOSE_DELTA = 0.008;

function finitePositive(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function inRange(value, min, max) {
  return value >= min - 1e-9 && value <= max + 1e-9;
}

function normalizeSpeed(value) {
  return Math.abs(value - 1) < CLOSE_DELTA ? 1 : Number(value.toFixed(4));
}

function result(mode, videoMs, voiceMs, voiceSpeed, videoSpeed, ok = true, reason = '') {
  const safeVoiceSpeed = normalizeSpeed(voiceSpeed);
  const safeVideoSpeed = normalizeSpeed(videoSpeed);
  const finalVoiceMs = voiceMs / safeVoiceSpeed;
  const finalVideoMs = videoMs / safeVideoSpeed;
  const residualMs = finalVoiceMs - finalVideoMs;
  return {
    ok,
    mode,
    reason,
    sourceVideoMs: videoMs,
    sourceVoiceMs: voiceMs,
    sourceRatio: voiceMs / videoMs,
    voiceSpeed: safeVoiceSpeed,
    videoSpeed: safeVideoSpeed,
    finalVoiceMs,
    finalVideoMs,
    residualMs,
    residualRatio: finalVideoMs > 0 ? residualMs / finalVideoMs : 0,
    exact: Math.abs(residualMs) <= 250,
  };
}

function fitVoice(videoMs, voiceMs) {
  const speed = voiceMs / videoMs;
  if (!inRange(speed, VOICE_MIN, VOICE_MAX)) {
    return result('fit_voice', videoMs, voiceMs, 1, 1, false, `Voice cần ${speed.toFixed(3)}x, ngoài giới hạn ${VOICE_MIN.toFixed(2)}–${VOICE_MAX.toFixed(2)}x.`);
  }
  return result('fit_voice', videoMs, voiceMs, speed, 1);
}

function fitVideo(videoMs, voiceMs) {
  const speed = videoMs / voiceMs;
  if (!inRange(speed, VIDEO_MIN, VIDEO_MAX)) {
    return result('fit_video', videoMs, voiceMs, 1, 1, false, `Video cần ${speed.toFixed(3)}x, ngoài giới hạn ${VIDEO_MIN.toFixed(2)}–${VIDEO_MAX.toFixed(2)}x.`);
  }
  return result('fit_video', videoMs, voiceMs, 1, speed);
}

function balanced(videoMs, voiceMs) {
  const ratio = voiceMs / videoMs;
  const voiceSpeed = Math.sqrt(ratio);
  const videoSpeed = 1 / Math.sqrt(ratio);
  if (!inRange(voiceSpeed, VOICE_MIN, VOICE_MAX) || !inRange(videoSpeed, VIDEO_MIN, VIDEO_MAX)) {
    return result('balanced', videoMs, voiceMs, 1, 1, false, `Cân bằng cần voice ${voiceSpeed.toFixed(3)}x và video ${videoSpeed.toFixed(3)}x, vượt giới hạn an toàn.`);
  }
  return result('balanced', videoMs, voiceMs, voiceSpeed, videoSpeed);
}

function natural(videoMs, voiceMs) {
  if (voiceMs > videoMs + 250) {
    return result('natural', videoMs, voiceMs, 1, 1, false, 'Voice dài hơn video; Natural sẽ cắt hoặc tràn voice nên bị chặn.');
  }
  return result('natural', videoMs, voiceMs, 1, 1, true, voiceMs < videoMs ? 'Giữ nhịp tự nhiên; phần video còn lại dùng hình/nhạc nền.' : 'Đã gần khớp tự nhiên.');
}

export function planP3Fit(videoDurationMs, voiceDurationMs, requestedMode = 'auto') {
  const videoMs = finitePositive(videoDurationMs);
  const voiceMs = finitePositive(voiceDurationMs);
  const mode = String(requestedMode || 'auto').toLowerCase();
  if (!videoMs || !voiceMs) {
    return { ok: false, mode, reason: 'Thiếu duration video hoặc voice để lập kế hoạch fit.', sourceVideoMs: videoMs, sourceVoiceMs: voiceMs };
  }

  if (mode === 'natural') return natural(videoMs, voiceMs);
  if (mode === 'fit_voice') return fitVoice(videoMs, voiceMs);
  if (mode === 'fit_video') return fitVideo(videoMs, voiceMs);
  if (mode === 'balanced') return balanced(videoMs, voiceMs);

  const ratio = voiceMs / videoMs;
  if (Math.abs(ratio - 1) <= CLOSE_DELTA) return result('auto', videoMs, voiceMs, 1, 1, true, 'Đã gần khớp; không đổi tốc độ.');

  const balancedPlan = balanced(videoMs, voiceMs);
  if (balancedPlan.ok) return { ...balancedPlan, mode: 'auto', selectedStrategy: 'balanced', reason: 'Auto chọn cân bằng để chia thay đổi giữa voice và video.' };

  const voicePlan = fitVoice(videoMs, voiceMs);
  if (voicePlan.ok) return { ...voicePlan, mode: 'auto', selectedStrategy: 'fit_voice', reason: 'Auto giữ video và chỉ chỉnh voice trong giới hạn an toàn.' };

  const videoPlan = fitVideo(videoMs, voiceMs);
  if (videoPlan.ok) return { ...videoPlan, mode: 'auto', selectedStrategy: 'fit_video', reason: 'Auto giữ voice và chỉ chỉnh video trong giới hạn an toàn.' };

  if (voiceMs < videoMs) {
    const naturalPlan = natural(videoMs, voiceMs);
    return { ...naturalPlan, mode: 'auto', selectedStrategy: 'natural', reason: 'Không thể fit an toàn; Auto giữ tốc độ tự nhiên và chấp nhận phần video còn lại.' };
  }

  return result('auto', videoMs, voiceMs, 1, 1, false, 'Voice dài hơn video và không có phương án fit nào nằm trong giới hạn an toàn.');
}

export const P3_FIT_LIMITS = Object.freeze({
  voiceMin: VOICE_MIN,
  voiceMax: VOICE_MAX,
  videoMin: VIDEO_MIN,
  videoMax: VIDEO_MAX,
  closeDelta: CLOSE_DELTA,
});
