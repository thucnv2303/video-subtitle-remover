# RECOVERY-007D: AI Settings & Model Discovery Forensic Preflight

## 1. Git basis and dirty state
- **Branch**: `rescue/wip-20260803`
- **HEAD**: `d67a427`
- **Dirty State**: `api/server.py`, `src/renderer/js/app.js`, `index.html` and other files have modified/untracked changes from previous tasks.

## 2. Screenshot symptom summary
- Provider selector exists.
- Gemini is selectable.
- One combined field labeled "API Key / Tên Model (Ollama)" exists.
- Ollama endpoint field exists.
- No scan/refresh-model button is visible.
- No discovered-model dropdown/list is visible.
- No model connection status or scan result is visible.

## 3. Current UI element map
- **Provider selector**: `<select id="ai-provider">` (index.html:629)
- **API key / Model input**: `<input type="password" id="ai-api-key">` (index.html:637)
- **Endpoint input**: `<input type="text" id="ai-endpoint">` (index.html:641)
- **Model dropdown**: NOT FOUND.
- **Scan button**: NOT FOUND.
- **Connection-test button**: NOT FOUND.
- **Save-settings button**: `<button id="btn-save-ai">` (index.html:681)
- **Voice/TTS controls**: Shared save handler (`#tts-voice`, `#tts-language`, `#tts-bg-volume`, `#tts-remove-vocal`).

## 4. Current binding map
- **#ai-provider**: Bound in `app.js` (saves to localStorage on change).
- **#ai-api-key**: Saved on `#btn-save-ai` click.
- **#ai-endpoint**: Saved on `#btn-save-ai` click.
- **#btn-save-ai**: Bound in `app.js` to save all fields above and TTS settings to localStorage.

## 5. Current persistence/localStorage map
- `ai_provider`
- `ai_api_key`
- `ai_endpoint`
- `tts_voice`
- `tts_language`
- `tts_bg_volume`
- `tts_remove_vocal`

## 6. Current frontend API map
No frontend functions exist for scanning Ollama models or calling `/api/tags`.

## 7. Current backend provider/model map
- **Listing Ollama models**: NOT FOUND.
- **Calling Ollama /api/tags**: NOT FOUND.
- **Validating Ollama endpoint**: NOT FOUND.
- **Validating Gemini key/model**: NOT FOUND.
- **Returning Gemini models**: NOT FOUND.
- **Testing provider connection**: NOT FOUND.
*Note: Backend only directly calls `generateContent` for Gemini during the actual process route.*

## 8. Recovery snapshot findings
The trusted recovery snapshot (`E:\Project AI\_recovery\Video-sub-remove-20260803-212834`) contains NO HTML, NO JavaScript logic, and NO backend logic for the scan/select model workflow. It only contains the same combined "API Key / Tên Model" field.

## 9. Git-history findings
Searches across all commits and branches for `btn-scan-ollama`, `btn-refresh-model`, `scan models`, and `ai_model` yield NO results. The implementation was never committed to the repository.

## 10. Backup/untracked findings
- `src/renderer/js/app.backup.js` and `src/renderer/js/utils/dom.js` contain partial DOM bindings (e.g., `btnScanOllama: $('#btn-scan-ollama')`, `ollamaModelSelect: $('#ollama-model-select')`).
- However, NO event listeners or actual logic for scanning models exist in these files. They are just incomplete scaffolds.
- `patch_app_ui.py` intentionally removed older cloud/ollama keys functions and replaced them with the current simplified save block, confirming that whatever existed was explicitly stripped.

## 11. Exact point where functionality was lost or disconnected
The functionality never existed in a complete state in the tracked repository. It appears to have been an incomplete local experiment or scaffolding in untracked files (`app.backup.js`) that was later wiped out by `patch_app_ui.py`.

## 12. Whether current HTML and JS are mismatched
Currently, HTML and JS are structurally matched in their *broken/simplified* state: both use the generic `#ai-api-key` field for both API Keys and Ollama Models, and neither has scan buttons. However, they are mismatched with the owner's *expected* UX.

## 13. ASR vs AI rewrite vs TTS dependency separation
- **ASR**: Uses local Whisper via `api_extract_srt` (Pipeline 1). Only requires video and language. Completely independent of the AI provider/model settings.
- **AI Rewrite**: Requires a valid AI Provider, API Key/Endpoint, and Model to function.
- **TTS**: Independent of AI rewrite. Relies on its own endpoints and configurations (`tts_voice`, `tts_language`).

## 14. Best recovery source
None. There is no prior complete implementation to recover.

## 15. Exact proposed files and symbols for repair
Since we must recreate it:
- `src/renderer/index.html`: Update the AI settings card to separate API Key and Model fields, add a "Scan" button for Ollama, and a Model dropdown.
- `src/renderer/js/app.js`: Implement `fetch(aiEndpoint + '/api/tags')` to populate the model dropdown and handle UI toggles.
- `api/server.py`: No changes strictly required if frontend queries Ollama directly, but a proxy endpoint could avoid CORS issues.

## 16. Files that must not be edited
- ASR logic in `app.js`, `api.js`, `server.py`
- Pipeline 2 logic

## 17. Risks to RECOVERY-007 and Pipeline 2
Low risk. Updating the settings UI and its save bindings does not interfere with the ASR extraction logic or Pipeline 2 job processing, provided we properly decouple the variables (e.g., separating `ai_api_key` and `ai_model`).

## 18. Static verification plan
- Verify `index.html` structure.
- Run `node -c src/renderer/js/app.js` after edits.
- Ensure `#btn-save-ai` correctly persists decoupled variables to `localStorage`.

## 19. Owner verification plan
- Owner selects "Ollama", inputs endpoint, clicks "Scan".
- Verifies model list populates.
- Owner saves settings and verifies variables are preserved on reload.

## 20. Final recovery decision
**C. RECREATE MINIMAL MODEL DISCOVERY UI**
No complete prior implementation exists. We must propose a minimal design (Provider = Google Gemini vs Ollama separation, endpoint input, scan button, model dropdown) and implement it from scratch when approved.
