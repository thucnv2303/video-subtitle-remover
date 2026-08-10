# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Error Detail, and Bounded JSON Retry

## Status
UX_REVISION_CODE_REVIEW_PASS_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest source commit: `0e53a6ade8a67a061db214f6050f60ded6e0944d`.

## Required outcome
1. Selected/detail state follows actual processing P1 Job.
2. Processing Job is visually unmistakable without excessive animation.
3. One failed P1 Job does not stop later queued Jobs.
4. Clicking a failed Job shows a readable error popup.
5. Owner Stop/Cancel does not auto-resume pending work.
6. Malformed structured JSON is retried exactly once; unrelated/cancel/timeout failures are not retried.

## Allowed source
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- `src/renderer/styles/pipeline1-run-ux.css`

## Current implementation
- run-UX adapter synchronizes selected/detail state and recovers a stalled queue after a failed Job.
- Processing card uses blue pulse/glow plus a spinner in the state badge; reduced-motion disables animation.
- Failed card uses persistent red styling.
- Standardized final P1 error log is captured onto the active Job before `_finishP1Job` clears the active pointer.
- Failed-card click opens a modal with safe text-only Job/error/timestamp content.
- P1 orchestration retains one bounded malformed-JSON retry.

## Verification
- exact published run-UX blob `504d6b89d8f806169d060ab7507832b43c28c5af` matches local reconstruction;
- `node --check` for exact run-UX JS PASS;
- GitHub incremental source diff reviewed and limited to run-UX JS/CSS;
- no P2/P3/STTN/Settings/backend source change;
- no GitHub CI/status checks configured.

## Gates
- Execution: PASS.
- Automated/static: PASS for available static checks.
- Code review: PASS.
- Owner verification: PARTIAL — resume two-job retest on latest head.
- Documentation sync: PASS after publication/reverification.
- Merge: BLOCKED.
- Step 3: BLOCKED.
