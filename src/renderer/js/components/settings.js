import { state } from '../store.js';
import { addLog } from '../utils/logger.js';

let legacyMigrated = false;
let refAudioPath = null;
let lastVoice = localStorage.getItem('tts_voice') || 'default';

function ensureStyles() {
}

export function initSettings() {
  bindProvider();
  bindAi();
  bindTts();
  bindOutputDir();
  bindDiagnostics();
  loadSettingsValues();
  refreshDiagnostics();
}
window.initSettings = initSettings;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSettings(), { once: true });
} else {
  setTimeout(() => initSettings(), 0);
}



export function loadSettingsValues() {
  const provider = localStorage.getItem('ai_provider') || 'gemini'; migrateLegacy(provider);
  const p = document.getElementById('ai-provider'); if (p) p.value = provider; loadProvider(provider); updateProviderUi(provider);
  const prompt = document.getElementById('ai-prompt'); if (prompt) prompt.value = localStorage.getItem('ai_prompt') || '';
  const voice = document.getElementById('tts-voice'); const savedVoice = localStorage.getItem('tts_voice') || 'none'; if (voice && [...voice.options].some(o=>o.value===savedVoice)) voice.value=savedVoice;
  const lang = document.getElementById('tts-language'); if (lang) lang.value=localStorage.getItem('tts_language')||'vi';
  const vol = document.getElementById('tts-bg-volume'); if (vol) { vol.value=localStorage.getItem('tts_bg_volume')||'10'; setText('vol-label',vol.value+'%'); }
  const remove = document.getElementById('tts-remove-vocal'); if (remove) remove.checked=localStorage.getItem('tts_remove_vocal')==='true';
  const enabled=document.getElementById('tts-enabled'); if (enabled) enabled.checked=savedVoice!=='none'; if(savedVoice!=='none') lastVoice=savedVoice;
  syncOutputDir(); updateVoiceDropdown(getSavedVoices()); syncOverview();
}

function loadProvider(provider) { const key=document.getElementById('ai-api-key'), model=document.getElementById('ai-model'), endpoint=document.getElementById('ai-endpoint'); if(key) key.value=isCloud(provider)?readKey(provider):''; if(model) model.value=localStorage.getItem(`ai_model_${provider}`)??''; if(endpoint) endpoint.value=provider==='ollama'?(localStorage.getItem('ai_endpoint')||'http://localhost:11434/api/chat'):''; }
function readKey(provider) { try { const a=JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`)||'[]'); const first=Array.isArray(a)?a[0]:null; return typeof first==='string'?first:(first?.key||''); } catch { return ''; } }
function migrateLegacy(provider) { if(legacyMigrated) return; legacyMigrated=true; if(!isCloud(provider)) return; let keys=[]; try{const p=JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`)||'[]'); keys=Array.isArray(p)?p:[];}catch{} const legacy=(localStorage.getItem('ai_api_key')||'').trim(); if(!keys.length&&legacy) localStorage.setItem(`ai_api_keys_${provider}`,JSON.stringify([{key:legacy}])); if(legacy) localStorage.removeItem('ai_api_key'); }
function isCloud(p){return p==='gemini'||p==='deepseek';}

function saveSettings() {
  const p=document.getElementById('ai-provider')?.value||'gemini'; localStorage.setItem('ai_provider',p); localStorage.setItem(`ai_model_${p}`,document.getElementById('ai-model')?.value??'');
  if(isCloud(p)){const key=document.getElementById('ai-api-key')?.value.trim()||''; localStorage.setItem(`ai_api_keys_${p}`,JSON.stringify(key?[{key}]:[]));}
  if(p==='ollama') localStorage.setItem('ai_endpoint',document.getElementById('ai-endpoint')?.value.trim()||'');
  localStorage.setItem('ai_prompt',document.getElementById('ai-prompt')?.value??'');
  const enabled=document.getElementById('tts-enabled')?.checked??true, voice=document.getElementById('tts-voice')?.value||'none'; if(enabled&&voice!=='none') lastVoice=voice; localStorage.setItem('tts_voice',enabled?voice:'none');
  localStorage.setItem('tts_language',document.getElementById('tts-language')?.value||'vi'); localStorage.setItem('tts_bg_volume',document.getElementById('tts-bg-volume')?.value||'10'); localStorage.setItem('tts_remove_vocal',String(document.getElementById('tts-remove-vocal')?.checked??false)); syncOverview();
}

