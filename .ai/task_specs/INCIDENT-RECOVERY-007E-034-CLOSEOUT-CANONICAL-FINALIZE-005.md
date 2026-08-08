# PM Execution Spec

## 0. HARD EXECUTION CONTRACT

Task ID: `INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005`
Mode: `INCIDENT / DETERMINISTIC BYTE-PRESERVING DOC FINALIZATION`
Executor: Anti
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`
PR: `#14`
Reviewed application source SHA: `ea9521f6fe957e24e49cc5d090e275511d91141d`

This task supersedes the failed Finalize-004 execution. Do not execute Finalize-004 again.

ANTI MUST NOT EDIT TEXT MANUALLY IN THIS TASK.
ANTI MUST NOT INVENT A REPAIR COMMAND.
ANTI MUST ONLY RUN THE COMMANDS/COMMAND CLASSES EXPLICITLY AUTHORIZED BELOW.

On the first unexpected result, failed command, failed assertion, dirty path, moved remote head, or helper non-zero exit:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

## 1. Objective

Publish one narrow documentation-only commit that makes the current 034-REV2 canonical state consistent with the accepted Owner PASS while preserving the existing CRLF bytes everywhere except the exact semantic text replacements.

This task does not reopen application source/test review and does not authorize Task 035/036 or merge.

## 2. Verified GitHub basis

Direct PM GitHub verification before authoring this spec established:

- PR #14 is open and Draft.
- Review branch is `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`.
- Reviewed application source remains `ea9521f6fe957e24e49cc5d090e275511d91141d`.
- Owner result remains PASS — direct Owner report on 2026-08-07: `task 34 đã oke`.
- Finalize-004 produced no accepted commit/push and its damaged local worktree is not a publication source.
- Canonical files at the verified remote basis have these exact Git blob SHAs:
  - `.ai/current_state.md`: `97284e8eb0ee97d9913cfe0125ca401db6997647`
  - `.ai/task_current.md`: `0b797429fae3a9966abab44fc6beb82bf7a12fb7`
  - `.ai/handoff.md`: `f4af5f943ab1f54b2bc87b3a1e7fa4aff6c77ddd`
  - `.ai/qa_checklist.md`: `54903913a2e5862297847e23328b0b6af9a36d2e`
- PM-authored deterministic helper:
  - `.ai/task_specs/tools/finalize_034_rev2_005.py`
  - expected Git blob SHA: `bbdf5817d2afa999350dfb9879659807ae217e29`

The helper performs byte-level exact replacements, validates expected input blob SHAs before any write, validates exact match counts, and asserts CRLF/LF counts do not change.

## 3. Remote-only authority

First run:

```powershell
git fetch origin
```

Read ACTIVE directly from the remote review ref:

```powershell
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/ACTIVE.md"
```

Confirm ACTIVE points exactly to this spec.

Then read this full spec directly from the same remote ref:

```powershell
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-005.md"
```

Local ACTIVE/spec copies are not authority.

If remote ACTIVE is missing: `STOP — ACTIVE SPEC NOT AVAILABLE ON REMOTE`.
If ACTIVE points elsewhere: `STOP — ACTIVE SPEC MISMATCH`.
If this spec is missing: `STOP — ACTIVE SPEC TARGET MISSING`.

## 4. Approved isolated worktree

Use exactly:

`E:\Project AI\_closeout\034-owner-pass-finalize-005`

If that path already exists:

`STOP — FINALIZE-005 WORKTREE EXISTS`

Do not delete, remove, repair, clean, or reuse it.

Do not use or mutate any prior worktree, including:

- `E:\Project AI\video-subtitle-remover-recovery021`
- `E:\Project AI\_closeout\034-owner-pass-recovery`
- `E:\Project AI\_closeout\034-owner-pass-churn-fix`
- `E:\Project AI\_closeout\034-owner-pass-finalize-004`
- `E:\Project AI\Video-sub-remove`

The main repository location may be used only as the metadata-capable location from which `git fetch`, remote `git show`, `git rev-parse`, and `git worktree add` are run. Do not edit its files.

## 5. Allowed command whitelist

Only these command classes are authorized:

