# PM Execution Spec

## Task
INCIDENT-RECOVERY-007E-034-CLOSEOUT-CHURN-CORRECTION-003

## Status
AUTHORIZED_FOR_EXECUTION

## Mode
INCIDENT / ISOLATED DOCUMENTATION CHURN CORRECTION

## Objective
Correct the documentation-only commit `beafac07a0a258ee3d2328234a94b102eec07e21`, which recorded the intended Owner PASS but violated the active recovery spec by running a broad `.ai/*.md` LF-normalization command and publishing full-file line-ending churn in three canonical files.

Owner PASS for `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2` remains valid. Application source/test state is not being reopened.

This task must preserve history. Do not reset, rewrite, force-push, or delete the bad commit. Publish one corrective documentation commit on top of the current review branch so that the cumulative four-file content relative to the pre-bad parent is narrow and semantically correct.

## Verified GitHub basis
Repository: `thucnv2303/video-subtitle-remover`

PR: `#14`

Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

PR base: `recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Reviewed application source SHA: `ea9521f6fe957e24e49cc5d090e275511d91141d`

Owner result: PASS — direct Owner report on 2026-08-07: `task 34 đã oke`

Bad documentation commit: `beafac07a0a258ee3d2328234a94b102eec07e21`

Pre-bad documentation parent: `461cebc65733f9407f1294174b8df38d52302e36`

GitHub verification of the bad commit shows only these four repository paths changed, but with full-file churn:
- `.ai/current_state.md`
- `.ai/handoff.md`
- `.ai/qa_checklist.md`
- `.ai/task_current.md`

The active recovery spec explicitly prohibited broad line-ending conversion and required STOP on recovery diff churn. The executor nevertheless ran a Python `glob('.ai/*.md')` CRLF-to-LF rewrite and pushed the result.

Documentation synchronization: BLOCKED pending this correction and PM verification.

Merge: BLOCKED.

## Worktrees that must remain untouched
Do not mutate or use content from:
- `E:\Project AI\video-subtitle-remover-recovery021`
- `E:\Project AI\_closeout\034-owner-pass-recovery`
- `E:\Project AI\Video-sub-remove`

Do not copy files, patches, staged hunks, or generated text from those worktrees.

## Approved correction worktree
Create exactly one new detached worktree at:

`E:\Project AI\_closeout\034-owner-pass-churn-fix`

If this exact path already exists, STOP with:

`STOP — CORRECTION WORKTREE EXISTS`

Do not delete, clean, overwrite, or reuse an existing path.

## Preflight
1. `git fetch origin`.
2. Read `.ai/task_specs/ACTIVE.md` from the remote review branch.
3. Read this entire spec from the same remote branch.
4. Capture current remote review HEAD:

```powershell
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Call it `CORRECTION_BASE_HEAD`.

5. Verify all of the following are ancestors of `CORRECTION_BASE_HEAD`:
- `ea9521f6fe957e24e49cc5d090e275511d91141d`
- `461cebc65733f9407f1294174b8df38d52302e36`
- `beafac07a0a258ee3d2328234a94b102eec07e21`

6. Verify there is no application source/test change after reviewed source SHA. At minimum inspect:

```powershell
git diff --name-only ea9521f6fe957e24e49cc5d090e275511d91141d..origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

If any runtime/source/test/dependency path appears, STOP with `STOP — REVIEWED SOURCE SUPERSEDED`.

7. Verify the approved correction path does not exist.

## Create clean isolated worktree

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-owner-pass-churn-fix" CORRECTION_BASE_HEAD
Set-Location "E:\Project AI\_closeout\034-owner-pass-churn-fix"
$PWD.Path
git rev-parse HEAD
git status --short
```

Acceptance before mutation:
- exact approved path;
- HEAD equals `CORRECTION_BASE_HEAD`;
- status empty.

Otherwise STOP with `STOP — CORRECTION WORKTREE NOT CLEAN`.

## Authorized history-preserving repair
The only authorized history repair is to reverse the bad documentation commit in the new isolated worktree without creating a revert commit yet:

```powershell
git revert --no-commit beafac07a0a258ee3d2328234a94b102eec07e21
```

This is specifically authorized for this incident task. Do not revert any other commit.

After that command, only the four documentation paths from the bad commit may be modified.

Then recreate the intended Owner-PASS closeout by targeted edits only, using current GitHub/project facts in this spec. Do not use any contaminated local copy.

## Required final content
### `.ai/current_state.md`
For CURRENT 034-REV2 state only:
- status completed/owner-verified PASS using existing conventions;
- source SHA remains `ea9521f6fe957e24e49cc5d090e275511d91141d`;
- Automated verification: PASS;
- Code review: PASS;
- Owner manual verification/retest: PASS;
- direct Owner evidence on 2026-08-07: `task 34 đã oke`;
- Documentation synchronization: `WAITING_PM_VERIFICATION`;
- Merge: BLOCKED.

Preserve archived/historical statuses.

### `.ai/task_current.md`
For CURRENT 034-REV2:
- Task ID unchanged;
- status COMPLETED or repository-equivalent owner-verified completed state;
- source SHA unchanged;
- Automated verification PASS;
- Code review PASS;
- Owner manual verification PASS;
- record only the direct Owner statement/date;
- Documentation synchronization `WAITING_PM_VERIFICATION`;
- Merge BLOCKED;
- do not activate a next product task.

