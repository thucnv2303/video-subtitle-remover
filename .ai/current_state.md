# Current State

## Status
PIPELINE1-CONTINUOUS-NARRATION-006 — BUG-032 SOURCE FIX REVIEW PASS / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-CONTINUOUS-NARRATION-006`.
- Active Draft PR: #47.
- Base: `review/PIPELINE1-FINAL-RUNTIME-GUARDS-005@68c750524f9604b7799d97a2b5604d87368f889c`.
- Owner-failed quality-gate head: `0e327f353b7be15483576233aaed126813542158`.
- BUG-032 failure-intake docs commit: `13f492d4fb3c39c5173adcc56c6858b23d03a082`.
- BUG-032 source correction: `a0e6165dfd88561bf3140907b6d578782a2ccebf`.
- PM BUG-032 source review: `4912221026` — PASS for logic/scope, not release PASS.

## Owner evidence already closed
- Prior corrective two-Job runtime: PASS reported by Owner.
- >60s adaptive coverage: PASS on 97.57s input with 25 keyframes / 4 chunks / 8,8,8,1 frames.
- Prior global reasoning bounded runtime and continuous TTS duration: PASS.
- BUG-031 repeated-tail/CJK quality defect was addressed by quality-gate source `00e80aea...`.

## BUG-032 fresh failure
On `0e327f35...`, quality-first reasoning returned a natural 575-char narration. TTS pass 1 measured 33.98s = 34.8% for the 97.57s video, so duration-fit correctly computed a hard 1568–1651-char target. The fit model nevertheless returned 575 chars and was rejected before final TTS.

## Verified root cause
`narrationRepairSchemaForBudget()` had been softened to `minLength: 1` for quality cleanup, but the same schema helper is reused by measured duration-fit. The post-parse hard validator was correct; the structured schema supplied to qwen was not hard-bounded on the lower side.

## BUG-032 correction published and reviewed
Source commit `a0e6165d...` changes only `src/main/p1-vision-ipc.js` relative to failure-intake docs head `13f492d4...`.
- If `budget.min_chars` exists, schema `minLength` equals that measured hard minimum.
- If only `max_chars` is supplied by quality cleanup, schema minimum defaults to 1.
- `maxLength` is clamped to be at least `minLength`.
- Existing post-parse `assertNarrationWithinBudget` remains unchanged.
- Compare: exactly one source file, 4 additions / 2 deletions.
- No P2/P3/STTN/Settings/backend/TTS-engine source change.

## Verification status
- Direct GitHub diff/full-source inspection: PASS for narrow logic/scope.
- PM review `4912221026`: PASS for logic/scope.
- Exact Node syntax on final docs/head: WAITING.
- Exact `git diff --check`: WAITING.
- Fresh Owner runtime on BUG-032 correction: WAITING.

## Gates
- Execution: PASS for BUG-032 source correction.
- Automated/static verification: WAITING.
- Code review: PASS for logic/scope (`4912221026`).
- Owner manual app verification: WAITING fresh retest.
- Documentation synchronization: PASS after this update.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Run exact static checks on the final docs/head, then Owner reruns the same 97.57s case. Required outcome: measured duration-fit schema forces candidate inside its logged hard range before final TTS; candidate passes narration quality; final voice ratio is 95–100%; P1 completes. Do not merge or start Step 3 before fresh Owner PASS is recorded.