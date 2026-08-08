# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV3

## Name
Settings V1 — Clean Continuation After Governance Fix

## Goal
Implement the approved Settings V1 UI and supporting renderer logic from the post-governance canonical baseline without reusing invalidated Settings implementations or local REV2 stash/worktree changes.

## Status
AUTHORIZED — WAITING EXECUTOR REPORT

## Source basis
`cf20a02f1e7491fddf7f05dab98fae12050460bb`

## Review branch
`review/RECOVERY-007E-SETTINGS-V1-001-REV3`

## Required behavior
- Five Settings sections: General, AI Provider, Pipeline 1 Defaults, Voice Cloning, System/Diagnostics.
- Strict provider key/model isolation using `ai_api_keys_<provider>` and `ai_model_<provider>`.
- Safe legacy `ai_api_key` migration only for the currently persisted cloud provider.
- Ollama endpoint/model support with no API key authority.
- Output directory row safe for long paths/narrow window.
- Diagnostics use existing real Backend/GPU/TTS calls with payload-specific interpretation.
- Preserve existing Pipeline 1/2/3 responsibilities and working TTS/voice-clone behavior.

## Verification gates
- Execution: AUTHORIZED.
- Automated/static verification: WAITING.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED — WAITING FOR PM CODE REVIEW.
- Documentation synchronization: WAITING FOR EXECUTION RESULT.
- Merge permission: BLOCKED.

## Authority
Remote `.ai/task_specs/ACTIVE.md` and `.ai/task_specs/RECOVERY-007E-SETTINGS-V1-001-REV3.md` on this branch are authoritative.
Earlier Settings PRs, commits, local stash, patches, scratch files, and REV2 local edits are invalid implementation sources.
