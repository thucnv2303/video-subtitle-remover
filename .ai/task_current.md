# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job UI Sync, and Bounded JSON Retry

## Status
FINAL_SOURCE_PUBLISHED_PM_REVIEW_IN_PROGRESS

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Final source commit: `100e343427264e128acd8cadc67f279faf450e56`.
- Source scope:
  - `src/renderer/js/pipeline1-run-ux.js`
  - `src/renderer/js/pipelines/pipeline1-ai.js`

## Required outcome
1. UI selection/detail follows the P1 Job actually processing.
2. One P1 Job failure does not stop later queued P1 Jobs.
3. Owner Stop/Cancel does not auto-resume pending Jobs.
4. Malformed structured JSON is retried exactly once in P1 orchestration.
5. Abort/cancel/timeout/unrelated errors are not retried by malformed-JSON policy.
6. A second malformed JSON failure marks only the current Job failed; queue can continue.

## Final verification
PASS:
- final `pipeline1-run-ux.js` exact blob/hash + `node --check`;
- final `pipeline1-ai.js` exact blob/hash + `node --check`;
- multi-job continuation simulation;
- running-job selection simulation;
- malformed JSON retry-once final orchestration simulation;
- malformed twice => exactly 2 calls then current-job failure;
- AbortError/timeout/cancelled => no retry;
- final source diff whitespace hygiene.

## Review correction
Intermediate renderer monkey-patching of `window.electronAPI.analyzeP1Vision` was rejected by PM review and removed. Final retry is implemented inside `pipeline1-ai.js`, leaving contextBridge API untouched.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: IN PROGRESS.
- Owner verification: NOT STARTED.
- Documentation sync: IN PROGRESS.
- Merge: BLOCKED.
- Step 3: BLOCKED.

## Merge rule
No Step 3 progression or merge approval until final code review PASS, Owner verifies the two-job P1 runtime path, the result is recorded in canonical `.ai/`, and PM gives explicit approval.
