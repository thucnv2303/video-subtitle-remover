# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — R&D CONTINUE / MMGP V5.2.1 PERFORMANCE BREAKTHROUGH / QUALITY+TOTAL-CHUNK TIMING STILL WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, open, not merged.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Current source HEAD before this docs sync: `0cedb9b191e4604dd1dcda8a10e3b07ca22e1804`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- GPU: NVIDIA GeForce RTX 5060 Ti, 15.93 GiB VRAM.
- Runtime root: `C:\VSR-EchoMimicV3`.
- Owner worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Verified runtime progression
1. Full GPU 768p failed by CUDA OOM; 16 GB cannot hold the unquantized whole pipeline resident.
2. Sequential/model CPU offload avoided or reduced OOM but performance was product-infeasible.
3. Selective custom block streaming V5.1 was the first end-to-end success: ~14.86 s output completed, but total wall-clock was ~69m36s and Owner judged visual quality not good enough.
4. R&D therefore continues from V5.1 as a functional baseline; V5.1 is not production-ready and merge stays blocked.
5. V5.2 replaced custom per-block `.to(cuda)`/`.to(cpu)` streaming with MMGP `LowRAM_HighVRAM` at a 90% VRAM budget, with transformer quantization to `quanto.qint8`, MMGP hooks, pinned transformer RAM, TeaCache, and 49-frame controlled benchmark.
6. Audio-model bootstrap was repaired after setup falsely accepted an incomplete wav2vec directory. Owner verified `Wav2Vec2Model.from_pretrained(..., local_files_only=True)` PASS.
7. V5.2 first run then exposed MMGP default-device interference with CPU wav2vec indexing. V5.2.1 explicitly creates chunk index tensors on CPU and transfers only gathered audio embeddings to CUDA.
8. Owner V5.2.1 benchmark reached real denoise and completed 8/8 steps for the first 49-frame chunk in about 132.9 s (11:37:35 -> 11:39:48). V5.1 denoise baseline was roughly 6m17s-6m21s per full chunk, so MMGP cuts denoise time by about 2.8x.
9. MMGP diagnostic evidence: `mmgp 3.7.12`; profile `LowRAM_HighVRAM`; detected budget 14679 MiB of 16310 MiB; transformer quantized to `quanto.qint8`; transformer pinned in reserved RAM across 8 large blocks / ~1888.18 MB; `flash_attn_package=False`; Torch flash/memory-efficient/math SDP flags all enabled.
10. Total V5.2.1 first-chunk pipeline time and peak CUDA allocation have not yet been captured because the provided log ends immediately after denoise 8/8. VAE decode/output timing remains unverified.

## Engineering conclusion
MMGP V5.2.1 is the first performance architecture that materially improves the successful V5.1 baseline. Do not return to custom block streaming. The next optimization target should be chosen only after first-chunk `pipeline_seconds`/peak CUDA are captured. Attention remains a likely bottleneck because external `flash_attn` is absent and runtime warns that the SDPA padding-mask path can significantly affect performance.

## Product/R&D gate
- Functional feasibility: PASS from V5.1 end-to-end output.
- V5.2.1 denoise performance: PARTIAL PASS / strong improvement (~133 s for 49-frame 8-step denoise).
- Total first-chunk performance: WAITING.
- Visual quality: NEEDS_REVISION; no quality tuning is authorized until performance architecture is measured cleanly.
- Merge permission: BLOCKED.

## Next permitted action
Capture V5.2.1 first-chunk `pipeline_seconds` and peak CUDA allocation. Stop before running the full 14.86 s job if chunk 2 begins. After total chunk timing is known, PM decides whether the next isolated experiment is attention-backend optimization or 5-step talking-head quality/performance tuning. Do not merge PR #76.