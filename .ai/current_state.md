# Current State

## Status
PIPELINE1-MULTIJOB-RESILIENCE-003 — CANONICAL P1 ERROR-STATE FIX CODE REVIEW PASS / OWNER RETEST READY

## Authority
- Repository: `thucnv2303/video-subtitle-remover`.
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting/base SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest reviewed source commit: `ecf2a10f7e29cbb2bc2f2c67e51df394c7de22d2`.

## Latest Owner runtime failure — 2026-08-11
Owner retested exact head `094a1b9a6f1c94d9594d7095929f1c4579f9f076` and confirmed:
- failed Job still had no visible `Chạy lại` action;
- clicking the failed Job still did not open the error popup.

## Verified root cause chain
1. Earlier UX code was not loaded by the app; fixed by preload runtime injection `332a3460...`.
2. Earlier status selector did not match generated Job DOM; fixed by `eb9eaf11...`.
3. Remaining blocker: `pipeline-state.js` is the visible P1 state authority. On P1 failure it sets `job.p1Status='error'` and resets legacy `job.status='idle'`. The prior run-UX still tested only legacy `job.status==='error'`, so it ignored the Job that UI displayed as `Lỗi`.
4. `pipeline-state.js` rewrites the status chip every sync cycle, so a retry button nested inside the chip is not stable.

## Current source correction
Source `ecf2a10...`:
- resolves effective P1 state from `job.p1Status || job.status`;
- popup/retry/processing/queue recovery use that effective state;
- retry button is inserted as a sibling of the status chip, not inside it;
- retry sets both `status` and `p1Status` to `queued`, resets both progress values and cancel flags;
- an active `pipeline1JobId` is not cancelled or replaced; retry waits in queue;
- when no Job is active, existing recovery starts the queued retry;
- Stop clears both canonical/legacy queued state.

## Verification
- Direct GitHub inspection of `pipeline-state.js` confirmed the state-authority behavior above.
- GitHub source diff for `ecf2a10...` is limited to `src/renderer/js/pipeline1-run-ux.js`.
- PM code review PASS for source `ecf2a10...`: review `4902799500`.
- GitHub status checks: none configured; no CI PASS is claimed.
- Fresh Owner runtime verification is required.

## Controlled PM metadata incident
During verification, PR #44 body was accidentally overwritten with `noop` through a PR/issue metadata action. No source file, branch ref, commit history, or worktree content was changed. The PR body was immediately restored with the current evidence and this incident is recorded rather than hidden.

## Gates
- Execution: PASS.
- Automated/static verification: PARTIAL — source/diff review PASS; no configured CI and no full Electron runtime executed by PM.
- Code review: PASS for source `ecf2a10...`.
- Owner manual verification: FAIL on `094a1b9...`; READY FOR FRESH RETEST on current head.
- Documentation synchronization: PASS after this docs publication.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.

## Next permitted action
Owner retests latest PR #44 head. Verify failed-card popup, visible `↻ Chạy lại`, queue-behind-active behavior, automatic retry start after active Job ends, processing feedback and add-video stability. Do not proceed to Step 3 before fresh Owner PASS.
