# Active PM Execution Spec

Status: ACTIVE

Task:
`RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009`

Spec:
`.ai/task_specs/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009.md`

PM-authored helper:
`.ai/task_specs/tools/post_merge_034_canonical_sync_009.py`

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Review branch:
`review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009`

Merged PR #14 commit:
`edc699930f4537f5f52568e9c0aaa8aeb68fb67b`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Task 034 verified result:
- application execution: PASS
- automated verification: PASS
- code review: PASS
- Owner manual app verification: PASS — overall Owner report on 2026-08-07: `task 34 đã oke`
- pre-merge documentation synchronization: PASS
- PR #14: MERGED
- credential-rotation blocker from shared screenshot: NONE

Purpose:
Synchronize the three dynamic canonical files with the already-completed PR #14 merge. This is knowledge-only; no product source/test/dependency work is authorized.

Executor authority:
Anti must fetch GitHub, read this ACTIVE file directly from `origin/review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009`, then read the full referenced spec from the same remote ref.

Local ACTIVE/spec copies are not authority.
No manual editing.
No self-repair.
Mandatory `python -m py_compile` syntax gate before helper execution.
Only `.ai/current_state.md`, `.ai/task_current.md`, and `.ai/handoff.md` may be modified by the executor.
Do not modify source/tests/dependencies.
Do not start Task 035/036.
Do not force push.
Do not merge the post-merge docs PR.

Task 035/036 authorization:
NONE

Next permitted action:
Anti executes Post-Merge Canonical Sync 009 exactly. Project Manager then verifies the publication and merges the documentation-only PR if it passes.
