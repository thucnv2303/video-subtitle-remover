# Current State

## Status
PIPELINE1-SEMANTIC-REMIX-007 — STANDARD PRE-TTS ORDERING FIX PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Active Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Prior final docs head: `f03ab512b25fb0193b17b3468d5ac865d3c0c2d1`.
- Latest Standard pre-TTS ordering source correction: `c8fecb95164c39fe82cddf24711ccfc3386d23c6`.

## Latest Owner runtime evidence
Standard/default OFF on the prior flow used a ~97.57s source with a 1529-1610 char voice-aware target. Global reasoning completed, then the draft quality gate found `CJK_CHARACTERS` and its standalone one-shot quality repair also failed `CJK_CHARACTERS`. Pipeline 1 failed before `Standard duration guard`/grounded recompose and before TTS.

## Verified root cause
`p1-standard-vision-ipc.js` performed standalone narration quality repair before returning the Standard analysis to `p1-standard-vision-wrapper.js`. For an underfilled draft, that repair had no full transcript/Vision recomposition responsibility and could fail before the wrapper's grounded duration guard had any chance to run. The old prompt also still described the narration range as soft and referenced later duration-fit behavior, conflicting with D-016 Standard policy.

## Published correction
Source commit `c8fecb95164c39fe82cddf24711ccfc3386d23c6` changes only `src/main/p1-standard-vision-ipc.js` from `f03ab512...` (+26/-9):
- global reasoning prompt now states that an under-min Standard draft will be recomposed by the Standard pre-TTS guard using full transcript + Vision evidence;
- the obsolete implication that a later TTS duration-fit will solve underfill is removed;
- when the draft is below `budget.min_chars`, standalone quality repair is deferred instead of being allowed to fail the job first;
- the raw deterministic draft quality report is returned to the wrapper;
- non-underfilled behavior remains unchanged;
- Semantic/P2/P3/TTS engine are unchanged.

## Verification evidence
- GitHub compare `f03ab512... -> c8fecb95...`: exactly one application file changed, `src/main/p1-standard-vision-ipc.js`, 35 changed lines.
- GitHub source inspection confirms the new under-min deferral path and updated prompt are published.
- Exact-head Node syntax and diff checks have not yet been executed; GitHub CI is not configured.

## Gates
- Execution: PASS for source publication.
- Automated/static: WAITING on exact final head.
- Code review: WAITING final exact-head review/static confirmation.
- Owner Standard runtime: FAIL on prior flow; RETEST WAITING on corrected head after static PASS.
- Owner Semantic runtime: ON HOLD until Standard PASS.
- Documentation synchronization: IN PROGRESS until all dynamic/bug/QA docs and PR body reach the same final head.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED.

## Next permitted action
Finish canonical synchronization and exact-head review. Then Owner checks out the final PR head, runs `node --check src/main/p1-standard-vision-ipc.js`, `node --check src/main/p1-standard-vision-wrapper.js`, and `git diff --check f03ab512b25fb0193b17b3468d5ac865d3c0c2d1..HEAD`. If static PASS, rerun Standard/default OFF. The underfilled+CJK case must now reach the grounded Standard pre-TTS recompose path rather than fail in standalone `Narration quality` before the wrapper.
