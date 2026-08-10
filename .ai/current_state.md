# Current State

## Status
WAITING_OWNER_RETEST — BUG-005 OLLAMA TELEMETRY / RESOURCE REVISION

## Canonical branch
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

## Canonical base for this task
`dd520054b385ae18b8154b7c897eb9baad7eac02`

## Accepted merged foundation
- Settings V1 PR #38: MERGED / Owner PASS.
- Pipeline 1 approved UI PR #39: MERGED / Owner PASS.
- Pipeline 1 → Pipeline 2 handoff PR #40: MERGED / Owner PASS.

## Active task
- Task: `BUG-005 — Pipeline 1 Full Processing Chain`.
- Branch: `review/BUG-005-P1-FULL-CHAIN`.
- Draft PR: #41.

## Owner FAIL retained as evidence
Head `6ce8d3e9eef3170b3639c42c95c59f51356b8efe` reached ASR + 8 keyframes but timed out in Ollama multimodal Stage C. That runtime did not prove which model was loaded/executing and did not complete artifacts/TTS.

## Current revision
Source revision after the FAIL adds:
1. Renderer keyframe normalization before Ollama: maximum edge 960px, JPEG quality 0.72, payload size logging.
2. Electron Ollama preflight through `/api/tags` and capability lookup through `/api/show`.
3. Explicit log of the selected reasoning model capabilities and actual vision model selected.
4. `/api/ps` polling while each inference phase runs, logging resident model size, VRAM bytes and context length when Ollama reports them.
5. Streaming `/api/chat` responses to expose first-output latency, running progress and final token/eval metrics rather than leaving the app silent during generation.
6. Structured-output JSON schemas remain enforced for vision analysis and final remix analysis.
7. Separate phase-specific timeouts: vision analysis and reasoning/remix identify exact phase/model on failure.
8. Resource-safe fallback: after a separate vision model finishes, request `keep_alive: 0`, verify unload with `/api/ps`, then start the selected reasoning model.
9. P1 remains fail-closed; analysis failure keeps `p1ArtifactsReady=false` and P2 locked.

## Verification
- Exact GitHub blob `src/main/p1-vision-ipc.js` = `31fcf02146f122a383ee52894d59626f378ac817`; reconstructed exact file produced the same Git blob SHA and `node --check` PASS.
- Exact GitHub blob `src/main/preload.js` = `f642febe19a196fe088c7bba6486c380484a0e9e`; exact blob hash match + `node --check` PASS.
- Exact GitHub blob `src/renderer/js/pipeline1-analysis.js` = `09e4df418e41ff7eeac74ed9686af6f24fdbeb9e`; exact blob hash match + `node --check` PASS.
- GitHub compare from failed head `78135d7e84ced0912c29514340a674e20ddaaca4` to source head `1c8b9c6aba4e92a1f9525ec8b700a170cee152b4` changes only those three product files.
- Official Ollama API contract review confirms `/api/show` capabilities, `/api/ps` running-model fields, base64 `images` for vision, JSON-schema `format`, streaming NDJSON, and `keep_alive: 0` unload semantics are supported.
- GitHub CI: not configured.

## Review decision
Code review: PASS for fresh Owner runtime retest of this revision.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for exact blob syntax/hash plus API-contract verification.
- Code review: PASS for Owner retest.
- Owner manual app verification: previous head FAIL; fresh retest AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED pending fresh Owner PASS and explicit merge approval.
