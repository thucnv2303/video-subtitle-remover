# Current Task

## Task ID
PIPELINE1-MULTIJOB-RESILIENCE-003

## Name
Pipeline 1 Multi-Job Failure Isolation, Running-Job Feedback, Failed-Job Retry/Error Detail, and Bounded JSON Retry

## Status
CANONICAL_P1_ERROR_STATE_FIX_CODE_REVIEW_PASS_OWNER_RETEST_READY

## Authority
- Review branch: `review/PIPELINE1-MULTIJOB-RESILIENCE-003`.
- Draft PR: #44.
- Starting SHA: `5db876b00160415b465d10cd117b44d33ae15159`.
- Latest reviewed source commit: `ecf2a10f7e29cbb2bc2f2c67e51df394c7de22d2`.

## Required outcome
1. Selected/detail follows actual processing P1 Job.
2. Processing Job is visually distinct.
3. One failed P1 Job does not stop later queued Jobs.
4. Clicking failed Job opens readable error popup.
5. Failed Job exposes `↻ Chạy lại`.
6. Retry while another P1 Job is processing queues behind it without preemption.
7. Retry while idle starts normally.
8. Stop/Cancel does not revive explicitly stopped work.
9. Malformed structured JSON retry remains bounded to one additional call.
10. Adding/loading video does not freeze renderer.
11. P1 UX must follow canonical `p1Status` where `pipeline-state.js` owns visible P1 state.

## Latest Owner evidence
Exact head `094a1b9...` still failed popup/retry runtime checks.

## Root cause
`pipeline-state.js` converts failed legacy state to `p1Status='error'` + `status='idle'`. Prior run-UX checked only `status==='error'`. It also nested retry inside a chip whose `textContent` is rewritten periodically by pipeline-state synchronization.

## Current implementation
- `p1State(job)` resolves `p1Status || status`.
- Failed-card popup/retry checks use `p1State`.
- `↻ Chạy lại` is a sibling of the status chip.
- Retry writes both `status`/`p1Status='queued'` and both progress values to zero.
- Active Job remains untouched; queue recovery starts retry only when scheduler is free.
- Previous preload wiring, DOM-selector fix, observer freeze fix and bounded JSON retry remain preserved.

## Verification
- Direct state-authority inspection PASS.
- Incremental source scope: one file (`pipeline1-run-ux.js`).
- PM code review PASS `4902799500`.
- GitHub CI/status checks: none configured.
- Owner runtime retest required.

## Gates
Execution PASS; automated/static PARTIAL; code review PASS; Owner verification RETEST READY; documentation sync PASS; merge BLOCKED; Step 3 BLOCKED.
