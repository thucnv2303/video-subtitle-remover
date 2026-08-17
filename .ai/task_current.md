# Current Task

## Task ID
P1-P2-PER-JOB-EXPORT-NOVOCAL-034

## Status
KEYFRAME_FAIL_SOFT_SOURCE_PUBLISHED_OWNER_RUNTIME_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`.
- Draft PR: #74.
- Keyframe fail-soft source commit: `eab41008133fab56f2551417b3b7e7e5d23c0487`.
- Base: `fbaa060bc9f604fc93e3e195e264ea27e78921fd`.

## User outcome
P1 must not abort because one sampled MP4/VFR frame reported by metadata cannot be decoded. When enough usable keyframes remain, P1 continues to Vision/global reasoning. Task-034 per-Job exports and P2 no-vocal behavior remain unchanged.

## Repair contract
- Keep `sampleFrameIndexes()` architecture unchanged.
- On requested keyframe failure, retry up to 3 earlier frame indexes.
- Never duplicate a frame already accepted for the current visual context.
- Log requested-frame failure, successful fallback, or skipped sample.
- Keep the existing safety threshold unchanged: fewer than `Math.min(3, indexes.length)` usable frames fails P1.
- Do not change ASR, AI narration/remix, path compatibility, task-034 export behavior, P2, Demucs, P3, Voice Render, or standalone Xóa Sub.

## Required Owner verification
Preflight in `E:\Project AI\Video-sub-remove-owner-test-LONG012`:
```text
git fetch origin
git switch review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034
git pull --ff-only
node --check src/renderer/js/pipeline1-analysis.js
node --check src/main/main-entry.js
node --check src/main/preload.js
node --check src/renderer/js/job-export-controls.js
git diff --check fbaa060bc9f604fc93e3e195e264ea27e78921fd..HEAD
```

Runtime with the same source video:
`E:\Tải về\TikVideo.App_7595712770348827761.mp4`

Acceptance order:
1. P1 ASR still completes.
2. If requested frame 1386 fails, log shows the failure plus either a previous-frame fallback or sample skip.
3. With enough usable frames, P1 continues into Vision/global reasoning and completes rather than aborting on HTTP 400.
4. Only after P1 completes, continue task-034 checks: P1 `↓ Kết quả`, P2 `↓ P2`, P2 `♬ Xóa giọng`, then `↓ Không giọng`.
5. Canonical P2 output/P3 authority remains unchanged.

## Gates
- Execution: PASS for fail-soft source publication.
- Automated/static: WAITING exact Owner checkout preflight; no GitHub CI run is available.
- Code review: PASS for narrow GitHub diff/full-file review.
- Owner runtime: WAITING same-video rerun.
- Documentation synchronization: IN PROGRESS until handoff/ACTIVE sync completes.
- Merge: BLOCKED.

## Next action
Synchronize remaining canonical docs, then Owner runs the exact preflight and same-video runtime scenario. Do not merge.
