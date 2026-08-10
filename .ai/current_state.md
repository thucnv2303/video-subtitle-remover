# Current State

## Status
PIPELINE1-MULTIJOB-RESILIENCE-003 — SOURCE PUBLISHED / PM REVIEW IN PROGRESS

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Current source head before docs sync: `608d005cda92395c207fcc482d5cb9d82dde5d69`.
- Changed application source: `src/renderer/js/pipeline1-run-ux.js` only.

## Owner runtime failure intake — 2026-08-10
- Multi-job P1 did not reliably follow the Job currently being processed in selection/detail UI.
- When one P1 Job failed, the remaining queued Job stayed waiting and the batch appeared stuck.
- Owner log proved Ollama vision and reasoning completed, then structured JSON parsing failed with `Expected ',' or ']' after array element in JSON ...`.

## Published source behavior
- Running P1 Job is synchronized into `pipeline1SelectedJobId` and `activeJobId`.
- If no P1 Job is active/processing and a non-cancelled queued P1 Job remains, the runtime adapter restarts the next Job through the existing queue handler.
- Explicit Stop clears/cancels queued work and cancels any pending recovery timer.
- Malformed structured JSON is retried at most once through the existing `analyzeP1Vision` bridge.
- Cancel/timeouts/unrelated errors are excluded from malformed-JSON retry classification.
- If the second malformed JSON attempt also fails, the current Job can fail while queue recovery remains available for the next Job.
- No raw AI response payload is logged.

## Verification evidence
- Published source blob: `0b595be5722644d1e83e82346c4409a54349afb7`.
- Exact local reconstruction hash: `0b595be5722644d1e83e82346c4409a54349afb7` — MATCH.
- `node --check`: PASS.
- Deterministic simulation: multi-job failure isolation PASS.
- Deterministic simulation: running-job selection PASS.
- Deterministic simulation: malformed JSON retry exactly once PASS.
- Deterministic classification: cancellation/timeout are not malformed-JSON retry candidates — PASS.
- Local staged diff hygiene check for the changed source: PASS.

## Prior P2 state preserved
P2 single-job runtime PASS remains valid. P2 multi-job coverage was not completed because Owner testing exposed this P1 blocker first. No P2/P3 source was changed by this task.

## Gates
- Execution: PASS for source publication.
- Automated/static verification: PASS for current source adapter evidence.
- Code review: IN PROGRESS.
- Owner manual verification: NOT STARTED for this revision.
- Documentation synchronization: IN PROGRESS until docs commit is published and reverified.
- Merge permission: BLOCKED.

## Next permitted action
Publish canonical docs, open/update Draft PR, review exact GitHub diff/full source, then authorize Owner two-job P1 retest only if code review PASS.