function bindProvider() {
  const select=document.getElementById('ai-provider'); document.querySelectorAll('.provider-btn[data-provider]').forEach(b=>b.addEventListener('click',()=>{if(!select)return;select.value=b.dataset.provider;loadProvider(select.value);updateProviderUi(select.value);syncOverview();}));
}
function updateProviderUi(provider){document.querySelectorAll('.provider-btn[data-provider]').forEach(b=>b.classList.toggle('active',b.dataset.provider===provider)); const key=document.getElementById('ai-api-key-group'), endpoint=document.getElementById('ai-endpoint-group'); if(key)key.style.display=provider==='ollama'?'none':''; if(endpoint)endpoint.style.display=provider==='ollama'?'':'none';}
function bindAi(){document.getElementById('btn-toggle-api-key')?.addEventListener('click',()=>{const i=document.getElementById('ai-api-key');if(i)i.type=i.type==='password'?'text':'password';}); const check=async()=>{const s=document.getElementById('settings-ai-status');if(s)s.textContent='Đang kiểm tra backend...';try{await window.api.health();if(s)s.textContent='Backend sẵn sàng. Cấu hình có thể được sử dụng.';}catch{if(s)s.textContent='Backend chưa kết nối.';}}; document.getElementById('btn-check-ai')?.addEventListener('click',check);document.getElementById('btn-check-ai-key')?.addEventListener('click',check);document.getElementById('btn-save-ai')?.addEventListener('click',()=>{saveSettings();addLog('Đã lưu cài đặt AI/TTS.','success');toast('Đã lưu cài đặt','success');});document.getElementById('settings-btn-manage-prompts')?.addEventListener('click',()=>document.getElementById('prompt-modal')?.classList.remove('hidden'));}

function bindTts(){const vol=document.getElementById('tts-bg-volume');vol?.addEventListener('input',()=>setText('vol-label',vol.value+'%'));['tts-language','tts-bg-volume','tts-remove-vocal'].forEach(id=>document.getElementById(id)?.addEventListener('change',saveSettings)); const enabled=document.getElementById('tts-enabled'), voice=document.getElementById('tts-voice');enabled?.addEventListener('change',()=>{if(!voice)return;if(enabled.checked&&voice.value==='none'){const wanted=lastVoice!=='none'?lastVoice:'default';if([...voice.options].some(o=>o.value===wanted))voice.value=wanted;}else if(!enabled.checked){if(voice.value!=='none')lastVoice=voice.value;voice.value='none';}saveSettings();});voice?.addEventListener('change',()=>{if(voice.value!=='none'){lastVoice=voice.value;if(enabled)enabled.checked=true;}saveSettings();});document.getElementById('btn-test-tts')?.addEventListener('click',testTts);}

export function getSavedVoices(){try{return JSON.parse(localStorage.getItem('tts_voices')||'[]');}catch{return[];}}
function saveVoices(v){localStorage.setItem('tts_voices',JSON.stringify(v));}
export function renderSavedVoices(){const voices=getSavedVoices(),list=document.getElementById('saved-voices-list');if(!list)return;if(!voices.length)list.innerHTML='<div class="voice-empty">Chưa có giọng clone nào.</div>';else list.innerHTML=voices.map((v,i)=>`<div class="approved-voice-row"><div class="approved-voice-name"><span class="voice-person-icon">♙</span><span>${escapeHtml(v.name||`Giọng clone ${i+1}`)}</span></div><span class="approved-voice-lang">${escapeHtml(v.language||'Tiếng Việt')}</span><button class="voice-row-action" type="button" data-delete-voice="${i}" title="Xóa giọng">⋮</button></div>`).join('');list.querySelectorAll('[data-delete-voice]').forEach(b=>b.addEventListener('click',()=>{const a=getSavedVoices();a.splice(Number(b.dataset.deleteVoice),1);saveVoices(a);renderSavedVoices();toast('Đã xóa giọng clone','info');}));updateVoiceDropdown(voices);}
export function updateVoiceDropdown(voices){[document.getElementById('tts-voice'),document.getElementById('job-tts-voice'),document.getElementById('step1-tts-voice')].filter(Boolean).forEach(s=>{[...s.options].filter(o=>o.value.startsWith('clone:')).forEach(o=>o.remove());voices.forEach((v,i)=>{const o=document.createElement('option');o.value=`clone:${i}`;o.textContent=`Giọng clone - ${v.name||i+1}`;s.appendChild(o);});const saved=localStorage.getItem('tts_voice')||'none';if([...s.options].some(o=>o.value===saved))s.value=saved;});syncOverview();}

