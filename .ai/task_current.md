# Current Task

## Task ID
BUG-005

## Name
Pipeline 1 Full Processing Chain

## Status
WAITING_CODE_REVIEW — MULTIMODAL REVISION

## Base
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`
- Base SHA: `dd520054b385ae18b8154b7c897eb9baad7eac02`

## Review branch / PR
- Branch: `review/BUG-005-P1-FULL-CHAIN`
- Draft PR: #41

## Goal
Implement the meaningful Pipeline 1 contract on the original video:
`ASR(auto) + original-video keyframes/vision → structured analysis/remix artifacts → TTS artifacts → P1 COMPLETE → P2 READY`.

## Previous Owner FAIL
The previous candidate proved only that ASR/LLM/TTS HTTP calls could succeed. Runtime showed wrong ASR content, no actual visual analysis, hidden generated audio, and premature P2 unlock. That candidate is invalidated.

## Revised source scope
- `src/main/p1-vision-ipc.js` — local Ollama model-capability/vision analysis, source SHA256 fingerprint, P1 audio artifact copy.
- `src/main/main.js` — register P1 IPC only.
- `src/main/preload.js` — expose P1 vision/audio IPC only.
- `src/renderer/js/pipeline1-run-config.js` — snapshot run config, force ASR auto, multimodal mode, reset artifact gate.
- `src/renderer/js/pipeline1-analysis.js` — keyframe sampling, multimodal response validation, remix SRT generation, JSON/SRT artifact persistence.
- `src/renderer/js/pipeline1-artifact-gate.js` — fail closed if legacy finished state appears without required multimodal artifacts.
- `src/renderer/js/pipelines/pipeline1-ai.js` — make running Job authoritative for detail UI; execute multimodal analysis then TTS; persist TTS artifacts; propagate failures.

## Required behavior
1. Approved P1 UI remains unchanged.
2. New jobs run ASR with automatic language detection.
3. P1 consumes both transcript and visual keyframes from the ORIGINAL video.
4. No vision-capable model => explicit P1 error; no text-only fallback may unlock P2.
5. Required analysis output: summary, insights, scenes, timed remix-script segments, edit plan.
6. Required P1 files: `scenes.json`, `multimodal_timeline.json`, `remix_script.json`, `edit_plan.json`, `remix_script.srt`; when TTS enabled also durable `voice.*` and `tts_timed.srt`.
7. Artifacts carry job/source identity metadata including source SHA256 fingerprint, duration/FPS/frame count and artifact version.
8. Job Detail text/audio/status must all bind to the Job actually being processed.
9. Enabled analysis/TTS stage failure => P1 error and P2 locked.
10. Only `p1ArtifactsReady=true` can permit the revised multimodal Job to remain P1 finished/P2 ready.
11. P1 must not remove hard subtitles, inpaint or render final video.

## Current limitation
- Multimodal runtime is currently Ollama-local only. P1 blocks Gemini/DeepSeek rather than silently falling back to text-only mode.
- Current visual coverage is sampled keyframes + model scene reasoning, not yet a deterministic CV scene-boundary detector.

## Verification
- Exact candidate JS files: `node --check` PASS; local Git blob hashes match published GitHub blobs.
- Run-config multimodal/ASR-auto simulation: PASS.
- Selected-model vision path: PASS.
- Separate local vision-model fallback path: PASS.
- No-vision-model fail-closed path: PASS.
- TTS audio artifact copy: PASS.
- False legacy completion relock: PASS.
- GitHub CI: not configured.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: WAITING.
- Owner manual app verification: previous candidate FAIL; fresh retest NOT AUTHORIZED until code review PASS.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.
