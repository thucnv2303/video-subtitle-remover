# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — OWNER RUNTIME FAIL / NEEDS REVISION

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent failed revision: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c` / Draft PR #46 — OWNER RUNTIME FAIL.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Owner-tested PR #47 head: `5d247d8ee37fc8370a3f05983eeac7cfc850e444`.
- Previously reviewed source head: `e07c02776a5918be7a4d2c1a72b26ed3138027cc` / PM review `4905691792`.
- Task spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Fresh Owner runtime evidence — 2026-08-11
1. Job 1 continuous TTS pass 1: source video `24.30s`, generated voice `16.52s`, ratio `68.0%`.
2. Measured-rate repair correctly computed a target of `391–412` characters from the 280-character narration, but qwen returned exactly `280` characters again. The code accepted this out-of-budget repair and performed the final TTS anyway; pass 2 therefore repeated `16.52s / 68.0%` and the Job failed.
3. Queue failure isolation still works: after Job 1 failed, the next queued Job started automatically.
4. Job 2 (`17.60s`) completed Vision in `28.3s`, then `qwen3-coder:30b` global reasoning began output after `55.5s` and still had not completed when the new `150s` bound fired. Job 2 failed with `OLLAMA_PHASE_TIMEOUT`.
5. The run therefore invalidates the prior `OWNER RETEST READY` state for PR #47.

## Verified root causes from runtime + source
- Repair length is currently a prompt-only requirement. `NARRATION_REPAIR_SCHEMA` has no `minLength`/`maxLength`, and the handler does not reject a returned narration outside the computed repair range before re-TTS. This allowed the exact same 280-character script to be synthesized a second time.
- Short-video reasoning still grants a minimum `900` output tokens (`reasoningTokenBudget`), far above the ~226–238-character narration need for the 17.6s Job. The final schema also leaves insight/edit arrays unbounded, so qwen can continue generating nonessential JSON until the 150s timeout.
- The timeout itself now fails closed as designed; the remaining defect is that output is not compact/bounded enough to complete reliably on the Owner-selected 30B model.

## Revision direction permitted
- Keep the Owner-selected reasoning model; do not silently switch models.
- Make narration character limits part of the JSON schema and validate returned lengths in code before TTS/re-TTS.
- Reduce and hard-cap final reasoning output budget for short narration; cap nonessential arrays/string lengths in the final schema.
- Preserve one whole-narration repair maximum, one final TTS maximum, continuous `/api/tts/generate`, queue auto-advance, manual Job browsing, P2 lock on failure, and no P2/P3/TTS-engine changes.

## Gates
- Execution: NEEDS REVISION.
- Automated/static verification: WAITING for corrective source.
- Code review: INVALIDATED by fresh Owner runtime FAIL.
- Owner manual app verification: FAIL on tested head `5d247d8...`.
- Documentation synchronization: PASS for Owner failure intake after this publication.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Apply a narrow corrective source change on the active PR #47 branch, verify exact source/diff, update canonical QA/bugs/state, then request a fresh Owner retest. Do not merge and do not start Step 3.