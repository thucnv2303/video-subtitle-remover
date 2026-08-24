# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — R&D CONTINUE / MMGP V5.2.5 CONTROLLED CHUNK COMPLETE / PERSISTENT-WORKER ARCHITECTURE NEXT / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, open, not merged.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Verified source HEAD before this docs sync: `731e0cfaa43a46c2af0bf225d12ab9beff6301b4`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- GPU: NVIDIA GeForce RTX 5060 Ti, 15.93 GiB VRAM.
- Runtime root: `C:\VSR-EchoMimicV3`.
- Owner worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Verified runtime progression
1. Full GPU 768p failed by CUDA OOM; 16 GB cannot hold the unquantized whole pipeline resident.
2. Sequential/model CPU offload avoided OOM but was product-infeasible.
3. Custom block streaming V5.1 was the first end-to-end success: ~14.86 s output completed in ~69m36s; visual quality still needs revision.
4. V5.2 moved memory management to MMGP `LowRAM_HighVRAM`, 90% VRAM budget, transformer `quanto.qint8`, MMGP hooks/pinned RAM, TeaCache, controlled 49-frame benchmark.
5. Audio model repair and V5.2.1 CPU-index fix removed bootstrap/indexing blockers.
6. V5.2.2/V5.2.3/V5.2.4 isolated and removed post-denoise stalls caused by Diffusers hook cleanup / BaseOutput return on the MMGP path.
7. V5.2.5 added flushed post-return timing and a hard stop after chunk 1.
8. Owner V5.2.5 benchmark completed chunk 1 cleanly: `pipeline_seconds=186.672`, `peak_cuda_gb=10.930`, 49 frames, 768x768, 25 FPS, Flash 8-step, TeaCache, MMGP 90% budget.
9. Denoise itself completed in ~130 s; VAE decode took ~10.856 s; GPU->CPU frame transfer took ~0.082 s. No OOM or exception occurred.
10. Cold start remains large: render request at 10:12:50 reached `pipeline_start` at 10:16:58 (~248 s). Current Electron engine spawns a fresh Python `infer_flash.py` process per render, forcing model load, MMGP setup, and transformer quantization on every click.
11. Upstream `app_mm.py` loads pipeline/Wav2Vec/MMGP once at process startup and reuses them across repeated `generate()` calls. Current app architecture does not reuse the warm model state.
12. `flash_attn_package=False`; Torch SDP backends report enabled and runtime warns the padding-mask SDPA path may significantly affect performance.

## Engineering conclusion
MMGP is now the verified active memory architecture. The next highest-ROI change is not another per-kernel tweak: it is a persistent EchoMimic worker so model loading/MMGP quantization happens once per app/runtime session instead of once per render. After warm-worker timing is verified, optimize chunk length/attention/step profile in isolated A/B benchmarks.

## Gates
- Functional feasibility: PASS from V5.1 end-to-end output.
- MMGP controlled first chunk: PASS for stability; 186.672 s is slightly above the <=180 s R&D target.
- VRAM headroom: PASS for 49-frame profile; peak allocation 10.930 GiB on 15.93 GiB GPU.
- Cold-start performance: FAIL / primary architecture bottleneck.
- Visual quality: NEEDS_REVISION; quality tuning remains deferred until warm-worker baseline exists.
- Code review: WAITING for next R&D iteration.
- Documentation synchronization: PASS after this update.
- Merge permission: BLOCKED.

## Next permitted action
Design and implement a narrow persistent-worker V5.3: start one long-lived Python process, initialize EchoMimic/MMGP once, accept render jobs over a simple local IPC boundary, keep one-job-at-a-time semantics and cancellation, and measure cold-start separately from warm render time. Do not merge PR #76.