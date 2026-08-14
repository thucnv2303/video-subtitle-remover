const P3W_STYLE_ATTR = 'data-p3-workspace-style';
const P3W_SYNC_MS = 300;
const P3W_SAFE_MIN_X = 6;
const P3W_SAFE_MAX_X = 94;
const P3W_SAFE_MIN_Y = 8;
const P3W_SAFE_MAX_Y = 92;

const runtime = {
  mounted: false,
  activeJobId: null,
  renderingJobId: null,
  renderPatched: false,
  dragFrame: 0,
  pendingDrag: null,
  cuesByJob: new Map(),
  videoInfoByJob: new Map(),
  lastCueIndex: -1,
};

const PRESETS = {
  default: { fontFamily: 'Arial', fontSize: 42, bold: true, italic: false, textColor: '#ffffff', outlineColor: '#000000', outlineWidth: 3, shadow: 2, bgEnabled: false, bgColor: '#000000', bgOpacity: 55, bgRadius: 8, padding: 10, lineHeight: 1.2, maxWidth: 82, align: 'center', effect: 'none', effectMs: 180, x: 50, y: 84 },
  youtube: { fontFamily: 'Arial', fontSize: 46, bold: true, italic: false, textColor: '#ffffff', outlineColor: '#000000', outlineWidth: 4, shadow: 2, bgEnabled: true, bgColor: '#000000', bgOpacity: 62, bgRadius: 8, padding: 10, lineHeight: 1.18, maxWidth: 80, align: 'center', effect: 'pop', effectMs: 180, x: 50, y: 82 },
  karaoke: { fontFamily: 'Arial', fontSize: 44, bold: true, italic: false, textColor: '#facc15', outlineColor: '#111827', outlineWidth: 3, shadow: 2, bgEnabled: false, bgColor: '#000000', bgOpacity: 0, bgRadius: 8, padding: 8, lineHeight: 1.18, maxWidth: 82, align: 'center', effect: 'fade', effectMs: 160, x: 50, y: 82 },
  minimal: { fontFamily: 'Arial', fontSize: 38, bold: false, italic: false, textColor: '#ffffff', outlineColor: '#000000', outlineWidth: 1, shadow: 1, bgEnabled: true, bgColor: '#000000', bgOpacity: 38, bgRadius: 6, padding: 8, lineHeight: 1.25, maxWidth: 76, align: 'center', effect: 'fade', effectMs: 220, x: 50, y: 86 },
  news: { fontFamily: 'Arial', fontSize: 38, bold: true, italic: false, textColor: '#ffffff', outlineColor: '#172554', outlineWidth: 2, shadow: 1, bgEnabled: true, bgColor: '#172554', bgOpacity: 84, bgRadius: 3, padding: 10, lineHeight: 1.18, maxWidth: 90, align: 'left', effect: 'fade', effectMs: 140, x: 50, y: 88 },
  review: { fontFamily: 'Arial', fontSize: 42, bold: true, italic: false, textColor: '#ffffff', outlineColor: '#312e81', outlineWidth: 3, shadow: 3, bgEnabled: true, bgColor: '#111827', bgOpacity: 58, bgRadius: 12, padding: 12, lineHeight: 1.22, maxWidth: 78, align: 'center', effect: 'pop', effectMs: 200, x: 50, y: 82 },
};

function appState() {
  return window._appState || null;
}

