import { getP3EditorState, updateP3EditorState, p3Jobs, selectedP3Job, ensureP3Config } from './editor-store.js';
import { fitLogicalCanvas, viewportPointToLogical, logicalPointToPercent, percentPointToLogical } from './preview-geometry.js';
import { cuesForJob, updateJobDerivedAss } from './subtitle-ass.js';
import { renderP3Job } from './render-controller.js';

const STYLE_ATTR = 'data-p3-editor-style';
const PRESETS = {
  default: { fontFamily:'Arial', fontSize:42, bold:true, textColor:'#ffffff', outlineColor:'#000000', outlineWidth:3, shadow:2, bgEnabled:false, bgOpacity:0, x:50, y:84 },
  youtube: { fontFamily:'Arial', fontSize:46, bold:true, textColor:'#ffffff', outlineColor:'#000000', outlineWidth:4, shadow:2, bgEnabled:true, bgOpacity:62, x:50, y:82 },
  karaoke: { fontFamily:'Arial', fontSize:44, bold:true, textColor:'#facc15', outlineColor:'#111827', outlineWidth:3, shadow:2, bgEnabled:false, bgOpacity:0, x:50, y:82, preserveKaraoke:true },
  minimal: { fontFamily:'Arial', fontSize:38, bold:false, textColor:'#ffffff', outlineColor:'#000000', outlineWidth:1, shadow:1, bgEnabled:true, bgOpacity:38, x:50, y:86 },
  news: { fontFamily:'Arial', fontSize:38, bold:true, textColor:'#ffffff', outlineColor:'#172554', outlineWidth:2, shadow:1, bgEnabled:true, bgColor:'#172554', bgOpacity:84, align:'left', x:50, y:88 },
  review: { fontFamily:'Arial', fontSize:42, bold:true, textColor:'#ffffff', outlineColor:'#312e81', outlineWidth:3, shadow:3, bgEnabled:true, bgOpacity:58, x:50, y:82 },
};

let mounted = false;
let legacyObserver = null;
let resizeObserver = null;
let dragFrame = 0;
let pendingPoint = null;

