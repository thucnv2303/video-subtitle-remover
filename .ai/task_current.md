# Current Task

## Task ID
PIPELINE1-CONTINUOUS-NARRATION-006

## Name
Pipeline 1 Voice-Aware Continuous Narration, Bounded Reasoning, and Narration Quality Gate

## Status
BUG033_DIAGNOSIS_REQUIRED_BEFORE_FURTHER_SOURCE_FIX

## Authority
- Active branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- BUG-032 source correction: `a0e6165dfd88561bf3140907b6d578782a2ccebf`.
- Current diagnosis state: no further source change is permitted until BUG-033 root-cause questions are answered with evidence.

## Fresh Owner evidence — BUG-033
- 97.57s source.
- Vision plan: 25 keyframes / 4 chunks / 8,8,8,1 frames.
- Transcript segment occurrences in those chunks: 17 / 18 / 22 / 2.
- Global reasoning produced 601-char narration while the soft target was 1529–1610 chars.
- Quality gate passed that narration.
- Full-text TTS pass 1: 35.27s = 36.1% of video.
- Measured duration-fit budget: 1579–1663 chars.
- Narration-fit returned only 735 chars and failed hard validation before final TTS.

## Verified diagnosis so far
1. The measured clone voice rate is close to the configured estimate, so this failure is not primarily caused by a gross TTS-rate estimate error.
2. Initial global reasoning is allowed by current design to return far below the soft lower target.
3. Global reasoning has full transcript + compact visual evidence.
4. Measured narration-fit currently receives only the short narration + audio/video durations, not the original transcript/visual evidence.
5. Therefore a large expansion request can be impossible to satisfy without either repeating/filler or inventing content.
6. Schema/length validation can reject a bad candidate but cannot solve missing grounded content.

## Questions that must be answered before implementation
- Transcript chars/words/semantic density?
- Speech-active duration vs silence/music/visual-only time?
- Longest no-speech gaps?
- Unique grounded visual evidence per chunk?
- Is 95–100% voice occupancy mandatory for sparse-source videos?
- May AI narrate visible actions/details absent from speech if Vision supports them?
- What kinds of explanatory transitions are allowed vs filler?
- Should per-voice measured speaking rate be calibrated/cached before first narration generation?
- What severe-underlength threshold should trigger full-evidence recomposition before TTS?
- Which artifacts/checkpoints are reused on late-stage retry so ASR/Vision/reasoning do not rerun?

## Next permitted action
Diagnose the existing saved P1 artifacts for transcript length, speech occupancy, source silence/gaps, and visual evidence richness; then define the approved duration-controller and resume acceptance criteria. Do not patch source again before that evidence is available.

## Gates
Execution NEEDS_MORE_EVIDENCE; automated/static WAITING for next approved source; code review not release-ready for BUG-033; Owner runtime FAIL on duration behavior; docs sync PASS after this update; merge BLOCKED; Step 3 BLOCKED.