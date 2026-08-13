# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Status
STANDARD_QUALITY_RETRY_CORRECTION_PUBLISHED_STATIC_OWNER_RETEST_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`
- Draft PR: #48
- Base: `9981da334ca10fd845c971241d541894d736c13b`
- Failed Owner-tested head: `cf31b4891d141084666c81f9324d622a51f70986`
- Quality-retry source commit: `0fb72b4f421891a20b6574564f90886f6a108356`

## Runtime evidence
Owner Standard run reached the duration guard before TTS. Source was about 97.57s, first narration 721 chars, target 1529-1610 chars. Both recompose attempts failed quality. Final issues were `REPEATED_SENTENCE` and `REPEATED_LONG_PHRASE`. TTS did not run.

## Corrected behavior
- Keep the first grounded recompose based on full transcript and Vision evidence.
- If a parsed candidate fails hard length or quality, preserve that candidate.
- The single retry edits the rejected candidate instead of restarting from the original short draft.
- Hard length and deterministic quality gates remain required.
- TTS remains blocked until narration passes.
- Semantic, P2, P3 and TTS engine are unchanged.

## Verification
- Source publication: PASS.
- GitHub compare from the failed head to the source correction changes only `src/main/p1-standard-vision-wrapper.js`.
- PM source review: PASS logic/scope.
- Exact-head syntax: WAITING.
- Owner corrected runtime: WAITING after static PASS.
- Owner Semantic: ON HOLD.
- Documentation synchronization: PASS.
- Merge: BLOCKED.

## Next verification
Fetch the final PR head. Run `node --check src/main/p1-standard-vision-wrapper.js` and `git diff --check cf31b4891d141084666c81f9324d622a51f70986..HEAD`. If both pass, rerun Standard/default OFF and verify that a rejected first candidate is retained for the one quality retry before TTS.
