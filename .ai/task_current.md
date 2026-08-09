# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV7

## Name
Settings V1 — Fresh Clean Retry After INCIDENT-REV6-004

## Goal
Implement the approved Settings V1 UI and renderer logic from canonical source `cf20a02f1e7491fddf7f05dab98fae12050460bb` without reusing any invalidated REV2/REV3/REV4/REV5/REV6 source, patch, candidate, stash, scratch artifact, or worktree.

## Status
ACTIVE — WAITING

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Source basis
- Canonical source: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Trusted project-state basis: `b88ffc62aec35cb28de7adf7ce70750f478b29f5`

## Authority
- `.ai/task_specs/ACTIVE.md`
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7.md`

## Incident disposition
- REV6 implementation: INVALIDATED.
- INCIDENT-REV6-004 evidence: PASS / RESOLVED.
- PR #37: closed unmerged.
- REV6 implementation commits/artifacts are forbidden as implementation input.

## Required behavior
- Exactly five top-level Settings cards: General, AI Provider, Pipeline 1 Defaults, Voice Cloning, System / Diagnostics.
- Required hard-gate DOM IDs exactly once.
- Gemini/DeepSeek: API key visible, model visible, endpoint hidden.
- Ollama: API key hidden, model visible, endpoint visible.
- Provider-specific `ai_api_keys_<provider>` and `ai_model_<provider>` authority.
- Blank model save persists blank current-provider model.
- Legacy `ai_api_key` migration only on initial persisted cloud-provider load when provider-specific key list is missing/empty; never on ordinary switches.
- No normal global `ai_api_key` write or global `ai_model` authority.
- No `p1_default_ai_model`, `p1_default_tts_voice`, or `ai_endpoint_deepseek`.
- Diagnostics only through approved `window.api` methods; no direct fetch.
- CPU-only GPU state valid/non-error.
- Preserve TTS/voice-clone contracts and P1/P2/P3 boundaries.

## Execution method
- New isolated clean worktree from exact remote REV7 authority.
- Allowed source: only `src/renderer/index.html` and `src/renderer/js/components/settings.js`.
- Direct normal-editor edits only; one file at a time.
- No external candidate/patch workflow and no source rewrite scripts.
- Per-file hard gate before proceeding to the next file.
- First required gate failure => STOP without self-repair.

## Verification gates
- Execution: WAITING.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED / NOT AUTHORIZED.
- Documentation synchronization: PASS for REV7 authority setup.
- Merge permission: BLOCKED.
