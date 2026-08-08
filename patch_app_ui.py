import re
import sys

app_js_path = r"e:\Project AI\Video-sub-remove\src\renderer\js\app.js"
with open(app_js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove updateAiUiVisibility and all the cloud/ollama keys functions
# We'll just replace the whole section between `function getAiKeys(provider)` 
# and `if (el.btnAddOllamaModel)` with a much simpler block.

start_marker = "function getAiKeys(provider) {"
end_marker = "if (el.btnSaveAi) {"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers in app.js")
    sys.exit(1)

new_settings_code = """
  // Simply load settings
  function loadSettingsValues() {
    if (el.aiProvider) el.aiProvider.value = localStorage.getItem('ai_provider') || 'gemini';
    
    const apiKey = document.getElementById('ai-api-key');
    if (apiKey) apiKey.value = localStorage.getItem('ai_api_key') || '';
    
    if (el.aiEndpoint) el.aiEndpoint.value = localStorage.getItem('ai_endpoint') || '';
    if (el.ttsVoice) el.ttsVoice.value = localStorage.getItem('tts_voice') || 'none';
    if (el.ttsLanguage) el.ttsLanguage.value = localStorage.getItem('tts_language') || 'vi';
    if (el.ttsBgVolume) {
      el.ttsBgVolume.value = localStorage.getItem('tts_bg_volume') || '10';
      if (el.volLabel) el.volLabel.textContent = el.ttsBgVolume.value + '%';
    }
    if (el.ttsRemoveVocal) el.ttsRemoveVocal.checked = localStorage.getItem('tts_remove_vocal') === 'true';
  }

  if (el.aiProvider) {
    el.aiProvider.addEventListener('change', () => {
      localStorage.setItem('ai_provider', el.aiProvider.value);
    });
  }

  if (el.ttsBgVolume) {
    el.ttsBgVolume.addEventListener('input', (e) => {
      if (el.volLabel) el.volLabel.textContent = e.target.value + '%';
    });
  }

  """

content = content[:start_idx] + new_settings_code + content[end_idx:]

# Rewrite btnSaveAi logic
save_marker_start = "if (el.btnSaveAi) {"
save_marker_end = "  // ΓöÇΓöÇΓöÇ TTS Voice Clone Management"

s_idx = content.find(save_marker_start)
e_idx = content.find(save_marker_end)

new_save_code = """if (el.btnSaveAi) {
    el.btnSaveAi.addEventListener('click', () => {
      const provider = el.aiProvider ? el.aiProvider.value : 'gemini';
      localStorage.setItem('ai_provider', provider);
      
      const apiKey = document.getElementById('ai-api-key');
      if (apiKey) localStorage.setItem('ai_api_key', apiKey.value);
      
      if (el.aiEndpoint) localStorage.setItem('ai_endpoint', el.aiEndpoint.value);
      if (el.ttsVoice) localStorage.setItem('tts_voice', el.ttsVoice.value);
      if (el.ttsLanguage) localStorage.setItem('tts_language', el.ttsLanguage.value);
      if (el.ttsBgVolume) localStorage.setItem('tts_bg_volume', el.ttsBgVolume.value);
      if (el.ttsRemoveVocal) localStorage.setItem('tts_remove_vocal', el.ttsRemoveVocal.checked);
      
      addLog('Đã lưu cấu hình AI & TTS!', 'success');
      showToast('Đã lưu cài đặt!', 'success');
    });
  }

"""

content = content[:s_idx] + new_save_code + content[e_idx:]

with open(app_js_path, "w", encoding="utf-8") as f:
    f.write(content)
print("app.js updated successfully")
