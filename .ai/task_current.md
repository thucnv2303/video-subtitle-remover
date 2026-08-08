# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV4

## Name
Settings V1 — Clean Retry After REV3 Invalidation

## Goal
Implement the approved Settings V1 UI and renderer logic from canonical baseline `cf20a02f1e7491fddf7f05dab98fae12050460bb` without reusing invalidated REV3 or earlier Settings implementation sources.

## Status
AUTHORIZED — WAITING EXECUTOR REPORT

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV4`

## Required behavior
- Exactly five Settings sections: General, AI Provider, Pipeline 1 Defaults, Voice Cloning, System/Diagnostics.
- No duplicate legacy Storage/Hardware controls with conflicting IDs.
- Strict provider-specific key/model isolation.
- Legacy `ai_api_key` migration only for the provider that was persisted at initial Settings load.
- Switching to another cloud provider with no provider-specific key shows blank.
- Normal save must not globally synchronize legacy `ai_api_key`.
- Ollama uses `ai_endpoint` and `ai_model_ollama`, no API key authority.
- Output directory path row is narrow-window safe and uniquely bound.
- Diagnostics use only `window.api.health()`, `window.api.gpuInfo()`, and `window.api.getTTSStatus()`.
- CPU-only GPU state is valid non-error.
- Preserve current working TTS/voice-clone and Pipeline boundaries.

## REV3 status
INVALIDATED. Commits `2494cc2a85293565303e00a3afcd728f42bd65d8` and `866a3a86655f81ea964b50e8c84a61698092e41d` are not implementation authority.

## Verification gates
- Execution: AUTHORIZED.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED — WAITING FOR PM CODE REVIEW.
- Documentation synchronization: WAITING FOR EXECUTION RESULT.
- Merge permission: BLOCKED.

## Authority
Remote `.ai/task_specs/ACTIVE.md` and `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV4.md` on this branch are authoritative.
