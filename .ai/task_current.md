# Current Task

## Task ID
TALKING-PORTRAIT-ECHOMIMICV3-036

## Status
MMGP_V5_2_5_CHUNK_MEASURED_V5_3_PERSISTENT_WORKER_NEXT_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.

## User outcome
Use EchoMimicV3 Flash as AI Avatar `Chất lượng cao` on RTX 5060 Ti 16 GB at 768x768/25 FPS with complete voice duration, acceptable talking-head quality, and practical render speed.

## Verified V5.2.5 benchmark
Owner runtime on 2026-08-24 completed the controlled first chunk:
- 49 frames, 768x768, 25 FPS, Flash 8-step, TeaCache, MMGP `LowRAM_HighVRAM` 90% budget.
- `VSR_MMGP_V525: pipeline_seconds_ready=186.672`.
- `VSR_MMGP_V525: peak_query_done peak_cuda_gb=10.930`.
- `VSR_MMGP_V52: chunk=1 pipeline_seconds=186.672 peak_cuda_gb=10.930`.
- VAE decode: 10.856 s.
- GPU->CPU frame materialization: 0.082 s.
- Benchmark stopped intentionally after chunk 1 before postprocess.
- No OOM or exception.

Interpretation:
- Stability/VRAM architecture: PASS.
- Previous <=180 s target: narrowly missed by 6.672 s; do not treat as production speed PASS.
- Request-to-pipeline cold start was ~248 s (10:12:50 -> 10:16:58), larger than the target miss and therefore the highest-ROI architectural bottleneck.

## V5.3 narrow experiment
Implement persistent EchoMimic worker/model reuse. Current `src/main/echomimicv3-engine.js` spawns `infer_flash.py` for every render. V5.3 should instead keep one Python process alive, initialize Wav2Vec/pipeline/MMGP once, then accept sequential render jobs over a minimal local IPC protocol.

Requirements:
1. Preserve one-job-at-a-time behavior.
2. Preserve cancellation; worker/job failure must not leave Electron permanently busy.
3. Do not change resolution, FPS, 49-frame chunk, 8 steps, TeaCache, guidance, prompt, or MMGP profile during this experiment.
4. Emit explicit markers for worker boot ready, job received, warm/cold status, job pipeline start/end, and worker shutdown/restart.
5. Measure separately: worker cold initialization time and warm job first-chunk pipeline time.
6. A failed worker may be restarted cleanly; do not silently fall back to spawning a full fresh inference process per job because that would invalidate the benchmark.
7. No changes outside EchoMimic runtime/engine/upgrader and required `.ai/` docs.

## Acceptance for V5.3
- Worker reaches READY once without OOM.
- Two sequential benchmark jobs can be submitted in the same app session without reloading/requantizing the full model between jobs.
- Second job reaches inference without repeating model-loading/MMGP quantization markers.
- Warm first-chunk completes without OOM/exception.
- Exact warm `pipeline_seconds` and peak CUDA are captured.
- Cancel/restart path is verified at least statically; Owner runtime cancellation remains a separate gate if not exercised.

## Gates
- V5.2.5 execution/runtime evidence: PASS.
- V5.2.5 controlled chunk stability: PASS.
- Product performance: NEEDS_REVISION.
- V5.3 implementation: NOT STARTED.
- Code review: WAITING.
- Owner final runtime: WAITING.
- Documentation synchronization: PASS after current sync.
- Merge: BLOCKED.

## Forbidden
- Do not merge PR #76.
- Do not modify P1/P2/P3, Voice Render, standalone Xoa Sub, task 034, or JoyVASA runtime.
- Do not revert to custom V5.1 block streaming.
- Do not tune quality or lower benchmark settings in V5.3.
- Do not install arbitrary FlashAttention packages yet; persistent-worker reuse is the next isolated experiment.