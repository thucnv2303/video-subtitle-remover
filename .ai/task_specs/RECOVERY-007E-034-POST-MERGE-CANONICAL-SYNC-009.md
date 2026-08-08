# PM Execution Spec — RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009

Status: ACTIVE WHEN REFERENCED BY REMOTE `.ai/task_specs/ACTIVE.md`
Mode: DETERMINISTIC POST-MERGE KNOWLEDGE-ONLY SYNCHRONIZATION

## 0. Hard execution contract

This task is deterministic. Anti is an executor, not a designer.

On the first failed command, failed assertion, unexpected diff, helper failure, basis mismatch, or remote-head move:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

Do not invent an alternative edit, script, recovery path, formatter, or git command.
Only commands required by this spec are authorized.

## 1. Why this task exists

PR #14 for `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2` has already been merged by the Project Manager.

Verified merge commit:
`edc699930f4537f5f52568e9c0aaa8aeb68fb67b`

Canonical base branch:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

The Task 034 application, automated verification, code review, Owner verification, documentation reconciliation, and merge-readiness gates all passed before merge.

After merge, three dynamic canonical files still contain the intentionally pre-merge state `Merge: BLOCKED` / final-merge decision wording. They now need a post-merge truth synchronization so GitHub canonical state matches the already completed merge.

This task must only update:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

No application source/test/dependency change is allowed.

## 2. Repository / remote authority

Repository:
`thucnv2303/video-subtitle-remover`

Canonical base:
`recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Review branch for this task:
`review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009`

Merged PR #14 commit:
`edc699930f4537f5f52568e9c0aaa8aeb68fb67b`

Reviewed application source:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Execution authority is remote-only.

Required start:

```powershell
git fetch origin
git show "origin/review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009:.ai/task_specs/ACTIVE.md"
git show "origin/review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009:.ai/task_specs/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009.md"
git rev-parse "origin/review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009"
```

Record the last output as `EXECUTION_BASE_HEAD`.

Local ACTIVE/spec copies are not authority.

## 3. Required preflight

Verify the merged canonical commit is an ancestor of the execution basis:

```powershell
git merge-base --is-ancestor "edc699930f4537f5f52568e9c0aaa8aeb68fb67b" "$EXECUTION_BASE_HEAD"
```

Required: exit 0.

Verify all changes after the merged canonical commit are task-control files only:

```powershell
git diff --name-only "edc699930f4537f5f52568e9c0aaa8aeb68fb67b" "$EXECUTION_BASE_HEAD"
```

Allowed pre-execution paths only:
- `.ai/task_specs/ACTIVE.md`
- `.ai/task_specs/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009.md`
- `.ai/task_specs/tools/post_merge_034_canonical_sync_009.py`

Any other path:

`STOP — POST-MERGE SYNC BASIS HAS UNAUTHORIZED PATHS`

New isolated worktree path:

`E:\Project AI\_closeout\034-post-merge-canonical-sync-009`

Check:

```powershell
Test-Path "E:\Project AI\_closeout\034-post-merge-canonical-sync-009"
```

If TRUE:

`STOP — ISOLATED WORKTREE PATH ALREADY EXISTS`

Create:

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-post-merge-canonical-sync-009" "$EXECUTION_BASE_HEAD"
cd "E:\Project AI\_closeout\034-post-merge-canonical-sync-009"
$PWD.Path
git rev-parse HEAD
git status --short
```

Required: exact path, HEAD equals `EXECUTION_BASE_HEAD`, status empty.

## 4. Exact input blob gate

Required blobs before helper execution:

- `.ai/current_state.md` = `f666ac1a2df9b0c3b0d0f264adb8ace84fe8c91a`
- `.ai/task_current.md` = `77b95dafc84e5f4e29649d5d851fd5ce94182a9d`
- `.ai/handoff.md` = `9b486da69597aedacf4ad3ac78e0581d3e6a7377`
- `.ai/task_specs/tools/post_merge_034_canonical_sync_009.py` = `c597dd576ba1cd7d2b375d44df71be6fed5c032a`

Run exactly:

```powershell
git hash-object .ai/current_state.md
git hash-object .ai/task_current.md
git hash-object .ai/handoff.md
git hash-object .ai/task_specs/tools/post_merge_034_canonical_sync_009.py
```

Any mismatch:

`STOP — POST-MERGE CANONICAL BASIS MISMATCH`

## 5. Allowed file changes

Only:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

Forbidden to modify:
- `.ai/task_specs/**`
- `.ai/qa_checklist.md`
- `.ai/bugs.md`
- `.ai/decisions.md`
- `.ai/evidence/**`
- application source
- tests
- dependencies/package/build files

## 6. Mandatory helper syntax gate

Before running the helper:

```powershell
python -m py_compile .ai/task_specs/tools/post_merge_034_canonical_sync_009.py
```

If non-zero:

`STOP — POST-MERGE SYNC HELPER SYNTAX INVALID`

Do not run helper after a failed syntax gate.

## 7. Authorized edit mechanism

Run the PM helper exactly once:

```powershell
python .ai/task_specs/tools/post_merge_034_canonical_sync_009.py
```

If non-zero:

`STOP — POST-MERGE CANONICAL SYNC HELPER FAILED`

