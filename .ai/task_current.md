# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job UI Sync, and Bounded JSON Retry

## Status
CODE_REVIEW_PASS_OWNER_TWO_JOB_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Final source commit: `100e343427264e128acd8cadc67f279faf450e56`.
- PM-reviewed PR head before final gate-sync docs commit: `0435d4146c7d148552f68884aecdf3203cf3ac67`.
- Source files: `src/renderer/js/pipeline1-run-ux.js`, `src/renderer/js/pipelines/pipeline1-ai.js`.

## Required outcome
1. Selected/detail state follows actual processing P1 Job.
2. One failed P1 Job does not stop later queued P1 Jobs.
3. Owner Stop/Cancel does not auto-resume pending work.
4. Malformed structured JSON is retried exactly once.
5. Abort/cancel/timeout/unrelated failures are not retried by malformed-JSON policy.
6. Second malformed result fails only current Job; queue can continue.

## Verification
PASS:
- exact final blob/hash + `node --check` for both source files;
- failure isolation simulation;
- running-job selection simulation;
- malformed JSON retry exactly once final orchestration simulation;
- malformed twice => exactly two calls then error;
- AbortError/timeout/cancelled => no retry;
- source diff hygiene;
- exact PR source scope/full-file review;
- no configured status checks and no unresolved review threads.

## PM review correction
Intermediate renderer monkey-patching of `window.electronAPI.analyzeP1Vision` was rejected and removed. Final implementation leaves contextBridge API untouched and performs retry in `pipeline1-ai.js`.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS.
- Owner verification: NOT STARTED — AUTHORIZED.
- Documentation sync: PASS after final docs publication/reverification.
- Merge: BLOCKED.
- Step 3: BLOCKED.

## Owner retest requirement
Run at least two P1 Jobs. Verify current-job UI tracking, normal queue advance, failure isolation, Stop/Cancel non-resume, and bounded JSON retry behavior if malformed JSON recurs.
