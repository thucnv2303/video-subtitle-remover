# PM Execution Spec

## 0. HARD EXECUTION CONTRACT

Task ID: `RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-PM-VERIFIED-CLOSEOUT-006-REV1`
Mode: `DETERMINISTIC BYTE-PRESERVING CANONICAL STATUS RECORDING`
Executor: Anti
Repository: `thucnv2303/video-subtitle-remover`
Review branch: `review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`
PR: `#14`
Reviewed application source SHA: `ea9521f6fe957e24e49cc5d090e275511d91141d`
Accepted documentation correction SHA: `7d2e108a3fe57b6cdbc55f31b966bb633894f772`

This task supersedes the stopped Closeout-006 execution. Do not execute Closeout-006 again.

ANTI MUST NOT EDIT CANONICAL TEXT MANUALLY.
ANTI MUST NOT INVENT A REPAIR COMMAND.
ANTI MUST ONLY RUN THE COMMANDS/COMMAND CLASSES AUTHORIZED BELOW.

On the first unexpected result, failed command, failed assertion, dirty path, moved remote head, or helper non-zero exit:

`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

## 1. PM verification basis

Project Manager directly verified GitHub commit `7d2e108a3fe57b6cdbc55f31b966bb633894f772` and accepted Finalize-005-REV1:

- correction commit exists on PR #14 review branch;
- it is exactly one commit after its execution basis;
- it changes only `.ai/current_state.md`, `.ai/task_current.md`, `.ai/handoff.md`;
- diff is narrow: current_state 6/6, handoff 2/2, task_current 1/1;
- current 034-REV2 canonical state agrees on automated PASS, code review PASS, Owner PASS and direct Owner evidence `task 34 đã oke`;
- `.ai/qa_checklist.md` was not changed by that correction and its 034-REV2 Owner section remains accepted;
- no application source/test/dependency path changed after reviewed source `ea9521...`.

Therefore PM documentation review is PASS. This task only records that PASS into the canonical dynamic files. Merge remains a separate PM decision.

## 2. Previous Closeout-006 stop and corrected design

Closeout-006 stopped safely before any write with:

`STOP — PM VERIFIED CLOSEOUT PRECONDITION FAILED: handoff next permitted action: expected 2 match(es), got 0`

Direct GitHub blob inspection shows the helper assumption was wrong:

- the two `Next permitted action` occurrences are not byte-identical two-line blocks;
- the handoff file contains mixed existing newline sequences around those current sections;
- the first occurrence contains the sentence plus `Merge remains BLOCKED.`;
- the second occurrence contains the sentence but does not contain that merge line inside the same section.

Closeout-006-REV1 therefore uses section-bound exact semantic replacements and does not depend on a shared CRLF two-line block.

Corrected PM helper:
`.ai/task_specs/tools/finalize_034_pm_verified_006_rev1.py`

Expected helper Git blob SHA:
`03ee3b482c7534fc424ecdf5f44aebc310848dda`

The helper validates all input blobs and every match before any write, then verifies CRLF and total LF counts are unchanged.

## 3. Remote-only authority

Run first:

```powershell
git fetch origin
```

Authority is only:

`origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032`

Read ACTIVE directly:

```powershell
git show "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032:.ai/task_specs/ACTIVE.md"
```

Confirm active task is exactly:

`RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2-PM-VERIFIED-CLOSEOUT-006-REV1`

Read this complete spec directly from the same remote ref with `git show`.

Capture:

```powershell
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
```

as `EXECUTION_BASE_HEAD`.

Local ACTIVE/spec/helper copies are not authority.

If ACTIVE/spec/helper cannot be read from the remote ref:
`STOP — REMOTE EXECUTION AUTHORITY UNAVAILABLE`

## 4. Source-preservation preflight

Verify reviewed source is an ancestor:

```powershell
git merge-base --is-ancestor "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"
```

Verify all paths after reviewed source:

```powershell
git diff --name-only "ea9521f6fe957e24e49cc5d090e275511d91141d" "$EXECUTION_BASE_HEAD"
```

Only `.ai/` paths may occur.

Any application source, tests, dependency/runtime path:
`STOP — REVIEWED SOURCE SUPERSEDED`

## 5. New isolated worktree

Do not use, edit, repair, clean, remove or publish from any previous Finalize/Closeout worktree.

Approved new worktree:

`E:\Project AI\_closeout\034-pm-verified-closeout-006-rev1`

Check:

```powershell
Test-Path "E:\Project AI\_closeout\034-pm-verified-closeout-006-rev1"
```

If it exists:
`STOP — CLOSEOUT REV1 WORKTREE EXISTS`

Create detached at `EXECUTION_BASE_HEAD`:

```powershell
git worktree add --detach "E:\Project AI\_closeout\034-pm-verified-closeout-006-rev1" "$EXECUTION_BASE_HEAD"
```

Then prove exact path, HEAD and clean `git status --short`.

## 6. Exact blob preconditions

In the new worktree run exactly:

```powershell
git hash-object .ai/current_state.md
git hash-object .ai/task_current.md
git hash-object .ai/handoff.md
git hash-object .ai/qa_checklist.md
git hash-object .ai/task_specs/tools/finalize_034_pm_verified_006_rev1.py
```

Expected:

- `.ai/current_state.md`: `33eff07b417340218f4a61e37b761b452289cc31`
- `.ai/task_current.md`: `e79abcc3a4022af835bc086c843688bdff6fc7f9`
- `.ai/handoff.md`: `d5f264d3b8cbcb0ea29d015d04e147b65cbaab09`
- `.ai/qa_checklist.md`: `54903913a2e5862297847e23328b0b6af9a36d2e`
- helper: `03ee3b482c7534fc424ecdf5f44aebc310848dda`

Any mismatch:
`STOP — CLOSEOUT REV1 BASIS MISMATCH`

## 7. Allowed mutation

Only the following canonical files may be modified:

- `.ai/current_state.md`
- `.ai/task_current.md`
- `.ai/handoff.md`

Read-only:

- `.ai/qa_checklist.md`
- `.ai/task_specs/*`
- helper

No source/tests/dependencies may change.

## 8. Run the PM helper exactly once

From the new worktree root run exactly:

```powershell
python .ai/task_specs/tools/finalize_034_pm_verified_006_rev1.py
```

Run it ONCE only.

If exit code != 0:
`STOP — PM VERIFIED CLOSEOUT REV1 HELPER FAILED`

Do not run again. Do not manually repair.

## 9. Required semantic result

After helper success, current canonical state must express:

### current_state.md
- top status: `COMPLETED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2`;
- source stays `ea9521f6fe957e24e49cc5d090e275511d91141d`;
- automated PASS;
- code review PASS;
- Owner PASS;
- Owner evidence remains `task 34 đã oke`;
- Documentation PASS;
- Merge BLOCKED.

### task_current.md
- Task ID remains 034-REV2;
- Status remains COMPLETED;
- source stays `ea9521...`;
- automated PASS;
- code review PASS;
- Owner PASS;
- both current Documentation synchronization entries become PASS;
- Merge remains BLOCKED.

### handoff.md
- last completed task becomes 034-REV2 PM VERIFIED;
- Active Task becomes 034-REV2 `(COMPLETED — PM VERIFIED)`;
- both current Next Permitted Action sections point to Project Manager final merge-readiness decision and do not request another Owner retest or Anti implementation for Task034;
- Documentation synchronization becomes PASS;
- Merge permission remains BLOCKED.

QA remains unchanged.

## 10. Pre-stage verification

Run:

```powershell
git status --short
git diff --name-status
git diff --numstat
git -c core.whitespace=cr-at-eol diff --check
```

Exactly the three allowed docs may differ. The diff must be narrow.

Required text checks:

```powershell
git grep -n "COMPLETED — RECOVERY-007E-PIPELINE1-AI-PROVIDER-MODEL-034-REV2" -- .ai/current_state.md
git grep -n "Documentation: PASS" -- .ai/current_state.md
git grep -n "Documentation synchronization: PASS" -- .ai/current_state.md .ai/task_current.md
git grep -n "COMPLETED — PM VERIFIED" -- .ai/handoff.md
git grep -n "final merge-readiness decision" -- .ai/handoff.md
git grep -n "## Documentation synchronization" -- .ai/handoff.md
git grep -n "PASS (direct Owner report on 2026-08-07: task 34 đã oke)" -- .ai/handoff.md
```

Also prove QA unchanged:

```powershell
git hash-object .ai/qa_checklist.md
```

must still equal `54903913a2e5862297847e23328b0b6af9a36d2e`.

Any mismatch:
`STOP — CLOSEOUT REV1 VERIFICATION FAILED`

## 11. Stage only explicit canonical docs

Run exactly:

```powershell
git add .ai/current_state.md .ai/task_current.md .ai/handoff.md
git diff --cached --name-only
git diff --cached --numstat
git -c core.whitespace=cr-at-eol diff --cached --check
```

Cached file set must be exactly the three allowed docs.

## 12. Remote-move guard

Before commit:

```powershell
git fetch origin
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
```

It must still equal `EXECUTION_BASE_HEAD`.

If not:
`STOP — CLOSEOUT REV1 BASE MOVED`

## 13. Commit and push

Create exactly one commit:

```powershell
git commit -m "docs: record PM-verified 034-REV2 closeout rev1"
```

Push fast-forward only:

```powershell
git push origin HEAD:review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032
```

No force push.

After push:

```powershell
git rev-parse HEAD
git fetch origin
git rev-parse "origin/review/RECOVERY-007E-PIPELINE1-RUNTIME-clean-fix-032"
git status --short
```

Local and remote HEAD must agree and status must be clean.

## 14. Forbidden operations

Forbidden:

- manual/editor modification of canonical docs;
- `Set-Content`, `Out-File`, formatter or ad-hoc rewrite scripts;
- any helper other than the exact REV1 helper;
- running the helper more than once;
- `git reset`, `git restore`, `git checkout`, `git clean`, `git revert`, rebase, amend;
- `git worktree remove`;
- touching prior failed worktrees;
- CRLF/LF conversion;
- modifying QA/spec/helper/source/tests/dependencies;
- `git add .` or `git add -A`;
- force push/history rewrite;
- Task035/036 work;
- merge.

If an unexpected result would require any forbidden action:
`STOP IMMEDIATELY — DO NOT SELF-REPAIR.`

## 15. Final report

Return:

- Active spec read directly from remote ref YES/NO
- Task ID
- EXECUTION_BASE_HEAD
- worktree path
- initial HEAD/status
- reviewed-source ancestry result
- post-source changed paths
- five preflight blob hashes
- helper exit code and full helper output
- exact modified files
- raw name-status/numstat/whitespace check
- required text-check outputs
- QA blob hash after helper
- cached name-only/numstat/whitespace result
- documentation commit SHA
- remote HEAD after push
- final status
- application source changed YES/NO
- tests changed YES/NO
- QA changed YES/NO
- forbidden command used YES/NO
- Documentation synchronization `WAITING_FINAL_PM_CONFIRMATION`
- Task035/036 started NO
- Merge BLOCKED

## 16. Merge permission

BLOCKED.

Only Project Manager may make the separate merge-readiness decision after verifying the published Closeout-006-REV1 commit on GitHub.
