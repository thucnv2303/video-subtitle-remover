# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — FULL GPU OOM / SEQUENTIAL OFFLOAD PERFORMANCE FAIL / MODEL CPU OFFLOAD PERFORMANCE FAIL / SELECTIVE GPU RESIDENCY V3 PUBLISHED / OWNER BENCHMARK WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime root: `C:\VSR-EchoMimicV3`.
- Owner worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Verified runtime facts
1. EchoMimicV3 setup/weights/CUDA work on RTX 5060 Ti 16 GB.
2. Full-GPU 768x768/49-frame inference OOMed at VAE mask latent encode when VRAM was exhausted and another ~540 MiB allocation was requested.
3. Real sequential CPU offload avoided OOM and produced MP4, but was far too slow for long audio.
4. Long-audio chunking V2 fixed the 49-frame total-duration cap by treating 49 frames as a per-chunk ceiling.
5. Sequential V2 projected about 8-9 minutes per 49-frame chunk, around 68-72 minutes for a ~15 s voice: performance FAIL.
6. Model CPU offload benchmark was also performance FAIL; Owner observed roughly 44 minutes without completing the first benchmark chunk.
7. Therefore neither whole-pipeline sequential offload nor whole-pipeline model offload is acceptable for the product target.

## Selective GPU Residency V3
Published source on PR #76:
- keeps Flash 8-step, 768x768, 25 FPS, 49-frame chunks and TeaCache;
- adds deterministic V3 transform for exact pinned upstream runtime;
- moves T5 to CUDA only for prompt encode, then back to CPU;
- moves VAE to CUDA for mask/video latent encode, then back to CPU;
- moves CLIP image encoder to CUDA only for image context encode, then back to CPU;
- moves the transformer to CUDA once before the denoise loop and keeps it resident for all diffusion steps;
- moves transformer back to CPU only after denoise;
- moves VAE to CUDA for decode, then returns it to CPU;
- clears CUDA cache at phase boundaries;
- adds marker `VSR_SELECTIVE_GPU_V3` in both infer and pipeline runtime files;
- adds `scripts/upgrade-echomimicv3-selective-v3.ps1`, which requires recognized V2 runtime, applies V3 transform, and `py_compile`s both patched upstream files;
- changes Windows cancel to `taskkill /PID <pid> /T /F` so the EchoMimicV3 process tree is terminated instead of only the immediate child.

## Static/code-review facts
- V3 implementation is confined to EchoMimicV3 runtime transform/upgrader/engine scope.
- Exact upstream pipeline order was verified as prompt encode -> VAE mask encode -> CLIP encode -> transformer denoise -> VAE decode.
- The selective residency phase boundaries follow that order.
- PR has no review comments at the current check.
- GitHub has no automated status checks for the current V3 HEAD; local static verification is still required before Owner runtime.

## Gates
- Execution: PASS for V3 source publication.
- Automated/static verification: WAITING local `node --check`, `git diff --check`, V3 upgrade and upstream `py_compile` evidence.
- Code review: PASS for intended V3 architecture/scope, subject to static/runtime verification.
- Owner runtime: NOT STARTED for V3.
- Documentation synchronization: PASS after this V3 state sync.
- Merge permission: BLOCKED.

## Next permitted action
1. Owner fast-forwards the owner-test worktree to the final V3 branch HEAD.
2. Run local static checks.
3. Run `scripts/upgrade-echomimicv3-selective-v3.ps1` once against the already-recognized V2 runtime.
4. Require `[EchoMimicV3] SELECTIVE GPU V3 READY` and successful `py_compile` of both upstream files.
5. Only then start the app and run one controlled 49-frame benchmark with the same portrait/voice.
6. Measure time to complete chunk 1. Target: <90 s good; 90-180 s marginal; >180 s performance FAIL.
7. On OOM or any exception, STOP; do not lower resolution/settings without PM review.

## Merge
BLOCKED until static verification, V3 Owner runtime benchmark, real output acceptance, canonical documentation update with Owner result, and explicit PM approval all pass.
