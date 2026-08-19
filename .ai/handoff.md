# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-ECHOMIMICV3-036`

## Status
49-FRAME OOM REPRODUCED / REAL SEQUENTIAL CPU OFFLOAD FIX PUBLISHED / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open, DO NOT MERGE.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Low-VRAM source commit: `e5d4ea273759f70b7030cd7073f1035948d9e53e`.
- EchoMimicV3 upstream: `antgroup/echomimic_v3@7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime: `C:\VSR-EchoMimicV3`.
- Owner test worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Latest owner runtime
The 768x768 / 49-frame mitigation still reached real Flash inference but failed at VAE mask latent encoding with `torch.OutOfMemoryError`, trying to allocate 540 MiB after the RTX 5060 Ti 15.93 GiB VRAM was exhausted. Windows Torch also reported `expandable_segments not supported on this platform`.

## Root cause finding
Pinned upstream `infer_flash.py` parses `GPU_memory_mode` with default `sequential_cpu_offload` but never uses it. Instead it calls `pipeline.to(device=device)` twice. The pipeline itself declares an offload sequence and inherits Diffusers offload support. Therefore the previous runtime was not actually using sequential CPU offload.

## Published controlled fix
Source commit `e5d4ea273759f70b7030cd7073f1035948d9e53e`:
- adds an exact-upstream patch that activates `pipeline.enable_sequential_cpu_offload()` for `GPU_memory_mode=sequential_cpu_offload`;
- removes the two unconditional full-pipeline CUDA placements in that mode;
- setup applies the patch idempotently and verifies `VSR_LOW_VRAM_OFFLOAD_V1`;
- engine requires that marker, passes the memory mode explicitly and logs the truthful profile;
- retains 768x768, 49 frames, 25 FPS, Flash 8-step and TeaCache offload;
- removes the unsupported allocator environment setting.

## Exact next action
1. Verify PR #76 final HEAD and re-read canonical files.
2. Owner fast-forwards `E:\Project AI\Video-sub-remove-owner-test-LONG012` to final HEAD.
3. Run `powershell -ExecutionPolicy Bypass -File scripts/setup-echomimicv3.ps1` once. It should reuse existing assets but must re-check/install dependencies and apply low-VRAM patch V1.
4. Require `[EchoMimicV3] low-vram: sequential CPU offload V1` before app runtime.
5. Restart app and render the same portrait + Vietnamese voice using `Chất lượng cao`.
6. Require runtime marker `VSR_LOW_VRAM_OFFLOAD_V1: sequential CPU offload enabled.`.
7. If MP4 succeeds, collect quality comparison against JoyVASA. If OOM persists, STOP and return exact log; no arbitrary quality reduction.

## Gates
- Execution: PASS for controlled low-VRAM publication.
- Automated verification: WAITING Owner exact-HEAD/setup evidence; no GitHub CI status is present.
- Code review: PASS for the narrow source diff/full files.
- Owner runtime: WAITING RETEST.
- Documentation synchronization: PASS after final exact-HEAD re-read.
- Merge permission: BLOCKED.

## Forbidden
- No merge.
- No P1/P2/P3, Voice Render, Xoa Sub, task-034, or JoyVASA runtime changes.
- No random sequence of quality reductions after another OOM.
