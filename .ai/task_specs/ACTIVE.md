# Active PM Execution Spec

Status: ACTIVE

Task:
`INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-004`

Spec:
`.ai/task_specs/INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-004.md`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Owner result:
PASS — Owner reported on 2026-08-07: `task 34 đã oke`

Current GitHub correction basis:
`c5376def7c79cd0df68b90da24a0ada52986d862`

Task 003 execution finding:
INVALIDATED as final documentation-sync proof. GitHub cumulative diff is narrow, but the executor used forbidden reset/restore/checkout, line-ending conversion and force-push commands; its reported commit SHA was also incorrect, and `.ai/current_state.md` still contains contradictory current Owner WAITING state.

Purpose:
Use a new isolated clean worktree and targeted editor-level changes only to make current_state, task_current, and handoff agree on the accepted 034-REV2 Owner PASS, while preserving source/test state and existing narrow cumulative history.

Executor must fetch GitHub and read this ACTIVE file directly from the remote review ref with `git show`, then read the full referenced spec from the same remote ref. Local ACTIVE/spec copies are not authority.

Do not modify application source or tests.
Do not use reset/restore/checkout/revert/clean/rebase/amend.
Do not run line-ending conversion or whole-file rewrite scripts.
Do not force push.
Do not start Task 035 or Task 036.
Do not merge PR #14.
Documentation synchronization remains BLOCKED pending this finalization and PM verification.
Merge remains BLOCKED.
