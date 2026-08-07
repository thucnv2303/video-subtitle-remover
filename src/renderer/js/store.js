export const state = {
  jobs: [],
  activeJobId: null,
  pipeline1SelectedJobId: null,
  outputDir: localStorage.getItem('output_dir') || null,
  isBackendReady: false,
  isDrawing: false,
  isSelecting: false,
  selectionStart: null,
  playIntervalOrig: null,
  playIntervalResult: null,
  currentFrameOrig: 0,
  currentFrameResult: 0,
  videoInfo: null,
  processingJobId: null,
  processingPassIndex: 0,
  pollTimer: null,
  activeLogTab: 'all',
  processingStartTime: null,
  processingTimerInterval: null,
  pipeline1JobId: null,
  settings: {
    targetLang: 'vi',
    ttsVoice: 'vi-VN-HoaiMyNeural',
    removeMode: 'ai',
    subtitleColor: '&H00FFFFFF',
    subtitleFont: 'Arial',
    subtitleFontSize: 24,
    subtitleMarginV: 10,
    apiProvider: 'ollama',
    geminiKey: '',
    openaiKey: '',
    anthropicKey: '',
    aiModel: 'llama3:latest',
    customPrompt: ''
  },
  livePreviewInterval: null,
};

window._appState = state; // Keep global for backward compatibility for now

export function loadState() {
  const s = localStorage.getItem('appState');
  if (s) {
    Object.assign(state.settings, JSON.parse(s));
  }
}

export function saveState() {
  localStorage.setItem('appState', JSON.stringify(state.settings));
}

