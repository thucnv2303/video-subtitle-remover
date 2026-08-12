# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — BUG-034 SOURCE PUBLISHED / PM LOGIC-SCOPE REVIEW PASS / STATIC + OWNER RUNTIME WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- BUG-034 approved spec: `c046adca8394652cae94fb47821ac8927cb62f74`.
- P1 duration-policy source: `97a8e31350b9a0ff40d93207d3de8164b98b458a`.
- P3 derived-voice source: `55faf3e734120edec93ba22798599eaf16b6be13`.
- PM review: `4912891690` — PASS logic/scope only, not release PASS.

## Fresh Owner evidence that drove BUG-034
97.57s input completed Vision/global reasoning and produced a quality-clean 613-char narration. Full-text TTS pass 1 measured 35.91s = 36.8%. The prior BUG-033 controller then launched a second qwen evidence-fit toward 1582–1666 chars and timed out after 150s. The failure was caused by treating original-video voice occupancy as a blocking P1 contract after usable P1 artifacts already existed.

## Published BUG-034 correction
### Pipeline 1
- Normal successful P1 path performs one continuous full-text TTS and measures exact duration.
- The 95–100% hard minimum is removed from P1 completion.
- Underlength is telemetry/warning only; no evidence-fit or second TTS is called solely to fill timeline.
- Material mismatch outside 90–110% logs a warning.
- Only pathological overlength `voice/source > 1.50` is blocked at P1.
- Same-session retry keeps analysis/TTS checkpoint reuse; new checkpoint purpose is `TTS_FINALIZE`, while legacy `DURATION_CONTROL` checkpoints remain readable in-session.

### Pipeline 3
- P3 preserves clean-video playback speed by default; `adjustVideoTempo()` is no longer called for voice matching.
- P3 probes the actual video used for final mixing.
- Voice ratio `<0.90`: keep natural P1 voice and allow remaining visual/music/silence coverage.
- Ratio `0.90–1.15`: P3 may create a pitch-preserving derived voice using the existing audio-preparation bridge.
- Ratio `>1.15`: automatic stretch is blocked with explicit diagnostic.
- Derived P3 audio is written under sibling `p3/voice.wav`; P1 `voice.wav` is not overwritten.
- When voice tempo changes, subtitle timestamps are rescaled to measured derived-audio duration and persisted as `p3/tts_timed.srt`.

## Scope/review evidence
Compare `c046adca... -> 55faf3e7...` changes exactly two source files:
- `src/renderer/js/pipelines/pipeline1-ai.js`: +31 / -71.
- `src/renderer/js/pipelines/pipeline3-finalize.js`: +189 / -70.
No P2/STTN/backend/TTS-engine/dependency source change in BUG-034.

PM reviewed exact source head `55faf3e734120edec93ba22798599eaf16b6be13` and recorded review `4912891690` as PASS for logic/scope only.

## Verification status
- GitHub source/diff review: PASS logic/scope.
- GitHub commit status checks: none configured; absence is not CI PASS.
- Exact final-head Node syntax: WAITING.
- Exact final-head `git diff --check`: WAITING.
- Owner P1 97.57s runtime: WAITING.
- Owner P3 listening/runtime coverage: WAITING.

## Gates
- Execution: PASS for BUG-034 source publication.
- Automated/static verification: WAITING.
- Code review: PASS logic/scope (`4912891690`), not release PASS.
- Owner manual app verification: WAITING fresh BUG-034 retest.
- Documentation synchronization: PASS after final canonical sync.
- Merge permission: BLOCKED.
- Step 3 release progression: BLOCKED until required Owner P3 verification passes.

## Next permitted action
Owner checks out the exact final docs/head, runs static checks, then reruns the 97.57s P1 case. Required P1 proof: after first valid TTS, log shows duration telemetry and P1 completion; no `Narration evidence-fit` request occurs. Then run P3 voice-fit/listening cases below 0.90, around 0.90/1.00/1.10–1.15, and above 1.15, verifying video speed remains unchanged and any adjusted voice/SRT are P3-derived artifacts. Do not merge before Owner PASS is recorded in canonical `.ai/`.