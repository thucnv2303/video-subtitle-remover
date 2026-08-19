# AgentOS Handoff Status

## Active task
`WAN-ANIMATE-BENCHMARK-037`

## Status
ISOLATED HARNESS PUBLISHED / RTX 5060 TI 16GB REAL BENCHMARK WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Branch: `review/WAN-ANIMATE-BENCHMARK-037`.
- Base SHA: `1b1b8ba4b82078534b7fa24582be7e44688319bd`.
- Task 036 / Draft PR #76 is independent and untouched.
- Owner worktree: `E:\Project AI\Video-sub-remove-wan-benchmark`.

## Delivered
- Research-backed official Wan2.2 replacement spike plan.
- `scripts/run-wan-animate-benchmark.ps1` for one 3–5s clip + one reference image.
- 832x480 normalization, replacement preprocessing, low-VRAM official generation flags, source-audio remux, timing/GPU manifest.
- No UI and no changes to application pipelines.

## Owner runtime prerequisites
Keep Wan runtime isolated from the application environment. Provide:
- a Wan2.2 checkout compatible with Wan2.2-Animate-14B;
- the Wan2.2-Animate-14B checkpoint including `process_checkpoint`;
- ffmpeg/ffprobe and NVIDIA driver tooling;
- a 3–5 second benchmark source and one reference character image.

## Owner command
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

## Required evidence
Upload/report:
- terminal output including any CUDA OOM;
- generated `benchmark.json`;
- `gpu-before.txt` and `gpu-after.txt`;
- actual `replace-with-source-audio.mp4` or Owner observation of it;
- Owner judgment: identity / body motion / background / audio-timing.

## Next decision
- If official path succeeds within 16GB: review output quality against acceptance.
- If it OOMs: NEEDS_REVISION and implement a separate WanVideoWrapper/ComfyUI FP8/quantized+offload attempt on the same 037 branch/PR after PM review.

## Gates
- Execution: PASS for publication.
- Automated verification: WAITING.
- Code review: WAITING.
- Owner GPU runtime: NOT STARTED.
- Documentation synchronization: PASS once GitHub head/PR re-read confirms these three canonical files agree.
- Merge permission: BLOCKED.

## Forbidden
Do not merge. Do not modify PR #76/task 036. Do not build AI Video Remix UI. Do not install Wan dependencies into the app's existing Python environment.
