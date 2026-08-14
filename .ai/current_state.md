# Current State

## Status
PIPELINE1-LOG-OBSERVABILITY-009 — SOURCE PUBLISHED / PM CODE REVIEW PASS / STATIC PARTIAL / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent branch/PR: `review/PIPELINE1-STANDARD-CJK-GUARD-008` / #51.
- Exact parent SHA: `330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Active branch/PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- Active bug: `BUG-039`.
- PM source commit: `ba24b24011669c24565ad8b3a685b45fb046996f`.

## Source correction
Final application diff is limited to `src/renderer/js/pipeline1-run-ux.js` (+40/-1). The earlier direct contents-API attempt on CRLF `app.js` created line-ending churn; PM rejected it and neutralized it with a non-force corrective commit. Final compare from the parent SHA contains no `app.js` change.

The P1 run-UX layer now:
- keeps the legacy Step1 logger from evicting oldest log entries at the old 100-line threshold;
- bounds retained P1 `.log-entry` history at 2000;
- removes only displayed Python/Uvicorn successful `GET` access lines for exact `/api/health`, `/api/tts/status`, `/api/gpu-info` endpoints ending `200 OK`;
- preserves global log, backend polling, non-200/errors, P1 processing logs, Copy and Clear.

## Verification
- GitHub source-scope compare: PASS — source commit changes only `pipeline1-run-ux.js`, +40/-1.
- Parent-to-head application scope: PASS — no net `app.js` change; only `pipeline1-run-ux.js` application source changes.
- Deterministic heartbeat filter cases: PASS for all 3 exact 200 endpoints; PASS retaining non-200, unrelated endpoint and normal P1 log; bound=2000.
- PM code review: PASS.
- Exact remote-file `node --check`: WAITING — ChatGPT container cannot obtain connector-only repo bytes for direct execution.
- Exact `git diff --check`: WAITING for an executable checkout; GitHub patch inspection shows no broad whitespace churn.

## Inherited Standard result
Task 008 Owner Standard functional runtime remains PASS for the corrected configured prompt. `BUG-040` stale product default prompt remains a separate follow-up and is not modified in PR #52.

## Gates
- Execution: PASS — source published.
- Automated/static: PARTIAL — deterministic verification PASS; exact Node/diff commands WAITING.
- Code review: PASS.
- Owner manual app verification: WAITING until exact static commands PASS.
- Documentation synchronization: PASS for published-source state after dynamic-doc update.
- Merge permission: BLOCKED.

## Next permitted action
On an exact checkout of PR #52 head, run `node --check src/renderer/js/pipeline1-run-ux.js` and `git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD`. If both PASS, Owner may restart the app and verify idle heartbeat suppression, status refresh, >100 meaningful P1 log retention, Copy and Clear. Do not merge.