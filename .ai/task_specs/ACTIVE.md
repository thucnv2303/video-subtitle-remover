# Active PM Execution Spec

Status: P1_KEYFRAME_FAIL_SOFT_OWNER_RUNTIME_WAITING

Task: `P1-P2-PER-JOB-EXPORT-NOVOCAL-034`
Repository: `thucnv2303/video-subtitle-remover`
Branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`
Draft PR: #74
Keyframe fail-soft source commit: `eab41008133fab56f2551417b3b7e7e5d23c0487`
Base: `fbaa060bc9f604fc93e3e195e264ea27e78921fd`

## Active purpose
Verify the narrow P1 sampled-keyframe fail-soft repair before resuming task-034 export/no-vocal runtime acceptance.

## Source repair contract
- `sampleFrameIndexes()` remains unchanged.
- A sampled frame decode failure is isolated to that sample.
- Retry up to 3 previous frame indexes.
- Do not duplicate an already accepted frame.
- Log requested failure, fallback success, or sample skip.
- Continue when the existing usable-keyframe threshold is satisfied.
- Fail when fewer than `Math.min(3, indexes.length)` usable keyframes remain.

## Unchanged product invariants
- Task-034 P1/P2 Save As behavior remains per Job.
- P2 no-vocal derivative remains Demucs strict and separate from canonical `job.outputPath`.
- P3 input authority remains canonical P2 output.
- ASR, AI narration/remix, file-path compatibility, P2, Demucs implementation, P3, Voice Render, and standalone Xóa Sub are outside this repair scope.

## Owner acceptance
Use `.ai/task_current.md` exact checkout preflight in `E:\Project AI\Video-sub-remove-owner-test-LONG012`, then rerun:
`E:\Tải về\TikVideo.App_7595712770348827761.mp4`

P1 acceptance: frame 1386 failure must not abort P1 immediately; fallback/skip must be visible in logs; P1 must proceed to Vision/global reasoning when enough usable keyframes remain. After P1 completes, continue task-034 P1/P2 export and P2 no-vocal checks.

## Gates
Execution PASS; automated/static WAITING exact Owner checkout; code review PASS for narrow source diff/full-file review; Owner WAITING; docs sync PASS after this publication; merge BLOCKED.

## Next action
Owner runtime verification only. Do not merge before Owner PASS is recorded in canonical project state.