function ensureStylesheet() {
  if (document.querySelector(`link[${P3W_STYLE_ATTR}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/pipeline3-workspace.css';
  link.setAttribute(P3W_STYLE_ATTR, 'true');
  document.head.appendChild(link);
}

function isP3Ready(job) {
  if (!job) return false;
  if (['ready', 'rendering', 'finished', 'error'].includes(job.p3Status)) return true;
  return job.p2Status === 'finished' && Boolean(job.outputPath);
}

function readyJobs() {
  const jobs = Array.isArray(appState()?.jobs) ? appState().jobs : [];
  return jobs.filter(isP3Ready);
}

function defaultConfig(job) {
  return {
    preset: 'youtube',
    subtitleEnabled: Boolean(job?.ttsTimedSrt || job?.voiceSubContent || job?.karaokeAss),
    safeZone: true,
    snap: true,
    ...PRESETS.youtube,
    removeVocal: false,
    bgVolume: Number(localStorage.getItem('tts_bg_volume') || 10),
  };
}

function ensureJobConfig(job) {
  if (!job) return null;
  if (!job.p3Config || typeof job.p3Config !== 'object') job.p3Config = defaultConfig(job);
  else job.p3Config = { ...defaultConfig(job), ...job.p3Config };
  if (job.karaokeAss && !job.p3OriginalKaraokeAss && !job.p3DerivedAss) job.p3OriginalKaraokeAss = job.karaokeAss;
  return job.p3Config;
}

function selectedJob() {
  const jobs = readyJobs();
  if (!jobs.length) return null;
  let job = jobs.find(item => item.id === runtime.activeJobId);
  if (!job) {
    const state = appState();
    job = jobs.find(item => item.id === state?.activeJobId) || jobs[0];
    runtime.activeJobId = job.id;
  }
  ensureJobConfig(job);
  return job;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function fileUrl(path) {
  const raw = String(path || '').trim();
  if (!raw) return '';
  if (/^(https?|file|blob):/i.test(raw)) return raw;
  const normalized = raw.replace(/\\/g, '/');
  const prefixed = normalized.startsWith('/') ? `file://${normalized}` : `file:///${normalized}`;
  return encodeURI(prefixed).replace(/#/g, '%23');
}

function parseSrtTime(value) {
  const match = String(value || '').trim().match(/^(\d+):(\d+):(\d+)[,.](\d+)$/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(`0.${match[4]}`);
}

function parseSrt(srt) {
  const text = String(srt || '').replace(/\r/g, '').trim();
  if (!text) return [];
  return text.split(/\n{2,}/).map((block, index) => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex(line => line.includes('-->'));
    if (timingIndex < 0) return null;
    const [startRaw, endRaw] = lines[timingIndex].split('-->').map(value => value.trim().split(/\s+/)[0]);
    const start = parseSrtTime(startRaw);
    const end = parseSrtTime(endRaw);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
    return { index, start, end, text: lines.slice(timingIndex + 1).join('\n').trim() };
  }).filter(item => item?.text);
}

function cuesFor(job) {
  if (!job) return [];
  const source = String(job.ttsTimedSrt || job.voiceSubContent || job.srtContent || '');
  const cached = runtime.cuesByJob.get(job.id);
  if (cached?.source === source) return cached.cues;
  const cues = parseSrt(source);
  runtime.cuesByJob.set(job.id, { source, cues });
  return cues;
}

function fmtTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safe / 60);
  const secs = Math.floor(safe % 60);
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function rgba(hex, opacityPercent) {
  const clean = String(hex || '#000000').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(ch => ch + ch).join('') : clean.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(100, Number(opacityPercent) || 0)) / 100})`;
}

function assColor(hex, opacityPercent = 100) {
  const clean = String(hex || '#ffffff').replace('#', '').padEnd(6, '0').slice(0, 6);
  const r = clean.slice(0, 2);
  const g = clean.slice(2, 4);
  const b = clean.slice(4, 6);
  const alpha = Math.round((1 - Math.max(0, Math.min(100, Number(opacityPercent) || 0)) / 100) * 255)
    .toString(16).padStart(2, '0');
  return `&H${alpha}${b}${g}${r}`.toUpperCase();
}

function assTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const cs = Math.floor((safe - Math.floor(safe)) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function cleanAssText(value) {
  return String(value || '')
    .replace(/[{}]/g, '')
    .replace(/\\/g, '／')
    .replace(/\r?\n/g, '\\N');
}

function alignCode(config) {
  return config.align === 'left' ? 4 : config.align === 'right' ? 6 : 5;
}

function effectTags(config) {
  const ms = Math.max(0, Math.min(1200, Number(config.effectMs) || 0));
  if (config.effect === 'fade') return `\\fad(${ms},${ms})`;
  if (config.effect === 'pop') return `\\fscx86\\fscy86\\t(0,${ms},\\fscx100\\fscy100)`;
  return '';
}

function buildDerivedAss(job, config, width, height) {
  const w = Math.max(320, Math.round(Number(width) || 1920));
  const h = Math.max(240, Math.round(Number(height) || 1080));
  const x = Math.round(w * Math.max(0, Math.min(100, Number(config.x) || 50)) / 100);
  const y = Math.round(h * Math.max(0, Math.min(100, Number(config.y) || 82)) / 100);
  const primary = assColor(config.textColor, 100);
  const outline = assColor(config.outlineColor, 100);
  const back = assColor(config.bgColor, config.bgEnabled ? config.bgOpacity : 0);
  const borderStyle = config.bgEnabled ? 3 : 1;
  const bold = config.bold ? -1 : 0;
  const italic = config.italic ? -1 : 0;
  const outlineSize = Math.max(0, Math.min(12, Number(config.outlineWidth) || 0));
  const shadow = Math.max(0, Math.min(12, Number(config.shadow) || 0));
  const size = Math.max(10, Math.min(160, Number(config.fontSize) || 42));
  const margin = Math.max(0, Math.round(Number(config.padding) || 0));
  const cues = cuesFor(job);
  const header = [
    '[Script Info]',
    'ScriptType: v4.00+',
    'WrapStyle: 2',
    `PlayResX: ${w}`,
    `PlayResY: ${h}`,
    'ScaledBorderAndShadow: yes',
    '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: Karaoke,${config.fontFamily},${size},${primary},${primary},${outline},${back},${bold},${italic},0,0,100,100,0,0,${borderStyle},${outlineSize},${shadow},${alignCode(config)},${margin},${margin},${margin},1`,
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
  const tag = `{\\an${alignCode(config)}\\pos(${x},${y})${effectTags(config)}}`;
  const events = cues.map(cue => `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Karaoke,,0,0,0,,${tag}${cleanAssText(cue.text)}`);
  return [...header, ...events].join('\n');
}

