# Current Task

## Task ID
WAN-ANIMATE-BENCHMARK-037

## Status
HARNESS_PUBLISHED_RTX5060TI_RUNTIME_WAITING_MERGE_BLOCKED

## Exact basis
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/WAN-ANIMATE-BENCHMARK-037`.
- Base SHA: `1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Task 036 / PR #76 head `d6274aaff8109fd1637c885389ff952996d3ab01` is explicitly excluded.
- Upstream research pin: `Wan-Video/Wan2.2@42bf4cfaa384bc21833865abc2f9e6c0e67233dc`.

## User outcome
Benchmark real Wan2.2-Animate-14B Character Replacement on RTX 5060 Ti 16GB before building AI Video Remix UI.

## Acceptance
- 3–5 second source video + one reference image.
- Replace Character mode.
- Prefer 480p.
- Real generated MP4.
- No CUDA OOM on RTX 5060 Ti 16GB.
- Source timing/audio retained within practical mux tolerance.
- Owner judges identity reasonable, body motion faithful, background stable.
- No UI or existing pipeline integration.

## Runtime
Use dedicated worktree `E:\Project AI\Video-sub-remove-wan-benchmark` and run `scripts/run-wan-animate-benchmark.ps1` with explicit source video, reference image, Wan checkout and Animate checkpoint paths.

## Fallback rule
If the official single-GPU path OOMs after CPU T5 + model offload + dtype conversion at 832x480, record that failure. Then revise/spike WanVideoWrapper/ComfyUI FP8/quantized + block/model offload. Do not silently change backend and call the official path PASS.

## Gates
- Execution: PASS for harness publication.
- Automated verification: WAITING.
- Code review: WAITING.
- Owner GPU runtime: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
