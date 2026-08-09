# Current State

## Status
WAITING_CODE_REVIEW — PIPELINE1-HANDOFF-001

## Canonical baseline
- Canonical branch: `recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`.
- Settings V1 PR #38: MERGED / Owner PASS.
- Post-Settings canonical source HEAD: `e578e48c22a79c69005f2d3373599addfc412ecf`.

## Pipeline 1 UI foundation
- UI branch: `review/PIPELINE1-APPROVED-UI-001`.
- Draft PR: #39.
- Owner runtime UI verification on 2026-08-09: PASS.
- Approved UI HEAD used as handoff base: `2324d922de4874af1eb33f5dec2ea2d63a2bb968`.
- Remaining processing defect BUG-005 is not considered resolved by the UI PASS.

## Active task
- Task: `PIPELINE1-HANDOFF-001`.
- Branch: `review/PIPELINE1-HANDOFF-001`.
- Base: approved Pipeline 1 UI HEAD `2324d922de4874af1eb33f5dec2ea2d63a2bb968`.
- Goal: stop newly uploaded Pipeline 1 jobs from appearing/running in Pipeline 2 until Pipeline 1 finishes successfully.

## Verified defect
- `app.js` stores P1 and P2 jobs in one shared `state.jobs` array.
- Legacy Step 2 rendering iterates all `state.jobs`, so a newly uploaded P1 job appears in P2 immediately.
- Legacy `job.status` is shared by P1 and P2, which creates cross-pipeline state ambiguity.
- `processNextJob()` selects any shared job with `status === queued`, so P2 must not be allowed to start while P1 still has queued/processing jobs.

## Current implementation
- Added `src/renderer/js/pipeline-state.js` as a compatibility state/handoff gate.
- Added separate state fields: `p1Status`, `p1Progress`, `p2Status`, `p2Progress`, `p3Status`.
- New jobs default to P1 idle / P2 locked / P3 locked.
- P2 UI hides jobs until `p1Status === finished` and `p2Status` becomes ready.
- Legacy P1 completion is mapped to a P1→P2 handoff: P1 finished, P2 ready, P3 locked.
- P2 start is blocked for jobs that have not completed P1.
- P2 start is also blocked while any P1 job remains queued/processing, preventing legacy `processNextJob()` from picking a P1 queue item.
- P2 completion maps to P2 finished / P3 ready.
- `pipeline1-ai.js` imports the handoff gate and no longer logs an incorrect direct P1→P3 transition after TTS.

## Verification status
- GitHub compare from approved UI base shows handoff work limited to `src/renderer/js/pipeline-state.js` and `src/renderer/js/pipelines/pipeline1-ai.js` before documentation updates.
- GitHub CI: not configured.
- Runtime owner test: NOT STARTED.
- Code review: WAITING.

## Gates
- Execution: PASS for publication of current handoff candidate.
- Automated/static verification: WAITING final exact-head verification.
- Code review: WAITING.
- Owner manual app verification: NOT STARTED / NOT AUTHORIZED until code review PASS.
- Documentation synchronization: IN PROGRESS.
- Merge permission: BLOCKED.
