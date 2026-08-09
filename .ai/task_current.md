# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV7

## Name
Settings V1 — Fresh Clean Retry After INCIDENT-REV6-004

## Goal
Implement the approved Settings V1 UI and renderer logic from canonical source `cf20a02f1e7491fddf7f05dab98fae12050460bb` without reusing invalidated implementation artifacts.

## Status
WAITING_REVIEW

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Source basis
- Canonical source: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Trusted project-state basis: `b88ffc62aec35cb28de7adf7ce70750f478b29f5`

## Implementation
- Source commit: `58ad057b43c802fbbc9a1aebc6a86734def4fee1`.
- Source changed: `src/renderer/js/components/settings.js` only.
- Runtime layout: General, AI Provider, Pipeline 1 Defaults, Voice Cloning, System / Diagnostics.
- Provider persistence: `ai_api_keys_<provider>` and `ai_model_<provider>`.
- Blank model clearing persists.
- Legacy `ai_api_key` migration restricted to initial persisted cloud-provider load when provider list is empty.
- No normal writes to global `ai_api_key` or global `ai_model`.
- Diagnostics use `window.api.health()`, `window.api.gpuInfo()`, and `window.api.getTTSStatus()` only.
- CPU-only is neutral/non-error.
- Existing TTS/voice-clone behavior preserved.

## Verification
- `node --check` on implemented Settings module: PASS.
- Targeted assertions for forbidden keys/direct fetch/provider storage/diagnostic wrappers: PASS.
- GitHub final code review: WAITING.
- Owner manual app verification: NOT STARTED / NOT AUTHORIZED until PM code-review PASS.
- Documentation synchronization: PASS for review state.
- Merge permission: BLOCKED.
