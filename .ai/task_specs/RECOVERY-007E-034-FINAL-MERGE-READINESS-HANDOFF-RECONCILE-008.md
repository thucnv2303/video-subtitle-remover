# PM Execution Spec — RECOVERY-007E-034-FINAL-MERGE-READINESS-HANDOFF-RECONCILE-008

Status: ACTIVE WHEN REFERENCED BY REMOTE `.ai/task_specs/ACTIVE.md`
Mode: DETERMINISTIC KNOWLEDGE-ONLY HANDOFF RECONCILIATION

## 0. Hard execution contract

This task is deterministic. Anti is an executor, not a designer.

On the first failed command, failed assertion, unexpected diff, basis mismatch, helper failure, syntax failure, or remote-head move:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

Only commands explicitly required by this spec are authorized.
Do not invent an alternative edit, script, formatter, recovery path, or git command.

## 1. Why this task exists

Accepted Task 034 evidence at GitHub:

- reviewed application source: `ea9521f6fe957e24e49cc5d090e275511d91141d`
- application execution: PASS
- automated verification: PASS
- code review: PASS
- Owner overall app verification: PASS — direct Owner report on 2026-08-07: `task 34 đã oke`
- Closeout-006-REV1: PASS
- Reconcile-007-REV1 publication: PASS at `576cb8c84ae925570596c7ef4870033ea56fc3e6`
- `.ai/current_state.md`, `.ai/task_current.md`, `.ai/qa_checklist.md`, and `.ai/bugs.md` now reflect the accepted 034-REV2 state and Owner security clarification.

Final PM inspection found one remaining canonical conflict in `.ai/handoff.md`:

- the current top of handoff says Task 034 is `COMPLETED — PM VERIFIED`, Owner PASS, Documentation PASS, and merge waits only for explicit PM approval;
- but the generic `## Status` block lower in the same file still contains historical AI-Settings/PR-8-era lines saying the screenshot key is compromised and Owner must rotate it, plus `Owner manual verification: NOT STARTED`;
- those lines are stale historical context and conflict with the accepted current state and Owner clarification.

This task does NOT change product behavior or accepted Owner evidence. It only makes that handoff block explicitly historical and replaces the stale credential statement with the accepted 2026-08-08 redaction clarification.

## 2. Repository / remote authority

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Reviewed application source:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Accepted Reconcile-007-REV1 commit:
`576cb8c84ae925570596c7ef4870033ea56fc3e6`

Execution authority is remote-only.

Required start:

```powershell
git fetch origin
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/ACTIVE.md"
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/RECOVERY-007E-034-FINAL-MERGE-READINESS-HANDOFF-RECONCILE-008.md"
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
```

Record the last output as `EXECUTION_BASE_HEAD`.
Local ACTIVE/spec copies are not authority.

## 3. Required preflight

Verify reviewed source remains ancestor:

```powershell
git merge-base --is-ancestor "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"
```

Verify all paths changed after reviewed source are under `.ai/`:

```powershell
git diff --name-only "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"
```

If any application source, test, dependency, package, or build path appears:

`STOP — REVIEWED SOURCE IDENTITY MOVED`

New isolated worktree path:

`E:\Project AI\_closeout\034-final-merge-readiness-handoff-008`

Check it does not exist:

```powershell
Test-Path "E:\Project AI\_closeout\034-final-merge-readiness-handoff-008"
```

If TRUE:

`STOP — ISOLATED WORKTREE PATH ALREADY EXISTS`

Create it:

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-final-merge-readiness-handoff-008" "$EXECUTION_BASE_HEAD"
cd "E:\Project AI\_closeout\034-final-merge-readiness-handoff-008"
$PWD.Path
git rev-parse HEAD
git status --short
```

Required: exact path; HEAD equals `EXECUTION_BASE_HEAD`; status empty.

## 4. Exact input blob gate

These blobs must match exactly before helper execution:

- `.ai/current_state.md` = `f666ac1a2df9b0c3b0d0f264adb8ace84fe8c91a`
- `.ai/task_current.md` = `77b95dafc84e5f4e29649d5d851fd5ce94182a9d`
- `.ai/handoff.md` = `2d7e7bd83e00bac9ba6c6a5bf4ab0fa2690e5ef9`
- `.ai/qa_checklist.md` = `0f33f0533daa5660eed8db52e8c14f2c3cd75acf`
- `.ai/bugs.md` = `30ec90df1e31e251bf40cdc4ea7b1ee7d483470b`
- `.ai/task_specs/tools/reconcile_034_handoff_merge_readiness_008.py` = `0e4043370c400dd06449333d0fe2a61a4bbd6b8a`

Run exactly:

```powershell
git hash-object .ai/current_state.md
git hash-object .ai/task_current.md
git hash-object .ai/handoff.md
git hash-object .ai/qa_checklist.md
git hash-object .ai/bugs.md
git hash-object .ai/task_specs/tools/reconcile_034_handoff_merge_readiness_008.py
```

Any mismatch:

`STOP — HANDOFF RECONCILE 008 BASIS MISMATCH`

## 5. Allowed file

Only this file may change:

- `.ai/handoff.md`

Read-only / forbidden to modify:

- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/qa_checklist.md`
- `.ai/bugs.md`
- `.ai/task_specs/**`
- `.ai/evidence/**`
- `.ai/decisions.md`
- `.ai/architecture.md`
- `.ai/api_contracts.md`
- all application source
- all tests
- package/dependency/build files

