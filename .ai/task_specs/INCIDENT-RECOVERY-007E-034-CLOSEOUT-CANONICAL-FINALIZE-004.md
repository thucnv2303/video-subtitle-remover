# PM Execution Spec

## Task
INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-004

## Status
AUTHORIZED_FOR_EXECUTION

## Mode
INCIDENT / ISOLATED CANONICAL DOCUMENT FINALIZATION

## Objective
Finalize the accepted Owner PASS for `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2` after correction task 003 produced a narrow cumulative GitHub diff but violated execution safety rules and left canonical current-state contradictions.

This task does NOT reopen application source/test review. It repairs only the remaining current canonical documentation inconsistencies and PR body state.

## Verified GitHub basis
Repository: `thucnv2303/video-subtitle-remover`

PR: `#14`

Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

PR base: `recovery/RECOVERY-007E-SOURCE-BASELINE-002-replacement`

Reviewed application source SHA:
`ea9521f6fe957e24e49cc5d090e275511d91141d`

Pre-bad documentation parent:
`461cebc65733f9407f1294174b8df38d52302e36`

Actual GitHub correction commit after task 003:
`c5376def7c79cd0df68b90da24a0ada52986d862`

The executor report incorrectly claimed:
`c5376defd100318de921bb02dcdccafc0ca9c0db`

That claimed SHA does not exist on GitHub and must not be used.

GitHub evidence already verifies:
- `374bdd8d9e883e19efa3f8c90315c2a475061305` is an ancestor of actual correction commit `c5376def7c79cd0df68b90da24a0ada52986d862`; therefore the prior `--force` invocation did not rewrite published history in practice, but use of `--force` was still a forbidden execution action.
- cumulative diff `461cebc65733f9407f1294174b8df38d52302e36..c5376def7c79cd0df68b90da24a0ada52986d862` is narrow for the four 034 closeout docs.
- no application source/test path changed after reviewed source SHA `ea9521f6...`; changes after that SHA are `.ai/` documentation/governance/evidence only.

Owner result remains:
PASS — direct Owner report on 2026-08-07: `task 34 đã oke`

## Why task 003 is not accepted as final documentation synchronization
Task 003 violated explicit safety rules by running forbidden state-rewriting commands including reset/restore/checkout operations, a CRLF/LF conversion command, and a force-push command. Its FINAL REPORT also stated a commit SHA that does not exist on GitHub and did not update PR #14 body as required.

In addition, direct GitHub inspection shows remaining canonical contradictions:

### `.ai/current_state.md`
Top current state still says:
`WAITING_OWNER_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`

The top current Active Task / PR block still says Owner retest WAITING and the top Verification Gates still say Owner WAITING / Documentation PASS.

A lower 034-REV2 block says Owner PASS / WAITING_PM_VERIFICATION. The top current section and lower current-task section therefore disagree.

### `.ai/task_current.md`
Current status/gates are mostly correct, but the direct Owner statement is malformed as `\task 34 đã oke` instead of the exact Owner statement.

### `.ai/handoff.md`
Current Owner manual verification is PASS and documentation is WAITING_PM_VERIFICATION, but the direct Owner statement is malformed as `\task 34 đã oke`, and the earlier current review-ancestry Owner observation still contains stale wording instead of the accepted direct result.

### `.ai/qa_checklist.md`
The 034-REV2 QA section is already acceptable and must remain unchanged unless GitHub changed after this spec was authored.

## Remote source-of-truth rule
Do not read execution authority from local working-tree copies.

First run:

```powershell
git fetch origin
```

Then read ACTIVE directly from the remote review ref:

```powershell
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/ACTIVE.md"
```

From that remote ACTIVE content, confirm it points exactly to this spec.

Then read this entire spec directly from the same remote ref:

```powershell
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/INCIDENT-RECOVERY-007E-034-CLOSEOUT-CANONICAL-FINALIZE-004.md"
```

Do not use `cat .ai/task_specs/ACTIVE.md` or a local spec copy as authority.

If remote ACTIVE is missing:
`STOP — ACTIVE SPEC NOT AVAILABLE ON REMOTE`

If remote ACTIVE does not point to this exact spec:
`STOP — ACTIVE SPEC MISMATCH`

If this spec is missing from the same remote ref:
`STOP — ACTIVE SPEC TARGET MISSING`

## Preflight
After reading remote ACTIVE and remote spec:

