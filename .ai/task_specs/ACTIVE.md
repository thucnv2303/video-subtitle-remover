# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-034-MERGE-READINESS-KNOWLEDGE-RECONCILE-007`

Spec:
`.ai/task_specs/RECOVERY-007E-034-MERGE-READINESS-KNOWLEDGE-RECONCILE-007.md`

PM-authored helper:
`.ai/task_specs/tools/reconcile_034_merge_readiness_007.py`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Accepted Task 034 closeout commit:
`ab572faccd205930e9ad7466e65436d99be17078`

Task 034 gate result:
- application execution: PASS
- automated verification: PASS
- code review: PASS
- Owner manual app verification: PASS — overall Owner report on 2026-08-07: `task 34 đã oke`
- Closeout-006-REV1 executor publication: PASS

Final PM merge-readiness audit result:
NEEDS_REVISION — knowledge reconciliation required before merge approval.

Verified blockers:
1. `.ai/current_state.md` top says Task 034 COMPLETED, but the lower current 034-REV2 block still says `Status: WAITING_PM_VERIFICATION`.
2. `.ai/qa_checklist.md` has an older 034 Owner Verification block that still reads as current WAITING and is not labeled historical/superseded, while the 034-REV2 block records Owner overall PASS.
3. `.ai/bugs.md` still leaves BUG-013 in candidate/Owner-retest-not-started state although 034-REV2 directly resolved the provider/model synchronization defect and has accepted automated + overall Owner PASS evidence.
4. BUG-010 security incident source fix is implemented, but Owner has not yet confirmed revocation/rotation of the historically exposed DeepSeek key.

Purpose:
Run the exact PM-authored byte-preserving reconciliation helper from a brand-new isolated worktree. This task reconciles canonical knowledge only and makes the remaining security rotation confirmation an explicit merge blocker.

Executor must fetch GitHub, read this ACTIVE file directly from the remote review ref with `git show`, then read the full referenced Reconcile-007 spec from the same remote ref.

Local ACTIVE/spec copies are not authority.
No manual editing.
No self-repair.
No command outside the Reconcile-007 whitelist.
Do not touch/remove/repair prior Finalize/Closeout worktrees.
Do not modify source/tests/dependencies.
Do not start Task 035 or Task 036.
Do not force push.
Do not merge PR #14.

Documentation synchronization remains under final PM reconciliation review.
Owner compromised-key rotation confirmation: WAITING.
Merge remains BLOCKED.