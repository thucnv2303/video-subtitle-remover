# Current State

## Status
WAITING_REVIEW

## Active task
RECOVERY-007E-AI-SETTINGS-001 — IMPLEMENT PROVIDER KEYS AND OLLAMA MODEL DISCOVERY

## Implementation facts
- Review branch: `review/RECOVERY-007E-AI-SETTINGS-001-ai-settings`
- Draft PR: #8
- Approved base: `review/RECOVERY-007E-SOURCE-BASELINE-002-module-closure@7e18c04cf2483403010f237356dfb7f369dae1a8`
- Source commits:
  - `03f07892fba09d9db276641d5e745ffc6ef25689`
  - `6b1a04e631cbcd273375c1ddca636a7e6b1091ac`
- Changed source files:
  - `src/main/preload.js`
  - `src/renderer/js/components/settings.js`
  - `src/renderer/js/pipelines/pipeline1-ai.js`
- Cloud API keys and model selection are separate controls.
- Ollama uses endpoint plus a scanned or manually entered model; no API key is created for Ollama.
- Ollama discovery reads `/api/tags`; Ollama rewrite calls `/api/chat` through the Electron preload bridge.
- Pipeline 2 batch payloads are sanitized before transport: AI configuration fields are removed, `ai_rewrite=false`, and `tts_voice=none`.
- Pipeline 1 remains responsible for AI rewrite/TTS artifacts only.
- Pipeline 2 remains subtitle-removal only.
- Static syntax verification: `node --check` PASS for all three changed JavaScript files.
- Runtime verification has not started.

## Tracking
- RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED — PASS WITH GIT-NORMALIZED LF
- BUG-008: CANDIDATE FIX IN DRAFT PR #8 — OWNER TEST PENDING
- BUG-009: CANDIDATE FIX IN DRAFT PR #8 — OWNER TEST PENDING
- RECOVERY-007 owner verification: PAUSED
- PR #4, #5, #6 and #7: DO NOT MERGE
- PR #8: DO NOT MERGE

## Verification gates
- Execution: PASS — implementation published to Draft PR #8
- Automated verification: PASS — static syntax and source-scope checks
- Code review: WAITING
- Owner manual app verification: BLOCKED
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED

## Current branch
review/RECOVERY-007E-AI-SETTINGS-001-ai-settings
