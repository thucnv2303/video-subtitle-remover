# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Failed-Job Retry/Error Detail, and Bounded JSON Retry

## Status
RUNTIME_WIRING_FIX_FINAL_REVIEW_PENDING

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest source commit: `eb9eaf11e0a2c7b1b66c779dd5e55fc74d902fcf`.

## Required outcome
1. Selected/detail state follows actual processing P1 Job.
2. Processing Job is visually unmistakable.
3. One failed P1 Job does not stop later queued Jobs.
4. Clicking failed Job opens readable error popup.
5. Failed Job exposes `↻ Chạy lại`.
6. Retrying while another Job is processing queues the failed Job behind the active Job.
7. Retrying while idle starts normally.
8. Owner Stop/Cancel does not auto-resume explicitly stopped work.
9. Malformed structured JSON retry remains bounded to one additional analysis call.
10. Adding/loading video does not freeze renderer.
11. P1 run-UX code must actually be loaded by the app and bind to real DOM selectors.

## Verified defect in prior revision
- Owner tested exact `ffd798405fd39ea84bb05cbfe79b649a581441ab` and popup/retry remained absent.
- `pipeline1-run-ux.js` was not reachable from the boot path.
- `.p1-job-state` did not exist in generated Job markup.

## Current implementation
- preload injects `js/pipeline1-run-ux.js` at DOMContentLoaded (`332a3460...`).
- run-UX binds feedback to `.tk-job-card-header > div > span`, then decorates it as `.p1-job-state` (`eb9eaf11...`).
- Prior popup/retry/queue/freeze/bounded-retry behavior remains present.

## Gates
Execution PASS; automated/static WAITING final verification; code review WAITING; Owner verification FAIL on prior head / RETEST BLOCKED; docs sync PASS for current intake; merge BLOCKED; Step 3 BLOCKED.
