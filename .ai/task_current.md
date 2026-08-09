# Current Task

## Task ID
RECOVERY-007E-SETTINGS-V1-001-REV4

## Name
Settings V1 - Clean Retry After REV3 Invalidation

## Goal
Implement the approved Settings V1 UI and renderer logic from canonical baseline cf20a02f1e7491fddf7f05dab98fae12050460bb without reusing invalidated REV3 or earlier Settings implementation sources. (Amendment 01 applied).

## Status
IMPLEMENTATION_COMPLETE - WAITING_CODE_REVIEW

## Review branch
review/RECOVERY-007E-SETTINGS-V1-001-REV4

## Source Commit
150ca386fe709ee089ec3439165bd275fadc8a4e

## Execution Summary
- Used authorized git apply with a patch created outside the repo to precisely modify the DOM.
- Implemented ai_model_<provider> persistence for all three providers, adding an ai-model input to the provider card.
- Removed unused p1-default-ai-model and p1-default-tts-voice.
- Removed ai_endpoint_deepseek.
- Maintained exact unique DOM hard-gates.
- Code review WAITING. Owner manual test NOT STARTED. Merge BLOCKED.