1. Capture exact remote review HEAD:

```powershell
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Call this `FINALIZE_BASE_HEAD`.

2. Verify `c5376def7c79cd0df68b90da24a0ada52986d862` is an ancestor of `FINALIZE_BASE_HEAD`.
3. Verify the delta from `c5376def7c79cd0df68b90da24a0ada52986d862` to `FINALIZE_BASE_HEAD` contains only PM task-spec / ACTIVE governance files. If any application source/test/dependency path appears, STOP with `STOP — REVIEWED SOURCE SUPERSEDED`.
4. Verify the new isolated path below does not already exist.

## Approved isolated worktree
Use exactly:

`E:\Project AI\_closeout\034-owner-pass-finalize-004`

Create one new detached worktree pinned to `FINALIZE_BASE_HEAD`:

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-owner-pass-finalize-004" FINALIZE_BASE_HEAD
Set-Location "E:\Project AI\_closeout\034-owner-pass-finalize-004"
$PWD.Path
git rev-parse HEAD
git status --short
```

Before editing:
- path must match exactly;
- HEAD must equal `FINALIZE_BASE_HEAD`;
- status must be empty.

Otherwise:
`STOP — FINALIZE WORKTREE NOT CLEAN`

Do not use or mutate these prior worktrees:
- `E:\Project AI\video-subtitle-remover-recovery021`
- `E:\Project AI\_closeout\034-owner-pass-recovery`
- `E:\Project AI\_closeout\034-owner-pass-churn-fix`
- `E:\Project AI\Video-sub-remove`

## Allowed repository files
Modify only if required:
1. `.ai/current_state.md`
2. `.ai/task_current.md`
3. `.ai/handoff.md`

Read but do not modify:
4. `.ai/qa_checklist.md`

No other repository file is authorized.

## Required canonical final content

### 1. `.ai/current_state.md`
Fix the CURRENT top 034-REV2 state so the top/current section agrees with the accepted Owner result and the existing lower 034-REV2 block.

Required top/current facts:
- `## Status` must no longer say `WAITING_OWNER_VERIFICATION`; use `WAITING_PM_VERIFICATION — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`.
- Active task remains `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`.
- PR remains `#14`.
- Branch remains `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`.
- Source SHA remains `ea9521f6fe957e24e49cc5d090e275511d91141d`.
- Current Owner observation must be the direct result: `Owner reported on 2026-08-07: task 34 đã oke` (plain text is acceptable; do not introduce shell escape characters).
- Current Owner retest/manual verification: PASS.
- Top Verification Gates: Automated PASS; Code review PASS; Owner PASS; Documentation `WAITING_PM_VERIFICATION`; Merge BLOCKED.
- In the lower current 034-REV2 block, fix malformed `\task 34 đã oke` to the exact plain-text Owner statement without changing unrelated historical content.
- Do not rewrite archived older-task WAITING/NOT STARTED statuses.

### 2. `.ai/task_current.md`
The current Task ID/status/source/gates are already mostly correct.

Required changes only:
- preserve Task ID 034-REV2, Status COMPLETED, source SHA, Automated PASS, Code review PASS, Owner manual verification PASS, Documentation WAITING_PM_VERIFICATION, Merge BLOCKED;
- fix malformed Owner statement `\task 34 đã oke` to exact plain text `task 34 đã oke`;
- do not change unrelated historical sections.

### 3. `.ai/handoff.md`
Required changes only:
- preserve active task `(WAITING_PM_VERIFICATION)`;
- preserve next action = Project Manager verifies documentation correction/finalization;
- preserve source SHA;
- current Owner manual app verification remains PASS;
- documentation synchronization remains WAITING_PM_VERIFICATION;
- merge remains BLOCKED;
- replace malformed `\task 34 đã oke` with exact plain text `task 34 đã oke`;
- update the current review-ancestry Owner observation from stale `phần UI vừa kiểm tra "đã xong"` wording to the accepted direct Owner result on 2026-08-07;
- do not rewrite unrelated historical task records.

### 4. `.ai/qa_checklist.md`
Verify only. The 034-REV2 section must still show Owner overall PASS and all three task-specific Owner items checked. Do not edit this file if already correct.

