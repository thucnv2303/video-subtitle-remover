# WAN-ANIMATE-BENCHMARK-037 — Wan2.2-Animate-14B Character Replacement benchmark

## Status
IMPLEMENTED_HARNESS / RTX_5060_TI_RUNTIME_WAITING / MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`
- Review branch: `review/WAN-ANIMATE-BENCHMARK-037`
- Base SHA: `1b1b8ba4b82078534b7fa24582be7e44688319bd`
- Deliberately excludes task 036 / PR #76 head `d6274aaff8109fd1637c885389ff952996d3ab01`.
- Owner worktree: `E:\Project AI\Video-sub-remove-wan-benchmark`

## User outcome
Determine whether Wan2.2-Animate-14B replacement is viable on RTX 5060 Ti 16GB before any AI Video Remix UI is designed.

## MVP
- One 3–5 second source video.
- One character reference image.
- Replacement mode only.
- 832x480 normalized working video.
- Preserve source timing and source audio in the final benchmark MP4.
- Produce a real MP4 plus `benchmark.json` and before/after `nvidia-smi` captures.
- No application UI or P1/P2/P3 integration.

## Research basis
Official `Wan-Video/Wan2.2@42bf4cfaa384bc21833865abc2f9e6c0e67233dc` documents Wan-Animate replacement as: preprocess source video + reference image with `--replace_flag`, then run `generate.py --task animate-14B ... --replace_flag --use_relighting_lora`.

The official CLI exposes `--offload_model`, `--convert_model_dtype`, and `--t5_cpu`. The project README recommends model offload/dtype conversion/T5 CPU as memory-reduction controls for large Wan inference generally. This task combines those controls with a 480p working area as the first 16GB hypothesis. This is NOT considered proven until RTX 5060 Ti runtime succeeds.

Wan2.2 upstream also points to Kijai ComfyUI-WanVideoWrapper and DiffSynth-Studio as optimized community paths. If official single-GPU still OOMs on 16GB, the next permitted spike is WanVideoWrapper/ComfyUI with quantized/FP8 weights and block/model offload. Do not silently switch backend inside the same runtime result; record official-path failure first.

## Implementation
`scripts/run-wan-animate-benchmark.ps1`

The harness:
1. rejects source clips outside 3–5 seconds (0.25s container tolerance);
2. normalizes video to padded 832x480 H.264 without audio for model preprocessing;
3. invokes official replacement preprocessing;
4. invokes official single-GPU generation with CPU T5, model offload and dtype conversion;
5. muxes original source audio back onto the generated video without time stretching;
6. records timing delta, GPU identity, output path and unresolved visual gates in JSON.

## Runtime command
From the dedicated Owner worktree:

```powershell
git fetch origin
git worktree add "E:\Project AI\Video-sub-remove-wan-benchmark" origin/review/WAN-ANIMATE-BENCHMARK-037
cd "E:\Project AI\Video-sub-remove-wan-benchmark"
powershell -ExecutionPolicy Bypass -File scripts/run-wan-animate-benchmark.ps1 `
  -VideoPath "<3-5s-source.mp4>" `
  -ReferenceImage "<reference.png>" `
  -WanRoot "C:\VSR-Wan2.2" `
  -CheckpointDir "C:\VSR-Wan2.2-Animate-14B"
```

Prerequisite runtime/model installation is intentionally external to the application repository. Do not mutate the app Python environment.

## Acceptance gates
### Mechanical
- Script exits 0 on RTX 5060 Ti 16GB.
- No CUDA OOM.
- `replace-with-source-audio.mp4` exists and is decodable.
- Source audio is present when the source has audio.
- Timing delta <= 0.15s target; larger delta is a finding.

### Owner visual review
- Identity: recognizable and reasonably stable.
- Body motion: follows source motion without obvious temporal collapse.
- Background: remains acceptably stable outside replacement region.
- Output: real generated video, not copied source/reference.

## Stop / failure policy
- OOM => record FAIL; do not lower acceptance or claim viability.
- Preprocessor/generator incompatibility => record exact traceback and upstream commit/model identity.
- Official path OOM => next task/revision may evaluate WanVideoWrapper/ComfyUI FP8/quantized + offload.
- No UI work until benchmark acceptance passes.

## Gates
- Execution: PASS for isolated harness publication.
- Automated verification: WAITING exact PowerShell parse/static check and real environment.
- Code review: WAITING.
- Owner manual app/GPU verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
