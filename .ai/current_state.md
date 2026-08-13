# Current State

## Status
PIPELINE1-SEMANTIC-REMIX-007 — STANDARD DURATION CORRECTION PUBLISHED / STATIC + OWNER RETEST WAITING

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Active review branch: `review/PIPELINE1-SEMANTIC-REMIX-007`.
- Active Draft PR: #48.
- Base: `review/PIPELINE1-CONTINUOUS-NARRATION-006@9981da334ca10fd845c971241d541894d736c13b`.
- Prior stable docs/application head before latest correction: `7eaa0d58b82eb93b23a29d79bc784b085f351aea`.
- Standard duration correction source commit: `41a4a429bfe7dfe17fbd2113f4019733656359ce`.
- Decision sync commit: `57b0b6819e482d727487fd0d7460043c618b8a4b`.

## Owner runtime finding
On Standard/default mode the app completed successfully but produced only ~35.82s voice for a ~97.57s source (~36.7%) even though the existing Standard narration budget was 1529-1610 chars. First-pass AI narration was only ~612 chars. P1 then accepted that narration and opened P2.

## Verified root cause
The isolated Standard reasoning implementation computed a voice-aware near-source narration budget, but the final draft validator allowed any non-empty narration below the max. Therefore a severely short narration could bypass duration intent and reach TTS.

## Owner product decision
A short source transcript is not a reason for a short Standard narration. P1 has full transcript + Vision evidence + source duration + selected voice/speed characteristics and must use them to compose enough grounded narration before TTS.

Current required Standard behavior:
- first pass remains grounded multimodal reasoning;
- if narration is below the existing 95-100% voice-aware character budget, run one evidence-backed AI recompose before TTS;
- recompose uses full transcript + accumulated Vision evidence + source duration + selected voice/speed-derived speaking rate;
- filler/repetition/unsupported claims remain forbidden and fail closed;
- TTS starts only after the pre-TTS narration duration/quality guard passes;
- no second TTS pass is introduced by this correction.

## Source publication / review
- Compare `7eaa0d58... -> 41a4a429...` changes exactly one application file: `src/main/p1-standard-vision-wrapper.js` (+154/-7).
- PM re-read the full exact-head wrapper after publication.
- Logic/scope review: PASS for the bounded correction only; not release PASS.
- PR #48 remains open/Draft. Latest GitHub recomputation currently reports `mergeable:false`; must be rechecked/resolved before any merge.

## Gates
- Execution: PASS for source publication.
- Automated/static verification: WAITING on exact corrected application head.
- Code review: PASS logic/scope for the one-file correction.
- Owner Standard runtime: WAITING fresh retest.
- Owner Semantic runtime: ON HOLD until Standard passes.
- Documentation synchronization: IN PROGRESS until task_current/handoff/PR body match latest docs head.
- Merge permission: BLOCKED.
- P3 semantic cut/reorder: BLOCKED.

## Next permitted action
Finish canonical documentation/PR metadata synchronization, then run exact-head static checks including `node --check src/main/p1-standard-vision-wrapper.js` and `git diff --check`. Only after static PASS may Owner rerun Standard/default mode. Expected evidence: a short first draft triggers `Standard duration guard`, one evidence-backed recompose occurs before TTS, narration reaches the hard target range without filler/unsupported claims, and measured voice is close to the source duration.