## 6. Mandatory helper syntax gate

Before helper execution run exactly:

```powershell
python -m py_compile .ai/task_specs/tools/reconcile_034_handoff_merge_readiness_008.py
```

If non-zero:

`STOP — HANDOFF RECONCILE 008 HELPER SYNTAX INVALID`

Do not run the helper.

## 7. Authorized edit mechanism

Run the PM helper exactly once:

```powershell
python .ai/task_specs/tools/reconcile_034_handoff_merge_readiness_008.py
```

If exit code is non-zero:

`STOP — HANDOFF RECONCILE 008 HELPER FAILED`

Do not run it again. Do not manually repair.

The helper must only:

- preserve all existing line endings;
- change `## Status` in the historical AI-Settings/PR-8 block to `## Historical Status — AI Settings / PR #8 lineage`;
- replace the stale `COMPROMISED / Owner must rotate key` sentence with the accepted Owner 2026-08-08 screenshot-redaction clarification;
- relabel the historical `Owner manual verification: NOT STARTED` line so it cannot be read as the current 034-REV2 gate;
- leave current Task034 top status, Owner PASS, Documentation PASS, Next permitted action, source SHA, and Merge BLOCKED unchanged.

## 8. Forbidden operations

Do not use:

- manual editor changes
- `Set-Content`
- `Out-File`
- any rewrite script other than the exact PM helper
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

Do not touch any prior Finalize/Closeout/Reconcile worktree.
Do not start Task 035 or Task 036.

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
.ai/handoff.md
```

Expected diff is exactly three narrow line replacements. Any broad churn:

`STOP — UNEXPECTED DOCUMENT CHURN`

Required text checks:

```powershell
git grep -n "COMPLETED — PM VERIFIED" -- .ai/handoff.md
git grep -n "PASS (direct Owner report on 2026-08-07: task 34 đã oke)" -- .ai/handoff.md
git grep -n "## Documentation synchronization" -- .ai/handoff.md
git grep -n "Historical Status — AI Settings / PR #8 lineage" -- .ai/handoff.md
git grep -n "redacted before sharing" -- .ai/handoff.md
git grep -n "Historical Owner manual verification at that earlier stage: NOT STARTED" -- .ai/handoff.md
git grep -n "Project Manager performs the final merge-readiness decision for PR #14" -- .ai/handoff.md
git grep -n "Merge permission" -- .ai/handoff.md
```

Required semantics:

- current Task034 remains COMPLETED / PM VERIFIED;
- current Owner evidence remains the accepted overall report only;
- Documentation synchronization remains PASS;
- historical PR-8/AI-Settings status is visibly historical;
- no current claim says Owner must rotate a key;
- no claim says Owner revoked/rotated a key;
- shared screenshot evidence is not treated as usable credential exposure;
- Merge remains BLOCKED pending explicit PM final merge-readiness approval.

## 10. Stage gate

Stage exact file only:

```powershell
git add .ai/handoff.md
git diff --cached --name-only
git diff --cached --numstat
git -c core.whitespace=cr-at-eol diff --cached --check
```

If cached file set is not exactly `.ai/handoff.md`:

`STOP — CACHED FILE SET NOT AUTHORIZED`

## 11. Remote-head guard

Before commit:

```powershell
git fetch origin
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
```

It must still equal `EXECUTION_BASE_HEAD`.

If not:

`STOP — SPEC BASE MOVED`

## 12. Commit and push

Exactly one commit:

```powershell
git commit -m "docs: reconcile final 034 handoff merge-readiness state"
```

Push fast-forward only:

```powershell
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

No force push.

Post-push:

```powershell
git rev-parse HEAD
git fetch origin
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
git status --short
```

Local and remote HEAD must match; final status must be empty.

## 13. Gate meaning after successful publication

If this task publishes exactly as specified:

- Task 034 application execution: PASS
- Automated verification: PASS
- Code review: PASS
- Owner manual app verification: PASS
- Documentation synchronization: WAITING_FINAL_PM_CONFIRMATION until PM verifies this GitHub commit
- confirmed credential-rotation blocker from shared screenshot: NONE
- Merge permission: BLOCKED pending explicit PM final merge-readiness approval
- Task 035/036: NOT AUTHORIZED

No Owner app retest is required.

## 14. FINAL REPORT schema

Return:

- Active spec read directly from remote ref: YES/NO
- Task ID
- EXECUTION_BASE_HEAD
- isolated worktree path
- initial HEAD/status
- reviewed-source ancestry result
- post-source changed paths
- six preflight blob hashes
- helper syntax-gate exit code
- PM helper exit code and full output
- exact modified files
- `git diff --name-status`
- `git diff --numstat`
- whitespace check
- required text-check outputs
- cached name-only/numstat/whitespace
- documentation commit SHA
- remote HEAD after push
- final status
- application source changed: YES/NO
- tests changed: YES/NO
- task specs/helper changed by executor: YES/NO
- Task 034 current gates
- credential-rotation blocker from shared screenshot: NONE
- Task 035/036 started: YES/NO
- forbidden command used: YES/NO
- Merge: BLOCKED

Anti must not claim final PM PASS or merge authorization.
