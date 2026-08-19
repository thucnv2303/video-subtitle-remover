# Current Task

## Task ID
TALKING-PORTRAIT-ECHOMIMICV3-036

## Status
OWNER_RETEST_WAITING_AFTER_CUDA_OOM_MITIGATION_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Latest source mitigation commit: `2d5874b079f434ddf8a8d8908f2dbce527273506`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.

## User outcome
Use EchoMimicV3 Flash as the AI Avatar `Chất lượng cao` renderer while preserving JoyVASA as the fast/preview path. The immediate objective is to obtain one real quality benchmark MP4 on the Owner RTX 5060 Ti 16 GB without lowering quality prematurely.

## Verified current blocker
The first real EchoMimicV3 quality run reached inference and loaded the Flash checkpoint, then failed in VAE mask latent encoding with CUDA OOM. The GPU had 15.93 GiB total VRAM and could not allocate an additional 540 MiB. This supersedes earlier setup/dependency blockers.

## Current mitigation under test
`src/main/echomimicv3-engine.js` at source commit `2d5874b079f434ddf8a8d8908f2dbce527273506`:
- 768x768, 25 FPS, 8 inference steps retained;
- `video_length` 81 -> 49 frames;
- TeaCache offload enabled;
- child env sets `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`;
- misleading sequential CPU offload claim removed;
- explicit OOM classification added.

## Owner retest
From `E:\Project AI\Video-sub-remove-owner-test-LONG012`:
```text
git fetch origin
git merge --ff-only origin/review/TALKING-PORTRAIT-ECHOMIMICV3-036
git rev-parse HEAD
```
The exact HEAD for the retest must be the latest branch HEAD after canonical docs synchronization, not merely the source commit above.

Then restart the app; do not rerun model setup unless engine readiness is no longer Ready. Use the same portrait and Vietnamese voice, select `Chất lượng cao`, and render.

## Acceptance for next report
- EchoMimicV3 starts on the 49-frame profile.
- No CUDA OOM; an MP4 is produced, OR a new exact failure log is captured.
- If MP4 succeeds, Owner evaluates mouth sync, eye/blink activity, facial expression, head motion, temporal stability, and realism versus JoyVASA.
- If OOM persists, stop. Do not manually reduce resolution/settings; PM must design the next controlled low-VRAM profile.

## Gates
- Execution: PASS for current mitigation publication.
- Automated/static: WAITING final exact HEAD verification.
- Code review: WAITING final exact HEAD review.
- Owner runtime: WAITING RETEST.
- Documentation sync: IN PROGRESS until handoff is synchronized and files are re-read.
- Merge: BLOCKED.

## Forbidden
- Do not merge PR #76.
- Do not modify P1/P2/P3, Voice Render, standalone Xoa Sub, or task 034.
- Do not reinstall/change the JoyVASA runtime.
- Do not guess multiple quality reductions after another OOM.
