# Current Task

## Task ID
TALKING-PORTRAIT-ECHOMIMICV3-036

## Status
CONTROLLED_SEQUENTIAL_CPU_OFFLOAD_PUBLISHED_OWNER_RETEST_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Low-VRAM source commit: `e5d4ea273759f70b7030cd7073f1035948d9e53e`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.

## User outcome
Use EchoMimicV3 Flash as AI Avatar `Chất lượng cao` while preserving JoyVASA as fast/preview. Obtain one real quality MP4 on RTX 5060 Ti 16 GB without lowering spatial quality prematurely.

## Verified blocker and root cause
The 768p/49-frame mitigation still OOMed in VAE mask latent encoding, again requiring 540 MiB after physical VRAM was exhausted. `expandable_segments` is unsupported on this Windows Torch build. Upstream accepted a `GPU_memory_mode` argument but did not use it; two unconditional `pipeline.to(device=device)` calls kept the whole pipeline on CUDA.

## Controlled mitigation under test
- Keep 768x768, 25 FPS, 49 frames, Flash 8-step and TeaCache offload.
- Patch exact pinned upstream so `GPU_memory_mode=sequential_cpu_offload` calls `pipeline.enable_sequential_cpu_offload()` and does not subsequently force the full pipeline back to CUDA.
- Setup applies/verifies the patch with marker `VSR_LOW_VRAM_OFFLOAD_V1`.
- Engine requires the marker before reporting Ready and passes the mode explicitly.
- No random quality reductions are permitted.

## Owner retest procedure
From `E:\Project AI\Video-sub-remove-owner-test-LONG012`, fast-forward to the latest branch HEAD, run the setup script once, confirm the low-VRAM READY marker, restart the app, then render the same portrait + Vietnamese voice with `Chất lượng cao`.

Required runtime evidence:
- setup: `[EchoMimicV3] low-vram: sequential CPU offload V1`;
- render: `VSR_LOW_VRAM_OFFLOAD_V1: sequential CPU offload enabled.`;
- either a real MP4 is produced or the exact new failure log is captured.

If OOM persists: STOP. Do not manually lower resolution, frames or settings.

## Gates
- Execution: PASS for low-VRAM source publication.
- Automated/static: WAITING Owner exact-HEAD/setup evidence; GitHub has no CI status for the source commit.
- Code review: PASS for narrow source diff/full files.
- Owner runtime: WAITING RETEST.
- Documentation sync: PASS after final exact-HEAD re-read.
- Merge: BLOCKED.

## Forbidden
- Do not merge PR #76.
- Do not modify P1/P2/P3, Voice Render, standalone Xoa Sub, task 034, or JoyVASA runtime.
- Do not retry with arbitrary lower quality if sequential offload still OOMs.
