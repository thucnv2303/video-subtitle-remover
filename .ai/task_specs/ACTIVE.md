# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-034-MERGE-READINESS-KNOWLEDGE-RECONCILE-007-REV1`

Spec:
`.ai/task_specs/RECOVERY-007E-034-MERGE-READINESS-KNOWLEDGE-RECONCILE-007-REV1.md`

PM-authored helper:
`.ai/task_specs/tools/reconcile_034_merge_readiness_007_rev1.py`

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

Owner security clarification on 2026-08-08:
Owner states that the screenshot shared with PM had key material redacted before sharing. Therefore the shared screenshot evidence does not establish disclosure of a usable DeepSeek credential and key rotation is not a merge blocker on this evidence. Do not claim that Owner revoked or rotated a key.

Previous Reconcile-007 execution result:
STOPPED SAFELY before any write at execution basis `12199a537197e0bb63d66054391b9c48ffa02e6b`. Its PM helper had a Python syntax error before any mutation. That route is also SUPERSEDED because new Owner evidence changed the required security outcome.

Remaining verified knowledge blockers:
1. `.ai/current_state.md` top says Task 034 COMPLETED, but the lower current 034-REV2 block still says `Status: WAITING_PM_VERIFICATION`.
2. `.ai/qa_checklist.md` has an older 034 Owner Verification block that still reads as current WAITING and is not labeled historical/superseded, while the 034-REV2 block records Owner overall PASS.
3. `.ai/bugs.md` still leaves BUG-013 in candidate/Owner-retest-not-started state although 034-REV2 directly resolved the provider/model synchronization defect with accepted evidence.
4. BUG-010 must be recorded as a source-fixed Owner-observed security defect; Owner confirms the shared screenshot was redacted, so no usable credential exposure is established from that evidence.

Purpose:
Run the exact PM-authored byte-preserving Reconcile-007-REV1 helper from a brand-new isolated worktree. The REV1 spec includes a mandatory `python -m py_compile` syntax gate before helper execution. This task reconciles canonical knowledge only. It does not change application source, tests, dependencies, Owner evidence, or merge state.

Executor must fetch GitHub, read this ACTIVE file directly from the remote review ref with `git show`, then read the full referenced Reconcile-007-REV1 spec from the same remote ref.

Local ACTIVE/spec copies are not authority.
No manual editing.
No self-repair.
No command outside the REV1 whitelist.
Do not touch/remove/repair prior Finalize/Closeout/Reconcile worktrees.
Do not modify source/tests/dependencies.
Do not start Task 035 or Task 036.
Do not force push.
Do not merge PR #14.

Documentation synchronization remains under final PM reconciliation review.
Confirmed credential-rotation blocker from shared screenshot: NONE.
Merge remains BLOCKED pending explicit PM final merge-readiness approval.
