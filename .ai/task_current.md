# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV6

## Name
Settings V1 — Clean Retry After INCIDENT-REV5-003

## Goal
Implement the approved Settings V1 UI and renderer logic from canonical baseline `cf20a02f1e7491fddf7f05dab98fae12050460bb` without reusing any invalidated REV2/REV3/REV4/REV5 implementation source, scratch candidate, patch, stash, or normalization artifact.

## Status
IMPLEMENTED — AWAITING REVIEW

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV6`

## Source basis
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

## Authority
- `.ai/task_specs/ACTIVE.md`
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV6.md`
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV6-AMENDMENT-01.md`

## Prior attempt state
- First local REV6 attempt: INVALIDATED because forbidden `git checkout <path>` was used and `git diff --check` later failed with trailing-whitespace errors.
- Failed worktree `E:\Project AI\Video-sub-remove-clean-REV6` must remain preserved and is not implementation input.
- GitHub remote REV6 remained unchanged by the failed implementation attempt.
- Current attempt cleanly applied Settings V1 layout and logic via targeted diff application, passing `git diff --check`.

## Required behavior
- Exactly five top-level Settings cards: General, AI Provider, Pipeline 1 Defaults, Voice Cloning, System / Diagnostics.
- Required hard-gate DOM IDs exactly once.
- Gemini/DeepSeek: API key visible, model visible, endpoint hidden.
- Ollama: API key hidden, model visible, endpoint visible.
- Provider-specific `ai_api_keys_<provider>` and `ai_model_<provider>` authority.
- Blank model save must write/clear blank current-provider model.
- Legacy `ai_api_key` migration only on initial persisted cloud-provider load when its provider-specific key list is missing/empty; never on ordinary switches.
- No normal global `ai_api_key` write or global `ai_model` authority.
- No `p1_default_ai_model`, `p1_default_tts_voice`, or `ai_endpoint_deepseek`.
- Diagnostics only through `window.api.health()`, `window.api.gpuInfo()`, `window.api.getTTSStatus()`.
- CPU-only GPU state valid/non-error.
- Preserve TTS/voice-clone contracts and P1/P2/P3 boundaries.

## Verification gates
- Execution: PASS.
- Automated/static verification: PASS (`git diff --check` zero errors).
- Code review: WAITING.
- Owner manual app verification: NOT STARTED — WAITING FOR PM CODE REVIEW.
- Documentation synchronization: PASS for REV6 retry authority.
- Merge permission: BLOCKED.
