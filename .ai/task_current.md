# Current Task

## Task ID
BUG-005

## Name
Pipeline 1 Full Processing Chain

## Status
OWNER_RUNTIME_FAIL / NEEDS_REVISION — OLLAMA MULTIMODAL TIMEOUT

## Base
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Base SHA: `dd520054b385ae18b8154b7c897eb9baad7eac02`

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Goal
`ASR(auto) + original-video keyframes/vision → structured analysis/remix artifacts → TTS artifacts → P1 COMPLETE → P2 READY`.

## Latest Owner runtime FAIL — 2026-08-10
Tested head: `6ce8d3e9eef3170b3639c42c95c59f51356b8efe`.

Observed:
- run config correctly captured Ollama `qwen3-coder:30b`, multimodal mode and clone voice;
- ASR completed;
- 8 original-video keyframes were fetched successfully;
- multimodal Stage C began at 09:29:33 and timed out at 09:33:27;
- UI/log exposed no selected vision model, Ollama load state or generation progress;
- P1 ended in error; artifacts/TTS/P2-success acceptance was not reached.

## Verified blocker
Current `p1-vision-ipc.js` calls Ollama directly from Electron main process. The selected `qwen3-coder:30b` is the reasoning model and capability discovery can choose a different installed vision model. Each chat has a hard 180-second timeout; fallback can require two model phases. There is no phase/model telemetry and keyframes are sent without a dedicated resize/compression budget.

The runtime therefore proves timeout but does not prove which model was actively using GPU. Lack of GPU temperature increase is supporting observation only, not sufficient proof that Ollama was never invoked.

## Required revision
1. Ollama preflight/telemetry: endpoint reachable, selected model capabilities, chosen vision model, running-model state when available.
2. Log each inference phase with model + start/end/elapsed and phase-specific timeout errors.
3. Downscale/compress keyframes before multimodal request.
4. Resource-safe sequential model lifecycle; explicit keep-alive/unload behavior where appropriate.
5. Do not merely extend timeout.
6. Fail closed: incomplete analysis => P1 error, P2 locked.
7. Preserve approved P1 UI and P2/P3 boundaries.

## Gates
- Execution: NEEDS_REVISION.
- Automated/static verification: WAITING for revised candidate.
- Code review: INVALIDATED / NEEDS_REVISION.
- Owner manual app verification: FAIL; fresh retest NOT AUTHORIZED.
- Documentation synchronization: PASS for failure recording.
- Merge permission: BLOCKED.
