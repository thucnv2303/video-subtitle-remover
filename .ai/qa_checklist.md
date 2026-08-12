# QA Checklist

## Active task
`PIPELINE1-CONTINUOUS-NARRATION-006`

## Current review basis
- [x] Active branch `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- [x] Draft PR #47 targets `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005`.
- [x] Base SHA `68c750524f9604b7799d97a2b5604d87368f889c`.
- [x] Owner-failed quality-gate head `0e327f353b7be15483576233aaed126813542158`.
- [x] BUG-032 failure-intake docs commit `13f492d4fb3c39c5173adcc56c6858b23d03a082`.
- [x] BUG-032 source correction `a0e6165dfd88561bf3140907b6d578782a2ccebf`.
- [x] Compare `13f492d4... -> a0e6165d...` changes exactly one source file, `src/main/p1-vision-ipc.js`, with 4 additions / 2 deletions.
- [x] PM BUG-032 source review `4912221026` PASS for logic/scope.
- [x] No P2/P3/STTN/Settings/backend/TTS-engine source changes in BUG-032 correction.

## Previously closed coverage
- [x] Owner prior two-Job corrective run reported successful.
- [x] Prior static bundle: four requested `node --check` commands clean.
- [x] Prior `git diff --check` clean.
- [x] >60s adaptive runtime: 97.57s input.
- [x] Adaptive sampling: 25 keyframes / 4 chunks / 8,8,8,1 frames.
- [x] All Vision chunks completed.
- [x] Prior bounded qwen long-run completed in 48.2s.
- [x] Continuous full-text TTS architecture observed.
- [x] Prior successful long-run duration: 94.62s / 97.57s = 97.0%.
- [x] BUG-031 quality gate detects CJK/repeated long sentences/repeated long phrases.

## BUG-032 runtime evidence
- [x] Quality-first initial narration may be naturally short: observed 575 chars.
- [x] First TTS measured 33.98s / 97.57s = 34.8%.
- [x] Measured duration-fit budget computed 1568–1651 chars.
- [x] Pre-fix duration-fit returned 575 chars and failed post-parse hard validation before final TTS.
- [x] Root cause: shared repair schema had `minLength:1` for duration-fit.

## BUG-032 corrective logic review
- [x] `narrationRepairSchemaForBudget()` uses `budget.min_chars` as schema `minLength` when supplied.
- [x] `maxLength` is clamped to at least `minLength`.
- [x] Quality-cleanup callers that provide only `max_chars` retain soft `minLength:1`.
- [x] Measured duration-fit caller passes the full budget and therefore receives a hard schema range.
- [x] Post-parse `assertNarrationWithinBudget()` still revalidates the hard measured range.
- [x] Quality validation still runs before any final re-TTS candidate is accepted.
- [x] No extra retry loop or Vision rerun introduced.

## Exact static checks — BLOCKING ON FINAL DOCS/HEAD
- [ ] `git rev-parse HEAD` equals the exact final head supplied for retest.
- [ ] `node --check src/main/p1-vision-ipc.js`.
- [ ] `node --check src/main/preload.js`.
- [ ] `node --check src/renderer/js/pipeline1-analysis.js`.
- [ ] `node --check src/renderer/js/pipelines/pipeline1-ai.js`.
- [ ] `git diff --check 68c750524f9604b7799d97a2b5604d87368f889c..HEAD`.
- [ ] GitHub CI/status checks — none configured; absence is not CI PASS.

## Fresh Owner runtime — BLOCKING
- [ ] Re-run the same 97.57s input or equivalent on exact final head.
- [ ] Initial narration quality gate passes directly or uses at most one narration-only quality repair without rerunning Vision.
- [ ] If first TTS is outside 95–100%, measured duration-fit logs a hard target range.
- [ ] Duration-fit candidate is inside that logged hard range before final TTS; the previous 575-for-1568–1651 failure must not recur.
- [ ] Duration-fit candidate also passes narration quality: no repeated tail/CTA padding, no stray CJK, coherent Vietnamese, no obvious subject/ingredient contradiction.
- [ ] CTA/conclusion appears at most once.
- [ ] Final successful voice ratio is 95–100% inclusive.
- [ ] No segmented `/api/tts-retry` narration path reappears.
- [ ] P1 completes and unlocks P2 only after all gates pass.

## Gates
Execution PASS for BUG-032 correction; automated/static WAITING; code review PASS for logic/scope (`4912221026`); Owner retest WAITING; documentation synchronization PASS; merge BLOCKED; Step 3 BLOCKED.