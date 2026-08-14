# Current State

## Status
PIPELINE1-LOG-OBSERVABILITY-009 — RUNTIME REVISION 2 SOURCE PUBLISHED / PM REVIEW PASS / STATIC PARTIAL / OWNER RETEST WAITING / MERGE BLOCKED

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Parent: `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- Active branch / Draft PR: `review/PIPELINE1-LOG-OBSERVABILITY-009` / #52.
- Runtime-revision starting HEAD: `3ab395128d841626d689182853beea8c10c58aa1`.
- Runtime-revision spec commit: `19a5b4ca530a7567a5bd64b90ddb0228fd9399dd`.
- Runtime-revision source commit: `c4d9911c8cb6cf99fdbeb3ca9cf561d2269d14c7`.
- Active bug: `BUG-039`.

## Owner runtime evidence
Owner observed that successful `/api/health`, `/api/tts/status`, `/api/gpu-info` access logs still appeared repeatedly in the visible log after the first correction. Owner also requires frame-processing progress to use one updating line rather than append many frame lines.

This invalidated the prior runtime-closeout assumption and authorized revision 2.

## Source state
Application changes for BUG-039 are now limited to renderer UX files:
- `src/renderer/js/pipeline1-run-ux.js`: P1 heartbeat cleanup + retention 2000.
- `src/renderer/js/pipeline2-runtime.js`: runtime revision 2, source commit changes only this file (+7/-4).
- `src/renderer/js/app.js`: no net final change.

Revision 2 changes only presentation:
- routine successful access logs are inspected/removed even while no P2 job is active;
- `/api/tts/status` is included in routine-success suppression;
- P2 existing single live progress row remains authoritative;
- additional clear `processing/xử lý ... frame N/TOTAL` forms update that row and raw progress rows are removed;
- non-200, warnings, errors and unrelated logs remain durable;
- polling frequency/backend processing is unchanged.

## Verification
- GitHub revision source isolation: PASS — `c4d9911c...` changes only `pipeline2-runtime.js`, +7/-4.
- GitHub patch review: PASS — no timer/polling/backend/manual-region changes.
- PM logic/scope review: PASS.
- Exact `node --check` / `git diff --check`: WAITING executable checkout.
- Owner runtime revision-2 retest: WAITING.

## Inherited Standard state
Task 008 Standard functional runtime remains PASS for the corrected configured prompt. `BUG-040` stale product-default prompt remains a separate follow-up.

## Gates
- Execution: PASS — revision-2 source published.
- Automated/static: PARTIAL.
- Code review: PASS for exact revision patch.
- Owner manual app verification: WAITING on new HEAD.
- Documentation synchronization: PARTIAL until bug ledger/QA closeout are updated.
- Merge permission: BLOCKED.

## Next permitted action
Owner/test checkout must move to current PR #52 HEAD, restart the app, verify idle log cleanliness and one-line P2 frame progress, while confirming status polling and warning/error visibility remain intact. Do not merge.