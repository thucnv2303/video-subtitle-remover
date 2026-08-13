# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Status
STANDARD_PRE_TTS_ORDERING_FIX_PUBLISHED_STATIC_OWNER_RETEST_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`
- Draft PR: #48
- Base: `9981da334ca10fd845c971241d541894d736c13b`
- Prior docs head: `f03ab512b25fb0193b17b3468d5ac865d3c0c2d1`
- Latest source correction: `c8fecb95164c39fe82cddf24711ccfc3386d23c6`

## Latest Owner failure
For the ~97.57s Standard regression case, global reasoning completed but draft quality found `CJK_CHARACTERS`. Standalone `Narration quality` repair failed the same gate, so P1 stopped before the grounded Standard duration/pre-TTS recompose and before TTS.

## Root cause
The Standard IPC quality repair ran too early. An underfilled draft could be rejected before the wrapper received the analysis, despite D-016 requiring grounded recomposition from full transcript + Vision evidence before TTS.

## Corrected behavior
- Under-min Standard drafts no longer run the standalone quality repair first.
- The draft plus deterministic quality report is returned to the wrapper.
- The wrapper's evidence-backed pre-TTS recompose remains responsible for bringing the underfilled narration into hard range and passing CJK/repetition quality gates.
- Prompt wording no longer claims a later TTS duration-fit will solve underfill.
- Non-underfilled Standard behavior, Semantic, P2, P3 and TTS engine are unchanged.

## Verification
- Source publication: PASS.
- Compare `f03ab512... -> c8fecb95...`: one app file, `src/main/p1-standard-vision-ipc.js`, +26/-9.
- Exact-head syntax/diff: WAITING.
- Code review final confirmation: WAITING.
- Owner Standard corrected runtime: WAITING after static PASS.
- Owner Semantic: ON HOLD.
- Documentation synchronization: IN PROGRESS until all canonical docs/PR metadata are aligned.
- Merge: BLOCKED.

## Next verification
Finish docs sync, then run exact-head `node --check` for Standard IPC + wrapper and `git diff --check f03ab512b25fb0193b17b3468d5ac865d3c0c2d1..HEAD`. If clean, Owner reruns Standard/default OFF. Expected: underfilled+CJK draft is deferred to grounded pre-TTS recompose, then hard duration + quality PASS occurs before one TTS request.
