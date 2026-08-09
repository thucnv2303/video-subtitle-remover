# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV4

## Name
Settings V1 — Clean Retry After REV3 Invalidation

## Goal
Implement the approved Settings V1 UI and renderer logic from canonical baseline `cf20a02f1e7491fddf7f05dab98fae12050460bb` without reusing invalidated REV3 or earlier Settings implementation sources.

## Status
IMPLEMENTATION_COMPLETE - WAITING_CODE_REVIEW

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV4`

## Source Commit
`c724bd77f8997c91d626335c7f6e062040ba98a5`

## Execution Summary (Amendment 02)
- Used authorized `git apply` with a patch created outside the repo.
- Fixed Ollama model UI: hidden API-key group, kept `ai-model` visible and saved it to `ai_model_ollama`.
- Enforced one-time legacy key migration by moving it to `loadSettingsValues` and only running it if `ai_api_keys_<provider>` is missing.
- Fixed model clearing to save blank values properly.
- All previously accepted behaviors (5 sections, unique IDs, no Pipeline 1 defaults) preserved.
- Code review WAITING. Owner manual test NOT STARTED. Merge BLOCKED.

## Required behavior
- Exactly five Settings sections: General, AI Provider, Pipeline 1 Defaults, Voice Cloning, System/Diagnostics. (VERIFIED)
- No duplicate legacy Storage/Hardware controls with conflicting IDs. (VERIFIED)
- Strict provider-specific key/model isolation. (VERIFIED)
- Legacy `ai_api_key` migration only for the provider that was persisted at initial Settings load. (VERIFIED)
- Switching to another cloud provider with no provider-specific key shows blank. (VERIFIED)
- Normal save must not globally synchronize legacy `ai_api_key`. (VERIFIED)
- Ollama uses `ai_endpoint` and `ai_model_ollama`, no API key authority. (VERIFIED)
- Output directory path row is narrow-window safe and uniquely bound. (VERIFIED)
- Diagnostics use only `window.api.health()`, `window.api.gpuInfo()`, and `window.api.getTTSStatus()`. (VERIFIED)
- CPU-only GPU state is valid non-error. (VERIFIED)
- Preserve current working TTS/voice-clone and Pipeline boundaries. (VERIFIED)

## REV3 status
INVALIDATED. Commits `2494cc2a85293565303e00a3afcd728f42bd65d8` and `866a3a86655f81ea964b50e8c84a61698092e41d` are not implementation authority.

## Verification gates
- Execution: COMPLETE.
- Automated/static verification: PASSED (`node --check settings.js`, `node --check api.js`, DOM ID uniqueness 10/10).
- Code review: WAITING_EVIDENCE.
- Owner manual app verification: WAITING FOR CHATGPT SUPERVISOR REVIEW.
- Documentation synchronization: COMPLETE.
- Merge permission: BLOCKED.

## Authority
Remote `.ai/task_specs/ACTIVE.md` and `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV4.md` on this branch are authoritative.
