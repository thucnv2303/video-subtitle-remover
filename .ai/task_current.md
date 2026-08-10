# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job UI Sync, and Bounded JSON Retry

## Status
SOURCE_PUBLISHED_PM_REVIEW_IN_PROGRESS

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Current source head before docs sync: `608d005cda92395c207fcc482d5cb9d82dde5d69`.
- Source file: `src/renderer/js/pipeline1-run-ux.js` only.

## Required outcome
1. UI selection/detail follows the P1 Job actually processing.
2. One P1 Job failure does not stop later queued P1 Jobs.
3. Owner Stop/Cancel does not auto-resume queued Jobs.
4. Malformed structured JSON is retried exactly once.
5. Cancellation, timeout and unrelated errors are not retried by the malformed-JSON policy.
6. A second malformed JSON failure marks only the current Job failed; queue can continue.

## Verification
PASS so far:
- exact published blob hash match `0b595be5722644d1e83e82346c4409a54349afb7`;
- `node --check`;
- multi-job continuation simulation;
- running-job selection simulation;
- JSON retry-once simulation;
- cancel/timeout no-retry classification;
- changed-source diff hygiene.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: IN PROGRESS.
- Owner verification: NOT STARTED.
- Documentation sync: IN PROGRESS.
- Merge: BLOCKED.

## Merge rule
No Step 3 progression or merge approval until this P1 blocker is reviewed and Owner verifies the two-job runtime path.
