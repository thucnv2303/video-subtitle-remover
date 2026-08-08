# PM Execution Spec — RECOVERY-007E-034-MERGE-READINESS-KNOWLEDGE-RECONCILE-007-REV1

Status: ACTIVE WHEN REFERENCED BY REMOTE `.ai/task_specs/ACTIVE.md`
Mode: DETERMINISTIC KNOWLEDGE-ONLY RECONCILIATION / OWNER SECURITY CLARIFICATION

## 0. Hard execution contract

This task is deterministic. Anti is an executor, not a designer.

On the first failed command, failed assertion, unexpected diff, basis mismatch, helper failure, or remote-head move:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

Do not invent an alternative edit, script, formatter, recovery path, or git command.

Only commands explicitly required by this spec are authorized.

## 1. Why REV1 exists

Task `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2` application execution, automated verification, code review, Owner overall app verification, Finalize-005-REV1 correction, and Closeout-006-REV1 publication are accepted.

Accepted Task 034 closeout commit:
`ab572faccd205930e9ad7466e65436d99be17078`

The prior Reconcile-007 spec treated historical DeepSeek key rotation as an unresolved merge blocker.

After that spec was authored, Owner provided new direct evidence on 2026-08-08:

- the screenshot shared with PM had key material redacted before sharing;
- therefore the shared evidence does not establish disclosure of a usable DeepSeek credential;
- the historical clear-text Settings UI remains a real security defect, but its source fix is implemented;
- key rotation must NOT be represented as a required merge gate based on the shared screenshot.

Because this new Owner evidence changes the required canonical outcome, the prior Reconcile-007 route is superseded and must not be executed.

The remaining knowledge reconciliation is:

1. `.ai/current_state.md` lower current `034-REV2` block still says `Status: WAITING_PM_VERIFICATION` although the top status and accepted gates are complete.
2. `.ai/qa_checklist.md` has an older `034` Owner Verification block that still looks current and says WAITING; it must be labeled historical/superseded without checking any previously unobserved boxes.
3. `.ai/bugs.md` still leaves BUG-013 in candidate/Owner-retest-not-started state although 034-REV2 directly resolved that provider/model synchronization defect with accepted automated + overall Owner PASS evidence.
4. BUG-010 must be recorded accurately: source defect fixed; Owner confirms the screenshot shared with PM was redacted; shared evidence does not establish usable credential exposure; no key-rotation merge blocker.

No application source defect is introduced by this audit. No Owner app retest is required.

## 2. Repository / remote authority

Repository:
`thucnv2303/video-subtitle-remover`

Review branch:
`review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Reviewed application source:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Accepted Task 034 closeout commit:
`ab572faccd205930e9ad7466e65436d99be17078`

Execution authority is remote-only.

Required start:

```powershell
git fetch origin
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/ACTIVE.md"
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/RECOVERY-007E-034-MERGE-READINESS-KNOWLEDGE-RECONCILE-007-REV1.md"
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
```

Record the last output as `EXECUTION_BASE_HEAD`.

Local ACTIVE/spec copies are not authority.

## 3. Required preflight

Verify reviewed source remains ancestor:

```powershell
git merge-base --is-ancestor "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"
```

Verify all paths changed after the reviewed source are under `.ai/`:

```powershell
git diff --name-only "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"
```

If any application source, test, dependency, package, or build path appears:

`STOP — REVIEWED SOURCE IDENTITY MOVED`

New isolated worktree path:

`E:\Project AI\_closeout\034-merge-readiness-knowledge-007-rev1`

Check it does not exist:

```powershell
Test-Path "E:\Project AI\_closeout\034-merge-readiness-knowledge-007-rev1"
```

If TRUE:

`STOP — ISOLATED WORKTREE PATH ALREADY EXISTS`

Create it:

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-merge-readiness-knowledge-007-rev1" "$EXECUTION_BASE_HEAD"
cd "E:\Project AI\_closeout\034-merge-readiness-knowledge-007-rev1"
$PWD.Path
git rev-parse HEAD
git status --short
```

Required: exact path, HEAD equals `EXECUTION_BASE_HEAD`, status empty.

## 4. Exact input blob gate

Before helper execution, these blobs must match exactly:

- `.ai/current_state.md` = `c4cbd815a0b0a9c378708b897b5a6671c2fff1d8`
- `.ai/task_current.md` = `77b95dafc84e5f4e29649d5d851fd5ce94182a9d`
- `.ai/handoff.md` = `2d7e7bd83e00bac9ba6c6a5bf4ab0fa2690e5ef9`
- `.ai/qa_checklist.md` = `54903913a2e5862297847e23328b0b6af9a36d2e`
- `.ai/bugs.md` = `b11c15cfb5c0e4f19a8330b09923fa1f9bca7cde`
- `.ai/task_specs/tools/reconcile_034_merge_readiness_007_rev1.py` = `9a40f590c821a7dc9ed6ab54cd0a8cc2b33dea78`

Run exactly:

```powershell
git hash-object .ai/current_state.md
git hash-object .ai/task_current.md
git hash-object .ai/handoff.md
git hash-object .ai/qa_checklist.md
git hash-object .ai/bugs.md
git hash-object .ai/task_specs/tools/reconcile_034_merge_readiness_007_rev1.py
```

Any mismatch:

`STOP — MERGE-READINESS REV1 BASIS MISMATCH`

## 5. Allowed files

Only these three files may change:

