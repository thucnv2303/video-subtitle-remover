import { state } from '../store.js';
import { addLog } from '../utils/logger.js';

let legacyMigrated = false;
let refAudioPath = null;
let originalRefAudioPath = null;
let referenceTranscript = null;
let referenceSelection = null;
let lastVoice = localStorage.getItem('tts_voice') || 'default';
let settingsEventsBound = false;

mountSettings();
ensureStyles();

function ensureStyles() {
  if (document.querySelector('link[data-settings-approved]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'styles/settings-approved.css';
  link.dataset.settingsApproved = 'true';
  document.head.appendChild(link);
}

function mountSettings() {
  const root = document.querySelector('#page-settings .settings-scroll');
  if (!root || root.dataset.approvedMounted === 'true') return;
  root.innerHTML = `
  <div class="settings-view active" data-settings-view="overview">
    <div class="approved-page-header"><h1>Cài đặt</h1><p>Tùy chỉnh các tùy chọn AI, TTS, lưu trữ và kiểm tra trạng thái hệ thống.</p></div>
    <div class="settings-overview-grid">
      ${overviewCard('ai','AI','1. AI & Model','Cấu hình nhà cung cấp AI, model và prompt mặc định.','overview-ai-provider','Gemini','overview-ai-model','Chưa chọn model')}
      ${overviewCard('tts','TTS','2. TTS & Giọng đọc','Ngôn ngữ, giọng mặc định, voice clone và âm lượng nền.','overview-tts-language','Tiếng Việt','overview-tts-voice','Không lồng tiếng')}
      ${overviewCard('storage','DIR','3. Lưu trữ','Quản lý thư mục lưu và xem các loại tệp đầu ra.','overview-output-dir','Mặc định cùng thư mục video','','')}
      ${overviewCard('system','SYS','4. Trạng thái hệ thống','Theo dõi Backend, GPU và TTS engine.','overview-backend-status','Backend: Chưa kiểm tra','overview-gpu-status','Compute: Chưa kiểm tra')}
    </div>
  </div>

  <div class="settings-view" data-settings-view="ai">
    ${backButton()}
    <div class="approved-page-header detail-header"><h1>AI & Model</h1><p>Cấu hình nhà cung cấp AI dùng cho phân tích và viết lại nội dung.</p></div>
    <section class="approved-panel approved-ai-panel">
      <div class="approved-panel-title"><span class="panel-title-icon">AI</span><h2>AI & Model</h2></div>
      <div class="approved-form-row provider-row">
        <label>Nhà cung cấp AI</label>
        <div class="provider-segment">
          <button class="provider-btn disabled-provider" type="button" disabled title="Runtime hiện tại chưa hỗ trợ OpenAI">OpenAI</button>
          <button class="provider-btn" type="button" data-provider="gemini">Gemini</button>
          <button class="provider-btn" type="button" data-provider="deepseek">DeepSeek</button>
          <button class="provider-btn" type="button" data-provider="ollama">Ollama</button>
        </div>
        <select id="ai-provider" class="approved-hidden-control" tabindex="-1"><option value="gemini">Gemini</option><option value="deepseek">DeepSeek</option><option value="ollama">Ollama</option></select>
      </div>
      <div class="approved-form-row" id="ai-api-key-group">
        <label for="ai-api-key">API Keys</label>
        <div class="field-with-actions"><input id="ai-api-key" type="password" class="approved-input" autocomplete="off" spellcheck="false" placeholder="Dán một hoặc nhiều key, cách nhau bằng dấu phẩy hoặc xuống dòng"><button id="btn-toggle-api-key" class="icon-field-btn" type="button">◉</button><button id="btn-add-ai-key" class="approved-secondary-btn compact" type="button">＋ Thêm key</button></div>
        <div id="ai-key-list" class="ai-key-list"><div class="ai-key-empty">Chưa có key cho provider này.</div></div>
        <p class="field-help">Key được lưu riêng theo provider trên máy này. Mỗi request sẽ xoay key bắt đầu rồi tự chuyển key khác khi lỗi.</p>
      </div>
      <div class="approved-form-row" id="ai-model-group"><label for="ai-model">Model</label><input id="ai-model" class="approved-input" list="ai-model-suggestions" placeholder="Kiểm tra key để tải danh sách model"><datalist id="ai-model-suggestions"></datalist><p id="ai-model-load-status" class="field-help">Danh sách model sẽ được tải trực tiếp từ provider sau khi kiểm tra key.</p></div>
      <div class="approved-form-row" id="ai-endpoint-group"><label for="ai-endpoint">Ollama endpoint</label><input id="ai-endpoint" class="approved-input" placeholder="http://localhost:11434/api/chat"><p class="field-help">Chỉ áp dụng cho Ollama local.</p></div>
      <div class="approved-form-row"><label for="ai-prompt">Prompt mặc định</label><textarea id="ai-prompt" class="approved-input approved-textarea" rows="4"></textarea><p class="field-help">Được dùng khi Pipeline 1 không chọn prompt khác.</p></div>
      <div class="approved-actions-row"><button id="settings-btn-manage-prompts" class="approved-secondary-btn" type="button">☷ Quản lý Prompt</button><button id="btn-check-ai" class="approved-secondary-btn primary-outline" type="button">⌁ Kiểm tra key & tải model</button><button id="btn-save-ai" class="approved-primary-btn" type="button">Lưu thay đổi</button></div>
      <div id="settings-ai-status" class="inline-status"></div>
    </section>
  </div>

  <div class="settings-view" data-settings-view="tts">
    ${backButton()}
    <div class="approved-page-header detail-header"><h1>TTS & Giọng đọc</h1><p>Cấu hình chuyển văn bản thành giọng nói và quản lý giọng đọc clone.</p></div>
    <section class="approved-panel approved-tts-panel">
      <div class="approved-panel-title with-status"><div><span class="panel-title-icon">TTS</span><h2>1. TTS & Giọng đọc</h2></div><span id="tts-status-chip" class="status-chip">Đang kiểm tra...</span></div>
      <div class="tts-enable-row"><span>Bật TTS</span><label class="approved-switch"><input id="tts-enabled" type="checkbox"><span></span></label></div>
      <div class="approved-two-col">
        <div class="approved-form-row compact-field"><label for="tts-language">Ngôn ngữ</label><select id="tts-language" class="approved-input"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="zh">中文</option><option value="ja">日本語</option><option value="ko">한국어</option></select></div>
        <div class="approved-form-row compact-field"><label for="tts-voice">Giọng mặc định</label><select id="tts-voice" class="approved-input"><option value="none">Không lồng tiếng</option><option value="default">Giọng mặc định (OmniVoice)</option><option value="vi-VN-HoaiMyNeural">Nữ - Hoài My (Neural)</option><option value="vi-VN-NamMinhNeural">Nam - Nam Minh (Neural)</option><option value="zh-CN-XiaoxiaoNeural">Xiaoxiao - Trung Quốc</option><option value="zh-CN-YunxiNeural">Yunxi - Trung Quốc</option><option value="en-US-JennyNeural">Jenny - English</option><option value="en-US-GuyNeural">Guy - English</option></select></div>
      </div>
      <div class="section-divider"></div>
      <div class="clone-list-heading"><h3>Danh sách giọng clone</h3><button id="settings-add-voice" class="approved-secondary-btn primary-outline" type="button">＋ Thêm giọng clone</button></div>
      <div id="saved-voices-list" class="approved-voice-list"><div class="voice-empty">Chưa có giọng clone nào.</div></div>
      <div id="clone-editor" class="clone-editor hidden">
        <div class="approved-two-col"><div class="approved-form-row compact-field"><label for="clone-voice-name">Tên giọng</label><input id="clone-voice-name" class="approved-input" placeholder="VD: Giọng của tôi"></div><div class="approved-form-row compact-field"><label>Audio mẫu 5–15 giây, chỉ một người nói</label><div class="file-inline"><button id="btn-upload-ref-audio" class="approved-secondary-btn" type="button">Chọn audio</button><span id="ref-audio-name">Chưa chọn file</span></div><audio id="ref-audio-preview" class="hidden-audio" controls></audio></div></div>
        <div id="settings-clone-clean-status" class="settings-clone-clean-status">App sẽ tự lọc ồn, cắt khoảng lặng và chuẩn hóa WAV mono 24 kHz.</div>
        <div class="approved-form-row compact-field"><label for="settings-clone-transcript">Transcript audio tham chiếu <small>(hãy kiểm tra lại)</small></label><textarea id="settings-clone-transcript" class="approved-input" rows="3" placeholder="Transcript sẽ tự xuất hiện sau khi xử lý audio"></textarea></div>
        <button id="btn-clone-voice" class="approved-primary-btn" type="button" disabled>Thêm giọng clone</button>
      </div>
      <div class="tts-controls-row"><button id="btn-test-tts" class="approved-secondary-btn" type="button">▷ Nghe thử</button><textarea id="tts-test-text" class="approved-hidden-control" tabindex="-1">Xin chào, đây là giọng đọc được tạo bởi Video Subtitle Remover.</textarea><audio id="tts-test-audio" class="tts-test-audio" controls></audio><div class="volume-control"><span>Âm lượng nhạc nền</span><span>◖</span><input id="tts-bg-volume" type="range" min="0" max="100" value="10"><span id="vol-label" class="volume-value">10%</span></div></div>
      <div class="section-divider"></div>
      <div class="approved-two-col tts-checkbox-grid"><label class="approved-check-row"><input id="tts-remove-vocal" type="checkbox"><span><strong>Xóa giọng gốc</strong><small>Loại bỏ giọng nói gốc trong video (nếu có)</small></span></label><label class="approved-check-row"><input type="checkbox" checked disabled><span><strong>Giữ nhạc nền</strong><small>Giữ lại nhạc nền gốc của video</small></span></label></div>
    </section>
  </div>

  <div class="settings-view" data-settings-view="storage">
    ${backButton('‹ Cài đặt  ›  Lưu trữ')}
    <div class="approved-page-header detail-header"><h1>Lưu trữ</h1><p>Quản lý thư mục lưu trữ và xem các tệp đầu ra được tạo ra sau khi xử lý video.</p></div>
    <section class="approved-panel storage-panel">
      <div class="approved-panel-title"><span class="panel-title-icon">DIR</span><h2>Lưu trữ</h2></div>
      <div class="approved-form-row"><label>Thư mục đầu ra</label><div class="storage-path-row"><div id="output-dir-text" class="approved-input output-path-display">Mặc định (cùng thư mục video gốc)</div><button id="btn-output-dir" class="approved-secondary-btn" type="button">▱ Chọn thư mục</button></div></div>
      <div class="current-path-block"><strong>Đường dẫn hiện tại</strong><span id="output-dir-current">Mặc định cùng thư mục video gốc</span></div>
      <div class="section-divider"></div>
      <div class="output-files-block"><h3>Các tệp đầu ra sẽ được tạo</h3><p>Sau khi xử lý, mỗi video có thể sinh ra các tệp sau trong thư mục đầu ra:</p><div class="output-file-list"><div><span class="file-icon">▣</span><strong>*_no_sub.mp4</strong><span>Video đã xóa phụ đề cháy, giữ nguyên timeline.</span></div><div><span class="file-icon">▣</span><strong>*_with_voice.mp4</strong><span>Video trung gian sau khi ghép voice theo kế hoạch xử lý.</span></div><div><span class="file-icon">▣</span><strong>*_final.mp4</strong><span>Video cuối cùng sau khi Pipeline 3 hoàn tất.</span></div></div><p class="storage-note">ⓘ Các tệp này được lưu trong thư mục đầu ra đã chọn ở trên.</p></div>
    </section>
  </div>

  <div class="settings-view" data-settings-view="system">
    ${backButton()}
    <div class="approved-page-header detail-header"><h1>Trạng thái hệ thống</h1><p>Theo dõi trạng thái các thành phần cốt lõi của hệ thống.</p></div>
    <section class="approved-panel system-panel">
      <div class="system-grid"><div class="system-service-list">
        ${serviceRow('PY','Backend Python','Xử lý tác vụ chính và điều phối hệ thống','backend-status-chip','Chưa kiểm tra','system-backend-meta','Python service')}
        ${serviceRow('GPU','GPU','Tăng tốc xử lý và mã hóa video','gpu-status-chip','Chưa kiểm tra','gpu-detail','Đang phát hiện...')}
        ${serviceRow('TTS','TTS engine','Chuyển văn bản thành giọng nói','system-tts-status-chip','Chưa kiểm tra','system-tts-meta','TTS service')}
        <div id="gpu-chip" class="approved-hidden-control"><span class="status-dot"></span><span>—</span></div><span id="cuda-version" class="approved-hidden-control">—</span>
      </div><div id="system-summary-card" class="system-summary-card"><div class="shield-mark">✓</div><h2 id="system-summary-title">Đang kiểm tra hệ thống</h2><p id="system-summary-copy">Trạng thái tổng thể sẽ cập nhật sau khi hoàn tất kiểm tra.</p></div></div>
      <button id="btn-refresh-diagnostics" class="approved-secondary-btn refresh-system-btn" type="button">↻ Kiểm tra lại</button>
    </section>
  </div>`;
  root.dataset.approvedMounted = 'true';
  ensureSidebarNote();
}

function overviewCard(target, icon, title, copy, id1, text1, id2, text2) {
  const meta = id2 ? `<div class="overview-meta"><span id="${id1}">${text1}</span><span id="${id2}">${text2}</span></div>` : `<div class="overview-meta overview-meta-single"><span id="${id1}">${text1}</span></div>`;
  return `<button class="settings-overview-card" type="button" data-settings-target="${target}"><div class="overview-card-icon">${icon}</div><div class="overview-card-body"><h2>${title}</h2><p>${copy}</p>${meta}</div><span class="overview-arrow">›</span></button>`;
}
function backButton(text='‹ Cài đặt') { return `<button class="settings-back" type="button" data-settings-target="overview">${text}</button>`; }
function serviceRow(icon,title,copy,chipId,chipText,metaId,metaText) { return `<div class="system-service-row"><div class="service-icon">${icon}</div><div class="service-copy"><h3>${title}</h3><p>${copy}</p></div><div class="service-state"><span id="${chipId}" class="status-chip">${chipText}</span><small id="${metaId}">${metaText}</small></div></div>`; }

function ensureSidebarNote() {
  const footer = document.querySelector('.sidebar-footer');
  if (!footer || footer.querySelector('.settings-shell-note')) return;
  const note = document.createElement('div');
  note.className = 'settings-shell-note';
  note.innerHTML = '<span>ⓘ</span><p>Thay đổi cài đặt sẽ được áp dụng cho các dự án mới và tác vụ tiếp theo.</p>';
  footer.prepend(note);
}

export function initSettings() {
  mountSettings();
  if (!settingsEventsBound) {
    bindShell(); bindViews(); bindProvider(); bindAi(); bindTts(); bindVoiceClone(); bindOutputDir(); bindDiagnostics();
    settingsEventsBound = true;
  }
  renderSavedVoices(); loadSettingsValues(); refreshDiagnostics();
}
window.initSettings = initSettings;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initSettings(), { once: true });
} else {
  setTimeout(() => initSettings(), 0);
}

