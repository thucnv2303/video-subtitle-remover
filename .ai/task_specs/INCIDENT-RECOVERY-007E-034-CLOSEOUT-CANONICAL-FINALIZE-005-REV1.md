# PM Execution Spec

## 0. HARD EXECUTION CONTRACT

Task ID: `INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005-REV1`
Mode: `INCIDENT / DETERMINISTIC BYTE-PRESERVING DOC FINALIZATION`
Executor: Anti
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`
PR: `#14`
Reviewed application source SHA: `ea9521f6fe957e24e49cc5d090e275511d91141d`

This spec supersedes failed `INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005`.
Do not execute Finalize-004 or Finalize-005 again.

ANTI MUST NOT EDIT CANONICAL TEXT MANUALLY.
ANTI MUST NOT INVENT A REPAIR COMMAND.
ANTI MUST ONLY RUN THE COMMANDS OR COMMAND CLASSES EXPLICITLY AUTHORIZED HERE.

On the first unexpected result, failed command, failed assertion, dirty path, moved remote head, helper non-zero exit, unexpected diff, or scope expansion:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

## 1. Why Finalize-005 stopped

Finalize-005 correctly stopped before any write because the PM helper had an incorrect malformed-text precondition.

Direct GitHub byte evidence now establishes that the malformed owner fragment in the canonical blobs is not a literal backslash plus `task`. It is an actual TAB byte (`0x09`) followed by `ask 34 đã oke`.

The corrected helper expresses that byte sequence explicitly as:

```python
MALFORMED_OWNER_FRAGMENT = "\t" + "ask 34 đã oke"
```

This REV1 changes only the PM helper/spec execution basis. It does not change the accepted Owner result or application source identity.

## 2. Objective

Publish one narrow documentation-only commit that makes the current 034-REV2 canonical state agree with the accepted Owner PASS while preserving existing CRLF/LF counts.

Required resulting changes:

### `.ai/current_state.md`
- top status: `WAITING_PM_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`
- current Owner observation: `Owner reported on 2026-08-07: task 34 đã oke`
- current Owner retest: `PASS`
- top Owner gate: `PASS`
- top Documentation gate: `WAITING_PM_VERIFICATION`
- lower 034-REV2 Owner evidence: exact plain text `task 34 đã oke`, with no TAB+`ask` malformed fragment

### `.ai/task_current.md`
- preserve Task ID 034-REV2, Status COMPLETED, source SHA, Automated PASS, Code review PASS, Owner PASS, Documentation WAITING_PM_VERIFICATION, Merge BLOCKED
- replace malformed TAB+`ask 34 đã oke` fragment with exact `task 34 đã oke`

### `.ai/handoff.md`
- current review-ancestry Owner observation becomes `Owner reported on 2026-08-07: task 34 đã oke`
- current Owner manual verification remains PASS with exact plain-text `task 34 đã oke`
- Documentation remains `WAITING_PM_VERIFICATION`
- Merge remains BLOCKED

### `.ai/qa_checklist.md`
Read/verify only. Do not modify. Existing 034-REV2 section already records Owner overall PASS and three checked Owner items.

## 3. Verified immutable input blobs

The canonical files were not changed by failed Finalize-005. Required exact input Git blob SHAs remain:

- `.ai/current_state.md`: `97284e8eb0ee97d9913cfe0125ca401db6997647`
- `.ai/task_current.md`: `0b797429fae3a9966abab44fc6beb82bf7a12fb7`
- `.ai/handoff.md`: `f4af5f943ab1f54b2bc87b3a1e7fa4aff6c77ddd`
- `.ai/qa_checklist.md`: `54903913a2e5862297847e23328b0b6af9a36d2e`

Corrected PM helper:

`.ai/task_specs/tools/finalize_034_rev2_005_rev1.py`

Expected helper Git blob SHA:

`5b7c9b96e281ce0cdafb89c0d6e396f68b8771d6`

The helper:
- validates all three canonical input blob SHAs before any write;
- validates exact match counts before any write;
- uses explicit TAB+`ask` malformed fragment matching;
- computes all transformations before any write;
- verifies CRLF and LF counts are unchanged;
- verifies the malformed TAB+`ask 34 đã oke` fragment is absent after transformation;
- writes only the three authorized canonical files.

## 4. Remote-only authority

Run:

```powershell
git fetch origin
```

Read ACTIVE directly from remote:

```powershell
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/ACTIVE.md"
```

ACTIVE must point exactly to this task/spec/helper.

Then read this entire spec directly from the same remote ref:

```powershell
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005-REV1.md"
```

Do not use local ACTIVE/spec copies as authority.

If mismatch or missing:
`STOP — REMOTE EXECUTION AUTHORITY MISMATCH`

## 5. Capture execution basis

Run:

```powershell
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Call the result `EXECUTION_BASE_HEAD`.

Verify reviewed source ancestry:

```powershell
git merge-base --is-ancestor ea9521f6fe957e24e49cc5d090e275511d91141d EXECUTION_BASE_HEAD
```

It must exit 0.

Inspect paths after reviewed source:

```powershell
git diff --name-only ea9521f6fe957e24e49cc5d090e275511d91141d EXECUTION_BASE_HEAD
```

Every path must be under `.ai/`. If any application source/test/dependency path appears:

`STOP — REVIEWED SOURCE SUPERSEDED`

## 6. New isolated worktree only

Approved path:

`E:\Project AI\_closeout\034-owner-pass-finalize-005-rev1`

First:

```powershell
Test-Path "E:\Project AI\_closeout\034-owner-pass-finalize-005-rev1"
```

It must return `False`.

Do not touch, remove, clean, repair, or reuse any previous worktree, including:

- `E:\Project AI\_closeout\034-owner-pass-finalize-005`
- `E:\Project AI\_closeout\034-owner-pass-finalize-004`
- `E:\Project AI\_closeout\034-owner-pass-recovery`
- `E:\Project AI\_closeout\034-owner-pass-churn-fix`
- `E:\Project AI\video-subtitle-remover-recovery021`
- `E:\Project AI\Video-sub-remove`

Create exactly:

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-owner-pass-finalize-005-rev1" EXECUTION_BASE_HEAD
Set-Location "E:\Project AI\_closeout\034-owner-pass-finalize-005-rev1"
$PWD.Path
git rev-parse HEAD
git status --short
```

