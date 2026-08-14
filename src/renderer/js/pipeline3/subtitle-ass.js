function parseSrtTime(value) {
  const match = String(value || '').trim().match(/^(\d+):(\d+):(\d+)[,.](\d+)$/);
  if (!match) return null;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]) + Number(`0.${match[4]}`);
}

export function parseTimedSrt(source) {
  const text = String(source || '').replace(/\r/g, '').trim();
  if (!text) return [];
  return text.split(/\n{2,}/).map((block, index) => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    const timingIndex = lines.findIndex(line => line.includes('-->'));
    if (timingIndex < 0) return null;
    const [startRaw, endRaw] = lines[timingIndex].split('-->').map(value => value.trim().split(/\s+/)[0]);
    const start = parseSrtTime(startRaw);
    const end = parseSrtTime(endRaw);
    const cueText = lines.slice(timingIndex + 1).join('\n').trim();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || !cueText) return null;
    return { index, start, end, text: cueText };
  }).filter(Boolean);
}

export function cuesForJob(job) {
  return parseTimedSrt(job?.p3AssTimedSrt || job?.p3BaseTimedSrt || job?.p3TimedSrt || job?.ttsTimedSrt || job?.voiceSubContent || job?.srtContent || '');
}

function srtTime(seconds) {
  const totalMs = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
  const hours = Math.floor(totalMs / 3600000);
  const minutes = Math.floor((totalMs % 3600000) / 60000);
  const secs = Math.floor((totalMs % 60000) / 1000);
  const ms = totalMs % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function serializeTimedSrt(cues) {
  return (Array.isArray(cues) ? cues : []).map((cue, index) => [
    String(index + 1),
    `${srtTime(cue.start)} --> ${srtTime(cue.end)}`,
    String(cue.text || '').trim(),
  ].join('\n')).join('\n\n');
}

function assTime(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const centis = Math.floor((safe - Math.floor(safe)) * 100);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

function wrapWords(line, maxChars) {
  const words = String(line || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  const rows = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxChars) {
      rows.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) rows.push(current);
  return rows.join('\\N');
}

function cleanAssText(value, config = {}, width = 1920) {
  const clean = String(value || '').replace(/[{}]/g, '').replace(/\\/g, '／');
  const maxWidthPct = Math.max(20, Math.min(100, Number(config.maxWidth) || 80));
  const fontSize = Math.max(10, Math.min(160, Number(config.fontSize) || 46));
  const logicalWidth = Math.max(320, Number(width) || 1920) * maxWidthPct / 100;
  const maxChars = Math.max(8, Math.min(90, Math.floor(logicalWidth / Math.max(6, fontSize * 0.56))));
  return clean.split(/\r?\n/).map(line => wrapWords(line, maxChars)).join('\\N');
}

function assColor(hex, opacityPercent = 100) {
  const clean = String(hex || '#ffffff').replace('#', '').padEnd(6, '0').slice(0, 6);
  const r = clean.slice(0, 2), g = clean.slice(2, 4), b = clean.slice(4, 6);
  const alpha = Math.round((1 - Math.max(0, Math.min(100, Number(opacityPercent) || 0)) / 100) * 255).toString(16).padStart(2, '0');
  return `&H${alpha}${b}${g}${r}`.toUpperCase();
}

function alignCode(config) {
  if (config.align === 'left') return 4;
  if (config.align === 'right') return 6;
  return 5;
}

function positionEffectTags(config, x, y) {
  const ms = Math.max(80, Math.min(1200, Number(config?.effectMs) || 180));
  const effect = String(config?.effect || 'none');
  const movePx = Math.max(28, Math.round((Number(config?.fontSize) || 46) * 0.9));
  const pos = `\\pos(${x},${y})`;
  if (effect === 'fade') return `${pos}\\fad(${ms},${ms})`;
  if (effect === 'pop') return `${pos}\\fscx82\\fscy82\\t(0,${ms},\\fscx100\\fscy100)`;
  if (effect === 'slide_up') return `\\move(${x},${y + movePx},${x},${y},0,${ms})`;
  if (effect === 'slide_down') return `\\move(${x},${y - movePx},${x},${y},0,${ms})`;
  if (effect === 'slide_left') return `\\move(${x + movePx},${y},${x},${y},0,${ms})`;
  if (effect === 'slide_right') return `\\move(${x - movePx},${y},${x},${y},0,${ms})`;
  if (effect === 'zoom_in') return `${pos}\\fscx70\\fscy70\\t(0,${ms},\\fscx100\\fscy100)`;
  if (effect === 'zoom_out') return `${pos}\\fscx128\\fscy128\\t(0,${ms},\\fscx100\\fscy100)`;
  if (effect === 'pulse') {
    const half = Math.max(40, Math.round(ms / 2));
    return `${pos}\\fscx100\\fscy100\\t(0,${half},\\fscx112\\fscy112)\\t(${half},${ms},\\fscx100\\fscy100)`;
  }
  if (effect === 'blur_in') return `${pos}\\blur4\\t(0,${ms},\\blur0)`;
  if (effect === 'fade_up') return `\\move(${x},${y + Math.round(movePx * 0.75)},${x},${y},0,${ms})\\fad(${ms},${Math.max(80, Math.round(ms * 0.55))})`;
  return pos;
}

function safeStyle(config = {}) {
  return {
    fontFamily: String(config.fontFamily || 'Arial').replace(/[,\r\n]/g, ' ').trim() || 'Arial',
    fontSize: Math.max(10, Math.min(160, Number(config.fontSize) || 46)),
    textColor: assColor(config.textColor, 100),
    outlineColor: assColor(config.outlineColor, 100),
    bgColor: assColor(config.bgColor, config.bgEnabled ? config.bgOpacity : 0),
    bold: config.bold ? -1 : 0,
    italic: config.italic ? -1 : 0,
    borderStyle: config.bgEnabled ? 3 : 1,
    outlineWidth: Math.max(0, Math.min(12, Number(config.outlineWidth) || 0)),
    shadow: Math.max(0, Math.min(12, Number(config.shadow) || 0)),
    margin: Math.max(0, Math.round(Number(config.padding) || 0)),
  };
}

function coverGeometry(config, width, height) {
  const w = Math.max(320, Math.round(Number(width) || 1920));
  const h = Math.max(240, Math.round(Number(height) || 1080));
  const x = Math.round(w * Math.max(0, Math.min(100, Number(config?.x) || 50)) / 100);
  const y = Math.round(h * Math.max(0, Math.min(100, Number(config?.y) || 82)) / 100);
  const coverWidth = Math.max(40, Math.round(w * Math.max(10, Math.min(100, Number(config?.coverWidth) || 92)) / 100));
  const coverHeight = Math.max(20, Math.min(h, Math.round(Number(config?.coverHeightPx) || 112)));
  return { x, y, coverWidth, coverHeight };
}

function coverStyle(config) {
  return `Style: Cover,Arial,10,${assColor(config?.coverColor || '#0a0a0a', config?.coverOpacity ?? 76)},&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,5,0,0,0,1`;
}

function coverDialogue(cue, config, width, height) {
  const { x, y, coverWidth, coverHeight } = coverGeometry(config, width, height);
  const left = -Math.round(coverWidth / 2), right = Math.round(coverWidth / 2);
  const top = -Math.round(coverHeight / 2), bottom = Math.round(coverHeight / 2);
  const drawing = `m ${left} ${top} l ${right} ${top} l ${right} ${bottom} l ${left} ${bottom} l ${left} ${top}`;
  return `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Cover,,0,0,0,,{\\an5\\pos(${x},${y})\\p1}${drawing}{\\p0}`;
}

function coverEvents(job, config, width, height) {
  if (!config?.coverEnabled) return [];
  return cuesForJob(job).map(cue => coverDialogue(cue, config, width, height));
}

export function buildP3Ass(job, config, width, height) {
  const w = Math.max(320, Math.round(Number(width) || 1920));
  const h = Math.max(240, Math.round(Number(height) || 1080));
  const x = Math.round(w * Math.max(0, Math.min(100, Number(config?.x) || 50)) / 100);
  const y = Math.round(h * Math.max(0, Math.min(100, Number(config?.y) || 82)) / 100);
  const style = safeStyle(config), alignment = alignCode(config || {}), events = cuesForJob(job);
  const header = [
    '[Script Info]', 'ScriptType: v4.00+', 'WrapStyle: 2', `PlayResX: ${w}`, `PlayResY: ${h}`, 'ScaledBorderAndShadow: yes', '',
    '[V4+ Styles]',
    'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
    `Style: P3,${style.fontFamily},${style.fontSize},${style.textColor},${style.textColor},${style.outlineColor},${style.bgColor},${style.bold},${style.italic},0,0,100,100,0,0,${style.borderStyle},${style.outlineWidth},${style.shadow},${alignment},${style.margin},${style.margin},${style.margin},1`,
    coverStyle(config), '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
  const prefix = `{\\an${alignment}${positionEffectTags(config || {}, x, y)}}`;
  const bandEvents = coverEvents(job, config, w, h);
  const textEvents = events.map(cue => `Dialogue: 1,${assTime(cue.start)},${assTime(cue.end)},P3,,0,0,0,,${prefix}${cleanAssText(cue.text, config, w)}`);
  return [...header, ...bandEvents, ...textEvents].join('\n');
}

function injectCoverIntoAss(sourceAss, job, config, width, height) {
  if (!config?.coverEnabled) return sourceAss;
  let ass = String(sourceAss || '');
  if (!ass.trim()) return ass;
  if (!/^Style:\s*Cover,/im.test(ass)) ass = ass.replace(/\n\[Events\]/i, `\n${coverStyle(config)}\n\n[Events]`);
  ass = ass.replace(/^Dialogue:\s*0,/gim, 'Dialogue: 1,');
  const bands = coverEvents(job, config, width, height);
  const formatLine = /^Format:\s*Layer,\s*Start,\s*End,\s*Style,.*$/im;
  if (bands.length && formatLine.test(ass)) ass = ass.replace(formatLine, match => `${match}\n${bands.join('\n')}`);
  return ass;
}

export function decorateKaraokeAss(sourceAss, job, config, width, height) {
  let ass = String(sourceAss || '');
  if (!ass.trim()) return '';
  const w = Math.max(320, Math.round(Number(width) || 1920));
  const h = Math.max(240, Math.round(Number(height) || 1080));
  const x = Math.round(w * Math.max(0, Math.min(100, Number(config?.x) || 50)) / 100);
  const y = Math.round(h * Math.max(0, Math.min(100, Number(config?.y) || 82)) / 100);
  const alignment = alignCode(config || {}), style = safeStyle(config);
  ass = ass.replace(/PlayResX:\s*\d+/i, `PlayResX: ${w}`).replace(/PlayResY:\s*\d+/i, `PlayResY: ${h}`);
  const replacement = `Style: Karaoke,${style.fontFamily},${style.fontSize},${style.textColor},${style.textColor},${style.outlineColor},${style.bgColor},${style.bold},${style.italic},0,0,100,100,0,0,${style.borderStyle},${style.outlineWidth},${style.shadow},${alignment},${style.margin},${style.margin},${style.margin},1`;
  if (/^Style:\s*Karaoke,.*$/im.test(ass)) ass = ass.replace(/^Style:\s*Karaoke,.*$/im, replacement);
  const prefix = `{\\an${alignment}${positionEffectTags(config || {}, x, y)}}`;
  ass = ass.replace(/^(Dialogue:\s*[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,)(.*)$/gim, (full, head, text) => `${head}${prefix}${text}`);
  return injectCoverIntoAss(ass, job, config, w, h);
}

export function updateJobDerivedAss(job, config, width, height) {
  if (!job) return '';
  if (job.karaokeAss && !job.p3OriginalKaraokeAss && !job.p3DerivedAss) job.p3OriginalKaraokeAss = job.karaokeAss;
  const useOriginal = Boolean(config?.preserveKaraoke && job.p3OriginalKaraokeAss && !job.p3CueEdited && !job.p3AssTimedSrt);
  const ass = useOriginal
    ? decorateKaraokeAss(job.p3OriginalKaraokeAss, job, config, width, height)
    : buildP3Ass(job, config, width, height);
  job.p3DerivedAss = ass;
  job.karaokeAss = ass || job.p3OriginalKaraokeAss || null;
  return ass;
}
