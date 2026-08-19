# Current State

## Status
WAN-ANIMATE-BENCHMARK-037 — ISOLATED BENCHMARK HARNESS PUBLISHED / RTX 5060 TI RUNTIME WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active branch for this parallel spike: `review/WAN-ANIMATE-BENCHMARK-037`.
- Base SHA: `1b1b8ba4b82078534b7fa24582be7e44688319bd` (task 035 head/basis).
- Task 036 / Draft PR #76 is separate and MUST NOT be modified or used as the 037 base.
- Owner benchmark worktree: `E:\Project AI\Video-sub-remove-wan-benchmark`.

## Objective
Prove or reject Wan2.2-Animate-14B Character Replacement viability on RTX 5060 Ti 16GB before any AI Video Remix UI work.

## Published
- `scripts/run-wan-animate-benchmark.ps1`: isolated 3–5s replacement benchmark harness.
- `.ai/task_specs/WAN-ANIMATE-BENCHMARK-037.md`: exact research basis, low-VRAM hypothesis, acceptance and fallback policy.
- Official-path first attempt uses 832x480, CPU T5, model offload and model dtype conversion.
- Source audio is muxed back after generation; no application source/UI/pipeline code is touched.

## Research finding
Official Wan2.2 supports replacement preprocessing and `animate-14B --replace_flag --use_relighting_lora`. Its CLI exposes `--offload_model`, `--convert_model_dtype`, and `--t5_cpu`. These controls make an official single-GPU 16GB attempt worth measuring, but upstream does not establish RTX 5060 Ti 16GB success. WanVideoWrapper/ComfyUI FP8/quantized + offload is the approved fallback spike only if the official path fails/OOMs.

## Gates
- Execution: PASS for harness publication.
- Automated verification: WAITING.
- Code review: WAITING exact PR diff/full-file review.
- Owner RTX 5060 Ti runtime: NOT STARTED.
- Documentation synchronization: IN PROGRESS until task_current/handoff and PR are published/re-read.
- Merge permission: BLOCKED.

## Merge
DO NOT MERGE. No UI work is authorized by this task.
