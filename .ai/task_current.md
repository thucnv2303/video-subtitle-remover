# Current Task

## Task ID
RECOVERY-007E-AI-SETTINGS-001

## Name
SECURE PROVIDER CREDENTIALS AND DIRECT PROVIDER EXECUTION

## Status
CANDIDATE_FIX

## Owner Test at Previous Head (abf0ee2)
FAIL - Owner-observed blockers:
1. DeepSeek API key displayed in clear text.
2. Kiem tra ket noi only validated local input, did not call DeepSeek.
3. DeepSeek model list was not retrieved after key validation.
4. Home page / Pipeline 1 layout was visually broken.
5. Pipeline 1 AI selector did not offer or synchronize DeepSeek with Settings.

## Implementation (CANDIDATE - NOT YET OWNER-RETESTED)
- safeStorage.isEncryptionAvailable() verified, fails closed.
- API keys encrypted with safeStorage, stored as hex ciphertext in userData/ai_keys.json.
- No plaintext fallback. No Base64 fallback.
- DeepSeek GET /models called from main process for validation/model discovery.
- DeepSeek POST /chat/completions called from main process for rewrite.
- Gemini keys also stored via safeStorage (model list via API, manual fallback for unsupported models).
- Ollama remains main-process IPC (unchanged architecture).
- Renderer aiRewrite payload: { provider, model, prompt, srt_content } only.
- Raw key does not reach renderer, Python backend, or Pipeline 2.
- Legacy localStorage keys deleted: ai_api_key, ai_api_keys_gemini, ai_api_keys_deepseek, ai_api_keys_ollama.
- api_key field removed from aiConfig passed to Python startProcessBatch.
- API key input is masked (type=password).
- Saved keys are not refilled into the DOM.
- Home layout regression fixed (removed duplicated three-col wrapper).
- Pipeline 1 AI selector synchronized with Settings provider/model selection.

## Static Verification
- node --check src/main/main.js: EXIT 0
- node --check src/main/preload.js: EXIT 0
- node --check src/renderer/js/components/settings.js: EXIT 0
- node --check src/renderer/js/pipelines/pipeline1-ai.js: EXIT 0
- node --check src/renderer/js/app.js: EXIT 0
- git diff --check (working tree): EXIT 0

## PR Ancestry Facts
- PR #8 base branch: review/RECOVERY-007E-SOURCE-BASELINE-002-module-closure
- PR #8 base SHA: 7e18c04cf2483403010f237356dfb7f369dae1a8
- Publication parent: abf0ee2f3f0d309ed7e371c4a4f3094c20c08651
- COMMIT SEPARATION: NOT SATISFIED - hook-staged documentation into source commit 5be1d2bc.

## Tracking
- RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED
- Source commit: 5be1d2bc728ab282914b9d99cd050cd98916a2d6 (mixed with hook-staged docs)
- Docs follow-up: d5e40a5ed6816e1304b369013c7bbde481cc1364
- Encoding repair: PENDING
- BUG-008 and BUG-009: CANDIDATE FIX - OWNER RETEST NOT STARTED
- Owner manual verification: NOT STARTED
- PR #8: DO NOT MERGE

## Verification gates
- Execution: PASS
- Automated verification: PASS
- Code review: WAITING
- Owner manual app verification: NOT STARTED
- Documentation synchronization: WAITING_PM_REVIEW
- Merge permission: BLOCKED
