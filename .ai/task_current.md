# Current Task

## Task ID
PIPELINE1-LOG-OBSERVABILITY-009

## Status
SOURCE_PUBLISHED_CODE_REVIEW_PASS_STATIC_PARTIAL_OWNER_RETEST_WAITING

## Basis
- Base branch: `review/PIPELINE1-STANDARD-CJK-GUARD-008`.
- Exact base SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Review branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- PM source commit: `ba24b24011669c24565ad8b3a685b45fb046996f`.
- Bug: `BUG-039`.

## Final application scope
- `src/renderer/js/pipeline1-run-ux.js` only, +40/-1 in the source commit.
- `src/renderer/js/app.js` has no net final change; the rejected CRLF-churn attempt was neutralized without force push/history rewrite.

## Implemented behavior
- P1 console retention bound: 2000 `.log-entry` elements.
- Legacy 100-line removal is guarded only on `#step1-log-output`.
- A P1-only MutationObserver removes routine Python/Uvicorn successful `GET` access entries for `/api/health`, `/api/tts/status`, `/api/gpu-info` ending in `200 OK`.
- Global log and background polling are unchanged.
- Non-200/errors, normal P1 logs, Copy and Clear remain intact by design.

## Verification
- GitHub scope/diff review: PASS.
- Deterministic filter/retention checks: PASS.
- PM code review: PASS.
- `node --check src/renderer/js/pipeline1-run-ux.js`: WAITING exact executable checkout.
- `git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD`: WAITING exact executable checkout.
- Owner runtime: NOT STARTED.

## Gates
- Execution: PASS.
- Automated/static: PARTIAL.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PASS after dynamic-doc sync.
- Merge: BLOCKED.

## Next verification
Run the two exact static commands on PR #52 HEAD. If PASS, restart app and confirm idle P1 console stays free of routine heartbeat 200 lines, global status still updates, a Standard run keeps meaningful history beyond 100 entries, and Copy/Clear work.