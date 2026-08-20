# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — RTX 5060 TI 16GB LOCAL VIABILITY INVESTIGATION / FULL-GPU MODEL PLACEMENT FAIL / CPU OFFLOAD PERFORMANCE FAIL / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- GPU: NVIDIA GeForce RTX 5060 Ti, 15.93 GiB VRAM.
- Runtime root: `C:\VSR-EchoMimicV3`.
- Owner worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Verified runtime facts
1. EchoMimicV3 setup/weights/CUDA are functional.
2. Original full-GPU 768x768/49-frame run reached VAE mask encode and OOMed.
3. Sequential CPU offload avoided OOM but projected roughly an hour for a ~15 s clip: product performance FAIL.
4. Model CPU offload also failed the performance target.
5. Selective GPU V3/V4 experiments did not produce a product-acceptable path; V4 startup/preparation remained too slow.
6. Owner requested a decisive GPU-only benchmark with no heavy-model CPU offload.
7. Controlled full-GPU benchmark used Flash 8-step, 768x768, 25 FPS, TeaCache on GPU, and 45-frame chunks.
8. Full-GPU 45-frame benchmark OOMed inside `pipeline.to(device=device)` before any chunk/inference processing began. At failure PyTorch reported 15.93 GiB total VRAM, ~8.42 GiB allocated and ~6.27 GiB free, and failed a 64 MiB allocation while moving the pipeline to CUDA.
9. Because the failure occurs during whole-pipeline CUDA placement, reducing chunk length from 45 to 41/37 frames cannot solve this specific failure. Chunk length only affects inference activations after model placement.

## Engineering conclusion
The current unquantized EchoMimicV3 Flash pipeline cannot be treated as a viable all-GPU 16GB configuration by merely reducing frame count. The next technically meaningful GPU-only experiment must reduce the resident model footprint itself, for example through supported lower-precision/quantized weights or a materially smaller model variant. Repeating 41/37-frame full-GPU runs without changing model footprint is forbidden because the failure is pre-inference.

## Product gate
EchoMimicV3 remains NOT ACCEPTABLE as the local `Chất lượng cao` engine until a profile can both:
- fit the 16GB GPU without whole-pipeline CPU offload; and
- render a 14-15 s result within a practical product budget (target <=5 min, reject >15 min).

## Gates
- Execution: PASS for controlled full-GPU benchmark publication/run.
- Automated/static verification: PASS for the benchmark engine change based on Owner `node --check` / `git diff --check` evidence before the run.
- Code review: WAITING final cleanup/decision after viability investigation.
- Owner runtime: FAIL for full-GPU 45-frame profile (CUDA OOM before inference).
- Documentation synchronization: PASS after this update.
- Merge permission: BLOCKED.

## Next permitted action
PM evaluates a GPU-only footprint-reduction experiment (quantized/lower-precision supported path or smaller upstream variant). Do not retry smaller chunks alone. Do not merge PR #76.
