# Current State

## Status
PIPELINE1-SEMANTIC-REMIX-007 — STANDARD QUALITY-RETRY CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Active Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Failed Owner-tested head: `cf31b4891d141084666c81f9324d622a51f70986`.
- Quality-retry correction source commit: `0fb72b4f421891a20b6574564f90886f6a108356`.

## Fresh Owner runtime evidence
Standard/default OFF on `cf31b489...` reached the D-016 duration guard correctly for a ~97.57s source. First narration was 721 chars against a 1529-1610 char budget. Evidence-fit ran before TTS, but the first fit candidate failed quality and the retry also failed with `REPEATED_SENTENCE` and `REPEATED_LONG_PHRASE`. TTS was never reached.

## Verified root cause
The previous evidence-fit loop discarded a parsed rejected candidate and rebuilt retry input from the original short narration. That lost useful grounded expansion and encouraged another padded/repetitive rewrite. The deterministic quality gate itself is correct and remains strict.

## Published correction
`src/main/p1-standard-vision-wrapper.js` now owns the bounded Standard pre-TTS recompose retry so it can preserve the rejected candidate explicitly.

Required behavior:
- first attempt expands the short draft using full transcript + Vision evidence;
- if a parsed candidate fails hard length or narration quality, that rejected candidate becomes the retry input;
- retry edits the rejected candidate instead of restarting from the original short draft;
- retry is instructed to remove repeated sentences, repeated long phrases, near-duplicate phrasing and duplicate CTA/conclusion while using unused grounded evidence;
- hard 95-100% voice-aware character range remains mandatory for this Standard pre-TTS guard;
- existing CJK/repetition quality checks remain mandatory;
- TTS remains blocked until narration passes; no post-TTS duration loop is introduced;
- Semantic mode is unchanged.

## Verification evidence
- GitHub compare `cf31b489... -> 0fb72b4f...` changes exactly one application file: `src/main/p1-standard-vision-wrapper.js`.
- PM inspected the published commit diff and full file from GitHub.
- PM container cannot resolve `raw.githubusercontent.com`, so exact new-head `node --check` is still WAITING and must be run in the Owner checkout before runtime retest.
- No P2/P3/TTS-engine/dependency change.

## Gates
- Execution: PASS for source publication.
- Automated/static: WAITING on exact new head.
- Code review: PASS logic/scope for the one-file correction, subject to static syntax confirmation.
- Owner Standard runtime: FAIL on `cf31b489...`; RETEST WAITING on new head after static PASS.
- Owner Semantic runtime: ON HOLD until Standard PASS.
- Documentation synchronization: IN PROGRESS until task_current/handoff/PR body point to final docs head.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED.

## Next permitted action
Finish canonical/PR synchronization, then Owner fetches the final head and runs `node --check src/main/p1-standard-vision-wrapper.js`. If static PASS, rerun Standard/default OFF. Expected correction evidence: first `Standard duration recompose` candidate may be rejected, then `Standard duration quality retry` must report that it is editing the rejected candidate rather than the original short draft, followed by `Standard duration guard PASS` and one full-text TTS.