function bindShell() {
  const app = document.querySelector('.app-container');
  const sync = () => { const on = document.getElementById('page-settings')?.classList.contains('active'); app?.classList.toggle('settings-shell-active', !!on); if (on) showView('overview'); };
  document.querySelectorAll('.nav-item').forEach(x => x.addEventListener('click', () => setTimeout(sync,0)));
  sync();
}
function bindViews() {
  document.querySelectorAll('#page-settings [data-settings-target]').forEach(x => {
    x.addEventListener('click', (e) => {
      e.preventDefault();
      showView(x.dataset.settingsTarget);
    });
  });
}

export function showView(name = 'overview') {
  mountSettings();
  const views = document.querySelectorAll('#page-settings .settings-view');
  let matched = false;
  views.forEach(v => {
    const isTarget = v.dataset.settingsView === name;
    v.classList.toggle('active', isTarget);
    if (isTarget) matched = true;
  });
  if (!matched && views.length > 0) {
    views[0].classList.add('active');
  }
  if (name === 'system') refreshDiagnostics();
  if (name === 'overview') syncOverview();
  document.querySelector('#page-settings .settings-scroll')?.scrollTo(0, 0);
}
window.showSettingsView = showView;


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

function loadProvider(provider) {
  const key=document.getElementById('ai-api-key'), model=document.getElementById('ai-model'), endpoint=document.getElementById('ai-endpoint');
  if(key) key.value='';
  if(model) model.value=localStorage.getItem(`ai_model_${provider}`)??'';
  if(endpoint) endpoint.value=provider==='ollama'?(localStorage.getItem('ai_endpoint')||'http://localhost:11434/api/chat'):'';
  renderProviderKeys(provider);
  populateCloudModels(provider, readCachedModels(provider), false);
}

