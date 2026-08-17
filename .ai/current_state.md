# Current State

## Status
P1-P2-PER-JOB-EXPORT-NOVOCAL-034 — SOURCE PUBLISHED / OWNER RUNTIME BLOCKED BY P1 KEYFRAME DECODE ROBUSTNESS / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`.
- Active Draft PR: #74.
- Application-source HEAD before this incident docs sync: `eb6301c65132cb3cab77dbdd4564c541fa58bb60`.
- Base: `review/P1-P2-HANDOFF-HYDRATION-032@fbaa060bc9f604fc93e3e195e264ea27e78921fd`.

## Task 034 scope already implemented
1. P1 per-Job Save As for generated artifact files.
2. P2 per-Job Save As for canonical clean/no-sub video.
3. P2 optional Demucs-strict no-original-vocal derivative.
4. Derivative does not replace canonical P2 `outputPath` and does not change P3 input authority.
5. No librosa/weak fallback for the derivative.

## Runtime evidence from Owner on 2026-08-17
Test video: `E:\Tải về\TikVideo.App_7595712770348827761.mp4`.
- Absolute Unicode path: PASS.
- `/api/video-info`: PASS.
- preview frame 0: PASS.
- P1 ASR: PASS, 15 subtitle segments.
- Adaptive vision successfully fetched frames 0, 126, 252, 378, 504, 630, 756, 882, 1008, 1134, 1260.
- Request for frame 1386 returned HTTP 400: backend/OpenCV could not decode that final sampled frame.
- P1 aborted the entire analysis on this one failed frame.

## Verified root cause direction
`src/renderer/js/pipeline1-analysis.js::sampleFrameIndexes()` already clamps indexes to `totalFrames - 1`; this is not a frontend off-by-one bug.

The backend-reported frame count and actually decodable final frame can differ for some MP4/VFR sources. The real robustness defect is `collectVisualContext()`: a single `window.api.getFrame()` rejection aborts all of P1 even when enough earlier keyframes have already been collected.

## Required narrow repair before continuing Owner test
In `collectVisualContext()`:
- handle a failed sampled keyframe independently;
- prefer retrying one or more nearby earlier frame indexes for an undecodable end-frame sample;
- if nearby retry still fails, log a warning and skip that sample;
- continue analysis when the remaining valid keyframe count is above the existing safety threshold;
- fail only when too few usable keyframes remain;
- do not change ASR, narration, export 034, P2, Demucs, P3, or file-path architecture.

## Process incident note
A temporary `noop.tmp` file was accidentally created during GitHub tooling and deleted in the immediately following commit. It is not present in the final tree and no application source was modified by that incident.

## Gates
- Task 034 implementation: PASS for published source scope.
- Code review of 034 application source: PASS before latest runtime incident.
- Owner runtime for 034: BLOCKED because P1 cannot complete on the current test video.
- P1 keyframe robustness repair: NOT IMPLEMENTED.
- Documentation synchronization: PASS after this commit.
- Merge permission: BLOCKED.

## Next permitted action
Create/publish a narrow P1 keyframe fail-soft repair from the current PR #74 branch/ref, static-review it, then Owner reruns the same `TikVideo.App_7595712770348827761.mp4`. Only after P1 completes may Owner continue testing the task-034 P1/P2 export and P2 no-vocal features. No merge.
