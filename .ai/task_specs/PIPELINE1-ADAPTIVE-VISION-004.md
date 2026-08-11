# PIPELINE1-ADAPTIVE-VISION-004

## Goal
Replace the fixed Pipeline 1 keyframe count with duration-aware adaptive visual sampling and bounded hierarchical chunk analysis so longer videos provide proportionally more visual evidence without creating a single unbounded Vision request.

## Exact basis
- Parent review head: `4508eaed5be1130519e57f927f761976dd5a5458`.
- Review branch: `review/PIPELINE1-ADAPTIVE-VISION-004`.
- Parent task/PR remains `PIPELINE1-MULTIJOB-RESILIENCE-003` / PR #44 and is not merged by this task.

## User outcome
Pipeline 1 automatically chooses enough visual evidence for the actual video duration. A 20–30 second video remains inexpensive; longer videos gain more keyframes and, when needed, multiple bounded Vision passes. Global reasoning still sees the whole transcript plus the structured visual timeline from all chunks.

## Scope allowed
- `src/renderer/js/pipeline1-analysis.js`
- `src/main/p1-vision-ipc.js`
- canonical `.ai/` task/state/QA/architecture docs affected by this change.

## Scope forbidden
- No P2/P3/STTN/Settings source changes.
- No TTS changes.
- No dependency churn.
- No broad `app.js` refactor.
- No unbounded frame count, payload size, model output, retry loop, or timeout.

## Required behavior
1. Remove the global fixed `FRAME_SAMPLE_COUNT = 8` behavior as the sampling authority.
2. Compute target visual samples from input video duration.
3. Preserve a sensible minimum for short videos and a hard total safety ceiling.
4. Preserve first/last timeline coverage and distribute baseline samples across the whole duration.
5. If total evidence fits one safe Vision request, use one chunk.
6. If evidence exceeds one request, split into chronological chunks with bounded frames per chunk.
7. Each chunk receives only transcript segments overlapping its time range plus its keyframes.
8. Each Vision chunk produces structured evidence only; it must not independently generate the final remix script.
9. After all chunks succeed, run one global reasoning pass using:
   - complete source transcript;
   - ordered structured visual chunk results;
   - original video metadata/user prompt.
10. Global output remains the existing final P1 schema/artifact contract.
11. Chunk failure is bounded and explicit; do not silently skip a failed chunk and claim full-video analysis.
12. Cancel/timeout remains effective across chunk processing.
13. The existing fallback path for a reasoning model that is itself vision-capable remains supported without forcing a separate fallback vision model.
14. Logging must expose adaptive plan: duration, total keyframes, chunk count, per-chunk frame/time range, without dumping image payloads.

## Initial sampling policy
Use duration as the deterministic baseline:
- target interval: approximately 4 seconds;
- minimum total frames: 6;
- short-video compatibility target: at least 8 frames for videos around 30 seconds when frame count permits;
- maximum frames per Vision chunk: 8;
- hard maximum total sampled frames: 80.

The implementation may normalize these constants as long as the behavior remains duration-aware, bounded, and testable.

## Long-video behavior
Examples expected from the baseline policy, subject to total frame availability:
- ~24 s: about 8 frames, 1 chunk.
- ~60 s: about 15 frames, 2 chunks.
- ~5 min: about 75 frames, about 10 chunks.
- Extremely long videos: capped at the hard total frame ceiling and must log that the safety cap was reached.

## Artifact requirements
`multimodal_timeline.json` must record enough sampling provenance to audit the analysis:
- adaptive sampling mode/version;
- sampled keyframe timestamps;
- chunk boundaries/count;
- per-chunk frame timestamps or equivalent ordered evidence metadata.

Do not store base64 images in artifacts.

## Verification required
- `node --check src/renderer/js/pipeline1-analysis.js`
- `node --check src/main/p1-vision-ipc.js`
- deterministic sampling tests for at least 24 s, 60 s, 300 s, and a duration that hits the total safety cap;
- chunking test proves each chunk has <= max frames/request and ordered coverage spans video start→end;
- transcript slicing test proves each chunk receives only overlapping timestamped SRT segments while global reasoning receives the full transcript;
- final reasoning runs once after all visual chunks, not once per chunk;
- cancellation/failure of any chunk prevents false P1 success;
- `git diff --check` or exact changed-file equivalent;
- PM source review before Owner runtime test.

## Owner runtime acceptance
Test at least:
1. Current short `test3.mp4`: adaptive log shows approximately 8 frames / one Vision chunk and completes through global reasoning.
2. A longer video (>60 s preferred): log shows a larger automatically calculated frame count and multiple bounded chunks.
3. No fixed-eight behavior for the longer video.
4. Final artifacts remain readable and P1→P2 unlock occurs only after all chunks + global reasoning + required TTS/artifacts succeed.

## Merge
BLOCKED until automated/static verification, PM code review, fresh Owner runtime PASS, documentation synchronization, and explicit PM approval.
