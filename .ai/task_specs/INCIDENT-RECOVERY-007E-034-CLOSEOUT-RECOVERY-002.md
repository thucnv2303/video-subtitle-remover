# PM Execution Spec

## Task
INCIDENT-RECOVERY-007E-034-CLOSEOUT-RECOVERY-002

## Status
AUTHORIZED_FOR_EXECUTION

## Mode
INCIDENT / ISOLATED DOCUMENTATION RECOVERY PUBLICATION

## Objective
Safely publish the accepted Owner PASS closeout for `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2` without touching, repairing, unstaging, restoring, resetting, cleaning, or otherwise mutating the contaminated local worktree at `E:\Project AI\video-subtitle-remover-recovery021`.

The previous incident evidence proved that the contaminated worktree has tracked modifications outside the approved four-file closeout scope:
- staged: `.ai/current_state.md`, `.ai/handoff.md`, `.ai/qa_checklist.md`, `.ai/task_current.md`
- additional unstaged paths reported by `git status --short`: `.ai/migration_status.md`, `.ai/project.md`

Therefore the contaminated worktree is NOT an approved publication source.

This recovery task must recreate the documentation closeout from current GitHub canonical files in a new isolated detached worktree and publish exactly one documentation-only commit to PR #14's existing review branch.

## Verified GitHub basis
Repository: `thucnv2303/video-subtitle-remover`

PR: `#14`

Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

PR base: `recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Reviewed application source SHA: `ea9521f6fe957e24e49cc5d090e275511d91141d`

Owner result: PASS — direct Owner report on 2026-08-07: `task 34 đã oke`

Incident evidence decision: `STOP — SCOPE EXPANDED`

GitHub compare from reviewed source SHA through the incident governance HEAD showed no application source/test changes after `ea9521f6fe957e24e49cc5d090e275511d91141d`; subsequent commits are documentation/governance/evidence only.

Merge remains BLOCKED.

## Recovery source of truth
Use ONLY the current remote contents of:

`origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Do NOT copy, cherry-pick, apply, diff-from, or otherwise use the contaminated local staged/unstaged files as content sources.

Do NOT use the historical main worktree `E:\Project AI\Video-sub-remove` as a publication source.

## Approved isolated worktree
Create exactly one new detached worktree at:

`E:\Project AI\_closeout\034-owner-pass-recovery`

If this exact path already exists, STOP with:

`STOP — RECOVERY WORKTREE EXISTS`

Do not delete, clean, overwrite, or reuse an existing path.

## Preflight
1. Run `git fetch origin`.
2. Read `.ai/task_specs/ACTIVE.md` from the remote review branch.
3. Read this entire spec from the same remote review branch.
4. Capture the current exact remote review-branch HEAD:

```powershell
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Call this value `RECOVERY_BASE_HEAD`.

5. Verify `RECOVERY_BASE_HEAD` is a descendant of reviewed source SHA:

```powershell
git merge-base --is-ancestor ea9521f6fe957e24e49cc5d090e275511d91141d origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Expected exit code: `0`.

6. Verify the remote delta after the reviewed application source contains no application source/test changes. At minimum inspect:

```powershell
git diff --name-only ea9521f6fe957e24e49cc5d090e275511d91141d..origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

If any path under `src/`, `tests/`, `api/`, application package/dependency manifests, or other application runtime files appears after the reviewed source SHA, STOP with:

`STOP — REVIEWED SOURCE SUPERSEDED`

Governance/documentation/evidence paths under `.ai/` are expected.

7. From a valid repository worktree, check that `E:\Project AI\_closeout\034-owner-pass-recovery` does not exist.

## Create isolated worktree
Create the detached worktree pinned exactly to `RECOVERY_BASE_HEAD`:

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-owner-pass-recovery" RECOVERY_BASE_HEAD
```

Then enter it and prove identity:

```powershell
Set-Location "E:\Project AI\_closeout\034-owner-pass-recovery"
$PWD.Path
git rev-parse HEAD
git status --short
```

