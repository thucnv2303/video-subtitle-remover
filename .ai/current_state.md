# Current State

## Status
WAITING_OWNER_TEST — PIPELINE1-HANDOFF-001

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
- Draft PR: #40, stacked on the approved UI branch.
- Base: `2324d922de4874af1eb33f5dec2ea2d63a2bb968`.
- Reviewed source head before documentation closeout: `cda653f37e89b66671abee51c2ec516e338eb522`.
- Goal: a P1 upload remains P1-only until successful P1 completion explicitly unlocks P2.

## Verified defect
- `app.js` stores P1 and P2 jobs in one shared `state.jobs` array.
- Legacy Step 2 rendering iterates all `state.jobs`, so a newly uploaded P1 job appears in P2 immediately.
- Legacy `job.status` is shared by P1 and P2, creating cross-pipeline state ambiguity.
- Legacy `processNextJob()` selects generic `status === queued` jobs, so P2 can consume the wrong queue without a handoff guard.

## Reviewed implementation
- Added `src/renderer/js/pipeline-state.js` compatibility state/handoff controller.
- Separate fields: `p1Status/p1Progress`, `p2Status/p2Progress`, `p3Status`.
- New jobs: P1 idle / P2 locked / P3 locked.
- P1 error/cancel remains P2 locked and can be retried.
- P1 success maps to P1 finished / P2 ready / P3 locked and uses legacy sentinel `p2-ready` so P1 Start All cannot requeue the completed job.
- P2 list hides non-handed-off jobs and P2 stale preview is cleared when no eligible job exists.
- Direct P2 upload and drag/drop are blocked; P2 receives jobs only through P1 handoff.
- P2 Start is enabled only for a handed-off READY/ERROR job and only when no P1 job remains queued/processing.
- P2 Start bypasses legacy mixed-feature save path and forces subtitle-removal-only flags: `extractSrt=false`, `asrFallback=false`, `aiRewrite=false`, `ttsGenerate=false`.
- P2 success maps to P2 finished / P3 ready.
- `pipeline1-ai.js` imports the handoff controller and no longer claims a direct P1→P3 transition after TTS.

## Verification
- Exact GitHub `pipeline-state.js` blob: `70ed7d86b9e54217c732c0538048f65244a1caf8`.
- Reconstructed local Git blob hash matched `70ed7d86...`; `node --check` PASS.
- Exact GitHub `pipeline1-ai.js` blob: `bf9f15a1baec9ab8e15146bcd7b2b53b6a6da374`.
- Reconstructed local Git blob hash matched `bf9f15a1...`; `node --check` PASS.
- State-transition simulation: PASS for P1 idle/queued/processing/error/cancel/finished → P2 locked/ready and P2 queued/processing/finished → P3 ready.
- Guard simulation: PASS; P2 handed-off job starts with subtitle-removal-only flags, and P2 Start is disabled while any P1 job is queued/processing.
- GitHub diff review: product source limited to `pipeline-state.js` plus `pipeline1-ai.js`; P2/P3 source files are unchanged.
- `pipeline1-ai.js` patch contains whole-file EOL normalization noise; semantic changes reviewed are the state-gate import and corrected handoff log.
- GitHub CI: not configured.
- PR #40 review comments: none unresolved.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for exact reviewed source blobs and targeted state/guard simulations.
- Code review: PASS for Owner runtime handoff test.
- Owner manual app verification: NOT STARTED / AUTHORIZED.
- Documentation synchronization: PASS after this review closeout.
- Merge permission: BLOCKED pending Owner runtime PASS; BUG-005 processing-flow repair remains a subsequent focused task.
