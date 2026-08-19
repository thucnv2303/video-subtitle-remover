# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — OWNER RUNTIME BLOCKED BY VRAM / LOW-VRAM BENCHMARK FIX PUBLISHED / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Current source fix commit: `2d5874b079f434ddf8a8d8908f2dbce527273506`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime root: `C:\VSR-EchoMimicV3`.

## Verified runtime facts
1. Setup completed with `[EchoMimicV3] READY`, Torch `2.8.0+cu128`, CUDA available, RTX 5060 Ti, 15.9 GB VRAM.
2. Quality render invoked EchoMimicV3 Flash and loaded the Flash transformer successfully.
3. Owner render failed during VAE mask latent encoding with `torch.OutOfMemoryError`; GPU capacity 15.93 GiB was exhausted and an additional 540 MiB allocation failed.
4. The earlier app log claimed `sequential CPU offload`, but the pinned upstream `infer_flash.py` only parses `GPU_memory_mode`; the current inference path still calls `pipeline.to(device=device)`. Treat the old offload claim as inaccurate.
5. Upstream documents Flash as approximately 12 GB VRAM and recommends shorter partial video length to reduce VRAM pressure, but this exact Windows/RTX 5060 Ti path still requires owner validation.

## Published narrow mitigation
Commit `2d5874b079f434ddf8a8d8908f2dbce527273506` changes only `src/main/echomimicv3-engine.js` for the owner benchmark:
- keep 768x768, 25 FPS, 8-step Flash quality;
- reduce benchmark `video_length` from 81 to 49 frames;
- enable `--teacache_offload`;
- set `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` for the child process;
- remove the misleading sequential CPU offload log claim;
- surface CUDA OOM as an explicit low-VRAM failure instead of a generic tail error.

## Gates
- Execution: PASS for publication of the narrow OOM mitigation.
- Automated/static verification: WAITING on exact current HEAD after docs sync.
- Code review: WAITING final exact-HEAD diff/full-file re-review after docs sync.
- Owner runtime: WAITING RETEST on the 768p / 49-frame benchmark.
- Documentation synchronization: IN PROGRESS until `task_current.md` and `handoff.md` match this state.
- Merge permission: BLOCKED.

## Next permitted action
1. Complete canonical docs sync and verify final branch HEAD/PR #76.
2. Owner fast-forwards `E:\Project AI\Video-sub-remove-owner-test-LONG012` to the latest review branch HEAD.
3. Restart app; no model download/setup rerun is required unless readiness changed.
4. Render the same portrait + Vietnamese voice with `Chất lượng cao`.
5. If 768p/49 frames still OOMs, do not repeatedly guess lower values. Design a controlled low-VRAM profile/offload path and verify it before another owner run.

## Merge
BLOCKED until automated/code review gates pass, Owner produces a real MP4 and explicitly accepts quality, result is recorded in canonical `.ai/`, and docs sync is PASS.
