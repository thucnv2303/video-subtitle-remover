# Current Task

## Task ID
PIPELINE1-CONTINUOUS-NARRATION-006

## Name
Pipeline 1 Voice-Aware Continuous Narration and Bounded Reasoning

## Status
CORRECTIVE_SOURCE_PUBLISHED_STATIC_AND_PM_REVIEW_WAITING

## Authority
- Active branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Owner-failed tested head: `5d247d8ee37fc8370a3f05983eeac7cfc850e444`.
- Corrective source commit: `1c028612900b1180aa8c1e66da2d769373793c91`.
- Spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Fresh Owner runtime failure
### Job 1
- Video `24.30s`.
- Continuous TTS pass 1 produced `16.52s` voice = `68.0%`.
- Measured repair target was `391–412` chars from a `280`-char narration.
- qwen returned `280` chars again; prior code accepted it and spent pass 2.
- Pass 2 repeated `16.52s / 68.0%` and failed closed.

### Job 2
- Video `17.60s`.
- Adaptive Vision completed: 6 keyframes / 1 chunk; gemma4 Vision `28.3s`.
- qwen started output after `55.5s` but did not complete before the `150s` safety timeout.

## Corrective implementation
1. Initial clone-voice baseline raised to `16.5 char/s`, informed by observed continuous voice rate.
2. Final reasoning schema is dynamic per narration budget with `minLength/maxLength` on `narration_script`.
3. Narration-repair schema is dynamic with the measured repair `minLength/maxLength`.
4. Explicit code-level `assertNarrationWithinBudget` rejects out-of-budget final/repair text; no final re-TTS is allowed after a bad repair.
5. Final short-video schema caps summary/string lengths, insight arrays, edit plan and edit notes, and disallows additional properties.
6. Global reasoning short-video token floor reduced from `900` to `520`; narration-fit uses a dedicated `260` minimum token budget.
7. Global qwen receives compacted Vision context rather than verbose raw chunk analysis.
8. Selected reasoning model remains unchanged; timeout remains finite.
9. Continuous `/api/tts/generate`, max one fit + one final TTS, queue continuation, manual browsing and P2 fail-closed behavior are preserved.

## Source scope
- Changed corrective source: `src/main/p1-vision-ipc.js` only.
- No P2/P3/STTN/Settings/backend/TTS-engine source changes.

## Verification completed
- GitHub compare from failure-intake head to corrective source shows exactly one source file changed.
- Direct GitHub full-file/targeted review confirms the corrective functions are present.
- Deterministic helper check proves `280` chars is outside `391–412` and the new short reasoning budget is below the old 900-token floor.

## Verification still required
- Exact `node --check src/main/p1-vision-ipc.js` on final docs/head.
- Exact `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- PM final code-review decision on the corrective diff.
- Owner retest same two-Job sequence.
- Job 1: if repair target is 391–412, repaired narration must actually fall inside that range before re-TTS; otherwise fail before pass 2.
- Job 1 successful final audio must be 95–100% of source duration.
- Job 2 short global reasoning must complete within the 150s bound or fail clearly without queue stall.
- Pending ultimate P1 coverage: >60s input shows >8 adaptive samples/multiple <=8-frame chunks.

## Gates
Execution PASS for corrective source; automated/static PARTIAL; code review WAITING; Owner corrective retest NOT STARTED; docs sync PASS after publication; merge BLOCKED; Step 3 BLOCKED.