# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-ECHOMIMICV3-036`

## Status
SEQUENTIAL OFFLOAD MP4 SUCCEEDED / 49-FRAME TOTAL-DURATION CAP CONFIRMED / LONG-AUDIO CHUNKING V2 PUBLISHED / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open, DO NOT MERGE.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Long-audio V2 source commit: `c97c1bd18b321ffed2bc4871c494abce9b9a96a3`.
- EchoMimicV3 upstream: `antgroup/echomimic_v3@7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime: `C:\VSR-EchoMimicV3`.
- Owner test worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Latest owner runtime
After V1 enabled real sequential CPU offload, setup reached READY and Owner rendered a real MP4 without the prior CUDA OOM. The output was only about 1-2 seconds for a ~15-second voice. Source review confirmed upstream caps total generated frames with `min(audio_clip.duration * fps, video_length)` and the engine supplied `video_length=49`.

## PM decision
Do not solve duration by requesting all ~375 frames in one inference. Keep the proven 49-frame VRAM ceiling and render the long voice as sequential chunks inside one loaded pipeline.

## Published V2
Source commit `c97c1bd18b321ffed2bc4871c494abce9b9a96a3`:
- retains 768x768, 25 FPS, Flash 8-step, sequential CPU offload and TeaCache offload;
- uses `video_length=49` as per-chunk maximum;
- extracts full-audio Wav2Vec features once on CPU;
- renders 49-frame chunks with one-frame overlap;
- carries the last retained frame into the next chunk as its reference image;
- drops duplicated overlap frames and trims final VAE padding;
- requires the final concatenated frame count to equal `ceil(audio_duration * fps)`;
- muxes the complete source audio only after frame-count validation;
- marks runtime with `VSR_LOW_VRAM_OFFLOAD_V2` and `VSR_LONG_AUDIO_V2`;
- preserves the exact V1 patch separately so setup can migrate the known dirty V1 vendor checkout safely; unknown dirty runtime source is blocked.

## Exact next action
1. Verify PR #76 final HEAD and canonical `.ai/` consistency.
2. Owner fast-forwards the owner-test worktree to final HEAD.
3. Run `powershell -ExecutionPolicy Bypass -File scripts/setup-echomimicv3.ps1` once.
4. Require `[EchoMimicV3] low-vram: sequential CPU offload + long-audio chunking V2`.
5. Restart app and run exactly one `Chất lượng cao` render using the same portrait and ~15 s voice.
6. Require `VSR_LOW_VRAM_OFFLOAD_V2`, `VSR_LONG_AUDIO_V2` summary, multiple chunk lines, and either final completed marker + MP4 or exact traceback.
7. On success, Owner checks full duration, lip sync and visible continuity at chunk boundaries.
8. On any failure/OOM, STOP; no arbitrary quality/chunk reduction.

## Gates
- Execution: PASS for V2 source publication.
- Automated verification: PARTIAL PASS; Owner Windows setup/runtime remains required.
- Code review: PASS for V2 architecture/scope; runtime continuity remains unverified.
- Owner runtime: WAITING V2 RETEST.
- Documentation synchronization: PASS after final exact-HEAD re-read.
- Merge permission: BLOCKED.

## Forbidden
- No merge.
- No P1/P2/P3, Voice Render, Xoa Sub, task-034, or JoyVASA runtime changes.
- No repeated quality reductions after a V2 failure.
