# Active PM Execution Spec

Status: ACTIVE

Task:
`INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005-REV1`

Spec:
`.ai/task_specs/INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005-REV1.md`

PM-authored helper:
`.ai/task_specs/tools/finalize_034_rev2_005_rev1.py`

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Owner result:
PASS — Owner reported on 2026-08-07: `task 34 đã oke`

Previous failed executions:
- `INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-004`: INVALIDATED/ABORTED; damaged local worktree is not a source and must not be touched.
- `INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005`: STOPPED safely before any write because the first PM helper matched the malformed Owner fragment incorrectly.

Verified correction:
Direct GitHub byte evidence shows the malformed fragment is an actual TAB byte followed by `ask 34 đã oke`, not a literal backslash plus `task`. REV1 uses a corrected PM-authored helper that matches this byte sequence explicitly and remains pinned to the exact unchanged canonical input blobs.

Purpose:
Run only the corrected PM-authored byte-preserving REV1 helper from a brand-new isolated Finalize-005-REV1 worktree. Anti must not manually edit canonical files and must not self-repair.

Executor must fetch GitHub, read this ACTIVE file directly from the remote review ref with `git show`, then read the full referenced REV1 spec from the same remote ref.

Local ACTIVE/spec copies are not authority.
No manual text editing.
No self-repair.
No command outside the REV1 spec whitelist.
No source/tests/dependencies changes.
Do not modify `.ai/qa_checklist.md`.
Do not edit PM specs/helper.
Do not touch/remove/repair prior failed worktrees.
Do not start Task 035 or Task 036.
Do not force push.
Do not merge PR #14.

Documentation synchronization remains `WAITING_PM_VERIFICATION` until PM verifies the published GitHub commit.
Merge remains BLOCKED.