```text
git fetch origin
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:<approved path>"
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
git merge-base --is-ancestor <sha> <sha>
Test-Path "E:\Project AI\_closeout\034-owner-pass-finalize-005"
git worktree add --detach "E:\Project AI\_closeout\034-owner-pass-finalize-005" <EXECUTION_BASE_HEAD>
Set-Location "E:\Project AI\_closeout\034-owner-pass-finalize-005"
$PWD.Path
git rev-parse HEAD
git status --short
git hash-object <exact approved path>
python .ai/task_specs/tools/finalize_034_rev2_005.py
git diff --name-status
git diff --numstat
git diff -- <exact approved docs>
git -c core.whitespace=cr-at-eol diff --check
git grep -n <exact verification pattern> -- <exact approved docs>
git add .ai/current_state.md .ai/task_current.md .ai/handoff.md
git diff --cached --name-only
git diff --cached --numstat
git -c core.whitespace=cr-at-eol diff --cached --check
git diff --cached -- .ai/current_state.md .ai/task_current.md .ai/handoff.md
git commit -m "docs: finalize 034-REV2 owner PASS canonical state"
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

No other write/edit command is authorized.

`git -c core.whitespace=cr-at-eol diff --check` is intentionally used instead of plain `git diff --check` because these canonical files are committed with CRLF. The temporary `-c` flag makes Git treat the existing CR at EOL as an accepted line ending without changing repository config or file bytes. Do not run `git config`.

## 6. Forbidden actions

Strictly forbidden:

- manual editor modifications;
- `Set-Content`, `Out-File`, shell redirection into canonical files;
- any Python/Node/PowerShell script other than the exact PM-authored helper above;
- modifying the PM helper;
- reset/restore/checkout/clean/revert/rebase/amend;
- `git worktree remove` in any form;
- force push or force-with-lease;
- line-ending conversion;
- formatter/Prettier;
- wildcard rewrite/delete;
- `git add .` or `git add -A`;
- application source/test/dependency changes;
- `.ai/qa_checklist.md` modification;
- `.ai/task_specs/*` modification by Anti;
- PR body editing by Anti in this task;
- Task 035/036 activation;
- merge.

## 7. Preflight

After reading remote ACTIVE/spec, capture:

```powershell
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Call the result `EXECUTION_BASE_HEAD`.

Verify reviewed application source ancestry:

```powershell
git merge-base --is-ancestor ea9521f6fe957e24e49cc5d090e275511d91141d EXECUTION_BASE_HEAD
```

Must exit 0.

Verify the new worktree path does not exist, then create the detached worktree at `EXECUTION_BASE_HEAD` and enter it.

Required initial checks:

```powershell
$PWD.Path
git rev-parse HEAD
git status --short
```

Requirements:
- path is exactly the approved Finalize-005 path;
- HEAD equals `EXECUTION_BASE_HEAD`;
- status is empty.

Then verify exact input blobs:

```powershell
git hash-object .ai/current_state.md
git hash-object .ai/task_current.md
git hash-object .ai/handoff.md
git hash-object .ai/qa_checklist.md
git hash-object .ai/task_specs/tools/finalize_034_rev2_005.py
```

They must equal, in order:

```text
97284e8eb0ee97d9913cfe0125ca401db6997647
0b797429fae3a9966abab44fc6beb82bf7a12fb7
f4af5f943ab1f54b2bc87b3a1e7fa4aff6c77ddd
54903913a2e5862297847e23328b0b6af9a36d2e
bbdf5817d2afa999350dfb9879659807ae217e29
```

Any mismatch:

`STOP — FINALIZE-005 BASIS MISMATCH`

Do not attempt to adapt the helper.

## 8. Exact implementation

Run exactly once:

```powershell
python .ai/task_specs/tools/finalize_034_rev2_005.py
```

If exit code is non-zero:

`STOP — PM BYTE PATCH FAILED`

Do not run it again. Do not repair files.

The helper is the only authorized canonical-file writer for this task.

## 9. Required resulting semantics

### `.ai/current_state.md`
Current 034-REV2 section must show:

- Status: `WAITING_PM_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`
- Owner observation: `Owner reported on 2026-08-07: task 34 đã oke`
- Owner retest: `PASS`
- top Owner gate: `PASS`
- top Documentation gate: `WAITING_PM_VERIFICATION`
- Merge: `BLOCKED`
- lower 034-REV2 Owner evidence contains plain `task 34 đã oke`, no leading backslash.

### `.ai/task_current.md`
Current task stays 034-REV2 / COMPLETED with Automated PASS, Code review PASS, Owner manual verification PASS, Documentation `WAITING_PM_VERIFICATION`, Merge BLOCKED. The Owner statement must be plain `task 34 đã oke`, no leading backslash.

### `.ai/handoff.md`
Active task stays 034-REV2 `(WAITING_PM_VERIFICATION)`. Owner manual app verification stays PASS. Documentation stays `WAITING_PM_VERIFICATION`. Merge stays BLOCKED. Current Owner wording must be the accepted direct report with no leading backslash.

### `.ai/qa_checklist.md`
Must remain byte-identical at blob `54903913a2e5862297847e23328b0b6af9a36d2e`. The later 034-REV2 QA section already records Owner overall PASS and checked Owner criteria; older historical checklist sections are not rewritten by this closeout.

## 10. Verification before staging

Run:

```powershell
git status --short
git diff --name-status
git diff --numstat
git -c core.whitespace=cr-at-eol diff --check
git diff -- .ai/current_state.md .ai/task_current.md .ai/handoff.md
```

Acceptance:

- modified files exactly:
  - `.ai/current_state.md`
  - `.ai/task_current.md`
  - `.ai/handoff.md`
- no `.ai/qa_checklist.md` change;
- no `.ai/task_specs/*` change;
- no application/test/dependency path change;
- diff is narrow semantic text only;
- helper output reports unchanged CRLF/LF counts for each file;
- temporary-whitespace `diff --check` is empty.

Also verify exact current text with `git grep -n` on the three docs. At minimum prove:

- `WAITING_PM_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`
- `Owner reported on 2026-08-07: task 34 đã oke`
- `Owner retest: PASS`
- `Owner: PASS`
- `Documentation: WAITING_PM_VERIFICATION`
- no current 034 malformed `\\task 34 đã oke` remains in the three docs.

If scope or semantics differ:

`STOP — FINALIZE-005 DIFF OUT OF CONTRACT`

## 11. Staging and hard gate

Stage exactly:

```powershell
git add .ai/current_state.md .ai/task_current.md .ai/handoff.md
```

Then run:

```powershell
git diff --cached --name-only
git diff --cached --numstat
git -c core.whitespace=cr-at-eol diff --cached --check
git diff --cached -- .ai/current_state.md .ai/task_current.md .ai/handoff.md
```

Expected changed-file set is exactly the three approved docs.

Unexpected large churn, hundreds of additions/deletions, or any other path:

`STOP — PUSH NOT AUTHORIZED`

## 12. Remote-move guard

Immediately before commit:

```powershell
git fetch origin
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Remote HEAD must still equal `EXECUTION_BASE_HEAD`.

If not:

`STOP — FINALIZE-005 BASE MOVED`

No rebase, merge, cherry-pick, reset, or retry.

## 13. Commit and push

Create exactly one docs-only commit:

```powershell
git commit -m "docs: finalize 034-REV2 owner PASS canonical state"
```

Push fast-forward only:

```powershell
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

After push:

```powershell
git fetch origin
git rev-parse HEAD
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
git status --short
```

Local HEAD and remote HEAD must match; final status must be empty.

Do not edit PR body. PM will verify GitHub and update PR/canonical gate state after this report.

## 14. Stop conditions

- `STOP — ACTIVE SPEC NOT AVAILABLE ON REMOTE`
- `STOP — ACTIVE SPEC MISMATCH`
- `STOP — ACTIVE SPEC TARGET MISSING`
- `STOP — FINALIZE-005 WORKTREE EXISTS`
- `STOP — FINALIZE-005 BASIS MISMATCH`
- `STOP — PM BYTE PATCH FAILED`
- `STOP — FINALIZE-005 DIFF OUT OF CONTRACT`
- `STOP — FINALIZE-005 BASE MOVED`
- `STOP — PUSH NOT AUTHORIZED`
- `STOP — COMMAND NOT AUTHORIZED`

On STOP: report evidence and end. No self-repair.

## 15. Required FINAL REPORT

Return:

- Active spec read directly from remote ref: YES/NO
- Task ID
- `EXECUTION_BASE_HEAD`
- Isolated worktree path
- Initial HEAD
- Initial `git status --short`
- Five preflight `git hash-object` outputs
- PM helper command exit code and full helper output
- Exact files modified
- `git diff --name-status`
- `git diff --numstat`
- `git -c core.whitespace=cr-at-eol diff --check`
- Relevant current text checks: PASS/FAIL
- Malformed current `\\task 34 đã oke` remaining: NONE/list
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

## 16. Merge permission

BLOCKED.

Owner verification remains PASS. This task only publishes deterministic canonical documentation corrections for PM verification.
