# Current Task

## Task ID
TALKING-PORTRAIT-ECHOMIMICV3-036

## Status
MMGP_V5_2_1_DENOISE_BREAKTHROUGH_TOTAL_CHUNK_TIMING_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.

## User outcome
Use EchoMimicV3 Flash as AI Avatar `Chất lượng cao` on RTX 5060 Ti 16 GB at 768x768/25 FPS with complete voice duration, acceptable talking-head quality, and practical render speed.

## Verified progression
1. V5.1 is the functional end-to-end baseline but took ~69m36s for 14.86 s and visual quality still needs revision.
2. V5.2 moves transformer memory management to MMGP `LowRAM_HighVRAM`, 90% VRAM budget, with `quanto.qint8` transformer quantization and TeaCache.
3. Audio-model repair restored the isolated Chinese wav2vec checkpoint and passed local Wav2Vec2 load verification.
4. V5.2.1 fixes MMGP default-device interference by keeping wav2vec indexing tensors on CPU and moving only gathered embeddings to CUDA.
5. Owner V5.2.1 runtime reached real inference and completed first-chunk denoise 8/8 in ~132.9 s for 49 frames at 768x768/25 FPS. This is a major improvement over V5.1 ~381 s/chunk denoise.
6. No CUDA OOM or exception occurred during those 8 denoise steps.
7. External `flash_attn` package is absent; Torch SDPA backends report enabled. Runtime warns that padding mask is disabled with scaled-dot-product attention and may significantly affect performance.

## Current acceptance benchmark
Keep benchmark controlled: 768x768, 25 FPS, 49-frame chunks, Flash 8-step, TeaCache, MMGP `LowRAM_HighVRAM` 90% budget.

Required remaining evidence for chunk 1:
- `VSR_MMGP_V52: chunk=1 pipeline_seconds=...`;
- peak CUDA allocation marker if emitted;
- confirmation that chunk 1 output/decode completed without OOM/exception;
- stop/cancel once chunk 2 begins; full 14.86 s render is not required for this measurement.

Interpretation:
- <=180 s total first-chunk pipeline: performance architecture PASS for this R&D stage;
- >180 s: PM must inspect phase timing before further tuning;
- any OOM/exception: STOP and report exact traceback.

## Next engineering decision
Do not change quality settings yet. Once total first-chunk timing is known, isolate the next experiment. Current likely candidate is attention-path optimization because MMGP has removed most custom block-transfer overhead while external FlashAttention is absent. Any FlashAttention experiment must first prove Windows/PyTorch/RTX 5060 Ti compatibility; do not blindly install or replace attention code.

## Gates
- Execution: PASS through V5.2.1 publication/bootstrap.
- Automated/static: PASS for the published upgrader path based on prior Owner upgrade success.
- Code review: WAITING final review after current R&D iteration.
- Owner runtime: PARTIAL PASS — first-chunk denoise 8/8 completed in ~133 s; total chunk/decode still WAITING.
- Documentation sync: PASS after current sync.
- Merge: BLOCKED.

## Forbidden
- Do not merge PR #76.
- Do not modify P1/P2/P3, Voice Render, standalone Xoa Sub, task 034, or JoyVASA runtime.
- Do not return to custom V5.1 block streaming as the preferred path.
- Do not lower resolution/frame rate/steps while collecting the controlled V5.2.1 benchmark.
- Do not install an arbitrary FlashAttention wheel/build until compatibility is verified.