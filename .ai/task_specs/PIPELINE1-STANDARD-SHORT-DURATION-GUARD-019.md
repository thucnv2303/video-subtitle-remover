# PIPELINE1-STANDARD-SHORT-DURATION-GUARD-019

Status: READY_FOR_IMPLEMENTATION

## Basis
- Parent review ref: `review/PIPELINE1-ABSOLUTE-FILE-PATH-018@4af664327155cc646e3a1a96f64d69b951c453b6`.
- Owner runtime: 17.6s Standard Job, Remix OFF, absolute path/preview/ASR/Vision all succeeded. Draft narration 260 chars for hard target 276-290. Standard recompose produced 547 chars; retained-candidate retry produced 481 chars; deterministic length gate correctly rejected and P1 stopped before TTS.

## User outcome
A short Standard Job must not fail merely because the corrective Ollama generation grossly overshoots a narrow narration character budget. Semantic Remix remains OFF and must not be involved.

## Verified root cause
`src/main/p1-standard-vision-wrapper.js::ollamaNarrationRequest()` computes `numPredict` with a hard minimum of 520 tokens for every Standard recompose request. For a short target around 283 characters this output ceiling is disproportionately large. The prompt requests 276-290 chars but the model is allowed hundreds of output tokens, and the current two-attempt retained-candidate retry has demonstrated non-convergence (547 -> 481 chars). The deterministic post-parse length/quality gates are correct and must remain fail-closed.

## MVP fix direction
- Keep Standard and Semantic Remix responsibilities separate.
- Keep deterministic hard min/max, ZERO-CJK and repetition/quality validation unchanged.
- Make short Standard recompose output budget target-aware instead of forcing a 520-token floor.
- Preserve existing long-video scaling behavior and `RECOMPOSE_MAX_PREDICT` ceiling.
- Do not add blind retries, deterministic text truncation, filler, or bypass the hard gate.
- Improve failure wording only if a touched call site can distinguish Standard mode without unrelated renderer churn.

## Scope allowed
- `src/main/p1-standard-vision-wrapper.js` only for application source unless inspection proves one narrowly required adjacent Standard-only log label.
- Task/canonical `.ai/` documentation.

## Forbidden
- No P2/P3/TTS/Voice Render changes.
- No Semantic Remix behavior changes.
- No prompt-manager/default-prompt changes.
- No broad refactor.
- No weakening/bypassing narration length, CJK or repetition gates.
- No merge.

## Acceptance
1. Remix OFF remains Standard throughout the run.
2. Same/equivalent ~17.6s Job reaches Standard recompose when under target.
3. Recompose telemetry shows a target-aware short output limit materially below the old 520-token floor while still leaving enough room for valid JSON+narration.
4. Accepted narration is within the existing hard target and passes existing quality gate.
5. P1 proceeds beyond Standard duration guard to TTS/next normal stage.
6. If the model still cannot satisfy the contract, P1 remains fail-closed with a truthful Standard error; no silent clipping or fake PASS.
7. Long Standard jobs retain existing long-section behavior and output scaling.
8. Path fix from task 018 remains effective.

## Static verification
- `node --check src/main/p1-standard-vision-wrapper.js`.
- `git diff --check 4af664327155cc646e3a1a96f64d69b951c453b6..HEAD`.
- Review full GitHub diff and full relevant function(s).
- Add/run a deterministic calculation check demonstrating that target ~283 chars no longer receives the 520-token floor while long targets remain scaled and bounded.

## Gates
- Execution: AUTHORIZED / NOT YET VERIFIED.
- Automated/static: WAITING.
- Code review: WAITING.
- Owner runtime: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge: BLOCKED.
