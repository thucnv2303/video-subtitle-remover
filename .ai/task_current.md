# Current Task

## Task ID
PIPELINE1-CONTINUOUS-NARRATION-006

## Name
Pipeline 1 Continuous Narration — P1/P3 Duration Responsibility Redesign

## Status
BUG034_SOURCE_PUBLISHED_PM_REVIEW_PASS_STATIC_AND_OWNER_RUNTIME_WAITING

## Authority
- Branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Approved BUG-034 spec: `c046adca8394652cae94fb47821ac8927cb62f74`.
- P1 source: `97a8e31350b9a0ff40d93207d3de8164b98b458a`.
- P3 source: `55faf3e734120edec93ba22798599eaf16b6be13`.
- PM review: `4912891690` — PASS logic/scope only.

## User outcome
A good P1 narration must not fail merely because it is much shorter than the original video. P1 produces grounded natural narration/TTS; P3 owns final duration alignment after the final video timeline is known.

## Implemented
1. P1 no longer requires 95–100% source occupancy.
2. P1 does not launch evidence-fit/second TTS solely for duration occupancy.
3. P1 logs duration telemetry; outside 90–110% is warning only.
4. P1 blocks only pathological overlength above 150% of source duration.
5. P1 late retry retains same-session reuse of valid analysis/TTS checkpoint.
6. P3 preserves clean-video playback speed; no `adjustVideoTempo()` for voice matching.
7. P3 keeps natural voice below 90% occupancy.
8. P3 may derive pitch-preserving voice between 90–115% occupancy.
9. P3 blocks automatic stretch above 115%.
10. P3 derived audio/SRT live under sibling `p3/` and do not overwrite P1 artifacts.
11. P3 rescales subtitle timing using measured derived-audio duration.

## Verification required
- Exact final `git rev-parse HEAD`.
- `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- `node --check src/renderer/js/pipelines/pipeline3-finalize.js`.
- `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- Same 97.57s P1 case completes after one valid full-text TTS without `Narration evidence-fit`.
- Underlength P1 warning does not block P2 handoff.
- P3 listening/runtime tests at representative <0.90, ~0.90, ~1.00, ~1.10–1.15 and >1.15 ratios.
- P3 preserves video speed and P1 artifacts.
- Adjusted P3 subtitle timing follows derived voice.

## Gates
Execution PASS; automated/static WAITING; code review PASS logic/scope; Owner verification WAITING; docs sync PASS after final canonical sync; merge BLOCKED.