function readProviderKeys(provider) {
  try {
    const raw=JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`)||'[]');
    if(!Array.isArray(raw)) return [];
    const seen=new Set();
    return raw.map(item=>typeof item==='string'?{key:item,status:'unchecked'}:item)
      .filter(item=>item&&typeof item.key==='string'&&item.key.trim())
      .map(item=>({key:item.key.trim(),status:['valid','invalid'].includes(item.status)?item.status:'unchecked',lastCheckedAt:item.lastCheckedAt||''}))
      .filter(item=>{if(seen.has(item.key))return false;seen.add(item.key);return true;});
  } catch { return []; }
}
function writeProviderKeys(provider,records){localStorage.setItem(`ai_api_keys_${provider}`,JSON.stringify(records));}
function parseKeyInput(value){return [...new Set(String(value||'').split(/[\s,;]+/).map(key=>key.trim()).filter(Boolean))];}
function addKeysFromInput(provider){
  if(!isCloud(provider))return 0;
  const input=document.getElementById('ai-api-key'),incoming=parseKeyInput(input?.value),records=readProviderKeys(provider),seen=new Set(records.map(item=>item.key));
  let added=0;
  incoming.forEach(key=>{if(!seen.has(key)){records.push({key,status:'unchecked',lastCheckedAt:''});seen.add(key);added+=1;}});
  if(added)writeProviderKeys(provider,records);
  if(input)input.value='';
  renderProviderKeys(provider);
  return added;
}
function maskKey(key){return key.length<=10?'••••••••':`${key.slice(0,5)}••••${key.slice(-4)}`;}
function renderProviderKeys(provider){
  const list=document.getElementById('ai-key-list');if(!list)return;
  const records=isCloud(provider)?readProviderKeys(provider):[];
  list.replaceChildren();
  if(!records.length){const empty=document.createElement('div');empty.className='ai-key-empty';empty.textContent=isCloud(provider)?'Chưa có key cho provider này.':'Ollama local không cần API key.';list.appendChild(empty);return;}
  records.forEach((record,index)=>{
    const row=document.createElement('div');row.className='ai-key-row';
    const mask=document.createElement('span');mask.className='ai-key-mask';mask.textContent=`Key ${index+1} · ${maskKey(record.key)}`;
    const state=document.createElement('span');state.className=`ai-key-state ${record.status==='valid'?'valid':record.status==='invalid'?'invalid':''}`;state.textContent=record.status==='valid'?'Hợp lệ':record.status==='invalid'?'Không hợp lệ':'Chưa kiểm tra';
    const remove=document.createElement('button');remove.type='button';remove.className='ai-key-delete';remove.dataset.keyIndex=String(index);remove.title='Xóa key';remove.textContent='×';
    row.append(mask,state,remove);list.appendChild(row);
  });
}
function readCachedModels(provider){try{const value=JSON.parse(localStorage.getItem(`ai_models_${provider}`)||'[]');return Array.isArray(value)?value:[];}catch{return[];}}
function populateCloudModels(provider,models,persist=true){
  if(!isCloud(provider))return;
  const clean=[...new Set((Array.isArray(models)?models:[]).map(item=>String(item||'').trim()).filter(Boolean))];
  if(persist&&clean.length)localStorage.setItem(`ai_models_${provider}`,JSON.stringify(clean));
  const list=document.getElementById('ai-model-suggestions');if(list)list.replaceChildren(...clean.map(value=>{const option=document.createElement('option');option.value=value;return option;}));
  const model=document.getElementById('ai-model'),saved=localStorage.getItem(`ai_model_${provider}`)||model?.value||'';
  if(model&&clean.length&&!clean.includes(saved))model.value=clean[0];
  const status=document.getElementById('ai-model-load-status');if(status)status.textContent=clean.length?`Đã tải ${clean.length} model từ ${providerLabel(provider)}.`:'Chưa có danh sách model. Hãy kiểm tra key.';
}
function migrateLegacy(provider) { if(legacyMigrated) return; legacyMigrated=true; if(!isCloud(provider)) return; let keys=[]; try{const p=JSON.parse(localStorage.getItem(`ai_api_keys_${provider}`)||'[]'); keys=Array.isArray(p)?p:[];}catch{} const legacy=(localStorage.getItem('ai_api_key')||'').trim(); if(!keys.length&&legacy) localStorage.setItem(`ai_api_keys_${provider}`,JSON.stringify([{key:legacy}])); if(legacy) localStorage.removeItem('ai_api_key'); }
function isCloud(p){return p==='gemini'||p==='deepseek';}

function saveSettings() {
  const p=document.getElementById('ai-provider')?.value||'gemini'; localStorage.setItem('ai_provider',p); localStorage.setItem(`ai_model_${p}`,document.getElementById('ai-model')?.value??'');
  if(isCloud(p))addKeysFromInput(p);
  if(p==='ollama') localStorage.setItem('ai_endpoint',document.getElementById('ai-endpoint')?.value.trim()||'');
  localStorage.setItem('ai_prompt',document.getElementById('ai-prompt')?.value??'');
  const enabled=document.getElementById('tts-enabled')?.checked??true, voice=document.getElementById('tts-voice')?.value||'none'; if(enabled&&voice!=='none') lastVoice=voice; localStorage.setItem('tts_voice',enabled?voice:'none');
  localStorage.setItem('tts_language',document.getElementById('tts-language')?.value||'vi'); localStorage.setItem('tts_bg_volume',document.getElementById('tts-bg-volume')?.value||'10'); localStorage.setItem('tts_remove_vocal',String(document.getElementById('tts-remove-vocal')?.checked??false)); syncOverview();
}

function bindProvider() {
  const select=document.getElementById('ai-provider'); document.querySelectorAll('.provider-btn[data-provider]').forEach(b=>b.addEventListener('click',()=>{if(!select)return;select.value=b.dataset.provider;loadProvider(select.value);updateProviderUi(select.value);syncOverview();}));
}
function updateProviderUi(provider){document.querySelectorAll('.provider-btn[data-provider]').forEach(b=>b.classList.toggle('active',b.dataset.provider===provider)); const key=document.getElementById('ai-api-key-group'), endpoint=document.getElementById('ai-endpoint-group'); if(key)key.style.display=provider==='ollama'?'none':''; if(endpoint)endpoint.style.display=provider==='ollama'?'':'none';}
function bindAi(){
  document.getElementById('btn-toggle-api-key')?.addEventListener('click',()=>{const i=document.getElementById('ai-api-key');if(i)i.type=i.type==='password'?'text':'password';});
  document.getElementById('btn-add-ai-key')?.addEventListener('click',()=>{const provider=document.getElementById('ai-provider')?.value||'gemini',added=addKeysFromInput(provider);toast(added?`Đã thêm ${added} key ${providerLabel(provider)}.`:'Không có key mới để thêm.',added?'success':'info');});
  document.getElementById('ai-key-list')?.addEventListener('click',event=>{const button=event.target.closest('[data-key-index]');if(!button)return;const provider=document.getElementById('ai-provider')?.value||'gemini',records=readProviderKeys(provider),index=Number(button.dataset.keyIndex);if(Number.isInteger(index)&&index>=0&&index<records.length){records.splice(index,1);writeProviderKeys(provider,records);renderProviderKeys(provider);syncOverview();}});
  const check=async()=>{
    const provider=document.getElementById('ai-provider')?.value||'gemini',s=document.getElementById('settings-ai-status'),button=document.getElementById('btn-check-ai');
    if(button){button.disabled=true;button.textContent='Đang kiểm tra...';}
    try{
      if(provider==='ollama'){
        const result=await window.electronAPI?.listOllamaModels(document.getElementById('ai-endpoint')?.value||'http://localhost:11434/api/chat');
        if(!result?.ok)throw new Error(result?.error||'Không kết nối được Ollama.');
        if(s)s.textContent=`Ollama sẵn sàng · ${result.models?.length||0} model local.`;
        return;
      }
      addKeysFromInput(provider);
      const records=readProviderKeys(provider);
      if(!records.length)throw new Error(`Chưa có API key ${providerLabel(provider)}.`);
      if(!window.electronAPI?.validateProviderKeys)throw new Error('Bridge kiểm tra API key chưa sẵn sàng. Hãy khởi động lại app.');
      if(s)s.textContent=`Đang kiểm tra ${records.length} key ${providerLabel(provider)}...`;
      const result=await window.electronAPI.validateProviderKeys(provider,records.map(item=>item.key));
      const checkedAt=new Date().toISOString();
      result?.results?.forEach(item=>{if(records[item.index]){records[item.index].status=item.ok?'valid':'invalid';records[item.index].lastCheckedAt=checkedAt;}});
      writeProviderKeys(provider,records);renderProviderKeys(provider);populateCloudModels(provider,result?.models||[]);
      if(!result?.ok)throw new Error(result?.error||`Không có key ${providerLabel(provider)} hợp lệ.`);
      if(s)s.textContent=`${providerLabel(provider)}: ${result.validCount} key hợp lệ, ${result.invalidCount} key lỗi · ${result.models?.length||0} model.`;
      toast('Kiểm tra key và tải model thành công.','success');
    }catch(error){if(s)s.textContent=error?.message||'Không kiểm tra được cấu hình AI.';toast(error?.message||'Kiểm tra AI thất bại.','error');}
    finally{if(button){button.disabled=false;button.textContent='⌁ Kiểm tra key & tải model';}}
  };
  document.getElementById('btn-check-ai')?.addEventListener('click',check);
  document.getElementById('btn-save-ai')?.addEventListener('click',()=>{saveSettings();addLog('Đã lưu cài đặt AI/TTS.','success');toast('Đã lưu cài đặt','success');});
  document.getElementById('settings-btn-manage-prompts')?.addEventListener('click',()=>document.getElementById('prompt-modal')?.classList.remove('hidden'));
}

function bindTts(){const vol=document.getElementById('tts-bg-volume');vol?.addEventListener('input',()=>setText('vol-label',vol.value+'%'));['tts-language','tts-bg-volume','tts-remove-vocal'].forEach(id=>document.getElementById(id)?.addEventListener('change',saveSettings)); const enabled=document.getElementById('tts-enabled'), voice=document.getElementById('tts-voice');enabled?.addEventListener('change',()=>{if(!voice)return;if(enabled.checked&&voice.value==='none'){const wanted=lastVoice!=='none'?lastVoice:'default';if([...voice.options].some(o=>o.value===wanted))voice.value=wanted;}else if(!enabled.checked){if(voice.value!=='none')lastVoice=voice.value;voice.value='none';}saveSettings();});voice?.addEventListener('change',()=>{if(voice.value!=='none'){lastVoice=voice.value;if(enabled)enabled.checked=true;}saveSettings();});document.getElementById('btn-test-tts')?.addEventListener('click',testTts);}

export function getSavedVoices(){try{return JSON.parse(localStorage.getItem('tts_voices')||'[]');}catch{return[];}}
function saveVoices(v){localStorage.setItem('tts_voices',JSON.stringify(v));}
export function renderSavedVoices(){const voices=getSavedVoices(),list=document.getElementById('saved-voices-list');if(!list)return;if(!voices.length)list.innerHTML='<div class="voice-empty">Chưa có giọng clone nào.</div>';else list.innerHTML=voices.map((v,i)=>`<div class="approved-voice-row"><div class="approved-voice-name"><span class="voice-person-icon">♙</span><span>${escapeHtml(v.name||`Giọng clone ${i+1}`)}</span></div><span class="approved-voice-lang">${escapeHtml(v.language||'Tiếng Việt')}</span><button class="voice-row-action" type="button" data-delete-voice="${i}" title="Xóa giọng">⋮</button></div>`).join('');list.querySelectorAll('[data-delete-voice]').forEach(b=>b.addEventListener('click',()=>{const a=getSavedVoices();a.splice(Number(b.dataset.deleteVoice),1);saveVoices(a);renderSavedVoices();toast('Đã xóa giọng clone','info');}));updateVoiceDropdown(voices);}
export function updateVoiceDropdown(voices){[document.getElementById('tts-voice'),document.getElementById('job-tts-voice'),document.getElementById('step1-tts-voice')].filter(Boolean).forEach(s=>{[...s.options].filter(o=>o.value.startsWith('clone:')).forEach(o=>o.remove());voices.forEach((v,i)=>{const o=document.createElement('option');o.value=`clone:${i}`;o.textContent=`Giọng clone - ${v.name||i+1}`;s.appendChild(o);});const saved=localStorage.getItem('tts_voice')||'none';if([...s.options].some(o=>o.value===saved))s.value=saved;});syncOverview();}

function bindVoiceClone() {
  const editor = document.getElementById('clone-editor');
  const upload = document.getElementById('btn-upload-ref-audio');
  const clone = document.getElementById('btn-clone-voice');
  const name = document.getElementById('clone-voice-name');
  const refName = document.getElementById('ref-audio-name');
  const preview = document.getElementById('ref-audio-preview');
  const cleanStatus = document.getElementById('settings-clone-clean-status');
  const transcriptInput = document.getElementById('settings-clone-transcript');

  document.getElementById('settings-add-voice')?.addEventListener('click', () => editor?.classList.toggle('hidden'));
  upload?.addEventListener('click', async () => {
    if (!window.electronAPI?.openFile || !window.electronAPI?.preprocessCloneAudio) {
      toast('Bộ lọc voice clone chỉ khả dụng trong app desktop', 'warn');
      return;
    }
    const result = await window.electronAPI.openFile([{ name: 'Audio', extensions: ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac', 'wma', 'opus'] }]);
    const selectedPath = result && !result.canceled && result.filePaths?.[0];
    if (!selectedPath) return;
    originalRefAudioPath = selectedPath;
    refAudioPath = null;
    referenceTranscript = null;
    referenceSelection = null;
    if (transcriptInput) transcriptInput.value = '';
    if (refName) refName.textContent = selectedPath.split(/[\\/]/).pop();
    if (clone) clone.disabled = true;
    if (upload) { upload.disabled = true; upload.textContent = 'Đang lọc…'; }
    if (cleanStatus) { cleanStatus.className = 'settings-clone-clean-status working'; cleanStatus.textContent = 'Đang lọc tạp âm và chuẩn hóa audio…'; }
    try {
      const cleaned = await window.electronAPI.preprocessCloneAudio(selectedPath, 'balanced');
      if (!cleaned?.ok || !cleaned.output_path) throw new Error(cleaned?.error || 'Không thể làm sạch audio');
      refAudioPath = cleaned.output_path;
      if (preview) {
        preview.src = `file:///${cleaned.output_path.replace(/\\/g, '/')}`;
        preview.style.display = 'block';
      }
      if (cleanStatus) { cleanStatus.className = 'settings-clone-clean-status working'; cleanStatus.textContent = 'Audio đã sạch. Đang nhận dạng transcript tham chiếu…'; }
      const transcriptResult = await window.api.transcribeVoiceReference(cleaned.output_path, document.getElementById('tts-language')?.value || 'vi');
      if (transcriptResult?.status !== 'ok' || !transcriptResult.transcript?.trim()) throw new Error(transcriptResult?.error || 'Không bóc được transcript audio mẫu');
      if (transcriptResult.audio_path) {
        refAudioPath = transcriptResult.audio_path;
        if (preview) preview.src = `file:///${transcriptResult.audio_path.replace(/\\/g, '/')}`;
      }
      referenceTranscript = transcriptResult.transcript.trim();
      referenceSelection = transcriptResult.selected_trimmed ? { start: transcriptResult.selected_start, end: transcriptResult.selected_end, score: transcriptResult.selected_score } : null;
      if (transcriptInput) transcriptInput.value = referenceTranscript;
      const duration = Number(cleaned.output?.duration_seconds || 0).toFixed(1);
      if (cleanStatus) {
        cleanStatus.className = `settings-clone-clean-status ${cleaned.warning ? 'warn' : 'success'}`;
        const breathInfo = Number(transcriptResult.breath_intervals || 0) > 0 ? ` · giảm hơi thở ${transcriptResult.breath_reduction_db || 14} dB (${transcriptResult.breath_intervals} khoảng)` : '';
        const selectionInfo = transcriptResult.selected_trimmed ? ` · chọn đoạn tốt nhất ${Number(transcriptResult.selected_start).toFixed(1)}–${Number(transcriptResult.selected_end).toFixed(1)}s` : '';
        cleanStatus.textContent = `Đã làm sạch, giảm hơi thở và xác nhận transcript · WAV mono 24 kHz · ${duration}s${selectionInfo}${breathInfo}${cleaned.warning ? ` · ${cleaned.warning}` : ''}`;
      }
      if (clone) clone.disabled = false;
    } catch (error) {
      if (cleanStatus) { cleanStatus.className = 'settings-clone-clean-status error'; cleanStatus.textContent = error?.message || 'Không thể làm sạch audio'; }
      toast(error?.message || 'Không thể làm sạch audio', 'error');
    } finally {
      if (upload) { upload.disabled = false; upload.textContent = 'Chọn audio'; }
    }
  });

  clone?.addEventListener('click', async () => {
    const voiceName = name?.value.trim();
    referenceTranscript = transcriptInput?.value.trim() || referenceTranscript;
    if (!voiceName) { toast('Nhập tên giọng', 'warn'); return; }
    if (!refAudioPath) { toast('Chọn và làm sạch audio mẫu trước', 'warn'); return; }
    if (!referenceTranscript) { toast('Transcript audio tham chiếu không được để trống', 'warn'); transcriptInput?.focus(); return; }
    clone.disabled = true;
    clone.textContent = 'Đang tạo giọng...';
    try {
      const lang = document.getElementById('tts-language')?.value || 'vi';
      const result = await window.api.generateTTS('Xin chào, đây là mẫu giọng được clone.', refAudioPath, lang, null, referenceTranscript);
      if (result?.status !== 'ok' || !result.audio_path) throw new Error(result?.error || 'Không tạo được mẫu giọng');
      const voices = getSavedVoices();
      voices.push({ name: voiceName, language: langLabel(lang), audioPath: refAudioPath, audioFile: refAudioPath.split(/[\\/]/).pop(), sourceAudioPath: originalRefAudioPath, cleanProfile: 'balanced', referenceTranscript, referenceTranscriptSource: 'user-confirmed', breathSuppressed: true, bestSegmentSelected: true, breathReductionDb: 14, referenceStart: referenceSelection?.start ?? null, referenceEnd: referenceSelection?.end ?? null, referenceQualityScore: referenceSelection?.score ?? null, samplePath: result.audio_path, date: new Date().toLocaleDateString('vi-VN') });
      saveVoices(voices);
      renderSavedVoices();
      name.value = '';
      refAudioPath = null;
      originalRefAudioPath = null;
      referenceTranscript = null;
      referenceSelection = null;
      if (refName) refName.textContent = 'Chưa chọn file';
      if (preview) { preview.removeAttribute('src'); preview.style.display = 'none'; }
      if (transcriptInput) transcriptInput.value = '';
      if (cleanStatus) { cleanStatus.className = 'settings-clone-clean-status'; cleanStatus.textContent = 'App sẽ tự lọc ồn, cắt khoảng lặng và chuẩn hóa WAV mono 24 kHz.'; }
      editor?.classList.add('hidden');
      toast('Đã thêm giọng clone từ audio đã làm sạch', 'success');
    } catch (error) {
      toast(error.message || 'Không thể clone giọng', 'error');
    } finally {
      clone.disabled = !refAudioPath;
      clone.textContent = 'Thêm giọng clone';
    }
  });
}
async function testTts(){const b=document.getElementById('btn-test-tts'),audio=document.getElementById('tts-test-audio'),voice=document.getElementById('tts-voice')?.value||'default';let ref=null,refText=null;if(voice.startsWith('clone:')){const saved=getSavedVoices()[Number(voice.split(':')[1])];ref=saved?.audioPath||null;refText=saved?.referenceTranscriptSource?saved?.referenceTranscript||null:null;}b.disabled=true;b.textContent='Đang tạo...';try{const r=await window.api.generateTTS(document.getElementById('tts-test-text')?.value.trim()||'Xin chào',ref,document.getElementById('tts-language')?.value||'vi',voice,refText);if(r?.status==='ok'&&r.audio_path&&audio){audio.src='file:///'+r.audio_path.replace(/\\/g,'/');audio.style.display='block';await audio.play();}else throw new Error(r?.error||'Không tạo được audio thử');}catch(e){toast(e.message||'Không thể phát thử giọng','error');}finally{b.disabled=false;b.textContent='▷ Nghe thử';}}

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
