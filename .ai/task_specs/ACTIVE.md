# Active PM Execution Spec

Status: PM_DIRECT_FIX_PUBLISHED_REVIEW_PENDING

Task: `PIPELINE1-MULTIJOB-RESILIENCE-003`

Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
Final source commit: `100e343427264e128acd8cadc67f279faf450e56`

Source scope:
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`

Owner runtime findings — 2026-08-10:
1. Multi-job P1 did not reliably follow the Job currently processing in selection/detail UI.
2. One P1 Job failure left the next Job queued and the batch appeared stuck.
3. Ollama reasoning completed but malformed structured JSON failed parsing: `Expected ',' or ']' after array element in JSON ...`.

Required behavior:
- selected/detail follows the actual processing P1 Job;
- one failed Job is isolated and the next eligible queued P1 Job starts automatically;
- Owner Stop/Cancel must not auto-resume pending work;
- malformed structured JSON is retried at most once in P1 orchestration;
- cancellation, timeout, transport/model and unrelated errors are not retried by this malformed-JSON policy;
- if retry is also malformed, only that Job fails and queue recovery remains available;
- no raw AI payload logging;
- P2/P3/STTN/Settings behavior unchanged.

Implementation note:
An intermediate attempt to replace `window.electronAPI.analyzeP1Vision` in renderer was rejected during PM review because Electron contextBridge APIs must not be treated as a mutable renderer object. Final source commit `100e343...` restores the scheduler adapter and moves bounded retry into `pipeline1-ai.js` orchestration.

Verification required:
- exact published blob hashes + `node --check` PASS for both source files;
- deterministic failure-isolation/running-selection PASS;
- malformed JSON: first failure + one retry PASS;
- malformed JSON twice: exactly two analysis calls then fail current Job;
- Abort/cancel/timeout: no retry;
- diff hygiene PASS;
- exact GitHub PR diff/full-file review PASS before Owner retest.

Owner retest: BLOCKED until PM code review PASS.
Merge permission: BLOCKED.
