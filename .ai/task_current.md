# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Failed-Job Retry/Error Detail, and Bounded JSON Retry

## Status
RUNTIME_WIRING_CODE_REVIEW_PASS_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest source commit: `eb9eaf11e0a2c7b1b66c779dd5e55fc74d902fcf`.

## Required outcome
1. Selected/detail follows the actual processing Job.
2. Processing Job is visually distinct.
3. One failed Job does not stop later queued Jobs.
4. Clicking failed Job opens readable error popup.
5. Failed Job exposes `↻ Chạy lại`.
6. Retry while another Job is processing queues behind it without preemption.
7. Retry while idle starts normally.
8. Stop/Cancel does not revive explicitly stopped work.
9. Malformed structured JSON retry remains bounded to one additional call.
10. Adding/loading video does not freeze renderer.
11. P1 run-UX must be reachable from real boot path and bind actual Job DOM.

## Verified prior defect
Owner tested exact `ffd798405fd39ea84bb05cbfe79b649a581441ab`; popup/retry remained absent because the adapter was not loaded and its status selector did not match generated markup. Prior PM runtime-readiness review is invalidated.

## Current implementation
- preload injects `js/pipeline1-run-ux.js` (`332a3460...`).
- run-UX targets `.tk-job-card-header > div > span` and decorates it as `.p1-job-state` (`eb9eaf11...`).
- existing popup/retry/queue/freeze/bounded-retry behavior is preserved.

## Verification
- Owner-tested `ffd7984...` → source `eb9eaf11...`: only preload + run-UX JS changed.
- Boot-path and real-DOM selector review PASS.
- PM code review PASS `4902725025`.
- No GitHub CI/status checks configured.

## Gates
Execution PASS; automated/static PARTIAL (source/diff PASS, no CI); code review PASS; Owner FAIL on prior head / RETEST READY; documentation sync PASS; merge BLOCKED; Step 3 BLOCKED.
