# Current Task

## Task ID
BUG-005

## Name
Pipeline 1 Full Processing Chain

## Status
WAITING_OWNER_UX_RETEST — CORE CHAIN TECHNICALLY PASS

## Base
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Base SHA: `dd520054b385ae18b8154b7c897eb9baad7eac02`

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Goal
`ASR(auto) + original-video keyframes/vision → structured analysis/remix artifacts → TTS artifacts → P1 COMPLETE → P2 READY`.

## Owner runtime technical PASS
The latest completed runtime demonstrated:
- 8-scene multimodal analysis;
- 8 remix-script segments;
- vision=`gemma4:12b`;
- reasoning=`qwen3-coder:30b`;
- reasoning 54.4s / 1805 output tokens / 52.2 tok/s;
- 8 TTS segments generated;
- durable `voice.mp3` persisted under the P1 job artifact directory;
- P1 completed and P2 unlocked after the artifact gate.

This proves the technical processing chain for the tested runtime. It does not by itself certify editorial quality of the analysis/remix.

## Current requested refinement
Owner requested:
1. Primary Start button must represent actual run state and become Stop on hover while active.
2. Stop must prevent P1 completion/P2 unlock and cancel active work where the active subsystem supports cancellation.
3. Repeating Ollama timer/generation log messages must update one live row rather than spam the Console.

## Current implementation
Source head before docs: `cb6959c454ef196c70f86cecba8a63d3b1f02a62`.
- New `pipeline1-run-ux.js` controls primary run/stop state and live progress rows.
- New `pipeline1-run-ux.css` provides processing/stop/stopping visual states.
- Preload exposes `cancelP1Vision`.
- Electron P1 vision IPC tracks one active run per renderer and aborts active Ollama inference on Stop.
- P1 analysis consumes `progress_key` to replace one progress row in-place.
- Cancellation prevents `p1ArtifactsReady` from becoming true and therefore keeps P2 locked.
- ASR/TTS backend routes are synchronous; stop during them is safe-stop at the request boundary rather than guaranteed immediate server-compute termination.

## Verification
Exact Git blob match + `node --check` PASS:
- p1-vision IPC `4a9408ef0268f254d55dabc73fa9df8a375f8091`
- preload `00e44d453c6a5d6b386ee76e392ea5e8300c39ff`
- analysis `421fd49b8eeb1e6918a5d9b90361501cb99b9646`
- run UX `cbbf919bea08687f1ba342d3e163911a4981cb95`
- run config `911402fb096f273c9bebadef71b6588e23083045`
- pipeline1 AI/TTS `bb1a523a6c10614df1944845ff77901eaf8572bb`

Targeted Ollama IPC cancellation simulation: PASS (`P1_CANCELLED`).
GitHub CI: not configured.

## Owner UX retest acceptance
PASS requires:
- idle button shows `Bắt đầu chạy`;
- after Start it remains `Đang xử lý...` until terminal state;
- hover during Ollama processing changes to red `Dừng xử lý`;
- clicking Stop during Ollama returns the Job to retryable/non-complete state and P2 remains locked;
- repeated Ollama generation seconds stay on one live log row;
- normal completion restores idle button state and preserves completion logs;
- no regression to generated SRT/audio/artifacts or P1→P2 handoff.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for focused Owner UX/cancel retest.
- Owner manual app verification: core chain TECHNICAL PASS; UX/cancel retest NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
