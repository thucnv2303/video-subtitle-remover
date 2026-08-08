# PM Execution Spec

## Task
INCIDENT-RECOVERY-007E-034-CLOSEOUT-SCOPE-001

## Status
AUTHORIZED_FOR_EXECUTION

## Mode
INCIDENT / READ-ONLY EVIDENCE CAPTURE

## Objective
Determine the exact local repository impact of the unapproved broad normalization command run during the 034-REV2 Owner-PASS documentation closeout before any commit, push, repair, restore, reset, or further documentation edit is allowed.

The closeout report claims only these four files were modified:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/qa_checklist.md`

However, execution also ran a Python command that iterated over `glob.glob('.ai/*.md')` and rewrote every matched file with LF line endings. That action is broader than the approved four-file closeout scope, so the true local dirty-tree state must be captured before proceeding.

## GitHub basis
Repository: `thucnv2303/video-subtitle-remover`

PR: `#14`

Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Remote HEAD before this incident spec: `cb03b20447e0a5127d66e32990427f3848ebb200`

Reviewed application source SHA: `ea9521f6fe957e24e49cc5d090e275511d91141d`

Owner result: PASS — direct Owner report on 2026-08-07: `task 34 đã oke`

Documentation synchronization: NOT COMPLETE

Merge: BLOCKED

## Incident trigger
During the closeout task Anti ran a broad filesystem rewrite:

```text
python -c "import sys; import glob; ... for f in glob.glob('.ai/*.md'): ... replace(b'\r\n', b'\n') ..."
```

This touched the entire `.ai/*.md` set at the filesystem level, not only the four approved closeout files. No commit or push was made, so GitHub remains unchanged, but local scope is now uncertain.

## Allowed actions
Read-only inspection only. Do not alter the working tree or index.

1. `git fetch origin`
2. Read `.ai/task_specs/ACTIVE.md` and this spec from `origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`.
3. From the exact local worktree containing the staged 034 closeout changes, capture raw output for:

```powershell
$PWD.Path
git branch --show-current
git rev-parse HEAD
git status --short
git diff --name-status
git diff --cached --name-status
git diff --numstat
git diff --cached --numstat
git diff --check
git diff --cached --check
```

4. Capture whether any path outside the approved four closeout files appears in either staged or unstaged tracked changes.
5. Capture the exact staged file set and exact unstaged file set.
6. Do not modify anything to make the evidence cleaner.

## Approved four-file closeout scope
Only these paths are allowed to contain intentional closeout content changes:
- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/qa_checklist.md`

`.ai/bugs.md` is allowed to remain unchanged because no new bug was reported by the Owner.

## Forbidden actions
Do NOT:
- edit any file;
- run formatting or line-ending conversion scripts;
- run `Set-Content`, Python rewrite scripts, Prettier, formatters, or broad patch scripts;
- stage or unstage anything;
- commit;
- push;
- update PR #14 body;
- checkout/switch/reset/restore/clean;
- delete or recreate files;
- create another worktree in this evidence task;
- modify application source or tests;
- start Task 035 or Task 036;
- merge.

## Acceptance criteria
PASS only if raw evidence proves the actual local staged and unstaged tracked-file sets and there is no ambiguity about whether the broad normalization changed files outside the approved four-file closeout scope.

If any additional `.ai` file is modified, report it exactly. Do not repair it.

## Stop conditions
`STOP — WRONG WORKTREE` if the inspected worktree is not the one containing the staged 034 closeout changes.

`STOP — SCOPE EXPANDED` if any tracked path outside the approved four files is modified or staged.

`STOP — HEAD MOVED LOCALLY` if the local HEAD is not the closeout execution basis expected from the prior report and this cannot be explained without modifying state.

`STOP — EVIDENCE MUTATION REQUIRED` if any requested evidence would require changing repository state.

## Required final report
Return raw outputs in this order:

1. `$PWD.Path`
2. `git branch --show-current`
3. `git rev-parse HEAD`
4. `git status --short`
5. `git diff --name-status`
6. `git diff --cached --name-status`
7. `git diff --numstat`
8. `git diff --cached --numstat`
9. `git diff --check`
10. `git diff --cached --check`
11. Approved four-file scope only: YES/NO
12. Extra modified paths: NONE or exact list
13. Files edited during this evidence task: NONE
14. Staging changed during this evidence task: NO
15. Commits created: NONE
16. Push performed: NO
17. Merge: BLOCKED

## Merge permission
BLOCKED.

This incident task is evidence capture only. It does not authorize closeout repair, commit, push, Task 035/036, or merge.
