# RECOVERY-007E-REBUILD-001 Preflight Report

## Source Control Summary
- **Local Branch**: rescue/wip-20260803
- **HEAD**: d67a427f1c90a2e98da560977736ead80637db3a
- **Dirty-tree state**: The working tree has modifications to application source (e.g., `api/server.py`, `src/renderer/index.html`, `src/renderer/js/app.js`, `src/renderer/js/api.js`, etc.) which are preserved but unstaged.

## Current Source Map
- **AI settings HTML**: `src/renderer/index.html`
- **Settings event binding**: `src/renderer/js/app.js` and `src/renderer/js/components/settings.js`
- **Settings persistence**: `src/renderer/js/components/settings.js` (using plaintext `localStorage` keys like `ai_provider`, `ai_api_key`, `ai_endpoint`).
- **Pipeline 1 AI config construction**: `src/renderer/js/app.js`
- **AI rewrite request construction**: `api/server.py` (`api_ai_rewrite`, expects `AIRewriteReq`)
- **Video-analysis request construction**: `api/server.py` (`api_analyze_video`, expects `AnalyzeVideoReq`)
- **Backend model-discovery support**: Not natively present in current canonical source for AI models.
- **Backend provider/model contract**: `api/server.py` expects an `ai_config` dict containing `provider`, `api_keys` (or `api_key`), `endpoint`, and `model`.

## Historical Candidate Matrix
- **Original multi-provider table**: NOT FOUND.
- **Exact recovery source for the table**: NOT FOUND. The feature described by the owner is an expected/desired design, not a previously existing one that was lost. The invalid RECOVERY-007E patch (`INCIDENT-RECOVERY-007E-001`) attempted to add a scanner but mixed models and API keys poorly.

## Existing Contracts
- **Frontend storage contract**: Plaintext `localStorage` (`ai_provider`, `ai_api_key`, `ai_endpoint`). (Note: Will not migrate plaintext storage during this fix, but will organize keys).
- **Frontend-to-backend payload contract**: JSON payloads with an `ai_config` object.
- **Backend provider/model contract**: `AnalyzeVideoReq` and `AIRewriteReq` parse `req.ai_config`.

## Defects Causing BUG-008 and BUG-009
- **BUG-008**: The HTML input `ai-api-key` is used for both provider API keys and Ollama model names (e.g., placeholder "Nhập API Key hoặc tên model (VD: gemma4:12b)"). There is no UI to scan or select models explicitly.
- **BUG-009**: The backend loosely reads `model` or `api_key` depending on the provider, treating the Ollama model name effectively as an API key entry.

## Proposed Implementation Scope
**Minimal changed-file list**:
- `src/renderer/index.html`: Update settings UI to separate Paid Providers from Local Ollama. Add model scan button and dropdown for Ollama.
- `src/renderer/js/components/settings.js`: Add event listeners for model scanning and UI toggling.
- `src/renderer/js/api.js`: Add API method to fetch Ollama models.
- `src/renderer/js/app.js`: Update `ai_config` payload construction to read from the new UI structure.
- `api/server.py`: Add `/api/ai/models` endpoint for Ollama model discovery via `/api/tags`. Handle `ai_config` cleanly.

**Explicit untouched-file list**:
- `src/renderer/js/pipelines/pipeline2-remove.js`
- `api/tts_engine.py`
- All other Pipeline 1 modules not explicitly listed above.

## Preservation Plans
- **Pipeline 2 preservation plan**: Pipeline 2 files (`pipeline2-remove.js`) and endpoints will not be modified. `ai_config` changes will only affect Pipeline 1 payloads.
- **RECOVERY-007 ASR preservation plan**: The existing ASR API calls (`api_p1_extract_text`) and ASR logic in `app.js` will remain untouched.

## Test Plans
- **Automated test plan**: 
  - `python -m py_compile api/server.py`
  - `node --check` for modified JS files.
- **Owner manual test plan**: 
  - Verify settings UI separates paid providers and Ollama.
  - Click "Scan" for Ollama and verify model list populates.
  - Run Pipeline 1 AI analysis with Ollama and a selected model.
  - Verify Pipeline 2 regression check passes.

## Risks and Unresolved Evidence Gaps
- **Risks**: Modifying `ai_config` payload requires careful alignment between frontend construction and backend parsing.
- **Evidence Gaps**: None.

## Recommendation
IMPLEMENT
