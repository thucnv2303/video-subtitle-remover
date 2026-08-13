# Current Task

## Task ID
PIPELINE1-SEMANTIC-REMIX-007

## Name
Pipeline 1 Optional Semantic Remix — Standard Script Default + Guarded Scene Remix

## Status
STANDARD_QUALITY_RETRY_CORRECTION_PUBLISHED_STATIC_OWNER_RETEST_WAITING

## Authority
- Branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Failed Owner-tested head: `cf31b4891d141084666c81f9324d622a51f70986`.
- Quality-retry correction source commit: `0fb72b4f421891a20b6574564f90886f6a108356`.

## Owner runtime failure
On Standard/default OFF, D-016 duration guard worked: 721-char draft for ~97.57s source triggered pre-TTS evidence-fit against 1529-1610 chars. Both evidence-fit attempts failed quality; final error was `REPEATED_SENTENCE` + `REPEATED_LONG_PHRASE`. TTS did not run.

## Root cause and correction
The prior retry discarded the parsed rejected candidate and restarted from the original short draft. The correction preserves a rejected candidate when available and uses it as the single retry input.

Corrected contract:
1. Standard remains default; Semantic remains opt-in.
2. First Standard duration recompose uses full transcript + Vision evidence.
3. If the parsed candidate fails hard length or quality, preserve that candidate.
4. The one bounded retry edits the rejected candidate; do not restart from the original short draft when a candidate exists.
5. Retry removes repeated sentences, repeated long phrases, near-duplicates and duplicate CTA/conclusion while preferring unused grounded evidence.
6. Hard voice-aware target and deterministic CJK/repetition quality gates remain mandatory.
7. TTS only runs after narration passes; no post-TTS duration retry loop.
8. Semantic BUG-036 behavior is unchanged.

## Gates
- Execution: PASS for source publication.
- Automated/static: WAITING on exact final head.
- Code review: PASS logic/scope, pending static syntax confirmation.
- Owner Standard: FAIL on `cf31b489...`; RETEST WAITING on corrected head.
- Owner Semantic: ON HOLD until Standard PASS.
- Documentation synchronization: IN PROGRESS until final handoff/PR metadata sync.
- P3 semantic cut/reorder: BLOCKED.
- Merge permission: BLOCKED.

## Required next verification
Owner fetches final exact PR head, confirms `git rev-parse HEAD`, then runs `node --check src/main/p1-standard-vision-wrapper.js`. After static PASS, rerun Standard/default OFF. Required log path: `Standard duration guard` -> `Standard duration recompose`; if first candidate fails, log must state retry uses the rejected candidate -> `Standard duration quality retry` -> `Standard duration guard PASS` -> one full-text TTS.
