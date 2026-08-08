export const state = {
  jobs: [],
  activeJobId: null,
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

