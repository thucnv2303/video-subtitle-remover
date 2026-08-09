# AgentOS Handoff Status

## Canonical baseline
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Canonical source HEAD:
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

## Active task
`RECOVERY-007E-SETTINGS-V1-001-REV7`

## Status
WAITING_OWNER_RETEST — OLLAMA MODEL DISCOVERY

## Review branch / PR
- Branch: `review/RECOVERY-007E-SETTINGS-V1-001-REV7`
- Draft PR: #38
- Owner runtime screenshot confirms approved Settings UI direction is acceptable.
- Remaining defect is local Ollama model discovery.

## Current implementation
- Settings approved 2x2 overview + four detail views remain unchanged.
- Electron main process now exposes local Ollama model discovery using `GET /api/tags` via `net.fetch()`.
- Preload injects a small Ollama-only scan control under the existing Model field.
- Scanned models populate a select/datalist and can be copied into the existing `ai-model` field.
- Manual model input remains available.
- Discovery accepts loopback Ollama endpoints only.
- Provider-specific model storage, AI/TTS/storage/diagnostics behavior, and Pipeline 1/2/3 boundaries are preserved.

## Current gates
- UI visual acceptance: PASS for current direction based on owner runtime screenshot.
- Ollama scan runtime verification: WAITING OWNER RETEST.
- Code review: WAITING final Ollama runtime evidence.
- Owner manual app verification: RETEST AUTHORIZED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Next action
Owner refreshes the dedicated REV7 owner-test worktree to the latest remote head, launches the app, opens AI & Model, selects Ollama, clicks `Quét model Ollama`, selects a discovered local model, saves, reopens Settings, and confirms persistence. Report PASS/FAIL. Do not test from the dirty main folder. Merge remains blocked.