function el(id) { return document.getElementById(id); }
function esc(value) { const d=document.createElement('div'); d.textContent=String(value ?? ''); return d.innerHTML; }
function fileUrl(path) { const raw=String(path||'').trim(); if(!raw) return ''; if(/^(file|blob|https?):/i.test(raw)) return raw; const n=raw.replace(/\\/g,'/'); return encodeURI(n.startsWith('/') ? `file://${n}` : `file:///${n}`).replace(/#/g,'%23'); }
function fmt(sec) { const s=Math.max(0,Number(sec)||0); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`; }

function ensureCss() {
  if (document.querySelector(`link[${STYLE_ATTR}]`)) return;
  const link=document.createElement('link'); link.rel='stylesheet'; link.href='styles/pipeline3-editor.css'; link.setAttribute(STYLE_ATTR,'true'); document.head.appendChild(link);
}

function markup() {
  return `<div class="p3e-shell">
    <aside class="p3e-jobs p3e-card">
      <div class="p3e-heading"><div><strong>1. Quản lý Job</strong><small>Job đã sẵn sàng để dựng & xuất</small></div><button id="p3e-refresh" class="p3e-icon" type="button">↻</button></div>
      <div class="p3e-job-tools"><input id="p3e-search" class="p3e-input" placeholder="Tìm kiếm job..."><select id="p3e-filter" class="p3e-input"><option value="all">Tất cả</option><option value="ready">Sẵn sàng</option><option value="rendering">Đang render</option><option value="finished">Hoàn tất</option><option value="error">Lỗi</option></select></div>
      <div id="p3e-job-list" class="p3e-job-list"></div>
      <div class="p3e-compat" aria-hidden="true"></div>
    </aside>

    <main class="p3e-main">
      <section class="p3e-card p3e-preview-card">
        <div class="p3e-heading"><div><strong>2. Preview & Canvas</strong><small>Khung video giữ đúng tỷ lệ nguồn</small></div><span id="p3e-canvas-meta" class="p3e-chip">—</span></div>
        <div id="p3e-viewport" class="p3e-viewport">
          <div id="p3e-canvas" class="p3e-canvas">
            <video id="p3e-video" preload="metadata"></video>
            <div id="p3e-safe" class="p3e-safe"></div>
            <div id="p3e-sub" class="p3e-sub" tabindex="0">Kéo phụ đề để đặt vị trí</div>
          </div>
        </div>
        <div class="p3e-player"><button id="p3e-play" class="p3e-btn" type="button">▶</button><input id="p3e-seek" type="range" min="0" max="1000" value="0"><span id="p3e-time">00:00 / 00:00</span></div>
      </section>

      <section class="p3e-card p3e-timeline-card">
        <div class="p3e-heading"><div><strong>4. Timeline / Tổng quan track</strong><small>Assembly timeline · click cue để tua</small></div></div>
        <div id="p3e-timeline" class="p3e-timeline"></div>
      </section>
    </main>

    <aside class="p3e-inspector p3e-card">
      <div class="p3e-heading"><div><strong>3. Trung tâm Cài đặt P3</strong><small>Nhóm cùng chức năng dạng fold</small></div></div>
      <div class="p3e-accordion">
        ${accordion('subtitle','Phụ đề', subtitleFields(), true)}
        ${accordion('position','Bố cục & Vị trí', positionFields())}
        ${accordion('effect','Hiệu ứng chữ', effectFields())}
        ${accordion('audio','Audio', audioFields())}
        ${accordion('music','Nhạc nền', musicFields())}
        ${accordion('export','Xuất video', exportFields())}
        ${accordion('advanced','Nâng cao', advancedFields())}
      </div>
      <div class="p3e-render-zone"><div id="p3e-render-note" class="p3e-render-note">Chọn Job P3 để render.</div><button id="p3e-render" class="p3e-render" type="button" disabled>🚀 Bắt đầu Render</button><button id="p3e-open-output" class="p3e-btn p3e-open-output" type="button" hidden>📂 Mở video hoàn chỉnh</button></div>
    </aside>
  </div>`;
}

function accordion(key,title,body,open=false) { return `<details class="p3e-fold" data-fold="${key}" ${open?'open':''}><summary>${title}<span>⌄</span></summary><div class="p3e-fold-body">${body}</div></details>`; }
function subtitleFields() { return `<div class="p3e-presets">${Object.keys(PRESETS).map(k=>`<button type="button" data-preset="${k}" class="p3e-preset">${k==='youtube'?'YouTube Pro':k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div><div class="p3e-grid2"><label>Font<select id="p3e-font" class="p3e-input"><option>Arial</option><option>Roboto</option><option>Tahoma</option><option>Verdana</option><option>Consolas</option></select></label><label>Cỡ chữ<input id="p3e-size" class="p3e-input" type="number" min="10" max="160"></label></div><div class="p3e-grid2"><label>Màu chữ<input id="p3e-color" type="color"></label><label>Màu viền<input id="p3e-outline" type="color"></label></div><div class="p3e-grid2"><label class="p3e-check"><input id="p3e-bold" type="checkbox"> Đậm</label><label class="p3e-check"><input id="p3e-italic" type="checkbox"> Nghiêng</label></div>${range('p3e-outline-width','Viền / Stroke',0,12,1)}${range('p3e-shadow','Bóng / Shadow',0,12,1)}<label class="p3e-check"><input id="p3e-bg-enabled" type="checkbox"> Bật nền phụ đề</label><div class="p3e-grid2"><label>Màu nền<input id="p3e-bg-color" type="color"></label><label>Opacity<input id="p3e-bg-opacity" class="p3e-input" type="number" min="0" max="100"></label></div><div class="p3e-grid2"><label>Padding<input id="p3e-padding" class="p3e-input" type="number" min="0" max="40"></label><label>Line height<input id="p3e-line-height" class="p3e-input" type="number" min="0.8" max="2" step="0.05"></label></div>${range('p3e-max-width','Độ rộng tối đa',30,100,1)}<label class="p3e-check"><input id="p3e-sub-enabled" type="checkbox"> Burn phụ đề</label>`; }
function positionFields() { return `<div id="p3e-anchors" class="p3e-anchors">${[0,1,2,3,4,5,6,7,8].map(i=>`<button type="button" data-anchor="${i}"></button>`).join('')}</div><div class="p3e-grid2"><label>X (%)<input id="p3e-x" class="p3e-input" type="number" min="0" max="100" step="0.1"></label><label>Y (%)<input id="p3e-y" class="p3e-input" type="number" min="0" max="100" step="0.1"></label></div><label>Căn chữ<select id="p3e-align" class="p3e-input"><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select></label><label class="p3e-check"><input id="p3e-safe-toggle" type="checkbox"> Hiện vùng an toàn</label><label class="p3e-check"><input id="p3e-snap" type="checkbox"> Bám vùng an toàn / lưới</label><button id="p3e-reset-pos" class="p3e-btn" type="button">Đặt lại vị trí</button>`; }
function effectFields() { return `<label>Hiệu ứng<select id="p3e-effect" class="p3e-input"><option value="none">Không</option><option value="fade">Fade</option><option value="pop">Pop</option></select></label>${range('p3e-effect-ms','Thời lượng (ms)',0,1200,20)}`; }
function audioFields() { return `<div id="p3e-voice-fit" class="p3e-note">Chưa có telemetry.</div><label class="p3e-check"><input id="p3e-remove-vocal" type="checkbox"> Xóa giọng gốc (Voice)</label>`; }
function musicFields() { return `${range('p3e-bg-volume','Âm lượng nền',0,100,1)}`; }
function exportFields() { return `<div id="p3e-export-summary" class="p3e-note">MP4 · H.264 theo renderer hiện tại.</div>`; }
function advancedFields() { return `<label class="p3e-check"><input id="p3e-preserve-karaoke" type="checkbox"> Giữ timing karaoke P1 nếu có</label><button id="p3e-reset-config" class="p3e-btn" type="button">Đặt lại cài đặt P3 của Job</button><div id="p3e-readiness" class="p3e-note"></div>`; }
function range(id,label,min,max,step) { return `<label>${label}<div class="p3e-range"><input id="${id}" type="range" min="${min}" max="${max}" step="${step}"><output id="${id}-out"></output></div></label>`; }

function legacyToCompat(pane) {
  const compat=pane.querySelector('.p3e-compat');
  const old=[...pane.childNodes].filter(node=>!node.classList?.contains('p3e-shell'));
  old.forEach(node=>compat.appendChild(node));
}

function statusLabel(job) { return ({ready:'Sẵn sàng',rendering:'Đang render',finished:'Hoàn tất',error:'Lỗi'})[job?.p3Status] || (job?.p2Status==='finished'?'Sẵn sàng':'Chờ'); }
function filteredJobs() { const s=getP3EditorState(); const q=s.search.trim().toLowerCase(); return p3Jobs().filter(j=>(!q || `${j.fileName} ${j.id}`.toLowerCase().includes(q)) && (s.statusFilter==='all' || (j.p3Status||'ready')===s.statusFilter)); }

function renderJobs() {
  const list=el('p3e-job-list'); if(!list) return;
  const jobs=filteredJobs(); const active=getP3EditorState().activeJobId;
  if(!jobs.length) { list.innerHTML='<div class="p3e-empty">Chưa có Job P3 phù hợp.</div>'; return; }
  list.innerHTML=jobs.map(job=>`<button type="button" class="p3e-job${job.id===active?' active':''}" data-job="${esc(job.id)}"><span class="p3e-job-icon">▶</span><span><strong>${esc(job.fileName)}</strong><small>${esc(statusLabel(job))} · ${job.ttsAudioPath?'Voice ✓':'Voice —'} · ${(job.ttsTimedSrt||job.karaokeAss)?'Sub ✓':'Sub —'}</small></span><em>${esc(job.p3Status==='error'?'Lỗi':job.p3Status==='finished'?'✓':'')}</em></button>`).join('');
  list.querySelectorAll('[data-job]').forEach(button=>button.addEventListener('click',()=>{ updateP3EditorState({activeJobId:button.dataset.job}); syncSelectedJob(true); }));
}

async function readVideoInfo(job) {
  const state=getP3EditorState(); if(state.videoInfoByJob.has(job.id)) return state.videoInfoByJob.get(job.id);
  try { const info=await window.api.videoInfo(job.p3CleanVideoPath || job.outputPath || job.filePath); if(info?.width&&info?.height) { state.videoInfoByJob.set(job.id,info); job.p3VideoInfo=info; return info; } } catch(e) { window.addLog?.(`[P3] Metadata preview lỗi: ${e.message}`,'warning'); }
  return job.p3VideoInfo || null;
}

function applyCanvasFit(info) {
  const viewport=el('p3e-viewport'), canvas=el('p3e-canvas'); if(!viewport||!canvas||!info) return;
  const fit=fitLogicalCanvas(info.width,info.height,viewport.clientWidth,viewport.clientHeight);
  canvas.style.width=`${fit.width}px`; canvas.style.height=`${fit.height}px`; canvas.style.left=`${fit.left}px`; canvas.style.top=`${fit.top}px`; canvas.dataset.fit=JSON.stringify(fit);
}

function configInputs() { return {
  fontFamily:'p3e-font',fontSize:'p3e-size',textColor:'p3e-color',outlineColor:'p3e-outline',bold:'p3e-bold',italic:'p3e-italic',outlineWidth:'p3e-outline-width',shadow:'p3e-shadow',bgEnabled:'p3e-bg-enabled',bgColor:'p3e-bg-color',bgOpacity:'p3e-bg-opacity',padding:'p3e-padding',lineHeight:'p3e-line-height',maxWidth:'p3e-max-width',subtitleEnabled:'p3e-sub-enabled',x:'p3e-x',y:'p3e-y',align:'p3e-align',safeZone:'p3e-safe-toggle',snap:'p3e-snap',effect:'p3e-effect',effectMs:'p3e-effect-ms',removeVocal:'p3e-remove-vocal',bgVolume:'p3e-bg-volume',preserveKaraoke:'p3e-preserve-karaoke' }; }

function loadConfig(job) {
  const c=ensureP3Config(job); Object.entries(configInputs()).forEach(([key,id])=>{ const input=el(id); if(!input) return; if(input.type==='checkbox') input.checked=Boolean(c[key]); else input.value=c[key] ?? ''; });
  ['outline-width','shadow','max-width','effect-ms','bg-volume'].forEach(k=>{ const input=el(`p3e-${k}`),out=el(`p3e-${k}-out`); if(out&&input) out.value=k==='bg-volume'?`${input.value}%`:input.value; });
  document.querySelectorAll('.p3e-preset').forEach(b=>b.classList.toggle('active',b.dataset.preset===c.preset));
  el('p3e-safe')?.classList.toggle('show',Boolean(c.safeZone));
}

function saveConfig(job) {
  const c=ensureP3Config(job); Object.entries(configInputs()).forEach(([key,id])=>{ const input=el(id); if(!input) return; let v=input.type==='checkbox'?input.checked:input.value; if(['fontSize','outlineWidth','shadow','bgOpacity','padding','lineHeight','maxWidth','x','y','effectMs','bgVolume'].includes(key)) v=Number(v); c[key]=v; });
  updatePreviewStyle(job); refreshAss(job);
}

function updatePreviewStyle(job) {
  const c=ensureP3Config(job), sub=el('p3e-sub'); if(!sub) return;
  sub.style.left=`${c.x}%`; sub.style.top=`${c.y}%`; sub.style.fontFamily=c.fontFamily; sub.style.fontSize=`${Math.max(10,c.fontSize)}px`; sub.style.fontWeight=c.bold?'800':'500'; sub.style.fontStyle=c.italic?'italic':'normal'; sub.style.color=c.textColor; sub.style.textAlign=c.align; sub.style.maxWidth=`${c.maxWidth}%`; sub.style.lineHeight=String(c.lineHeight); sub.style.padding=`${c.padding}px`; sub.style.background=c.bgEnabled?hexToRgba(c.bgColor,c.bgOpacity):'transparent'; sub.style.webkitTextStroke=`${c.outlineWidth}px ${c.outlineColor}`; sub.style.textShadow=`0 ${Math.max(0,c.shadow)}px ${Math.max(1,c.shadow*2)}px rgba(0,0,0,.85)`; el('p3e-safe')?.classList.toggle('show',Boolean(c.safeZone));
}
function hexToRgba(hex,a){const h=String(hex||'#000000').replace('#','').padEnd(6,'0');return `rgba(${parseInt(h.slice(0,2),16)||0},${parseInt(h.slice(2,4),16)||0},${parseInt(h.slice(4,6),16)||0},${Math.max(0,Math.min(100,Number(a)||0))/100})`;}

async function refreshAss(job) { const info=await readVideoInfo(job); if(info) updateJobDerivedAss(job,ensureP3Config(job),info.width,info.height); }

function renderTimeline(job,info) {
  const root=el('p3e-timeline'); if(!root) return; const duration=Math.max(.01,Number(info?.duration)||Number(job.ttsAudioDurMs)/1000||1); const cues=cuesForJob(job);
  const blocks=cues.map(c=>`<button class="p3e-cue" data-time="${c.start}" style="left:${c.start/duration*100}%;width:${Math.max(.5,(c.end-c.start)/duration*100)}%">${esc(c.text)}</button>`).join('');
  root.innerHTML=`${track('Video','p3e-video-track','')} ${track('Voice','p3e-voice-track','')} <div class="p3e-track"><span>Subtitle</span><div class="p3e-lane sublane">${blocks}<i class="p3e-playhead"></i></div></div>${track('Effects','p3e-fx-track','')} `;
  root.querySelectorAll('.p3e-cue').forEach(b=>b.addEventListener('click',()=>{ const v=el('p3e-video'); if(v) v.currentTime=Number(b.dataset.time)||0; }));
}
function track(label,cls){return `<div class="p3e-track ${cls}"><span>${label}</span><div class="p3e-lane"><b></b><i class="p3e-playhead"></i></div></div>`;}

function updateCue(job) { const video=el('p3e-video'),sub=el('p3e-sub'); if(!video||!sub) return; const cue=cuesForJob(job).find(c=>video.currentTime>=c.start&&video.currentTime<c.end); sub.textContent=cue?.text || 'Kéo phụ đề để đặt vị trí'; sub.classList.toggle('placeholder',!cue); const ratio=video.duration?video.currentTime/video.duration:0; document.querySelectorAll('.p3e-playhead').forEach(p=>p.style.left=`${ratio*100}%`); el('p3e-seek').value=String(Math.round(ratio*1000)); el('p3e-time').textContent=`${fmt(video.currentTime)} / ${fmt(video.duration)}`; }

async function syncSelectedJob(resetVideo=false) {
  renderJobs(); const job=selectedP3Job(); const render=el('p3e-render'),video=el('p3e-video');
  if(!job) { if(render) render.disabled=true; return; }
  ensureP3Config(job); if(!job.p3CleanVideoPath) job.p3CleanVideoPath=job.outputPath||''; loadConfig(job); const info=await readVideoInfo(job); if(info){applyCanvasFit(info); el('p3e-canvas-meta').textContent=`${info.width}×${info.height} · ${fmt(info.duration)}`; renderTimeline(job,info);}
  if(video && (resetVideo || video.dataset.job!==job.id)){video.dataset.job=job.id; video.src=fileUrl(job.p3CleanVideoPath||job.outputPath||job.filePath); video.load();}
  updatePreviewStyle(job); await refreshAss(job); updateSummary(job,info); if(render) render.disabled=!job.p3CleanVideoPath || job.p3Status==='rendering'; const open=el('p3e-open-output'); if(open){open.hidden=!job.finalOutputPath; open.onclick=()=>window.electronAPI?.openPath(job.finalOutputPath);}
}

function updateSummary(job,info){const ratio=info?.duration&&job.ttsAudioDurMs?job.ttsAudioDurMs/1000/info.duration:0; el('p3e-voice-fit').textContent=ratio?`Voice ${(ratio*100).toFixed(1)}% video · ${ratio<.9?'giữ tốc độ tự nhiên':ratio<=1.15?'P3 có thể fit có giới hạn':'BLOCKED nếu vượt 115%'}`:'Chưa có duration voice.'; el('p3e-export-summary').textContent=`MP4 · H.264 · ${info?.width||'—'}×${info?.height||'—'} · ${info?.fps?Number(info.fps).toFixed(1):'—'} fps`; el('p3e-readiness').textContent=`Clean video: ${job.p3CleanVideoPath?'✓':'—'} · Voice: ${job.ttsAudioPath?'✓':'—'} · Subtitle: ${cuesForJob(job).length} cue`; el('p3e-render-note').textContent=`${statusLabel(job)} · ${job.fileName}`;}

function bindControls() {
  el('p3e-search').addEventListener('input',e=>{updateP3EditorState({search:e.target.value});renderJobs();}); el('p3e-filter').addEventListener('change',e=>{updateP3EditorState({statusFilter:e.target.value});renderJobs();}); el('p3e-refresh').addEventListener('click',()=>{window.renderJobList?.();renderJobs();syncSelectedJob(false);});
  Object.values(configInputs()).forEach(id=>el(id)?.addEventListener('input',()=>{const job=selectedP3Job();if(job)saveConfig(job);}));
  document.querySelectorAll('.p3e-preset').forEach(btn=>btn.addEventListener('click',()=>{const job=selectedP3Job();if(!job)return;Object.assign(ensureP3Config(job),PRESETS[btn.dataset.preset]||{}, {preset:btn.dataset.preset});loadConfig(job);updatePreviewStyle(job);refreshAss(job);}));
  el('p3e-reset-pos').addEventListener('click',()=>{const job=selectedP3Job();if(!job)return;Object.assign(ensureP3Config(job),{x:50,y:82});loadConfig(job);updatePreviewStyle(job);refreshAss(job);});
  el('p3e-reset-config').addEventListener('click',()=>{const job=selectedP3Job();if(!job)return;delete job.p3Config;ensureP3Config(job);loadConfig(job);updatePreviewStyle(job);refreshAss(job);});
  const anchors=[[12,14],[50,14],[88,14],[12,50],[50,50],[88,50],[12,86],[50,86],[88,86]]; document.querySelectorAll('[data-anchor]').forEach(b=>b.addEventListener('click',()=>{const job=selectedP3Job();if(!job)return;const p=anchors[Number(b.dataset.anchor)]||anchors[7];Object.assign(ensureP3Config(job),{x:p[0],y:p[1]});loadConfig(job);updatePreviewStyle(job);refreshAss(job);}));
  el('p3e-play').addEventListener('click',()=>{const v=el('p3e-video');if(!v)return;v.paused?v.play():v.pause();}); el('p3e-seek').addEventListener('input',e=>{const v=el('p3e-video');if(v?.duration)v.currentTime=Number(e.target.value)/1000*v.duration;}); el('p3e-video').addEventListener('timeupdate',()=>{const job=selectedP3Job();if(job)updateCue(job);}); el('p3e-video').addEventListener('play',()=>el('p3e-play').textContent='⏸'); el('p3e-video').addEventListener('pause',()=>el('p3e-play').textContent='▶'); el('p3e-video').addEventListener('loadedmetadata',()=>syncSelectedJob(false));
  bindDrag();
  el('p3e-render').addEventListener('click',async()=>{const job=selectedP3Job();if(!job)return;const btn=el('p3e-render');btn.disabled=true;btn.textContent='⏳ Đang Render...';await refreshAss(job);await renderP3Job(job,state=>{btn.textContent=state==='rendering'?'⏳ Đang Render...':state==='finished'?'✓ Render hoàn tất':'⚠ Render thất bại';});setTimeout(()=>{btn.textContent='🚀 Bắt đầu Render';syncSelectedJob(false);},900);});
}

function bindDrag(){const sub=el('p3e-sub'),viewport=el('p3e-viewport'),canvas=el('p3e-canvas');if(!sub||!viewport||!canvas)return;sub.addEventListener('pointerdown',e=>{e.preventDefault();sub.setPointerCapture(e.pointerId);sub.classList.add('dragging');});sub.addEventListener('pointermove',e=>{if(!sub.hasPointerCapture(e.pointerId))return;pendingPoint={x:e.clientX,y:e.clientY};if(dragFrame)return;dragFrame=requestAnimationFrame(()=>{dragFrame=0;const job=selectedP3Job();if(!job||!pendingPoint)return;const info=getP3EditorState().videoInfoByJob.get(job.id);let fit;try{fit=JSON.parse(canvas.dataset.fit||'{}');}catch{return;}if(!info||!fit.scale)return;const logical=viewportPointToLogical(pendingPoint.x,pendingPoint.y,viewport.getBoundingClientRect(),fit);const pct=logicalPointToPercent(logical.x,logical.y,info.width,info.height);const c=ensureP3Config(job);c.x=c.snap?Math.round(pct.x/2)*2:pct.x;c.y=c.snap?Math.round(pct.y/2)*2:pct.y;el('p3e-x').value=c.x.toFixed(1);el('p3e-y').value=c.y.toFixed(1);updatePreviewStyle(job);refreshAss(job);});});['pointerup','pointercancel'].forEach(type=>sub.addEventListener(type,e=>{if(sub.hasPointerCapture(e.pointerId))sub.releasePointerCapture(e.pointerId);sub.classList.remove('dragging');}));}

function observeLegacy() { const legacy=el('step3-job-list'); if(!legacy)return; legacyObserver?.disconnect(); legacyObserver=new MutationObserver(()=>{renderJobs();const active=selectedP3Job();if(active)syncSelectedJob(false);});legacyObserver.observe(legacy,{childList:true,subtree:true,attributes:true}); }

export function installPipeline3Editor() {
  if(mounted)return; const pane=el('step-3-content'); if(!pane)return; mounted=true; ensureCss(); const old=[...pane.childNodes]; pane.innerHTML=markup(); const compat=pane.querySelector('.p3e-compat'); old.forEach(node=>compat.appendChild(node)); bindControls(); observeLegacy(); resizeObserver=new ResizeObserver(()=>{const job=selectedP3Job();const info=job&&getP3EditorState().videoInfoByJob.get(job.id);if(info)applyCanvasFit(info);});resizeObserver.observe(el('p3e-viewport')); renderJobs(); syncSelectedJob(true);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installPipeline3Editor,{once:true});else installPipeline3Editor();
