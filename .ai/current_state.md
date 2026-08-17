# Current State

## Status
P1-P2-PER-JOB-EXPORT-NOVOCAL-034 — KEYFRAME FAIL-SOFT SOURCE PUBLISHED / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`.
- Active Draft PR: #74.
- Keyframe fail-soft source commit: `eab41008133fab56f2551417b3b7e7e5d23c0487`.
- Base: `review/P1-P2-HANDOFF-HYDRATION-032@fbaa060bc9f604fc93e3e195e264ea27e78921fd`.

## Task 034 scope already implemented
1. P1 per-Job Save As for generated artifact files.
2. P2 per-Job Save As for canonical clean/no-sub video.
3. P2 optional Demucs-strict no-original-vocal derivative.
4. Derivative does not replace canonical P2 `outputPath` and does not change P3 input authority.
5. No librosa/weak fallback for the derivative.

## Owner runtime blocker observed on 2026-08-17
Test video: `E:\Tải về\TikVideo.App_7595712770348827761.mp4`.
- Absolute Unicode path: PASS.
- `/api/video-info`: PASS.
- preview: PASS.
- P1 ASR: PASS, 15 subtitle segments.
- Frames 0 through 1260 in the adaptive sample set decoded successfully.
- Requested final sampled frame 1386 returned HTTP 400 and previously aborted P1.

## Narrow repair published
`src/renderer/js/pipeline1-analysis.js` now treats sampled-frame retrieval as fail-soft:
- requested frame decode failure is logged;
- it retries up to 3 earlier frame indexes;
- a successful fallback is logged and used with its actual frame/time;
- already-used frame indexes are not duplicated;
- if all candidates fail, the sample is logged and skipped;
- the existing usable-keyframe threshold remains unchanged: fail only when `frames.length < Math.min(3, indexes.length)`.

No sampler architecture, ASR, AI narration/remix, task-034 export behavior, P2, Demucs, P3, Voice Render, standalone Xóa Sub, or file-path compatibility was intentionally changed.

## Verification status
- GitHub source diff reviewed: only `src/renderer/js/pipeline1-analysis.js` changed in the repair commit.
- Full source file re-read from GitHub after publication.
- PR has no unresolved review threads at preflight.
- GitHub Actions workflow runs on the pre-repair HEAD: none.
- Exact local `node --check src/renderer/js/pipeline1-analysis.js` and `git diff --check fbaa060bc9f604fc93e3e195e264ea27e78921fd..HEAD`: WAITING Owner checkout because PM environment cannot clone the private repository for local execution.
- Deterministic runtime simulation was not added in this narrow repair; Owner real-video verification remains required.

## Gates
- Execution: PASS for keyframe fail-soft source publication.
- Automated/static verification: WAITING exact Owner checkout commands.
- Code review: PASS for the narrow source diff/full-file review; runtime behavior still requires Owner verification.
- Owner runtime: WAITING rerun of the same video.
- Documentation synchronization: IN PROGRESS until task_current/handoff/ACTIVE docs commit series completes.
- Merge permission: BLOCKED.

## Next permitted action
After docs synchronization, Owner checks out the exact PR head in `E:\Project AI\Video-sub-remove-owner-test-LONG012`, runs the required static commands, and reruns `E:\Tải về\TikVideo.App_7595712770348827761.mp4`. P1 must continue to Vision/global reasoning when frame 1386 fails but enough usable frames remain. Only after P1 completes should Owner continue task-034 export/no-vocal verification. No merge.
