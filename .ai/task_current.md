# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV5

## Name
Settings V1 — Fresh Clean Retry After REV4 Invalidation

## Goal
Implement the approved Settings V1 UI and renderer logic from canonical baseline `cf20a02f1e7491fddf7f05dab98fae12050460bb` without reusing REV4, REV3, REV2, PR #32, PR #33, local stopped retries, patches, or normalization artifacts as source input.

## Status
ACTIVE — IMPLEMENTATION NOT STARTED

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV5`

## Source basis
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

## Prior attempts
- REV3: INVALIDATED.
- REV4 / PR #35: INVALIDATED and closed unmerged. Final GitHub source contradicted executor PASS claims, and execution continued after a required verification warning despite explicit STOP authority.

## Required behavior
- Exactly five Settings sections: General, AI Provider, Pipeline 1 Defaults, Voice Cloning, System/Diagnostics.
- Unique hard-gate DOM IDs, including exactly one `ai-model` and one `tts-status-chip`.
- Gemini/DeepSeek: API key visible, model visible, endpoint hidden.
- Ollama: API key hidden, model visible, endpoint visible.
- Provider-specific `ai_api_keys_<provider>` and `ai_model_<provider>` authority.
- Blank model save must write/clear blank current-provider model.
- Legacy `ai_api_key` migration only on initial persisted cloud-provider load; never on ordinary provider switches.
- No `p1_default_ai_model`, `p1_default_tts_voice`, or `ai_endpoint_deepseek`.
- Diagnostics only through `window.api.health()`, `window.api.gpuInfo()`, `window.api.getTTSStatus()`.
- CPU-only GPU state valid/non-error.
- Preserve TTS/voice-clone contracts and P1/P2/P3 boundaries.

## Verification gates
- Execution: NOT STARTED.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED — WAITING FOR PM CODE REVIEW.
- Documentation synchronization: PASS for task activation.
- Merge permission: BLOCKED.

## Authority
Remote `.ai/task_specs/ACTIVE.md` and `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV5.md` on this branch are authoritative.
