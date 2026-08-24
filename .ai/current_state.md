# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — V5.3 SOURCE PUBLISHED / STATIC REVIEW COMPLETE / OWNER TWO-JOB RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, open, not merged.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- V5.3 source commit: `c396b1799d669e44b86770ceeab37d51aa2f1d59`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime root: `C:\VSR-EchoMimicV3`.
- Owner worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Verified runtime baseline
1. V5.1 completed ~14.86 s end-to-end in ~69m36s; visual quality remains below product acceptance.
2. V5.2.x established MMGP `LowRAM_HighVRAM`, 90% VRAM budget and stable controlled 49-frame execution.
3. Owner V5.2.5: `pipeline_seconds=186.672`, `peak_cuda_gb=10.930`, no OOM/exception.
4. Cold request-to-pipeline startup was ~248 s because the previous Electron engine spawned fresh Python inference per render.

## V5.3 source
- Added `scripts/echomimicv3-worker-v53.py`.
- Reworked `src/main/echomimicv3-engine.js` to own one long-lived worker lifecycle.
- Heavy model/MMGP initialization is outside the per-job handler.
- JSON-lines control messages are prefixed `VSR_WORKER_JSON ` so ordinary runtime stdout cannot be mistaken for protocol.
- One active job is allowed at a time.
- Cancel terminates the worker process tree; next render must bootstrap a clean worker.
- Worker emits boot/model-init/READY/job cold-warm/pipeline timing/peak CUDA/completion/failure markers.
- Controlled V5.3 output remains 768x768, 25 FPS, max 49 frames, 8 steps, TeaCache threshold 0.1, seed 43 and MMGP 90% budget.

## Verification
- Local Python syntax (`py_compile`) for the new worker: PASS before publication.
- Local Node syntax (`node --check`) for the replacement engine: PASS before publication.
- GitHub source commit and PR head verified after publication.
- PR #76 remains Draft/open at exact source HEAD `c396b1799d669e44b86770ceeab37d51aa2f1d59` before this docs commit.
- GitHub reports no commit status checks for the source commit.
- GPU/runtime behavior is not verified by ChatGPT environment.

## Gates
- V5.2.5 runtime benchmark: PASS.
- V5.3 source publication: PASS.
- V5.3 static syntax: PASS.
- V5.3 code review: PASS for narrow architecture/source; GPU-specific behavior remains runtime-gated.
- V5.3 Owner two-job warm reuse: WAITING.
- V5.3 cancellation/restart Owner runtime: WAITING.
- Visual quality: NEEDS_REVISION and intentionally deferred.
- Documentation synchronization: PASS after this docs commit.
- Merge permission: BLOCKED.

## Next permitted action
Owner checks out the exact PR #76 head after this docs commit and runs two sequential `Chất lượng cao` renders in the same app session. Required evidence is the full Render log showing one worker model initialization/READY, first job `warm=false`, second job `warm=true`, no repeated model-init/MMGP setup before job 2, both pipeline timings/peak CUDA, and no OOM/exception. Do not merge PR #76.
