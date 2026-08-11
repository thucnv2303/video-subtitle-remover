# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — CORRECTIVE SOURCE PUBLISHED / PM REVIEW WAITING / OWNER RETEST BLOCKED UNTIL STATIC

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Owner-failed tested head: `5d247d8ee37fc8370a3f05983eeac7cfc850e444`.
- Failure-intake/docs head before correction: `ecb733b660c11106410c5f84f999b74439fb48d1`.
- Corrective source commit: `1c028612900b1180aa8c1e66da2d769373793c91`.
- Task spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Owner runtime failure that drove this correction
1. Job 1: `24.30s` source; pass-1 voice `16.52s` (68.0%). Measured repair target was `391–412` chars, but qwen returned `280` chars again and the old handler accepted it for pass 2.
2. Job 2: `17.60s`; Vision completed in `28.3s`; qwen first output after `55.5s`; global reasoning timed out at the `150s` safety bound.
3. Queue failure isolation/auto-advance remained working.

## Corrective source now published
1. Clone-voice initial narration estimate is calibrated closer to the observed Owner voice rate (`16.5 char/s` baseline instead of `13.5`).
2. Final reasoning schema is generated dynamically from the narration budget and includes `narration_script.minLength/maxLength`.
3. Narration repair schema also carries computed `minLength/maxLength`.
4. Code explicitly validates final/repair narration length with `assertNarrationWithinBudget`; an out-of-range repair cannot reach the final re-TTS call.
5. Short final JSON is structurally bounded: `additionalProperties:false`, bounded summary/string lengths, bounded insight arrays, bounded edit-plan and edit-notes counts.
6. Short-video reasoning output floor is reduced from `900` to `520` tokens; narration-only repair has a separate smaller floor (`260`).
7. Global qwen input receives compacted Vision evidence rather than the full verbose chunk analysis object.
8. Existing 150s short-video timeout remains a safety bound; selected qwen model is unchanged.
9. Continuous full-text TTS, max one repair + one final TTS, queue auto-advance, manual Job browsing and P2 fail-closed behavior are unchanged.
10. No P2/P3/STTN/Settings/backend/TTS-engine source changes.

## Verification evidence
- GitHub compare `ecb733b... -> 1c028612...`: ahead by 1; exactly one changed file: `src/main/p1-vision-ipc.js`.
- Direct GitHub full-file/targeted review confirms dynamic schemas, explicit length validation, smaller token budgets and compact reasoning context are present on the corrective commit.
- Deterministic helper check: a 280-char repair is rejected for a 391–412-char budget; short reasoning budget is below the prior 900-token floor.
- Exact Node syntax on the published commit: WAITING.
- Exact `git diff --check`: WAITING.
- Fresh Owner runtime on corrective source: NOT STARTED.

## Gates
- Execution: PASS for corrective source publication.
- Automated/static verification: PARTIAL / exact published-head commands WAITING.
- Code review: WAITING final PM review decision after exact diff/static evidence.
- Owner manual app verification: FAIL on old tested head; corrective retest NOT STARTED.
- Documentation synchronization: PASS after docs commit containing this file/task/handoff/QA updates.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Run exact Node syntax + diff checks on the final docs/head, complete PM source review, then Owner retests the same 24.30s + 17.60s sequence. Do not merge or start Step 3 before fresh Owner PASS is recorded.