# Current Task

## Task ID
TALKING-PORTRAIT-ECHOMIMICV3-036

## Status
V5_3_PERSISTENT_WORKER_SOURCE_PUBLISHED_OWNER_TWO_JOB_RUNTIME_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- V5.3 source commit: `c396b1799d669e44b86770ceeab37d51aa2f1d59`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.

## User outcome
Use EchoMimicV3 Flash as AI Avatar `Chất lượng cao` on RTX 5060 Ti 16 GB with complete voice duration, acceptable talking-head quality and practical render speed.

## Verified baseline
- V5.2.5 controlled chunk: 49 frames, 768x768, 25 FPS, Flash 8-step, TeaCache, MMGP `LowRAM_HighVRAM` 90%.
- `pipeline_seconds=186.672`, `peak_cuda_gb=10.930`, no OOM/exception.
- Cold request-to-pipeline startup was ~248 s and is the V5.3 target.

## V5.3 implementation
1. Persistent Python worker is started by Electron and remains alive across sequential jobs.
2. Wav2Vec, Wan transformer/VAE/T5/CLIP, scheduler, pipeline and MMGP profile are initialized before READY, outside the job handler.
3. Jobs use a prefixed JSON-lines stdin/stdout protocol correlated by `job_id`.
4. Exactly one active job is allowed.
5. Worker markers distinguish first/warm jobs and expose pipeline seconds plus peak CUDA.
6. Cancel kills the worker tree; worker exit settles the active promise and a later render starts a clean worker.
7. There is no silent fallback to the old fresh `infer_flash.py` process-per-render path.
8. Benchmark settings remain fixed: 768x768, 25 FPS, max 49 frames, 8 steps, TeaCache 0.1/skip 5, MMGP 90%, seed 43, bfloat16.

## Acceptance remaining
Owner runtime must prove:
- one worker reaches READY;
- job 1 is `warm=false`;
- job 2 in the same app session is `warm=true`;
- model initialization/MMGP setup does not repeat before job 2;
- both jobs reach `pipeline_done` without OOM/exception;
- warm `pipeline_seconds` and peak CUDA are captured;
- cancellation/restart is exercised separately before final acceptance.

## Gates
- V5.2.5 runtime: PASS.
- V5.3 source publication: PASS.
- Static Python/Node syntax: PASS before publication.
- Code review: PASS for current narrow source architecture.
- Owner two-job runtime: WAITING.
- Owner cancellation/restart: WAITING.
- Product performance: WAITING V5.3 evidence.
- Visual quality: NEEDS_REVISION, deferred.
- Documentation synchronization: PASS after current docs commit.
- Merge: BLOCKED.

## Forbidden
- Do not merge PR #76.
- Do not modify P1/P2/P3, Voice Render, standalone Xoa Sub, task 034, or JoyVASA.
- Do not tune resolution/FPS/steps/quality during the V5.3 comparison.
- Do not install arbitrary FlashAttention packages yet.