Path must match, HEAD must equal `EXECUTION_BASE_HEAD`, status must be empty.
Otherwise:

`STOP — REV1 WORKTREE NOT CLEAN`

## 7. Exact blob preflight

Run exactly:

```powershell
git hash-object .ai/current_state.md
git hash-object .ai/task_current.md
git hash-object .ai/handoff.md
git hash-object .ai/qa_checklist.md
git hash-object .ai/task_specs/tools/finalize_034_rev2_005_rev1.py
```

Outputs must exactly match Section 3.

If any differs:

`STOP — REV1 BYTE BASIS MISMATCH`

Do not run the helper.

## 8. Run corrected PM helper exactly once

Run exactly:

```powershell
python .ai/task_specs/tools/finalize_034_rev2_005_rev1.py
```

Run it ONCE only.

If exit code is non-zero:

`STOP — PM BYTE PATCH REV1 FAILED`

Do not run it again. Do not repair files. Do not edit manually.

## 9. Verification before staging

Only after helper exit 0, run:

```powershell
git status --short
git diff --name-status
git diff --numstat
git -c core.whitespace=cr-at-eol diff --check
git diff -- .ai/current_state.md .ai/task_current.md .ai/handoff.md
```

Acceptance:
- exact modified set = `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md` only;
- `.ai/qa_checklist.md` unchanged;
- no task-spec/helper changes in the worktree;
- narrow semantic diff only;
- no full-file churn;
- whitespace check empty.

Also run these exact text checks:

```powershell
git grep -n "WAITING_PM_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2" -- .ai/current_state.md
git grep -n "Owner reported on 2026-08-07: task 34 đã oke" -- .ai/current_state.md .ai/handoff.md
git grep -n "direct Owner report on 2026-08-07: task 34 đã oke" -- .ai/current_state.md .ai/task_current.md .ai/handoff.md
git grep -n "Documentation synchronization: WAITING_PM_VERIFICATION" -- .ai/current_state.md .ai/task_current.md .ai/handoff.md
```

If required current text is absent, or diff expands:

`STOP — REV1 ACCEPTANCE FAILED`

## 10. Stage exact files only

Run exactly:

```powershell
git add .ai/current_state.md .ai/task_current.md .ai/handoff.md
git diff --cached --name-only
git diff --cached --numstat
git -c core.whitespace=cr-at-eol diff --cached --check
```

Cached file set must be exactly the three canonical docs.

## 11. Remote-move guard

Run:

```powershell
git fetch origin
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Remote head must still equal captured `EXECUTION_BASE_HEAD`.

If not:

`STOP — REV1 BASE MOVED`

## 12. Commit and push

Create exactly one docs-only commit:

```powershell
git commit -m "docs: finalize 034-REV2 owner PASS canonical state rev1"
```

Then push fast-forward only:

```powershell
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

No force flags.

After push:

```powershell
git rev-parse HEAD
git fetch origin
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
git status --short
```

Local HEAD and remote HEAD must match; status must be empty.

Do not update PR body. Project Manager will update PR state after direct GitHub verification.

## 13. STRICT FORBIDDEN ACTIONS

Do not:
- manually edit any canonical file;
- run any editor replacement action;
- create another Python/Node/PowerShell repair script;
- run the helper more than once;
- use `Set-Content`;
- use `Out-File`;
- run CRLF/LF conversion;
- use formatter/Prettier;
- use `git reset`;
- use `git restore`;
- use `git checkout`;
- use `git clean`;
- use `git revert`;
- use `git rebase`;
- use `git commit --amend`;
- use `git worktree remove`;
- use `git add .` or `git add -A`;
- force push;
- modify `.ai/qa_checklist.md`;
- modify ACTIVE/spec/helper;
- modify application source/tests/dependencies;
- start Task 035/036;
- merge PR #14.

A command not authorized by this spec is not implicitly permitted.

## 14. Required FINAL REPORT

Return:

- Active spec read directly from remote ref: YES/NO
- Task ID
- `EXECUTION_BASE_HEAD`
- Isolated worktree path
- Initial HEAD
- Initial `git status --short`
- Reviewed-source ancestry result
- Post-source changed paths
- Five preflight `git hash-object` outputs
- PM helper command exit code and full helper output
- Exact files modified
- `git diff --name-status`
- `git diff --numstat`
- whitespace check result
- Required text-check outputs
- `git diff --cached --name-only`
- `git diff --cached --numstat`
- cached whitespace check result
- Documentation commit SHA
- Remote HEAD after push
- Final `git status --short`
- Application source changed: NONE
- Tests changed: NONE
- `.ai/qa_checklist.md` changed: NO
- Documentation synchronization: `WAITING_PM_VERIFICATION`
- Task 035/036 started: NO
- Forbidden commands used: NONE
- Merge: BLOCKED

## 15. Merge permission

BLOCKED.

Only Project Manager may mark Documentation synchronization PASS and decide the next product task after verifying the published GitHub commit.
