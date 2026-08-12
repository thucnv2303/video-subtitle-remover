# QA Checklist

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006`

## Current review basis
- [x] Active branch `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- [x] Draft PR #47 targets `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- [x] Base SHA `68c750524f9604b7799d97a2b5604d87368f889c`.
- [x] Prior corrective source `1c028612900b1180aa8c1e66da2d769373793c91`.
- [x] Narration-quality source commit `00e80aea06d526b34518dd069f9b1c581c80e77c`.
- [x] Compare `131f35c... -> 00e80aea...` changes exactly one application source file: `src/main/p1-vision-ipc.js`.
- [x] No P2/P3/STTN/Settings/backend/TTS-engine source changes in the quality correction.

## Previously verified runtime/static evidence
- [x] Owner reported corrective two-Job run successful.
- [x] Owner prior static command bundle: all four requested `node --check` commands returned clean.
- [x] Owner prior `git diff --check 68c750...HEAD` returned clean.
- [x] >60s runtime input: `97.57s`.
- [x] Adaptive sampling: `25` keyframes / `4` chunks.
- [x] Chunk frame counts: `8 / 8 / 8 / 1`, all <=8.
- [x] All four Vision chunks completed.
- [x] Global qwen reasoning completed in `48.2s`.
- [x] Continuous full-text TTS produced `94.62s / 97.57s = 97.0%`.
- [x] P1 completed and unlocked P2 on the >60s run.

## BUG-031 evidence — narration quality
- [x] Owner-provided 97.57s narration contains a repeated tail/CTA/value block multiple times.
- [x] Narration contains stray CJK text (`饱满`).
- [x] Narration hit the exact prior upper bound `1610/1610`, consistent with padding pressure from hard length constraints.
- [x] Duration PASS does not count as narration-quality PASS.

## Quality-gate correction logic review
- [x] Initial narration lower char target is soft; schema only requires non-empty text and enforces the upper bound before measured TTS.
- [x] Prompt explicitly forbids padding/filler/repeated CTA/conclusion and prioritizes natural narration over hitting the soft minimum.
- [x] Prompt requires natural Vietnamese and forbids stray CJK/Han/Japanese/Korean output.
- [x] Prompt requires consistent subject/product/ingredient naming and neutral wording when evidence conflicts.
- [x] Deterministic quality gate detects CJK characters.
- [x] Deterministic quality gate detects exact repeated long sentences.
- [x] Deterministic quality gate detects high-similarity repeated long sentences.
- [x] Deterministic quality gate detects repeated exact 10-word phrases.
- [x] Initial bad narration gets at most one narration-only quality repair without rerunning Vision.
- [x] Duration-fit output is still hard-validated against measured character range.
- [x] Duration-fit output is quality-validated again before final re-TTS.
- [x] A quality repair that still fails deterministic checks is rejected; P1 fails closed.
- [x] Continuous `/api/tts/generate`, bounded duration fit, queue auto-advance, manual Job browsing and P2 fail-closed behavior remain in scope and unchanged.

## Deterministic quality evidence
- [x] Owner bad narration sample is rejected with `CJK_CHARACTERS`, `REPEATED_SENTENCE`, `REPEATED_LONG_PHRASE`.
- [x] Clean Vietnamese narration sample passes the same deterministic gate.

## Exact static checks — BLOCKING ON NEW FINAL HEAD
- [ ] `git rev-parse HEAD` equals the exact final docs/head supplied for retest.
- [ ] `node --check src/main/p1-vision-ipc.js`.
- [ ] `node --check src/main/preload.js`.
- [ ] `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- [ ] `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- [ ] GitHub CI/status checks — none configured; absence is not CI PASS.

## Fresh Owner quality retest — BLOCKING
- [ ] Re-run the same uploaded 97.57s video or equivalent on the exact new final head.
- [ ] `Narration quality` log reports PASS directly or exactly one bounded quality repair before TTS.
- [ ] Quality repair does not rerun Vision.
- [ ] Final narration has no repeated tail/value block/CTA padding.
- [ ] Final narration contains no stray CJK characters.
- [ ] Final narration is coherent natural Vietnamese with consistent subject/product/ingredient naming.
- [ ] CTA/conclusion appears at most once.
- [ ] If first TTS duration misses 95–100%, measured narration fit remains bounded and final candidate passes both hard range + quality before final re-TTS.
- [ ] Final successful voice ratio is 95–100% inclusive.
- [ ] No segmented `/api/tts-retry` narration path reappears.
- [ ] P1 completes and unlocks P2 only after all gates pass.

## Gates
Execution PASS for quality correction; automated/static WAITING on new final head; code review WAITING final PM confirmation; Owner quality retest WAITING; documentation synchronization PASS after publication; merge BLOCKED; Step 3 BLOCKED.