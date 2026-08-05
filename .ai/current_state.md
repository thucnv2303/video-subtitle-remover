# Current State

## Status
WAITING_REVIEW

## Active task
RECOVERY-007E-AI-SETTINGS-001 — IMPLEMENT PROVIDER KEYS AND OLLAMA MODEL DISCOVERY

## Review publication
- Draft PR: #8
- Base: `review/RECOVERY-007E-SOURCE-BASELINE-002-module-closure@7e18c04cf2483403010f237356dfb7f369dae1a8`
- Head branch: `review/RECOVERY-007E-AI-SETTINGS-001-ai-settings`
- Current source head: `e3d5615a58680a05e41bc1a380258ff6ab4ff157`
- Source commits:
  - `03f07892fba09d9db276641d5e745ffc6ef25689` — Ollama preload bridge
  - `6b1a04e631cbcd273375c1ddca636a7e6b1091ac` — provider UI/model discovery/Pipeline 1 contract
  - `e3d5615a58680a05e41bc1a380258ff6ab4ff157` — preserve voice-clone preview and selection behavior
- Source files: `src/main/preload.js`, `src/renderer/js/components/settings.js`, `src/renderer/js/pipelines/pipeline1-ai.js`

## Verified implementation facts
- Cloud API keys and model selection are separate controls.
- Ollama uses endpoint and model only; model is not stored as an API key.
- Ollama discovery uses `/api/tags`; Ollama rewrite uses `/api/chat` through the preload bridge.
- Pipeline 2 batch transport removes AI provider/key/model/endpoint fields, forces `ai_rewrite=false`, and forces `tts_voice=none`.
- Pipeline 1 remains AI rewrite/TTS artifact generation only.
- Voice-clone upload preview, generated-sample preview, automatic clone selection and form reset are preserved in the review head.
- Static `node --check`: PASS for all three changed JavaScript files.
- Runtime Electron/Ollama verification: NOT STARTED.

## Tracking
- RECOVERY-007E-SOURCE-BASELINE-002: COMPLETED — PASS WITH GIT-NORMALIZED LF
- BUG-008: CANDIDATE FIX IN DRAFT PR #8 — OWNER TEST PENDING
- BUG-009: CANDIDATE FIX IN DRAFT PR #8 — OWNER TEST PENDING
- RECOVERY-007 owner verification: PAUSED
- PR #4, #5, #6, #7 and #8: DO NOT MERGE

## Verification gates
- Execution: PASS — implementation published to Draft PR #8
- Automated verification: PASS — static syntax and source-scope checks
- Code review: WAITING
- Owner manual app verification: BLOCKED
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED

## Current branch
review/RECOVERY-007E-AI-SETTINGS-001-ai-settings
