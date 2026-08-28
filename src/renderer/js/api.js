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

  async getLivePreview() {
    return this.getBlob('/api/preview');
  }

  async detectText(videoPath, frameNumber) {
    return this.post('/api/detect-text', { video_path: videoPath, frame_number: frameNumber });
  }

  async startProcessBatch(jobs) {
    return this.post('/api/process', { jobs: jobs });
  }

  async getStatus() { return this.get('/api/status'); }
  async cancelProcess() { return this.post('/api/cancel'); }

  async analyzeVideo(videoPath, aiConfig, prompt) {
    return this.post('/api/analyze-video', {
      video_path: videoPath,
      ai_config: aiConfig,
      prompt: prompt
    });
  }

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
      catch (err) { console.warn('WS parse error:', err.stack, 'Message:', e.data); }
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

  /**
   * Generate TTS audio.
   * - voiceName: Edge TTS voice (e.g. 'vi-VN-NamMinhNeural') or 'clone:N'
   * - refAudioPath: reference audio for OmniVoice clone voice
   * Always sends voice_name so backend can route to Edge TTS or OmniVoice correctly.
   */
  async generateTTS(text, refAudioPath = null, language = 'vi', voiceName = null) {
    const body = { text, ref_audio_path: refAudioPath, language };
    if (voiceName) body.voice_name = voiceName;
    const r = await fetch(`${this.base}/api/tts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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

  async writeFile(path, content) {
    const r = await fetch(`${this.base}/api/write-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content })
    });
    return r.json();
  }

  async removeVocal(videoPath, outputAudioPath = null) {
    const r = await fetch(`${this.base}/api/remove-vocal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_path: videoPath, output_audio_path: outputAudioPath })
    });
    return r.json();
  }

  async adjustVideoTempo(videoPath, outputPath, audioDurationMs, maxSpeed = 1.30, minSpeed = 0.80) {
    const r = await fetch(`${this.base}/api/adjust-video-tempo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_path:        videoPath,
        output_path:       outputPath,
        audio_duration_ms: audioDurationMs,
        max_speed_ratio:   maxSpeed,
        min_speed_ratio:   minSpeed,
      })
    });
    return r.json();
  }

  async extractSrt(videoPath, asrFallback = true, asrLanguage = 'vi') {
    const r = await fetch(`${this.base}/api/extract-srt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_path: videoPath, asr_fallback: asrFallback, asr_language: asrLanguage })
    });
    return r.json();
  }

  async extractTextP1(jobId, videoPath, language) {
    const r = await fetch(`${this.base}/api/p1/extract-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: jobId,
        video_path: videoPath,
        extraction_mode: 'asr',
        language: language
      })
    });
    
    let result;
    try {
      result = await r.json();
    } catch (e) {
      throw new Error("Invalid JSON response from server");
    }

    if (!r.ok || result.status !== "ok") {
      throw new Error(result.error || "Unknown error during ASR extraction");
    }

    return result;
  }

  async aiRewrite(srtContent, aiConfig = {}) {
    const r = await fetch(`${this.base}/api/ai-rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ srt_content: srtContent, ai_config: aiConfig })
    });
    return r.json();
  }

  async videoRenderCutAndConcat(videoPath, clips = [], outputPath = null, mode = 'lossless', removeVocal = false) {
    const r = await fetch(`${this.base}/api/video-render/cut-and-concat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_path: videoPath, clips, output_path: outputPath, mode, remove_vocal: removeVocal })
    });
    return r.json();
  }

  async removeVocalVideo(videoPath, outputVideoPath = null) {
    const r = await fetch(`${this.base}/api/remove-vocal-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_path: videoPath, output_video_path: outputVideoPath })
    });
    return r.json();
  }

  async detectFaceFreeTimeline(videoPath, sampleStep = 0.35, minClipSec = 1.0) {
    const r = await fetch(`${this.base}/api/ai-remix/detect-face-free-timeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_path: videoPath, sample_step_sec: sampleStep, min_clip_sec: minClipSec })
    });
    return r.json();
  }

  async aiRemixAutoDirector(videoPath, faceFreeIntervals = null, aiConfig = null, sampleStep = 0.35) {
    const r = await fetch(`${this.base}/api/ai-remix/auto-director`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_path: videoPath, face_free_intervals: faceFreeIntervals, ai_config: aiConfig, sample_step_sec: sampleStep })
    });
    return r.json();
  }

  async aiRemixProcessSingleVideo(videoPath, outputPath = null, ttsVoice = 'default', mode = 'lossless', removeVocal = true, aiConfig = null, remixClips = null, voiceoverScript = null) {
    const r = await fetch(`${this.base}/api/ai-remix/process-single-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_path: videoPath,
        output_path: outputPath,
        tts_voice: ttsVoice,
        mode,
        remove_vocal: removeVocal,
        ai_config: aiConfig,
        remix_clips: remixClips,
        voiceover_script: voiceoverScript
      })
    });
    return r.json();
  }

  async detectSubPositions(videoPath, sampleStep = 30) {
    const r = await fetch(`${this.base}/api/detect-sub-positions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_path: videoPath, sample_step: sampleStep })
    });
    return r.json();
  }

  async burnSubtitlePositioned(videoPath, srtContent, outputPath, positions = [], styleArgs = {}, karaokeAss = null) {
    const r = await fetch(`${this.base}/api/burn-subtitle-positioned`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video_path:   videoPath,
        srt_content:  srtContent,
        output_path:  outputPath,
        positions:    positions,
        karaoke_ass:  karaokeAss,   // ASS karaoke content nếu có
        ...styleArgs
      })
    });
    return r.json();
  }

  // testTTS: test a voice by name (Edge TTS system voice OR clone index)
  // voiceValue can be: 'vi-VN-NamMinhNeural', 'clone:0', etc.
  async testTTS({ voice, text }) {
    let refAudio = null;
    const language = 'vi';
    if (voice && voice.startsWith('clone:')) {
      const idx = parseInt(voice.split(':')[1]);
      try {
        const voices = JSON.parse(localStorage.getItem('tts_voices') || '[]');
        if (voices[idx]) refAudio = voices[idx].audioPath;
      } catch (e) {}
    }
    const result = await this.generateTTS(text, refAudio, language, voice);
    if (result.status === 'ok') return { audio_path: result.audio_path };
    return result;
  }
}

window.api = new APIClient();