- `.ai/current_state.md`
- `.ai/qa_checklist.md`
- `.ai/bugs.md`

Read-only and forbidden to modify:

- `.ai/task_current.md`
- `.ai/handoff.md`
- `.ai/task_specs/**`
- `.ai/evidence/**`
- `.ai/decisions.md`
- `.ai/architecture.md`
- `.ai/api_contracts.md`
- all application source
- all tests
- package/dependency/build files

## 6. Authorized edit mechanism

Anti must not manually edit any canonical file.

Run a syntax gate first:

```powershell
python -m py_compile .ai/task_specs/tools/reconcile_034_merge_readiness_007_rev1.py
```

If exit code is non-zero:

`STOP — REV1 HELPER SYNTAX INVALID`

Do not execute the helper after a syntax-gate failure.

If syntax gate passes, run the PM helper exactly once:

```powershell
python .ai/task_specs/tools/reconcile_034_merge_readiness_007_rev1.py
```

If exit code is non-zero:

`STOP — MERGE-READINESS RECONCILE REV1 HELPER FAILED`

Do not run it again. Do not manually repair.

The helper is designed to:

- preserve every existing line ending;
- validate all transformations before any write;
- require exact input blobs;
- correct the lower 034-REV2 status to `COMPLETED — PM VERIFIED`;
- replace the incorrect credential-compromise/rotation wording with the Owner's 2026-08-08 screenshot-redaction clarification;
- keep the historical clear-text-key UI defect as a source-fixed security defect;
- mark the old 034 QA block historical/superseded without checking unobserved items;
- update BUG-013 as resolved by 034-REV2 using only accepted evidence;
- update BUG-010 without claiming that Owner rotated a key.

## 7. Forbidden operations

Do not use:

- manual editor changes
- `Set-Content`
- `Out-File`
- PowerShell/Python/Node rewrite scripts other than the exact PM helper
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

## 8. Pre-stage verification

Run:

```powershell
git status --short
git diff --name-status
git diff --numstat
git -c core.whitespace=cr-at-eol diff --check
```

Required changed-file set exactly:

```text
.ai/bugs.md
.ai/current_state.md
.ai/qa_checklist.md
```

Expected diff is narrow. Any hundreds-line churn:

`STOP — UNEXPECTED DOCUMENT CHURN`

Required text checks:

```powershell
git grep -n "Status: COMPLETED — PM VERIFIED" -- .ai/current_state.md
git grep -n "Documentation synchronization: PASS" -- .ai/current_state.md .ai/task_current.md
git grep -n "key rotation is not a merge blocker on this evidence" -- .ai/current_state.md
git grep -n "Historical / Superseded: RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034 Owner Verification" -- .ai/qa_checklist.md
git grep -n "034-REV2 QA" -- .ai/qa_checklist.md
git grep -n "NO KEY-ROTATION MERGE BLOCKER" -- .ai/bugs.md
git grep -n "RESOLVED BY 034-REV2" -- .ai/bugs.md
git grep -n "PASS (direct Owner report on 2026-08-07: task 34 đã oke)" -- .ai/handoff.md
```

Required semantics:

- current top Task 034 remains COMPLETED.
- lower current 034-REV2 becomes `COMPLETED — PM VERIFIED`.
- Automated PASS / Code Review PASS / Owner PASS / Documentation PASS remain unchanged.
- Owner evidence remains the accepted overall report; do not invent per-item Owner observations.
- security wording records only what Owner actually clarified: screenshot shared with PM was redacted before sharing.
- do NOT claim Owner revoked or rotated a key.
- shared screenshot evidence is no longer treated as proof of usable credential exposure or as a key-rotation merge blocker.
- old 034 QA block is clearly historical/superseded; its unchecked boxes remain unchecked.
- current 034-REV2 QA block remains unchanged.
- BUG-013 becomes resolved by 034-REV2 using accepted evidence.
- Merge remains BLOCKED pending explicit PM merge approval.

## 9. Stage gate

Stage exact files only:

```powershell
git add .ai/current_state.md .ai/qa_checklist.md .ai/bugs.md
git diff --cached --name-only
git diff --cached --numstat
git -c core.whitespace=cr-at-eol diff --cached --check
```

If cached set is not exactly the three allowed files:

`STOP — CACHED FILE SET NOT AUTHORIZED`

## 10. Remote-head guard

Before commit:

```powershell
git fetch origin
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
```

It must still equal `EXECUTION_BASE_HEAD`.

If not:

`STOP — SPEC BASE MOVED`

## 11. Commit and push

Exactly one commit:

```powershell
git commit -m "docs: reconcile 034 merge-readiness after owner security clarification"
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

## 12. Gate meaning after successful publication

If this task publishes exactly as specified:

- Task 034 application execution: PASS
- Automated verification: PASS
- Code review: PASS
- Owner manual app verification: PASS
- Documentation synchronization: WAITING_FINAL_PM_CONFIRMATION until PM verifies GitHub publication
- Confirmed credential-rotation blocker from shared screenshot: NONE
- Merge permission: BLOCKED pending explicit PM final merge-readiness approval
- Task 035/036: NOT AUTHORIZED

No Owner app retest is required.

## 13. FINAL REPORT schema

Return:

- Active spec read directly from remote ref: YES/NO
- Task ID
- EXECUTION_BASE_HEAD
- isolated worktree path
- initial HEAD/status
- reviewed-source ancestry result
- post-source changed paths
- six preflight blob hashes
- helper syntax-gate command and exit code
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