### `.ai/handoff.md`
For CURRENT 034-REV2:
- Owner verification PASS;
- source SHA unchanged;
- PR #14 authoritative;
- next action is PM verification of docs correction, not another Owner test;
- no Anti implementation task implied;
- Merge BLOCKED.

Preserve historical records.

### `.ai/qa_checklist.md`
Only in `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2 QA`:
- record Owner overall PASS on 2026-08-07;
- mark the three task-specific Owner criteria complete;
- note that the final Owner message was an overall PASS and did not separately enumerate per-item prose.

Do not alter unrelated QA sections.

## Strict editing safety
Do NOT run:
- any Python/Node/PowerShell loop over `.ai/*.md` or wildcard groups;
- any CRLF/LF conversion command;
- `Set-Content` on whole canonical files;
- Prettier or any formatter;
- repository-wide patch scripts;
- `git add .` or `git add -A`;
- reset/restore/clean/rebase/amend;
- force push;
- history rewrite.

Edits must be targeted only to the four approved files.

## Verification before staging
First verify ordinary working-tree scope:

```powershell
git status --short
git diff --name-status
git diff --check
```

Only the four approved documentation files may be modified.

Because this correction intentionally reverses the bad line-ending commit, the ordinary diff against `CORRECTION_BASE_HEAD` may be large. The decisive acceptance check is the cumulative content against the pre-bad parent:

```powershell
git diff --name-status 461cebc65733f9407f1294174b8df38d52302e36 -- .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md
git diff --numstat 461cebc65733f9407f1294174b8df38d52302e36 -- .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md
git diff --check 461cebc65733f9407f1294174b8df38d52302e36 -- .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md
git diff 461cebc65733f9407f1294174b8df38d52302e36 -- .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md
```

Acceptance:
- cumulative changed paths are only the four approved docs;
- cumulative diff is narrow semantic closeout content, not whole-file replacement;
- `current_state.md`, `handoff.md`, and `task_current.md` must not show hundreds of additions/deletions relative to `461cebc...`;
- no unrelated historical churn;
- both diff-check commands are clean.

If cumulative diff still shows full-file churn, STOP with `STOP — CHURN NOT CORRECTED`.

If any extra tracked path changes, STOP with `STOP — CORRECTION SCOPE EXPANDED`.

## Staging
Stage only these explicit paths if changed:

```powershell
git add .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md
```

Then capture:

```powershell
git diff --cached --name-only
git diff --cached --check
```

No other path may be staged.

## Remote-move guard
Before commit:

```powershell
git fetch origin
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Remote SHA must still equal `CORRECTION_BASE_HEAD`.

Otherwise STOP with `STOP — CORRECTION BASE MOVED`.

## Commit and push
Create exactly one correction commit:

`docs: correct 034-REV2 closeout line-ending churn`

Then prove scope:

```powershell
git show --name-status --stat --oneline HEAD
```

Push fast-forward only:

```powershell
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

No force push.

After push:

```powershell
git fetch origin
git rev-parse HEAD
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
git status --short
git diff --name-status 461cebc65733f9407f1294174b8df38d52302e36..HEAD -- .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md
git diff --numstat 461cebc65733f9407f1294174b8df38d52302e36..HEAD -- .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md
```

The final cumulative four-file diff must be narrow.

## PR #14 body
After successful push, update PR #14 body to state:
- Owner Manual App Verification: PASS;
- Code Review: PASS;
- Automated Verification: PASS;
- Documentation closeout bad commit: `beafac07a0a258ee3d2328234a94b102eec07e21` — invalidated for documentation-sync acceptance due line-ending churn;
- exact new correction commit SHA;
- Documentation synchronization: `WAITING_PM_VERIFICATION`;
- Task 035/036: NOT AUTHORIZED;
- Merge: BLOCKED;
- next action: PM verifies cumulative docs diff and canonical contents.

Do not claim PM PASS yourself.

## Stop conditions
- `STOP — CORRECTION WORKTREE EXISTS`
- `STOP — CORRECTION WORKTREE NOT CLEAN`
- `STOP — REVIEWED SOURCE SUPERSEDED`
- `STOP — CORRECTION SCOPE EXPANDED`
- `STOP — CHURN NOT CORRECTED`
- `STOP — CORRECTION BASE MOVED`
- `SPEC SCOPE INSUFFICIENT`

## Required final report
Return:
- Active spec read: YES/NO
- Task ID
- `CORRECTION_BASE_HEAD`
- Correction worktree path
- Initial HEAD/status
- `git revert --no-commit beafac...` result
- Exact files modified
- Raw cumulative `git diff --name-status 461cebc... -- <four files>` before staging
- Raw cumulative `git diff --numstat 461cebc... -- <four files>` before staging
- `git diff --check` result
- `git diff --cached --name-only`
- Correction commit SHA
- `git show --name-status --stat --oneline HEAD`
- Remote HEAD after push
- Final clean status
- Final cumulative four-file name-status and numstat vs `461cebc...`
- PR #14 body updated YES/NO
- Application source changed: NONE
- Tests changed: NONE
- Documentation synchronization: WAITING_PM_VERIFICATION
- Task 035/036 started: NO
- Merge: BLOCKED

## Merge permission
BLOCKED.

This task corrects documentation churn only. It does not authorize source changes, Task 035/036, or merge.