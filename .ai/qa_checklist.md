# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Owner failure intake
- [x] Multi-job P1 reproduced a real failure: one Job errored and later Job remained queued.
- [x] Owner screenshot shows selection/detail did not reliably follow actual processing Job.
- [x] Owner log shows Ollama reasoning completed then malformed JSON parsing failed.

## Source/scope verification
- [x] Dedicated branch `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- [x] Exact start `5db876b00160415b465d10cd117b44d33ae15159`.
- [x] Final source commit `100e343427264e128acd8cadc67f279faf450e56`.
- [x] Final source scope only `pipeline1-run-ux.js` and `pipelines/pipeline1-ai.js`.
- [x] No P2/P3/STTN/Settings source changes.
- [x] Intermediate contextBridge monkey-patch removed from final source.

## Automated/static evidence
- [x] `pipeline1-run-ux.js` blob `1042d3f65b2555feb32ec960345b7d81f903798d` exact local hash match; `node --check` PASS.
- [x] `pipeline1-ai.js` blob `9451409b5c594b2f4f67650863b00c7a8b4e1571` exact local hash match; `node --check` PASS.
- [x] Multi-job failure isolation simulation PASS.
- [x] Running-job selection simulation PASS.
- [x] Final orchestration malformed JSON first failure + one retry success => exactly 2 calls PASS.
- [x] Malformed twice => exactly 2 calls then error PASS.
- [x] AbortError => exactly 1 call / no retry PASS.
- [x] Timeout => exactly 1 call / no retry PASS.
- [x] Cancelled Job => exactly 1 call / no retry PASS.
- [x] Final source files produce no whitespace-error output under diff check.
- [ ] GitHub CI/checks — verify at final PR head.

## Code review
- [ ] Verify final PR #44 head/base/draft/open state.
- [ ] Review exact changed-file list.
- [ ] Review full final `pipeline1-run-ux.js`.
- [ ] Review full final `pipeline1-ai.js`.
- [ ] Confirm queue recovery cannot revive Owner-stopped Jobs.
- [ ] Confirm retry is bounded to one additional analysis call.
- [ ] Confirm no raw model payload logging.
- [ ] Confirm no unrelated source changes.
- [ ] Check review threads/comments/checks.

## Fresh Owner runtime verification — BLOCKED UNTIL CODE REVIEW PASS
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
- Code review: IN PROGRESS.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.
