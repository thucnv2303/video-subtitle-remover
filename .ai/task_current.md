# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV7

## Name
Settings V1 — Fresh Clean Retry After INCIDENT-REV6-004

## Goal
Implement the approved Settings V1 UI and renderer logic from canonical source `cf20a02f1e7491fddf7f05dab98fae12050460bb` without reusing any invalidated REV2/REV3/REV4/REV5/REV6 source, patch, candidate, stash, scratch artifact, or worktree.

## Status
ACTIVE — WAITING FOR FRESH RETRY UNDER AMENDMENT 01

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV7`

## Source basis
- Canonical source: `cf20a02f1e7491fddf7f05dab98fae12050460bb`
- Trusted project-state basis: `b88ffc62aec35cb28de7adf7ce70750f478b29f5`

## Authority
- `.ai/task_specs/ACTIVE.md`
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7.md`
- `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV7-AMENDMENT-01.md`

## Prior REV7 attempt
- First REV7 pre-edit attempt STOPPED correctly before source editing because raw working-tree `git hash-object` values differed under Windows CRLF checkout.
- GitHub verification proved both remote REV7 source blobs exactly match canonical source.
- This was a gate-design false positive, not source contamination.
- `E:\Project AI\Video-sub-remove-clean-REV7` must not be reused.

## Corrected pre-edit gate
- New isolated clean worktree from exact current remote REV7 authority.
- `git status --short` must be empty.
- Verify committed blobs using `git rev-parse HEAD:<path>` against canonical blob SHAs from Amendment 01.
- `git diff --quiet -- <two target paths>` must exit 0.
- Record `git ls-files --eol` as EOL baseline; do not use raw working-tree hash equality as canonical identity.
- Any `mixed` EOL classification before edit is a hard STOP.

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

## Verification gates
- Execution: WAITING.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED / NOT AUTHORIZED.
- Documentation synchronization: PASS for REV7 Amendment 01 authority.
- Merge permission: BLOCKED.
