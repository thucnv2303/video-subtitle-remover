# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Owner failure intake
- [x] Multi-job P1 run reproduced a real failure: one Job errored and later Job remained queued.
- [x] Owner screenshot shows current-processing selection/detail behavior is not reliable.
- [x] Owner log shows Ollama reasoning completed then malformed JSON parsing failed.

## Source/scope verification
- [x] Dedicated review branch `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- [x] Exact starting SHA `5db876b00160415b465d10cd117b44d33ae15159`.
- [x] Application-source scope limited to `src/renderer/js/pipeline1-run-ux.js`.
- [x] No P2/P3/STTN/Settings source changes in this task.

## Automated/static evidence
- [x] Published source blob `0b595be5722644d1e83e82346c4409a54349afb7` matches exact local tested hash.
- [x] `node --check /tmp/pipeline1-run-ux.js` PASS.
- [x] Multi-job failure isolation simulation: error Job + queued Job => queued Job becomes processing.
- [x] Running-job selection simulation: `pipeline1SelectedJobId` and `activeJobId` move to active Job.
- [x] Malformed JSON simulation: exactly one retry, then success.
- [x] Cancelled/timeout results are excluded from malformed-JSON retry classification.
- [x] Changed-source diff hygiene check PASS.
- [ ] GitHub CI/checks — verify after Draft PR publication.

## Code review
- [ ] Review exact PR changed-file list.
- [ ] Review full `pipeline1-run-ux.js` at exact PR head.
- [ ] Confirm queue recovery cannot revive Owner-stopped queued Jobs.
- [ ] Confirm retry policy is bounded to one additional call.
- [ ] Confirm no raw model payload logging.
- [ ] Confirm no unrelated source changes.

## Fresh Owner runtime verification — BLOCKED UNTIL CODE REVIEW PASS
Required after authorization:
- [ ] Add at least two P1 videos and start batch.
- [ ] Current Job row/status/detail follows the actual processing Job.
- [ ] Normal Job completion advances to next Job.
- [ ] If one Job errors, next queued Job begins automatically and app does not remain stuck.
- [ ] Owner Stop/Cancel leaves pending Jobs stopped/idle rather than auto-resuming.
- [ ] If malformed JSON recurs, only one retry warning appears.
- [ ] If retry succeeds, current Job continues normally.
- [ ] If retry also fails, current Job errors but next queued Job still starts.
- [ ] No P2/P3 regression observed from this P1-only revision.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: IN PROGRESS.
- Owner manual app verification: NOT STARTED.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