function bindVoiceClone(){const editor=document.getElementById('clone-editor'),upload=document.getElementById('btn-upload-ref-audio'),clone=document.getElementById('btn-clone-voice'),name=document.getElementById('clone-voice-name'),refName=document.getElementById('ref-audio-name'),preview=document.getElementById('ref-audio-preview');document.getElementById('settings-add-voice')?.addEventListener('click',()=>editor?.classList.toggle('hidden'));upload?.addEventListener('click',async()=>{if(!window.electronAPI?.openFile){toast('Chức năng chọn file chỉ khả dụng trong app','warn');return;}const r=await window.electronAPI.openFile([{name:'Audio',extensions:['wav','mp3','flac','ogg','m4a','aac','wma','opus']}]);const p=r&&!r.canceled&&r.filePaths?.[0];if(!p)return;refAudioPath=p;if(refName)refName.textContent=p.split(/[\\/]/).pop();if(preview){preview.src='file:///'+p.replace(/\\/g,'/');preview.style.display='block';}if(clone)clone.disabled=false;});clone?.addEventListener('click',async()=>{const n=name?.value.trim();if(!n){toast('Nhập tên giọng','warn');return;}if(!refAudioPath){toast('Chọn audio mẫu trước','warn');return;}clone.disabled=true;clone.textContent='Đang tạo giọng...';try{const lang=document.getElementById('tts-language')?.value||'vi';const r=await window.api.generateTTS('Xin chào, đây là mẫu giọng được clone.',refAudioPath,lang);if(r?.status!=='ok'||!r.audio_path)throw new Error(r?.error||'Không tạo được mẫu giọng');const a=getSavedVoices();a.push({name:n,language:langLabel(lang),audioPath:refAudioPath,audioFile:refAudioPath.split(/[\\/]/).pop(),samplePath:r.audio_path,date:new Date().toLocaleDateString('vi-VN')});saveVoices(a);renderSavedVoices();name.value='';refAudioPath=null;if(refName)refName.textContent='Chưa chọn file';if(preview)preview.style.display='none';editor?.classList.add('hidden');toast('Đã thêm giọng clone','success');}catch(e){toast(e.message||'Không thể clone giọng','error');}finally{clone.disabled=!refAudioPath;clone.textContent='Thêm giọng clone';}});}
async function testTts(){const b=document.getElementById('btn-test-tts'),audio=document.getElementById('tts-test-audio'),voice=document.getElementById('tts-voice')?.value||'default';let ref=null;if(voice.startsWith('clone:'))ref=getSavedVoices()[Number(voice.split(':')[1])]?.audioPath||null;b.disabled=true;b.textContent='Đang tạo...';try{const r=await window.api.generateTTS(document.getElementById('tts-test-text')?.value.trim()||'Xin chào',ref,document.getElementById('tts-language')?.value||'vi',voice);if(r?.status==='ok'&&r.audio_path&&audio){audio.src='file:///'+r.audio_path.replace(/\\/g,'/');audio.style.display='block';await audio.play();}else throw new Error(r?.error||'Không tạo được audio thử');}catch(e){toast(e.message||'Không thể phát thử giọng','error');}finally{b.disabled=false;b.textContent='▷ Nghe thử';}}

function bindOutputDir(){document.getElementById('btn-output-dir')?.addEventListener('click',async()=>{if(!window.electronAPI?.openDirectory)return;const r=await window.electronAPI.openDirectory();const dir=!r?.canceled&&r.filePaths?.[0];if(!dir)return;state.outputDir=dir;if(window._appState)window._appState.outputDir=dir;localStorage.setItem('output_dir',dir);syncOutputDir();syncOverview();addLog(`Thư mục đầu ra: ${dir}`,'info');});}
function syncOutputDir(){const dir=state.outputDir||window._appState?.outputDir||localStorage.getItem('output_dir')||'';setText('output-dir-text',dir||'Mặc định (cùng thư mục video gốc)');setText('output-dir-current',dir||'Mặc định cùng thư mục video gốc');}

