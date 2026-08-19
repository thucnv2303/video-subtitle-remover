# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — 768P/49F MITIGATION OOM CONFIRMED / CONTROLLED SEQUENTIAL CPU OFFLOAD FIX PUBLISHED / STATIC+OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Low-VRAM source commit: `e5d4ea273759f70b7030cd7073f1035948d9e53e`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime root: `C:\VSR-EchoMimicV3`.

## Verified runtime facts
1. EchoMimicV3 setup/weights/CUDA are working on RTX 5060 Ti 16 GB; Flash transformer reaches `missing keys: 0, unexpected keys: 0`.
2. The first full-GPU run OOMed during VAE mask latent encoding; the 768x768 / 49-frame / TeaCache-offload mitigation reproduced the same OOM while trying to allocate another 540 MiB with 15.93 GiB physical VRAM exhausted.
3. Windows Torch reported `expandable_segments not supported on this platform`; that allocator setting is therefore removed from the controlled profile.
4. Pinned upstream `infer_flash.py` parses `GPU_memory_mode` but ignored it and called `pipeline.to(device=device)` twice.
5. Pinned upstream pipeline declares `model_cpu_offload_seq = "text_encoder->clip_image_encoder->transformer->vae"`, and its Diffusers base supports CPU offload hooks. The controlled fix now uses `pipeline.enable_sequential_cpu_offload()` before any full-pipeline CUDA placement and removes the duplicate unconditional `.to(device)` calls.

## Published controlled low-VRAM profile
Commit `e5d4ea273759f70b7030cd7073f1035948d9e53e`:
- adds `scripts/echomimicv3-lowvram.patch` against the exact pinned upstream;
- setup applies the patch idempotently and verifies marker `VSR_LOW_VRAM_OFFLOAD_V1`;
- engine refuses Ready status when the runtime patch is absent;
- explicitly passes `--GPU_memory_mode sequential_cpu_offload`;
- keeps Flash 8-step, 768x768, 25 FPS, 49 frames and TeaCache offload unchanged;
- removes the unsupported Windows allocator hint.

## Gates
- Execution: PASS for controlled low-VRAM source publication.
- Automated/static verification: WAITING Owner exact-HEAD/setup evidence; no GitHub CI status is present on the source commit.
- Code review: PASS for the narrow source diff/full-file review; runtime behavior remains unverified.
- Owner runtime: WAITING after setup reapplies the pinned upstream patch.
- Documentation synchronization: PASS after this docs commit is re-read on final HEAD.
- Merge permission: BLOCKED.

## Next permitted action
1. Owner fast-forwards `E:\Project AI\Video-sub-remove-owner-test-LONG012` to final branch HEAD.
2. Run `scripts/setup-echomimicv3.ps1` once so the pinned runtime receives low-VRAM patch V1. Existing weights should be reused.
3. Verify setup prints `[EchoMimicV3] low-vram: sequential CPU offload V1`.
4. Restart app and render the same portrait + Vietnamese voice using `Chất lượng cao`.
5. Runtime log must print `VSR_LOW_VRAM_OFFLOAD_V1: sequential CPU offload enabled.` before inference.
6. If OOM persists, STOP. Do not reduce resolution/frame count/settings without a new PM design.

## Merge
BLOCKED until static/runtime gates pass, Owner produces and accepts a real MP4, result is recorded in canonical `.ai/`, and merge is explicitly approved.
