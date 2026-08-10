# QA Checklist

## Active task
`PIPELINE1-MULTIJOB-RESILIENCE-003`

## Owner runtime feedback
- [x] Multi-job retest reached a real processing state on latest reviewed flow.
- [x] Owner requested stronger visual distinction for processing Job.
- [x] Owner requested failed-Job click to show error details.

## Source/scope
- [x] Dedicated branch and Draft PR #44.
- [x] Latest source commit `0e53a6ade8a67a061db214f6050f60ded6e0944d`.
- [x] Incremental UX source change only: `pipeline1-run-ux.js` + `pipeline1-run-ux.css`.
- [x] Existing `pipeline1-ai.js` bounded retry preserved.
- [x] No P2/P3/STTN/Settings/backend source changes.

## Automated/static
- [x] Exact run-UX blob `504d6b89d8f806169d060ab7507832b43c28c5af` reconstructed byte-identical by `git hash-object`.
- [x] Exact run-UX `node --check` PASS.
- [x] GitHub source diff scope reviewed.
- [x] No configured GitHub status checks.

## Code review
- [x] Processing state uses blue pulse/glow and spinner rather than ambiguous static status.
- [x] `prefers-reduced-motion` disables animation.
- [x] Failed Job receives persistent red state.
- [x] Standard final P1 error log is captured before legacy current-Job cleanup.
- [x] Error dialog content uses `textContent` only.
- [x] Error dialog supports close button, backdrop click and Escape.
- [x] Clicking controls inside a Job card does not trigger the popup.

## Owner retest — READY
- [ ] Processing Job is immediately distinguishable from queued/idle Jobs.
- [ ] Spinner/pulse stops when Job leaves processing state.
- [ ] Failed Job stays visibly red.
- [ ] Clicking failed Job opens popup with the actual latest P1 error when available.
- [ ] Popup closes normally and does not block queue continuation.
- [ ] Failed Job still allows next queued Job to start automatically.
- [ ] Stop/Cancel does not auto-resume pending Jobs.
- [ ] No P2/P3 regression observed.

## Gates
- Execution: PASS.
- Automated/static verification: PASS for available checks.
- Code review: PASS.
- Owner manual app verification: PARTIAL — RETEST READY.
- Documentation synchronization: PASS after publication/reverification.
- Merge permission: BLOCKED.
- Step 3 progression: BLOCKED.
