/**
 * API Client - Handles communication with Python backend
 */
const API_BASE = 'http://localhost:8765';

class APIClient {
  constructor() {
    this.base = API_BASE;
    this.ws = null;
    this.wsListeners = [];
    this.currentVideoPath = null;
  }

  // HTTP helpers
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async post(path, body = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async getBlob(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.blob();
  }

  // Endpoints
  async health() { return this.get('/api/health'); }
  async gpuInfo() { return this.get('/api/gpu-info'); }

  async videoInfo(path) {
    this.currentVideoPath = path;
    return this.get(`/api/video-info?path=${encodeURIComponent(path)}`);
  }

  async getFrame(frameNumber, path) {
    const p = path || this.currentVideoPath;
    return this.getBlob(`/api/frame/${frameNumber}?path=${encodeURIComponent(p)}`);
  }

  async getOutputFrame(frameNumber, outputPath) {
    return this.getBlob(`/api/frame/${frameNumber}?path=${encodeURIComponent(outputPath)}`);
  }

  async detectText(videoPath, frameNumber) {
    return this.post('/api/detect-text', { video_path: videoPath, frame_number: frameNumber });
  }

  async startProcessBatch(jobs) {
    return this.post('/api/process', { jobs: jobs });
  }

  async getStatus() { return this.get('/api/status'); }
  async cancelProcess() { return this.post('/api/cancel'); }

  // Health check with retry
  async waitForBackend(maxRetries = 60, intervalMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      try { await this.health(); return true; }
      catch { await new Promise(r => setTimeout(r, intervalMs)); }
    }
    return false;
  }

  // WebSocket
  connectWebSocket() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    this.ws = new WebSocket('ws://localhost:8765/ws/progress');

    this.ws.onopen = () => this._notify({ type: 'connected' });
    this.ws.onmessage = (e) => {
      try { this._notify({ type: 'progress', data: JSON.parse(e.data) }); }
      catch (err) { console.warn('WS parse error:', err); }
    };
    this.ws.onclose = () => {
      this._notify({ type: 'disconnected' });
      setTimeout(() => this.connectWebSocket(), 3000);
    };
    this.ws.onerror = () => this.ws.close();
  }

  onWebSocketMessage(cb) {
    this.wsListeners.push(cb);
    return () => { this.wsListeners = this.wsListeners.filter(c => c !== cb); };
  }

  _notify(msg) { this.wsListeners.forEach(cb => cb(msg)); }

  // ─── TTS Methods ──────────────────────────
  async getTTSStatus() {
    const r = await fetch(`${this.base}/api/tts/status`);
    return r.json();
  }

  async generateTTS(text, refAudioPath = null, language = 'vi') {
    const r = await fetch(`${this.base}/api/tts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, ref_audio_path: refAudioPath, language })
    });
    return r.json();
  }

  async generateTTSFromSrt(srtPath, refAudioPath = null, language = 'vi', outputDir = null) {
    const r = await fetch(`${this.base}/api/tts/from-srt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ srt_path: srtPath, ref_audio_path: refAudioPath, language, output_dir: outputDir })
    });
    return r.json();
  }

  // ─── Audio/Subtitle Replacement ────────────
  async replaceAudio(videoPath, audioPath, outputPath, bgVolume = 10) {
    const r = await fetch(`${this.base}/api/replace-audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_path: videoPath, audio_path: audioPath, output_path: outputPath, bg_volume: bgVolume })
    });
    return r.json();
  }

  async burnSubtitle(videoPath, srtPath, outputPath, mode = 'soft', styleArgs = {}) {
    const r = await fetch(`${this.base}/api/burn-subtitle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        video_path: videoPath, 
        srt_path: srtPath, 
        output_path: outputPath, 
        mode,
        ...styleArgs
      })
    });
    return r.json();
  }
}

window.api = new APIClient();
