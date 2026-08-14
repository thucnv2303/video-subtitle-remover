# QA Checklist

## Active task
`PIPELINE1-STANDARD-CJK-GUARD-008 — Standard CJK Prompt Guard`

## Review basis
- [x] Corrective branch `review/PIPELINE1-STANDARD-CJK-GUARD-008`.
- [x] Draft PR #51.
- [x] Base SHA `7df7e45c277feb56b5a8a45195007f5e41b69638`.
- [x] Source correction `e2cf430971fb75d5ef794fafc6879e35ba0a608e`.
- [x] Exact Owner-tested application-source state `6e023808891a4c5ff5e886aa62a18838c7fb42ae`.
- [x] Later commits through prior head `96e4c5dd...` were documentation-only.

## Static/code review
- [x] `node --check src/main/p1-standard-vision-wrapper.js` PASS on Owner-tested source state.
- [x] `node --check src/main/p1-standard-vision-ipc.js` PASS.
- [x] `git diff --check 7df7e45...HEAD` PASS.
- [x] Owner worktree clean at static verification.
- [x] Source isolation PASS: prompt-contract source change limited to `src/main/p1-standard-vision-wrapper.js`.
- [x] Code review PASS for the CJK prompt-contract correction.

## Owner Standard runtime — 2026-08-14
- [x] App runs well.
- [x] AI-generated Standard narration/script is correct by Owner review.
- [x] Voice render is stable.
- [x] Voice duration is reported materially matched to source in the successful configured run.
- [x] Standard functional runtime outcome PASS for the corrected configured prompt.

## Closeout findings that remain open
### BUG-039 — P1 log observability
- [x] Owner reports P1 card log cuts earlier data.
- [x] Source confirms Step1 log removes oldest entries after 100 DOM nodes.
- [x] Owner reports `/api/health`, `/api/tts/status`, `/api/gpu-info` 200 access lines while idle.
- [x] Source confirms all Python stdout is cloned into Step1 log.
- [x] Source confirms background global-status refresh legitimately calls those endpoints.
- [ ] Dedicated log-observability source correction published.
- [ ] Idle P1 console runtime retest PASS.
- [ ] Successful Standard run retains beginning-to-completion evidence and Copy output.

### BUG-040 — product default prompt
- [x] Source confirms default prompt remains subtitle-translation/SRT-oriented.
- [x] Source confirms P1 run snapshots that prompt.
- [x] Owner success required manually replacing the configurable prompt.
- [ ] Product default synchronized to proven continuous-narration / ZERO-CJK contract.
- [ ] Fresh/reset default runtime retest PASS.

## Regression constraints for next tasks
- [ ] No change to Standard reasoning/guard semantics during BUG-039 fix.
- [ ] No TTS generation behavior change during BUG-039 fix.
- [ ] No P2/P3 source change during BUG-039 fix.
- [ ] Backend/global status continues refreshing after routine heartbeat lines are removed from P1 presentation.
- [ ] Non-routine errors remain diagnosable.

## Semantic mode
- [ ] Semantic runtime remains DEFERRED until Standard closeout follow-ups BUG-039 and BUG-040 are verified.

## Gates
- Execution: PASS for task 008 source.
- Automated/static: PASS for task 008 source.
- Code review: PASS for task 008 source.
- Owner Standard runtime: PASS for corrected configured prompt.
- Documentation synchronization: PASS after this corrective knowledge sync.
- Follow-up observability/default prompt: OPEN.
- Merge permission: BLOCKED.
