# QA Checklist

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006`

## Source/scope
- [x] Dedicated branch `review/PIPELINE1-CONTINUOUS-NARRATION-006` from exact failed parent `68c750524f9604b7799d97a2b5604d87368f889c`.
- [x] Draft PR #47 targets `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- [x] Application-source changes limited to `src/main/p1-vision-ipc.js`, `src/main/preload.js`, `src/renderer/js/pipeline1-analysis.js`, `src/renderer/js/pipelines/pipeline1-ai.js`.
- [x] No P2/P3/STTN/Settings/backend/TTS-engine source changes.
- [x] PM source/diff review PASS `4905691792` at source head `e07c02776a5918be7a4d2c1a72b26ed3138027cc`.

## Product/logic review
- [x] Final reasoning returns one `narration_script`, not per-scene `script_segments`.
- [x] Final reasoning does not regenerate Vision scene descriptions; Vision evidence remains scene authority.
- [x] Source duration, selected voice and selected speed are passed before narration generation.
- [x] Initial narration target is bounded around 97.5% of source duration.
- [x] Short-input global reasoning timeout is 150s, not the old 360s.
- [x] P1 continuous narration path contains no `/api/tts-retry` call.
- [x] One full-text `/api/tts/generate` call site is used for each TTS pass.
- [x] Selected reading speed is applied after synthesis via ffmpeg `atempo` without changing video speed.
- [x] ffprobe exact output-file duration is used for the narration duration gate.
- [x] Success gate is inclusive 95–100% of source duration.
- [x] Pass 1 outside range can invoke exactly one whole-narration fit based on measured chars/sec and exactly one re-TTS.
- [x] Pass 2 outside range throws before `p1ArtifactsReady=true`.
- [x] Subtitle timing is generated after continuous audio exists; subtitle chunks do not create separate speech synthesis requests.
- [x] Queue runner source is unchanged; inherited sequential failure isolation/auto-advance remains intended.
- [x] Manual Job browsing correction from PR #46 is inherited.

## Deterministic/local candidate checks completed
- [x] `node --check` PASS on the four locally reconstructed changed JS candidates before publication.
- [x] Narration budget ordering PASS for 17.6s, 24.3s, 60s and 300s examples.
- [x] Short reasoning timeout helper returns 150s for <=60s input.
- [x] Selected speed clamp helper stays within 0.5x–2.0x.
- [x] Measured repair example: 480 chars / 48.0s voice against 24.3s video derives a new ~95–100% character window and ~97.5% target.
- [x] Static source scan: `/api/tts-retry` absent from new P1 AI path; `/api/tts/generate` present once at full-text TTS request helper.

## Exact final-head static checks — BLOCKING FOR MERGE
- [ ] `node --check src/main/p1-vision-ipc.js`.
- [ ] `node --check src/main/preload.js`.
- [ ] `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- [ ] `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- [ ] GitHub CI/status checks — none configured; absence is recorded, not treated as CI PASS.

## Fresh Owner runtime — BLOCKING
- [ ] Re-run previous two-Job sequence on exact PR #47 final docs/head.
- [ ] Job 1/24.30s: log shows `Voice-aware narration budget` with selected voice + speed before global reasoning.
- [ ] Job 1: global reasoning returns one continuous narration; UI content is coherent from start to finish rather than 16 mini-scripts.
- [ ] Job 1: backend shows one `/api/tts/generate` request per TTS pass and no `/api/tts-retry` / `Segments after expansion` P1 narration flow.
- [ ] Job 1: final accepted voice is >=95% and <=100% of source duration, or after exactly one fit/re-TTS Job becomes error and P2 stays locked.
- [ ] If narration fit occurs, it rewrites the whole narration once; no repeat loop.
- [ ] `voice.wav` plays continuously without synthetic gaps caused by subtitle segmentation.
- [ ] `tts_timed.srt` may contain display chunks, but audio synthesis remains one continuous speech track.
- [ ] Short-input global reasoning completes/fails within the new 150s reasoning bound; it must not remain active near the old ~349/360s behavior.
- [ ] After Job 1 finishes or fails, Job 2 auto-starts without manual intervention.
- [ ] While Job A processes, user may click Job B and detail remains on B while A continues processing.
- [ ] Existing file-path, adaptive Vision, failed-Job popup/retry and spinner behavior do not regress.
- [ ] Before ultimate P1 merge approval, a >60s input demonstrates >8 adaptive samples and multiple Vision chunks with <=8 frames each.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner NOT STARTED — READY; documentation synchronization PASS after final docs publication; merge BLOCKED; Step 3 BLOCKED.
