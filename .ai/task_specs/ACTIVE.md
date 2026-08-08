# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-034-FINAL-MERGE-READINESS-HANDOFF-RECONCILE-008`

Spec:
`.ai/task_specs/RECOVERY-007E-034-FINAL-MERGE-READINESS-HANDOFF-RECONCILE-008.md`

PM-authored helper:
`.ai/task_specs/tools/reconcile_034_handoff_merge_readiness_008.py`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Accepted Task 034 closeout commit:
`ab572faccd205930e9ad7466e65436d99be17078`

Accepted Reconcile-007-REV1 commit:
`576cb8c84ae925570596c7ef4870033ea56fc3e6`

Task 034 verified gates:
- application execution: PASS
- automated verification: PASS
- code review: PASS
- Owner manual app verification: PASS — overall Owner report on 2026-08-07: `task 34 đã oke`
- current_state lower 034 status: COMPLETED — PM VERIFIED
- old 034 QA block: historical/superseded
- BUG-013: resolved by 034-REV2 using accepted evidence
- Owner security clarification: screenshot shared with PM was redacted before sharing; shared evidence does not establish usable credential exposure or a key-rotation blocker

Final PM inspection after Reconcile-007-REV1 found one remaining canonical conflict in `.ai/handoff.md`:
- current top handoff says Task 034 is COMPLETED — PM VERIFIED, Owner PASS and Documentation PASS;
- a lower generic `## Status` block is actually historical AI-Settings/PR-8 context but still says the screenshot key is COMPROMISED / Owner must rotate it and `Owner manual verification: NOT STARTED`;
- that historical block must be relabeled and reconciled before final merge approval.

Purpose:
Run only the exact PM-authored byte-preserving Handoff-Reconcile-008 helper from a brand-new isolated worktree. It modifies only `.ai/handoff.md`, preserves line endings, and does not change current Task034 evidence or application source.

Executor must fetch GitHub, read this ACTIVE file directly from the remote review ref with `git show`, then read the full referenced Handoff-Reconcile-008 spec from the same remote ref.

Local ACTIVE/spec copies are not authority.
No manual editing.
No self-repair.
Mandatory `python -m py_compile` syntax gate before helper execution.
No command outside the 008 whitelist.
Do not touch/remove/repair any prior Finalize/Closeout/Reconcile worktree.
Do not modify source/tests/dependencies.
Do not modify current_state/task_current/qa/bugs.
Do not start Task 035 or Task 036.
Do not force push.
Do not merge PR #14.

Documentation synchronization is WAITING_FINAL_PM_CONFIRMATION pending Handoff-Reconcile-008 publication and PM verification.
Confirmed credential-rotation blocker from shared screenshot: NONE.
Merge remains BLOCKED pending explicit PM final merge-readiness approval.
