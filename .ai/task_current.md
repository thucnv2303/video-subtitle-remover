# Current Task

## Task ID
BUG-005

## Name
Pipeline 1 Full Processing Chain

## Status
WAITING_OWNER_RETEST — MULTIMODAL REVISION

## Base
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Base SHA: `dd520054b385ae18b8154b7c897eb9baad7eac02`

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Goal
`ASR(auto) + original-video keyframes/vision → structured analysis/remix artifacts → TTS artifacts → P1 COMPLETE → P2 READY`.

## Previous Owner FAIL
The previous candidate proved only ASR/LLM/TTS transport success. Runtime showed wrong ASR content, no visual analysis, hidden generated audio, and premature P2 unlock. It is invalidated.

## Revised source scope
- `src/main/p1-vision-ipc.js`: local Ollama capability/vision analysis, SHA256 fingerprint, durable audio copy.
- `src/main/main.js`: P1 IPC registration only.
- `src/main/preload.js`: P1 vision/audio bridge only.
- `src/renderer/js/pipeline1-run-config.js`: run snapshot, ASR auto, multimodal mode.
- `src/renderer/js/pipeline1-analysis.js`: keyframes, structured analysis validation, remix SRT + JSON/SRT persistence.
- `src/renderer/js/pipeline1-artifact-gate.js`: fail-closed completion guard.
- `src/renderer/js/pipelines/pipeline1-ai.js`: authoritative running Job, multimodal → TTS chain, durable artifacts, strict failures.

## Acceptance
1. Approved P1 UI remains unchanged.
2. ASR is auto-language and source transcript remains available for evidence.
3. P1 consumes original-video keyframes plus transcript.
4. No vision-capable local model => P1 error / P2 locked.
5. Output includes meaningful summary/insights/scenes/timed remix script/edit plan.
6. `jobs/<job_id>/p1/` contains `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`, `remix_script.srt`; with TTS enabled also `voice.*` and `tts_timed.srt`.
7. JSON artifacts contain source fingerprint and video metadata.
8. Job Detail text/audio/status all show the running/selected Job; generated audio is visible and playable.
9. Any enabled stage failure => P1 error and P2 locked.
10. P2 unlock only after `p1ArtifactsReady=true`.
11. P1 never removes subtitles/inpaints/renders.

## Known limitation
- Fresh retest scope is local Ollama multimodal only. Gemini/DeepSeek are blocked rather than degraded to text-only.
- Current scene understanding uses sampled keyframes + vision reasoning; deterministic CV scene-boundary detection remains later work.

## Verification
- Exact published JS equivalents: `node --check` PASS + Git blob hash match.
- ASR-auto/multimodal config simulation: PASS.
- Direct vision model: PASS.
- Separate vision-model fallback: PASS.
- No-vision fail-closed: PASS.
- Durable TTS audio copy: PASS.
- False-complete relock: PASS.
- GitHub code review: PASS for fresh Owner retest.
- GitHub CI: not configured.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for fresh Owner retest.
- Owner manual app verification: previous candidate FAIL; fresh multimodal retest AUTHORIZED / NOT STARTED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED pending fresh Owner PASS and explicit merge approval.