Do not run it again and do not manually repair.

The helper is designed to:
- preserve existing CRLF/LF counts exactly;
- validate all three exact input blobs before any write;
- record Task 034 as merged;
- record PR #14 merge commit `edc699930f4537f5f52568e9c0aaa8aeb68fb67b`;
- change current merge gates from pre-merge BLOCKED to the completed merge truth;
- preserve reviewed application source SHA `ea9521f6fe957e24e49cc5d090e275511d91141d`;
- set handoff Active Task to NONE;
- keep Task 035/036 unauthorized until a separate PM spec is published.

## 8. Forbidden operations

Do not use:
- manual editor changes
- `Set-Content`
- `Out-File`
- any Python/Node/PowerShell rewrite script other than the exact PM helper
- formatter
- CRLF/LF conversion
- `git reset`
- `git restore`
- `git checkout`
- `git clean`
- `git revert`
- `git rebase`
- `git commit --amend`
- `git worktree remove`
- `git add .`
- `git add -A`
- force push
- history rewrite
- merge

Do not touch prior Finalize/Closeout/Reconcile worktrees.
Do not start Task 035/036.

## 9. Pre-stage verification

Run:

```powershell
git status --short
git diff --name-status
git diff --numstat
git -c core.whitespace=cr-at-eol diff --check
```

Required changed-file set exactly:

```text
.ai/current_state.md
.ai/handoff.md
.ai/task_current.md
```

Diff must be narrow. Hundreds-line churn:

`STOP — UNEXPECTED DOCUMENT CHURN`

Required text checks:

```powershell
git grep -n "COMPLETED — MERGED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2" -- .ai/current_state.md
git grep -n "PR: #14 — MERGED" -- .ai/current_state.md .ai/task_current.md
git grep -n "MERGED — edc699930f4537f5f52568e9c0aaa8aeb68fb67b" -- .ai/current_state.md .ai/task_current.md
git grep -n "Merge permission: USED — PR #14 merged at edc699930f4537f5f52568e9c0aaa8aeb68fb67b" -- .ai/task_current.md
git grep -n "NONE — Task 034 merged in PR #14" -- .ai/handoff.md
git grep -n "PR #14 merged at edc699930f4537f5f52568e9c0aaa8aeb68fb67b after explicit PM approval" -- .ai/handoff.md
git grep -n "USED — PR #14 merged at edc699930f4537f5f52568e9c0aaa8aeb68fb67b" -- .ai/handoff.md
git grep -n "Task 035/036 remain NOT AUTHORIZED" -- .ai/handoff.md
```

Required semantics:
- Task 034 remains completed with all accepted PASS evidence unchanged.
- Merge truth is now MERGED, not BLOCKED.
- Owner evidence remains exactly the accepted overall report.
- No new Owner observations are invented.
- Active Task becomes NONE in handoff.
- Task 035/036 remain unauthorized.

## 10. Stage gate

Stage exact files only:

```powershell
git add .ai/current_state.md .ai/task_current.md .ai/handoff.md
git diff --cached --name-only
git diff --cached --numstat
git -c core.whitespace=cr-at-eol diff --cached --check
```

If cached set differs:

`STOP — CACHED FILE SET NOT AUTHORIZED`

## 11. Remote-head guard

Before commit:

```powershell
git fetch origin
git rev-parse "origin/review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009"
```

It must still equal `EXECUTION_BASE_HEAD`.

If not:

`STOP — SPEC BASE MOVED`

## 12. Commit and push

Exactly one executor commit:

```powershell
git commit -m "docs: synchronize canonical state after PR14 merge"
```

Push fast-forward only:

```powershell
git push origin HEAD:review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009
```

No force push.

Post-push:

```powershell
git rev-parse HEAD
git fetch origin
git rev-parse "origin/review/RECOVERY-007E-034-POST-MERGE-CANONICAL-SYNC-009"
git status --short
```

Local and remote HEAD must match; final status empty.

## 13. Gate meaning after publication

If published exactly as specified:
- Task 034 product execution: PASS
- automated verification: PASS
- code review: PASS
- Owner manual verification: PASS
- documentation synchronization: WAITING_FINAL_PM_CONFIRMATION until PM verifies this PR
- PR #14 merge: ALREADY MERGED
- active product task: NONE
- Task 035/036: NOT AUTHORIZED
- post-merge docs PR: MUST NOT be merged by Anti

## 14. FINAL REPORT schema

Return:
- Active spec read directly from remote ref: YES/NO
- Task ID
- EXECUTION_BASE_HEAD
- worktree path
- initial HEAD/status
- merged-base ancestry result
- post-merge-basis changed paths
- four blob hashes
- syntax gate exit code
- helper exit code/full output
- exact modified files
- `git diff --name-status`
- `git diff --numstat`
- whitespace result
- required text-check outputs
- cached name-only/numstat/whitespace
- executor commit SHA
- remote HEAD after push
- final status
- source/tests/dependencies changed: YES/NO
- Task 035/036 started: YES/NO
- forbidden command used: YES/NO
- post-merge docs PR merged by executor: NO

Anti must not claim PM final PASS for this post-merge synchronization and must not merge its PR.
