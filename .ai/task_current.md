# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Error Detail, and Bounded JSON Retry

## Status
FREEZE_REGRESSION_FIX_PUBLISHED_REVIEW_PENDING

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
7. Loading/adding a video must not freeze the renderer.

## Freeze regression
Owner observed app freeze immediately after loading a video on the prior UX head. Root cause is the queue MutationObserver observing attributes while the feedback synchronizer also mutates Job-card dataset/classes. Latest source removes attribute observation and makes Job-id dataset writes conditional.

## Gates
- Execution: PASS.
- Automated/static: PASS for current source inspection; runtime still required.
- Code review: WAITING final post-fix review.
- Owner verification: FAIL on prior head; RETEST REQUIRED.
- Documentation sync: PASS for incident intake.
- Merge: BLOCKED.
- Step 3: BLOCKED.
