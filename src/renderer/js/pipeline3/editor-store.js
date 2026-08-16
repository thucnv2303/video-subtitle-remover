const listeners = new Set();

const state = {
  activeJobId: null,
  search: '',
  statusFilter: 'all',
  renderingJobId: null,
  videoInfoByJob: new Map(),
  cuesByJob: new Map(),
  selectedCueByJob: new Map(),
};

export function getP3EditorState() {
  return state;
}

export function updateP3EditorState(patch = {}) {
  Object.assign(state, patch);
  listeners.forEach(listener => listener(state));
}

export function subscribeP3Editor(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function appJobs() {
  return Array.isArray(window._appState?.jobs) ? window._appState.jobs : [];
}

export function isP3Ready(job) {
  if (!job) return false;
  if (['ready', 'rendering', 'finished', 'error'].includes(job.p3Status)) return true;
  return job.p2Status === 'finished' && Boolean(job.outputPath);
}

export function p3Jobs() {
  return appJobs().filter(isP3Ready);
}

export function ensureP3Config(job) {
  if (!job) return null;
  const defaults = {
    preset: 'youtube',
    stylePresetId: 'custom',
    subtitleEnabled: Boolean(job.ttsTimedSrt || job.voiceSubContent || job.karaokeAss),
    fontFamily: 'Arial', fontSize: 46, bold: true, italic: false, underline: false,
    textColor: '#ffffff', textOpacity: 100, outlineColor: '#000000', outlineWidth: 3, shadow: 2,
    letterSpacing: 0,
    glowEnabled: false, glowColor: '#3b82f6', glowBlur: 4, glowOutline: 3,
    bgEnabled: true, bgColor: '#000000', bgOpacity: 62, padding: 10,
    lineHeight: 1.18, maxWidth: 80, align: 'center', x: 50, y: 82,
    safeZone: true, snap: true, effect: 'none', effectMs: 180,
    motionMode: 'effect', typewriterSpeed: 120,
    coverEnabled: false, coverColor: '#0a0a0a', coverOpacity: 76, coverWidth: 92, coverHeightPx: 112,
    fitMode: 'auto',
    removeVocal: localStorage.getItem('tts_remove_vocal') === 'true',
    bgVolume: Number(localStorage.getItem('tts_bg_volume') || 10),
    preserveKaraoke: true,
    outputDirectory: '',
    outputFileName: '',
    exportQuality: 'high',
  };
  job.p3Config = { ...defaults, ...(job.p3Config || {}) };
  if (job.karaokeAss && !job.p3OriginalKaraokeAss && !job.p3DerivedAss) job.p3OriginalKaraokeAss = job.karaokeAss;
  return job.p3Config;
}

export function selectedP3Job() {
  const jobs = p3Jobs();
  if (!jobs.length) return null;
  let job = jobs.find(item => item.id === state.activeJobId);
  if (!job) {
    job = jobs.find(item => item.id === window._appState?.activeJobId) || jobs[0];
    state.activeJobId = job.id;
  }
  ensureP3Config(job);
  return job;
}

export function selectedCueIndex(job) {
  if (!job) return -1;
  return Number(state.selectedCueByJob.get(job.id) ?? -1);
}

export function selectCue(job, index) {
  if (!job) return;
  state.selectedCueByJob.set(job.id, Number(index));
  listeners.forEach(listener => listener(state));
}