function decorateOriginalKaraokeAss(job, config, width, height) {
  let ass = String(job.p3OriginalKaraokeAss || '');
  if (!ass.trim()) return '';
  const w = Math.max(320, Math.round(Number(width) || 1920));
  const h = Math.max(240, Math.round(Number(height) || 1080));
  const x = Math.round(w * config.x / 100);
  const y = Math.round(h * config.y / 100);
  ass = ass.replace(/PlayResX:\s*\d+/i, `PlayResX: ${w}`).replace(/PlayResY:\s*\d+/i, `PlayResY: ${h}`);
  const primary = assColor(config.textColor, 100);
  const outline = assColor(config.outlineColor, 100);
  const back = assColor(config.bgColor, config.bgEnabled ? config.bgOpacity : 0);
  const styleLine = `Style: Karaoke,${config.fontFamily},${config.fontSize},${primary},${primary},${outline},${back},${config.bold ? -1 : 0},${config.italic ? -1 : 0},0,0,100,100,0,0,${config.bgEnabled ? 3 : 1},${config.outlineWidth},${config.shadow},${alignCode(config)},${config.padding},${config.padding},${config.padding},1`;
  if (/^Style:\s*Karaoke,.*$/im.test(ass)) ass = ass.replace(/^Style:\s*Karaoke,.*$/im, styleLine);
  const prefix = `{\\an${alignCode(config)}\\pos(${x},${y})${effectTags(config)}}`;
  ass = ass.replace(/^(Dialogue:\s*[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,)(.*)$/gim, (full, head, text) => `${head}${prefix}${text}`);
  return ass;
}

async function ensureVideoInfo(job) {
  if (!job) return null;
  if (runtime.videoInfoByJob.has(job.id)) return runtime.videoInfoByJob.get(job.id);
  const path = job.outputPath || job.filePath;
  if (!path || !window.api?.videoInfo) return null;
  try {
    const info = await window.api.videoInfo(path);
    if (info?.width && info?.height) {
      runtime.videoInfoByJob.set(job.id, info);
      job.p3VideoInfo = info;
      return info;
    }
  } catch (error) {
    window.addLog?.(`[P3] Không đọc được metadata preview: ${error.message}`, 'warning');
  }
  return null;
}

async function refreshDerivedAss(job) {
  if (!job) return;
  const config = ensureJobConfig(job);
  const info = runtime.videoInfoByJob.get(job.id) || job.p3VideoInfo || await ensureVideoInfo(job);
  const width = info?.width || 1920;
  const height = info?.height || 1080;
  const useOriginalKaraoke = config.preset === 'karaoke' && Boolean(job.p3OriginalKaraokeAss);
  const ass = useOriginalKaraoke
    ? decorateOriginalKaraokeAss(job, config, width, height)
    : buildDerivedAss(job, config, width, height);
  job.p3DerivedAss = ass;
  job.karaokeAss = ass || job.p3OriginalKaraokeAss || null;
}

function workspaceMarkup() {
  return `
    <div class="p3w-shell">
      <section class="p3w-main">
        <div class="p3w-card p3w-toolbar">
          <div>
            <div class="p3w-title">Pipeline 3 · Dựng & Xuất</div>
            <div class="p3w-subtitle">Final preview, phụ đề, audio và render trên clean video.</div>
          </div>
          <div class="p3w-spacer"></div>
          <select id="p3w-job-select" class="p3w-select p3w-job-select" aria-label="Chọn Job Pipeline 3"></select>
          <span id="p3w-job-status" class="p3w-status">Chờ Job</span>
        </div>

        <div class="p3w-card p3w-stagebar" aria-label="Luồng Pipeline 3">
          <div class="p3w-stage"><span class="p3w-stage-index">1</span>Nguồn & Voice</div>
          <div class="p3w-stage is-active"><span class="p3w-stage-index">2</span>Phụ đề & Style</div>
          <div class="p3w-stage"><span class="p3w-stage-index">3</span>Audio & Hiệu ứng</div>
          <div class="p3w-stage"><span class="p3w-stage-index">4</span>Xuất video</div>
        </div>

        <div class="p3w-editor">
          <div class="p3w-card p3w-preview-card">
            <div class="p3w-preview-head">
              <strong>Xem trước Final</strong>
              <span class="p3w-subtitle">Kéo phụ đề trực tiếp để đặt vị trí.</span>
              <div class="p3w-spacer"></div>
              <span id="p3w-preview-meta" class="p3w-mini">—</span>
            </div>
            <div id="p3w-video-wrap" class="p3w-video-wrap">
              <video id="p3w-video" class="p3w-video" preload="metadata"></video>
              <div id="p3w-safe" class="p3w-safe"></div>
              <div id="p3w-grid" class="p3w-grid"></div>
              <div id="p3w-sub-overlay" class="p3w-sub-overlay" tabindex="0">Kéo phụ đề để đặt vị trí</div>
            </div>
            <div class="p3w-player">
              <button id="p3w-play" class="p3w-btn" type="button">▶</button>
              <input id="p3w-seek" type="range" min="0" max="1000" value="0" aria-label="Tua video">
              <span id="p3w-time" class="p3w-time">00:00 / 00:00</span>
            </div>
          </div>

          <div class="p3w-card p3w-quick">
            <div class="p3w-section-title">Cấu hình nhanh</div>
            <div class="p3w-field"><label>Preset</label><select id="p3w-quick-preset" class="p3w-select"><option value="default">Default</option><option value="youtube">YouTube</option><option value="karaoke">Karaoke</option><option value="minimal">Minimal</option><option value="news">News</option><option value="review">Review</option></select></div>
            <div class="p3w-field"><label>Vị trí nhanh</label><select id="p3w-quick-position" class="p3w-select"><option value="top">Trên · giữa</option><option value="center">Giữa</option><option value="bottom">Dưới · giữa</option><option value="custom">Tùy chỉnh</option></select></div>
            <label class="p3w-check"><input id="p3w-sub-enabled" type="checkbox"> Burn phụ đề</label>
            <label class="p3w-check"><input id="p3w-safe-toggle" type="checkbox"> Hiện vùng an toàn</label>
            <label class="p3w-check"><input id="p3w-snap-toggle" type="checkbox"> Bám lưới khi kéo</label>
            <div class="p3w-section-title" style="margin-top:14px">Audio</div>
            <label class="p3w-check"><input id="p3w-remove-vocal" type="checkbox"> Xóa giọng gốc</label>
            <div class="p3w-field"><label>Âm lượng nền</label><div class="p3w-range-row"><input id="p3w-bg-volume" type="range" min="0" max="100" value="10"><output id="p3w-bg-volume-out">10%</output></div></div>
            <div id="p3w-voice-fit" class="p3w-note">Chọn Job để xem voice-fit.</div>
          </div>
        </div>

        <div class="p3w-card p3w-timeline">
          <div class="p3w-timeline-head"><strong>Timeline kiểm tra</strong><span class="p3w-subtitle">P3 V1 · không phải NLE tự do</span></div>
          <div class="p3w-track"><span class="p3w-track-label">Video</span><div class="p3w-track-lane"><div class="p3w-track-fill"></div><div class="p3w-playhead"></div></div></div>
          <div class="p3w-track voice"><span class="p3w-track-label">Voice</span><div class="p3w-track-lane"><div id="p3w-voice-fill" class="p3w-track-fill"></div><div class="p3w-playhead"></div></div></div>
          <div class="p3w-track sub"><span class="p3w-track-label">Subtitle</span><div class="p3w-track-lane"><div id="p3w-sub-fill" class="p3w-track-fill"></div><div class="p3w-playhead"></div></div></div>
          <div class="p3w-track fx"><span class="p3w-track-label">Hiệu ứng</span><div class="p3w-track-lane"><div id="p3w-fx-fill" class="p3w-track-fill"></div><div class="p3w-playhead"></div></div></div>
        </div>
      </section>

      <aside class="p3w-inspector">
        <div class="p3w-card p3w-inspector-card">
          <div class="p3w-section-title">Trung tâm cài đặt P3</div>
          <div class="p3w-tabs">
            <button class="p3w-tab is-active" data-p3w-tab="subtitle">Phụ đề</button>
            <button class="p3w-tab" data-p3w-tab="audio">Audio</button>
            <button class="p3w-tab" data-p3w-tab="export">Xuất video</button>
          </div>

          <div class="p3w-panel is-active" data-p3w-panel="subtitle">
            <div class="p3w-section-title">Mẫu phụ đề</div>
            <div id="p3w-presets" class="p3w-presets">
              <button class="p3w-preset" data-preset="default">Default</button><button class="p3w-preset" data-preset="youtube">YouTube</button><button class="p3w-preset" data-preset="karaoke">Karaoke</button><button class="p3w-preset" data-preset="minimal">Minimal</button><button class="p3w-preset" data-preset="news">News</button><button class="p3w-preset" data-preset="review">Review</button>
            </div>

            <div class="p3w-section-title" style="margin-top:14px">Kiểu chữ</div>
            <div class="p3w-grid2">
              <div class="p3w-field"><label>Font</label><select id="p3w-font" class="p3w-select"><option>Arial</option><option>Roboto</option><option>Tahoma</option><option>Verdana</option><option>Consolas</option><option>Times New Roman</option></select></div>
              <div class="p3w-field"><label>Cỡ chữ</label><input id="p3w-font-size" class="p3w-input" type="number" min="10" max="160"></div>
            </div>
            <div class="p3w-grid2">
              <div class="p3w-field"><label>Màu chữ</label><input id="p3w-text-color" class="p3w-color" type="color"></div>
              <div class="p3w-field"><label>Màu viền</label><input id="p3w-outline-color" class="p3w-color" type="color"></div>
            </div>
            <div class="p3w-grid2">
              <label class="p3w-check"><input id="p3w-bold" type="checkbox"> Đậm</label>
              <label class="p3w-check"><input id="p3w-italic" type="checkbox"> Nghiêng</label>
            </div>
            <div class="p3w-field"><label>Độ dày viền</label><div class="p3w-range-row"><input id="p3w-outline-width" type="range" min="0" max="12" step="1"><output id="p3w-outline-width-out"></output></div></div>
            <div class="p3w-field"><label>Bóng</label><div class="p3w-range-row"><input id="p3w-shadow" type="range" min="0" max="12" step="1"><output id="p3w-shadow-out"></output></div></div>

            <div class="p3w-section-title" style="margin-top:14px">Nền phụ đề</div>
            <label class="p3w-check"><input id="p3w-bg-enabled" type="checkbox"> Bật hộp nền</label>
            <div class="p3w-grid2"><div class="p3w-field"><label>Màu nền</label><input id="p3w-bg-color" class="p3w-color" type="color"></div><div class="p3w-field"><label>Opacity</label><div class="p3w-range-row"><input id="p3w-bg-opacity" type="range" min="0" max="100"><output id="p3w-bg-opacity-out"></output></div></div></div>
            <div class="p3w-grid2"><div class="p3w-field"><label>Bo góc preview</label><input id="p3w-bg-radius" class="p3w-input" type="number" min="0" max="40"></div><div class="p3w-field"><label>Padding</label><input id="p3w-padding" class="p3w-input" type="number" min="0" max="50"></div></div>

            <div class="p3w-section-title" style="margin-top:14px">Bố cục & vị trí</div>
            <div class="p3w-field"><label>Căn chữ</label><div class="p3w-segment"><button class="p3w-btn" data-align="left">Trái</button><button class="p3w-btn" data-align="center">Giữa</button><button class="p3w-btn" data-align="right">Phải</button></div></div>
            <div class="p3w-grid2"><div class="p3w-field"><label>X (%)</label><input id="p3w-x" class="p3w-input" type="number" min="0" max="100" step="0.1"></div><div class="p3w-field"><label>Y (%)</label><input id="p3w-y" class="p3w-input" type="number" min="0" max="100" step="0.1"></div></div>
            <div class="p3w-grid2"><div class="p3w-field"><label>Max width (%)</label><input id="p3w-max-width" class="p3w-input" type="number" min="25" max="96"></div><div class="p3w-field"><label>Line height</label><input id="p3w-line-height" class="p3w-input" type="number" min="0.8" max="2" step="0.05"></div></div>
            <button id="p3w-reset-position" class="p3w-btn" type="button">Đặt lại vị trí</button>

            <div class="p3w-section-title" style="margin-top:14px">Hiệu ứng chữ</div>
            <div class="p3w-grid2"><div class="p3w-field"><label>Hiệu ứng</label><select id="p3w-effect" class="p3w-select"><option value="none">Không</option><option value="fade">Fade</option><option value="pop">Pop</option></select></div><div class="p3w-field"><label>Thời gian (ms)</label><input id="p3w-effect-ms" class="p3w-input" type="number" min="0" max="1200" step="20"></div></div>
            <div class="p3w-note">Vị trí kéo-thả được lưu theo Job và chuyển thành ASS <code>\\pos(x,y)</code> khi render. Không ghi đè artifact P1/P2.</div>
          </div>

          <div class="p3w-panel" data-p3w-panel="audio">
            <div class="p3w-section-title">Voice & nền</div>
            <div id="p3w-audio-info" class="p3w-summary"></div>
            <label class="p3w-check"><input id="p3w-audio-remove-vocal" type="checkbox"> Tách vocal gốc trước khi mix</label>
            <div class="p3w-field"><label>Âm lượng audio gốc/nền</label><div class="p3w-range-row"><input id="p3w-audio-bg-volume" type="range" min="0" max="100"><output id="p3w-audio-bg-volume-out"></output></div></div>
            <div class="p3w-note p3w-warning">P3 chỉ auto-fit voice trong khoảng an toàn hiện có. Voice quá dài sẽ bị chặn thay vì ép tốc độ cực đoan.</div>
          </div>

          <div class="p3w-panel" data-p3w-panel="export">
            <div class="p3w-section-title">Xuất video</div>
            <div id="p3w-export-summary" class="p3w-summary"></div>
            <div class="p3w-note">V1 dùng đúng renderer hiện tại: MP4/H.264. Không hiển thị codec/format giả chưa được backend hỗ trợ.</div>
          </div>

          <input id="step3-font" type="hidden"><input id="step3-size" type="hidden"><input id="step3-color" type="hidden"><input id="step3-outline-color" type="hidden">
          <div id="step3-job-list" style="display:none" aria-hidden="true"></div>
        </div>

        <div class="p3w-card p3w-summary" id="p3w-render-summary"></div>
        <div class="p3w-card p3w-render">
          <button id="p3w-render" class="p3w-btn primary" type="button">Bắt đầu Render</button>
          <div id="p3w-render-hint" class="p3w-mini">Chỉ bật khi Job có clean video từ Pipeline 2.</div>
        </div>
      </aside>
    </div>`;
}

function mountWorkspace() {
  const root = document.getElementById('step-3-content');
  if (!root || runtime.mounted) return false;
  ensureStylesheet();
  root.classList.add('p3w-mounted');
  root.innerHTML = workspaceMarkup();
  runtime.mounted = true;
  bindWorkspaceEvents();
  syncWorkspace(true);
  return true;
}

function setTab(tab) {
  document.querySelectorAll('#step-3-content .p3w-tab').forEach(button => button.classList.toggle('is-active', button.dataset.p3wTab === tab));
  document.querySelectorAll('#step-3-content .p3w-panel').forEach(panel => panel.classList.toggle('is-active', panel.dataset.p3wPanel === tab));
}

function updateConfig(job, patch, { derive = true } = {}) {
  if (!job) return;
  const config = ensureJobConfig(job);
  Object.assign(config, patch);
  syncControls(job);
  applyPreview(job);
  if (derive) refreshDerivedAss(job);
}

function applyPreset(job, presetName) {
  const preset = PRESETS[presetName] || PRESETS.default;
  updateConfig(job, { ...preset, preset: presetName });
}

function quickPosition(job, value) {
  if (value === 'top') updateConfig(job, { x: 50, y: 14 });
  else if (value === 'center') updateConfig(job, { x: 50, y: 50 });
  else if (value === 'bottom') updateConfig(job, { x: 50, y: 84 });
}

function applyPreview(job, animate = false) {
  const overlay = document.getElementById('p3w-sub-overlay');
  if (!overlay || !job) return;
  const config = ensureJobConfig(job);
  overlay.style.left = `${config.x}%`;
  overlay.style.top = `${config.y}%`;
  overlay.style.fontFamily = config.fontFamily;
  overlay.style.fontSize = `${config.fontSize}px`;
  overlay.style.fontWeight = config.bold ? '700' : '400';
  overlay.style.fontStyle = config.italic ? 'italic' : 'normal';
  overlay.style.color = config.textColor;
  overlay.style.textAlign = config.align;
  overlay.style.lineHeight = String(config.lineHeight);
  overlay.style.maxWidth = `${config.maxWidth}%`;
  overlay.style.padding = `${config.padding}px`;
  overlay.style.borderRadius = `${config.bgRadius}px`;
  overlay.style.background = config.bgEnabled ? rgba(config.bgColor, config.bgOpacity) : 'transparent';
  const outline = Math.max(0, Number(config.outlineWidth) || 0);
  const shadow = Math.max(0, Number(config.shadow) || 0);
  overlay.style.webkitTextStroke = outline ? `${outline}px ${config.outlineColor}` : '0 transparent';
  overlay.style.paintOrder = 'stroke fill';
  overlay.style.textShadow = shadow ? `0 ${Math.max(1, shadow)}px ${Math.max(1, shadow * 2)}px rgba(0,0,0,.8)` : 'none';
  overlay.style.display = config.subtitleEnabled ? '' : 'none';
  document.getElementById('p3w-safe')?.classList.toggle('is-visible', Boolean(config.safeZone));
  document.getElementById('p3w-grid')?.classList.toggle('is-visible', Boolean(config.snap));
  if (animate && config.effect !== 'none') {
    overlay.getAnimations?.().forEach(animation => animation.cancel());
    const duration = Math.max(80, Math.min(1200, Number(config.effectMs) || 180));
    if (config.effect === 'fade') overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration, easing: 'ease-out' });
    else if (config.effect === 'pop') overlay.animate([{ opacity: .25, transform: 'translate(-50%,-50%) scale(.86)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], { duration, easing: 'cubic-bezier(.2,.85,.3,1.15)' });
  }
}

function currentCue(job, time) {
  const cues = cuesFor(job);
  if (!cues.length) return { index: -1, text: job?.aiContent || job?.voiceSubContent || 'Kéo phụ đề để đặt vị trí' };
  const foundIndex = cues.findIndex(cue => time >= cue.start && time <= cue.end);
  if (foundIndex >= 0) return { index: foundIndex, text: cues[foundIndex].text };
  const nearest = cues.findIndex(cue => cue.start > time);
  const index = nearest >= 0 ? Math.max(0, nearest - 1) : cues.length - 1;
  return { index, text: cues[index]?.text || '' };
}

function updatePlaybackUi() {
  const video = document.getElementById('p3w-video');
  const job = selectedJob();
  if (!video || !job) return;
  const duration = Number(video.duration) || Number(runtime.videoInfoByJob.get(job.id)?.duration) || 0;
  const current = Number(video.currentTime) || 0;
  const ratio = duration > 0 ? current / duration : 0;
  const seek = document.getElementById('p3w-seek');
  if (seek && !seek.matches(':active')) seek.value = String(Math.round(ratio * 1000));
  const time = document.getElementById('p3w-time');
  if (time) time.textContent = `${fmtTime(current)} / ${fmtTime(duration)}`;
  document.querySelectorAll('#step-3-content .p3w-playhead').forEach(playhead => playhead.style.left = `${Math.max(0, Math.min(100, ratio * 100))}%`);
  const cue = currentCue(job, current);
  const overlay = document.getElementById('p3w-sub-overlay');
  if (overlay && cue.text && overlay.textContent !== cue.text) {
    overlay.textContent = cue.text;
    const changed = runtime.lastCueIndex !== cue.index;
    runtime.lastCueIndex = cue.index;
    applyPreview(job, changed);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function snapCoordinate(value, axis, enabled) {
  if (!enabled) return value;
  const anchors = axis === 'x' ? [8, 25, 50, 75, 92] : [10, 18, 50, 82, 90];
  const nearest = anchors.reduce((best, candidate) => Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best, anchors[0]);
  return Math.abs(nearest - value) <= 2.2 ? nearest : value;
}

function scheduleDrag(job, x, y) {
  runtime.pendingDrag = { job, x, y };
  if (runtime.dragFrame) return;
  runtime.dragFrame = requestAnimationFrame(() => {
    runtime.dragFrame = 0;
    const pending = runtime.pendingDrag;
    runtime.pendingDrag = null;
    if (!pending?.job) return;
    const config = ensureJobConfig(pending.job);
    config.x = Math.round(pending.x * 10) / 10;
    config.y = Math.round(pending.y * 10) / 10;
    const xInput = document.getElementById('p3w-x');
    const yInput = document.getElementById('p3w-y');
    if (xInput) xInput.value = String(config.x);
    if (yInput) yInput.value = String(config.y);
    applyPreview(pending.job);
  });
}

function bindDrag() {
  const wrap = document.getElementById('p3w-video-wrap');
  const overlay = document.getElementById('p3w-sub-overlay');
  if (!wrap || !overlay) return;
  let pointerId = null;
  overlay.addEventListener('pointerdown', event => {
    const job = selectedJob();
    if (!job || !ensureJobConfig(job).subtitleEnabled) return;
    pointerId = event.pointerId;
    overlay.setPointerCapture?.(pointerId);
    overlay.classList.add('is-dragging');
    event.preventDefault();
  });
  overlay.addEventListener('pointermove', event => {
    if (pointerId !== event.pointerId) return;
    const job = selectedJob();
    if (!job) return;
    const rect = wrap.getBoundingClientRect();
    const config = ensureJobConfig(job);
    let x = clamp(((event.clientX - rect.left) / rect.width) * 100, P3W_SAFE_MIN_X, P3W_SAFE_MAX_X);
    let y = clamp(((event.clientY - rect.top) / rect.height) * 100, P3W_SAFE_MIN_Y, P3W_SAFE_MAX_Y);
    x = snapCoordinate(x, 'x', config.snap);
    y = snapCoordinate(y, 'y', config.snap);
    scheduleDrag(job, x, y);
    event.preventDefault();
  });
  const finish = event => {
    if (pointerId !== event.pointerId) return;
    pointerId = null;
    overlay.classList.remove('is-dragging');
    refreshDerivedAss(selectedJob());
  };
  overlay.addEventListener('pointerup', finish);
  overlay.addEventListener('pointercancel', finish);
}

function bindWorkspaceEvents() {
  document.querySelectorAll('#step-3-content .p3w-tab').forEach(button => button.addEventListener('click', () => setTab(button.dataset.p3wTab)));
  document.getElementById('p3w-job-select')?.addEventListener('change', event => {
    runtime.activeJobId = event.target.value;
    runtime.lastCueIndex = -1;
    const state = appState();
    if (state) state.activeJobId = runtime.activeJobId;
    syncWorkspace(true);
  });
  document.getElementById('p3w-play')?.addEventListener('click', async () => {
    const video = document.getElementById('p3w-video');
    if (!video?.src) return;
    if (video.paused) await video.play().catch(() => {}); else video.pause();
  });
  document.getElementById('p3w-seek')?.addEventListener('input', event => {
    const video = document.getElementById('p3w-video');
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = video.duration * Number(event.target.value) / 1000;
  });
  const video = document.getElementById('p3w-video');
  video?.addEventListener('timeupdate', updatePlaybackUi);
  video?.addEventListener('loadedmetadata', () => { updatePlaybackUi(); syncWorkspace(false); });
  video?.addEventListener('play', () => { const btn = document.getElementById('p3w-play'); if (btn) btn.textContent = '⏸'; });
  video?.addEventListener('pause', () => { const btn = document.getElementById('p3w-play'); if (btn) btn.textContent = '▶'; });

  document.getElementById('p3w-quick-preset')?.addEventListener('change', event => applyPreset(selectedJob(), event.target.value));
  document.getElementById('p3w-quick-position')?.addEventListener('change', event => quickPosition(selectedJob(), event.target.value));
  document.getElementById('p3w-sub-enabled')?.addEventListener('change', event => updateConfig(selectedJob(), { subtitleEnabled: event.target.checked }));
  document.getElementById('p3w-safe-toggle')?.addEventListener('change', event => updateConfig(selectedJob(), { safeZone: event.target.checked }, { derive: false }));
  document.getElementById('p3w-snap-toggle')?.addEventListener('change', event => updateConfig(selectedJob(), { snap: event.target.checked }, { derive: false }));
  document.getElementById('p3w-remove-vocal')?.addEventListener('change', event => updateConfig(selectedJob(), { removeVocal: event.target.checked }, { derive: false }));
  document.getElementById('p3w-audio-remove-vocal')?.addEventListener('change', event => updateConfig(selectedJob(), { removeVocal: event.target.checked }, { derive: false }));
  ['p3w-bg-volume', 'p3w-audio-bg-volume'].forEach(id => document.getElementById(id)?.addEventListener('input', event => updateConfig(selectedJob(), { bgVolume: Number(event.target.value) }, { derive: false })));
  document.querySelectorAll('#p3w-presets [data-preset]').forEach(button => button.addEventListener('click', () => applyPreset(selectedJob(), button.dataset.preset)));
  document.querySelectorAll('#step-3-content [data-align]').forEach(button => button.addEventListener('click', () => updateConfig(selectedJob(), { align: button.dataset.align })));

  const bindings = [
    ['p3w-font', 'fontFamily', 'change', value => value], ['p3w-font-size', 'fontSize', 'input', Number],
    ['p3w-text-color', 'textColor', 'input', value => value], ['p3w-outline-color', 'outlineColor', 'input', value => value],
    ['p3w-bold', 'bold', 'change', (_, element) => element.checked], ['p3w-italic', 'italic', 'change', (_, element) => element.checked],
    ['p3w-outline-width', 'outlineWidth', 'input', Number], ['p3w-shadow', 'shadow', 'input', Number],
    ['p3w-bg-enabled', 'bgEnabled', 'change', (_, element) => element.checked], ['p3w-bg-color', 'bgColor', 'input', value => value],
    ['p3w-bg-opacity', 'bgOpacity', 'input', Number], ['p3w-bg-radius', 'bgRadius', 'input', Number], ['p3w-padding', 'padding', 'input', Number],
    ['p3w-x', 'x', 'input', value => clamp(Number(value), 0, 100)], ['p3w-y', 'y', 'input', value => clamp(Number(value), 0, 100)],
    ['p3w-max-width', 'maxWidth', 'input', Number], ['p3w-line-height', 'lineHeight', 'input', Number],
    ['p3w-effect', 'effect', 'change', value => value], ['p3w-effect-ms', 'effectMs', 'input', Number],
  ];
  bindings.forEach(([id, key, eventName, parser]) => {
    const element = document.getElementById(id);
    element?.addEventListener(eventName, () => updateConfig(selectedJob(), { [key]: parser(element.value, element) }));
  });
  document.getElementById('p3w-reset-position')?.addEventListener('click', () => updateConfig(selectedJob(), { x: 50, y: 84 }));
  document.getElementById('p3w-render')?.addEventListener('click', renderSelectedJob);
  bindDrag();
}

function syncControls(job) {
  if (!job) return;
  const config = ensureJobConfig(job);
  const values = {
    'p3w-quick-preset': config.preset, 'p3w-font': config.fontFamily, 'p3w-font-size': config.fontSize,
    'p3w-text-color': config.textColor, 'p3w-outline-color': config.outlineColor, 'p3w-outline-width': config.outlineWidth,
    'p3w-shadow': config.shadow, 'p3w-bg-color': config.bgColor, 'p3w-bg-opacity': config.bgOpacity,
    'p3w-bg-radius': config.bgRadius, 'p3w-padding': config.padding, 'p3w-x': config.x, 'p3w-y': config.y,
    'p3w-max-width': config.maxWidth, 'p3w-line-height': config.lineHeight, 'p3w-effect': config.effect,
    'p3w-effect-ms': config.effectMs, 'p3w-bg-volume': config.bgVolume, 'p3w-audio-bg-volume': config.bgVolume,
    'step3-font': config.fontFamily, 'step3-size': config.fontSize, 'step3-color': config.textColor, 'step3-outline-color': config.outlineColor,
  };
  Object.entries(values).forEach(([id, value]) => { const element = document.getElementById(id); if (element && document.activeElement !== element) element.value = String(value); });
  const checks = {
    'p3w-sub-enabled': config.subtitleEnabled, 'p3w-safe-toggle': config.safeZone, 'p3w-snap-toggle': config.snap,
    'p3w-remove-vocal': config.removeVocal, 'p3w-audio-remove-vocal': config.removeVocal,
    'p3w-bold': config.bold, 'p3w-italic': config.italic, 'p3w-bg-enabled': config.bgEnabled,
  };
  Object.entries(checks).forEach(([id, value]) => { const element = document.getElementById(id); if (element) element.checked = Boolean(value); });
  const outputs = {
    'p3w-outline-width-out': `${config.outlineWidth}px`, 'p3w-shadow-out': `${config.shadow}px`,
    'p3w-bg-opacity-out': `${config.bgOpacity}%`, 'p3w-bg-volume-out': `${config.bgVolume}%`, 'p3w-audio-bg-volume-out': `${config.bgVolume}%`,
  };
  Object.entries(outputs).forEach(([id, value]) => { const element = document.getElementById(id); if (element) element.textContent = value; });
  document.querySelectorAll('#p3w-presets [data-preset]').forEach(button => button.classList.toggle('is-active', button.dataset.preset === config.preset));
  document.querySelectorAll('#step-3-content [data-align]').forEach(button => button.classList.toggle('is-active', button.dataset.align === config.align));
  const quick = document.getElementById('p3w-quick-position');
  if (quick && document.activeElement !== quick) {
    if (Math.abs(config.x - 50) < .2 && Math.abs(config.y - 14) < .5) quick.value = 'top';
    else if (Math.abs(config.x - 50) < .2 && Math.abs(config.y - 50) < .5) quick.value = 'center';
    else if (Math.abs(config.x - 50) < .2 && Math.abs(config.y - 84) < .5) quick.value = 'bottom';
    else quick.value = 'custom';
  }
}

function voiceFitSummary(job, durationSec) {
  const voiceMs = Number(job?.p3VoiceDurMs || job?.ttsAudioDurMs) || 0;
  const videoMs = Math.max(0, Number(durationSec) || 0) * 1000;
  if (!(voiceMs > 0) || !(videoMs > 0)) return { text: 'Chưa đủ telemetry duration để đánh giá voice-fit.', kind: 'info', ratio: 0 };
  const ratio = voiceMs / videoMs;
  if (ratio < .90) return { text: `Voice ${fmtTime(voiceMs / 1000)} / Video ${fmtTime(videoMs / 1000)} · ${(ratio * 100).toFixed(1)}% · giữ tốc độ tự nhiên.`, kind: 'info', ratio };
  if (ratio > 1.15) return { text: `Voice ${(ratio * 100).toFixed(1)}% video · BLOCKED: cần sửa narration/edit plan.`, kind: 'error', ratio };
  if (Math.abs(ratio - 1) <= .005) return { text: `Voice gần khớp video · ${(ratio * 100).toFixed(1)}% · không cần retime.`, kind: 'ready', ratio };
  return { text: `Voice ${(ratio * 100).toFixed(1)}% video · P3 có thể tạo derived voice tempo ${ratio.toFixed(3)}x.`, kind: 'ready', ratio };
}

function syncSummary(job, info) {
  const duration = Number(info?.duration) || 0;
  const fit = voiceFitSummary(job, duration);
  const voiceFit = document.getElementById('p3w-voice-fit');
  if (voiceFit) {
    voiceFit.textContent = fit.text;
    voiceFit.classList.toggle('p3w-warning', fit.kind === 'error');
  }
  const audioInfo = document.getElementById('p3w-audio-info');
  if (audioInfo) audioInfo.innerHTML = `
    <div class="p3w-summary-row"><span>Voice P1/P3</span><strong>${fmtTime((Number(job?.p3VoiceDurMs || job?.ttsAudioDurMs) || 0) / 1000)}</strong></div>
    <div class="p3w-summary-row"><span>Final video</span><strong>${fmtTime(duration)}</strong></div>
    <div class="p3w-summary-row"><span>Voice-fit</span><strong>${fit.ratio ? `${(fit.ratio * 100).toFixed(1)}%` : '—'}</strong></div>`;
  const exportSummary = document.getElementById('p3w-export-summary');
  if (exportSummary) exportSummary.innerHTML = `
    <div class="p3w-summary-row"><span>Container</span><strong>MP4</strong></div>
    <div class="p3w-summary-row"><span>Video</span><strong>${info?.width || '—'}×${info?.height || '—'} · H.264 path</strong></div>
    <div class="p3w-summary-row"><span>Duration</span><strong>${fmtTime(duration)}</strong></div>
    <div class="p3w-summary-row"><span>Subtitle</span><strong>${ensureJobConfig(job).subtitleEnabled ? 'Burn ASS' : 'Tắt'}</strong></div>`;
  const renderSummary = document.getElementById('p3w-render-summary');
  if (renderSummary) renderSummary.innerHTML = `
    <div class="p3w-section-title">Tóm tắt render</div>
    <div class="p3w-summary-row"><span>Job</span><strong>${escapeHtml(job.fileName || job.id)}</strong></div>
    <div class="p3w-summary-row"><span>Clean video</span><strong>${job.outputPath ? 'Sẵn sàng' : 'Thiếu'}</strong></div>
    <div class="p3w-summary-row"><span>Voice</span><strong>${job.ttsAudioPath ? 'Sẵn sàng' : 'Không có'}</strong></div>
    <div class="p3w-summary-row"><span>Phụ đề</span><strong>${ensureJobConfig(job).subtitleEnabled ? `${cuesFor(job).length} cue` : 'Tắt'}</strong></div>`;
  const status = document.getElementById('p3w-job-status');
  if (status) {
    status.className = `p3w-status ${job.p3Status === 'error' ? 'error' : job.outputPath ? 'ready' : 'blocked'}`;
    status.textContent = runtime.renderingJobId === job.id ? 'Đang render' : job.finalOutputPath ? 'Đã render' : job.outputPath ? 'Sẵn sàng' : 'Thiếu clean video';
  }
}

function syncTimeline(job, info) {
  const duration = Math.max(.001, Number(info?.duration) || 0.001);
  const voiceDuration = (Number(job?.p3VoiceDurMs || job?.ttsAudioDurMs) || 0) / 1000;
  const voiceFill = document.getElementById('p3w-voice-fill');
  if (voiceFill) voiceFill.style.right = `${Math.max(0, 100 - Math.min(100, voiceDuration / duration * 100))}%`;
  const subFill = document.getElementById('p3w-sub-fill');
  if (subFill) {
    const cues = cuesFor(job);
    const end = cues.length ? cues.at(-1).end : 0;
    subFill.style.right = `${Math.max(0, 100 - Math.min(100, end / duration * 100))}%`;
  }
  const fxFill = document.getElementById('p3w-fx-fill');
  if (fxFill) fxFill.style.opacity = ensureJobConfig(job).effect === 'none' ? '.3' : '1';
}

async function syncWorkspace(forceVideo = false) {
  if (!runtime.mounted && !mountWorkspace()) return;
  const jobs = readyJobs();
  const select = document.getElementById('p3w-job-select');
  if (!select) return;
  const previous = runtime.activeJobId;
  if (!jobs.some(job => job.id === runtime.activeJobId)) runtime.activeJobId = jobs[0]?.id || null;
  const signature = jobs.map(job => `${job.id}:${job.p3Status}:${job.finalOutputPath || ''}`).join('|');
  if (select.dataset.signature !== signature) {
    select.dataset.signature = signature;
    select.innerHTML = jobs.length
      ? jobs.map(job => `<option value="${escapeHtml(job.id)}">${escapeHtml(job.fileName || job.id)}</option>`).join('')
      : '<option value="">Chưa có Job sẵn sàng</option>';
  }
  select.disabled = jobs.length === 0;
  if (runtime.activeJobId) select.value = runtime.activeJobId;
  const job = selectedJob();
  const root = document.getElementById('step-3-content');
  root?.classList.toggle('p3w-no-job', !job);
  const renderButton = document.getElementById('p3w-render');
  if (!job) {
    if (renderButton) renderButton.disabled = true;
    const status = document.getElementById('p3w-job-status');
    if (status) { status.className = 'p3w-status blocked'; status.textContent = 'Chưa có Job P3'; }
    return;
  }

  const config = ensureJobConfig(job);
  const info = await ensureVideoInfo(job);
  const video = document.getElementById('p3w-video');
  const sourcePath = job.outputPath || job.filePath;
  const sourceUrl = fileUrl(sourcePath);
  if (video && sourceUrl && (forceVideo || previous !== job.id || video.dataset.jobId !== String(job.id))) {
    video.pause();
    video.dataset.jobId = String(job.id);
    video.src = sourceUrl;
    video.load();
    runtime.lastCueIndex = -1;
  }
  const meta = document.getElementById('p3w-preview-meta');
  if (meta) meta.textContent = info?.width ? `${info.width}×${info.height} · ${fmtTime(info.duration)}` : 'Đang đọc metadata…';
  syncControls(job);
  applyPreview(job);
  syncSummary(job, info || job.p3VideoInfo || {});
  syncTimeline(job, info || job.p3VideoInfo || {});
  if (!job.p3DerivedAss) refreshDerivedAss(job);
  if (renderButton) {
    renderButton.disabled = !job.outputPath || runtime.renderingJobId === job.id;
    renderButton.textContent = runtime.renderingJobId === job.id ? 'Đang Render…' : job.finalOutputPath ? 'Render lại' : 'Bắt đầu Render';
  }
  const hint = document.getElementById('p3w-render-hint');
  if (hint) hint.textContent = job.outputPath ? (job.finalOutputPath ? `Output: ${job.finalOutputPath}` : 'Render dùng clean video + P1 voice/subtitle hiện tại.') : 'Thiếu clean video từ Pipeline 2.';
  if (config.subtitleEnabled && !cuesFor(job).length && !job.p3OriginalKaraokeAss) {
    if (hint) hint.textContent = 'Đã bật phụ đề nhưng Job chưa có timed SRT/karaoke ASS.';
  }
}

async function renderSelectedJob() {
  const job = selectedJob();
  if (!job || !job.outputPath || runtime.renderingJobId || typeof window.finalizeVideo !== 'function') return;
  const config = ensureJobConfig(job);
  runtime.renderingJobId = job.id;
  job.p3Status = 'rendering';
  await refreshDerivedAss(job);
  job.voiceSub = Boolean(config.subtitleEnabled && (job.p3DerivedAss || job.ttsTimedSrt || job.p3OriginalKaraokeAss));
  localStorage.setItem('tts_remove_vocal', config.removeVocal ? 'true' : 'false');
  localStorage.setItem('tts_bg_volume', String(Math.round(clamp(config.bgVolume, 0, 100))));
  syncWorkspace(false);
  window.addLog?.(`[P3] Bắt đầu render ${job.fileName}; subtitle=${job.voiceSub ? 'on' : 'off'}; position=${config.x.toFixed(1)}%,${config.y.toFixed(1)}%.`, 'info');
  try {
    const ok = await window.finalizeVideo(job);
    job.p3Status = ok ? 'finished' : 'ready';
    if (!ok) window.showToast?.('Pipeline 3 chưa hoàn tất. Xem log để biết chi tiết.', 'error', 5000);
    else window.showToast?.('Pipeline 3 render hoàn tất.', 'success', 5000);
  } catch (error) {
    job.p3Status = 'ready';
    window.addLog?.(`[P3] Render lỗi: ${error.message}`, 'error');
    window.showToast?.(`Render lỗi: ${error.message}`, 'error', 5000);
  } finally {
    runtime.renderingJobId = null;
    syncWorkspace(true);
  }
}

function patchRenderJobList() {
  if (runtime.renderPatched || typeof window.renderJobList !== 'function') return;
  const original = window.renderJobList;
  if (original.__p3WorkspaceWrapped) { runtime.renderPatched = true; return; }
  const wrapped = function (...args) {
    const result = original.apply(this, args);
    queueMicrotask(() => syncWorkspace(false));
    return result;
  };
  wrapped.__p3WorkspaceWrapped = true;
  window.renderJobList = wrapped;
  runtime.renderPatched = true;
}

function installPipeline3Workspace() {
  ensureStylesheet();
  mountWorkspace();
  patchRenderJobList();
  syncWorkspace(false);
}

installPipeline3Workspace();
setInterval(() => {
  patchRenderJobList();
  syncWorkspace(false);
}, P3W_SYNC_MS);

export { installPipeline3Workspace, syncWorkspace, buildDerivedAss };
