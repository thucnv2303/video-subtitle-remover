# Current State

## Status
PIPELINE1-LOG-OBSERVABILITY-009 — RUNTIME REVISION 3 SOURCE PUBLISHED / PM REVIEW PASS / STATIC PARTIAL / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Active branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- Revision-3 starting HEAD: `a7e05b1cd2fe2a4d78b74d7b7b3b59a7c9f08ba7`.
- Revision-3 spec commit: `a0c7d6b0de721ea11fa25aa0ae3c1618c3f939f0`.
- Revision-3 source commit: `de1a5e2cb25c46dffed383eb66cf54ca711af566`.
- Active bug: `BUG-039`.

## Owner runtime evidence
Owner reports that Pipeline 1 log information appears in the Pipeline 2 log panel even though P2 has not run. Direct source review confirmed `app.js::addLog()` writes every log to `#log-output` (Step 2) and then clones it into `#step1-log-output` (Step 1).

A separate Owner finding confirms Prompt Manager deletion persistence is defective. That remains `BUG-040` and is not part of PR #52.

## Revision-3 source state
- `src/renderer/js/pipeline1-run-ux.js` now installs a narrow observer on `#log-output`.
- Entries explicitly marked `[P1]`, `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, or `[VoiceSub]` are removed from the Step 2/global log after normal logger execution, while their synchronous Step 1 clone remains.
- Existing P1 retention 2000 and heartbeat cleanup remain unchanged.
- Existing P2 routine-access cleanup and one-line frame coalescing remain unchanged.
- `src/renderer/js/app.js` remains net-unchanged.
- No backend, timer, polling, Prompt Manager, Settings, AI/TTS processing, or P3 changes.

## Verification
- Revision-3 source isolation: PASS — exactly `pipeline1-run-ux.js`, +33/-0.
- Exact GitHub commit diff review: PASS — narrow marker matcher + observer only.
- PM logic/scope review: PASS.
- Exact `node --check` / `git diff --check`: WAITING executable checkout.
- Owner runtime revision-3 retest: WAITING.

## Inherited state
- Revision 2 P2 access-noise/frame coalescing remains present.
- Task 008 Standard functional runtime remains PASS for the corrected configured prompt.
- `BUG-040` Prompt Manager/default-prompt persistence remains separate.

## Gates
- Execution: PASS — revision-3 source published.
- Automated/static: PARTIAL.
- Code review: PASS for revision-3 exact source diff.
- Owner manual app verification: WAITING on latest HEAD.
- Documentation synchronization: PARTIAL until bug ledger/QA closeout are updated after runtime result.
- Merge permission: BLOCKED.

## Next permitted action
Run exact static checks on latest PR #52 HEAD, then Owner retests P1/P2 log isolation and existing revision-2 behavior. Do not merge.