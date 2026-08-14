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
  return parseTimedSrt(job?.p3TimedSrt || job?.ttsTimedSrt || job?.voiceSubContent || job?.srtContent || '');
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

function cleanAssText(value) {
  return String(value || '')
    .replace(/[{}]/g, '')
    .replace(/\\/g, '／')
    .replace(/\r?\n/g, '\\N');
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

function alignCode(config) {
  if (config.align === 'left') return 4;
  if (config.align === 'right') return 6;
  return 5;
}

function effectTags(config) {
  const ms = Math.max(0, Math.min(1200, Number(config.effectMs) || 0));
  if (config.effect === 'fade') return `\\fad(${ms},${ms})`;
  if (config.effect === 'pop') return `\\fscx86\\fscy86\\t(0,${ms},\\fscx100\\fscy100)`;
  return '';
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
  const left = -Math.round(coverWidth / 2);
  const right = Math.round(coverWidth / 2);
  const top = -Math.round(coverHeight / 2);
  const bottom = Math.round(coverHeight / 2);
  const drawing = `m ${left} ${top} l ${right} ${top} l ${right} ${bottom} l ${left} ${bottom}`;
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
  const style = safeStyle(config);
  const alignment = alignCode(config || {});
  const events = cuesForJob(job);
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
    `Style: P3,${style.fontFamily},${style.fontSize},${style.textColor},${style.textColor},${style.outlineColor},${style.bgColor},${style.bold},${style.italic},0,0,100,100,0,0,${style.borderStyle},${style.outlineWidth},${style.shadow},${alignment},${style.margin},${style.margin},${style.margin},1`,
    coverStyle(config),
    '',
    '[Events]',
    'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
  ];
  const prefix = `{\\an${alignment}\\pos(${x},${y})${effectTags(config || {})}}`;
  const bandEvents = coverEvents(job, config, w, h);
  const textEvents = events.map(cue => `Dialogue: 1,${assTime(cue.start)},${assTime(cue.end)},P3,,0,0,0,,${prefix}${cleanAssText(cue.text)}`);
  return [...header, ...bandEvents, ...textEvents].join('\n');
}

function injectCoverIntoAss(sourceAss, job, config, width, height) {
  if (!config?.coverEnabled) return sourceAss;
  let ass = String(sourceAss || '');
  if (!ass.trim()) return ass;
  if (!/^Style:\s*Cover,/im.test(ass)) {
    ass = ass.replace(/\n\[Events\]/i, `\n${coverStyle(config)}\n\n[Events]`);
  }
  ass = ass.replace(/^Dialogue:\s*0,/gim, 'Dialogue: 1,');
  const bands = coverEvents(job, config, width, height);
  const formatLine = /^Format:\s*Layer,\s*Start,\s*End,\s*Style,.*$/im;
  if (bands.length && formatLine.test(ass)) {
    ass = ass.replace(formatLine, match => `${match}\n${bands.join('\n')}`);
  }
  return ass;
}

export function decorateKaraokeAss(sourceAss, job, config, width, height) {
  let ass = String(sourceAss || '');
  if (!ass.trim()) return '';
  const w = Math.max(320, Math.round(Number(width) || 1920));
  const h = Math.max(240, Math.round(Number(height) || 1080));
  const x = Math.round(w * Math.max(0, Math.min(100, Number(config?.x) || 50)) / 100);
  const y = Math.round(h * Math.max(0, Math.min(100, Number(config?.y) || 82)) / 100);
  const alignment = alignCode(config || {});
  const style = safeStyle(config);
  ass = ass.replace(/PlayResX:\s*\d+/i, `PlayResX: ${w}`).replace(/PlayResY:\s*\d+/i, `PlayResY: ${h}`);
  const replacement = `Style: Karaoke,${style.fontFamily},${style.fontSize},${style.textColor},${style.textColor},${style.outlineColor},${style.bgColor},${style.bold},${style.italic},0,0,100,100,0,0,${style.borderStyle},${style.outlineWidth},${style.shadow},${alignment},${style.margin},${style.margin},${style.margin},1`;
  if (/^Style:\s*Karaoke,.*$/im.test(ass)) ass = ass.replace(/^Style:\s*Karaoke,.*$/im, replacement);
  const prefix = `{\\an${alignment}\\pos(${x},${y})${effectTags(config || {})}}`;
  ass = ass.replace(/^(Dialogue:\s*[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,)(.*)$/gim, (full, head, text) => `${head}${prefix}${text}`);
  return injectCoverIntoAss(ass, job, config, w, h);
}

export function updateJobDerivedAss(job, config, width, height) {
  if (!job) return '';
  if (job.karaokeAss && !job.p3OriginalKaraokeAss && !job.p3DerivedAss) job.p3OriginalKaraokeAss = job.karaokeAss;
  const useOriginal = Boolean(config?.preserveKaraoke && job.p3OriginalKaraokeAss && !job.p3CueEdited);
  const ass = useOriginal
    ? decorateKaraokeAss(job.p3OriginalKaraokeAss, job, config, width, height)
    : buildP3Ass(job, config, width, height);
  job.p3DerivedAss = ass;
  job.karaokeAss = ass || job.p3OriginalKaraokeAss || null;
  return ass;
}
