# AgentOS Handoff Status

## Active task
`P1-P2-PER-JOB-EXPORT-NOVOCAL-034`

## Status
KEYFRAME FAIL-SOFT SOURCE PUBLISHED / CODE REVIEW PASS / OWNER RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/P1-P2-PER-JOB-EXPORT-NOVOCAL-034`.
- Draft PR: #74.
- Keyframe fail-soft source commit: `eab41008133fab56f2551417b3b7e7e5d23c0487`.
- Base: `review/P1-P2-HANDOFF-HYDRATION-032@fbaa060bc9f604fc93e3e195e264ea27e78921fd`.

## Task 034 behavior retained
- P1 Job cards: `↓ Kết quả` Save As artifacts.
- P2 Job cards: `↓ P2` Save As canonical clean video.
- P2 optional `♬ Xóa giọng` uses Demucs strict and stores a separate derivative exposed as `↓ Không giọng`.
- Canonical `job.outputPath` and P3 input authority remain unchanged.

## New P1 runtime repair
Owner's same-video run showed frame 1386 could not be decoded although earlier adaptive keyframes succeeded. `pipeline1-analysis.js` now:
- logs the requested-frame decode failure;
- retries frameIndex-1/-2/-3 without using an already-accepted frame;
- logs the fallback frame when successful;
- logs and skips the sample if all candidates fail;
- preserves the existing minimum usable-keyframe threshold.

## Review evidence
- Source repair commit changes only `src/renderer/js/pipeline1-analysis.js`.
- Full file re-read from GitHub after publication.
- No unresolved PR review threads were present at preflight.
- No GitHub Actions workflow run was present on the pre-repair HEAD.
- PM environment cannot clone the private repository, so exact local syntax/diff commands remain Owner preflight requirements.

## Owner test sequence
Use `E:\Project AI\Video-sub-remove-owner-test-LONG012`:
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
Then rerun exactly:
`E:\Tải về\TikVideo.App_7595712770348827761.mp4`

Expected: frame 1386 failure no longer kills P1 immediately; fallback or skip is logged; if at least the existing threshold of usable keyframes remains, P1 continues through Vision/global reasoning. After P1 completes, continue task-034 export/no-vocal tests.

## Gates
- Execution: PASS.
- Automated/static: WAITING Owner exact-checkout preflight.
- Code review: PASS for narrow source diff/full-file review.
- Owner verification: WAITING.
- Documentation sync: IN PROGRESS until ACTIVE sync completes.
- Merge permission: BLOCKED.

## Next permitted action
Synchronize ACTIVE.md, re-read exact PR HEAD, then Owner runs the commands and same-video scenario above. No merge.
