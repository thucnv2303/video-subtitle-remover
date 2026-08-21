# AgentOS Handoff Status

## Active task
`TALKING-PORTRAIT-ECHOMIMICV3-036`

## Status
MMGP V5.2.1 FIRST-CHUNK DENOISE BREAKTHROUGH / TOTAL CHUNK TIMING WAITING / R&D CONTINUES / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/TALKING-PORTRAIT-ECHOMIMICV3-036`.
- Draft PR: #76, Draft/open, DO NOT MERGE.
- Base: `review/TALKING-PORTRAIT-JOYVASA-035@1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- EchoMimicV3 upstream: `antgroup/echomimic_v3@7e89489ca51c0d008fc1963ec6c03fc5bd0b9397`.
- Runtime: `C:\VSR-EchoMimicV3`.
- Owner test worktree: `E:\Project AI\Video-sub-remove-owner-test-LONG012`.

## Runtime checkpoint
- V5.1 produced the first complete ~14.86 s result but required ~69m36s and visual quality remains below product acceptance.
- V5.2 replaced custom transformer block streaming with MMGP `LowRAM_HighVRAM`, 90% detected VRAM budget, `quanto.qint8`, pinned RAM, TeaCache, and 49-frame/8-step controlled benchmark.
- The isolated Chinese wav2vec model was repaired after the first V5.2 attempt exposed missing model weights.
- V5.2 then exposed CPU/GPU index-device conflict caused by MMGP default-device behavior.
- V5.2.1 fixes indexing by explicitly keeping `center_indices` on CPU and transferring only selected audio embeddings to CUDA.
- Owner runtime on V5.2.1 reached real denoise and completed 8/8 steps for chunk 1 in about 132.9 s (11:37:35 -> 11:39:48), versus V5.1 roughly 381 s/chunk denoise.
- No OOM/exception occurred during the 8 denoise steps.
- Diagnostics: MMGP 3.7.12, LowRAM_HighVRAM, budget 14679 MiB / 16310 MiB, transformer qint8, ~1888.18 MB transformer pinned RAM, `flash_attn_package=False`, Torch flash/memory-efficient/math SDP flags enabled.
- The supplied Owner log ends at denoise completion; first-chunk decode/output `pipeline_seconds` and peak CUDA are still missing.

## PM decision
Keep MMGP V5.2.1 as the active performance architecture. Do not revert to V5.1 custom block streaming. Do not tune quality yet. First close the controlled first-chunk timing measurement. After that, PM may authorize one isolated attention-backend experiment if compatibility is proven.

## Exact next action
1. Do not start another full benchmark if the current process/log can still provide the missing lines.
2. Capture lines after chunk-1 denoise until `VSR_MMGP_V52: chunk=1 pipeline_seconds=...` and peak CUDA marker/output completion.
3. If `VSR_LONG_AUDIO_V2: chunk=2` begins, cancel the render; no full 14.86 s render is needed for this benchmark.
4. Send the chunk-1 tail log to PM.
5. PM classifies total first-chunk timing and chooses exactly one next R&D experiment.

## Gates
- Execution: PASS through V5.2.1.
- Automated/static verification: PASS for current upgrader/bootstrap evidence.
- Code review: WAITING final review after R&D iteration.
- Owner runtime: PARTIAL PASS — denoise performance breakthrough verified; decode/output timing waiting.
- Documentation synchronization: PASS after this update.
- Merge permission: BLOCKED.

## Forbidden
- No merge.
- No P1/P2/P3, Voice Render, Xoa Sub, task-034, or JoyVASA changes.
- No uncontrolled changes to resolution/FPS/chunk/steps during benchmark comparison.
- No arbitrary FlashAttention installation/build until RTX 5060 Ti + Windows + installed PyTorch compatibility is established.