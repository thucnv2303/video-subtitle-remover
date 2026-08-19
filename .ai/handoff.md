# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-ECHOMIMICV3-036`

## Status
CUDA OOM ROOT CAUSE VERIFIED / NARROW 16GB BENCHMARK MITIGATION PUBLISHED / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open, DO NOT MERGE.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Source mitigation commit: `2d5874b079f434ddf8a8d8908f2dbce527273506`.
- EchoMimicV3 upstream: `antgroup/echomimic_v3@7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime: `C:\VSR-EchoMimicV3`.
- Owner test worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## What happened in the last runtime
Owner successfully reached real EchoMimicV3 Flash inference on RTX 5060 Ti 16 GB. Model loading succeeded, including the Flash transformer with zero missing/unexpected keys. The job then failed during VAE mask latent encoding with `torch.OutOfMemoryError`: 15.93 GiB GPU capacity was exhausted and PyTorch could not allocate another 540 MiB.

This is the current runtime blocker. Earlier dependency/setup issues are no longer the active blocker.

## Important source finding
The integration previously logged `sequential CPU offload`, but pinned upstream `infer_flash.py` only parses/assigns `GPU_memory_mode`; its current path still calls `pipeline.to(device=device)`. Therefore do not treat the old log line as evidence that sequential CPU offload was actually active.

## Current published mitigation
At source commit `2d5874b079f434ddf8a8d8908f2dbce527273506`, `src/main/echomimicv3-engine.js` now:
- retains Flash 8-step, 768x768, 25 FPS;
- uses 49 frames instead of 81 for this owner benchmark;
- passes `--teacache_offload`;
- sets `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True`;
- logs the real 49-frame benchmark profile rather than claiming sequential CPU offload;
- classifies CUDA OOM explicitly.

Do not lower resolution yet. The purpose of this run is to determine whether a smaller temporal window plus memory mitigations can preserve the intended quality benchmark on 16 GB.

## Exact next action for a new Project Control chat
1. At startup, use GitHub as source of truth and verify PR #76, exact current HEAD, and read `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md` from that exact HEAD.
2. Confirm these three canonical files describe task 036 and the CUDA OOM retest. If not, BLOCK as project knowledge out of sync.
3. Review the final diff/full `src/main/echomimicv3-engine.js` and current checks before authorizing Owner retest.
4. Owner then fast-forwards `E:\Project AI\Video-sub-remove-owner-test-LONG012` to exact branch HEAD, restarts app, and renders the same portrait + Vietnamese voice using `Chất lượng cao`.
5. If MP4 succeeds: collect Owner quality comparison against JoyVASA for lip sync, eyes/blink, expression, head motion, temporal stability, realism.
6. If CUDA OOM persists: stop runtime attempts. PM should design a controlled low-VRAM implementation/offload profile; do not ask Owner to randomly lower resolution or settings.
7. Never merge until Owner PASS is recorded into canonical `.ai/` and all gates pass.

## Owner checkout pattern
```text
cd "E:\Project AI\Video-sub-remove-owner-test-LONG012"
git fetch origin
git merge --ff-only origin/review/TALKING-PORTRAIT-ECHOMIMICV3-036
git rev-parse HEAD
```
The expected SHA must be taken from PR #76 at the moment of the new chat startup because these documentation commits advance branch HEAD beyond source commit `2d5874b...`.

## Gates at handoff
- Execution: PASS for narrow OOM mitigation publication.
- Automated verification: WAITING final exact HEAD.
- Code review: WAITING final exact HEAD.
- Owner runtime: WAITING RETEST.
- Documentation synchronization: requires final re-read of all three canonical files after this handoff commit.
- Merge permission: BLOCKED.

## Forbidden
- No merge.
- No changes outside task 036 scope.
- No P1/P2/P3, Voice Render, Xoa Sub, task-034 changes.
- No JoyVASA runtime mutation.
- No random sequence of quality reductions after another OOM.
