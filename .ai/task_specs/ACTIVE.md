# Active PM Execution Spec

Status: ACTIVE

Task:
`INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005`

Spec:
`.ai/task_specs/INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005.md`

PM-authored helper:
`.ai/task_specs/tools/finalize_034_rev2_005.py`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Owner result:
PASS — Owner reported on 2026-08-07: `task 34 đã oke`

Previous failed execution:
`INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-004` is INVALIDATED/ABORTED. Its damaged local worktree is not a source, must not be repaired/removed/cleaned, and must not be reused.

Purpose:
Run the exact PM-authored byte-preserving helper from a brand-new isolated Finalize-005 worktree. Anti must not manually edit canonical files. The helper is pinned to exact Git blob inputs, performs exact match-count checks before any write, and preserves CRLF/LF counts.

Executor must fetch GitHub, read this ACTIVE file directly from the remote review ref with `git show`, then read the full referenced Finalize-005 spec from the same remote ref.

Local ACTIVE/spec copies are not authority.
No manual text editing.
No self-repair.
No command outside the spec whitelist.
No source/tests/dependencies changes.
Do not modify `.ai/qa_checklist.md`.
Do not edit PM specs/helper.
Do not touch prior failed worktrees.
Do not start Task 035 or Task 036.
Do not force push.
Do not merge PR #14.

Documentation synchronization remains `WAITING_PM_VERIFICATION` until PM verifies the published GitHub commit.
Merge remains BLOCKED.
