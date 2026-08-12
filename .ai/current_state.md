# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — BUG-033 DURATION/CONTENT DIAGNOSIS REQUIRED / NO FURTHER SOURCE FIX YET

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Current GitHub head before this diagnosis-state update: `0d30b3c411be5da1887f307f895994a99aea2624`.
- BUG-032 source correction: `a0e6165dfd88561bf3140907b6d578782a2ccebf`.
- Task spec: `.ai/task_specs/PIPELINE1-CONTINUOUS-NARRATION-006.md`.

## Fresh Owner evidence — BUG-033
Latest Owner log for the 97.57s case shows:
- adaptive sampling still succeeds: 25 keyframes / 4 chunks / 8,8,8,1 frames;
- transcript segment counts per chunk are 17 / 18 / 22 / 2 (59 total segment occurrences in the chunk plan);
- global reasoning returns a clean 601-character narration while its soft target is 1529–1610 chars;
- quality gate passes the 601-char narration;
- full-text TTS pass 1 produces 35.27s, only 36.1% of the 97.57s video;
- measured duration-fit target becomes 1579–1663 chars;
- narration-fit returns only 735 chars and the hard post-validator rejects it before final TTS.

Exact tested `git rev-parse HEAD` was not included with this latest log, so do not attribute the runtime to a specific SHA beyond the Owner-provided runtime evidence itself.

## What is verified vs not yet verified
Verified:
1. The large duration miss is primarily a narration-length/content-generation problem, not a large TTS-rate-estimation error. The 601-char narration produced 35.27s, implying a measured rate close to the existing clone-rate estimate.
2. The current global prompt explicitly treats the lower narration target as soft and permits a naturally shorter narration, so a 601-char draft is currently allowed by design.
3. Global reasoning receives the full transcript plus compact visual evidence.
4. The duration-fit IPC receives only the current narration plus measured audio/video durations; it does not receive the original transcript or compact visual evidence.
5. Therefore asking duration-fit to expand roughly 2.6x while simultaneously forbidding invention/filler creates an under-specified/contradictory task when the current narration itself does not contain enough distinct facts.
6. A hard schema/post-validator can detect an undersized candidate but cannot create grounded content; this is validation, not a duration-control strategy.

Not yet verified:
1. Actual transcript character/word count and semantic richness.
2. Source speech occupancy: how many seconds of the 97.57s video actually contain speech.
3. Whether the source contains long silent/music/visual-only spans.
4. Whether visual evidence contains enough distinct grounded information to support near-full-time narration without filler.
5. Product policy when grounded evidence is insufficient: force near-continuous voice, permit descriptive visual narration, or preserve intentional silence.

## Required diagnosis before implementation
Answer these questions with evidence before another source revision:
1. What are transcript chars, words, ASR segment count, speech-active duration, and longest speech gaps?
2. How much unique grounded information exists per Vision chunk, not just how many keyframes?
3. Is 95–100% voice occupancy a hard requirement for every source video, including sparse/silent videos?
4. May the AI add descriptive narration grounded in visible actions/objects when the source transcript is sparse?
5. May the AI add generic transitions/explanations, and what counts as unacceptable filler?
6. Should selected voice speed/reference be calibrated before script generation or may cached per-voice measured rates be used?
7. What threshold defines a severe pre-TTS underlength that must trigger full-evidence recomposition before spending a TTS pass?
8. On late-stage failure, which persisted artifacts/checkpoints can be reused so the Job resumes from duration control instead of rerunning ASR/Vision/reasoning?

## Engineering direction under evaluation
A likely safe design is an evidence-aware closed-loop duration controller:
- inventory transcript + visual evidence;
- estimate/calibrate the selected TTS voice rate;
- create an evidence coverage plan for the target voice duration;
- generate/recompose narration from full evidence, not by stretching a short narration alone;
- quality gate before TTS;
- measure real TTS duration;
- use small deterministic audio tempo correction only for close misses;
- use at most one full-evidence measured recompose for large misses;
- persist stage checkpoints and resume from the failed stage.
This is a direction, not yet an approved implementation spec.

## Gates
- Execution: NEEDS_MORE_EVIDENCE before another source revision.
- Automated/static verification: WAITING for the next approved source head.
- Code review: prior BUG-032 review does not establish release readiness for BUG-033.
- Owner manual app verification: FAIL for current duration behavior.
- Documentation synchronization: PASS after this diagnosis-state update.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Perform diagnosis on the existing saved P1 artifacts/runtime evidence: quantify transcript/speech occupancy/content density, define the product policy for sparse evidence, and then write the duration-controller + resume acceptance criteria. Do not make another source change until those questions are resolved.