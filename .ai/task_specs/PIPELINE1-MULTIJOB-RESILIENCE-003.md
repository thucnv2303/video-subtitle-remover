# PIPELINE1-MULTIJOB-RESILIENCE-003

## Goal
Resolve Pipeline 1 multi-job resilience blockers before any Step 3 work.

## Exact basis
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
- Final source commit: `100e343427264e128acd8cadc67f279faf450e56`

## Owner-observed failures
1. Current-processing Job was not reliably reflected as selected/detail Job.
2. A failed P1 Job stopped the remaining queue.
3. Ollama returned malformed structured JSON after reasoning completed.

## Scope allowed
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`
- canonical `.ai/` state/task/QA/bug files.

## Non-goals
- No P2/P3 implementation changes.
- No STTN/backend algorithm changes.
- No Settings changes.
- No broad `app.js` refactor.

## Final implementation
1. `pipeline1-run-ux.js` synchronizes selected/detail state to the actual P1 processing Job.
2. When no P1 Job is active/processing but an eligible queued P1 Job remains, the adapter resumes that Job through the existing queue/card handler.
3. Stop/Cancel clears queued work and recovery timers, so explicitly stopped Jobs are not revived.
4. `pipeline1-ai.js` retries `runPipeline1MultimodalAnalysis()` exactly once only for malformed-JSON parse errors.
5. Abort/cancel/timeout/unrelated errors are not retried by malformed-JSON policy.
6. Second malformed result throws normally; current Job becomes error and queue recovery can continue to next Job.
7. No raw model payload is logged.

## Rejected intermediate approach
A renderer-side assignment to `window.electronAPI.analyzeP1Vision` was rejected during PM review due to Electron contextBridge mutability/safety concerns. It is not present in final source tree.

## Acceptance evidence
- final `pipeline1-run-ux.js` blob `1042d3f65b2555feb32ec960345b7d81f903798d`; `node --check` PASS;
- final `pipeline1-ai.js` blob `9451409b5c594b2f4f67650863b00c7a8b4e1571`; `node --check` PASS;
- multi-job failure-isolation simulation PASS;
- running-job selection simulation PASS;
- final P1 orchestration malformed→success: exactly 2 calls PASS;
- malformed→malformed: exactly 2 calls then error PASS;
- AbortError, timeout, cancelled Job: exactly 1 call / no retry PASS;
- final source files contain no whitespace-error output under `git diff --check --no-index /dev/null <file>`.

## Owner retest
Only after PM code review PASS:
- queue at least two P1 videos;
- verify UI follows processing Job;
- verify normal completion advances queue;
- verify a failed Job does not block next Job;
- verify Stop/Cancel does not auto-resume;
- if malformed JSON recurs, verify only one retry warning.

## Merge
BLOCKED until static/code review PASS + Owner runtime PASS + result documentation sync + explicit PM approval.
