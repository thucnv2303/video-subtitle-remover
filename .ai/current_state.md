# Current State

## Status
OWNER_RUNTIME_FAIL — BUG-005 MULTIMODAL OLLAMA TIMEOUT

## Canonical branch
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

## Canonical base for this task
`dd520054b385ae18b8154b7c897eb9baad7eac02`

## Accepted merged foundation
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.
- BUG-008 premature P1→P2 handoff: RESOLVED / Owner PASS.

## Active task
- Task: `BUG-005 — Pipeline 1 Full Processing Chain`.
- Branch: `review/BUG-005-P1-FULL-CHAIN`.
- Draft PR: #41.

## Owner runtime FAIL — multimodal revision — 2026-08-10
Owner tested PR head `6ce8d3e9eef3170b3639c42c95c59f51356b8efe` with a fresh P1 job.

Observed runtime facts:
- P1 captured `ASR=auto; Analysis=multimodal; AI=ollama/qwen3-coder:30b; TTS=clone:0`.
- ASR completed and returned one SRT segment.
- P1 successfully fetched 8 keyframes from a 17.6s ORIGINAL video.
- Multimodal Stage C started at 09:29:33.
- No Ollama model/capability/load/progress diagnostics were shown during Stage C.
- At 09:33:27 P1 failed with `Ollama quá thời gian phản hồi khi phân tích video.`
- Job remained failed; this runtime did not demonstrate successful artifacts/TTS/P2 handoff.
- Python backend also logged `Warning: Could not import backend: No module named 'backend'`; this is a separate defect/risk because current multimodal Ollama inference is called from Electron main process, not through the Python API.

## Verified code findings after runtime FAIL
- `src/main/p1-vision-ipc.js` sends Ollama requests directly via Electron `net.fetch`.
- `qwen3-coder:30b` is the selected reasoning model. Capability lookup may choose a second installed vision-capable model for keyframe analysis.
- Each `/api/chat` request has a hard 180-second timeout.
- The fallback design can execute two large-model phases sequentially: vision analysis then reasoning analysis.
- The current IPC emits no progress telemetry for capability lookup, selected vision model, model load, running model, prompt evaluation or generation.
- Renderer sends 8 JPEG keyframes as base64 without a dedicated resize/compression/token budget before Ollama.
- Therefore the runtime evidence proves a timeout, but does not prove which model was actively running on GPU at each point.

## Decision
`NEEDS_REVISION`

The prior code-review PASS for fresh Owner retest is invalidated for head `6ce8d3e...`.

## Required next revision
1. Add explicit Ollama preflight and per-phase observability: endpoint reachability, selected reasoning-model capabilities, chosen vision model, phase start/end and elapsed time, and running-model diagnostics where available.
2. Make timeout failures identify the exact model and phase.
3. Reduce/normalize keyframe payload before vision inference.
4. Use a resource-safe sequential vision → reasoning strategy, including explicit keep-alive/unload behavior where appropriate.
5. Do not solve this merely by increasing timeout.
6. Preserve fail-closed behavior and keep P2 locked on any incomplete multimodal analysis.
7. Preserve P1/P2/P3 responsibility boundaries.

## Gates
- Execution: NEEDS_REVISION.
- Automated/static verification: previous checks PASS only for the failed head; new revision WAITING.
- Code review: INVALIDATED / NEEDS_REVISION.
- Owner manual app verification: FAIL.
- Documentation synchronization: PASS for failure recording.
- Merge permission: BLOCKED.