Acceptance before editing:
- path exactly matches the approved recovery path;
- HEAD exactly equals `RECOVERY_BASE_HEAD`;
- `git status --short` is empty.

If not, STOP with:

`STOP — RECOVERY WORKTREE NOT CLEAN`

## Allowed files
Modify ONLY:

1. `.ai/current_state.md`
2. `.ai/task_current.md`
3. `.ai/handoff.md`
4. `.ai/qa_checklist.md`

`.ai/bugs.md` must remain unchanged in this recovery because the prior closeout inspection did not identify a task-034-specific bug entry requiring update.

No other tracked file may change.

## Required closeout content
Recreate the intended Owner-PASS closeout from the current GitHub versions of the four files. Do not use the contaminated local copies.

### `.ai/current_state.md`
For the CURRENT 034-REV2 state only:
- record `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2` as owner-verified/completed according to existing file conventions;
- reviewed source remains `ea9521f6fe957e24e49cc5d090e275511d91141d`;
- Automated verification: PASS;
- Code review: PASS;
- Owner manual app verification / Owner retest: PASS;
- owner evidence: direct Owner report on 2026-08-07, `task 34 đã oke`;
- documentation synchronization remains `WAITING_PM_VERIFICATION` until PM verifies the pushed docs commit;
- Merge remains BLOCKED pending explicit PM approval.

Do not rewrite archived/historical WAITING statuses belonging to older tasks.

### `.ai/task_current.md`
For active/current 034-REV2:
- Task ID remains `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`;
- status becomes `COMPLETED` or the repository's existing equivalent completed owner-verified state;
- source SHA remains `ea9521f6fe957e24e49cc5d090e275511d91141d`;
- Automated verification: PASS;
- Code review: PASS;
- Owner manual verification: PASS;
- record the direct Owner statement/date without inventing item-level observations;
- Documentation synchronization: `WAITING_PM_VERIFICATION`;
- Merge remains BLOCKED;
- do not activate or invent the next product task.

### `.ai/handoff.md`
Update CURRENT 034-REV2 handoff so:
- Owner verification: PASS;
- source identity remains `ea9521f6fe957e24e49cc5d090e275511d91141d`;
- PR #14 remains authoritative review context;
- next action is PM verification of the documentation closeout, not another Owner test;
- no Anti implementation task is implied after closeout;
- Merge remains BLOCKED.

Only supersede current 034-REV2 WAITING/NOT STARTED statements. Preserve historical records for older tasks.

### `.ai/qa_checklist.md`
Only in section `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2 QA`:
- record Owner overall PASS on 2026-08-07;
- mark the three task-specific Owner criteria complete;
- add a concise note that the final Owner message was an overall task PASS and did not separately enumerate per-item prose.

Do not mark unrelated older QA items complete.

## Editing safety
Do NOT run any broad formatter, global line-ending conversion, `.ai/*.md` loop, `Set-Content` over whole files/directories, Prettier, repository-wide patch script, or wildcard rewrite.

Edits must be targeted to the four approved files only.

Do not copy content from `E:\Project AI\video-subtitle-remover-recovery021`.

## Verification before staging
From the isolated recovery worktree, run and return raw output:

```powershell
git status --short
git diff --name-status
git diff --numstat
git diff --check
git diff -- .ai/current_state.md .ai/task_current.md .ai/handoff.md .ai/qa_checklist.md
```

Acceptance:
- exactly the four approved files are modified, or fewer if a required fact was already correct;
- no other tracked path is modified;
- no unexpected full-file line-ending churn;
- diff contains only narrow closeout changes;
- `git diff --check` is empty.

If broad line-ending churn appears, STOP with:

`STOP — RECOVERY DIFF CHURN`

If any path outside the four approved files changes, STOP with:

`STOP — RECOVERY SCOPE EXPANDED`

## Staging
Stage only the approved changed files explicitly. Never use `git add .` or `git add -A`.

Then run:

```powershell
git diff --cached --name-only
git diff --cached --numstat
git diff --cached --check
```

