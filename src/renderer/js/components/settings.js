/**
 * Settings Component
 * Quáº£n lÃ½ trang CÃ i Ä‘áº·t: load/save AI provider state, TTS config, output directory,
 * voice clone management, diagnostics, and TTS status.
 */

import { state } from '../store.js';
import { addLog, showToast } from '../utils/logger.js';

let _legacyMigrationDone = false;

// â”€â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function initSettings() {
  _ensureSettingsLayout();
  _bindProviderControls();
  _bindVolSlider();
  _bindSaveButton();
  _bindVoiceClone();
  _bindTestTts();
  _bindDiagnostics();
  renderSavedVoices();
  loadSettingsValues();
  _refreshDiagnostics();
}

// â”€â”€â”€ Settings layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function _ensureSettingsLayout() {
  const scroll = document.querySelector('#page-settings .settings-scroll');
  if (!scroll || scroll.dataset.settingsV1Ready === 'true') return;

  const cards = Array.from(scroll.children).filter(el => el.classList?.contains('settings-card'));
  if (cards.length < 3) return;

  const aiCard = cards[0];
  const generalCard = cards[1];
  const diagnosticsCard = cards[2];
  const get = (id) => document.getElementById(id);
  const group = (id) => get(id)?.closest('.form-group');

  const providerGroup = group('ai-provider');
  const apiKeyGroup = group('ai-api-key');
  const endpointGroup = group('ai-endpoint');
  const saveButton = get('btn-save-ai');

  if (!providerGroup || !apiKeyGroup || !endpointGroup || !saveButton) return;

  const modelGroup = document.createElement('div');
  modelGroup.className = 'form-group';
  modelGroup.id = 'ai-model-group';
  modelGroup.innerHTML = `
    <label class="form-label">Model</label>
    <input type="text" id="ai-model" class="form-input" placeholder="VD: gemini-2.5-flash, deepseek-chat, qwen2.5:14b">
  `;

  apiKeyGroup.id = 'ai-api-key-group';
  endpointGroup.id = 'ai-endpoint-group';
  get('ai-api-key').placeholder = 'Nháº­p API key cho nhÃ  cung cáº¥p cloud...';
  get('ai-endpoint').placeholder = 'VD: http://localhost:11434/api/chat';

  aiCard.replaceChildren();
  aiCard.dataset.settingsRole = 'ai-provider';
  aiCard.append(
    _heading('ğŸ¤– AI Provider'),
    providerGroup,
    apiKeyGroup,
    modelGroup,
    endpointGroup,
    saveButton,
  );

  const ttsStatusGroup = group('tts-status-chip');
  const voiceGroup = group('tts-voice');
  const languageGroup = group('tts-language');
  const bgVolumeGroup = group('tts-bg-volume');
  const removeVocalGroup = get('tts-remove-vocal')?.closest('.form-group');

  const pipelineCard = document.createElement('div');
  pipelineCard.className = 'settings-card';
  pipelineCard.dataset.settingsRole = 'pipeline1-defaults';
  pipelineCard.append(_heading('ğŸ¤ Pipeline 1 Defaults'));
  [ttsStatusGroup, voiceGroup, languageGroup, bgVolumeGroup, removeVocalGroup]
    .filter(Boolean)
    .forEach(node => pipelineCard.append(node));

  const cloneNameGroup = group('clone-voice-name');
  const refAudioGroup = get('btn-upload-ref-audio')?.closest('.form-group');
  const cloneButton = get('btn-clone-voice');
  const savedVoices = get('saved-voices-list');
  const testTextGroup = get('tts-test-text')?.closest('.form-group');
  const testRow = get('btn-test-tts')?.closest('.tts-test-row');

  const voiceCard = document.createElement('div');
  voiceCard.className = 'settings-card';
  voiceCard.dataset.settingsRole = 'voice-cloning';
  voiceCard.append(
    _heading('ğŸ§¬ Voice Cloning'),
    _desc('Upload audio máº«u 3â€“15 giÃ¢y Ä‘á»ƒ táº¡o vÃ  thá»­ giá»ng clone.'),
  );
  [cloneNameGroup, refAudioGroup, cloneButton].filter(Boolean).forEach(node => voiceCard.append(node));
  voiceCard.append(_divider(), _subheading('ğŸ“‹ Giá»ng Ä‘Ã£ lÆ°u'));
  if (savedVoices) voiceCard.append(savedVoices);
  voiceCard.append(_divider(), _subheading('ğŸ”Š Thá»­ giá»ng'));
  [testTextGroup, testRow].filter(Boolean).forEach(node => voiceCard.append(node));

  const generalHeading = generalCard.querySelector('h3');
  if (generalHeading) generalHeading.textContent = 'âš™ï¸ General';
  generalCard.dataset.settingsRole = 'general';

  const diagnosticsHeading = diagnosticsCard.querySelector('h3');
  if (diagnosticsHeading) diagnosticsHeading.textContent = 'ğŸ–¥ System / Diagnostics';
  diagnosticsCard.dataset.settingsRole = 'system-diagnostics';

  const backendRow = document.createElement('div');
  backendRow.className = 'setting-row';
  backendRow.innerHTML = `
    <div><span class="form-label">Backend</span><br><span class="form-desc">Python service</span></div>
    <span class="status-chip" id="backend-status-chip">ChÆ°a kiá»ƒm tra</span>
  `;

  const gpuStatusRow = document.createElement('div');
  gpuStatusRow.className = 'setting-row';
  gpuStatusRow.innerHTML = `
    <div><span class="form-label">Compute</span><br><span class="form-desc">GPU / CPU runtime</span></div>
    <span class="status-chip" id="gpu-status-chip">ChÆ°a kiá»ƒm tra</span>
  `;

  const refreshButton = document.createElement('button');
  refreshButton.id = 'btn-refresh-diagnostics';
  refreshButton.className = 'btn btn-outline';
  refreshButton.textContent = 'â†» LÃ m má»›i cháº©n Ä‘oÃ¡n';
  refreshButton.style.marginTop = '12px';

  const firstHardwareRow = diagnosticsCard.querySelector('.setting-row');
  if (firstHardwareRow) {
    diagnosticsCard.insertBefore(gpuStatusRow, firstHardwareRow);
    diagnosticsCard.insertBefore(backendRow, gpuStatusRow);
  } else {
    diagnosticsCard.append(backendRow, gpuStatusRow);
  }
  diagnosticsCard.append(refreshButton);

  scroll.append(generalCard, aiCard, pipelineCard, voiceCard, diagnosticsCard);
  scroll.dataset.settingsV1Ready = 'true';
}

