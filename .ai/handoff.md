# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-ECHOMIMICV3-036`

## Status
MMGP V5.2.5 CONTROLLED CHUNK VERIFIED / V5.3 PERSISTENT WORKER NEXT / R&D CONTINUES / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open, DO NOT MERGE.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- EchoMimicV3 upstream: `antgroup/echomimic_v3@7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime: `C:\VSR-EchoMimicV3`.
- Owner test worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Verified runtime checkpoint
- V5.1 remains the first complete ~14.86 s functional baseline: ~69m36s, visual quality below product acceptance.
- V5.2 adopted MMGP `LowRAM_HighVRAM`, 90% VRAM budget, qint8 transformer, pinned RAM and TeaCache.
- V5.2.1 fixed CPU wav2vec indexing under MMGP.
- V5.2.2-V5.2.4 instrumented decode/return and removed MMGP-path stalls from Diffusers cleanup/BaseOutput handling.
- V5.2.5 hard-stops after chunk 1 and flushes timing/peak diagnostics.
- Owner V5.2.5 evidence: first 49-frame chunk completed with `pipeline_seconds=186.672`, `peak_cuda_gb=10.930`; VAE decode 10.856 s; frames GPU->CPU 0.082 s; no OOM/exception.
- Controlled <=180 s target was missed by 6.672 s, so performance is improved but not accepted as production-ready.
- More importantly, request at 10:12:50 reached pipeline start at 10:16:58 (~248 s cold start). GitHub source confirms `src/main/echomimicv3-engine.js` currently spawns a fresh Python `infer_flash.py` process for every render.
- Upstream `app_mm.py` demonstrates the intended reusable architecture: initialize pipeline/Wav2Vec/MMGP once and reuse for repeated generation calls.

## PM decision
Keep MMGP. Do not revert to custom block streaming and do not tune visual quality yet. V5.3 is a narrow persistent-worker experiment because eliminating repeated model load/quantization has higher expected product value than trying to recover only 6.7 s from the current controlled chunk target.

## Exact next action
Implement V5.3 on the same review branch with a long-lived Python EchoMimic worker and minimal local IPC. Initialize model/MMGP once, process one job at a time, preserve cancellation/restart, and emit markers proving whether a job is cold or warm. Benchmark two sequential jobs in one app session using the same controlled settings; second job must not repeat full model loading/quantization.

## Required evidence next
- exact source commit and changed files;
- static/syntax verification;
- worker READY marker;
- two sequential jobs in same worker lifetime;
- proof second job skips full load/quantization;
- warm first-chunk `pipeline_seconds` and peak CUDA;
- no OOM/exception;
- cancellation/restart behavior evidence before final acceptance.

## Gates
- V5.2.5 runtime benchmark: PASS.
- MMGP stability/VRAM: PASS for controlled 49-frame chunk.
- Product performance: NEEDS_REVISION.
- V5.3 implementation: NOT STARTED.
- Automated verification: WAITING V5.3.
- Code review: WAITING V5.3.
- Owner runtime: WAITING V5.3.
- Documentation synchronization: PASS after this update.
- Merge permission: BLOCKED.

## Forbidden
- No merge.
- No P1/P2/P3, Voice Render, Xoa Sub, task-034, or JoyVASA changes.
- No quality/resolution/FPS/step changes during V5.3 benchmark.
- No arbitrary FlashAttention install/build yet.
- No silent fallback to fresh-process-per-render when benchmarking persistent-worker performance.