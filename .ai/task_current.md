# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Error Detail, and Bounded JSON Retry

## Status
FREEZE_FIX_CODE_REVIEW_PASS_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest source commit: `9d958614dc1ca9d7249418f4fd9415bf84f6d56b`.

## Required outcome
1. Selected/detail state follows actual processing P1 Job.
2. Processing Job is visually unmistakable without excessive animation.
3. One failed P1 Job does not stop later queued Jobs.
4. Clicking a failed Job shows a readable error popup.
5. Owner Stop/Cancel does not auto-resume pending work.
6. Malformed structured JSON is retried exactly once; unrelated/cancel/timeout failures are not retried.
7. Adding/loading a video must not freeze the renderer.

## Freeze regression and correction
Prior UX head froze when Owner loaded a video. The queue MutationObserver observed attributes while feedback synchronization mutated Job-card attributes/classes. Latest source observes only child-list/subtree changes and conditionally writes the Job-id dataset.

## Verification
- Source commit `9d958614...` changes only `src/renderer/js/pipeline1-run-ux.js`.
- Diff is two narrow changes: conditional dataset assignment and removal of attribute observation.
- PM post-regression review PASS: `4902045575`.
- No P2/P3/STTN/Settings/backend source changes.

## Gates
- Execution: PASS.
- Automated/static: PASS for available source/static review.
- Code review: PASS.
- Owner verification: FAIL on prior head; RETEST READY on latest head.
- Documentation sync: PASS after publication/reverification.
- Merge: BLOCKED.
- Step 3: BLOCKED.
