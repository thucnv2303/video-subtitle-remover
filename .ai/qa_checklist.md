# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Owner failure intake
- [x] Multi-job P1 reproduced: one Job errored and later Job remained queued.
- [x] Selection/detail did not reliably follow actual processing Job.
- [x] Ollama reasoning completed then malformed JSON parsing failed.

## Source/scope verification
- [x] Dedicated branch `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- [x] Exact start `5db876b00160415b465d10cd117b44d33ae15159`.
- [x] Final source commit `100e343427264e128acd8cadc67f279faf450e56`.
- [x] Source scope only `pipeline1-run-ux.js` and `pipelines/pipeline1-ai.js`.
- [x] No P2/P3/STTN/Settings source changes.
- [x] Intermediate contextBridge monkey-patch absent from final source.

## Automated/static evidence
- [x] run-ux blob `1042d3f65b2555feb32ec960345b7d81f903798d` hash match + `node --check` PASS.
- [x] pipeline1-ai blob `9451409b5c594b2f4f67650863b00c7a8b4e1571` hash match + `node --check` PASS.
- [x] Multi-job failure isolation simulation PASS.
- [x] Running-job selection simulation PASS.
- [x] Malformed JSON first failure + one retry success => exactly 2 calls PASS.
- [x] Malformed twice => exactly 2 calls then error PASS.
- [x] AbortError => no retry PASS.
- [x] Timeout => no retry PASS.
- [x] Cancelled Job => no retry PASS.
- [x] Final source diff whitespace hygiene PASS.
- [x] GitHub status checks: none configured.

## Code review
- [x] PR #44 open/Draft; correct base branch and base SHA.
- [x] Exact changed-file list: 7 canonical docs + 2 approved source files.
- [x] Full final run-ux reviewed.
- [x] Full final pipeline1-ai reviewed.
- [x] Queue recovery guards Owner Stop/Cancel path.
- [x] Retry bounded to one additional analysis call.
- [x] No raw model payload logging added.
- [x] No unrelated source changes.
- [x] No unresolved review threads.
- [x] PM code review COMMENT/PASS recorded, review id `4897109838`.

## Fresh Owner runtime verification — AUTHORIZED / NOT STARTED
- [ ] Add at least two P1 videos and start batch.
- [ ] Current Job row/status/detail follows actual processing Job.
- [ ] Normal completion advances to next Job.
- [ ] If one Job errors, next queued Job begins automatically and app does not stay stuck.
- [ ] Owner Stop/Cancel leaves pending Jobs stopped/idle rather than auto-resuming.
- [ ] If malformed JSON recurs, only one retry warning appears.
- [ ] Retry success lets current Job continue normally.
- [ ] Retry failure marks current Job error but next queued Job starts.
- [ ] No P2/P3 regression observed from this P1-only revision.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS.
- Owner manual app verification: NOT STARTED — READY.
- Documentation synchronization: PASS after final gate-sync docs publication/reverification.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.