function _heading(text) {
  const h = document.createElement('h3');
  h.textContent = text;
  return h;
}

function _subheading(text) {
  const h = document.createElement('h3');
  h.textContent = text;
  return h;
}

function _desc(text) {
  const p = document.createElement('p');
  p.className = 'form-desc';
  p.style.marginBottom = '8px';
  p.textContent = text;
  return p;
}

function _divider() {
  const div = document.createElement('div');
  div.className = 'form-divider';
  return div;
}

// â”€â”€â”€ Load / Save Settings Values â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€()•áÁ½ÉĞ™Õ¹Ñ¥½¸±½…‘M•ÑÑ¥¹ÍY…±Õ•Ì ¤ì(€}•¹ÍÕÉ•M•ÑÑ¥¹Í1…å½ÕĞ ¤ì(€½¹ÍĞ•Ğ€ô€¡¥¤€ôø‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å%¡¥¤ì((€½¹ÍĞÁÉ½Ù¥‘•È€ô±½…±MÑ½É…”¹•Ñ%Ñ•´ …¥}ÁÉ½Ù¥‘•Èœ¤ñğ€•µ¥¹¤œì(€}µ¥É…Ñ•1•…åÁ¥-•å=¹”¡ÁÉ½Ù¥‘•È¤ì((€½¹ÍĞ…¥AÉ½Ù¥‘•È€ô•Ğ …¤µÁÉ½Ù¥‘•Èœ¤ì(€½¹ÍĞÑÑÍY½¥”€ô•Ğ ÑÑÌµÙ½¥”œ¤ì(€½¹ÍĞÑÑÍ1…¹œ€ô•Ğ ÑÑÌµ±…¹Õ…”œ¤ì(€½¹ÍĞÑÑÍ	Y½°€ô•Ğ ÑÑÌµ‰œµÙ½±Õµ”œ¤ì(€½¹ÍĞÙ½±1…‰•°€ô•Ğ Ù½°µ±…‰•°œ¤ì(€½¹ÍĞÉ•µ½Ù•Y½…°€ô•Ğ ÑÑÌµÉ•µ½Ù”µÙ½…°œ¤ì(€½¹ÍĞ½ÕÑÁÕÑ¥È€ô•Ğ ½ÕÑÁÕĞµ‘¥ÈµÑ•áĞœ¤ì((€¥˜€¡…¥AÉ½Ù¥‘•È¤…¥AÉ½Ù¥‘•È¹Ù…±Õ”€ôÁÉ½Ù¥‘•Èì(€}±½…‘AÉ½Ù¥‘•É¥•±‘Ì¡ÁÉ½Ù¥‘•È¤ì(€}ÕÁ‘…Ñ•AÉ½Ù¥‘•ÉY¥Í¥‰¥±¥Ñä¡ÁÉ½Ù¥‘•È¤ì((€¥˜€¡ÑÑÍY½¥”¤ÑÑÍY½¥”¹Ù…±Õ”€ô±½…±MÑ½É…”¹•Ñ%Ñ•´ ÑÑÍ}Ù½¥”œ¤ñğ€¹½¹”œì(€¥˜€¡ÑÑÍ1…¹œ¤ÑÑÍ1…¹œ¹Ù…±Õ”€ô±½…±MÑ½É…”¹•Ñ%Ñ•´ ÑÑÍ}±…¹Õ…”œ¤ñğ€Ù¤œì(€¥˜€¡É•µ½Ù•Y½…°¤É•µ½Ù•Y½…°¹¡•­•€ô±½…±MÑ½É…”¹•Ñ%Ñ•´ ÑÑÍ}É•µ½Ù•}Ù½…°œ¤€ôôô€ÑÉÕ”œì(€¥˜€¡ÑÑÍ	Y½°¤ì(€€€ÑÑÍ	Y½°¹Ù…±Õ”€ô±½…±MÑ½É…”¹•Ñ%Ñ•´ ÑÑÍ}‰}Ù½±Õµ”œ¤ñğ€œÄÀœì(€€€¥˜€¡Ù½±1…‰•°¤Ù½±1…‰•°¹Ñ•áÑ½¹Ñ•¹Ğ€ôÑÑÍ	Y½°¹Ù…±Õ”€¬€œ”œì(€ô(€¥˜€¡½ÕÑÁÕÑ¥È¤ì(€€€½¹ÍĞ‘¥È€ôÍÑ…Ñ”¹½ÕÑÁÕÑ¥Èñğ±½…±MÑ½É…”¹•Ñ%Ñ•´ ½ÕÑÁÕÑ}‘¥Èœ¤ñğ€œœì(€€€½ÕÑÁÕÑ¥È¹Ñ•áÑ½¹Ñ•¹Ğ€ô‘¥Èñğ€7†êŸŒƒG†î-¹ €¡å¹œÑ£À·†î•ŒÙ¥‘•¼Ÿ†îEŒ¤œì(€ô((€ÕÁ‘…Ñ•Y½¥•É½Á‘½İ¸¡•ÑM…Ù•‘Y½¥•Ì ¤¤ì)ô()™Õ¹Ñ¥½¸}±½…‘AÉ½Ù¥‘•É¥•±‘Ì¡ÁÉ½Ù¥‘•È¤ì(€½¹ÍĞ…Á¥-•ä€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …¤µ…Á¤µ­•äœ¤ì(€½¹ÍĞµ½‘•°€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …¤µµ½‘•°œ¤ì(€½¹ÍĞ•¹‘Á½¥¹Ğ€ô‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å% …¤µ•¹‘Á½¥¹Ğœ¤ì((€¥˜€¡…Á¥-•ä¤…Á¥-•ä¹Ù…±Õ”€ô}¥Í±½Õ‘AÉ½Ù¥‘•È¡ÁÉ½Ù¥‘•È¤€ü}É•…‘AÉ½Ù¥‘•É-•ä¡ÁÉ½Ù¥‘•È¤€è€œœì(€¥˜€¡µ½‘•°¤µ½‘•°¹Ù…±Õ”€ô±½…±MÑ½É…”¹•Ñ%Ñ•´¡…¥}µ½‘•±|‘íÁÉ½Ù¥‘•Éõ€¤€üü€œœì(€¥˜€¡•¹‘Á½¥¹Ğ¤•¹‘Á½¥¹Ğ¹Ù…±Õ”€ôÁÉ½Ù¥‘•È€ôôô€½±±…µ„œ€ü€¡±½…±MÑ½É…”¹•Ñ%Ñ•´ …¥}•¹‘Á½¥¹Ğœ¤ñğ€œœ¤€è€œœì)ô()™Õ¹Ñ¥½¸}É•…‘AÉ½Ù¥‘•É-•ä¡ÁÉ½Ù¥‘•È¤ì(€ÑÉäì(€€€½¹ÍĞÙ…±Õ•Ì€ô)M=8¹Á…ÉÍ”¡±½…±MÑ½É…”¹•Ñ%Ñ•´¡…¥}…Á¥}­•åÍ|‘íÁÉ½Ù¥‘•Éõ€¤ñğ€mtœ¤ì(€€€½¹ÍĞ™¥ÉÍĞ€ôÉÉ…ä¹¥ÍÉÉ…ä¡Ù…±Õ•Ì¤€üÙ…±Õ•ÍlÁt€è¹Õ±°ì(€€€É•ÑÕÉ¸ÑåÁ•½˜™¥ÉÍĞ€ôôô€ÍÑÉ¥¹œœ€ü™¥ÉÍĞ€è€¡™¥ÉÍĞü¹­•äñğ€œœ¤ì(€ô…Ñ ì(€€€É•ÑÕÉ¸€œœì(€ô)ô()™Õ¹Ñ¥½¸}µ¥É…Ñ•1•…åÁ¥-•å=¹”¡ÁÉ½Ù¥‘•È¤ì(€¥˜€¡}±•…å5¥É…Ñ¥½¹½¹”¤É•ÑÕÉ¸ì(€}±•…å5¥É…Ñ¥½¹½¹”€ôÑÉÕ”ì(€¥˜€ …}¥Í±½Õ‘AÉ½Ù¥‘•È¡ÁÉ½Ù¥‘•È¤¤É•ÑÕÉ¸ì((€±•ĞÁÉ½Ù¥‘•É-•åÌ€ômtì(€ÑÉäì(€€€½¹ÍĞÁ…ÉÍ•€ô)M=8¹Á…ÉÍ”¡±½…±MÑ½É…”¹•Ñ%Ñ•´¡…¥}…Á¥}­•åÍ|‘íÁÉ½Ù¥‘•Éõ€¤ñğ€mtœ¤ì(€€€ÁÉ½Ù¥‘•É-•åÌ€ôÉÉ…ä¹¥ÍÉÉ…ä¡Á…ÉÍ•¤€üÁ…ÉÍ•€èmtì(€ô…Ñ ì(€€€ÁÉ½Ù¥‘•É-•åÌ€ômtì(€ô((€¥˜€¡ÁÉ½Ù¥‘•É-•åÌ¹±•¹Ñ €ø€À¤É•ÑÕÉ¸ì((€½¹ÍĞ±•…ä€ô€¡±½…±MÑ½É…”¹•Ñ%Ñ•´ …¥}…Á¥}­•äœ¤ñğ€œœ¤¹ÑÉ¥´ ¤ì(€¥˜€¡±•…ä¤ì(€€€±½…±MÑ½É…”¹Í•Ñ%Ñ•´¡…¥}…Á¥}­•åÍ|‘íÁÉ½Ù¥‘•Éõ€°)M=8¹ÍÑÉ¥¹¥™ä¡mì­•äè±•…äõt¤¤ì(€€€±½…±MÑ½É…”¹É•µ½Ù•%Ñ•´ …¥}…Á¥}­•äœ¤ì(€ô)ô()™Õ¹Ñ¥½¸}Í…Ù•±±M•ÑÑ¥¹Ì ¤ì(€½¹ÍĞ•Ğ€ô€¡¥¤€ôø‘½Õµ•¹Ğ¹•Ñ±•µ•¹Ñ	å%¡¥¤ì(€½¹ÍĞÙ…°€ô€¡¥¤€ôø•Ğ¡¥¤ü¹Ù…±Õ”€üü€œœì(€½¹ÍĞ¡¬€ô€¡¥¤€ôø•Ğ¡¥¤ü¹¡•­•€üü™…±Í”ì((€½¹ÍĞÁÉ½Ù¥‘•È€ôÙ…° …¤µÁÉ½Ù¥‘•Èœ¤ñğ€•µ¥¹¤œì(€½¹ÍĞµ½‘•°€ôÙ…° …¤µµ½‘•°œ¤ì(€±½…±MÑ½É…”¹Í•Ñ%Ñ•´ …¥}ÁÉ½Ù¥‘•Èœ°ÁÉ½Ù¥‘•È¤ì(€±½…±MÑ½É…”¹Í•Ñ%Ñ•´¡…¥}µ½‘•±|‘íÁÉ½Ù¥‘•Éõ€°µ½‘•°¤ì((€¥˜€¡}¥Í±½Õ‘AÉ½Ù¥‘•È¡ÁÉ½Ù¥‘•È¤¤ì(€€€½¹ÍĞ­•ä€ôÙ…° …¤µ…Á¤µ­•äœ¤¹ÑÉ¥´ ¤ì(€€€½¹ÍĞ­•åÌ€ô­•ä€üíl­•äõt€èmtì(€€€±½…±MÑ½É…”¹Í•Ñ%Ñ•´¡…¥}…Á¥}­•åÍ|‘íÁÉ½Ù¥‘•Éõ€°)M=8¹ÍÑÉ¥¹¥™ä¡­•åÌ¤¤ì(€ô((€¥˜€¡ÁÉ½Ù¥‘•È€ôôô€½±±…µ„œ¤ì(€€€±½…±MÑ½É…”¹Í•Ñ%Ñ•´ …¥}•¹‘Á½¥¹Ğœ°