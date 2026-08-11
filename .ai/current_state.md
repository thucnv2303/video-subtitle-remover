# Current State

## Status
PIPELINE1-ADAPTIVE-VISION-004 — SOURCE REVIEW PASS / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent review branch/head: `review/PIPELINE1-MULTIJOB-RESILIENCE-003@4508eaed5be1130519e57f927f761976dd5a5458`.
- Active review branch: `review/PIPELINE1-ADAPTIVE-VISION-004`.
- Draft PR: #45.
- Current reviewed source commit: `1bde0d6db589f53406de4038f2781d9c3164fbd9`.
- PM source review: `4904434998`.

## Owner requirement
Pipeline 1 must not use one fixed keyframe count for every video. Visual evidence must scale automatically with the input video duration while each model request remains bounded.

## Current implementation
- Renderer sampling baseline: approximately one keyframe per 4 seconds.
- Short-video floor: 6 frames, with at least 8 for videos around 20–30 seconds when source frame count permits.
- Hard total safety ceiling: 80 sampled frames.
- Maximum per Vision request: 8 frames.
- Frames are distributed across the complete video timeline, including first/last coverage.
- Evidence beyond one safe request is split into ordered chronological Vision chunks.
- Each chunk receives only SRT blocks overlapping its time range.
- Vision chunks produce structured visual evidence only; they do not generate the final remix script.
- After all chunks succeed, exactly one global reasoning stage receives the full source transcript plus ordered structured chunk evidence and produces the existing final P1 schema.
- `multimodal_timeline.json` records sampling/chunk provenance without base64 images; artifact version is now 2 and analysis mode is `multimodal-adaptive-chunks-v2`.

## Deterministic verification evidence
PASS from PM simulation:
- 24 s -> 8 frames / 1 chunk.
- 60 s -> 15 frames / 2 chunks.
- 300 s -> 75 frames / 10 chunks.
- 400 s -> 80-frame safety cap / 10 chunks.
- Every simulated chunk has <=8 frames; coverage begins at 0 and final chunk ends at video duration.
- Transcript overlap simulation: a segment spanning a chunk boundary is included in both adjacent chunks; non-overlapping segments are excluded.

## Verification limits
- PM source/diff review: PASS `4904434998`.
- Exact final `node --check` of both published JS blobs: WAITING.
- Exact final diff-hygiene command: WAITING.
- GitHub CI/status checks: none configured.
- Owner real-app adaptive runtime: NOT STARTED.
- Parent PR #44 runtime evidence remains inherited, including path compatibility and OmniVoice release; it is not converted into adaptive-runtime PASS.

## Gates
- Execution: PASS.
- Automated/static verification: PARTIAL / WAITING exact final commands.
- Code review: PASS for source logic/scope at `1bde0d6...`.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: PASS for dynamic state after the docs commit containing this file; architecture narrative follow-up is tracked in the active task spec.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Run exact static checks on the final adaptive head, then Owner runtime tests a short video and a >60-second video. Do not merge or start Step 3 until adaptive sampling/chunk/global-reasoning behavior is runtime verified and the Owner result is recorded.
