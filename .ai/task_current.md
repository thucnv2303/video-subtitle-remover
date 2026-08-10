# Current Task

## Task ID
BUG-005

## Name
Pipeline 1 Full Processing Chain

## Status
WAITING_OWNER_RETEST — OLLAMA TELEMETRY / RESOURCE REVISION

## Base
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Base SHA: `dd520054b385ae18b8154b7c897eb9baad7eac02`

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Goal
`ASR(auto) + original-video keyframes/vision → structured analysis/remix artifacts → TTS artifacts → P1 COMPLETE → P2 READY`.

## Previous Owner FAIL
Head `6ce8d3e9...` timed out during multimodal Stage C after successful ASR and 8 keyframes. The runtime lacked proof of the selected vision model, Ollama model residency, GPU/CPU allocation or token generation progress.

## Current revision
- Downscale/re-encode vision keyframes to max 960px / JPEG 0.72 before IPC.
- Log approximate image payload size.
- Preflight local Ollama and enumerate installed models.
- Inspect selected reasoning-model capabilities and select the smallest installed vision-capable fallback when required.
- Poll `/api/ps` during inference and log model size, VRAM residency and context reported by Ollama.
- Stream chat output and log first-output latency, progress and final token rate.
- Use JSON-schema structured output for both visual analysis and final remix analysis.
- On separate vision/reasoning path, explicitly unload the vision model and verify release before reasoning.
- Timeout/errors identify exact model + phase.
- Failure remains fail-closed and must keep P2 locked.

## Verification
- `p1-vision-ipc.js` blob `31fcf02146f122a383ee52894d59626f378ac817`: exact Git blob match + `node --check` PASS.
- `preload.js` blob `f642febe19a196fe088c7bba6486c380484a0e9e`: exact Git blob match + `node --check` PASS.
- `pipeline1-analysis.js` blob `09e4df418e41ff7eeac74ed9686af6f24fdbeb9e`: exact Git blob match + `node --check` PASS.
- Failed-head → new-source compare changes only the three files above.
- Ollama official API contracts used by the revision were re-verified: vision images, model capabilities, running models, streaming, structured outputs and keep-alive unload.
- GitHub CI: not configured.

## Owner retest acceptance
A fresh Job must show enough telemetry to answer which model is running and where time is spent. PASS still requires meaningful multimodal remix output, required P1 artifacts, visible/playable TTS audio, and P2 unlock only after artifact readiness.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for fresh Owner retest.
- Owner manual app verification: previous head FAIL; fresh retest AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