The cached file set must contain only the approved closeout files actually changed.

## Remote-move guard before commit/push
Before committing, run:

```powershell
git fetch origin
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

The returned remote SHA must still equal the captured `RECOVERY_BASE_HEAD`.

If it differs, STOP with:

`STOP — RECOVERY BASE MOVED`

Do not rebase, merge, reset, restore, or force-update anything.

## Documentation commit
Create exactly one documentation-only commit:

`docs: record owner PASS for 034-REV2`

Then prove commit scope:

```powershell
git show --name-status --stat --oneline HEAD
```

No application source/test path may appear.

## Push
Push the detached HEAD as a fast-forward update to the existing review branch only:

```powershell
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

No force push.

After push, run:

```powershell
git fetch origin
git rev-parse HEAD
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
git status --short
```

Local HEAD and remote review HEAD must match the new documentation commit; recovery worktree status must be empty.

## PR #14 body
After successful push, update PR #14 body to record:
- 034-REV2 Owner Manual App Verification: PASS;
- Automated verification: PASS;
- Code review: PASS;
- owner-test prep: PASS;
- exact documentation closeout commit SHA;
- Documentation synchronization: `WAITING_PM_VERIFICATION`;
- current incident recovery: documentation commit published from isolated clean worktree; contaminated local worktree left untouched;
- Merge: BLOCKED;
- next permitted action: PM verifies the GitHub documentation commit.

Do not activate Task 035 or Task 036.

## Contaminated worktree preservation
The following worktree must remain untouched throughout this recovery task:

`E:\Project AI\video-subtitle-remover-recovery021`

Do NOT:
- edit it;
- stage/unstage in it;
- commit from it;
- reset/restore/clean it;
- delete untracked files in it;
- normalize line endings in it;
- use its staged files as patch/content sources.

Its local incident state is preserved for later controlled cleanup only if PM explicitly authorizes that separately.

## Forbidden
Do NOT:
- modify application source or tests;
- modify `.ai/task_specs/ACTIVE.md`;
- modify this PM spec;
- modify `.ai/bugs.md`;
- modify `.ai/migration_status.md` or `.ai/project.md`;
- use `git add .` or `git add -A`;
- checkout/switch/reset/restore/clean/rebase/amend;
- force push;
- install/update dependencies;
- start Task 035 or Task 036;
- merge PR #14;
- claim PM documentation verification PASS.

## Stop conditions
- `STOP — RECOVERY WORKTREE EXISTS`
- `STOP — REVIEWED SOURCE SUPERSEDED`
- `STOP — RECOVERY WORKTREE NOT CLEAN`
- `STOP — RECOVERY DIFF CHURN`
- `STOP — RECOVERY SCOPE EXPANDED`
- `STOP — RECOVERY BASE MOVED`
- `BLOCKED — PROJECT KNOWLEDGE OUT OF SYNC`

## Required final report
Return:
- Active spec read: YES/NO
- Incident task: `INCIDENT-RECOVERY-007E-034-CLOSEOUT-RECOVERY-002`
- Contaminated worktree touched: NO
- Recovery worktree path
- `RECOVERY_BASE_HEAD`
- Recovery worktree initial HEAD
- Initial recovery `git status --short`
- Exact files modified
- `git diff --name-status`
- `git diff --numstat`
- `git diff --check`
- `git diff --cached --name-only`
- `git diff --cached --numstat`
- `git diff --cached --check`
- Documentation commit SHA
- `git show --name-status --stat --oneline HEAD`
- Remote review HEAD after push
- Recovery worktree final `git status --short`
- PR #14 body updated: YES/NO
- Application source changed: NONE
- Tests changed: NONE
- Documentation synchronization: `WAITING_PM_VERIFICATION`
- Task 035/036 started: NO
- Merge: BLOCKED

## Merge permission
BLOCKED.

This task is a documentation recovery publication only. PM must verify the resulting GitHub commit before documentation synchronization can PASS or Task 034 can be formally closed.
