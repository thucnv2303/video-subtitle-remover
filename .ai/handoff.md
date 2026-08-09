# AgentOS Handoff Status

## Canonical baseline
`recovery/RECOVERY-007E-OWNER-RUNTIME-BASELINE-008`

Post-Settings canonical source HEAD:
`e578e48c22a79c69005f2d3373599addfc412ecf`

Settings V1:
MERGED / OWNER PASS — PR #38.

## Pipeline 1 UI foundation
- Branch: `review/PIPELINE1-APPROVED-UI-001`
- Draft PR #39
- Owner runtime UI verification: PASS on 2026-08-09.
- Approved UI HEAD used by current task: `2324d922de4874af1eb33f5dec2ea2d63a2bb968`.

## Active task
`PIPELINE1-HANDOFF-001`

## Status
WAITING_OWNER_TEST

## Review branch / PR
- `review/PIPELINE1-HANDOFF-001`
- Draft PR #40
- Reviewed source head: `cda653f37e89b66671abee51c2ec516e338eb522`

## Verified defect
P1 and P2 share `state.jobs` and legacy `job.status`. Step 2 rendered all jobs, so a P1 upload appeared in P2 immediately. The legacy P2 runner also selects generic queued jobs, creating a cross-pipeline execution risk.

## Reviewed candidate
- `src/renderer/js/pipeline-state.js` adds per-pipeline lifecycle state and handoff gates.
- New jobs are P1 idle / P2 locked / P3 locked.
- P1 error/cancel keeps P2 locked.
- P1 success maps to P2 ready and uses a legacy `p2-ready` sentinel so P1 Start All cannot requeue a completed P1 job.
- P2 list hides locked jobs; stale P1 preview is cleared if no handed-off P2 job exists.
- P2 direct upload and drag/drop are blocked.
- P2 Start is enabled only for a handed-off ready/error job while no P1 job is queued/processing.
- P2 Start calls the existing runner with subtitle-removal-only flags (`extractSrt=false`, `asrFallback=false`, `aiRewrite=false`, `ttsGenerate=false`).
- P2 success maps to P3 ready.
- `pipeline1-ai.js` loads the state gate and its TTS completion message now reflects P1→P2 handoff rather than direct P1→P3.

## Verification
- Exact `pipeline-state.js` blob `70ed7d86b9e54217c732c0538048f65244a1caf8`: local reconstructed Git hash match; `node --check` PASS.
- Exact `pipeline1-ai.js` blob `bf9f15a1baec9ab8e15146bcd7b2b53b6a6da374`: local reconstructed Git hash match; `node --check` PASS.
- Targeted state simulation: PASS for P1→P2→P3 transitions.
- Cancel/error state remains P2 locked and retryable: PASS.
- Guard simulation: PASS for P2-only execution flags and global P1-busy lock.
- Product source diff is limited to the new handoff controller and the P1 AI module loader/log adjustment; no P2/P3 source file changed.
- GitHub CI: none configured.
- PR #40 unresolved review comments: none.

## Owner runtime acceptance
AUTHORIZED. Verify:
1. upload in P1 is absent from P2;
2. P2 has no usable direct upload/drop bypass;
3. P1 cancel/error remains absent from P2;
4. P1 success makes only that job visible/ready in P2;
5. P2 Start remains blocked while any P1 job is queued/processing;
6. P2 run performs subtitle removal only and does not rerun ASR/AI/TTS;
7. P3 remains locked until P2 finishes.

## Gates
- Execution: PASS.
- Automated/static verification: PASS.
- Code review: PASS for Owner runtime handoff test.
- Owner manual app verification: NOT STARTED / AUTHORIZED.
- Documentation synchronization: PASS.
- Merge permission: BLOCKED.

## Next action
Owner tests PR #40 runtime handoff. BUG-005 full Pipeline 1 processing-chain repair remains the next focused functional task after handoff behavior is accepted.
