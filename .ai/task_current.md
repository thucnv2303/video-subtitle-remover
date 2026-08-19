# Current Task

## Task ID
TALKING-PORTRAIT-ECHOMIMICV3-036

## Status
LONG_AUDIO_CHUNKING_V2_PUBLISHED_OWNER_RETEST_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Long-audio V2 source commit: `c97c1bd18b321ffed2bc4871c494abce9b9a96a3`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.

## User outcome
Use EchoMimicV3 Flash as AI Avatar `Chất lượng cao` on RTX 5060 Ti 16 GB and generate a video covering the complete voice duration without lowering 768p quality or loading the whole long sequence into VRAM at once.

## Verified progression
1. Original full-GPU path OOMed.
2. 768p/49-frame mitigation without real offload also OOMed.
3. Sequential CPU offload V1 setup passed and produced a real MP4, proving the controlled low-VRAM direction can complete inference.
4. That MP4 was too short because upstream caps total frames with `min(audio_duration * fps, video_length)` and the engine passed `video_length=49`.

## V2 implementation under test
- Preserve 768x768, 25 FPS, Flash 8-step, sequential CPU offload and TeaCache offload.
- Treat 49 frames as a per-chunk VRAM ceiling.
- Extract full voice features once on CPU and move only each chunk's audio embeddings to CUDA.
- Render chunks sequentially with one-frame overlap and last-frame continuity reference.
- Drop duplicate boundary frames, trim final padding and require exact expected total frame count before muxing full audio.
- Setup migrates recognized V1 runtime to V2 using the saved exact V1 reverse patch; unknown runtime edits are blocked.

## Owner retest procedure
From `E:\Project AI\Video-sub-remove-owner-test-LONG012`, fast-forward to final branch HEAD and run setup once.

Required setup evidence:
- `[EchoMimicV3] low-vram: sequential CPU offload + long-audio chunking V2`.

Required runtime evidence:
- `VSR_LOW_VRAM_OFFLOAD_V2: sequential CPU offload + chunked long-audio enabled.`;
- `VSR_LONG_AUDIO_V2: duration=... total_frames=... chunk_frames=49 stride=48`;
- multiple `VSR_LONG_AUDIO_V2: chunk=...` lines for a ~15 s voice;
- final `VSR_LONG_AUDIO_V2: completed frames=... duration=...s` and a real MP4, or the exact failure traceback.

Acceptance for MP4:
- duration approximately matches the complete source voice;
- no obvious freeze/reset/jump at chunk boundaries;
- lip sync remains acceptable across boundaries;
- no CUDA OOM.

If any runtime failure occurs: STOP after the one controlled run. Do not manually lower resolution/chunk size/settings.

## Gates
- Execution: PASS for V2 publication.
- Automated/static: PARTIAL PASS; Owner Windows setup/runtime evidence still required.
- Code review: PASS for V2 scope/architecture; runtime continuity remains unverified.
- Owner runtime: WAITING V2 RETEST.
- Documentation sync: PASS after final exact-HEAD re-read.
- Merge: BLOCKED.

## Forbidden
- Do not merge PR #76.
- Do not modify P1/P2/P3, Voice Render, standalone Xoa Sub, task 034, or JoyVASA runtime.
- Do not retry arbitrary lower quality/settings after a V2 failure.
