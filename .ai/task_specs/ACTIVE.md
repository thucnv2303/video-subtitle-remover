# Active PM Execution Spec

Status: PM_DIRECT_FIX_PUBLISHED_REVIEW_PENDING

Task:
`PIPELINE1-MULTIJOB-RESILIENCE-003`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/PIPELINE1-MULTIJOB-RESILIENCE-003`

Starting SHA:
`5db876b00160415b465d10cd117b44d33ae15159`

Source scope:
- `src/renderer/js/pipeline1-run-ux.js`

Owner runtime findings — 2026-08-10:
1. During multi-job Pipeline 1, the UI did not reliably follow the job currently being processed.
2. If one Pipeline 1 job failed, the remaining queued job stayed waiting and the batch appeared stuck.
3. Owner log showed Ollama reasoning completed but structured response parsing failed with malformed JSON: `Expected ',' or ']' after array element in JSON ...`.

Required behavior:
- selected/detail state follows the actual Pipeline 1 processing job;
- one failed job is isolated and the next queued P1 job starts automatically;
- explicit Owner Stop/Cancel does not auto-resume queued work;
- malformed structured JSON from P1 vision/reasoning is retried at most once;
- cancellation, timeout, transport, model, and unrelated errors are not retried by the JSON retry policy;
- after a second malformed JSON result, only the current job fails and the queue continues;
- no raw AI payload is added to logs;
- P2/P3/STTN/Settings behavior is unchanged.

Verification required:
- exact published blob `node --check` PASS;
- deterministic multi-job failure isolation simulation PASS;
- running-job selection simulation PASS;
- malformed JSON retry exactly once PASS;
- cancellation/timeout excluded from retry classification PASS;
- diff hygiene PASS;
- GitHub diff/full-file review PASS before Owner retest.

Owner retest:
BLOCKED until PM code review PASS.

Merge permission:
BLOCKED.
