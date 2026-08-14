# QA Checklist

## Active task
`PIPELINE1-LOG-OBSERVABILITY-009 — P1 Log Observability`

## Review basis
- [x] Draft PR #52.
- [x] Base `review/PIPELINE1-STANDARD-CJK-GUARD-008@330d756fcce1b71ca8745b3292d7ac655bc32d13`.
- [x] PM source commit `ba24b24011669c24565ad8b3a685b45fb046996f`.
- [x] Final application source scope is only `src/renderer/js/pipeline1-run-ux.js`.
- [x] `app.js` has no net final diff after rejected CRLF-churn attempt was neutralized without force push.

## BUG-039 source behavior
- [x] P1 log retention target is bounded at 2000 entries.
- [x] Legacy 100-entry removal is guarded only for the P1 log container.
- [x] P1-only observer removes routine successful Python/Uvicorn GET access lines for exact `/api/health`, `/api/tts/status`, `/api/gpu-info`.
- [x] Match requires `200 OK`.
- [x] Non-200 for same endpoint is retained by deterministic test.
- [x] Unrelated backend log is retained by deterministic test.
- [x] Normal P1 log is retained by deterministic test.
- [x] Global logger and background polling source are unchanged.
- [x] Copy/Clear code is unchanged.

## Static / review
- [x] GitHub source-commit compare: `pipeline1-run-ux.js` only, +40/-1.
- [x] Parent-to-head application scope contains no `app.js` change.
- [x] Deterministic filter + retention-value test: PASS.
- [x] PM logic/scope review: PASS.
- [ ] `node --check src/renderer/js/pipeline1-run-ux.js` on exact PR #52 HEAD.
- [ ] `git diff --check 330d756fcce1b71ca8745b3292d7ac655bc32d13..HEAD` on exact PR #52 HEAD.

## Owner manual verification — WAITING STATIC PASS
- [ ] Exact checkout HEAD equals current PR #52 head.
- [ ] Full app restart.
- [ ] Idle >=30s: no routine 200 health/TTS/GPU access lines accumulate in P1 console.
- [ ] Global Backend/TTS/GPU status continues refreshing.
- [ ] Standard P1 Job completes with normal behavior unchanged.
- [ ] Meaningful P1 history remains visible beyond the old 100-line cap.
- [ ] Copy Log contains retained P1 history.
- [ ] Clear Log clears the P1 console.
- [ ] Non-routine errors remain diagnosable.

## Inherited Standard state
- [x] Task 008 Standard functional runtime PASS for corrected configured prompt.
- [ ] `BUG-040` product default prompt sync remains a separate follow-up after BUG-039.

## Gates
- Execution: PASS.
- Automated/static: PARTIAL — deterministic PASS; exact Node/diff commands WAITING.
- Code review: PASS.
- Owner runtime: WAITING.
- Documentation synchronization: PASS after dynamic-doc sync.
- Merge permission: BLOCKED.