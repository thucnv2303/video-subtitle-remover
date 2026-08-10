# Active PM Execution Spec

Status: CODE_REVIEW_PASS_OWNER_RETEST_READY

Task: `PIPELINE1-MULTIJOB-RESILIENCE-003`
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`
Draft PR: #44
Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`
Final source commit: `100e343427264e128acd8cadc67f279faf450e56`
PM-reviewed docs/head before final gate-sync docs commit: `0435d4146c7d148552f68884aecdf3203cf3ac67`

Source scope:
- `src/renderer/js/pipeline1-run-ux.js`
- `src/renderer/js/pipelines/pipeline1-ai.js`

Owner runtime findings addressed:
1. selected/detail did not reliably follow actual processing P1 Job;
2. one P1 Job failure left next Job queued and batch appeared stuck;
3. Ollama reasoning completed but malformed structured JSON failed parsing.

Final behavior:
- actual processing P1 Job drives selected/detail UI state;
- failed Job is isolated and next eligible queued P1 Job can start automatically;
- Owner Stop/Cancel does not auto-resume explicitly stopped work;
- malformed structured JSON is retried at most once in P1 orchestration;
- Abort/cancel/timeout/unrelated failures are not retried by malformed-JSON policy;
- second malformed result fails current Job while queue recovery remains available;
- no raw AI payload logging;
- no P2/P3/STTN/Settings changes.

Review correction:
An intermediate renderer mutation of `window.electronAPI.analyzeP1Vision` was rejected and removed. Final retry is in `pipeline1-ai.js`; contextBridge API remains untouched.

Verified evidence:
- run-ux blob `1042d3f65b2555feb32ec960345b7d81f903798d`: exact hash + `node --check` PASS;
- pipeline1-ai blob `9451409b5c594b2f4f67650863b00c7a8b4e1571`: exact hash + `node --check` PASS;
- failure isolation + running selection simulations PASS;
- malformed→success exactly 2 calls PASS;
- malformed twice exactly 2 calls then error PASS;
- AbortError/timeout/cancelled: no retry PASS;
- final source diff whitespace hygiene PASS;
- PR #44 final changed-file scope reviewed: 7 canonical docs + 2 approved source files;
- GitHub status checks: none configured;
- unresolved review threads: none;
- PM code review COMMENT/PASS recorded on PR #44 review id `4897109838`.

Owner retest: AUTHORIZED / NOT STARTED.
Merge permission: BLOCKED.
Step 3 progression: BLOCKED until Owner P1 multi-job PASS is recorded.
