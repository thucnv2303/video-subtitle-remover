# Current State

## Status
TALKING-PORTRAIT-ECHOMIMICV3-036 — SEQUENTIAL OFFLOAD RUNTIME SUCCEEDED / 49-FRAME DURATION CAP CONFIRMED / LONG-AUDIO CHUNKING V2 PUBLISHED / SETUP+OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Long-audio V2 source commit: `c97c1bd18b321ffed2bc4871c494abce9b9a96a3`.
- EchoMimicV3 upstream pin: `7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime root: `C:\VSR-EchoMimicV3`.

## Verified runtime facts
1. EchoMimicV3 setup/weights/CUDA work on RTX 5060 Ti 16 GB.
2. Full-GPU and the first 768x768/49-frame mitigation OOMed at VAE mask latent encoding.
3. Real `pipeline.enable_sequential_cpu_offload()` V1 subsequently passed setup and produced a real MP4 instead of OOM.
4. That successful output exposed a separate functional defect: upstream uses `min(audio_duration * fps, video_length)`, while the app passed `video_length=49`; a ~15 s voice therefore produced only about 2 s of generated frames/video.
5. The duration defect must not be fixed by requesting the entire ~15 s / ~375 frames in one inference because that defeats the controlled VRAM ceiling.

## Published long-audio V2 design
Source commit `c97c1bd18b321ffed2bc4871c494abce9b9a96a3`:
- keeps Flash 8-step, 768x768, 25 FPS, sequential CPU offload and TeaCache offload;
- changes `video_length=49` semantics to a per-chunk VRAM ceiling rather than total output duration;
- extracts full-audio Wav2Vec features once on CPU;
- renders sequential 49-frame chunks with one-frame overlap;
- uses the last retained frame of chunk N as the reference image for chunk N+1;
- drops the duplicated overlap frame when concatenating chunks;
- pads only the final inference chunk to the VAE temporal ratio and trims back to the real frame count;
- verifies the concatenated frame count equals `ceil(audio_duration * fps)` before muxing the complete source audio;
- introduces markers `VSR_LOW_VRAM_OFFLOAD_V2` and `VSR_LONG_AUDIO_V2`;
- setup migrates a recognized dirty V1 runtime by reversing the exact saved V1 patch before applying V2; unknown dirty `infer_flash.py` state is blocked instead of overwritten.

## Gates
- Execution: PASS for V2 source publication.
- Automated/static verification: PARTIAL PASS — JS source is structurally narrow and patch design was checked against exact upstream hunks; Windows PowerShell setup/app runtime still requires Owner evidence.
- Code review: PASS for intended V2 architecture and scope; runtime chunk behavior/continuity remains unverified.
- Owner runtime: WAITING V2 RETEST.
- Documentation synchronization: PASS after final exact-HEAD re-read.
- Merge permission: BLOCKED.

## Next permitted action
1. Owner fast-forwards `E:\Project AI\Video-sub-remove-owner-test-LONG012` to final branch HEAD.
2. Run `scripts/setup-echomimicv3.ps1` once. Existing V1 runtime must migrate to V2 without reset/restore.
3. Require setup marker `[EchoMimicV3] low-vram: sequential CPU offload + long-audio chunking V2`.
4. Restart app and render the same portrait + ~15 s voice with `Chất lượng cao` exactly once.
5. Require runtime markers `VSR_LOW_VRAM_OFFLOAD_V2` and `VSR_LONG_AUDIO_V2`, including multiple chunk lines for long audio.
6. If OOM or another exception occurs, STOP and capture the exact tail; do not lower resolution/chunk size/settings without PM review.
7. If MP4 succeeds, Owner must verify duration approximately matches voice and inspect visible continuity/lip sync at chunk boundaries.

## Merge
BLOCKED until V2 setup/runtime passes, Owner accepts the real long-audio MP4, result is recorded in canonical `.ai/`, documentation is synchronized, and merge is explicitly approved.
