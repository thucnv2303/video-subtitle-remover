# Current Task

## Task ID
RECOVERY-007E-AI-SETTINGS-001

## Name
IMPLEMENT PROVIDER KEYS AND OLLAMA MODEL DISCOVERY

## Status
WAITING_REVIEW

## Purpose
Replace the ambiguous combined API-key/model control, separate cloud-provider credentials from model selection, discover installed Ollama models, and prevent Pipeline 2 from receiving AI configuration.

## Approved scope
- `src/main/preload.js`
- `src/renderer/js/components/settings.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- affected canonical `.ai` files

## Published implementation
- Base SHA: `7e18c04cf2483403010f237356dfb7f369dae1a8`
- Branch: `review/RECOVERY-007E-AI-SETTINGS-001-ai-settings`
- Draft PR: #8
- Source commits:
  - `03f07892fba09d9db276641d5e745ffc6ef25689`
  - `6b1a04e631cbcd273375c1ddca636a7e6b1091ac`

## Acceptance coverage
- Provider-specific cloud keys are stored independently from provider-specific models.
- Ollama has no API-key entry.
- Ollama endpoint and model are distinct values.
- Installed Ollama models can be requested from `/api/tags`.
- A model may be selected from scan results or entered manually.
- Ollama connection can be tested through the preload bridge.
- Pipeline 1 calls Ollama with `model` as a model field, not as a key.
- Pipeline 2 outbound batches remove `ai_config`, keys, provider, model and endpoint.
- Pipeline 2 forces `ai_rewrite=false` and `tts_voice=none`.
- No subtitle removal or final rendering was added to Pipeline 1.

## Verification
- `node --check src/main/preload.js`: PASS
- `node --check src/renderer/js/components/settings.js`: PASS
- `node --check src/renderer/js/pipelines/pipeline1-ai.js`: PASS
- Diff scope: exactly three source files before documentation commit.
- Runtime Electron/Ollama verification: NOT STARTED.

## Tracking
- BUG-008: CANDIDATE FIX IN DRAFT PR #8 — OWNER TEST PENDING
- BUG-009: CANDIDATE FIX IN DRAFT PR #8 — OWNER TEST PENDING
- AI Settings implementation: PUBLISHED, WAITING_REVIEW
- Owner test: BLOCKED until code review PASS
- Merge: BLOCKED

## Verification gates
- Execution: PASS — implementation published to Draft PR #8
- Automated verification: PASS — static syntax and scope checks
- Code review: WAITING
- Owner manual app verification: BLOCKED
- Documentation synchronization: WAITING_REVIEW
- Merge permission: BLOCKED