function bindDiagnostics(){document.getElementById('btn-refresh-diagnostics')?.addEventListener('click',refreshDiagnostics);}
export async function checkTTSStatus(){const a=document.getElementById('tts-status-chip'),b=document.getElementById('system-tts-status-chip'),meta=document.getElementById('system-tts-meta');try{const s=await window.api.getTTSStatus(),ok=!!s?.available;setChip(a,ok?'Sẵn sàng':'Chưa sẵn sàng',ok?'online':'offline');setChip(b,ok?'Sẵn sàng':'Chưa sẵn sàng',ok?'online':'offline');if(meta)meta.textContent=s?.engine||s?.name||'TTS engine';return ok;}catch{setChip(a,'Backend chưa kết nối','offline');setChip(b,'Offline','offline');if(meta)meta.textContent='Không kết nối được';return false;}}
async function refreshDiagnostics(){const btn=document.getElementById('btn-refresh-diagnostics');if(btn){btn.disabled=true;btn.textContent='Đang kiểm tra...';}let backend=false,gpu=false,tts=false;try{const h=await window.api.health();backend=true;setChip(document.getElementById('backend-status-chip'),'Đang chạy','online');setText('system-backend-meta',h?.python_version?`Python ${h.python_version}`:'Python service');}catch{setChip(document.getElementById('backend-status-chip'),'Offline','offline');}try{const i=await window.api.gpuInfo(),has=!!(i?.cuda_available??i?.gpu_available??false),name=i?.gpu_name||'CPU Only';gpu=true;setChip(document.getElementById('gpu-status-chip'),has?'Sẵn sàng':'CPU mode',has?'online':'neutral');setText('gpu-detail',name);setText('cuda-version',i?.cuda_version||(has?'N/A':'CPU mode'));const g=document.querySelector('#gpu-chip span:last-child');if(g)g.textContent=name;}catch{setChip(document.getElementById('gpu-status-chip'),'Không đọc được','offline');setText('gpu-detail','Không xác định');}tts=await checkTTSStatus();updateSummary(backend,gpu,tts);syncOverview();if(btn){btn.disabled=false;btn.textContent='↻ Kiểm tra lại';}}
function updateSummary(backend,gpu,tts){const card=document.getElementById('system-summary-card'),mark=card?.querySelector('.shield-mark');if(!card||!mark)return;card.classList.remove('warning','error');if(backend&&gpu&&tts){mark.textContent='✓';setText('system-summary-title','Tất cả hệ thống hoạt động tốt');setText('system-summary-copy','Mọi thành phần đều hoạt động ổn định và sẵn sàng phục vụ.');}else if(backend&&gpu){card.classList.add('warning');mark.textContent='!';setText('system-summary-title','Hệ thống cơ bản sẵn sàng');setText('system-summary-copy','Backend và compute đã sẵn sàng; TTS cần được kiểm tra thêm.');}else{card.classList.add('error');mark.textContent='×';setText('system-summary-title','Có thành phần chưa sẵn sàng');setText('system-summary-copy','Kiểm tra các trạng thái bên trái và thử lại sau khi dịch vụ được khởi động.');}}
function setChip(node,text,stateName){if(!node)return;node.textContent=text;node.className=`status-chip ${stateName||''}`.trim();}

function syncOverview(){syncOutputDir();const p=localStorage.getItem('ai_provider')||document.getElementById('ai-provider')?.value||'gemini';setText('overview-ai-provider',providerLabel(p));const model=localStorage.getItem(`ai_model_${p}`)??document.getElementById('ai-model')?.value??'';setText('overview-ai-model',model||'Chưa chọn model');const l=document.getElementById('tts-language')?.value||localStorage.getItem('tts_language')||'vi';setText('overview-tts-language',langLabel(l));const v=document.getElementById('tts-voice');setText('overview-tts-voice',v?.selectedOptions?.[0]?.textContent||'Không lồng tiếng');setText('overview-output-dir',state.outputDir||window._appState?.outputDir||localStorage.getItem('output_dir')||'Mặc định cùng thư mục video');setText('overview-backend-status',`Backend: ${document.getElementById('backend-status-chip')?.textContent||'Chưa kiểm tra'}`);setText('overview-gpu-status',`Compute: ${document.getElementById('gpu-status-chip')?.textContent||'Chưa kiểm tra'}`);}
function setText(id,text){const n=document.getElementById(id);if(n)n.textContent=text;}
function providerLabel(p){return({gemini:'Gemini',deepseek:'DeepSeek',ollama:'Ollama'})[p]||p;}
function langLabel(l){return({vi:'Tiếng Việt',en:'English',zh:'中文',ja:'日本語',ko:'한국어'})[l]||l;}
function escapeHtml(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML;}
function toast(msg,type='info',dur=3000){const c=document.getElementById('toast-container');if(!c)return;const t=document.createElement('div');t.className=`toast toast-${type}`;t.textContent=msg;c.appendChild(t);setTimeout(()=>{t.classList.add('toast-out');setTimeout(()=>t.remove(),300);},dur);}