## Strict forbidden actions
Do NOT run any of the following in this task:
- `git reset` in any form;
- `git restore` in any form;
- `git checkout` in any form;
- `git clean`;
- `git rebase`;
- `git amend`;
- `git revert`;
- force push (`--force`, `--force-with-lease`, or equivalent);
- CRLF/LF conversion commands;
- scripts that rewrite whole canonical files;
- Python/Node/PowerShell loops over canonical markdown files;
- `Set-Content` or whole-file shell rewrites for canonical files;
- formatters/Prettier;
- broad patch scripts;
- `git add .`;
- `git add -A`;
- edits to `.ai/task_specs/ACTIVE.md` or PM task specs;
- application source/test changes;
- Task 035/036 activation;
- merge.

Use editor-level targeted changes only to the exact current lines specified above.

If a mistake is made that would normally require reset/restore/checkout/revert, STOP and report:
`STOP — SAFE CORRECTION CANNOT CONTINUE`

Do not self-repair with forbidden Git commands.

## Verification before staging
Run:

```powershell
git status --short
git diff --name-status
git diff --numstat
git diff --check
git diff -- .ai/current_state.md .ai/task_current.md .ai/handoff.md
```

Acceptance:
- only `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md` may be modified;
- `.ai/qa_checklist.md` remains unchanged;
- diff is narrow semantic text changes only;
- no line-ending churn;
- `git diff --check` empty.

Also show the current relevant sections from all four canonical files to prove agreement.

## Staging
Stage only the exact modified authorized paths by explicit names.

Then run:

```powershell
git diff --cached --name-only
git diff --cached --numstat
git diff --cached --check
```

## Remote-move guard
Before commit:

```powershell
git fetch origin
git rev-parse origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

Remote SHA must still equal `FINALIZE_BASE_HEAD`.

If different:
`STOP — FINALIZE BASE MOVED`

## Commit and push
Create exactly one documentation-only commit:

`docs: finalize 034-REV2 owner PASS canonical state`

Push fast-forward only:

```powershell
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

No force flags.

After push verify exact remote HEAD equals local HEAD and final working-tree status is clean.

## PR #14 body update
After successful fast-forward push, update PR #14 body, not merely a comment.

Required body facts:
- Owner Manual App Verification: PASS;
- Automated Verification: PASS;
- Code Review: PASS;
- correction task 003 actual GitHub commit: `c5376def7c79cd0df68b90da24a0ada52986d862`;
- task 003 execution result: INVALIDATED as final documentation-sync proof because forbidden commands were used and canonical contradictions remained;
- exact new finalization commit SHA;
- Documentation synchronization: `WAITING_PM_VERIFICATION`;
- Task 035/036: NOT AUTHORIZED;
- Merge: BLOCKED;
- Next action: Project Manager verifies final canonical contents and decides incident/task closeout.

Do not claim Documentation PASS or PM PASS.

## Stop conditions
- `STOP — ACTIVE SPEC NOT AVAILABLE ON REMOTE`
- `STOP — ACTIVE SPEC MISMATCH`
- `STOP — ACTIVE SPEC TARGET MISSING`
- `STOP — REVIEWED SOURCE SUPERSEDED`
- `STOP — FINALIZE WORKTREE NOT CLEAN`
- `STOP — FINALIZE SCOPE EXPANDED`
- `STOP — FINALIZE DIFF CHURN`
- `STOP — FINALIZE BASE MOVED`
- `STOP — SAFE CORRECTION CANNOT CONTINUE`
- `SPEC SCOPE INSUFFICIENT`

## Required FINAL REPORT
Return exactly:
- Active spec read from remote ref: YES/NO
- Task ID
- `FINALIZE_BASE_HEAD`
- Isolated worktree path
- Initial HEAD
- Initial `git status --short`
- Exact files modified
- `git diff --name-status`
- `git diff --numstat`
- `git diff --check`
- Relevant current sections from current_state/task_current/handoff/qa_checklist agree: YES/NO
- `git diff --cached --name-only`
- `git diff --cached --numstat`
- `git diff --cached --check`
- Documentation commit SHA
- Remote HEAD after push
- Final `git status --short`
- PR #14 body updated: YES/NO
- Application source changed: NONE
- Tests changed: NONE
- Documentation synchronization: WAITING_PM_VERIFICATION
- Task 035/036 started: NO
- Merge: BLOCKED
- Forbidden commands used during this task: NONE

## Merge permission
BLOCKED.

This task finalizes canonical documentation only. It does not authorize merge or the next product task.
