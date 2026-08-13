# Current State

## Status
PIPELINE1-SEMANTIC-REMIX-007 — STANDARD QUALITY-RETRY CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Active Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Failed Owner-tested head: `cf31b4891d141084666c81f9324d622a51f70986`.
- Quality-retry source commit: `0fb72b4f421891a20b6574564f90886f6a108356`.

## Fresh Owner runtime evidence
Standard/default OFF on `cf31b489...` reached D-016 correctly: ~97.57s source, 1529-1610 char budget, 721-char first draft, pre-TTS recompose triggered. Both evidence-fit attempts failed quality; final error was `REPEATED_SENTENCE` + `REPEATED_LONG_PHRASE`. TTS was not reached.

## Verified root cause
The prior evidence-fit retry discarded a parsed rejected expanded candidate and restarted from the original short draft. This lost useful grounded expansion. The deterministic quality gate itself behaved correctly and remains strict.

## Published correction
`src/main/p1-standard-vision-wrapper.js` now keeps Standard pre-TTS retry state explicitly:
- first attempt expands the short draft using full transcript + accumulated Vision evidence;
- a parsed candidate rejected for hard length or narration quality is retained;
- the single retry edits that rejected candidate rather than restarting from the original short draft;
- retry removes repeated sentences/long phrases/near-duplicates/duplicate CTA and prefers unused grounded evidence;
- hard 95-100% voice-aware character range and deterministic CJK/repetition checks remain mandatory;
- TTS stays blocked until narration passes;
- no post-TTS duration loop is added;
- Semantic/P2/P3/TTS-engine behavior is unchanged.

## Verification evidence
- GitHub compare `cf31b489... -> 0fb72b4f...` changes exactly one application file: `src/main/p1-standard-vision-wrapper.js`.
- PM reviewed the published full file/diff from GitHub: logic/scope PASS.
- PM container cannot resolve GitHub raw hosts, so exact new-head `node --check` could not be executed there.
- BUG-037 and `qa_checklist.md` are synchronized to the fresh Owner failure and the new correction.

## Gates
- Execution: PASS for source publication.
- Automated/static: WAITING on exact final head.
- Code review: PASS logic/scope, subject to static syntax confirmation.
- Owner Standard runtime: FAIL on old head; corrected retest WAITING after static PASS.
- Owner Semantic runtime: ON HOLD until Standard PASS.
- Documentation synchronization: PASS.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED.

## Next permitted action
Owner fetches the final PR head, confirms `git rev-parse HEAD`, runs `node --check src/main/p1-standard-vision-wrapper.js` and `git diff --check cf31b4891d141084666c81f9324d622a51f70986..HEAD`. If static PASS, rerun Standard/default OFF. If first recompose is rejected, log must show retry editing the rejected candidate before `Standard duration guard PASS` and the single full-text TTS request.
