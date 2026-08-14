# Current Task

## Task ID
PIPELINE1-LOG-OBSERVABILITY-009

## Status
RUNTIME_REVISION_2_SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_PARTIAL_OWNER_RETEST_WAITING

## Basis
- Base: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- Runtime failure observed on prior HEAD: `3ab395128d841626d689182853beea8c10c58aa1`.
- Revision-2 spec commit: `19a5b4ca530a7567a5bd64b90ddb0228fd9399dd`.
- Revision-2 source commit: `c4d9911c8cb6cf99fdbeb3ca9cf561d2269d14c7`.
- Bug: `BUG-039`.

## Owner requirement
- Routine successful health/TTS/GPU/status access logs must not spam visible console history.
- P2 frame processing must use one live row whose frame/progress values update in place.
- Warnings/errors/stage changes/completion remain visible as durable lines.

## Application scope
- `src/renderer/js/pipeline1-run-ux.js`: existing P1 cleanup/retention correction.
- `src/renderer/js/pipeline2-runtime.js`: revision-2 log-noise/frame-coalescing correction.
- `src/renderer/js/app.js`: no net final change.

## Revision-2 implementation
- Global log noise filter now runs even with no active P2 job.
- `/api/tts/status` successful polling is included in routine-access suppression.
- Existing P2 `liveRow` remains the single frame/progress line.
- Added narrow support for `processing/xử lý ... frame N/TOTAL` heartbeat formats.
- Non-200/errors/unrelated logs remain visible.
- Polling/timers/backend behavior unchanged.

## Verification
- Revision source isolation: PASS (`pipeline2-runtime.js` only, +7/-4).
- PM patch review: PASS.
- Exact executable Node syntax/diff-check: WAITING.
- Owner runtime revision-2 retest: WAITING.

## Gates
- Execution: PASS.
- Automated/static: PARTIAL.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PARTIAL until all affected ledgers/checklists are synchronized.
- Merge: BLOCKED.