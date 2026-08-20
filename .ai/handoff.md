# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-ECHOMIMICV3-036`

## Status
SELECTIVE GPU RESIDENCY V3 PUBLISHED / LOCAL STATIC+UPGRADE VERIFICATION WAITING / OWNER BENCHMARK WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open, DO NOT MERGE.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- EchoMimicV3 upstream: `antgroup/echomimic_v3@7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime: `C:\VSR-EchoMimicV3`.
- Owner test worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Runtime history
- Full GPU 768p/49 frames reached real inference but OOMed during VAE mask latent encoding, short by about 540 MiB at the failing allocation.
- Sequential CPU offload avoided OOM and produced output, but was too slow.
- Long-audio V2 corrected the ~49-frame total-duration cap by rendering one loaded pipeline as sequential chunks.
- Sequential V2 remained impractical for ~15 s audio.
- Model CPU offload benchmark also failed the performance target: Owner observed roughly 44 minutes without first-chunk completion.

## PM decision
Do not keep tuning whole-pipeline CPU offload. Preserve the quality profile and use phase-based selective GPU residency so only the active component occupies CUDA, while the transformer stays resident for the entire expensive denoise loop.

## Published V3
- `scripts/echomimicv3-selective-v3.py`: deterministic transform for recognized V2 runtime + exact pinned pipeline.
- `scripts/upgrade-echomimicv3-selective-v3.ps1`: applies V3 and compiles both patched upstream Python files before READY.
- `src/main/echomimicv3-engine.js`: uses `--GPU_memory_mode selective_gpu_v3`, requires V3 markers in infer + pipeline, and uses Windows `taskkill /T /F` for process-tree cancellation.
- Phase order: T5 GPU -> CPU; VAE encode GPU -> CPU; CLIP GPU -> CPU; transformer GPU resident through denoise -> CPU; VAE decode GPU -> CPU.
- Quality remains Flash 8-step, 768x768, 25 FPS, 49-frame chunks and TeaCache.

## Exact next action
1. Verify current PR #76 exact HEAD after this docs sync.
2. Owner fast-forwards `E:\Project AI\Video-sub-remove-owner-test-LONG012` to that exact HEAD.
3. Run `node --check src/main/echomimicv3-engine.js`.
4. Run `git diff --check 1b1b8ba4b82078534b7fa24582be7e44688319bd..HEAD`.
5. Run `powershell -ExecutionPolicy Bypass -File scripts/upgrade-echomimicv3-selective-v3.ps1` once.
6. Require `[EchoMimicV3] SELECTIVE GPU V3 READY`; any transform/compile error => STOP and send exact output.
7. If static/upgrade gate passes, start app and run one controlled `Chất lượng cao` benchmark.
8. Measure first 49-frame chunk: <90 s good, 90-180 s marginal, >180 s FAIL. Any OOM/exception => STOP.
9. Do not lower quality/settings automatically.

## Gates
- Execution: PASS for V3 publication.
- Automated verification: WAITING local static/upgrader evidence.
- Code review: PASS for V3 architecture/scope; runtime remains unverified.
- Owner runtime: NOT STARTED V3.
- Documentation synchronization: PASS after this update.
- Merge permission: BLOCKED.

## Forbidden
- No merge.
- No P1/P2/P3, Voice Render, Xoa Sub, task-034, or JoyVASA runtime changes.
- No repeated quality reductions after V3 failure.
- No claim that V3 is production-ready until first-chunk timing and real MP4 behavior are verified.
