# Current Task

## Task ID
PIPELINE1-LOG-OBSERVABILITY-009

## Status
RUNTIME_REVISION_3_SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_PARTIAL_OWNER_RETEST_WAITING

## Basis
- Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- Revision-3 starting HEAD: `a7e05b1cd2fe2a4d78b74d7b7b3b59a7c9f08ba7`.
- Revision-3 spec commit: `a0c7d6b0de721ea11fa25aa0ae3c1618c3f939f0`.
- Revision-3 source commit: `de1a5e2cb25c46dffed383eb66cf54ca711af566`.
- Bug: `BUG-039`.

## Owner requirement
- P1 operational logs remain in the P1 console and must not appear in the P2 log panel before or during unrelated P1 processing.
- Routine successful health/TTS/GPU/status access logs must not spam visible P2 console history.
- P2 frame processing must use one live row whose frame/progress values update in place.
- Warnings/errors/stage changes/completion remain visible in their owning pipeline console.

## Application scope
- `src/renderer/js/pipeline1-run-ux.js`: P1 retention/heartbeat cleanup plus revision-3 P1-to-P2 log isolation.
- `src/renderer/js/pipeline2-runtime.js`: unchanged revision-2 routine-access/frame-coalescing behavior.
- `src/renderer/js/app.js`: no net final change.

## Revision-3 implementation
- Added timestamp-aware P1-owned marker matcher for `[P1]`, `[ASR]`, `[AI]`, `[TTS]`, `[Voice]`, `[VoiceSub]`.
- Added observer on `#log-output` that removes only those P1-owned entries after logger execution, preserving the Step 1 clone.
- Existing P1 2000-entry retention and heartbeat cleanup remain unchanged.
- No polling/timer/backend/Prompt Manager/Settings/P3 changes.

## Verification
- Revision-3 source isolation: PASS (`pipeline1-run-ux.js` only, +33/-0).
- PM exact commit diff review: PASS.
- Exact executable Node syntax/diff-check: WAITING.
- Owner runtime revision-3 retest: WAITING.

## Separate follow-up
`BUG-040` Prompt Manager deletion persistence/default-prompt behavior is confirmed but remains a separate task and PR.

## Gates
- Execution: PASS.
- Automated/static: PARTIAL.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL until affected ledgers/checklists are closed after runtime evidence.
- Merge: BLOCKED.