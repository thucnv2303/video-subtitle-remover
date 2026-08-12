# QA Checklist

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006 — BUG-034 P1/P3 Duration Responsibility Redesign`

## Review basis
- [x] Active branch `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- [x] Draft PR #47 targets `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- [x] Base SHA `68c750524f9604b7799d97a2b5604d87368f889c`.
- [x] BUG-034 approved spec `c046adca8394652cae94fb47821ac8927cb62f74`.
- [x] P1 source `97a8e31350b9a0ff40d93207d3de8164b98b458a`.
- [x] P3 source `55faf3e734120edec93ba22798599eaf16b6be13`.
- [x] Source compare from spec head changes exactly two files: P1 AI + P3 finalize.
- [x] PM review `4912891690` PASS logic/scope only.
- [x] No P2/STTN/backend/TTS-engine/dependency source changes in BUG-034.

## Owner failure evidence
- [x] 97.57s source / 25 adaptive keyframes / 4 Vision chunks.
- [x] Global reasoning 38.8s produced quality-clean 613-char narration.
- [x] Full-text TTS pass 1 measured 35.91s = 36.8%.
- [x] Prior controller launched a second evidence-fit toward 1582–1666 chars.
- [x] Second qwen request timed out at 150s and failed the Job.
- [x] Product diagnosis: hard original-video occupancy is the wrong P1 completion gate.

## BUG-034 source logic review
### P1
- [x] Normal successful P1 path no longer calls evidence-fit for duration occupancy.
- [x] Normal successful P1 path no longer calls a second TTS solely for occupancy.
- [x] P1 underlength is non-blocking.
- [x] P1 duration outside 90–110% logs warning telemetry.
- [x] P1 blocks only pathological overlength above 150% measured ratio.
- [x] P1 continuous narration remains one full-text TTS artifact.
- [x] Same-session late retry can reuse valid analysis/TTS checkpoint.
- [x] Legacy `DURATION_CONTROL` checkpoint remains compatible while new checkpoint purpose is `TTS_FINALIZE`.

### P3
- [x] P3 no longer calls `adjustVideoTempo()` for voice matching.
- [x] P3 probes the actual video used for final mixing.
- [x] Ratio <0.90 keeps natural P1 voice.
- [x] Ratio 0.90–1.15 may use pitch-preserving derived voice.
- [x] Ratio >1.15 blocks automatic stretch.
- [x] Derived voice is written under sibling `p3/voice.wav`, not over P1 voice.
- [x] Derived subtitle timing is scaled to measured adjusted duration and written as `p3/tts_timed.srt`.
- [x] Final burn uses the derived timing when voice was adjusted.

## Exact static checks — BLOCKING
- [ ] `git rev-parse HEAD` equals exact final review head.
- [ ] `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- [ ] `node --check src/renderer/js/pipelines/pipeline3-finalize.js`.
- [ ] Recommended regression syntax: `node --check src/main/p1-vision-ipc.js` and `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- [ ] GitHub CI/status: none configured; absence is not CI PASS.

## Fresh Owner P1 runtime — BLOCKING
- [ ] Re-run same/equivalent 97.57s video on exact final head.
- [ ] Vision/global reasoning completes and narration quality gate remains clean.
- [ ] Exactly one normal full-text TTS request is made.
- [ ] P1 logs `P1 duration telemetry` with source duration, voice duration and ratio.
- [ ] For a ~36.8% voice, P1 logs warning but DOES NOT emit `Narration evidence-fit`.
- [ ] Underlength alone does not fail P1 or block P2 readiness.
- [ ] P1 artifacts include valid `voice.wav` and `tts_timed.srt`.
- [ ] A deliberately pathological >150% voice is blocked if a practical fixture is available.

## Owner P3 runtime/listening — BLOCKING
- [ ] Ratio <0.90: voice remains natural; no P3 voice stretch; video duration/playback speed unchanged.
- [ ] Ratio around 0.90: derived voice path works and remains listenable.
- [ ] Ratio around 1.00: no unnecessary adjustment.
- [ ] Ratio around 1.10–1.15: derived voice remains intelligible/natural enough for Owner acceptance.
- [ ] Ratio >1.15: P3 explicitly refuses automatic stretch; no silent distortion.
- [ ] When adjusted, P3 creates `p3/voice.wav` and does not alter P1 `voice.wav`.
- [ ] When adjusted, P3 creates/rescales `p3/tts_timed.srt` and burned subtitle follows adjusted voice.
- [ ] P3 does not create/use `_tempo.mp4` for voice matching.
- [ ] Final video uses P2 clean video pacing by default.

## Regression coverage
- [ ] Second queued P1 Job still auto-advances after first Job failure/success.
- [ ] Manual Job browsing remains usable.
- [ ] No segmented `/api/tts-retry` narration path reappears.
- [ ] P2 subtitle-removal behavior unchanged.

## Gates
Execution PASS for BUG-034 source publication; automated/static WAITING; code review PASS logic/scope (`4912891690`); Owner P1 verification WAITING; Owner P3 listening/runtime WAITING; documentation synchronization PASS after canonical sync; merge BLOCKED.