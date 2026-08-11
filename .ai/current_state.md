# Current State

## Status
PIPELINE1-MULTIJOB-RESILIENCE-003 — FAILED-JOB RETRY/POPUP REVISION PUBLISHED / OWNER RETEST READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting/base SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest source commit: `542ccb44df047d001ebfcbe669ad223b7a5ef840`.

## Owner runtime feedback — 2026-08-11
Latest Owner retest reports:
1. clicking a failed P1 Job does not open the intended error popup;
2. failed Jobs must be restartable;
3. if another P1 Job is already processing, restarting a failed Job must enqueue it rather than interrupting the active Job.

## Source correction
- Failed-card click handling is now bound in capture phase so it can run before the legacy Job-card click handler rebuilds/selects the card.
- Failed Job state receives a visible `↻ Chạy lại` action inside the approved status badge.
- Retry sets only that failed Job to `queued`, resets retry/cancel flags and progress, and preserves the currently processing Job.
- If no P1 Job is processing, existing queue recovery starts the queued retry; if a Job is already processing, the retry remains queued and runs after the active Job.
- Existing freeze fix remains: queue MutationObserver watches only child-list/subtree, not attributes.

## Verification evidence
- GitHub compare prior reviewed head `01fbfc9...` → latest source `542ccb4...`: only `src/renderer/js/pipeline1-run-ux.js` and `src/renderer/styles/pipeline1-run-ux.css` changed.
- Legacy app source already accepts `error` in the per-Job run path and `processPipeline1Queue()` returns immediately when `state.pipeline1JobId` is set; this supports queue-behind-active behavior.
- Source review confirms retry action does not cancel or replace an active Job.
- No P2/P3/STTN/Settings/backend source changes.
- Fresh Owner runtime verification is still required for popup and retry behavior.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for previously verified base behavior; latest interaction revision requires fresh runtime confirmation.
- Code review: PASS for narrow source logic/scope review.
- Owner manual verification: FAIL on previous head; RETEST READY on latest head.
- Documentation synchronization: PASS after this publication/reverification.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Owner updates the existing P1 test worktree to latest PR #44 head and verifies: failed-card popup opens, `Chạy lại` queues failed Job, retry waits behind an active Job, and no renderer freeze/regression occurs.
